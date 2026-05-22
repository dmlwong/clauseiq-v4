'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
// Common Font Awesome 6 Pro unicode values. Icons render with Regular weight by default.
export var FA = {
    circleCheck: '\uf058',
    circleInfo: '\uf05a',
    circleExclamation: '\uf06a',
    triangleExclamation: '\uf071',
    xmark: '\uf00d',
    xmarkLarge: '\uf2d3',
    check: '\uf00c',
    file: '\uf15b',
    star: '\uf005',
    square: '\uf0c8',
    minus: '\uf068',
    chevronRight: '\uf054',
    user: '\uf007',
    smile: '\uf118',
    anglesUp: '\uf102',
    angleUp: '\uf106',
    angleDown: '\uf107',
    arrowUpDown: '\uf0dc',
    sortUp: '\uf0de',
    sortDown: '\uf0dd',
    circleQuestion: '\uf059',
    anglesDown: '\uf103',
    grip: '\uf58d',
};
export var FaIcon = function (_a) {
    var icon = _a.icon, _b = _a.size, size = _b === void 0 ? 12 : _b, _c = _a.color, color = _c === void 0 ? 'currentColor' : _c, externalStyle = _a.style, _d = _a.ariaHidden, ariaHidden = _d === void 0 ? true : _d;
    return (_jsx("span", { "aria-hidden": ariaHidden, style: __assign({ fontFamily: "'Font Awesome 6 Pro'", fontWeight: 400, fontSize: size, color: color, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'normal' }, externalStyle), children: icon }));
};
