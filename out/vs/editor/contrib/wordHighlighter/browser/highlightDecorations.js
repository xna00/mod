/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/languages", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./highlightDecorations"], function (require, exports, model_1, textModel_1, languages_1, nls, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getHighlightDecorationOptions = getHighlightDecorationOptions;
    exports.getSelectionHighlightDecorationOptions = getSelectionHighlightDecorationOptions;
    const wordHighlightBackground = (0, colorRegistry_1.registerColor)('editor.wordHighlightBackground', { dark: '#575757B8', light: '#57575740', hcDark: null, hcLight: null }, nls.localize('wordHighlight', 'Background color of a symbol during read-access, like reading a variable. The color must not be opaque so as not to hide underlying decorations.'), true);
    (0, colorRegistry_1.registerColor)('editor.wordHighlightStrongBackground', { dark: '#004972B8', light: '#0e639c40', hcDark: null, hcLight: null }, nls.localize('wordHighlightStrong', 'Background color of a symbol during write-access, like writing to a variable. The color must not be opaque so as not to hide underlying decorations.'), true);
    (0, colorRegistry_1.registerColor)('editor.wordHighlightTextBackground', { light: wordHighlightBackground, dark: wordHighlightBackground, hcDark: wordHighlightBackground, hcLight: wordHighlightBackground }, nls.localize('wordHighlightText', 'Background color of a textual occurrence for a symbol. The color must not be opaque so as not to hide underlying decorations.'), true);
    const wordHighlightBorder = (0, colorRegistry_1.registerColor)('editor.wordHighlightBorder', { light: null, dark: null, hcDark: colorRegistry_1.activeContrastBorder, hcLight: colorRegistry_1.activeContrastBorder }, nls.localize('wordHighlightBorder', 'Border color of a symbol during read-access, like reading a variable.'));
    (0, colorRegistry_1.registerColor)('editor.wordHighlightStrongBorder', { light: null, dark: null, hcDark: colorRegistry_1.activeContrastBorder, hcLight: colorRegistry_1.activeContrastBorder }, nls.localize('wordHighlightStrongBorder', 'Border color of a symbol during write-access, like writing to a variable.'));
    (0, colorRegistry_1.registerColor)('editor.wordHighlightTextBorder', { light: wordHighlightBorder, dark: wordHighlightBorder, hcDark: wordHighlightBorder, hcLight: wordHighlightBorder }, nls.localize('wordHighlightTextBorder', "Border color of a textual occurrence for a symbol."));
    const overviewRulerWordHighlightForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.wordHighlightForeground', { dark: '#A0A0A0CC', light: '#A0A0A0CC', hcDark: '#A0A0A0CC', hcLight: '#A0A0A0CC' }, nls.localize('overviewRulerWordHighlightForeground', 'Overview ruler marker color for symbol highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
    const overviewRulerWordHighlightStrongForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.wordHighlightStrongForeground', { dark: '#C0A0C0CC', light: '#C0A0C0CC', hcDark: '#C0A0C0CC', hcLight: '#C0A0C0CC' }, nls.localize('overviewRulerWordHighlightStrongForeground', 'Overview ruler marker color for write-access symbol highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
    const overviewRulerWordHighlightTextForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.wordHighlightTextForeground', { dark: colorRegistry_1.overviewRulerSelectionHighlightForeground, light: colorRegistry_1.overviewRulerSelectionHighlightForeground, hcDark: colorRegistry_1.overviewRulerSelectionHighlightForeground, hcLight: colorRegistry_1.overviewRulerSelectionHighlightForeground }, nls.localize('overviewRulerWordHighlightTextForeground', 'Overview ruler marker color of a textual occurrence for a symbol. The color must not be opaque so as not to hide underlying decorations.'), true);
    const _WRITE_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'word-highlight-strong',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'wordHighlightStrong',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(overviewRulerWordHighlightStrongForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    const _TEXT_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'word-highlight-text',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'wordHighlightText',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(overviewRulerWordHighlightTextForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    const _SELECTION_HIGHLIGHT_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'selection-highlight-overview',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'selectionHighlight',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerSelectionHighlightForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    const _SELECTION_HIGHLIGHT_OPTIONS_NO_OVERVIEW = textModel_1.ModelDecorationOptions.register({
        description: 'selection-highlight',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'selectionHighlight',
    });
    const _REGULAR_OPTIONS = textModel_1.ModelDecorationOptions.register({
        description: 'word-highlight',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'wordHighlight',
        overviewRuler: {
            color: (0, themeService_1.themeColorFromId)(overviewRulerWordHighlightForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapSelectionOccurrenceHighlight),
            position: 1 /* MinimapPosition.Inline */
        },
    });
    function getHighlightDecorationOptions(kind) {
        if (kind === languages_1.DocumentHighlightKind.Write) {
            return _WRITE_OPTIONS;
        }
        else if (kind === languages_1.DocumentHighlightKind.Text) {
            return _TEXT_OPTIONS;
        }
        else {
            return _REGULAR_OPTIONS;
        }
    }
    function getSelectionHighlightDecorationOptions(hasSemanticHighlights) {
        // Show in overviewRuler only if model has no semantic highlighting
        return (hasSemanticHighlights ? _SELECTION_HIGHLIGHT_OPTIONS_NO_OVERVIEW : _SELECTION_HIGHLIGHT_OPTIONS);
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const selectionHighlight = theme.getColor(colorRegistry_1.editorSelectionHighlight);
        if (selectionHighlight) {
            collector.addRule(`.monaco-editor .selectionHighlight { background-color: ${selectionHighlight.transparent(0.5)}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGxpZ2h0RGVjb3JhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3dvcmRIaWdobGlnaHRlci9icm93c2VyL2hpZ2hsaWdodERlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0ZoRyxzRUFRQztJQUVELHdGQUdDO0lBckZELE1BQU0sdUJBQXVCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLGdDQUFnQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLGtKQUFrSixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDalYsSUFBQSw2QkFBYSxFQUFDLHNDQUFzQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsc0pBQXNKLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNqVSxJQUFBLDZCQUFhLEVBQUMsb0NBQW9DLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLHVCQUF1QixFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLCtIQUErSCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcFcsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsNEJBQTRCLEVBQUUs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