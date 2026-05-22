'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FaIcon, FA } from '../primitives/FaIcon';
var movementConfig = {
    Positive: { icon: FA.angleUp, color: 'var(--orbit-color-status-high-bg-success)' },
    Negative: { icon: FA.angleDown, color: 'var(--orbit-color-status-high-bg-error)' },
    None: { icon: FA.minus, color: 'var(--orbit-color-silver)' },
};
export var PriceIndicator = function (_a) {
    var _b = _a.value, value = _b === void 0 ? 'Value' : _b, _c = _a.movement, movement = _c === void 0 ? 'Positive' : _c, _d = _a.position, position = _d === void 0 ? 'Right' : _d, ariaLabel = _a.ariaLabel;
    var config = movementConfig[movement];
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
    return (_jsxs("span", { style: containerStyles, "aria-label": ariaLabel || "".concat(value, ", ").concat(movement.toLowerCase(), " price movement"), children: [_jsx(FaIcon, { icon: config.icon, size: 14, color: config.color }), _jsx("span", { style: labelStyles, children: value })] }));
};
