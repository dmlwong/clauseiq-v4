'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { FaIcon, Text } from '../primitives';
import styles from './Dropzone.module.css';
var ICON_UPLOAD = '\ue09a';
export var Dropzone = function (_a) {
    var onFileSelected = _a.onFileSelected, accept = _a.accept, _b = _a.disabled, disabled = _b === void 0 ? false : _b, ariaLabel = _a.ariaLabel, _c = _a.chooseButtonLabel, chooseButtonLabel = _c === void 0 ? 'choose files' : _c, _d = _a.promptPrefix, promptPrefix = _d === void 0 ? 'Drag & drop or' : _d, _e = _a.promptSuffix, promptSuffix = _e === void 0 ? 'to upload' : _e, acceptedFileTypesLabel = _a.acceptedFileTypesLabel, maxFileSizeLabel = _a.maxFileSizeLabel, error = _a.error, icon = _a.icon;
    var inputRef = useRef(null);
    var _f = useState(false), dragActive = _f[0], setDragActive = _f[1];
    var openFilePicker = function () {
        var _a;
        if (!disabled)
            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    var handleFile = function (file) {
        if (!file || disabled)
            return;
        onFileSelected(file);
    };
    return (_jsxs("div", { className: styles.root, children: [error && (_jsx("div", { className: styles.error, role: "alert", children: error })), _jsx("input", { ref: inputRef, className: styles.hiddenInput, type: "file", accept: accept, "aria-label": ariaLabel, tabIndex: -1, disabled: disabled, onChange: function (event) {
                    var _a;
                    handleFile((_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0]);
                    event.target.value = '';
                } }), _jsxs("div", { className: clsx(styles.dropzone, dragActive && styles.dropzoneActive, disabled && styles.dropzoneDisabled), role: "group", "aria-label": ariaLabel, "data-drag-active": dragActive ? 'true' : 'false', onClick: function (event) {
                    if (event.target.closest('button'))
                        return;
                    openFilePicker();
                }, onDragEnter: function (event) {
                    event.preventDefault();
                    if (!disabled)
                        setDragActive(true);
                }, onDragOver: function (event) {
                    event.preventDefault();
                    if (!disabled)
                        setDragActive(true);
                }, onDragLeave: function () { return setDragActive(false); }, onDrop: function (event) {
                    var _a;
                    event.preventDefault();
                    setDragActive(false);
                    handleFile((_a = event.dataTransfer.files) === null || _a === void 0 ? void 0 : _a[0]);
                }, children: [_jsx("span", { className: styles.icon, "aria-hidden": "true", children: icon !== null && icon !== void 0 ? icon : _jsx(FaIcon, { icon: ICON_UPLOAD, size: 32, color: "var(--orbit-color-text-secondary)" }) }), _jsxs("div", { className: styles.prompt, children: [_jsx(Text, { variant: "Primary", size: "Paragraph", children: promptPrefix }), _jsx("button", { type: "button", className: styles.chooseButton, onClick: openFilePicker, disabled: disabled, children: chooseButtonLabel }), _jsx(Text, { variant: "Primary", size: "Paragraph", children: promptSuffix })] }), acceptedFileTypesLabel && _jsx(Text, { variant: "Secondary", size: "Paragraph", children: acceptedFileTypesLabel }), maxFileSizeLabel && _jsx(Text, { variant: "Secondary", size: "Paragraph", children: maxFileSizeLabel })] })] }));
};
