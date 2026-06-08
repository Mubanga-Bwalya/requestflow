"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export function AccessibilityApplier() {
  const { state } = useAuth();
  const a = state.accessibility;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("rf-large-text", a.largeText);
    root.classList.toggle("rf-high-contrast", a.highContrast);
    root.classList.toggle("rf-reduce-motion", a.reduceMotion);
  }, [a.highContrast, a.largeText, a.reduceMotion]);

  return null;
}
