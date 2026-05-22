// Ported from src/pages/ClauseIQV4.tsx on 2026-05-21 using lovable-to-orbit skill v1.
// Scope 1: Welcome card only. Later scopes will assemble this into the full page.

// TODO[port-convention]: confirm barrel path — target codebase has no existing Orbit
// imports yet; using barrel "@orbit" as initial convention per executor-prompt.md.
import { Avatar, Button, Card, FaIcon, Headings, Text } from "@orbit";

// Font Awesome 6 Pro Unicode codepoints (per component-mapping.md §5).
// Encoded as `\uXXXX` escape sequences so the literal codepoint character reaches
// the `FaIcon` `icon` prop, matching the manifest contract (icon: string).
const FA_SPARKLES = "";
const FA_LIST_CHECK = "";
const FA_BUILDING = "";
const FA_FILE_CIRCLE_PLUS = "";

interface WelcomeCardProps {
  /** Whether the Welcome step is the active step. Mirrors the `step === "welcome"`
   *  conditional that gated the Get Started button in the original. */
  isCurrentStep?: boolean;
  /** Called when the Get Started button is pressed. Original wired to setStep("select"). */
  onGetStarted: () => void;
}

export function WelcomeCard({ isCurrentStep = true, onGetStarted }: WelcomeCardProps) {
  return (
    <Card type="Static" state="Default">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--orbit-space-s)",
          marginBottom: "var(--orbit-space-base)",
        }}
      >
        {/* TODO[skill-gap]: Avatar style="Square" does not accept an icon child per
            manifest — need IconTile primitive (ADR-006). Using Avatar with initials
            "CI" as a non-icon stand-in; the Sparkles FaIcon below would belong inside
            the tile but no prop on Avatar accepts it. */}
        <Avatar
          style="Square"
          size="Medium"
          color="var(--orbit-color-efficio-blue)"
          name="ClauseIQ"
          initials="CI"
        />
        <Headings size="Heading 3">ClauseIQ</Headings>
      </div>
      <div style={{ marginBottom: "var(--orbit-space-m)" }}>
        <Text size="Paragraph" variant="Secondary" as="p">
          Upload a contract and ClauseIQ will review it against your initiative's playbook,
          surfacing deviations, missing clauses and negotiation actions in seconds.
        </Text>
      </div>
      {/* TODO[skill-gap]: Card-within-card visual weight (ADR-010 deferred) — the inner
          Summary block was a tinted bg-muted/50 sub-region, not a standalone card.
          Orbit ships no Subtle Card state; this will render as a second card. */}
      <div style={{ marginBottom: "var(--orbit-space-m)" }}>
        <Card type="Static" padding="Small" state="Default">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--orbit-space-s)",
            }}
          >
            <div style={{ marginBottom: "var(--orbit-space-xxs)" }}>
              <Text size="Paragraph" variant="Bold" as="div">
                Summary
              </Text>
            </div>
            <SummaryRow
              icon={
                <FaIcon
                  icon={FA_LIST_CHECK}
                  color="var(--orbit-color-efficio-blue)"
                  size={14}
                />
              }
              text="Reviews every clause against your benchmark playbook."
            />
            <SummaryRow
              icon={
                <FaIcon
                  icon={FA_BUILDING}
                  color="var(--orbit-color-efficio-blue)"
                  size={14}
                />
              }
              text="Tied to a chosen initiative for traceable governance."
            />
            <SummaryRow
              icon={
                <FaIcon
                  icon={FA_FILE_CIRCLE_PLUS}
                  color="var(--orbit-color-efficio-blue)"
                  size={14}
                />
              }
              text="Exports a shareable report with severity and actions."
            />
          </div>
        </Card>
      </div>
      {isCurrentStep && (
        // TODO[orbit-ticket]: Button fullWidth — Orbit Button has no width prop yet
        // (ADR-004). The wrapper div is a non-functional placeholder until Orbit ships
        // a fullWidth prop; the button will not actually stretch.
        <div style={{ width: "100%" }}>
          {/* TODO[skill-gap]: Button manifest does not list onClick — required to wire
              the original setStep("select") callsite. Passing onClick anyway as the
              only sensible handler name; flag for Orbit manifest review. */}
          <Button
            variant="Primary"
            size="Medium"
            icon={<FaIcon icon={FA_SPARKLES} size={14} />}
            // @ts-expect-error onClick missing from Button manifest — see TODO above.
            onClick={onGetStarted}
          >
            Get Started
          </Button>
        </div>
      )}
    </Card>
  );
}

export function SummaryRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--orbit-space-xs)",
      }}
    >
      <span style={{ marginTop: "2px" }}>{icon}</span>
      <Text size="Paragraph" variant="Primary" as="span">
        {text}
      </Text>
    </div>
  );
}
