import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ws': {
        target: 'wss://testnet-rpc.monad.xyz',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
        secure: true
      },
      '/api': {
        target: 'https://testnet.edgex.exchange',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
        secure: true
      }
    },
  },
  publicDir: 'public', 
});
