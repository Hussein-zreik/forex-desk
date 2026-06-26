import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.services.yahoo import validate_symbol


def test_default_jwt_secret_rejected_outside_dev():
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="dev-secret-change-me")


def test_real_secret_allowed_outside_dev():
    s = Settings(environment="production", jwt_secret="a-real-secret")
    assert s.jwt_secret == "a-real-secret"


def test_dev_allows_default_secret():
    # dev must boot even with the committed default secret
    s = Settings(environment="dev", jwt_secret="dev-secret-change-me")
    assert s.environment == "dev"


def test_validate_symbol_accepts_real_tickers():
    for sym in ("XAU=F", "DX-Y.NYB", "^GSPC", "BTC-USD", "EURUSD=X"):
        assert validate_symbol(sym) == sym


def test_validate_symbol_rejects_junk():
    for bad in ("../etc/passwd", "evil.com/x", "a b", "x" * 30, "EURUSD=X;rm"):
        with pytest.raises(ValueError):
            validate_symbol(bad)


def test_quotes_endpoint_rejects_bad_symbol(client):
    body = client.get("/api/quotes", params={"symbols": "../bad"}).json()
    assert body["quotes"][0]["error"] == "unavailable"
