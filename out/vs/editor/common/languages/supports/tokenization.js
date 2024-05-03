/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color"], function (require, exports, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeTrieElement = exports.ExternalThemeTrieElement = exports.ThemeTrieElementRule = exports.TokenTheme = exports.ColorMap = exports.ParsedTokenThemeRule = void 0;
    exports.parseTokenTheme = parseTokenTheme;
    exports.toStandardTokenType = toStandardTokenType;
    exports.strcmp = strcmp;
    exports.generateTokensCSSForColorMap = generateTokensCSSForColorMap;
    class ParsedTokenThemeRule {
        constructor(token, index, fontStyle, foreground, background) {
            this._parsedThemeRuleBrand = undefined;
            this.token = token;
            this.index = index;
            this.fontStyle = fontStyle;
            this.foreground = foreground;
            this.background = background;
        }
    }
    exports.ParsedTokenThemeRule = ParsedTokenThemeRule;
    /**
     * Parse a raw theme into rules.
     */
    function parseTokenTheme(source) {
        if (!source || !Array.isArray(source)) {
            return [];
        }
        const result = [];
        let resultLen = 0;
        for (let i = 0, len = source.length; i < len; i++) {
            const entry = source[i];
            let fontStyle = -1 /* FontStyle.NotSet */;
            if (typeof entry.fontStyle === 'string') {
                fontStyle = 0 /* FontStyle.None */;
                const segments = entry.fontStyle.split(' ');
                for (let j = 0, lenJ = segments.length; j < lenJ; j++) {
                    const segment = segments[j];
                    switch (segment) {
                        case 'italic':
                            fontStyle = fontStyle | 1 /* FontStyle.Italic */;
                            break;
                        case 'bold':
                            fontStyle = fontStyle | 2 /* FontStyle.Bold */;
                            break;
                        case 'underline':
                            fontStyle = fontStyle | 4 /* FontStyle.Underline */;
                            break;
                        case 'strikethrough':
                            fontStyle = fontStyle | 8 /* FontStyle.Strikethrough */;
                            break;
                    }
                }
            }
            let foreground = null;
            if (typeof entry.foreground === 'string') {
                foreground = entry.foreground;
            }
            let background = null;
            if (typeof entry.background === 'string') {
                background = entry.background;
            }
            result[resultLen++] = new ParsedTokenThemeRule(entry.token || '', i, fontStyle, foreground, background);
        }
        return result;
    }
    /**
     * Resolve rules (i.e. inheritance).
     */
    function resolveParsedTokenThemeRules(parsedThemeRules, customTokenColors) {
        // Sort rules lexicographically, and then by index if necessary
        parsedThemeRules.sort((a, b) => {
            const r = strcmp(a.token, b.token);
            if (r !== 0) {
                return r;
            }
            return a.index - b.index;
        });
        // Determine defaults
        let defaultFontStyle = 0 /* FontStyle.None */;
        let defaultForeground = '000000';
        let defaultBackground = 'ffffff';
        while (parsedThemeRules.length >= 1 && parsedThemeRules[0].token === '') {
            const incomingDefaults = parsedThemeRules.shift();
            if (incomingDefaults.fontStyle !== -1 /* FontStyle.NotSet */) {
                defaultFontStyle = incomingDefaults.fontStyle;
            }
            if (incomingDefaults.foreground !== null) {
                defaultForeground = incomingDefaults.foreground;
            }
            if (incomingDefaults.background !== null) {
                defaultBackground = incomingDefaults.background;
            }
        }
        const colorMap = new ColorMap();
        // start with token colors from custom token themes
        for (const color of customTokenColors) {
            colorMap.getId(color);
        }
        const foregroundColorId = colorMap.getId(defaultForeground);
        const backgroundColorId = colorMap.getId(defaultBackground);
        const defaults = new ThemeTrieElementRule(defaultFontStyle, foregroundColorId, backgroundColorId);
        const root = new ThemeTrieElement(defaults);
        for (let i = 0, len = parsedThemeRules.length; i < len; i++) {
            const rule = parsedThemeRules[i];
            root.insert(rule.token, rule.fontStyle, colorMap.getId(rule.foreground), colorMap.getId(rule.background));
        }
        return new TokenTheme(colorMap, root);
    }
    const colorRegExp = /^#?([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?$/;
    class ColorMap {
        constructor() {
            this._lastColorId = 0;
            this._id2color = [];
            this._color2id = new Map();
        }
        getId(color) {
            if (color === null) {
                return 0;
            }
            const match = color.match(colorRegExp);
            if (!match) {
                throw new Error('Illegal value for token color: ' + color);
            }
            color = match[1].toUpperCase();
            let value = this._color2id.get(color);
            if (value) {
                return value;
            }
            value = ++this._lastColorId;
            this._color2id.set(color, value);
            this._id2color[value] = color_1.Color.fromHex('#' + color);
            return value;
        }
        getColorMap() {
            return this._id2color.slice(0);
        }
    }
    exports.ColorMap = ColorMap;
    class TokenTheme {
        static createFromRawTokenTheme(source, customTokenColors) {
            return this.createFromParsedTokenTheme(parseTokenTheme(source), customTokenColors);
        }
        static createFromParsedTokenTheme(source, customTokenColors) {
            return resolveParsedTokenThemeRules(source, customTokenColors);
        }
        constructor(colorMap, root) {
            this._colorMap = colorMap;
            this._root = root;
            this._cache = new Map();
        }
        getColorMap() {
            return this._colorMap.getColorMap();
        }
        /**
         * used for testing purposes
         */
        getThemeTrieElement() {
            return this._root.toExternalThemeTrieElement();
        }
        _match(token) {
            return this._root.match(token);
        }
        match(languageId, token) {
            // The cache contains the metadata without the language bits set.
            let result = this._cache.get(token);
            if (typeof result === 'undefined') {
                const rule = this._match(token);
                const standardToken = toStandardTokenType(token);
                result = (rule.metadata
                    | (standardToken << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)) >>> 0;
                this._cache.set(token, result);
            }
            return (result
                | (languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)) >>> 0;
        }
    }
    exports.TokenTheme = TokenTheme;
    const STANDARD_TOKEN_TYPE_REGEXP = /\b(comment|string|regex|regexp)\b/;
    function toStandardTokenType(tokenType) {
        const m = tokenType.match(STANDARD_TOKEN_TYPE_REGEXP);
        if (!m) {
            return 0 /* StandardTokenType.Other */;
        }
        switch (m[1]) {
            case 'comment':
                return 1 /* StandardTokenType.Comment */;
            case 'string':
                return 2 /* StandardTokenType.String */;
            case 'regex':
                return 3 /* StandardTokenType.RegEx */;
            case 'regexp':
                return 3 /* StandardTokenType.RegEx */;
        }
        throw new Error('Unexpected match for standard token type!');
    }
    function strcmp(a, b) {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }
    class ThemeTrieElementRule {
        constructor(fontStyle, foreground, background) {
            this._themeTrieElementRuleBrand = undefined;
            this._fontStyle = fontStyle;
            this._foreground = foreground;
            this._background = background;
            this.metadata = ((this._fontStyle << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
                | (this._foreground << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                | (this._background << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0;
        }
        clone() {
            return new ThemeTrieElementRule(this._fontStyle, this._foreground, this._background);
        }
        acceptOverwrite(fontStyle, foreground, background) {
            if (fontStyle !== -1 /* FontStyle.NotSet */) {
                this._fontStyle = fontStyle;
            }
            if (foreground !== 0 /* ColorId.None */) {
                this._foreground = foreground;
            }
            if (background !== 0 /* ColorId.None */) {
                this._background = background;
            }
            this.metadata = ((this._fontStyle << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
                | (this._foreground << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
                | (this._background << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0;
        }
    }
    exports.ThemeTrieElementRule = ThemeTrieElementRule;
    class ExternalThemeTrieElement {
        constructor(mainRule, children = new Map()) {
            this.mainRule = mainRule;
            if (children instanceof Map) {
                this.children = children;
            }
            else {
                this.children = new Map();
                for (const key in children) {
                    this.children.set(key, children[key]);
                }
            }
        }
    }
    exports.ExternalThemeTrieElement = ExternalThemeTrieElement;
    class ThemeTrieElement {
        constructor(mainRule) {
            this._themeTrieElementBrand = undefined;
            this._mainRule = mainRule;
            this._children = new Map();
        }
        /**
         * used for testing purposes
         */
        toExternalThemeTrieElement() {
            const children = new Map();
            this._children.forEach((element, index) => {
                children.set(index, element.toExternalThemeTrieElement());
            });
            return new ExternalThemeTrieElement(this._mainRule, children);
        }
        match(token) {
            if (token === '') {
                return this._mainRule;
            }
            const dotIndex = token.indexOf('.');
            let head;
            let tail;
            if (dotIndex === -1) {
                head = token;
                tail = '';
            }
            else {
                head = token.substring(0, dotIndex);
                tail = token.substring(dotIndex + 1);
            }
            const child = this._children.get(head);
            if (typeof child !== 'undefined') {
                return child.match(tail);
            }
            return this._mainRule;
        }
        insert(token, fontStyle, foreground, background) {
            if (token === '') {
                // Merge into the main rule
                this._mainRule.acceptOverwrite(fontStyle, foreground, background);
                return;
            }
            const dotIndex = token.indexOf('.');
            let head;
            let tail;
            if (dotIndex === -1) {
                head = token;
                tail = '';
            }
            else {
                head = token.substring(0, dotIndex);
                tail = token.substring(dotIndex + 1);
            }
            let child = this._children.get(head);
            if (typeof child === 'undefined') {
                child = new ThemeTrieElement(this._mainRule.clone());
                this._children.set(head, child);
            }
            child.insert(tail, fontStyle, foreground, background);
        }
    }
    exports.ThemeTrieElement = ThemeTrieElement;
    function generateTokensCSSForColorMap(colorMap) {
        const rules = [];
        for (let i = 1, len = colorMap.length; i < len; i++) {
            const color = colorMap[i];
            rules[i] = `.mtk${i} { color: ${color}; }`;
        }
        rules.push('.mtki { font-style: italic; }');
        rules.push('.mtkb { font-weight: bold; }');
        rules.push('.mtku { text-decoration: underline; text-underline-position: under; }');
        rules.push('.mtks { text-decoration: line-through; }');
        rules.push('.mtks.mtku { text-decoration: underline line-through; text-underline-position: under; }');
        return rules.join('\n');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9zdXBwb3J0cy90b2tlbml6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkNoRywwQ0FxREM7SUFvSkQsa0RBZ0JDO0lBRUQsd0JBUUM7SUEwSUQsb0VBWUM7SUF4WkQsTUFBYSxvQkFBb0I7UUFhaEMsWUFDQyxLQUFhLEVBQ2IsS0FBYSxFQUNiLFNBQWlCLEVBQ2pCLFVBQXlCLEVBQ3pCLFVBQXlCO1lBakIxQiwwQkFBcUIsR0FBUyxTQUFTLENBQUM7WUFtQnZDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzlCLENBQUM7S0FDRDtJQTFCRCxvREEwQkM7SUFFRDs7T0FFRztJQUNILFNBQWdCLGVBQWUsQ0FBQyxNQUF5QjtRQUN4RCxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ3ZDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUEyQixFQUFFLENBQUM7UUFDMUMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNuRCxN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