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
} from "lucide-react";
import axios from "axios";

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

interface YtPlayToolProps {
  onBack?: () => void;
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

export const YtPlayTool: React.FC<YtPlayToolProps> = ({ onBack }) => {
  // Navigation & UI mode states
  const [showLyricsSheet, setShowLyricsSheet] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<"audio" | "video">("audio");
  const [isLiked, setIsLiked] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

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

  // DOM Refs
  const ytPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const activeLyricRef = useRef<HTMLDivElement | null>(null);
  const lyricsScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollTimeoutRef = useRef<any>(null);
  const isRepeatRef = useRef(isRepeat);
  const isMountedRef = useRef(true);
  const searchRequestIdRef = useRef(0);
  const pendingPlayRef = useRef(false);

  // Keep repeat ref in sync for event listeners
  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

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

    const onPlayerReady = (event: any) => {
      ytPlayerRef.current = event.target;
      try {
        event.target.setVolume(isMuted ? 0 : volume * 100);
        const d = event.target.getDuration();
        if (d > 0) setDuration(d);

        // If user tapped play before player was ready or on track switch
        if (pendingPlayRef.current || isPlaying) {
          event.target.playVideo();
          setIsPlaying(true);
        } else {
          // Attempt auto-start
          event.target.playVideo();
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn("Autoplay notice:", err);
      }
    };

    const onPlayerStateChange = (event: any) => {
      // Official YouTube API State enum:
      // -1: UNSTARTED, 0: ENDED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: CUED
      const state = event.data;

      if (state === 1) { // PLAYING
        setIsPlaying(true);
        setIsBuffering(false);
        pendingPlayRef.current = false;
        const d = event.target.getDuration();
        if (d > 0) setDuration(d);
      } else if (state === 2) { // PAUSED
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
        setIsPlaying(false);
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
        // Official YouTube API: loadVideoById(videoId: string, startSeconds: number)
        ytPlayerRef.current.loadVideoById(videoId, 0);
        if (typeof ytPlayerRef.current.playVideo === "function") {
          ytPlayerRef.current.playVideo();
        }
        setIsPlaying(true);
        setIsBuffering(true);
        pendingPlayRef.current = false;
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
          playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            fs: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
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
        }
      }, 100);

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === "function") prevCallback();
        clearInterval(checkInterval);
        createPlayer();
      };
    }
  }, [isMuted, volume, isPlaying]);

  // Continuous accurate time tracking via requestAnimationFrame (Zero setInterval)
  useEffect(() => {
    let animId: number;

    const updatePlayTime = () => {
      if (ytPlayerRef.current && !isScrubbing) {
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
  }, [isScrubbing, duration]);

  // Volume & Mute synchronizer
  useEffect(() => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      try {
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(volume * 100));
        }
      } catch {}
    }
  }, [volume, isMuted]);

  // ---------------------------------------------------------------------------
  // YouTube Playback Action Controls (Invoking YouTube API directly)
  // ---------------------------------------------------------------------------
  const handleTogglePlay = () => {
    if (!ytPlayerRef.current) {
      if (currentTrack?.id) {
        pendingPlayRef.current = true;
        setIsPlaying(true);
        setIsBuffering(true);
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
      if (playerState === 1 || playerState === 3 || isPlaying) {
        if (typeof ytPlayerRef.current.pauseVideo === "function") {
          ytPlayerRef.current.pauseVideo();
        }
        setIsPlaying(false);
        setIsBuffering(false);
        pendingPlayRef.current = false;
      } else {
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
        setupYouTubePlayer(currentTrack.id);
      }
    }
  };

  const handleSeek = (targetSeconds: number) => {
    const clamped = Math.max(0, Math.min(duration || 1000, targetSeconds));
    setCurrentTime(clamped);
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

      // Directly change song and start playing
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
    <div
      id="spotify-music-player-root"
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#0a2f38] via-[#081f25] to-[#040f12] text-white flex flex-col justify-between overflow-hidden font-sans select-none"
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
            <div className="absolute right-0 top-12 w-56 bg-[#12282e]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-40 space-y-1 text-xs">
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
                    onClick={() => setPlaybackMode("video")}
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
                  onClick={() => setPlaybackMode("audio")}
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
              {isBuffering ? (
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

          {/* Bottom Card: "Pratinjau lirik" Drawer (Matching Screenshot 1 Bottom) */}
          <div
            onClick={() => setShowLyricsSheet(true)}
            className="w-full max-w-[360px] mx-auto mt-4 p-4 rounded-2xl bg-[#0e3b45]/70 hover:bg-[#0e3b45]/90 border border-white/10 backdrop-blur-md cursor-pointer transition transform hover:-translate-y-0.5 active:translate-y-0 select-none shadow-lg"
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
    </div>
  );
};
