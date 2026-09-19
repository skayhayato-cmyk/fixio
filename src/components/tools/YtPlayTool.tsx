import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Share2,
  ListMusic,
  Laptop2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Check,
  Minus,
  Search,
  Video,
  Headphones,
  Loader2,
  Sparkles,
  X,
  Clock,
  Radio,
  Tv,
  ShieldCheck,
  Download,
  Maximize2,
} from "lucide-react";
import axios from "axios";

// 0.1s Silent WAV audio data URI carrier to keep mobile hardware audio pipeline active in background
const SILENT_AUDIO_URI = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

// TypeScript declarations for official YouTube IFrame Player API
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YtPlayData {
  creator?: string;
  status: boolean;
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  duration_seconds: number;
  channel: string;
  views: string;
  data?: {
    filename?: string;
    quality?: string;
    size?: string;
    extension?: string;
    url?: string;
  };
}

export interface SyncedLyricLine {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  isInstrumental?: boolean;
}

interface ParsedTrack {
  artist: string;
  song: string;
  cleanFull: string;
}

export interface YtPlayToolProps {
  onBack?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  onClosePlayer?: () => void;
}

// Curated inspiration tracks (Default is Post Malone - Sunflower matching Spotify screenshot)
const CURATED_TRACKS = [
  { label: "Sunflower", query: "Post Malone, Swae Lee - Sunflower", artist: "Post Malone, Swae Lee" },
  { label: "Yellow", query: "Coldplay - Yellow", artist: "Coldplay" },
  { label: "Blinding Lights", query: "The Weeknd - Blinding Lights", artist: "The Weeknd" },
  { label: "Shape of You", query: "Ed Sheeran - Shape of You", artist: "Ed Sheeran" },
  { label: "Faded", query: "Alan Walker - Faded", artist: "Alan Walker" },
  { label: "Viva La Vida", query: "Coldplay - Viva La Vida", artist: "Coldplay" },
];

// Clean noisy YouTube titles to extract clean song & artist
const parseTrackInfo = (rawTitle: string, channelName?: string): ParsedTrack => {
  let cleaned = rawTitle
    .replace(/\[official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)\]/gi, "")
    .replace(/\(official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)\)/gi, "")
    .replace(/\[mv\]|\(mv\)|\(audio\)|\(lyrics\)|\[lyrics\]/gi, "")
    .replace(/\b4k\b|\bhd\b|\buhd\b|\b1080p\b/gi, "")
    .replace(/\|.*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  let artist = "";
  let song = "";

  if (cleaned.includes(" - ")) {
    const parts = cleaned.split(" - ");
    artist = parts[0].trim();
    song = parts.slice(1).join(" - ").trim();
  } else if (cleaned.includes("–")) {
    const parts = cleaned.split("–");
    artist = parts[0].trim();
    song = parts.slice(1).join("–").trim();
  } else if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    artist = parts[0].trim();
    song = parts.slice(1).join(":").trim();
  } else {
    song = cleaned;
    if (channelName) {
      artist = channelName
        .replace(/\bvevo\b/gi, "")
        .replace(/\bofficial\b/gi, "")
        .replace(/\btopic\b/gi, "")
        .replace(/-.*$/, "")
        .trim();
    }
  }

  song = song.replace(/^\s*"(.*)"\s*$/, "$1").replace(/^\s*'(.*)'\s*$/, "$1").trim();
  const cleanFull = artist ? `${artist} ${song}`.trim() : song;

  return { artist, song, cleanFull };
};

// Parse raw LRC formatted lyrics string into timestamped lines
function parseLrcString(lrcText: string, songDuration: number): SyncedLyricLine[] {
  const lines = lrcText.split("\n");
  const parsed: { time: number; text: string }[] = [];
  const lrcRegex = /^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/;

  for (const rawLine of lines) {
    const match = rawLine.trim().match(lrcRegex);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const msStr = match[3] || "0";
      const ms = parseFloat(`0.${msStr}`);
      const totalSeconds = mins * 60 + secs + ms;
      const text = match[4]?.trim() || "";
      parsed.push({ time: Math.round(totalSeconds * 100) / 100, text });
    }
  }

  if (parsed.length === 0) return [];

  parsed.sort((a, b) => a.time - b.time);

  const result: SyncedLyricLine[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const curr = parsed[i];
    const next = parsed[i + 1];
    const endTime = next ? next.time : (songDuration || curr.time + 4);
    const isInstrumental = !curr.text || curr.text === "♪";

    result.push({
      id: i,
      startTime: curr.time,
      endTime,
      text: isInstrumental ? "♪" : curr.text,
      isInstrumental,
    });
  }

  return result;
}

// Fallback generator for plain un-synced Genius lyrics
function generateCadenceLyrics(plainText: string, songDuration: number): SyncedLyricLine[] {
  const rawLines = plainText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      const lower = l.toLowerCase();
      if (lower.includes("contributors") || lower.includes("translations") || lower.includes("lyrics")) return false;
      if (lower.startsWith("embed") || lower.startsWith("read more")) return false;
      return true;
    });

  if (rawLines.length === 0) return [];

  const dur = songDuration || 200;
  const intro = Math.min(14, Math.max(5, dur * 0.08));
  const outro = Math.min(12, Math.max(4, dur * 0.05));
  const usable = Math.max(20, dur - intro - outro);

  const weighted = rawLines.map((line) => {
    const isSec = line.startsWith("[") && line.endsWith("]");
    const weight = isSec ? 0.6 : Math.max(1.2, line.length / 8);
    return { line, isSec, weight };
  });

  const totalWeight = weighted.reduce((acc, item) => acc + item.weight, 0) || 1;
  const unit = usable / totalWeight;

  let currentSec = intro;
  return weighted.map((item, idx) => {
    const lineDur = item.weight * unit;
    const start = Math.round(currentSec * 10) / 10;
    const end = Math.round((currentSec + lineDur) * 10) / 10;
    currentSec += lineDur;
    return {
      id: idx,
      startTime: start,
      endTime: end,
      text: item.line,
      isInstrumental: item.isSec,
    };
  });
}

