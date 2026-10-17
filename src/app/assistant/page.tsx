'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChatMessage } from '@/types';
import {
  Bot,
  Send,
  User,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

export default function AssistantPage() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcome greeting based on active language
  useEffect(() => {
    const welcomeText =
      language === 'hi'
        ? 'नमस्ते साथी! मैं गिग साथी AI हूँ। आप मुझसे गलत कटौतियों, ई-श्रम कार्ड बीमा, राजस्थान गिग वर्कर बोर्ड कानून या बिना नोटिस आईडी बंद होने पर अपने अधिकारों के बारे में पूछ सकते हैं। मैं आपकी क्या मदद कर सकता हूँ?'
        : language === 'pa'
        ? 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਸਾਥੀ ਜੀ! ਮੈਂ ਗਿੱਗ ਸਾਥੀ AI ਹਾਂ। ਤੁਸੀਂ ਮੈਨੂੰ ਕੰਪਨੀ ਦੀਆਂ ਗਲਤ ਕਟੌਤੀਆਂ, ਈ-ਸ਼੍ਰਮ ਕਾਰਡ ਦੁਰਘਟਨਾ ਬੀਮਾ, ਜਾਂ ਆਈਡੀ ਬੰਦ ਹੋਣ ਤੇ ਆਪਣੇ ਹੱਕਾਂ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ। ਦੱਸੋ ਅੱਜ ਕੀ ਮਦਦ ਚਾਹੀਦੀ ਹੈ?'
        : 'Namaste! I am GigSaathi AI. You can ask me about wrongful platform deductions, claiming ₹2 Lakh accident cover on e-Shram, legal rights under State Gig Worker Acts, or recovering withheld tips. How can I assist you today?';

    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setErrorNotice(null);

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const botMessage: ChatMessage = {
        id: 'msg-' + Date.now() + '-bot',
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorNotice(err.message || 'Network error or OpenAI API unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            <span>{t.assistant.title}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.assistant.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Schemes Retrieval Enabled</span>
        </div>
      </div>

      {/* Error / Warning Notice if API key missing */}
      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Notice:</span> {errorNotice}
            <p className="mt-1 text-[11px] text-amber-400/80">
              To activate real live OpenAI model responses, add <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">OPENAI_API_KEY</code> to your <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">.env.local</code> file.
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                    : 'bg-[#0f172a] border border-slate-800 text-slate-100 rounded-tl-none shadow-lg'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Sourced Reference Links if present */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Verified Government Sources:
                    </span>
                    {m.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 underline mr-3"
                      >
                        <span>{s.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Timestamp & Copy */}
                <div
                  className={`mt-2 flex items-center justify-between text-[10px] ${
                    isUser ? 'text-emerald-200' : 'text-slate-500'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center gap-2 shadow-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-slate-400">{t.assistant.thinking}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggested Questions Pill Bar */}
      {messages.length <= 2 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Suggested topics for gig partners:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {t.assistant.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-left text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white px-3 py-1.5 rounded-full transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center gap-2 pt-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.assistant.placeholder}
          disabled={loading}
          className="flex-1 bg-[#0f172a] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none shadow-lg disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-4 py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
