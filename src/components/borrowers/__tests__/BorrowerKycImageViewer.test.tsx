import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CSSProperties } from "react";

import BorrowerKycImageViewer from "@/components/borrowers/BorrowerKycImageViewer";

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

describe("BorrowerKycImageViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies quarter-turn sizing when rotating an image before saving", () => {
    render(
      <BorrowerKycImageViewer
        images={[{ url: "https://example.com/payslip.jpg", alt: "Payslip 1", path: "borrowers/1/payslip.jpg" }]}
        initialIndex={0}
        rotationByUrl={{ "https://example.com/payslip.jpg": 0 }}
        onClose={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rotate image" }));

    const previewImage = screen.getByAltText("Payslip 1");
    expect(previewImage).toHaveStyle({
      maxWidth: "80vh",
      maxHeight: "calc(100vw - 8rem)",
      transform: "scale(1) rotate(270deg)"
    });
  });

  it("saves pending rotation changes when the user clicks save", async () => {
    const onSaveRotations = vi.fn(() => Promise.resolve());
    const onClose = vi.fn();

    render(
      <BorrowerKycImageViewer
        images={[{ url: "https://example.com/payslip.jpg", alt: "Payslip 1", path: "borrowers/1/payslip.jpg" }]}
        initialIndex={0}
        rotationByUrl={{ "https://example.com/payslip.jpg": 0 }}
        onSaveRotations={onSaveRotations}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rotate image" }));
    fireEvent.click(screen.getByRole("button", { name: "Save image rotation" }));

    await waitFor(() => {
      expect(onSaveRotations).toHaveBeenCalledWith([
        {
          imageUrl: "https://example.com/payslip.jpg",
          rotationDeg: 270,
          storagePath: "borrowers/1/payslip.jpg"
        }
      ]);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes without saving when the user clicks close", async () => {
    const onSaveRotations = vi.fn();
    const onClose = vi.fn();

    render(
      <BorrowerKycImageViewer
        images={[{ url: "https://example.com/payslip.jpg", alt: "Payslip 1", path: "borrowers/1/payslip.jpg" }]}
        initialIndex={0}
        rotationByUrl={{ "https://example.com/payslip.jpg": 0 }}
        onSaveRotations={onSaveRotations}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rotate image" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(onSaveRotations).not.toHaveBeenCalled();
  });
});
