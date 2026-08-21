import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Prototype CP v3 design-system guard.
 *
 * Stricter than the CP v1 guard (`src/pages/PrototypeCPDesignSystem.test.ts`): in addition to
 * banning raw interactive controls, it enforces efficio-theme purity, token discipline, and
 * namespace isolation. Every rule maps to a numbered rule in
 * `src/components/prototype-cp-v3/TOKEN_MAP.md` §H.
 *
 * Rules 9 and 11 (OrbitInspector mount, runtime data-theme ancestor) need a rendered tree, so
 * they live in the page tests rather than here; §H records where each is enforced.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const srcRoot = path.join(repoRoot, "src");
const namespaceRoot = path.join(srcRoot, "components", "prototype-cp-v3");
const pageRoot = path.join(srcRoot, "pages");
const libRoot = path.join(srcRoot, "lib");

/**
 * Adapter dirs are the only place raw interactive elements may appear (rule 1).
 * Fully qualified so an `orbit-ui` directory created elsewhere is not silently exempt.
 */
const ADAPTER_PATH_PARTS = [
  `${path.sep}prototype-cp-v3${path.sep}clauseiq${path.sep}orbit-ui${path.sep}`,
  `${path.sep}prototype-cp-v3${path.sep}orbit${path.sep}`,
];

/** The only file permitted to define `--orbit-*` custom properties (rule 4). */
const TOKENS_FILE = path.join(namespaceRoot, "tokens.css");

/**
 * Custom properties `tokens.css` may define — TOKEN_MAP.md §A.3: none.
 *
 * All 13 candidates from rev 1 resolved to existing efficio tokens; `--orbit-shadow-overlay`
 * was withdrawn once `vendor/orbit/dist/feedback/Overlay.module.css:15` proved efficio's own
 * Overlay uses `--orbit-shadow-lg`. A new token is a change request against
 * `packages/orbit/styles/tokens/`, not a prototype-local override (`tokens.md:144`).
 */
const ALLOWED_LOCAL_TOKENS = new Set<string>([]);

/**
 * Paths outside the namespace that this port may touch (§H, closed list). Anything else in the
 * working diff is a defect. Kept here so the list is executable, not aspirational.
 */
const PERMITTED_FOREIGN_EDITS = [
  "src/App.tsx",
  "src/lib/prototype-store.ts",
  "src/pages/PrototypeTimeline.tsx",
  "tailwind.config.ts",
  "package.json",
  "package-lock.json",
  // CP v3's private Orbit build — new aliases (@orbit-cp*), additive only.
  "vite.config.ts",
  "vitest.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "src/vite-env.d.ts",
];

/**
 * Directory prefixes outside the namespace that may change wholesale.
 *
 * `src/vendor/orbit-cp/` — CP v3's PRIVATE Orbit build (634 tokens + CpWorkspaceShell),
 * reached only through the @orbit-cp* aliases and used by no other prototype. This is how CP v3
 * gets the Connected Platform token families without touching the shared @efficio/orbit — so
 * v6 et al. stay pixel-identical. The shared `src/vendor/orbit/` is deliberately NOT permitted:
 * it must stay on the old build for the other six prototypes (rule 10 depends on it).
 */
const PERMITTED_FOREIGN_PREFIXES = ["src/vendor/orbit-cp/"];

/** Paths that must stay byte-identical to HEAD (rule 10). Full isolation — no exceptions. */
const FROZEN_PATHS = [
  "src/components/clauseiq-v6a",
  "src/components/workflow-v6a",
  "src/pages/ClauseIQV6A.tsx",
  "src/pages/ClauseIQV6A.test.tsx",
  "src/pages/IndexV6A.tsx",
];

/** Named CSS colours common enough to appear by accident. Rule 3. */
const NAMED_COLOURS = [
  "white", "black", "red", "green", "blue", "yellow", "orange", "purple", "pink",
  "grey", "gray", "silver", "navy", "teal", "aqua", "lime", "maroon", "olive",
  "fuchsia", "crimson", "coral", "salmon", "gold", "beige", "ivory", "tan",
];

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(entryPath) : entryPath;
  });
}

function isSourceFile(filePath: string) {
  return /\.(tsx|ts|css)$/.test(filePath) && !/\.test\.(tsx|ts)$/.test(filePath);
}

function isAdapterFile(filePath: string) {
  return ADAPTER_PATH_PARTS.some((part) => filePath.includes(part));
}

/** Every file owned by the CP v3 namespace, wherever it lives. */
function namespaceFiles() {
  const namespaced = walk(namespaceRoot);
  const pages = walk(pageRoot).filter((filePath) =>
    /^PrototypeCPV3.*\.(tsx|css)$/.test(path.basename(filePath)),
  );
  const libs = walk(libRoot).filter((filePath) =>
    /^prototype-cp-v3-.*\.ts$/.test(path.basename(filePath)),
  );
  return [...namespaced, ...pages, ...libs].filter(isSourceFile);
}

