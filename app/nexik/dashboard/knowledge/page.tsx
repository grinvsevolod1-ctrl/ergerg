"use client"

import { useEffect, useState, useCallback } from "react"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Search, FileText, HelpCircle, BookOpen, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface Document {
  id: string
  type: string
  title: string
  createdAt: string
  metadata?: {
    category?: string
  }
}

export default function KnowledgePage() {
  const { session } = useNexikAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ title: string; content: string; score: number }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"faq" | "document">("faq")

  const [newDoc, setNewDoc] = useState({ title: "", content: "" })
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "" })
  const [isAdding, setIsAdding] = useState(false)

  // Use org slug as clientId for the knowledge API
  const clientId = session?.org?.slug || ''

  const loadDocuments = useCallback(async () => {
    if (!clientId) return
    
    try {
      const res = await fetch(`/api/ai/knowledge?clientId=${clientId}`)
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      loadDocuments()
    }
  }, [clientId, loadDocuments])

  const handleSearch = async () => {
    if (!searchQuery.trim() || !clientId) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/ai/knowledge?clientId=${clientId}&query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch {
      // Silent fail
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddDocument = async () => {
    if (!newDoc.title || !newDoc.content || !clientId) return
    setIsAdding(true)
    try {
      const res = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: "document",
          title: newDoc.title,
          content: newDoc.content,
        }),
      })
      if (res.ok) {
        setNewDoc({ title: "", content: "" })
        setDialogOpen(false)
        loadDocuments()
      }
    } catch {
      // Silent fail
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddFaq = async () => {
    if (!newFaq.question || !newFaq.answer || !clientId) return
    setIsAdding(true)
    try {
      const res = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: "faq",
          faqs: [{ question: newFaq.question, answer: newFaq.answer, category: newFaq.category || undefined }],
        }),
      })
      if (res.ok) {
        setNewFaq({ question: "", answer: "", category: "" })
        setDialogOpen(false)
        loadDocuments()
      }
    } catch {
      // Silent fail
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот документ?") || !clientId) return
    try {
      await fetch(`/api/ai/knowledge?clientId=${clientId}&documentId=${id}`, { method: "DELETE" })
      loadDocuments()
    } catch {
      // Silent fail
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 bg-white/10 mb-4" />
        <Skeleton className="h-4 w-64 bg-white/10 mb-8" />
        <Skeleton className="h-24 rounded-2xl bg-white/10 mb-6" />
        <Skeleton className="h-64 rounded-2xl bg-white/10" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-0.5 bg-primary" />
            <span className="text-primary font-mono text-sm">{"// RAG"}</span>
          </div>
          <h1 className="text-3xl font-bold">База знаний</h1>
          <p className="text-muted-foreground mt-1">
            Документы и FAQ для обучения AI-ассистента
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Добавить
        </Button>
      </div>

      {/* Dialog/Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDialogOpen(false)} />
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Добавить в базу знаний</h3>
                <p className="text-sm text-muted-foreground mt-1">Добавьте документ или FAQ для обучения AI</p>
              </div>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 mb-6">
                <button
                  onClick={() => setActiveTab("faq")}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === "faq" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  FAQ
                </button>
                <button
                  onClick={() => setActiveTab("document")}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === "document" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Документ
                </button>
              </div>

              {activeTab === "faq" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Вопрос</Label>
                    <Input
                      placeholder="Какие услуги вы предоставляете?"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                      className="bg-secondary/30 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Ответ</Label>
                    <Textarea
                      placeholder="Мы предоставляем..."
                      rows={4}
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                      className="bg-secondary/30 border-border resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Категория (опционально)</Label>
                    <Input
                      placeholder="Услуги"
                      value={newFaq.category}
                      onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                      className="bg-secondary/30 border-border"
                    />
                  </div>
                  <Button onClick={handleAddFaq} disabled={isAdding} className="w-full">
                    {isAdding ? "Добавление..." : "Добавить FAQ"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Заголовок</Label>
                    <Input
                      placeholder="О компании"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      className="bg-secondary/30 border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Содержимое (поддерживается Markdown)</Label>
                    <Textarea
                      placeholder="# Заголовок&#10;&#10;Текст документа..."
                      rows={8}
                      value={newDoc.content}
                      onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                      className="bg-secondary/30 border-border resize-none"
                    />
                  </div>
                  <Button onClick={handleAddDocument} disabled={isAdding} className="w-full">
                    {isAdding ? "Добавление..." : "Добавить документ"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Поиск по базе знаний..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-secondary/30 border-border"
          />
          <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
            <Search className="w-4 h-4" />
            {isSearching ? "Поиск..." : "Найти"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Найдено: {searchResults.length}</p>
            {searchResults.map((result, i) => (
              <div key={i} className="p-4 rounded-xl bg-secondary/20 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{result.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                    {(result.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{result.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Документы ({documents.length})</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Все документы в базе знаний вашего AI-ассистента
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Загрузка...</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">База знаний пуста</p>
              <p className="text-sm text-muted-foreground/70">
                Добавьте документы или FAQ, чтобы обучить AI
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border"
                >
                  <div className="flex items-center gap-3">
                    {doc.type === "faq" ? (
                      <div className="p-2 rounded-lg bg-primary/10">
                        <HelpCircle className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-[#00ff88]/10">
                        <FileText className="w-5 h-5 text-[#00ff88]" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: doc.type === "faq" ? "rgba(0, 255, 255, 0.1)" : "rgba(0, 255, 136, 0.1)",
                            color: doc.type === "faq" ? "#00ffff" : "#00ff88",
                            border: `1px solid ${doc.type === "faq" ? "rgba(0, 255, 255, 0.2)" : "rgba(0, 255, 136, 0.2)"}`,
                          }}
                        >
                          {doc.type}
                        </span>
                        {doc.metadata?.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
                            {doc.metadata.category}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString("ru")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
