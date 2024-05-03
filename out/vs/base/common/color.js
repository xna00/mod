/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Color = exports.HSVA = exports.HSLA = exports.RGBA = void 0;
    function roundFloat(number, decimalPoints) {
        const decimal = Math.pow(10, decimalPoints);
        return Math.round(number * decimal) / decimal;
    }
    class RGBA {
        constructor(r, g, b, a = 1) {
            this._rgbaBrand = undefined;
            this.r = Math.min(255, Math.max(0, r)) | 0;
            this.g = Math.min(255, Math.max(0, g)) | 0;
            this.b = Math.min(255, Math.max(0, b)) | 0;
            this.a = roundFloat(Math.max(Math.min(1, a), 0), 3);
        }
        static equals(a, b) {
            return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
        }
    }
    exports.RGBA = RGBA;
    class HSLA {
        constructor(h, s, l, a) {
            this._hslaBrand = undefined;
            this.h = Math.max(Math.min(360, h), 0) | 0;
            this.s = roundFloat(Math.max(Math.min(1, s), 0), 3);
            this.l = roundFloat(Math.max(Math.min(1, l), 0), 3);
            this.a = roundFloat(Math.max(Math.min(1, a), 0), 3);
        }
        static equals(a, b) {
            return a.h === b.h && a.s === b.s && a.l === b.l && a.a === b.a;
        }
        /**
         * Converts an RGB color value to HSL. Conversion formula
         * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
         * Assumes r, g, and b are contained in the set [0, 255] and
         * returns h in the set [0, 360], s, and l in the set [0, 1].
         */
        static fromRGBA(rgba) {
            const r = rgba.r / 255;
            const g = rgba.g / 255;
            const b = rgba.b / 255;
            const a = rgba.a;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0;
            let s = 0;
            const l = (min + max) / 2;
            const chroma = max - min;
            if (chroma > 0) {
                s = Math.min((l <= 0.5 ? chroma / (2 * l) : chroma / (2 - (2 * l))), 1);
                switch (max) {
                    case r:
                        h = (g - b) / chroma + (g < b ? 6 : 0);
                        break;
                    case g:
                        h = (b - r) / chroma + 2;
                        break;
                    case b:
                        h = (r - g) / chroma + 4;
                        break;
                }
                h *= 60;
                h = Math.round(h);
            }
            return new HSLA(h, s, l, a);
        }
        static _hue2rgb(p, q, t) {
            if (t < 0) {
                t += 1;
            }
            if (t > 1) {
                t -= 1;
            }
            if (t < 1 / 6) {
                return p + (q - p) * 6 * t;
            }
            if (t < 1 / 2) {
                return q;
            }
            if (t < 2 / 3) {
                return p + (q - p) * (2 / 3 - t) * 6;
            }
            return p;
        }
        /**
         * Converts an HSL color value to RGB. Conversion formula
         * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
         * Assumes h in the set [0, 360] s, and l are contained in the set [0, 1] and
         * returns r, g, and b in the set [0, 255].
         */
        static toRGBA(hsla) {
            const h = hsla.h / 360;
            const { s, l, a } = hsla;
            let r, g, b;
            if (s === 0) {
                r = g = b = l; // achromatic
            }
            else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = HSLA._hue2rgb(p, q, h + 1 / 3);
                g = HSLA._hue2rgb(p, q, h);
                b = HSLA._hue2rgb(p, q, h - 1 / 3);
            }
            return new RGBA(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a);
        }
    }
    exports.HSLA = HSLA;
    class HSVA {
        constructor(h, s, v, a) {
            this._hsvaBrand = undefined;
            this.h = Math.max(Math.min(360, h), 0) | 0;
            this.s = roundFloat(Math.max(Math.min(1, s), 0), 3);
            this.v = roundFloat(Math.max(Math.min(1, v), 0), 3);
            this.a = roundFloat(Math.max(Math.min(1, a), 0), 3);
        }
        static equals(a, b) {
            return a.h === b.h && a.s === b.s && a.v === b.v && a.a === b.a;
        }
        // from http://www.rapidtables.com/convert/color/rgb-to-hsv.htm
        static fromRGBA(rgba) {
            const r = rgba.r / 255;
            const g = rgba.g / 255;
            const b = rgba.b / 255;
            const cmax = Math.max(r, g, b);
            const cmin = Math.min(r, g, b);
            const delta = cmax - cmin;
            const s = cmax === 0 ? 0 : (delta / cmax);
            let m;
            if (delta === 0) {
                m = 0;
            }
            else if (cmax === r) {
                m = ((((g - b) / delta) % 6) + 6) % 6;
            }
            else if (cmax === g) {
                m = ((b - r) / delta) + 2;
            }
            else {
                m = ((r - g) / delta) + 4;
            }
            return new HSVA(Math.round(m * 60), s, cmax, rgba.a);
        }
        // from http://www.rapidtables.com/convert/color/hsv-to-rgb.htm
        static toRGBA(hsva) {
            const { h, s, v, a } = hsva;
            const c = v * s;
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = v - c;
            let [r, g, b] = [0, 0, 0];
            if (h < 60) {
                r = c;
                g = x;
            }
            else if (h < 120) {
                r = x;
                g = c;
            }
            else if (h < 180) {
                g = c;
                b = x;
            }
            else if (h < 240) {
                g = x;
                b = c;
            }
            else if (h < 300) {
                r = x;
                b = c;
            }
            else if (h <= 360) {
                r = c;
                b = x;
            }
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
            return new RGBA(r, g, b, a);
        }
    }
    exports.HSVA = HSVA;
    class Color {
        static fromHex(hex) {
            return Color.Format.CSS.parseHex(hex) || Color.red;
        }
        static equals(a, b) {
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.equals(b);
        }
        get hsla() {
            if (this._hsla) {
                return this._hsla;
            }
            else {
                return HSLA.fromRGBA(this.rgba);
            }
        }
        get hsva() {
            if (this._hsva) {
                return this._hsva;
            }
            return HSVA.fromRGBA(this.rgba);
        }
        constructor(arg) {
            if (!arg) {
                throw new Error('Color needs a value');
            }
            else if (arg instanceof RGBA) {
                this.rgba = arg;
            }
            else if (arg instanceof HSLA) {
                this._hsla = arg;
                this.rgba = HSLA.toRGBA(arg);
            }
            else if (arg instanceof HSVA) {
                this._hsva = arg;
                this.rgba = HSVA.toRGBA(arg);
            }
            else {
                throw new Error('Invalid color ctor argument');
            }
        }
        equals(other) {
            return !!other && RGBA.equals(this.rgba, other.rgba) && HSLA.equals(this.hsla, other.hsla) && HSVA.equals(this.hsva, other.hsva);
        }
        /**
         * http://www.w3.org/TR/WCAG20/#relativeluminancedef
         * Returns the number in the set [0, 1]. O => Darkest Black. 1 => Lightest white.
         */
        getRelativeLuminance() {
            const R = Color._relativeLuminanceForComponent(this.rgba.r);
            const G = Color._relativeLuminanceForComponent(this.rgba.g);
            const B = Color._relativeLuminanceForComponent(this.rgba.b);
            const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;
            return roundFloat(luminance, 4);
        }
        static _relativeLuminanceForComponent(color) {
            const c = color / 255;
            return (c <= 0.03928) ? c / 12.92 : Math.pow(((c + 0.055) / 1.055), 2.4);
        }
        /**
         * http://www.w3.org/TR/WCAG20/#contrast-ratiodef
         * Returns the contrast ration number in the set [1, 21].
         */
        getContrastRatio(another) {
            const lum1 = this.getRelativeLuminance();
            const lum2 = another.getRelativeLuminance();
            return lum1 > lum2 ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05);
        }
        /**
         *	http://24ways.org/2010/calculating-color-contrast
         *  Return 'true' if darker color otherwise 'false'
         */
        isDarker() {
            const yiq = (this.rgba.r * 299 + this.rgba.g * 587 + this.rgba.b * 114) / 1000;
            return yiq < 128;
        }
        /**
         *	http://24ways.org/2010/calculating-color-contrast
         *  Return 'true' if lighter color otherwise 'false'
         */
        isLighter() {
            const yiq = (this.rgba.r * 299 + this.rgba.g * 587 + this.rgba.b * 114) / 1000;
            return yiq >= 128;
        }
        isLighterThan(another) {
            const lum1 = this.getRelativeLuminance();
            const lum2 = another.getRelativeLuminance();
            return lum1 > lum2;
        }
        isDarkerThan(another) {
            const lum1 = this.getRelativeLuminance();
            const lum2 = another.getRelativeLuminance();
            return lum1 < lum2;
        }
        lighten(factor) {
            return new Color(new HSLA(this.hsla.h, this.hsla.s, this.hsla.l + this.hsla.l * factor, this.hsla.a));
        }
        darken(factor) {
            return new Color(new HSLA(this.hsla.h, this.hsla.s, this.hsla.l - this.hsla.l * factor, this.hsla.a));
        }
        transparent(factor) {
            const { r, g, b, a } = this.rgba;
            return new Color(new RGBA(r, g, b, a * factor));
        }
        isTransparent() {
            return this.rgba.a === 0;
        }
        isOpaque() {
            return this.rgba.a === 1;
        }
        opposite() {
            return new Color(new RGBA(255 - this.rgba.r, 255 - this.rgba.g, 255 - this.rgba.b, this.rgba.a));
        }
        blend(c) {
            const rgba = c.rgba;
            // Convert to 0..1 opacity
            const thisA = this.rgba.a;
            const colorA = rgba.a;
            const a = thisA + colorA * (1 - thisA);
            if (a < 1e-6) {
                return Color.transparent;
            }
            const r = this.rgba.r * thisA / a + rgba.r * colorA * (1 - thisA) / a;
            const g = this.rgba.g * thisA / a + rgba.g * colorA * (1 - thisA) / a;
            const b = this.rgba.b * thisA / a + rgba.b * colorA * (1 - thisA) / a;
            return new Color(new RGBA(r, g, b, a));
        }
        makeOpaque(opaqueBackground) {
            if (this.isOpaque() || opaqueBackground.rgba.a !== 1) {
                // only allow to blend onto a non-opaque color onto a opaque color
                return this;
            }
            const { r, g, b, a } = this.rgba;
            // https://stackoverflow.com/questions/12228548/finding-equivalent-color-with-opacity
            return new Color(new RGBA(opaqueBackground.rgba.r - a * (opaqueBackground.rgba.r - r), opaqueBackground.rgba.g - a * (opaqueBackground.rgba.g - g), opaqueBackground.rgba.b - a * (opaqueBackground.rgba.b - b), 1));
        }
        flatten(...backgrounds) {
            const background = backgrounds.reduceRight((accumulator, color) => {
                return Color._flatten(color, accumulator);
            });
            return Color._flatten(this, background);
        }
        static _flatten(foreground, background) {
            const backgroundAlpha = 1 - foreground.rgba.a;
            return new Color(new RGBA(backgroundAlpha * background.rgba.r + foreground.rgba.a * foreground.rgba.r, backgroundAlpha * background.rgba.g + foreground.rgba.a * foreground.rgba.g, backgroundAlpha * background.rgba.b + foreground.rgba.a * foreground.rgba.b));
        }
        toString() {
            if (!this._toString) {
                this._toString = Color.Format.CSS.format(this);
            }
            return this._toString;
        }
        static getLighterColor(of, relative, factor) {
            if (of.isLighterThan(relative)) {
                return of;
            }
            factor = factor ? factor : 0.5;
            const lum1 = of.getRelativeLuminance();
            const lum2 = relative.getRelativeLuminance();
            factor = factor * (lum2 - lum1) / lum2;
            return of.lighten(factor);
        }
        static getDarkerColor(of, relative, factor) {
            if (of.isDarkerThan(relative)) {
                return of;
            }
            factor = factor ? factor : 0.5;
            const lum1 = of.getRelativeLuminance();
            const lum2 = relative.getRelativeLuminance();
            factor = factor * (lum1 - lum2) / lum1;
            return of.darken(factor);
        }
        static { this.white = new Color(new RGBA(255, 255, 255, 1)); }
        static { this.black = new Color(new RGBA(0, 0, 0, 1)); }
        static { this.red = new Color(new RGBA(255, 0, 0, 1)); }
        static { this.blue = new Color(new RGBA(0, 0, 255, 1)); }
        static { this.green = new Color(new RGBA(0, 255, 0, 1)); }
        static { this.cyan = new Color(new RGBA(0, 255, 255, 1)); }
        static { this.lightgrey = new Color(new RGBA(211, 211, 211, 1)); }
        static { this.transparent = new Color(new RGBA(0, 0, 0, 0)); }
    }
    exports.Color = Color;
    (function (Color) {
        let Format;
        (function (Format) {
            let CSS;
            (function (CSS) {
                function formatRGB(color) {
                    if (color.rgba.a === 1) {
                        return `rgb(${color.rgba.r}, ${color.rgba.g}, ${color.rgba.b})`;
                    }
                    return Color.Format.CSS.formatRGBA(color);
                }
                CSS.formatRGB = formatRGB;
                function formatRGBA(color) {
                    return `rgba(${color.rgba.r}, ${color.rgba.g}, ${color.rgba.b}, ${+(color.rgba.a).toFixed(2)})`;
                }
                CSS.formatRGBA = formatRGBA;
                function formatHSL(color) {
                    if (color.hsla.a === 1) {
                        return `hsl(${color.hsla.h}, ${(color.hsla.s * 100).toFixed(2)}%, ${(color.hsla.l * 100).toFixed(2)}%)`;
                    }
                    return Color.Format.CSS.formatHSLA(color);
                }
                CSS.formatHSL = formatHSL;
                function formatHSLA(color) {
                    return `hsla(${color.hsla.h}, ${(color.hsla.s * 100).toFixed(2)}%, ${(color.hsla.l * 100).toFixed(2)}%, ${color.hsla.a.toFixed(2)})`;
                }
                CSS.formatHSLA = formatHSLA;
                function _toTwoDigitHex(n) {
                    const r = n.toString(16);
                    return r.length !== 2 ? '0' + r : r;
                }
                /**
                 * Formats the color as #RRGGBB
                 */
                function formatHex(color) {
                    return `#${_toTwoDigitHex(color.rgba.r)}${_toTwoDigitHex(color.rgba.g)}${_toTwoDigitHex(color.rgba.b)}`;
                }
                CSS.formatHex = formatHex;
                /**
                 * Formats the color as #RRGGBBAA
                 * If 'compact' is set, colors without transparancy will be printed as #RRGGBB
                 */
                function formatHexA(color, compact = false) {
                    if (compact && color.rgba.a === 1) {
                        return Color.Format.CSS.formatHex(color);
                    }
                    return `#${_toTwoDigitHex(color.rgba.r)}${_toTwoDigitHex(color.rgba.g)}${_toTwoDigitHex(color.rgba.b)}${_toTwoDigitHex(Math.round(color.rgba.a * 255))}`;
                }
                CSS.formatHexA = formatHexA;
                /**
                 * The default format will use HEX if opaque and RGBA otherwise.
                 */
                function format(color) {
                    if (color.isOpaque()) {
                        return Color.Format.CSS.formatHex(color);
                    }
                    return Color.Format.CSS.formatRGBA(color);
                }
                CSS.format = format;
                /**
                 * Converts an Hex color value to a Color.
                 * returns r, g, and b are contained in the set [0, 255]
                 * @param hex string (#RGB, #RGBA, #RRGGBB or #RRGGBBAA).
                 */
                function parseHex(hex) {
                    const length = hex.length;
                    if (length === 0) {
                        // Invalid color
                        return null;
                    }
                    if (hex.charCodeAt(0) !== 35 /* CharCode.Hash */) {
                        // Does not begin with a #
                        return null;
                    }
                    if (length === 7) {
                        // #RRGGBB format
                        const r = 16 * _parseHexDigit(hex.charCodeAt(1)) + _parseHexDigit(hex.charCodeAt(2));
                        const g = 16 * _parseHexDigit(hex.charCodeAt(3)) + _parseHexDigit(hex.charCodeAt(4));
                        const b = 16 * _parseHexDigit(hex.charCodeAt(5)) + _parseHexDigit(hex.charCodeAt(6));
                        return new Color(new RGBA(r, g, b, 1));
                    }
                    if (length === 9) {
                        // #RRGGBBAA format
                        const r = 16 * _parseHexDigit(hex.charCodeAt(1)) + _parseHexDigit(hex.charCodeAt(2));
                        const g = 16 * _parseHexDigit(hex.charCodeAt(3)) + _parseHexDigit(hex.charCodeAt(4));
                        const b = 16 * _parseHexDigit(hex.charCodeAt(5)) + _parseHexDigit(hex.charCodeAt(6));
                        const a = 16 * _parseHexDigit(hex.charCodeAt(7)) + _parseHexDigit(hex.charCodeAt(8));
                        return new Color(new RGBA(r, g, b, a / 255));
                    }
                    if (length === 4) {
                        // #RGB format
                        const r = _parseHexDigit(hex.charCodeAt(1));
                        const g = _parseHexDigit(hex.charCodeAt(2));
                        const b = _parseHexDigit(hex.charCodeAt(3));
                        return new Color(new RGBA(16 * r + r, 16 * g + g, 16 * b + b));
                    }
                    if (length === 5) {
                        // #RGBA format
                        const r = _parseHexDigit(hex.charCodeAt(1));
                        const g = _parseHexDigit(hex.charCodeAt(2));
                        const b = _parseHexDigit(hex.charCodeAt(3));
                        const a = _parseHexDigit(hex.charCodeAt(4));
                        return new Color(new RGBA(16 * r + r, 16 * g + g, 16 * b + b, (16 * a + a) / 255));
                    }
                    // Invalid color
                    return null;
                }
                CSS.parseHex = parseHex;
                function _parseHexDigit(charCode) {
                    switch (charCode) {
                        case 48 /* CharCode.Digit0 */: return 0;
                        case 49 /* CharCode.Digit1 */: return 1;
                        case 50 /* CharCode.Digit2 */: return 2;
                        case 51 /* CharCode.Digit3 */: return 3;
                        case 52 /* CharCode.Digit4 */: return 4;
                        case 53 /* CharCode.Digit5 */: return 5;
                        case 54 /* CharCode.Digit6 */: return 6;
                        case 55 /* CharCode.Digit7 */: return 7;
                        case 56 /* CharCode.Digit8 */: return 8;
                        case 57 /* CharCode.Digit9 */: return 9;
                        case 97 /* CharCode.a */: return 10;
                        case 65 /* CharCode.A */: return 10;
                        case 98 /* CharCode.b */: return 11;
                        case 66 /* CharCode.B */: return 11;
                        case 99 /* CharCode.c */: return 12;
                        case 67 /* CharCode.C */: return 12;
                        case 100 /* CharCode.d */: return 13;
                        case 68 /* CharCode.D */: return 13;
                        case 101 /* CharCode.e */: return 14;
                        case 69 /* CharCode.E */: return 14;
                        case 102 /* CharCode.f */: return 15;
                        case 70 /* CharCode.F */: return 15;
                    }
                    return 0;
                }
            })(CSS = Format.CSS || (Format.CSS = {}));
        })(Format = Color.Format || (Color.Format = {}));
    })(Color || (exports.Color = Color = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2NvbG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxTQUFTLFVBQVUsQ0FBQyxNQUFjLEVBQUUsYUFBcUI7UUFDeEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDNUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUM7SUFDL0MsQ0FBQztJQUVELE1BQWEsSUFBSTtRQXVCaEIsWUFBWSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxJQUFZLENBQUM7WUF0QjFELGVBQVUsR0FBUyxTQUFTLENBQUM7WUF1QjVCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFD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LENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUxQixJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztnQkFDWixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDO2lCQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNwQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDO2lCQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNwQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDO2lCQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNwQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDO2lCQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO2dCQUNwQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDO2lCQUFNLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNyQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBRUQsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFFOUIsT0FB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