/**
 * Nexik Notification Sound Service
 * Plays notification sounds for new messages
 */

class NotificationSoundService {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private volume: number = 0.5
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('nexik_sound_enabled') !== 'false'
      const savedVolume = localStorage.getItem('nexik_sound_volume')
      if (savedVolume) this.volume = parseFloat(savedVolume)
    }
  }
  
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch {
        return null
      }
    }
    return this.audioContext
  }
  
  /**
   * Play a gentle notification sound
   */
  playNotification() {
    if (!this.enabled) return
    
    const ctx = this.getAudioContext()
    if (!ctx) return
    
    try {
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      const now = ctx.currentTime
      
      // Create oscillator for a pleasant "ding" sound
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      // Two frequencies for a richer sound
      osc1.frequency.setValueAtTime(880, now) // A5
      osc2.frequency.setValueAtTime(1320, now) // E6
      
      osc1.type = 'sine'
      osc2.type = 'sine'
      
      // Envelope
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      
      // Connect
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Play
      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.5)
      osc2.stop(now + 0.5)
    } catch {
      // Silent fail
    }
  }
  
  /**
   * Play a more urgent notification for operator requests
   */
  playUrgent() {
    if (!this.enabled) return
    
    const ctx = this.getAudioContext()
    if (!ctx) return
    
    try {
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      const now = ctx.currentTime
      
      // Double beep
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        osc.frequency.setValueAtTime(1000, now + i * 0.15)
        osc.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, now + i * 0.15)
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, now + i * 0.15 + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.1)
        
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.1)
      }
    } catch {
      // Silent fail
    }
  }
  
  /**
   * Enable/disable sound
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexik_sound_enabled', String(enabled))
    }
  }
  
  isEnabled(): boolean {
    return this.enabled
  }
  
  /**
   * Set volume (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexik_sound_volume', String(this.volume))
    }
  }
  
  getVolume(): number {
    return this.volume
  }
}

// Singleton instance
export const notificationSound = new NotificationSoundService()
