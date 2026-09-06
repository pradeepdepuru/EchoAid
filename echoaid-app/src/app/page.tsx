"use client";

import { useState, useEffect } from "react";
import AidCard from "./components/AidCard";
import {
  getSolanaProvider,
  ensureConnected,
  getDevnetBalance,
  sendMicroGrant,
  solscanUrl,
} from "./lib/useSolana";

interface CardItem {
  id: string;
  titleEn: string;
  titleEs?: string;
  excerptEn: string;
  excerptEs?: string;
  accentColor: string;
  glowColor: string;
  icon: string;
  beneficiaryWallet: string;
}

const BENEFICIARY_WALLET =
  process.env.NEXT_PUBLIC_BENEFICIARY_WALLET || "4VAvaN4ue3BHLrGGvoagf7cn2Z6JEEPDiAwiPwzBkqYM";

// ─── 5 Target Hardware Infrastructure & Education Cards ─────────────────────
const INITIAL_CARDS: CardItem[] = [
  {
    id: "lagos-hardware-forge",
    titleEn: "Lagos AI Hardware Forge (Lagos, Nigeria)",
    excerptEn:
      "Empowering technical builders across West Africa with graphics processors, open-source boards, and server hardware arrays required to build local deep learning clusters without latency barriers.",
    accentColor: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.25)",
    icon: "⚡",
    beneficiaryWallet: BENEFICIARY_WALLET,
  },
  {
    id: "andes-edge-rig",
    titleEn: "Andes Edge-Rig Alliance (Bogotá, Colombia)",
    excerptEn:
      "Supplying developer laptop workstations and micro-controllers to regional university hubs, bypassing supply chain constraints to train the next layer of local computer science engineers.",
    accentColor: "#8b5cf6",
    glowColor: "rgba(139, 92, 246, 0.25)",
    icon: "💻",
    beneficiaryWallet: BENEFICIARY_WALLET,
  },
  {
    id: "southeast-asia-gpu",
    titleEn: "Southeast Asia GPU Access Pipeline (Jakarta, Indonesia)",
    excerptEn:
      "Funding physical server racks, power cells, and cooling components for crowdsourced community laboratories, allowing research teams to train models independently.",
    accentColor: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.25)",
    icon: "🖥️",
    beneficiaryWallet: BENEFICIARY_WALLET,
  },
  {
    id: "appalachia-incubator",
    titleEn: "Appalachia Tech-Savvy Incubator (Kentucky, USA)",
    excerptEn:
      "Providing recycled desktop workstations, storage nodes, and high-performance networking devices to underserved rural tech teams entering deep learning ecosystems.",
    accentColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.25)",
    icon: "🛠️",
    beneficiaryWallet: BENEFICIARY_WALLET,
  },
  {
    id: "north-africa-ai-lab",
    titleEn: "North Africa AI Lab Initiative (Cairo, Egypt)",
    excerptEn:
      "Deploying physical networking gear, high-throughput memory channels, and edge processors to student labs, connecting regional applications with global decentralized compute networks.",
    accentColor: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.25)",
    icon: "🌐",
    beneficiaryWallet: BENEFICIARY_WALLET,
  },
];

// Color palette themes for newly published updates
const RANDOM_THEMES = [
  { accentColor: "#06b6d4", glowColor: "rgba(6, 182, 212, 0.25)", icon: "⚡" },
  { accentColor: "#8b5cf6", glowColor: "rgba(139, 92, 246, 0.25)", icon: "💻" },
  { accentColor: "#10b981", glowColor: "rgba(16, 185, 129, 0.25)", icon: "🖥️" },
  { accentColor: "#f59e0b", glowColor: "rgba(245, 158, 11, 0.25)", icon: "🛠️" },
  { accentColor: "#ec4899", glowColor: "rgba(236, 72, 153, 0.25)", icon: "🌐" },
  { accentColor: "#3b82f6", glowColor: "rgba(59, 130, 246, 0.25)", icon: "🔬" },
];

const MAX_W = "1024px";

