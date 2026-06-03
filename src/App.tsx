import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Settings,
  Play,
  RefreshCw,
  FileCode,
  ExternalLink,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Cpu,
  Image as ImageIcon,
  Copy,
  Check,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Project, Template, GeneratedPage, GenerationJob, DeploymentConfig, AIContentConfig } from './types';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'templates' | 'settings'>('overview');

  // DB States
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Configurations
  const [deployConfig, setDeployConfig] = useState<DeploymentConfig>({ provider: 'mockups-server' });
  const [aiConfig, setAIConfig] = useState<AIContentConfig>({ enabled: false, model: 'gemini-3.5-flash' });

  // Creation/Edit States
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    spreadsheetId: '',
    range: 'Sheet1!A1:G10',
    templateId: '',
  });

  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{business_name}} | Mockup</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-stone-50 p-12 text-zinc-800">
  <div class="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
    <h1 class="text-3xl font-bold tracking-tight text-emerald-800 mb-2">{{business_name}}</h1>
    <p class="text-zinc-500 font-mono text-sm mb-4">Located in {{city}} | Call {{phone}}</p>
    <div class="border-t border-stone-100 pt-4 mb-4">
      <h3 class="font-bold mb-1">Our Specialties:</h3>
      <p class="text-zinc-650">{{services}}</p>
    </div>
    <div class="bg-stone-50 p-4 rounded-lg text-xs italic text-stone-500">
      {{hero_tagline}}
    </div>
  </div>
