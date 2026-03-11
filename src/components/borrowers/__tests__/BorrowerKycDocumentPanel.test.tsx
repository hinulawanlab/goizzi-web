import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CSSProperties } from "react";
import { vi } from "vitest";

import BorrowerKycDocumentPanel, { type KycDocumentEntry } from "@/components/borrowers/BorrowerKycDocumentPanel";

vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    height,
    src,
    style,
    width
  }: {
    alt?: string;
    className?: string;
    height?: number;
    src?: string;
    style?: CSSProperties;
    width?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      height={height}
      src={typeof src === "string" ? src : ""}
      style={style}
      width={width}
    />
  )
}));

vi.mock("@/components/borrowers/useKycImageLoader", () => ({
  useKycImageLoader: vi.fn()
}));

vi.mock("@/components/borrowers/BorrowerKycDecisionSection", () => ({
  default: () => <div data-testid="decision-section" />
}));

vi.mock("@/shared/singletons/firebase", () => ({
  auth: {
    currentUser: null
  }
}));

const { useKycImageLoader } = await import("@/components/borrowers/useKycImageLoader");

describe("BorrowerKycDocumentPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) } as unknown as Response))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the latest viewer rotation instead of resetting to the loaded image rotation", async () => {
    vi.mocked(useKycImageLoader).mockReturnValue({
      "kyc-1": {
        status: "success",
        urls: ["https://example.com/payslip.jpg"],
        items: [
          {
            url: "https://example.com/payslip.jpg",
            path: "borrowers/1/payslip.jpg",
            rotationDeg: 0
          }
        ]
      }
    });

    const entry: KycDocumentEntry = {
      borrowerId: "borrower-1",
      kycId: "kyc-1",
      documentType: "Payslip",
      storageRefs: ["borrowers/1/payslip.jpg"],
      createdAt: "2026-03-11T00:00:00.000Z"
    };

    const { rerender } = render(
      <BorrowerKycDocumentPanel
        borrowerId="borrower-1"
        applicationId="app-1"
        title="Income Source"
        sectionLabel="Source of income"
        decisionLabel="Income Source"
        emptyTitle="No records"
        emptyMessage="No records found."
        contextLabel="Income Source"
        kycs={[entry]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Payslip 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Rotate image" }));

    await waitFor(() => {
      const previewImage = screen.getAllByAltText("Payslip 1")[1];
      expect(previewImage).toHaveStyle({ transform: "scale(1) rotate(270deg)" });
    });

    rerender(
      <BorrowerKycDocumentPanel
        borrowerId="borrower-1"
        applicationId="app-1"
        title="Income Source"
        sectionLabel="Source of income"
        decisionLabel="Income Source"
        emptyTitle="No records"
        emptyMessage="No records found."
        contextLabel="Income Source"
        kycs={[entry]}
      />
    );

    await waitFor(() => {
      const previewImage = screen.getAllByAltText("Payslip 1")[1];
      expect(previewImage).toHaveStyle({ transform: "scale(1) rotate(270deg)" });
    });
  });
});
