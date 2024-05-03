/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/themables", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry"], function (require, exports, codicons_1, themables_1, textModel_1, nls_1, colorRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.diffDeleteDecorationEmpty = exports.diffWholeLineDeleteDecoration = exports.diffDeleteDecoration = exports.diffAddDecorationEmpty = exports.diffWholeLineAddDecoration = exports.diffAddDecoration = exports.diffLineDeleteDecorationBackground = exports.diffLineAddDecorationBackground = exports.diffLineDeleteDecorationBackgroundWithIndicator = exports.diffLineAddDecorationBackgroundWithIndicator = exports.diffRemoveIcon = exports.diffInsertIcon = exports.diffEditorUnchangedRegionShadow = exports.diffMoveBorderActive = exports.diffMoveBorder = void 0;
    exports.diffMoveBorder = (0, colorRegistry_1.registerColor)('diffEditor.move.border', { dark: '#8b8b8b9c', light: '#8b8b8b9c', hcDark: '#8b8b8b9c', hcLight: '#8b8b8b9c', }, (0, nls_1.localize)('diffEditor.move.border', 'The border color for text that got moved in the diff editor.'));
    exports.diffMoveBorderActive = (0, colorRegistry_1.registerColor)('diffEditor.moveActive.border', { dark: '#FFA500', light: '#FFA500', hcDark: '#FFA500', hcLight: '#FFA500', }, (0, nls_1.localize)('diffEditor.moveActive.border', 'The active border color for text that got moved in the diff editor.'));
    exports.diffEditorUnchangedRegionShadow = (0, colorRegistry_1.registerColor)('diffEditor.unchangedRegionShadow', { dark: '#000000', light: '#737373BF', hcDark: '#000000', hcLight: '#737373BF', }, (0, nls_1.localize)('diffEditor.unchangedRegionShadow', 'The color of the shadow around unchanged region widgets.'));
    exports.diffInsertIcon = (0, iconRegistry_1.registerIcon)('diff-insert', codicons_1.Codicon.add, (0, nls_1.localize)('diffInsertIcon', 'Line decoration for inserts in the diff editor.'));
    exports.diffRemoveIcon = (0, iconRegistry_1.registerIcon)('diff-remove', codicons_1.Codicon.remove, (0, nls_1.localize)('diffRemoveIcon', 'Line decoration for removals in the diff editor.'));
    exports.diffLineAddDecorationBackgroundWithIndicator = textModel_1.ModelDecorationOptions.register({
        className: 'line-insert',
        description: 'line-insert',
        isWholeLine: true,
        linesDecorationsClassName: 'insert-sign ' + themables_1.ThemeIcon.asClassName(exports.diffInsertIcon),
        marginClassName: 'gutter-insert',
    });
    exports.diffLineDeleteDecorationBackgroundWithIndicator = textModel_1.ModelDecorationOptions.register({
        className: 'line-delete',
        description: 'line-delete',
        isWholeLine: true,
        linesDecorationsClassName: 'delete-sign ' + themables_1.ThemeIcon.asClassName(exports.diffRemoveIcon),
        marginClassName: 'gutter-delete',
    });
    exports.diffLineAddDecorationBackground = textModel_1.ModelDecorationOptions.register({
        className: 'line-insert',
        description: 'line-insert',
        isWholeLine: true,
        marginClassName: 'gutter-insert',
    });
    exports.diffLineDeleteDecorationBackground = textModel_1.ModelDecorationOptions.register({
        className: 'line-delete',
        description: 'line-delete',
        isWholeLine: true,
        marginClassName: 'gutter-delete',
    });
    exports.diffAddDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-insert',
        description: 'char-insert',
        shouldFillLineOnLineBreak: true,
    });
    exports.diffWholeLineAddDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-insert',
        description: 'char-insert',
        isWholeLine: true,
    });
    exports.diffAddDecorationEmpty = textModel_1.ModelDecorationOptions.register({
        className: 'char-insert diff-range-empty',
        description: 'char-insert diff-range-empty',
    });
    exports.diffDeleteDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-delete',
        description: 'char-delete',
        shouldFillLineOnLineBreak: true,
    });
    exports.diffWholeLineDeleteDecoration = textModel_1.ModelDecorationOptions.register({
        className: 'char-delete',
        description: 'char-delete',
        isWholeLine: true,
    });
    exports.diffDeleteDecorationEmpty = textModel_1.ModelDecorationOptions.register({
        className: 'char-delete diff-range-empty',
        description: 'char-delete diff-range-empty',
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cmF0aW9ucy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL3JlZ2lzdHJhdGlvbnMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNuRixRQUFBLGNBQWMsR0FBRyxJQUFBLDZCQUFhLEVBQzFDLHdCQUF3QixFQUN4QixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxXQUFXLEdBQUcsRUFDckYsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsOERBQThELENBQUMsQ0FDbEcsQ0FBQztJQUVXLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSw2QkFBYSxFQUNoRCw4QkFBOEIsRUFDOUIsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxHQUFHLEVBQzdFLElBQUEsY0FBUSxFQUFDLDhCQUE4QixFQUFFLHFFQUFxRSxDQUFDLENBQy9HLENBQUM7SUFFVyxRQUFBLCtCQUErQixHQUFHLElBQUEsNkJBQWEsRUFDM0Qsa0NBQWtDLEVBQ2xDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFdBQVcsR0FBRyxFQUNqRixJQUFBLGNBQVEsRUFBQyxrQ0FBa0MsRUFBRSwwREFBMEQsQ0FBQyxDQUN4RyxDQUFDO0lBRVcsUUFBQSxjQUFjLEdBQUcsSUFBQSwyQkFBWSxFQUFDLGFBQWEsRUFBRSxrQkFBTyxDQUFDLEdBQUcsRUFBRSxJQUFBLGNBQVEs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