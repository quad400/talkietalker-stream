package streamflow

import "context"

// WebhookEndpoint is a registered webhook URL.
type WebhookEndpoint struct {
	ID            string   `json:"id"`
	ProjectID     string   `json:"project_id"`
	URL           string   `json:"url"`
	EnabledEvents []string `json:"enabled_events"`
	Status        string   `json:"status"`
	Secret        string   `json:"secret,omitempty"`
	SecretMasked  string   `json:"secret_masked"`
	CreatedAt     string   `json:"created_at"`
	UpdatedAt     string   `json:"updated_at"`
}

// CreateWebhookParams are inputs for creating a webhook endpoint.
type CreateWebhookParams struct {
	URL           string   `json:"url"`
	EnabledEvents []string `json:"enabled_events,omitempty"`
}

// WebhookDelivery is a webhook delivery attempt record.
type WebhookDelivery struct {
	ID             string `json:"id"`
	EventID        string `json:"event_id"`
	EventType      string `json:"event_type"`
	Status         string `json:"status"`
	Attempts       int    `json:"attempts"`
	ResponseStatus *int   `json:"response_status"`
	CreatedAt      string `json:"created_at"`
}

// WebhooksService manages webhook endpoints.
type WebhooksService struct {
	client *Client
}

// Create registers a webhook endpoint for a project.
func (s *WebhooksService) Create(ctx context.Context, projectID string, params *CreateWebhookParams, opts ...RequestOption) (*WebhookEndpoint, error) {
	cfg := applyRequestOptions(opts)
	var endpoint WebhookEndpoint
	path := "/api/v1/projects/" + projectID + "/webhooks"
	if err := s.client.doJSON(ctx, "POST", path, params, cfg, &endpoint); err != nil {
		return nil, err
	}
	return &endpoint, nil
}

// List returns webhook endpoints for a project.
func (s *WebhooksService) List(ctx context.Context, projectID string) ([]WebhookEndpoint, error) {
	var resp struct {
		Data []WebhookEndpoint `json:"data"`
	}
	path := "/api/v1/projects/" + projectID + "/webhooks"
	if err := s.client.doJSON(ctx, "GET", path, nil, requestConfig{}, &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

// Test sends a test event to a webhook endpoint.
func (s *WebhooksService) Test(ctx context.Context, endpointID string) error {
	path := "/api/v1/webhooks/" + endpointID + "/test"
	return s.client.doJSON(ctx, "POST", path, nil, requestConfig{}, nil)
}
