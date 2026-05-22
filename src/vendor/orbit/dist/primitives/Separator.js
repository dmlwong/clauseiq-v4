'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Separator.module.css';
export var Separator = function (_a) {
    var _b = _a.orientation, orientation = _b === void 0 ? 'Horizontal' : _b, _c = _a.decorative, decorative = _c === void 0 ? false : _c;
    return (_jsx("div", { role: decorative ? 'presentation' : 'separator', "aria-orientation": decorative ? undefined : orientation.toLowerCase(), className: clsx(styles.separator, orientation === 'Horizontal' ? styles.horizontal : styles.vertical) }));
};
