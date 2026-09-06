"use client";

import { useEffect, useRef, useState } from "react";

interface HeroVideoBackgroundProps {
  portalTargetId?: string;
}

interface VideoClip {
  id: string;
  title: string;
  src: string;
  fallbackSrc?: string;
}

const CLIPS: VideoClip[] = [
  {
    id: "students-laptop",
    title: "Students with Laptop in School",
    src: "/two-schoolboys-with-laptop.mp4",
    fallbackSrc:
      "https://videos.pexels.com/video-files/11025500/11025500-hd_2160_4096_25fps.mp4",
  },
  {
    id: "computer-lab-gaming",
    title: "Computer Lab & Hardware Rigs",
    src: "/men-computer-gaming.mp4",
    fallbackSrc:
      "https://videos.pexels.com/video-files/7914780/7914780-hd_1920_1080_25fps.mp4",
  },
];

export default function HeroVideoBackground({
  portalTargetId = "organizer-portal",
}: HeroVideoBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Dynamically calculate container height to frame the hero down through the organizer portal
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const portalEl = document.getElementById(portalTargetId);
      let height = 740;

      if (portalEl) {
        const portalRect = portalEl.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        height = Math.max(540, Math.floor(portalRect.top + scrollTop + 40));
      } else {
        height = Math.min(window.innerHeight * 0.92, 800);
      }

      container.style.height = `${height}px`;
    };

    window.addEventListener("resize", updateDimensions);
    updateDimensions();

    const timer1 = setTimeout(updateDimensions, 250);
    const timer2 = setTimeout(updateDimensions, 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [portalTargetId]);

  // Keep both videos playing silently in the background so crossfades are instant and seamless
  useEffect(() => {
    videoRefs.current.forEach((vid) => {
      if (vid) {
        vid.play().catch(() => {});
      }
    });
  }, []);

  // Seamless cycling loop: crossfade between Clip 1 and Clip 2 every 9 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % CLIPS.length;
        const nextVid = videoRefs.current[next];
        if (nextVid) {
          // Restart clip from beginning if near end for fresh loop
          if (nextVid.currentTime > nextVid.duration - 2) {
            nextVid.currentTime = 0;
          }
          nextVid.play().catch(() => {});
        }
        return next;
      });
    }, 9000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    videoRefs.current.forEach((vid) => {
      if (!vid) return;
      if (nextState) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  };

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 740,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: "#030408",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 65%, rgba(0, 0, 0, 0.6) 85%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, black 0%, black 65%, rgba(0, 0, 0, 0.6) 85%, transparent 100%)",
      }}
    >
      {/* ── Dual Background Video Layer with Smooth 1.4s Cross-fade ───── */}
      {CLIPS.map((clip, index) => {
        const isActive = activeIdx === index;
        return (
          <video
            key={clip.id}
            ref={(el) => {
              videoRefs.current[index] = el;
            }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              minWidth: "100%",
              minHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "cover",
              filter: "brightness(0.76) contrast(1.08) saturate(1.15)",
              opacity: isActive ? 1 : 0,
              transition: "opacity 1.4s ease-in-out",
              zIndex: isActive ? 1 : 0,
            }}
          >
            <source src={clip.src} type="video/mp4" />
            {clip.fallbackSrc && <source src={clip.fallbackSrc} type="video/mp4" />}
          </video>
        );
      })}

      {/* ── Overlay 1: Semi-transparent dark cinematic film ────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background:
            "linear-gradient(to bottom, rgba(3, 4, 8, 0.58) 0%, rgba(3, 4, 8, 0.66) 45%, rgba(3, 4, 8, 0.92) 82%, #030408 100%)",
        }}
      />

      {/* ── Overlay 2: Ambient Radial Glow (Solana Violet & Cyan highlight) ─ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          background:
            "radial-gradient(circle at 50% 25%, rgba(124, 58, 237, 0.16) 0%, rgba(20, 241, 149, 0.06) 45%, transparent 75%)",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Overlay 3: Subtle cybernetic micro-grid for tech texture ──── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.7,
        }}
      />

      {/* ── Sonos-style Video Indicator & Play/Pause Controls ─────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          right: "28px",
          pointerEvents: "auto",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Clip switcher indicator dots */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "999px",
            padding: "6px 12px",
          }}
        >
          {CLIPS.map((clip, i) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              title={clip.title}
              aria-label={`Switch to ${clip.title}`}
              style={{
                width: activeIdx === i ? "20px" : "7px",
                height: "7px",
                borderRadius: "999px",
                background:
                  activeIdx === i
                    ? "linear-gradient(90deg, #38bdf8, #a78bfa)"
                    : "rgba(255, 255, 255, 0.3)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Play / Pause Toggle Button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause background video" : "Play background video"}
          title={isPlaying ? "Pause background video" : "Play background video"}
          style={{
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255, 255, 255, 0.85)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "13px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(124, 58, 237, 0.6)";
            (e.currentTarget as HTMLElement).style.borderColor = "#a78bfa";
            (e.currentTarget as HTMLElement).style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(15, 23, 42, 0.65)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.15)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255, 255, 255, 0.85)";
          }}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>
    </div>
  );
}
