
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";

// Import pages
import Chat from "./pages/Chat";
import References from "./pages/References";
import NotFound from "./pages/NotFound";
import Database from "./pages/Database";
import Index from "./pages/Index"; // Correct import for the Index page
import Documents from "./pages/Documents";
import Timetable from "./pages/Timetable";
import History from "./pages/History";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="finance-grok-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/references" element={<References />} />
            <Route path="/database" element={<Database />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/history" element={<History />} />
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
