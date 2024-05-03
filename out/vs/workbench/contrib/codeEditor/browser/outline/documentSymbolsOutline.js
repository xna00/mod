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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/outline/browser/outline", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/contrib/codeEditor/browser/outline/documentSymbolsTree", "vs/editor/browser/editorBrowser", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/base/common/cancellation", "vs/base/common/async", "vs/base/common/errors", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/editor/common/core/range", "vs/editor/browser/services/codeEditorService", "vs/platform/configuration/common/configuration", "vs/nls", "vs/editor/common/services/markerDecorations", "vs/platform/markers/common/markers", "vs/base/common/resources", "vs/editor/common/services/languageFeatures"], function (require, exports, event_1, lifecycle_1, outline_1, contributions_1, platform_1, documentSymbolsTree_1, editorBrowser_1, outlineModel_1, cancellation_1, async_1, errors_1, textResourceConfiguration_1, instantiation_1, range_1, codeEditorService_1, configuration_1, nls_1, markerDecorations_1, markers_1, resources_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DocumentSymbolBreadcrumbsSource = class DocumentSymbolBreadcrumbsSource {
        constructor(_editor, _textResourceConfigurationService) {
            this._editor = _editor;
            this._textResourceConfigurationService = _textResourceConfigurationService;
            this._breadcrumbs = [];
        }
        getBreadcrumbElements() {
            return this._breadcrumbs;
        }
        clear() {
            this._breadcrumbs = [];
        }
        update(model, position) {
            const newElements = this._computeBreadcrumbs(model, position);
            this._breadcrumbs = newElements;
        }
        _computeBreadcrumbs(model, position) {
            let item = model.getItemEnclosingPosition(position);
            if (!item) {
                return [];
            }
            const chain = [];
            while (item) {
                chain.push(item);
                const parent = item.parent;
                if (parent instanceof outlineModel_1.OutlineModel) {
                    break;
                }
                if (parent instanceof outlineModel_1.OutlineGroup && parent.parent && parent.parent.children.size === 1) {
                    break;
                }
                item = parent;
            }
            const result = [];
            for (let i = chain.length - 1; i >= 0; i--) {
                const element = chain[i];
                if (this._isFiltered(element)) {
                    break;
                }
                result.push(element);
            }
            if (result.length === 0) {
                return [];
            }
            return result;
        }
        _isFiltered(element) {
            if (!(element instanceof outlineModel_1.OutlineElement)) {
                return false;
            }
            const key = `breadcrumbs.${documentSymbolsTree_1.DocumentSymbolFilter.kindToConfigName[element.symbol.kind]}`;
            let uri;
            if (this._editor && this._editor.getModel()) {
                const model = this._editor.getModel();
                uri = model.uri;
            }
            return !this._textResourceConfigurationService.getValue(uri, key);
        }
    };
    DocumentSymbolBreadcrumbsSource = __decorate([
        __param(1, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], DocumentSymbolBreadcrumbsSource);
    let DocumentSymbolsOutline = class DocumentSymbolsOutline {
        get activeElement() {
            const posistion = this._editor.getPosition();
            if (!posistion || !this._outlineModel) {
                return undefined;
            }
            else {
                return this._outlineModel.getItemEnclosingPosition(posistion);
            }
        }
        constructor(_editor, target, firstLoadBarrier, _languageFeaturesService, _codeEditorService, _outlineModelService, _configurationService, _markerDecorationsService, textResourceConfigurationService, instantiationService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._codeEditorService = _codeEditorService;
            this._outlineModelService = _outlineModelService;
            this._configurationService = _configurationService;
            this._markerDecorationsService = _markerDecorationsService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._outlineDisposables = new lifecycle_1.DisposableStore();
            this.outlineKind = 'documentSymbols';
            this._breadcrumbsDataSource = new DocumentSymbolBreadcrumbsSource(_editor, textResourceConfigurationService);
            const delegate = new documentSymbolsTree_1.DocumentSymbolVirtualDelegate();
            const renderers = [new documentSymbolsTree_1.DocumentSymbolGroupRenderer(), instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolRenderer, true, target)];
            const treeDataSource = {
                getChildren: (parent) => {
                    if (parent instanceof outlineModel_1.OutlineElement || parent instanceof outlineModel_1.OutlineGroup) {
                        return parent.children.values();
                    }
                    if (parent === this && this._outlineModel) {
                        return this._outlineModel.children.values();
                    }
                    return [];
                }
            };
            const comparator = new documentSymbolsTree_1.DocumentSymbolComparator();
            const initialState = textResourceConfigurationService.getValue(_editor.getModel()?.uri, "outline.collapseItems" /* OutlineConfigKeys.collapseItems */);
            const options = {
                collapseByDefault: target === 2 /* OutlineTarget.Breadcrumbs */ || (target === 1 /* OutlineTarget.OutlinePane */ && initialState === "alwaysCollapse" /* OutlineConfigCollapseItemsValues.Collapsed */),
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                identityProvider: new documentSymbolsTree_1.DocumentSymbolIdentityProvider(),
                keyboardNavigationLabelProvider: new documentSymbolsTree_1.DocumentSymbolNavigationLabelProvider(),
                accessibilityProvider: new documentSymbolsTree_1.DocumentSymbolAccessibilityProvider((0, nls_1.localize)('document', "Document Symbols")),
                filter: target === 1 /* OutlineTarget.OutlinePane */
                    ? instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolFilter, 'outline')
                    : target === 2 /* OutlineTarget.Breadcrumbs */
                        ? instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolFilter, 'breadcrumbs')
                        : undefined
            };
            this.config = {
                breadcrumbsDataSource: this._breadcrumbsDataSource,
                delegate,
                renderers,
                treeDataSource,
                comparator,
                options,
                quickPickDataSource: { getQuickPickElements: () => { throw new Error('not implemented'); } }
            };
            // update as language, model, providers changes
            this._disposables.add(_languageFeaturesService.documentSymbolProvider.onDidChange(_ => this._createOutline()));
            this._disposables.add(this._editor.onDidChangeModel(_ => this._createOutline()));
            this._disposables.add(this._editor.onDidChangeModelLanguage(_ => this._createOutline()));
            // update soon'ish as model content change
            const updateSoon = new async_1.TimeoutTimer();
            this._disposables.add(updateSoon);
            this._disposables.add(this._editor.onDidChangeModelContent(event => {
                const model = this._editor.getModel();
                if (model) {
                    const timeout = _outlineModelService.getDebounceValue(model);
                    updateSoon.cancelAndSet(() => this._createOutline(event), timeout);
                }
            }));
            // stop when editor dies
            this._disposables.add(this._editor.onDidDispose(() => this._outlineDisposables.clear()));
            // initial load
            this._createOutline().finally(() => firstLoadBarrier.open());
        }
        dispose() {
            this._disposables.dispose();
            this._outlineDisposables.dispose();
        }
        get isEmpty() {
            return !this._outlineModel || outlineModel_1.TreeElement.empty(this._outlineModel);
        }
        get uri() {
            return this._outlineModel?.uri;
        }
        async reveal(entry, options, sideBySide, select) {
            const model = outlineModel_1.OutlineModel.get(entry);
            if (!model || !(entry instanceof outlineModel_1.OutlineElement)) {
                return;
            }
            await this._codeEditorService.openCodeEditor({
                resource: model.uri,
                options: {
                    ...options,
                    selection: select ? entry.symbol.range : range_1.Range.collapseToStart(entry.symbol.selectionRange),
                    selectionRevealType: 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */,
                }
            }, this._editor, sideBySide);
        }
        preview(entry) {
            if (!(entry instanceof outlineModel_1.OutlineElement)) {
                return lifecycle_1.Disposable.None;
            }
            const { symbol } = entry;
            this._editor.revealRangeInCenterIfOutsideViewport(symbol.range, 0 /* ScrollType.Smooth */);
            const decorationsCollection = this._editor.createDecorationsCollection([{
                    range: symbol.range,
                    options: {
                        description: 'document-symbols-outline-range-highlight',
                        className: 'rangeHighlight',
                        isWholeLine: true
                    }
                }]);
            return (0, lifecycle_1.toDisposable)(() => decorationsCollection.clear());
        }
        captureViewState() {
            const viewState = this._editor.saveViewState();
            return (0, lifecycle_1.toDisposable)(() => {
                if (viewState) {
                    this._editor.restoreViewState(viewState);
                }
            });
        }
        async _createOutline(contentChangeEvent) {
            this._outlineDisposables.clear();
            if (!contentChangeEvent) {
                this._setOutlineModel(undefined);
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const buffer = this._editor.getModel();
            if (!this._languageFeaturesService.documentSymbolProvider.has(buffer)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const versionIdThen = buffer.getVersionId();
            const timeoutTimer = new async_1.TimeoutTimer();
            this._outlineDisposables.add(timeoutTimer);
            this._outlineDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            try {
                const model = await this._outlineModelService.getOrCreate(buffer, cts.token);
                if (cts.token.isCancellationRequested) {
                    // cancelled -> do nothing
                    return;
                }
                if (outlineModel_1.TreeElement.empty(model) || !this._editor.hasModel()) {
                    // empty -> no outline elements
                    this._setOutlineModel(model);
                    return;
                }
                // heuristic: when the symbols-to-lines ratio changes by 50% between edits
                // wait a little (and hope that the next change isn't as drastic).
                if (contentChangeEvent && this._outlineModel && buffer.getLineCount() >= 25) {
                    const newSize = outlineModel_1.TreeElement.size(model);
                    const newLength = buffer.getValueLength();
                    const newRatio = newSize / newLength;
                    const oldSize = outlineModel_1.TreeElement.size(this._outlineModel);
                    const oldLength = newLength - contentChangeEvent.changes.reduce((prev, value) => prev + value.rangeLength, 0);
                    const oldRatio = oldSize / oldLength;
                    if (newRatio <= oldRatio * 0.5 || newRatio >= oldRatio * 1.5) {
                        // wait for a better state and ignore current model when more
                        // typing has happened
                        const value = await (0, async_1.raceCancellation)((0, async_1.timeout)(2000).then(() => true), cts.token, false);
                        if (!value) {
                            return;
                        }
                    }
                }
                // feature: show markers with outline element
                this._applyMarkersToOutline(model);
                this._outlineDisposables.add(this._markerDecorationsService.onDidChangeMarker(textModel => {
                    if ((0, resources_1.isEqual)(model.uri, textModel.uri)) {
                        this._applyMarkersToOutline(model);
                        this._onDidChange.fire({});
                    }
                }));
                this._outlineDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */) || e.affectsConfiguration('problems.visibility')) {
                        const problem = this._configurationService.getValue('problems.visibility');
                        const config = this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */);
                        if (!problem || !config) {
                            model.updateMarker([]);
                        }
                        else {
                            this._applyMarkersToOutline(model);
                        }
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('outline')) {
                        // outline filtering, problems on/off
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('breadcrumbs') && this._editor.hasModel()) {
                        // breadcrumbs filtering
                        this._breadcrumbsDataSource.update(model, this._editor.getPosition());
                        this._onDidChange.fire({});
                    }
                }));
                // feature: toggle icons
                this._outlineDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration("outline.icons" /* OutlineConfigKeys.icons */)) {
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('outline')) {
                        this._onDidChange.fire({});
                    }
                }));
                // feature: update active when cursor changes
                this._outlineDisposables.add(this._editor.onDidChangeCursorPosition(_ => {
                    timeoutTimer.cancelAndSet(() => {
                        if (!buffer.isDisposed() && versionIdThen === buffer.getVersionId() && this._editor.hasModel()) {
                            this._breadcrumbsDataSource.update(model, this._editor.getPosition());
                            this._onDidChange.fire({ affectOnlyActiveElement: true });
                        }
                    }, 150);
                }));
                // update properties, send event
                this._setOutlineModel(model);
            }
            catch (err) {
                this._setOutlineModel(undefined);
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        _applyMarkersToOutline(model) {
            const problem = this._configurationService.getValue('problems.visibility');
            const config = this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */);
            if (!model || !problem || !config) {
                return;
            }
            const markers = [];
            for (const [range, marker] of this._markerDecorationsService.getLiveMarkers(model.uri)) {
                if (marker.severity === markers_1.MarkerSeverity.Error || marker.severity === markers_1.MarkerSeverity.Warning) {
                    markers.push({ ...range, severity: marker.severity });
                }
            }
            model.updateMarker(markers);
        }
        _setOutlineModel(model) {
            const position = this._editor.getPosition();
            if (!position || !model) {
                this._outlineModel = undefined;
                this._breadcrumbsDataSource.clear();
            }
            else {
                if (!this._outlineModel?.merge(model)) {
                    this._outlineModel = model;
                }
                this._breadcrumbsDataSource.update(model, position);
            }
            this._onDidChange.fire({});
        }
    };
    DocumentSymbolsOutline = __decorate([
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, outlineModel_1.IOutlineModelService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, markerDecorations_1.IMarkerDecorationsService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, instantiation_1.IInstantiationService)
    ], DocumentSymbolsOutline);
    let DocumentSymbolsOutlineCreator = class DocumentSymbolsOutlineCreator {
        constructor(outlineService) {
            const reg = outlineService.registerOutlineCreator(this);
            this.dispose = () => reg.dispose();
        }
        matches(candidate) {
            const ctrl = candidate.getControl();
            return (0, editorBrowser_1.isCodeEditor)(ctrl) || (0, editorBrowser_1.isDiffEditor)(ctrl);
        }
        async createOutline(pane, target, _token) {
            const control = pane.getControl();
            let editor;
            if ((0, editorBrowser_1.isCodeEditor)(control)) {
                editor = control;
            }
            else if ((0, editorBrowser_1.isDiffEditor)(control)) {
                editor = control.getModifiedEditor();
            }
            if (!editor) {
                return undefined;
            }
            const firstLoadBarrier = new async_1.Barrier();
            const result = editor.invokeWithinContext(accessor => accessor.get(instantiation_1.IInstantiationService).createInstance(DocumentSymbolsOutline, editor, target, firstLoadBarrier));
            await firstLoadBarrier.wait();
            return result;
        }
    };
    DocumentSymbolsOutlineCreator = __decorate([
        __param(0, outline_1.IOutlineService)
    ], DocumentSymbolsOutlineCreator);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DocumentSymbolsOutlineCreator, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTeW1ib2xzT3V0bGluZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL291dGxpbmUvZG9jdW1lbnRTeW1ib2xzT3V0bGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQW1DaEcsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBK0I7UUFJcEMsWUFDa0IsT0FBb0IsRUFDRixpQ0FBcUY7WUFEdkcsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNlLHNDQUFpQyxHQUFqQyxpQ0FBaUMsQ0FBbUM7WUFKakgsaUJBQVksR0FBc0MsRUFBRSxDQUFDO1FBS3pELENBQUM7UUFFTCxxQkFBcUI7WUFDcEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFtQixFQUFFLFFBQW1CO1lBQzlDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7UUFDakMsQ0FBQztRQUVPLG1CQUFtQixDQUFDLEtBQW1CLEVBQUUsUUFBbUI7WUFDbkUsSUFBSSxJQUFJLEdBQThDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsTUFBTSxLQUFLLEdBQXlDLEVBQUUsQ0FBQztZQUN2RCxPQUFPLElBQUksRUFBRSxDQUFDO2dCQUNiLEtBQUss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