"""
seed_admin.py — Create the first admin user.

Usage:
    cd backend
    python seed_admin.py

Run ONCE after database migrations are applied.
Username and password are read from .env (ADMIN_USERNAME / ADMIN_PASSWORD).
"""

import sys
import os

# Ensure backend directory is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Admin, Category
from models.admin import Admin
from services.auth_service import hash_password
from config import settings


def seed():
    db = SessionLocal()
    try:
        # ── Create admin if doesn't exist ─────────────────────
        existing = db.query(Admin).filter(Admin.username == settings.admin_username).first()
        if existing:
            print(f"[seed] Admin '{settings.admin_username}' already exists. Skipping.")
        else:
            admin = Admin(
                username=settings.admin_username,
                hashed_password=hash_password(settings.admin_password),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"[seed] Admin '{settings.admin_username}' created successfully.")

        # ── Seed default categories ───────────────────────────
        default_categories = [
            {"name": "Website",         "slug": "website"},
            {"name": "AI Agents",       "slug": "ai-agents"},
            {"name": "AI Automation",   "slug": "ai-automation"},
            {"name": "Machine Learning","slug": "machine-learning"},
            {"name": "Mobile Apps",     "slug": "mobile-apps"},
            {"name": "Python Projects", "slug": "python"},
        ]
        for cat_data in default_categories:
            from models.category import Category
            exists = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not exists:
                db.add(Category(name=cat_data["name"], slug=cat_data["slug"]))
                print(f"[seed] Category '{cat_data['name']}' created.")
            else:
                print(f"[seed] Category '{cat_data['name']}' already exists. Skipping.")

        db.commit()
        print("\n[seed] Done.")

    except Exception as e:
        db.rollback()
        print(f"[seed] Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
