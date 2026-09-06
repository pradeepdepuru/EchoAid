# EchoAid: 24-Hour Hackathon Execution Plan

A project connecting hyper-realistic voice synthesis with frictionless, near-zero-fee crypto micro-donations to empower local mutual aid.

---

## 🏗️ Core Architecture & Components
1. **Frontend Sandbox**: React/Next.js or Python Streamlit.
2. **Audio Engine**: ElevenLabs Developer Account (Free Tier) API.
3. **Trust Layer**: Solana Devnet Wallet & Faucet (`@solana/web3.js`).
4. **Hosting**: Vercel or Netlify (Free Tier, 5-minute setup).

---

## ⏱️ Hour-by-Hour Implementation Blueprint

### Phase 1: Setup & Mock UI (Hours 1–4)
* Initialize your workspace (Next.js/React or Streamlit).
* Build a single-page layout featuring a grid with 3 card modules.
* Each card needs: A project title, text excerpt, HTML5 `<audio>` player, and a "Boost with $1 SOL" button.

### Phase 2: ElevenLabs Integration (Hours 4–8)
* Write your serverless or backend API route to process text-to-speech requests dynamically.
* **API Endpoint**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
* Pass variables securely using environment variables (`ELEVENLABS_API_KEY`).

### Phase 3: Solana Devnet Micro-Grants (Hours 8–12)
* Install `@solana/web3.js`.
* Establish a web3 connection using `clusterApiUrl('devnet')`.
* Construct a standard client-side `SystemProgram.transfer` transaction to route funds smoothly to target beneficiary wallets.

### Phase 4: Polish & Multilingual Pivot (Hours 12–16)
* Style with clean design, high contrast typography, and interactive button states.
* Add an English/Spanish toggle option using ElevenLabs multi-language features to capture the UN Equity & Inclusion theme.

### Phase 5: Submission & Pitch Writing (Hours 16–24)
* Draft the text for your submission platform entry.
* Explicitly break down how EchoAid solves the "nonprofit documentation bottleneck" using high-speed digital rails combined with human empathy.

---

## 💻 Technical Code Boilerplates

### 1. ElevenLabs Speech Generation (Next.js Node API Route)
```javascript
export async function POST(req) {
  const { text } = await req.json();
  
  const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.5 }
    }),
  });

  const arrayBuffer = await response.arrayBuffer();
  return new Response(Buffer.from(arrayBuffer), { headers: { "Content-Type": "audio/mpeg" } });
}
```

### 2. Solana Client-Side Transfer
```javascript
import { Connection, clusterApiUrl, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function sendMicroGrant(fromWalletWindow, toPublicKeyStr) {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const toPublicKey = new PublicKey(toPublicKeyStr);
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWalletWindow.publicKey,
      toPubkey: toPublicKey,
      lamports: 0.05 * LAMPORTS_PER_SOL, 
    })
  );
  
  const signature = await fromWalletWindow.signAndSendTransaction(transaction);
  await connection.confirmTransaction(signature, 'processed');
  return signature;
}
```
