# 🌌 SOLSTICE CIPHER: The Turing Test of Light and Shadow

*A premium, retro-futuristic browser-based game of optical logic and conversational Turing tests. Created for the June Solstice Game Jam 2026.*

---

## 🎮 Game Overview

**Solstice Cipher** combines two core elements:
1. **Light & Shadow Routing (The Solstice Theme)**: Solve optical routing puzzles on a coordinates grid. Align mirrors, prism splitters, and RGB color filters to connect emitters to receivers. Toggle the **Solstice Cycle (Day & Night)** to dynamically shift active lasers and receptors, requiring adaptive algorithms.
2. **Conversational Turing Tests (The Alan Turing Theme)**: Decrypting the light beams stabilizes a "digital consciousness". Interact with the decrypted entity through a vintage phosphor-green CRT terminal. Chat, detect logical inconsistencies, and declare your Turing Test verdict: is it a reconstructed **Human Mind** or a statistical **AI Emulation**?

---

## ✨ Features & Visual Excellence

- **Frosted Glassmorphism HUD**: Transparent panels featuring heavy backdrop blurring, responsive sizing, and running neon borders that pulse dynamically when selected.
- **Canvas-based Telemetry Oscilloscope**: Real-time signal waves displaying active frequencies and calibration statuses based on laser routing.
- **Falling Binary Matrix CRT**: Phosphor scanline overlay, vintage screen vignette, scan-line flickers, and a background falling matrix code waterfall behind dialogues.
- **Procedural Sound Engine**: High-fidelity sound effects, click snaps, alarms, decryption arpeggios, and baseline laser hums generated procedurally using the **Web Audio API** (zero asset download latency!).
- **Client-Side secure API Core**: Locally encrypted API keys in storage utilizing stretch hashing. Caches decrypted keys in `sessionStorage` for seamless, refresh-resilient game play, with a fallback simulator if offline.
- **Level Persistence**: Restores board layouts, conversation logs, and node status from `localStorage` so switching levels or refreshing does not wipe your progress.

---

## 🛠️ Technical Architecture

- **Core Tech**: React (State, Effects, Refs), Vite, Vanilla CSS, and SVG overlays.
- **Light propagation Engine**: A recursive **Depth-First Search (DFS) Raycaster** that calculates splits, reflections, color transitions, and handles loop prevention automatically.
- **GenAI Interface**: Integrated with Google's `gemma-4-26b-a4b-it` utilizing system personas context mapped to specific historical or fictional figures (Turing-AI, Freedom Collective, Solstice Warden, and Marsha-AI).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Execution
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/YOUR_USERNAME/solstice-cipher.git
   cd solstice-cipher
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```
4. Open the local address shown (e.g., `http://localhost:5173`) in your browser.

---

## ☁️ Cloudflare Pages Deployment

This project integrates **Cloudflare Wrangler** for instant production builds and deployment.

### Deploying the App
Simply build and deploy in one command:
```bash
npm run deploy
```
This executes:
1. `vite build` — Compiles React components, styles, and SVG modules into the `dist/` folder.
2. `wrangler pages deploy dist` — Uploads the compiled assets directly to Cloudflare Pages.

---

## 📜 Story & Levels

- **NODE 01: Turing's Imitation Machine** (Turing & AI Identity) — Calibrate white lasers and probe the detached, academic British entity claiming to be Alan Turing.
- **NODE 02: Beacon of Freedom** (Juneteenth & Pride) — Split a white beam into Red and Green channels to power liberation beacons. Interrogate the warm, choral reconstructed voices of the Freedom Collective.
- **NODE 03: Solstice Observatory** (Passage of Time) — Align a complex 8x8 grid that functions across both Day (Yellow light) and Night (Blue light) cycles. Meet the mechanical Solstice Warden.
- **NODE 04: Stonewall Rebellion** (Pride & Authenticity) — Route beams through Red and Blue filter gates to speak to the high-energy, drag-icon persona Marsha-AI v2.0.
- **NODE 05: Turing's Dream** (Ultimate Synthesis) — Solve the final, double-cycle routing challenge to communicate with the core system consciousness.

---

## 🏆 Game Jam Credits

*This is a submission for the [June Solstice Game Jam](https://dev.to/challenges/june-game-jam-2026-06-03)*

- **Category**: Best Google AI Usage & Best Ode to Alan Turing.
- **Deploy Environment**: Cloudflare Pages.
