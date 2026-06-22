# 🕹️ Neon Snake - Cyberpunk Retro Arcade Game

Welcome to **Neon Snake**, a visually-stunning, high-performance, single-page retro-arcade game set in a cyberpunk neon universe.

This project transforms a simple repository into an interactive, sleek gaming experience written entirely in pure **HTML5 Canvas**, modern **CSS3**, and **Vanilla JavaScript** (using the **Web Audio API** for real-time retro game audio).

---

## 🚀 Play Instantly
Simply open `index.html` in any web browser to play! 
No compilation, installation, or heavy packages required.

---

## ✨ Features

- **Retro Cyberpunk Aesthetic:** Dark background overlays, bright neon grids, glowing elements, scanline overlays, and CRTs/flickering animation effects.
- **Dynamic Web Audio System:** Uses the browser's Native Web Audio API to synthesize retro 8-bit sound effects (eating food, grabbing golden power-ups, system failure) instantly without needing external audio files.
- **Responsive Controls:**
  - **Desktop:** Use Arrow Keys or `W`, `A`, `S`, `D`.
  - **Mobile / Tablet:** Automatic touchscreen detection reveals responsive custom on-screen direction pads.
- **Difficulty Configurations:** Four gaming speed presets: **Slow**, **Normal**, **Fast**, and **Insane** to challenge any skill level.
- **Score Memory:** Integrates `localStorage` to save and display your local high score across gaming sessions.
- **Adaptive Gold Core Power-ups:** Rare gold neon cores spawn randomly with a visual countdown timer, offering massive score boosts if acquired in time.

---

## 🛠️ Technology Stack

- **Graphics Rendering:** HTML5 Canvas API (`2D context`)
- **Retro Synth Audio:** Vanilla JS Web Audio API (OscillatorNode, GainNode)
- **Styling & Effects:** CSS3 Grid, Flexbox, Glow Filters, CRT Scanline Overlay
- **Fonts:** Google Fonts Integration (Orbitron & VT323 retro font family)
- **State Management:** Modern ES6 JavaScript

---

## 🎮 How To Play

1. Choose your difficulty level (**Slow**, **Normal**, **Fast**, **Insane**) on the initialization screen.
2. Click **LOAD GAME**.
3. Drive your cyber-snake through the grid.
4. Absorb the glowing pink bits to expand your core.
5. Grab rare glowing yellow power-up cores for bonus points before they disappear.
6. Do not run into walls or hit your own core!

Have fun beating your high score! 🕹️👾
