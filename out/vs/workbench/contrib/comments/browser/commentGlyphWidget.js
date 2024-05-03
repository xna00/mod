/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/color", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/languages"], function (require, exports, nls, color_1, model_1, textModel_1, colorRegistry_1, themeService_1, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentGlyphWidget = exports.overviewRulerCommentingRangeForeground = void 0;
    exports.overviewRulerCommentingRangeForeground = (0, colorRegistry_1.registerColor)('editorGutter.commentRangeForeground', { dark: (0, colorRegistry_1.opaque)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.editorBackground), light: (0, colorRegistry_1.darken)((0, colorRegistry_1.opaque)(colorRegistry_1.listInactiveSelectionBackground, colorRegistry_1.editorBackground), .05), hcDark: color_1.Color.white, hcLight: color_1.Color.black }, nls.localize('editorGutterCommentRangeForeground', 'Editor gutter decoration color for commenting ranges. This color should be opaque.'));
    const overviewRulerCommentForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.commentForeground', { dark: exports.overviewRulerCommentingRangeForeground, light: exports.overviewRulerCommentingRangeForeground, hcDark: exports.overviewRulerCommentingRangeForeground, hcLight: exports.overviewRulerCommentingRangeForeground }, nls.localize('editorOverviewRuler.commentForeground', 'Editor overview ruler decoration color for resolved comments. This color should be opaque.'));
    const overviewRulerCommentUnresolvedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.commentUnresolvedForeground', { dark: overviewRulerCommentForeground, light: overviewRulerCommentForeground, hcDark: overviewRulerCommentForeground, hcLight: overviewRulerCommentForeground }, nls.localize('editorOverviewRuler.commentUnresolvedForeground', 'Editor overview ruler decoration color for unresolved comments. This color should be opaque.'));
    const editorGutterCommentGlyphForeground = (0, colorRegistry_1.registerColor)('editorGutter.commentGlyphForeground', { dark: colorRegistry_1.editorForeground, light: colorRegistry_1.editorForeground, hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('editorGutterCommentGlyphForeground', 'Editor gutter decoration color for commenting glyphs.'));
    (0, colorRegistry_1.registerColor)('editorGutter.commentUnresolvedGlyphForeground', { dark: editorGutterCommentGlyphForeground, light: editorGutterCommentGlyphForeground, hcDark: editorGutterCommentGlyphForeground, hcLight: editorGutterCommentGlyphForeground }, nls.localize('editorGutterCommentUnresolvedGlyphForeground', 'Editor gutter decoration color for commenting glyphs for unresolved comment threads.'));
    class CommentGlyphWidget {
        static { this.description = 'comment-glyph-widget'; }
        constructor(editor, lineNumber) {
            this._commentsOptions = this.createDecorationOptions();
            this._editor = editor;
            this._commentsDecorations = this._editor.createDecorationsCollection();
            this.setLineNumber(lineNumber);
        }
        createDecorationOptions() {
            const unresolved = this._threadState === languages_1.CommentThreadState.Unresolved;
            const decorationOptions = {
                description: CommentGlyphWidget.description,
                isWholeLine: true,
                overviewRuler: {
                    color: (0, themeService_1.themeColorFromId)(unresolved ? overviewRulerCommentUnresolvedForeground : overviewRulerCommentForeground),
                    position: model_1.OverviewRulerLane.Center
                },
                collapseOnReplaceEdit: true,
                linesDecorationsClassName: `comment-range-glyph comment-thread${unresolved ? '-unresolved' : ''}`
            };
            return textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
        }
        setThreadState(state) {
            if (this._threadState !== state) {
                this._threadState = state;
                this._commentsOptions = this.createDecorationOptions();
                this._updateDecorations();
            }
        }
        _updateDecorations() {
            const commentsDecorations = [{
                    range: {
                        startLineNumber: this._lineNumber, startColumn: 1,
                        endLineNumber: this._lineNumber, endColumn: 1
                    },
                    options: this._commentsOptions
                }];
            this._commentsDecorations.set(commentsDecorations);
        }
        setLineNumber(lineNumber) {
            this._lineNumber = lineNumber;
            this._updateDecorations();
        }
        getPosition() {
            const range = (this._commentsDecorations.length > 0 ? this._commentsDecorations.getRange(0) : null);
            return {
                position: {
                    lineNumber: range ? range.endLineNumber : this._lineNumber,
                    column: 1
                },
                preference: [0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        dispose() {
            this._commentsDecorations.clear();
        }
    }
    exports.CommentGlyphWidget = CommentGlyphWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudEdseXBoV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9icm93c2VyL2NvbW1lbnRHbHlwaFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZbkYsUUFBQSxzQ0FBc0MsR0FBRyxJQUFBLDZCQUFhLEVBQUMscUNBQXFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBQSxzQkFBTSxFQUFDLCtDQUErQixFQUFFLGdDQUFnQixDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUEsc0JBQU0sRUFBQyxJQUFBLHNCQUFNLEVBQUMsK0NBQStCLEVBQUUsZ0NBQWdCLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsYUFBSyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsYUFBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0NBQW9DLEVBQUUsb0ZBQW9GLENBQUMsQ0FBQyxDQUFDO0lBQ3BiLE1BQU0sOEJBQThCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLHVDQUF1QyxFQUFFLEVBQUUsSUFBSSxFQUFFLDhDQUFzQyxFQUFFLEtBQUssRUFBRSw4Q0FBc0MsRUFBRSxNQUFNLEVBQUUsOENBQXNDLEVBQUUsT0FBTyxFQUFFLDhDQUFzQyxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1Q0FBdUMsRUFBRSw0RkFBNEYsQ0FBQyxDQUFDLENBQUM7SUFDcmIsTUFBTSx3Q0FBd0MsR0FBRyxJQUFBLDZCQUFhLEVBQUMsaURBQWlELEVBQUUsRUFBRSxJQUFJLEVBQUUsOEJBQThCLEVBQUUsS0FBSyxFQUFFLDhCQUE4QixFQUFFLE1BQU0sRUFBRSw4QkFBOEIsRUFBRSxPQUFPLEVBQUUsOEJBQThCLEVBQUUsRUFBRSxH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