/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/linkedList"], function (require, exports, iterator_1, lifecycle_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_WORD_REGEXP = exports.USUAL_WORD_SEPARATORS = void 0;
    exports.ensureValidWordDefinition = ensureValidWordDefinition;
    exports.setDefaultGetWordAtTextConfig = setDefaultGetWordAtTextConfig;
    exports.getWordAtText = getWordAtText;
    exports.USUAL_WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';
    /**
     * Create a word definition regular expression based on default word separators.
     * Optionally provide allowed separators that should be included in words.
     *
     * The default would look like this:
     * /(-?\d*\.\d\w*)|([^\`\~\!\@\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
     */
    function createWordRegExp(allowInWords = '') {
        let source = '(-?\\d*\\.\\d\\w*)|([^';
        for (const sep of exports.USUAL_WORD_SEPARATORS) {
            if (allowInWords.indexOf(sep) >= 0) {
                continue;
            }
            source += '\\' + sep;
        }
        source += '\\s]+)';
        return new RegExp(source, 'g');
    }
    // catches numbers (including floating numbers) in the first group, and alphanum in the second
    exports.DEFAULT_WORD_REGEXP = createWordRegExp();
    function ensureValidWordDefinition(wordDefinition) {
        let result = exports.DEFAULT_WORD_REGEXP;
        if (wordDefinition && (wordDefinition instanceof RegExp)) {
            if (!wordDefinition.global) {
                let flags = 'g';
                if (wordDefinition.ignoreCase) {
                    flags += 'i';
                }
                if (wordDefinition.multiline) {
                    flags += 'm';
                }
                if (wordDefinition.unicode) {
                    flags += 'u';
                }
                result = new RegExp(wordDefinition.source, flags);
            }
            else {
                result = wordDefinition;
            }
        }
        result.lastIndex = 0;
        return result;
    }
    const _defaultConfig = new linkedList_1.LinkedList();
    _defaultConfig.unshift({
        maxLen: 1000,
        windowSize: 15,
        timeBudget: 150
    });
    function setDefaultGetWordAtTextConfig(value) {
        const rm = _defaultConfig.unshift(value);
        return (0, lifecycle_1.toDisposable)(rm);
    }
    function getWordAtText(column, wordDefinition, text, textOffset, config) {
        // Ensure the regex has the 'g' flag, otherwise this will loop forever
        wordDefinition = ensureValidWordDefinition(wordDefinition);
        if (!config) {
            config = iterator_1.Iterable.first(_defaultConfig);
        }
        if (text.length > config.maxLen) {
            // don't throw strings that long at the regexp
            // but use a sub-string in which a word must occur
            let start = column - config.maxLen / 2;
            if (start < 0) {
                start = 0;
            }
            else {
                textOffset += start;
            }
            text = text.substring(start, column + config.maxLen / 2);
            return getWordAtText(column, wordDefinition, text, textOffset, config);
        }
        const t1 = Date.now();
        const pos = column - 1 - textOffset;
        let prevRegexIndex = -1;
        let match = null;
        for (let i = 1;; i++) {
            // check time budget
            if (Date.now() - t1 >= config.timeBudget) {
                break;
            }
            // reset the index at which the regexp should start matching, also know where it
            // should stop so that subsequent search don't repeat previous searches
            const regexIndex = pos - config.windowSize * i;
            wordDefinition.lastIndex = Math.max(0, regexIndex);
            const thisMatch = _findRegexMatchEnclosingPosition(wordDefinition, text, pos, prevRegexIndex);
            if (!thisMatch && match) {
                // stop: we have something
                break;
            }
            match = thisMatch;
            // stop: searched at start
            if (regexIndex <= 0) {
                break;
            }
            prevRegexIndex = regexIndex;
        }
        if (match) {
            const result = {
                word: match[0],
                startColumn: textOffset + 1 + match.index,
                endColumn: textOffset + 1 + match.index + match[0].length
            };
            wordDefinition.lastIndex = 0;
            return result;
        }
        return null;
    }
    function _findRegexMatchEnclosingPosition(wordDefinition, text, pos, stopPos) {
        let match;
        while (match = wordDefinition.exec(text)) {
            const matchIndex = match.index || 0;
            if (matchIndex <= pos && wordDefinition.lastIndex >= pos) {
                return match;
            }
            else if (stopPos > 0 && matchIndex > stopPos) {
                return null;
            }
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZEhlbHBlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL3dvcmRIZWxwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0RoRyw4REF3QkM7SUFpQkQsc0VBR0M7SUFFRCxzQ0FnRUM7SUF4SlksUUFBQSxxQkFBcUIsR0FBRyxtQ0FBbUMsQ0FBQztJQW9CekU7Ozs7OztPQU1HO0lBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxlQUF1QixFQUFFO1FBQ2xELElBQUksTUFBTSxHQUFHLHdCQUF3QixDQUFDO1FBQ3RDLEtBQUssTUFBTSxHQUFHLElBQUksNkJBQXFCLEVBQUUsQ0FBQztZQUN6QyxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3BDLFNBQVM7WUFDVixDQUFDO1lBQ0QsTUFBTSxJQUFJLElBQUksR0FBRyxHQUFHLENBQUM7UUFDdEIsQ0FBQztRQUNELE1BQU0sSUFBSSxRQUFRLENBQUM7UUFDbkIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELDhGQUE4RjtJQUNqRixRQUFBLG1CQUFtQixHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFFdEQsU0FBZ0IseUJBQXlCLENBQUMsY0FBOEI7UUFDdkUsSUFBSSxNQUFNLEdBQVcsMkJBQW1CLENBQUM7UUFFekMsSUFBSSxjQUFjLElBQUksQ0FBQyxjQUFjLFlBQVksTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUMxRCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixJQUFJLEtBQUssR0FBRyxHQUFHLENBQUM7Z0JBQ2hCLElBQUksY0FBYyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUMv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