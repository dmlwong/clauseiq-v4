'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './LegendLabel.module.css';
export var LegendLabel = function (_a) {
    var _b = _a.value, value = _b === void 0 ? 'Value' : _b, _c = _a.color, color = _c === void 0 ? 'var(--orbit-color-bright-green)' : _c, _d = _a.position, position = _d === void 0 ? 'Right' : _d;
    return (_jsxs("span", { className: clsx(styles.container, position === 'Left' ? styles.left : styles.right), children: [_jsx("span", { className: styles.dot, style: { '--_color': color } }), _jsx("span", { className: styles.label, children: value })] }));
};
