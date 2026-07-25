package otpmanager

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Client is the official Go SDK client for OTP Manager.
type Client struct {
	baseURL    string
	apiKey     string
	apiSecret  string
	httpClient *http.Client
}

// Option configures the OTP Manager Client.
type Option func(*Client)

// WithHTTPClient sets a custom http.Client.
func WithHTTPClient(httpClient *http.Client) Option {
	return func(c *Client) {
		c.httpClient = httpClient
	}
}

// NewClient initializes a new OTP Manager client.
func NewClient(baseURL, apiKey, apiSecret string, opts ...Option) (*Client, error) {
	if strings.TrimSpace(baseURL) == "" {
		return nil, fmt.Errorf("otpmanager: baseURL is required")
	}
	if strings.TrimSpace(apiKey) == "" {
		return nil, fmt.Errorf("otpmanager: apiKey is required")
	}
	if strings.TrimSpace(apiSecret) == "" {
		return nil, fmt.Errorf("otpmanager: apiSecret is required")
	}

	cleanURL := strings.TrimRight(baseURL, "/") + "/api/v1/totp"

	client := &Client{
		baseURL:   cleanURL,
		apiKey:    apiKey,
		apiSecret: apiSecret,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}

	for _, opt := range opts {
		opt(client)
	}

	return client, nil
}

// computeHMAC computes HMAC-SHA256 signature with key-sorted JSON body matching Node.js server spec.
func (c *Client) computeHMAC(body interface{}, timestamp string) (string, error) {
	var normalizedBody string
	if body != nil {
		bodyBytes, err := json.Marshal(body)
		if err != nil {
			return "", err
		}

		var rawMap map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &rawMap); err == nil && len(rawMap) > 0 {
			// json.Marshal on map in Go automatically sorts keys lexicographically
			sortedBytes, err := json.Marshal(rawMap)
			if err != nil {
				return "", err
			}
			normalizedBody = string(sortedBytes)
		} else {
			normalizedBody = "{}"
		}
	} else {
		normalizedBody = "{}"
	}

	payload := normalizedBody + timestamp
	h := hmac.New(sha256.New, []byte(c.apiSecret))
	h.Write([]byte(payload))
	return hex.EncodeToString(h.Sum(nil)), nil
}

func (c *Client) request(ctx context.Context, method, endpoint string, body interface{}, result interface{}) error {
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	signature, err := c.computeHMAC(body, timestamp)
	if err != nil {
		return fmt.Errorf("otpmanager: HMAC compute error: %w", err)
	}

	var reqBody io.Reader
	if body != nil && method != http.MethodGet {
		jsonBytes, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("otpmanager: marshal error: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBytes)
	}

	reqURL := c.baseURL + endpoint
	req, err := http.NewRequestWithContext(ctx, method, reqURL, reqBody)
	if err != nil {
		return fmt.Errorf("otpmanager: request creation error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("X-Signature", signature)
	req.Header.Set("X-Timestamp", timestamp)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return &OtpManagerError{
			Code:       "NETWORK_ERROR",
			Message:    err.Error(),
			StatusCode: 0,
		}
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("otpmanager: read body error: %w", err)
	}

	if resp.StatusCode >= 400 {
		var errResp struct {
			Error struct {
				Code    string `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}
		if err := json.Unmarshal(respBytes, &errResp); err == nil && errResp.Error.Code != "" {
			return &OtpManagerError{
				Code:       errResp.Error.Code,
				Message:    errResp.Error.Message,
				StatusCode: resp.StatusCode,
			}
		}
		return &OtpManagerError{
			Code:       "SERVER_ERROR",
			Message:    string(respBytes),
			StatusCode: resp.StatusCode,
		}
	}

	if result != nil {
		var envelope struct {
			Data json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(respBytes, &envelope); err == nil && len(envelope.Data) > 0 {
			return json.Unmarshal(envelope.Data, result)
		}
		return json.Unmarshal(respBytes, result)
	}

	return nil
}

// Enroll starts a new TOTP 2FA enrollment.
func (c *Client) Enroll(ctx context.Context, req EnrollRequest) (*EnrollResponse, error) {
	var res EnrollResponse
	if err := c.request(ctx, http.MethodPost, "/enroll", req, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// Verify verifies initial 2FA enrollment setup code.
func (c *Client) Verify(ctx context.Context, userID, code string) (*VerifyResponse, error) {
	req := map[string]string{"userId": userID, "code": code}
	var res VerifyResponse
	if err := c.request(ctx, http.MethodPost, "/verify", req, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// Validate validates a 6-digit TOTP code during login.
func (c *Client) Validate(ctx context.Context, userID, code string) (*ValidateResponse, error) {
	req := map[string]string{"userId": userID, "code": code}
	var res ValidateResponse
	if err := c.request(ctx, http.MethodPost, "/validate", req, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// GetStatus retrieves enrollment status for a user.
func (c *Client) GetStatus(ctx context.Context, userID string) (*StatusResponse, error) {
	var res StatusResponse
	endpoint := fmt.Sprintf("/status/%s", url.PathEscape(userID))
	if err := c.request(ctx, http.MethodGet, endpoint, nil, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// Disable disables 2FA for a user.
func (c *Client) Disable(ctx context.Context, userID string) error {
	req := map[string]string{"userId": userID}
	return c.request(ctx, http.MethodPost, "/disable", req, nil)
}

// Reset resets 2FA secret and generates a new QR code.
func (c *Client) Reset(ctx context.Context, userID string) (*EnrollResponse, error) {
	req := map[string]string{"userId": userID}
	var res EnrollResponse
	if err := c.request(ctx, http.MethodPost, "/reset", req, &res); err != nil {
		return nil, err
	}
	return &res, nil
}

// Recovery bypasses 2FA using a backup recovery code.
func (c *Client) Recovery(ctx context.Context, userID, recoveryCode string) (*RecoveryResponse, error) {
	req := RecoveryRequest{UserID: userID, RecoveryCode: recoveryCode}
	var res RecoveryResponse
	if err := c.request(ctx, http.MethodPost, "/recovery", req, &res); err != nil {
		return nil, err
	}
	return &res, nil
}
