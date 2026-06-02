import type { Metadata } from "next";
import "./globals.css";
import { LocalStoreProvider } from "@/lib/local-store";

export const metadata: Metadata = {
  title: "RequestFlow Admin Portal",
  description: "RequestFlow admin frontend foundation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocalStoreProvider>{children}</LocalStoreProvider>
      </body>
    </html>
  );
}
