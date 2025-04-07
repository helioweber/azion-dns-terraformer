
export interface BindRecord {
  type: string;
  name: string;
  ttl?: number;
  class?: string;
  data: string[];
}

export interface BindZone {
  domain: string;
  name?: string;
  records: BindRecord[];
  isActive?: boolean;
}

export interface TerraformRecord {
  record_type: string;
  entry: string;
  answers_list: string[];
  policy?: string;
  weight?: number;
  description?: string;
  ttl?: number;
}

export interface TerraformZone {
  domain: string;
  is_active: boolean;
  name: string;
}

export interface GitHubConfig {
  token: string;
  repository: string;
  azionToken: string;
}

export interface AnalysisResult {
  issueType: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}
