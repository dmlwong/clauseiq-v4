'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FaIcon, FA } from '../primitives/FaIcon';
var iconConfig = {
    'Very High': { icon: FA.anglesUp, color: 'var(--orbit-color-status-high-bg-error)' },
    'High': { icon: FA.angleUp, color: 'var(--orbit-color-status-high-bg-warning)' },
    'Medium': { icon: FA.minus, color: 'var(--orbit-color-silver)' },
    'Low': { icon: FA.angleDown, color: 'var(--orbit-color-status-high-bg-information)' },
    'Very Low': { icon: FA.anglesDown, color: 'var(--orbit-color-status-high-bg-information)' },
    'None': { icon: FA.minus, color: 'var(--orbit-color-silver)' },
};
var labelMap = {
    'Very High': 'Very High',
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Low',
    'Very Low': 'Very Low',
    'None': 'No Change',
};
export var RiskIndicator = function (_a) {
    var _b = _a.level, level = _b === void 0 ? 'Very High' : _b, _c = _a.position, position = _c === void 0 ? 'Right' : _c, ariaLabel = _a.ariaLabel;
    var config = iconConfig[level];
    var containerStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--orbit-space-xs)',
        padding: 'var(--orbit-space-xs)',
        flexDirection: position === 'Left' ? 'row-reverse' : 'row',
    };
    var labelStyles = {
        fontFamily: 'var(--orbit-font-family-sans)',
        fontSize: 'var(--orbit-text-sm)',
        fontWeight: 'var(--orbit-font-weight-regular)',
        lineHeight: 'var(--orbit-text-body-leading)',
        color: 'var(--orbit-color-text-primary)',
    };
    return (_jsxs("span", { style: containerStyles, "aria-label": ariaLabel || "Risk ".concat(labelMap[level]), children: [_jsx(FaIcon, { icon: config.icon, size: 14, color: config.color }), _jsx("span", { style: labelStyles, children: labelMap[level] })] }));
};
