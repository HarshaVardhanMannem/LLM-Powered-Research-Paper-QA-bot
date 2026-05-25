"""Database session and engine for PostgreSQL."""

from typing import Generator

from backend.config.postgres import get_postgres_config
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.src.db.models import Base


def get_engine():
    """Create SQLAlchemy engine from PostgreSQL config."""
    config = get_postgres_config()
    return create_engine(
        config.url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={"connect_timeout": 10, "options": "-c statement_timeout=30000"},
    )


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables in the database."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.error(
            f"Failed to initialize database: {e}\n"
            f"Please ensure PostgreSQL is running and credentials in .env are correct.\n"
            f"To start PostgreSQL with Docker: cd docker/postgres && docker-compose up -d"
        )
        raise


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
