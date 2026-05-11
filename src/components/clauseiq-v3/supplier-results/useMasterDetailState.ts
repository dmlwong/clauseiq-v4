import { useEffect, useMemo, useState } from "react";
import { sortByRisk } from "@/lib/clauseiq-utils";
import type { ResultsViewProps, MasterDetailState } from "./types";

export function useMasterDetailState(initiative: ResultsViewProps["initiative"]): MasterDetailState {
  const sortedSuppliers = useMemo(() => sortByRisk(initiative.suppliers), [initiative.suppliers]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedId, setSelectedId] = useState(sortedSuppliers[0]?.id ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredSuppliers = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return sortedSuppliers;
    return sortedSuppliers.filter((supplier) => supplier.name.toLowerCase().includes(q));
  }, [debouncedQuery, sortedSuppliers]);

  useEffect(() => {
    if (filteredSuppliers.length === 0) return;
    if (!filteredSuppliers.some((supplier) => supplier.id === selectedId)) {
      setSelectedId(filteredSuppliers[0].id);
    }
  }, [filteredSuppliers, selectedId]);

  const selectedSupplier =
    filteredSuppliers.find((supplier) => supplier.id === selectedId) ??
    filteredSuppliers[0] ??
    sortedSuppliers.find((supplier) => supplier.id === selectedId) ??
    null;

  return {
    filteredSuppliers,
    selectedId,
    selectedSupplier,
    query,
    onQueryChange: setQuery,
    onSelect: setSelectedId,
  };
}
