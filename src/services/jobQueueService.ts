import { v4 as uuidv4 } from 'uuid';
import { Job } from '../types/type';

// In-memory job store (in production, use Redis or database)
const jobStore = new Map<string, Job>();

// Job queue for processing
const jobQueue: string[] = [];

// Persistent worker control
let workerRunning = false;

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
  
  console.log(`Job submit  ->  jobId: ${jobId}  text: "${text}" style: ${style}`);

  // Start the worker if not already running
  startWorker();

  return jobId;
}

/**
 * Get job status and result
 */
export function getJob(jobId: string): Job | null {
  return jobStore.get(jobId) || null;
}

/**
 * Persistent async worker to process jobs
 */
async function jobWorker() {
  workerRunning = true;
  while (workerRunning) {
    if (jobQueue.length === 0) {
      // Wait for new jobs
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }
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
        case 'openai': {
          const { getOpenAIResponse } = await import('./openaiService');
          result = await getOpenAIResponse(job.text, job.style);
          break;
        }
        case 'anthropic': {
          const { getAnthropicResponse } = await import('./anthropicService');
          result = await getAnthropicResponse(job.text, job.style);
          break;
        }
        default: {
          const { getLocalmocResponse } = await import('./localmocService');
          result = await getLocalmocResponse(job.text, job.style);
          break;
        }
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
}

/**
 * Start the persistent worker if not already running
 */
function startWorker() {
  if (!workerRunning) {
    jobWorker();
  }
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
    completedJobs: Array.from(jobStore.values()).filter(job => job.status === 'completed').length,
    failedJobs: Array.from(jobStore.values()).filter(job => job.status === 'failed').length
  };
} 