import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');


  return {
    plugins: [react()],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    server: mode === 'development' ? {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/shared': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    } : undefined,
  };
});