type Ambience = 'farm' | 'town' | null

class GameAudio {
  private context: AudioContext | null = null
  private ambience: Ambience = null
  private ambienceTimer: number | null = null
  private windSource: AudioBufferSourceNode | null = null
  private windGain: GainNode | null = null
  private musicNodes: Array<OscillatorNode | GainNode | AudioBufferSourceNode | BiquadFilterNode> = []
  private masterGain: GainNode | null = null

  unlock() {
    if (typeof window === 'undefined') return
    if (!this.context) this.context = new AudioContext()
    if (this.context.state === 'suspended') void this.context.resume()
  }

  setAmbience(next: Ambience) {
    this.unlock()
    if (!this.context || this.ambience === next) return
    this.stopAmbience()
    this.ambience = next
    if (next === 'farm') this.startFarmAmbience()
    if (next === 'town') this.startTownAmbience()
  }

  playMove() {
    this.tone(150, 0.035, 0.022, 'sine')
  }

  playBuild() {
    this.tone(220, 0.08, 0.055, 'square')
    window.setTimeout(() => this.tone(330, 0.1, 0.045, 'triangle'), 55)
  }

  playTravel() {
    this.tone(392, 0.16, 0.045, 'sine')
    window.setTimeout(() => this.tone(523, 0.2, 0.04, 'sine'), 90)
    window.setTimeout(() => this.tone(784, 0.28, 0.028, 'triangle'), 190)
    window.setTimeout(() => this.tone(196, 0.42, 0.018, 'sine'), 40)
  }

  private startFarmAmbience() {
    this.unlock()
    if (!this.context) return
    
    // Master volume control - nice and low, cozy
    const master = this.context.createGain()
    master.gain.value = 0.28
    master.connect(this.context.destination)
    this.masterGain = master
    this.musicNodes.push(master)

    // Warm wind layer — filtered noise
    this.startWind(0.022)

    // Melodic farm theme: G major pentatonic, gentle loop
    // Root, 2nd, 3rd, 5th, 6th — pastoral and bright
    const FARM_SCALE = [196, 220, 247, 294, 330] // G3, A3, B3, D4, E4
    
    // Warm pad layer (drone on root + fifth)
    this.addPadNote(196, 'sine', 0.035)    // G3
    this.addPadNote(294, 'sine', 0.025)    // D4 (fifth)
    this.addPadNote(392, 'triangle', 0.018) // G4 (octave, very soft)

    // Gentle melody arpeggio — scheduled repeating
    this.scheduleFarmMelody(FARM_SCALE, master)

    // Bird chirps / ambient tones
    this.scheduleAmbientTone('farm')
  }

  private startTownAmbience() {
    this.unlock()
    if (!this.context) return

    const master = this.context.createGain()
    master.gain.value = 0.25
    master.connect(this.context.destination)
    this.masterGain = master
    this.musicNodes.push(master)

    this.startWind(0.010)

    // Town theme: C major — brighter, more upbeat
    // C, D, E, G, A — livelier market feel
    this.addPadNote(220, 'sine', 0.028)    // A3
    this.addPadNote(330, 'sine', 0.022)    // E4
    this.addPadNote(440, 'triangle', 0.015) // A4

    const TOWN_SCALE = [261, 294, 330, 392, 440] // C4, D4, E4, G4, A4
    this.scheduleTownMelody(TOWN_SCALE, master)
    this.scheduleAmbientTone('town')
  }

  private addPadNote(frequency: number, type: OscillatorType, volume: number) {
    if (!this.context || !this.masterGain) return
    const osc = this.context.createOscillator()
    const gain = this.context.createGain()
    // Vibrato for warmth
    const lfo = this.context.createOscillator()
    const lfoGain = this.context.createGain()
    lfo.frequency.value = 4.5
    lfoGain.gain.value = 1.5
    lfo.connect(lfoGain).connect(osc.frequency)
    lfo.start()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.value = volume
    osc.connect(gain).connect(this.masterGain)
    osc.start()
    this.musicNodes.push(osc, gain, lfo, lfoGain)
  }

  private scheduleFarmMelody(scale: number[], _master: GainNode) {
    if (!this.context || !this.masterGain) return
    const master = this.masterGain
    
    // Farm melody pattern — gentle, repeating arpeggio
    const PATTERN = [0, 2, 1, 3, 2, 4, 3, 2, 1, 0, 2, 4, 3, 1, 2, 0]
    const NOTE_DUR = 0.42 // seconds per note
    const LOOP_TIME = PATTERN.length * NOTE_DUR
    const now = this.context.currentTime

    const playNote = (freq: number, startTime: number, dur: number) => {
      if (!this.context) return
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq * 2 // Upper octave for melody
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.038, startTime + 0.06)
      gain.gain.setValueAtTime(0.038, startTime + dur * 0.65)
      gain.gain.linearRampToValueAtTime(0, startTime + dur * 0.92)
      osc.connect(gain).connect(master)
      osc.start(startTime)
      osc.stop(startTime + dur + 0.02)
    }

