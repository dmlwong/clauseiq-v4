import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PrototypeAccessGate } from "@/components/access/PrototypeAccessGate";
import Index from "./pages/Index.tsx";
import IndexV2 from "./pages/IndexV2.tsx";
import IndexV3 from "./pages/IndexV3.tsx";
import IndexV4 from "./pages/IndexV4.tsx";
import IndexV6A from "./pages/IndexV6A.tsx";
import ClauseIQV2 from "./pages/ClauseIQV2.tsx";
import ClauseIQV3 from "./pages/ClauseIQV3.tsx";
import ClauseIQV4 from "./pages/ClauseIQV4.tsx";
import ClauseIQV6A from "./pages/ClauseIQV6A.tsx";
import ClauseIQV4DeviationProminence from "./pages/ClauseIQV4DeviationProminence.tsx";
import ClauseIQV4OrbitPreview from "./pages/ClauseIQV4OrbitPreview.tsx";
import UsabilityStudyV2 from "./pages/UsabilityStudyV2.tsx";
import UsabilityStudyV3 from "./pages/UsabilityStudyV3.tsx";
import UsabilityStudyV4 from "./pages/UsabilityStudyV4.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrototypeTimeline from "./pages/PrototypeTimeline.tsx";
import PrototypeDetail from "./pages/PrototypeDetail.tsx";
import PrototypeCPV4Results from "./pages/PrototypeCPV4Results.tsx";
// TEMPORARY: CP v1 + v2 restored from _archive for comparison with CP v4. Re-archive after.
import PrototypeCP from "./pages/PrototypeCP.tsx";
import PrototypeCPResults from "./pages/PrototypeCPResults.tsx";
import PrototypeCPV2 from "./pages/PrototypeCPV2.tsx";
import PrototypeCPV2Results from "./pages/PrototypeCPV2Results.tsx";
import DeliveryEnginePage from "./pages/delivery-engine/DeliveryEnginePage.tsx";
import InitiativeDetailPage from "./pages/delivery-engine/InitiativeDetailPage.tsx";
import InitiativeDetailPageV4 from "./pages/delivery-engine-v4/InitiativeDetailPageV4.tsx";
import PlaybookManagement from "./pages/PlaybookManagement.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <PrototypeAccessGate>
          <Routes>
          <Route path="/" element={<PrototypeTimeline />} />
          <Route path="/initiatives" element={<Index />} />
          <Route path="/initiatives-v2" element={<IndexV2 />} />
          <Route path="/initiatives-v3" element={<IndexV3 />} />
          <Route path="/initiatives-v4" element={<IndexV4 />} />
          <Route path="/initiatives-v6a" element={<IndexV6A />} />
          <Route path="/delivery-engine" element={<DeliveryEnginePage />} />
          <Route path="/delivery-engine/:id" element={<InitiativeDetailPage />} />
          <Route path="/delivery-engine-v4/:id" element={<InitiativeDetailPageV4 />} />
          <Route path="/clauseiq-v2" element={<ClauseIQV2 />} />
          <Route path="/clauseiq-v3" element={<ClauseIQV3 />} />
          <Route path="/clauseiq-v4" element={<ClauseIQV4 />} />
          <Route path="/clauseiq-v4/output-panel" element={<ClauseIQV4 forceResults resultsLayout="output-panel" />} />
          <Route path="/clauseiq-v4/deviation-prominence" element={<ClauseIQV4DeviationProminence />} />
          <Route path="/clauseiq-v4/orbit-preview" element={<ClauseIQV4OrbitPreview />} />
          <Route path="/clauseiq-v6a" element={<ClauseIQV6A />} />
          <Route path="/clauseiq-v6a/output-panel" element={<ClauseIQV6A forceResults resultsLayout="output-panel" />} />
          <Route path="/usability-v2" element={<UsabilityStudyV2 />} />
          <Route path="/usability-v3" element={<UsabilityStudyV3 />} />
          <Route path="/usability-v4" element={<UsabilityStudyV4 />} />
          <Route path="/prototypes" element={<PrototypeTimeline />} />
          <Route path="/prototypes/:versionId" element={<PrototypeDetail />} />
          <Route path="/prototype-cp-v4" element={<PrototypeCPV2 resultExperience="v6a" />} />
          <Route path="/prototype-cp-v4/results" element={<PrototypeCPV4Results />} />
          {/* TEMPORARY CP v1 + v2 previews (restored from _archive) — remove after comparison */}
          <Route path="/prototype-cp-v1-preview" element={<PrototypeCP />} />
          <Route path="/prototype-cp/results" element={<PrototypeCPResults />} />
          <Route path="/prototype-cp-v2" element={<PrototypeCPV2 />} />
          <Route path="/prototype-cp-v2/results" element={<PrototypeCPV2Results />} />
          <Route path="/playbook-management" element={<PlaybookManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </PrototypeAccessGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
