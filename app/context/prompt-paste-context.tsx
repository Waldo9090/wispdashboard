'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PromptPasteContextType {
  setPromptSetter: ((setter: ((text: string) => void) | null) => void) | null;
  historyOpen: boolean;
  isPromptsOpen: boolean;
  isToolsOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  setIsPromptsOpen: (open: boolean) => void;
  setIsToolsOpen: (open: boolean) => void;
}

const PromptPasteContext = createContext<PromptPasteContextType>({
  setPromptSetter: null,
  historyOpen: false,
  isPromptsOpen: false,
  isToolsOpen: false,
  setHistoryOpen: () => {},
  setIsPromptsOpen: () => {},
  setIsToolsOpen: () => {}
});

export function usePromptPaste() {
  const context = useContext(PromptPasteContext);
  if (!context) {
    throw new Error('usePromptPaste must be used within a PromptPasteProvider');
  }
  return context;
}

interface PromptPasteProviderProps {
  children: ReactNode;
}

export function PromptPasteProvider({ children }: PromptPasteProviderProps) {
  const [promptSetter, setPromptSetter] = useState<((text: string) => void) | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  return (
    <PromptPasteContext.Provider
      value={{
        setPromptSetter,
        historyOpen,
        isPromptsOpen,
        isToolsOpen,
        setHistoryOpen,
        setIsPromptsOpen,
        setIsToolsOpen
      }}
    >
      {children}
    </PromptPasteContext.Provider>
  );
} 