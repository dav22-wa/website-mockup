import fs from 'fs';
import path from 'path';
import { Project, Template, GeneratedPage, GenerationJob, DeploymentConfig, AIContentConfig } from './src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default beautiful HTML templates with Tailwind CSS loaded via CDN for high performance
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-1-services',
    name: 'Elite Services Template (Home Services, Plumbing, Roofing)',
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}} | Professional Services in {{city}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
    body { font-family: 'Outfit', sans-serif; }
  </style>
</head>
<body class="bg-[#F8FAFC] text-slate-800">
  <!-- Top bar -->
  <div class="bg-slate-900 text-white text-sm py-2 px-6 flex justify-between items-center">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span>Serving {{city}} and surrounding areas</span>
    </div>
    <div class="font-medium">Call Us: <span class="text-emerald-400">{{phone}}</span></div>
  </div>

  <!-- Header -->
  <header class="bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-xs">
    <div class="flex items-center gap-3">
      {{#if logo_url}}
        <img src="{{logo_url}}" alt="{{business_name}} Logo" class="h-10 w-auto object-contain" onerror="this.src='https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=120&q=80'">
      {{else}}
        <span class="text-xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">{{business_name}}</span>
      {{/if}}
      <span class="text-xs text-slate-400 font-mono border border-slate-200 rounded px-1.5 py-0.5 tracking-tight">MOCKUP PREVIEW</span>
    </div>
    <nav class="hidden md:flex gap-6 items-center font-medium">
      <a href="#services" class="hover:text-emerald-600 transition">Services</a>
      <a href="#about" class="hover:text-emerald-600 transition">About</a>
      <a href="#contact" class="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 shadow-sm transition">Book Now</a>
    </nav>
  </header>

  <!-- Hero Section -->
  <section class="relative bg-slate-950 text-white py-24 px-6 md:px-12 overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
    <div class="relative z-10 max-w-4xl mx-auto text-center">
      <span class="text-emerald-400 font-semibold uppercase tracking-wider text-sm mb-3 block">Award-Winning Standard</span>
      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
        Reliable Services in <span class="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{{city}}</span>
      </h1>
      <p class="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
        {{#if hero_tagline}}{{hero_tagline}}{{else}}Get premier solutions tailored directly for your needs. Professionalism, reliability, and precision guaranteed.{{/if}}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <a href="tel:{{phone}}" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-emerald-900/20 transition-all text-center">
          Call Now: {{phone}}
        </a>
        <a href="#services" class="w-full sm:w-auto border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-200 hover:border-slate-500 px-8 py-4 rounded-lg transition text-center">
          Our Services
        </a>
      </div>
    </div>
  </section>

  <!-- Services Section -->
  <section id="services" class="py-20 px-6 md:px-12 max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold tracking-tight mb-4">Our Premium Offerings</h2>
      <div class="h-1.5 w-16 bg-emerald-600 mx-auto rounded-full"></div>
      <p class="text-slate-500 mt-4 max-w-xl mx-auto">We provide the highest quality services to residential and commercial clients across {{city}}.</p>
    </div>

    <!-- Grouped Services -->
    <div class="grid md:grid-cols-3 gap-8">
      {{#if services}}
        <!-- Variable substituted directly or splits into list -->
        <div class="md:col-span-3 grid md:grid-cols-3 gap-8">
          <div class="bg-white p-8 rounded-xl shadow-xs border border-slate-100 hover:border-emerald-500 hover:shadow-md transition">
            <span class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl mb-6">✓</span>
            <h3 class="text-xl font-bold mb-3">Core Specialty</h3>
            <p class="text-slate-600 mb-4">Professional, fast, and secure delivery of our elite services across {{city}}.</p>
            <div class="text-sm font-semibold text-emerald-600">{{services}}</div>
          </div>
          <div class="bg-white p-8 rounded-xl shadow-xs border border-slate-100 hover:border-emerald-500 hover:shadow-md transition">
            <span class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-6">★</span>
            <h3 class="text-xl font-bold mb-3">Emergency Response</h3>
            <p class="text-slate-600 mb-4">Need immediate help? Our emergency response unit is ready to support you 24/7.</p>
            <span class="text-sm font-semibold text-blue-600">Call {{phone}}</span>
          </div>
          <div class="bg-white p-8 rounded-xl shadow-xs border border-slate-100 hover:border-emerald-500 hover:shadow-md transition">
            <span class="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl mb-6">⚙</span>
            <h3 class="text-xl font-bold mb-3">Maintenance & Pro-Care</h3>
            <p class="text-slate-600 mb-4 font-normal">Prevention is better than repair. Ask us about our comprehensive scheduled checkups.</p>
            <span class="text-sm font-semibold text-purple-600">Guaranteed Service Quality</span>
          </div>
        </div>
      {{else}}
        <div class="bg-white p-8 rounded-xl border border-slate-100 text-center md:col-span-3">
          <p class="text-slate-500 font-normal">Template services will populate automatically during sheets generation.</p>
        </div>
      {{/if}}
    </div>
  </section>

  <!-- About Section -->
  <section id="about" class="bg-white py-20 border-y border-slate-100">
    <div class="max-w-5xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <span class="text-emerald-600 font-semibold text-sm mb-2 block uppercase">About {{business_name}}</span>
        <h2 class="text-3xl font-bold tracking-tight mb-6">Your Trusted Local Partner in {{city}}</h2>
        <div class="space-y-4 text-slate-600 leading-relaxed font-light">
          <p>
            {{#if about_text}}
              {{about_text}}
            {{else}}
              At {{business_name}}, we are dedicated to providing outstanding outcomes for our clients in {{city}}. Built on a foundation of trust, high craft quality, and timely responses, we have become local leaders.
            {{/if}}
          </p>
          <p>We combine advanced tech tools, experienced professionals, and premium customer support to exceed expectations on every single assignment.</p>
        </div>
        <div class="mt-8 flex gap-8 border-t border-slate-100 pt-8">
          <div>
            <div class="text-2xl font-bold text-slate-900">100%</div>
            <div class="text-sm text-slate-500">Satisfied Clients</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-900">24/7</div>
            <div class="text-sm text-slate-500">Service Coverage</div>
          </div>
        </div>
      </div>
      <div class="relative">
        <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80" alt="Professional Work" class="rounded-xl shadow-lg w-full object-cover h-80">
        <div class="absolute -bottom-6 -left-6 bg-slate-900 text-white p-6 rounded-xl shadow-md max-w-[200px] hidden sm:block">
          <div class="text-3xl font-bold text-emerald-400">#1</div>
          <div class="text-xs text-slate-300 font-medium mt-1">Voted Top Service Provider in {{city}}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-950 text-slate-400 py-12 px-6 md:px-12">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-8">
      <div>
        <div class="text-white font-bold text-lg mb-2">{{business_name}}</div>
        <div>Leading residential and commercial solutions in {{city}}.</div>
      </div>
      <div class="flex gap-6">
        <span class="text-slate-300">Call Today:</span>
        <a href="tel:{{phone}}" class="text-emerald-400 hover:underline font-bold">{{phone}}</a>
      </div>
    </div>
    <div class="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
      <div>&copy; 2026 {{business_name}}. All rights reserved. Generated via Website Mockup System.</div>
      <div class="flex gap-4 mt-4 sm:mt-0 font-mono text-xs">
        <span>STATION STATE: DEMO MOCKUP</span>
      </div>
    </div>
  </footer>
</body>
</html>`,
    fields: ['business_name', 'phone', 'city', 'logo_url', 'services', 'hero_tagline', 'about_text'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-2-saas',
    name: 'Modern SaaS / Tech Product Page',
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}} | Next-Gen Software Solutions</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100">
  <!-- Glowing header -->
  <header class="border-b border-slate-800 py-5 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto bg-slate-900/80 backdrop-blur sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white tracking-widest text-sm">S</div>
      <div>
        <span class="text-lg font-bold text-white">{{business_name}}</span>
        <span class="text-[10px] text-indigo-400 ml-1.5 font-mono border border-indigo-500/20 px-1 py-0.5 rounded">Mockup</span>
      </div>
    </div>
    <nav class="hidden md:flex gap-8 items-center text-sm font-medium text-slate-400">
      <a href="#features" class="hover:text-white transition">Product</a>
      <a href="#impact" class="hover:text-white transition">City Impact</a>
      <a href="tel:{{phone}}" class="bg-white text-slate-900 hover:bg-slate-250 px-5 py-2 rounded-lg font-bold transition shadow-md">Call: {{phone}}</a>
    </nav>
  </header>

  <!-- Hero Grid -->
  <section class="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
    <div class="space-y-6">
      <div class="inline-flex items-center gap-2 bg-indigo-900/30 border border-indigo-500/20 px-3 py-1.5 rounded-full text-indigo-400 text-xs font-semibold">
        <span>✨ Launching in {{city}}</span>
      </div>
      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
        {{#if hero_tagline}}{{hero_tagline}}{{else}}Scale operations. Fast-track success.{{/if}}
      </h1>
      <p class="text-slate-400 text-lg">
        {{#if about_text}}{{about_text}}{{else}}Transform your operations locally in {{city}} with our advanced cloud platform built for growth.{{/if}}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 pt-4">
        <a href="#demo" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-lg text-center transition shadow-lg shadow-indigo-600/25">
          Get Started Online
        </a>
        <a href="tel:{{phone}}" class="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-lg text-center transition">
          Talk to Experts: {{phone}}
        </a>
      </div>
    </div>
    <div class="relative bg-slate-800/40 border border-slate-800 rounded-2xl p-4 overflow-hidden shadow-2xl">
      <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-transparent z-0"></div>
      <div class="bg-slate-950/80 rounded-xl p-8 border border-white/5 relative z-10 space-y-6">
        <div class="flex justify-between items-center border-b border-white/5 pb-4">
          <span class="text-xs font-mono text-slate-500">Live Services Platform</span>
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>
        <div class="space-y-3">
          <div class="text-sm font-medium text-slate-300">Authorized Channels</div>
          <div class="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span class="text-xs font-semibold text-white">Service Coverage</span>
            <span class="text-xs text-indigo-400 font-mono">{{services}}</span>
          </div>
          <div class="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span class="text-xs font-semibold text-white">Regional Hub</span>
            <span class="text-xs text-indigo-400 font-mono">{{city}}</span>
          </div>
          <div class="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
            <span class="text-xs font-semibold text-white">Phone Support Partner</span>
            <span class="text-xs text-indigo-400 font-mono">{{phone}}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Block -->
  <section id="features" class="border-t border-slate-800 bg-slate-950/40 py-20">
    <div class="max-w-7xl mx-auto px-6 md:px-12 text-center mb-16">
      <h2 class="text-3xl font-bold tracking-tight text-white mb-4">Unlocking Potential</h2>
      <p class="text-slate-500 max-w-xl mx-auto">See how we stack up against traditional pipelines.</p>
    </div>
    <div class="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
      <div class="p-8 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition">
        <div class="text-indigo-500 font-bold text-lg mb-4">🚀 Next-Gen Architecture</div>
        <p class="text-slate-400">Engineered with high performance and minimal latency in {{city}} and beyond.</p>
      </div>
      <div class="p-8 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition">
        <div class="text-indigo-500 font-bold text-lg mb-4">🛡 Secure Integrations</div>
        <p class="text-slate-400">Certified secure channels with full encryption and data masking.</p>
      </div>
      <div class="p-8 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition">
        <div class="text-indigo-500 font-bold text-lg mb-4">🔗 Real-time Channels</div>
        <p class="text-slate-400">Instant setup and auto-updates dynamically generated from spreadsheet data layers.</p>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="max-w-7xl mx-auto border-t border-slate-800 py-12 px-6 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
    <div>&copy; 2026 {{business_name}} Tech. Made for {{city}}.</div>
    <div class="mt-4 sm:mt-0 font-mono text-[10px] text-indigo-400 tracking-wider">SECURE MOCKUP CONTAINER</div>
  </footer>
</body>
</html>`,
    fields: ['business_name', 'phone', 'city', 'services', 'hero_tagline', 'about_text'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-3-dining',
    name: 'Fine Dining / Café Premium Website',
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}} | Premium Dining in {{city}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
    h1, h2, h3, .serif-font { font-family: 'Playfair Display', serif; }
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#FCFAF8] text-[#2C2520]">
  <!-- Navigation Header -->
  <header class="py-6 px-6 md:px-12 flex justify-between items-center border-b border-[#EBE3DE] bg-white/70 backdrop-blur sticky top-0 z-55">
    <div class="flex items-center gap-3">
      {{#if logo_url}}
        <img src="{{logo_url}}" alt="{{business_name}}" class="h-10 w-auto object-contain">
      {{else}}
        <span class="text-2xl font-semibold serif-font text-[#632912] font-semibold tracking-wide">{{business_name}}</span>
      {{/if}}
      <span class="font-mono text-[9px] bg-[#EBE3DE] text-[#632912] border border-[#BCB0A7] rounded px-1.5 py-0.5 tracking-tight uppercase">MOCKUP DRAFT</span>
    </div>
    <nav class="hidden md:flex gap-8 items-center text-xs uppercase tracking-widest text-[#5C5047] font-medium">
      <a href="#menu" class="hover:text-[#632912] transition">Specials</a>
      <a href="#about" class="hover:text-[#632912] transition">The Kitchen</a>
      <a href="tel:{{phone}}" class="bg-[#632912] hover:bg-[#803318] text-white px-5 py-2.5 rounded transition shadow">Reservations: {{phone}}</a>
    </nav>
  </header>

  <!-- Hero Section -->
  <section class="max-w-6xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
    <div class="space-y-6 md:pr-6">
      <span class="text-[#803318] font-bold tracking-widest text-xs uppercase block">Exceptional Fine Dining</span>
      <h1 class="text-5xl md:text-7xl font-semibold leading-tight text-[#421B0C] serif-font">
        Experience <span class="italic font-normal">Savor</span> in <span class="underline decoration-[#803318]">{{city}}</span>
      </h1>
      <p class="text-slate-600 text-lg leading-relaxed font-light">
        {{#if hero_tagline}}{{hero_tagline}}{{else}}A curated gastronomic adventure celebrating seasonal ingredients, elegant plating, and vibrant local flavors right here in the heart of {{city}} city.{{/if}}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 pt-4">
        <a href="tel:{{phone}}" class="bg-[#421B0C] hover:bg-[#632912] text-white text-sm uppercase tracking-widest font-semibold px-8 py-4 rounded shadow-lg transition text-center">
          Reserve: {{phone}}
        </a>
        <a href="#menu" class="border border-[#BCB0A7] text-[#421B0C] text-sm uppercase tracking-widest bg-transparent hover:bg-white px-8 py-4 rounded transition text-center">
          Our Menu
        </a>
      </div>
    </div>
    <div class="relative">
      <img src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80" alt="Fine Dining Experience" class="rounded-2xl shadow-xl w-full object-cover h-96">
      <div class="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl border border-[#EBE3DE] shadow-xl max-w-[200px] text-center hidden sm:block">
        <div class="text-[#803318] serif-font text-2xl font-bold italic">Signature</div>
        <p class="text-xs text-slate-500 font-medium mt-1">Authentic culinary craft matching the pulse of {{city}}.</p>
      </div>
    </div>
  </section>

  <!-- Menu Section -->
  <section id="menu" class="bg-[#F0EBEC] py-20 border-y border-[#EBE3DE]">
    <div class="max-w-5xl mx-auto px-6">
      <div class="text-center mb-16 space-y-3">
        <h2 class="text-3xl md:text-4xl text-[#421B0C] font-semibold serif-font leading-tight">Handcrafted Culinary Highlights</h2>
        <div class="h-[1px] w-16 bg-[#803318] mx-auto"></div>
        <p class="text-sm font-light text-slate-500 tracking-wider">WHAT WE EXCEL AT</p>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <div class="bg-white p-8 rounded-xl border border-[#EBE3DE] shadow-xs space-y-4">
          <div class="flex justify-between items-center border-b border-dashed border-slate-200 pb-2">
            <h3 class="text-lg font-bold text-[#421B0C]">{{services}}</h3>
            <span class="text-[#803318] font-bold font-serif">$24.00</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed font-light">Fresh seasonal preparation crafted by our world-class kitchen team, using organic ingredients sourced directly from trusted regional producers.</p>
        </div>
        <div class="bg-white p-8 rounded-xl border border-[#EBE3DE] shadow-xs space-y-4">
          <div class="flex justify-between items-center border-b border-dashed border-slate-200 pb-2">
            <h3 class="text-lg font-bold text-[#421B0C]">Gourmet Chef Specials</h3>
            <span class="text-[#803318] font-bold font-serif">Priced Daily</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed font-light">Ask our table host about our chef's signature daily creations, inspired by the seasonal harvests of {{city}}.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-[#2C2520] text-[#BCB0A7] py-12 px-6 md:px-12 text-center text-xs space-y-4 border-t border-[#421B0C]/20">
    <div class="serif-font text-white text-lg font-bold">{{business_name}}</div>
    <p>Elegant atmospheres and exquisite foods made to leave an impression in {{city}}.</p>
    <div class="flex justify-center gap-6 text-[#DFC9BA] font-light">
      <span>Reservations: <a href="tel:{{phone}}" class="hover:underline font-bold">{{phone}}</a></span>
    </div>
    <div class="pt-6 border-t border-slate-800 text-[10px] text-slate-500">
      &copy; 2026 {{business_name}} Fine Dining. Static Mockup Draft for previewing.
    </div>
  </footer>
</body>
</html>`,
    fields: ['business_name', 'phone', 'city', 'logo_url', 'services', 'hero_tagline', 'about_text'],
    createdAt: new Date().toISOString(),
  }
];

export interface DatabaseSchema {
  projects: Project[];
  templates: Template[];
  generatedPages: GeneratedPage[];
  generationJobs: GenerationJob[];
  deploymentConfig: DeploymentConfig;
  aiConfig: AIContentConfig;
}

class DbService {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      projects: [],
      templates: [],
      generatedPages: [],
      generationJobs: [],
      deploymentConfig: { provider: 'mockups-server' },
      aiConfig: { enabled: false, model: 'gemini-3.5-flash' }
    };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure all required fields exist
        if (!this.data.projects) this.data.projects = [];
        if (!this.data.templates) this.data.templates = [];
        if (!this.data.generatedPages) this.data.generatedPages = [];
        if (!this.data.generationJobs) this.data.generationJobs = [];
        if (!this.data.deploymentConfig) this.data.deploymentConfig = { provider: 'mockups-server' };
        if (!this.data.aiConfig) this.data.aiConfig = { enabled: false, model: 'gemini-3.5-flash' };
      } catch (err) {
        console.error('Failed to parse database, resetting to default:', err);
        this.save();
      }
    } else {
      // Seed default templates
      this.data.templates = [...DEFAULT_TEMPLATES];
      this.save();
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving data to file-database:', err);
    }
  }

  // --- Projects ---
  getProjects(): Project[] {
    return this.data.projects;
  }

  getProject(id: string): Project | undefined {
    return this.data.projects.find((p) => p.id === id);
  }

  createProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...project,
      id: `proj-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.projects.unshift(newProject);
    this.save();
    return newProject;
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project {
    const index = this.data.projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Project ${id} not found`);
    this.data.projects[index] = {
      ...this.data.projects[index],
      ...updates,
    };
    this.save();
    return this.data.projects[index];
  }

  deleteProject(id: string): void {
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.data.generatedPages = this.data.generatedPages.filter((g) => g.projectId !== id);
    this.data.generationJobs = this.data.generationJobs.filter((j) => j.projectId !== id);
    this.save();
  }

  // --- Templates ---
  getTemplates(): Template[] {
    return this.data.templates;
  }

  getTemplate(id: string): Template | undefined {
    return this.data.templates.find((t) => t.id === id);
  }

  createTemplate(name: string, html: string, fields: string[]): Template {
    const newTemplate: Template = {
      id: `tpl-${Math.random().toString(36).substring(2, 9)}`,
      name,
      html,
      fields,
      createdAt: new Date().toISOString(),
    };
    this.data.templates.unshift(newTemplate);
    this.save();
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>): Template {
    const index = this.data.templates.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Template ${id} not found`);
    this.data.templates[index] = {
      ...this.data.templates[index],
      ...updates,
    };
    this.save();
    return this.data.templates[index];
  }

  deleteTemplate(id: string): void {
    this.data.templates = this.data.templates.filter((t) => t.id !== id);
    this.save();
  }

  // --- Generated Pages ---
  getPages(projectId?: string): GeneratedPage[] {
    if (projectId) {
      return this.data.generatedPages.filter((g) => g.projectId === projectId);
    }
    return this.data.generatedPages;
  }

  getPage(id: string): GeneratedPage | undefined {
    return this.data.generatedPages.find((g) => g.id === id);
  }

  getPageBySlug(slug: string): GeneratedPage | undefined {
    return this.data.generatedPages.find((g) => g.slug === slug);
  }

  createPage(page: Omit<GeneratedPage, 'id' | 'createdAt'>): GeneratedPage {
    const newPage: GeneratedPage = {
      ...page,
      id: `page-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.generatedPages.unshift(newPage);
    this.save();
    return newPage;
  }

  updatePage(id: string, updates: Partial<Omit<GeneratedPage, 'id' | 'createdAt'>>): GeneratedPage {
    const index = this.data.generatedPages.findIndex((g) => g.id === id);
    if (index === -1) throw new Error(`Page ${id} not found`);
    this.data.generatedPages[index] = {
      ...this.data.generatedPages[index],
      ...updates,
    };
    this.save();
    return this.data.generatedPages[index];
  }

  // --- Generation Jobs ---
  getJobs(projectId?: string): GenerationJob[] {
    if (projectId) {
      return this.data.generationJobs.filter((j) => j.projectId === projectId);
    }
    return this.data.generationJobs;
  }

  getJob(id: string): GenerationJob | undefined {
    return this.data.generationJobs.find((j) => j.id === id);
  }

  createJob(projectId: string, totalCount: number): GenerationJob {
    const newJob: GenerationJob = {
      id: `job-${Math.random().toString(36).substring(2, 9)}`,
      projectId,
      status: 'pending',
      processedCount: 0,
      totalCount,
      startedAt: new Date().toISOString(),
      logs: [`[INFO] Job initialized with ${totalCount} target rows.`],
    };
    this.data.generationJobs.unshift(newJob);
    this.save();
    return newJob;
  }

  updateJob(id: string, updates: Partial<Omit<GenerationJob, 'id'>>): GenerationJob {
    const index = this.data.generationJobs.findIndex((j) => j.id === id);
    if (index === -1) throw new Error(`Job ${id} not found`);
    this.data.generationJobs[index] = {
      ...this.data.generationJobs[index],
      ...updates,
    };
    this.save();
    return this.data.generationJobs[index];
  }

  addJobLog(id: string, message: string): GenerationJob {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job ${id} not found`);
    const formattedMsg = `[${new Date().toISOString().substring(11, 19)}] ${message}`;
    job.logs.push(formattedMsg);
    this.save();
    return job;
  }

  // --- Global Settings ---
  getDeploymentConfig(): DeploymentConfig {
    return this.data.deploymentConfig;
  }

  updateDeploymentConfig(config: DeploymentConfig): DeploymentConfig {
    this.data.deploymentConfig = config;
    this.save();
    return this.data.deploymentConfig;
  }

  getAIConfig(): AIContentConfig {
    return this.data.aiConfig;
  }

  updateAIConfig(config: AIContentConfig): AIContentConfig {
    this.data.aiConfig = config;
    this.save();
    return this.data.aiConfig;
  }
}

export const db = new DbService();
export default db;
