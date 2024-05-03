/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/editor/common/core/wordHelper", "vs/editor/common/services/languageFeatures", "vs/editor/common/languages", "vs/base/common/lifecycle", "vs/base/common/map"], function (require, exports, wordHelper_1, languageFeatures_1, languages_1, lifecycle_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextualMultiDocumentHighlightFeature = void 0;
    class TextualDocumentHighlightProvider {
        constructor() {
            this.selector = { language: '*' };
        }
        provideMultiDocumentHighlights(primaryModel, position, otherModels, token) {
            const result = new map_1.ResourceMap();
            const word = primaryModel.getWordAtPosition({
                lineNumber: position.lineNumber,
                column: position.column
            });
            if (!word) {
                return Promise.resolve(result);
            }
            for (const model of [primaryModel, ...otherModels]) {
                if (model.isDisposed()) {
                    continue;
                }
                const matches = model.findMatches(word.word, true, false, true, wordHelper_1.USUAL_WORD_SEPARATORS, false);
                const highlights = matches.map(m => ({
                    range: m.range,
                    kind: languages_1.DocumentHighlightKind.Text
                }));
                if (highlights) {
                    result.set(model.uri, highlights);
                }
            }
            return result;
        }
    }
    let TextualMultiDocumentHighlightFeature = class TextualMultiDocumentHighlightFeature extends lifecycle_1.Disposable {
        constructor(languageFeaturesService) {
            super();
            this._register(languageFeaturesService.multiDocumentHighlightProvider.register('*', new TextualDocumentHighlightProvider()));
        }
    };
    exports.TextualMultiDocumentHighlightFeature = TextualMultiDocumentHighlightFeature;
    exports.TextualMultiDocumentHighlightFeature = TextualMultiDocumentHighlightFeature = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService)
    ], TextualMultiDocumentHighlightFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dHVhbEhpZ2hsaWdodFByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi93b3JkSGlnaGxpZ2h0ZXIvYnJvd3Nlci90ZXh0dWFsSGlnaGxpZ2h0UHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0sZ0NBQWdDO1FBQXRDO1lBRUMsYUFBUSxHQUFtQixFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQWtDOUMsQ0FBQztRQWhDQSw4QkFBOEIsQ0FBQyxZQUF3QixFQUFFLFFBQWtCLEVBQUUsV0FBeUIsRUFBRSxLQUF3QjtZQUUvSCxNQUFNLE1BQU0sR0FBRyxJQUFJLGlCQUFXLEVBQXVCLENBQUM7WUFFdEQsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFDO2dCQUMzQyxVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7Z0JBQy9CLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTthQUN2QixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFHRCxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDeEIsU0FBUztnQkFDVixDQUFDO2dCQUVELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxrQ0FBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDOUYsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSztvQkFDZCxJQUFJLEVBQUUsaUNBQXFCLENBQUMsSUFBSTtpQkFDaEMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosSUFBSSxVQUFVLEVBQUUsQ0FBQztvQkFDaEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztLQUVEO0lBRU0sSUFBTSxvQ0FBb0MsR0FBMUMsTUFBTSxvQ0FBcUMsU0FBUSxzQkFBVTtRQUNuRSxZQUMyQix1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLDhCQUE4QixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5SCxDQUFDO0tBQ0QsQ0FBQTtJQVJZLG9GQUFvQzttREFBcEMsb0NBQW9DO1FBRTlDLFdBQUEsMkNBQXdCLENBQUE7T0FGZCxvQ0FBb0MsQ0FRaEQifQ==