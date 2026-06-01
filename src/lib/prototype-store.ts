// Local-first prototype version & feedback store (persisted to localStorage)
import { useEffect, useState, useCallback } from "react";

export type FeedbackPriority = "Low" | "Medium" | "High";
export type FeedbackCategory = "UX" | "UI" | "Content" | "Technical" | "Business" | "Other";
export type FeedbackStatus = "New" | "Accepted" | "Rejected" | "In progress" | "Resolved";
export type VersionStatus = "Awaiting feedback" | "Feedback received" | "In progress" | "Complete";

export interface FeedbackItem {
  id: string;
  text: string;
  source: string;
  date: string; // ISO
  priority: FeedbackPriority;
  category: FeedbackCategory;
  status: FeedbackStatus;
  notes?: string;
}

export interface PrototypeVersion {
  id: string;
  prototypeId: string;
  versionNumber: number;
  title: string;
  goal: string;
  notes: string;
  previewUrl?: string;
  status: VersionStatus;
  createdAt: string; // ISO
  feedback: FeedbackItem[];
}

export interface Prototype {
  id: string;
  name: string;
  versions: PrototypeVersion[];
}

const STORAGE_KEY = "prototype-timeline:v4";

const uid = () => Math.random().toString(36).slice(2, 10);

export function isPrototypeV3(version: PrototypeVersion) {
  const title = version.title.trim().toLowerCase();
  return version.versionNumber === 3 || title === "prototype v3" || title.includes("v3");
}

export function isPrototypeV4(version: PrototypeVersion) {
  const title = version.title.trim().toLowerCase();
  return version.versionNumber === 4 || title === "prototype v4" || title.includes("v4");
}

export function isPrototypeV5(version: PrototypeVersion) {
  const title = version.title.trim().toLowerCase();
  return version.versionNumber === 5 || title === "prototype v5" || title.includes("v5");
}

export function isResponsiveTestingPrototype(version: PrototypeVersion) {
  const title = version.title.trim().toLowerCase();
  return title === "responsive testing" || title.includes("responsive testing") || version.previewUrl?.startsWith("/clauseiq-responsive-testing");
}

export function prototypePreviewUrl(version: PrototypeVersion) {
  if (isResponsiveTestingPrototype(version)) return "/clauseiq-responsive-testing";
  if (isPrototypeV5(version)) return "/clauseiq-v5";
  if (isPrototypeV4(version)) return "/clauseiq-v4";
  if (isPrototypeV3(version)) return "/clauseiq-v3";
  return version.previewUrl;
}

function seed(): Prototype {
  const protoId = "p-main";
  const v1: PrototypeVersion = {
    id: uid(),
    prototypeId: protoId,
    versionNumber: 1,
    title: "Prototype v1",
    goal: "Initial concept — validate core navigation and contract upload flow.",
    notes: "First clickable concept shared with internal stakeholders.",
    previewUrl: "/initiatives",
    status: "Feedback received",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    feedback: [
      {
        id: uid(),
        text: "Wizard step labels are unclear — 'Settings' should be 'Analysis Settings'.",
        source: "Sarah Chen (PM)",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        priority: "Medium",
        category: "Content",
        status: "Resolved",
        notes: "Renamed in v2.",
      },
      {
        id: uid(),
        text: "Need a way to compare versions side-by-side.",
        source: "Marcus Lee (Design Lead)",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
        priority: "High",
        category: "UX",
        status: "Resolved",
      },
    ],
  };
  const v2: PrototypeVersion = {
    id: uid(),
    prototypeId: protoId,
    versionNumber: 2,
    title: "Prototype v2",
    goal: "Introduce comparison view and accordion-based result buckets.",
    notes: "Added v1↔v2 comparison and unmarked-clauses bucket.",
    previewUrl: "/clauseiq-v2",
    status: "Awaiting feedback",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    feedback: [
      {
        id: uid(),
        text: "Closed bucket should default to collapsed.",
        source: "Priya Patel (UX Research)",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        priority: "Low",
        category: "UI",
        status: "New",
      },
    ],
  };
  const v3 = createV3Version(protoId, 3);
  const v4 = createV4Version(protoId, 4);
  const v5 = createV5Version(protoId, 5);
  const responsiveTesting = createResponsiveTestingVersion(protoId, 6);
  return { id: protoId, name: "ClauseIQ Prototype", versions: [v1, v2, v3, v4, v5, responsiveTesting] };
}

function createV3Version(protoId: string, versionNumber: number): PrototypeVersion {
  return {
    id: uid(),
    prototypeId: protoId,
    versionNumber,
    title: "Prototype v3",
    goal: "Preserve the completed v3 comparison design branch as an earlier version.",
    notes: "Prototype v3 remains available through /clauseiq-v3 and /initiatives-v3 for reference and regression checks.",
    previewUrl: "/clauseiq-v3",
    status: "Complete",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    feedback: [],
  };
}

