import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import IndexV2 from "./pages/IndexV2.tsx";
import IndexV3 from "./pages/IndexV3.tsx";
import IndexV4 from "./pages/IndexV4.tsx";
import IndexV5 from "./pages/IndexV5.tsx";
import IndexResponsiveTesting from "./pages/IndexResponsiveTesting.tsx";
import ClauseIQV2 from "./pages/ClauseIQV2.tsx";
import ClauseIQV3 from "./pages/ClauseIQV3.tsx";
import ClauseIQV4 from "./pages/ClauseIQV4.tsx";
import ClauseIQV5 from "./pages/ClauseIQV5.tsx";
import ClauseIQResponsiveTesting from "./pages/ClauseIQResponsiveTesting.tsx";
import ClauseIQV5Test from "./pages/ClauseIQV5Test.tsx";
import ClauseIQV4DeviationProminence from "./pages/ClauseIQV4DeviationProminence.tsx";
import ClauseIQV4OrbitPreview from "./pages/ClauseIQV4OrbitPreview.tsx";
import ClauseIQV5DeviationProminence from "./pages/ClauseIQV5DeviationProminence.tsx";
import UsabilityStudyV2 from "./pages/UsabilityStudyV2.tsx";
import UsabilityStudyV3 from "./pages/UsabilityStudyV3.tsx";
import UsabilityStudyV4 from "./pages/UsabilityStudyV4.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrototypeTimeline from "./pages/PrototypeTimeline.tsx";
import PrototypeDetail from "./pages/PrototypeDetail.tsx";
import PrototypeCP from "./pages/PrototypeCP.tsx";
import DeliveryEnginePage from "./pages/delivery-engine/DeliveryEnginePage.tsx";
import InitiativeDetailPage from "./pages/delivery-engine/InitiativeDetailPage.tsx";
import InitiativeDetailPageV4 from "./pages/delivery-engine-v4/InitiativeDetailPageV4.tsx";
import InitiativeDetailPageV5 from "./pages/delivery-engine-v5/InitiativeDetailPageV5.tsx";

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
          <Route path="/initiatives-v4" element={<IndexV4 />} />
          <Route path="/initiatives-v5" element={<IndexV5 />} />
          <Route path="/initiatives-responsive-testing" element={<IndexResponsiveTesting />} />
          <Route path="/delivery-engine" element={<DeliveryEnginePage />} />
          <Route path="/delivery-engine/:id" element={<InitiativeDetailPage />} />
          <Route path="/delivery-engine-v4/:id" element={<InitiativeDetailPageV4 />} />
          <Route path="/delivery-engine-v5/:id" element={<InitiativeDetailPageV5 />} />
          <Route path="/clauseiq-v2" element={<ClauseIQV2 />} />
          <Route path="/clauseiq-v3" element={<ClauseIQV3 />} />
          <Route path="/clauseiq-v4" element={<ClauseIQV4 />} />
          <Route path="/clauseiq-v4/output-panel" element={<ClauseIQV4 forceResults resultsLayout="output-panel" />} />
          <Route path="/clauseiq-v4/deviation-prominence" element={<ClauseIQV4DeviationProminence />} />
          <Route path="/clauseiq-v4/orbit-preview" element={<ClauseIQV4OrbitPreview />} />
          <Route path="/clauseiq-v5" element={<ClauseIQV5 />} />
          <Route path="/clauseiq-v5/test" element={<ClauseIQV5Test />} />
          <Route path="/clauseiq-v5/output-panel" element={<ClauseIQV5 forceResults resultsLayout="output-panel" />} />
          <Route path="/clauseiq-v5/deviation-prominence" element={<ClauseIQV5DeviationProminence />} />
          <Route path="/clauseiq-responsive-testing" element={<ClauseIQResponsiveTesting />} />
          <Route
            path="/clauseiq-responsive-testing/output-panel"
            element={<ClauseIQResponsiveTesting forceResults resultsLayout="output-panel" />}
          />
          <Route path="/usability-v2" element={<UsabilityStudyV2 />} />
          <Route path="/usability-v3" element={<UsabilityStudyV3 />} />
          <Route path="/usability-v4" element={<UsabilityStudyV4 />} />
          <Route path="/prototypes" element={<PrototypeTimeline />} />
          <Route path="/prototypes/:versionId" element={<PrototypeDetail />} />
          <Route path="/prototype-cp" element={<PrototypeCP />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
