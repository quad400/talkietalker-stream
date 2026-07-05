package streamflow

import "context"

// EmbedParticipant identifies someone joining via embed token.
type EmbedParticipant struct {
	Name   string `json:"name"`
	Role   string `json:"role,omitempty"`
	UserID string `json:"user_id,omitempty"`
}

// CreateEmbedTokenParams are inputs for creating an embed token.
type CreateEmbedTokenParams struct {
	ResourceType string           `json:"resource_type"`
	ResourceID   string           `json:"resource_id"`
	Participant  EmbedParticipant `json:"participant"`
	TTLSeconds   int              `json:"ttl_seconds,omitempty"`
}

// EmbedToken is a short-lived JWT for client embeds.
type EmbedToken struct {
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

// EmbedTokensService issues embed tokens.
type EmbedTokensService struct {
	client *Client
}

// Create issues an embed token for a room resource.
func (s *EmbedTokensService) Create(ctx context.Context, params *CreateEmbedTokenParams, opts ...RequestOption) (*EmbedToken, error) {
	cfg := applyRequestOptions(opts)
	var token EmbedToken
	if err := s.client.doJSON(ctx, "POST", "/api/v1/embed-tokens", params, cfg, &token); err != nil {
		return nil, err
	}
	return &token, nil
}
