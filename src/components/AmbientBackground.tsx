import React from "react";

/**
 * Fixed, full-viewport colorful backdrop rendered behind the entire app.
 *
 * Glassmorphism (backdrop-filter: blur/saturate) is only visible when
 * there is something colorful behind the glass surface to distort.
 * Without this layer, Clear / Frosted / Blur all look identical because
 * they're just blurring a flat solid color. This component is what makes
 * the Glass Style picker actually show a visible difference app-wide,
 * not just inside its own preview card.
 */
export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixio-ambient-bg" aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
    </div>
  );
};
