import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { db } from './server-db';
import { GoogleSheetsClient, cleanHeaderKey } from './server-sheets';
import { generateUniqueSlug, renderTemplate, extractTemplateFields } from './server-generator';
import { DeployManager } from './server-deployer';
import { ScreenshotService } from './server-puppeteer';

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Initialize Screenshots directory
ScreenshotService.init();

// Static handlers for assets and mockups screenshots
app.use('/screenshots', express.static(path.join(process.cwd(), 'screenshots')));

// Setup Gemini Server-side integration
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// AI Content Generation wrapper matching AIProvider architectural requirement
interface AIProvider {
  generateContent(businessName: string, city: string, services: string, fieldType: 'hero_tagline' | 'about_text'): Promise<string>;
}

class GeminiAIProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor(client: GoogleGenAI) {
    this.client = client;
  }

  async generateContent(businessName: string, city: string, services: string, fieldType: 'hero_tagline' | 'about_text'): Promise<string> {
    const isTagline = fieldType === 'hero_tagline';
    const tagPrompt = `Generate a short, snappy, high-converting slogan/hero tagline (maximum 8 words) for a business named "${businessName}" located in "${city}" offering services: "${services}". Return ONLY the message, no quotes.`;
    const aboutPrompt = `Write a professional, compelling, and friendly "About Us" paragraph (2 to 3 sentences, maximum 50 words) for a service business named "${businessName}" located in "${city}" specializing in "${services}". Return ONLY the paragraph.`;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: isTagline ? tagPrompt : aboutPrompt,
        config: {
          temperature: 0.7,
        }
      });
      return response.text?.trim().replace(/^["']|["']$/g, '') || '';
    } catch (err) {
      console.error('[Gemini AI Engine] Prompt failed, returning clean fallback.', err);
      return '';
    }
  }
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// 1. Projects APIs
app.get('/api/projects', (req, res) => {
  res.json(db.getProjects());
});

app.post('/api/projects', (req, res) => {
  const { name, spreadsheetId, range, templateId } = req.body;
  if (!name || !spreadsheetId || !range || !templateId) {
    return res.status(400).json({ error: 'Missing required configuration fields' });
  }
  const project = db.createProject({ name, spreadsheetId, range, templateId });
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const project = db.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  db.deleteProject(req.params.id);
  res.json({ success: true });
});

// 2. Templates APIs
app.get('/api/templates', (req, res) => {
  res.json(db.getTemplates());
});

app.post('/api/templates', (req, res) => {
  const { name, html } = req.body;
  if (!name || !html) {
    return res.status(400).json({ error: 'Name and HTML template structure are required' });
  }
  const fields = extractTemplateFields(html);
  const template = db.createTemplate(name, html, fields);
  res.status(201).json(template);
});

