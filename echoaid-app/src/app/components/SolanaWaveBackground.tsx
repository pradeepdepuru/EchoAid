"use client";

import { useEffect, useRef } from "react";

interface SolanaWaveBackgroundProps {
  /** Optional ID of the element where the animation should stop */
  portalTargetId?: string;
}

export default function SolanaWaveBackground({
  portalTargetId = "organizer-portal",
}: SolanaWaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isVisible = true;

    // Mouse tracking for magnetic attraction and gentle parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetMouseX = (e.clientX / innerWidth - 0.5) * 50;
      targetMouseY = (e.clientY / innerHeight - 0.5) * 40;
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Calculate height dynamically up to the organizer portal
    const updateDimensions = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;

      // Find the organizer portal element
      const portalEl = document.getElementById(portalTargetId);
      if (portalEl) {
        const portalRect = portalEl.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        // End slightly before or right at the top of the organizer portal
        height = Math.max(520, Math.floor(portalRect.top + scrollTop + 20));
      } else {
        height = Math.min(window.innerHeight * 0.88, 760);
      }

      container.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial check + slight delay check in case font/DOM takes a tick to layout
    updateDimensions();
    const timer = setTimeout(updateDimensions, 400);

    // ── Crowdfunding Simulation Data Models ─────────────────────────────────

    // 1. Tributary Donors / Community Micro-Streams (Floating towards wave)
    interface MicroDonorStream {
      x: number;
      y: number;
      startX: number;
      startY: number;
      progress: number; // 0 to 1
      speed: number;
      targetT: number; // target parameter along wave (0 to 1)
      color: string;
      glowColor: string;
      size: number;
      symbol?: string; // e.g. "◎" or spark
    }

    const donorColors = [
      { color: "#14F195", glow: "rgba(20, 241, 149, 0.6)", symbol: "◎" }, // Solana Green
      { color: "#9945FF", glow: "rgba(153, 69, 255, 0.6)" },             // Solana Purple
      { color: "#38bdf8", glow: "rgba(56, 189, 248, 0.6)" },             // Voice Blue
      { color: "#fbbf24", glow: "rgba(251, 191, 36, 0.7)", symbol: "✦" }, // Micro-grant Gold
      { color: "#ec4899", glow: "rgba(236, 72, 153, 0.6)" },             // Community Heart
    ];

    const createDonorStream = (index?: number): MicroDonorStream => {
      const col = donorColors[Math.floor(Math.random() * donorColors.length)];
      // Spawn from sides or upper field
      const spawnFromSide = Math.random() > 0.4;
      const startX = spawnFromSide
        ? Math.random() > 0.5
          ? Math.random() * 120
          : width - Math.random() * 120
        : Math.random() * width;
      const startY = Math.random() * (height * 0.4);
      const targetT = 0.15 + Math.random() * 0.75;

      return {
        x: startX,
        y: startY,
        startX,
        startY,
        progress: index !== undefined ? (index / 16) : 0,
        speed: 0.003 + Math.random() * 0.004,
        targetT,
        color: col.color,
        glowColor: col.glow,
        size: 2.2 + Math.random() * 2.2,
        symbol: col.symbol,
      };
    };

    const donors: MicroDonorStream[] = Array.from({ length: 14 }, (_, i) => createDonorStream(i));

    // 2. Donation Impact Rings (Expanding ripple when a stream touches the pool)
    interface ImpactRing {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      color: string;
    }

    const ripples: ImpactRing[] = [];

    // 3. Floating Uplift Embers (Sparks rising from funded pool)
    interface UpliftSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      decay: number;
      size: number;
      color: string;
    }

    const sparks: UpliftSpark[] = [];

    let time = 0;
    let lastTime = performance.now();

    // ── Compound Harmonic Wave Equation ──────────────────────────────────────
    // Positioned gracefully between the title and stats, framing the hero content
    const getWaveY = (x: number, t: number, offsetPhase = 0) => {
      const normX = x / width;
      // Slopes gently across the hero area, framing the stats and staying above the portal
      const baseY = height * 0.58 - normX * (height * 0.22) + mouseY * 0.5;

      // Primary harmonic
      const wave1 = Math.sin(normX * 5.8 - t * 0.75 + offsetPhase) * (height * 0.09);
      // Voice acoustic harmonic
      const wave2 = Math.cos(normX * 11.6 + t * 0.5 + offsetPhase) * (height * 0.03);
      // Secondary swell
      const wave3 = Math.sin(normX * 2.8 - t * 0.35) * (height * 0.045);

      return baseY + wave1 + wave2 + wave3;
    };

    // Voice helix companion wave (intertwined with the funding wave)
    const getVoiceWaveY = (x: number, t: number) => {
      const normX = x / width;
      const baseY = height * 0.58 - normX * (height * 0.22) + mouseY * 0.5;
      const wave1 = Math.sin(normX * 6.8 + t * 0.8) * (height * 0.07);
      const wave2 = Math.cos(normX * 13.5 - t * 0.6) * (height * 0.025);
      return baseY + wave1 + wave2;
    };

    // ── Main Render Loop ─────────────────────────────────────────────────────
    const render = (now: number) => {
      if (!isVisible) return;

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      time += delta;

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Deep Obsidian base
      ctx.fillStyle = "#030408";
      ctx.fillRect(0, 0, width, height);

      // ── 1. Fluid Solana Aurora Fields ───────────────────────────────────────
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // Aurora 1: Electric Purple (Top center & right)
      const a1X = width * 0.68 + Math.sin(time * 0.3) * (width * 0.12) + mouseX;
      const a1Y = height * 0.32 + Math.cos(time * 0.35) * (height * 0.08) + mouseY;
      const g1 = ctx.createRadialGradient(a1X, a1Y, 15, a1X, a1Y, width * 0.45);
      g1.addColorStop(0, "rgba(153, 69, 255, 0.26)");
      g1.addColorStop(0.5, "rgba(124, 58, 237, 0.12)");
      g1.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      // Aurora 2: Solana Cyan & Mint (Center right / bottom of hero)
      const a2X = width * 0.78 + Math.cos(time * 0.25) * (width * 0.08);
      const a2Y = height * 0.62 + Math.sin(time * 0.28) * (height * 0.09);
      const g2 = ctx.createRadialGradient(a2X, a2Y, 10, a2X, a2Y, width * 0.42);
      g2.addColorStop(0, "rgba(20, 241, 149, 0.22)");
      g2.addColorStop(0.5, "rgba(6, 182, 212, 0.08)");
      g2.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Aurora 3: Subtle Magenta / Warm Gold (Mutual aid glow on left)
      const a3X = width * 0.18 + Math.sin(time * 0.22) * (width * 0.08);
      const a3Y = height * 0.48 + Math.cos(time * 0.2) * (height * 0.08);
      const g3 = ctx.createRadialGradient(a3X, a3Y, 10, a3X, a3Y, width * 0.38);
      g3.addColorStop(0, "rgba(236, 72, 153, 0.14)");
      g3.addColorStop(0.6, "rgba(245, 158, 11, 0.06)");
      g3.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      // ── 2. Cybernetic Dot Grid Matrix ───────────────────────────────────────
      ctx.save();
      const dotSpacing = 26;
      const startY = Math.floor(height * 0.25 / dotSpacing) * dotSpacing;

      for (let y = startY; y < height; y += dotSpacing) {
        const rowFactor = Math.sin((y / height) * Math.PI); // Fades in and fades out towards bottom
        for (let x = 0; x < width; x += dotSpacing) {
          const waveRefY = getWaveY(x, time);
          const distWave = Math.abs(y - waveRefY);

          let alpha = 0.02 * rowFactor;
          if (distWave < 90) {
            alpha += (1 - distWave / 90) * 0.055;
          }

          if (alpha > 0.012) {
            ctx.fillStyle = distWave < 50 ? `rgba(20, 241, 149, ${alpha})` : `rgba(167, 139, 250, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // ── 3. Crowdfunding Micro-Donor Streams (Tributaries converging) ─────────
      donors.forEach((d) => {
        d.progress += d.speed;

        // Target point on the central funding wave
        const targetWaveX = d.targetT * width;
        const targetWaveY = getWaveY(targetWaveX, time);

        // Curved Bezier trajectory: bows inward towards the wave
        const tVal = Math.min(d.progress, 1);
        const controlX = (d.startX + targetWaveX) * 0.5 + (Math.sin(time + d.targetT * 5) * 40);
        const controlY = Math.min(d.startY, targetWaveY) - 50;

        // Quadratic bezier formula
        d.x = (1 - tVal) * (1 - tVal) * d.startX + 2 * (1 - tVal) * tVal * controlX + tVal * tVal * targetWaveX;
        d.y = (1 - tVal) * (1 - tVal) * d.startY + 2 * (1 - tVal) * tVal * controlY + tVal * tVal * targetWaveY;

        // Draw faint luminous tributary trail
        ctx.save();
        ctx.strokeStyle = d.glowColor.replace("0.6", "0.22");
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(d.startX, d.startY);
        ctx.quadraticCurveTo(controlX, controlY, d.x, d.y);
        ctx.stroke();
        ctx.restore();

        // Draw the donation particle
        ctx.save();
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();

        // White core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Occasional floating token symbol
        if (d.symbol && d.progress > 0.2 && d.progress < 0.85) {
          ctx.font = "10px sans-serif";
          ctx.fillStyle = d.color;
          ctx.shadowBlur = 8;
          ctx.fillText(d.symbol, d.x + 6, d.y - 4);
        }
        ctx.restore();

        // When the donor stream reaches the wave -> trigger Impact Ripple & Sparks!
        if (d.progress >= 1) {
          // Add ripple
          ripples.push({
            x: targetWaveX,
            y: targetWaveY,
            radius: 3,
            maxRadius: 36,
            alpha: 0.85,
            color: d.color,
          });

          // Add uplifting sparks (hope/grant flowing up)
          for (let s = 0; s < 3; s++) {
            sparks.push({
              x: targetWaveX + (Math.random() - 0.5) * 16,
              y: targetWaveY,
              vx: (Math.random() - 0.5) * 1.8,
              vy: -0.8 - Math.random() * 2.2,
              alpha: 0.9,
              decay: 0.015 + Math.random() * 0.02,
              size: 1.5 + Math.random() * 2,
              color: d.color,
            });
          }

          // Reset donor stream to a new path
          Object.assign(d, createDonorStream(0));
        }
      });

      // ── 4. Render Impact Ripples ("Pond of Mutual Aid") ─────────────────────
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += 0.85;
        rip.alpha *= 0.94;

        if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
          ripples.splice(r, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = rip.color;
        ctx.shadowColor = rip.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = rip.alpha;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Slightly elliptical ripple
        ctx.ellipse(rip.x, rip.y, rip.radius * 1.4, rip.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── 5. Uplifting Sparks (Micro-Grants Rising) ───────────────────────────
      for (let s = sparks.length - 1; s >= 0; s--) {
        const spk = sparks[s];
        spk.x += spk.vx;
        spk.y += spk.vy;
        spk.alpha -= spk.decay;

        if (spk.alpha <= 0) {
          sparks.splice(s, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = spk.alpha;
        ctx.shadowColor = spk.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = spk.color;
        ctx.beginPath();
        ctx.arc(spk.x, spk.y, spk.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── 6. Intertwined Voice Echo Wave (Delicate acoustic filament) ──────────
      ctx.save();
      ctx.beginPath();
      const step = 4;
      for (let x = -20; x <= width + 20; x += step) {
        const y = getVoiceWaveY(x, time);
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(168, 85, 247, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "rgba(168, 85, 247, 0.4)";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.restore();

      // ── 7. Subtle Ethereal Stream Nexus (Replaced heavy tide) ─────────────
      // Replaced the heavy 3D tide with an ultra-delicate, non-intrusive filament
      ctx.save();
      ctx.beginPath();
      for (let x = -20; x <= width + 20; x += step) {
        const y = getWaveY(x, time);
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(20, 241, 149, 0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // ── 8. Smooth Bottom Fade Out (Strictly ending before Organizer Portal) ─
      // Seamlessly terminates right as the Grassroots Organizer Portal starts
      const fadeHeight = 140;
      const fadeGrad = ctx.createLinearGradient(0, height - fadeHeight, 0, height);
      fadeGrad.addColorStop(0, "rgba(3, 4, 8, 0)");
      fadeGrad.addColorStop(0.5, "rgba(3, 4, 8, 0.65)");
      fadeGrad.addColorStop(1, "rgba(3, 4, 8, 1.0)");
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, height - fadeHeight, width, fadeHeight);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [portalTargetId]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: "#030408",
        // CSS Mask to guarantee 100% smooth dissolution into darkness before the portal
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.5) 88%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.5) 88%, transparent 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
        }}
      />
    </div>
  );
}
