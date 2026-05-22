'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { FaIcon, FA } from '../primitives/FaIcon';
import styles from './StepCircle.module.css';
var sizeClassMap = {
    Large: styles.large,
    Medium: styles.medium,
    Small: styles.small,
};
var statusClassMap = {
    Checked: styles.checked,
    Active: styles.active,
    'To Do': styles.toDo,
    Numbered: styles.numbered,
    Disabled: styles.disabled,
};
var iconSizeMap = {
    Large: 16,
    Medium: 10,
    Small: 8,
};
export var StepCircle = function (_a) {
    var status = _a.status, _b = _a.size, size = _b === void 0 ? 'Large' : _b, label = _a.label, ariaLabel = _a.ariaLabel;
    return (_jsxs("span", { className: clsx(styles.circle, sizeClassMap[size], statusClassMap[status]), role: "img", "aria-label": ariaLabel || "Step ".concat(status).concat(label ? " ".concat(label) : ''), children: [status === 'Checked' && (_jsx(FaIcon, { icon: FA.check, size: iconSizeMap[size], color: "var(--orbit-color-white)" })), status === 'Numbered' && _jsx("span", { className: styles.digit, children: label }), status === 'Active' && _jsx("span", { className: styles.marker, "aria-hidden": "true" })] }));
};
