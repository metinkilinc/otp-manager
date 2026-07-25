package otpmanager

// EnrollRequest parameters for starting 2FA setup.
type EnrollRequest struct {
	UserID string `json:"userId"`
	Email  string `json:"email,omitempty"`
	Name   string `json:"name,omitempty"`
}

// EnrollResponse returns QR code and TOTP details.
type EnrollResponse struct {
	EnrollmentID  string   `json:"enrollmentId"`
	QRCodeDataURL string   `json:"qrCodeDataUrl"`
	OtpauthURL    string   `json:"otpauthUrl"`
	RecoveryCodes []string `json:"recoveryCodes,omitempty"`
	Message       string   `json:"message,omitempty"`
}

// VerifyRequest initial verification payload.
type VerifyRequest struct {
	UserID string `json:"userId"`
	Code   string `json:"code"`
}

// VerifyResponse verification status.
type VerifyResponse struct {
	Verified bool   `json:"verified"`
	Message  string `json:"message,omitempty"`
}

// ValidateRequest login TOTP verification payload.
type ValidateRequest struct {
	UserID string `json:"userId"`
	Code   string `json:"code"`
}

// ValidateResponse validation result.
type ValidateResponse struct {
	Valid             bool `json:"valid"`
	RemainingAttempts *int `json:"remainingAttempts,omitempty"`
}

// StatusResponse user 2FA status.
type StatusResponse struct {
	Enrolled   bool    `json:"enrolled"`
	Enabled    bool    `json:"enabled"`
	Verified   bool    `json:"verified"`
	LastUsedAt *string `json:"lastUsedAt,omitempty"`
}

// RecoveryRequest recovery code payload.
type RecoveryRequest struct {
	UserID       string `json:"userId"`
	RecoveryCode string `json:"recoveryCode"`
}

// RecoveryResponse recovery result.
type RecoveryResponse struct {
	Valid                  bool   `json:"valid"`
	RemainingRecoveryCodes int    `json:"remainingRecoveryCodes"`
	Message                string `json:"message,omitempty"`
}

// APIResponse generic wrapper.
type APIResponse[T any] struct {
	Success bool               `json:"success"`
	Data    T                  `json:"data"`
	Error   *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}
