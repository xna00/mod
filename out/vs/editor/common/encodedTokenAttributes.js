/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenMetadata = exports.MetadataConsts = exports.StandardTokenType = exports.ColorId = exports.FontStyle = exports.LanguageId = void 0;
    /**
     * Open ended enum at runtime
     */
    var LanguageId;
    (function (LanguageId) {
        LanguageId[LanguageId["Null"] = 0] = "Null";
        LanguageId[LanguageId["PlainText"] = 1] = "PlainText";
    })(LanguageId || (exports.LanguageId = LanguageId = {}));
    /**
     * A font style. Values are 2^x such that a bit mask can be used.
     */
    var FontStyle;
    (function (FontStyle) {
        FontStyle[FontStyle["NotSet"] = -1] = "NotSet";
        FontStyle[FontStyle["None"] = 0] = "None";
        FontStyle[FontStyle["Italic"] = 1] = "Italic";
        FontStyle[FontStyle["Bold"] = 2] = "Bold";
        FontStyle[FontStyle["Underline"] = 4] = "Underline";
        FontStyle[FontStyle["Strikethrough"] = 8] = "Strikethrough";
    })(FontStyle || (exports.FontStyle = FontStyle = {}));
    /**
     * Open ended enum at runtime
     */
    var ColorId;
    (function (ColorId) {
        ColorId[ColorId["None"] = 0] = "None";
        ColorId[ColorId["DefaultForeground"] = 1] = "DefaultForeground";
        ColorId[ColorId["DefaultBackground"] = 2] = "DefaultBackground";
    })(ColorId || (exports.ColorId = ColorId = {}));
    /**
     * A standard token type.
     */
    var StandardTokenType;
    (function (StandardTokenType) {
        StandardTokenType[StandardTokenType["Other"] = 0] = "Other";
        StandardTokenType[StandardTokenType["Comment"] = 1] = "Comment";
        StandardTokenType[StandardTokenType["String"] = 2] = "String";
        StandardTokenType[StandardTokenType["RegEx"] = 3] = "RegEx";
    })(StandardTokenType || (exports.StandardTokenType = StandardTokenType = {}));
    /**
     * Helpers to manage the "collapsed" metadata of an entire StackElement stack.
     * The following assumptions have been made:
     *  - languageId < 256 => needs 8 bits
     *  - unique color count < 512 => needs 9 bits
     *
     * The binary format is:
     * - -------------------------------------------
     *     3322 2222 2222 1111 1111 1100 0000 0000
     *     1098 7654 3210 9876 5432 1098 7654 3210
     * - -------------------------------------------
     *     xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx
     *     bbbb bbbb ffff ffff fFFF FBTT LLLL LLLL
     * - -------------------------------------------
     *  - L = LanguageId (8 bits)
     *  - T = StandardTokenType (2 bits)
     *  - B = Balanced bracket (1 bit)
     *  - F = FontStyle (4 bits)
     *  - f = foreground color (9 bits)
     *  - b = background color (9 bits)
     *
     */
    var MetadataConsts;
    (function (MetadataConsts) {
        MetadataConsts[MetadataConsts["LANGUAGEID_MASK"] = 255] = "LANGUAGEID_MASK";
        MetadataConsts[MetadataConsts["TOKEN_TYPE_MASK"] = 768] = "TOKEN_TYPE_MASK";
        MetadataConsts[MetadataConsts["BALANCED_BRACKETS_MASK"] = 1024] = "BALANCED_BRACKETS_MASK";
        MetadataConsts[MetadataConsts["FONT_STYLE_MASK"] = 30720] = "FONT_STYLE_MASK";
        MetadataConsts[MetadataConsts["FOREGROUND_MASK"] = 16744448] = "FOREGROUND_MASK";
        MetadataConsts[MetadataConsts["BACKGROUND_MASK"] = 4278190080] = "BACKGROUND_MASK";
        MetadataConsts[MetadataConsts["ITALIC_MASK"] = 2048] = "ITALIC_MASK";
        MetadataConsts[MetadataConsts["BOLD_MASK"] = 4096] = "BOLD_MASK";
        MetadataConsts[MetadataConsts["UNDERLINE_MASK"] = 8192] = "UNDERLINE_MASK";
        MetadataConsts[MetadataConsts["STRIKETHROUGH_MASK"] = 16384] = "STRIKETHROUGH_MASK";
        // Semantic tokens cannot set the language id, so we can
        // use the first 8 bits for control purposes
        MetadataConsts[MetadataConsts["SEMANTIC_USE_ITALIC"] = 1] = "SEMANTIC_USE_ITALIC";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_BOLD"] = 2] = "SEMANTIC_USE_BOLD";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_UNDERLINE"] = 4] = "SEMANTIC_USE_UNDERLINE";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_STRIKETHROUGH"] = 8] = "SEMANTIC_USE_STRIKETHROUGH";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_FOREGROUND"] = 16] = "SEMANTIC_USE_FOREGROUND";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_BACKGROUND"] = 32] = "SEMANTIC_USE_BACKGROUND";
        MetadataConsts[MetadataConsts["LANGUAGEID_OFFSET"] = 0] = "LANGUAGEID_OFFSET";
        MetadataConsts[MetadataConsts["TOKEN_TYPE_OFFSET"] = 8] = "TOKEN_TYPE_OFFSET";
        MetadataConsts[MetadataConsts["BALANCED_BRACKETS_OFFSET"] = 10] = "BALANCED_BRACKETS_OFFSET";
        MetadataConsts[MetadataConsts["FONT_STYLE_OFFSET"] = 11] = "FONT_STYLE_OFFSET";
        MetadataConsts[MetadataConsts["FOREGROUND_OFFSET"] = 15] = "FOREGROUND_OFFSET";
        MetadataConsts[MetadataConsts["BACKGROUND_OFFSET"] = 24] = "BACKGROUND_OFFSET";
    })(MetadataConsts || (exports.MetadataConsts = MetadataConsts = {}));
    /**
     */
    class TokenMetadata {
        static getLanguageId(metadata) {
            return (metadata & 255 /* MetadataConsts.LANGUAGEID_MASK */) >>> 0 /* MetadataConsts.LANGUAGEID_OFFSET */;
        }
        static getTokenType(metadata) {
            return (metadata & 768 /* MetadataConsts.TOKEN_TYPE_MASK */) >>> 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */;
        }
        static containsBalancedBrackets(metadata) {
            return (metadata & 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */) !== 0;
        }
        static getFontStyle(metadata) {
            return (metadata & 30720 /* MetadataConsts.FONT_STYLE_MASK */) >>> 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
        }
        static getForeground(metadata) {
            return (metadata & 16744448 /* MetadataConsts.FOREGROUND_MASK */) >>> 15 /* MetadataConsts.FOREGROUND_OFFSET */;
        }
        static getBackground(metadata) {
            return (metadata & 4278190080 /* MetadataConsts.BACKGROUND_MASK */) >>> 24 /* MetadataConsts.BACKGROUND_OFFSET */;
        }
        static getClassNameFromMetadata(metadata) {
            const foreground = this.getForeground(metadata);
            let className = 'mtk' + foreground;
            const fontStyle = this.getFontStyle(metadata);
            if (fontStyle & 1 /* FontStyle.Italic */) {
                className += ' mtki';
            }
            if (fontStyle & 2 /* FontStyle.Bold */) {
                className += ' mtkb';
            }
            if (fontStyle & 4 /* FontStyle.Underline */) {
                className += ' mtku';
            }
            if (fontStyle & 8 /* FontStyle.Strikethrough */) {
                className += ' mtks';
            }
            return className;
        }
        static getInlineStyleFromMetadata(metadata, colorMap) {
            const foreground = this.getForeground(metadata);
            const fontStyle = this.getFontStyle(metadata);
            let result = `color: ${colorMap[foreground]};`;
            if (fontStyle & 1 /* FontStyle.Italic */) {
                result += 'font-style: italic;';
            }
            if (fontStyle & 2 /* FontStyle.Bold */) {
                result += 'font-weight: bold;';
            }
            let textDecoration = '';
            if (fontStyle & 4 /* FontStyle.Underline */) {
                textDecoration += ' underline';
            }
            if (fontStyle & 8 /* FontStyle.Strikethrough */) {
                textDecoration += ' line-through';
            }
            if (textDecoration) {
                result += `text-decoration:${textDecoration};`;
            }
            return result;
        }
        static getPresentationFromMetadata(metadata) {
            const foreground = this.getForeground(metadata);
            const fontStyle = this.getFontStyle(metadata);
            return {
                foreground: foreground,
                italic: Boolean(fontStyle & 1 /* FontStyle.Italic */),
                bold: Boolean(fontStyle & 2 /* FontStyle.Bold */),
                underline: Boolean(fontStyle & 4 /* FontStyle.Underline */),
                strikethrough: Boolean(fontStyle & 8 /* FontStyle.Strikethrough */),
            };
        }
    }
    exports.TokenMetadata = TokenMetadata;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jb2RlZFRva2VuQXR0cmlidXRlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9lbmNvZGVkVG9rZW5BdHRyaWJ1dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRzs7T0FFRztJQUNILElBQWtCLFVBR2pCO0lBSEQsV0FBa0IsVUFBVTtRQUMzQiwyQ0FBUSxDQUFBO1FBQ1IscURBQWEsQ0FBQTtJQUNkLENBQUMsRUFIaUIsVUFBVSwwQkFBVixVQUFVLFFBRzNCO0lBRUQ7O09BRUc7SUFDSCxJQUFrQixTQU9qQjtJQVBELFdBQWtCLFNBQVM7UUFDMUIsOENBQVcsQ0FBQTtRQUNYLHlDQUFRLENBQUE7UUFDUiw2Q0FBVSxDQUFBO1FBQ1YseUNBQVEsQ0FBQTtRQUNSLG1EQUFhLENBQUE7UUFDYiwyREFBaUIsQ0FBQTtJQUNsQixDQUFDLEVBUGlCLFNBQVMseUJBQVQsU0FBUyxRQU8xQjtJQUVEOztPQUVHO0lBQ0gsSUFBa0IsT0FJakI7SUFKRCxXQUFrQixPQUFPO1FBQ3hCLHFDQUFRLENBQUE7UUFDUiwrREFBcUIsQ0FBQTtRQUNyQiwrREFBcUIsQ0FBQTtJQUN0QixDQUFDLEVBSmlCLE9BQU8sdUJBQVAsT0FBTyxRQUl4QjtJQUVEOztPQUVHO0lBQ0gsSUFBa0IsaUJBS2pCO0lBTEQsV0FBa0IsaUJBQWlCO1FBQ2xDLDJEQUFTLENBQUE7UUFDVCwrREFBVyxDQUFBO1FBQ1gsNkRBQVUsQ0FBQTtRQUNWLDJEQUFTLENBQUE7SUFDVixDQUFDLEVBTGlCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBS2xDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXFCRztJQUNILElBQWtCLGNBNEJqQjtJQTVCRCxXQUFrQixjQUFjO1FBQy9CLDJFQUFvRCxDQUFBO1FBQ3BELDJFQUFv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