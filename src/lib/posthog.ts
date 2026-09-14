import posthog from "posthog-js";

/**
 * Which ClauseIQ design an event came from. Both designs emit the same event
 * names so reporting can split a single series on this property instead of
 * comparing two unrelated ones.
 */
export type ClauseIqVersion = "v4" | "v6a";

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

export function captureEvent(
  eventName: ClauseIqEvent,
  version: ClauseIqVersion,
  properties?: Record<string, unknown>,
) {
  if (!isPostHogConfigured) return;
  posthog.capture(eventName, { version, ...properties });
}
