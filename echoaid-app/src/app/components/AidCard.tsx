"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getSolanaProvider, sendMicroGrant, solscanUrl } from "../lib/useSolana";


type Language = "en" | "es";
type AudioState = "idle" | "loading" | "ready" | "playing" | "error";

interface AidCardProps {
  id: string;
  titleEn: string;
  titleEs?: string;
  excerptEn: string;
  excerptEs?: string;
  accentColor: string;
  glowColor: string;
  icon: string;
  beneficiaryWallet: string;
  language?: Language;
  children?: React.ReactNode;
}

export default function AidCard({
  id,
  titleEn,
  titleEs,
  excerptEn,
  excerptEs,
  accentColor,
  glowColor,
  icon,
  beneficiaryWallet,
  children,
}: AidCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const handleBoost = async () => {
    if (txSignature) return;

    const provider = getSolanaProvider();

    if (!provider) {
      alert("Please install a Solana wallet extension (like Phantom) to boost!");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const signature = await sendMicroGrant(provider, beneficiaryWallet);
      setTxSignature(signature);
    }
    finally {
      setIsProcessing(false);
    }
  };



  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [isHovered, setIsHovered] = useState(false);
  const [donateState, setDonateState] = useState<"idle" | "pending" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const title = titleEn;
  const excerpt = excerptEn;

  const isPlaying = audioState === "playing";
  const isLoading = audioState === "loading";

  // ── Revoke on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // ── Fetch audio from our API route and return an object URL ─────────────
  const fetchAudio = useCallback(async (text: string): Promise<string> => {
    const res = await fetch("/api/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? `API error ${res.status}`);
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }, []);

  // ── Main play / pause handler ────────────────────────────────────────────
  const handlePlayPause = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;

    // — Already playing: pause —
    if (audioState === "playing") {
      el.pause();
      setAudioState("ready");
      return;
    }

    // — Already have a loaded URL: just resume —
    if (audioState === "ready") {
      await el.play();
      setAudioState("playing");
      return;
    }

    // — Need to fetch from ElevenLabs —
    setAudioState("loading");
    setErrorMsg(null);

    try {
      // Revoke any previous URL first
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const objectUrl = await fetchAudio(excerpt);
      objectUrlRef.current = objectUrl;

      el.src = objectUrl;
      el.load();

      // Wait for the browser to be ready to play
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => { el.removeEventListener("canplaythrough", onCanPlay); resolve(); };
        const onError = () => { el.removeEventListener("error", onError); reject(new Error("Audio decode error")); };
        el.addEventListener("canplaythrough", onCanPlay);
        el.addEventListener("error", onError);
      });

      await el.play();
      setAudioState("playing");
    } catch (err) {
      console.error("[EchoAid] TTS fetch failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setAudioState("error");
    }
  }, [audioState, excerpt, fetchAudio]);

  const handleAudioEnd = () => setAudioState("ready");


  // ── Button label & icon helper ───────────────────────────────────────────
  const playButtonIcon = () => {
    if (isLoading) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="28" strokeDashoffset="10"
            style={{ animation: "spinIcon 0.8s linear infinite", transformOrigin: "center" }} />
        </svg>
      );
    }
    if (isPlaying) {
      return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="white">
          <rect x="1" y="1" width="4" height="11" rx="1" />
          <rect x="8" y="1" width="4" height="11" rx="1" />
        </svg>
      );
    }
    return (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="white">
        <path d="M2 1.5l10 5L2 11.5V1.5z" />
      </svg>
    );
  };

  return (
    <article
      id={`aid-card-${id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        flex: 1,
        borderRadius: "20px",
        padding: "24px",
        background: "var(--bg-card)",
        border: "1px solid",
        borderColor: isHovered ? `${accentColor}44` : "rgba(139,92,246,0.15)",
        boxShadow: isHovered ? `0 0 40px ${glowColor}` : "none",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.35s ease",
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: "24px", right: "24px",
        height: "1px", borderRadius: "999px",
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
      }} />

      {/* Top Content Block (Fills available space so bottom actions align) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Icon + Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px", minHeight: "54px" }}>
          <div style={{
            flexShrink: 0, width: "48px", height: "48px", borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px",
            background: `${accentColor}20`, border: `1px solid ${accentColor}40`,
          }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.35, color: "var(--text-primary)", margin: 0 }}>
              {title}
            </h2>
            <p style={{ fontSize: "11px", fontFamily: "monospace", color: accentColor, marginTop: "4px" }}>
              {beneficiaryWallet.slice(0, 8)}…{beneficiaryWallet.slice(-4)}
            </p>
          </div>
        </div>

        {/* Excerpt */}
        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--text-muted)", flex: 1, marginBottom: "20px" }}>
          {excerpt}
        </p>
      </div>

      {/* ── Bottom Controls (Always pinned to bottom) ─────────────────── */}
      <div style={{ marginTop: "auto", width: "100%" }}>
        {/* ── Audio Player ─────────────────────────────────────────────────── */}
        <div style={{
          borderRadius: "14px", padding: "10px 14px", marginBottom: "14px",
          display: "flex", alignItems: "center", gap: "12px",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Play / Pause / Loading button */}
          <button
            id={`play-btn-${id}`}
            onClick={handlePlayPause}
            disabled={isLoading}
            aria-label={isLoading ? "Loading audio…" : isPlaying ? "Pause audio" : "Play audio"}
            style={{
              flexShrink: 0, width: "38px", height: "38px", borderRadius: "10px",
              border: "none", cursor: isLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: audioState === "error"
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
              transition: "transform 0.15s ease",
              opacity: isLoading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => !isLoading && ((e.currentTarget as HTMLElement).style.transform = "scale(1.08)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
          >
            {playButtonIcon()}
          </button>

          {/* Status label / error message */}
          {audioState === "error" ? (
            <p style={{ fontSize: "11px", color: "#f87171", flex: 1, margin: 0 }}>
              {errorMsg ?? "Failed to load audio"}
            </p>
          ) : (
            /* Waveform bars */
            <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1, height: "28px" }}>
              {Array.from({ length: 26 }).map((_, i) => {
                const h = 30 + Math.sin(i * 0.8) * 20;
                return (
                  <div key={i} style={{
                    flex: 1, borderRadius: "2px", height: `${h}%`,
                    background: isPlaying ? accentColor : "rgba(255,255,255,0.15)",
                    opacity: isPlaying ? 0.6 + Math.abs(Math.sin(i * 0.6)) * 0.4 : isLoading ? 0.25 : 0.4,
                    transformOrigin: "center",
                    animation: isPlaying
                      ? `waveBar ${0.5 + (i % 4) * 0.15}s ease-in-out infinite alternate`
                      : "none",
                  }} />
                );
              })}
            </div>
          )}

          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)", flexShrink: 0 }}>
            {isLoading ? "…" : isPlaying ? "▶ Live" : audioState === "ready" ? "Paused" : "0:00"}
          </span>

          <audio ref={audioRef} onEnded={handleAudioEnd} />
        </div>

        {/* ── Boost Section ─────────────────────────────────────────────────── */}
        {children ? (
          <div style={{ marginTop: "16px" }}>{children}</div>
        ) : (
          <>
            <button
              id={`donate-btn-${id}`}
              onClick={handleBoost}
              disabled={isProcessing || !!txSignature}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "12px",
                border: "none", cursor: (isProcessing || txSignature) ? "not-allowed" : "pointer",
                fontSize: "0.875rem", fontWeight: 600, transition: "all 0.3s ease",
                background:
                  txSignature ? "linear-gradient(135deg, #10b981, #059669)"
                    : isProcessing ? "rgba(255,255,255,0.08)"
                      : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                color: isProcessing ? "var(--text-muted)" : "white",
                boxShadow: !txSignature && !isProcessing ? `0 4px 20px ${accentColor}44` : "none",
              }}
              onMouseEnter={(e) => {
                if (!isProcessing && !txSignature) (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              {txSignature ? "✓ Donation Confirmed!"
                : isProcessing ? "Signing transaction…"
                  : "⚡ Boost with 0.05 SOL"}
            </button>

            {/* Live Verifiable Chain-Proof Link */}
            {txSignature && (
              <a
                href={solscanUrl(txSignature)}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "11px", color: "#34d399", textDecoration: "underline",
                  marginTop: "10px", display: "block", textAlign: "center", fontFamily: "monospace"
                }}
              >
                View Verified Proof on Solscan
              </a>
            )}
          </>
        )}
      </div>


      <style>{`
        @keyframes spinIcon {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes waveBar {
          from { transform: scaleY(0.5); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </article>
  );
}
