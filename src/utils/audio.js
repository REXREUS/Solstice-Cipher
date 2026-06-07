// Procedural Audio Engine using browser Web Audio API
// Generates sound effects dynamically without loading asset files

let audioCtx = null;
let laserHumNode = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export const audio = {
  // Resume suspended AudioContext on user interaction
  resume() {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {}); // catch to prevent warnings
      }
    } catch (e) {
      // ignore
    }
  },
  // 1. Play typing click sound (CRT terminal typing keystrokes)
  playClick() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Low frequency click combined with tiny noise
      osc.type = "sine";
      osc.frequency.setValueAtTime(400 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.warn("Audio click failed:", e);
    }
  },

  // 2. Play mechanical component rotate click
  playRotate() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch (e) {
      console.warn("Audio rotate failed:", e);
    }
  },

  // 3. Play error buzz
  playError() {
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(120, ctx.currentTime);
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(123, ctx.currentTime); // detuned

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio error failed:", e);
    }
  },

  // 4. Start laser hum looping
  startHum() {
    try {
      if (laserHumNode) return; // Already humming
      const ctx = getAudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Low LFO to modulate volume slightly
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      
      lfo.type = "sine";
      lfo.frequency.value = 8; // 8 Hz wobble
      lfoGain.gain.value = 0.015; // amount of volume variation

      osc.type = "triangle";
      osc.frequency.value = 65; // 65 Hz electrical hum
      
      filter.type = "lowpass";
      filter.frequency.value = 150; // Filter out high harmonics

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Connect LFO to gain volume parameter
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.value = 0.08; // base hum volume

      lfo.start();
      osc.start();

      laserHumNode = { osc, lfo, gain };
    } catch (e) {
      console.warn("Audio startHum failed:", e);
    }
  },

  // 5. Stop laser hum looping
  stopHum() {
    try {
      if (!laserHumNode) return;
      laserHumNode.osc.stop();
      laserHumNode.lfo.stop();
      laserHumNode = null;
    } catch (e) {
      console.warn("Audio stopHum failed:", e);
    }
  },

  // 6. Play success chord progression (decoded level arpeggio)
  playSuccess() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Pentatonic major chord: C4, E4, G4, A4, C5
      const notes = [261.63, 329.63, 392.00, 440.00, 523.25];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;
        
        filter.type = "lowpass";
        filter.frequency.value = 800;

        const noteStart = now + idx * 0.12;
        
        // Envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.2);

        osc.start(noteStart);
        osc.stop(noteStart + 1.3);
      });
    } catch (e) {
      console.warn("Audio success failed:", e);
    }
  },

  // 7. Play achievement unlock sparkly chime
  playAchievement() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Quick rising pitch chimes
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const noteStart = now + idx * 0.08;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, noteStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

        osc.start(noteStart);
        osc.stop(noteStart + 0.7);
      });
    } catch (e) {
      console.warn("Audio achievement failed:", e);
    }
  }
};
export default audio;
