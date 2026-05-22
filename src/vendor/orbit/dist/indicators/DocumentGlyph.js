'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './DocumentGlyph.module.css';
var colorMap = {
    XLS: 'var(--orbit-color-doc-xls)',
    DOC: 'var(--orbit-color-doc-word)',
    PDF: 'var(--orbit-color-doc-pdf)',
    ZIP: 'var(--orbit-color-doc-zip)',
    IMG: 'var(--orbit-color-doc-img)',
    Unknown: 'var(--orbit-color-doc-unknown)',
};
var labelMap = {
    XLS: 'XLS',
    DOC: 'DOC',
    PDF: 'PDF',
    ZIP: 'ZIP',
    IMG: '',
    Unknown: '',
};
// Font Awesome unicode for the icon types
var iconMap = {
    IMG: '\uf03e', // image
    Unknown: '\uf059', // circle-question
};
var sizeMap = {
    Large: 'var(--orbit-document-glyph-size-large)',
    Medium: 'var(--orbit-document-glyph-size-medium)',
    Small: 'var(--orbit-document-glyph-size-small)',
    'Extra Small': 'var(--orbit-document-glyph-size-extra-small)',
    Micro: 'var(--orbit-document-glyph-size-micro)',
};
var labelSizeMap = {
    Large: 'var(--orbit-document-glyph-label-size-large)',
    Medium: 'var(--orbit-document-glyph-label-size-medium)',
    Small: 'var(--orbit-document-glyph-label-size-small)',
    'Extra Small': 'var(--orbit-document-glyph-label-size-extra-small)',
};
var iconSizeMap = {
    Large: 'var(--orbit-document-glyph-icon-size-large)',
    Medium: 'var(--orbit-document-glyph-icon-size-medium)',
    Small: 'var(--orbit-document-glyph-icon-size-small)',
    'Extra Small': 'var(--orbit-document-glyph-icon-size-extra-small)',
};
var overlayPaddingMap = {
    Large: 'var(--orbit-document-glyph-overlay-padding-large)',
    Medium: 'var(--orbit-document-glyph-overlay-padding-medium)',
    Small: 'var(--orbit-document-glyph-overlay-padding-small)',
    'Extra Small': 'var(--orbit-document-glyph-overlay-padding-extra-small)',
};
export var DocumentGlyph = function (_a) {
    var _b = _a.documentType, documentType = _b === void 0 ? 'XLS' : _b, _c = _a.size, size = _c === void 0 ? 'Large' : _c, ariaLabel = _a.ariaLabel;
    var sizeToken = sizeMap[size];
    var color = colorMap[documentType];
    var label = labelMap[documentType];
    var faIcon = iconMap[documentType];
    var isMicro = size === 'Micro';
    if (isMicro) {
        return (_jsx("span", { className: styles.micro, style: { '--_color': color, '--_size': sizeToken }, role: "img", "aria-label": ariaLabel || "".concat(documentType, " document") }));
    }
    // Use a normalized 48x64 viewBox for consistent proportions, then scale via tokenized wrapper dimensions.
    var style = {
        '--_size': sizeToken,
        '--_label-size': labelSizeMap[size],
        '--_icon-size': iconSizeMap[size],
        '--_overlay-padding': overlayPaddingMap[size],
    };
    return (_jsxs("span", { className: styles.wrapper, style: style, role: "img", "aria-label": ariaLabel || "".concat(documentType, " document"), children: [_jsxs("svg", { width: "100%", height: "100%", viewBox: "0 0 48 64", fill: "none", children: [_jsx("path", { d: "M4 0 L34 0 L48 14 L48 59 Q48 64 43 64 L5 64 Q0 64 0 59 L0 5 Q0 0 4 0 Z", fill: color }), _jsx("path", { d: "M34 0 L48 14 L38 14 Q34 14 34 10 L34 0 Z", fill: "var(--orbit-color-doc-fold-overlay)" })] }), _jsxs("span", { className: styles.overlay, children: [label && (_jsx("span", { className: styles.textLabel, children: label })), faIcon && (_jsx("span", { className: styles.iconLabel, children: faIcon }))] })] }));
};
