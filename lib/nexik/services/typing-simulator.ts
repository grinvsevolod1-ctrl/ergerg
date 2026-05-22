/**
 * Human-like Typing Simulator
 * Makes AI responses appear as if typed by a human
 */

// ============================================================
// TYPES
// ============================================================

export interface TypingConfig {
  // Base typing speed (chars per second)
  baseSpeed: number // 30-80 typical human
  
  // Speed variation (randomness)
  speedVariation: number // 0-1, how much speed varies
  
  // Pause settings
  pauseAfterPunctuation: number // ms after . ! ?
  pauseAfterComma: number // ms after ,
  pauseBetweenWords: number // ms between words
  pauseForThinking: number // ms for "thinking" pauses
  
  // Typing patterns
  burstTyping: boolean // Type in bursts with pauses
  burstLength: { min: number; max: number } // chars per burst
  burstPause: { min: number; max: number } // ms between bursts
  
  // Human quirks
  occasionalPause: boolean // Random thinking pauses
  pauseProbability: number // 0-1
  
  // Typo simulation (real-time correction)
  simulateTypos: boolean
  typoProbability: number // 0-1
  
  // Pre-typing delay (thinking before starting)
  thinkingDelay: { min: number; max: number }
  
  // "Typing..." indicator behavior
  showTypingIndicator: boolean
  indicatorFlicker: boolean // Occasionally stop/restart typing
  flickerProbability: number
}

export interface TypingEvent {
  type: 'start' | 'char' | 'pause' | 'indicator_off' | 'indicator_on' | 'complete'
  char?: string
  position?: number
  delay: number // ms until next event
  currentText?: string
}

export interface TypingState {
  isTyping: boolean
  currentText: string
  fullText: string
  progress: number // 0-1
  showIndicator: boolean
}

// ============================================================
// DEFAULT CONFIG
// ============================================================

export const DEFAULT_TYPING_CONFIG: TypingConfig = {
  baseSpeed: 50, // 50 chars/sec (fast typist)
  speedVariation: 0.3,
  
  pauseAfterPunctuation: 400,
  pauseAfterComma: 200,
  pauseBetweenWords: 50,
  pauseForThinking: 800,
  
  burstTyping: true,
  burstLength: { min: 5, max: 15 },
  burstPause: { min: 100, max: 300 },
  
  occasionalPause: true,
  pauseProbability: 0.05,
  
  simulateTypos: false, // Off by default
  typoProbability: 0.02,
  
  thinkingDelay: { min: 500, max: 1500 },
  
  showTypingIndicator: true,
  indicatorFlicker: true,
  flickerProbability: 0.1,
}

// Preset configs for different "typing personalities"
export const TYPING_PRESETS = {
  fast: {
    ...DEFAULT_TYPING_CONFIG,
    baseSpeed: 80,
    speedVariation: 0.2,
    burstLength: { min: 10, max: 25 },
    thinkingDelay: { min: 300, max: 800 },
  },
  
  casual: {
    ...DEFAULT_TYPING_CONFIG,
    baseSpeed: 40,
    speedVariation: 0.4,
    pauseProbability: 0.1,
    indicatorFlicker: true,
    flickerProbability: 0.15,
  },
  
  thoughtful: {
    ...DEFAULT_TYPING_CONFIG,
    baseSpeed: 35,
    pauseAfterPunctuation: 600,
    pauseForThinking: 1200,
    occasionalPause: true,
    pauseProbability: 0.15,
    thinkingDelay: { min: 1000, max: 2500 },
  },
  
  instant: {
    ...DEFAULT_TYPING_CONFIG,
    baseSpeed: 200,
    speedVariation: 0,
    burstTyping: false,
    occasionalPause: false,
    thinkingDelay: { min: 0, max: 100 },
    indicatorFlicker: false,
  },
} as const

// ============================================================
// TYPING SIMULATOR
// ============================================================

/**
 * Generate typing events for a message
 * Use these events to animate text appearing character by character
 */
