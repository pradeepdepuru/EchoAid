"use client";

import { useEffect, useRef } from "react";

interface Hub {
  id: string;
  name: string;
  city: string;
  lat: number; // degrees
  lon: number; // degrees
  color: string;
}

interface TransferArc {
  fromLat: number;
  fromLon: number;
  fromCity: string;
  toHub: Hub;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  trailGlow: string;
  maxAltitude: number; // multiplier over globe radius
}

interface HubRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface HubSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface GlobalPixelGlobeProps {
  startAfterId?: string;
}

export default function GlobalPixelGlobe({
  startAfterId = "organizer-portal",
}: GlobalPixelGlobeProps) {
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

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetMouseX = (e.clientX / innerWidth - 0.5) * 45;
      targetMouseY = (e.clientY / innerHeight - 0.5) * 35;
    };

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Dynamically calculate start position (right after organizer-portal) and full page height
    const updateDimensions = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;

      const portalEl = document.getElementById(startAfterId);
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      let startTop = 780;

      if (portalEl) {
        const portalRect = portalEl.getBoundingClientRect();
        startTop = Math.max(0, Math.floor(portalRect.bottom + scrollTop + 16));
      }

      const totalDocHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      height = Math.max(900, totalDocHeight - startTop + 40);

      container.style.top = `${startTop}px`;
      container.style.height = `${height}px`;
      container.style.width = "100%";

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ResizeObserver to track dynamic DOM content expansion
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(document.body);
    }

    updateDimensions();
    const timer1 = setTimeout(updateDimensions, 250);
    const timer2 = setTimeout(updateDimensions, 900);

    // ── 1. The 5 Real Educational Campaign Hubs ──────────────────────────────
    const campaignHubs: Hub[] = [
      { id: "lagos", name: "Lagos AI Forge", city: "Lagos, Nigeria", lat: 6.52, lon: 3.38, color: "#06b6d4" },
      { id: "bogota", name: "Andes Rig Alliance", city: "Bogotá, Colombia", lat: 4.71, lon: -74.07, color: "#8b5cf6" },
      { id: "jakarta", name: "SE Asia GPU Pipeline", city: "Jakarta, Indonesia", lat: -6.21, lon: 106.85, color: "#10b981" },
      { id: "kentucky", name: "Appalachia Incubator", city: "Kentucky, USA", lat: 37.84, lon: -84.27, color: "#f59e0b" },
      { id: "cairo", name: "North Africa AI Lab", city: "Cairo, Egypt", lat: 30.04, lon: 31.24, color: "#ec4899" },
    ];

    // Global donor source cities across the globe
    const donorSources = [
      { lat: 37.77, lon: -122.42, name: "San Francisco" },
      { lat: 51.51, lon: -0.13, name: "London" },
      { lat: 35.68, lon: 139.69, name: "Tokyo" },
      { lat: 47.37, lon: 8.54, name: "Zurich" },
      { lat: 1.35, lon: 103.82, name: "Singapore" },
      { lat: -33.87, lon: 151.21, name: "Sydney" },
      { lat: 43.65, lon: -79.38, name: "Toronto" },
      { lat: 52.52, lon: 13.40, name: "Berlin" },
      { lat: 25.20, lon: 55.27, name: "Dubai" },
      { lat: 37.56, lon: 126.97, name: "Seoul" },
      { lat: 19.43, lon: -99.13, name: "Mexico City" },
      { lat: -23.55, lon: -46.63, name: "São Paulo" },
    ];

    // ── 2. Parabolic Fund Flow Arcs ──────────────────────────────────────────
    const arcs: TransferArc[] = [];
    const colorPalettes = [
      { head: "#14F195", glow: "rgba(20, 241, 149, 0.55)" }, // Solana Mint
      { head: "#c084fc", glow: "rgba(192, 132, 252, 0.55)" }, // Electric Purple
      { head: "#38bdf8", glow: "rgba(56, 189, 248, 0.55)" },  // Cyan
      { head: "#fbbf24", glow: "rgba(251, 191, 36, 0.65)" },  // Solana Gold
      { head: "#f43f5e", glow: "rgba(244, 63, 94, 0.55)" },   // Magenta
    ];

    const createArc = (indexOffset = 0): TransferArc => {
      const donor = donorSources[Math.floor(Math.random() * donorSources.length)];
      const targetHub = campaignHubs[Math.floor(Math.random() * campaignHubs.length)];
      const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

      return {
        fromLat: donor.lat,
        fromLon: donor.lon,
        fromCity: donor.name,
        toHub: targetHub,
        progress: indexOffset,
        speed: 0.003 + Math.random() * 0.0035,
        color: palette.head,
        trailGlow: palette.glow,
        maxAltitude: 1.22 + Math.random() * 0.22,
      };
    };

    // Stagger 11 concurrent arcs
    for (let i = 0; i < 11; i++) {
      arcs.push(createArc(i / 11));
    }

    const ripples: HubRipple[] = [];
    const sparks: HubSpark[] = [];

    // ── 3. High-Fidelity Continent Point Sampling ────────────────────────────
    const isLand = (lat: number, lon: number): boolean => {
      // North America
      if (lat >= 14 && lat <= 72 && lon >= -168 && lon <= -52) {
        if (lat < 28 && lon < -102) return false;
        return true;
      }
      // South America
      if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) return true;
      // Europe
      if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 45) return true;
      // Africa
      if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) return true;
      // Asia
      if (lat >= 5 && lat <= 75 && lon >= 45 && lon <= 150) {
        if (lat < 12 && lon > 125) return false;
        return true;
      }
      // Australia
      if (lat >= -44 && lat <= -10 && lon >= 113 && lon <= 154) return true;
      // Japan
      if (lat >= 30 && lat <= 45 && lon >= 129 && lon <= 146) return true;
      // UK / Ireland
      if (lat >= 50 && lat <= 60 && lon >= -10 && lon <= 2) return true;
      // Indonesia / Philippines
      if (lat >= -10 && lat <= 18 && lon >= 95 && lon <= 130) return true;
      // Madagascar
      if (lat >= -25 && lat <= -12 && lon >= 43 && lon <= 51) return true;
      return false;
    };

    interface GlobePoint {
      lat: number;
      lon: number;
      x: number;
      y: number;
      z: number;
      isContinent: boolean;
    }

    const points: GlobePoint[] = [];
    const totalPoints = 2200; // Dense, vibrant pixel matrix
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < totalPoints; i++) {
      const y = 1 - (i / (totalPoints - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const lat = Math.asin(y) * (180 / Math.PI);
      const lon = Math.atan2(z, x) * (180 / Math.PI);
      const land = isLand(lat, lon);

      points.push({ lat, lon, x, y, z, isContinent: land });
    }

    const latLonToVec3 = (latDeg: number, lonDeg: number, radius: number) => {
      const latRad = (latDeg * Math.PI) / 180;
      const lonRad = (lonDeg * Math.PI) / 180;
      return {
        x: radius * Math.cos(latRad) * Math.cos(lonRad),
        y: radius * Math.sin(latRad),
        z: radius * Math.cos(latRad) * Math.sin(lonRad),
      };
    };

    let rotationAngle = 0;
    const tiltAngle = 0.32; // ~18 degrees axial tilt
    const cosTilt = Math.cos(tiltAngle);
    const sinTilt = Math.sin(tiltAngle);

    let lastTime = performance.now();

    // ── Main Render Loop ─────────────────────────────────────────────────────
    const render = (now: number) => {
      if (!isVisible) return;

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      rotationAngle += delta * 0.16; // Smooth continuous rotation

      // Gentle mouse parallax follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Centered dynamically on the campaigns section
      const centerX = width * 0.5 + mouseX * 0.5;
      // Position center of globe comfortably in the upper-mid area of the initiatives section
      const centerY = Math.min(height * 0.44, 580) + mouseY * 0.4;
      // Full expansive globe radius: extends generously beyond cards on desktop
      const globeRadius = Math.min(
        Math.max(width * 0.46, 320),
        Math.max(height * 0.42, 480),
        660
      );
      const cameraDist = 1100;

      // 3D rotation and projection
      const project3D = (vec: { x: number; y: number; z: number }) => {
        const cosR = Math.cos(rotationAngle);
        const sinR = Math.sin(rotationAngle);
        const rx = vec.x * cosR - vec.z * sinR;
        const rz = vec.x * sinR + vec.z * cosR;

        const ty = vec.y * cosTilt - rz * sinTilt;
        const tz = vec.y * sinTilt + rz * cosTilt;

        const scale = cameraDist / (cameraDist + tz);
        const px = centerX + rx * scale;
        const py = centerY - ty * scale;

        return { px, py, pz: tz, scale, visible: tz > -globeRadius * 0.25 };
      };

      // ── 1. Atmospheric Ambient Core & Rim Glow ──────────────────────────────
      // Outer radial aura
      const outerAura = ctx.createRadialGradient(
        centerX,
        centerY,
        globeRadius * 0.2,
        centerX,
        centerY,
        globeRadius * 1.25
      );
      outerAura.addColorStop(0, "rgba(153, 69, 255, 0.18)");
      outerAura.addColorStop(0.45, "rgba(20, 241, 149, 0.10)");
      outerAura.addColorStop(0.8, "rgba(6, 182, 212, 0.04)");
      outerAura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = outerAura;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Rim Halo (Silhouette Edge)
      ctx.save();
      ctx.strokeStyle = "rgba(20, 241, 149, 0.25)";
      ctx.shadowColor = "rgba(153, 69, 255, 0.6)";
      ctx.shadowBlur = 24;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ── 2. Cybernetic Latitude Rings (Equator & Tropics) ────────────────────
      const latitudeCircles = [-45, -23.5, 0, 23.5, 45];
      latitudeCircles.forEach((lat) => {
        ctx.save();
        ctx.beginPath();
        const steps = 48;
        let hasMoved = false;

        for (let s = 0; s <= steps; s++) {
          const lon = (s / steps) * 360 - 180;
          const v = latLonToVec3(lat, lon, globeRadius);
          const p = project3D(v);

          // Only draw visible front/mid arc segments
          if (p.pz > -globeRadius * 0.15) {
            if (!hasMoved) {
              ctx.moveTo(p.px, p.py);
              hasMoved = true;
            } else {
              ctx.lineTo(p.px, p.py);
            }
          } else {
            hasMoved = false;
          }
        }

        ctx.strokeStyle =
          lat === 0
            ? "rgba(20, 241, 149, 0.18)" // Vibrant Equator
            : "rgba(139, 92, 246, 0.10)";
        ctx.lineWidth = lat === 0 ? 1.4 : 0.8;
        ctx.setLineDash([3, 7]);
        ctx.stroke();
        ctx.restore();
      });

      // ── 3. Render 3D Pixel Lattice (Continents & Oceans) ─────────────────────
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const v = latLonToVec3(pt.lat, pt.lon, globeRadius);
        const p = project3D(v);

        const depthNorm = (p.pz + globeRadius) / (2 * globeRadius);

        if (pt.isContinent) {
          if (p.pz > 0) {
            // Front side of globe: Ultra-vibrant, high contrast
            const alpha = 0.4 + depthNorm * 0.6;
            const dotSize = (1.5 + depthNorm * 1.8) * p.scale;

            ctx.fillStyle =
              depthNorm > 0.62
                ? `rgba(20, 241, 149, ${alpha})` // High-depth Solana Mint
                : `rgba(192, 132, 252, ${alpha})`; // Electric Purple

            ctx.beginPath();
            ctx.arc(p.px, p.py, dotSize, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Back side: subtle spatial depth
            ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
            ctx.beginPath();
            ctx.arc(p.px, p.py, 1.0 * p.scale, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Ocean dots: light structural coordinates
          if (p.pz > 0 && i % 3 === 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + depthNorm * 0.12})`;
            ctx.beginPath();
            ctx.arc(p.px, p.py, 0.9 * p.scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ── 4. Render The 5 Active Educational Campaign Hubs ────────────────────
      campaignHubs.forEach((hub) => {
        const hubVec = latLonToVec3(hub.lat, hub.lon, globeRadius);
        const p = project3D(hubVec);

        if (p.pz > -25) {
          const depthAlpha = Math.max(0.25, (p.pz + 25) / (globeRadius + 25));

          ctx.save();
          // Radar beacon wave 1
          const pulse = (now * 0.003) % 1;
          ctx.strokeStyle = hub.color;
          ctx.shadowColor = hub.color;
          ctx.shadowBlur = 18 * depthAlpha;
          ctx.globalAlpha = (1 - pulse) * depthAlpha;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(p.px, p.py, (5 + pulse * 14) * p.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Outer beacon ring
          ctx.globalAlpha = depthAlpha * 0.9;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 6.5 * p.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Hub core dot
          ctx.fillStyle = hub.color;
          ctx.beginPath();
          ctx.arc(p.px, p.py, 3.8 * p.scale, 0, Math.PI * 2);
          ctx.fill();

          // White center pin
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.px, p.py, 1.6 * p.scale, 0, Math.PI * 2);
          ctx.fill();

          // Hub Micro-Tag Label
          if (p.pz > 30) {
            ctx.font = "bold 11px system-ui, sans-serif";
            ctx.fillStyle = hub.color;
            ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
            ctx.shadowBlur = 6;
            ctx.fillText(hub.name, p.px + 11, p.py + 4);
          }
          ctx.restore();
        }
      });

      // ── 5. Render Parabolic 3D Flight Arcs & Fund Packets ───────────────────
      arcs.forEach((arc) => {
        arc.progress += arc.speed;

        const vFrom = latLonToVec3(arc.fromLat, arc.fromLon, globeRadius);
        const vTo = latLonToVec3(arc.toHub.lat, arc.toHub.lon, globeRadius);

        const mx = (vFrom.x + vTo.x) * 0.5;
        const my = (vFrom.y + vTo.y) * 0.5;
        const mz = (vFrom.z + vTo.z) * 0.5;
        const mLen = Math.hypot(mx, my, mz) || 1;
        const peakAltitude = globeRadius * arc.maxAltitude;
        const vMid = {
          x: (mx / mLen) * peakAltitude,
          y: (my / mLen) * peakAltitude,
          z: (mz / mLen) * peakAltitude,
        };

        const getArcPoint = (t: number) => {
          const it = 1 - t;
          return {
            x: it * it * vFrom.x + 2 * it * t * vMid.x + t * t * vTo.x,
            y: it * it * vFrom.y + 2 * it * t * vMid.y + t * t * vTo.y,
            z: it * it * vFrom.z + 2 * it * t * vMid.z + t * t * vTo.z,
          };
        };

        // Trajectory Path
        ctx.save();
        ctx.beginPath();
        const segments = 26;
        for (let s = 0; s <= segments; s++) {
          const pt3D = getArcPoint(s / segments);
          const p = project3D(pt3D);
          if (s === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }

        // Luminous glowing trail
        ctx.strokeStyle = arc.trailGlow;
        ctx.shadowColor = arc.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();

        // Traveling Fund Packet
        const tClamped = Math.min(arc.progress, 1);
        const packet3D = getArcPoint(tClamped);
        const packet2D = project3D(packet3D);

        if (packet2D.pz > -40) {
          ctx.save();
          ctx.shadowColor = arc.color;
          ctx.shadowBlur = 20;
          ctx.fillStyle = arc.color;

          // Glowing energy head
          ctx.beginPath();
          ctx.arc(packet2D.px, packet2D.py, 4.2 * packet2D.scale, 0, Math.PI * 2);
          ctx.fill();

          // Hot white center
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(packet2D.px, packet2D.py, 2.0 * packet2D.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Packet Arrival at Destination Hub -> Shockwave Ripple & Uplift Sparks!
        if (arc.progress >= 1) {
          const destVec = latLonToVec3(arc.toHub.lat, arc.toHub.lon, globeRadius);
          const dest2D = project3D(destVec);

          if (dest2D.pz > -20) {
            ripples.push({
              x: dest2D.px,
              y: dest2D.py,
              radius: 4,
              maxRadius: 42,
              alpha: 0.95,
              color: arc.toHub.color,
            });

            // Burst sparks
            for (let s = 0; s < 4; s++) {
              sparks.push({
                x: dest2D.px,
                y: dest2D.py,
                vx: (Math.random() - 0.5) * 2.2,
                vy: -1.0 - Math.random() * 2.0,
                alpha: 0.95,
                color: arc.toHub.color,
                size: 1.5 + Math.random() * 1.8,
              });
            }
          }

          Object.assign(arc, createArc(0));
        }
      });

      // ── 6. Render Arrival Radar Ripples ─────────────────────────────────────
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += 1.0;
        rip.alpha *= 0.93;

        if (rip.alpha < 0.02 || rip.radius > rip.maxRadius) {
          ripples.splice(r, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = rip.color;
        ctx.shadowColor = rip.color;
        ctx.shadowBlur = 14;
        ctx.globalAlpha = rip.alpha;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── 7. Render Uplift Sparks ─────────────────────────────────────────────
      for (let s = sparks.length - 1; s >= 0; s--) {
        const spk = sparks[s];
        spk.x += spk.vx;
        spk.y += spk.vy;
        spk.alpha *= 0.92;

        if (spk.alpha < 0.02) {
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

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startAfterId]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 780, // initial default, dynamically adjusted to sit right after organizer-portal
        left: 0,
        width: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        // Smooth 50px feathering at the top transition, 100% solid rolling through the entire bottom
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 50px, black 100%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 50px, black 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
