import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsPanel from "@/components/StatsPanel";

describe("StatsPanel", () => {
  it("renders provided stats", () => {
    render(
      <StatsPanel totalPapers={4} totalQuestions={7} likes={3} dislikes={1} />
    );

    expect(screen.getByText("Papers")).toBeInTheDocument();
    expect(screen.getByText("Questions")).toBeInTheDocument();
    expect(screen.getByText("Positive")).toBeInTheDocument();
    expect(screen.getByText("Negative")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
