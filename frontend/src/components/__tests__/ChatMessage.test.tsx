import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatMessage from "@/components/ChatMessage";

vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: React.ReactNode }) => <pre>{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  vscDarkPlus: {},
}));

describe("ChatMessage", () => {
  it("sends feedback for assistant messages", async () => {
    const onFeedback = vi.fn();
    const messages = [
      { role: "user", content: "Question" },
      { role: "assistant", content: "Answer" },
    ];

    render(
      <ChatMessage
        message={messages[1]}
        index={1}
        messages={messages}
        onFeedback={onFeedback}
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTitle("Helpful"));

    expect(onFeedback).toHaveBeenCalledWith("Question", "Answer", "like");
  });

  it("hides feedback for user messages", () => {
    const onFeedback = vi.fn();
    const messages = [{ role: "user", content: "Question" }];

    render(
      <ChatMessage
        message={messages[0]}
        index={0}
        messages={messages}
        onFeedback={onFeedback}
      />
    );

    expect(screen.queryByTitle("Helpful")).toBeNull();
  });
});
