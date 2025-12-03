
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Import pages
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/Auth";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import BillingPage from "./pages/Billing";
import SupportPage from "./pages/Support";
import UpdatePasswordPage from "./pages/UpdatePassword";
import IPOProspectusPage from "./pages/IPOProspectus";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import WordAddinSupport from "./pages/WordAddinSupport";

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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/billing" element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              } />
              <Route path="/support" element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              } />
              <Route path="/ipo-prospectus" element={
                <ProtectedRoute>
                  <IPOProspectusPage />
                </ProtectedRoute>
              } />
              {/* Public legal and support pages for AppSource */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/word-addin-support" element={<WordAddinSupport />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
