
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
            proxyReq.setHeader('Origin', 'https://api.x.ai'); // Add origin to help with CORS
            // Remove content-length header to prevent issues with modified requests
            proxyReq.removeHeader('content-length');
          });
          proxy.on('error', function(err, req, _res) {
            console.log('Financial expert proxy error:', err);
            console.log('Failed request path:', req.url); // Changed from req.path to req.url
          });
          proxy.on('proxyRes', function(proxyRes, req, _res) {
            // Log successful proxy responses for debugging
            console.log(`Proxy response from ${req.url}: ${proxyRes.statusCode}`); // Changed from req.path to req.url
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
