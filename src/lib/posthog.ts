import posthog from "posthog-js";

type ClauseIqEvent =
  | "clauseiq_started"
  | "clauseiq_initiative_selected"
  | "clauseiq_analysis_parameter_selected"
  | "clauseiq_contract_upload_rejected"
  | "clauseiq_analysis_started"
  | "clauseiq_run_again_selected"
  | "clauseiq_result_viewed"
  | "clauseiq_report_downloaded"
  | "clauseiq_milestone_completed"
  | "clauseiq_initiative_completed"
  | "clauseiq_content_search_save_toggled";

const isPostHogConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
);

export function captureEvent(eventName: ClauseIqEvent, properties?: Record<string, unknown>) {
  if (!isPostHogConfigured) return;
  posthog.capture(eventName, properties);
}
