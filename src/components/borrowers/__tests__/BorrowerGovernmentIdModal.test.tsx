import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CSSProperties } from "react";

import BorrowerGovernmentIdModal from "@/components/borrowers/BorrowerGovernmentIdModal";

vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    fill,
    height,
    src,
    style,
    width
  }: {
    alt?: string;
    className?: string;
    fill?: boolean;
    height?: number;
    src?: string;
    style?: CSSProperties;
    width?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      data-fill={fill ? "true" : "false"}
      height={height}
      src={typeof src === "string" ? src : ""}
      style={style}
      width={width}
    />
  )
}));

vi.mock("@/shared/services/kycImageService", () => ({
  fetchSignedKycImageUrls: vi.fn()
}));

const { fetchSignedKycImageUrls } = await import("@/shared/services/kycImageService");

describe("BorrowerGovernmentIdModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchSignedKycImageUrls).mockResolvedValue({
      urls: ["https://example.com/front.jpg"],
      items: [{ path: "borrowers/1/kyc/1/governmentIdFront.jpg", url: "https://example.com/front.jpg" }]
    });
  });

  it("disables Approve when the current government ID is already approved", async () => {
    render(
      <BorrowerGovernmentIdModal
        borrowerName="Test Borrower"
        kycs={[
          {
            borrowerId: "borrower-1",
            kycId: "kyc-1",
            frontStorageRef: "borrowers/1/kyc/1/governmentIdFront.jpg",
            isApproved: true,
            createdAt: "2026-03-11T00:00:00.000Z"
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View ID cards" }));

    await waitFor(() => {
      expect(fetchSignedKycImageUrls).toHaveBeenCalledWith("borrower-1", "kyc-1");
    });

    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeEnabled();
  });
});
