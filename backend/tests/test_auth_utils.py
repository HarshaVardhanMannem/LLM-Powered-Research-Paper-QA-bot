from jose import jwt

from backend.src.auth import utils as auth_utils


def test_hash_and_verify_password_round_trip():
    password = "super-secret"
    hashed = auth_utils.hash_password(password)

    assert hashed != password
    assert auth_utils.verify_password(password, hashed)
    assert not auth_utils.verify_password("wrong", hashed)


def test_create_access_token_includes_claims(monkeypatch):
    monkeypatch.setattr(auth_utils, "JWT_SECRET_KEY", "test-secret")
    monkeypatch.setattr(auth_utils, "JWT_ALGORITHM", "HS256")
    monkeypatch.setattr(auth_utils, "JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 5)

    token = auth_utils.create_access_token("user-1", {"role": "admin"})
    payload = jwt.decode(token, "test-secret", algorithms=["HS256"])

    assert payload["sub"] == "user-1"
    assert payload["role"] == "admin"
    assert "exp" in payload
