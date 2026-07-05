package streamflow

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type envelope struct {
	Status  int             `json:"status"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type errorBody struct {
	Status    int    `json:"status"`
	Error     any    `json:"error"`
	Code      string `json:"code"`
	RequestID string `json:"request_id"`
}

func (c *Client) doJSON(ctx context.Context, method, path string, body any, cfg requestConfig, out any) error {
	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(payload)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", c.authHeader(cfg))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if cfg.idempotencyKey != "" {
		req.Header.Set("Idempotency-Key", cfg.idempotencyKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		return parseAPIError(resp.StatusCode, raw, resp.Header.Get("X-Request-ID"))
	}

	if out == nil {
		return nil
	}

	var wrap envelope
	if err := json.Unmarshal(raw, &wrap); err == nil && wrap.Data != nil {
		return json.Unmarshal(wrap.Data, out)
	}
	return json.Unmarshal(raw, out)
}

func parseAPIError(status int, raw []byte, headerRequestID string) error {
	var body errorBody
	_ = json.Unmarshal(raw, &body)

	code := body.Code
	message := ""
	switch v := body.Error.(type) {
	case string:
		message = v
	case map[string]any:
		if c, ok := v["code"].(string); ok && code == "" {
			code = c
		}
		if m, ok := v["message"].(string); ok {
			message = m
		}
	}
	if message == "" {
		message = fmt.Sprintf("request failed with status %d", status)
	}
	requestID := body.RequestID
	if requestID == "" {
		requestID = headerRequestID
	}
	return &APIError{
		StatusCode: status,
		Code:       code,
		Message:    message,
		RequestID:  requestID,
	}
}
