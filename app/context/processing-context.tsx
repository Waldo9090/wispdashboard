'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProcessingStatus {
  id: string;
  fileName: string;
  status: string;
  progress?: number;
  statusMessage?: string;
}

interface ProcessingContextType {
  activeProcessing: ProcessingStatus[];
  addProcessing: (id: string, fileName: string) => void;
  updateProcessing: (id: string, status: string, progress?: number, statusMessage?: string) => void;
  removeProcessing: (id: string) => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [activeProcessing, setActiveProcessing] = useState<ProcessingStatus[]>([]);

  const addProcessing = (id: string, fileName: string) => {
    setActiveProcessing(prev => [...prev, {
      id,
      fileName,
      status: 'starting',
      statusMessage: 'Preparing to process file...'
    }]);
  };

  const updateProcessing = (id: string, status: string, progress?: number, statusMessage?: string) => {
    setActiveProcessing(prev => prev.map(p => 
      p.id === id 
        ? { ...p, status, progress, statusMessage }
        : p
    ));
  };

  const removeProcessing = (id: string) => {
    setActiveProcessing(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProcessingContext.Provider value={{
      activeProcessing,
      addProcessing,
      updateProcessing,
      removeProcessing
    }}>
      {children}
    </ProcessingContext.Provider>
  );
} 