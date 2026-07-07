import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLang } from '../context/LanguageContext';
import { trpc } from '@/providers/trpc';
import { Sparkles, Send, Paperclip, ChevronLeft } from 'lucide-react';

type SuggestedFactory = {
  id: number;
  name: string;
  location: string;
  rating: number;
};

type ChatMessage = {
  id: string;
  type: 'user' | 'ai';
  text: string;
  factories?: SuggestedFactory[];
};

export default function AIChatScreen() {
  const { goBack, navigate } = useApp();
  const { t } = useLang();
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: history } = trpc.chat.history.useQuery(undefined, { retry: false });

  const utils = trpc.useUtils();
  const sendMsg = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setIsTyping(false);
      utils.chat.history.invalidate();
      setLocalMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: data.response,
        factories: data.factories ?? [],
      }]);
    },
    onError: () => setIsTyping(false),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [localMessages, isTyping]);

  useEffect(() => {
    if (history && history.length > 0 && localMessages.length === 0) {
      const mapped = history.map((m: any) => ({
        id: `hist-${m.id}`,
        type: (m.role === 'assistant' ? 'ai' : 'user') as 'user' | 'ai',
        text: m.content,
        factories: m.factoriesSuggested,
      }));
      setLocalMessages(mapped);
    }
  }, [history, localMessages.length]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setLocalMessages(prev => [...prev, { id: `user-${Date.now()}`, type: 'user', text }]);
    setInput('');
    setIsTyping(true);
    sendMsg.mutate({ message: text });
  };

  const suggestions = ['ai.suggestion1', 'ai.suggestion2', 'ai.suggestion3'];

  const showWelcome = localMessages.length === 0;

  return (
    <div className="h-full w-full flex flex-col animate-slide-up" style={{ background: '#0A1628' }}>
      <div className="pt-12 px-5 pb-3 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid #1A2744' }}>
        <button onClick={goBack} style={{ color: '#94A3B8' }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center animate-ai-pulse" style={{ background: 'rgba(66, 165, 245, 0.15)' }}>
          <Sparkles className="w-5 h-5" style={{ color: '#42A5F5' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{t('ai.title')}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#66BB6A' }} />
            <span className="text-[11px]" style={{ color: '#66BB6A' }}>{t('ai.online')}</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 flex flex-col gap-4">
        {showWelcome && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(66, 165, 245, 0.1)' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#42A5F5' }} />
            </div>
            <p className="text-sm text-center max-w-[250px]" style={{ color: '#94A3B8' }}>
              {t('ai.welcome')}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSend(t(s))} disabled={sendMsg.isPending} className="px-3 py-2 rounded-full text-xs font-medium card-bounce disabled:opacity-50" style={{ background: '#1A2744', color: '#42A5F5', border: '1px solid rgba(66, 165, 245, 0.2)' }}>
                  {t(s)}
                </button>
              ))}
            </div>
          </div>
        )}

        {localMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-1' : ''}`}>
              {msg.type === 'ai' && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(66, 165, 245, 0.1)' }}>
                    <Sparkles className="w-3 h-3" style={{ color: '#42A5F5' }} />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: '#94A3B8' }}>{t('ai.assistant')}</span>
                </div>
              )}
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.type === 'user'
                    ? { background: '#E53935', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: '#0F1D32', color: '#F1F5F9', borderBottomLeftRadius: 4, border: '1px solid #1A2744' }
                }
              >
                {msg.text}
              </div>
              {msg.factories && msg.factories.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {msg.factories.map((f: any) => (
                    <button key={f.id} onClick={() => navigate('factoryProfile', String(f.id))} className="flex items-center gap-3 p-3 rounded-xl text-left card-bounce" style={{ background: '#0F1D32', border: '1px solid #1A2744' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1A2744' }}>
                        <span className="text-xs font-bold" style={{ color: '#F9A825' }}>{Math.round(f.rating * 20)}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{f.name}</p>
                        <p className="text-[10px]" style={{ color: '#94A3B8' }}>{f.location}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: '#0F1D32', border: '1px solid #1A2744', borderBottomLeftRadius: 4 }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full typing-dot-1" style={{ background: '#94A3B8' }} />
                <span className="w-2 h-2 rounded-full typing-dot-2" style={{ background: '#94A3B8' }} />
                <span className="w-2 h-2 rounded-full typing-dot-3" style={{ background: '#94A3B8' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-6 pt-2 flex-shrink-0" style={{ borderTop: '1px solid #1A2744' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#1A2744' }}
          >
            <Paperclip className="w-5 h-5" style={{ color: '#94A3B8' }} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLocalMessages(prev => [...prev, { id: `file-${Date.now()}`, type: 'user', text: `Attached: ${file.name}` }]);
              e.target.value = '';
            }}
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={t('ai.inputPlaceholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !sendMsg.isPending && handleSend(input)}
              className="w-full h-11 rounded-full px-4 pr-12 text-sm text-white outline-none animate-ai-glow focus:animate-none"
              style={{ background: '#1A2744', border: '1px solid #243352' }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={sendMsg.isPending || !input.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"
              style={{ background: '#E53935' }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
