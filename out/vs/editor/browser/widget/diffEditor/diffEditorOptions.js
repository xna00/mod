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
define(["require", "exports", "vs/base/common/observable", "vs/editor/common/config/diffEditor", "vs/editor/common/config/editorOptions", "vs/platform/accessibility/common/accessibility"], function (require, exports, observable_1, diffEditor_1, editorOptions_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorOptions = void 0;
    let DiffEditorOptions = class DiffEditorOptions {
        get editorOptions() { return this._options; }
        constructor(options, _accessibilityService) {
            this._accessibilityService = _accessibilityService;
            this._diffEditorWidth = (0, observable_1.observableValue)(this, 0);
            this._screenReaderMode = (0, observable_1.observableFromEvent)(this._accessibilityService.onDidChangeScreenReaderOptimized, () => this._accessibilityService.isScreenReaderOptimized());
            this.couldShowInlineViewBecauseOfSize = (0, observable_1.derived)(this, reader => this._options.read(reader).renderSideBySide && this._diffEditorWidth.read(reader) <= this._options.read(reader).renderSideBySideInlineBreakpoint);
            this.renderOverviewRuler = (0, observable_1.derived)(this, reader => this._options.read(reader).renderOverviewRuler);
            this.renderSideBySide = (0, observable_1.derived)(this, reader => this._options.read(reader).renderSideBySide
                && !(this._options.read(reader).useInlineViewWhenSpaceIsLimited && this.couldShowInlineViewBecauseOfSize.read(reader) && !this._screenReaderMode.read(reader)));
            this.readOnly = (0, observable_1.derived)(this, reader => this._options.read(reader).readOnly);
            this.shouldRenderOldRevertArrows = (0, observable_1.derived)(this, reader => {
                if (!this._options.read(reader).renderMarginRevertIcon) {
                    return false;
                }
                if (!this.renderSideBySide.read(reader)) {
                    return false;
                }
                if (this.readOnly.read(reader)) {
                    return false;
                }
                if (this.shouldRenderGutterMenu.read(reader)) {
                    return false;
                }
                return true;
            });
            this.shouldRenderGutterMenu = (0, observable_1.derived)(this, reader => this._options.read(reader).renderGutterMenu);
            this.renderIndicators = (0, observable_1.derived)(this, reader => this._options.read(reader).renderIndicators);
            this.enableSplitViewResizing = (0, observable_1.derived)(this, reader => this._options.read(reader).enableSplitViewResizing);
            this.splitViewDefaultRatio = (0, observable_1.derived)(this, reader => this._options.read(reader).splitViewDefaultRatio);
            this.ignoreTrimWhitespace = (0, observable_1.derived)(this, reader => this._options.read(reader).ignoreTrimWhitespace);
            this.maxComputationTimeMs = (0, observable_1.derived)(this, reader => this._options.read(reader).maxComputationTime);
            this.showMoves = (0, observable_1.derived)(this, reader => this._options.read(reader).experimental.showMoves && this.renderSideBySide.read(reader));
            this.isInEmbeddedEditor = (0, observable_1.derived)(this, reader => this._options.read(reader).isInEmbeddedEditor);
            this.diffWordWrap = (0, observable_1.derived)(this, reader => this._options.read(reader).diffWordWrap);
            this.originalEditable = (0, observable_1.derived)(this, reader => this._options.read(reader).originalEditable);
            this.diffCodeLens = (0, observable_1.derived)(this, reader => this._options.read(reader).diffCodeLens);
            this.accessibilityVerbose = (0, observable_1.derived)(this, reader => this._options.read(reader).accessibilityVerbose);
            this.diffAlgorithm = (0, observable_1.derived)(this, reader => this._options.read(reader).diffAlgorithm);
            this.showEmptyDecorations = (0, observable_1.derived)(this, reader => this._options.read(reader).experimental.showEmptyDecorations);
            this.onlyShowAccessibleDiffViewer = (0, observable_1.derived)(this, reader => this._options.read(reader).onlyShowAccessibleDiffViewer);
            this.hideUnchangedRegions = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.enabled);
            this.hideUnchangedRegionsRevealLineCount = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.revealLineCount);
            this.hideUnchangedRegionsContextLineCount = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.contextLineCount);
            this.hideUnchangedRegionsMinimumLineCount = (0, observable_1.derived)(this, reader => this._options.read(reader).hideUnchangedRegions.minimumLineCount);
            const optionsCopy = { ...options, ...validateDiffEditorOptions(options, diffEditor_1.diffEditorDefaultOptions) };
            this._options = (0, observable_1.observableValue)(this, optionsCopy);
        }
        updateOptions(changedOptions) {
            const newDiffEditorOptions = validateDiffEditorOptions(changedOptions, this._options.get());
            const newOptions = { ...this._options.get(), ...changedOptions, ...newDiffEditorOptions };
            this._options.set(newOptions, undefined, { changedOptions: changedOptions });
        }
        setWidth(width) {
            this._diffEditorWidth.set(width, undefined);
        }
    };
    exports.DiffEditorOptions = DiffEditorOptions;
    exports.DiffEditorOptions = DiffEditorOptions = __decorate([
        __param(1, accessibility_1.IAccessibilityService)
    ], DiffEditorOptions);
    function validateDiffEditorOptions(options, defaults) {
        return {
            enableSplitViewResizing: (0, editorOptions_1.boolean)(options.enableSplitViewResizing, defaults.enableSplitViewResizing),
            splitViewDefaultRatio: (0, editorOptions_1.clampedFloat)(options.splitViewDefaultRatio, 0.5, 0.1, 0.9),
            renderSideBySide: (0, editorOptions_1.boolean)(options.renderSideBySide, defaults.renderSideBySide),
            renderMarginRevertIcon: (0, editorOptions_1.boolean)(options.renderMarginRevertIcon, defaults.renderMarginRevertIcon),
            maxComputationTime: (0, editorOptions_1.clampedInt)(options.maxComputationTime, defaults.maxComputationTime, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            maxFileSize: (0, editorOptions_1.clampedInt)(options.maxFileSize, defaults.maxFileSize, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            ignoreTrimWhitespace: (0, editorOptions_1.boolean)(options.ignoreTrimWhitespace, defaults.ignoreTrimWhitespace),
            renderIndicators: (0, editorOptions_1.boolean)(options.renderIndicators, defaults.renderIndicators),
            originalEditable: (0, editorOptions_1.boolean)(options.originalEditable, defaults.originalEditable),
            diffCodeLens: (0, editorOptions_1.boolean)(options.diffCodeLens, defaults.diffCodeLens),
            renderOverviewRuler: (0, editorOptions_1.boolean)(options.renderOverviewRuler, defaults.renderOverviewRuler),
            diffWordWrap: (0, editorOptions_1.stringSet)(options.diffWordWrap, defaults.diffWordWrap, ['off', 'on', 'inherit']),
            diffAlgorithm: (0, editorOptions_1.stringSet)(options.diffAlgorithm, defaults.diffAlgorithm, ['legacy', 'advanced'], { 'smart': 'legacy', 'experimental': 'advanced' }),
            accessibilityVerbose: (0, editorOptions_1.boolean)(options.accessibilityVerbose, defaults.accessibilityVerbose),
            experimental: {
                showMoves: (0, editorOptions_1.boolean)(options.experimental?.showMoves, defaults.experimental.showMoves),
                showEmptyDecorations: (0, editorOptions_1.boolean)(options.experimental?.showEmptyDecorations, defaults.experimental.showEmptyDecorations),
            },
            hideUnchangedRegions: {
                enabled: (0, editorOptions_1.boolean)(options.hideUnchangedRegions?.enabled ?? options.experimental?.collapseUnchangedRegions, defaults.hideUnchangedRegions.enabled),
                contextLineCount: (0, editorOptions_1.clampedInt)(options.hideUnchangedRegions?.contextLineCount, defaults.hideUnchangedRegions.contextLineCount, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                minimumLineCount: (0, editorOptions_1.clampedInt)(options.hideUnchangedRegions?.minimumLineCount, defaults.hideUnchangedRegions.minimumLineCount, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                revealLineCount: (0, editorOptions_1.clampedInt)(options.hideUnchangedRegions?.revealLineCount, defaults.hideUnchangedRegions.revealLineCount, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            },
            isInEmbeddedEditor: (0, editorOptions_1.boolean)(options.isInEmbeddedEditor, defaults.isInEmbeddedEditor),
            onlyShowAccessibleDiffViewer: (0, editorOptions_1.boolean)(options.onlyShowAccessibleDiffViewer, defaults.onlyShowAccessibleDiffViewer),
            renderSideBySideInlineBreakpoint: (0, editorOptions_1.clampedInt)(options.renderSideBySideInlineBreakpoint, defaults.renderSideBySideInlineBreakpoint, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            useInlineViewWhenSpaceIsLimited: (0, editorOptions_1.boolean)(options.useInlineViewWhenSpaceIsLimited, defaults.useInlineViewWhenSpaceIsLimited),
            renderGutterMenu: (0, editorOptions_1.boolean)(options.renderGutterMenu, defaults.renderGutterMenu),
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvck9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2RpZmZFZGl0b3JPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtRQUc3QixJQUFXLGFBQWEsS0FBc0UsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQU1ySCxZQUNDLE9BQXFDLEVBQ2QscUJBQTZEO1lBQTVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFOcEUscUJBQWdCLEdBQUcsSUFBQSw0QkFBZSxFQUFTLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVwRCxzQkFBaUIsR0FBRyxJQUFBLGdDQUFtQixFQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBVWxLLHFDQUFnQyxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FDekUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQ0FBZ0MsQ0FDaEosQ0FBQztZQUVjLHdCQUFtQixHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FB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