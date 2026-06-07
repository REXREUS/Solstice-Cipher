import React, { useState, useEffect, useRef } from "react";
import { levels } from "./utils/levels";
import { calculateLightPaths } from "./utils/raycaster";
import audio from "./utils/audio";
import { sendMessageToGemini } from "./utils/gemini";
import crypto from "./utils/crypto";

// Lore Database content
const loreArticles = {
  "alan-turing": {
    title: "Alan Turing & Modern Computing",
    date: "June 23 (Turing's Birthday)",
    text: "Alan Turing (1912–1954) was a British mathematician, logician, and cryptanalyst who laid the foundations of modern computer science and artificial intelligence. During World War II, his work at Bletchley Park breaking the German Enigma cipher saved millions of lives. He proposed the 'Turing Test' (The Imitation Game) as a measure of machine intelligence. Despite his monumental contributions, Turing was persecuted by his own government in 1952 for being homosexual, leading to chemical castration and his untimely death. June, Turing's birth month, stands as a symbol of both scientific breakthrough and LGBTQIA+ pride."
  },
  "juneteenth-pride": {
    title: "Juneteenth & Pride: Paths to Liberation",
    date: "June 19 & June 28",
    text: "June is a profound month for freedom and identity. Juneteenth (June 19) marks the day in 1865 when news of emancipation finally reached enslaved African Americans in Galveston, Texas—two and a half years after the Emancipation Proclamation. It is a time to honor resilience and amplify Black Joy. Similarly, Pride Month commemorates the Stonewall Riots of June 1969, led by trans women of color, which catalyzed the modern LGBTQIA+ rights movement. Both celebrations represent humanity's collective journey from the darkness of oppression into the light of authenticity and self-determination."
  },
  "solstice-lore": {
    title: "The Summer Solstice: Cycles of Light",
    date: "June 21 (Solstice)",
    text: "The word 'solstice' comes from the Latin 'sol' (sun) and 'sistere' (to stand still). On June 21, the Earth's tilt towards the sun reaches its maximum, marking the longest day of the year in the northern hemisphere and the shortest day in the southern hemisphere. Historically, cultures worldwide have celebrated this transition point with midsummer bonfires, festivals of light, and seasonal alignment observances. In our game, the Solstice toggle represents this cosmic shift—balancing active energy (daylight) and deep reflection (shadows) to route the light of understanding."
  }
};

// Achievements config
const achievementsList = [
  { id: "api-key-config", title: "AI Core Online", desc: "Successfully configured your Google Gemini API Key." },
  { id: "level-1-solved", title: "Logical Crypt", desc: "Decoded Level 1: Turing's Imitation Machine." },
  { id: "level-2-solved", title: "Prism of Freedom", desc: "Decoded Level 2: Beacon of Freedom." },
  { id: "level-3-solved", title: "Orbits Aligned", desc: "Decoded Level 3: Solstice Observatory." },
  { id: "level-4-solved", title: "Stonewall Riot", desc: "Decoded Level 4: Stonewall Rebellion." },
  { id: "level-5-solved", title: "Turing's Dream", desc: "Decoded Level 5: Turing's Dream." },
  { id: "turing-master", title: "Supreme Judge", desc: "Submitted correct Turing Test verdicts for all 5 levels." }
];

// Starfield background effect (supports Day solar flares and Night space nebulae)
const Starfield = ({ mode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Generate stars and floating dust particles
    const stars = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 0.5 + Math.random() * 1.8,
      twinkleSpeed: 0.003 + Math.random() * 0.007,
      brightness: Math.random(),
      speedX: (Math.random() - 0.5) * 0.05,
      speedY: (Math.random() - 0.5) * 0.05,
      color: Math.random() > 0.85 
        ? (mode === "day" ? "rgba(253, 186, 116, 0.8)" : "rgba(103, 232, 249, 0.8)")
        : "rgba(255, 255, 255, 0.8)"
    }));

    // Drifting gas clouds for nebula
    const nebulaClouds = [
      { x: canvas.width * 0.3, y: canvas.height * 0.3, vx: 0.015, vy: 0.01, size: 450, colorDay: "rgba(245, 158, 11, 0.07)", colorNight: "rgba(139, 92, 246, 0.08)" },
      { x: canvas.width * 0.7, y: canvas.height * 0.6, vx: -0.01, vy: -0.012, size: 600, colorDay: "rgba(239, 68, 68, 0.04)", colorNight: "rgba(0, 240, 255, 0.06)" }
    ];

    // Shooting stars
    let shootingStar = null;
    const spawnShootingStar = () => {
      shootingStar = {
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.4,
        dx: 4 + Math.random() * 6,
        dy: 2 + Math.random() * 3,
        length: 80 + Math.random() * 120,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02
      };
    };

    const draw = () => {
      time += 0.002;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Nebula Clouds
      nebulaClouds.forEach(cloud => {
        cloud.x += cloud.vx;
        cloud.y += cloud.vy;
        
        // Bounce off bounds
        if (cloud.x < 0 || cloud.x > canvas.width) cloud.vx = -cloud.vx;
        if (cloud.y < 0 || cloud.y > canvas.height) cloud.vy = -cloud.vy;

        // Draw radial cloud
        const grad = ctx.createRadialGradient(
          cloud.x + Math.sin(time) * 30, cloud.y + Math.cos(time) * 30, 0,
          cloud.x, cloud.y, cloud.size
        );
        const color = mode === "day" ? cloud.colorDay : cloud.colorNight;
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(3, 6, 15, 0)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Solar Corona in Day mode
      if (mode === "day") {
        const cx = canvas.width / 2;
        const cy = 0; // Top middle
        const pulseRadius = 350 + Math.sin(time * 3) * 20;

        const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
        sunGrad.addColorStop(0, "rgba(245, 158, 11, 0.15)");
        sunGrad.addColorStop(0.3, "rgba(251, 146, 60, 0.06)");
        sunGrad.addColorStop(1, "rgba(3, 6, 15, 0)");

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw Stars
      stars.forEach(star => {
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1 || star.brightness < 0) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Drifting motion
        star.x += star.speedX;
        star.y += star.speedY;

        // Wrap around screen
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, Math.abs(star.brightness)));
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Draw Shooting Star (mostly in Night mode)
      if (mode === "night") {
        if (!shootingStar && Math.random() < 0.003) {
          spawnShootingStar();
        }

        if (shootingStar) {
          ctx.save();
          ctx.globalAlpha = shootingStar.life;
          const grad = ctx.createLinearGradient(
            shootingStar.x, shootingStar.y,
            shootingStar.x - shootingStar.dx * 10, shootingStar.y - shootingStar.dy * 10
          );
          grad.addColorStop(0, "rgba(0, 240, 255, 1)");
          grad.addColorStop(0.4, "rgba(139, 92, 246, 0.5)");
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(shootingStar.x - shootingStar.dx * 6, shootingStar.y - shootingStar.dy * 6);
          ctx.stroke();
          ctx.restore();

          // Move
          shootingStar.x += shootingStar.dx;
          shootingStar.y += shootingStar.dy;
          shootingStar.life -= shootingStar.decay;

          if (shootingStar.life <= 0) {
            shootingStar = null;
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);

  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: -1, pointerEvents: "none" }} />;
};

// Procedural Oscilloscope / Signal Spectrogram Canvas for HUD Telemetry
const TelemetryOscilloscope = ({ activeBeamCount, isSolved, mode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let phase = 0;

    const draw = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Draw grid background
      ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw waves
      const strokeColor = mode === "day" ? "rgba(245, 158, 11, 0.8)" : "rgba(0, 240, 255, 0.8)";
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 3;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      phase += isSolved ? 0.15 : activeBeamCount > 0 ? 0.08 : 0.02;

      for (let x = 0; x < width; x++) {
        let y = midY;
        if (isSolved) {
          y += Math.sin(x * 0.05 + phase) * 12 + Math.cos(x * 0.1 - phase * 1.5) * 6;
        } else if (activeBeamCount > 0) {
          const amp = 8 + activeBeamCount * 2;
          const freq = 0.03 + activeBeamCount * 0.005;
          y += Math.sin(x * freq - phase) * amp + (Math.random() - 0.5) * 1.5;
        } else {
          y += Math.sin(x * 0.01 - phase) * 2 + (Math.random() - 0.5) * 0.8;
        }

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Telemetry Labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = "8px monospace";
      ctx.fillText(isSolved ? "STATUS: CALIBRATED" : activeBeamCount > 0 ? "STATUS: CALIBRATING..." : "STATUS: STANDBY", 6, 12);
      ctx.fillText(`SIG.FRQ: ${isSolved ? "440.00Hz" : activeBeamCount > 0 ? `${(activeBeamCount * 80).toFixed(2)}Hz` : "12.00Hz"}`, 6, height - 6);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeBeamCount, isSolved, mode]);

  return (
    <canvas 
      ref={canvasRef} 
      width="270" 
      height="65" 
      style={{ 
        background: "rgba(2, 4, 10, 0.65)", 
        border: "1px solid rgba(0, 240, 255, 0.12)", 
        borderRadius: "8px", 
        marginTop: "12px",
        display: "block",
        width: "100%",
        boxShadow: "inset 0 1px 4px rgba(0,0,0,0.8)"
      }} 
    />
  );
};

// Falling Binary Matrix Rain for Retro CRT Background
const MatrixRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const chars = "0101010101TURINGCODEBREAKING";
    const fontSize = 10;
    const columns = Math.floor(canvas.width / fontSize) + 1;
    const drops = Array(columns).fill(1);

    const draw = () => {
      if (!canvas) return;
      ctx.fillStyle = "rgba(2, 7, 3, 0.12)"; // Phosphor dark green fade
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(57, 255, 20, 0.08)"; // Low opacity green phosphor
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        zIndex: 1, 
        pointerEvents: "none"
      }} 
    />
  );
};

