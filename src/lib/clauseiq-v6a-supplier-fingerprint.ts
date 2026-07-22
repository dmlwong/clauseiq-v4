import type { Supplier } from "@/data/mock-clauseiq-v6";

export type SupplierFingerprintResult =
  | { kind: "exact"; supplierId: string }
  | { kind: "fuzzy"; supplierId: string }
  | { kind: "none" };

const normalizeSupplierName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const editDistance = (left: string, right: string) => {
  const matrix = Array.from({ length: left.length + 1 }, (_, row) => [row]);
  for (let column = 0; column <= right.length; column += 1) matrix[0][column] = column;

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      matrix[row][column] = left[row - 1] === right[column - 1]
        ? matrix[row - 1][column - 1]
        : Math.min(
          matrix[row - 1][column - 1] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column] + 1,
        );
    }
  }

  return matrix[left.length][right.length];
};

/**
 * Prototype boundary for the eventual supplier-fingerprinting backend. The
 * asynchronous shape lets the workflow resolve identity in parallel with the
 * analysis rather than adding another visible processing stage.
 */
export async function fingerprintSupplierName(
  enteredName: string,
  suppliers: Supplier[],
): Promise<SupplierFingerprintResult> {
  await Promise.resolve();

  const normalizedEnteredName = normalizeSupplierName(enteredName);
  if (!normalizedEnteredName) return { kind: "none" };

  const exact = suppliers.find(
    (supplier) => normalizeSupplierName(supplier.name) === normalizedEnteredName,
  );
  if (exact) return { kind: "exact", supplierId: exact.id };

  const candidate = suppliers
    .map((supplier) => ({
      supplier,
      distance: Math.min(
        editDistance(normalizedEnteredName, normalizeSupplierName(supplier.name)),
        ...supplier.name.split(/\s+/).filter(Boolean).map((part) => editDistance(normalizedEnteredName, normalizeSupplierName(part))),
      ),
    }))
    .sort((left, right) => left.distance - right.distance)[0];
  const maximumDistance = Math.max(3, Math.floor(normalizedEnteredName.length * 0.3));

  return candidate && candidate.distance <= maximumDistance
    ? { kind: "fuzzy", supplierId: candidate.supplier.id }
    : { kind: "none" };
}
