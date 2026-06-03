import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const srcRoot = path.join(repoRoot, "src");

const componentRoots = [
  "prototype-cp",
  "prototype-cp-v2",
  "prototype-cp-shared",
  "prototype-cp-results",
  "prototype-cp-v2-results",
].map((folder) => path.join(srcRoot, "components", folder));

const pageRoot = path.join(srcRoot, "pages");
const adapterPathParts = [
  `${path.sep}orbit-ui${path.sep}`,
  `${path.sep}prototype-cp-shared${path.sep}orbit${path.sep}`,
];

const forbiddenPatterns = [
  { label: "native button", pattern: /<\/?button\b/ },
  { label: "native input", pattern: /<input\b/ },
  { label: "native select", pattern: /<select\b/ },
  { label: "native textarea", pattern: /<textarea\b/ },
  { label: "native table", pattern: /<\/?(?:table|thead|tbody|tr|td|th)\b/ },
  { label: "native anchor", pattern: /<a\b/ },
  { label: "non-button role button", pattern: /\brole=["']button["']/ },
  { label: "dynamic native button", pattern: /\?\s*["']button["']/ },
  { label: "created native button", pattern: /createElement\(["']button["']/ },
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(entryPath);
    return entryPath;
  });
}

function isSourceFile(filePath: string) {
  return /\.(tsx|ts)$/.test(filePath) && !/\.test\.(tsx|ts)$/.test(filePath);
}

function isAdapterFile(filePath: string) {
  return adapterPathParts.some((part) => filePath.includes(part));
}

function isPrototypeCpPage(filePath: string) {
  const fileName = path.basename(filePath);
  return filePath.startsWith(pageRoot) && /^PrototypeCP.*\.tsx$/.test(fileName);
}

function filesToScan() {
  const pages = walk(pageRoot).filter(isPrototypeCpPage);
  const components = componentRoots.flatMap(walk);
  return [...pages, ...components]
    .filter(isSourceFile)
    .filter((filePath) => !isAdapterFile(filePath));
}

describe("Prototype CP design-system guard", () => {
  it("keeps raw interactive controls inside Prototype CP adapter files only", () => {
    const files = filesToScan();
    expect(files.length).toBeGreaterThan(0);

    const violations = files.flatMap((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      return source.split("\n").flatMap((line, index) => (
        forbiddenPatterns
          .filter(({ pattern }) => pattern.test(line))
          .map(({ label }) => ({
            file: path.relative(repoRoot, filePath),
            line: index + 1,
            label,
            source: line.trim(),
          }))
      ));
    });

    expect(violations).toEqual([]);
  });
});
