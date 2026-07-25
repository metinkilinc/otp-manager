package otpmanager

import "fmt"

// OtpManagerError represents a custom error returned by the OTP Manager service.
type OtpManagerError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
}

func (e *OtpManagerError) Error() string {
	return fmt.Sprintf("[%s] %s (HTTP %d)", e.Code, e.Message, e.StatusCode)
}