</body>
</html>`,
  });

  // Access Token and Playground Simulations
  const [googleToken, setGoogleToken] = useState('');
  const [activeIframeUrl, setActiveIframeUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  
  // Active job polling
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const terminalLogsEndRef = useRef<HTMLDivElement>(null);

  // Status & Notification helpers
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'ref' | 'error'; text: string } | null>(null);

  // Fetch initial datasets from state endpoints
  const fetchData = async () => {
    try {
      const [resProj, resTpl, resPages, resJobs, resDeploy, resAi] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/templates'),
        fetch('/api/pages'),
        fetch('/api/jobs'),
        fetch('/api/settings/deployment'),
        fetch('/api/settings/ai'),
      ]);

      const [proj, tpl, pgs, jbs, dep, ai] = await Promise.all([
        resProj.json(),
        resTpl.json(),
        resPages.json(),
        resJobs.json(),
        resDeploy.json(),
        resAi.json(),
      ]);

      setProjects(proj);
      setTemplates(tpl);
      setPages(pgs);
      setJobs(jbs);
      setDeployConfig(dep);
      setAIConfig(ai);

      if (proj.length > 0 && !selectedProjectId) {
        setSelectedProjectId(proj[0].id);
      }
    } catch (err) {
      console.error('Failed to load API databases:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      // Periodic background poller
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll active ongoing jobs separately for fast UI updates
  useEffect(() => {
    if (!activeJob) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${activeJob.id}`);
        if (res.ok) {
          const updatedJob = await res.json();
          setActiveJob(updatedJob);
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            await fetchData();
            triggerNotification('success', `Job ${updatedJob.id} complete! Mockups generated successfully.`);
            setActiveJob(null);
          }
        }
      } catch (err) {
        console.error('Error polling active job:', err);
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [activeJob]);

  // Handle scroll to end of logger terminal
  useEffect(() => {
    if (activeJob && terminalLogsEndRef.current) {
      terminalLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeJob?.logs]);

  const triggerNotification = (type: 'success' | 'ref' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  // Create Project handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.spreadsheetId || !newProject.templateId) {
      triggerNotification('error', 'Please complete all project variables fields.');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        const proj = await res.json();
        triggerNotification('success', `Mockup Project "${proj.name}" configured!`);
        setShowAddProject(false);
        setNewProject({ name: '', spreadsheetId: '', range: 'Sheet1!A1:G10', templateId: '' });
        fetchData();
        setSelectedProjectId(proj.id);
      } else {
        const err = await res.json();
        triggerNotification('error', err.error || 'Failed to save project.');
      }
    } catch (err) {
      triggerNotification('error', 'Connection to database failure.');
    }
  };

  // Create Template handler
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.name || !newTemplate.html) {
      triggerNotification('error', 'Template name and markup cannot be empty.');
      return;
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      if (res.ok) {
        const tpl = await res.json();
        triggerNotification('success', `HTML Template "${tpl.name}" successfully compiled!`);
        setShowAddTemplate(false);
        setNewTemplate({ name: '', html: '' });
        fetchData();
      } else {
        triggerNotification('error', 'Could not compile template.');
      }
    } catch (err) {
      triggerNotification('error', 'Database connection schema error.');
    }
  };

  // Delete Project helper
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated generated mockup pages and history will be cleared.')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification('success', 'Project removed from system.');
        fetchData();
        if (selectedProjectId === id) setSelectedProjectId('');
      }
    } catch (_) {}
  };

  // Start Generation Job (Queue triggers)
  const handleStartGeneration = async (isSandboxDemo = false) => {
    if (!selectedProjectId) {
      triggerNotification('error', 'Please select or create a Project to generate.');
      return;
    }

    // Capture OAuth access token or mock token for sandbox runs
    let tokenToUse = googleToken.trim();
    
    if (isSandboxDemo) {
      tokenToUse = 'sandbox-demo-token-active-credentials';
      triggerNotification('success', 'Sandbox playground mode active. Feeding local high-fidelity demonstration rows...');
    } else if (!tokenToUse) {
      // Auto-prompt OAuth scope alert
      triggerNotification('error', 'Please authorize Google Sheets first or paste Google API OAuth Access Token in Settings.');
      return;
    }

    try {
      const res = await fetch('/api/jobs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          googleAccessToken: tokenToUse,
        }),
      });

      if (res.status === 251 || res.status === 202 || res.ok) {
        const data = await res.json();
        triggerNotification('success', `Mockup generation jobs queued successfully! Job ID: ${data.jobId}`);
        // Poll this job state
        setActiveJob({
          id: data.jobId,
          projectId: selectedProjectId,
          status: 'pending',
          processedCount: 0,
          totalCount: data.totalRows,
          startedAt: new Date().toISOString(),
          logs: [],
        });
        setActiveTab('jobs');
      } else {
        const err = await res.json();
        triggerNotification('error', err.error || 'Check Google Sheet variables and try again.');
      }
    } catch (err) {
      triggerNotification('error', 'Failed to connect backend generation server.');
    }
  };

  // Quick Seed Playground Demo Helper for immediate visual feedback of entire app
  const handleQuickSeedDemo = async () => {
    try {
      // 1. Create a dummy template if not available
      let targetTemplateId = templates.length > 0 ? templates[0].id : 'tpl-1-services';
      
      // 2. Create the dummy project
      const demoProj = {
        name: '🏡 Premier Home Mockups Sandbox',
        spreadsheetId: '1zK9W7XyR5demo-sheet-id-for-mockup-generator',
        range: 'Sheet1!A1:G4',
        templateId: targetTemplateId,
      };

      const resProj = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoProj),
      });

      if (resProj.ok) {
        const dataProj = await resProj.json();
        setSelectedProjectId(dataProj.id);
        triggerNotification('success', 'Sandbox Project Configured! Running generator...');
        // Execute generator in Sandbox Mode (this bypasses Google Sheets server checks dynamically by passing sandbox-demo-token-active-credentials)
        // Express backend will intercept this token and mock values to trigger standard HTML pages compilation dynamically!
        setTimeout(() => handleStartGeneration(true), 500);
      }
    } catch (err) {
      triggerNotification('error', 'Sandbox creation encountered an issue.');
    }
  };

  // Save Settings toggling
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resDep = await fetch('/api/settings/deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployConfig),
      });
      
      const resAi = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      });

      if (resDep.ok && resAi.ok) {
        triggerNotification('success', 'Vercel/Netlify Deployment and Google AI rules saved.');
      } else {
        triggerNotification('error', 'Failed saving settings configuration.');
      }
    } catch (_) {}
  };

  // Copy helper
  const handleCopySlug = (slug: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Pre-compiled preview variables for Handlesbars visual compiler
  const sampleDataPreview = {
    business_name: 'Starlight Roofing & Gutters',
    phone: '555-404-5821',
    city: 'Seattle, WA',
    logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=120&q=80',
    services: 'Roof Inspections, Shingle Repairs, Seamless Gutters Installation, Leak Prevention',
    hero_tagline: 'Defend Your Home Against the Stormiest Northwest Skies',
    about_text: 'Serving Seattle with unmatched master craftsmanship and 100% weather-resistant materials since 2011. Elite local reliability.'
  };

  const filteredPages = pages.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.businessName.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term) ||
      p.generatedUrl.toLowerCase().includes(term)
    );
  });

  const selectedProjObj = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#FAF9F6] text-zinc-800 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Alert Messaging Toast */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 font-medium text-sm
              ${alertMsg.type === 'success' ? 'bg-emerald-900 text-emerald-100 border border-emerald-850' : ''}
              ${alertMsg.type === 'ref' ? 'bg-indigo-900 text-indigo-100 border border-indigo-850' : ''}
              ${alertMsg.type === 'error' ? 'bg-rose-950 text-rose-100 border border-rose-900' : ''}
            `}
          >
            {alertMsg.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {alertMsg.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span>{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Layout Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
              <Layers className="w-5 h-5" id="app-logo-icon" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                Website Mockup Generator
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  AGENCY STANDARD
                </span>
              </h1>
              <p className="text-xs text-neutral-500 font-medium font-sans">Automated landing page rendering pipeline from Google Sheets rows</p>
            </div>
          </div>

          {/* Quick Sandbox Demo trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleQuickSeedDemo}
              className="bg-zinc-900 text-stone-100 hover:bg-zinc-800 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide uppercase transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Instant Sandbox Simulation
            </button>
          </div>
        </div>
      </header>

      {/* Hero Setup Bar */}
      <div className="bg-white border-b border-zinc-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Active project selector */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-xs uppercase font-mono text-neutral-400 font-bold tracking-wider">Active Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white font-medium border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500 text-zinc-800 shrink-0"
            >
              <option value="">-- Choose Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowAddProject(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>

          {/* Control trigger */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <input
              type="text"
              placeholder="Paste Google OAuth Token..."
              value={googleToken}
              onChange={(e) => setGoogleToken(e.target.value)}
              className="bg-white text-xs border border-zinc-200 rounded-xl px-3 py-2.5 w-52 focus:outline-emerald-500 font-mono text-zinc-650"
            />
            <button
              onClick={() => handleStartGeneration(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-emerald-900/10 active:scale-95 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Generate Mockups
            </button>
          </div>

        </div>
      </div>

      {/* Main Core View Area */}
      <main className="grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-2 space-y-2">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 border-b border-zinc-200 lg:border-b-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all shrink-0
                ${activeTab === 'overview' ? 'bg-white border border-zinc-200 text-emerald-800 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}
              `}
            >
              <Layers className="w-4 h-4 shrink-0" />
              Pages Explorer
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all shrink-0
                ${activeTab === 'jobs' ? 'bg-white border border-zinc-200 text-emerald-800 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}
              `}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              Jobs & Console
              {activeJob && (
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0 ml-auto"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all shrink-0
                ${activeTab === 'templates' ? 'bg-white border border-zinc-200 text-emerald-800 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}
              `}
            >
              <FileCode className="w-4 h-4 shrink-0" />
              HTML Templates
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all shrink-0
                ${activeTab === 'settings' ? 'bg-white border border-zinc-200 text-emerald-800 font-bold shadow-xs' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}
              `}
            >
              <Settings className="w-4 h-4 shrink-0" />
              Settings
            </button>
          </nav>

          <div className="hidden lg:block bg-stone-100/60 p-4 rounded-xl border border-stone-200/50 mt-8 space-y-3">
            <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-neutral-400">Sheet Mapping Guidelines</h4>
            <ul className="text-xs text-neutral-500 space-y-1 font-sans">
              <li>Header row must contain labels mapping to your design keys like:</li>
              <li className="font-mono text-[10px] mt-1 text-emerald-700 bg-emerald-50 p-1.5 rounded-md">
                Business Name, Phone, City, Services, Logo URL, Tagline, About
              </li>
              <li className="mt-2 text-zinc-400">URLs generated will write back dynamically.</li>
            </ul>
          </div>
        </div>

        {/* Dynamic Panel Content */}
        <div className="lg:col-span-12 lg:ml-[16.6666%] xl:ml-0 lg:col-start-3 lg:-ml-0">
          <div className="bg-white min-h-[500px] rounded-2xl border border-zinc-200 shadow-xs p-6">
            <AnimatePresence mode="wait">
              
              {/* Tab 1: Pages Overview Explorer */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Mockup Pages Catalog</h2>
                      <p className="text-xs text-neutral-500">Live preview database of dynamic landing page mockups generated for client pipelines</p>
                    </div>
                    
                    {/* Search filter panel */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search pages, cities, or slugs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-[#FAF9F6] border border-zinc-200 text-xs rounded-xl pl-9 pr-4 py-2.5 w-64 focus:outline-emerald-500"
                        />
                      </div>
                      <button
                        onClick={fetchData}
                        className="bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 p-2.5 rounded-xl transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric widgets */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#FAF9F6] p-4 rounded-xl border border-zinc-200/60">
                      <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">{pages.length}</div>
                      <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-500 mt-1">Mockups Built</div>
                    </div>
                    <div className="bg-[#FAF9F6] p-4 rounded-xl border border-zinc-200/60">
                      <div className="text-2xl font-bold font-mono tracking-tight text-emerald-800">{pages.filter(p => p.status === 'deployed').length}</div>
                      <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-700 mt-1">Live Deployed</div>
                    </div>
                    <div className="bg-[#FAF9F6] p-4 rounded-xl border border-zinc-200/60">
                      <div className="text-2xl font-bold font-mono tracking-tight text-rose-800">{pages.filter(p => p.status === 'failed').length}</div>
                      <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-700 mt-1">Skipped/Failed</div>
                    </div>
                    <div className="bg-[#FAF9F6] p-4 rounded-xl border border-zinc-200/60">
                      <div className="text-2xl font-semibold font-mono tracking-tight text-[#632912]">{deployConfig.provider.toUpperCase()}</div>
                      <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-500 mt-1">Active Provider</div>
                    </div>
                  </div>

                  {/* Main Grid split: table checklist vs iframe interactive visual preview */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
                    
                    {/* Catalog list */}
                    <div className="xl:col-span-7 space-y-3">
                      {filteredPages.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-zinc-250 rounded-2xl bg-stone-50/50">
                          <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                          <h3 className="text-sm font-bold text-neutral-400">No mockups available</h3>
                          <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-2">Choose or create a project, map standard variables, and hit Deploy to generate websites instantly.</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden border border-zinc-200/85 rounded-xl bg-white max-h-[550px] overflow-y-auto">
                          <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                            <thead className="bg-[#FAF9F6] font-mono font-bold uppercase text-[10px] text-zinc-600 tracking-wider">
                              <tr>
                                <th colSpan={1} className="py-3 px-4">Business Info</th>
                                <th colSpan={1} className="py-3 px-4">Status</th>
                                <th colSpan={1} className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {filteredPages.map((page) => (
                                <tr
                                  key={page.id}
                                  onClick={() => {
                                    if (page.generatedUrl) setActiveIframeUrl(page.generatedUrl);
                                  }}
                                  className={`hover:bg-amber-50/20 cursor-pointer transition
                                    ${activeIframeUrl === page.generatedUrl ? 'bg-emerald-50/15' : ''}
                                  `}
                                >
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-neutral-900 text-sm max-w-[200px] truncate">{page.businessName}</div>
                                    <div className="text-[10px] text-neutral-400 font-mono tracking-tight mt-0.5">slug: {page.slug}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight font-sans uppercase border
                                      ${page.status === 'deployed' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-rose-50 text-rose-800 border-rose-250'}
                                    `}>
                                      {page.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1.5 justify-end">
                                      <button
                                        onClick={() => page.generatedUrl && setActiveIframeUrl(page.generatedUrl)}
                                        className="bg-stone-100 hover:bg-stone-200 text-zinc-700 p-2 rounded-lg transition"
                                        title="View Preview Frame"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleCopySlug(page.slug, page.generatedUrl)}
                                        className="bg-stone-100 hover:bg-stone-200 text-zinc-700 p-2 rounded-lg transition-all"
                                        title="Copy URL"
                                      >
                                        {copiedSlug === page.slug ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                      {page.generatedUrl && (
                                        <a
                                          href={page.generatedUrl}
                                          target="_blank"
                                          rel="referrer"
                                          className="bg-stone-100 hover:bg-emerald-100 hover:text-emerald-800 text-zinc-700 p-2 rounded-lg transition"
                                          title="Open Live Preview in New Tab"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Integrated Frame previewer or Visual screenshot previewer */}
                    <div className="xl:col-span-5 flex flex-col h-[550px] border border-zinc-200/85 rounded-xl bg-[#FAF9F6] overflow-hidden">
                      <div className="bg-white border-b border-zinc-200 p-3.5 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 tracking-wider font-bold">MOCK WEB PREVIEW</span>
                        <span className="w-4"></span>
                      </div>

                      {activeIframeUrl ? (
                        <div className="grow relative">
                          <iframe
                            src={activeIframeUrl}
                            className="absolute inset-0 w-full h-full bg-white"
                            title="Mockup Preview Frame"
                          />
                        </div>
                      ) : (
                        <div className="grow flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                          <ImageIcon className="w-12 h-12 text-zinc-300 mb-3" />
                          <h4 className="text-sm font-bold text-neutral-500">No active card preview</h4>
                          <p className="text-xs text-neutral-400 max-w-xs mt-1">Select any cell column or click the "Eye" icon to mount live preview canvas.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}

              {/* Tab 2: Queue Console & Active Jobs */}
              {activeTab === 'jobs' && (
                <motion.div
                  key="jobs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-zinc-100 pb-4">
                    <h2 className="text-lg font-bold tracking-tight">Active Engine Console</h2>
                    <p className="text-xs text-neutral-500">Monitor batch queuing, progress, and real-time generation terminal outputs</p>
                  </div>

                  {activeJob ? (
                    <div className="space-y-6">
                      
                      {/* Active queue widgets status */}
                      <div className="bg-zinc-900 text-stone-100 p-5 rounded-2xl border border-zinc-800 shadow-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Processing Job: {activeJob.id}</span>
                          </div>
                          <span className="text-xs font-mono bg-zinc-800 text-stone-300 px-3 py-1 rounded">
                            {activeJob.processedCount} / {activeJob.totalCount} completed
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                              style={{ width: `${(activeJob.processedCount / activeJob.totalCount) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                            <span>Pending rows deploy: {activeJob.totalCount - activeJob.processedCount}</span>
                            <span>{Math.round((activeJob.processedCount / activeJob.totalCount) * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Code Execution Log Console */}
                      <div className="space-y-2">
                        <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-neutral-400">Diagnostic Log output:</h4>
                        <div className="bg-[#0f172a] text-emerald-400 font-mono text-xs p-5 rounded-2xl h-[320px] overflow-y-auto space-y-2 border border-zinc-800 shadow-inner">
                          {activeJob.logs.map((log, idx) => (
                            <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                              {log}
                            </div>
                          ))}
                          <div ref={terminalLogsEndRef} />
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center py-16 border-2 border-dashed border-zinc-250 rounded-2xl bg-stone-50/50">
                        <Cpu className="w-8 h-8 text-neutral-300 mx-auto mb-3 animate-pulse" />
                        <h3 className="text-sm font-bold text-neutral-500">No active engines running</h3>
                        <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-2">Trigger mockup generations from the top control panel. View detailed terminal logs and spreadsheet feedback metrics here automatically.</p>
                      </div>

                      {/* Display Job Execution Log list */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-zinc-400">Historical Jobs History</h3>
                        <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
                          {jobs.length === 0 ? (
                            <div className="p-4 text-center text-zinc-400 font-mono">Terminal Empty</div>
                          ) : (
                            <div className="divide-y divide-zinc-100 bg-white">
                              {jobs.map((job) => (
                                <div key={job.id} className="p-4 flex justify-between items-center hover:bg-stone-50/50 transition">
                                  <div>
                                    <div className="font-bold text-neutral-900 font-mono">JOB ID: {job.id}</div>
                                    <div className="text-[10px] text-zinc-400 mt-1">Started at: {new Date(job.startedAt).toLocaleString()}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-mono text-zinc-500 text-[11px]">Rows: {job.processedCount}/{job.totalCount}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight
                                      ${job.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
                                    `}>
                                      {job.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 3: Templates Manager */}
              {activeTab === 'templates' && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Handlebars HTML Templates</h2>
                      <p className="text-xs text-neutral-500">Coordinate mockup presets or author a custom layout using CDN-Tailwind styles</p>
                    </div>

                    <button
                      onClick={() => setShowAddTemplate(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Template
                    </button>
                  </div>

                  {/* HTML Templates Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {templates.map((tpl) => (
                      <div key={tpl.id} className="border border-zinc-200/80 bg-white rounded-xl p-5 hover:border-emerald-500 hover:shadow-md transition flex flex-col justify-between">
                        <div>
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4 font-mono text-xs border border-emerald-200">
                            &lt;&gt;
                          </div>
                          <h3 className="font-bold text-sm text-neutral-900 mb-2">{tpl.name}</h3>
                          <div className="text-[10px] text-zinc-400 font-mono">id: {tpl.id}</div>
                          
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {tpl.fields.map((f, idx) => (
                              <span key={idx} className="bg-stone-100 text-[9px] text-zinc-500 font-mono rounded px-1.5 py-0.5 border border-stone-200/30">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-5 border-t border-stone-150/40 mt-5 flex justify-end">
                          <button
                            onClick={() => {
                              // Mount instant dynamic template code pre-filled with demo values
                              setActiveIframeUrl(`/mockups/tpl-preset-test?preview_id=${tpl.id}`);
                              triggerNotification('success', `Simulating placeholder variables rendering template: ${tpl.name}`);
                              setActiveTab('overview');
                            }}
                            className="bg-stone-50 hover:bg-emerald-50 text-xs font-semibold hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 px-3.5 py-2 rounded-lg transition text-center"
                          >
                            Interactive Try-out
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tab 4: System Configuration Settings */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="border-b border-zinc-100 pb-4">
                    <h2 className="text-lg font-bold tracking-tight">Configurations & Settings</h2>
                    <p className="text-xs text-neutral-500">Manage deployment APIs credentials, Google Sheets access tokens, and AI support parameters</p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                    
                    {/* Providers select */}
                    <div className="bg-[#FAF9F6] p-5 rounded-xl border border-zinc-200/60 space-y-4">
                      <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-neutral-400 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        Deployment Provider Block
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-500">Hosting Environment:</label>
                          <select
                            value={deployConfig.provider}
                            onChange={(e) => setDeployConfig({ ...deployConfig, provider: e.target.value as any })}
                            className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm w-full focus:outline-emerald-500 text-zinc-800"
                          >
                            <option value="mockups-server">Local Mockups Server (Dynamic / instant previews)</option>
                            <option value="vercel">Vercel Production Pipelines</option>
                            <option value="netlify">Netlify Static Servers</option>
                            <option value="aws-s3">AWS S3 + CloudFront Storage</option>
                          </select>
                        </div>
                      </div>

                      {/* Display token slots based on provider choice */}
                      {deployConfig.provider === 'vercel' && (
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-600">Vercel API Token:</label>
                            <input
                              type="password"
                              placeholder="sk_vercel_example..."
                              value={deployConfig.vercelToken || ''}
                              onChange={(e) => setDeployConfig({ ...deployConfig, vercelToken: e.target.value })}
                              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs w-full focus:outline-emerald-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-600 font-sans">Vercel Project ID:</label>
                            <input
                              type="text"
                              placeholder="proj_mockups_abc..."
                              value={deployConfig.vercelProjectId || ''}
                              onChange={(e) => setDeployConfig({ ...deployConfig, vercelProjectId: e.target.value })}
                              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs w-full focus:outline-emerald-500 font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {deployConfig.provider === 'netlify' && (
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-600">Netlify API Token:</label>
                            <input
                              type="password"
                              placeholder="nfp_example..."
                              value={deployConfig.netlifyToken || ''}
                              onChange={(e) => setDeployConfig({ ...deployConfig, netlifyToken: e.target.value })}
                              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs w-full focus:outline-emerald-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-600">Netlify Site ID:</label>
                            <input
                              type="text"
                              placeholder="site_guid_example..."
                              value={deployConfig.netlifySiteId || ''}
                              onChange={(e) => setDeployConfig({ ...deployConfig, netlifySiteId: e.target.value })}
                              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs w-full focus:outline-emerald-500 font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {deployConfig.provider === 'aws-s3' && (
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-600">AWS S3 Bucket Name:</label>
                            <input
                              type="text"
                              value={deployConfig.awsBucketName || ''}
                              onChange={(e) => setDeployConfig({ ...deployConfig, awsBucketName: e.target.value })}
                              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs w-full focus:outline-emerald-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-600 font-sans">AWS S3 Region:</label>
                            <input
                              type="text"
                              value={deployConfig.awsRegion || 'us-east-1'}
                              onChange={(e) => setDeployConfig({ ...deployConfig, awsRegion: e.target.value })}
                              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs w-full focus:outline-emerald-500 font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Google Gemini AI enhance panel */}
                    <div className="bg-[#FAF9F6] p-5 rounded-xl border border-zinc-200/60 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-neutral-400 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          AI Copywriter enhancement (Optional)
                        </h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aiConfig.enabled}
                            onChange={(e) => setAIConfig({ ...aiConfig, enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      {aiConfig.enabled && (
                        <div className="space-y-2 text-xs text-neutral-500 bg-white p-4 rounded-xl border border-zinc-150 relative">
                          <p className="font-semibold text-zinc-700">When active, if spreadsheet column taglines or description cells are missing:</p>
                          <ul className="list-disc pl-4 space-y-1 mt-1 leading-relaxed">
                            <li>The generator invokes the <strong>gemini-3.5-flash</strong> model.</li>
                            <li>It analyzes the business name, city, and services rows.</li>
                            <li>It generates beautiful bespoke headlines & about texts and substitutes them in the HTML markup in real-time!</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-stone-100 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
                    >
                      Save Configuration
                    </button>

                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-zinc-500 font-medium">
          <div>&copy; 2026 Website Mockup System. All rights reserved. Built as a Senior Architect System.</div>
          <div className="flex gap-4 mt-4 md:mt-0 font-mono text-[10px]">
            <span>STATIONS: ACTIVE</span>
            <span>PORT: 3000</span>
          </div>
        </div>
      </footer>

      {/* ----------------------------------------------------
          MODALS / OVERLAYS
      ---------------------------------------------------- */}
      
      {/* 1. Modal: Create Project */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-stone-200 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-neutral-900">New Mockups Project</h3>
              <button onClick={() => setShowAddProject(false)} className="text-zinc-400 hover:text-zinc-650 font-bold font-sans text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-600">Project Descriptive Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roofing Agency Dallas"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="bg-[#FAF9F6] border border-zinc-200 rounded-xl px-3 py-2 w-full focus:outline-emerald-500 text-sm font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-600">Google Sheets ID:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1X8yZ... (extracted from sheets URL)"
                  value={newProject.spreadsheetId}
                  onChange={(e) => setNewProject({ ...newProject, spreadsheetId: e.target.value })}
                  className="bg-[#FAF9F6] border border-zinc-200 rounded-xl px-3 py-2 w-full focus:outline-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-600">Spreadsheet Read Range:</label>
                <input
                  type="text"
                  required
                  value={newProject.range}
                  onChange={(e) => setNewProject({ ...newProject, range: e.target.value })}
                  className="bg-[#FAF9F6] border border-zinc-200 rounded-xl px-3 py-2 w-full focus:outline-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-600 font-sans">Associated HTML Template Block:</label>
                <select
                  required
                  value={newProject.templateId}
                  onChange={(e) => setNewProject({ ...newProject, templateId: e.target.value })}
                  className="bg-[#FAF9F6] border border-zinc-200 rounded-xl px-3 py-2 w-full focus:outline-emerald-500 text-sm"
                >
                  <option value="">-- Choose Template --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="bg-stone-50 hover:bg-stone-100 border border-stone-250 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-stone-100 py-2.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider transition"
                >
                  Save Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Modal: Create Template */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full border border-stone-200 flex flex-col h-[85vh] gap-4"
          >
            <div className="flex justify-between items-center border-b border-stone-100 pb-3 shrink-0">
              <h3 className="font-bold text-lg text-neutral-900">New Handlebars Template Builder</h3>
              <button onClick={() => setShowAddTemplate(false)} className="text-zinc-400 hover:text-zinc-650 font-bold font-sans text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateTemplate} className="grow flex flex-col gap-4 overflow-hidden">
              <div className="space-y-1 shrink-0">
                <label className="text-xs font-semibold text-neutral-600">Template Descriptor Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Premium Landscaping Layout"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="bg-[#FAF9F6] border border-zinc-200 rounded-xl px-3 py-2 w-full focus:outline-emerald-500 text-xs text-neutral-800"
                />
              </div>

              {/* Side-by-Side Builder Layout */}
              <div className="grow grid md:grid-cols-2 gap-4 overflow-hidden">
                
                {/* Editor Left */}
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <label className="text-xs font-semibold text-zinc-500 font-mono">HTML Template (Handlebars matching keys):</label>
                  <textarea
                    required
                    value={newTemplate.html}
                    onChange={(e) => setNewTemplate({ ...newTemplate, html: e.target.value })}
                    className="grow font-mono text-[11px] bg-[#0f172a] text-zinc-300 p-4 rounded-xl border border-zinc-800 focus:outline-emerald-500 outline-none leading-relaxed overflow-y-auto"
                  />
                </div>

                {/* Simulated Viewer Browser Right */}
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <label className="text-xs font-semibold text-zinc-500">Live Preview (Renders with sample data):</label>
                  <div className="grow border border-zinc-205 bg-[#FAF9F6] rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-stone-200 border-b border-zinc-300 p-2 text-[10px] font-mono text-stone-500 select-none">
                      Variables injected: business_name, city, phone, services, tagline
                    </div>
                    <div className="grow relative bg-white">
                      <iframe
                        srcDoc={newTemplate.html
                          .replace(/\{\{\s*business_name\s*\}\}/g, sampleDataPreview.business_name)
                          .replace(/\{\{\s*phone\s*\}\}/g, sampleDataPreview.phone)
                          .replace(/\{\{\s*city\s*\}\}/g, sampleDataPreview.city)
                          .replace(/\{\{\s*services\s*\}\}/g, sampleDataPreview.services)
                          .replace(/\{\{\s*hero_tagline\s*\}\}/g, sampleDataPreview.hero_tagline)
                          .replace(/\{\{\s*logo_url\s*\}\}/g, sampleDataPreview.logo_url)
                        }
                        className="w-full h-full border-none"
                        title="Template Sandbox View"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex gap-3 justify-end pt-3 shrink-0 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddTemplate(false)}
                  className="bg-stone-50 hover:bg-stone-100 border border-stone-250 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-650"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-stone-100 py-2.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider"
                >
                  Compile & Save
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
