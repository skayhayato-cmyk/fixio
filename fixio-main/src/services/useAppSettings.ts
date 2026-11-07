import { useState, useEffect } from "react";

export type AppearanceMode = "system" | "light" | "dark";
export type DisplayScale = "standard" | "medium" | "high";
export type LanguageCode = "id" | "en";
export type GlassStyle = "clear" | "frosted" | "blur" | "flat";

export interface AppSettings {
  appearance: AppearanceMode;
  displayScale: DisplayScale;
  language: LanguageCode;
  iosUIUX: boolean;
  glassStyle: GlassStyle;
  smooth3D: boolean;
  setAppearance: (mode: AppearanceMode) => void;
  setDisplayScale: (scale: DisplayScale) => void;
  setLanguage: (lang: LanguageCode) => void;
  setIosUIUX: (enabled: boolean) => void;
  setGlassStyle: (style: GlassStyle) => void;
  setSmooth3D: (enabled: boolean) => void;
  toggleSmooth3D: () => void;
  cycleGlassStyle: () => void;
  toggleIosUIUX: () => void;
  toggleAppearance: () => void;
  t: (key: string) => string;
}

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  id: {
    // Branding & Landing
    tagline: "Pusat alat praktis digital minimalis dan cepat.",
    landingDescription:
      "Fixio adalah platform Tools all in one. Di sini kalian bisa menemukan berbagai tools lainnya seperti HD Image, Download Media, dan masih banyak lagi.",
    getStarted: "Buka Aplikasi",
    openApp: "Buka Aplikasi",
    settings: "Pengaturan",
    installApp: "Pasang Aplikasi",
    installed: "Terpasang",
    allTools: "Semua Alat",
    searchPlaceholder: "Cari alat praktis...",
    backToHome: "Kembali",
    
    // Settings headers
    settingsTitle: "Pengaturan",
    generalSection: "UMUM & TAMPILAN",
    appearance: "Tema Warna",
    system: "Sistem",
    light: "Terang",
    dark: "Gelap (Hitam Pekat)",
    displayScale: "Skala Tampilan",
    displayScaleDesc: "Pilih kepadatan antarmuka & ukuran teks layar",
    standard: "Standar",
    medium: "Sedang",
    high: "Tinggi",
    darkLabel: "Gelap",
    language: "Bahasa",
    indonesia: "Indonesia",
    english: "English",

    // Glassmorphism Styles (as in reference image)
    glassSection: "EFEK GLASSMORPHISM & TAMPILAN",
    glassStyleLabel: "Gaya Kaca (Glassmorphism)",
    glassStyleDesc: "Pilih efek refraksi kaca visual favorit (Langsung berganti secara instan)",
    glassClear: "Clear",
    glassClearSub: "iOS (Transparan Jernih)",
    glassFrosted: "Frosted",
    glassFrostedSub: "Concept (Kaca Buram Tebal)",
    glassBlur: "Blur",
    glassBlurSub: "One UI (Difusi Lembut)",
    glassFlat: "Solid Flat",
    glassFlatSub: "Minimal Opaque",

    // Smooth 3D Button Animation Toggle
    smooth3DTitle: "Animasi Tombol 3D Smooth",
    smooth3DDesc: "Efek kedalaman 3D tactile, pantulan pegas halus, dan elevasi saat tombol ditekan",
    smooth3DActive: "Aktif",
    smooth3DInactive: "Nonaktif",

    // iOS UI/UX Toggle
    iosUIUX: "Tampilan UI/UX iOS",
    iosUIUXDesc: "Aktifkan gaya visual iOS, efek kaca glassmorphic, dan sudut membulat",
    iosActive: "Aktif",
    iosInactive: "Nonaktif",
    iosToggleBtn: "iOS UI/UX",

    // App Section
    appSection: "APLIKASI & SISTEM",
    pwaSection: "PENGATURAN PWA (APLIKASI WEB)",
    installStatus: "Status Pemasangan",
    statusInstalled: "Terpasang (Mode Mandiri)",
    statusAvailable: "Siap Dipasang",
    statusBrowser: "Mode Browser Web",
    appVersion: "Versi Aplikasi",
    offlineSupport: "Mode Koneksi",
    offlineActive: "Online Saja (Wajib Internet)",
    offlineReady: "Menunggu Koneksi",
    updateApp: "Periksa Pembaruan",
    checkingUpdates: "Memeriksa...",
    updateLatest: "Versi terbaru aktif",

    // Connectivity (Online-only app — all tools call live APIs)
    noInternetTitle: "Tidak Ada Koneksi Internet",
    noInternetDesc: "Semua tools di Fixio memerlukan koneksi internet aktif untuk memanggil API.",
    
    // Notifications
    notifications: "Notifikasi Sistem",
    notifGranted: "Diizinkan",
    notifDenied: "Ditolak",
    notifDefault: "Minta Izin",
    notifNotSupported: "Tidak didukung di browser ini",

    // About
    aboutFixio: "Tentang Fixio",
    aboutDesc: "Fixio adalah platform tools bermacam-macam, mulai dari HD Image, Download Media Sosial, dan masih banyak lagi. Website ini dikembangkan oleh Nexa Developer.",
    done: "Selesai",
    close: "Tutup",
    iosInstallTitle: "Pasang di iPhone / iPad",
    iosInstallStep1: "1. Ketuk ikon Bagikan (Share) di bagian bawah Safari.",
    iosInstallStep2: "2. Pilih 'Tambah ke Layar Utama' (Add to Home Screen).",
  },
  en: {
    // Branding & Landing
    tagline: "Minimal, fast, and elegant utility hub.",
    landingDescription:
      "Fixio is an all-in-one tools platform. Here you'll find handy utilities like HD Image, Media Download, and many more.",
    getStarted: "Open App",
    openApp: "Open App",
    settings: "Settings",
    installApp: "Install App",
    installed: "Installed",
    allTools: "All Tools",
    searchPlaceholder: "Search utilities...",
    backToHome: "Back",

    // Settings headers
    settingsTitle: "Settings",
    generalSection: "GENERAL & DISPLAY",
    appearance: "Color Theme",
    system: "System",
    light: "Light",
    dark: "Dark (True Pitch Black)",
    displayScale: "UI Display Scale",
    displayScaleDesc: "Choose interface density and text scaling",
    standard: "Standard",
    medium: "Medium",
    high: "High",
    darkLabel: "Dark",
    language: "Language",
    indonesia: "Indonesia",
    english: "English",

    // Glassmorphism Styles (as in reference image)
    glassSection: "GLASSMORPHISM & BLUR EFFECTS",
    glassStyleLabel: "Glass Style",
    glassStyleDesc: "Select your preferred visual glass refraction effect (Applies instantly)",
    glassClear: "Clear",
    glassClearSub: "iOS (Crystal Clear)",
    glassFrosted: "Frosted",
    glassFrostedSub: "Concept (Heavy Satin Glass)",
    glassBlur: "Blur",
    glassBlurSub: "One UI (Smooth Diffusion)",
    glassFlat: "Solid Flat",
    glassFlatSub: "Minimal Opaque",

    // Smooth 3D Button Animation Toggle
    smooth3DTitle: "Smooth 3D Button Animation",
    smooth3DDesc: "Tactile 3D depth, soft spring bounce physics, and press elevation on all controls",
    smooth3DActive: "Enabled",
    smooth3DInactive: "Disabled",

    // iOS UI/UX Toggle
    iosUIUX: "iOS UI/UX Experience",
    iosUIUXDesc: "Enable Apple iOS visual styling, glassmorphism, and fluid rounded contours",
    iosActive: "Enabled",
    iosInactive: "Disabled",
    iosToggleBtn: "iOS UI/UX",

    // App Section
    appSection: "APP & SYSTEM",
    pwaSection: "PWA SETTINGS (WEB APP)",
    installStatus: "Install Status",
    statusInstalled: "Installed (Standalone)",
    statusAvailable: "Ready to Install",
    statusBrowser: "Web Browser Mode",
    appVersion: "App Version",
    offlineSupport: "Connection Mode",
    offlineActive: "Online Only (Internet Required)",
    offlineReady: "Awaiting Connection",
    updateApp: "Check for Updates",
    checkingUpdates: "Checking...",
    updateLatest: "Already latest version",

    // Connectivity (Online-only app — all tools call live APIs)
    noInternetTitle: "No Internet Connection",
    noInternetDesc: "All Fixio tools require an active internet connection to call the API.",
    
    // Notifications
    notifications: "System Notifications",
    notifGranted: "Allowed",
    notifDenied: "Denied",
    notifDefault: "Request Permission",
    notifNotSupported: "Not supported in this browser",

    // About
    aboutFixio: "About Fixio",
    aboutDesc: "Fixio is an all-in-one tools platform — HD Image, Social Media Download, and much more. This website is developed by Nexa Developer.",
    done: "Done",
    close: "Close",
    iosInstallTitle: "Install on iPhone / iPad",
    iosInstallStep1: "1. Tap the Share icon in the Safari toolbar.",
    iosInstallStep2: "2. Scroll down and select 'Add to Home Screen'.",
  },
};

