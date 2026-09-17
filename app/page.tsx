"use client";

import dynamic from "next/dynamic";

// Dynamically import client-rendered App to avoid SSR mismatch with browser-only Web APIs (Canvas, Media, WebAudio)
const App = dynamic(() => import("../src/App"), { ssr: false });

export default function HomePage() {
  return <App />;
}
