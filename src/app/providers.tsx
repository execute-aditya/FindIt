'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        containerClassName="toast-container"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#191c1e',
            borderRadius: '12px',
            boxShadow: '0 12px 32px -4px rgba(0,38,83,0.12)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: '1px solid rgba(196,198,208,0.3)',
          },
          success: {
            iconTheme: { primary: '#006a6a', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ba1a1a', secondary: '#ffffff' },
          },
        }}
      />
    </SessionProvider>
  );
}
