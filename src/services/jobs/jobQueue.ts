// Cloud Job Queue & Task Manager for Asynchronous Video Rendering and AI Heavy Tasks
import { RemoteJob } from '../cloud/api';

export interface JobSubmission {
  projectId: string;
  type: 'RENDER_VIDEO' | 'RESEARCH_AI' | 'SCRIPT_CRITIC';
  payload?: Record<string, unknown>;
}

export class JobQueueManager {
  private jobs: RemoteJob[] = [];

  constructor() {
    const saved = localStorage.getItem('estudio_remote_jobs');
    if (saved) {
      try {
        this.jobs = JSON.parse(saved);
      } catch {
        this.jobs = [];
      }
    }
  }

  public submitJob(submission: JobSubmission): RemoteJob {
    const newJob: RemoteJob = {
      id: `job_${submission.type.toLowerCase()}_${Date.now()}`,
      type: submission.type,
      status: 'QUEUED',
      progressPercent: 0,
      createdAt: Date.now()
    };

    this.jobs.unshift(newJob);
    this.persistJobs();

    // Simulate async background execution without blocking the main UI thread
    this.simulateBackgroundWorker(newJob.id);

    return newJob;
  }

  public getJobs(): RemoteJob[] {
    return [...this.jobs];
  }

  public getJobById(jobId: string): RemoteJob | null {
    return this.jobs.find((j) => j.id === jobId) || null;
  }

  private simulateBackgroundWorker(jobId: string): void {
    setTimeout(() => {
      const job = this.jobs.find((j) => j.id === jobId);
      if (job) {
        job.status = 'PROCESSING';
        job.progressPercent = 25;
        this.persistJobs();
      }
    }, 1000);

    setTimeout(() => {
      const job = this.jobs.find((j) => j.id === jobId);
      if (job) {
        job.progressPercent = 75;
        this.persistJobs();
      }
    }, 3000);

    setTimeout(() => {
      const job = this.jobs.find((j) => j.id === jobId);
      if (job) {
        job.status = 'COMPLETED';
        job.progressPercent = 100;
        job.resultUrl = `https://storage.estudio.cloud/renders/${jobId}.webm`;
        this.persistJobs();
      }
    }, 5000);
  }

  private persistJobs(): void {
    localStorage.setItem('estudio_remote_jobs', JSON.stringify(this.jobs));
  }
}

export const jobQueueManager = new JobQueueManager();
