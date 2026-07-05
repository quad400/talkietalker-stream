import type { HttpClient } from '../http.js';
export interface CreateProjectParams {
    name: string;
    slug: string;
    environment?: 'sandbox' | 'production';
    allowedOrigins?: string[];
}
export interface Project {
    id: string;
    owner_user_id: string;
    name: string;
    slug: string;
    environment: string;
    allowed_origins?: string[];
    created_at: string;
    updated_at: string;
}
export declare class ProjectsResource {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateProjectParams): Promise<Project>;
    list(): Promise<{
        data: Project[];
    }>;
    get(id: string): Promise<Project>;
}