type Violation = { file: string; line: number; rule: string; source: string };

/**
 * Blanks out comment bodies while preserving line count and column positions, so rules
 * inspect executable code rather than prose. Provenance comments citing v6a source files
 * are documentation we want to keep, not violations.
 */
function stripComments(source: string) {
  const blankOut = (match: string) => match.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blankOut)
    .replace(/(^|[^:])\/\/[^\n]*/g, (match, prefix: string) => prefix + blankOut(match.slice(prefix.length)));
}

function scan(
  files: string[],
  rule: string,
  predicate: (line: string, filePath: string) => boolean,
): Violation[] {
  return files.flatMap((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const code = stripComments(raw).split("\n");
    const original = raw.split("\n");
    return code.flatMap((line, index) =>
      predicate(line, filePath)
        ? [
            {
              file: path.relative(repoRoot, filePath),
              line: index + 1,
              rule,
              source: (original[index] ?? line).trim(),
            },
          ]
        : [],
    );
  });
}

function git(...args: string[]) {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" });
}

/**
 * Every `--orbit-*` name the efficio design system defines, read from the vendored token
 * sources. Rule 4 uses this to tell re-scoping (legal) from inventing (illegal).
 */
function efficioTokenNames(): Set<string> {
  const tokenDir = path.join(srcRoot, "vendor", "orbit", "styles", "tokens");
  const names = new Set<string>();
  for (const filePath of walk(tokenDir).filter((f) => f.endsWith(".css"))) {
    const source = fs.readFileSync(filePath, "utf8");
    for (const match of source.matchAll(/(--orbit-[a-z0-9-]+)\s*:/g)) names.add(match[1]);
  }
  return names;
}

