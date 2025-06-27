// ============================================================================
// JOB QUEUE TYPES
// ============================================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Job = {
  id: string;
  text: string;
  style: string;
  llm: string;
  status: JobStatus;
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// STREAMING TYPES
// ============================================================================

export type StreamingOptions = {
  granularity: 'word' | 'character' | 'sentence';
  delay?: number; // Delay between chunks in milliseconds
  includeMetadata?: boolean;
};

export type StreamChunk = {
  type: 'content' | 'metadata' | 'progress' | 'complete' | 'error';
  data: any;
  timestamp: number;
};

// ============================================================================
// CACHE TYPES
// ============================================================================

export type CacheMetrics = {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
};

// ============================================================================
// OBSERVABILITY TYPES
// ============================================================================

export type RequestLog = {
  timestamp: Date;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  requestBody?: any;
  error?: string;
};
