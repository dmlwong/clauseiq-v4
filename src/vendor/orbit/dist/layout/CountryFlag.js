'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './CountryFlag.module.css';
function flagFromCountryCode(country) {
    var code = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code))
        return '';
    return Array.from(code)
        .map(function (letter) { return String.fromCodePoint(127397 + letter.charCodeAt(0)); })
        .join('');
}
export var CountryFlag = function (_a) {
    var country = _a.country, countryName = _a.countryName, flag = _a.flag;
    var label = countryName || country;
    var flagGlyph = flag !== null && flag !== void 0 ? flag : flagFromCountryCode(country);
    return (_jsxs("span", { className: styles.container, children: [flagGlyph && _jsx("span", { className: styles.flag, "aria-hidden": "true", children: flagGlyph }), _jsx("span", { children: label })] }));
};
