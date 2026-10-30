// Cloud API Client for Project Management and Remote Job Submissions
import { Project } from '../../types';
import { saveProjectToStorage, getProjectFromStorage } from '../storage/db';

export interface CloudUserSession {
  userId: string;
  email: string;
  token: string;
}

export interface RemoteJob {
  id: string;
  type: 'RENDER_VIDEO' | 'RESEARCH_AI' | 'SCRIPT_CRITIC';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  resultUrl?: string;
  errorMessage?: string;
  createdAt: number;
}

// Mock/Adapter Cloud Service Client (operates seamlessly online or fallback offline)
export class CloudApiClient {
  private session: CloudUserSession | null = null;

  constructor() {
    const saved = localStorage.getItem('estudio_cloud_session');
    if (saved) {
      try {
        this.session = JSON.parse(saved);
      } catch {
        this.session = null;
      }
    }
  }

  public isAuthenticated(): boolean {
    return this.session !== null;
  }

  public getCurrentSession(): CloudUserSession | null {
    return this.session;
  }

  public async login(email: string): Promise<CloudUserSession> {
    const mockSession: CloudUserSession = {
      userId: `usr_${Date.now()}`,
      email,
      token: `jwt_mock_${Math.random().toString(36).substring(2)}`
    };
    this.session = mockSession;
    localStorage.setItem('estudio_cloud_session', JSON.stringify(mockSession));
    return mockSession;
  }

  public logout(): void {
    this.session = null;
    localStorage.removeItem('estudio_cloud_session');
  }

  public async syncProjectToCloud(project: Project): Promise<{ success: boolean; cloudId: string }> {
    // Save to local cache first
    await saveProjectToStorage(project);

    // If authenticated, simulate cloud sync payload
    if (this.session) {
      return {
        success: true,
        cloudId: project.id
      };
    }

    return {
      success: true,
      cloudId: project.id // Saved locally
    };
  }

  public async submitRemoteRenderJob(projectId: string): Promise<RemoteJob> {
    const project = await getProjectFromStorage(projectId);
    if (!project) {
      throw new Error(`Proyecto ${projectId} no encontrado en almacenamiento local`);
    }

    const job: RemoteJob = {
      id: `job_render_${Date.now()}`,
      type: 'RENDER_VIDEO',
      status: 'QUEUED',
      progressPercent: 0,
      createdAt: Date.now()
    };

    // Store active remote job in localStorage for monitoring
    const existingJobs: RemoteJob[] = JSON.parse(localStorage.getItem('estudio_remote_jobs') || '[]');
    existingJobs.unshift(job);
    localStorage.setItem('estudio_remote_jobs', JSON.stringify(existingJobs));

    return job;
  }

  public async getRemoteJobStatus(jobId: string): Promise<RemoteJob | null> {
    const jobs: RemoteJob[] = JSON.parse(localStorage.getItem('estudio_remote_jobs') || '[]');
    const job = jobs.find((j) => j.id === jobId);
    return job || null;
  }
}

export const cloudApi = new CloudApiClient();
