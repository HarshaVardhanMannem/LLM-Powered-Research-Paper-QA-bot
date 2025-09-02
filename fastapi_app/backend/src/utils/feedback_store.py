"""Feedback storage utilities for the QA system."""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional


class FeedbackStore:
    """Stores user feedback for QA responses."""

    def __init__(self, storage_path: str = "feedback_data"):
        """Initialize the feedback store.

        Args:
            storage_path: Directory to store feedback data
        """
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
        self.feedback_file = os.path.join(storage_path, "feedback.json")

        # Initialize feedback file if it doesn't exist
        if not os.path.exists(self.feedback_file):
            with open(self.feedback_file, "w") as f:
                json.dump([], f)

    def save_feedback(self, question: str, answer: str, feedback: str) -> None:
        """Save user feedback for a QA interaction.

        Args:
            question: The user's question
            answer: The system's answer
            feedback: User feedback ('like' or 'dislike')
        """
        feedback_entry = {
            "timestamp": datetime.now().isoformat(),
            "question": question,
            "answer": answer,
            "feedback": feedback,
        }

        # Read existing feedback
        with open(self.feedback_file, "r") as f:
            feedback_data = json.load(f)

        # Append new feedback
        feedback_data.append(feedback_entry)

        # Write back to file
        with open(self.feedback_file, "w") as f:
            json.dump(feedback_data, f, indent=2)

    def get_feedback_stats(self) -> Dict[str, int]:
        """Get statistics about feedback.

        Returns:
            Dictionary with counts of likes and dislikes
        """
        with open(self.feedback_file, "r") as f:
            feedback_data = json.load(f)

        stats = {"likes": 0, "dislikes": 0}
        for entry in feedback_data:
            if entry["feedback"] == "like":
                stats["likes"] += 1
            elif entry["feedback"] == "dislike":
                stats["dislikes"] += 1

        return stats
