import ReactMarkdown from 'react-markdown';
import {
  ArrowRight,
  Bot,
  LoaderCircle,
  Package,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from 'lucide-react';

const bubbleBase =
  'max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ring-1 backdrop-blur-sm';

const formatPrice = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

function EmptyState({ suggestions, onSuggestionClick, user }) {
  return (
    <div className="flex h-full flex-col justify-center px-6 py-10">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {user ? `Hi ${user.firstName}, try one of these` : 'Try one of these questions'}
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Tap any sample question to see an instant chatbot answer.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className="w-fit max-w-full rounded-full bg-slate-900 px-5 py-3 text-left text-sm font-medium text-slate-100 transition hover:bg-cyan-500 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-cyan-400 dark:hover:text-slate-950"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, onAction }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-contain p-1.5" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <Package className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {product.brand || product.category || 'TechHub'}
          </p>
          <h4 className="break-words text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">
            {product.name}
          </h4>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Currently out of stock'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onAction({ type: 'product', target: `/products/${product.id}` })}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
        >
          View
        </button>
        <button
          type="button"
          onClick={() =>
            onAction({
              type: 'cart:add',
              productId: product.id,
              quantity: 1,
              requiresAuth: true,
            })
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message, onAction }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-full">
        <div className={`mb-2 flex items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 ${isAssistant ? '' : 'justify-end'}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          </span>
          <span>{isAssistant ? 'TechHub Copilot' : 'You'}</span>
        </div>
        <div
          className={`${bubbleBase} ${
            isAssistant
              ? 'bg-white/95 text-slate-800 ring-slate-200 dark:bg-slate-900/95 dark:text-slate-100 dark:ring-slate-700'
              : 'ml-auto bg-cyan-500 text-slate-950 ring-cyan-400/40'
          }`}
        >
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Thinking...
            </div>
          ) : (
            <div className="space-y-2 break-words text-sm leading-6 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] dark:[&_code]:bg-slate-800 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-950 [&_pre]:p-3 [&_pre]:text-slate-100 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-200 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5 dark:[&_td]:border-slate-700 dark:[&_th]:border-slate-700">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {isAssistant && Boolean(message.products?.length) && (
          <div className="mt-3 grid gap-3">
            {message.products.map((product) => (
              <ProductCard key={product.id} product={product} onAction={onAction} />
            ))}
          </div>
        )}

        {isAssistant && Boolean(message.actions?.length) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <button
                key={`${action.type}-${action.label}-${action.target || action.productId || ''}`}
                type="button"
                onClick={() => onAction(action)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
              >
                {action.type === 'cart:add' ? <ShoppingCart className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({
  isOpen,
  isMobile,
  user,
  messages,
  suggestions,
  onSuggestionClick,
  onClose,
  onAction,
}) {
  return (
    <section
      className={`fixed bottom-0 right-0 z-[70] flex flex-col overflow-hidden border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/20 backdrop-blur-xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-950/95 ${
        isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      } ${isMobile ? 'inset-0 rounded-none' : 'bottom-24 right-4 h-[42rem] w-[25rem] rounded-[2rem] sm:right-6 sm:w-[27rem]'}`}
    >
      <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900/90 px-5 py-4 text-white dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-200">
              <Bot className="h-4 w-4" />
              Yashub Copilot
            </div>
            <h2 className="mt-1 text-lg font-semibold">Shopping help, product answers, order guidance</h2>
            <p className="mt-1 text-xs text-slate-300">
              {user
                ? `Personalized with account context for user #${user.id}`
                : 'Guest mode enabled. Log in for cart and order support.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Close chatbot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-4 py-4 dark:bg-slate-950">
        {messages.length === 0 ? (
          <EmptyState suggestions={suggestions} onSuggestionClick={onSuggestionClick} user={user} />
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onAction={onAction} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white/95 p-4 dark:border-slate-800 dark:bg-slate-950/95">
        {Boolean(suggestions?.length) && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
