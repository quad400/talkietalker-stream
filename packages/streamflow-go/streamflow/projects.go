package streamflow

import "context"

// Project is a developer project.
type Project struct {
	ID             string   `json:"id"`
	OwnerUserID    string   `json:"owner_user_id"`
	Name           string   `json:"name"`
	Slug           string   `json:"slug"`
	Environment    string   `json:"environment"`
	AllowedOrigins []string `json:"allowed_origins"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
}

// CreateProjectParams are inputs for creating a project.
type CreateProjectParams struct {
	Name           string   `json:"name"`
	Slug           string   `json:"slug"`
	Environment    string   `json:"environment,omitempty"`
	AllowedOrigins []string `json:"allowed_origins,omitempty"`
}

// ProjectsService manages projects (JWT required).
type ProjectsService struct {
	client *Client
}

// Create creates a project. Requires WithAccessToken on the client.
func (s *ProjectsService) Create(ctx context.Context, params *CreateProjectParams) (*Project, error) {
	cfg := applyRequestOptions([]RequestOption{withJWT()})
	var project Project
	if err := s.client.doJSON(ctx, "POST", "/api/v1/projects", params, cfg, &project); err != nil {
		return nil, err
	}
	return &project, nil
}

// List lists projects for the authenticated user.
func (s *ProjectsService) List(ctx context.Context) ([]Project, error) {
	cfg := applyRequestOptions([]RequestOption{withJWT()})
	var resp struct {
		Data []Project `json:"data"`
	}
	if err := s.client.doJSON(ctx, "GET", "/api/v1/projects", nil, cfg, &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

// Get returns a project by ID.
func (s *ProjectsService) Get(ctx context.Context, id string) (*Project, error) {
	cfg := applyRequestOptions([]RequestOption{withJWT()})
	var project Project
	if err := s.client.doJSON(ctx, "GET", "/api/v1/projects/"+id, nil, cfg, &project); err != nil {
		return nil, err
	}
	return &project, nil
}
