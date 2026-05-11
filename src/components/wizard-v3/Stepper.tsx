import { Check } from "lucide-react";

const STEPS = ["Prior to Use", "Upload Files", "Settings", "Client Playbook", "Generate Results"];

interface StepperProps {
  currentStep: number;
  completedSteps: Set<number>;
}

export function Stepper({ currentStep, completedSteps }: StepperProps) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-border">
      {STEPS.map((label, i) => {
        const isCompleted = completedSteps.has(i);
        const isActive = i === currentStep;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isCompleted
                    ? "bg-success text-success-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-wizard-inactive text-primary-foreground"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 mt-[-18px] ${
                  completedSteps.has(i) ? "bg-success" : "bg-wizard-line"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
