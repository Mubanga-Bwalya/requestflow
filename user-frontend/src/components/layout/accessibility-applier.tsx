"use client";

import { useEffect } from "react";
import { useLocalStore } from "@/lib/local-store";

export function AccessibilityApplier() {
  const { state } = useLocalStore();
  const a = state.accessibility;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("rf-large-text", a.largeText);
    root.classList.toggle("rf-high-contrast", a.highContrast);
    root.classList.toggle("rf-reduce-motion", a.reduceMotion);
  }, [a.highContrast, a.largeText, a.reduceMotion]);

  return null;
}
