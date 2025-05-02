
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
        timeout: 600000, // 10 minute timeout for large file processing
        configure: (proxy, _options) => {
          // Add additional headers that might help with CORS
          proxy.on('proxyReq', function(proxyReq, req) {
            proxyReq.setHeader('X-Financial-Expert', 'true');
            proxyReq.setHeader('X-Long-Response', 'true');
            proxyReq.setHeader('Origin', 'https://api.x.ai'); // Match target origin
            proxyReq.setHeader('Referer', 'https://api.x.ai/'); // Add referer for some APIs
            proxyReq.setHeader('Access-Control-Allow-Origin', '*'); // Try to allow CORS
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key-Rotation');
            
            // Forward custom headers from the original request if present
            const originalRequest = req as any;
            if (originalRequest.headers && originalRequest.headers['x-request-id']) {
              proxyReq.setHeader('X-Request-ID', originalRequest.headers['x-request-id']);
            }
            
            if (originalRequest.headers && originalRequest.headers['x-api-key-rotation']) {
              proxyReq.setHeader('X-API-Key-Rotation', originalRequest.headers['x-api-key-rotation']);
            }
            
            if (originalRequest.headers && originalRequest.headers['x-batch-request']) {
              proxyReq.setHeader('X-Batch-Request', originalRequest.headers['x-batch-request']);
            }
          });
          
          // Better error handling for debugging
          proxy.on('error', function(err, req, res) {
            console.error('Proxy error:', err);
            
            // Attempt to send a structured response on error
            if (!res.headersSent && res.writeHead) {
              res.writeHead(500, {
                'Content-Type': 'application/json'
              });
              
              const errorResponse = {
                error: true,
                message: 'Proxy error occurred: ' + (err.message || 'Unknown error'),
                code: 'PROXY_ERROR'
              };
              
              if (res.end) {
                res.end(JSON.stringify(errorResponse));
              }
            }
          });
          
          // Log detailed response info
          proxy.on('proxyRes', function(proxyRes, req, res) {
            const status = proxyRes.statusCode;
            console.log(`Proxy response from ${req.url}: ${status}`);
            
            // Log headers for debugging
            if (status !== 200) {
              console.log('Response headers:', proxyRes.headers);
            }
            
            // Handle CORS preflight
            if (req.method === 'OPTIONS') {
              if (res.writeHead && !res.headersSent) {
                res.writeHead(200, {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key-Rotation, X-Request-ID, X-Batch-Request',
                  'Access-Control-Max-Age': '86400'
                });
              }
              if (res.end && !res.writableEnded) {
                res.end();
              }
            }
            
            // Check for too many requests (rate limiting)
            if (status === 429) {
              console.error('API rate limit exceeded. Consider adding more API keys or implementing a delay between requests.');
            }
            
            // Check for timeout errors
            if (status === 504) {
              console.error('Gateway timeout. The request took too long to complete. Consider breaking content into smaller batches.');
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
