import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isOnline: boolean;
  appVersion: string;
  // Online-only PWA: this no longer reflects "offline caching" — it only
  // reflects whether the network-passthrough service worker is registered
  // ("active") or not supported/unavailable in this context ("unavailable").
  offlineStatus: "active" | "unavailable";
  install: () => Promise<boolean>;
  checkForUpdates: () => Promise<boolean>;
}

export const APP_VERSION = "1.2.0";

declare global {
  interface Window {
    __fixioInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWA(): PWAState {
  // `beforeinstallprompt` can fire before React even mounts (index.html
  // captures it early into window.__fixioInstallPrompt — see index.html).
  // Read that buffered event on first render so we never miss it.
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== "undefined") {
      return window.__fixioInstallPrompt ?? null;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://")
      );
    }
    return false;
  });

  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    }
    return false;
  });

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [offlineStatus, setOfflineStatus] = useState<"active" | "unavailable">("unavailable");

  useEffect(() => {
    // Standalone media query listener
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener("change", handleDisplayModeChange);
    }

    // Online/offline handlers — these only track network connectivity
    // (isOnline). offlineStatus is set separately by SW registration
    // below and must not be conflated with connectivity state.
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Install prompt listener (covers the event firing after mount)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__fixioInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Covers the event firing before mount: index.html's inline script
    // buffers it and dispatches this once it's ready to hand off.
    const handleEarlyPrompt = () => {
      if (window.__fixioInstallPrompt) {
        setDeferredPrompt(window.__fixioInstallPrompt);
      }
    };
    window.addEventListener("fixio:bipready", handleEarlyPrompt);
    // Also re-check immediately in case the buffered event landed between
    // this hook's initial state read and this effect attaching.
    handleEarlyPrompt();

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__fixioInstallPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Register the (online-only, network-passthrough) Service Worker if
    // supported. This only enables install/standalone-mode PWA behavior —
    // it does not enable offline use, since every tool depends on live
    // API calls.
    if (
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          setOfflineStatus("active");
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // Service worker updated
                  console.log("[Fixio PWA] New version ready.");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[Fixio SW] Registration note:", err);
          setOfflineStatus("unavailable");
        });
    } else {
      setOfflineStatus("unavailable");
    }

    return () => {
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener("change", handleDisplayModeChange);
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("fixio:bipready", handleEarlyPrompt);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      window.__fixioInstallPrompt = null;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("Install prompt failed:", err);
    }
    return false;
  }, [deferredPrompt]);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          return true;
        }
      } catch (err) {
        console.warn("Update check failed:", err);
      }
    }
    return false;
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    appVersion: APP_VERSION,
    offlineStatus,
    install,
    checkForUpdates,
  };
}
