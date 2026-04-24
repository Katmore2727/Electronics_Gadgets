import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, MessageCircleMore, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatWindow from './ChatWindow.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { getChatSamples, streamChatMessage } from '../../services/api/chatService.js';

const STORAGE_KEY = 'Yashub-chat-session';

const defaultSuggestions = [
  'Find me noise-cancelling headphones under 5000',
  'Compare the best budget laptops',
  'What can I buy for gaming under 60000?',
  'How do I track my order?',
];
const SUGGESTION_COUNT = 4;

const buildId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const serializeConversation = (messages) =>
  messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

export default function Chatbot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, refreshCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [allSampleQuestions, setAllSampleQuestions] = useState(defaultSuggestions);
  const abortRef = useRef(null);

  const buildRotatedSuggestions = (pool, current, clickedSuggestion) => {
    const uniquePool = Array.from(new Set((pool || []).filter(Boolean)));
    const withoutClicked = current.filter((item) => item !== clickedSuggestion);
    if (withoutClicked.length > 1) {
      return withoutClicked;
    }

    const refillPool = uniquePool.filter(
      (item) => item !== clickedSuggestion && !withoutClicked.includes(item)
    );

    const next = [...withoutClicked];
    for (const question of refillPool) {
      if (next.length >= SUGGESTION_COUNT) {
        break;
      }
      next.push(question);
    }

    return next;
  };

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 640);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.messages)) {
        setMessages(parsed.messages);
      }
      if (Array.isArray(parsed.suggestions) && parsed.suggestions.length) {
        setSuggestions(parsed.suggestions);
      }
      if (Array.isArray(parsed.allSampleQuestions) && parsed.allSampleQuestions.length) {
        setAllSampleQuestions(parsed.allSampleQuestions);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    getChatSamples()
      .then(({ data }) => {
        if (Array.isArray(data.data) && data.data.length) {
          setAllSampleQuestions(data.data);
          setSuggestions((current) =>
            current.length ? current : data.data.slice(0, SUGGESTION_COUNT)
          );
        }
      })
      .catch(() => {
        setSuggestions(defaultSuggestions);
        setAllSampleQuestions(defaultSuggestions);
      });
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages,
        suggestions,
        allSampleQuestions,
      })
    );
  }, [messages, suggestions, allSampleQuestions]);

  useEffect(() => {
    const handler = (event) => {
      setIsOpen((current) => event.detail?.open ?? !current);
      if (event.detail?.prefill) {
        setInput(event.detail.prefill);
      }
    };

    window.addEventListener('chatbot:toggle', handler);
    return () => window.removeEventListener('chatbot:toggle', handler);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleAction = async (action) => {
    if (!action) {
      return;
    }

    if (action.requiresAuth && !user) {
      toast.error('Please login to use this chatbot action.');
      navigate('/login');
      return;
    }

    if (action.type === 'navigate' || action.type === 'product') {
      navigate(action.target);
      setIsOpen(false);
      return;
    }

    if (action.type === 'cart:add') {
      const result = await addItem(action.productId, action.quantity || 1);
      if (result?.success) {
        await refreshCart();
        toast.success('Added to cart from chat');
      }
    }
  };

  const sendMessage = async (text) => {
    const message = text.trim();
    if (!message || sending) {
      return;
    }

    const userMessage = {
      id: buildId(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };

    const assistantMessageId = buildId();
    const assistantPlaceholder = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      products: [],
      actions: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage, assistantPlaceholder]);
    setInput('');
    setSending(true);
    setIsOpen(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChatMessage({
        message,
        conversation: serializeConversation(messages),
        signal: controller.signal,
        onEvent: (eventName, payload) => {
          if (eventName === 'meta') {
            if (Array.isArray(payload.sampleQuestions) && payload.sampleQuestions.length) {
              setAllSampleQuestions(payload.sampleQuestions);
            } else if (payload.suggestions?.length) {
              setSuggestions(payload.suggestions);
            }
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      products: payload.products || [],
                      actions: payload.actions || [],
                    }
                  : item
              )
            );
          }

          if (eventName === 'token') {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: `${item.content}${payload.token || ''}`,
                    }
                  : item
              )
            );
          }

          if (eventName === 'done') {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: payload.content || item.content,
                      products: payload.meta?.products || item.products || [],
                      actions: payload.meta?.actions || item.actions || [],
                      isStreaming: false,
                    }
                  : item
              )
            );
          }

          if (eventName === 'error') {
            toast.error(payload.message || 'Chatbot request failed.');
          }
        },
      });
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                content:
                  error.message ||
                  'I ran into an issue while answering that. Please try again in a moment.',
                isStreaming: false,
              }
            : item
        )
      );
      toast.error(error.message || 'Failed to connect to the chatbot.');
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    await sendMessage(input);
  };

  const handleSuggestionClick = async (suggestion) => {
    setSuggestions((current) =>
      buildRotatedSuggestions(allSampleQuestions, current, suggestion)
    );
    await sendMessage(suggestion);
  };

  return (
    <>
      <ChatWindow
        isOpen={isOpen}
        isMobile={isMobile}
        user={user}
        messages={messages}
        input={input}
        setInput={setInput}
        sending={sending}
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
        onClose={() => setIsOpen(false)}
        onAction={handleAction}
      />

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-[60] inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-slate-950 shadow-xl shadow-cyan-500/30 transition hover:scale-[1.03] hover:shadow-cyan-500/40 sm:bottom-6 sm:right-6"
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircleMore className="h-6 w-6" />}
      </button>

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-5 z-50 hidden rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-xl transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300 sm:flex sm:right-6"
        >
          <Bot className="mr-2 h-4 w-4" />
          Ask AI
        </button>
      )}
    </>
  );
}
