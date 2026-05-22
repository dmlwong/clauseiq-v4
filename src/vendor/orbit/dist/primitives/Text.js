'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Text.module.css';
var colorClassMap = {
    Primary: styles.primary,
    Secondary: styles.secondary,
    Bold: styles.primary,
    Disabled: styles.disabled,
    Inverse: styles.inverse,
    Error: styles.error,
    Information: styles.information,
    Warning: styles.warning,
};
export var Text = function (_a) {
    var children = _a.children, _b = _a.as, Component = _b === void 0 ? 'span' : _b, _c = _a.size, size = _c === void 0 ? 'Paragraph' : _c, _d = _a.variant, variant = _d === void 0 ? 'Primary' : _d;
    var isParagraph = size === 'Paragraph';
    var isBold = variant === 'Bold';
    return (_jsx(Component, { className: clsx(styles.text, isParagraph ? styles.paragraph : styles.small, isBold ? styles.bold : styles.regular, isParagraph && !isBold && styles.leadingParagraph, isBold && styles.leadingBold, !isParagraph && !isBold && styles.leadingSmall, colorClassMap[variant]), children: children }));
};
