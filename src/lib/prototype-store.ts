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
  return { id: protoId, name: "ClauseIQ Prototype", versions: [v1, v2] };
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
    return JSON.parse(raw) as Prototype;
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
        const id = uid();
        newId = id;
        const newVersion: PrototypeVersion = {
          id,
          prototypeId: prev.id,
          versionNumber: nextNumber,
          title: `Prototype v${nextNumber}`,
          goal: src.goal,
          notes: `Duplicated from ${src.title}.`,
          previewUrl: src.previewUrl,
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
