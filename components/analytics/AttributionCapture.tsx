"use client";

import { useEffect } from "react";
import { captureAttributionFromUrl } from "@/lib/attribution";

export function AttributionCapture() {
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/dashboard")) return;
    captureAttributionFromUrl(window.location.search);
  }, []);

  return null;
}
