"""PostgreSQL-backed conversation history storage."""

from sqlalchemy.orm import Session

from backend.src.db.models import ConversationMessage


def save_conversation_turn(
    db: Session,
    user_id: int,
    user_message: str,
    assistant_message: str,
) -> None:
    """Save one user question and assistant answer to the conversation history."""
    user_msg = ConversationMessage(
        user_id=user_id,
        role="user",
        content=user_message,
    )
    assistant_msg = ConversationMessage(
        user_id=user_id,
        role="assistant",
        content=assistant_message,
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()


def get_recent_conversation_history(
    db: Session,
    user_id: int,
    limit: int = 10,
) -> list[tuple[str, str]]:
    """Get recent (role, content) pairs for a user, newest last."""
    rows = (
        db.query(ConversationMessage.role, ConversationMessage.content)
        .filter(ConversationMessage.user_id == user_id)
        .order_by(ConversationMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return [(r, c) for r, c in rows]
