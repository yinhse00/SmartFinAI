
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/grok': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/grok/, '/v1'),
        secure: true,
        timeout: 600000, // Increased timeout to 10 minutes for large file processing
        configure: (proxy, _options) => {
          // Enhanced CORS handling for proxy
          proxy.on('proxyReq', function(proxyReq) {
            proxyReq.setHeader('X-Financial-Expert', 'true');
            proxyReq.setHeader('X-Long-Response', 'true');
            proxyReq.setHeader('Origin', 'https://api.x.ai'); // Add origin to help with CORS
            proxyReq.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Source, X-Request-ID');
          });
          
          // More detailed error logging for proxy issues
          proxy.on('error', function(err, req, _res) {
            console.log('Financial expert proxy error:', err);
            console.log('Request details:', {
              url: req.url,
              method: req.method,
              headers: req.headers['x-request-source'] || 'none'
            });
          });
          
          // Detailed success logging
          proxy.on('proxyRes', function(proxyRes, req, res) {
            console.log(`Proxy response from ${req.url}: ${proxyRes.statusCode}`);
            
            // Enhance CORS headers in the response
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Request-Source, X-Request-ID';
          });
          
          // Handle preflight OPTIONS requests
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.method === 'OPTIONS') {
              // Respond directly to OPTIONS requests with proper CORS headers
              proxyReq.setHeader('Access-Control-Allow-Origin', '*');
              proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              proxyReq.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
            }
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
