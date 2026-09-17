import type React from "react";
import type { Metadata, Viewport } from "next";
import "../src/index.css";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Fixio",
  description: "Fixio - Minimal, fast, and elegant iOS-inspired multi-utility tool hub.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <body className="antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
        {children}
      </body>
    </html>
  );
}
