import { Request, Response } from 'express';
import { submitJob, getJob, getQueueStats } from '../services/jobQueueService';
import { validateRequest } from '../utils/validate';

/**
 * POST /v1/rewrite/submit
 * Submit a new text rewriting job
 */
export const submitRewriteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, style, llm } = req.body;
    
    // Validate the request
    const validation = validateRequest(llm || 'localmoc', text, style);
    if (!validation.valid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    // Submit the job
    const jobId = await submitJob(
      text, 
      style || 'formal', 
      llm || 'localmoc'
    );

    // Return the job ID immediately
    res.status(202).json({
      jobId,
      status: 'pending',
      message: 'Job submitted successfully. Use GET /v1/rewrite/result/:jobId to check status.'
    });

  } catch (error) {
    console.error('Job submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /v1/rewrite/result/:jobId
 * Get job status and result
 */
export const getJobResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      res.status(400).json({ error: 'Job ID is required' });
      return;
    }

    // Get the job
    const job = getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // Return job status and result
    const response: any = {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      text: job.text,
      style: job.style,
      llm: job.llm
    };

    // Add result or error based on status
    if (job.status === 'completed' && job.result) {
      response.result = {
        original: job.text,
        rewritten: job.result,
        style: job.style,
        llm: job.llm
      };
    } else if (job.status === 'failed' && job.error) {
      response.error = job.error;
    }

    res.json(response);

  } catch (error) {
    console.error('Job result error:', error);
    res.status(500).json({ 
      error: 'Failed to get job result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /v1/rewrite/queue/stats
 * Get queue statistics
 */
export const getQueueStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = getQueueStats();
    
    res.json({
      queue: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get queue statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 