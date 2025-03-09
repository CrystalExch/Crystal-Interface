import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Buffer } from 'buffer';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import App from './App.tsx';
import { config } from './wagmi.ts';

import { LanguageProvider } from './contexts/LanguageContext';
import { SharedContextProvider } from './contexts/SharedContext.tsx';
import GlobalInitializer from './GlobalInitializer.tsx';

import './index.css';

globalThis.Buffer = Buffer;

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <Router>
        <SharedContextProvider>
          <LanguageProvider>
            <GlobalInitializer />
            <App />
          </LanguageProvider>
        </SharedContextProvider>
      </Router>
    </QueryClientProvider>
  </WagmiProvider>,
);
