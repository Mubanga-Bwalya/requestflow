"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

type AnchoredMenuPosition = CSSProperties & { visibility: "visible" | "hidden" };

/**
 * Viewport-fixed coordinates for a dropdown anchored to a trigger element.
 * Use with a portal to `document.body` so menus work inside transformed dialogs.
 */
export function useAnchoredMenuPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): AnchoredMenuPosition {
  const [style, setStyle] = useState<AnchoredMenuPosition>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle({ visibility: "hidden" });
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const gap = 4;
      const maxMenuHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;

      if (openAbove) {
        const height = Math.min(maxMenuHeight, spaceAbove);
        setStyle({
          position: "fixed",
          left: rect.left,
          width: rect.width,
          bottom: window.innerHeight - rect.top + gap,
          maxHeight: height,
          zIndex: 200,
          visibility: "visible",
        });
        return;
      }

      setStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(maxMenuHeight, spaceBelow),
        zIndex: 200,
        visibility: "visible",
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  return style;
}
