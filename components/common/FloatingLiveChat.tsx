'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send, PhoneCall, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/context/StoreContext';

export function FloatingLiveChat() {
  const { settings, isLiveChatOpen, toggleLiveChat, closeLiveChat } = useStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Greetings from Ozeira Atelier Concierge! How may we assist your discovery today?',
      time: 'Just now',
    },
  ]);

  const whatsappNumber = settings?.general?.whatsappNumber || '+919876543210';
  const whatsappMessage = encodeURIComponent(
    settings?.general?.whatsappMessage || 'Hello Ozeira Concierge! I would like some assistance.'
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage('');

    // Automated smart concierge reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Thank you! A senior client advisor is reviewing your query. You can also chat directly with us on WhatsApp for immediate response.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Chat Window Dialog */}
      {isLiveChatOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-2xl border border-neutral-200 dark:border-[#1a1a1a] overflow-hidden animate-slide-up duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col h-[450px]">
          {/* Header */}
          <div className="p-4 bg-black dark:bg-black text-white flex items-center justify-between border-b border-transparent dark:border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#c46331] flex items-center justify-center font-bold text-sm text-white shadow-md">
                  OZ
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Ozeira Concierge</h3>
                <p className="text-[10px] text-neutral-300">Live Client Advisory</p>
              </div>
            </div>
            <button
              onClick={closeLiveChat}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 dark:hover:bg-[#1a1a1a] transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick WhatsApp Action Bar */}
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-xs">
            <span className="text-emerald-900 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" /> WhatsApp Direct Link
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-all duration-200 active:scale-95 shadow-xs"
            >
              Open WhatsApp
            </a>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50 dark:bg-[#050505] text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col animate-fade-in ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl shadow-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#c46331] text-white rounded-br-none'
                      : 'bg-white dark:bg-[#111111] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-[#1a1a1a] rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-[#1a1a1a] flex gap-2">
            <input
              type="text"
              placeholder="Ask about sizing, materials, delivery..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-neutral-100 dark:bg-[#111111] border border-transparent dark:border-[#222222] focus:border-[#c46331] text-neutral-900 dark:text-neutral-100 rounded-xl outline-none transition-colors"
            />
            <button
              type="submit"
              className="p-2 bg-[#c46331] hover:bg-[#df7b47] active:scale-95 text-white rounded-xl transition-all duration-200 cursor-pointer shadow-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={toggleLiveChat}
        className="btn-luxury-shimmer flex items-center gap-2 px-4.5 py-3.5 bg-black dark:bg-black hover:bg-[#c46331] dark:hover:bg-[#c46331] text-white rounded-full shadow-2xl hover:shadow-[#c46331]/30 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:scale-105 hover:-translate-y-1 active:scale-95 group cursor-pointer border border-white/15 dark:border-[#262626]"
        aria-label="Open Concierge Chat"
      >
        <MessageSquare className="w-5 h-5 text-amber-300 group-hover:text-white transition-colors" />
        <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">
          Concierge
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>
    </div>
  );
}
