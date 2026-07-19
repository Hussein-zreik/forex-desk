from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginOut(BaseModel):
    """Either a bearer token, or a 2FA challenge to finish at /auth/totp/verify."""

    access_token: str | None = None
    token_type: str = "bearer"
    totp_required: bool = False
    challenge_token: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    theme: str
    email_verified: bool = False
    totp_enabled: bool = False


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


class VerifyEmailIn(BaseModel):
    token: str


class AuthConfigOut(BaseModel):
    """Server capabilities the auth UI adapts to."""

    email_configured: bool


class TotpSetupOut(BaseModel):
    secret: str
    otpauth_url: str


class TotpCodeIn(BaseModel):
    code: str


class TotpVerifyIn(BaseModel):
    challenge_token: str
    code: str
