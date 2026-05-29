import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KBSelector from "@/components/KBSelector";

const knowledgeBases = [
  { id: 1, name: "Physics", description: null, domain: "physics", owner_id: 1, is_system: false, chunking_strategy: "default", document_count: 3 },
  { id: 2, name: "Math", description: null, domain: "math", owner_id: 1, is_system: false, chunking_strategy: "default", document_count: 5 },
];

describe("KBSelector", () => {
  it("selects a knowledge base", async () => {
    const onChange = vi.fn();
    render(
      <KBSelector knowledgeBases={knowledgeBases} selectedIds={[]} onChange={onChange} />
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "My Papers" }));
    await user.click(screen.getByText("Physics"));

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("clears selection when choosing My Papers", async () => {
    const onChange = vi.fn();
    render(
      <KBSelector knowledgeBases={knowledgeBases} selectedIds={[1]} onChange={onChange} />
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Physics" }));
    await user.click(screen.getByRole("button", { name: "My Papers" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
