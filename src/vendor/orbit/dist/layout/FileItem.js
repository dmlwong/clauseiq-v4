'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
import { DocumentGlyph } from '../indicators/DocumentGlyph';
import styles from './FileItem.module.css';
export var FileItem = function (_a) {
    var filename = _a.filename, _b = _a.documentType, documentType = _b === void 0 ? 'Unknown' : _b, trailing = _a.trailing, onClick = _a.onClick, fixedWidth = _a.fixedWidth;
    var contents = (_jsxs(_Fragment, { children: [_jsx(DocumentGlyph, { documentType: documentType, size: "Medium" }), _jsx("span", { className: styles.filename, children: filename }), trailing && _jsx("span", { className: styles.trailing, children: trailing })] }));
    var style = fixedWidth ? { '--_width': "".concat(fixedWidth, "px") } : undefined;
    if (onClick) {
        return (_jsx("button", { type: "button", className: clsx(styles.fileItem, styles.interactive), style: style, onClick: onClick, children: contents }));
    }
    return (_jsx("div", { className: styles.fileItem, style: style, children: contents }));
};