function createV4Version(protoId: string, versionNumber: number): PrototypeVersion {
  return {
    id: uid(),
    prototypeId: protoId,
    versionNumber,
    title: "Prototype v4",
    goal: "Continue ClauseIQ iteration from prototype v3 in a clean isolated route.",
    notes: "Duplicated from prototype v3 with separate /clauseiq-v4 and /initiatives-v4 routes so v4 changes no longer affect v3.",
    previewUrl: "/clauseiq-v4",
    status: "Complete",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    feedback: [],
  };
}

function createV5Version(protoId: string, versionNumber: number): PrototypeVersion {
  return {
    id: uid(),
    prototypeId: protoId,
    versionNumber,
    title: "Prototype v5",
    goal: "Move ClauseIQ onto the Orbit design system and refine the first-analysis dashboard workflow.",
    notes: "Promoted the Orbit-based v5 branch with updated intake, output panel, initiative modal, first-analysis dashboard cards, and History placeholder.",
    previewUrl: "/clauseiq-v5",
    status: "In progress",
    createdAt: new Date().toISOString(),
    feedback: [],
  };
}

function createResponsiveTestingVersion(protoId: string, versionNumber: number): PrototypeVersion {
  return {
    id: uid(),
    prototypeId: protoId,
    versionNumber,
    title: "Responsive Testing",
    goal: "Safely explore small-screen layout and structure changes before promoting them back into prototype v5.",
    notes: "Duplicated from prototype v5 into isolated /clauseiq-responsive-testing and /initiatives-responsive-testing routes for responsive design experiments.",
    previewUrl: "/clauseiq-responsive-testing",
    status: "In progress",
    createdAt: new Date().toISOString(),
    feedback: [],
  };
}

function ensureCurrentVersions(prototype: Prototype): Prototype {
  let changed = false;
  const versions = prototype.versions.map((version) => {
    if (isResponsiveTestingPrototype(version)) {
      const next = {
        ...version,
        title: "Responsive Testing",
        goal: "Safely explore small-screen layout and structure changes before promoting them back into prototype v5.",
        notes: "Duplicated from prototype v5 into isolated /clauseiq-responsive-testing and /initiatives-responsive-testing routes for responsive design experiments.",
        previewUrl: "/clauseiq-responsive-testing",
        status: version.status === "Complete" ? "In progress" as VersionStatus : version.status,
      };
      changed = changed || JSON.stringify(next) !== JSON.stringify(version);
      return next;
    }
    if (isPrototypeV5(version)) {
      const next = {
        ...version,
        versionNumber: 5,
        title: "Prototype v5",
        goal: "Move ClauseIQ onto the Orbit design system and refine the first-analysis dashboard workflow.",
        notes: "Promoted the Orbit-based v5 branch with updated intake, output panel, initiative modal, first-analysis dashboard cards, and History placeholder.",
        previewUrl: "/clauseiq-v5",
        status: version.status === "Complete" ? "In progress" as VersionStatus : version.status,
      };
      changed = changed || JSON.stringify(next) !== JSON.stringify(version);
      return next;
    }
    if (isPrototypeV4(version)) {
      const next = {
        ...version,
        versionNumber: 4,
        title: "Prototype v4",
        goal: "Continue ClauseIQ iteration from prototype v3 in a clean isolated route.",
        notes: "Duplicated from prototype v3 with separate /clauseiq-v4 and /initiatives-v4 routes so v4 changes no longer affect v3.",
        previewUrl: "/clauseiq-v4",
        status: "Complete" as VersionStatus,
      };
      changed = changed || JSON.stringify(next) !== JSON.stringify(version);
      return next;
    }
    if (!isPrototypeV3(version)) return version;
    const next = {
      ...version,
      versionNumber: 3,
      title: "Prototype v3",
      goal: "Preserve the completed v3 comparison design branch as an earlier version.",
      notes: "Prototype v3 remains available through /clauseiq-v3 and /initiatives-v3 for reference and regression checks.",
      previewUrl: "/clauseiq-v3",
      status: version.status === "In progress" || version.status === "Awaiting feedback"
        ? "Complete" as VersionStatus
        : version.status,
    };
    changed = changed || JSON.stringify(next) !== JSON.stringify(version);
    return next;
  });
  let nextVersions = versions;
  if (!nextVersions.some((version) => isPrototypeV3(version))) {
    nextVersions = [...nextVersions, createV3Version(prototype.id, 3)];
    changed = true;
  }
  if (!nextVersions.some((version) => isPrototypeV4(version))) {
    nextVersions = [...nextVersions, createV4Version(prototype.id, 4)];
    changed = true;
  }
  if (!nextVersions.some((version) => isPrototypeV5(version))) {
    nextVersions = [...nextVersions, createV5Version(prototype.id, 5)];
    changed = true;
  }
  if (!nextVersions.some((version) => isResponsiveTestingPrototype(version))) {
    const nextNumber = Math.max(6, ...nextVersions.map((version) => version.versionNumber + 1));
    nextVersions = [...nextVersions, createResponsiveTestingVersion(prototype.id, nextNumber)];
    changed = true;
  }
  if (!changed) return prototype;
  return { ...prototype, versions: nextVersions };
}

