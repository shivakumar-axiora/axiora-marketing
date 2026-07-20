"""Seed roles and an admin user.

Run with:  python -m app.db.seed
"""
import logging

from sqlalchemy import select

import app.models  # noqa: F401  populate metadata
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.enums import RoleName
from app.models.user import Role, User

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("seed")

ADMIN_EMAIL = "admin@axiora.com"
ADMIN_PASSWORD = "Admin@12345"


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Roles
        for rn in RoleName:
            if not db.execute(select(Role).where(Role.name == rn.value)).scalar_one_or_none():
                db.add(Role(name=rn.value, description=rn.value.replace("_", " ").title()))
        db.commit()

        admin_role = db.execute(select(Role).where(Role.name == RoleName.ADMIN.value)).scalar_one()

        admin = db.execute(select(User).where(User.email == ADMIN_EMAIL)).scalar_one_or_none()
        if not admin:
            admin = User(
                full_name="Axiora Admin", email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                role_id=admin_role.id, is_active=True, is_verified=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            log.info("Created admin %s / %s", ADMIN_EMAIL, ADMIN_PASSWORD)

        log.info("✅ Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