export function* generateTypingEvents(
  text: string,
  config: TypingConfig = DEFAULT_TYPING_CONFIG
): Generator<TypingEvent> {
  // Initial thinking delay
  const thinkingDelay = randomBetween(config.thinkingDelay.min, config.thinkingDelay.max)
  yield { type: 'start', delay: thinkingDelay }
  
  let currentText = ''
  let burstRemaining = 0
  let charsSinceLastPause = 0
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const prevChar = i > 0 ? text[i - 1] : ''
    
    // Calculate delay for this character
    let delay = getBaseDelay(config.baseSpeed, config.speedVariation)
    
    // Burst typing logic
    if (config.burstTyping) {
      if (burstRemaining <= 0) {
        // Start new burst
        burstRemaining = randomBetween(config.burstLength.min, config.burstLength.max)
        
        // Pause between bursts (if not at start)
        if (i > 0) {
          const burstPause = randomBetween(config.burstPause.min, config.burstPause.max)
          delay += burstPause
        }
      }
      burstRemaining--
    }
    
    // Add delays for punctuation
    if (/[.!?]/.test(prevChar)) {
      delay += config.pauseAfterPunctuation * (0.8 + Math.random() * 0.4)
    } else if (/[,;:]/.test(prevChar)) {
      delay += config.pauseAfterComma * (0.8 + Math.random() * 0.4)
    } else if (prevChar === ' ') {
      delay += config.pauseBetweenWords * (0.5 + Math.random())
    }
    
    // Occasional random thinking pause
    if (config.occasionalPause && Math.random() < config.pauseProbability) {
      // Yield pause event
      yield { 
        type: 'pause', 
        delay: config.pauseForThinking * (0.5 + Math.random()),
        currentText 
      }
      
      // Maybe flicker typing indicator
      if (config.indicatorFlicker && Math.random() < config.flickerProbability) {
        yield { type: 'indicator_off', delay: randomBetween(200, 600), currentText }
        yield { type: 'indicator_on', delay: randomBetween(300, 800), currentText }
      }
    }
    
    // Add character
    currentText += char
    charsSinceLastPause++
    
    yield {
      type: 'char',
      char,
      position: i,
      delay,
      currentText
    }
    
    // Occasional indicator flicker during typing
    if (config.indicatorFlicker && 
        charsSinceLastPause > 20 && 
        Math.random() < config.flickerProbability * 0.5) {
      yield { type: 'indicator_off', delay: randomBetween(100, 300), currentText }
      yield { type: 'indicator_on', delay: randomBetween(200, 500), currentText }
      charsSinceLastPause = 0
    }
  }
  
  yield { type: 'complete', delay: 0, currentText: text }
}

/**
 * Calculate total typing duration for a message
 */
export function estimateTypingDuration(
  text: string,
  config: TypingConfig = DEFAULT_TYPING_CONFIG
): number {
  const baseTime = (text.length / config.baseSpeed) * 1000
  
  // Add time for punctuation pauses
  const punctuationCount = (text.match(/[.!?]/g) || []).length
  const commaCount = (text.match(/[,;:]/g) || []).length
  const wordCount = text.split(/\s+/).length
  
  const pauseTime = 
    punctuationCount * config.pauseAfterPunctuation +
    commaCount * config.pauseAfterComma +
    wordCount * config.pauseBetweenWords
  
  // Add thinking delay
  const thinkingTime = (config.thinkingDelay.min + config.thinkingDelay.max) / 2
  
  // Add burst pauses
  const burstCount = config.burstTyping 
    ? Math.floor(text.length / ((config.burstLength.min + config.burstLength.max) / 2))
    : 0
  const burstPauseTime = burstCount * ((config.burstPause.min + config.burstPause.max) / 2)
  
  return Math.round(baseTime + pauseTime + thinkingTime + burstPauseTime)
}

/**
 * Stream text with typing effect (for real-time display)
 */
