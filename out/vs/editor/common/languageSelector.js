/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/path"], function (require, exports, glob_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.score = score;
    exports.targetsNotebooks = targetsNotebooks;
    function score(selector, candidateUri, candidateLanguage, candidateIsSynchronized, candidateNotebookUri, candidateNotebookType) {
        if (Array.isArray(selector)) {
            // array -> take max individual value
            let ret = 0;
            for (const filter of selector) {
                const value = score(filter, candidateUri, candidateLanguage, candidateIsSynchronized, candidateNotebookUri, candidateNotebookType);
                if (value === 10) {
                    return value; // already at the highest
                }
                if (value > ret) {
                    ret = value;
                }
            }
            return ret;
        }
        else if (typeof selector === 'string') {
            if (!candidateIsSynchronized) {
                return 0;
            }
            // short-hand notion, desugars to
            // 'fooLang' -> { language: 'fooLang'}
            // '*' -> { language: '*' }
            if (selector === '*') {
                return 5;
            }
            else if (selector === candidateLanguage) {
                return 10;
            }
            else {
                return 0;
            }
        }
        else if (selector) {
            // filter -> select accordingly, use defaults for scheme
            const { language, pattern, scheme, hasAccessToAllModels, notebookType } = selector; // TODO: microsoft/TypeScript#42768
            if (!candidateIsSynchronized && !hasAccessToAllModels) {
                return 0;
            }
            // selector targets a notebook -> use the notebook uri instead
            // of the "normal" document uri.
            if (notebookType && candidateNotebookUri) {
                candidateUri = candidateNotebookUri;
            }
            let ret = 0;
            if (scheme) {
                if (scheme === candidateUri.scheme) {
                    ret = 10;
                }
                else if (scheme === '*') {
                    ret = 5;
                }
                else {
                    return 0;
                }
            }
            if (language) {
                if (language === candidateLanguage) {
                    ret = 10;
                }
                else if (language === '*') {
                    ret = Math.max(ret, 5);
                }
                else {
                    return 0;
                }
            }
            if (notebookType) {
                if (notebookType === candidateNotebookType) {
                    ret = 10;
                }
                else if (notebookType === '*' && candidateNotebookType !== undefined) {
                    ret = Math.max(ret, 5);
                }
                else {
                    return 0;
                }
            }
            if (pattern) {
                let normalizedPattern;
                if (typeof pattern === 'string') {
                    normalizedPattern = pattern;
                }
                else {
                    // Since this pattern has a `base` property, we need
                    // to normalize this path first before passing it on
                    // because we will compare it against `Uri.fsPath`
                    // which uses platform specific separators.
                    // Refs: https://github.com/microsoft/vscode/issues/99938
                    normalizedPattern = { ...pattern, base: (0, path_1.normalize)(pattern.base) };
                }
                if (normalizedPattern === candidateUri.fsPath || (0, glob_1.match)(normalizedPattern, candidateUri.fsPath)) {
                    ret = 10;
                }
                else {
                    return 0;
                }
            }
            return ret;
        }
        else {
            return 0;
        }
    }
    function targetsNotebooks(selector) {
        if (typeof selector === 'string') {
            return false;
        }
        else if (Array.isArray(selector)) {
            return selector.some(targetsNotebooks);
        }
        else {
            return !!selector.notebookType;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VTZWxlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9sYW5ndWFnZVNlbGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBeUJoRyxzQkF3R0M7SUFHRCw0Q0FRQztJQW5IRCxTQUFnQixLQUFLLENBQUMsUUFBc0MsRUFBRSxZQUFpQixFQUFFLGlCQUF5QixFQUFFLHVCQUFnQyxFQUFFLG9CQUFxQyxFQUFFLHFCQUF5QztRQUU3TixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUM3QixxQ0FBcUM7WUFDckMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ1osS0FBSyxNQUFNLE1BQU0sSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsdUJBQXVCLEVBQUUsb0JBQW9CLEVBQUUscUJBQXFCLENBQUMsQ0FBQztnQkFDbkksSUFBSSxLQUFLLEtBQUssRUFBRSxFQUFFLENBQUM7b0JBQ2xCLE9BQU8sS0FBSyxDQUFDLENBQUMseUJBQXlCO2dCQUN4QyxDQUFDO2dCQUNELElBQUksS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDO29CQUNqQixHQUFHLEdBQUcsS0FBSyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFFWixDQUFDO2FBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUV6QyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBRUQsaUNBQWlDO1lBQ2pDLHNDQUFzQztZQUN0QywyQkFBMkI7WUFD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