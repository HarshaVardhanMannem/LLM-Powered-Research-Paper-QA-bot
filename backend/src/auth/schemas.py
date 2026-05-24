"""Pydantic schemas for auth API."""

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Request body for user registration."""

    email: EmailStr
    password: str
    full_name: str | None = None


class UserResponse(BaseModel):
    """User data returned in API responses."""

    id: int
    email: str
    full_name: str | None
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Request body for login."""

    email: EmailStr
    password: str
