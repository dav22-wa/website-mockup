import Handlebars from 'handlebars';
import { db } from './server-db';

// Extract unique Handlebars parameters from template string
export function extractTemplateFields(templateHtml: string): string[] {
  const variableRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const fields = new Set<string>();
  let match;
  while ((match = variableRegex.exec(templateHtml)) !== null) {
    fields.add(match[1]);
  }
  return Array.from(fields);
}

// Generate an SEO-friendly URL Slug with dynamic duplicate handling
export function generateUniqueSlug(businessName: string, projectId: string): string {
  // Convert to lowercase, replace accents, strip special chars, change spaces to hyphens
  let baseSlug = businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[^a-z0-9\s-]/g, '')    // remove all non-alphanumeric chars (except spaces & hyphens)
    .trim()
    .replace(/[\s-]+/g, '-');        // collapse spaces/hyphens keying into single hyphens

  if (!baseSlug) {
    baseSlug = 'untitled-business';
  }

  // Handle Collisions by checking against database
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = db.getPageBySlug(slug);
    if (!existing) {
      break; // Safe to use, no collision!
    }
    // If collision exists, try checking with counter suffix
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

// Compile template and replace fields using robust Handlebars setup
export function renderTemplate(templateHtml: string, data: Record<string, any>): string {
  // Pre-process services to look like clean list tags if there are comma-separated values
  const preparedData = { ...data };
  if (preparedData.services && typeof preparedData.services === 'string') {
    const servicesList = preparedData.services
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    if (servicesList.length > 1) {
      // Build actual list elements
      const listHtml = servicesList.map((s) => `<li>${s}</li>`).join('\n');
      preparedData.services_list_html = `<ul>\n${listHtml}\n</ul>`;
    }
  }

  const compiled = Handlebars.compile(templateHtml);
  return compiled(preparedData);
}
