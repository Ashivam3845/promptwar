'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Mic,
  MicOff,
  Volume2,
  Square,
  RefreshCw,
  Edit3,
} from 'lucide-react';

export default function AssistantPage() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Interaction States (Sarvam STT & TTS)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceReviewText, setVoiceReviewText] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Welcome greeting follows the active language without resetting the conversation.
  const welcomeMessage: ChatMessage = useMemo(() => {
    const welcomeText =
      language === 'hi'
        ? 'नमस्ते साथी! मैं गिग साथी AI हूँ। आप बोलकर (माइक बटन दबाकर) या लिखकर गलत कटौतियों, ई-श्रम कार्ड बीमा, या आईडी ब्लॉक पर अपने अधिकार पूछ सकते हैं। आप किसी भी उत्तर को सुन भी सकते हैं!'
        : language === 'pa'
        ? 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਸਾਥੀ ਜੀ! ਮੈਂ ਗਿੱਗ ਸਾਥੀ AI ਹਾਂ। ਤੁਸੀਂ ਮਾਈਕ ਬਟਨ ਦਬਾ ਕੇ ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ ਗਲਤ ਕਟੌਤੀਆਂ ਜਾਂ ਈ-ਸ਼੍ਰਮ ਕਾਰਡ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ, ਅਤੇ ਜਵਾਬ ਵੀ ਸੁਣ ਸਕਦੇ ਹੋ!'
        : 'Namaste! I am GigSaathi AI. You can speak or type your question about wrongful platform deductions, claiming ₹2 Lakh accident cover on e-Shram, or legal rights. You can also listen to spoken responses in English, Hindi, or Punjabi!';

    return { id: 'welcome-msg', role: 'assistant', content: welcomeText, timestamp: '' };
  }, [language]);
  const displayedMessages = [welcomeMessage, ...messages];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isTranscribing, voiceReviewText]);

  // Audio recording handlers using MediaRecorder API
  const startRecording = async () => {
    setErrorNotice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
        await processAudioTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorNotice('Microphone access denied or not supported by browser. Please enable audio permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Submit audio to Sarvam STT Route Handler
  const processAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    setErrorNotice(null);

    const formData = new FormData();
    formData.append('file', blob, 'user_voice.webm');
    formData.append('language', language);

    try {
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      if (data.transcript && data.transcript.trim()) {
        // Set in editable review box to ensure user reviews before submitting
        setVoiceReviewText(data.transcript);
      } else {
        setErrorNotice('No clear speech was recognized. Please try speaking again closer to the mic.');
      }
    } catch (err) {
      console.error('STT error:', err);
      setErrorNotice((err instanceof Error && err.message) || 'Error communicating with Sarvam voice recognition.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setErrorNotice(null);
    setVoiceReviewText(null);

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

    const controller = new AbortController();
    chatAbortRef.current = controller;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
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
    } catch (err) {
      if (controller.signal.aborted) return; // left the page: nothing to show
      console.error('Chat error:', err);
      setErrorNotice((err instanceof Error && err.message) || 'Network error or OpenAI API unavailable.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  // Text-to-Speech playback using Sarvam TTS

  // Generated speech per `${language}:${messageId}`, kept for this visit only.
  const ttsCacheRef = useRef(new Map<string, string>());

  // In-flight chat request, cancelled if the user leaves the page.
  const chatAbortRef = useRef<AbortController | null>(null);

  // Stop any playing answer, cancel pending requests and release cached audio when leaving.
  useEffect(() => {
    const cache = ttsCacheRef.current;
    return () => {
      chatAbortRef.current?.abort();
      currentAudioRef.current?.pause();
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, []);

  const playAudio = async (audioSrc: string, messageId: string) => {
    const audio = new Audio(audioSrc);
    currentAudioRef.current = audio;

    audio.onplay = () => {
      setSpeakingMessageId(messageId);
      setIsTtsLoading(null);
    };

    audio.onended = () => {
      setSpeakingMessageId(null);
      currentAudioRef.current = null;
    };

    audio.onerror = () => {
      setSpeakingMessageId(null);
      setIsTtsLoading(null);
      setErrorNotice('Failed to play audio response.');
    };

    await audio.play();
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
    // If currently playing this message, stop it
    if (speakingMessageId === messageId) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setSpeakingMessageId(null);
      return;
    }

    // Stop any existing audio playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsTtsLoading(messageId);
    setErrorNotice(null);

    try {
      // Replaying a message reuses its audio instead of calling the TTS API again.
      const cacheKey = `${language}:${messageId}`;
      const cached = ttsCacheRef.current.get(cacheKey);
      if (cached) {
        playAudio(cached, messageId);
        return;
      }

      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to convert text to speech');
      }

      // The API returns raw audio; play it from an object URL (freed when leaving the page).
      const audioSrc = URL.createObjectURL(await response.blob());
      ttsCacheRef.current.set(cacheKey, audioSrc);
      await playAudio(audioSrc, messageId);
    } catch (err) {
      console.error('TTS error:', err);
      setErrorNotice((err instanceof Error && err.message) || 'Failed to generate voice speech.');
      setIsTtsLoading(null);
      setSpeakingMessageId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Header with Multilingual Voice Badges */}
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sarvam Indic Voice (STT & TTS)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OpenAI Reasoning</span>
          </div>
        </div>
      </div>

      {/* Error / Warning Notice */}
      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Notice:</span> {errorNotice}
          </div>
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {displayedMessages.map((m) => {
          const isUser = m.role === 'user';
          const isSpeaking = speakingMessageId === m.id;
          const isAudioLoading = isTtsLoading === m.id;

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
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-white" />}
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

                {/* Sourced Reference Links */}
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

                {/* Controls: Listen Spoken Response (Sarvam TTS), Timestamp & Copy */}
                <div
                  className={`mt-2 flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 ${
                    isUser ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>

                  <div className="flex items-center gap-3">
                    {/* Speak Button for Assistant Messages */}
                    {!isUser && (
                      <button
                        onClick={() => handlePlayAudio(m.id, m.content)}
                        disabled={isAudioLoading}
                        className={`flex items-center gap-1 font-semibold transition-colors ${
                          isSpeaking
                            ? 'text-rose-400 animate-pulse'
                            : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                        title={isSpeaking ? 'Stop Spoken Audio' : 'Listen via Sarvam AI Voice'}
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Stop Voice</span>
                          </>
                        ) : isAudioLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                            <span>Synthesizing...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="hover:text-slate-200 flex items-center gap-1 transition-colors"
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

        {/* Transcribing Voice Indicator */}
        {isTranscribing && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-2 shadow-lg">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Transcribing audio with Sarvam Indic ASR ({language.toUpperCase()})...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Review & Edit Confirmation Box (Prevents accidental submits) */}
      {voiceReviewText !== null && (
        <div className="bg-[#0f172a] border border-emerald-500/50 rounded-2xl p-4 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Edit3 className="w-4 h-4" />
              <span>Review & Edit Voice Transcription ({language.toUpperCase()})</span>
            </div>
            <button
              onClick={() => setVoiceReviewText(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Sarvam AI transcribed your speech. You can edit the text below before asking the AI companion:
          </p>
          <textarea
            rows={2}
            value={voiceReviewText}
            onChange={(e) => setVoiceReviewText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setInput(voiceReviewText);
                setVoiceReviewText(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Move to Input
            </button>
            <button
              onClick={() => handleSendMessage(voiceReviewText)}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm & Send</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Suggested Questions Pill Bar */}
      {messages.length <= 1 && !voiceReviewText && (
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

      {/* Input Box with Voice Recorder Mic Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center gap-2 pt-2"
      >
        {/* Voice Recording Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading || isTranscribing}
          className={`p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
          }`}
          title={isRecording ? 'Click to Stop Recording' : 'Hold / Click to Speak (Sarvam Indic Voice)'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? 'Listening... Click mic to finish recording.' : t.assistant.placeholder}
          disabled={loading || isRecording}
          className="flex-1 bg-[#0f172a] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none shadow-lg disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading || isRecording}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-4 py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
