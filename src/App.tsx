import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import IndexV2 from "./pages/IndexV2.tsx";
import IndexV3 from "./pages/IndexV3.tsx";
import ClauseIQV2 from "./pages/ClauseIQV2.tsx";
import ClauseIQV3 from "./pages/ClauseIQV3.tsx";
import UsabilityStudyV2 from "./pages/UsabilityStudyV2.tsx";
import UsabilityStudyV3 from "./pages/UsabilityStudyV3.tsx";
import UsabilityStudyV4 from "./pages/UsabilityStudyV4.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrototypeTimeline from "./pages/PrototypeTimeline.tsx";
import PrototypeDetail from "./pages/PrototypeDetail.tsx";
import DeliveryEnginePage from "./pages/delivery-engine/DeliveryEnginePage.tsx";
import InitiativeDetailPage from "./pages/delivery-engine/InitiativeDetailPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PrototypeTimeline />} />
          <Route path="/initiatives" element={<Index />} />
          <Route path="/initiatives-v2" element={<IndexV2 />} />
          <Route path="/initiatives-v3" element={<IndexV3 />} />
          <Route path="/delivery-engine" element={<DeliveryEnginePage />} />
          <Route path="/delivery-engine/:id" element={<InitiativeDetailPage />} />
          <Route path="/clauseiq-v2" element={<ClauseIQV2 />} />
          <Route path="/clauseiq-v3" element={<ClauseIQV3 />} />
          <Route path="/usability-v2" element={<UsabilityStudyV2 />} />
          <Route path="/usability-v3" element={<UsabilityStudyV3 />} />
          <Route path="/usability-v4" element={<UsabilityStudyV4 />} />
          <Route path="/prototypes" element={<PrototypeTimeline />} />
          <Route path="/prototypes/:versionId" element={<PrototypeDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
