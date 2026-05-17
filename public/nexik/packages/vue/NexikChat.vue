<template>
  <div class="nexik-widget" :style="positionStyles">
    <!-- Orb button -->
    <button
      v-if="!isOpen"
      class="nexik-orb"
      :style="{ background: `linear-gradient(135deg, ${color}, ${color}88)` }"
      @click="handleOpen"
      aria-label="Open chat"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>

    <!-- Chat window -->
    <div v-else class="nexik-chat">
      <!-- Header -->
      <div class="nexik-header">
        <div class="nexik-avatar" :style="{ background: `linear-gradient(135deg, ${color}, ${color}88)` }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
            <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          </svg>
        </div>
        <div class="nexik-header-text">
          <div class="nexik-title">{{ botName }}</div>
          <div class="nexik-status" :style="{ color }">Онлайн</div>
        </div>
        <button class="nexik-close" @click="handleClose" aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div class="nexik-messages" ref="messagesRef">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['nexik-message', `nexik-message-${msg.role}`]"
        >
          {{ msg.content }}
        </div>
        <div v-if="isLoading" class="nexik-message nexik-message-assistant">
          <div class="nexik-typing">
            <span :style="{ background: color }"></span>
            <span :style="{ background: color }"></span>
            <span :style="{ background: color }"></span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="nexik-input-area">
        <input
          v-model="input"
          class="nexik-input"
          placeholder="Напишите сообщение..."
          :disabled="isLoading"
          @keydown.enter.prevent="sendMessage"
        />
        <button
          class="nexik-send"
          :style="{ background: color }"
          :disabled="!input.trim() || isLoading"
          @click="sendMessage"
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const props = withDefaults(defineProps<{
  clientId: string
  position?: 'bottom-right' | 'bottom-left'
  color?: string
  greeting?: string
  botName?: string
  autoOpen?: boolean
}>(), {
  position: 'bottom-right',
  color: '#00ffff',
  greeting: 'Привет! Чем могу помочь?',
  botName: 'Nexik',
  autoOpen: false
})

const emit = defineEmits<{
  message: [message: string, response: string]
  open: []
  close: []
}>()

const isOpen = ref(props.autoOpen)
const messages = ref<Message[]>([])
const input = ref('')
const isLoading = ref(false)
const messagesRef = ref<HTMLElement | null>(null)
const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`

const positionStyles = computed(() => ({
  position: 'fixed',
  ...(props.position === 'bottom-right' 
    ? { right: '20px', bottom: '20px' }
    : { left: '20px', bottom: '20px' })
}))

onMounted(() => {
  // Add greeting
  messages.value.push({
    id: 'greeting',
    role: 'assistant',
    content: props.greeting,
    timestamp: new Date()
  })

  // Add styles
  if (!document.getElementById('nexik-styles')) {
    const style = document.createElement('style')
    style.id = 'nexik-styles'
    style.textContent = `
      .nexik-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; z-index: 999999; }
      .nexik-orb { width: 60px; height: 60px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,255,255,0.3); transition: transform 0.2s; border: none; }
      .nexik-orb:hover { transform: scale(1.05); }
      .nexik-chat { width: 380px; height: 520px; border-radius: 16px; background: #0a0a0f; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; }
      .nexik-header { padding: 16px; background: #0d0d14; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px; }
      .nexik-avatar { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .nexik-header-text { flex: 1; }
      .nexik-title { font-weight: 600; color: #fff; }
      .nexik-status { font-size: 12px; }
      .nexik-close { background: none; border: none; color: #666; cursor: pointer; padding: 8px; }
      .nexik-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
      .nexik-message { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
      .nexik-message-user { background: #00ffff; color: #000; align-self: flex-end; border-bottom-right-radius: 4px; }
      .nexik-message-assistant { background: #1a1a2e; color: #fff; align-self: flex-start; border-bottom-left-radius: 4px; }
      .nexik-input-area { padding: 16px; background: #0d0d14; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 8px; }
      .nexik-input { flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: #12121a; color: #fff; font-size: 14px; outline: none; }
      .nexik-input:focus { border-color: rgba(0,255,255,0.5); }
      .nexik-send { width: 44px; height: 44px; border-radius: 12px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .nexik-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .nexik-typing { display: flex; gap: 4px; }
      .nexik-typing span { width: 8px; height: 8px; border-radius: 50%; animation: bounce 1s infinite; }
      .nexik-typing span:nth-child(2) { animation-delay: 0.1s; }
      .nexik-typing span:nth-child(3) { animation-delay: 0.2s; }
      @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
    `
    document.head.appendChild(style)
  }
})

watch(messages, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}, { deep: true })

function handleOpen() {
  isOpen.value = true
  emit('open')
}

function handleClose() {
  isOpen.value = false
  emit('close')
}

async function sendMessage() {
  if (!input.value.trim() || isLoading.value) return

  const userMessage: Message = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: input.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const messageText = input.value.trim()
  input.value = ''
  isLoading.value = true

  try {
    const baseUrl = window.location.hostname === 'localhost'
      ? '/api/nexik/chat'
      : 'https://nexik.org/api/nexik/chat'

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: props.clientId,
        message: messageText,
        sessionId,
        previousMessages: messages.value.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    })

    const data = await response.json()

    const assistantMessage: Message = {
      id: `msg_${Date.now()}_resp`,
      role: 'assistant',
      content: data.text || data.response || 'Извините, произошла ошибка.',
      timestamp: new Date()
    }

    messages.value.push(assistantMessage)
    emit('message', messageText, assistantMessage.content)
  } catch (error) {
    messages.value.push({
      id: `msg_${Date.now()}_err`,
      role: 'assistant',
      content: 'Извините, не удалось отправить сообщение. Попробуйте позже.',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
  }
}
</script>
