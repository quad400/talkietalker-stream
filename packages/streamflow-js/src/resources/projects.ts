import type { HttpClient } from '../http.js'

export interface CreateProjectParams {
  name: string
  slug: string
  environment?: 'sandbox' | 'production'
  allowedOrigins?: string[]
}

export interface Project {
  id: string
  owner_user_id: string
  name: string
  slug: string
  environment: string
  allowed_origins?: string[]
  created_at: string
  updated_at: string
}

export class ProjectsResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateProjectParams): Promise<Project> {
    return this.http.request<Project>({
      method: 'POST',
      path: '/api/v1/projects',
      useJWT: true,
      body: {
        name: params.name,
        slug: params.slug,
        environment: params.environment,
        allowed_origins: params.allowedOrigins,
      },
    })
  }

  list(): Promise<{ data: Project[] }> {
    return this.http.request<{ data: Project[] }>({
      method: 'GET',
      path: '/api/v1/projects',
      useJWT: true,
    })
  }

  get(id: string): Promise<Project> {
    return this.http.request<Project>({
      method: 'GET',
      path: `/api/v1/projects/${id}`,
      useJWT: true,
    })
  }
}
