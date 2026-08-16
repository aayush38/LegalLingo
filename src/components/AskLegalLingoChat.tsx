'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, X, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/lib/types';
import { applyPrivacyMask } from '@/lib/privacy';

export const AskLegalLingoChat: React.FC = () => {
  const { currentAnalysis, isChatOpen, setIsChatOpen, privacyShield, language } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Namaste! I am LegalLingo AI Assistant. Ask me any question about your uploaded document, legal terms, missing details, or government schemes.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  if (!isChatOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Generate contextual AI response
    setTimeout(() => {
      let aiResponseText = '';
      const lower = query.toLowerCase();

      if (lower.includes('risk') || lower.includes('danger') || lower.includes('धोका') || lower.includes('खतरा')) {
        aiResponseText =
          'The primary financial risk in this document is Clause 3 (Cancellation Clause). If the buyer misses the August 30th payment deadline, the seller Ramesh Patil can forfeit 50% of the advance deposit (₹75,000). Consider requesting a 30-day grace period.';
      } else if (lower.includes('owner') || lower.includes('owns') || lower.includes('मालक')) {
        aiResponseText =
          'According to the document, Mr. Ramesh Vithal Patil claims sole ownership of Gat No. 142/3 (1.20 Hectares) in Village Khed, Pune. You should verify this via Mahabhulekh 7/12 portal.';
      } else if (lower.includes('missing') || lower.includes('incomplete')) {
        aiResponseText =
          'Two main items are unclear: 1) The exact survey sub-number, and 2) Witness 2 identity details are incomplete. Ensure both are clarified before signing.';
      } else if (lower.includes('marathi') || lower.includes('मराठी')) {
        aiResponseText =
          'हा दस्तऐवज रमेश पाटील आणि सुरेश जाधव यांच्यातील ₹८,५०,००० च्या शेतजमीन विक्रीचा करार आहे. ऑगस्ट ३० पूर्वी उर्वरित ₹७ लाख जमा न केल्यास ५०% अ‍ॅडव्हान्स जप्त होऊ शकतो.';
      } else {
        aiResponseText =
          `Based on the uploaded ${currentAnalysis?.documentType || 'document'}, the total transaction amount is ${
            currentAnalysis?.fiveQuestions.totalAmount || '₹8,50,000'
          }. Always consult Mahabhulekh 7/12 or a local legal advisor for final verification.`;
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    }, 600);
  };

  // Voice Input SpeechRecognition API
  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser window.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

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
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const samplePrompts = [
    'What is risky here?',
    'Who owns the land according to this agreement?',
    'Is any information missing?',
    'Explain this in Marathi',
    'Which government service can help me verify this land?'
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full sm:w-[420px] max-w-[calc(100vw-2rem)] h-[580px] bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 flex flex-col overflow-hidden animate-slide-up">
      
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-none">Ask LegalLingo AI</h3>
            <span className="text-[10px] text-emerald-200 font-semibold">
              RAG Document Context Active
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(false)}
          className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-2.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none text-xs">
        <span className="text-[10px] font-bold text-emerald-800 uppercase px-1">Quick:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-950 font-bold rounded-full hover:bg-emerald-100 transition-colors shadow-2xs"
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
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm relative ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white border border-emerald-100 text-slate-800 rounded-tl-none'
                }`}
              >
                {displayedText}

                {/* TTS Button on Assistant responses */}
                {!isUser && (
                  <button
                    onClick={() => speakAudio(msg.id, displayedText)}
                    className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-emerald-100"
                  >
                    {isSpeakingId === msg.id ? (
                      <>
                        <VolumeX className="w-3 h-3 text-emerald-600" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-emerald-600" /> Listen 🔊
                      </>
                    )}
                  </button>
                )}
              </div>

              <span className="text-[9px] font-semibold text-gray-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Controls */}
      <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
        {/* Voice Input Button */}
        <button
          onClick={startVoiceInput}
          className={`p-2.5 rounded-full transition-colors ${
            isListening
              ? 'bg-red-600 text-white animate-bounce'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
          title="Ask by Voice 🎙"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? 'Listening...' : 'Type or ask by voice...'}
          className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        />

        <button
          onClick={() => handleSend()}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform active:scale-95 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
