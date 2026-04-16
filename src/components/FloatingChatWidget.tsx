import { useState } from 'react';
import { Bot, X, Maximize2, Minimize2 } from 'lucide-react';
import ClawbotChat from './ClawbotChat';

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out ${
            isExpanded
              ? 'inset-0'
              : 'bottom-20 right-4 w-[380px] h-[600px] max-h-[80vh] rounded-2xl shadow-2xl border border-border overflow-hidden'
          }`}
        >
          {/* Expand/close controls */}
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            <button
              onClick={() => { setIsOpen(false); setIsExpanded(false); }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <ClawbotChat />
        </div>
      )}

      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
          title="Open AI Agent"
        >
          <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gain border-2 border-background animate-pulse" />
        </button>
      )}
    </>
  );
};

export default FloatingChatWidget;
