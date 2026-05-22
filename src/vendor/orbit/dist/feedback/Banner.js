// Back-compat shim only.
// This component is not the Figma "Feedback Banners" strip
// (source node 8374:7184). Use InlineBanner for that design.
// The multiline title + description block is now exported as Alert.
// Original multiline Figma source: TBD.
// Tracking note: audits/feedback-banner-audit-2026-04-29.md.
export { Alert as Banner } from './Alert';
