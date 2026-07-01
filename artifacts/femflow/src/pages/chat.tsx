import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/translations";
import { useListAiMessages, useSendAiMessage, getListAiMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";

export default function Chat() {
  const { language } = useAuth();
  const t = useTranslation(language).chat;
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();
  
  const { data: messages = [] } = useListAiMessages();
  const sendMessage = useSendAiMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sendMessage.isPending) return;
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        setInput("");
        queryClient.invalidateQueries({ queryKey: getListAiMessagesQueryKey() });
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur z-10">
        <h1 className="text-lg font-serif font-bold">{t.title}</h1>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !sendMessage.isPending && (
          <div className="flex flex-col items-center text-center px-4 pt-8 animate-in fade-in duration-500">
            <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mb-6 text-white shadow-md shadow-primary/25">
              <Sparkles className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-serif font-bold text-foreground mb-2">{t.emptyTitle}</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">{t.emptySubtitle}</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {t.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-start text-sm px-4 py-3 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-secondary-foreground rounded-bl-sm'}`}>
              <p className="text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground p-3 rounded-2xl rounded-bl-sm max-w-[80%]">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t border-border flex gap-2 pb-safe">
        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder={t.placeholder}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="rounded-full bg-secondary border-none h-12 px-4"
        />
        <Button onClick={() => handleSend()} disabled={sendMessage.isPending || !input.trim()} size="icon" className="rounded-full h-12 w-12 shrink-0">
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}