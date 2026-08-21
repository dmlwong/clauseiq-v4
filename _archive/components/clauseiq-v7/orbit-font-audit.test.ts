import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const v7Roots = [
  "src/components/clauseiq-v7",
  "src/components/workflow-v7",
  "src/components/wizard-v7",
];
const v7PageFiles = ["src/pages/ClauseIQV7.tsx", "src/pages/IndexV7.tsx"];
const sourceFilePattern = /\.(tsx|ts|css)$/;
const forbiddenFontUtilityPattern = /\b(?:font-normal|font-medium|font-semibold|font-bold|font-mono)\b/g;

function collectSourceFiles(root: string, files: string[] = []) {
  if (!existsSync(root)) return files;

  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }

    if (!sourceFilePattern.test(entry)) continue;
    if (entry.includes(".test.") || entry.includes(".spec.")) continue;
    files.push(fullPath);
  }

  return files;
}

describe("ClauseIQ V7 Orbit typography audit", () => {
  it("does not use Tailwind font utility classes in production source", () => {
    const sourceFiles = new Set<string>();

    for (const root of v7Roots) {
      collectSourceFiles(path.join(repoRoot, root)).forEach((file) => sourceFiles.add(file));
    }

    for (const file of v7PageFiles) {
      const fullPath = path.join(repoRoot, file);
      if (existsSync(fullPath)) sourceFiles.add(fullPath);
    }

    const violations = [...sourceFiles].flatMap((file) => {
      const relativePath = path.relative(repoRoot, file);
      const lines = readFileSync(file, "utf8").split(/\r?\n/);

      return lines.flatMap((line, index) => {
        const matches = line.match(forbiddenFontUtilityPattern);
        return matches ? [`${relativePath}:${index + 1}: ${matches.join(", ")}`] : [];
      });
    });

    expect(violations).toEqual([]);
  });
});
