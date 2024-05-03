/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/core/position", "vs/base/common/arrays", "vs/base/common/types", "vs/editor/common/model/guidesTextModelPart", "vs/editor/common/textModelGuides", "vs/css!./indentGuides"], function (require, exports, dynamicViewOverlay_1, editorColorRegistry_1, themeService_1, position_1, arrays_1, types_1, guidesTextModelPart_1, textModelGuides_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndentGuidesOverlay = void 0;
    class IndentGuidesOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        constructor(context) {
            super();
            this._context = context;
            this._primaryPosition = null;
            const options = this._context.configuration.options;
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._spaceWidth = fontInfo.spaceWidth;
            this._maxIndentLeft = wrappingInfo.wrappingColumn === -1 ? -1 : (wrappingInfo.wrappingColumn * fontInfo.typicalHalfwidthCharacterWidth);
            this._bracketPairGuideOptions = options.get(16 /* EditorOption.guides */);
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            this._spaceWidth = fontInfo.spaceWidth;
            this._maxIndentLeft = wrappingInfo.wrappingColumn === -1 ? -1 : (wrappingInfo.wrappingColumn * fontInfo.typicalHalfwidthCharacterWidth);
            this._bracketPairGuideOptions = options.get(16 /* EditorOption.guides */);
            return true;
        }
        onCursorStateChanged(e) {
            const selection = e.selections[0];
            const newPosition = selection.getPosition();
            if (!this._primaryPosition?.equals(newPosition)) {
                this._primaryPosition = newPosition;
                return true;
            }
            return false;
        }
        onDecorationsChanged(e) {
            // true for inline decorations
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged; // || e.scrollWidthChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        onLanguageConfigurationChanged(e) {
            return true;
        }
        // --- end event handlers
        prepareRender(ctx) {
            if (!this._bracketPairGuideOptions.indentation && this._bracketPairGuideOptions.bracketPairs === false) {
                this._renderResult = null;
                return;
            }
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const scrollWidth = ctx.scrollWidth;
            const activeCursorPosition = this._primaryPosition;
            const indents = this.getGuidesByLine(visibleStartLineNumber, Math.min(visibleEndLineNumber + 1, this._context.viewModel.getLineCount()), activeCursorPosition);
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                const indent = indents[lineIndex];
                let result = '';
                const leftOffset = ctx.visibleRangeForPosition(new position_1.Position(lineNumber, 1))?.left ?? 0;
                for (const guide of indent) {
                    const left = guide.column === -1
                        ? leftOffset + (guide.visibleColumn - 1) * this._spaceWidth
                        : ctx.visibleRangeForPosition(new position_1.Position(lineNumber, guide.column)).left;
                    if (left > scrollWidth || (this._maxIndentLeft > 0 && left > this._maxIndentLeft)) {
                        break;
                    }
                    const className = guide.horizontalLine ? (guide.horizontalLine.top ? 'horizontal-top' : 'horizontal-bottom') : 'vertical';
                    const width = guide.horizontalLine
                        ? (ctx.visibleRangeForPosition(new position_1.Position(lineNumber, guide.horizontalLine.endColumn))?.left ?? (left + this._spaceWidth)) - left
                        : this._spaceWidth;
                    result += `<div class="core-guide ${guide.className} ${className}" style="left:${left}px;width:${width}px"></div>`;
                }
                output[lineIndex] = result;
            }
            this._renderResult = output;
        }
        getGuidesByLine(visibleStartLineNumber, visibleEndLineNumber, activeCursorPosition) {
            const bracketGuides = this._bracketPairGuideOptions.bracketPairs !== false
                ? this._context.viewModel.getBracketGuidesInRangeByLine(visibleStartLineNumber, visibleEndLineNumber, activeCursorPosition, {
                    highlightActive: this._bracketPairGuideOptions.highlightActiveBracketPair,
                    horizontalGuides: this._bracketPairGuideOptions.bracketPairsHorizontal === true
                        ? textModelGuides_1.HorizontalGuidesState.Enabled
                        : this._bracketPairGuideOptions.bracketPairsHorizontal === 'active'
                            ? textModelGuides_1.HorizontalGuidesState.EnabledForActive
                            : textModelGuides_1.HorizontalGuidesState.Disabled,
                    includeInactive: this._bracketPairGuideOptions.bracketPairs === true,
                })
                : null;
            const indentGuides = this._bracketPairGuideOptions.indentation
                ? this._context.viewModel.getLinesIndentGuides(visibleStartLineNumber, visibleEndLineNumber)
                : null;
            let activeIndentStartLineNumber = 0;
            let activeIndentEndLineNumber = 0;
            let activeIndentLevel = 0;
            if (this._bracketPairGuideOptions.highlightActiveIndentation !== false && activeCursorPosition) {
                const activeIndentInfo = this._context.viewModel.getActiveIndentGuide(activeCursorPosition.lineNumber, visibleStartLineNumber, visibleEndLineNumber);
                activeIndentStartLineNumber = activeIndentInfo.startLineNumber;
                activeIndentEndLineNumber = activeIndentInfo.endLineNumber;
                activeIndentLevel = activeIndentInfo.indent;
            }
            const { indentSize } = this._context.viewModel.model.getOptions();
            const result = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineGuides = new Array();
                result.push(lineGuides);
                const bracketGuidesInLine = bracketGuides ? bracketGuides[lineNumber - visibleStartLineNumber] : [];
                const bracketGuidesInLineQueue = new arrays_1.ArrayQueue(bracketGuidesInLine);
                const indentGuidesInLine = indentGuides ? indentGuides[lineNumber - visibleStartLineNumber] : 0;
                for (let indentLvl = 1; indentLvl <= indentGuidesInLine; indentLvl++) {
                    const indentGuide = (indentLvl - 1) * indentSize + 1;
                    const isActive = 
                    // Disable active indent guide if there are bracket guides.
                    (this._bracketPairGuideOptions.highlightActiveIndentation === 'always' || bracketGuidesInLine.length === 0) &&
                        activeIndentStartLineNumber <= lineNumber &&
                        lineNumber <= activeIndentEndLineNumber &&
                        indentLvl === activeIndentLevel;
                    lineGuides.push(...bracketGuidesInLineQueue.takeWhile(g => g.visibleColumn < indentGuide) || []);
                    const peeked = bracketGuidesInLineQueue.peek();
                    if (!peeked || peeked.visibleColumn !== indentGuide || peeked.horizontalLine) {
                        lineGuides.push(new textModelGuides_1.IndentGuide(indentGuide, -1, `core-guide-indent lvl-${(indentLvl - 1) % 30}` + (isActive ? ' indent-active' : ''), null, -1, -1));
                    }
                }
                lineGuides.push(...bracketGuidesInLineQueue.takeWhile(g => true) || []);
            }
            return result;
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.IndentGuidesOverlay = IndentGuidesOverlay;
    function transparentToUndefined(color) {
        if (color && color.isTransparent()) {
            return undefined;
        }
        return color;
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const colors = [
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground1, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground1, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground1 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground2, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground2, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground2 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground3, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground3, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground3 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground4, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground4, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground4 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground5, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground5, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground5 },
            { bracketColor: editorColorRegistry_1.editorBracketHighlightingForeground6, guideColor: editorColorRegistry_1.editorBracketPairGuideBackground6, guideColorActive: editorColorRegistry_1.editorBracketPairGuideActiveBackground6 }
        ];
        const colorProvider = new guidesTextModelPart_1.BracketPairGuidesClassNames();
        const indentColors = [
            { indentColor: editorColorRegistry_1.editorIndentGuide1, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide1 },
            { indentColor: editorColorRegistry_1.editorIndentGuide2, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide2 },
            { indentColor: editorColorRegistry_1.editorIndentGuide3, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide3 },
            { indentColor: editorColorRegistry_1.editorIndentGuide4, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide4 },
            { indentColor: editorColorRegistry_1.editorIndentGuide5, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide5 },
            { indentColor: editorColorRegistry_1.editorIndentGuide6, indentColorActive: editorColorRegistry_1.editorActiveIndentGuide6 },
        ];
        const colorValues = colors
            .map(c => {
            const bracketColor = theme.getColor(c.bracketColor);
            const guideColor = theme.getColor(c.guideColor);
            const guideColorActive = theme.getColor(c.guideColorActive);
            const effectiveGuideColor = transparentToUndefined(transparentToUndefined(guideColor) ?? bracketColor?.transparent(0.3));
            const effectiveGuideColorActive = transparentToUndefined(transparentToUndefined(guideColorActive) ?? bracketColor);
            if (!effectiveGuideColor || !effectiveGuideColorActive) {
                return undefined;
            }
            return {
                guideColor: effectiveGuideColor,
                guideColorActive: effectiveGuideColorActive,
            };
        })
            .filter(types_1.isDefined);
        const indentColorValues = indentColors
            .map(c => {
            const indentColor = theme.getColor(c.indentColor);
            const indentColorActive = theme.getColor(c.indentColorActive);
            const effectiveIndentColor = transparentToUndefined(indentColor);
            const effectiveIndentColorActive = transparentToUndefined(indentColorActive);
            if (!effectiveIndentColor || !effectiveIndentColorActive) {
                return undefined;
            }
            return {
                indentColor: effectiveIndentColor,
                indentColorActive: effectiveIndentColorActive,
            };
        })
            .filter(types_1.isDefined);
        if (colorValues.length > 0) {
            for (let level = 0; level < 30; level++) {
                const colors = colorValues[level % colorValues.length];
                collector.addRule(`.monaco-editor .${colorProvider.getInlineClassNameOfLevel(level).replace(/ /g, '.')} { --guide-color: ${colors.guideColor}; --guide-color-active: ${colors.guideColorActive}; }`);
            }
            collector.addRule(`.monaco-editor .vertical { box-shadow: 1px 0 0 0 var(--guide-color) inset; }`);
            collector.addRule(`.monaco-editor .horizontal-top { border-top: 1px solid var(--guide-color); }`);
            collector.addRule(`.monaco-editor .horizontal-bottom { border-bottom: 1px solid var(--guide-color); }`);
            collector.addRule(`.monaco-editor .vertical.${colorProvider.activeClassName} { box-shadow: 1px 0 0 0 var(--guide-color-active) inset; }`);
            collector.addRule(`.monaco-editor .horizontal-top.${colorProvider.activeClassName} { border-top: 1px solid var(--guide-color-active); }`);
            collector.addRule(`.monaco-editor .horizontal-bottom.${colorProvider.activeClassName} { border-bottom: 1px solid var(--guide-color-active); }`);
        }
        if (indentColorValues.length > 0) {
            for (let level = 0; level < 30; level++) {
                const colors = indentColorValues[level % indentColorValues.length];
                collector.addRule(`.monaco-editor .lines-content .core-guide-indent.lvl-${level} { --indent-color: ${colors.indentColor}; --indent-color-active: ${colors.indentColorActive}; }`);
            }
            collector.addRule(`.monaco-editor .lines-content .core-guide-indent { box-shadow: 1px 0 0 0 var(--indent-color) inset; }`);
            collector.addRule(`.monaco-editor .lines-content .core-guide-indent.indent-active { box-shadow: 1px 0 0 0 var(--indent-color-active) inset; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50R3VpZGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvaW5kZW50R3VpZGVzL2luZGVudEd1aWRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsbUJBQW9CLFNBQVEsdUNBQWtCO1FBUzFELFlBQVksT0FBb0I7WUFDL0IsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBRTdCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxxQ0FBMkIsQ0FBQztZQUM1RCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxnQ0FBdUIsQ0FBQztZQUVwRCxJQUFJLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDdkMsSUFBSSxDQUFDLGNBQWMsR0FBRyxZQUFZLENBQUMsY0FBYyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQ3hJLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxPQUFPLENBQUMsR0FBRyw4QkFBcUIsQ0FBQztZQUVqRSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUUxQixJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRWUsT0FBTztZQUN0QixJQUFJLENBQUMsUUFBUSxD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