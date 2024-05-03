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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/markers/browser/markersModel", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/markers/browser/markersViewActions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/browser/codeeditor", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/iterator", "vs/base/common/event", "vs/platform/list/browser/listService", "vs/workbench/contrib/markers/browser/markersFilterOptions", "vs/base/common/objects", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/markers/browser/markersTreeViewer", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/keyboardEvent", "vs/workbench/browser/labels", "vs/platform/markers/common/markers", "vs/workbench/common/memento", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/base/common/map", "vs/workbench/common/editor", "vs/workbench/browser/dnd", "vs/workbench/contrib/markers/browser/markersTable", "vs/workbench/contrib/markers/common/markers", "vs/workbench/browser/actions/widgetNavigationCommands", "vs/css!./media/markers"], function (require, exports, dom, actions_1, telemetry_1, editorService_1, markersModel_1, instantiation_1, markersViewActions_1, configuration_1, messages_1, codeeditor_1, themeService_1, storage_1, nls_1, contextkey_1, iterator_1, event_1, listService_1, markersFilterOptions_1, objects_1, workspace_1, markersTreeViewer_1, contextView_1, actions_2, keybinding_1, keyboardEvent_1, labels_1, markers_1, memento_1, viewPane_1, views_1, opener_1, actionViewItems_1, uriIdentity_1, lifecycle_1, arrays_1, map_1, editor_1, dnd_1, markersTable_1, markers_2, widgetNavigationCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersView = void 0;
    function createResourceMarkersIterator(resourceMarkers) {
        return iterator_1.Iterable.map(resourceMarkers.markers, m => {
            const relatedInformationIt = iterator_1.Iterable.from(m.relatedInformation);
            const children = iterator_1.Iterable.map(relatedInformationIt, r => ({ element: r }));
            return { element: m, children };
        });
    }
    let MarkersView = class MarkersView extends viewPane_1.FilterViewPane {
        constructor(options, instantiationService, viewDescriptorService, editorService, configurationService, telemetryService, markerService, contextKeyService, workspaceContextService, contextMenuService, uriIdentityService, keybindingService, storageService, openerService, themeService) {
            const memento = new memento_1.Memento(markers_2.Markers.MARKERS_VIEW_STORAGE_ID, storageService);
            const panelState = memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            super({
                ...options,
                filterOptions: {
                    ariaLabel: messages_1.default.MARKERS_PANEL_FILTER_ARIA_LABEL,
                    placeholder: messages_1.default.MARKERS_PANEL_FILTER_PLACEHOLDER,
                    focusContextKey: markers_2.MarkersContextKeys.MarkerViewFilterFocusContextKey.key,
                    text: panelState['filter'] || '',
                    history: panelState['filterHistory'] || []
                }
            }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.markerService = markerService;
            this.workspaceContextService = workspaceContextService;
            this.uriIdentityService = uriIdentityService;
            this.lastSelectedRelativeTop = 0;
            this.currentActiveResource = null;
            this.onVisibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.widgetDisposables = this._register(new lifecycle_1.DisposableStore());
            this.currentHeight = 0;
            this.currentWidth = 0;
            this.cachedFilterStats = undefined;
            this.currentResourceGotAddedToMarkersData = false;
            this.onDidChangeVisibility = this.onDidChangeBodyVisibility;
            this.memento = memento;
            this.panelState = panelState;
            this.markersModel = this._register(instantiationService.createInstance(markersModel_1.MarkersModel));
            this.markersViewModel = this._register(instantiationService.createInstance(markersTreeViewer_1.MarkersViewModel, this.panelState['multiline'], this.panelState['viewMode'] ?? this.getDefaultViewMode()));
            this._register(this.onDidChangeVisibility(visible => this.onDidChangeMarkersViewVisibility(visible)));
            this._register(this.markersViewModel.onDidChangeViewMode(_ => this.onDidChangeViewMode()));
            this.widgetAccessibilityProvider = instantiationService.createInstance(markersTreeViewer_1.MarkersWidgetAccessibilityProvider);
            this.widgetIdentityProvider = { getId(element) { return element.id; } };
            this.setCurrentActiveEditor();
            this.filter = new markersTreeViewer_1.Filter(markersFilterOptions_1.FilterOptions.EMPTY(uriIdentityService));
            this.rangeHighlightDecorations = this._register(this.instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
            this.filters = this._register(new markersViewActions_1.MarkersFilters({
                filterHistory: this.panelState['filterHistory'] || [],
                showErrors: this.panelState['showErrors'] !== false,
                showWarnings: this.panelState['showWarnings'] !== false,
                showInfos: this.panelState['showInfos'] !== false,
                excludedFiles: !!this.panelState['useFilesExclude'],
                activeFile: !!this.panelState['activeFile'],
            }, this.contextKeyService));
            // Update filter, whenever the "files.exclude" setting is changed
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (this.filters.excludedFiles && e.affectsConfiguration('files.exclude')) {
                    this.updateFilter();
                }
            }));
        }
        render() {
            super.render();
            this._register((0, widgetNavigationCommands_1.registerNavigableContainer)({
                focusNotifiers: [this, this.filterWidget],
                focusNextWidget: () => {
                    if (this.filterWidget.hasFocus()) {
                        this.focus();
                    }
                },
                focusPreviousWidget: () => {
                    if (!this.filterWidget.hasFocus()) {
                        this.focusFilter();
                    }
                }
            }));
        }
        renderBody(parent) {
            super.renderBody(parent);
            parent.classList.add('markers-panel');
            this._register(dom.addDisposableListener(parent, 'keydown', e => {
                if (this.keybindingService.mightProducePrintableCharacter(new keyboardEvent_1.StandardKeyboardEvent(e))) {
                    this.focusFilter();
                }
            }));
            const panelContainer = dom.append(parent, dom.$('.markers-panel-container'));
            this.createArialLabelElement(panelContainer);
            this.createMessageBox(panelContainer);
            this.widgetContainer = dom.append(panelContainer, dom.$('.widget-container'));
            this.createWidget(this.widgetContainer);
            this.updateFilter();
            this.renderContent();
        }
        getTitle() {
            return messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS.value;
        }
        layoutBodyContent(height = this.currentHeight, width = this.currentWidth) {
            if (this.messageBoxContainer) {
                this.messageBoxContainer.style.height = `${height}px`;
            }
            this.widget.layout(height, width);
            this.currentHeight = height;
            this.currentWidth = width;
        }
        focus() {
            super.focus();
            if (dom.isActiveElement(this.widget.getHTMLElement())) {
                return;
            }
            if (this.hasNoProblems()) {
                this.messageBoxContainer.focus();
            }
            else {
                this.widget.domFocus();
                this.widget.setMarkerSelection();
            }
        }
        focusFilter() {
            this.filterWidget.focus();
        }
        updateBadge(total, filtered) {
            this.filterWidget.updateBadge(total === filtered || total === 0 ? undefined : (0, nls_1.localize)('showing filtered problems', "Showing {0} of {1}", filtered, total));
        }
        checkMoreFilters() {
            this.filterWidget.checkMoreFilters(!this.filters.showErrors || !this.filters.showWarnings || !this.filters.showInfos || this.filters.excludedFiles || this.filters.activeFile);
        }
        clearFilterText() {
            this.filterWidget.setFilterText('');
        }
        showQuickFixes(marker) {
            const viewModel = this.markersViewModel.getViewModel(marker);
            if (viewModel) {
                viewModel.quickFixAction.run();
            }
        }
        openFileAtElement(element, preserveFocus, sideByside, pinned) {
            const { resource, selection } = element instanceof markersModel_1.Marker ? { resource: element.resource, selection: element.range } :
                element instanceof markersModel_1.RelatedInformation ? { resource: element.raw.resource, selection: element.raw } :
                    'marker' in element ? { resource: element.marker.resource, selection: element.marker.range } :
                        { resource: null, selection: null };
            if (resource && selection) {
                this.editorService.openEditor({
                    resource,
                    options: {
                        selection,
                        preserveFocus,
                        pinned,
                        revealIfVisible: true
                    },
                }, sideByside ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
                    if (editor && preserveFocus) {
                        this.rangeHighlightDecorations.highlightRange({ resource, range: selection }, editor.getControl());
                    }
                    else {
                        this.rangeHighlightDecorations.removeHighlightRange();
                    }
                });
                return true;
            }
            else {
                this.rangeHighlightDecorations.removeHighlightRange();
            }
            return false;
        }
        refreshPanel(markerOrChange) {
            if (this.isVisible()) {
                const hasSelection = this.widget.getSelection().length > 0;
                if (markerOrChange) {
                    if (markerOrChange instanceof markersModel_1.Marker) {
                        this.widget.updateMarker(markerOrChange);
                    }
                    else {
                        if (markerOrChange.added.size || markerOrChange.removed.size) {
                            // Reset complete widget
                            this.resetWidget();
                        }
                        else {
                            // Update resource
                            this.widget.update([...markerOrChange.updated]);
                        }
                    }
                }
                else {
                    // Reset complete widget
                    this.resetWidget();
                }
                if (hasSelection) {
                    this.widget.setMarkerSelection();
                }
                this.cachedFilterStats = undefined;
                const { total, filtered } = this.getFilterStats();
                this.toggleVisibility(total === 0 || filtered === 0);
                this.renderMessage();
                this.updateBadge(total, filtered);
                this.checkMoreFilters();
            }
        }
        onDidChangeViewState(marker) {
            this.refreshPanel(marker);
        }
        resetWidget() {
            this.widget.reset(this.getResourceMarkers());
        }
        updateFilter() {
            this.filter.options = new markersFilterOptions_1.FilterOptions(this.filterWidget.getFilterText(), this.getFilesExcludeExpressions(), this.filters.showWarnings, this.filters.showErrors, this.filters.showInfos, this.uriIdentityService);
            this.widget.filterMarkers(this.getResourceMarkers(), this.filter.options);
            this.cachedFilterStats = undefined;
            const { total, filtered } = this.getFilterStats();
            this.toggleVisibility(total === 0 || filtered === 0);
            this.renderMessage();
            this.updateBadge(total, filtered);
            this.checkMoreFilters();
        }
        getDefaultViewMode() {
            switch (this.configurationService.getValue('problems.defaultViewMode')) {
                case 'table':
                    return "table" /* MarkersViewMode.Table */;
                case 'tree':
                    return "tree" /* MarkersViewMode.Tree */;
                default:
                    return "tree" /* MarkersViewMode.Tree */;
            }
        }
        getFilesExcludeExpressions() {
            if (!this.filters.excludedFiles) {
                return [];
            }
            const workspaceFolders = this.workspaceContextService.getWorkspace().folders;
            return workspaceFolders.length
                ? workspaceFolders.map(workspaceFolder => ({ root: workspaceFolder.uri, expression: this.getFilesExclude(workspaceFolder.uri) }))
                : this.getFilesExclude();
        }
        getFilesExclude(resource) {
            return (0, objects_1.deepClone)(this.configurationService.getValue('files.exclude', { resource })) || {};
        }
        getResourceMarkers() {
            if (!this.filters.activeFile) {
                return this.markersModel.resourceMarkers;
            }
            let resourceMarkers = [];
            if (this.currentActiveResource) {
                const activeResourceMarkers = this.markersModel.getResourceMarkers(this.currentActiveResource);
                if (activeResourceMarkers) {
                    resourceMarkers = [activeResourceMarkers];
                }
            }
            return resourceMarkers;
        }
        createMessageBox(parent) {
            this.messageBoxContainer = dom.append(parent, dom.$('.message-box-container'));
            this.messageBoxContainer.setAttribute('aria-labelledby', 'markers-panel-arialabel');
        }
        createArialLabelElement(parent) {
            this.ariaLabelElement = dom.append(parent, dom.$(''));
            this.ariaLabelElement.setAttribute('id', 'markers-panel-arialabel');
        }
        createWidget(parent) {
            this.widget = this.markersViewModel.viewMode === "table" /* MarkersViewMode.Table */ ? this.createTable(parent) : this.createTree(parent);
            this.widgetDisposables.add(this.widget);
            const markerFocusContextKey = markers_2.MarkersContextKeys.MarkerFocusContextKey.bindTo(this.widget.contextKeyService);
            const relatedInformationFocusContextKey = markers_2.MarkersContextKeys.RelatedInformationFocusContextKey.bindTo(this.widget.contextKeyService);
            this.widgetDisposables.add(this.widget.onDidChangeFocus(focus => {
                markerFocusContextKey.set(focus.elements.some(e => e instanceof markersModel_1.Marker));
                relatedInformationFocusContextKey.set(focus.elements.some(e => e instanceof markersModel_1.RelatedInformation));
            }));
            this.widgetDisposables.add(event_1.Event.debounce(this.widget.onDidOpen, (last, event) => event, 75, true)(options => {
                this.openFileAtElement(options.element, !!options.editorOptions.preserveFocus, options.sideBySide, !!options.editorOptions.pinned);
            }));
            this.widgetDisposables.add(event_1.Event.any(this.widget.onDidChangeSelection, this.widget.onDidChangeFocus)(() => {
                const elements = [...this.widget.getSelection(), ...this.widget.getFocus()];
                for (const element of elements) {
                    if (element instanceof markersModel_1.Marker) {
                        const viewModel = this.markersViewModel.getViewModel(element);
                        viewModel?.showLightBulb();
                    }
                }
            }));
            this.widgetDisposables.add(this.widget.onContextMenu(this.onContextMenu, this));
            this.widgetDisposables.add(this.widget.onDidChangeSelection(this.onSelected, this));
        }
        createTable(parent) {
            const table = this.instantiationService.createInstance(markersTable_1.MarkersTable, dom.append(parent, dom.$('.markers-table-container')), this.markersViewModel, this.getResourceMarkers(), this.filter.options, {
                accessibilityProvider: this.widgetAccessibilityProvider,
                dnd: this.instantiationService.createInstance(dnd_1.ResourceListDnDHandler, (element) => {
                    if (element instanceof markersModel_1.MarkerTableItem) {
                        return (0, opener_1.withSelection)(element.resource, element.range);
                    }
                    return null;
                }),
                horizontalScrolling: false,
                identityProvider: this.widgetIdentityProvider,
                multipleSelectionSupport: true,
                selectionNavigation: true
            });
            return table;
        }
        createTree(parent) {
            const onDidChangeRenderNodeCount = new event_1.Relay();
            const treeLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, this);
            const virtualDelegate = new markersTreeViewer_1.VirtualDelegate(this.markersViewModel);
            const renderers = [
                this.instantiationService.createInstance(markersTreeViewer_1.ResourceMarkersRenderer, treeLabels, onDidChangeRenderNodeCount.event),
                this.instantiationService.createInstance(markersTreeViewer_1.MarkerRenderer, this.markersViewModel),
                this.instantiationService.createInstance(markersTreeViewer_1.RelatedInformationRenderer)
            ];
            const tree = this.instantiationService.createInstance(MarkersTree, 'MarkersView', dom.append(parent, dom.$('.tree-container.show-file-icons')), virtualDelegate, renderers, {
                filter: this.filter,
                accessibilityProvider: this.widgetAccessibilityProvider,
                identityProvider: this.widgetIdentityProvider,
                dnd: this.instantiationService.createInstance(dnd_1.ResourceListDnDHandler, (element) => {
                    if (element instanceof markersModel_1.ResourceMarkers) {
                        return element.resource;
                    }
                    if (element instanceof markersModel_1.Marker) {
                        return (0, opener_1.withSelection)(element.resource, element.range);
                    }
                    if (element instanceof markersModel_1.RelatedInformation) {
                        return (0, opener_1.withSelection)(element.raw.resource, element.raw);
                    }
                    return null;
                }),
                expandOnlyOnTwistieClick: (e) => e instanceof markersModel_1.Marker && e.relatedInformation.length > 0,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                },
                selectionNavigation: true,
                multipleSelectionSupport: true,
            });
            onDidChangeRenderNodeCount.input = tree.onDidChangeRenderNodeCount;
            return tree;
        }
        collapseAll() {
            this.widget.collapseMarkers();
        }
        setMultiline(multiline) {
            this.markersViewModel.multiline = multiline;
        }
        setViewMode(viewMode) {
            this.markersViewModel.viewMode = viewMode;
        }
        onDidChangeMarkersViewVisibility(visible) {
            this.onVisibleDisposables.clear();
            if (visible) {
                for (const disposable of this.reInitialize()) {
                    this.onVisibleDisposables.add(disposable);
                }
                this.refreshPanel();
            }
        }
        reInitialize() {
            const disposables = [];
            // Markers Model
            const readMarkers = (resource) => this.markerService.read({ resource, severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info });
            this.markersModel.setResourceMarkers((0, arrays_1.groupBy)(readMarkers(), markersModel_1.compareMarkersByUri).map(group => [group[0].resource, group]));
            disposables.push(event_1.Event.debounce(this.markerService.onMarkerChanged, (resourcesMap, resources) => {
                resourcesMap = resourcesMap || new map_1.ResourceMap();
                resources.forEach(resource => resourcesMap.set(resource, resource));
                return resourcesMap;
            }, 64)(resourcesMap => {
                this.markersModel.setResourceMarkers([...resourcesMap.values()].map(resource => [resource, readMarkers(resource)]));
            }));
            disposables.push(event_1.Event.any(this.markersModel.onDidChange, this.editorService.onDidActiveEditorChange)(changes => {
                if (changes) {
                    this.onDidChangeModel(changes);
                }
                else {
                    this.onActiveEditorChanged();
                }
            }));
            disposables.push((0, lifecycle_1.toDisposable)(() => this.markersModel.reset()));
            // Markers View Model
            this.markersModel.resourceMarkers.forEach(resourceMarker => resourceMarker.markers.forEach(marker => this.markersViewModel.add(marker)));
            disposables.push(this.markersViewModel.onDidChange(marker => this.onDidChangeViewState(marker)));
            disposables.push((0, lifecycle_1.toDisposable)(() => this.markersModel.resourceMarkers.forEach(resourceMarker => this.markersViewModel.remove(resourceMarker.resource))));
            // Markers Filters
            disposables.push(this.filters.onDidChange((event) => {
                if (event.activeFile) {
                    this.refreshPanel();
                }
                else if (event.excludedFiles || event.showWarnings || event.showErrors || event.showInfos) {
                    this.updateFilter();
                }
            }));
            disposables.push(this.filterWidget.onDidChangeFilterText(e => this.updateFilter()));
            disposables.push((0, lifecycle_1.toDisposable)(() => { this.cachedFilterStats = undefined; }));
            disposables.push((0, lifecycle_1.toDisposable)(() => this.rangeHighlightDecorations.removeHighlightRange()));
            return disposables;
        }
        onDidChangeModel(change) {
            const resourceMarkers = [...change.added, ...change.removed, ...change.updated];
            const resources = [];
            for (const { resource } of resourceMarkers) {
                this.markersViewModel.remove(resource);
                const resourceMarkers = this.markersModel.getResourceMarkers(resource);
                if (resourceMarkers) {
                    for (const marker of resourceMarkers.markers) {
                        this.markersViewModel.add(marker);
                    }
                }
                resources.push(resource);
            }
            this.currentResourceGotAddedToMarkersData = this.currentResourceGotAddedToMarkersData || this.isCurrentResourceGotAddedToMarkersData(resources);
            this.refreshPanel(change);
            this.updateRangeHighlights();
            if (this.currentResourceGotAddedToMarkersData) {
                this.autoReveal();
                this.currentResourceGotAddedToMarkersData = false;
            }
        }
        onDidChangeViewMode() {
            if (this.widgetContainer && this.widget) {
                this.widgetContainer.textContent = '';
                this.widgetDisposables.clear();
            }
            // Save selection
            const selection = new Set();
            for (const marker of this.widget.getSelection()) {
                if (marker instanceof markersModel_1.ResourceMarkers) {
                    marker.markers.forEach(m => selection.add(m));
                }
                else if (marker instanceof markersModel_1.Marker || marker instanceof markersModel_1.MarkerTableItem) {
                    selection.add(marker);
                }
            }
            // Save focus
            const focus = new Set();
            for (const marker of this.widget.getFocus()) {
                if (marker instanceof markersModel_1.Marker || marker instanceof markersModel_1.MarkerTableItem) {
                    focus.add(marker);
                }
            }
            // Create new widget
            this.createWidget(this.widgetContainer);
            this.refreshPanel();
            // Restore selection
            if (selection.size > 0) {
                this.widget.setMarkerSelection(Array.from(selection), Array.from(focus));
                this.widget.domFocus();
            }
        }
        isCurrentResourceGotAddedToMarkersData(changedResources) {
            const currentlyActiveResource = this.currentActiveResource;
            if (!currentlyActiveResource) {
                return false;
            }
            const resourceForCurrentActiveResource = this.getResourceForCurrentActiveResource();
            if (resourceForCurrentActiveResource) {
                return false;
            }
            return changedResources.some(r => r.toString() === currentlyActiveResource.toString());
        }
        onActiveEditorChanged() {
            this.setCurrentActiveEditor();
            if (this.filters.activeFile) {
                this.refreshPanel();
            }
            this.autoReveal();
        }
        setCurrentActiveEditor() {
            const activeEditor = this.editorService.activeEditor;
            this.currentActiveResource = activeEditor ? editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }) ?? null : null;
        }
        onSelected() {
            const selection = this.widget.getSelection();
            if (selection && selection.length > 0) {
                this.lastSelectedRelativeTop = this.widget.getRelativeTop(selection[0]) || 0;
            }
        }
        hasNoProblems() {
            const { total, filtered } = this.getFilterStats();
            return total === 0 || filtered === 0;
        }
        renderContent() {
            this.cachedFilterStats = undefined;
            this.resetWidget();
            this.toggleVisibility(this.hasNoProblems());
            this.renderMessage();
        }
        renderMessage() {
            if (!this.messageBoxContainer || !this.ariaLabelElement) {
                return;
            }
            dom.clearNode(this.messageBoxContainer);
            const { total, filtered } = this.getFilterStats();
            if (filtered === 0) {
                this.messageBoxContainer.style.display = 'block';
                this.messageBoxContainer.setAttribute('tabIndex', '0');
                if (this.filters.activeFile) {
                    this.renderFilterMessageForActiveFile(this.messageBoxContainer);
                }
                else {
                    if (total > 0) {
                        this.renderFilteredByFilterMessage(this.messageBoxContainer);
                    }
                    else {
                        this.renderNoProblemsMessage(this.messageBoxContainer);
                    }
                }
            }
            else {
                this.messageBoxContainer.style.display = 'none';
                if (filtered === total) {
                    this.setAriaLabel((0, nls_1.localize)('No problems filtered', "Showing {0} problems", total));
                }
                else {
                    this.setAriaLabel((0, nls_1.localize)('problems filtered', "Showing {0} of {1} problems", filtered, total));
                }
                this.messageBoxContainer.removeAttribute('tabIndex');
            }
        }
        renderFilterMessageForActiveFile(container) {
            if (this.currentActiveResource && this.markersModel.getResourceMarkers(this.currentActiveResource)) {
                this.renderFilteredByFilterMessage(container);
            }
            else {
                this.renderNoProblemsMessageForActiveFile(container);
            }
        }
        renderFilteredByFilterMessage(container) {
            const span1 = dom.append(container, dom.$('span'));
            span1.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILTERS;
            const link = dom.append(container, dom.$('a.messageAction'));
            link.textContent = (0, nls_1.localize)('clearFilter', "Clear Filters");
            link.setAttribute('tabIndex', '0');
            const span2 = dom.append(container, dom.$('span'));
            span2.textContent = '.';
            dom.addStandardDisposableListener(link, dom.EventType.CLICK, () => this.clearFilters());
            dom.addStandardDisposableListener(link, dom.EventType.KEY_DOWN, (e) => {
                if (e.equals(3 /* KeyCode.Enter */) || e.equals(10 /* KeyCode.Space */)) {
                    this.clearFilters();
                    e.stopPropagation();
                }
            });
            this.setAriaLabel(messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILTERS);
        }
        renderNoProblemsMessageForActiveFile(container) {
            const span = dom.append(container, dom.$('span'));
            span.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_ACTIVE_FILE_BUILT;
            this.setAriaLabel(messages_1.default.MARKERS_PANEL_NO_PROBLEMS_ACTIVE_FILE_BUILT);
        }
        renderNoProblemsMessage(container) {
            const span = dom.append(container, dom.$('span'));
            span.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_BUILT;
            this.setAriaLabel(messages_1.default.MARKERS_PANEL_NO_PROBLEMS_BUILT);
        }
        setAriaLabel(label) {
            this.widget.setAriaLabel(label);
            this.ariaLabelElement.setAttribute('aria-label', label);
        }
        clearFilters() {
            this.filterWidget.setFilterText('');
            this.filters.excludedFiles = false;
            this.filters.showErrors = true;
            this.filters.showWarnings = true;
            this.filters.showInfos = true;
        }
        autoReveal(focus = false) {
            // No need to auto reveal if active file filter is on
            if (this.filters.activeFile) {
                return;
            }
            const autoReveal = this.configurationService.getValue('problems.autoReveal');
            if (typeof autoReveal === 'boolean' && autoReveal) {
                const currentActiveResource = this.getResourceForCurrentActiveResource();
                this.widget.revealMarkers(currentActiveResource, focus, this.lastSelectedRelativeTop);
            }
        }
        getResourceForCurrentActiveResource() {
            return this.currentActiveResource ? this.markersModel.getResourceMarkers(this.currentActiveResource) : null;
        }
        updateRangeHighlights() {
            this.rangeHighlightDecorations.removeHighlightRange();
            if (dom.isActiveElement(this.widget.getHTMLElement())) {
                this.highlightCurrentSelectedMarkerRange();
            }
        }
        highlightCurrentSelectedMarkerRange() {
            const selections = this.widget.getSelection() ?? [];
            if (selections.length !== 1) {
                return;
            }
            const selection = selections[0];
            if (!(selection instanceof markersModel_1.Marker)) {
                return;
            }
            this.rangeHighlightDecorations.highlightRange(selection);
        }
        onContextMenu(e) {
            const element = e.element;
            if (!element) {
                return;
            }
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                menuId: actions_2.MenuId.ProblemsPanelContext,
                contextKeyService: this.widget.contextKeyService,
                getActions: () => this.getMenuActions(element),
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionViewItems_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.widget.domFocus();
                    }
                }
            });
        }
        getMenuActions(element) {
            const result = [];
            if (element instanceof markersModel_1.Marker) {
                const viewModel = this.markersViewModel.getViewModel(element);
                if (viewModel) {
                    const quickFixActions = viewModel.quickFixAction.quickFixes;
                    if (quickFixActions.length) {
                        result.push(...quickFixActions);
                        result.push(new actions_1.Separator());
                    }
                }
            }
            return result;
        }
        getFocusElement() {
            return this.widget.getFocus()[0] ?? undefined;
        }
        getFocusedSelectedElements() {
            const focus = this.getFocusElement();
            if (!focus) {
                return null;
            }
            const selection = this.widget.getSelection();
            if (selection.includes(focus)) {
                const result = [];
                for (const selected of selection) {
                    if (selected) {
                        result.push(selected);
                    }
                }
                return result;
            }
            else {
                return [focus];
            }
        }
        getAllResourceMarkers() {
            return this.markersModel.resourceMarkers;
        }
        getFilterStats() {
            if (!this.cachedFilterStats) {
                this.cachedFilterStats = {
                    total: this.markersModel.total,
                    filtered: this.widget?.getVisibleItemCount() ?? 0
                };
            }
            return this.cachedFilterStats;
        }
        toggleVisibility(hide) {
            this.widget.toggleVisibility(hide);
            this.layoutBodyContent();
        }
        saveState() {
            this.panelState['filter'] = this.filterWidget.getFilterText();
            this.panelState['filterHistory'] = this.filters.filterHistory;
            this.panelState['showErrors'] = this.filters.showErrors;
            this.panelState['showWarnings'] = this.filters.showWarnings;
            this.panelState['showInfos'] = this.filters.showInfos;
            this.panelState['useFilesExclude'] = this.filters.excludedFiles;
            this.panelState['activeFile'] = this.filters.activeFile;
            this.panelState['multiline'] = this.markersViewModel.multiline;
            this.panelState['viewMode'] = this.markersViewModel.viewMode;
            this.memento.saveMemento();
            super.saveState();
        }
        dispose() {
            super.dispose();
        }
    };
    exports.MarkersView = MarkersView;
    exports.MarkersView = MarkersView = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, markers_1.IMarkerService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, uriIdentity_1.IUriIdentityService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, storage_1.IStorageService),
        __param(13, opener_1.IOpenerService),
        __param(14, themeService_1.IThemeService)
    ], MarkersView);
    let MarkersTree = class MarkersTree extends listService_1.WorkbenchObjectTree {
        constructor(user, container, delegate, renderers, options, instantiationService, contextKeyService, listService, themeService, configurationService) {
            super(user, container, delegate, renderers, options, instantiationService, contextKeyService, listService, configurationService);
            this.container = container;
            this.visibilityContextKey = markers_2.MarkersContextKeys.MarkersTreeVisibilityContextKey.bindTo(contextKeyService);
        }
        collapseMarkers() {
            this.collapseAll();
            this.setSelection([]);
            this.setFocus([]);
            this.getHTMLElement().focus();
            this.focusFirst();
        }
        filterMarkers() {
            this.refilter();
        }
        getVisibleItemCount() {
            let filtered = 0;
            const root = this.getNode();
            for (const resourceMarkerNode of root.children) {
                for (const markerNode of resourceMarkerNode.children) {
                    if (resourceMarkerNode.visible && markerNode.visible) {
                        filtered++;
                    }
                }
            }
            return filtered;
        }
        isVisible() {
            return !this.container.classList.contains('hidden');
        }
        toggleVisibility(hide) {
            this.visibilityContextKey.set(!hide);
            this.container.classList.toggle('hidden', hide);
        }
        reset(resourceMarkers) {
            this.setChildren(null, iterator_1.Iterable.map(resourceMarkers, m => ({ element: m, children: createResourceMarkersIterator(m) })));
        }
        revealMarkers(activeResource, focus, lastSelectedRelativeTop) {
            if (activeResource) {
                if (this.hasElement(activeResource)) {
                    if (!this.isCollapsed(activeResource) && this.hasSelectedMarkerFor(activeResource)) {
                        this.reveal(this.getSelection()[0], lastSelectedRelativeTop);
                        if (focus) {
                            this.setFocus(this.getSelection());
                        }
                    }
                    else {
                        this.expand(activeResource);
                        this.reveal(activeResource, 0);
                        if (focus) {
                            this.setFocus([activeResource]);
                            this.setSelection([activeResource]);
                        }
                    }
                }
            }
            else if (focus) {
                this.setSelection([]);
                this.focusFirst();
            }
        }
        setAriaLabel(label) {
            this.ariaLabel = label;
        }
        setMarkerSelection(selection, focus) {
            if (this.isVisible()) {
                if (selection && selection.length > 0) {
                    this.setSelection(selection.map(m => this.findMarkerNode(m)));
                    if (focus && focus.length > 0) {
                        this.setFocus(focus.map(f => this.findMarkerNode(f)));
                    }
                    else {
                        this.setFocus([this.findMarkerNode(selection[0])]);
                    }
                    this.reveal(this.findMarkerNode(selection[0]));
                }
                else if (this.getSelection().length === 0) {
                    const firstVisibleElement = this.firstVisibleElement;
                    const marker = firstVisibleElement ?
                        firstVisibleElement instanceof markersModel_1.ResourceMarkers ? firstVisibleElement.markers[0] :
                            firstVisibleElement instanceof markersModel_1.Marker ? firstVisibleElement : undefined
                        : undefined;
                    if (marker) {
                        this.setSelection([marker]);
                        this.setFocus([marker]);
                        this.reveal(marker);
                    }
                }
            }
        }
        update(resourceMarkers) {
            for (const resourceMarker of resourceMarkers) {
                if (this.hasElement(resourceMarker)) {
                    this.setChildren(resourceMarker, createResourceMarkersIterator(resourceMarker));
                    this.rerender(resourceMarker);
                }
            }
        }
        updateMarker(marker) {
            this.rerender(marker);
        }
        findMarkerNode(marker) {
            for (const resourceNode of this.getNode().children) {
                for (const markerNode of resourceNode.children) {
                    if (markerNode.element instanceof markersModel_1.Marker && markerNode.element.marker === marker.marker) {
                        return markerNode.element;
                    }
                }
            }
            return null;
        }
        hasSelectedMarkerFor(resource) {
            const selectedElement = this.getSelection();
            if (selectedElement && selectedElement.length > 0) {
                if (selectedElement[0] instanceof markersModel_1.Marker) {
                    if (resource.has(selectedElement[0].marker.resource)) {
                        return true;
                    }
                }
            }
            return false;
        }
        dispose() {
            super.dispose();
        }
        layout(height, width) {
            this.container.style.height = `${height}px`;
            super.layout(height, width);
        }
    };
    MarkersTree = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, listService_1.IListService),
        __param(8, themeService_1.IThemeService),
        __param(9, configuration_1.IConfigurationService)
    ], MarkersTree);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtlcnMvYnJvd3Nlci9tYXJrZXJzVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzRGhHLFNBQVMsNkJBQTZCLENBQUMsZUFBZ0M7UUFDdEUsT0FBTyxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ2hELE1BQU0sb0JBQW9CLEdBQUcsbUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDakUsTUFBTSxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUE2Qk0sSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHlCQUFjO1FBK0I5QyxZQUNDLE9BQXlCLEVBQ0Ysb0JBQTJDLEVBQzFDLHFCQUE2QyxFQUNyRCxhQUE4QyxFQUN2QyxvQkFBMkMsRUFDL0MsZ0JBQW1DLEVBQ3RDLGFBQThDLEVBQzFDLGlCQUFxQyxFQUMvQix1QkFBa0UsRUFDdkUsa0JBQXVDLEVBQ3ZDLGtCQUF3RCxFQUN6RCxpQkFBcUMsRUFDeEMsY0FBK0IsRUFDaEMsYUFBNkIsRUFDOUIsWUFBMkI7WUFFMUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLGlCQUFPLENBQUMsdUJBQXVCLEVBQUUsY0FBYyxDQUFD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