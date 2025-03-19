import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Buffer } from 'buffer';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import App from './App.tsx';
import { alchemyconfig } from './config.ts';
import { cookieToInitialState } from "@account-kit/core";
import { config } from './wagmi.ts'
import { AlchemyAccountProvider } from "@account-kit/react";
import { LanguageProvider } from './contexts/LanguageContext';
import { SharedContextProvider } from './contexts/SharedContext.tsx';
import GlobalInitializer from './GlobalInitializer.tsx';

import './index.css';

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const url = args[0];
  if (typeof url === "string" && url.includes("segment.io")) {
    return Promise.resolve(new Response(null, { status: 204 }));
  }
  return originalFetch(...args);
};

const initialState = cookieToInitialState(
  alchemyconfig,
);

globalThis.Buffer = Buffer;

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AlchemyAccountProvider config={alchemyconfig} queryClient={queryClient} initialState={initialState}>
      <WagmiProvider config={config}>
        <Router>
          <SharedContextProvider>
            <LanguageProvider>
              <GlobalInitializer />
              <App />
            </LanguageProvider>
          </SharedContextProvider>
        </Router>
      </WagmiProvider>
    </AlchemyAccountProvider>
  </QueryClientProvider>
);