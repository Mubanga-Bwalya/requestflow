import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AccessibilityApplier } from "@/components/layout/accessibility-applier";
import { AuthProvider } from "@/lib/auth-context";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RequestFlow Admin Portal",
  description: "RequestFlow admin frontend foundation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>
        <AuthProvider>
          <AccessibilityApplier />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
