package streamflow

import "fmt"

// APIError is a typed StreamFlow API error.
type APIError struct {
	StatusCode int
	Code       string
	Message    string
	RequestID  string
}

func (e *APIError) Error() string {
	if e.RequestID != "" {
		return fmt.Sprintf("%s (request_id: %s)", e.Message, e.RequestID)
	}
	return e.Message
}

// GetRequestID returns the API request ID for support tickets.
func (e *APIError) GetRequestID() string { return e.RequestID }

func (e *APIError) IsRateLimited() bool { return e.StatusCode == 429 || e.Code == "rate_limited" }

func (e *APIError) IsValidation() bool { return e.StatusCode == 400 || e.Code == "validation_error" }

func (e *APIError) IsNotFound() bool { return e.StatusCode == 404 || e.Code == "not_found" }

func (e *APIError) IsUnauthorized() bool { return e.StatusCode == 401 || e.Code == "unauthorized" }
