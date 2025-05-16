
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true, // Enable CORS for dev server
    proxy: {
      '/api/grok': {
        target: 'https://api.x.ai',  // Updated target URL for Grok API
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/grok/, '/v1'),
        secure: true,
        timeout: 600000, // 10 minute timeout for large file processing
        configure: (proxy, _options) => {
          // Handle CORS headers properly
          proxy.on('proxyRes', function(proxyRes, req, res) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-API-Key-Rotation, X-Request-ID, X-Batch-Request';
            proxyRes.headers['Access-Control-Max-Age'] = '86400';
            
            // Handle preflight requests
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
          
          // Forward necessary headers
          proxy.on('proxyReq', function(proxyReq, req) {
            proxyReq.setHeader('Origin', 'https://api.x.ai'); 
            proxyReq.setHeader('Referer', 'https://api.x.ai/'); 
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