// Helper to guarantee YouTube IFrame API script is in the DOM
const loadYouTubeIframeScript = () => {
  if (typeof window === "undefined") return;
  if (window.YT && typeof window.YT.Player === "function") return;
  if (document.getElementById("youtube-iframe-api-script")) return;

  const tag = document.createElement("script");
  tag.id = "youtube-iframe-api-script";
  tag.src = "https://www.youtube.com/iframe_api";
  tag.async = true;
  const firstScriptTag = document.getElementsByTagName("script")[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }
};

export const YtPlayTool: React.FC<YtPlayToolProps> = ({
  onBack,
  isMinimized = false,
  onMaximize,
  onClosePlayer,
}) => {
  // Navigation & UI mode states
  const [showLyricsSheet, setShowLyricsSheet] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<"audio" | "video">("audio");
  const [isLiked, setIsLiked] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isBackgroundPlay, setIsBackgroundPlay] = useState<boolean>(true);

  // Search input & Active Track
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<YtPlayData | null>(null);

  // Core YouTube Playback State (Single source of truth via official YouTube IFrame events)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  // Lyrics State
  const [syncedLyrics, setSyncedLyrics] = useState<SyncedLyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [userScrolledLyrics, setUserScrolledLyrics] = useState(false);

  // Native HTML5 Audio Element for Background Playback (Mirip Spotify Downloader)
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioStreamUrl, setAudioStreamUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // DOM & Audio Refs
  const ytPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollTimeoutRef = useRef<any>(null);
  const isRepeatRef = useRef(isRepeat);
  const isMountedRef = useRef(true);
  const searchRequestIdRef = useRef(0);
  const pendingPlayRef = useRef(false);

  // Background Audio & Session Keepalive Refs
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<any>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isBackgroundPlayRef = useRef(isBackgroundPlay);
  isBackgroundPlayRef.current = isBackgroundPlay;
  const manualPauseRef = useRef(false);

  // Start silent carrier & audio context to keep mobile audio session alive in background
  const startBackgroundAudioSession = useCallback(() => {
    try {
      if (silentAudioRef.current && silentAudioRef.current.paused) {
        silentAudioRef.current.play().catch(() => {});
      }
      if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!audioContextRef.current) {
            const ctx = new AudioCtx();
            if (ctx.state === "suspended") {
              ctx.resume().catch(() => {});
            }
            audioContextRef.current = ctx;
          } else if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn("Background audio session init error:", e);
    }
  }, []);

  // Keep repeat ref in sync for event listeners
  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  // Safeguard: Reset buffering state after 3.5s so buttons never get stuck spinning
  useEffect(() => {
    if (isBuffering) {
      const t = setTimeout(() => {
        setIsBuffering(false);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [isBuffering]);

  // Preload YouTube IFrame API script on component mount
  useEffect(() => {
    loadYouTubeIframeScript();
  }, []);

  // Track parsed song & artist
  const parsedTrack = useMemo(() => {
    if (!currentTrack) {
      return { artist: "Post Malone, Swae Lee", song: "Sunflower - Spider-Man: Into the Spider-Verse", cleanFull: "Post Malone Sunflower" };
    }
    const info = parseTrackInfo(currentTrack.title, currentTrack.channel);
    return {
      artist: info.artist || currentTrack.channel || "Artist",
      song: info.song || currentTrack.title,
      cleanFull: info.cleanFull || currentTrack.title,
    };
  }, [currentTrack]);

  // ---------------------------------------------------------------------------
  // YouTube IFrame Player Initialization & Event Handlers (Single Source of Truth)
  // ---------------------------------------------------------------------------
  const setupYouTubePlayer = useCallback((videoId: string) => {
    if (!videoId) return;

    loadYouTubeIframeScript();

    const onPlayerReady = (event: any) => {
      ytPlayerRef.current = event.target;
      setIsBuffering(false);
      try {
        const d = event.target.getDuration();
        if (d > 0) setDuration(d);

        // In audio mode with native stream, keep YouTube player muted and paused
        if (playbackMode === "audio" && audioStreamUrl) {
          event.target.mute();
          if (typeof event.target.pauseVideo === "function") {
            event.target.pauseVideo();
          }
        } else {
          event.target.setVolume(isMuted ? 0 : volume * 100);
          if (!isMuted) event.target.unMute();
          startBackgroundAudioSession();
          event.target.playVideo();
          setIsPlaying(true);
        }
        pendingPlayRef.current = false;
        manualPauseRef.current = false;
      } catch (err) {
        console.warn("Autoplay notice:", err);
      }
    };

    const onPlayerStateChange = (event: any) => {
      // If in audio mode with native audio stream, do not let YouTube player hijack playback
      if (playbackMode === "audio" && audioStreamUrl) {
        try {
          event.target.mute();
          if (event.data === 1) { // If it started playing video audio, pause it
            event.target.pauseVideo();
          }
        } catch {}
        return;
      }

      // Official YouTube API State enum:
      // -1: UNSTARTED, 0: ENDED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: CUED
      const state = event.data;

      if (state === 1) { // PLAYING
        setIsPlaying(true);
        setIsBuffering(false);
        pendingPlayRef.current = false;
        manualPauseRef.current = false;
        startBackgroundAudioSession();
        const d = event.target.getDuration();
        if (d > 0) setDuration(d);
      } else if (state === 2) { // PAUSED
        if (document.visibilityState === "hidden" && isPlayingRef.current && !manualPauseRef.current && isBackgroundPlayRef.current) {
          try {
            event.target.playVideo();
            return;
          } catch {}
        }
        setIsPlaying(false);
        setIsBuffering(false);
      } else if (state === 3) { // BUFFERING
        setIsBuffering(true);
      } else if (state === 0) { // ENDED
        setIsPlaying(false);
        setIsBuffering(false);
        if (isRepeatRef.current) {
          try {
            event.target.seekTo(0, true);
            event.target.playVideo();
          } catch {}
        } else {
          handleNextTrack();
        }
      } else if (state === 5) { // CUED
        setIsBuffering(false);
      } else if (state === -1) { // UNSTARTED
        setIsBuffering(false);
      }
    };

    const onPlayerApiChange = (event: any) => {
      try {
        if (event.target && typeof event.target.getDuration === "function") {
          const d = event.target.getDuration();
          if (d > 0) setDuration(d);
        }
      } catch {}
    };

    const onPlayerError = (event: any) => {
      console.warn("YouTube Player error event:", event.data);
      setIsBuffering(false);
      setIsPlaying(false);
      pendingPlayRef.current = false;
    };

    // If player already exists and is valid, load video into the existing player instance
    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
      try {
        ytPlayerRef.current.loadVideoById(videoId, 0);
        startBackgroundAudioSession();
        if (typeof ytPlayerRef.current.playVideo === "function") {
          ytPlayerRef.current.playVideo();
        }
        setIsPlaying(true);
        setIsBuffering(false);
        pendingPlayRef.current = false;
        manualPauseRef.current = false;
        return;
      } catch (e) {
        console.warn("Failed to load into existing player, rebuilding instance:", e);
      }
    }

    // Create player instance attached to the always-mounted DOM container
    const createPlayer = () => {
      if (!ytPlayerContainerRef.current) return;

      try {
        ytPlayerContainerRef.current.innerHTML = "";
        const playerElement = document.createElement("div");
        ytPlayerContainerRef.current.appendChild(playerElement);

        const player = new window.YT.Player(playerElement, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            fs: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onApiChange: onPlayerApiChange,
            onError: onPlayerError,
          },
        });
        ytPlayerRef.current = player;
      } catch (err) {
        console.error("Error creating YouTube player:", err);
        setIsBuffering(false);
      }
    };

    // Guaranteed YouTube IFrame API execution
    if (typeof window !== "undefined" && window.YT && typeof window.YT.Player === "function") {
      createPlayer();
    } else {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof window !== "undefined" && window.YT && typeof window.YT.Player === "function") {
          clearInterval(checkInterval);
          createPlayer();
        } else if (attempts > 50) {
          clearInterval(checkInterval);
          setIsBuffering(false);
        }
      }, 100);

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === "function") prevCallback();
        clearInterval(checkInterval);
        createPlayer();
      };
    }
  }, [isMuted, volume, isPlaying, startBackgroundAudioSession]);

  // Continuous accurate time tracking via requestAnimationFrame (Zero setInterval)
  useEffect(() => {
    let animId: number;

    const updatePlayTime = () => {
      // In video mode, sync time from YouTube player
      if (playbackMode === "video" && ytPlayerRef.current && !isScrubbing) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === "function") {
            const time = ytPlayerRef.current.getCurrentTime();
            if (typeof time === "number" && !isNaN(time)) {
              setCurrentTime(time);
            }
          }
          if (typeof ytPlayerRef.current.getDuration === "function") {
            const dur = ytPlayerRef.current.getDuration();
            if (typeof dur === "number" && dur > 0 && Math.abs(dur - duration) > 1) {
              setDuration(dur);
            }
          }
        } catch {}
      }
      animId = requestAnimationFrame(updatePlayTime);
    };

    animId = requestAnimationFrame(updatePlayTime);
    return () => cancelAnimationFrame(animId);
  }, [isScrubbing, duration, playbackMode]);

  // Volume & Mute synchronizer
  useEffect(() => {
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = isMuted ? 0 : volume;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      try {
        if (isMuted || (playbackMode === "audio" && audioStreamUrl)) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(volume * 100));
        }
      } catch {}
    }
  }, [volume, isMuted, playbackMode, audioStreamUrl]);

  // Switch between Audio and Video Modes cleanly without audio clash
  const handleSwitchMode = (targetMode: "audio" | "video") => {
    if (targetMode === playbackMode) return;
    setPlaybackMode(targetMode);

    if (targetMode === "video") {
      // Pause HTML5 audio
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      }
      // Unmute & start YouTube player
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(isMuted ? 0 : Math.round(volume * 100));
          if (typeof ytPlayerRef.current.seekTo === "function") {
            ytPlayerRef.current.seekTo(currentTime, true);
          }
          if (isPlaying && typeof ytPlayerRef.current.playVideo === "function") {
            ytPlayerRef.current.playVideo();
          }
        } catch {}
      } else if (currentTrack?.id) {
        setupYouTubePlayer(currentTrack.id);
      }
    } else {
      // Audio mode
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.mute();
          if (typeof ytPlayerRef.current.pauseVideo === "function") {
            ytPlayerRef.current.pauseVideo();
          }
        } catch {}
      }
      if (htmlAudioRef.current) {
        htmlAudioRef.current.currentTime = currentTime;
        if (isPlaying) {
          htmlAudioRef.current.play().catch(() => {});
        }
      }
    }
  };

  // Sync HTML5 audio stream with playback mode and time
  useEffect(() => {
    if (playbackMode === "audio" && audioStreamUrl && htmlAudioRef.current) {
      if (isPlaying || pendingPlayRef.current) {
        htmlAudioRef.current.currentTime = currentTime;
        htmlAudioRef.current.play().catch(() => {});
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch {}
        }
      }
    }
  }, [audioStreamUrl, playbackMode]);

  // ---------------------------------------------------------------------------
  // YouTube & Background HTML5 Audio Playback Action Controls
  // ---------------------------------------------------------------------------
  const handleTogglePlay = () => {
    // 1. In Audio Mode with native MP3 stream (Mirip Spotify Downloader Background Audio)
    if (playbackMode === "audio" && audioStreamUrl && htmlAudioRef.current) {
      if (isPlaying) {
        manualPauseRef.current = true;
        htmlAudioRef.current.pause();
        if (silentAudioRef.current) silentAudioRef.current.pause();
        setIsPlaying(false);
        setIsBuffering(false);
      } else {
        manualPauseRef.current = false;
        startBackgroundAudioSession();
        htmlAudioRef.current.play().catch(() => {});
        setIsPlaying(true);
        setIsBuffering(false);
      }
      return;
    }

    // 2. Video Mode or YouTube Player Fallback
    if (!ytPlayerRef.current) {
      if (currentTrack?.id) {
        pendingPlayRef.current = true;
        manualPauseRef.current = false;
        setIsPlaying(true);
        setIsBuffering(false);
        startBackgroundAudioSession();
        setupYouTubePlayer(currentTrack.id);
      }
      return;
    }

    try {
      let playerState: number | null = null;
      if (typeof ytPlayerRef.current.getPlayerState === "function") {
        playerState = ytPlayerRef.current.getPlayerState();
      }

      // YouTube player states: 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, -1 = UNSTARTED, 0 = ENDED, 5 = CUED
      if (playerState === 1 || isPlaying) {
        manualPauseRef.current = true;
        if (silentAudioRef.current) {
          silentAudioRef.current.pause();
        }
        if (typeof ytPlayerRef.current.pauseVideo === "function") {
          ytPlayerRef.current.pauseVideo();
        }
        setIsPlaying(false);
        setIsBuffering(false);
        pendingPlayRef.current = false;
      } else {
        manualPauseRef.current = false;
        startBackgroundAudioSession();
        if (typeof ytPlayerRef.current.playVideo === "function") {
          ytPlayerRef.current.playVideo();
        }
        setIsPlaying(true);
        setIsBuffering(false);
      }
    } catch (err) {
      console.warn("Playback toggle fallback:", err);
      if (currentTrack?.id) {
        pendingPlayRef.current = true;
        manualPauseRef.current = false;
        startBackgroundAudioSession();
        setupYouTubePlayer(currentTrack.id);
      }
    }
  };

  const handleSeek = (targetSeconds: number) => {
    const clamped = Math.max(0, Math.min(duration || 1000, targetSeconds));
    setCurrentTime(clamped);
    if (playbackMode === "audio" && htmlAudioRef.current) {
      htmlAudioRef.current.currentTime = clamped;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      try {
        ytPlayerRef.current.seekTo(clamped, true);
      } catch {}
    }
  };

  const handleNextTrack = () => {
    const currentIndex = CURATED_TRACKS.findIndex(
      (c) => currentTrack && currentTrack.title.toLowerCase().includes(c.label.toLowerCase())
    );
    const nextIdx = (currentIndex + 1) % CURATED_TRACKS.length;
    const nextTrack = CURATED_TRACKS[nextIdx];
    searchAndPlayTrack(nextTrack.query);
  };

  const handlePrevTrack = () => {
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    const currentIndex = CURATED_TRACKS.findIndex(
      (c) => currentTrack && currentTrack.title.toLowerCase().includes(c.label.toLowerCase())
    );
    const prevIdx = (currentIndex - 1 + CURATED_TRACKS.length) % CURATED_TRACKS.length;
    const prevTrack = CURATED_TRACKS[prevIdx];
    searchAndPlayTrack(prevTrack.query);
  };

  // ---------------------------------------------------------------------------
  // MediaSession API Integration (Lock Screen, Notification & Headphone Controls)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const songTitle = parsedTrack.song || currentTrack?.title || "Fixio Music";
    const artistName = parsedTrack.artist || currentTrack?.channel || "YouTube";
    const thumbUrl = currentTrack?.thumbnail || "/pwa-512x512.png";

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songTitle,
        artist: artistName,
        album: "Fixio Hub",
        artwork: [
          { src: thumbUrl, sizes: "96x96", type: "image/png" },
          { src: thumbUrl, sizes: "128x128", type: "image/png" },
          { src: thumbUrl, sizes: "192x192", type: "image/png" },
          { src: thumbUrl, sizes: "256x256", type: "image/png" },
          { src: thumbUrl, sizes: "384x384", type: "image/png" },
          { src: thumbUrl, sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

      if (duration > 0 && typeof navigator.mediaSession.setPositionState === "function") {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 1),
          playbackRate: 1.0,
          position: Math.min(Math.max(currentTime, 0), duration),
        });
      }
    } catch (err) {
      console.warn("MediaSession update error:", err);
    }
  }, [currentTrack, parsedTrack, isPlaying, duration, currentTime]);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        manualPauseRef.current = false;
        startBackgroundAudioSession();
        if (playbackMode === "audio" && audioStreamUrl && htmlAudioRef.current) {
          htmlAudioRef.current.play().catch(() => {});
        } else if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === "function") {
          ytPlayerRef.current.playVideo();
        }
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        manualPauseRef.current = true;
        if (silentAudioRef.current) {
          silentAudioRef.current.pause();
        }
        if (htmlAudioRef.current) {
          htmlAudioRef.current.pause();
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
          ytPlayerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        handlePrevTrack();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handleNextTrack();
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          handleSeek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        handleSeek(currentTime - (details.seekOffset || 10));
      });

      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        handleSeek(currentTime + (details.seekOffset || 10));
      });

      navigator.mediaSession.setActionHandler("stop", () => {
        manualPauseRef.current = true;
        if (silentAudioRef.current) {
          silentAudioRef.current.pause();
        }
        if (htmlAudioRef.current) {
          htmlAudioRef.current.pause();
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === "function") {
          ytPlayerRef.current.stopVideo();
        }
        setIsPlaying(false);
      });
    } catch (e) {
      console.warn("MediaSession action handler error:", e);
    }
  }, [currentTime, duration, currentTrack, startBackgroundAudioSession, playbackMode, audioStreamUrl]);

  // ---------------------------------------------------------------------------
  // Page Visibility & Window Blur Background Keep-Alive
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (isPlayingRef.current && !manualPauseRef.current && isBackgroundPlayRef.current) {
          startBackgroundAudioSession();
          // Keep YouTube audio playing in background
          setTimeout(() => {
            if (isPlayingRef.current && !manualPauseRef.current && ytPlayerRef.current) {
              try {
                const state = ytPlayerRef.current.getPlayerState?.();
                if (state === 2 || state === 3 || state === -1) {
                  ytPlayerRef.current.playVideo();
                }
              } catch {}
            }
          }, 120);
        }
      } else if (document.visibilityState === "visible") {
        if (isPlayingRef.current && !manualPauseRef.current && ytPlayerRef.current) {
          try {
            const state = ytPlayerRef.current.getPlayerState?.();
            if (state !== 1) {
              ytPlayerRef.current.playVideo();
            }
          } catch {}
        }
      }
    };

    const handleBlur = () => {
      if (isPlayingRef.current && !manualPauseRef.current && isBackgroundPlayRef.current) {
        startBackgroundAudioSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [startBackgroundAudioSession]);

  // ---------------------------------------------------------------------------
  // Lyrics Fetching & Synchronization Logic
  // ---------------------------------------------------------------------------
  const fetchTrackLyrics = async (title: string, artistName: string, reqId: number) => {
    setLyricsLoading(true);
    try {
      const res = await axios.get("/api/lyrics-synced", {
        params: {
          q: `${artistName} ${title}`.trim(),
          track: title,
          artist: artistName,
        },
        timeout: 10000,
      });

      if (!isMountedRef.current || reqId !== searchRequestIdRef.current) return;

      if (res.data?.status && res.data.syncedLyrics) {
        const parsed = parseLrcString(res.data.syncedLyrics, duration || currentTrack?.duration_seconds || 160);
        if (parsed.length > 0) {
          setSyncedLyrics(parsed);
          return;
        }
      }

      if (res.data?.status && res.data.plainLyrics) {
        const generated = generateCadenceLyrics(res.data.plainLyrics, duration || currentTrack?.duration_seconds || 160);
        setSyncedLyrics(generated);
        return;
      }

      setSyncedLyrics([]);
    } catch (err) {
      console.warn("Synced lyrics fetch error:", err);
      setSyncedLyrics([]);
    } finally {
      if (isMountedRef.current && reqId === searchRequestIdRef.current) {
        setLyricsLoading(false);
      }
    }
  };

  // Calculate current active lyric index based on official currentTime
  const activeLyricIndex = useMemo(() => {
    if (syncedLyrics.length === 0) return -1;
    let active = -1;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (currentTime >= syncedLyrics[i].startTime) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [currentTime, syncedLyrics]);

  // Active lyric line snippet (displayed above track title in screenshot 1)
  const activeLyricText = useMemo(() => {
    if (activeLyricIndex >= 0 && syncedLyrics[activeLyricIndex]) {
      const text = syncedLyrics[activeLyricIndex].text;
      if (text && text !== "♪") return text;
    }
    // Default placeholder snippet when before singing begins
    if (syncedLyrics.length > 0) {
      const firstLine = syncedLyrics.find((l) => l.text && l.text !== "♪");
      if (firstLine) return firstLine.text;
    }
    return "Even if we gotta risk it all right now, oh (now)";
  }, [activeLyricIndex, syncedLyrics]);

  // Smooth Auto-Scroll to Active Lyric
  useEffect(() => {
    if (userScrolledLyrics || !showLyricsSheet) return;

    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLyricIndex, userScrolledLyrics, showLyricsSheet]);

  const handleManualLyricsScroll = () => {
    setUserScrolledLyrics(true);
    if (autoScrollTimeoutRef.current) clearTimeout(autoScrollTimeoutRef.current);
    autoScrollTimeoutRef.current = setTimeout(() => {
      setUserScrolledLyrics(false);
    }, 4500);
  };

  const jumpToLyricLine = (line: SyncedLyricLine) => {
    handleSeek(line.startTime);
    setUserScrolledLyrics(false);
    if (!isPlaying && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.playVideo();
      } catch {}
    }
  };

  // ---------------------------------------------------------------------------
  // Search & Track Loading
  // ---------------------------------------------------------------------------
  const searchAndPlayTrack = async (targetQuery: string) => {
    const q = targetQuery.trim();
    if (!q) return;

    const currentReqId = ++searchRequestIdRef.current;
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setSyncedLyrics([]);
    setUserScrolledLyrics(false);
    pendingPlayRef.current = true;
    setIsPlaying(true);
    setIsBuffering(true);

    try {
      const res = await axios.get("/api/ytplay", { params: { q } });
      if (!isMountedRef.current || currentReqId !== searchRequestIdRef.current) return;

      if (!res.data || res.data.status !== true || !res.data.id) {
        throw new Error(res.data?.message || "Lagu tidak ditemukan.");
      }

      const songData: YtPlayData = res.data;
      setCurrentTrack(songData);
      setDuration(songData.duration_seconds || 0);

      // Check for direct MP3 audio stream for background playback (Mirip Spotify Downloader)
      if (songData.data?.url) {
        const stream = `/api/audio-proxy?url=${encodeURIComponent(songData.data.url)}`;
        setAudioStreamUrl(stream);
      } else {
        setIsAudioLoading(true);
        axios
          .get("/api/ytplay-audio", { params: { q: songData.title, id: songData.id } })
          .then((aRes) => {
            if (!isMountedRef.current || currentReqId !== searchRequestIdRef.current) return;
            if (aRes.data?.url) {
              const stream = `/api/audio-proxy?url=${encodeURIComponent(aRes.data.url)}`;
              setAudioStreamUrl(stream);
              setCurrentTrack((prev) => (prev ? { ...prev, data: aRes.data.data } : prev));
            }
          })
          .catch(() => {})
          .finally(() => {
            if (isMountedRef.current && currentReqId === searchRequestIdRef.current) {
              setIsAudioLoading(false);
            }
          });
      }

      // Initialize YouTube player engine
      setupYouTubePlayer(songData.id);

      // Fetch accurate synced lyrics
      const parsed = parseTrackInfo(songData.title, songData.channel);
      fetchTrackLyrics(parsed.song || songData.title, parsed.artist || songData.channel, currentReqId);
    } catch (err: any) {
      if (!isMountedRef.current || currentReqId !== searchRequestIdRef.current) return;
      setError(err.response?.data?.message || err.message || "Gagal memuat lagu.");
      setIsPlaying(false);
      setIsBuffering(false);
      pendingPlayRef.current = false;
    } finally {
      if (isMountedRef.current && currentReqId === searchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Auto-initialize with "Sunflower" on mount (matching user's screenshots exactly)
  useEffect(() => {
    isMountedRef.current = true;
    searchAndPlayTrack("Post Malone, Swae Lee - Sunflower");

    return () => {
      isMountedRef.current = false;
      if (autoScrollTimeoutRef.current) clearTimeout(autoScrollTimeoutRef.current);
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Keyboard controls (Space for play/pause, Arrows for seek, M for mute)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleSeek(currentTime - 5);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleSeek(currentTime + 5);
      } else if (e.code === "KeyM") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying, currentTime, isMuted]);

  // Progress percentage
  const currentProgress = duration > 0 ? Math.min(100, ((isScrubbing ? scrubTime : currentTime) / duration) * 100) : 0;

  return (
    <>
      <div
        id="spotify-music-player-root"
        className={
          isMinimized
            ? "fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
            : "fixed inset-0 z-50 bg-gradient-to-b from-[#0a2f38] via-[#081f25] to-[#040f12] text-white flex flex-col justify-between overflow-hidden font-sans select-none"
        }
      >
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP BAR (Matching Screenshot 1) */}
      {/* --------------------------------------------------------------------- */}
      <header className="px-5 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        {/* Chevron down back button */}
        <button
          onClick={() => {
            if (showLyricsSheet) {
              setShowLyricsSheet(false);
            } else if (onBack) {
              onBack();
            }
          }}
          className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition cursor-pointer"
          title="Tutup / Kembali"
        >
          <ChevronDown className="w-7 h-7" />
        </button>

        {/* Center Title */}
        <div className="text-center px-4">
          <p className="text-[11px] font-semibold tracking-wider text-white/70 uppercase">
            Direkomendasikan untukmu
          </p>
          {showLyricsSheet && (
            <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {parsedTrack.song}
            </p>
          )}
        </div>

        {/* Three dots options */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition cursor-pointer"
            title="Opsi"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showOptionsMenu && (
            <div className="absolute right-0 top-12 w-64 bg-[#12282e]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-2xl z-40 space-y-1.5 text-xs">
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setShowOptionsMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white/90"
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Cari Lagu Lain</span>
              </button>

              <button
                onClick={() => {
                  setIsBackgroundPlay((prev) => !prev);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white/90"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Putar di Latar Belakang</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBackgroundPlay ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40" : "bg-white/10 text-white/40"}`}>
                  {isBackgroundPlay ? "AKTIF" : "NONAKTIF"}
                </span>
              </button>

              <button
                onClick={() => {
                  setPlaybackMode((prev) => (prev === "audio" ? "video" : "audio"));
                  setShowOptionsMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white/90"
              >
                {playbackMode === "audio" ? (
                  <>
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>Alihkan ke Mode Video</span>
                  </>
                ) : (
                  <>
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span>Alihkan ke Mode Audio</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (currentTrack?.id) {
                    navigator.clipboard?.writeText(`https://youtu.be/${currentTrack.id}`);
                  }
                  setShowOptionsMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-white/90"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Salin Tautan YouTube</span>
              </button>
              {currentTrack?.data?.url && (
                <a
                  href={`/api/audio-proxy?url=${encodeURIComponent(currentTrack.data.url)}`}
                  download={currentTrack.data.filename || `${parsedTrack.song}.mp3`}
                  onClick={() => setShowOptionsMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 text-emerald-300 font-medium"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Unduh MP3 ({currentTrack.data.size || "128kbps"})</span>
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. MAIN PLAYER VIEW (Permanently mounted in DOM so YouTube IFrame persists) */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col justify-between max-w-md w-full mx-auto px-6 pb-4 overflow-y-auto transition-opacity duration-300 ${
          showLyricsSheet
            ? "opacity-0 pointer-events-none absolute inset-x-0 -z-10"
            : "opacity-100 relative z-10"
        }`}
      >
          {/* Album Cover Art / YouTube Video Centerpiece */}
          <div className="my-auto py-2 flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[360px] rounded-[24px] overflow-hidden bg-black/50 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/[0.08] group">
              {/* Always-Mounted YouTube IFrame Container */}
              <div
                ref={ytPlayerContainerRef}
                className={`w-full h-full transition-opacity duration-300 ${
                  playbackMode === "video" ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none z-0"
                }`}
              />

              {/* Cover Artwork Image (Displayed in Audio Mode) */}
              {playbackMode === "audio" && (
                <div className="relative z-10 w-full h-full">
                  {currentTrack?.thumbnail ? (
                    <img
                      src={currentTrack.thumbnail}
                      alt={parsedTrack.song}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-cyan-950/40 to-teal-800/30">
                      {isLoading ? (
                        <Loader2 className="w-12 h-12 text-teal-300 animate-spin" />
                      ) : (
                        <Sparkles className="w-12 h-12 text-teal-300/40" />
                      )}
                    </div>
                  )}

                  {/* Mode Badge in top corner */}
                  <button
                    onClick={() => handleSwitchMode("video")}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/80 hover:text-white flex items-center gap-1 cursor-pointer transition hover:scale-105 active:scale-95"
                    title="Beralih ke Video"
                  >
                    <Video className="w-3 h-3 text-cyan-400" />
                    <span>Tonton Video</span>
                  </button>
                </div>
              )}

              {/* In Video Mode: Audio mode toggle pill */}
              {playbackMode === "video" && (
                <button
                  onClick={() => handleSwitchMode("audio")}
                  className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/80 hover:text-white flex items-center gap-1 cursor-pointer transition hover:scale-105 active:scale-95"
                  title="Kembali ke Tampilan Cover"
                >
                  <Headphones className="w-3 h-3 text-emerald-400" />
                  <span>Cover Lagu</span>
                </button>
              )}
            </div>

            {/* Realtime Lyric Teaser Snippet (Matching Screenshot 1: Right above track title) */}
            <div
              onClick={() => setShowLyricsSheet(true)}
              className="w-full max-w-[360px] mt-4 px-1 py-1 cursor-pointer group"
              title="Ketuk untuk melihat lirik lengkap"
            >
              <p className="text-sm font-semibold text-white/90 group-hover:text-emerald-300 transition truncate leading-relaxed">
                {activeLyricText}
              </p>
            </div>
          </div>

          {/* Track Title, Artist & Like/Minus Actions (Matching Screenshot 1) */}
          <div className="w-full max-w-[360px] mx-auto flex items-center justify-between gap-3 mt-1">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {parsedTrack.song}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                </span>
                <p className="text-sm font-medium text-white/60 truncate">
                  {parsedTrack.artist}
                </p>
              </div>
            </div>

            {/* Action buttons on right (Minus & Plus/Check) */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleNextTrack()}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 transition cursor-pointer"
                title="Lewati lagu"
              >
                <Minus className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsLiked((prev) => !prev)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isLiked ? "text-emerald-400" : "text-white/80 hover:text-white"
                }`}
                title={isLiked ? "Hapus dari Favorit" : "Simpan ke Favorit"}
              >
                {isLiked ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Scrubber Progress Bar (Matching Screenshot 1) */}
          <div className="w-full max-w-[360px] mx-auto mt-4 space-y-1.5">
            <div
              className="relative py-2 cursor-pointer touch-none"
              onMouseDown={(e) => {
                setIsScrubbing(true);
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setScrubTime(ratio * (duration || 1));
              }}
              onMouseMove={(e) => {
                if (!isScrubbing) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setScrubTime(ratio * (duration || 1));
              }}
              onMouseUp={() => {
                if (isScrubbing) {
                  handleSeek(scrubTime);
                  setIsScrubbing(false);
                }
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                handleSeek(ratio * (duration || 1));
              }}
            >
              <div className="h-1 bg-white/20 rounded-full relative overflow-visible">
                <div
                  className="h-full bg-white rounded-full relative"
                  style={{ width: `${currentProgress}%` }}
                >
                  {/* Spotify White Circular Thumb */}
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-medium text-white/50 tabular-nums">
              <span>{formatTime(isScrubbing ? scrubTime : currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Playback Controls: Shuffle, Prev, Huge Circular Play/Pause, Next, Loop */}
          <div className="w-full max-w-[360px] mx-auto mt-2 flex items-center justify-between">
            {/* Shuffle */}
            <button
              onClick={() => setIsShuffle((prev) => !prev)}
              className={`p-2 transition cursor-pointer active:scale-90 ${
                isShuffle ? "text-emerald-400" : "text-white/60 hover:text-white"
              }`}
              title="Acak"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              onClick={handlePrevTrack}
              className="p-2 text-white/80 hover:text-white active:scale-90 transition cursor-pointer"
              title="Sebelumnya"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            {/* Huge Circular White Play / Pause Button (The centerpiece from Screenshot 1 & 2) */}
            <button
              id="spotify-huge-play-button"
              onClick={handleTogglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isPlaying ? "Jeda" : "Putar"}
            >
              {isBuffering && !isPlaying ? (
                <Loader2 className="w-7 h-7 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNextTrack}
              className="p-2 text-white/80 hover:text-white active:scale-90 transition cursor-pointer"
              title="Berikutnya"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            {/* Repeat / Loop */}
            <button
              onClick={() => setIsRepeat((prev) => !prev)}
              className={`p-2 transition cursor-pointer active:scale-90 ${
                isRepeat ? "text-emerald-400" : "text-white/60 hover:text-white"
              }`}
              title="Ulangi"
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Row Utilities (Device, Share, Queue/Search) */}
          <div className="w-full max-w-[360px] mx-auto mt-4 flex items-center justify-between text-white/60 px-1">
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className="p-1 hover:text-white transition cursor-pointer"
              title={isMuted ? "Bunyikan" : "Bisukan"}
            >
              <Laptop2 className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (navigator.share && currentTrack) {
                    navigator.share({ title: currentTrack.title, url: `https://youtu.be/${currentTrack.id}` }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                className="p-1 hover:text-white transition cursor-pointer"
                title="Bagikan"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowSearchModal(true)}
                className="p-1 hover:text-white transition cursor-pointer"
                title="Daftar Putar & Cari"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PWA Background Play Active Pill */}
          <div className="w-full max-w-[360px] mx-auto mt-3 flex items-center justify-center gap-1.5 text-[10px] font-medium text-teal-300/90 bg-teal-950/40 border border-teal-500/20 py-1 px-3 rounded-full select-none">
            <Radio className={`w-3 h-3 ${isPlaying ? "text-emerald-400 animate-pulse" : "text-white/40"}`} />
            <span>
              {isBackgroundPlay ? "Background Play Aktif (Tetap menyala di luar PWA)" : "Background Play Dimatikan"}
            </span>
          </div>

          {/* Bottom Card: "Pratinjau lirik" Drawer (Matching Screenshot 1 Bottom) */}
          <div
            onClick={() => setShowLyricsSheet(true)}
            className="w-full max-w-[360px] mx-auto mt-2.5 p-4 rounded-2xl bg-[#0e3b45]/70 hover:bg-[#0e3b45]/90 border border-white/10 backdrop-blur-md cursor-pointer transition transform hover:-translate-y-0.5 active:translate-y-0 select-none shadow-lg"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                Pratinjau lirik
              </span>
              {lyricsLoading ? (
                <div className="flex items-center gap-1 text-[10px] text-teal-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Memuat...</span>
                </div>
              ) : (
                <span className="text-[10px] text-white/50 font-medium">Buka Lirik</span>
              )}
            </div>
            <p className="text-sm font-semibold text-white/80 line-clamp-2 leading-snug">
              {activeLyricText}
            </p>
          </div>
        </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. FULL SCREEN LYRICS VIEW (Matching Screenshot 2) */}
      {/* --------------------------------------------------------------------- */}
      {showLyricsSheet && (
        <div className="flex-1 flex flex-col justify-between max-w-lg w-full mx-auto px-6 pb-6 overflow-hidden relative z-20">
          {/* Lyrics Stream Container */}
          <div
            ref={lyricsScrollContainerRef}
            onScroll={handleManualLyricsScroll}
            className="flex-1 overflow-y-auto pr-2 py-8 space-y-5 select-none scrollbar-none"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 12%, black 85%, transparent 100%)",
            }}
          >
            {syncedLyrics.length > 0 ? (
              syncedLyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <div
                    key={line.id}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => jumpToLyricLine(line)}
                    className={`transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "text-white text-2xl sm:text-3xl font-extrabold scale-102 origin-left drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                        : "text-teal-200/40 hover:text-teal-100/70 text-xl sm:text-2xl font-bold"
                    }`}
                  >
                    {line.text}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-3">
                {lyricsLoading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-teal-300" />
                    <p className="text-sm font-medium">Menyinkronkan lirik dengan LrcLib...</p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-white/60">Lirik tidak tersedia untuk lagu ini</p>
                    <p className="text-xs text-white/30">Anda tetap dapat menikmati audio atau video musik di player.</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom Bar on Lyrics Screen (Matching Screenshot 2 Bottom) */}
          <div className="shrink-0 pt-3 border-t border-white/10 space-y-3">
            {/* Scrubber on Lyrics View */}
            <div
              className="relative py-2 cursor-pointer touch-none"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                handleSeek(ratio * (duration || 1));
              }}
            >
              <div className="h-1 bg-white/20 rounded-full relative overflow-visible">
                <div
                  className="h-full bg-white rounded-full relative"
                  style={{ width: `${currentProgress}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Time stamps & Controls on Lyrics View (Screenshot 2: Share on left, Scrubber, Round Play Button center) */}
            <div className="flex items-center justify-between text-white/60">
              <button
                onClick={() => {
                  if (navigator.share && currentTrack) {
                    navigator.share({ title: currentTrack.title, url: `https://youtu.be/${currentTrack.id}` }).catch(() => {});
                  }
                }}
                className="p-2 hover:text-white transition cursor-pointer"
                title="Bagikan"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <div className="text-xs font-medium tabular-nums text-white/50">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Huge Circular White Play/Pause Button */}
              <button
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
                title={isPlaying ? "Jeda" : "Putar"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. SEARCH / QUEUE MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a272e] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Cari Lagu Baru</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  searchAndPlayTrack(searchQuery);
                  setShowSearchModal(false);
                }
              }}
              className="relative"
            >
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lagu atau artis apa saja..."
                autoFocus
                className="w-full pl-10 pr-24 py-2.5 bg-white/10 border border-white/10 focus:border-emerald-400 rounded-full text-sm text-white placeholder-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                <span>Putar</span>
              </button>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Pilih Lagu Populer (Langsung Putar):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {CURATED_TRACKS.map((t) => {
                  const isCurrent = currentTrack && currentTrack.title.toLowerCase().includes(t.label.toLowerCase());
                  return (
                    <button
                      key={t.label}
                      onClick={() => {
                        searchAndPlayTrack(t.query);
                        setShowSearchModal(false);
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between group active:scale-98 ${
                        isCurrent
                          ? "bg-emerald-500/20 border-emerald-500/50 text-white"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white/90"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold truncate group-hover:text-emerald-300 transition">
                          {t.label}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          {t.artist}
                        </p>
                      </div>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition ${
                        isCurrent ? "bg-emerald-500 text-black" : "bg-white/10 group-hover:bg-white/20 text-white"
                      }`}>
                        <Play className="w-3 h-3 fill-current translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden 0.1s silent loop audio element to keep OS audio pipeline active during background playback */}
      <audio
        ref={silentAudioRef}
        src={SILENT_AUDIO_URI}
        loop
        playsInline
        preload="auto"
        className="hidden"
        aria-hidden="true"
      />

      {/* HTML5 Native Audio Stream for Seamless Background Playback (Mirip Spotify Downloader) */}
      <audio
        ref={htmlAudioRef}
        src={audioStreamUrl || undefined}
        loop={isRepeat}
        playsInline
        preload="auto"
        className="hidden"
        aria-hidden="true"
        onPlay={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onTimeUpdate={(e) => {
          if (!isScrubbing) {
            const el = e.currentTarget;
            setCurrentTime(el.currentTime);
            if (el.duration && !isNaN(el.duration)) {
              setDuration(el.duration);
            }
          }
        }}
        onEnded={() => {
          if (isRepeatRef.current) {
            if (htmlAudioRef.current) {
              htmlAudioRef.current.currentTime = 0;
              htmlAudioRef.current.play().catch(() => {});
            }
          } else {
            handleNextTrack();
          }
        }}
        onError={(e) => {
          console.warn("HTML5 audio playback error in background:", e);
        }}
      />
    </div>

    {/* Floating Mini Player Widget (matching Spotify / Apple Music background playback) */}
    {isMinimized && (
      <div
        id="fixio-ytplay-mini-player"
        className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-50 bg-[#0c181f]/95 backdrop-blur-2xl border border-teal-500/40 shadow-[0_12px_45px_rgba(0,0,0,0.85)] rounded-2xl p-2.5 flex items-center justify-between gap-3 text-white cursor-pointer select-none transition-all hover:border-teal-400 active:scale-[0.99] group"
        onClick={() => {
          if (onMaximize) onMaximize();
        }}
        title="Ketuk untuk membuka pemutar musik lengkap"
      >
        {/* Progress bar line at top edge */}
        <div className="absolute top-0 left-3 right-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Mini Album Cover Thumbnail */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/10 shadow-md">
          {currentTrack?.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={parsedTrack.song}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-teal-900/30">
              <Headphones className="w-5 h-5 text-teal-400" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
            </div>
          )}
        </div>

        {/* Song & Artist Info */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-teal-300 transition-colors">
            {parsedTrack.song}
          </p>
          <p className="text-[11px] text-white/60 truncate leading-tight mt-0.5">
            {parsedTrack.artist}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wide text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded-md border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Latar Belakang Aktif
            </span>
            <span className="text-[10px] text-white/40 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Mini Playback Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleTogglePlay}
            className="w-9 h-9 rounded-full bg-teal-400 hover:bg-teal-300 text-black flex items-center justify-center transition hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            title={isPlaying ? "Jeda" : "Putar"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>
          <button
            onClick={handleNextTrack}
            className="w-8 h-8 rounded-full text-white/70 hover:text-white flex items-center justify-center hover:bg-white/10 active:scale-90 transition cursor-pointer"
            title="Lagu Berikutnya"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
          {onClosePlayer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClosePlayer();
              }}
              className="w-7 h-7 rounded-full text-white/40 hover:text-white flex items-center justify-center hover:bg-white/10 transition ml-0.5 cursor-pointer"
              title="Tutup Pemutar Musik"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    )}
  </>
);
};
