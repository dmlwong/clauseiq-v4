'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
import styles from './Headings.module.css';
var sizeClassMap = {
    'Heading 1': styles.heading1,
    'Heading 2': styles.heading2,
    'Heading 3': styles.heading3,
    'Heading 4': styles.heading4,
    'Heading 5': styles.heading5,
};
var tagMap = {
    'Heading 1': 'h1',
    'Heading 2': 'h2',
    'Heading 3': 'h3',
    'Heading 4': 'h4',
    'Heading 5': 'h5',
};
export var Headings = function (_a) {
    var size = _a.size, children = _a.children, externalStyle = _a.style;
    var Tag = tagMap[size];
    return (_jsx(Tag, { className: clsx(styles.heading, sizeClassMap[size]), style: externalStyle, children: children }));
};