export async function streamWithTypingEffect(
  text: string,
  onUpdate: (state: TypingState) => void,
  config: TypingConfig = DEFAULT_TYPING_CONFIG
): Promise<void> {
  const events = generateTypingEvents(text, config)
  let currentText = ''
  let showIndicator = true
  
  for (const event of events) {
    // Wait for delay
    if (event.delay > 0) {
      await sleep(event.delay)
    }
    
    // Process event
    switch (event.type) {
      case 'start':
        onUpdate({
          isTyping: true,
          currentText: '',
          fullText: text,
          progress: 0,
          showIndicator: true
        })
        break
        
      case 'char':
        currentText = event.currentText || ''
        onUpdate({
          isTyping: true,
          currentText,
          fullText: text,
          progress: currentText.length / text.length,
          showIndicator: true
        })
        break
        
      case 'indicator_off':
        showIndicator = false
        onUpdate({
          isTyping: true,
          currentText,
          fullText: text,
          progress: currentText.length / text.length,
          showIndicator: false
        })
        break
        
      case 'indicator_on':
        showIndicator = true
        onUpdate({
          isTyping: true,
          currentText,
          fullText: text,
          progress: currentText.length / text.length,
          showIndicator: true
        })
        break
        
      case 'complete':
        onUpdate({
          isTyping: false,
          currentText: text,
          fullText: text,
          progress: 1,
          showIndicator: false
        })
        break
    }
  }
}

// ============================================================
// TYPING INDICATOR PATTERNS
// ============================================================

/**
 * Generate realistic "typing..." indicator pattern
 * Returns array of [show, hide] durations in ms
 */
export function generateIndicatorPattern(
  estimatedDuration: number
): Array<{ show: number; hide: number }> {
  const patterns: Array<{ show: number; hide: number }> = []
  let remainingTime = estimatedDuration
  
  while (remainingTime > 0) {
    // Random typing duration (1-4 seconds)
    const showDuration = Math.min(
      randomBetween(1000, 4000),
      remainingTime
    )
    remainingTime -= showDuration
    
    // Sometimes pause typing (20% chance if still time left)
    let hideDuration = 0
    if (remainingTime > 500 && Math.random() < 0.2) {
      hideDuration = randomBetween(300, 1000)
      remainingTime -= hideDuration
    }
    
    patterns.push({ show: showDuration, hide: hideDuration })
  }
  
  return patterns
}

// ============================================================
// CLIENT-SIDE HOOK HELPERS
// ============================================================

/**
 * Configuration for useTypingEffect hook
 */
export interface UseTypingEffectOptions {
  text: string
  config?: Partial<TypingConfig>
  enabled?: boolean
  onComplete?: () => void
}

/**
 * Get typing speed based on message length
 * Longer messages = faster typing to not bore user
 */
export function getAdaptiveSpeed(textLength: number): number {
  if (textLength < 50) return 40  // Short - normal speed
  if (textLength < 150) return 55 // Medium - bit faster
  if (textLength < 300) return 70 // Long - faster
  return 90 // Very long - quite fast
}

/**
 * Should we skip typing effect for this message?
 */
export function shouldSkipTypingEffect(
  text: string,
  context?: { isError?: boolean; isSystem?: boolean; isQuickReply?: boolean }
): boolean {
  // Skip for errors and system messages
  if (context?.isError || context?.isSystem) return true
  
  // Skip for quick reply selections
  if (context?.isQuickReply) return true
  
  // Skip for very short messages (< 5 chars)
  if (text.length < 5) return true
  
  // Skip for very long messages (> 1000 chars)
  if (text.length > 1000) return true
  
  return false
}

// ============================================================
// HELPERS
// ============================================================

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getBaseDelay(baseSpeed: number, variation: number): number {
  const baseDelay = 1000 / baseSpeed // ms per char
  const variance = baseDelay * variation
  return baseDelay + (Math.random() * variance * 2 - variance)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
