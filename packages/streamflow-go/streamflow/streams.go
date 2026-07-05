package streamflow

import "context"

// StreamMode is the stream delivery mode.
type StreamMode string

const (
	StreamModeBroadcast StreamMode = "broadcast"
	StreamModeRoom      StreamMode = "room"
)

// StreamVisibility controls who can discover the stream.
type StreamVisibility string

const (
	StreamVisibilityPublic  StreamVisibility = "public"
	StreamVisibilityPrivate StreamVisibility = "private"
)

// CreateStreamParams are inputs for creating a stream.
type CreateStreamParams struct {
	Title               string           `json:"title"`
	Description         string           `json:"description,omitempty"`
	Mode                StreamMode       `json:"mode,omitempty"`
	Visibility          StreamVisibility `json:"visibility,omitempty"`
	IsPaid              bool             `json:"is_paid,omitempty"`
	Price               float64          `json:"price,omitempty"`
	Currency            string           `json:"currency,omitempty"`
	IsRecordingEnabled  bool             `json:"is_recording_enabled,omitempty"`
}

// Stream is a created stream resource.
type Stream struct {
	ID              string `json:"id"`
	UserID          string `json:"user_id"`
	Title           string `json:"title"`
	Status          string `json:"status"`
	StreamKey       string `json:"stream_key"`
	RTMPIngestURL   string `json:"rtmp_ingest_url"`
	PlaybackURL     string `json:"playback_url"`
	Mode            string `json:"mode"`
	Visibility      string `json:"visibility"`
	CreatedAt       string `json:"created_at"`
}

// StreamsService manages stream lifecycle.
type StreamsService struct {
	client *Client
}

// Create creates a new stream.
func (s *StreamsService) Create(ctx context.Context, params *CreateStreamParams, opts ...RequestOption) (*Stream, error) {
	cfg := applyRequestOptions(opts)
	var stream Stream
	if err := s.client.doJSON(ctx, "POST", "/api/v1/streams", params, cfg, &stream); err != nil {
		return nil, err
	}
	return &stream, nil
}

// Get fetches a stream by ID.
func (s *StreamsService) Get(ctx context.Context, id string) (*Stream, error) {
	var stream Stream
	if err := s.client.doJSON(ctx, "GET", "/api/v1/streams/"+id, nil, requestConfig{}, &stream); err != nil {
		return nil, err
	}
	return &stream, nil
}

// List returns host streams.
func (s *StreamsService) List(ctx context.Context) ([]Stream, error) {
	var resp struct {
		Data []Stream `json:"data"`
	}
	if err := s.client.doJSON(ctx, "GET", "/api/v1/streams", nil, requestConfig{}, &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}
