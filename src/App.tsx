import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VoiceConnectionProvider } from "./contexts/VoiceConnectionContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import OfficePage from "./pages/OfficePage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VoiceConnectionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<OfficePage />} />
              <Route path="/board" element={<PlaceholderPage title="Esteira" />} />
              <Route path="/docs" element={<PlaceholderPage title="Documentos" />} />
              <Route path="/meetings" element={<PlaceholderPage title="Reuniões" />} />
              <Route path="/reports" element={<PlaceholderPage title="Relatórios" />} />
              <Route path="/team" element={<PlaceholderPage title="Equipe" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VoiceConnectionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
