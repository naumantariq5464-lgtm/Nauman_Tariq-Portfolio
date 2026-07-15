"""
setup.py — One-time setup script.
Run this ONCE to:
  1. Test database connection
  2. Create all tables (via SQLAlchemy directly — no alembic needed for dev)
  3. Create admin user
  4. Seed default categories

Usage:
    cd backend
    venv\Scripts\activate
    python setup.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, test_connection, Base
from config import settings
from services.auth_service import hash_password

# Import all models so Base knows about them
from models.admin import Admin
from models.category import Category
from models.project import Project
from models.message import Message


def run_setup():
    print("\n" + "="*50)
    print("  Nauman Tariq Portfolio — Backend Setup")
    print("="*50)

    # Step 1: Test DB connection
    print("\n[1/4] Testing database connection...")
    if not test_connection():
        print("  ✗ Database connection FAILED")
        print("  Check your DATABASE_URL in .env")
        sys.exit(1)
    print("  ✓ Database connected successfully")

    # Step 2: Create all tables
    print("\n[2/4] Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("  ✓ Tables created: admins, categories, projects, messages")
    except Exception as e:
        print(f"  ✗ Failed to create tables: {e}")
        sys.exit(1)

    db = SessionLocal()
    try:
        # Step 3: Create admin user
        print("\n[3/4] Creating admin user...")
        existing_admin = db.query(Admin).filter(
            Admin.username == settings.admin_username
        ).first()

        if existing_admin:
            print(f"  ✓ Admin '{settings.admin_username}' already exists — skipping")
        else:
            admin = Admin(
                username=settings.admin_username,
                hashed_password=hash_password(settings.admin_password),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"  ✓ Admin '{settings.admin_username}' created")
            print(f"  ✓ Password set from .env ADMIN_PASSWORD")

        # Step 4: Seed default categories
        print("\n[4/4] Seeding default categories...")
        default_categories = [
            {"name": "Website",          "slug": "website"},
            {"name": "AI Agents",        "slug": "ai-agents"},
            {"name": "AI Automation",    "slug": "ai-automation"},
            {"name": "Machine Learning", "slug": "machine-learning"},
            {"name": "Mobile Apps",      "slug": "mobile-apps"},
            {"name": "Python Projects",  "slug": "python"},
        ]

        for cat_data in default_categories:
            exists = db.query(Category).filter(
                Category.slug == cat_data["slug"]
            ).first()
            if not exists:
                db.add(Category(name=cat_data["name"], slug=cat_data["slug"]))
                print(f"  ✓ Category '{cat_data['name']}' created")
            else:
                print(f"  - Category '{cat_data['name']}' already exists")

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"\n  ✗ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

    print("\n" + "="*50)
    print("  ✓ Setup complete!")
    print(f"  Admin username : {settings.admin_username}")
    print(f"  Admin password : (from .env ADMIN_PASSWORD)")
    print(f"\n  Now run: uvicorn main:app --reload")
    print("="*50 + "\n")


if __name__ == "__main__":
    run_setup()