export default function Home() {
  const [cards, setCards] = useState<CardItem[]>(INITIAL_CARDS);
  const [demoSessionContributions, setDemoSessionContributions] = useState<number>(0);

  // ── Web3 Wallet State Hooks ───────────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [boostStatus, setBoostStatus] = useState<
    Record<string, { processing: boolean; signature?: string; error?: string }>
  >({});

  // ── Form Local State Hooks ────────────────────────────────────────────────
  const [orgTitle, setOrgTitle] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  // ── Hydrate cached cards from localStorage on mount ───────────────────────
  useEffect(() => {
    try {
      const cached = localStorage.getItem("echoaid_cards");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if cached items contain the old food/housing cards; if so, refresh with INITIAL_CARDS
          const hasOldCards = parsed.some(
            (c: any) => c.id === "food-pantry" || c.id === "housing-aid" || c.id === "youth-tech"
          );
          if (hasOldCards) {
            setCards(INITIAL_CARDS);
            localStorage.setItem("echoaid_cards", JSON.stringify(INITIAL_CARDS));
          } else {
            setCards(parsed);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load cached cards from localStorage:", e);
    }
  }, []);

  // ── Auto-sync connected wallet address and balance with 12s polling ───────
  useEffect(() => {
    let isMounted = true;

    const syncWallet = async () => {
      try {
        const provider = getSolanaProvider();
        if (!provider) return;

        if (provider.publicKey) {
          const addr = provider.publicKey.toBase58();
          if (isMounted) setWalletAddress(addr);

          const bal = await getDevnetBalance(provider.publicKey);
          if (isMounted) setWalletBalance(bal);
        }
      } catch (err) {
        console.error("[EchoAid] Error syncing wallet:", err);
      }
    };

    // Initial sync
    syncWallet();

    // 12-second interval poll loop
    const intervalId = setInterval(syncWallet, 12000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // ── Dynamic Funding Tier Boost Handler ────────────────────────────────────
  const handleBoost = async (beneficiaryWallet: string, amount: number, cardId: string) => {
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid SOL amount to boost.");
      return;
    }

    const provider = getSolanaProvider();
    if (!provider) {
      alert("Please install a Solana wallet extension (like Phantom) to boost!");
      return;
    }

    setBoostStatus((prev) => ({
      ...prev,
      [cardId]: { processing: true, error: undefined },
    }));

    try {
      const pubkey = await ensureConnected(provider);
      setWalletAddress(pubkey.toBase58());

      // Send the variable amount micro-grant
      const signature = await sendMicroGrant(provider, beneficiaryWallet, amount);

      setBoostStatus((prev) => ({
        ...prev,
        [cardId]: { processing: false, signature },
      }));

      // Immediately refresh on-chain balance upon receipt
      const updatedBalance = await getDevnetBalance(pubkey);
      setWalletBalance(updatedBalance);
      setDemoSessionContributions((prev) => prev + amount);

      // Reset custom input field for this card
      setCustomAmounts((prev) => ({
        ...prev,
        [cardId]: "",
      }));
    } catch (err: any) {
      console.error("[EchoAid] Boost transaction error:", err);
      const message = err?.message || "Transaction failed";
      setBoostStatus((prev) => ({
        ...prev,
        [cardId]: { processing: false, error: message },
      }));
      alert(`Boost failed: ${message}`);
    }
  };

  // ── Publish Update Handler (Instant Publishing) ───────────────────────────
  const handlePublishUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgTitle.trim() || !updateText.trim()) {
      setFormError("All fields are required. Please complete all fields before publishing.");
      return;
    }

    setFormError(null);

    // Pick random accent theme
    const randomTheme =
      RANDOM_THEMES[Math.floor(Math.random() * RANDOM_THEMES.length)];
    const uniqueId = `update-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newCard: CardItem = {
      id: uniqueId,
      titleEn: orgTitle.trim(),
      titleEs: orgTitle.trim(),
      excerptEn: updateText.trim(),
      excerptEs: updateText.trim(),
      accentColor: randomTheme.accentColor,
      glowColor: randomTheme.glowColor,
      icon: randomTheme.icon,
      beneficiaryWallet: BENEFICIARY_WALLET,
    };

    // Prepend new card and persist to localStorage
    const updatedCards = [newCard, ...cards];
    setCards(updatedCards);
    try {
      localStorage.setItem("echoaid_cards", JSON.stringify(updatedCards));
    } catch (err) {
      console.error("Failed to persist cards to localStorage:", err);
    }

    // Reset inputs
    setOrgTitle("");
    setUpdateText("");

    // Flash success
    setIsSuccessFeedback(true);
    setTimeout(() => setIsSuccessFeedback(false), 3500);
  };

  return (
    <main
      style={{
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        style={{
          width: "100%",
          maxWidth: MAX_W,
          textAlign: "center",
          marginBottom: "44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Top Badges: Tech stack & Live Wallet Status */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 16px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(167, 139, 250, 0.35)",
              color: "#c4b5fd",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.45)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#34d399",
                display: "inline-block",
                boxShadow: "0 0 8px #34d399",
                animation: "pulseGlow 1.5s ease-in-out infinite",
              }}
            />
            Solana Devnet · ElevenLabs Powered · AI Education & Compute Hardware
          </div>

          {/* Wallet Balance & Address Header Layer */}
          <div
            id="wallet-status-bar"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "7px 18px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 500,
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(139, 92, 246, 0.35)",
              color: "#ffffff",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.45)",
            }}
          >
            {walletAddress ? (
              <>
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontFamily: "monospace", color: "#c4b5fd", fontWeight: 600 }}>
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                <span style={{ fontWeight: 700, color: "#34d399" }}>
                  {walletBalance !== null ? `${walletBalance.toFixed(3)} SOL` : "Syncing balance…"}
                </span>
              </>
            ) : (
              <button
                onClick={async () => {
                  const provider = getSolanaProvider();
                  if (provider) {
                    try {
                      const pk = await ensureConnected(provider);
                      setWalletAddress(pk.toBase58());
                      const bal = await getDevnetBalance(pk);
                      setWalletBalance(bal);
                    } catch (e) {
                      console.error("Connection failed:", e);
                    }
                  } else {
                    alert("Please install Phantom or another Solana browser wallet extension.");
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#a78bfa",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#f59e0b",
                    boxShadow: "0 0 6px #f59e0b",
                    display: "inline-block",
                  }}
                />
                Connect Phantom Wallet
              </button>
            )}
          </div>
        </div>

        {/* Logo / Title (Sonos-inspired high visibility & presence) */}
        <h1
          style={{
            fontSize: "clamp(3.2rem, 8.5vw, 5.2rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            marginBottom: "18px",
            display: "block",
            color: "#ffffff",
            textShadow: "0 4px 28px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.7)",
          }}
        >
          EchoAid
        </h1>

        {/* Tagline with subtle frosted pill backdrop for supreme readability */}
        <p
          style={{
            fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
            lineHeight: 1.65,
            maxWidth: "680px",
            color: "#f1f5f9",
            fontWeight: 450,
            marginBottom: "20px",
            textShadow: "0 2px 10px rgba(0, 0, 0, 0.95)",
            background: "rgba(3, 4, 8, 0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "12px 24px",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          Hear their stories. Fund their future. AI education, edge rigs & compute infrastructure — powered by AI voices and near-zero-fee Solana rails.
        </p>
      </header>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          maxWidth: MAX_W,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        {[
          {
            label: "Active Initiatives",
            value: cards.length.toString(),
          },
          {
            label: "SOL Allocated",
            value: (1842 + demoSessionContributions).toFixed(2),
          },
          {
            label: "Hardware Stories Voiced",
            value: (3100 + (cards.length - INITIAL_CARDS.length)).toString(),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              textAlign: "center",
              padding: "20px 14px",
              borderRadius: "18px",
              background: "rgba(10, 16, 32, 0.82)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
            }}
          >
            <p
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#ffffff",
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.6)",
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                marginTop: "4px",
                color: "#cbd5e1",
                fontWeight: 500,
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.6)",
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── 📣 Grassroots Organizer Portal Form ──────────────────────────────── */}
      <section
        id="organizer-portal"
        aria-label="Grassroots Organizer Portal"
        style={{
          width: "100%",
          maxWidth: MAX_W,
          marginBottom: "44px",
          padding: "28px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(19, 28, 53, 0.65) 100%)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35), 0 0 40px rgba(124, 58, 237, 0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--text-primary)",
              }}
            >
              📣 AI Lab & Hardware Requisition Portal
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Broadcast a local compute or educational hardware need directly to the community with instant voice synthesis.
            </p>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            Wallet Linked: {BENEFICIARY_WALLET.slice(0, 4)}...{BENEFICIARY_WALLET.slice(-4)}
          </span>
        </div>

        {formError && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "0.85rem",
            }}
          >
            ⚠️ {formError}
          </div>
        )}

        {isSuccessFeedback && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "16px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#6ee7b7",
              fontSize: "0.85rem",
            }}
          >
            ✨ Requisition broadcasted successfully! New initiative added to the network.
          </div>
        )}

        <form onSubmit={handlePublishUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              htmlFor="org-title"
              style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}
            >
              Organization or Lab Title
            </label>
            <input
              id="org-title"
              type="text"
              placeholder="e.g. Lagos AI Hardware Forge or Regional Student Compute Lab"
              value={orgTitle}
              onChange={(e) => setOrgTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(10, 15, 30, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#a78bfa";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(167, 139, 250, 0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              htmlFor="broadcast-update"
              style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}
            >
              Hardware Requisition Message
            </label>
            <textarea
              id="broadcast-update"
              rows={4}
              placeholder="Share your educational hardware need or compute initiative..."
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "rgba(10, 15, 30, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#a78bfa";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(167, 139, 250, 0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
            <button
              id="publish-update-btn"
              type="submit"
              style={{
                padding: "12px 28px",
                borderRadius: "12px",
                fontSize: "0.9rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
                color: "white",
                boxShadow: "0 4px 18px rgba(124, 58, 237, 0.35)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 22px rgba(124, 58, 237, 0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(124, 58, 237, 0.35)";
              }}
            >
              🚀 Broadcast Requisition
            </button>
          </div>
        </form>
      </section>

      {/* ── Second Half: Active Campaigns & 3D Global Pixel Globe ─────────── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: MAX_W,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <section
          id="aid-cards-grid"
          aria-label="Aid initiative cards"
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {cards.map((card) => {
            const status = boostStatus[card.id];
            const isBoosting = status?.processing;

            return (
              <div
                key={card.id}
                style={{
                  borderRadius: "24px",
                  background: "rgba(10, 16, 32, 0.72)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  gap: "16px",
                  transition: "transform 0.25s ease, border-color 0.25s ease",
                }}
              >
              <AidCard {...card} />
              {/* Dynamic Boost Tier Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                {/* Fixed Tier Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    id={`boost-05-${card.id}`}
                    type="button"
                    onClick={() => handleBoost(card.beneficiaryWallet, 0.5, card.id)}
                    disabled={isBoosting}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: isBoosting ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isBoosting) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(124, 58, 237, 0.25)";
                        (e.currentTarget as HTMLElement).style.borderColor = "#a78bfa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.12)";
                    }}
                  >
                    🚀 Boost 0.5 SOL
                  </button>

                  <button
                    id={`boost-10-${card.id}`}
                    type="button"
                    onClick={() => handleBoost(card.beneficiaryWallet, 1.0, card.id)}
                    disabled={isBoosting}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: isBoosting ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isBoosting) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(6, 182, 212, 0.25)";
                        (e.currentTarget as HTMLElement).style.borderColor = "#22d3ee";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.05)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.12)";
                    }}
                  >
                    🔥 Boost 1.0 SOL
                  </button>
                </div>

                {/* Inline Custom Amount Input + Send Button */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id={`custom-amount-${card.id}`}
                    type="number"
                    step="0.05"
                    min="0.01"
                    placeholder="Custom SOL (e.g. 0.25)"
                    value={customAmounts[card.id] || ""}
                    onChange={(e) =>
                      setCustomAmounts((prev) => ({
                        ...prev,
                        [card.id]: e.target.value,
                      }))
                    }
                    disabled={isBoosting}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: "rgba(10, 15, 30, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "var(--text-primary)",
                      fontSize: "0.8rem",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#a78bfa";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                    }}
                  />
                  <button
                    id={`custom-send-btn-${card.id}`}
                    type="button"
                    onClick={() => {
                      const val = parseFloat(customAmounts[card.id] || "0");
                      handleBoost(card.beneficiaryWallet, val, card.id);
                    }}
                    disabled={isBoosting || !customAmounts[card.id]}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: "none",
                      background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentColor}cc)`,
                      color: "white",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: isBoosting || !customAmounts[card.id] ? "not-allowed" : "pointer",
                      opacity: isBoosting || !customAmounts[card.id] ? 0.5 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    Send
                  </button>
                </div>

                {/* Live Transaction Status & Explorer Confirmation */}
                {status?.processing && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#a78bfa",
                      textAlign: "center",
                      animation: "pulseGlow 1.2s ease-in-out infinite",
                    }}
                  >
                    ⚡ Confirming transaction on Devnet…
                  </div>
                )}
                {status?.signature && (
                  <div style={{ textAlign: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 600, display: "block" }}>
                      ✓ Donation Confirmed!
                    </span>
                    <a
                      href={solscanUrl(status.signature)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "11px",
                        color: "#38bdf8",
                        textDecoration: "underline",
                        fontFamily: "monospace",
                        display: "inline-block",
                        marginTop: "2px",
                      }}
                    >
                      View Verified Proof on Solscan
                    </a>
                  </div>
                )}
                {status?.error && (
                  <div style={{ fontSize: "11px", color: "#f87171", textAlign: "center" }}>
                    ⚠️ {status.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </section>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        style={{
          width: "100%",
          maxWidth: MAX_W,
          marginTop: "64px",
          paddingTop: "32px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
        }}
      >
        Built at a 24-hour hackathon · Solana Devnet · ElevenLabs TTS ·{" "}
        <span style={{ color: "#7c3aed" }}>EchoAid</span>
      </footer>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes waveBar {
          from { transform: scaleY(0.5); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </main>
  );
}