    const scheduleLoop = (loopStart: number) => {
      for (let i = 0; i < PATTERN.length; i++) {
        const t = loopStart + i * NOTE_DUR
        playNote(scale[PATTERN[i]], t, NOTE_DUR)
      }
      // Schedule next loop
      const nextLoop = loopStart + LOOP_TIME
      const delay = (nextLoop - (this.context?.currentTime ?? 0)) * 1000 - 200
      if (this.ambience === 'farm') {
        const timer = window.setTimeout(() => {
          if (this.ambience === 'farm') scheduleLoop(nextLoop)
        }, Math.max(0, delay))
        this.ambienceTimer = timer
      }
    }

    scheduleLoop(now + 0.5)
  }

  private scheduleTownMelody(scale: number[], _master: GainNode) {
    if (!this.context || !this.masterGain) return
    const master = this.masterGain

    // Town melody — more upbeat bounce
    const PATTERN = [0, 2, 4, 2, 1, 3, 2, 0, 4, 3, 1, 2, 0, 4, 2, 1]
    const NOTE_DUR = 0.35
    const LOOP_TIME = PATTERN.length * NOTE_DUR
    const now = this.context.currentTime

    const playNote = (freq: number, startTime: number, dur: number) => {
      if (!this.context) return
      const osc = this.context.createOscillator()
      const gain = this.context.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq * 2
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.032, startTime + 0.04)
      gain.gain.setValueAtTime(0.032, startTime + dur * 0.5)
      gain.gain.linearRampToValueAtTime(0, startTime + dur * 0.85)
      osc.connect(gain).connect(master)
      osc.start(startTime)
      osc.stop(startTime + dur + 0.02)
    }

    const scheduleLoop = (loopStart: number) => {
      for (let i = 0; i < PATTERN.length; i++) {
        const t = loopStart + i * NOTE_DUR
        playNote(scale[PATTERN[i]], t, NOTE_DUR)
      }
      const nextLoop = loopStart + LOOP_TIME
      const delay = (nextLoop - (this.context?.currentTime ?? 0)) * 1000 - 200
      if (this.ambience === 'town') {
        const timer = window.setTimeout(() => {
          if (this.ambience === 'town') scheduleLoop(nextLoop)
        }, Math.max(0, delay))
        this.ambienceTimer = timer
      }
    }

    scheduleLoop(now + 0.4)
  }

  private startWind(volume: number) {
    if (!this.context) return
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 3, this.context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < channel.length; i++) {
      channel[i] = (Math.random() * 2 - 1) * (0.45 + Math.sin(i / 12000) * 0.25)
    }
    const source = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const highpass = this.context.createBiquadFilter()
    const gain = this.context.createGain()
    source.buffer = buffer
    source.loop = true
    filter.type = 'lowpass'
    filter.frequency.value = 500
    highpass.type = 'highpass'
    highpass.frequency.value = 80
    gain.gain.value = volume
    source.connect(highpass).connect(filter).connect(gain).connect(this.context.destination)
    source.start()
    this.windSource = source
    this.windGain = gain
    this.musicNodes.push(source, filter, highpass, gain)
  }

  private scheduleAmbientTone(kind: Exclude<Ambience, null>) {
    const delay = kind === 'farm'
      ? 4000 + Math.random() * 6000
      : 5500 + Math.random() * 8000

    this.ambienceTimer = window.setTimeout(() => {
      if (this.ambience !== kind) return
      if (kind === 'farm') {
        // Bird chirp pattern
        const baseFreq = 1100 + Math.random() * 400
        this.tone(baseFreq, 0.09, 0.022, 'sine')
        window.setTimeout(() => this.tone(baseFreq * 1.15, 0.07, 0.016, 'sine'), 120)
        window.setTimeout(() => this.tone(baseFreq * 0.9, 0.08, 0.014, 'sine'), 240)
      } else {
        // Town ambient: gentle bell
        this.tone(520 + Math.random() * 120, 0.55, 0.018, 'sine')
        window.setTimeout(() => this.tone(780 + Math.random() * 80, 0.4, 0.012, 'sine'), 200)
      }
      this.scheduleAmbientTone(kind)
    }, delay)
  }

  private stopAmbience() {
    if (this.ambienceTimer !== null) window.clearTimeout(this.ambienceTimer)
    this.ambienceTimer = null
    this.masterGain = null
    for (const node of this.musicNodes) {
      if ('stop' in node) {
        try { (node as OscillatorNode | AudioBufferSourceNode).stop() } catch {}
      }
      try { node.disconnect() } catch {}
    }
    this.musicNodes = []
    this.windSource = null
    this.windGain = null
    this.ambience = null
  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType) {
    this.unlock()
    if (!this.context || this.context.state !== 'running') return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    const now = this.context.currentTime
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain).connect(this.context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.025)
  }
}

export const gameAudio = new GameAudio()
