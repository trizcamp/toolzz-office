import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { VoiceConnectionProvider } from "./contexts/VoiceConnectionContext";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import ComingSoonPage from "./pages/ComingSoonPage";
import AutomationsPage from "./pages/AutomationsPage";
import BoardPage from "./pages/BoardPage";
import CalendarPage from "./pages/CalendarPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import DocumentsPage from "./pages/DocumentsPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<ComingSoonPage variant="office" title="Escritório em breve" description="Em breve sua equipe poderá se reunir em salas de voz e chat e realizar reuniões com agentes de IA." />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/docs" element={<DocumentsPage />} />
      <Route path="/meetings" element={<ComingSoonPage variant="meetings" title="Reuniões em breve" description="Em breve você poderá acessar o histórico e a transcrição completa das reuniões realizadas no escritório." />} />
      <Route path="/automations" element={<AutomationsPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VoiceConnectionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </VoiceConnectionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
