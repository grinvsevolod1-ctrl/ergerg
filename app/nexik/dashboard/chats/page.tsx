"use client"

import { useState } from "react"
import { MessageSquare, Search } from "lucide-react"

export default function ChatsPage() {
  const [chats] = useState<Array<{ id: string; name: string; lastMessage: string; time: string }>>([])
  const [search, setSearch] = useState("")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Диалоги</h1>
        <p className="text-white/50 mt-1">История общения с клиентами</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          placeholder="Поиск по диалогам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>

      {/* Chats list */}
      {chats.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/50 mb-2">Пока нет диалогов</p>
          <p className="text-sm text-white/30">
            Диалоги появятся когда клиенты начнут общаться с вашим AI-ассистентом
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {chat.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{chat.name}</p>
                <p className="text-sm text-white/50 truncate">{chat.lastMessage}</p>
              </div>
              <span className="text-xs text-white/30">{chat.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
