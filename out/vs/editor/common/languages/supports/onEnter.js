/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/languages/languageConfiguration"], function (require, exports, errors_1, strings, languageConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OnEnterSupport = void 0;
    class OnEnterSupport {
        constructor(opts) {
            opts = opts || {};
            opts.brackets = opts.brackets || [
                ['(', ')'],
                ['{', '}'],
                ['[', ']']
            ];
            this._brackets = [];
            opts.brackets.forEach((bracket) => {
                const openRegExp = OnEnterSupport._createOpenBracketRegExp(bracket[0]);
                const closeRegExp = OnEnterSupport._createCloseBracketRegExp(bracket[1]);
                if (openRegExp && closeRegExp) {
                    this._brackets.push({
                        open: bracket[0],
                        openRegExp: openRegExp,
                        close: bracket[1],
                        closeRegExp: closeRegExp,
                    });
                }
            });
            this._regExpRules = opts.onEnterRules || [];
        }
        onEnter(autoIndent, previousLineText, beforeEnterText, afterEnterText) {
            // (1): `regExpRules`
            if (autoIndent >= 3 /* EditorAutoIndentStrategy.Advanced */) {
                for (let i = 0, len = this._regExpRules.length; i < len; i++) {
                    const rule = this._regExpRules[i];
                    const regResult = [{
                            reg: rule.beforeText,
                            text: beforeEnterText
                        }, {
                            reg: rule.afterText,
                            text: afterEnterText
                        }, {
                            reg: rule.previousLineText,
                            text: previousLineText
                        }].every((obj) => {
                        if (!obj.reg) {
                            return true;
                        }
                        obj.reg.lastIndex = 0; // To disable the effect of the "g" flag.
                        return obj.reg.test(obj.text);
                    });
                    if (regResult) {
                        return rule.action;
                    }
                }
            }
            // (2): Special indent-outdent
            if (autoIndent >= 2 /* EditorAutoIndentStrategy.Brackets */) {
                if (beforeEnterText.length > 0 && afterEnterText.length > 0) {
                    for (let i = 0, len = this._brackets.length; i < len; i++) {
                        const bracket = this._brackets[i];
                        if (bracket.openRegExp.test(beforeEnterText) && bracket.closeRegExp.test(afterEnterText)) {
                            return { indentAction: languageConfiguration_1.IndentAction.IndentOutdent };
                        }
                    }
                }
            }
            // (4): Open bracket based logic
            if (autoIndent >= 2 /* EditorAutoIndentStrategy.Brackets */) {
                if (beforeEnterText.length > 0) {
                    for (let i = 0, len = this._brackets.length; i < len; i++) {
                        const bracket = this._brackets[i];
                        if (bracket.openRegExp.test(beforeEnterText)) {
                            return { indentAction: languageConfiguration_1.IndentAction.Indent };
                        }
                    }
                }
            }
            return null;
        }
        static _createOpenBracketRegExp(bracket) {
            let str = strings.escapeRegExpCharacters(bracket);
            if (!/\B/.test(str.charAt(0))) {
                str = '\\b' + str;
            }
            str += '\\s*$';
            return OnEnterSupport._safeRegExp(str);
        }
        static _createCloseBracketRegExp(bracket) {
            let str = strings.escapeRegExpCharacters(bracket);
            if (!/\B/.test(str.charAt(str.length - 1))) {
                str = str + '\\b';
            }
            str = '^\\s*' + str;
            return OnEnterSupport._safeRegExp(str);
        }
        static _safeRegExp(def) {
            try {
                return new RegExp(def);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
                return null;
            }
        }
    }
    exports.OnEnterSupport = OnEnterSupport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25FbnRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZXMvc3VwcG9ydHMvb25FbnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQWEsY0FBYztRQUsxQixZQUFZLElBQTRCO1lBQ3ZDLElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSTtnQkFDaEMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2dCQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztnQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7YUFDVixDQUFDO1lBRUYsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDakMsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMseUJBQXlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLElBQUksVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDO29CQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQzt3QkFDbkIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7d0JBQ2hCLFVBQVUsRUFBRSxVQUFVO3dCQUN0QixLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzt3QkFDakIsV0FBVyxFQUFFLFdBQVc7cUJBQ3hCLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQyxDQUFD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