/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, event_1, lifecycle_1, range_1, editorColorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorizedBracketPairsDecorationProvider = void 0;
    class ColorizedBracketPairsDecorationProvider extends lifecycle_1.Disposable {
        constructor(textModel) {
            super();
            this.textModel = textModel;
            this.colorProvider = new ColorProvider();
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.colorizationOptions = textModel.getOptions().bracketPairColorizationOptions;
            this._register(textModel.bracketPairs.onDidChange(e => {
                this.onDidChangeEmitter.fire();
            }));
        }
        //#region TextModel events
        handleDidChangeOptions(e) {
            this.colorizationOptions = this.textModel.getOptions().bracketPairColorizationOptions;
        }
        //#endregion
        getDecorationsInRange(range, ownerId, filterOutValidation, onlyMinimapDecorations) {
            if (onlyMinimapDecorations) {
                // Bracket pair colorization decorations are not rendered in the minimap
                return [];
            }
            if (ownerId === undefined) {
                return [];
            }
            if (!this.colorizationOptions.enabled) {
                return [];
            }
            const result = this.textModel.bracketPairs.getBracketsInRange(range, true).map(bracket => ({
                id: `bracket${bracket.range.toString()}-${bracket.nestingLevel}`,
                options: {
                    description: 'BracketPairColorization',
                    inlineClassName: this.colorProvider.getInlineClassName(bracket, this.colorizationOptions.independentColorPoolPerBracketType),
                },
                ownerId: 0,
                range: bracket.range,
            })).toArray();
            return result;
        }
        getAllDecorations(ownerId, filterOutValidation) {
            if (ownerId === undefined) {
                return [];
            }
            if (!this.colorizationOptions.enabled) {
                return [];
            }
            return this.getDecorationsInRange(new range_1.Range(1, 1, this.textModel.getLineCount(), 1), ownerId, filterOutValidation);
        }
    }
    exports.ColorizedBracketPairsDecorationProvider = ColorizedBracketPairsDecorationProvider;
    class ColorProvider {
        constructor() {
            this.unexpectedClosingBracketClassName = 'unexpected-closing-bracket';
        }
        getInlineClassName(bracket, independentColorPoolPerBracketType) {
            if (bracket.isInvalid) {
                return this.unexpectedClosingBracketClassName;
            }
            return this.getInlineClassNameOfLevel(independentColorPoolPerBracketType ? bracket.nestingLevelOfEqualBracketType : bracket.nestingLevel);
        }
        getInlineClassNameOfLevel(level) {
            // To support a dynamic amount of colors up to 6 colors,
            // we use a number that is a lcm of all numbers from 1 to 6.
            return `bracket-highlighting-${level % 30}`;
        }
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const colors = [
            editorColorRegistry_1.editorBracketHighlightingForeground1,
            editorColorRegistry_1.editorBracketHighlightingForeground2,
            editorColorRegistry_1.editorBracketHighlightingForeground3,
            editorColorRegistry_1.editorBracketHighlightingForeground4,
            editorColorRegistry_1.editorBracketHighlightingForeground5,
            editorColorRegistry_1.editorBracketHighlightingForeground6
        ];
        const colorProvider = new ColorProvider();
        collector.addRule(`.monaco-editor .${colorProvider.unexpectedClosingBracketClassName} { color: ${theme.getColor(editorColorRegistry_1.editorBracketHighlightingUnexpectedBracketForeground)}; }`);
        const colorValues = colors
            .map(c => theme.getColor(c))
            .filter((c) => !!c)
            .filter(c => !c.isTransparent());
        for (let level = 0; level < 30; level++) {
            const color = colorValues[level % colorValues.length];
            collector.addRule(`.monaco-editor .${colorProvider.getInlineClassNameOfLevel(level)} { color: ${color}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JpemVkQnJhY2tldFBhaXJzRGVjb3JhdGlvblByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvY29sb3JpemVkQnJhY2tldFBhaXJzRGVjb3JhdGlvblByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBYSx1Q0FBd0MsU0FBUSxzQkFBVTtRQU90RSxZQUE2QixTQUFvQjtZQUNoRCxLQUFLLEVBQUUsQ0FBQztZQURvQixjQUFTLEdBQVQsU0FBUyxDQUFXO1lBTGhDLGtCQUFhLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUVwQyx1QkFBa0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQzFDLGdCQUFXLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUszRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLDhCQUE4QixDQUFDO1lBRWpGLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELDBCQUEwQjtRQUVuQixzQkFBc0IsQ0FBQyxDQUE0QjtZQUN6RCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztRQUN2RixDQUFDO1FBRUQsWUFBWTtRQUVaLHFCQUFxQixDQUFDLEtBQVksRUFBRSxPQUFnQixFQUFFLG1CQUE2QixFQUFF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