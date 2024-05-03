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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/network", "vs/base/common/path", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/platform/markers/common/markers", "vs/workbench/contrib/markers/browser/markersModel", "vs/workbench/contrib/markers/browser/messages", "vs/platform/instantiation/common/instantiation", "vs/base/common/themables", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/markers/browser/markersViewActions", "vs/platform/label/common/label", "vs/base/common/resources", "vs/workbench/contrib/markers/browser/markersFilterOptions", "vs/base/common/event", "vs/base/common/types", "vs/base/common/actions", "vs/nls", "vs/base/common/async", "vs/editor/common/services/model", "vs/editor/common/core/range", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/workbench/services/editor/common/editorService", "vs/platform/severityIcon/browser/severityIcon", "vs/platform/opener/common/opener", "vs/platform/files/common/files", "vs/platform/progress/common/progress", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/platform/opener/browser/link", "vs/editor/common/services/languageFeatures", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/markers/common/markers", "vs/platform/markers/common/markerService", "vs/platform/theme/browser/defaultStyles", "vs/base/common/severity", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, dom, network, paths, countBadge_1, highlightedLabel_1, markers_1, markersModel_1, messages_1, instantiation_1, themables_1, lifecycle_1, actionbar_1, markersViewActions_1, label_1, resources_1, markersFilterOptions_1, event_1, types_1, actions_1, nls_1, async_1, model_1, range_1, codeAction_1, types_2, editorService_1, severityIcon_1, opener_1, files_1, progress_1, actionViewItems_1, codicons_1, iconRegistry_1, link_1, languageFeatures_1, contextkey_1, markers_2, markerService_1, defaultStyles_1, severity_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersViewModel = exports.MarkerViewModel = exports.Filter = exports.RelatedInformationRenderer = exports.MarkerRenderer = exports.FileResourceMarkersRenderer = exports.ResourceMarkersRenderer = exports.VirtualDelegate = exports.MarkersWidgetAccessibilityProvider = void 0;
    let MarkersWidgetAccessibilityProvider = class MarkersWidgetAccessibilityProvider {
        constructor(labelService) {
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('problemsView', "Problems View");
        }
        getAriaLabel(element) {
            if (element instanceof markersModel_1.ResourceMarkers) {
                const path = this.labelService.getUriLabel(element.resource, { relative: true }) || element.resource.fsPath;
                return messages_1.default.MARKERS_TREE_ARIA_LABEL_RESOURCE(element.markers.length, element.name, paths.dirname(path));
            }
            if (element instanceof markersModel_1.Marker || element instanceof markersModel_1.MarkerTableItem) {
                return messages_1.default.MARKERS_TREE_ARIA_LABEL_MARKER(element);
            }
            if (element instanceof markersModel_1.RelatedInformation) {
                return messages_1.default.MARKERS_TREE_ARIA_LABEL_RELATED_INFORMATION(element.raw);
            }
            return null;
        }
    };
    exports.MarkersWidgetAccessibilityProvider = MarkersWidgetAccessibilityProvider;
    exports.MarkersWidgetAccessibilityProvider = MarkersWidgetAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], MarkersWidgetAccessibilityProvider);
    var TemplateId;
    (function (TemplateId) {
        TemplateId["ResourceMarkers"] = "rm";
        TemplateId["Marker"] = "m";
        TemplateId["RelatedInformation"] = "ri";
    })(TemplateId || (TemplateId = {}));
    class VirtualDelegate {
        static { this.LINE_HEIGHT = 22; }
        constructor(markersViewState) {
            this.markersViewState = markersViewState;
        }
        getHeight(element) {
            if (element instanceof markersModel_1.Marker) {
                const viewModel = this.markersViewState.getViewModel(element);
                const noOfLines = !viewModel || viewModel.multiline ? element.lines.length : 1;
                return noOfLines * VirtualDelegate.LINE_HEIGHT;
            }
            return VirtualDelegate.LINE_HEIGHT;
        }
        getTemplateId(element) {
            if (element instanceof markersModel_1.ResourceMarkers) {
                return "rm" /* TemplateId.ResourceMarkers */;
            }
            else if (element instanceof markersModel_1.Marker) {
                return "m" /* TemplateId.Marker */;
            }
            else {
                return "ri" /* TemplateId.RelatedInformation */;
            }
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
    var FilterDataType;
    (function (FilterDataType) {
        FilterDataType[FilterDataType["ResourceMarkers"] = 0] = "ResourceMarkers";
        FilterDataType[FilterDataType["Marker"] = 1] = "Marker";
        FilterDataType[FilterDataType["RelatedInformation"] = 2] = "RelatedInformation";
    })(FilterDataType || (FilterDataType = {}));
    let ResourceMarkersRenderer = class ResourceMarkersRenderer {
        constructor(labels, onDidChangeRenderNodeCount, labelService, fileService) {
            this.labels = labels;
            this.labelService = labelService;
            this.fileService = fileService;
            this.renderedNodes = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
            this.templateId = "rm" /* TemplateId.ResourceMarkers */;
            onDidChangeRenderNodeCount(this.onDidChangeRenderNodeCount, this, this.disposables);
        }
        renderTemplate(container) {
            const resourceLabelContainer = dom.append(container, dom.$('.resource-label-container'));
            const resourceLabel = this.labels.create(resourceLabelContainer, { supportHighlights: true });
            const badgeWrapper = dom.append(container, dom.$('.count-badge-wrapper'));
            const count = new countBadge_1.CountBadge(badgeWrapper, {}, defaultStyles_1.defaultCountBadgeStyles);
            return { count, resourceLabel };
        }
        renderElement(node, _, templateData) {
            const resourceMarkers = node.element;
            const uriMatches = node.filterData && node.filterData.uriMatches || [];
            if (this.fileService.hasProvider(resourceMarkers.resource) || resourceMarkers.resource.scheme === network.Schemas.untitled) {
                templateData.resourceLabel.setFile(resourceMarkers.resource, { matches: uriMatches });
            }
            else {
                templateData.resourceLabel.setResource({ name: resourceMarkers.name, description: this.labelService.getUriLabel((0, resources_1.dirname)(resourceMarkers.resource), { relative: true }), resource: resourceMarkers.resource }, { matches: uriMatches });
            }
            this.updateCount(node, templateData);
            const nodeRenders = this.renderedNodes.get(resourceMarkers) ?? [];
            this.renderedNodes.set(resourceMarkers, [...nodeRenders, templateData]);
        }
        disposeElement(node, index, templateData) {
            const nodeRenders = this.renderedNodes.get(node.element) ?? [];
            const nodeRenderIndex = nodeRenders.findIndex(nodeRender => templateData === nodeRender);
            if (nodeRenderIndex < 0) {
                throw new Error('Disposing unknown resource marker');
            }
            if (nodeRenders.length === 1) {
                this.renderedNodes.delete(node.element);
            }
            else {
                nodeRenders.splice(nodeRenderIndex, 1);
            }
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
        }
        onDidChangeRenderNodeCount(node) {
            const nodeRenders = this.renderedNodes.get(node.element);
            if (!nodeRenders) {
                return;
            }
            nodeRenders.forEach(nodeRender => this.updateCount(node, nodeRender));
        }
        updateCount(node, templateData) {
            templateData.count.setCount(node.children.reduce((r, n) => r + (n.visible ? 1 : 0), 0));
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    exports.ResourceMarkersRenderer = ResourceMarkersRenderer;
    exports.ResourceMarkersRenderer = ResourceMarkersRenderer = __decorate([
        __param(2, label_1.ILabelService),
        __param(3, files_1.IFileService)
    ], ResourceMarkersRenderer);
    class FileResourceMarkersRenderer extends ResourceMarkersRenderer {
    }
    exports.FileResourceMarkersRenderer = FileResourceMarkersRenderer;
    let MarkerRenderer = class MarkerRenderer {
        constructor(markersViewState, instantiationService, openerService) {
            this.markersViewState = markersViewState;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.templateId = "m" /* TemplateId.Marker */;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.markerWidget = new MarkerWidget(container, this.markersViewState, this.openerService, this.instantiationService);
            return data;
        }
        renderElement(node, _, templateData) {
            templateData.markerWidget.render(node.element, node.filterData);
        }
        disposeTemplate(templateData) {
            templateData.markerWidget.dispose();
        }
    };
    exports.MarkerRenderer = MarkerRenderer;
    exports.MarkerRenderer = MarkerRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, opener_1.IOpenerService)
    ], MarkerRenderer);
    const expandedIcon = (0, iconRegistry_1.registerIcon)('markers-view-multi-line-expanded', codicons_1.Codicon.chevronUp, (0, nls_1.localize)('expandedIcon', 'Icon indicating that multiple lines are shown in the markers view.'));
    const collapsedIcon = (0, iconRegistry_1.registerIcon)('markers-view-multi-line-collapsed', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('collapsedIcon', 'Icon indicating that multiple lines are collapsed in the markers view.'));
    const toggleMultilineAction = 'problems.action.toggleMultiline';
    class ToggleMultilineActionViewItem extends actionViewItems_1.ActionViewItem {
        render(container) {
            super.render(container);
            this.updateExpandedAttribute();
        }
        updateClass() {
            super.updateClass();
            this.updateExpandedAttribute();
        }
        updateExpandedAttribute() {
            this.element?.setAttribute('aria-expanded', `${this._action.class === themables_1.ThemeIcon.asClassName(expandedIcon)}`);
        }
    }
    class MarkerWidget extends lifecycle_1.Disposable {
        constructor(parent, markersViewModel, _openerService, _instantiationService) {
            super();
            this.parent = parent;
            this.markersViewModel = markersViewModel;
            this._openerService = _openerService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.actionBar = this._register(new actionbar_1.ActionBar(dom.append(parent, dom.$('.actions')), {
                actionViewItemProvider: (action, options) => action.id === markersViewActions_1.QuickFixAction.ID ? _instantiationService.createInstance(markersViewActions_1.QuickFixActionViewItem, action, options) : undefined
            }));
            // wrap the icon in a container that get the icon color as foreground color. That way, if the
            // list view does not have a specific color for the icon (=the color variable is invalid) it
            // falls back to the foreground color of container (inherit)
            this.iconContainer = dom.append(parent, dom.$(''));
            this.icon = dom.append(this.iconContainer, dom.$(''));
            this.messageAndDetailsContainer = dom.append(parent, dom.$('.marker-message-details-container'));
            this.messageAndDetailsContainerHover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.messageAndDetailsContainer, ''));
        }
        render(element, filterData) {
            this.actionBar.clear();
            this.disposables.clear();
            dom.clearNode(this.messageAndDetailsContainer);
            this.iconContainer.className = `marker-icon ${severity_1.default.toString(markers_1.MarkerSeverity.toSeverity(element.marker.severity))}`;
            this.icon.className = `codicon ${severityIcon_1.SeverityIcon.className(markers_1.MarkerSeverity.toSeverity(element.marker.severity))}`;
            this.renderQuickfixActionbar(element);
            this.renderMessageAndDetails(element, filterData);
            this.disposables.add(dom.addDisposableListener(this.parent, dom.EventType.MOUSE_OVER, () => this.markersViewModel.onMarkerMouseHover(element)));
            this.disposables.add(dom.addDisposableListener(this.parent, dom.EventType.MOUSE_LEAVE, () => this.markersViewModel.onMarkerMouseLeave(element)));
        }
        renderQuickfixActionbar(marker) {
            const viewModel = this.markersViewModel.getViewModel(marker);
            if (viewModel) {
                const quickFixAction = viewModel.quickFixAction;
                this.actionBar.push([quickFixAction], { icon: true, label: false });
                this.iconContainer.classList.toggle('quickFix', quickFixAction.enabled);
                quickFixAction.onDidChange(({ enabled }) => {
                    if (!(0, types_1.isUndefinedOrNull)(enabled)) {
                        this.iconContainer.classList.toggle('quickFix', enabled);
                    }
                }, this, this.disposables);
                quickFixAction.onShowQuickFixes(() => {
                    const quickFixActionViewItem = this.actionBar.viewItems[0];
                    if (quickFixActionViewItem) {
                        quickFixActionViewItem.showQuickFixes();
                    }
                }, this, this.disposables);
            }
        }
        renderMultilineActionbar(marker, parent) {
            const multilineActionbar = this.disposables.add(new actionbar_1.ActionBar(dom.append(parent, dom.$('.multiline-actions')), {
                actionViewItemProvider: (action, options) => {
                    if (action.id === toggleMultilineAction) {
                        return new ToggleMultilineActionViewItem(undefined, action, { ...options, icon: true });
                    }
                    return undefined;
                }
            }));
            this.disposables.add((0, lifecycle_1.toDisposable)(() => multilineActionbar.dispose()));
            const viewModel = this.markersViewModel.getViewModel(marker);
            const multiline = viewModel && viewModel.multiline;
            const action = new actions_1.Action(toggleMultilineAction);
            action.enabled = !!viewModel && marker.lines.length > 1;
            action.tooltip = multiline ? (0, nls_1.localize)('single line', "Show message in single line") : (0, nls_1.localize)('multi line', "Show message in multiple lines");
            action.class = themables_1.ThemeIcon.asClassName(multiline ? expandedIcon : collapsedIcon);
            action.run = () => { if (viewModel) {
                viewModel.multiline = !viewModel.multiline;
            } return Promise.resolve(); };
            multilineActionbar.push([action], { icon: true, label: false });
        }
        renderMessageAndDetails(element, filterData) {
            const { marker, lines } = element;
            const viewState = this.markersViewModel.getViewModel(element);
            const multiline = !viewState || viewState.multiline;
            const lineMatches = filterData && filterData.lineMatches || [];
            this.messageAndDetailsContainerHover.update(element.marker.message);
            const lineElements = [];
            for (let index = 0; index < (multiline ? lines.length : 1); index++) {
                const lineElement = dom.append(this.messageAndDetailsContainer, dom.$('.marker-message-line'));
                const messageElement = dom.append(lineElement, dom.$('.marker-message'));
                const highlightedLabel = this.disposables.add(new highlightedLabel_1.HighlightedLabel(messageElement));
                highlightedLabel.set(lines[index].length > 1000 ? `${lines[index].substring(0, 1000)}...` : lines[index], lineMatches[index]);
                if (lines[index] === '') {
                    lineElement.style.height = `${VirtualDelegate.LINE_HEIGHT}px`;
                }
                lineElements.push(lineElement);
            }
            this.renderDetails(marker, filterData, lineElements[0]);
            this.renderMultilineActionbar(element, lineElements[0]);
        }
        renderDetails(marker, filterData, parent) {
            parent.classList.add('details-container');
            if (marker.source || marker.code) {
                const source = this.disposables.add(new highlightedLabel_1.HighlightedLabel(dom.append(parent, dom.$('.marker-source'))));
                const sourceMatches = filterData && filterData.sourceMatches || [];
                source.set(marker.source, sourceMatches);
                if (marker.code) {
                    if (typeof marker.code === 'string') {
                        const code = this.disposables.add(new highlightedLabel_1.HighlightedLabel(dom.append(parent, dom.$('.marker-code'))));
                        const codeMatches = filterData && filterData.codeMatches || [];
                        code.set(marker.code, codeMatches);
                    }
                    else {
                        const container = dom.$('.marker-code');
                        const code = this.disposables.add(new highlightedLabel_1.HighlightedLabel(container));
                        const link = marker.code.target.toString(true);
                        this.disposables.add(new link_1.Link(parent, { href: link, label: container, title: link }, undefined, this._openerService));
                        const codeMatches = filterData && filterData.codeMatches || [];
                        code.set(marker.code.value, codeMatches);
                    }
                }
            }
            const lnCol = dom.append(parent, dom.$('span.marker-line'));
            lnCol.textContent = messages_1.default.MARKERS_PANEL_AT_LINE_COL_NUMBER(marker.startLineNumber, marker.startColumn);
        }
    }
    let RelatedInformationRenderer = class RelatedInformationRenderer {
        constructor(labelService) {
            this.labelService = labelService;
            this.templateId = "ri" /* TemplateId.RelatedInformation */;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            dom.append(container, dom.$('.actions'));
            dom.append(container, dom.$('.icon'));
            data.resourceLabel = new highlightedLabel_1.HighlightedLabel(dom.append(container, dom.$('.related-info-resource')));
            data.lnCol = dom.append(container, dom.$('span.marker-line'));
            const separator = dom.append(container, dom.$('span.related-info-resource-separator'));
            separator.textContent = ':';
            separator.style.paddingRight = '4px';
            data.description = new highlightedLabel_1.HighlightedLabel(dom.append(container, dom.$('.marker-description')));
            return data;
        }
        renderElement(node, _, templateData) {
            const relatedInformation = node.element.raw;
            const uriMatches = node.filterData && node.filterData.uriMatches || [];
            const messageMatches = node.filterData && node.filterData.messageMatches || [];
            const resourceLabelTitle = this.labelService.getUriLabel(relatedInformation.resource, { relative: true });
            templateData.resourceLabel.set((0, resources_1.basename)(relatedInformation.resource), uriMatches, resourceLabelTitle);
            templateData.lnCol.textContent = messages_1.default.MARKERS_PANEL_AT_LINE_COL_NUMBER(relatedInformation.startLineNumber, relatedInformation.startColumn);
            templateData.description.set(relatedInformation.message, messageMatches, relatedInformation.message);
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
            templateData.description.dispose();
        }
    };
    exports.RelatedInformationRenderer = RelatedInformationRenderer;
    exports.RelatedInformationRenderer = RelatedInformationRenderer = __decorate([
        __param(0, label_1.ILabelService)
    ], RelatedInformationRenderer);
    class Filter {
        constructor(options) {
            this.options = options;
        }
        filter(element, parentVisibility) {
            if (element instanceof markersModel_1.ResourceMarkers) {
                return this.filterResourceMarkers(element);
            }
            else if (element instanceof markersModel_1.Marker) {
                return this.filterMarker(element, parentVisibility);
            }
            else {
                return this.filterRelatedInformation(element, parentVisibility);
            }
        }
        filterResourceMarkers(resourceMarkers) {
            if (markerService_1.unsupportedSchemas.has(resourceMarkers.resource.scheme)) {
                return false;
            }
            // Filter resource by pattern first (globs)
            // Excludes pattern
            if (this.options.excludesMatcher.matches(resourceMarkers.resource)) {
                return false;
            }
            // Includes pattern
            if (this.options.includesMatcher.matches(resourceMarkers.resource)) {
                return true;
            }
            // Fiter by text. Do not apply negated filters on resources instead use exclude patterns
            if (this.options.textFilter.text && !this.options.textFilter.negate) {
                const uriMatches = markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, (0, resources_1.basename)(resourceMarkers.resource));
                if (uriMatches) {
                    return { visibility: true, data: { type: 0 /* FilterDataType.ResourceMarkers */, uriMatches: uriMatches || [] } };
                }
            }
            return 2 /* TreeVisibility.Recurse */;
        }
        filterMarker(marker, parentVisibility) {
            const matchesSeverity = this.options.showErrors && markers_1.MarkerSeverity.Error === marker.marker.severity ||
                this.options.showWarnings && markers_1.MarkerSeverity.Warning === marker.marker.severity ||
                this.options.showInfos && markers_1.MarkerSeverity.Info === marker.marker.severity;
            if (!matchesSeverity) {
                return false;
            }
            if (!this.options.textFilter.text) {
                return true;
            }
            const lineMatches = [];
            for (const line of marker.lines) {
                const lineMatch = markersFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, line);
                lineMatches.push(lineMatch || []);
            }
            const sourceMatches = marker.marker.source ? markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, marker.marker.source) : undefined;
            const codeMatches = marker.marker.code ? markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, typeof marker.marker.code === 'string' ? marker.marker.code : marker.marker.code.value) : undefined;
            const matched = sourceMatches || codeMatches || lineMatches.some(lineMatch => lineMatch.length > 0);
            // Matched and not negated
            if (matched && !this.options.textFilter.negate) {
                return { visibility: true, data: { type: 1 /* FilterDataType.Marker */, lineMatches, sourceMatches: sourceMatches || [], codeMatches: codeMatches || [] } };
            }
            // Matched and negated - exclude it only if parent visibility is not set
            if (matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return false;
            }
            // Not matched and negated - include it only if parent visibility is not set
            if (!matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return true;
            }
            return parentVisibility;
        }
        filterRelatedInformation(relatedInformation, parentVisibility) {
            if (!this.options.textFilter.text) {
                return true;
            }
            const uriMatches = markersFilterOptions_1.FilterOptions._filter(this.options.textFilter.text, (0, resources_1.basename)(relatedInformation.raw.resource));
            const messageMatches = markersFilterOptions_1.FilterOptions._messageFilter(this.options.textFilter.text, paths.basename(relatedInformation.raw.message));
            const matched = uriMatches || messageMatches;
            // Matched and not negated
            if (matched && !this.options.textFilter.negate) {
                return { visibility: true, data: { type: 2 /* FilterDataType.RelatedInformation */, uriMatches: uriMatches || [], messageMatches: messageMatches || [] } };
            }
            // Matched and negated - exclude it only if parent visibility is not set
            if (matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return false;
            }
            // Not matched and negated - include it only if parent visibility is not set
            if (!matched && this.options.textFilter.negate && parentVisibility === 2 /* TreeVisibility.Recurse */) {
                return true;
            }
            return parentVisibility;
        }
    }
    exports.Filter = Filter;
    let MarkerViewModel = class MarkerViewModel extends lifecycle_1.Disposable {
        constructor(marker, modelService, instantiationService, editorService, languageFeaturesService) {
            super();
            this.marker = marker;
            this.modelService = modelService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.languageFeaturesService = languageFeaturesService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.modelPromise = null;
            this.codeActionsPromise = null;
            this._multiline = true;
            this._quickFixAction = null;
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.modelPromise) {
                    this.modelPromise.cancel();
                }
                if (this.codeActionsPromise) {
                    this.codeActionsPromise.cancel();
                }
            }));
        }
        get multiline() {
            return this._multiline;
        }
        set multiline(value) {
            if (this._multiline !== value) {
                this._multiline = value;
                this._onDidChange.fire();
            }
        }
        get quickFixAction() {
            if (!this._quickFixAction) {
                this._quickFixAction = this._register(this.instantiationService.createInstance(markersViewActions_1.QuickFixAction, this.marker));
            }
            return this._quickFixAction;
        }
        showLightBulb() {
            this.setQuickFixes(true);
        }
        async setQuickFixes(waitForModel) {
            const codeActions = await this.getCodeActions(waitForModel);
            this.quickFixAction.quickFixes = codeActions ? this.toActions(codeActions) : [];
            this.quickFixAction.autoFixable(!!codeActions && codeActions.hasAutoFix);
        }
        getCodeActions(waitForModel) {
            if (this.codeActionsPromise !== null) {
                return this.codeActionsPromise;
            }
            return this.getModel(waitForModel)
                .then(model => {
                if (model) {
                    if (!this.codeActionsPromise) {
                        this.codeActionsPromise = (0, async_1.createCancelablePromise)(cancellationToken => {
                            return (0, codeAction_1.getCodeActions)(this.languageFeaturesService.codeActionProvider, model, new range_1.Range(this.marker.range.startLineNumber, this.marker.range.startColumn, this.marker.range.endLineNumber, this.marker.range.endColumn), {
                                type: 1 /* CodeActionTriggerType.Invoke */, triggerAction: types_2.CodeActionTriggerSource.ProblemsView, filter: { include: types_2.CodeActionKind.QuickFix }
                            }, progress_1.Progress.None, cancellationToken).then(actions => {
                                return this._register(actions);
                            });
                        });
                    }
                    return this.codeActionsPromise;
                }
                return null;
            });
        }
        toActions(codeActions) {
            return codeActions.validActions.map(item => new actions_1.Action(item.action.command ? item.action.command.id : item.action.title, item.action.title, undefined, true, () => {
                return this.openFileAtMarker(this.marker)
                    .then(() => this.instantiationService.invokeFunction(codeAction_1.applyCodeAction, item, codeAction_1.ApplyCodeActionReason.FromProblemsView));
            }));
        }
        openFileAtMarker(element) {
            const { resource, selection } = { resource: element.resource, selection: element.range };
            return this.editorService.openEditor({
                resource,
                options: {
                    selection,
                    preserveFocus: true,
                    pinned: false,
                    revealIfVisible: true
                },
            }, editorService_1.ACTIVE_GROUP).then(() => undefined);
        }
        getModel(waitForModel) {
            const model = this.modelService.getModel(this.marker.resource);
            if (model) {
                return Promise.resolve(model);
            }
            if (waitForModel) {
                if (!this.modelPromise) {
                    this.modelPromise = (0, async_1.createCancelablePromise)(cancellationToken => {
                        return new Promise((c) => {
                            this._register(this.modelService.onModelAdded(model => {
                                if ((0, resources_1.isEqual)(model.uri, this.marker.resource)) {
                                    c(model);
                                }
                            }));
                        });
                    });
                }
                return this.modelPromise;
            }
            return Promise.resolve(null);
        }
    };
    exports.MarkerViewModel = MarkerViewModel;
    exports.MarkerViewModel = MarkerViewModel = __decorate([
        __param(1, model_1.IModelService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, editorService_1.IEditorService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], MarkerViewModel);
    let MarkersViewModel = class MarkersViewModel extends lifecycle_1.Disposable {
        constructor(multiline = true, viewMode = "tree" /* MarkersViewMode.Tree */, contextKeyService, instantiationService) {
            super();
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onDidChangeViewMode = this._register(new event_1.Emitter());
            this.onDidChangeViewMode = this._onDidChangeViewMode.event;
            this.markersViewStates = new Map();
            this.markersPerResource = new Map();
            this.bulkUpdate = false;
            this.hoveredMarker = null;
            this.hoverDelayer = new async_1.Delayer(300);
            this._multiline = true;
            this._viewMode = "tree" /* MarkersViewMode.Tree */;
            this._multiline = multiline;
            this._viewMode = viewMode;
            this.viewModeContextKey = markers_2.MarkersContextKeys.MarkersViewModeContextKey.bindTo(this.contextKeyService);
            this.viewModeContextKey.set(viewMode);
        }
        add(marker) {
            if (!this.markersViewStates.has(marker.id)) {
                const viewModel = this.instantiationService.createInstance(MarkerViewModel, marker);
                const disposables = [viewModel];
                viewModel.multiline = this.multiline;
                viewModel.onDidChange(() => {
                    if (!this.bulkUpdate) {
                        this._onDidChange.fire(marker);
                    }
                }, this, disposables);
                this.markersViewStates.set(marker.id, { viewModel, disposables });
                const markers = this.markersPerResource.get(marker.resource.toString()) || [];
                markers.push(marker);
                this.markersPerResource.set(marker.resource.toString(), markers);
            }
        }
        remove(resource) {
            const markers = this.markersPerResource.get(resource.toString()) || [];
            for (const marker of markers) {
                const value = this.markersViewStates.get(marker.id);
                if (value) {
                    (0, lifecycle_1.dispose)(value.disposables);
                }
                this.markersViewStates.delete(marker.id);
                if (this.hoveredMarker === marker) {
                    this.hoveredMarker = null;
                }
            }
            this.markersPerResource.delete(resource.toString());
        }
        getViewModel(marker) {
            const value = this.markersViewStates.get(marker.id);
            return value ? value.viewModel : null;
        }
        onMarkerMouseHover(marker) {
            this.hoveredMarker = marker;
            this.hoverDelayer.trigger(() => {
                if (this.hoveredMarker) {
                    const model = this.getViewModel(this.hoveredMarker);
                    if (model) {
                        model.showLightBulb();
                    }
                }
            });
        }
        onMarkerMouseLeave(marker) {
            if (this.hoveredMarker === marker) {
                this.hoveredMarker = null;
            }
        }
        get multiline() {
            return this._multiline;
        }
        set multiline(value) {
            let changed = false;
            if (this._multiline !== value) {
                this._multiline = value;
                changed = true;
            }
            this.bulkUpdate = true;
            this.markersViewStates.forEach(({ viewModel }) => {
                if (viewModel.multiline !== value) {
                    viewModel.multiline = value;
                    changed = true;
                }
            });
            this.bulkUpdate = false;
            if (changed) {
                this._onDidChange.fire(undefined);
            }
        }
        get viewMode() {
            return this._viewMode;
        }
        set viewMode(value) {
            if (this._viewMode === value) {
                return;
            }
            this._viewMode = value;
            this._onDidChangeViewMode.fire(value);
            this.viewModeContextKey.set(value);
        }
        dispose() {
            this.markersViewStates.forEach(({ disposables }) => (0, lifecycle_1.dispose)(disposables));
            this.markersViewStates.clear();
            this.markersPerResource.clear();
            super.dispose();
        }
    };
    exports.MarkersViewModel = MarkersViewModel;
    exports.MarkersViewModel = MarkersViewModel = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, instantiation_1.IInstantiationService)
    ], MarkersViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc1RyZWVWaWV3ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtlcnMvYnJvd3Nlci9tYXJrZXJzVHJlZVZpZXdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvRXpGLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQWtDO1FBRTlDLFlBQTRDLFlBQTJCO1lBQTNCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1FBQUksQ0FBQztRQUU1RSxrQkFBa0I7WUFDakIsT0FBTyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVNLFlBQVksQ0FBQyxPQUF3QztZQUMzRCxJQUFJLE9BQU8sWUFBWSw4QkFBZSxFQUFFLENBQUM7Z0JBQ3hDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztnQkFDNUcsT0FBTyxrQkFBUSxDQUFDLGdDQUFnQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdHLENBQUM7WUFDRCxJQUFJLE9BQU8sWUFBWSxxQkFBTSxJQUFJLE9BQU8sWUFBWSw4QkFBZSxFQUFFLENBQUM7Z0JBQ3JFLE9BQU8sa0JBQVEsQ0FBQyw4QkFBOEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsSUFBSSxPQUFPLFlBQVksaUNBQWtCLEVBQUUsQ0FBQztnQkFDM0MsT0FB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