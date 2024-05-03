/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/map", "vs/editor/common/core/characterClassifier"], function (require, exports, map_1, characterClassifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordCharacterClassifier = exports.WordCharacterClass = void 0;
    exports.getMapForWordSeparators = getMapForWordSeparators;
    var WordCharacterClass;
    (function (WordCharacterClass) {
        WordCharacterClass[WordCharacterClass["Regular"] = 0] = "Regular";
        WordCharacterClass[WordCharacterClass["Whitespace"] = 1] = "Whitespace";
        WordCharacterClass[WordCharacterClass["WordSeparator"] = 2] = "WordSeparator";
    })(WordCharacterClass || (exports.WordCharacterClass = WordCharacterClass = {}));
    class WordCharacterClassifier extends characterClassifier_1.CharacterClassifier {
        constructor(wordSeparators, intlSegmenterLocales) {
            super(0 /* WordCharacterClass.Regular */);
            this._segmenter = null;
            this._cachedLine = null;
            this._cachedSegments = [];
            this.intlSegmenterLocales = intlSegmenterLocales;
            if (this.intlSegmenterLocales.length > 0) {
                this._segmenter = new Intl.Segmenter(this.intlSegmenterLocales, { granularity: 'word' });
            }
            else {
                this._segmenter = null;
            }
            for (let i = 0, len = wordSeparators.length; i < len; i++) {
                this.set(wordSeparators.charCodeAt(i), 2 /* WordCharacterClass.WordSeparator */);
            }
            this.set(32 /* CharCode.Space */, 1 /* WordCharacterClass.Whitespace */);
            this.set(9 /* CharCode.Tab */, 1 /* WordCharacterClass.Whitespace */);
        }
        findPrevIntlWordBeforeOrAtOffset(line, offset) {
            let candidate = null;
            for (const segment of this._getIntlSegmenterWordsOnLine(line)) {
                if (segment.index > offset) {
                    break;
                }
                candidate = segment;
            }
            return candidate;
        }
        findNextIntlWordAtOrAfterOffset(lineContent, offset) {
            for (const segment of this._getIntlSegmenterWordsOnLine(lineContent)) {
                if (segment.index < offset) {
                    continue;
                }
                return segment;
            }
            return null;
        }
        _getIntlSegmenterWordsOnLine(line) {
            if (!this._segmenter) {
                return [];
            }
            // Check if the line has changed from the previous call
            if (this._cachedLine === line) {
                return this._cachedSegments;
            }
            // Update the cache with the new line
            this._cachedLine = line;
            this._cachedSegments = this._filterWordSegments(this._segmenter.segment(line));
            return this._cachedSegments;
        }
        _filterWordSegments(segments) {
            const result = [];
            for (const segment of segments) {
                if (this._isWordLike(segment)) {
                    result.push(segment);
                }
            }
            return result;
        }
        _isWordLike(segment) {
            if (segment.isWordLike) {
                return true;
            }
            return false;
        }
    }
    exports.WordCharacterClassifier = WordCharacterClassifier;
    const wordClassifierCache = new map_1.LRUCache(10);
    function getMapForWordSeparators(wordSeparators, intlSegmenterLocales) {
        const key = `${wordSeparators}/${intlSegmenterLocales.join(',')}`;
        let result = wordClassifierCache.get(key);
        if (!result) {
            result = new WordCharacterClassifier(wordSeparators, intlSegmenterLocales);
            wordClassifierCache.set(key, result);
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZENoYXJhY3RlckNsYXNzaWZpZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29yZS93b3JkQ2hhcmFjdGVyQ2xhc3NpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrR2hHLDBEQVFDO0lBcEdELElBQWtCLGtCQUlqQjtJQUpELFdBQWtCLGtCQUFrQjtRQUNuQyxpRUFBVyxDQUFBO1FBQ1gsdUVBQWMsQ0FBQTtRQUNkLDZFQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFKaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFJbkM7SUFFRCxNQUFhLHVCQUF3QixTQUFRLHlDQUF1QztRQU9uRixZQUFZLGNBQXNCLEVBQUUsb0JBQXlEO1lBQzVGLEtBQUssb0NBQTRCLENBQUM7WUFMbEIsZUFBVSxHQUEwQixJQUFJLENBQUM7WUFDbEQsZ0JBQVcsR0FBa0IsSUFBSSxDQUFDO1lBQ2xDLG9CQUFlLEdBQTBCLEVBQUUsQ0FBQztZQUluRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7WUFDakQsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUMxRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDeEIsQ0FBQztZQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxF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