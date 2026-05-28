import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Sidebar from "@/components/Sidebar";

const baseProps = {
  open: true,
  onClose: vi.fn(),
  papers: [{ id: "paper-1", title: "Paper One" }],
  onAddPaper: vi.fn().mockResolvedValue(undefined),
  onUploadPaper: vi.fn().mockResolvedValue(undefined),
  onDeletePaper: vi.fn().mockResolvedValue(undefined),
};

describe("Sidebar", () => {
  it("adds a paper by id", async () => {
    render(<Sidebar {...baseProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("e.g., 1706.03762"), "1706.03762");
    await user.click(screen.getByRole("button", { name: "Add Paper" }));

    expect(baseProps.onAddPaper).toHaveBeenCalledWith("1706.03762");
  });

  it("uploads a file", async () => {
    const { container } = render(<Sidebar {...baseProps} />);
    const user = userEvent.setup();
    const file = new File(["pdf"], "paper.pdf", { type: "application/pdf" });

    const fileInput = container.querySelector("input[type=\"file\"]") as HTMLInputElement;
    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(baseProps.onUploadPaper).toHaveBeenCalled();
  });

  it("deletes a paper", async () => {
    render(<Sidebar {...baseProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByTitle("Delete"));

    expect(baseProps.onDeletePaper).toHaveBeenCalledWith("paper-1");
  });
});