export function useAppSettings(): AppSettings {
  const [appearance, setAppearanceState] = useState<AppearanceMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fixio_appearance") as AppearanceMode;
      if (saved && ["system", "light", "dark"].includes(saved)) {
        return saved;
      }
    }
    return "system";
  });

  const [displayScale, setDisplayScaleState] = useState<DisplayScale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fixio_display_scale") as DisplayScale;
      if (saved && ["standard", "medium", "high"].includes(saved)) {
        return saved;
      }
    }
    return "standard";
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fixio_language") as LanguageCode;
      if (saved === "id" || saved === "en") return saved;
      const navLang = navigator.language?.toLowerCase() || "";
      if (navLang.startsWith("id")) return "id";
    }
    return "en";
  });

  const [iosUIUX, setIosUIUXState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fixio_ios_uiux");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return true; // default ON
  });

  const [glassStyle, setGlassStyleState] = useState<GlassStyle>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fixio_glass_style") as GlassStyle;
      if (saved && ["clear", "frosted", "blur", "flat"].includes(saved)) {
        return saved;
      }
    }
    return "frosted"; // default Frosted Concept as in reference
  });

  const [smooth3D, setSmooth3DState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fixio_smooth_3d");
      if (saved !== null) {
        return saved === "true";
      }
    }
    return true; // default 3D Smooth active
  });

  // Apply theme & color-scheme to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let isDark = false;
      if (appearance === "dark") {
        isDark = true;
      } else if (appearance === "light") {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
        body.classList.add("dark");
        body.classList.remove("light");
        root.style.colorScheme = "dark";
        const meta = document.getElementById("theme-color-meta");
        if (meta) meta.setAttribute("content", "#000000");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");
        body.classList.remove("dark");
        body.classList.add("light");
        root.style.colorScheme = "light";
        const meta = document.getElementById("theme-color-meta");
        if (meta) meta.setAttribute("content", "#ffffff");
      }
    };

    applyTheme();

    const listener = () => {
      if (appearance === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [appearance]);

  // Apply display scale to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-display-scale", displayScale);
  }, [displayScale]);

  // Apply Smooth 3D animation mode to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-smooth-3d", smooth3D ? "true" : "false");
    if (smooth3D) {
      root.classList.add("smooth-3d-active");
      root.classList.remove("smooth-3d-inactive");
    } else {
      root.classList.add("smooth-3d-inactive");
      root.classList.remove("smooth-3d-active");
    }
  }, [smooth3D]);

  // Apply iOS UI/UX & Glassmorphism style to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-ios-uiux", iosUIUX ? "true" : "false");
    root.setAttribute("data-glass-style", iosUIUX ? glassStyle : "flat");
    
    // Class toggling
    root.classList.remove("glass-clear", "glass-frosted", "glass-blur", "glass-flat");
    if (iosUIUX) {
      root.classList.add("ios-uiux-active", `glass-${glassStyle}`);
      root.classList.remove("flat-uiux-active");
    } else {
      root.classList.add("flat-uiux-active", "glass-flat");
      root.classList.remove("ios-uiux-active");
    }
  }, [iosUIUX, glassStyle]);

  const setAppearance = (mode: AppearanceMode) => {
    setAppearanceState(mode);
    localStorage.setItem("fixio_appearance", mode);
  };

  const toggleAppearance = () => {
    if (appearance === "light") {
      setAppearance("dark");
    } else if (appearance === "dark") {
      setAppearance("system");
    } else {
      setAppearance("light");
    }
  };

  const setDisplayScale = (scale: DisplayScale) => {
    setDisplayScaleState(scale);
    localStorage.setItem("fixio_display_scale", scale);
  };

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("fixio_language", lang);
  };

  const setIosUIUX = (enabled: boolean) => {
    setIosUIUXState(enabled);
    localStorage.setItem("fixio_ios_uiux", enabled ? "true" : "false");
  };

  const toggleIosUIUX = () => {
    setIosUIUX(!iosUIUX);
  };

  const setGlassStyle = (style: GlassStyle) => {
    setGlassStyleState(style);
    localStorage.setItem("fixio_glass_style", style);
  };

  const setSmooth3D = (enabled: boolean) => {
    setSmooth3DState(enabled);
    localStorage.setItem("fixio_smooth_3d", enabled ? "true" : "false");
  };

  const toggleSmooth3D = () => {
    setSmooth3D(!smooth3D);
  };

  const cycleGlassStyle = () => {
    const order: GlassStyle[] = ["frosted", "clear", "blur", "flat"];
    const nextIdx = (order.indexOf(glassStyle) + 1) % order.length;
    setGlassStyle(order[nextIdx]);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  return {
    appearance,
    displayScale,
    language,
    iosUIUX,
    glassStyle,
    smooth3D,
    setAppearance,
    setDisplayScale,
    setLanguage,
    setIosUIUX,
    setGlassStyle,
    setSmooth3D,
    toggleSmooth3D,
    cycleGlassStyle,
    toggleIosUIUX,
    toggleAppearance,
    t,
  };
}
