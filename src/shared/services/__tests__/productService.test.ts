import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/singletons/firebaseAdmin", () => ({
  db: null,
  hasAdminCredentials: () => false
}));

import { clearLoanProductCache, getActiveLoanProducts } from "@/shared/services/productService";

describe("getActiveLoanProducts", () => {
  it("returns active demo products when admin credentials are missing", async () => {
    clearLoanProductCache();
    const products = await getActiveLoanProducts();

    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.isActive)).toBe(true);
  });
});
