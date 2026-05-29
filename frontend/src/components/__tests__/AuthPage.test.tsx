import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "@/components/AuthPage";

const loginMock = vi.fn();
const registerMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
    register: registerMock,
  }),
}));

describe("AuthPage", () => {
  const getSubmitButton = (name: string) => {
    const buttons = screen.getAllByRole("button", { name });
    const submitButton = buttons.find(
      (button) => (button as HTMLButtonElement).type === "submit"
    );
    if (!submitButton) {
      throw new Error(`Submit button "${name}" not found`);
    }
    return submitButton;
  };

  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
    loginMock.mockResolvedValue(undefined);
    registerMock.mockResolvedValue(undefined);
  });

  it("submits login credentials", async () => {
    render(<AuthPage />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Email address"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(getSubmitButton("Sign In"));

    expect(loginMock).toHaveBeenCalledWith("user@example.com", "secret123");
  });

  it("switches to register and submits", async () => {
    render(<AuthPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Create Account" }));
    await user.type(screen.getByPlaceholderText("Full Name (optional)"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("Email address"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret12");
    await user.click(getSubmitButton("Create Account"));

    expect(registerMock).toHaveBeenCalledWith("ada@example.com", "secret12", "Ada Lovelace");
  });
});
