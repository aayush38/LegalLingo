'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, X, Sparkles, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/lib/types';
import { applyPrivacyMask } from '@/lib/privacy';
import { getTranslatedExplanation } from '@/lib/ai';
import { getTranslation } from '@/lib/translations';

export const AskLegalLingoChat: React.FC = () => {
  const { currentAnalysis, isChatOpen, setIsChatOpen, selectedClause, setSelectedClause, privacyShield, language, translationCache } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: getTranslation('chatWelcomeMessage', language),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen, isSending]);

  if (!isChatOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textToSend) setInputText('');
    setIsSending(true);

    let answerText: string;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          history: nextMessages.slice(0, -1).map((m) => ({ sender: m.sender, text: m.text })),
          documentContext: currentAnalysis || null,
          selectedClause: selectedClause || null,
          language
        })
      });

      if (res.ok) {
        const data = await res.json();
        answerText = data.answer || getTranslation('chatFallbackError', language);
      } else {
        answerText = getTranslation('chatFallbackError', language);
      }
    } catch (e) {
      console.warn('[AskLegalLingoChat] /api/chat request failed:', e);
      answerText = getTranslation('chatFallbackError', language);
    }

    const assistantMsg: ChatMessage = {
      id: `ast-${Date.now()}`,
      sender: 'assistant',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsSending(false);
  };

  // Voice Input SpeechRecognition API
  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(getTranslation('speechRecognitionUnsupported', language));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'gu' ? 'gu-IN' : 'en-US';

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
      handleSend(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Text-To-Speech SpeechSynthesis API
  const speakAudio = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'mr') utterance.lang = 'mr-IN';
    else if (language === 'gu') utterance.lang = 'gu-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const samplePrompts = [
    ...(selectedClause
      ? [
          `${getTranslation('whatThisMeansLabel', language)} ${getTranslatedExplanation(selectedClause.clauseTitle, language, translationCache)}`,
          `${getTranslation('whyItMatters', language)}?`
        ]
      : []),
    getTranslation('promptWhatIsRisky', language),
    getTranslation('promptWhoOwns', language),
    getTranslation('promptMissingInfo', language),
    getTranslation('promptExplainMarathi', language),
    getTranslation('promptGovtService', language)
  ];

  return (
    <div className="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-4 sm:right-4 z-50 w-auto sm:w-[420px] lg:w-[28vw] lg:min-w-[340px] lg:max-w-[480px] h-[88vh] sm:h-[70vh] sm:min-h-[520px] sm:max-h-[720px] bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 flex flex-col overflow-hidden animate-slide-up">
      
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 p-3.5 sm:p-4 text-white flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg leading-tight">{getTranslation('askLegalLingoAiTitle', language)}</h3>
            <span className="text-[11px] text-emerald-100 font-medium block">
              {getTranslation('chatbotLauncherLabel', language)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsChatOpen(false)}
          aria-label={getTranslation('closeLabel', language)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Selected Clause Context Banner (If Active) */}
      {selectedClause && (
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
              selectedClause.riskLevel === 'high'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : selectedClause.riskLevel === 'review'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {selectedClause.riskLevel === 'high'
                ? getTranslation('highAttention', language)
                : selectedClause.riskLevel === 'review'
                ? getTranslation('reviewNeeded', language)
                : getTranslation('standardWording', language)}
            </span>
            <span className="font-extrabold text-amber-950 truncate">
              {getTranslation('selectedClauseContext', language)}{' '}
              {getTranslatedExplanation(selectedClause.clauseTitle, language, translationCache)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedClause(null)}
            title={getTranslation('clearClauseContext', language)}
            aria-label={getTranslation('clearClauseContext', language)}
            className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-lg flex-shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Suggested Prompt Chips (Horizontally Scrollable) */}
      <div className="p-2.5 bg-emerald-50/90 border-b border-emerald-100 flex items-center gap-2 overflow-x-auto scrollbar-thin text-xs touch-pan-x flex-shrink-0">
        <span className="text-[10px] font-black text-emerald-800 uppercase px-2 py-1 bg-emerald-100/90 rounded-md flex-none select-none">
          {getTranslation('quickLabel', language)}
        </span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(p)}
            disabled={isSending}
            className="flex-none px-3.5 py-1.5 bg-white border border-emerald-200 text-emerald-950 font-bold rounded-full hover:bg-emerald-100 transition-colors shadow-2xs text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const displayedText = applyPrivacyMask(msg.text, privacyShield);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium shadow-sm relative ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white border border-emerald-100 text-slate-800 rounded-tl-none'
                }`}
              >
                {displayedText}

                {/* TTS Button on Assistant responses */}
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => speakAudio(msg.id, displayedText)}
                    className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-emerald-100 min-h-[36px] transition-colors cursor-pointer"
                  >
                    {isSpeakingId === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-emerald-600" /> {getTranslation('stopAudio', language)}
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> {getTranslation('listenAudio', language)}
                      </>
                    )}
                  </button>
                )}
              </div>

              <span className="text-[10px] font-semibold text-gray-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isSending && (
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] p-3.5 rounded-2xl text-xs bg-white border border-emerald-100 text-slate-500 rounded-tl-none shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Controls */}
      <div className="p-3 sm:p-3.5 bg-white border-t border-gray-200 flex items-center gap-2 flex-shrink-0">
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={startVoiceInput}
          aria-label={getTranslation('askByVoiceTooltip', language)}
          title={getTranslation('askByVoiceTooltip', language)}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            isListening
              ? 'bg-red-600 text-white animate-bounce'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? getTranslation('listeningPlaceholder', language) : getTranslation('typeOrAskPlaceholder', language)}
          disabled={isSending}
          className="flex-1 min-h-[44px] bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isSending || !inputText.trim()}
          aria-label="Send message"
          className="w-11 h-11 min-w-[44px] min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
