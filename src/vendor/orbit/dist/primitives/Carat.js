'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Carat.module.css';
export var Carat = function (_a) {
    var _b = _a.visible, visible = _b === void 0 ? true : _b;
    return (_jsx("span", { className: clsx(styles.carat, visible ? styles.visible : styles.hidden), children: "|" }));
};
