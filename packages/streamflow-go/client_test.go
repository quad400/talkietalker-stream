package streamflow_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/streamflow/streamflow-go/streamflow"
)

func TestCreateStream(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/streams" || r.Method != http.MethodPost {
			t.Fatalf("unexpected %s %s", r.Method, r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer sk_test_abc" {
			t.Fatalf("auth = %q", got)
		}
		if got := r.Header.Get("Idempotency-Key"); got != "idem-1" {
			t.Fatalf("idempotency = %q", got)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status":  201,
			"message": "stream created successfully",
			"data": map[string]any{
				"id":    "stream-123",
				"title": "Weekly standup",
				"mode":  "room",
			},
		})
	}))
	defer server.Close()

	client := streamflow.NewClient("sk_test_abc", streamflow.WithBaseURL(server.URL))
	stream, err := client.Streams().Create(context.Background(), &streamflow.CreateStreamParams{
		Title: "Weekly standup",
		Mode:  streamflow.StreamModeRoom,
	}, streamflow.WithIdempotencyKey("idem-1"))
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if stream.ID != "stream-123" {
		t.Fatalf("id = %q", stream.ID)
	}
}

func TestAPIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status":     429,
			"error":      "rate limited",
			"code":       "rate_limited",
			"request_id": "req_abc",
		})
	}))
	defer server.Close()

	client := streamflow.NewClient("sk_test_abc", streamflow.WithBaseURL(server.URL))
	_, err := client.Streams().Create(context.Background(), &streamflow.CreateStreamParams{Title: "x"})
	if err == nil {
		t.Fatal("expected error")
	}
	apiErr, ok := err.(*streamflow.APIError)
	if !ok {
		t.Fatalf("type %T", err)
	}
	if !apiErr.IsRateLimited() {
		t.Fatal("expected rate limited")
	}
	if apiErr.GetRequestID() != "req_abc" {
		t.Fatalf("request_id = %q", apiErr.GetRequestID())
	}
}
