"use client";

import { render, screen } from "@testing-library/react";

import BorrowerApplicationHeaderSection from "@/components/borrowers/BorrowerApplicationHeaderSection";

describe("BorrowerApplicationHeaderSection", () => {
  it("renders the header and tabs", () => {
    render(
      <BorrowerApplicationHeaderSection activeTab="maker" loanStatus="Reviewed" onTabChange={() => undefined} />
    );

    expect(screen.getByText("Application details")).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    expect(screen.getByText("Maker")).toBeInTheDocument();
    expect(screen.getByText("Audit")).toBeInTheDocument();
  });
});