app.put('/api/templates/:id', (req, res) => {
  try {
    const { name, html } = req.body;
    const fields = html ? extractTemplateFields(html) : undefined;
    const template = db.updateTemplate(req.params.id, {
      ...(name && { name }),
      ...(html && { html, fields }),
    });
    res.json(template);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// 3. Settings APIs
app.get('/api/settings/deployment', (req, res) => {
  res.json(db.getDeploymentConfig());
});

app.post('/api/settings/deployment', (req, res) => {
  const settings = db.updateDeploymentConfig(req.body);
  res.json(settings);
});

app.get('/api/settings/ai', (req, res) => {
  res.json(db.getAIConfig());
});

app.post('/api/settings/ai', (req, res) => {
  const settings = db.updateAIConfig(req.body);
  res.json(settings);
});

// 4. Generated Pages Explorer APIs
app.get('/api/pages', (req, res) => {
  const { projectId } = req.query;
  res.json(db.getPages(projectId as string));
});

// 5. Jobs Progress and Executions APIs
app.get('/api/jobs', (req, res) => {
  const { projectId } = req.query;
  res.json(db.getJobs(projectId as string));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = db.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// Primary generation queue controller
app.post('/api/jobs/start', async (req, res) => {
  const { projectId, googleAccessToken } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  // Ensure access token is present
  const sheetsToken = googleAccessToken || req.headers['authorization']?.toString().replace(/^Bearer\s+/i, '');
  if (!sheetsToken) {
    return res.status(401).json({ error: 'Google Access Token is required to sync sheets data' });
  }

  const project = db.getProject(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const template = db.getTemplate(project.templateId);
  if (!template) return res.status(404).json({ error: 'Template not found for current project' });

  // 1. Read Sheets Rows Headers
  const sheetsClient = new GoogleSheetsClient(sheetsToken);
  let rawValues: string[][] = [];

  const isSandbox = sheetsToken === 'sandbox-demo-token-active-credentials';
  if (isSandbox) {
    rawValues = [
      ['Business Name', 'Phone', 'City', 'Services', 'Logo URL', 'Hero Tagline', 'About Text', 'Generated URL'],
      ['Dallas Premium Roofing', '555-0144', 'Dallas, TX', 'Commercial Roofing, Roof Shingle Repair, Leak Detection', 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=120&q=80', 'Master roofing technicians with storm damage warranty in Dallas.', 'Dallas Premium Roofing has served residential and commercial properties for over 15 years with premier shingle craftsmanship and emergency repair units.', ''],
      ['Austin TechSaaS Platforms', '555-0182', 'Austin, TX', 'Cloud Databases, Full-Stack App Dev, React Frontend', '', 'Accelerate your cloud modernization in Austin.', 'Our technical engineers provide scalable full-stack architectures, systems deployments, and robust database setups with absolute zero cold starts.', ''],
      ['Miami Shoreline Bistro', '555-0199', 'Miami, FL', 'Fine Dining, Ocean Specials, Luxury Catering', '', 'Ocean-front culinary craftsmanship in Miami.', 'Miami Shoreline Bistro is a family-owned coastal fine dining experience sourcing organic ocean harvests and seasonal pairings daily.', '']
    ];
  } else {
    try {
      rawValues = await sheetsClient.readSpreadsheetValues(project.spreadsheetId, project.range);
    } catch (err: any) {
      return res.status(500).json({ error: `Could not reach Google Sheets: ${err.message}` });
    }
  }

  if (rawValues.length <= 1) {
    return res.status(422).json({ error: 'Selected sheet is empty or contains no business rows beside headers' });
  }

  // 2. Parse data rows mapping and create background Job
  const { headers, rows } = sheetsClient.parseSpreadsheetValues(rawValues);
  const job = db.createJob(projectId, rows.length);

  // Expose immediate success to UI, run the loop as async task safely
  res.status(202).json({
    message: 'Generation job started in background',
    jobId: job.id,
    totalRows: rows.length
  });

  // Background Async thread execution
  (async () => {
    db.updateJob(job.id, { status: 'running' });
    db.addJobLog(job.id, `Job started processing in background queue for ${rows.length} records...`);

    const deployConfig = db.getDeploymentConfig();
    const aiConfig = db.getAIConfig();
    const gemini = getGeminiClient();
    const aiProvider = gemini && aiConfig.enabled ? new GeminiAIProvider(gemini) : null;

    if (aiProvider) {
      db.addJobLog(job.id, 'AI Text Enhancement Mode is ACTIVE. Model: gemini-3.5-flash');
    }

    // Determine writeback target columns
    const genUrlHeaderIdx = headers.findIndex((h) => cleanHeaderKey(h) === 'generated_url' || cleanHeaderKey(h) === 'live_url');
    const writebackColIdx = genUrlHeaderIdx !== -1 ? genUrlHeaderIdx : headers.length; // write to next free column
    const writebackColLetter = GoogleSheetsClient.getColumnLetter(writebackColIdx);

    const sheetNameMatch = project.range.match(/^(.*?)!/);
    const sheetPrefix = sheetNameMatch ? sheetNameMatch[1] : 'Sheet1';

    // Store spreadsheet values writeback matrix: array of updates
    const sheetUpdates: { range: string; values: string[][] }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const data = row.mappedData;
      const bName = data.business_name || data.business || data.name || `Row ${row.rowIndex}`;
      const city = data.city || 'Dallas';
      const services = data.services || data.service || 'General contracting';
      const phone = data.phone || data.telephone || '555-0100';

      db.addJobLog(job.id, `Processing row ${i + 1}/${rows.length}: "${bName}"`);

      try {
        // AI enhancements
        if (aiProvider) {
          if (!data.hero_tagline) {
            db.addJobLog(job.id, `🤖 Enhancing Headline for "${bName}" via Gemini...`);
            data.hero_tagline = await aiProvider.generateContent(bName, city, services, 'hero_tagline');
          }
          if (!data.about_text) {
            db.addJobLog(job.id, `🤖 Enhancing Description for "${bName}" via Gemini...`);
            data.about_text = await aiProvider.generateContent(bName, city, services, 'about_text');
          }
        }

        // Generate properties
        const slug = generateUniqueSlug(bName, projectId);
        const compiledHtml = renderTemplate(template.html, data);

        // Deploy page using selected setting provider
        const sitePath = path.join(process.cwd(), 'generated-sites', slug, 'index.html');
        const deployer = DeployManager.getProvider(deployConfig.provider, deployConfig);
        
        const deployResult = await deployer.deploy(slug, compiledHtml, sitePath);

        if (deployResult.status === 'failed') {
          throw new Error(deployResult.error || 'Deployment error');
        }

        // Capture screenshot of mockup canvas
        const screenshotUrl = await ScreenshotService.capturePage(slug, compiledHtml);

        // Store Page In Local DB
        db.createPage({
          projectId,
          jobId: job.id,
          businessName: bName,
          slug,
          generatedUrl: deployResult.url,
          screenshotUrl,
          status: 'deployed',
          data,
        });

        // Track writeback cell reference (e.g. Sheet1!F2 representing RowIndex 1 value writeback)
        // Values indices: Header is index 0. Row 1 data represents spreadsheet Row Index 2.
        // Therefore spreadsheet row matches row.rowIndex + 1 (representing spreadsheet standard cell structure)
        const cellRef = `${sheetPrefix}!${writebackColLetter}${row.rowIndex + 1}`;
        sheetUpdates.push({
          range: cellRef,
          values: [[deployResult.url]],
        });

        db.updateJob(job.id, {
          processedCount: i + 1,
        });

        db.addJobLog(job.id, `✓ Deployed page: ${deployResult.url}`);
      } catch (err: any) {
        db.addJobLog(job.id, `❌ Failed row ${i + 1}/${rows.length}: ${err.message}`);
        
        db.createPage({
          projectId,
          jobId: job.id,
          businessName: bName,
          slug: `failed-row-${row.rowIndex}`,
          generatedUrl: '',
          screenshotUrl: '',
          status: 'failed',
          errorMessage: err.message,
          data,
        });
      }
    }

    // 3. Bulk Write Mockup URLs back into Google Sheets in single batch
    if (sheetUpdates.length > 0) {
      db.addJobLog(job.id, `Writing back ${sheetUpdates.length} mockup links back to Sheets...`);
      if (isSandbox) {
        // Mock success write logs in sandbox run
        await new Promise(resolve => setTimeout(resolve, 600));
        db.addJobLog(job.id, '✓ [SANDBOX DEMO] Batch mockurl mapping written back to simulation results successfully.');
      } else {
        try {
          await sheetsClient.batchUpdateSpreadsheetValues(project.spreadsheetId, sheetUpdates);
          db.addJobLog(job.id, '✓ Batch update back to Sheets completed successfully.');
        } catch (err: any) {
          db.addJobLog(job.id, `[WARN] Failed writing generated URLs back to sheet: ${err.message}`);
        }
      }
    }

    // Finalize jobs state
    db.updateJob(job.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    db.addJobLog(job.id, `Job executions complete! Processed rows count: ${sheetUpdates.length}/${rows.length}`);
  })();
});

// Job failure retry endpoint
app.post('/api/jobs/:id/retry', async (req, res) => {
  res.status(200).json({ message: 'Retry simulation triggered' });
});

// Dynamic Render route to serve compiled HTML Mockups natively in iFrame or Tab
app.get('/mockups/:slug', (req, res) => {
  const page = db.getPageBySlug(req.params.slug);
  if (!page) {
    // Check if the physical file exists in generated-sites
    const physicalPath = path.join(process.cwd(), 'generated-sites', req.params.slug, 'index.html');
    if (fs.existsSync(physicalPath)) {
      return res.sendFile(physicalPath);
    }
    return res.status(404).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2>Mockup Page Not Found</h2>
        <p>The selected mockup slug "${req.params.slug}" was not generated or doesn't exist.</p>
        <a href="/" style="color: #10B981; text-decoration: none; font-weight: bold;">Go to Admin Dashboard</a>
      </div>
    `);
  }

  // Find associated template html to dynamically re-compile or return static path
  const project = db.getProject(page.projectId);
  if (!project) return res.status(404).send('Associated project no longer exists.');

  const template = db.getTemplate(project.templateId);
  if (!template) return res.status(404).send('Template no longer exists.');

  try {
    const rendered = renderTemplate(template.html, page.data);
    res.setHeader('Content-Type', 'text/html');
    res.send(rendered);
  } catch (err: any) {
    res.status(500).send(`Template compilation error during render: ${err.message}`);
  }
});


// ----------------------------------------------------
// VITE OR PRODUCTION SERVING MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] Server running on http://localhost:${PORT}`);
  });
}

startServer();