export default function App() {
  // --- Game State ---
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [placedComponents, setPlacedComponents] = useState({}); // key: "x,y", value: {type, rotation}
  const [solsticeMode, setSolsticeMode] = useState("day"); // "day" or "night"
  const [selectedTool, setSelectedTool] = useState(null); // "mirror", "splitter", "filter_red", "filter_green", "eraser"
  
  // --- UI Progression State (LocalStorage) ---
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [unlockedLore, setUnlockedLore] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [toasts, setToasts] = useState([]);

  // --- API / Chat State ---
  const [encryptedApiKey, setEncryptedApiKey] = useState(() => localStorage.getItem("solstice_encrypted_api_key") || "");
  const [geminiApiKey, setGeminiApiKey] = useState(() => sessionStorage.getItem("solstice_decrypted_api_key") || ""); // Cached in sessionStorage for refresh
  const [passphraseInput, setPassphraseInput] = useState("");
  const [settingsPassphrase, setSettingsPassphrase] = useState("");
  const [decryptionError, setDecryptionError] = useState("");
  const [offlineMode, setOfflineMode] = useState(() => localStorage.getItem("solstice_offline_mode") === "true");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isApiLocked, setIsApiLocked] = useState(() => {
    const hasSavedKey = localStorage.getItem("solstice_encrypted_api_key");
    const offline = localStorage.getItem("solstice_offline_mode") === "true";
    const cachedKey = sessionStorage.getItem("solstice_decrypted_api_key");
    if (offline) return false;
    if (cachedKey) return false;
    return !!hasSavedKey; // Locked if there is a saved encrypted key
  });

  const [terminalHistory, setTerminalHistory] = useState([]);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const lastLevelIdRef = useRef(levels[activeLevelIdx].id);
  const [terminalInput, setTerminalInput] = useState("");
  const [isNpcTyping, setIsNpcTyping] = useState(false);
  const [verdictDeclared, setVerdictDeclared] = useState(false);
  const [verdictSuccess, setVerdictSuccess] = useState(false);

  // --- Modals Toggle ---
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [activeLoreTab, setActiveLoreTab] = useState("alan-turing");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  const level = levels[activeLevelIdx];
  const terminalBottomRef = useRef(null);

  // Load user progress from localStorage on mount
  useEffect(() => {
    const savedLevels = localStorage.getItem("solstice_levels");
    const savedLore = localStorage.getItem("solstice_lore");
    const savedAch = localStorage.getItem("solstice_achievements");

    if (savedLevels) setUnlockedLevels(JSON.parse(savedLevels));
    if (savedLore) setUnlockedLore(JSON.parse(savedLore));
    if (savedAch) {
      const parsedAch = JSON.parse(savedAch);
      setUnlockedAchievements(parsedAch);
      
      // Update verdict status for the initial active level if it is solved
      const currentLevelSolved = parsedAch.includes(`level-${levels[activeLevelIdx].id}-solved`);
      if (currentLevelSolved) {
        setVerdictDeclared(true);
        setVerdictSuccess(true);
      }
    }
  }, []);

  // Listen for first user gesture to unlock AudioContext
  useEffect(() => {
    const handleGesture = () => {
      setHasInteracted(true);
      audio.resume();
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
    window.addEventListener("click", handleGesture);
    window.addEventListener("keydown", handleGesture);
    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, []);

  // Set page data-theme based on day/night mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", solsticeMode);
  }, [solsticeMode]);

  // Load level configuration (runs whenever level changes)
  useEffect(() => {
    // 1. Load board layout from localStorage
    const savedBoard = localStorage.getItem(`solstice_board_level_${level.id}`);
    if (savedBoard) {
      try {
        setPlacedComponents(JSON.parse(savedBoard));
      } catch (e) {
        setPlacedComponents({});
      }
    } else {
      setPlacedComponents({});
    }

    // 2. Load terminal history from localStorage
    const savedHistory = localStorage.getItem(`solstice_chat_level_${level.id}`);
    if (savedHistory) {
      try {
        setTerminalHistory(JSON.parse(savedHistory));
      } catch (e) {
        setTerminalHistory([
          { sender: "system", text: `DECRYPTION LOG: Grid connection established. Decrypted entity: ${level.npc.name}` },
          { sender: "ai", text: level.npc.openingMessage }
        ]);
      }
    } else {
      setTerminalHistory([
        { sender: "system", text: `DECRYPTION LOG: Grid connection established. Decrypted entity: ${level.npc.name}` },
        { sender: "ai", text: level.npc.openingMessage }
      ]);
    }

    // Update level ref
    lastLevelIdRef.current = level.id;

    setSolsticeMode(level.solsticeMode || "day");
    setSelectedTool(null);

    // 3. Set solved/verdict state based on achievements
    const isSolved = unlockedAchievements.includes(`level-${level.id}-solved`);
    setVerdictDeclared(isSolved);
    setVerdictSuccess(isSolved);
  }, [activeLevelIdx]);

  // Save placedComponents to localStorage
  useEffect(() => {
    if (level && lastLevelIdRef.current === level.id) {
      localStorage.setItem(`solstice_board_level_${level.id}`, JSON.stringify(placedComponents));
    }
  }, [placedComponents, level.id]);

  // Save terminalHistory to localStorage
  useEffect(() => {
    if (level && terminalHistory.length > 0 && lastLevelIdRef.current === level.id) {
      localStorage.setItem(`solstice_chat_level_${level.id}`, JSON.stringify(terminalHistory));
    }
  }, [terminalHistory, level.id]);

  // Scroll terminal to bottom
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, isNpcTyping]);

  // --- Laser Light Raycast Calculation ---
  const { paths, activatedReceivers } = calculateLightPaths(level, placedComponents, solsticeMode);
  const activeReceiversCount = level.receivers.filter(r => r.activeIn === "both" || r.activeIn === solsticeMode).length;
  const isPuzzleSolved = activatedReceivers.length === activeReceiversCount && activeReceiversCount > 0;

  // Sound hum trigger when lasers are active and user has interacted
  useEffect(() => {
    if (paths.length > 0 && hasInteracted) {
      audio.startHum();
    } else {
      audio.stopHum();
    }
    return () => audio.stopHum();
  }, [paths, hasInteracted]);

  // Play success sound when puzzle gets solved first time
  const lastSolvedRef = useRef(false);
  useEffect(() => {
    if (isPuzzleSolved && !lastSolvedRef.current) {
      audio.playSuccess();
      // Auto unlock lore
      unlockLoreItem(level.loreId);
    }
    lastSolvedRef.current = isPuzzleSolved;
  }, [isPuzzleSolved]);

  // Helper to trigger floating achievement toast
  const triggerAchievement = (id) => {
    const ach = achievementsList.find(a => a.id === id);
    if (!ach || unlockedAchievements.includes(id)) return;

    audio.playAchievement();
    
    const newAchievements = [...unlockedAchievements, id];
    setUnlockedAchievements(newAchievements);
    localStorage.setItem("solstice_achievements", JSON.stringify(newAchievements));

    // Push new toast
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, ...ach }]);
    
    // Auto clear toast after 4.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4500);
  };

  const unlockLoreItem = (id) => {
    if (unlockedLore.includes(id)) return;
    const newLore = [...unlockedLore, id];
    setUnlockedLore(newLore);
    localStorage.setItem("solstice_lore", JSON.stringify(newLore));
  };

  const unlockLevelItem = (num) => {
    if (unlockedLevels.includes(num)) return;
    const newLvls = [...unlockedLevels, num];
    setUnlockedLevels(newLvls);
    localStorage.setItem("solstice_levels", JSON.stringify(newLvls));
  };

  // --- Board Grid Cell Actions ---
  const handleCellClick = (x, y) => {
    const key = `${x},${y}`;
    
    // Check if cell is within blocked coordinates
    const isBlocked = level.blocks.some(b => b.x === x && b.y === y);
    if (isBlocked) {
      audio.playError();
      return;
    }

    // Check if cell has an emitter/receiver (cannot place on top of them)
    const isEmitter = level.emitters.some(e => e.x === x && e.y === y);
    const isReceiver = level.receivers.some(r => r.x === x && r.y === y);
    if (isEmitter || isReceiver) {
      audio.playError();
      return;
    }

    const currentComponent = placedComponents[key];

    if (selectedTool === "eraser") {
      if (currentComponent) {
        audio.playRotate();
        const updated = { ...placedComponents };
        delete updated[key];
        setPlacedComponents(updated);
      }
    } else if (selectedTool) {
      // Placing new tool or rotating existing
      if (currentComponent && currentComponent.type === selectedTool) {
        // Rotate existing component clockwise 90 degrees
        audio.playRotate();
        setPlacedComponents({
          ...placedComponents,
          [key]: {
            ...currentComponent,
            rotation: (currentComponent.rotation + 90) % 360
          }
        });
      } else {
        // Place new tool
        // Check if we have inventory left
        const currentCount = Object.values(placedComponents).filter(c => c.type === selectedTool).length;
        const limit = level.toolbox[selectedTool] || 0;
        
        if (currentCount >= limit && (!currentComponent || currentComponent.type !== selectedTool)) {
          audio.playError();
          alert(`You reached the placement limit for ${selectedTool.replace("_", " ")}s!`);
          return;
        }

        audio.playRotate();
        setPlacedComponents({
          ...placedComponents,
          [key]: {
            type: selectedTool,
            rotation: 0
          }
        });
      }
    } else {
      // No tool selected: clicking a placed component rotates it, clicking empty does nothing
      if (currentComponent) {
        audio.playRotate();
        setPlacedComponents({
          ...placedComponents,
          [key]: {
            ...currentComponent,
            rotation: (currentComponent.rotation + 90) % 360
          }
        });
      }
    }
  };

  // Clear all items on the board
  const clearBoard = () => {
    audio.playRotate();
    setPlacedComponents({});
  };

  // --- Terminal Dialogue Action ---
  const handleTerminalSubmit = async (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    if (!isPuzzleSolved) {
      setTerminalHistory(prev => [
        ...prev,
        { sender: "player", text: terminalInput },
        { sender: "system", text: "SYSTEM WARNING: Optical laser path interrupted. Decryption incomplete. Please solve the puzzle before communicating." }
      ]);
      setTerminalInput("");
      audio.playError();
      return;
    }

    const playerMsg = terminalInput;
    setTerminalInput("");
    audio.playClick();

    // Add player message
    const updatedHistory = [...terminalHistory, { sender: "player", text: playerMsg }];
    setTerminalHistory(updatedHistory);
    setIsNpcTyping(true);

    // Call Gemini API (with fallback simulation)
    const reply = await sendMessageToGemini(geminiApiKey, updatedHistory.slice(1), level.npc);
    
    setIsNpcTyping(false);
    setTerminalHistory(prev => [...prev, { sender: "ai", text: reply }]);
  };

  // --- Submit Turing Test Verdict ---
  const handleDeclareVerdict = (type) => {
    if (!isPuzzleSolved) {
      audio.playError();
      alert("You must decode the optical puzzle first!");
      return;
    }

    setVerdictDeclared(true);
    const correct = type === level.verdict;
    setVerdictSuccess(correct);

    if (correct) {
      audio.playSuccess();
      
      // Trigger achievements
      triggerAchievement(`level-${level.id}-solved`);
      
      // If completed all 5 levels correctly, unlock Turing Master
      const solvedCount = level.id;
      if (solvedCount === 5) {
        triggerAchievement("turing-master");
      }

      // Unlock next level
      if (activeLevelIdx < levels.length - 1) {
        unlockLevelItem(level.id + 1);
      }
    } else {
      audio.playError();
    }
  };

  // --- Settings Menu Save API Key ---
  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const cleanKey = geminiApiKey.trim();
    const cleanPass = settingsPassphrase.trim();

    if (cleanKey === "") {
      // Clear key
      localStorage.removeItem("solstice_encrypted_api_key");
      sessionStorage.removeItem("solstice_decrypted_api_key");
      setEncryptedApiKey("");
      setGeminiApiKey("");
      setIsApiLocked(false);
      setOfflineMode(true);
      localStorage.setItem("solstice_offline_mode", "true");
      setShowSettingsModal(false);
      audio.playSuccess();
      return;
    }

    if (cleanPass === "") {
      audio.playError();
      alert("A Local Decryption Passphrase is REQUIRED to encrypt your API key in storage!");
      return;
    }

    // Encrypt key locally
    const encrypted = crypto.encrypt(cleanKey, cleanPass);
    localStorage.setItem("solstice_encrypted_api_key", encrypted);
    sessionStorage.setItem("solstice_decrypted_api_key", cleanKey);
    localStorage.removeItem("solstice_offline_mode");
    
    setEncryptedApiKey(encrypted);
    setIsApiLocked(false);
    setOfflineMode(false);
    setDecryptionError("");
    setSettingsPassphrase(""); // clear password from state after save
    setShowSettingsModal(false);
    audio.playSuccess();

    triggerAchievement("api-key-config");
  };

  // --- Unlock Encrypted API Key ---
  const handleUnlockApiKey = (e) => {
    e.preventDefault();
    const pass = passphraseInput.trim();
    if (!pass) return;

    audio.playClick();
    const decrypted = crypto.decrypt(encryptedApiKey, pass);

    if (decrypted && (decrypted.startsWith("AIza") || decrypted.length >= 10)) {
      setGeminiApiKey(decrypted);
      sessionStorage.setItem("solstice_decrypted_api_key", decrypted);
      setIsApiLocked(false);
      setOfflineMode(false);
      localStorage.removeItem("solstice_offline_mode");
      setDecryptionError("");
      setPassphraseInput("");
      audio.playSuccess();
    } else {
      setDecryptionError("INVALID PASSPHRASE: Key decryption rejected.");
      audio.playError();
    }
  };

  // --- Bypass Lock (Play Offline) ---
  const handlePlayOffline = () => {
    audio.playRotate();
    setOfflineMode(true);
    localStorage.setItem("solstice_offline_mode", "true");
    setIsApiLocked(false);
  };

  // --- Grid Visual Dimensions ---
  const cellSize = 100 / level.gridSize; // percentage cell size

  return (
    <div className="game-container">
      <Starfield mode={solsticeMode} />
      {/* 1. Game Header */}
      <header className="glass-panel game-header">
        <div className="logo-section">
          <svg className="logo-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <div className="logo-text">Solstice Cipher</div>
        </div>

        <div className="header-controls">
          <button 
            className="solstice-toggle" 
            onClick={() => {
              audio.playRotate();
              setSolsticeMode(solsticeMode === "day" ? "night" : "day");
            }}
          >
            <svg 
              className="solstice-toggle-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ transform: solsticeMode === "night" ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              {solsticeMode === "day" ? (
                <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41" />
              ) : (
                <path d="M12 3c.132 0 .263 0 .393.007a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.999z" />
              )}
            </svg>
            Cycle: {solsticeMode}
          </button>

          <button className="btn-primary" onClick={() => { audio.playRotate(); setShowLoreModal(true); }}>
            Lore Archive
          </button>
          
          <button className="btn-primary" onClick={() => { audio.playRotate(); setShowAchievementsModal(true); }}>
            Badges
          </button>

          <button className="btn-primary" onClick={() => { audio.playRotate(); setShowSettingsModal(true); }}>
            Settings
          </button>
        </div>
      </header>

      {/* 2. Main Game Section Layout */}
      <main className="game-grid-layout">
        {/* Left Sidebar: Levels selection */}
        <section className="glass-panel sidebar-panel">
          <h2 className="sidebar-title"> Observatory Nodes</h2>
          <div className="nodes-list-container">
            {levels.map((lvl, index) => {
              const isUnlocked = unlockedLevels.includes(lvl.id);
              const isActive = activeLevelIdx === index;
              return (
                <div 
                  key={lvl.id} 
                  className={`level-card ${isActive ? "active" : ""} ${!isUnlocked ? "locked" : ""}`}
                  style={{ opacity: isUnlocked ? 1 : 0.4, cursor: isUnlocked ? "pointer" : "not-allowed" }}
                  onClick={() => {
                    if (isUnlocked) {
                      audio.playRotate();
                      setActiveLevelIdx(index);
                    } else {
                      audio.playError();
                    }
                  }}
                >
                  <div className="level-number">NODE_0{lvl.id}</div>
                  <div className="level-name">{lvl.name}</div>
                  <div className="level-status">
                    {unlockedAchievements.includes(`level-${lvl.id}-solved`) ? "✓ Decrypted" : isUnlocked ? "• Unlocked" : "🔒 Locked"}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "16px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-secondary)" }}>Active Node Info</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>{level.theme}</p>
            <p style={{ fontSize: "12px" }}>{level.description}</p>
            <TelemetryOscilloscope activeBeamCount={paths.length} isSolved={isPuzzleSolved} mode={solsticeMode} />
          </div>
        </section>

        {/* Center Panel: Puzzle Grid Board */}
        <section className="glass-panel puzzle-panel active">
          {/* Diagnostic readout overlay */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>
            <span>SYS.LOC: GRID_OBS_0{level.id}</span>
            <span>BEAM_COUNT: {paths.length}</span>
            <span>CYCLE_LOCK: {solsticeMode.toUpperCase()}</span>
          </div>

          <div className="puzzle-board-wrapper">
            <svg className="puzzle-board-svg" viewBox="0 0 100 100">
              <defs>
                {/* Block Metal Texture */}
                <linearGradient id="block-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                {/* Receiver Housing Gradient */}
                <radialGradient id="receiver-housing-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#020617" />
                  <stop offset="85%" stopColor="#0f172a" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1e293b" />
                </radialGradient>
                {/* Emitter Housing Gradient */}
                <linearGradient id="emitter-housing-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>
              {/* Sci-Fi Decorative Corner Brackets */}
              <path d="M 4,12 L 4,4 L 12,4" stroke={varColorSolstice()} strokeWidth="0.75" fill="none" opacity="0.6" />
              <path d="M 88,4 L 96,4 L 96,12" stroke={varColorSolstice()} strokeWidth="0.75" fill="none" opacity="0.6" />
              <path d="M 4,88 L 4,96 L 12,96" stroke={varColorSolstice()} strokeWidth="0.75" fill="none" opacity="0.6" />
              <path d="M 88,96 L 96,96 L 96,88" stroke={varColorSolstice()} strokeWidth="0.75" fill="none" opacity="0.6" />

              {/* Render Column Coordinate Labels (A, B, C...) */}
              {Array.from({ length: level.gridSize }).map((_, c) => {
                const letter = String.fromCharCode(65 + c);
                const cellW = 84 / level.gridSize;
                const x = 8 + c * cellW + cellW / 2;
                return (
                  <g key={`coord-col-${c}`}>
                    <text x={x} y="4.5" className="grid-coordinate">{letter}</text>
                    <text x={x} y="96" className="grid-coordinate">{letter}</text>
                  </g>
                );
              })}

              {/* Render Row Coordinate Labels (1, 2, 3...) */}
              {Array.from({ length: level.gridSize }).map((_, r) => {
                const cellH = 84 / level.gridSize;
                const y = 8 + r * cellH + cellH / 2;
                return (
                  <g key={`coord-row-${r}`}>
                    <text x="4" y={y} className="grid-coordinate">{r + 1}</text>
                    <text x="96.5" y={y} className="grid-coordinate">{r + 1}</text>
                  </g>
                );
              })}

              {/* Shifted Grid Cells rendering (Starting at x=8, y=8, size=84) */}
              {Array.from({ length: level.gridSize }).map((_, r) => {
                const cellH = 84 / level.gridSize;
                return Array.from({ length: level.gridSize }).map((_, c) => {
                  const cellW = 84 / level.gridSize;
                  return (
                    <rect
                      key={`${c},${r}`}
                      x={8 + c * cellW}
                      y={8 + r * cellH}
                      width={cellW}
                      height={cellH}
                      className="grid-cell"
                      onClick={() => handleCellClick(c, r)}
                    />
                  );
                });
              })}

              {/* Draw Level Blocks (Industrial Hazard Blocks) */}
              {level.blocks.map((block, idx) => {
                const cellW = 84 / level.gridSize;
                const cellH = 84 / level.gridSize;
                const bx = 8 + block.x * cellW;
                const by = 8 + block.y * cellH;
                const padding = cellW * 0.08;
                return (
                  <g key={`block-${idx}`}>
                    {/* Metal housing */}
                    <rect
                      x={bx + padding}
                      y={by + padding}
                      width={cellW - padding * 2}
                      height={cellH - padding * 2}
                      rx="6"
                      fill="url(#block-metal-grad)"
                      stroke="rgba(0, 240, 255, 0.3)"
                      strokeWidth="0.8"
                      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
                    />
                    {/* Danger caution stripes pattern */}
                    <line x1={bx + padding + 4} y1={by + padding + 2} x2={bx + cellW - padding - 2} y2={by + cellH - padding - 4} stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2.5" strokeDasharray="3, 4" />
                    <line x1={bx + padding + 2} y1={by + padding + 4} x2={bx + cellW - padding - 4} y2={by + cellH - padding - 2} stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2.5" strokeDasharray="3, 4" />
                    {/* Centered Caution logo or crosshairs */}
                    <polygon
                      points={`${bx + cellW/2},${by + cellH/2 - cellW/6} ${bx + cellW/2 - cellW/6},${by + cellH/2 + cellW/6} ${bx + cellW/2 + cellW/6},${by + cellH/2 + cellW/6}`}
                      fill="none"
                      stroke="var(--solstice-color)"
                      strokeWidth="0.8"
                      opacity="0.85"
                    />
                    {/* Inner glowing node dots */}
                    <circle cx={bx + padding + 3} cy={by + padding + 3} r="0.6" fill="var(--solstice-color)" />
                    <circle cx={bx + cellW - padding - 3} cy={by + padding + 3} r="0.6" fill="var(--solstice-color)" />
                    <circle cx={bx + padding + 3} cy={by + cellH - padding - 3} r="0.6" fill="var(--solstice-color)" />
                    <circle cx={bx + cellW - padding - 3} cy={by + cellH - padding - 3} r="0.6" fill="var(--solstice-color)" />
                  </g>
                );
              })}

              {/* Draw Receivers (Holographic energy targets) */}
              {level.receivers.map((receiver, idx) => {
                const cellW = 84 / level.gridSize;
                const cellH = 84 / level.gridSize;
                const rx = 8 + receiver.x * cellW + cellW / 2;
                const ry = 8 + receiver.y * cellH + cellH / 2;
                const isActivated = activatedReceivers.includes(idx);
                const isActive = receiver.activeIn === "both" || receiver.activeIn === solsticeMode;
                const rColor = receiver.color === "red" ? "var(--laser-red)" : receiver.color === "green" ? "var(--laser-green)" : receiver.color === "yellow" ? "var(--laser-yellow)" : receiver.color === "blue" ? "var(--laser-blue)" : "var(--laser-white)";

                return (
                  <g key={`receiver-${idx}`} opacity={isActive ? 1 : 0.15}>
                    {/* Outer Calibration Ring - Spins! */}
                    <circle
                      cx={rx}
                      cy={ry}
                      r={cellW / 2.3}
                      fill="none"
                      stroke={rColor}
                      strokeWidth="0.5"
                      strokeDasharray="2, 4"
                      opacity="0.5"
                    >
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${rx} ${ry}`} to={`360 ${rx} ${ry}`} dur="15s" repeatCount="indefinite" />
                    </circle>

                    {/* Secondary Dotted Ring - Spins opposite direction */}
                    <circle
                      cx={rx}
                      cy={ry}
                      r={cellW / 2.8}
                      fill="none"
                      stroke={rColor}
                      strokeWidth="0.6"
                      strokeDasharray="4, 2"
                      opacity="0.75"
                    >
                      <animateTransform attributeName="transform" type="rotate" from={`360 ${rx} ${ry}`} to={`0 ${rx} ${ry}`} dur="8s" repeatCount="indefinite" />
                    </circle>

                    {/* Housing Circle */}
                    <circle
                      cx={rx}
                      cy={ry}
                      r={cellW / 3.4}
                      fill="url(#receiver-housing-grad)"
                      stroke={rColor}
                      strokeWidth={isActivated ? 1.5 : 0.8}
                      style={{ filter: isActivated ? `drop-shadow(0 0 8px ${rColor})` : "none" }}
                    />

                    {/* Inner Target Crosshairs */}
                    <line x1={rx - cellW/3.8} y1={ry} x2={rx + cellW/3.8} y2={ry} stroke={rColor} strokeWidth="0.4" opacity="0.4" />
                    <line x1={rx} y1={ry - cellW/3.8} x2={rx} y2={ry + cellW/3.8} stroke={rColor} strokeWidth="0.4" opacity="0.4" />

                    {/* Active Ripple rings */}
                    {isActivated && (
                      <circle
                        cx={rx}
                        cy={ry}
                        r={cellW / 3.4}
                        fill="none"
                        stroke={rColor}
                        strokeWidth="1.2"
                        opacity="0.85"
                      >
                        <animate attributeName="r" values={`${cellW / 3.4};${cellW / 1.1}`} dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.85;0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Core target emitter element */}
                    <circle
                      cx={rx}
                      cy={ry}
                      r={cellW / 7}
                      fill={isActivated ? rColor : "transparent"}
                      stroke={rColor}
                      strokeWidth="1"
                      className={isActivated ? "receiver-glow" : ""}
                    />

                    {/* Center Code letter indicator */}
                    <text 
                      x={rx} 
                      y={ry + cellW / 11} 
                      fill={isActivated ? "#03060f" : rColor} 
                      fontSize={cellW / 4.2} 
                      fontFamily="var(--font-mono)"
                      textAnchor="middle" 
                      fontWeight="900"
                      style={{ pointerEvents: "none" }}
                    >
                      {receiver.color.charAt(0).toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* Draw Emitters (Hi-tech power lasers) */}
              {level.emitters.map((emitter, idx) => {
                const cellW = 84 / level.gridSize;
                const cellH = 84 / level.gridSize;
                const ex = 8 + emitter.x * cellW + cellW / 2;
                const ey = 8 + emitter.y * cellH + cellH / 2;
                const isActive = emitter.activeIn === "both" || emitter.activeIn === solsticeMode;
                const eColor = emitter.color === "red" ? "var(--laser-red)" : emitter.color === "green" ? "var(--laser-green)" : emitter.color === "yellow" ? "var(--laser-yellow)" : emitter.color === "blue" ? "var(--laser-blue)" : "var(--laser-white)";
                
                // Rotation angle based on emitter facing direction (N, E, S, W)
                const angle = { "N": 270, "E": 0, "S": 90, "W": 180 }[emitter.direction] || 0;

                return (
                  <g key={`emitter-${idx}`} opacity={isActive ? 1 : 0.15}>
                    {/* Orbiting core indicator ring */}
                    <circle
                      cx={ex}
                      cy={ey}
                      r={cellW / 2.3}
                      fill="none"
                      stroke={eColor}
                      strokeWidth="0.4"
                      strokeDasharray="1, 3"
                      opacity="0.4"
                    />

                    {/* Base mounting deck */}
                    <rect
                      x={8 + emitter.x * cellW + cellW / 4}
                      y={8 + emitter.y * cellH + cellH / 4}
                      width={cellW / 2}
                      height={cellH / 2}
                      rx="4"
                      fill="url(#emitter-housing-grad)"
                      stroke="rgba(0, 240, 255, 0.2)"
                      strokeWidth="0.8"
                    />

                    {/* Nozzle lens - Rotates towards firing direction */}
                    <g transform={`rotate(${angle}, ${ex}, ${ey})`}>
                      {/* Nozzle barrel */}
                      <path
                        d={`M ${ex + cellW/6} ${ey - cellW/10} L ${ex + cellW/2.5} ${ey - cellW/15} L ${ex + cellW/2.5} ${ey + cellW/15} L ${ex + cellW/6} ${ey + cellW/10} Z`}
                        fill="#0b1126"
                        stroke={eColor}
                        strokeWidth="0.8"
                      />
                      {/* Barrel heat fins */}
                      <line x1={ex + cellW/4} y1={ey - cellW/8} x2={ex + cellW/4} y2={ey + cellW/8} stroke={eColor} strokeWidth="0.8" opacity="0.6" />
                      <line x1={ex + cellW/3} y1={ey - cellW/8} x2={ex + cellW/3} y2={ey + cellW/8} stroke={eColor} strokeWidth="0.8" opacity="0.6" />
                    </g>

                    {/* Inner glowing reactor core */}
                    <circle
                      cx={ex}
                      cy={ey}
                      r={cellW / 6.5}
                      fill={eColor}
                      style={{ filter: isActive ? `drop-shadow(0 0 6px ${eColor})` : "none" }}
                    >
                      <animate attributeName="r" values={`${cellW / 7.5};${cellW / 6.2};${cellW / 7.5}`} dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })}

              {/* Draw Placed Component Elements */}
              {Object.entries(placedComponents).map(([key, comp]) => {
                const [cx, cy] = key.split(",").map(Number);
                const cellW = 84 / level.gridSize;
                const cellH = 84 / level.gridSize;
                const x = 8 + cx * cellW;
                const y = 8 + cy * cellH;
                const center = cellW / 2;
                const padding = cellW * 0.06;

                return (
                  <g 
                    key={key} 
                    transform={`rotate(${comp.rotation}, ${x + center}, ${y + center})`}
                    onClick={() => handleCellClick(cx, cy)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Modular housing base */}
                    <rect
                      x={x + padding}
                      y={y + padding}
                      width={cellW - padding * 2}
                      height={cellH - padding * 2}
                      rx="6"
                      fill="url(#emitter-housing-grad)"
                      stroke="rgba(0, 240, 255, 0.25)"
                      strokeWidth="0.8"
                    />

                    {/* Component Icon drawing */}
                    {comp.type === "mirror" && (
                      <g>
                        {/* Rotary calibration gear at center */}
                        <circle cx={x + center} cy={y + center} r={cellW / 4.8} fill="none" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="0.8" strokeDasharray="2, 2" />
                        <circle cx={x + center} cy={y + center} r={cellW / 8} fill="#0d1222" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="0.8" />
                        
                        {/* Mirror bracket anchors */}
                        <line x1={x + 3.5} y1={y + cellH - 3.5} x2={x + 7} y2={y + cellH - 7} stroke="#94a3b8" strokeWidth="1.2" />
                        <line x1={x + cellW - 7} y1={y + 7} x2={x + cellW - 3.5} y2={y + 3.5} stroke="#94a3b8" strokeWidth="1.2" />

                        {/* Reflective glass pane diagonal '/' */}
                        <line
                          x1={x + 4.5}
                          y1={y + cellH - 4.5}
                          x2={x + cellW - 4.5}
                          y2={y + 4.5}
                          stroke="#ffffff"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                        />
                        {/* Reflective core glow line */}
                        <line
                          x1={x + 4.5}
                          y1={y + cellH - 4.5}
                          x2={x + cellW - 4.5}
                          y2={y + 4.5}
                          stroke={varColorSolstice()}
                          strokeWidth="1"
                          style={{ filter: `drop-shadow(0 0 3px ${varColorSolstice()})` }}
                        />
                      </g>
                    )}

                    {comp.type === "splitter" && (
                      <g>
                        {/* Calibration ring */}
                        <circle cx={x + center} cy={y + center + 1} r={cellW / 3} fill="none" stroke="rgba(0, 136, 255, 0.15)" strokeWidth="0.6" strokeDasharray="1, 2" />
                        
                        {/* Glass Prism triangle */}
                        <polygon
                          points={`${x + center},${y + cellH * 0.2} ${x + cellW * 0.2},${y + cellH * 0.8} ${x + cellW * 0.8},${y + cellH * 0.8}`}
                          fill="rgba(0, 136, 255, 0.2)"
                          stroke="#0088ff"
                          strokeWidth="1.2"
                          style={{ filter: "drop-shadow(0 1px 3px rgba(0,136,255,0.3))" }}
                        />
                        {/* Prismatic internal refraction lines */}
                        <line x1={x + center} y1={y + cellH * 0.25} x2={x + center} y2={y + cellH * 0.78} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="0.6" />
                        <line x1={x + center} y1={y + cellH * 0.45} x2={x + cellW * 0.35} y2={y + cellH * 0.78} stroke="rgba(255, 51, 51, 0.5)" strokeWidth="0.6" />
                        <line x1={x + center} y1={y + cellH * 0.45} x2={x + cellW * 0.65} y2={y + cellH * 0.78} stroke="rgba(0, 255, 136, 0.5)" strokeWidth="0.6" />
                        
                        {/* Specular highlight node */}
                        <circle cx={x + center} cy={y + cellH * 0.25} r="1" fill="#ffffff" style={{ filter: "drop-shadow(0 0 2px #ffffff)" }} />
                      </g>
                    )}

                    {comp.type === "filter_red" && (
                      <g>
                        {/* Filter frame details */}
                        <line x1={x + 3.5} y1={y + cellH/2} x2={x + cellW - 3.5} y2={y + cellH/2} stroke="rgba(255, 51, 51, 0.2)" strokeWidth="0.8" />
                        {/* Plasma glowing energy slit */}
                        <rect
                          x={x + center - 2.5}
                          y={y + cellH * 0.15}
                          width="5"
                          height={cellH * 0.7}
                          fill="rgba(255, 51, 51, 0.3)"
                          stroke="var(--laser-red)"
                          strokeWidth="1.2"
                          rx="1.5"
                          style={{ filter: "drop-shadow(0 0 3px var(--laser-red))" }}
                        />
                        <line x1={x + center} y1={y + cellH * 0.2} x2={x + center} y2={y + cellH * 0.8} stroke="#ffffff" strokeWidth="0.6" opacity="0.8" />
                      </g>
                    )}

                    {comp.type === "filter_green" && (
                      <g>
                        <line x1={x + 3.5} y1={y + cellH/2} x2={x + cellW - 3.5} y2={y + cellH/2} stroke="rgba(0, 255, 136, 0.2)" strokeWidth="0.8" />
                        <rect
                          x={x + center - 2.5}
                          y={y + cellH * 0.15}
                          width="5"
                          height={cellH * 0.7}
                          fill="rgba(0, 255, 136, 0.3)"
                          stroke="var(--laser-green)"
                          strokeWidth="1.2"
                          rx="1.5"
                          style={{ filter: "drop-shadow(0 0 3px var(--laser-green))" }}
                        />
                        <line x1={x + center} y1={y + cellH * 0.2} x2={x + center} y2={y + cellH * 0.8} stroke="#ffffff" strokeWidth="0.6" opacity="0.8" />
                      </g>
                    )}

                    {comp.type === "filter_blue" && (
                      <g>
                        <line x1={x + 3.5} y1={y + cellH/2} x2={x + cellW - 3.5} y2={y + cellH/2} stroke="rgba(0, 136, 255, 0.2)" strokeWidth="0.8" />
                        <rect
                          x={x + center - 2.5}
                          y={y + cellH * 0.15}
                          width="5"
                          height={cellH * 0.7}
                          fill="rgba(0, 136, 255, 0.3)"
                          stroke="var(--laser-blue)"
                          strokeWidth="1.2"
                          rx="1.5"
                          style={{ filter: "drop-shadow(0 0 3px var(--laser-blue))" }}
                        />
                        <line x1={x + center} y1={y + cellH * 0.2} x2={x + center} y2={y + cellH * 0.8} stroke="#ffffff" strokeWidth="0.6" opacity="0.8" />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Draw Calculated Laser Beams */}
              {paths.map((path, idx) => {
                const cellW = 84 / level.gridSize;
                const cellH = 84 / level.gridSize;
                const x1 = 8 + path.x1 * cellW + cellW / 2;
                const y1 = 8 + path.y1 * cellH + cellH / 2;
                const x2 = 8 + path.x2 * cellW + cellW / 2;
                const y2 = 8 + path.y2 * cellH + cellH / 2;
                
                const beamColor = path.color === "red" ? "var(--laser-red)" : path.color === "green" ? "var(--laser-green)" : path.color === "yellow" ? "var(--laser-yellow)" : path.color === "blue" ? "var(--laser-blue)" : "var(--laser-white)";
                const isJunctionWithinBoard = path.x2 >= 0 && path.x2 < level.gridSize && path.y2 >= 0 && path.y2 < level.gridSize;

                return (
                  <g key={`laser-${idx}`} style={{ pointerEvents: "none" }}>
                    {/* Laser glow */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={beamColor}
                      strokeWidth="3.2"
                      className="laser-beam"
                      style={{ filter: `drop-shadow(0 0 4px ${beamColor})` }}
                    />
                    {/* Laser pulsing flow effect */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={beamColor}
                      strokeWidth="2.5"
                      className="laser-beam-pulse"
                      opacity="0.8"
                    />
                    {/* Laser bright core */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className="laser-beam-core"
                    />
                    
                    {/* Glowing spark and ripple ring at optical junctions */}
                    {isJunctionWithinBoard && (
                      <g>
                        {/* Ripple ring */}
                        <circle cx={x2} cy={y2} r={cellW / 12} fill="none" stroke={beamColor} strokeWidth="0.8" opacity="0.8">
                          <animate attributeName="r" values={`${cellW / 12};${cellW / 3.5}`} dur="1.4s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0" dur="1.4s" repeatCount="indefinite" />
                        </circle>
                        {/* Core spark */}
                        <circle cx={x2} cy={y2} r={cellW / 16} fill="#ffffff" style={{ filter: `drop-shadow(0 0 4px ${beamColor})` }} />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Integrated Control Panel Toolbox bezel */}
          <div className="toolbox-bezel">
            <div className="toolbox-header">GRID REFRACTOR CONTROLS</div>
            <div className="toolbox">
              {Object.keys(level.toolbox).map(tool => {
                const limit = level.toolbox[tool];
                if (limit === 0) return null;
                
                const activeCount = Object.values(placedComponents).filter(c => c.type === tool).length;
                const countLeft = limit - activeCount;
                const isActive = selectedTool === tool;

                return (
                  <div 
                    key={tool} 
                    className={`tool-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      audio.playClick();
                      setSelectedTool(isActive ? null : tool);
                    }}
                  >
                    <svg className="tool-icon" viewBox="0 0 24 24">
                      {renderToolIcon(tool)}
                    </svg>
                    <span className="tool-label">{tool.replace("filter_", "")}</span>
                    <span className="tool-badge" style={{ background: countLeft === 0 ? "var(--text-muted)" : "var(--solstice-color)" }}>
                      {countLeft}
                    </span>
                  </div>
                );
              })}

              {/* Eraser tool */}
              <div 
                className={`tool-item ${selectedTool === "eraser" ? "active" : ""}`}
                onClick={() => {
                  audio.playClick();
                  setSelectedTool(selectedTool === "eraser" ? null : "eraser");
                }}
              >
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 13L20 20Z" />
                  <path d="M17 17H20" />
                </svg>
                <span className="tool-label">Eraser</span>
              </div>

              {/* Reset button */}
              <div className="tool-item" onClick={clearBoard} title="Reset Board">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span className="tool-label">Clear</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: CRT Terminal */}
        <section className="glass-panel terminal-panel">
          <div className="terminal-header">
            <div className="terminal-title-section">
              <span className="terminal-status-dot"></span>
              <span className="terminal-title">{level.npc.name} Terminal</span>
            </div>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--crt-color)" }}>
              {isPuzzleSolved ? "DECRYPTED" : "ENCRYPTED"}
            </span>
          </div>

          <div className="crt-screen">
            <MatrixRain />
            {isApiLocked ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", fontFamily: "var(--font-mono)", color: "var(--crt-color)", position: "relative", zIndex: 10 }}>
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--crt-color)" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 4px var(--crt-glow))", marginBottom: "8px" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <h3 style={{ fontFamily: "var(--font-mono)", color: "var(--crt-color)", textShadow: "0 0 4px var(--crt-glow)" }}>AI CORE ENCRYPTED</h3>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>A Gemini API key is locked in localStorage.</p>
                </div>
                
                <form onSubmit={handleUnlockApiKey} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="password"
                    className="form-input"
                    style={{ 
                      background: "rgba(0, 0, 0, 0.4)", 
                      border: "1px solid var(--crt-color)", 
                      color: "var(--crt-color)",
                      fontFamily: "var(--font-mono)",
                      textShadow: "0 0 4px var(--crt-glow)",
                      boxShadow: "0 0 5px rgba(57, 255, 20, 0.1)"
                    }}
                    placeholder="Enter decryption passphrase..."
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                  />
                  {decryptionError && (
                    <div style={{ color: "#f87171", fontSize: "11px", textAlign: "center" }}>
                      {decryptionError}
                    </div>
                  )}
                  <button type="submit" className="verdict-btn" style={{ borderColor: "var(--crt-color)", color: "var(--crt-color)", textShadow: "0 0 4px var(--crt-glow)" }}>
                    UNLOCK AI CORE
                  </button>
                  <button type="button" className="verdict-btn" onClick={handlePlayOffline} style={{ borderColor: "var(--text-muted)", color: "var(--text-muted)" }}>
                    PLAY OFFLINE (SIMULATOR)
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="crt-scroll-content">
                  {terminalHistory.map((msg, index) => (
                    <div key={index} className={`crt-message ${msg.sender}`}>
                      {msg.sender === "player" ? "> " : msg.sender === "ai" ? "ENTITY: " : ""}
                      {msg.text}
                    </div>
                  ))}
                  {isNpcTyping && (
                    <div className="typing-indicator">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  )}
                  <div ref={terminalBottomRef} />
                </div>

                {/* Verdict overlay box showing once solved */}
                {isPuzzleSolved && (
                  <div className="verdict-overlay-box">
                    <div className="verdict-overlay-title">Turing Test Verification Required</div>
                    
                    {!verdictDeclared ? (
                      <div className="verdict-button-row">
                        <button className="verdict-btn human" onClick={() => handleDeclareVerdict("human")}>
                          HUMAN MIND
                        </button>
                        <button className="verdict-btn ai" onClick={() => handleDeclareVerdict("ai")}>
                          AI EMULATION
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", fontSize: "13px" }}>
                        {verdictSuccess ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                            <div style={{ color: "#34d399", fontWeight: "bold", fontSize: "12px", textAlign: "center" }}>
                              ✓ VERDICT APPROVED: Mind pattern verified successfully. Observatory Node DECRYPTED.
                            </div>
                            {activeLevelIdx < levels.length - 1 ? (
                              <button 
                                className="verdict-btn"
                                style={{ 
                                  borderColor: "var(--solstice-color)", 
                                  color: "var(--solstice-color)", 
                                  textShadow: "0 0 4px var(--solstice-glow)",
                                  marginTop: "4px",
                                  padding: "4px 10px",
                                  fontSize: "10px"
                                }}
                                onClick={() => {
                                  audio.playSuccess();
                                  setActiveLevelIdx(activeLevelIdx + 1);
                                }}
                              >
                                PROCEED TO NEXT OBS-NODE
                              </button>
                            ) : (
                              <button 
                                className="verdict-btn"
                                style={{ 
                                  borderColor: "var(--solstice-color)", 
                                  color: "#03060f", 
                                  background: "var(--solstice-color)",
                                  textShadow: "none",
                                  boxShadow: "0 0 10px var(--solstice-glow)",
                                  marginTop: "4px",
                                  padding: "4px 10px",
                                  fontSize: "10px",
                                  animation: "active-panel-pulse 2s infinite ease-in-out"
                                }}
                                onClick={() => {
                                  audio.playSuccess();
                                  setShowSubmissionModal(true);
                                }}
                              >
                                GENERATE GAME JAM SUBMISSION
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ color: "#f87171", fontWeight: "bold" }}>
                            ✗ VERDICT DENIED: Contradiction in response structure detected. Reset test to try again.
                            <button 
                              style={{ 
                                background: "transparent", 
                                border: "none", 
                                color: "var(--solstice-color)", 
                                textDecoration: "underline", 
                                marginLeft: "8px", 
                                cursor: "pointer" 
                              }}
                              onClick={() => { audio.playRotate(); setVerdictDeclared(false); }}
                            >
                              Retry Test
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleTerminalSubmit} className="crt-input-line">
                  <span className="crt-prompt">&gt;</span>
                  <input
                    type="text"
                    className="crt-input"
                    placeholder={isPuzzleSolved ? (offlineMode ? "Query decoded entity (Offline Mode)..." : "Query decoded entity (AI Mode)...") : "Solve optical puzzle to decrypt..."}
                    disabled={!isPuzzleSolved || isNpcTyping}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                  />
                </form>
              </>
            )}
          </div>
        </section>
      </main>

      {/* 3. Floating Overlay Modals */}

      {/* Lore Modal */}
      {showLoreModal && (
        <div className="modal-overlay" onClick={() => setShowLoreModal(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lore Archive Database</h2>
              <button className="modal-close-btn" onClick={() => setShowLoreModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="lore-grid">
              <div className="lore-sidebar">
                {Object.keys(loreArticles).map(key => {
                  const item = loreArticles[key];
                  const isUnlocked = unlockedLore.includes(key);
                  return (
                    <div 
                      key={key} 
                      className={`lore-tab ${activeLoreTab === key ? "active" : ""} ${!isUnlocked ? "locked" : ""}`}
                      onClick={() => {
                        if (isUnlocked) {
                          audio.playClick();
                          setActiveLoreTab(key);
                        } else {
                          audio.playError();
                        }
                      }}
                    >
                      {isUnlocked ? "• " + item.title.split(":")[0] : "🔒 Encrypted"}
                    </div>
                  );
                })}
              </div>
              
              <div className="lore-body">
                {unlockedLore.includes(activeLoreTab) ? (
                  <div>
                    <h3 className="lore-title">{loreArticles[activeLoreTab].title}</h3>
                    <div className="lore-meta">Observed: {loreArticles[activeLoreTab].date}</div>
                    <p className="lore-content">{loreArticles[activeLoreTab].text}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", color: "var(--text-muted)" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <p style={{ marginTop: "12px", fontSize: "14px" }}>Solve game nodes to unlock historical archive records.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "450px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Observatory Settings</h2>
              <button className="modal-close-btn" onClick={() => setShowSettingsModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveApiKey}>
              <div className="form-group">
                <label className="form-label">Google Gemini API Key</label>
                <div className="input-password-wrapper">
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your AI Studio API key..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Local Encryption Passphrase</label>
                <div className="input-password-wrapper">
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Create a passphrase to encrypt your key locally..."
                    value={settingsPassphrase}
                    onChange={(e) => setSettingsPassphrase(e.target.value)}
                  />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  Your API Key will be encrypted client-side using this passphrase and stored locally in your browser's localStorage. You will enter this passphrase to decrypt it later.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button type="button" className="btn-primary" onClick={() => {
                  audio.playRotate();
                  localStorage.removeItem("solstice_encrypted_api_key");
                  setEncryptedApiKey("");
                  setGeminiApiKey("");
                  setIsApiLocked(false);
                  setOfflineMode(true);
                  setSettingsPassphrase("");
                  setShowSettingsModal(false);
                }}>
                  Clear Key
                </button>
                <button type="submit" className="btn-solstice">
                  Save & Encrypt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievementsModal && (
        <div className="modal-overlay" onClick={() => setShowAchievementsModal(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "550px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Unlocked Achievements</h2>
              <button className="modal-close-btn" onClick={() => setShowAchievementsModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="achievements-grid">
              {achievementsList.map(ach => {
                const isUnlocked = unlockedAchievements.includes(ach.id);
                return (
                  <div key={ach.id} className={`achievement-badge-card ${isUnlocked ? "unlocked" : ""}`}>
                    <svg className="achievement-badge-icon" viewBox="0 0 24 24">
                      {isUnlocked ? (
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      ) : (
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      )}
                    </svg>
                    <div className="achievement-badge-title">{ach.title}</div>
                    <div className="achievement-badge-desc">{ach.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Game Jam Submission Modal */}
      {showSubmissionModal && (
        <GameJamSubmissionModal onClose={() => setShowSubmissionModal(false)} />
      )}

      {/* 4. Float Toast Notification System */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast-achievement">
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="var(--solstice-color)" 
              strokeWidth="2"
              style={{ filter: "drop-shadow(0 0 4px var(--solstice-glow))" }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div className="toast-details">
              <span className="toast-label">Achievement Unlocked</span>
              <span className="toast-name">{toast.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Helpers for Rendering ---
  function varColorSolstice() {
    return solsticeMode === "day" ? "var(--solstice-color)" : "#00f0ff";
  }

  function renderToolIcon(tool) {
    if (tool === "mirror") {
      return <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />;
    }
    if (tool === "splitter") {
      return <polygon points="12,4 4,20 20,20" stroke="currentColor" strokeWidth="2" fill="none" />;
    }
    if (tool === "filter_red") {
      return <rect x="9" y="4" width="6" height="16" fill="rgba(239, 68, 68, 0.4)" stroke="var(--laser-red)" strokeWidth="1.5" rx="1" />;
    }
    if (tool === "filter_green") {
      return <rect x="9" y="4" width="6" height="16" fill="rgba(16, 185, 129, 0.4)" stroke="var(--laser-green)" strokeWidth="1.5" rx="1" />;
    }
    if (tool === "filter_blue") {
      return <rect x="9" y="4" width="6" height="16" fill="rgba(59, 130, 246, 0.4)" stroke="var(--laser-blue)" strokeWidth="1.5" rx="1" />;
    }
    return null;
  }
}

// Game Jam Submission Draft Modal Component
const GameJamSubmissionModal = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const submissionMarkdown = `*This is a submission for the [June Solstice Game Jam](https://dev.to/challenges/june-game-jam-2026-06-03)*

## What I Built
**Solstice Cipher: The Turing Test of Light and Shadow** is a premium, retro-futuristic browser-based puzzle and narrative game. 

The game combines two core ideas:
1. **Light & Shadow Routing Puzzles (The Solstice Theme)**: Players align optical mirrors, prism splitters, and color filters on a coordinates grid. A central "Solstice Toggle" shifts the cycle from Day to Night, dynamically updating the active light sources and receptors, requiring the routing algorithm to adapt.
2. **Conversational Turing Tests (The Alan Turing Theme)**: Calibrating the light beams decrypts a "digital consciousness." Using a vintage CRT computer terminal, players query the decoded mind to run a Turing Test, determining whether they are talking to a simulated AI or a reconstructed human consciousness.

Our goal was to design a beautiful, high-fidelity gaming experience that celebrates Bletchley Park decryption, LGBTQIA+ Pride milestones, and Juneteenth, while showcasing local security safety and dynamic generative conversations.

## Video Demo
*Please enjoy this video walkthrough demonstrating the optical calibration mechanics, the canvas-based diagnostic readouts, the live Gemini CRT terminal conversations, and cycle transitions:*

<!-- Upload a video to YouTube, Loom, or DEV.to and embed it here! -->

## Code
The repository is open-source and hosted entirely on GitHub:

{% github https://github.com/YOUR_USERNAME/YOUR_REPO_NAME %}

### Cloudflare Pages Deploy Instructions
We integrated **Cloudflare Wrangler** to make building and publishing this game jam submission a single-command process. 

#### Configuration (\`wrangler.toml\`)
\`\`\`toml
name = "solstice-cipher"
pages_build_output_dir = "dist"
compatibility_date = "2026-06-08"
\`\`\`

#### CLI Deployment Commands
1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Build and deploy directly to Cloudflare Pages:
   \`\`\`bash
   npm run deploy
   \`\`\`

## How I Built It
The project is built entirely as a single-page application using **React, Vite, and Vanilla CSS** with no external CDN assets.

### 1. Interactive HUD & Glassmorphism Design
Instead of rendering on a flat 2D canvas, we designed a cybernetic HUD:
- **Frosted Glass Panels**: Semi-transparent HSL colors coupled with heavy backdrop blurring (\`blur(25px)\`). Active panels feature animated borders that pulse with keyframe glows.
- **Drifting Gas Nebulae**: An animating canvas drawing twinkling stars, cosmic dust particles, shooting stars, and rotating nebulae (warm solar wind in Day cycle, violet/cyan clouds in Night cycle).
- **Holographic SVG Nodes**: Custom vector drawings for blocks (hazard caution stripes), splitters (refracting prisms), mirrors (calibration gears), emitters (nozzles that rotate towards direction), and receivers (featuring concentric calibration rings that rotate in opposite directions).
- **Oscilloscope Waveform Widget**: A canvas-based telemetry display in the sidebar drawing procedural sinus waves that speed up and fluctuate based on active lasers.
- **CRT Matrix Rain**: The vintage CRT screen uses phosphor scanline gradients, vignette overlays, and a low-opacity falling binary Matrix stream in the background behind message cards.

### 2. Raycaster Engine
A recursive **Depth-First Search (DFS)** raycast engine calculates light propagation:
- Translates mirror angles (45°/135°) to redirect paths.
- Computes split rays at prisms.
- Validates wave colors through Red, Green, and Blue filter chambers.
- **Infinite Loop Prevention**: Tracks coordinates and incoming vector directions to stop infinite reflections.
- Spawns spark nodes and expanding waves at all reflection and absorption junctions.

### 3. Procedural Audio Synthesis
All clicks, snaps, alarms, success arpeggios, and baseline laser hums are generated procedurally using the **Web Audio API** oscillators (zero audio asset downloads required).

### 4. Client-Side secure Key Storage
To protect user keys:
- Implements locally salted encryption using stretch hashing and XOR ciphers.
- Detects Gemini API keys in local storage and prompts for the user passphrase to decrypt them strictly in-memory.
- Falls back to a robust keyword-matching local simulator dialogue if offline or key is cleared.

## Prize Category

### Best Ode to Alan Turing
- **Imitation Game Mechanics**: The core progression centers on Turing's benchmark. Players chat, examine logical contradictions, and submit verdicts.
- **Bletchley Park Cryptography**: Level 1 (Turing Machine) and Level 5 (Turing's Dream) pay direct tribute to Turing's computing limits, Turing Test philosophy, and LGBTQIA+ Pride.

### Best Google AI Usage
- **Google Gemini API**: Full integration with \`gemini-1.5-flash\` for open-ended philosophical AI dialogue.
- **Persona Context Mapping**: System instructions mold dynamic replies based on NPC backstories (academic Turing-AI, multiple choral voices in Freedom Collective, mythical clockkeeper Warden, and flowers-in-hair activist Marsha-AI).`;

  const handleCopy = () => {
    navigator.clipboard.writeText(submissionMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" style={{ maxWidth: "650px", width: "90%", maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2>Game Jam Submission Draft</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div style={{ flexGrow: 1, overflowY: "auto", paddingRight: "4px", marginBottom: "16px", fontSize: "14px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p>
            Congratulations! You have decrypted all 5 observatory nodes. Below is your formatted markdown submission for the **June Solstice Game Jam**.
          </p>
          <div style={{ position: "relative", flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "200px" }}>
            <textarea
              readOnly
              value={submissionMarkdown}
              style={{
                width: "100%",
                flexGrow: 1,
                minHeight: "220px",
                background: "rgba(2, 4, 10, 0.8)",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                borderRadius: "6px",
                padding: "12px",
                color: "#ffffff",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                resize: "none",
                outline: "none"
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTop: "1px solid rgba(0, 240, 255, 0.15)", paddingTop: "12px" }}>
          <a 
            href="https://dev.to/challenges/june-game-jam-2026-06-03" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px" }}
          >
            <span>DEV.TO JAM PAGE</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <button 
            className="btn-solstice" 
            onClick={handleCopy}
            style={{ fontSize: "11px", padding: "8px 20px" }}
          >
            {copied ? "COPIED TO CLIPBOARD!" : "COPY SUBMISSION DRAFT"}
          </button>
        </div>
      </div>
    </div>
  );
};
