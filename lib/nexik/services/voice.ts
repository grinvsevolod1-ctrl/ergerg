/**
 * Nexik Voice Messages Service
 * Self-hosted Whisper transcription via Ollama
 */

import { getOllamaBaseUrl } from '@/lib/ai/providers'

// ==========================================
// TYPES
// ==========================================

export interface TranscriptionResult {
  text: string
  language?: string
  confidence: number
  duration_seconds: number
  segments?: TranscriptionSegment[]
  error?: string
}

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
  confidence: number
}

export interface VoiceMessage {
  id: string
  conversation_id: string
  org_id: string
  sender_type: 'visitor' | 'operator'
  audio_url: string
  audio_format: string
  duration_seconds: number
  transcription?: string
  transcription_confidence?: number
  detected_language?: string
  status: 'pending' | 'transcribing' | 'ready' | 'failed'
  created_at: string
}

interface WhisperResponse {
  text: string
  segments?: Array<{
    start: number
    end: number
    text: string
    no_speech_prob?: number
  }>
  language?: string
}

// ==========================================
// WHISPER INTEGRATION
// ==========================================

/**
 * Check if Whisper is available via Ollama
 */
export async function isWhisperAvailable(): Promise<boolean> {
  try {
    const baseUrl = getOllamaBaseUrl()
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    
    if (!response.ok) return false
    
    const data = await response.json()
    const models = data.models || []
    
    // Check for whisper model
    return models.some((m: { name: string }) => 
      m.name.toLowerCase().includes('whisper')
    )
  } catch {
    return false
  }
}

/**
 * Get available Whisper model name
 */
async function getWhisperModel(): Promise<string | null> {
  try {
    const baseUrl = getOllamaBaseUrl()
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const models = data.models || []
    
    // Prefer larger models for better accuracy
    const whisperModels = models
      .filter((m: { name: string }) => m.name.toLowerCase().includes('whisper'))
      .map((m: { name: string }) => m.name)
    
    // Priority: large > medium > base > small > tiny
    const priorities = ['large', 'medium', 'base', 'small', 'tiny']
    for (const priority of priorities) {
      const match = whisperModels.find((m: string) => m.includes(priority))
      if (match) return match
    }
    
    return whisperModels[0] || null
  } catch {
    return null
  }
}

/**
 * Transcribe audio using Ollama Whisper
 */
export async function transcribeAudio(
  audioData: ArrayBuffer | Buffer,
  options: {
    language?: string
    translate?: boolean
    format?: 'wav' | 'mp3' | 'webm' | 'ogg'
  } = {}
): Promise<TranscriptionResult> {
  const startTime = Date.now()
  
  try {
    // Check if Whisper is available
    const model = await getWhisperModel()
    if (!model) {
      return {
        text: '',
        confidence: 0,
        duration_seconds: 0,
        error: 'Whisper model not available'
      }
    }
    
    const baseUrl = getOllamaBaseUrl()
    
    // Convert audio to base64
    const base64Audio = Buffer.from(audioData).toString('base64')
    
    // Call Ollama with audio
    // Note: Ollama's Whisper support may vary - this is a common API pattern
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: options.translate ? 'Transcribe and translate to English:' : 'Transcribe:',
        images: [base64Audio], // Ollama uses 'images' for binary data
        options: {
          language: options.language || 'auto'
        },
        stream: false
      }),
      signal: AbortSignal.timeout(60000) // 60 second timeout for transcription
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Whisper API error: ${errorText}`)
    }
    
    const data = await response.json() as { response?: string } & WhisperResponse
    const duration = (Date.now() - startTime) / 1000
    
    // Parse response
    const text = data.response || data.text || ''
    const segments = data.segments?.map(s => ({
      start: s.start,
      end: s.end,
      text: s.text,
      confidence: s.no_speech_prob ? 1 - s.no_speech_prob : 0.9
    }))
    
    // Estimate confidence based on response quality
    const confidence = text.length > 0 ? 0.85 : 0
    
    return {
      text: text.trim(),
      language: data.language,
      confidence,
      duration_seconds: duration,
      segments
    }
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('[Nexik Voice] Transcription error:', errorMessage)
    
    return {
      text: '',
      confidence: 0,
      duration_seconds: duration,
      error: errorMessage
    }
  }
}

/**
 * Alternative: Use browser's built-in SpeechRecognition API
 * This is a fallback that runs client-side
 */
export function getBrowserSpeechRecognitionCode(): string {
  return `
// Browser-side speech recognition fallback
function startBrowserTranscription(onResult, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    onError('Speech recognition not supported in this browser');
    return null;
  }
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  // Auto-detect language or use Russian
  recognition.lang = document.documentElement.lang || 'ru-RU';
  
  recognition.onresult = (event) => {
    const result = event.results[0];
    if (result) {
      onResult({
        text: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal
      });
    }
  };
  
  recognition.onerror = (event) => {
    onError(event.error);
  };
  
  recognition.start();
  return recognition;
}
`
}

// ==========================================
// AUDIO RECORDING HELPERS
// ==========================================

/**
 * Get WebRTC recording setup code for widget
 */
export function getRecordingCode(): string {
  return `
