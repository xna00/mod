/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/iconLabels", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri"], function (require, exports, errors_1, iconLabels_1, resources_1, strings_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownString = exports.MarkdownStringTextNewlineStyle = void 0;
    exports.isEmptyMarkdownString = isEmptyMarkdownString;
    exports.isMarkdownString = isMarkdownString;
    exports.markdownStringEqual = markdownStringEqual;
    exports.escapeMarkdownSyntaxTokens = escapeMarkdownSyntaxTokens;
    exports.appendEscapedMarkdownCodeBlockFence = appendEscapedMarkdownCodeBlockFence;
    exports.escapeDoubleQuotes = escapeDoubleQuotes;
    exports.removeMarkdownEscapes = removeMarkdownEscapes;
    exports.parseHrefAndDimensions = parseHrefAndDimensions;
    var MarkdownStringTextNewlineStyle;
    (function (MarkdownStringTextNewlineStyle) {
        MarkdownStringTextNewlineStyle[MarkdownStringTextNewlineStyle["Paragraph"] = 0] = "Paragraph";
        MarkdownStringTextNewlineStyle[MarkdownStringTextNewlineStyle["Break"] = 1] = "Break";
    })(MarkdownStringTextNewlineStyle || (exports.MarkdownStringTextNewlineStyle = MarkdownStringTextNewlineStyle = {}));
    class MarkdownString {
        constructor(value = '', isTrustedOrOptions = false) {
            this.value = value;
            if (typeof this.value !== 'string') {
                throw (0, errors_1.illegalArgument)('value');
            }
            if (typeof isTrustedOrOptions === 'boolean') {
                this.isTrusted = isTrustedOrOptions;
                this.supportThemeIcons = false;
                this.supportHtml = false;
            }
            else {
                this.isTrusted = isTrustedOrOptions.isTrusted ?? undefined;
                this.supportThemeIcons = isTrustedOrOptions.supportThemeIcons ?? false;
                this.supportHtml = isTrustedOrOptions.supportHtml ?? false;
            }
        }
        appendText(value, newlineStyle = 0 /* MarkdownStringTextNewlineStyle.Paragraph */) {
            this.value += escapeMarkdownSyntaxTokens(this.supportThemeIcons ? (0, iconLabels_1.escapeIcons)(value) : value) // CodeQL [SM02383] The Markdown is fully sanitized after being rendered.
                .replace(/([ \t]+)/g, (_match, g1) => '&nbsp;'.repeat(g1.length)) // CodeQL [SM02383] The Markdown is fully sanitized after being rendered.
                .replace(/\>/gm, '\\>') // CodeQL [SM02383] The Markdown is fully sanitized after being rendered.
                .replace(/\n/g, newlineStyle === 1 /* MarkdownStringTextNewlineStyle.Break */ ? '\\\n' : '\n\n'); // CodeQL [SM02383] The Markdown is fully sanitized after being rendered.
            return this;
        }
        appendMarkdown(value) {
            this.value += value;
            return this;
        }
        appendCodeblock(langId, code) {
            this.value += `\n${appendEscapedMarkdownCodeBlockFence(code, langId)}\n`;
            return this;
        }
        appendLink(target, label, title) {
            this.value += '[';
            this.value += this._escape(label, ']');
            this.value += '](';
            this.value += this._escape(String(target), ')');
            if (title) {
                this.value += ` "${this._escape(this._escape(title, '"'), ')')}"`;
            }
            this.value += ')';
            return this;
        }
        _escape(value, ch) {
            const r = new RegExp((0, strings_1.escapeRegExpCharacters)(ch), 'g');
            return value.replace(r, (match, offset) => {
                if (value.charAt(offset - 1) !== '\\') {
                    return `\\${match}`;
                }
                else {
                    return match;
                }
            });
        }
    }
    exports.MarkdownString = MarkdownString;
    function isEmptyMarkdownString(oneOrMany) {
        if (isMarkdownString(oneOrMany)) {
            return !oneOrMany.value;
        }
        else if (Array.isArray(oneOrMany)) {
            return oneOrMany.every(isEmptyMarkdownString);
        }
        else {
            return true;
        }
    }
    function isMarkdownString(thing) {
        if (thing instanceof MarkdownString) {
            return true;
        }
        else if (thing && typeof thing === 'object') {
            return typeof thing.value === 'string'
                && (typeof thing.isTrusted === 'boolean' || typeof thing.isTrusted === 'object' || thing.isTrusted === undefined)
                && (typeof thing.supportThemeIcons === 'boolean' || thing.supportThemeIcons === undefined);
        }
        return false;
    }
    function markdownStringEqual(a, b) {
        if (a === b) {
            return true;
        }
        else if (!a || !b) {
            return false;
        }
        else {
            return a.value === b.value
                && a.isTrusted === b.isTrusted
                && a.supportThemeIcons === b.supportThemeIcons
                && a.supportHtml === b.supportHtml
                && (a.baseUri === b.baseUri || !!a.baseUri && !!b.baseUri && (0, resources_1.isEqual)(uri_1.URI.from(a.baseUri), uri_1.URI.from(b.baseUri)));
        }
    }
    function escapeMarkdownSyntaxTokens(text) {
        // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
        return text.replace(/[\\`*_{}[\]()#+\-!~]/g, '\\$&'); // CodeQL [SM02383] Backslash is escaped in the character class
    }
    /**
     * @see https://github.com/microsoft/vscode/issues/193746
     */
    function appendEscapedMarkdownCodeBlockFence(code, langId) {
        const longestFenceLength = code.match(/^`+/gm)?.reduce((a, b) => (a.length > b.length ? a : b)).length ??
            0;
        const desiredFenceLength = longestFenceLength >= 3 ? longestFenceLength + 1 : 3;
        // the markdown result
        return [
            `${'`'.repeat(desiredFenceLength)}${langId}`,
            code,
            `${'`'.repeat(desiredFenceLength)}`,
        ].join('\n');
    }
    function escapeDoubleQuotes(input) {
        return input.replace(/"/g, '&quot;');
    }
    function removeMarkdownEscapes(text) {
        if (!text) {
            return text;
        }
        return text.replace(/\\([\\`*_{}[\]()#+\-.!~])/g, '$1');
    }
    function parseHrefAndDimensions(href) {
        const dimensions = [];
        const splitted = href.split('|').map(s => s.trim());
        href = splitted[0];
        const parameters = splitted[1];
        if (parameters) {
            const heightFromParams = /height=(\d+)/.exec(parameters);
            const widthFromParams = /width=(\d+)/.exec(parameters);
            const height = heightFromParams ? heightFromParams[1] : '';
            const width = widthFromParams ? widthFromParams[1] : '';
            const widthIsFinite = isFinite(parseInt(width));
            const heightIsFinite = isFinite(parseInt(height));
            if (widthIsFinite) {
                dimensions.push(`width="${width}"`);
            }
            if (heightIsFinite) {
                dimensions.push(`height="${height}"`);
            }
        }
        return { href, dimensions };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbENvbnRlbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2h0bWxDb250ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtHaEcsc0RBUUM7SUFFRCw0Q0FTQztJQUVELGtEQVlDO0lBRUQsZ0VBR0M7SUFLRCxrRkFhQztJQUVELGdEQUVDO0lBRUQsc0RBS0M7SUFFRCx3REFvQkM7SUF0S0QsSUFBa0IsOEJBR2pCO0lBSEQsV0FBa0IsOEJBQThCO1FBQy9DLDZGQUFhLENBQUE7UUFDYixxRkFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUhpQiw4QkFBOEIsOENBQTlCLDhCQUE4QixRQUcvQztJQUVELE1BQWEsY0FBYztRQVExQixZQUNDLFFBQWdCLEVBQUUsRUFDbEIscUJBQTJJLEtBQUs7WUFFaEosSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sSUFBQSx3QkFBZSxFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFFRCxJQUFJLE9BQU8sa0JBQWtCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxTQUFTLEdBQUcsa0JBQWtCLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQzFCLENBQUM7aUJBQ0ksQ0FBQztnQkFDTCxJQUFJLENBQUMsU0FBUyxHQUFHLGtCQUFrQixDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUM7Z0JBQzNELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7Z0JBQ3ZF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