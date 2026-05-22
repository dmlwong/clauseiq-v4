'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Spinner.module.css';
var sizeMap = {
    Inline: styles.inline,
    Medium: styles.medium,
    Large: styles.large,
};
export var Spinner = function (_a) {
    var _b = _a.size, size = _b === void 0 ? 'Inline' : _b, _c = _a.label, label = _c === void 0 ? 'Loading' : _c, _d = _a.decorative, decorative = _d === void 0 ? false : _d;
    return (_jsx("span", { className: clsx(styles.spinner, sizeMap[size]), role: decorative ? undefined : 'status', "aria-label": decorative ? undefined : label, "aria-hidden": decorative || undefined }));
};
