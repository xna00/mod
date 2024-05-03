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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configurationRegistry", "vs/platform/action/common/actionCommonCategories", "vs/platform/keybinding/common/keybindingsRegistry", "vs/nls", "vs/workbench/contrib/markers/browser/markersModel", "vs/workbench/contrib/markers/browser/markersView", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/contrib/markers/common/markers", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/common/contributions", "vs/platform/clipboard/common/clipboardService", "vs/base/common/lifecycle", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/markers/common/markers", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/common/contextkeys", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/services/activity/common/activity", "vs/workbench/browser/parts/views/viewFilter", "vs/platform/configuration/common/configuration", "vs/workbench/common/configuration", "vs/workbench/contrib/markers/browser/markersFileDecorations"], function (require, exports, contextkey_1, configurationRegistry_1, actionCommonCategories_1, keybindingsRegistry_1, nls_1, markersModel_1, markersView_1, actions_1, platform_1, markers_1, messages_1, contributions_1, clipboardService_1, lifecycle_1, statusbar_1, markers_2, views_1, viewsService_1, contextkeys_1, viewPaneContainer_1, descriptors_1, codicons_1, iconRegistry_1, viewPane_1, activity_1, viewFilter_1, configuration_1, configuration_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_OPEN_ACTION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(markers_1.MarkersContextKeys.MarkerFocusContextKey),
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        handler: (accessor, args) => {
            const markersView = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(markers_1.Markers.MARKERS_VIEW_ID);
            markersView.openFileAtElement(markersView.getFocusElement(), false, false, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_OPEN_SIDE_ACTION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(markers_1.MarkersContextKeys.MarkerFocusContextKey),
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        mac: {
            primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */
        },
        handler: (accessor, args) => {
            const markersView = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(markers_1.Markers.MARKERS_VIEW_ID);
            markersView.openFileAtElement(markersView.getFocusElement(), false, true, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_SHOW_PANEL_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: undefined,
        handler: async (accessor, args) => {
            await accessor.get(viewsService_1.IViewsService).openView(markers_1.Markers.MARKERS_VIEW_ID);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: markers_1.Markers.MARKER_SHOW_QUICK_FIX,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: markers_1.MarkersContextKeys.MarkerFocusContextKey,
        primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
        handler: (accessor, args) => {
            const markersView = accessor.get(viewsService_1.IViewsService).getActiveViewWithId(markers_1.Markers.MARKERS_VIEW_ID);
            const focusedElement = markersView.getFocusElement();
            if (focusedElement instanceof markersModel_1.Marker) {
                markersView.showQuickFixes(focusedElement);
            }
        }
    });
    // configuration
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        ...configuration_2.problemsConfigurationNodeBase,
        'properties': {
            'problems.autoReveal': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_AUTO_REVEAL,
                'type': 'boolean',
                'default': true
            },
            'problems.defaultViewMode': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_VIEW_MODE,
                'type': 'string',
                'default': 'tree',
                'enum': ['table', 'tree'],
            },
            'problems.showCurrentInStatus': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_SHOW_CURRENT_STATUS,
                'type': 'boolean',
                'default': false
            },
            'problems.sortOrder': {
                'description': messages_1.default.PROBLEMS_PANEL_CONFIGURATION_COMPARE_ORDER,
                'type': 'string',
                'default': 'severity',
                'enum': ['severity', 'position'],
                'enumDescriptions': [
                    messages_1.default.PROBLEMS_PANEL_CONFIGURATION_COMPARE_ORDER_SEVERITY,
                    messages_1.default.PROBLEMS_PANEL_CONFIGURATION_COMPARE_ORDER_POSITION,
                ],
            },
        }
    });
    const markersViewIcon = (0, iconRegistry_1.registerIcon)('markers-view-icon', codicons_1.Codicon.warning, (0, nls_1.localize)('markersViewIcon', 'View icon of the markers view.'));
    // markers view container
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: markers_1.Markers.MARKERS_CONTAINER_ID,
        title: messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS,
        icon: markersViewIcon,
        hideIfEmpty: true,
        order: 0,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [markers_1.Markers.MARKERS_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
        storageId: markers_1.Markers.MARKERS_VIEW_STORAGE_ID,
    }, 1 /* ViewContainerLocation.Panel */, { doNotRegisterOpenCommand: true });
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: markers_1.Markers.MARKERS_VIEW_ID,
            containerIcon: markersViewIcon,
            name: messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS,
            canToggleVisibility: false,
            canMoveView: true,
            ctorDescriptor: new descriptors_1.SyncDescriptor(markersView_1.MarkersView),
            openCommandActionDescriptor: {
                id: 'workbench.actions.view.problems',
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMarker', comment: ['&& denotes a mnemonic'] }, "&&Problems"),
                keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 43 /* KeyCode.KeyM */ },
                order: 0,
            }
        }], VIEW_CONTAINER);
    // workbench
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    // actions
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.table.${markers_1.Markers.MARKERS_VIEW_ID}.viewAsTree`,
                title: (0, nls_1.localize)('viewAsTree', "View as Tree"),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersViewModeContextKey.isEqualTo("table" /* MarkersViewMode.Table */)),
                    group: 'navigation',
                    order: 3
                },
                icon: codicons_1.Codicon.listTree,
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.setViewMode("tree" /* MarkersViewMode.Tree */);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.table.${markers_1.Markers.MARKERS_VIEW_ID}.viewAsTable`,
                title: (0, nls_1.localize)('viewAsTable', "View as Table"),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersViewModeContextKey.isEqualTo("tree" /* MarkersViewMode.Tree */)),
                    group: 'navigation',
                    order: 3
                },
                icon: codicons_1.Codicon.listFlat,
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.setViewMode("table" /* MarkersViewMode.Table */);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleErrors`,
                title: (0, nls_1.localize)('show errors', "Show Errors"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowErrorsFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 1
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showErrors = !view.filters.showErrors;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleWarnings`,
                title: (0, nls_1.localize)('show warnings', "Show Warnings"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowWarningsFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 2
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showWarnings = !view.filters.showWarnings;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleInfos`,
                title: (0, nls_1.localize)('show infos', "Show Infos"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowInfoFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '1_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 3
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.showInfos = !view.filters.showInfos;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleActiveFile`,
                title: (0, nls_1.localize)('show active file', "Show Active File Only"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowActiveFileFilterContextKey,
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '2_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 1
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.activeFile = !view.filters.activeFile;
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.${markers_1.Markers.MARKERS_VIEW_ID}.toggleExcludedFiles`,
                title: (0, nls_1.localize)('show excluded files', "Show Excluded Files"),
                category: (0, nls_1.localize)('problems', "Problems"),
                toggled: markers_1.MarkersContextKeys.ShowExcludedFilesFilterContextKey.negate(),
                menu: {
                    id: viewFilter_1.viewFilterSubmenu,
                    group: '2_filter',
                    when: contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID),
                    order: 2
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            view.filters.excludedFiles = !view.filters.excludedFiles;
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.problems.focus',
                title: messages_1.default.MARKERS_PANEL_SHOW_LABEL,
                category: actionCommonCategories_1.Categories.View,
                f1: true,
            });
        }
        async run(accessor) {
            accessor.get(viewsService_1.IViewsService).openView(markers_1.Markers.MARKERS_VIEW_ID, true);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            const when = contextkey_1.ContextKeyExpr.and(contextkeys_1.FocusedViewContext.isEqualTo(markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersTreeVisibilityContextKey, markers_1.MarkersContextKeys.RelatedInformationFocusContextKey.toNegated());
            super({
                id: markers_1.Markers.MARKER_COPY_ACTION_ID,
                title: (0, nls_1.localize2)('copyMarker', 'Copy'),
                menu: {
                    id: actions_1.MenuId.ProblemsPanelContext,
                    when,
                    group: 'navigation'
                },
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                    when
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            const clipboardService = serviceAccessor.get(clipboardService_1.IClipboardService);
            const selection = markersView.getFocusedSelectedElements() || markersView.getAllResourceMarkers();
            const markers = [];
            const addMarker = (marker) => {
                if (!markers.includes(marker)) {
                    markers.push(marker);
                }
            };
            for (const selected of selection) {
                if (selected instanceof markersModel_1.ResourceMarkers) {
                    selected.markers.forEach(addMarker);
                }
                else if (selected instanceof markersModel_1.Marker) {
                    addMarker(selected);
                }
            }
            if (markers.length) {
                await clipboardService.writeText(`[${markers}]`);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKER_COPY_MESSAGE_ACTION_ID,
                title: (0, nls_1.localize2)('copyMessage', 'Copy Message'),
                menu: {
                    id: actions_1.MenuId.ProblemsPanelContext,
                    when: markers_1.MarkersContextKeys.MarkerFocusContextKey,
                    group: 'navigation'
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            const clipboardService = serviceAccessor.get(clipboardService_1.IClipboardService);
            const element = markersView.getFocusElement();
            if (element instanceof markersModel_1.Marker) {
                await clipboardService.writeText(element.marker.message);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.RELATED_INFORMATION_COPY_MESSAGE_ACTION_ID,
                title: (0, nls_1.localize2)('copyMessage', 'Copy Message'),
                menu: {
                    id: actions_1.MenuId.ProblemsPanelContext,
                    when: markers_1.MarkersContextKeys.RelatedInformationFocusContextKey,
                    group: 'navigation'
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            const clipboardService = serviceAccessor.get(clipboardService_1.IClipboardService);
            const element = markersView.getFocusElement();
            if (element instanceof markersModel_1.RelatedInformation) {
                await clipboardService.writeText(element.raw.message);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.FOCUS_PROBLEMS_FROM_FILTER,
                title: (0, nls_1.localize)('focusProblemsList', "Focus problems view"),
                keybinding: {
                    when: markers_1.MarkersContextKeys.MarkerViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_FOCUS_FILTER,
                title: (0, nls_1.localize)('focusProblemsFilter', "Focus problems filter"),
                keybinding: {
                    when: contextkeys_1.FocusedViewContext.isEqualTo(markers_1.Markers.MARKERS_VIEW_ID),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.focusFilter();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_SHOW_MULTILINE_MESSAGE,
                title: (0, nls_1.localize2)('show multiline', "Show message in multiple lines"),
                category: (0, nls_1.localize)('problems', "Problems"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.has((0, contextkeys_1.getVisbileViewContextKey)(markers_1.Markers.MARKERS_VIEW_ID))
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.setMultiline(true);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_SHOW_SINGLELINE_MESSAGE,
                title: (0, nls_1.localize2)('show singleline', "Show message in single line"),
                category: (0, nls_1.localize)('problems', "Problems"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.has((0, contextkeys_1.getVisbileViewContextKey)(markers_1.Markers.MARKERS_VIEW_ID))
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.setMultiline(false);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: markers_1.Markers.MARKERS_VIEW_CLEAR_FILTER_TEXT,
                title: (0, nls_1.localize)('clearFiltersText', "Clear filters text"),
                category: (0, nls_1.localize)('problems', "Problems"),
                keybinding: {
                    when: markers_1.MarkersContextKeys.MarkerViewFilterFocusContextKey,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, markersView) {
            markersView.clearFilterText();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.actions.treeView.${markers_1.Markers.MARKERS_VIEW_ID}.collapseAll`,
                title: (0, nls_1.localize)('collapseAll', "Collapse All"),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', markers_1.Markers.MARKERS_VIEW_ID), markers_1.MarkersContextKeys.MarkersViewModeContextKey.isEqualTo("tree" /* MarkersViewMode.Tree */)),
                    group: 'navigation',
                    order: 2,
                },
                icon: codicons_1.Codicon.collapseAll,
                viewId: markers_1.Markers.MARKERS_VIEW_ID
            });
        }
        async runInView(serviceAccessor, view) {
            return view.collapseAll();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: markers_1.Markers.TOGGLE_MARKERS_VIEW_ACTION_ID,
                title: messages_1.default.MARKERS_PANEL_TOGGLE_LABEL,
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            if (viewsService.isViewVisible(markers_1.Markers.MARKERS_VIEW_ID)) {
                viewsService.closeView(markers_1.Markers.MARKERS_VIEW_ID);
            }
            else {
                viewsService.openView(markers_1.Markers.MARKERS_VIEW_ID, true);
            }
        }
    });
    let MarkersStatusBarContributions = class MarkersStatusBarContributions extends lifecycle_1.Disposable {
        constructor(markerService, statusbarService, configurationService) {
            super();
            this.markerService = markerService;
            this.statusbarService = statusbarService;
            this.configurationService = configurationService;
            this.markersStatusItem = this._register(this.statusbarService.addEntry(this.getMarkersItem(), 'status.problems', 0 /* StatusbarAlignment.LEFT */, 50 /* Medium Priority */));
            const addStatusBarEntry = () => {
                this.markersStatusItemOff = this.statusbarService.addEntry(this.getMarkersItemTurnedOff(), 'status.problemsVisibility', 0 /* StatusbarAlignment.LEFT */, 49);
            };
            // Add the status bar entry if the problems is not visible
            let config = this.configurationService.getValue('problems.visibility');
            if (!config) {
                addStatusBarEntry();
            }
            this._register(this.markerService.onMarkerChanged(() => {
                this.markersStatusItem.update(this.getMarkersItem());
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('problems.visibility')) {
                    this.markersStatusItem.update(this.getMarkersItem());
                    // Update based on what setting was changed to.
                    config = this.configurationService.getValue('problems.visibility');
                    if (!config && !this.markersStatusItemOff) {
                        addStatusBarEntry();
                    }
                    else if (config && this.markersStatusItemOff) {
                        this.markersStatusItemOff.dispose();
                        this.markersStatusItemOff = undefined;
                    }
                }
            }));
        }
        getMarkersItem() {
            const markersStatistics = this.markerService.getStatistics();
            const tooltip = this.getMarkersTooltip(markersStatistics);
            return {
                name: (0, nls_1.localize)('status.problems', "Problems"),
                text: this.getMarkersText(markersStatistics),
                ariaLabel: tooltip,
                tooltip,
                command: 'workbench.actions.view.toggleProblems'
            };
        }
        getMarkersItemTurnedOff() {
            // Update to true, config checked before `getMarkersItemTurnedOff` is called.
            this.statusbarService.updateEntryVisibility('status.problemsVisibility', true);
            const openSettingsCommand = 'workbench.action.openSettings';
            const configureSettingsLabel = '@id:problems.visibility';
            const tooltip = (0, nls_1.localize)('status.problemsVisibilityOff', "Problems are turned off. Click to open settings.");
            return {
                name: (0, nls_1.localize)('status.problemsVisibility', "Problems Visibility"),
                text: '$(whole-word)',
                ariaLabel: tooltip,
                tooltip,
                kind: 'warning',
                command: { title: openSettingsCommand, arguments: [configureSettingsLabel], id: openSettingsCommand }
            };
        }
        getMarkersTooltip(stats) {
            const errorTitle = (n) => (0, nls_1.localize)('totalErrors', "Errors: {0}", n);
            const warningTitle = (n) => (0, nls_1.localize)('totalWarnings', "Warnings: {0}", n);
            const infoTitle = (n) => (0, nls_1.localize)('totalInfos', "Infos: {0}", n);
            const titles = [];
            if (stats.errors > 0) {
                titles.push(errorTitle(stats.errors));
            }
            if (stats.warnings > 0) {
                titles.push(warningTitle(stats.warnings));
            }
            if (stats.infos > 0) {
                titles.push(infoTitle(stats.infos));
            }
            if (titles.length === 0) {
                return (0, nls_1.localize)('noProblems', "No Problems");
            }
            return titles.join(', ');
        }
        getMarkersText(stats) {
            const problemsText = [];
            // Errors
            problemsText.push('$(error) ' + this.packNumber(stats.errors));
            // Warnings
            problemsText.push('$(warning) ' + this.packNumber(stats.warnings));
            // Info (only if any)
            if (stats.infos > 0) {
                problemsText.push('$(info) ' + this.packNumber(stats.infos));
            }
            return problemsText.join(' ');
        }
        packNumber(n) {
            const manyProblems = (0, nls_1.localize)('manyProblems', "10K+");
            return n > 9999 ? manyProblems : n > 999 ? n.toString().charAt(0) + 'K' : n.toString();
        }
    };
    MarkersStatusBarContributions = __decorate([
        __param(0, markers_2.IMarkerService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, configuration_1.IConfigurationService)
    ], MarkersStatusBarContributions);
    workbenchRegistry.registerWorkbenchContribution(MarkersStatusBarContributions, 3 /* LifecyclePhase.Restored */);
    let ActivityUpdater = class ActivityUpdater extends lifecycle_1.Disposable {
        constructor(activityService, markerService) {
            super();
            this.activityService = activityService;
            this.markerService = markerService;
            this.activity = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.markerService.onMarkerChanged(() => this.updateBadge()));
            this.updateBadge();
        }
        updateBadge() {
            const { errors, warnings, infos } = this.markerService.getStatistics();
            const total = errors + warnings + infos;
            if (total > 0) {
                const message = (0, nls_1.localize)('totalProblems', 'Total {0} Problems', total);
                this.activity.value = this.activityService.showViewActivity(markers_1.Markers.MARKERS_VIEW_ID, { badge: new activity_1.NumberBadge(total, () => message) });
            }
            else {
                this.activity.value = undefined;
            }
        }
    };
    ActivityUpdater = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, markers_2.IMarkerService)
    ], ActivityUpdater);
    workbenchRegistry.registerWorkbenchContribution(ActivityUpdater, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vycy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtlcnMvYnJvd3Nlci9tYXJrZXJzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQW9DaEcseUNBQW1CLENBQUMsZ0NBQWdDLENBQUM7UUFDcEQsRUFBRSxFQUFFLGlCQUFPLENBQUMscUJBQXFCO1FBQ2pDLE1BQU0sNkNBQW1DO1FBQ3pDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw0QkFBa0IsQ0FBQyxxQkFBcUIsQ0FBQztRQUNsRSxPQUFPLHVCQUFlO1FBQ3RCLEdBQUcsRUFBRTtZQUNKLE9BQU8sdUJBQWU7WUFDdEIsU0FBUyxFQUFFLENBQUMsc0RBQWtDLENBQUM7U0FDL0M7UUFDRCxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBUyxFQUFFLEVBQUU7WUFDaEMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBYSxDQUFDLENBQUMsbUJBQW1CLENBQWMsaUJBQU8sQ0FBQyxlQUFlLENBQUUsQ0FBQztZQUMzRyxXQUFXLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEYsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1FBQ3BELEVBQUUsRUFBRSxpQkFBTyxDQUFDLDBCQUEwQjtRQUN0QyxNQUFNLDZDQUFtQztRQUN6QyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsNEJBQWtCLENBQUMscUJBQXFCLENBQUM7UUFDbEUsT0FBTyxFQUFFLGlEQUE4QjtRQUN2QyxH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