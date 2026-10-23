"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    trackAuroraEvent?: (event: string, metadata?: Record<string, unknown>) => void;
  }
}

export function TelemetryTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Generate or get session ID
    let sessionId = "sess_anon";
    try {
      sessionId = sessionStorage.getItem("aurora_session_id") || "";
      if (!sessionId) {
        sessionId = "sess_" + Math.random().toString(36).substring(2, 12);
        sessionStorage.setItem("aurora_session_id", sessionId);
      }
    } catch {}

    const sendEvent = (event: string, metadata?: Record<string, unknown>) => {
      const payload = JSON.stringify({
        event,
        pathname: window.location.pathname,
        referrer: document.referrer || "Direct",
        sessionId,
        metadata,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/telemetry", payload);
      } else {
        fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // Attach global helper
    window.trackAuroraEvent = sendEvent;

    // Track page view if path changed
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      sendEvent("page_view");
    }
  }, [pathname]);

  return null;
}
