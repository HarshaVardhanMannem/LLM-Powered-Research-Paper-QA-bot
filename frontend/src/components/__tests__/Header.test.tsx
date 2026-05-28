import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/Header";

describe("Header", () => {
  it("opens menu and signs out", async () => {
    const onMenuClick = vi.fn();
    const onLogout = vi.fn();
    render(
      <Header
        user={{ id: 1, email: "jane@example.com", full_name: "Jane Doe" }}
        onMenuClick={onMenuClick}
        onLogout={onLogout}
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Jane Doe/i }));
    await user.click(screen.getByRole("button", { name: /Sign Out/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
