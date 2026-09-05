// Web Audio API Synthesizer (No external audio files required)
class SoundService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playEmergencyChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Two-tone urgent chime (880Hz -> 659.25Hz / A5 -> E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(659.25, now + 0.18);

      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);
    } catch (err) {
      console.warn("Audio chime could not be played:", err);
    }
  }
}

export const soundService = new SoundService();