"use client";

import { auth } from "@/shared/singletons/firebase";

export interface KycSignedImageItem {
  path: string;
  url: string;
}

export interface KycSignedImageResponse {
  urls: string[];
  items: KycSignedImageItem[];
}

async function getFirebaseIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    return await user.getIdToken();
  } catch (error) {
    console.warn("Unable to fetch Firebase ID token.", error);
    return null;
  }
}

export async function fetchSignedKycImageUrls(
  borrowerId: string,
  kycId: string,
  options?: { signal?: AbortSignal }
): Promise<KycSignedImageResponse> {
  const token = await getFirebaseIdToken();
  if (!token) {
    throw new Error("Missing staff authentication.");
  }

  const response = await fetch(`/api/borrowers/${borrowerId}/kyc/${kycId}/images`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal: options?.signal
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch KYC images (${response.status}).`);
  }

  const payload = (await response.json()) as { urls?: string[]; items?: KycSignedImageItem[] };
  const urls = Array.isArray(payload.urls) ? payload.urls.filter((url) => typeof url === "string") : [];
  const items = Array.isArray(payload.items)
    ? payload.items.filter(
        (item): item is KycSignedImageItem => Boolean(item && typeof item.path === "string" && typeof item.url === "string")
      )
    : [];

  return { urls, items };
}
