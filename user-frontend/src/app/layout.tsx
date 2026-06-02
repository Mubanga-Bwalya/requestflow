import type { Metadata } from "next";
import "./globals.css";
import { AccessibilityApplier } from "@/components/layout/accessibility-applier";
import { LocalStoreProvider } from "@/lib/local-store";

export const metadata: Metadata = {
  title: "RequestFlow User Portal",
  description: "RequestFlow user frontend foundation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocalStoreProvider>
          <AccessibilityApplier />
          {children}
        </LocalStoreProvider>
      </body>
    </html>
  );
}
