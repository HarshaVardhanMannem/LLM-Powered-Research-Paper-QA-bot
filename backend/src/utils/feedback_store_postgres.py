"""PostgreSQL-backed feedback storage for the QA system."""

from typing import Optional

from sqlalchemy.orm import Session

from src.db.models import Feedback, User


class FeedbackStorePostgres:
    """Stores user feedback in PostgreSQL."""

    def save_feedback(
        self,
        question: str,
        answer: str,
        feedback_type: str,
        db: Session,
        user_id: Optional[int] = None,
    ) -> None:
        """Save user feedback for a QA interaction."""
        entry = Feedback(
            user_id=user_id,
            question=question,
            answer=answer,
            feedback_type=feedback_type,
        )
        db.add(entry)
        db.commit()

    def get_feedback_stats(
        self, db: Session, user_id: Optional[int] = None
    ) -> dict[str, int]:
        """Get feedback counts. If user_id is set, filter by user."""
        from sqlalchemy import func

        q = (
            db.query(Feedback.feedback_type, func.count(Feedback.id))
            .filter(Feedback.feedback_type.in_(["like", "dislike"]))
            .group_by(Feedback.feedback_type)
        )
        if user_id is not None:
            q = q.filter(Feedback.user_id == user_id)
        rows = q.all()
        stats = {"likes": 0, "dislikes": 0}
        for feedback_type, count in rows:
            if feedback_type == "like":
                stats["likes"] = count
            elif feedback_type == "dislike":
                stats["dislikes"] = count
        return stats
