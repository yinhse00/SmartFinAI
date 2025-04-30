
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
        target: 'https://api.grok.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/grok/, ''),
        secure: true,
        timeout: 600000, // 10 minutes timeout for large file processing
        configure: (proxy, _options) => {
          proxy.on('proxyReq', function(proxyReq, req) {
            // Copy authorization header from client request
            const authHeader = req.headers['authorization'];
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
            
            // Add required headers for API request
            proxyReq.setHeader('X-Financial-Expert', 'true');
            proxyReq.setHeader('X-Long-Response', 'true');
            proxyReq.setHeader('Origin', 'https://api.grok.ai');
            proxyReq.setHeader('Referer', 'https://api.grok.ai/');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 SmartFinAI/1.0');
            
            // Log proxy request for debugging
            console.log(`Proxying request to: ${req.url}`);
          });
          
          proxy.on('error', function(err, req, res) {
            console.error('Proxy error:', err);
            
            // Send a more useful error response to the client
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              });
              
              res.end(JSON.stringify({
                error: 'Proxy Error',
                message: err.message || 'Unknown proxy error',
                code: 'PROXY_ERROR'
              }));
            }
          });
          
          proxy.on('proxyRes', function(proxyRes, req, res) {
            // Add CORS headers to the response
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Financial-Expert, X-Long-Response';
            
            // Log successful proxy responses for debugging
            console.log(`Proxy response from ${req.url}: ${proxyRes.statusCode}`);
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
