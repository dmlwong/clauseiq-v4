import { FileSearch, ArrowRight, Download, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LaunchCardProps {
  onGetStarted: () => void;
}

export function LaunchCard({ onGetStarted }: LaunchCardProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main card */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-10 flex flex-col items-start justify-center space-y-6">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSearch className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              ClauseIQ – Analyse your Contracts
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Upload supplier contracts and receive structured analysis including risk flags,
              clause extraction, and deviation reports — all in minutes.
            </p>
          </div>
          <Button size="lg" onClick={onGetStarted} className="gap-2">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-8 space-y-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            How it works
          </h2>
          <div className="space-y-5">
            {[
              { icon: Shield, title: "Upload securely", desc: "Your documents are processed in a secure environment and not retained." },
              { icon: BarChart3, title: "AI-powered analysis", desc: "Clauses are extracted, risks are flagged, and deviations are highlighted automatically." },
              { icon: Download, title: "Download results", desc: "Export structured reports for offline review and stakeholder sharing." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
