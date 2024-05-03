/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables"], function (require, exports, codicons_1, textModel_1, nls_1, colorRegistry_1, iconRegistry_1, themeService_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingDecorationProvider = exports.foldingManualExpandedIcon = exports.foldingManualCollapsedIcon = exports.foldingCollapsedIcon = exports.foldingExpandedIcon = void 0;
    const foldBackground = (0, colorRegistry_1.registerColor)('editor.foldBackground', { light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorSelectionBackground, 0.3), dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorSelectionBackground, 0.3), hcDark: null, hcLight: null }, (0, nls_1.localize)('foldBackgroundBackground', "Background color behind folded ranges. The color must not be opaque so as not to hide underlying decorations."), true);
    (0, colorRegistry_1.registerColor)('editorGutter.foldingControlForeground', { dark: colorRegistry_1.iconForeground, light: colorRegistry_1.iconForeground, hcDark: colorRegistry_1.iconForeground, hcLight: colorRegistry_1.iconForeground }, (0, nls_1.localize)('editorGutter.foldingControlForeground', 'Color of the folding control in the editor gutter.'));
    exports.foldingExpandedIcon = (0, iconRegistry_1.registerIcon)('folding-expanded', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('foldingExpandedIcon', 'Icon for expanded ranges in the editor glyph margin.'));
    exports.foldingCollapsedIcon = (0, iconRegistry_1.registerIcon)('folding-collapsed', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('foldingCollapsedIcon', 'Icon for collapsed ranges in the editor glyph margin.'));
    exports.foldingManualCollapsedIcon = (0, iconRegistry_1.registerIcon)('folding-manual-collapsed', exports.foldingCollapsedIcon, (0, nls_1.localize)('foldingManualCollapedIcon', 'Icon for manually collapsed ranges in the editor glyph margin.'));
    exports.foldingManualExpandedIcon = (0, iconRegistry_1.registerIcon)('folding-manual-expanded', exports.foldingExpandedIcon, (0, nls_1.localize)('foldingManualExpandedIcon', 'Icon for manually expanded ranges in the editor glyph margin.'));
    const foldedBackgroundMinimap = { color: (0, themeService_1.themeColorFromId)(foldBackground), position: 1 /* MinimapPosition.Inline */ };
    const collapsed = (0, nls_1.localize)('linesCollapsed', "Click to expand the range.");
    const expanded = (0, nls_1.localize)('linesExpanded', "Click to collapse the range.");
    class FoldingDecorationProvider {
        static { this.COLLAPSED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-collapsed-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingCollapsedIcon),
        }); }
        static { this.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-collapsed-highlighted-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            className: 'folded-background',
            minimap: foldedBackgroundMinimap,
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingCollapsedIcon)
        }); }
        static { this.MANUALLY_COLLAPSED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-collapsed-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingManualCollapsedIcon)
        }); }
        static { this.MANUALLY_COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-collapsed-highlighted-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            className: 'folded-background',
            minimap: foldedBackgroundMinimap,
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingManualCollapsedIcon)
        }); }
        static { this.NO_CONTROLS_COLLAPSED_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-no-controls-range-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
        }); }
        static { this.NO_CONTROLS_COLLAPSED_HIGHLIGHTED_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-no-controls-range-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            afterContentClassName: 'inline-folded',
            className: 'folded-background',
            minimap: foldedBackgroundMinimap,
            isWholeLine: true,
            linesDecorationsTooltip: collapsed,
        }); }
        static { this.EXPANDED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-expanded-visual-decoration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: 'alwaysShowFoldIcons ' + themables_1.ThemeIcon.asClassName(exports.foldingExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.EXPANDED_AUTO_HIDE_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-expanded-auto-hide-visual-decoration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.MANUALLY_EXPANDED_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-expanded-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: 'alwaysShowFoldIcons ' + themables_1.ThemeIcon.asClassName(exports.foldingManualExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.MANUALLY_EXPANDED_AUTO_HIDE_VISUAL_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-manually-expanded-auto-hide-visual-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            isWholeLine: true,
            firstLineDecorationClassName: themables_1.ThemeIcon.asClassName(exports.foldingManualExpandedIcon),
            linesDecorationsTooltip: expanded,
        }); }
        static { this.NO_CONTROLS_EXPANDED_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-no-controls-range-decoration',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            isWholeLine: true
        }); }
        static { this.HIDDEN_RANGE_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'folding-hidden-range-decoration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
        }); }
        constructor(editor) {
            this.editor = editor;
            this.showFoldingControls = 'mouseover';
            this.showFoldingHighlights = true;
        }
        getDecorationOption(isCollapsed, isHidden, isManual) {
            if (isHidden) { // is inside another collapsed region
                return FoldingDecorationProvider.HIDDEN_RANGE_DECORATION;
            }
            if (this.showFoldingControls === 'never') {
                if (isCollapsed) {
                    return this.showFoldingHighlights ? FoldingDecorationProvider.NO_CONTROLS_COLLAPSED_HIGHLIGHTED_RANGE_DECORATION : FoldingDecorationProvider.NO_CONTROLS_COLLAPSED_RANGE_DECORATION;
                }
                return FoldingDecorationProvider.NO_CONTROLS_EXPANDED_RANGE_DECORATION;
            }
            if (isCollapsed) {
                return isManual ?
                    (this.showFoldingHighlights ? FoldingDecorationProvider.MANUALLY_COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION : FoldingDecorationProvider.MANUALLY_COLLAPSED_VISUAL_DECORATION)
                    : (this.showFoldingHighlights ? FoldingDecorationProvider.COLLAPSED_HIGHLIGHTED_VISUAL_DECORATION : FoldingDecorationProvider.COLLAPSED_VISUAL_DECORATION);
            }
            else if (this.showFoldingControls === 'mouseover') {
                return isManual ? FoldingDecorationProvider.MANUALLY_EXPANDED_AUTO_HIDE_VISUAL_DECORATION : FoldingDecorationProvider.EXPANDED_AUTO_HIDE_VISUAL_DECORATION;
            }
            else {
                return isManual ? FoldingDecorationProvider.MANUALLY_EXPANDED_VISUAL_DECORATION : FoldingDecorationProvider.EXPANDED_VISUAL_DECORATION;
            }
        }
        changeDecorations(callback) {
            return this.editor.changeDecorations(callback);
        }
        removeDecorations(decorationIds) {
            this.editor.removeDecorations(decorationIds);
        }
    }
    exports.FoldingDecorationProvider = FoldingDecorationProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ0RlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb2xkaW5nL2Jyb3dzZXIvZm9sZGluZ0RlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFNLGNBQWMsR0FBRyxJQUFBLDZCQUFhLEVBQUMsdUJBQXVCLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBQSwyQkFBVyxFQUFDLHlDQUF5QixFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFBLDJCQUFXLEVBQUMseUNBQXlCLEVBQUUsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsK0dBQStHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuVyxJQUFBLDZCQUFhLEVBQUMsdUNBQXVDLEVBQUUsRUFBRSxJQUFJLEVBQUUsOEJBQWMsRUFBRSxLQUFLLEVBQUUsOEJBQWMsRUFBRSxNQUFNLEVBQUUsOEJBQWMsRUFBRSxPQUFPLEVBQUUsOEJBQWMsRUFBRSxFQUFFLElBQUEsY0FBUSxFQUFDLHVDQUF1QyxFQUFFLG9EQUFvRCxDQUFDLENBQUMsQ0FBQztJQUVyUCxRQUFBLG1CQUFtQixHQUFHLElBQUEsMkJBQVksRUFBQyxrQkFBa0IsRUFBRSxrQkFBTyxDQUFDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxzREFBc0QsQ0FBQyxDQUFDLENBQUM7SUFDckssUUFBQSxvQkFBb0IsR0FBRyxJQUFBLDJCQUFZLEVBQUMsbUJBQW1CLEVBQUUsa0JBQU8sQ0FBQyxZQUFZLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsdURBQXVELENBQUMs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