
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
        timeout: 600000, // 10 minutes timeout for large file processing
        configure: (proxy, _options) => {
          proxy.on('proxyReq', function(proxyReq) {
            proxyReq.setHeader('X-Financial-Expert', 'true');
            proxyReq.setHeader('X-Long-Response', 'true');
            // Remove origin header to prevent CORS issues
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('Origin');
            // Add proper headers for CORS
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Financial-Expert, X-Long-Response');
          });
          
          proxy.on('error', function(err, _req, _res) {
            console.log('Financial expert proxy error:', err);
          });
          
          proxy.on('proxyRes', function(proxyRes, req, res) {
            // Add CORS headers to the response
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Financial-Expert, X-Long-Response';
            
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
