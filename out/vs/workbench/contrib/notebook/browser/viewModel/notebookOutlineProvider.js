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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineEntryFactory"], function (require, exports, event_1, lifecycle_1, resources_1, configuration_1, markers_1, themeService_1, notebookCommon_1, notebookExecutionStateService_1, outlineModel_1, notebookOutlineEntryFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellOutlineProvider = void 0;
    let NotebookCellOutlineProvider = class NotebookCellOutlineProvider {
        get entries() {
            return this._entries;
        }
        get activeElement() {
            return this._activeEntry;
        }
        constructor(_editor, _target, themeService, notebookExecutionStateService, _outlineModelService, _markerService, _configurationService) {
            this._editor = _editor;
            this._target = _target;
            this._outlineModelService = _outlineModelService;
            this._markerService = _markerService;
            this._configurationService = _configurationService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._entries = [];
            this._entriesDisposables = new lifecycle_1.DisposableStore();
            this.outlineKind = 'notebookCells';
            this._outlineEntryFactory = new notebookOutlineEntryFactory_1.NotebookOutlineEntryFactory(notebookExecutionStateService);
            const selectionListener = new lifecycle_1.MutableDisposable();
            this._dispoables.add(selectionListener);
            selectionListener.value = (0, lifecycle_1.combinedDisposable)(event_1.Event.debounce(_editor.onDidChangeSelection, (last, _current) => last, 200)(this._recomputeActive, this), event_1.Event.debounce(_editor.onDidChangeViewCells, (last, _current) => last ?? _current, 200)(this._recomputeState, this));
            this._dispoables.add(_configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly) ||
                    e.affectsConfiguration(notebookCommon_1.NotebookSetting.outlineShowCodeCells) ||
                    e.affectsConfiguration(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols) ||
                    e.affectsConfiguration(notebookCommon_1.NotebookSetting.breadcrumbsShowCodeCells)) {
                    this._recomputeState();
                }
            }));
            this._dispoables.add(themeService.onDidFileIconThemeChange(() => {
                this._onDidChange.fire({});
            }));
            this._dispoables.add(notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && !!this._editor.textModel && e.affectsNotebook(this._editor.textModel?.uri)) {
                    this._recomputeState();
                }
            }));
            this._recomputeState();
        }
        dispose() {
            this._entries.length = 0;
            this._activeEntry = undefined;
            this._entriesDisposables.dispose();
            this._dispoables.dispose();
        }
        init() {
            this._recomputeState();
        }
        async setFullSymbols(cancelToken) {
            const notebookEditorWidget = this._editor;
            const notebookCells = notebookEditorWidget?.getViewModel()?.viewCells.filter((cell) => cell.cellKind === notebookCommon_1.CellKind.Code);
            this._entries.length = 0;
            if (notebookCells) {
                const promises = [];
                // limit the number of cells so that we don't resolve an excessive amount of text models
                for (const cell of notebookCells.slice(0, 100)) {
                    // gather all symbols asynchronously
                    promises.push(this._outlineEntryFactory.cacheSymbols(cell, this._outlineModelService, cancelToken));
                }
                await Promise.allSettled(promises);
            }
            this._recomputeState();
        }
        _recomputeState() {
            this._entriesDisposables.clear();
            this._activeEntry = undefined;
            this._uri = undefined;
            if (!this._editor.hasModel()) {
                return;
            }
            this._uri = this._editor.textModel.uri;
            const notebookEditorWidget = this._editor;
            if (notebookEditorWidget.getLength() === 0) {
                return;
            }
            let includeCodeCells = true;
            if (this._target === 2 /* OutlineTarget.Breadcrumbs */) {
                includeCodeCells = this._configurationService.getValue('notebook.breadcrumbs.showCodeCells');
            }
            let notebookCells;
            if (this._target === 2 /* OutlineTarget.Breadcrumbs */) {
                notebookCells = notebookEditorWidget.getViewModel().viewCells.filter((cell) => cell.cellKind === notebookCommon_1.CellKind.Markup || includeCodeCells);
            }
            else {
                notebookCells = notebookEditorWidget.getViewModel().viewCells;
            }
            const entries = [];
            for (const cell of notebookCells) {
                entries.push(...this._outlineEntryFactory.getOutlineEntries(cell, this._target, entries.length));
                // send an event whenever any of the cells change
                this._entriesDisposables.add(cell.model.onDidChangeContent(() => {
                    this._recomputeState();
                    this._onDidChange.fire({});
                }));
            }
            // build a tree from the list of entries
            if (entries.length > 0) {
                const result = [entries[0]];
                const parentStack = [entries[0]];
                for (let i = 1; i < entries.length; i++) {
                    const entry = entries[i];
                    while (true) {
                        const len = parentStack.length;
                        if (len === 0) {
                            // root node
                            result.push(entry);
                            parentStack.push(entry);
                            break;
                        }
                        else {
                            const parentCandidate = parentStack[len - 1];
                            if (parentCandidate.level < entry.level) {
                                parentCandidate.addChild(entry);
                                parentStack.push(entry);
                                break;
                            }
                            else {
                                parentStack.pop();
                            }
                        }
                    }
                }
                this._entries = result;
            }
            // feature: show markers with each cell
            const markerServiceListener = new lifecycle_1.MutableDisposable();
            this._entriesDisposables.add(markerServiceListener);
            const updateMarkerUpdater = () => {
                if (notebookEditorWidget.isDisposed) {
                    return;
                }
                const doUpdateMarker = (clear) => {
                    for (const entry of this._entries) {
                        if (clear) {
                            entry.clearMarkers();
                        }
                        else {
                            entry.updateMarkers(this._markerService);
                        }
                    }
                };
                const problem = this._configurationService.getValue('problems.visibility');
                if (problem === undefined) {
                    return;
                }
                const config = this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */);
                if (problem && config) {
                    markerServiceListener.value = this._markerService.onMarkerChanged(e => {
                        if (notebookEditorWidget.isDisposed) {
                            console.error('notebook editor is disposed');
                            return;
                        }
                        if (e.some(uri => notebookEditorWidget.getCellsInRange().some(cell => (0, resources_1.isEqual)(cell.uri, uri)))) {
                            doUpdateMarker(false);
                            this._onDidChange.fire({});
                        }
                    });
                    doUpdateMarker(false);
                }
                else {
                    markerServiceListener.clear();
                    doUpdateMarker(true);
                }
            };
            updateMarkerUpdater();
            this._entriesDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('problems.visibility') || e.affectsConfiguration("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */)) {
                    updateMarkerUpdater();
                    this._onDidChange.fire({});
                }
            }));
            this._recomputeActive();
            this._onDidChange.fire({});
        }
        _recomputeActive() {
            let newActive;
            const notebookEditorWidget = this._editor;
            if (notebookEditorWidget) { //TODO don't check for widget, only here if we do have
                if (notebookEditorWidget.hasModel() && notebookEditorWidget.getLength() > 0) {
                    const cell = notebookEditorWidget.cellAt(notebookEditorWidget.getFocus().start);
                    if (cell) {
                        for (const entry of this._entries) {
                            newActive = entry.find(cell, []);
                            if (newActive) {
                                break;
                            }
                        }
                    }
                }
            }
            // @Yoyokrazy - Make sure the new active entry isn't part of the filtered exclusions
            const showCodeCells = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells);
            const showCodeCellSymbols = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            const showMarkdownHeadersOnly = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly);
            // check the three outline filtering conditions
            // if any are true, newActive should NOT be set to this._activeEntry and the event should NOT fire
            if ((newActive !== this._activeEntry) && !((showMarkdownHeadersOnly && newActive?.cell.cellKind === notebookCommon_1.CellKind.Markup && newActive?.level === 7) || // show headers only + cell is mkdn + is level 7 (no header)
                (!showCodeCells && newActive?.cell.cellKind === notebookCommon_1.CellKind.Code) || // show code cells   + cell is code
                (!showCodeCellSymbols && newActive?.cell.cellKind === notebookCommon_1.CellKind.Code && newActive?.level > 7) // show code symbols + cell is code + has level > 7 (nb symbol levels)
            )) {
                this._activeEntry = newActive;
                this._onDidChange.fire({ affectOnlyActiveElement: true });
            }
        }
        get isEmpty() {
            return this._entries.length === 0;
        }
        get uri() {
            return this._uri;
        }
    };
    exports.NotebookCellOutlineProvider = NotebookCellOutlineProvider;
    exports.NotebookCellOutlineProvider = NotebookCellOutlineProvider = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, outlineModel_1.IOutlineModelService),
        __param(5, markers_1.IMarkerService),
        __param(6, configuration_1.IConfigurationService)
    ], NotebookCellOutlineProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld01vZGVsL25vdGVib29rT3V0bGluZVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBMkI7UUFRdkMsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFPRCxJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFJRCxZQUNrQixPQUF3QixFQUN4QixPQUFzQixFQUN4QixZQUEyQixFQUNWLDZCQUE2RCxFQUN2RSxvQkFBMkQsRUFDakUsY0FBK0MsRUFDeEMscUJBQTZEO1lBTm5FLFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBQ3hCLFlBQU8sR0FBUCxPQUFPLENBQWU7WUFHQSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ2hELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN2QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBN0JwRSxnQkFBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQXNCLENBQUM7WUFFekQsZ0JBQVcsR0FBOEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFHbEUsYUFBUSxHQUFtQixFQUFFLENBQUM7WUFNckIsd0JBQW1CLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFcEQsZ0JBQVcsR0FBRyxlQUFlLENBQUM7WUFpQnRDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLHlE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