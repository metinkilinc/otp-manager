import hmac
import hashlib
import json
import time
from typing import Optional, Dict, Any, Union
import requests

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

from .errors import OTPError


def compute_hmac(body: dict, timestamp: str, secret: str) -> str:
    """Computes HMAC-SHA256 signature matching OTP Manager Node.js server specification."""
    if body:
        sorted_body = dict(sorted(body.items()))
        normalized_body = json.dumps(sorted_body, separators=(',', ':'))
    else:
        normalized_body = "{}"

    payload = (normalized_body + timestamp).encode('utf-8')
    return hmac.new(secret.encode('utf-8'), payload, hashlib.sha256).hexdigest()


class OTPClient:
    """Synchronous OTP Manager SDK Client using requests."""

    def __init__(self, base_url: str, api_key: str, api_secret: str, timeout: int = 10):
        if not base_url:
            raise ValueError("OTPClient: base_url is required")
        if not api_key:
            raise ValueError("OTPClient: api_key is required")
        if not api_secret:
            raise ValueError("OTPClient: api_secret is required")

        self.base_url = base_url.rstrip('/') + '/api/v1/totp'
        self.api_key = api_key
        self.api_secret = api_secret
        self.timeout = timeout
        self.session = requests.Session()

    def _headers(self, body: dict, timestamp: str) -> dict:
        signature = compute_hmac(body, timestamp, self.api_secret)
        return {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key,
            'X-Signature': signature,
            'X-Timestamp': timestamp,
        }

    def _request(self, method: str, endpoint: str, body: Optional[dict] = None) -> dict:
        body_data = body or {}
        timestamp = str(int(time.time()))
        headers = self._headers(body_data, timestamp)
        url = f"{self.base_url}{endpoint}"

        try:
            res = self.session.request(
                method=method,
                url=url,
                json=body_data if body_data else None,
                headers=headers,
                timeout=self.timeout
            )
            data = res.json()
            if not res.ok:
                err_data = data.get('error', {})
                raise OTPError(
                    code=err_data.get('code', 'SERVER_ERROR'),
                    message=err_data.get('message', 'An error occurred'),
                    status_code=res.status_code
                )
            return data.get('data', {})
        except requests.RequestException as e:
            if isinstance(e, requests.HTTPError) and e.response is not None:
                try:
                    err_data = e.response.json().get('error', {})
                    raise OTPError(
                        code=err_data.get('code', 'HTTP_ERROR'),
                        message=err_data.get('message', str(e)),
                        status_code=e.response.status_code
                    )
                except Exception:
                    pass
            raise OTPError(code='NETWORK_ERROR', message=str(e), status_code=0)

    def enroll(self, user_id: str, email: Optional[str] = None, name: Optional[str] = None) -> dict:
        """Starts a new TOTP 2FA enrollment."""
        payload = {'userId': user_id}
        if email:
            payload['email'] = email
        if name:
            payload['name'] = name
        return self._request('POST', '/enroll', payload)

    def verify(self, user_id: str, token: str) -> dict:
        """Verifies initial 2FA enrollment setup code."""
        return self._request('POST', '/verify', {'userId': user_id, 'code': token})

    def validate(self, user_id: str, token: str) -> dict:
        """Validates a 6-digit TOTP code during login."""
        return self._request('POST', '/validate', {'userId': user_id, 'code': token})

    def get_status(self, user_id: str) -> dict:
        """Gets enrollment status for a user."""
        return self._request('GET', f'/status/{user_id}')

    def getStatus(self, user_id: str) -> dict:
        """Alias for get_status."""
        return self.get_status(user_id)

    def disable(self, user_id: str) -> dict:
        """Disables 2FA for a user."""
        return self._request('POST', '/disable', {'userId': user_id})

    def reset(self, user_id: str) -> dict:
        """Resets 2FA secret and generates a new QR code."""
        return self._request('POST', '/reset', {'userId': user_id})

    def recovery(self, user_id: str, recovery_code: str) -> dict:
        """Bypasses 2FA using a backup recovery code."""
        return self._request('POST', '/recovery', {'userId': user_id, 'recoveryCode': recovery_code})


class AsyncOTPClient:
    """Asynchronous OTP Manager SDK Client using httpx."""

    def __init__(self, base_url: str, api_key: str, api_secret: str, timeout: int = 10):
        if not HAS_HTTPX:
            raise ImportError("httpx is required for AsyncOTPClient. Install with: pip install httpx")
        if not base_url:
            raise ValueError("AsyncOTPClient: base_url is required")
        if not api_key:
            raise ValueError("AsyncOTPClient: api_key is required")
        if not api_secret:
            raise ValueError("AsyncOTPClient: api_secret is required")

        self.base_url = base_url.rstrip('/') + '/api/v1/totp'
        self.api_key = api_key
        self.api_secret = api_secret
        self.timeout = timeout

    async def _request(self, method: str, endpoint: str, body: Optional[dict] = None) -> dict:
        body_data = body or {}
        timestamp = str(int(time.time()))
        signature = compute_hmac(body_data, timestamp, self.api_secret)
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key,
            'X-Signature': signature,
            'X-Timestamp': timestamp,
        }
        url = f"{self.base_url}{endpoint}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                res = await client.request(
                    method=method,
                    url=url,
                    json=body_data if body_data else None,
                    headers=headers
                )
                data = res.json()
                if res.status_code >= 400:
                    err_data = data.get('error', {})
                    raise OTPError(
                        code=err_data.get('code', 'SERVER_ERROR'),
                        message=err_data.get('message', 'An error occurred'),
                        status_code=res.status_code
                    )
                return data.get('data', {})
            except httpx.HTTPError as e:
                raise OTPError(code='NETWORK_ERROR', message=str(e), status_code=0)

    async def enroll(self, user_id: str, email: Optional[str] = None, name: Optional[str] = None) -> dict:
        payload = {'userId': user_id}
        if email:
            payload['email'] = email
        if name:
            payload['name'] = name
        return await self._request('POST', '/enroll', payload)

    async def verify(self, user_id: str, token: str) -> dict:
        return await self._request('POST', '/verify', {'userId': user_id, 'code': token})

    async def validate(self, user_id: str, token: str) -> dict:
        return await self._request('POST', '/validate', {'userId': user_id, 'code': token})

    async def get_status(self, user_id: str) -> dict:
        return await self._request('GET', f'/status/{user_id}')

    async def getStatus(self, user_id: str) -> dict:
        return await self.get_status(user_id)

    async def disable(self, user_id: str) -> dict:
        return await self._request('POST', '/disable', {'userId': user_id})

    async def reset(self, user_id: str) -> dict:
        return await self._request('POST', '/reset', {'userId': user_id})

    async def recovery(self, user_id: str, recovery_code: str) -> dict:
        return await self._request('POST', '/recovery', {'userId': user_id, 'recoveryCode': recovery_code})
