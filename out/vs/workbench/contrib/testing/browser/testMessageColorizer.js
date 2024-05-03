/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/css!./media/testMessageColorizer"], function (require, exports, markdownRenderer_1, lifecycle_1, strings_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.colorizeTestMessageInEditor = exports.renderTestMessageAsText = void 0;
    const colorAttrRe = /^\x1b\[([0-9]+)m$/;
    var Classes;
    (function (Classes) {
        Classes["Prefix"] = "tstm-ansidec-";
        Classes["ForegroundPrefix"] = "tstm-ansidec-fg";
        Classes["BackgroundPrefix"] = "tstm-ansidec-bg";
        Classes["Bold"] = "tstm-ansidec-1";
        Classes["Faint"] = "tstm-ansidec-2";
        Classes["Italic"] = "tstm-ansidec-3";
        Classes["Underline"] = "tstm-ansidec-4";
    })(Classes || (Classes = {}));
    const renderTestMessageAsText = (tm) => typeof tm === 'string' ? (0, strings_1.removeAnsiEscapeCodes)(tm) : (0, markdownRenderer_1.renderStringAsPlaintext)(tm);
    exports.renderTestMessageAsText = renderTestMessageAsText;
    /**
     * Applies decorations based on ANSI styles from the test message in the editor.
     * ANSI sequences are stripped from the text displayed in editor, and this
     * re-applies their colorization.
     *
     * This uses decorations rather than language features because the string
     * rendered in the editor lacks the ANSI codes needed to actually apply the
     * colorization.
     *
     * Note: does not support TrueColor.
     */
    const colorizeTestMessageInEditor = (message, editor) => {
        const decos = [];
        editor.changeDecorations(changeAccessor => {
            let start = new position_1.Position(1, 1);
            let cls = [];
            for (const part of (0, strings_1.forAnsiStringParts)(message)) {
                if (part.isCode) {
                    const colorAttr = colorAttrRe.exec(part.str)?.[1];
                    if (!colorAttr) {
                        continue;
                    }
                    const n = Number(colorAttr);
                    if (n === 0) {
                        cls.length = 0;
                    }
                    else if (n === 22) {
                        cls = cls.filter(c => c !== "tstm-ansidec-1" /* Classes.Bold */ && c !== "tstm-ansidec-3" /* Classes.Italic */);
                    }
                    else if (n === 23) {
                        cls = cls.filter(c => c !== "tstm-ansidec-3" /* Classes.Italic */);
                    }
                    else if (n === 24) {
                        cls = cls.filter(c => c !== "tstm-ansidec-4" /* Classes.Underline */);
                    }
                    else if ((n >= 30 && n <= 39) || (n >= 90 && n <= 99)) {
                        cls = cls.filter(c => !c.startsWith("tstm-ansidec-fg" /* Classes.ForegroundPrefix */));
                        cls.push("tstm-ansidec-fg" /* Classes.ForegroundPrefix */ + colorAttr);
                    }
                    else if ((n >= 40 && n <= 49) || (n >= 100 && n <= 109)) {
                        cls = cls.filter(c => !c.startsWith("tstm-ansidec-bg" /* Classes.BackgroundPrefix */));
                        cls.push("tstm-ansidec-bg" /* Classes.BackgroundPrefix */ + colorAttr);
                    }
                    else {
                        cls.push("tstm-ansidec-" /* Classes.Prefix */ + colorAttr);
                    }
                }
                else {
                    let line = start.lineNumber;
                    let col = start.column;
                    const graphemes = new strings_1.GraphemeIterator(part.str);
                    for (let i = 0; !graphemes.eol(); i += graphemes.nextGraphemeLength()) {
                        if (part.str[i] === '\n') {
                            line++;
                            col = 1;
                        }
                        else {
                            col++;
                        }
                    }
                    const end = new position_1.Position(line, col);
                    if (cls.length) {
                        decos.push(changeAccessor.addDecoration(range_1.Range.fromPositions(start, end), {
                            inlineClassName: cls.join(' '),
                            description: 'test-message-colorized',
                        }));
                    }
                    start = end;
                }
            }
        });
        return (0, lifecycle_1.toDisposable)(() => editor.removeDecorations(decos));
    };
    exports.colorizeTestMessageInEditor = colorizeTestMessageInEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdE1lc3NhZ2VDb2xvcml6ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci90ZXN0TWVzc2FnZUNvbG9yaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBTSxXQUFXLEdBQUcsbUJBQW1CLENBQUM7SUFFeEMsSUFBVyxPQVFWO0lBUkQsV0FBVyxPQUFPO1FBQ2pCLG1DQUF3QixDQUFBO1FBQ3hCLCtDQUF3QyxDQUFBO1FBQ3hDLCtDQUF3QyxDQUFBO1FBQ3hDLGtDQUEyQixDQUFBO1FBQzNCLG1DQUE0QixDQUFBO1FBQzVCLG9DQUE2QixDQUFBO1FBQzdCLHVDQUFnQyxDQUFBO0lBQ2pDLENBQUMsRUFSVSxPQUFPLEtBQVAsT0FBTyxRQVFqQjtJQUVNLE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxFQUE0QixFQUFFLEVBQUUsQ0FDdkUsT0FBTyxFQUFFLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLCtCQUFxQixFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLDBDQUF1QixFQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRHJFLFFBQUEsdUJBQXVCLDJCQUM4QztJQUdsRjs7Ozs7Ozs7OztPQVVHO0lBQ0ksTUFBTSwyQkFBMkIsR0FBRyxDQUFDLE9BQWUsRUFBRSxNQUF3QixFQUFlLEVBQUU7UUFDckcsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO1FBRTNCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsRUFBRTtZQUN6QyxJQUFJLEtBQUssR0FBRyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9CLElBQUksR0FBRyxHQUFhLEVBQUUsQ0FBQztZQUN2QixLQUFLLE1BQU0s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