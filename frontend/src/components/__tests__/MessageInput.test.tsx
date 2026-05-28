import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageInput from "@/components/MessageInput";

describe("MessageInput", () => {
  it("sends on Enter", async () => {
    const onSend = vi.fn();
    const onChange = vi.fn();
    render(
      <MessageInput value="Hello" onChange={onChange} onSend={onSend} loading={false} />
    );
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(
        "Ask about your research papers... (Enter to send, Shift+Enter for new line)"
      ),
      "{enter}"
    );

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("does not send on Shift+Enter", async () => {
    const onSend = vi.fn();
    const onChange = vi.fn();
    render(
      <MessageInput value="Hello" onChange={onChange} onSend={onSend} loading={false} />
    );
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(
        "Ask about your research papers... (Enter to send, Shift+Enter for new line)"
      ),
      "{shift>}{enter}{/shift}"
    );

    expect(onSend).not.toHaveBeenCalled();
  });
});
