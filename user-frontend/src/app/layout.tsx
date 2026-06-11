import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AppErrorBoundary } from "@/components/layout/app-error-boundary";
import { AccessibilityApplier } from "@/components/layout/accessibility-applier";
import { ClientErrorReporter } from "@/components/layout/client-error-reporter";
import { AuthProvider } from "@/lib/auth-context";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RequestFlow User Portal",
  description: "RequestFlow user frontend foundation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>
        <AuthProvider>
          <AppErrorBoundary>
            <ClientErrorReporter />
            <AccessibilityApplier />
            {children}
          </AppErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