describe("Prototype CP v3 design-system guard", () => {
  it("rule 1 — keeps raw interactive controls inside adapter files only", () => {
    const patterns = [
      /<\/?button\b/,
      /<input\b/,
      /<select\b/,
      /<textarea\b/,
      /<\/?(?:table|thead|tbody|tr|td|th)\b/,
      /<a\b/,
      /\brole=["']button["']/,
      /\?\s*["']button["']/,
      /createElement\(["']button["']/,
    ];
    const files = namespaceFiles().filter((f) => !isAdapterFile(f) && /\.tsx?$/.test(f));
    const violations = scan(files, "native control", (line) =>
      patterns.some((pattern) => pattern.test(line)),
    );
    expect(violations).toEqual([]);
  });

  it("rule 2 — never sets data-theme (efficio base only)", () => {
    const violations = scan(namespaceFiles(), "data-theme", (line) => /data-theme\s*=/.test(line));
    expect(violations).toEqual([]);
  });

  it("rule 3 — no raw colour values anywhere, in any notation", () => {
    // No file is exempt. Rev 1 exempted `clauseiq-theme.css` wholesale, which amounted to a
    // colour amnesty for the file carrying ~120 re-expressed rules. The shadcn HSL bridge it
    // hosts must be expressed as `hsl(from var(--orbit-...) h s l)`-style derivations or as
    // channel triples referencing tokens — never as literal values (TOKEN_MAP.md §F.2).
    const namedColour = new RegExp(
      `:\\s*(${NAMED_COLOURS.join("|")})\\s*(!|;|$|\\))`,
      "i",
    );
    const violations = scan(
      namespaceFiles(),
      "raw colour",
      (line) =>
        /#[0-9a-fA-F]{3,8}\b/.test(line) ||
        /\brgba?\(/.test(line) ||
        /\bhsla?\(\s*[\d.]/.test(line) ||
        /\boklch\(|\blab\(|\bcolor\(/.test(line) ||
        namedColour.test(line) ||
        // Tailwind palette utilities — resolve to Tailwind's palette, not efficio.
        /\b(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|shadow|accent|caret|decoration)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/.test(
          line,
        ),
    );
    expect(violations).toEqual([]);
  });

  it("rule 4 — invents no new --orbit-* names; re-scoping a system token stays legal", () => {
    // Two distinct concerns, and rev 1 conflated them into a ban that blocked legitimate work:
    //
    //   Re-scoping  `.x { --orbit-color-card-border-success: var(--orbit-color-text-success); }`
    //               Sanctioned instance retheming (`tokens.md:49-50`). v6a relies on it at
    //               orbit-theme.css:61, :62, :111. Must stay LEGAL.
    //   Inventing   `.x { --orbit-color-my-thing: ...; }`
    //               Claims a new name in the design system's namespace, telling a developer the
    //               system owns a value it does not. Must be ILLEGAL (`tokens.md:144`).
    //
    // So the test is on the NAME, not the value: a --orbit-* property assigned outside
    // tokens.css must already exist in the efficio token set. Colour literals in the value are
    // rule 3's job — it exempts no file, so there is no gap here.
    const known = efficioTokenNames();
    expect(known.size).toBeGreaterThan(400); // fail loudly if token sources move

    const invented = scan(
      namespaceFiles().filter((filePath) => filePath !== TOKENS_FILE),
      "invents a new --orbit-* name outside tokens.css",
      (line) => {
        const match = /(--orbit-[a-z0-9-]+)\s*:/.exec(line);
        return match ? !known.has(match[1]) : false;
      },
    );
    expect(invented).toEqual([]);

    if (fs.existsSync(TOKENS_FILE)) {
      const tokensCode = stripComments(fs.readFileSync(TOKENS_FILE, "utf8"));
      const declared = [...tokensCode.matchAll(/(--orbit-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
      const unapproved = declared.filter((name) => !ALLOWED_LOCAL_TOKENS.has(name));
      expect(unapproved).toEqual([]);
    }
  });

  it("rule 5 — no !important", () => {
    const violations = scan(namespaceFiles(), "!important", (line) => /!important/.test(line));
    expect(violations).toEqual([]);
  });

  it("rule 6 — imports nothing from other prototype namespaces", () => {
    // Covers alias imports, relative escapes, and shadcn primitives (`@/components/ui/`),
    // which carry raw Tailwind plus the global HSL bridge into the namespace.
    const aliasForeign =
      /from\s+["']@\/components\/(?!prototype-cp-v3)(clauseiq-v|workflow-v|wizard-|prototype-cp|delivery-engine|ui\/)/;
    const relativeForeign =
      /from\s+["'](?:\.\.\/)+(?:clauseiq-v|workflow-v|wizard-|prototype-cp-(?:shared|results|v1|v2)|delivery-engine|ui)\//;
    const violations = scan(
      namespaceFiles().filter((f) => /\.tsx?$/.test(f)),
      "cross-prototype import",
      (line) => aliasForeign.test(line) || relativeForeign.test(line),
    );
    expect(violations).toEqual([]);
  });

  it("rule 7 — carries no v6a identifiers (storage keys, import paths)", () => {
    const violations = scan(namespaceFiles(), "v6a identifier", (line) =>
      /ciq-v6a|clauseiq-v6a|workflow-v6a/.test(line),
    );
    expect(violations).toEqual([]);
  });

  it("rule 8 — uses Orbit FaIcon, never lucide-react", () => {
    // `anti-patterns.md:21`. v6a carries one lucide import that must not survive the port.
    const violations = scan(
      namespaceFiles().filter((f) => /\.tsx?$/.test(f)),
      "lucide-react",
      (line) => /from\s+["']lucide-react["']/.test(line) || /@tabler\/icons-react/.test(line),
    );
    expect(violations).toEqual([]);
  });

  it("rule 10 — leaves CCP v6a byte-identical apart from the approved Alert migration", () => {
    const changed = git("diff", "--name-only", "HEAD", "--", ...FROZEN_PATHS)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    // No v6a file may change except the approved one.
    expect(changed.filter((f) => !APPROVED_V6A_DEVIATIONS.includes(f))).toEqual([]);

    // Within the approved file, every changed line must belong to the Alert migration.
    for (const file of changed) {
      const offending = git("diff", "-U0", "HEAD", "--", file)
        .split("\n")
        .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line))
        .map((line) => line.slice(1).trim())
        .filter(Boolean)
        .filter((line) => !ALERT_MIGRATION_TOKENS.test(line));
      expect({ file, offending }).toEqual({ file, offending: [] });
    }
  });

  it("rule 10b — touches nothing outside the namespace beyond the permitted list", () => {
    const changed = git("status", "--porcelain")
      .split("\n")
      .map((line) => line.slice(3).trim())
      .filter(Boolean)
      // Renames report "old -> new"; take the destination.
      .map((entry) => (entry.includes(" -> ") ? entry.split(" -> ")[1] : entry))
      .filter((entry) => !entry.startsWith("src/components/prototype-cp-v3"))
      .filter((entry) => !/^src\/pages\/PrototypeCPV3/.test(entry))
      .filter((entry) => !/^src\/lib\/prototype-cp-v3-/.test(entry))
      .filter((entry) => !PERMITTED_FOREIGN_EDITS.includes(entry))
      .filter((entry) => !PERMITTED_FOREIGN_PREFIXES.some((p) => entry.startsWith(p)));
    expect(changed).toEqual([]);
  });

  it("rule 12 — scans a non-empty file set", () => {
    // Guards against the suite passing vacuously because the glob broke.
    expect(fs.existsSync(namespaceRoot)).toBe(true);
    expect(namespaceFiles().length).toBeGreaterThanOrEqual(3);
  });
});
