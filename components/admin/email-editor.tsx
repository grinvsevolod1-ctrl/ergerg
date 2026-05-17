"use client"

import { useState, useRef } from "react"
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Image, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Type,
  Palette,
  Code,
  Eye,
  Edit3,
  Undo,
  Redo,
  
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmailEditorProps {
  value: string
  onChange: (value: string) => void
  onGenerateWithAI?: () => void
}

const TEMPLATES = [
  {
    name: "Приветственное письмо",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="color: #111; font-size: 28px; margin-bottom: 20px;">Добро пожаловать!</h1>
  <p style="color: #555; font-size: 16px; line-height: 1.6;">Спасибо за интерес к нашим услугам. Мы рады приветствовать вас!</p>
  <p style="color: #555; font-size: 16px; line-height: 1.6;">Если у вас есть вопросы, мы всегда готовы помочь.</p>
  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #14b8a6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">Узнать больше</a>
</div>`
  },
  {
    name: "Промо акция",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f8f9fa;">
  <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <h1 style="color: #111; font-size: 32px; text-align: center; margin-bottom: 10px;">Специальное предложение</h1>
    <p style="color: #888; text-align: center; font-size: 18px;">Только до конца месяца</p>
    <div style="background: linear-gradient(135deg, #06b6d4, #14b8a6); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <span style="color: white; font-size: 48px; font-weight: bold;">-20%</span>
      <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">на все услуги</p>
    </div>
    <a href="#" style="display: block; background: #111; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">Воспользоваться предложением</a>
  </div>
</div>`
  },
  {
    name: "Минималистичный",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 60px 20px;">
  <p style="color: #111; font-size: 18px; line-height: 1.8;">Здравствуйте,</p>
  <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 20px 0;">Ваш текст здесь. Простой и элегантный формат для деловой переписки.</p>
  <p style="color: #555; font-size: 16px; line-height: 1.8;">С уважением,<br><strong>Команда NetNext</strong></p>
</div>`
  }
]

export function EmailEditor({ value, onChange, onGenerateWithAI }: EmailEditorProps) {
  const [mode, setMode] = useState<'visual' | 'code'>('visual')
  const [showTemplates, setShowTemplates] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleEditorInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertLink = () => {
    const url = prompt('Введите URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertImage = () => {
    const url = prompt('Введите URL изображения:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  const applyTemplate = (html: string) => {
    onChange(html)
    if (editorRef.current) {
      editorRef.current.innerHTML = html
    }
    setShowTemplates(false)
  }

  const ToolbarButton = ({ 
    icon: Icon, 
    onClick, 
    title,
    active 
  }: { 
    icon: typeof Bold
    onClick: () => void
    title: string
    active?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-colors",
        active 
          ? "bg-cyan-500/20 text-cyan-400" 
          : "text-[#888] hover:text-white hover:bg-[#222]"
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  )

  return (
    <div className="border border-[#222] rounded-xl overflow-hidden bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#222] bg-[#111]">
        <div className="flex items-center gap-1">
          <ToolbarButton icon={Bold} onClick={() => execCommand('bold')} title="Жирный" />
          <ToolbarButton icon={Italic} onClick={() => execCommand('italic')} title="Курсив" />
          <div className="w-px h-6 bg-[#333] mx-2" />
          <ToolbarButton icon={AlignLeft} onClick={() => execCommand('justifyLeft')} title="По левому краю" />
          <ToolbarButton icon={AlignCenter} onClick={() => execCommand('justifyCenter')} title="По центру" />
          <ToolbarButton icon={AlignRight} onClick={() => execCommand('justifyRight')} title="По правому краю" />
          <div className="w-px h-6 bg-[#333] mx-2" />
          <ToolbarButton icon={List} onClick={() => execCommand('insertUnorderedList')} title="Маркированный список" />
          <ToolbarButton icon={ListOrdered} onClick={() => execCommand('insertOrderedList')} title="Нумерованный список" />
          <div className="w-px h-6 bg-[#333] mx-2" />
          <ToolbarButton icon={LinkIcon} onClick={insertLink} title="Вставить ссылку" />
          <ToolbarButton icon={Image} onClick={insertImage} title="Вставить изображение" />
        </div>

        <div className="flex items-center gap-2">
          {onGenerateWithAI && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onGenerateWithAI}
              className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
            >
              AI
            </Button>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-[#888] hover:text-white"
          >
            <Type className="w-4 h-4 mr-2" />
            Шаблоны
          </Button>

          <div className="flex border border-[#333] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('visual')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                mode === 'visual' 
                  ? "bg-[#222] text-white" 
                  : "text-[#888] hover:text-white"
              )}
            >
              <Edit3 className="w-3 h-3 inline mr-1" />
              Визуальный
            </button>
            <button
              type="button"
              onClick={() => setMode('code')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                mode === 'code' 
                  ? "bg-[#222] text-white" 
                  : "text-[#888] hover:text-white"
              )}
            >
              <Code className="w-3 h-3 inline mr-1" />
              HTML
            </button>
          </div>
        </div>
      </div>

      {/* Templates Dropdown */}
      {showTemplates && (
        <div className="border-b border-[#222] p-4 bg-[#111]">
          <p className="text-xs text-[#888] uppercase tracking-wider mb-3">Готовые шаблоны</p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((template, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(template.html)}
                className="p-4 bg-[#0a0a0a] border border-[#222] rounded-lg text-left hover:border-cyan-500/50 transition-colors"
              >
                <div className="font-medium text-white text-sm">{template.name}</div>
                <div className="text-xs text-[#555] mt-1">Нажмите чтобы применить</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      {mode === 'visual' ? (
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[400px] p-6 text-white focus:outline-none prose prose-invert max-w-none"
          onInput={handleEditorInput}
          dangerouslySetInnerHTML={{ __html: value }}
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-[400px] p-4 bg-transparent text-white font-mono text-sm focus:outline-none resize-none"
          placeholder="<html>...</html>"
        />
      )}

      {/* Preview Toggle */}
      <div className="border-t border-[#222] p-4 bg-[#111]">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-[#888] hover:text-white">
            <Eye className="w-4 h-4" />
            Предпросмотр письма
          </summary>
          <div className="mt-4 p-4 bg-white rounded-lg">
            <div 
              className="text-black"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        </details>
      </div>
    </div>
  )
}
