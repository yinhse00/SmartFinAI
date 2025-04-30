
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
          proxy.on('proxyReq', function(proxyReq, req, res) {
            // Add correlation ID for request tracing
            const correlationId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            proxyReq.setHeader('X-Correlation-ID', correlationId);
            
            // Copy authorization header from client request
            const authHeader = req.headers['authorization'];
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
            
            // Check if this is a continuation request
            const isContinuation = req.headers['x-continuation'] === 'true';
            if (isContinuation) {
              proxyReq.setHeader('X-Continuation', 'true');
              console.log(`Forwarding continuation request to API (${correlationId})`);
            }
            
            // Add required headers for API request
            proxyReq.setHeader('X-Financial-Expert', 'true');
            proxyReq.setHeader('X-Long-Response', 'true');
            proxyReq.setHeader('Origin', 'https://api.grok.ai');
            proxyReq.setHeader('Referer', 'https://api.grok.ai/');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 SmartFinAI/1.0');
            
            // Log proxy request for debugging
            console.log(`Proxying request to: ${req.url} (${correlationId})`);
            
            // For continuation requests, set a higher priority
            if (isContinuation) {
              proxyReq.setHeader('X-Request-Priority', 'high');
            }
          });
          
          proxy.on('error', function(err, req, res) {
            const correlationId = req.headers['x-correlation-id'] || `err-${Date.now()}`;
            console.error(`Proxy error (${correlationId}):`, err);
            
            // Send a more useful error response to the client
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Continuation, X-Financial-Expert, X-Long-Response, X-Correlation-ID'
              });
              
              res.end(JSON.stringify({
                error: 'Proxy Error',
                message: err.message || 'Unknown proxy error',
                code: 'PROXY_ERROR',
                correlationId
              }));
            }
          });
          
          proxy.on('proxyRes', function(proxyRes, req, res) {
            const correlationId = req.headers['x-correlation-id'] || `res-${Date.now()}`;
            
            // Add CORS headers to the response
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-Continuation, X-Financial-Expert, X-Long-Response, X-Correlation-ID';
            
            // Log successful proxy responses for debugging
            // Fix: Add a check for undefined statusCode
            const statusCode = proxyRes.statusCode !== undefined ? proxyRes.statusCode : 0;
            console.log(`Proxy response from ${req.url}: ${statusCode} (${correlationId})`);
            
            // Check for continuation requests and log them
            const isContinuation = req.headers['x-continuation'] === 'true';
            if (isContinuation) {
              console.log(`Continuation response received from API (${correlationId})`);
            }
            
            // Handle error responses more gracefully
            if (statusCode >= 400) {
              console.error(`API error response: ${statusCode} (${correlationId})`);
              
              // Capture response body for better error reporting
              let body = '';
              proxyRes.on('data', function(chunk) {
                body += chunk;
              });
              
              proxyRes.on('end', function() {
                try {
                  console.error(`API error details (${correlationId}):`, body);
                } catch (e) {
                  console.error(`Failed to parse API error response (${correlationId})`, e);
                }
              });
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
