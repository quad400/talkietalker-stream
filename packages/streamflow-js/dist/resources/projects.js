export class ProjectsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    create(params) {
        return this.http.request({
            method: 'POST',
            path: '/api/v1/projects',
            useJWT: true,
            body: {
                name: params.name,
                slug: params.slug,
                environment: params.environment,
                allowed_origins: params.allowedOrigins,
            },
        });
    }
    list() {
        return this.http.request({
            method: 'GET',
            path: '/api/v1/projects',
            useJWT: true,
        });
    }
    get(id) {
        return this.http.request({
            method: 'GET',
            path: `/api/v1/projects/${id}`,
            useJWT: true,
        });
    }
}
