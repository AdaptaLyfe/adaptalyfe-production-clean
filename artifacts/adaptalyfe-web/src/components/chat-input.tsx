import { useState, useCallback } from "react";
import { useSafeRef } from "@/hooks/useSafeRef";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ onSendMessage, disabled = false, placeholder = "Type your message...", className = "" }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useSafeRef<HTMLInputElement | null>(null);

  const handleSubmit = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Refocus input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [message, disabled, onSendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1"
      />
      <Button 
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        size="sm"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}