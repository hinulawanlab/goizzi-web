"use client";

import { useEffect } from "react";

interface PrintOnLoadProps {
  delayMs?: number;
}

export default function PrintOnLoad({ delayMs = 300 }: PrintOnLoadProps) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.print();
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [delayMs]);

  return null;
}
