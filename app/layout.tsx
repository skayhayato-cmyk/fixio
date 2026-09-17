import type React from "react";
import type { Metadata, Viewport } from "next";
import "../src/index.css";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Fixio",
  description: "Fixio - Minimal, fast, and elegant iOS-inspired multi-utility tool hub.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fixio",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Fixio",
    description: "Minimal, fast, and elegant iOS-inspired multi-utility tool hub.",
    type: "website",
    images: ["/pwa-512x512.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__fixioInstallPrompt = null;
              window.addEventListener("beforeinstallprompt", function (e) {
                e.preventDefault();
                window.__fixioInstallPrompt = e;
                window.dispatchEvent(new Event("fixio:bipready"));
              });
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
        {children}
      </body>
    </html>
  );
}
