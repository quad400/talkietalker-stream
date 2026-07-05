package streamflow

import (
	"net/http"
	"strings"
)

const defaultBaseURL = "https://api.streamflow.io"

// Client is the StreamFlow server SDK client.
type Client struct {
	apiKey       string
	accessToken  string
	baseURL      string
	httpClient   *http.Client
}

// Option configures the client.
type Option func(*Client)

// WithBaseURL overrides the API base URL (for self-hosting).
func WithBaseURL(url string) Option {
	return func(c *Client) {
		c.baseURL = strings.TrimRight(url, "/")
	}
}

// WithHTTPClient sets a custom HTTP client.
func WithHTTPClient(client *http.Client) Option {
	return func(c *Client) {
		c.httpClient = client
	}
}

// WithAccessToken sets a JWT for dashboard endpoints (e.g. projects).
func WithAccessToken(token string) Option {
	return func(c *Client) {
		c.accessToken = token
	}
}

// NewClient creates a client authenticated with an API secret key.
func NewClient(apiKey string, opts ...Option) *Client {
	c := &Client{
		apiKey:     apiKey,
		baseURL:    defaultBaseURL,
		httpClient: http.DefaultClient,
	}
	for _, opt := range opts {
		opt(c)
	}
	return c
}

// Streams returns the streams resource client.
func (c *Client) Streams() *StreamsService { return &StreamsService{client: c} }

// Projects returns the projects resource client.
func (c *Client) Projects() *ProjectsService { return &ProjectsService{client: c} }

// Webhooks returns the webhooks resource client.
func (c *Client) Webhooks() *WebhooksService { return &WebhooksService{client: c} }

// EmbedTokens returns the embed tokens resource client.
func (c *Client) EmbedTokens() *EmbedTokensService { return &EmbedTokensService{client: c} }

// RequestOption applies per-request settings.
type RequestOption func(*requestConfig)

type requestConfig struct {
	idempotencyKey string
	useJWT         bool
}

// WithIdempotencyKey sets the Idempotency-Key header for mutating POST requests.
func WithIdempotencyKey(key string) RequestOption {
	return func(cfg *requestConfig) {
		cfg.idempotencyKey = key
	}
}

// withJWT forces JWT auth for this request.
func withJWT() RequestOption {
	return func(cfg *requestConfig) {
		cfg.useJWT = true
	}
}

func applyRequestOptions(opts []RequestOption) requestConfig {
	cfg := requestConfig{}
	for _, opt := range opts {
		opt(&cfg)
	}
	return cfg
}

func (c *Client) authHeader(cfg requestConfig) string {
	if cfg.useJWT && c.accessToken != "" {
		return "Bearer " + c.accessToken
	}
	return "Bearer " + c.apiKey
}
