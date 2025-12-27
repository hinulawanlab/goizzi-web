"use client";

import { useEffect, useRef, useState } from "react";

import { fetchSignedKycImageUrls } from "@/shared/services/kycImageService";

type LoadState = "idle" | "loading" | "success" | "error";

const DEFAULT_FETCH_TIMEOUT_MS = 10000;

interface KycImageState {
  status: LoadState;
  urls: string[];
  errorMessage?: string;
  startedAt?: number;
  attempts?: number;
}

interface KycImageSource {
  kycId: string;
  storageRefs?: string[];
  imageUrls?: string[];
}

interface UseKycImageLoaderOptions {
  fetchTimeoutMs?: number;
  contextLabel?: string;
}

function normalizeStoragePath(path?: string): string | null {
  if (!path) {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/^\/+/, "");
}

function isTimeoutError(error: unknown) {
  if (!error) {
    return false;
  }
  if (typeof error === "string") {
    return error === "timeout";
  }
  if (typeof error === "object" && "name" in error) {
    const name = (error as { name?: string }).name;
    return name === "TimeoutError" || name === "AbortError";
  }
  return false;
}

async function fetchKycImageUrls(
  borrowerId: string,
  kycId: string,
  fetchTimeoutMs: number,
  attempts = 2
): Promise<string[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, fetchTimeoutMs);

      const { urls } = await fetchSignedKycImageUrls(borrowerId, kycId, { signal: controller.signal });
      clearTimeout(timeoutId);

      return urls;
    } catch (error) {
      lastError = error;
      if (isTimeoutError(error) && attempt < attempts) {
        console.warn("KYC image download timed out; retrying.", {
          borrowerId,
          kycId,
          attempt,
          attempts
        });
        continue;
      }
      break;
    }
  }
  throw lastError;
}

export function useKycImageLoader(
  borrowerId: string,
  kycs: KycImageSource[],
  options: UseKycImageLoaderOptions = {}
) {
  const fetchTimeoutMs = options.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const [imageStates, setImageStates] = useState<Record<string, KycImageState>>({});
  const imageStatesRef = useRef(imageStates);
  const isMountedRef = useRef(true);
  const contextLabel = options.contextLabel ?? "KYC image";

  useEffect(() => {
    imageStatesRef.current = imageStates;
  }, [imageStates]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    kycs.forEach((kyc) => {
      const refs = kyc.storageRefs ?? [];
      const currentState = imageStatesRef.current[kyc.kycId];
      if (currentState?.status === "success" || currentState?.status === "error") {
        return;
      }
      if (currentState?.status === "loading") {
        const startedAt = currentState.startedAt ?? 0;
        const elapsedMs = startedAt ? Date.now() - startedAt : 0;
        if (elapsedMs && elapsedMs < fetchTimeoutMs) {
          return;
        }
        console.warn(`${contextLabel} load stalled; retrying.`, {
          borrowerId,
          kycId: kyc.kycId,
          elapsedMs
        });
      }

      if (!refs.length) {
        setImageStates((prev) => ({
          ...prev,
          [kyc.kycId]: { status: "success", urls: [] }
        }));
        return;
      }

      if (Array.isArray(kyc.imageUrls) && kyc.imageUrls.length > 0) {
        setImageStates((prev) => ({
          ...prev,
          [kyc.kycId]: { status: "success", urls: kyc.imageUrls ?? [] }
        }));
        return;
      }

      setImageStates((prev) => ({
        ...prev,
        [kyc.kycId]: {
          status: "loading",
          urls: [],
          startedAt: Date.now(),
          attempts: (prev[kyc.kycId]?.attempts ?? 0) + 1
        }
      }));

      const normalizedRefs = refs.map(normalizeStoragePath).filter(Boolean) as string[];
      if (!normalizedRefs.length) {
        setImageStates((prev) => ({
          ...prev,
          [kyc.kycId]: { status: "error", urls: [], errorMessage: "No valid storage paths." }
        }));
        return;
      }

      const timeoutId = window.setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        const current = imageStatesRef.current[kyc.kycId];
        if (current?.status === "loading") {
          console.warn(`${contextLabel} load still pending.`, {
            borrowerId,
            kycId: kyc.kycId,
            pendingMs: fetchTimeoutMs
          });
        }
      }, fetchTimeoutMs);

      fetchKycImageUrls(borrowerId, kyc.kycId, fetchTimeoutMs)
        .then((urls) => {
          if (!isMountedRef.current) {
            return;
          }
          window.clearTimeout(timeoutId);
          if (!urls.length) {
            setImageStates((prev) => ({
              ...prev,
              [kyc.kycId]: { status: "error", urls: [], errorMessage: "Images could not be loaded." }
            }));
            return;
          }

          setImageStates((prev) => ({
            ...prev,
            [kyc.kycId]: { status: "success", urls }
          }));
        })
        .catch((error) => {
          if (!isMountedRef.current) {
            return;
          }
          window.clearTimeout(timeoutId);
          console.warn(`${contextLabel} load error.`, { borrowerId, kycId: kyc.kycId, error });
          setImageStates((prev) => ({
            ...prev,
            [kyc.kycId]: { status: "error", urls: [], errorMessage: "Images could not be loaded." }
          }));
        });
    });
  }, [borrowerId, kycs, contextLabel, fetchTimeoutMs]);

  return imageStates;
}
