import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import JoinRoomPage from "./pages/JoinRoomPage";
import ViewerWaitingPage from "./pages/ViewerWaitingPage";
import HostRoomPage from "./pages/HostRoomPage";
import ViewerRoomPage from "./pages/ViewerRoomPage";
import EndSessionPage from "./pages/EndSessionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomCode/join" element={<JoinRoomPage />} />
          <Route path="/room/:roomCode/waiting" element={<ViewerWaitingPage />} />
          <Route path="/room/:roomCode/host" element={<HostRoomPage />} />
          <Route path="/room/:roomCode/viewer" element={<ViewerRoomPage />} />
          <Route path="/room/:roomCode/end" element={<EndSessionPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
