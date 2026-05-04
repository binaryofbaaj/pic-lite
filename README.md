# 📸 PIC-lite | Ultra-Glass Pro Camera

**PIC-lite** is a high-performance, web-based camera application designed with a premium **Ultra-Glassmorphism** aesthetic. Built for the modern web, it transforms the browser into a professional creative suite capable of high-resolution photography and cinematic video recording with real-time post-processing filters.

---

## ✨ Key Features

### 🎨 Design & UX
- **Ultra-Glass UI**: A sophisticated design system featuring deep blurs (40px), obsidian translucency, and high-contrast specular borders.
- **Ergonomic Controls**: Optimized for one-handed mobile use with a centralized "Command Zone" and a spacious capture area.
- **Cinematic Startup**: A professional calibration sequence with a neon-cyan progress bar.

### 📸 Photography & Video
- **Dual-Mode Engine**: Seamlessly switch between **Photo** and **Video** modes via the top obsidian pill toggle.
- **Retro Filter Suite**: A curated collection of real-time filters (RAW, B&W, Retro, Film, Heat, Glitch, etc.).
- **Zap Randomizer**: Instantly swap to a random creative filter with haptic feedback.
- **Cinematic Video**: High-bitrate video recording with real-time filter application and a live recording HUD.

### 🛠️ Advanced Tools
- **Switch Camera**: Hot-swap between front (selfie) and back (pro) sensors.
- **Full-Bleed Review**: Review captures in a full-screen, edge-to-edge stage with floating glass controls.
- **Session Archive**: A temporary in-memory gallery to review, download, or share your recent snaps.

---

## 🚀 Technology Stack
- **Core**: Vanilla JavaScript (ES6+), HTML5 Semantic Structure.
- **Styling**: Modern CSS3 (Flexbox, Grid, Backdrop-Filters, Custom Properties).
- **Post-Processing**: HTML5 Canvas API for real-time pixel manipulation.
- **Recording**: MediaRecorder API for high-fidelity video capture.
- **Iconography**: [Lucide Icons](https://lucide.dev/) for crisp, vector-based HUD elements.

---

## 📖 How It Works

### 1. The Rendering Pipeline
The app uses a high-frequency `requestAnimationFrame` loop to draw the raw camera feed onto an invisible `canvas`. This allows PIC-lite to apply complex CSS filters (`ctx.filter`) to the frames before they are displayed in the viewport or saved to a file.

### 2. Video Capture
When in **Video Mode**, the app utilizes the `canvas.captureStream()` method. This ensures that whatever filters you see in the viewport are baked directly into the recorded `.webm` file.

### 3. Responsive Adaptability
The interface uses `env(safe-area-inset-bottom)` and flexible viewport units to ensure the UI remains pixel-perfect across iPhones, Android devices, and Desktop browsers.

---

## 🛠️ Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/binaryofbaaj/pic-lite.git
   ```
2. **Navigate to the directory:**
   ```bash
   cd pic-lite
   ```
3. **Run a local server:**
   ```bash
   npx serve .
   ```

---

## 🌍 Deployment (GitHub Pages)

PIC-lite is fully optimized for static hosting:
1. Push your code to a GitHub repository.
2. Go to **Settings > Pages**.
3. Select the `main` branch as the source.
4. Your pro camera will be live at `https://binaryofbaaj.github.io/pic-lite/`.

---

## 📜 License
This project is open-source and available under the **MIT License**.

---

*Built with ❤️ by baaj*
