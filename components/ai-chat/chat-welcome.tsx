"use client"

import { NNAssistantIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

interface ChatWelcomeProps {
  onSend: (content: string) => void
}

const welcomePrompts = [
  "Какие у вас услуги?",
  "Сколько стоит сайт?",
  "Покажите работы",
  "Как вы работаете?",
]

export function ChatWelcome({ onSend }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-5 py-6 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 flex items-center justify-center shadow-lg shadow-primary/5">
        <NNAssistantIcon className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-lg mb-1">Привет!</h3>
        <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
          Я помогу узнать больше о NetNext. Задайте вопрос или выберите тему ниже.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {welcomePrompts.map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            className={cn(
              "text-left text-[13px] p-3.5 rounded-xl border border-border/50",
              "bg-secondary/40 hover:bg-secondary/70 hover:border-primary/30 active:scale-[0.98]",
              "transition-all text-muted-foreground hover:text-foreground leading-snug touch-manipulation"
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