function load(): Prototype {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as Prototype;
    const migrated = ensureCurrentVersions(parsed);
    if (migrated !== parsed) save(migrated);
    return migrated;
  } catch {
    return seed();
  }
}

function save(p: Prototype) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

// Subscribe to changes across hook instances on the same tab
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function usePrototypeStore() {
  const [data, setData] = useState<Prototype>(() => load());

  useEffect(() => {
    const l = () => setData(load());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = useCallback((updater: (prev: Prototype) => Prototype) => {
    setData((prev) => {
      const next = updater(prev);
      save(next);
      // schedule notification so other consumers reload
      queueMicrotask(notify);
      return next;
    });
  }, []);

  const duplicateVersion = useCallback(
    (versionId: string, opts?: { copyFeedback?: boolean }): string | null => {
      let newId: string | null = null;
      update((prev) => {
        const src = prev.versions.find((v) => v.id === versionId);
        if (!src) return prev;
        const nextNumber = Math.max(...prev.versions.map((v) => v.versionNumber)) + 1;
        const title = `Prototype v${nextNumber}`;
        const previewUrl =
          nextNumber >= 5 || isPrototypeV5(src)
            ? "/clauseiq-v5"
            : nextNumber >= 4 || isPrototypeV4(src)
            ? "/clauseiq-v4"
            : nextNumber === 3 || isPrototypeV3(src)
              ? "/clauseiq-v3"
              : prototypePreviewUrl(src);
        const id = uid();
        newId = id;
        const newVersion: PrototypeVersion = {
          id,
          prototypeId: prev.id,
          versionNumber: nextNumber,
          title,
          goal: src.goal,
          notes: `Duplicated from ${src.title}.`,
          previewUrl,
          status: "In progress",
          createdAt: new Date().toISOString(),
          feedback: opts?.copyFeedback
            ? src.feedback.map((f) => ({ ...f, id: uid(), status: "New" as FeedbackStatus }))
            : [],
        };
        return { ...prev, versions: [...prev.versions, newVersion] };
      });
      return newId;
    },
    [update]
  );

  const deleteVersion = useCallback(
    (versionId: string) => {
      update((prev) => ({
        ...prev,
        versions: prev.versions.filter((v) => v.id !== versionId),
      }));
    },
    [update]
  );

  const updateVersion = useCallback(
    (versionId: string, patch: Partial<PrototypeVersion>) => {
      update((prev) => ({
        ...prev,
        versions: prev.versions.map((v) => (v.id === versionId ? { ...v, ...patch } : v)),
      }));
    },
    [update]
  );

  const addFeedback = useCallback(
    (versionId: string, item: Omit<FeedbackItem, "id" | "date"> & { date?: string }) => {
      update((prev) => ({
        ...prev,
        versions: prev.versions.map((v) =>
          v.id === versionId
            ? {
                ...v,
                status: v.status === "Awaiting feedback" ? "Feedback received" : v.status,
                feedback: [
                  ...v.feedback,
                  { ...item, id: uid(), date: item.date ?? new Date().toISOString() },
                ],
              }
            : v
        ),
      }));
    },
    [update]
  );

  const updateFeedback = useCallback(
    (versionId: string, feedbackId: string, patch: Partial<FeedbackItem>) => {
      update((prev) => ({
        ...prev,
        versions: prev.versions.map((v) =>
          v.id === versionId
            ? { ...v, feedback: v.feedback.map((f) => (f.id === feedbackId ? { ...f, ...patch } : f)) }
            : v
        ),
      }));
    },
    [update]
  );

  const deleteFeedback = useCallback(
    (versionId: string, feedbackId: string) => {
      update((prev) => ({
        ...prev,
        versions: prev.versions.map((v) =>
          v.id === versionId ? { ...v, feedback: v.feedback.filter((f) => f.id !== feedbackId) } : v
        ),
      }));
    },
    [update]
  );

  return {
    prototype: data,
    versions: [...data.versions].sort((a, b) => a.versionNumber - b.versionNumber),
    duplicateVersion,
    deleteVersion,
    updateVersion,
    addFeedback,
    updateFeedback,
    deleteFeedback,
  };
}

export function summarize(version: PrototypeVersion) {
  const total = version.feedback.length;
  const resolved = version.feedback.filter((f) => f.status === "Resolved").length;
  const open = total - resolved;
  const high = version.feedback.filter((f) => f.priority === "High" && f.status !== "Resolved").length;
  return { total, open, resolved, high };
}
