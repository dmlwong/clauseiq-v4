'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { FaIcon, FA } from '../primitives/FaIcon';
import styles from './Filter.module.css';
export var Filter = function (_a) {
    var label = _a.label, onRemove = _a.onRemove, _b = _a.state, state = _b === void 0 ? 'Default' : _b;
    return (_jsxs("span", { className: clsx(styles.filter, state === 'Hover' && styles.previewHover), children: [_jsx("span", { className: styles.label, children: label }), onRemove && (_jsx("button", { type: "button", className: styles.remove, onClick: onRemove, "aria-label": "Remove ".concat(label), children: _jsx(FaIcon, { icon: FA.xmark, size: 8, color: "currentColor" }) }))] }));
};
