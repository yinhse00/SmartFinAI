
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
          proxy.on('proxyReq', function(proxyReq) {
            proxyReq.setHeader('X-Financial-Expert', 'true');
            proxyReq.setHeader('X-Long-Response', 'true');
            // Add more required headers for the Grok API
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
            // Remove origin header to fix CORS issues
            proxyReq.removeHeader('Origin');
            // Remove referer to avoid CORS issues
            proxyReq.removeHeader('Referer');
          });
          proxy.on('error', function(err, req, res) {
            console.log('Financial expert proxy error:', err);
            // Ensure the error doesn't crash the proxy
            if (!res.headersSent) {
              res.writeHead(500, {
                'Content-Type': 'application/json'
              });
              const errorResponse = {
                error: true,
                message: 'Proxy error: Unable to reach Grok API',
                details: err.message || 'Unknown error'
              };
              res.end(JSON.stringify(errorResponse));
            }
          });
          proxy.on('proxyRes', function(proxyRes, req, res) {
            // Log successful proxy responses for debugging
            console.log(`Proxy response from ${req.url}: ${proxyRes.statusCode}`);
            
            // Add CORS headers to the response
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
