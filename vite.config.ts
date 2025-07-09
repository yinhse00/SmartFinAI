
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    proxy: {
      '/api/grok': {
        target: 'https://petoxjdikxxugbrzajpj.supabase.co/functions/v1/grok-proxy',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/grok/, ''),
        secure: true,
        timeout: 600000,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', function(proxyRes, req, res) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key-Rotation, X-Request-ID, X-Batch-Request';
            proxyRes.headers['Access-Control-Max-Age'] = '86400';
            
            if (req.method === 'OPTIONS') {
              if (!res.headersSent) {
                res.writeHead(200, {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                  'Access-Control-Max-Age': '86400'
                });
                res.end();
              }
            }
          });
          
          proxy.on('proxyReq', function(proxyReq, req) {
            proxyReq.setHeader('Origin', 'https://api.x.ai'); 
            proxyReq.setHeader('Referer', 'https://api.x.ai/'); 
          });
        }
      },
      '/api/grok/search': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/grok\/search/, '/v1/search'),
        secure: true,
        timeout: 30000,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', function(proxyRes, req, res) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
