import { v4 as uuidv4 } from 'uuid';

// Job status types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Job interface
export interface Job {
  id: string;
  text: string;
  style: string;
  llm: string;
  status: JobStatus;
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, Job>();

// Job queue for processing
const jobQueue: string[] = [];

// Process jobs flag
let isProcessing = false;

/**
 * Submit a new job for text rewriting
 */
export async function submitJob(text: string, style: string, llm: string): Promise<string> {
  const jobId = uuidv4();
  
  const job: Job = {
    id: jobId,
    text,
    style,
    llm,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Store the job
  jobStore.set(jobId, job);
  
  // Add to processing queue
  jobQueue.push(jobId);
  
  console.log(`Job submitted: ${jobId} for text: "${text}" with style: ${style}`);
  
  // Start processing if not already running
  if (!isProcessing) {
    processJobs();
  }

  return jobId;
}

/**
 * Get job status and result
 */
export function getJob(jobId: string): Job | null {
  return jobStore.get(jobId) || null;
}

/**
 * Process jobs in the queue
 */
async function processJobs() {
  if (isProcessing || jobQueue.length === 0) {
    return;
  }

  isProcessing = true;
  console.log(`Starting job processing. Queue length: ${jobQueue.length}`);

  while (jobQueue.length > 0) {
    const jobId = jobQueue.shift();
    if (!jobId) continue;

    const job = jobStore.get(jobId);
    if (!job) continue;

    try {
      // Update status to processing
      job.status = 'processing';
      job.updatedAt = new Date();
      jobStore.set(jobId, job);

      console.log(`Processing job: ${jobId}`);

      // Call the appropriate LLM service
      let result: string;
      
      switch (job.llm) {
        case 'openai':
          const { getOpenAIResponse } = await import('./openaiService');
          result = await getOpenAIResponse(job.text, job.style);
          break;
        case 'anthropic':
          const { getAnthropicResponse } = await import('./anthropicService');
          result = await getAnthropicResponse(job.text, job.style);
          break;
        default:
          const { getLocalmocResponse } = await import('./localmocService');
          result = await getLocalmocResponse(job.text, job.style);
          break;
      }

      // Update job with result
      job.status = 'completed';
      job.result = result;
      job.updatedAt = new Date();
      jobStore.set(jobId, job);

      console.log(`Job completed: ${jobId}`);

    } catch (error) {
      // Update job with error
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.updatedAt = new Date();
      jobStore.set(jobId, job);

      console.error(`Job failed: ${jobId}`, error);
    }
  }

  isProcessing = false;
  console.log('Job processing completed');
}

/**
 * Clean up old completed jobs (optional)
 */
export function cleanupOldJobs(maxAgeHours: number = 24) {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  let cleanedCount = 0;

  for (const [jobId, job] of jobStore.entries()) {
    if (job.status === 'completed' && job.updatedAt < cutoff) {
      jobStore.delete(jobId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} old jobs`);
  }
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  return {
    totalJobs: jobStore.size,
    pendingJobs: jobQueue.length,
    isProcessing,
    completedJobs: Array.from(jobStore.values()).filter(job => job.status === 'completed').length,
    failedJobs: Array.from(jobStore.values()).filter(job => job.status === 'failed').length
  };
} 