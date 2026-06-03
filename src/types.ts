export interface Project {
  id: string;
  name: string;
  spreadsheetId: string;
  range: string;
  templateId: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  html: string;
  fields: string[]; // extracted variables
  createdAt: string;
}

export interface GeneratedPage {
  id: string;
  projectId: string;
  jobId?: string;
  businessName: string;
  slug: string;
  generatedUrl: string;
  screenshotUrl: string;
  status: 'pending' | 'generating' | 'deployed' | 'failed';
  errorMessage?: string;
  data: Record<string, any>; // cell values from Google Sheets mapping
  createdAt: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  processedCount: number;
  totalCount: number;
  startedAt: string;
  completedAt?: string;
  logs: string[];
}

export interface JobLog {
  jobId: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface DeploymentConfig {
  provider: 'mockups-server' | 'vercel' | 'netlify' | 'aws-s3';
  vercelToken?: string;
  vercelProjectId?: string;
  netlifyToken?: string;
  netlifySiteId?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsBucketName?: string;
  awsRegion?: string;
}

export interface AIContentConfig {
  enabled: boolean;
  model: string;
  promptGuidance?: string;
}
