import React, { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  speedMs?: number;
  startDelayMs?: number;
}

/**
 * Renders `text` one character at a time like it's being typed live,
 * then leaves a soft blinking caret at the end.
 * Resets and re-types whenever `text` changes (e.g. language switch).
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  className = "",
  speedMs = 28,
  startDelayMs = 250,
}) => {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    setVisibleChars(0);
    let charIndex = 0;
    let intervalId: ReturnType<typeof setInterval>;

    const startTimeout = setTimeout(() => {
      intervalId = setInterval(() => {
        charIndex += 1;
        setVisibleChars(charIndex);
        if (charIndex >= text.length) {
          clearInterval(intervalId);
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(intervalId);
    };
  }, [text, speedMs, startDelayMs]);

  const isDone = visibleChars >= text.length;

  return (
    <span className={className}>
      {text.slice(0, visibleChars)}
      <span
        className="typewriter-caret"
        style={{ opacity: isDone ? undefined : 1, height: "1em", verticalAlign: "-0.15em" }}
      />
    </span>
  );
};
