"""Authentication endpoints: register, login, refresh, verify, reset, logout."""
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_purpose_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.enums import RoleName
from app.models.user import Role, User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    Token,
    TokenRefresh,
    VerifyEmailRequest,
)
from app.schemas.common import Message
from app.schemas.user import ProfileUpdate, UserOut
from app.services.activity import log_activity
from app.services.email import send_reset_email, send_verification_email
from app.services.storage import get_storage

router = APIRouter(prefix="/auth", tags=["auth"])

# Accepted avatar image types and max size (5 MB).
_AVATAR_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
_AVATAR_MAX_BYTES = 5 * 1024 * 1024


def _delete_avatar_file(avatar_url: str | None) -> None:
    """Remove a previously stored local avatar file, if any."""
    if avatar_url and avatar_url.startswith("/media/"):
        get_storage().delete(avatar_url.rsplit("/", 1)[-1])


def _tokens_for(user: User) -> Token:
    extra = {"role": user.role.name, "email": user.email}
    return Token(
        access_token=create_access_token(user.id, extra),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # First-ever user becomes Admin; subsequent self-registrations are Executives.
    user_count = db.execute(select(User.id)).first()
    role_name = RoleName.ADMIN.value if user_count is None else RoleName.EXECUTIVE.value
    role = db.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
    if not role:
        role = Role(name=role_name, description=role_name)
        db.add(role)
        db.flush()

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role_id=role.id,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_purpose_token(user.id, "verify")
    send_verification_email(user.email, token)
    log_activity(db, user_id=user.id, action="user_registered", entity="user", entity_id=user.id)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db), request: Request = None):
    """OAuth2 password flow (username field carries the email)."""
    user = db.execute(select(User).where(User.email == form.username)).scalar_one_or_none()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    log_activity(db, user_id=user.id, action="user_login", entity="user", entity_id=user.id,
                 ip_address=request.client.host if request and request.client else "")
    return _tokens_for(user)


@router.post("/login/json", response_model=Token)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    log_activity(db, user_id=user.id, action="user_login", entity="user", entity_id=user.id)
    return _tokens_for(user)


@router.post("/refresh", response_model=Token)
def refresh(payload: TokenRefresh, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.get(User, int(data["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return _tokens_for(user)


@router.post("/verify-email", response_model=Message)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.token)
    if not data or data.get("type") != "verify":
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.get(User, int(data["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    return Message(detail="Email verified successfully")


@router.post("/forgot-password", response_model=Message)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    # Always return success to avoid user enumeration.
    if user:
        token = create_purpose_token(user.id, "reset", minutes=60)
        send_reset_email(user.email, token)
    return Message(detail="If the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=Message)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.token)
    if not data or data.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.get(User, int(data["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    log_activity(db, user_id=user.id, action="password_reset", entity="user", entity_id=user.id)
    return Message(detail="Password reset successful")


@router.post("/change-password", response_model=Message)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return Message(detail="Password changed successfully")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update the current user's own profile details (name, phone)."""
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if value is not None:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    log_activity(db, user_id=user.id, action="profile_updated", entity="user", entity_id=user.id)
    return user


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload or replace the current user's profile picture."""
    if (file.content_type or "") not in _AVATAR_TYPES:
        raise HTTPException(status_code=400, detail="Avatar must be a JPEG, PNG, GIF or WebP image")
    contents = await file.read()
    if len(contents) > _AVATAR_MAX_BYTES:
        raise HTTPException(status_code=400, detail="Avatar must be 5 MB or smaller")

    import io

    storage = get_storage()
    stored, url, _ = storage.save(io.BytesIO(contents), file.filename or "avatar", "avatars")

    _delete_avatar_file(user.avatar_url)  # remove the previous picture, if any
    user.avatar_url = url
    db.commit()
    db.refresh(user)
    log_activity(db, user_id=user.id, action="avatar_updated", entity="user", entity_id=user.id)
    return user


@router.delete("/me/avatar", response_model=UserOut)
def delete_avatar(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Remove the current user's profile picture."""
    _delete_avatar_file(user.avatar_url)
    user.avatar_url = ""
    db.commit()
    db.refresh(user)
    log_activity(db, user_id=user.id, action="avatar_removed", entity="user", entity_id=user.id)
    return user


@router.post("/logout", response_model=Message)
def logout(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Stateless JWT: client discards tokens. We record the event for auditing.
    log_activity(db, user_id=user.id, action="user_logout", entity="user", entity_id=user.id)
    return Message(detail="Logged out")
