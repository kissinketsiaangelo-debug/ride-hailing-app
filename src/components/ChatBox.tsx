"use client"

import { useState, useEffect, useRef } from "react"

type ChatMessage = {
  id?: string
  rideId: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
}

type ChatBoxProps = {
  rideId: string
  userId: string
  userName: string
  otherName: string
  onSendMessage: (content: string) => void
  onClose: () => void
  initialMessages?: ChatMessage[]
  onNewMessage?: (msg: ChatMessage) => void
}

export default function ChatBox({
  rideId,
  userId,
  userName,
  otherName,
  onSendMessage,
  onClose,
  initialMessages = [],
  onNewMessage,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    const msg: ChatMessage = {
      rideId,
      senderId: userId,
      senderName: userName,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    onSendMessage(input.trim())
    setInput("")
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-96">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-emerald-500 rounded-t-xl">
        <span className="text-sm font-semibold text-white">{otherName}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: 240 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                msg.senderId === userId
                  ? "bg-emerald-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-700 rounded-bl-none"
              }`}
            >
              <p>{msg.content}</p>
              <p className={`text-[10px] mt-0.5 ${msg.senderId === userId ? "text-emerald-100" : "text-gray-400"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-gray-200 p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600"
        >
          Send
        </button>
      </div>
    </div>
  )
}
