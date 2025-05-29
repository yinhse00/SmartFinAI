
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";
import References from "./pages/References";
import Database from "./pages/Database";
import History from "./pages/History";
import Timetable from "./pages/Timetable";
import ECM from "./pages/ECM";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/references" element={<References />} />
              <Route path="/database" element={<Database />} />
              <Route path="/history" element={<History />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/ecm" element={<ECM />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
