import type { Metadata } from "next";
import "./globals.css";
import HeroVideoBackground from "./components/HeroVideoBackground";
import GlobalPixelGlobe from "./components/GlobalPixelGlobe";

export const metadata: Metadata = {
  title: "EchoAid — Voice-Powered Mutual Aid",
  description:
    "EchoAid connects communities through hyper-realistic AI voice stories and frictionless Solana micro-donations. Empowering local mutual aid, one voice at a time.",
  keywords: ["mutual aid", "ElevenLabs", "Solana", "micro-donations", "community"],
  openGraph: {
    title: "EchoAid — Voice-Powered Mutual Aid",
    description: "Hyper-realistic AI voice synthesis meets near-zero-fee crypto micro-donations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ position: "relative", minHeight: "100vh", backgroundColor: "#030408" }}>
        <HeroVideoBackground />
        <GlobalPixelGlobe />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
