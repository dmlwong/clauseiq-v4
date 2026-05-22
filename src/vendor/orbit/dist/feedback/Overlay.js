'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Overlay.module.css';
export var Overlay = function (_a) {
    var visible = _a.visible, onClose = _a.onClose, children = _a.children, _b = _a.ariaLabel, ariaLabel = _b === void 0 ? 'Dialog' : _b, ariaLabelledBy = _a.ariaLabelledBy, _c = _a.size, size = _c === void 0 ? 'Default' : _c, _d = _a.height, height = _d === void 0 ? 'Viewport' : _d;
    var modalRef = useRef(null);
    var previousFocusRef = useRef(null);
    useEffect(function () {
        var _a;
        if (!visible)
            return;
        previousFocusRef.current = document.activeElement;
        var previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        (_a = modalRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        var handleKeyDown = function (e) {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !modalRef.current)
                return;
            var focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) {
                e.preventDefault();
                return;
            }
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first || document.activeElement === modalRef.current) {
                    e.preventDefault();
                    last.focus();
                }
            }
            else {
                if (document.activeElement === last || document.activeElement === modalRef.current) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return function () {
            var _a;
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            (_a = previousFocusRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            previousFocusRef.current = null;
        };
    }, [visible, onClose]);
    if (!visible || typeof document === 'undefined')
        return null;
    return createPortal(_jsx("div", { className: styles.backdrop, onClick: onClose, children: _jsx("div", { ref: modalRef, className: clsx(styles.modal, size === 'Large' && styles.large, height === 'Content' && styles.contentHeight), onClick: function (e) { return e.stopPropagation(); }, role: "dialog", "aria-modal": "true", "aria-label": ariaLabelledBy ? undefined : ariaLabel, "aria-labelledby": ariaLabelledBy, tabIndex: -1, children: children }) }), document.body);
};
