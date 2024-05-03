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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker"], function (require, exports, async_1, lifecycle_1, editorExtensions_1, languageConfigurationRegistry_1, textModel_1, editorWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SectionHeaderDetector = void 0;
    let SectionHeaderDetector = class SectionHeaderDetector extends lifecycle_1.Disposable {
        static { this.ID = 'editor.sectionHeaderDetector'; }
        constructor(editor, languageConfigurationService, editorWorkerService) {
            super();
            this.editor = editor;
            this.languageConfigurationService = languageConfigurationService;
            this.editorWorkerService = editorWorkerService;
            this.decorations = this.editor.createDecorationsCollection();
            this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
            this.computePromise = null;
            this.currentOccurrences = {};
            this._register(editor.onDidChangeModel((e) => {
                this.currentOccurrences = {};
                this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                this.stop();
                this.computeSectionHeaders.schedule(0);
            }));
            this._register(editor.onDidChangeModelLanguage((e) => {
                this.currentOccurrences = {};
                this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                this.stop();
                this.computeSectionHeaders.schedule(0);
            }));
            this._register(languageConfigurationService.onDidChange((e) => {
                const editorLanguageId = this.editor.getModel()?.getLanguageId();
                if (editorLanguageId && e.affects(editorLanguageId)) {
                    this.currentOccurrences = {};
                    this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                    this.stop();
                    this.computeSectionHeaders.schedule(0);
                }
            }));
            this._register(editor.onDidChangeConfiguration(e => {
                if (this.options && !e.hasChanged(73 /* EditorOption.minimap */)) {
                    return;
                }
                this.options = this.createOptions(editor.getOption(73 /* EditorOption.minimap */));
                // Remove any links (for the getting disabled case)
                this.updateDecorations([]);
                // Stop any computation (for the getting disabled case)
                this.stop();
                // Start computing (for the getting enabled case)
                this.computeSectionHeaders.schedule(0);
            }));
            this._register(this.editor.onDidChangeModelContent(e => {
                this.computeSectionHeaders.schedule();
            }));
            this.computeSectionHeaders = this._register(new async_1.RunOnceScheduler(() => {
                this.findSectionHeaders();
            }, 250));
            this.computeSectionHeaders.schedule(0);
        }
        createOptions(minimap) {
            if (!minimap || !this.editor.hasModel()) {
                return undefined;
            }
            const languageId = this.editor.getModel().getLanguageId();
            if (!languageId) {
                return undefined;
            }
            const commentsConfiguration = this.languageConfigurationService.getLanguageConfiguration(languageId).comments;
            const foldingRules = this.languageConfigurationService.getLanguageConfiguration(languageId).foldingRules;
            if (!commentsConfiguration && !foldingRules?.markers) {
                return undefined;
            }
            return {
                foldingRules,
                findMarkSectionHeaders: minimap.showMarkSectionHeaders,
                findRegionSectionHeaders: minimap.showRegionSectionHeaders,
            };
        }
        findSectionHeaders() {
            if (!this.editor.hasModel()
                || (!this.options?.findMarkSectionHeaders && !this.options?.findRegionSectionHeaders)) {
                return;
            }
            const model = this.editor.getModel();
            if (model.isDisposed() || model.isTooLargeForSyncing()) {
                return;
            }
            const modelVersionId = model.getVersionId();
            this.editorWorkerService.findSectionHeaders(model.uri, this.options)
                .then((sectionHeaders) => {
                if (model.isDisposed() || model.getVersionId() !== modelVersionId) {
                    // model changed in the meantime
                    return;
                }
                this.updateDecorations(sectionHeaders);
            });
        }
        updateDecorations(sectionHeaders) {
            const model = this.editor.getModel();
            if (model) {
                // Remove all section headers that should be in comments and are not in comments
                sectionHeaders = sectionHeaders.filter((sectionHeader) => {
                    if (!sectionHeader.shouldBeInComments) {
                        return true;
                    }
                    const validRange = model.validateRange(sectionHeader.range);
                    const tokens = model.tokenization.getLineTokens(validRange.startLineNumber);
                    const idx = tokens.findTokenIndexAtOffset(validRange.startColumn - 1);
                    const tokenType = tokens.getStandardTokenType(idx);
                    const languageId = tokens.getLanguageId(idx);
                    return (languageId === model.getLanguageId() && tokenType === 1 /* StandardTokenType.Comment */);
                });
            }
            const oldDecorations = Object.values(this.currentOccurrences).map(occurrence => occurrence.decorationId);
            const newDecorations = sectionHeaders.map(sectionHeader => decoration(sectionHeader));
            this.editor.changeDecorations((changeAccessor) => {
                const decorations = changeAccessor.deltaDecorations(oldDecorations, newDecorations);
                this.currentOccurrences = {};
                for (let i = 0, len = decorations.length; i < len; i++) {
                    const occurrence = { sectionHeader: sectionHeaders[i], decorationId: decorations[i] };
                    this.currentOccurrences[occurrence.decorationId] = occurrence;
                }
            });
        }
        stop() {
            this.computeSectionHeaders.cancel();
            if (this.computePromise) {
                this.computePromise.cancel();
                this.computePromise = null;
            }
        }
        dispose() {
            super.dispose();
            this.stop();
            this.decorations.clear();
        }
    };
    exports.SectionHeaderDetector = SectionHeaderDetector;
    exports.SectionHeaderDetector = SectionHeaderDetector = __decorate([
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(2, editorWorker_1.IEditorWorkerService)
    ], SectionHeaderDetector);
    function decoration(sectionHeader) {
        return {
            range: sectionHeader.range,
            options: textModel_1.ModelDecorationOptions.createDynamic({
                description: 'section-header',
                stickiness: 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */,
                collapseOnReplaceEdit: true,
                minimap: {
                    color: undefined,
                    position: 1 /* MinimapPosition.Inline */,
                    sectionHeaderStyle: sectionHeader.hasSeparatorLine ? 2 /* MinimapSectionHeaderStyle.Underlined */ : 1 /* MinimapSectionHeaderStyle.Normal */,
                    sectionHeaderText: sectionHeader.text,
                },
            })
        };
    }
    (0, editorExtensions_1.registerEditorContribution)(SectionHeaderDetector.ID, SectionHeaderDetector, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdGlvbkhlYWRlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NlY3Rpb25IZWFkZXJzL2Jyb3dzZXIvc2VjdGlvbkhlYWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7aUJBRTdCLE9BQUUsR0FBVyw4QkFBOEIsQUFBekMsQ0FBMEM7UUFRbkUsWUFDa0IsTUFBbUIsRUFDTCw0QkFBNEUsRUFDckYsbUJBQTBEO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBSlMsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNZLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFDcEUsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQVJ6RSxnQkFBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQVkvRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLFNBQVMsK0JBQXNCLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUMzQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO1lBRTdCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUywrQkFBc0IsQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1os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