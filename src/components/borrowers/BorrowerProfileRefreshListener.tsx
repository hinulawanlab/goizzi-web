"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MESSAGE_TYPE = "borrower-profile-refresh";

export default function BorrowerProfileRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const payload = event.data;
      if (!payload || typeof payload !== "object") {
        return;
      }

      if ("type" in payload && payload.type === REFRESH_MESSAGE_TYPE) {
        router.refresh();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return null;
}
