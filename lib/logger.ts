// Server-side logging utility for terminal output
export const logger = {
  info: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      // Server-side logging
      console.log(`[INFO] ${message}`, data ? data : '')
    }
  },
  
  success: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`✅ ${message}`, data ? data : '')
    }
  },
  
  error: (message: string, error?: any) => {
    if (typeof window === 'undefined') {
      console.error(`❌ ${message}`, error ? error : '')
    }
  },
  
  warn: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.warn(`⚠️ ${message}`, data ? data : '')
    }
  },
  
  debug: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`🔍 ${message}`, data ? data : '')
    }
  },
  
  analytics: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`📊 ${message}`, data ? data : '')
    }
  },
  
  firestore: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`🔥 ${message}`, data ? data : '')
    }
  },
  
  process: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`🔄 ${message}`, data ? data : '')
    }
  },
  
  save: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`💾 ${message}`, data ? data : '')
    }
  },
  
  create: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`🚀 ${message}`, data ? data : '')
    }
  },
  
  user: (message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`👤 ${message}`, data ? data : '')
    }
  },
  
  step: (stepNumber: number, message: string, data?: any) => {
    if (typeof window === 'undefined') {
      console.log(`STEP ${stepNumber}: ${message}`, data ? data : '')
    }
  }
}

// Client-side logging (for browser console when needed)
export const clientLogger = {
  info: (message: string, data?: any) => {
    if (typeof window !== 'undefined') {
      console.log(`[INFO] ${message}`, data ? data : '')
    }
  },
  
  success: (message: string, data?: any) => {
    if (typeof window !== 'undefined') {
      console.log(`✅ ${message}`, data ? data : '')
    }
  },
  
  error: (message: string, error?: any) => {
    if (typeof window !== 'undefined') {
      console.error(`❌ ${message}`, error ? error : '')
    }
  },
  
  warn: (message: string, data?: any) => {
    if (typeof window !== 'undefined') {
      console.warn(`⚠️ ${message}`, data ? data : '')
    }
  },
  
  debug: (message: string, data?: any) => {
    if (typeof window !== 'undefined') {
      console.log(`🔍 ${message}`, data ? data : '')
    }
  }
} 