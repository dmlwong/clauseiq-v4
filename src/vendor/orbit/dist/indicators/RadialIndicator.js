'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// These mirror the component tokens in components.css but are consumed as numbers for SVG math
var RADIAL_STROKE_RADIUS = 6; // --orbit-radial-stroke-radius
var RADIAL_STROKE_WIDTH = 2.5; // --orbit-radial-stroke-width
export var RadialIndicator = function (_a) {
    var _b = _a.status, status = _b === void 0 ? 'Success' : _b, _c = _a.progress, progress = _c === void 0 ? 75 : _c, _d = _a.size, size = _d === void 0 ? 24 : _d, // --orbit-radial-size
    ariaLabel = _a.ariaLabel;
    var trackColorMap = {
        Success: 'var(--orbit-color-radial-track-success)',
        Information: 'var(--orbit-color-radial-track-information)',
        Error: 'var(--orbit-color-radial-track-error)',
        Warning: 'var(--orbit-color-radial-track-warning)',
        'No Status': 'var(--orbit-color-radial-track-no-status)',
    };
    var arcColorMap = {
        Success: 'var(--orbit-color-status-high-bg-success)',
        Information: 'var(--orbit-color-status-high-bg-information)',
        Error: 'var(--orbit-color-status-high-bg-error)',
        Warning: 'var(--orbit-color-status-high-bg-warning)',
        'No Status': 'var(--orbit-color-status-high-bg-no-status)',
    };
    var r = RADIAL_STROKE_RADIUS;
    var circumference = 2 * Math.PI * r;
    var boundedProgress = Number.isFinite(progress)
        ? Math.min(100, Math.max(0, progress))
        : 0;
    var offset = circumference - (boundedProgress / 100) * circumference;
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", role: "img", "aria-label": ariaLabel || "".concat(status, " progress ").concat(boundedProgress, "%"), style: { transform: 'rotate(-90deg)' }, children: [_jsx("circle", { cx: "12", cy: "12", r: r, fill: "none", stroke: trackColorMap[status], strokeWidth: RADIAL_STROKE_WIDTH }), _jsx("circle", { cx: "12", cy: "12", r: r, fill: "none", stroke: arcColorMap[status], strokeWidth: RADIAL_STROKE_WIDTH, strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: "round" })] }));
};
