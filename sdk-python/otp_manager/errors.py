class OTPError(Exception):
    """OTP Manager API error class."""

    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(f"[{code}] {message} (HTTP {status_code})")
        self.code = code
        self.message = message
        self.status_code = status_code

    def __repr__(self):
        return f"<OTPError code='{self.code}' status={self.status_code} message='{self.message}'>"