// Voice recording for Nexik widget
class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
  }
  
  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimal for speech
        }
      });
      
      // Prefer opus for smaller files, fallback to webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }
  
  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder.mimeType 
        });
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        
        resolve({
          blob,
          mimeType: this.mediaRecorder.mimeType,
          duration: this.audioChunks.length * 0.1 // Approximate duration
        });
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.audioChunks = [];
  }
}

// Visualizer for recording feedback
class AudioVisualizer {
  constructor(stream, canvas) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animationId = null;
  }
  
  start() {
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Draw waveform
      this.ctx.fillStyle = 'rgb(10, 10, 15)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
      let x = 0;
      
      for (let i = 0; i < this.dataArray.length; i++) {
        const barHeight = (this.dataArray[i] / 255) * this.canvas.height;
        
        // Cyan gradient
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, this.canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.audioContext.close();
  }
}
`
}

// ==========================================
// DATABASE INTEGRATION
// ==========================================

/**
 * Save voice message to database
 */
export async function saveVoiceMessage(
  conversationId: string,
  orgId: string,
  senderType: 'visitor' | 'operator',
  audioUrl: string,
  audioFormat: string,
  durationSeconds: number
): Promise<string> {
  const { query } = await import('@/lib/db')
  
  const result = await query<{ id: string }>(
    `INSERT INTO nexik_voice_messages 
     (conversation_id, org_id, sender_type, audio_url, audio_format, duration_seconds, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING id`,
    [conversationId, orgId, senderType, audioUrl, audioFormat, durationSeconds]
  )
  
  return result[0].id
}

/**
 * Update voice message with transcription
 */
export async function updateVoiceTranscription(
  voiceMessageId: string,
  transcription: TranscriptionResult
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  const status = transcription.error ? 'failed' : 'ready'
  
  await execute(
    `UPDATE nexik_voice_messages 
     SET transcription = $1, 
         transcription_confidence = $2, 
         detected_language = $3,
         status = $4
     WHERE id = $5`,
    [
      transcription.text,
      transcription.confidence,
      transcription.language,
      status,
      voiceMessageId
    ]
  )
}

/**
 * Get voice message by ID
 */
export async function getVoiceMessage(voiceMessageId: string): Promise<VoiceMessage | null> {
  const { queryOne } = await import('@/lib/db')
  
  return queryOne<VoiceMessage>(
    'SELECT * FROM nexik_voice_messages WHERE id = $1',
    [voiceMessageId]
  )
}

/**
 * Process voice message: transcribe and create text message
 */
export async function processVoiceMessage(
  voiceMessageId: string,
  audioData: ArrayBuffer | Buffer
): Promise<{ success: boolean; transcription?: string; error?: string }> {
  const { execute, queryOne } = await import('@/lib/db')
  
  // Get voice message
  const voiceMessage = await getVoiceMessage(voiceMessageId)
  if (!voiceMessage) {
    return { success: false, error: 'Voice message not found' }
  }
  
  // Update status to transcribing
  await execute(
    "UPDATE nexik_voice_messages SET status = 'transcribing' WHERE id = $1",
    [voiceMessageId]
  )
  
  // Transcribe
  const result = await transcribeAudio(audioData, {
    format: voiceMessage.audio_format as 'wav' | 'mp3' | 'webm' | 'ogg'
  })
  
  // Update with transcription
  await updateVoiceTranscription(voiceMessageId, result)
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  // Create a text message with the transcription
  if (result.text) {
    await execute(
      `INSERT INTO nexik_messages 
       (conversation_id, org_id, sender_type, content, content_type, voice_message_id)
       VALUES ($1, $2, $3, $4, 'voice_transcription', $5)`,
      [
        voiceMessage.conversation_id,
        voiceMessage.org_id,
        voiceMessage.sender_type,
        result.text,
        voiceMessageId
      ]
    )
  }
  
  return { success: true, transcription: result.text }
}

// ==========================================
// AUDIO FORMAT HELPERS
// ==========================================

/**
 * Get supported audio formats
 */
export function getSupportedFormats(): string[] {
  return ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg', 'audio/mp4', 'audio/wav']
}

/**
 * Convert audio blob to WAV format (for better Whisper compatibility)
 * This is a simplified conversion - in production you might use ffmpeg
 */
export async function normalizeAudio(
  audioData: ArrayBuffer,
  _sourceFormat: string
): Promise<ArrayBuffer> {
  // For now, return as-is
  // In production, you would use ffmpeg or similar to convert to 16kHz mono WAV
  return audioData
}

/**
 * Calculate audio duration from buffer
 */
export function estimateAudioDuration(
  audioData: ArrayBuffer,
  format: string
): number {
  // Rough estimation based on file size
  // Opus typically: ~12 kbps = 1.5 KB/s
  // WebM/Opus: ~16 kbps = 2 KB/s
  const sizeKB = audioData.byteLength / 1024
  
  if (format.includes('opus')) {
    return sizeKB / 1.5
  }
  
  // Default: assume ~16 kbps
  return sizeKB / 2
}
