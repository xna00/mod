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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/list/listWidget", "vs/base/common/actions", "vs/base/common/arraysFind", "vs/base/common/async", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/themables", "vs/base/common/types", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/nls", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/actions/widgetNavigationCommands", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/views", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/explorerProjections/listProjection", "vs/workbench/contrib/testing/browser/explorerProjections/testItemContextOverlay", "vs/workbench/contrib/testing/browser/explorerProjections/testingObjectTree", "vs/workbench/contrib/testing/browser/explorerProjections/treeProjection", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testExplorerActions", "vs/workbench/contrib/testing/browser/testingExplorerFilter", "vs/workbench/contrib/testing/browser/testingProgressUiService", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingContinuousRunService", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/css!./media/testing"], function (require, exports, dom, actionbar_1, button_1, hoverDelegateFactory_1, updatableHoverWidget_1, iconLabels_1, listWidget_1, actions_1, arraysFind_1, async_1, color_1, event_1, lifecycle_1, strings_1, themables_1, types_1, markdownRenderer_1, nls_1, dropdownWithPrimaryActionViewItem_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, opener_1, progress_1, storage_1, telemetry_1, defaultStyles_1, colorRegistry_1, iconRegistry_1, themeService_1, uriIdentity_1, widgetNavigationCommands_1, viewPane_1, diffEditorInput_1, views_1, index_1, listProjection_1, testItemContextOverlay_1, testingObjectTree_1, treeProjection_1, icons, testExplorerActions_1, testingExplorerFilter_1, testingProgressUiService_1, configuration_2, constants_1, storedValue_1, testExplorerFilterState_1, testId_1, testProfileService_1, testResult_1, testResultService_1, testService_1, testingContextKeys_1, testingContinuousRunService_1, testingPeekOpener_1, testingStates_1, activity_1, editorService_1) {
    "use strict";
    var ErrorRenderer_1, TestItemRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingExplorerView = void 0;
    var LastFocusState;
    (function (LastFocusState) {
        LastFocusState[LastFocusState["Input"] = 0] = "Input";
        LastFocusState[LastFocusState["Tree"] = 1] = "Tree";
    })(LastFocusState || (LastFocusState = {}));
    let TestingExplorerView = class TestingExplorerView extends viewPane_1.ViewPane {
        get focusedTreeElements() {
            return this.viewModel.tree.getFocus().filter(types_1.isDefined);
        }
        constructor(options, contextMenuService, keybindingService, configurationService, instantiationService, viewDescriptorService, contextKeyService, openerService, themeService, testService, telemetryService, testProfileService, commandService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.testService = testService;
            this.testProfileService = testProfileService;
            this.commandService = commandService;
            this.filterActionBar = this._register(new lifecycle_1.MutableDisposable());
            this.discoveryProgress = this._register(new lifecycle_1.MutableDisposable());
            this.filter = this._register(new lifecycle_1.MutableDisposable());
            this.filterFocusListener = this._register(new lifecycle_1.MutableDisposable());
            this.dimensions = { width: 0, height: 0 };
            this.lastFocusState = 0 /* LastFocusState.Input */;
            const relayout = this._register(new async_1.RunOnceScheduler(() => this.layoutBody(), 1));
            this._register(this.onDidChangeViewWelcomeState(() => {
                if (!this.shouldShowWelcome()) {
                    relayout.schedule();
                }
            }));
            this._register(testService.collection.onBusyProvidersChange(busy => {
                this.updateDiscoveryProgress(busy);
            }));
            this._register(testProfileService.onDidChange(() => this.updateActions()));
        }
        shouldShowWelcome() {
            return this.viewModel?.welcomeExperience === 1 /* WelcomeExperience.ForWorkspace */ ?? true;
        }
        focus() {
            super.focus();
            if (this.lastFocusState === 1 /* LastFocusState.Tree */) {
                this.viewModel.tree.domFocus();
            }
            else {
                this.filter.value?.focus();
            }
        }
        /**
         * Gets include/exclude items in the tree, based either on visible tests
         * or a use selection.
         */
        getTreeIncludeExclude(withinItems, profile, filterToType = 'visible') {
            const projection = this.viewModel.projection.value;
            if (!projection) {
                return { include: [], exclude: [] };
            }
            // To calculate includes and excludes, we include the first children that
            // have a majority of their items included too, and then apply exclusions.
            const include = new Set();
            const exclude = [];
            const attempt = (element, alreadyIncluded) => {
                // sanity check hasElement since updates are debounced and they may exist
                // but not be rendered yet
                if (!(element instanceof index_1.TestItemTreeElement) || !this.viewModel.tree.hasElement(element)) {
                    return;
                }
                // If the current node is not visible or runnable in the current profile, it's excluded
                const inTree = this.viewModel.tree.getNode(element);
                if (!inTree.visible) {
                    if (alreadyIncluded) {
                        exclude.push(element.test);
                    }
                    return;
                }
                // If it's not already included but most of its children are, then add it
                // if it can be run under the current profile (when specified)
                if (
                // If it's not already included...
                !alreadyIncluded
                    // And it can be run using the current profile (if any)
                    && (!profile || (0, testProfileService_1.canUseProfileWithTest)(profile, element.test))
                    // And either it's a leaf node or most children are included, the  include it.
                    && (inTree.children.length === 0 || inTree.visibleChildrenCount * 2 >= inTree.children.length)
                    // And not if we're only showing a single of its children, since it
                    // probably fans out later. (Worse case we'll directly include its single child)
                    && inTree.visibleChildrenCount !== 1) {
                    include.add(element.test);
                    alreadyIncluded = true;
                }
                // Recurse ✨
                for (const child of element.children) {
                    attempt(child, alreadyIncluded);
                }
            };
            if (filterToType === 'selected') {
                const sel = this.viewModel.tree.getSelection().filter(types_1.isDefined);
                if (sel.length) {
                    L: for (const node of sel) {
                        if (node instanceof index_1.TestItemTreeElement) {
                            // avoid adding an item if its parent is already included
                            for (let i = node; i; i = i.parent) {
                                if (include.has(i.test)) {
                                    continue L;
                                }
                            }
                            include.add(node.test);
                            node.children.forEach(c => attempt(c, true));
                        }
                    }
                    return { include: [...include], exclude };
                }
            }
            for (const root of withinItems || this.testService.collection.rootItems) {
                const element = projection.getElementByTestId(root.item.extId);
                if (!element) {
                    continue;
                }
                if (profile && !(0, testProfileService_1.canUseProfileWithTest)(profile, root)) {
                    continue;
                }
                // single controllers won't have visible root ID nodes, handle that  case specially
                if (!this.viewModel.tree.hasElement(element)) {
                    const visibleChildren = [...element.children].reduce((acc, c) => this.viewModel.tree.hasElement(c) && this.viewModel.tree.getNode(c).visible ? acc + 1 : acc, 0);
                    // note we intentionally check children > 0 here, unlike above, since
                    // we don't want to bother dispatching to controllers who have no discovered tests
                    if (element.children.size > 0 && visibleChildren * 2 >= element.children.size) {
                        include.add(element.test);
                        element.children.forEach(c => attempt(c, true));
                    }
                    else {
                        element.children.forEach(c => attempt(c, false));
                    }
                }
                else {
                    attempt(element, false);
                }
            }
            return { include: [...include], exclude };
        }
        render() {
            super.render();
            this._register((0, widgetNavigationCommands_1.registerNavigableContainer)({
                focusNotifiers: [this],
                focusNextWidget: () => {
                    if (!this.viewModel.tree.isDOMFocused()) {
                        this.viewModel.tree.domFocus();
                    }
                },
                focusPreviousWidget: () => {
                    if (this.viewModel.tree.isDOMFocused()) {
                        this.filter.value?.focus();
                    }
                }
            }));
        }
        /**
         * @override
         */
        renderBody(container) {
            super.renderBody(container);
            this.container = dom.append(container, dom.$('.test-explorer'));
            this.treeHeader = dom.append(this.container, dom.$('.test-explorer-header'));
            this.filterActionBar.value = this.createFilterActionBar();
            const messagesContainer = dom.append(this.treeHeader, dom.$('.result-summary-container'));
            this._register(this.instantiationService.createInstance(ResultSummaryView, messagesContainer));
            const listContainer = dom.append(this.container, dom.$('.test-explorer-tree'));
            this.viewModel = this.instantiationService.createInstance(TestingExplorerViewModel, listContainer, this.onDidChangeBodyVisibility);
            this._register(this.viewModel.tree.onDidFocus(() => this.lastFocusState = 1 /* LastFocusState.Tree */));
            this._register(this.viewModel.onChangeWelcomeVisibility(() => this._onDidChangeViewWelcomeState.fire()));
            this._register(this.viewModel);
            this._onDidChangeViewWelcomeState.fire();
        }
        /** @override  */
        getActionViewItem(action, options) {
            switch (action.id) {
                case "workbench.actions.treeView.testExplorer.filter" /* TestCommandId.FilterAction */:
                    this.filter.value = this.instantiationService.createInstance(testingExplorerFilter_1.TestingExplorerFilter, action, options);
                    this.filterFocusListener.value = this.filter.value.onDidFocus(() => this.lastFocusState = 0 /* LastFocusState.Input */);
                    return this.filter.value;
                case "testing.runSelected" /* TestCommandId.RunSelectedAction */:
                    return this.getRunGroupDropdown(2 /* TestRunProfileBitset.Run */, action, options);
                case "testing.debugSelected" /* TestCommandId.DebugSelectedAction */:
                    return this.getRunGroupDropdown(4 /* TestRunProfileBitset.Debug */, action, options);
                default:
                    return super.getActionViewItem(action, options);
            }
        }
        /** @inheritdoc */
        getTestConfigGroupActions(group) {
            const profileActions = [];
            let participatingGroups = 0;
            let hasConfigurable = false;
            const defaults = this.testProfileService.getGroupDefaultProfiles(group);
            for (const { profiles, controller } of this.testProfileService.all()) {
                let hasAdded = false;
                for (const profile of profiles) {
                    if (profile.group !== group) {
                        continue;
                    }
                    if (!hasAdded) {
                        hasAdded = true;
                        participatingGroups++;
                        profileActions.push(new actions_1.Action(`${controller.id}.$root`, controller.label.value, undefined, false));
                    }
                    hasConfigurable = hasConfigurable || profile.hasConfigurationHandler;
                    profileActions.push(new actions_1.Action(`${controller.id}.${profile.profileId}`, defaults.includes(profile) ? (0, nls_1.localize)('defaultTestProfile', '{0} (Default)', profile.label) : profile.label, undefined, undefined, () => {
                        const { include, exclude } = this.getTreeIncludeExclude(undefined, profile);
                        this.testService.runResolvedTests({
                            exclude: exclude.map(e => e.item.extId),
                            targets: [{
                                    profileGroup: profile.group,
                                    profileId: profile.profileId,
                                    controllerId: profile.controllerId,
                                    testIds: include.map(i => i.item.extId),
                                }]
                        });
                    }));
                }
            }
            // If there's only one group, don't add a heading for it in the dropdown.
            if (participatingGroups === 1) {
                profileActions.shift();
            }
            const postActions = [];
            if (profileActions.length > 1) {
                postActions.push(new actions_1.Action('selectDefaultTestConfigurations', (0, nls_1.localize)('selectDefaultConfigs', 'Select Default Profile'), undefined, undefined, () => this.commandService.executeCommand("testing.selectDefaultTestProfiles" /* TestCommandId.SelectDefaultTestProfiles */, group)));
            }
            if (hasConfigurable) {
                postActions.push(new actions_1.Action('configureTestProfiles', (0, nls_1.localize)('configureTestProfiles', 'Configure Test Profiles'), undefined, undefined, () => this.commandService.executeCommand("testing.configureProfile" /* TestCommandId.ConfigureTestProfilesAction */, group)));
            }
            return actions_1.Separator.join(profileActions, postActions);
        }
        /**
         * @override
         */
        saveState() {
            this.filter.value?.saveState();
            super.saveState();
        }
        getRunGroupDropdown(group, defaultAction, options) {
            const dropdownActions = this.getTestConfigGroupActions(group);
            if (dropdownActions.length < 2) {
                return super.getActionViewItem(defaultAction, options);
            }
            const primaryAction = this.instantiationService.createInstance(actions_2.MenuItemAction, {
                id: defaultAction.id,
                title: defaultAction.label,
                icon: group === 2 /* TestRunProfileBitset.Run */
                    ? icons.testingRunAllIcon
                    : icons.testingDebugAllIcon,
            }, undefined, undefined, undefined);
            const dropdownAction = new actions_1.Action('selectRunConfig', 'Select Configuration...', 'codicon-chevron-down', true);
            return this.instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, primaryAction, dropdownAction, dropdownActions, '', this.contextMenuService, options);
        }
        createFilterActionBar() {
            const bar = new actionbar_1.ActionBar(this.treeHeader, {
                actionViewItemProvider: (action, options) => this.getActionViewItem(action, options),
                triggerKeys: { keyDown: false, keys: [] },
            });
            bar.push(new actions_1.Action("workbench.actions.treeView.testExplorer.filter" /* TestCommandId.FilterAction */));
            bar.getContainer().classList.add('testing-filter-action-bar');
            return bar;
        }
        updateDiscoveryProgress(busy) {
            if (!busy && this.discoveryProgress) {
                this.discoveryProgress.clear();
            }
            else if (busy && !this.discoveryProgress.value) {
                this.discoveryProgress.value = this.instantiationService.createInstance(progress_1.UnmanagedProgress, { location: this.getProgressLocation() });
            }
        }
        /**
         * @override
         */
        layoutBody(height = this.dimensions.height, width = this.dimensions.width) {
            super.layoutBody(height, width);
            this.dimensions.height = height;
            this.dimensions.width = width;
            this.container.style.height = `${height}px`;
            this.viewModel?.layout(height - this.treeHeader.clientHeight, width);
            this.filter.value?.layout(width);
        }
    };
    exports.TestingExplorerView = TestingExplorerView;
    exports.TestingExplorerView = TestingExplorerView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, testService_1.ITestService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, testProfileService_1.ITestProfileService),
        __param(12, commands_1.ICommandService)
    ], TestingExplorerView);
    const SUMMARY_RENDER_INTERVAL = 200;
    let ResultSummaryView = class ResultSummaryView extends lifecycle_1.Disposable {
        constructor(container, resultService, activityService, crService, configurationService, instantiationService) {
            super();
            this.container = container;
            this.resultService = resultService;
            this.activityService = activityService;
            this.crService = crService;
            this.elementsWereAttached = false;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.renderLoop = this._register(new async_1.RunOnceScheduler(() => this.render(), SUMMARY_RENDER_INTERVAL));
            this.elements = dom.h('div.result-summary', [
                dom.h('div@status'),
                dom.h('div@count'),
                dom.h('div@count'),
                dom.h('span'),
                dom.h('duration@duration'),
                dom.h('a@rerun'),
            ]);
            this.badgeType = configurationService.getValue("testing.countBadge" /* TestingConfigKeys.CountBadge */);
            this._register(resultService.onResultsChanged(this.render, this));
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("testing.countBadge" /* TestingConfigKeys.CountBadge */)) {
                    this.badgeType = configurationService.getValue("testing.countBadge" /* TestingConfigKeys.CountBadge */);
                    this.render();
                }
            }));
            this.countHover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.elements.count, ''));
            const ab = this._register(new actionbar_1.ActionBar(this.elements.rerun, {
                actionViewItemProvider: (action, options) => (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, options),
            }));
            ab.push(instantiationService.createInstance(actions_2.MenuItemAction, { ...new testExplorerActions_1.ReRunLastRun().desc, icon: icons.testingRerunIcon }, { ...new testExplorerActions_1.DebugLastRun().desc, icon: icons.testingDebugIcon }, {}, undefined), { icon: true, label: false });
            this.render();
        }
        render() {
            const { results } = this.resultService;
            const { count, root, status, duration, rerun } = this.elements;
            if (!results.length) {
                if (this.elementsWereAttached) {
                    this.container.removeChild(root);
                    this.elementsWereAttached = false;
                }
                this.container.innerText = (0, nls_1.localize)('noResults', 'No test results yet.');
                this.badgeDisposable.clear();
                return;
            }
            const live = results.filter(r => !r.completedAt);
            let counts;
            if (live.length) {
                status.className = themables_1.ThemeIcon.asClassName(iconRegistry_1.spinningLoading);
                counts = (0, testingProgressUiService_1.collectTestStateCounts)(true, live);
                this.renderLoop.schedule();
                const last = live[live.length - 1];
                duration.textContent = formatDuration(Date.now() - last.startedAt);
                rerun.style.display = 'none';
            }
            else {
                const last = results[0];
                const dominantState = (0, arraysFind_1.mapFindFirst)(testingStates_1.statesInOrder, s => last.counts[s] > 0 ? s : undefined);
                status.className = themables_1.ThemeIcon.asClassName(icons.testingStatesToIcons.get(dominantState ?? 0 /* TestResultState.Unset */));
                counts = (0, testingProgressUiService_1.collectTestStateCounts)(false, [last]);
                duration.textContent = last instanceof testResult_1.LiveTestResult ? formatDuration(last.completedAt - last.startedAt) : '';
                rerun.style.display = 'block';
            }
            count.textContent = `${counts.passed}/${counts.totalWillBeRun}`;
            this.countHover.update((0, testingProgressUiService_1.getTestProgressText)(counts));
            this.renderActivityBadge(counts);
            if (!this.elementsWereAttached) {
                dom.clearNode(this.container);
                this.container.appendChild(root);
                this.elementsWereAttached = true;
            }
        }
        renderActivityBadge(countSummary) {
            if (countSummary && this.badgeType !== "off" /* TestingCountBadge.Off */ && countSummary[this.badgeType] !== 0) {
                if (this.lastBadge instanceof activity_1.NumberBadge && this.lastBadge.number === countSummary[this.badgeType]) {
                    return;
                }
                this.lastBadge = new activity_1.NumberBadge(countSummary[this.badgeType], num => this.getLocalizedBadgeString(this.badgeType, num));
            }
            else if (this.crService.isEnabled()) {
                if (this.lastBadge instanceof activity_1.IconBadge && this.lastBadge.icon === icons.testingContinuousIsOn) {
                    return;
                }
                this.lastBadge = new activity_1.IconBadge(icons.testingContinuousIsOn, () => (0, nls_1.localize)('testingContinuousBadge', 'Tests are being watched for changes'));
            }
            else {
                if (!this.lastBadge) {
                    return;
                }
                this.lastBadge = undefined;
            }
            this.badgeDisposable.value = this.lastBadge && this.activityService.showViewActivity("workbench.view.testing" /* Testing.ExplorerViewId */, { badge: this.lastBadge });
        }
        getLocalizedBadgeString(countBadgeType, count) {
            switch (countBadgeType) {
                case "passed" /* TestingCountBadge.Passed */:
                    return (0, nls_1.localize)('testingCountBadgePassed', '{0} passed tests', count);
                case "skipped" /* TestingCountBadge.Skipped */:
                    return (0, nls_1.localize)('testingCountBadgeSkipped', '{0} skipped tests', count);
                default:
                    return (0, nls_1.localize)('testingCountBadgeFailed', '{0} failed tests', count);
            }
        }
    };
    ResultSummaryView = __decorate([
        __param(1, testResultService_1.ITestResultService),
        __param(2, activity_1.IActivityService),
        __param(3, testingContinuousRunService_1.ITestingContinuousRunService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], ResultSummaryView);
    var WelcomeExperience;
    (function (WelcomeExperience) {
        WelcomeExperience[WelcomeExperience["None"] = 0] = "None";
        WelcomeExperience[WelcomeExperience["ForWorkspace"] = 1] = "ForWorkspace";
        WelcomeExperience[WelcomeExperience["ForDocument"] = 2] = "ForDocument";
    })(WelcomeExperience || (WelcomeExperience = {}));
    let TestingExplorerViewModel = class TestingExplorerViewModel extends lifecycle_1.Disposable {
        get viewMode() {
            return this._viewMode.get() ?? "true" /* TestExplorerViewMode.Tree */;
        }
        set viewMode(newMode) {
            if (newMode === this._viewMode.get()) {
                return;
            }
            this._viewMode.set(newMode);
            this.updatePreferredProjection();
            this.storageService.store('testing.viewMode', newMode, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        get viewSorting() {
            return this._viewSorting.get() ?? "status" /* TestExplorerViewSorting.ByStatus */;
        }
        set viewSorting(newSorting) {
            if (newSorting === this._viewSorting.get()) {
                return;
            }
            this._viewSorting.set(newSorting);
            this.tree.resort(null);
            this.storageService.store('testing.viewSorting', newSorting, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        constructor(listContainer, onDidChangeVisibility, configurationService, editorService, menuService, contextMenuService, testService, filterState, instantiationService, storageService, contextKeyService, testResults, peekOpener, testProfileService, crService, commandService) {
            super();
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.testService = testService;
            this.filterState = filterState;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.contextKeyService = contextKeyService;
            this.testResults = testResults;
            this.peekOpener = peekOpener;
            this.testProfileService = testProfileService;
            this.crService = crService;
            this.projection = this._register(new lifecycle_1.MutableDisposable());
            this.revealTimeout = new lifecycle_1.MutableDisposable();
            this._viewMode = testingContextKeys_1.TestingContextKeys.viewMode.bindTo(this.contextKeyService);
            this._viewSorting = testingContextKeys_1.TestingContextKeys.viewSorting.bindTo(this.contextKeyService);
            this.welcomeVisibilityEmitter = new event_1.Emitter();
            this.actionRunner = new TestExplorerActionRunner(() => this.tree.getSelection().filter(types_1.isDefined));
            this.lastViewState = this._register(new storedValue_1.StoredValue({
                key: 'testing.treeState',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */,
            }, this.storageService));
            /**
             * Whether there's a reveal request which has not yet been delivered. This
             * can happen if the user asks to reveal before the test tree is loaded.
             * We check to see if the reveal request is present on each tree update,
             * and do it then if so.
             */
            this.hasPendingReveal = false;
            /**
             * Fires when the visibility of the placeholder state changes.
             */
            this.onChangeWelcomeVisibility = this.welcomeVisibilityEmitter.event;
            /**
             * Gets whether the welcome should be visible.
             */
            this.welcomeExperience = 0 /* WelcomeExperience.None */;
            this.hasPendingReveal = !!filterState.reveal.value;
            this.noTestForDocumentWidget = this._register(instantiationService.createInstance(NoTestsForDocumentWidget, listContainer));
            this._viewMode.set(this.storageService.get('testing.viewMode', 1 /* StorageScope.WORKSPACE */, "true" /* TestExplorerViewMode.Tree */));
            this._viewSorting.set(this.storageService.get('testing.viewSorting', 1 /* StorageScope.WORKSPACE */, "location" /* TestExplorerViewSorting.ByLocation */));
            this.reevaluateWelcomeState();
            this.filter = this.instantiationService.createInstance(TestsFilter, testService.collection);
            this.tree = instantiationService.createInstance(testingObjectTree_1.TestingObjectTree, 'Test Explorer List', listContainer, new ListDelegate(), [
                instantiationService.createInstance(TestItemRenderer, this.actionRunner),
                instantiationService.createInstance(ErrorRenderer),
            ], {
                identityProvider: instantiationService.createInstance(IdentityProvider),
                hideTwistiesOfChildlessElements: false,
                sorter: instantiationService.createInstance(TreeSorter, this),
                keyboardNavigationLabelProvider: instantiationService.createInstance(TreeKeyboardNavigationLabelProvider),
                accessibilityProvider: instantiationService.createInstance(ListAccessibilityProvider),
                filter: this.filter,
                findWidgetEnabled: false,
                openOnSingleClick: false,
            });
            // saves the collapse state so that if items are removed or refreshed, they
            // retain the same state (#170169)
            const collapseStateSaver = this._register(new async_1.RunOnceScheduler(() => {
                // reuse the last view state to avoid making a bunch of object garbage:
                const state = this.tree.getOptimizedViewState(this.lastViewState.get({}));
                const projection = this.projection.value;
                if (projection) {
                    projection.lastState = state;
                }
            }, 3000));
            this._register(this.tree.onDidChangeCollapseState(evt => {
                if (evt.node.element instanceof index_1.TestItemTreeElement) {
                    if (!evt.node.collapsed) {
                        this.projection.value?.expandElement(evt.node.element, evt.deep ? Infinity : 0);
                    }
                    collapseStateSaver.schedule();
                }
            }));
            this._register(this.crService.onDidChange(testId => {
                if (testId) {
                    // a continuous run test will sort to the top:
                    const elem = this.projection.value?.getElementByTestId(testId);
                    this.tree.resort(elem?.parent && this.tree.hasElement(elem.parent) ? elem.parent : null, false);
                }
            }));
            this._register(onDidChangeVisibility(visible => {
                if (visible) {
                    this.ensureProjection();
                }
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(event_1.Event.any(filterState.text.onDidChange, filterState.fuzzy.onDidChange, testService.excluded.onTestExclusionsChanged)(this.tree.refilter, this.tree));
            this._register(this.tree.onDidOpen(e => {
                if (e.element instanceof index_1.TestItemTreeElement && !e.element.children.size && e.element.test.item.uri) {
                    commandService.executeCommand('vscode.revealTest', e.element.test.item.extId);
                }
            }));
            this._register(this.tree);
            this._register(this.onChangeWelcomeVisibility(e => {
                this.noTestForDocumentWidget.setVisible(e === 2 /* WelcomeExperience.ForDocument */);
            }));
            this._register(dom.addStandardDisposableListener(this.tree.getHTMLElement(), 'keydown', evt => {
                if (evt.equals(3 /* KeyCode.Enter */)) {
                    this.handleExecuteKeypress(evt);
                }
                else if (listWidget_1.DefaultKeyboardNavigationDelegate.mightProducePrintableCharacter(evt)) {
                    filterState.text.value = evt.browserEvent.key;
                    filterState.focusInput();
                }
            }));
            this._register(filterState.reveal.onDidChange(id => this.revealById(id, undefined, false)));
            this._register(onDidChangeVisibility(visible => {
                if (visible) {
                    filterState.focusInput();
                }
            }));
            this._register(this.tree.onDidChangeSelection(evt => {
                if (dom.isMouseEvent(evt.browserEvent) && (evt.browserEvent.altKey || evt.browserEvent.shiftKey)) {
                    return; // don't focus when alt-clicking to multi select
                }
                const selected = evt.elements[0];
                if (selected && evt.browserEvent && selected instanceof index_1.TestItemTreeElement
                    && selected.children.size === 0 && selected.test.expand === 0 /* TestItemExpandState.NotExpandable */) {
                    this.tryPeekError(selected);
                }
            }));
            let followRunningTests = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */);
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */)) {
                    followRunningTests = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */);
                }
            }));
            let alwaysRevealTestAfterStateChange = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.alwaysRevealTestOnStateChange" /* TestingConfigKeys.AlwaysRevealTestOnStateChange */);
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("testing.alwaysRevealTestOnStateChange" /* TestingConfigKeys.AlwaysRevealTestOnStateChange */)) {
                    alwaysRevealTestAfterStateChange = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.alwaysRevealTestOnStateChange" /* TestingConfigKeys.AlwaysRevealTestOnStateChange */);
                }
            }));
            this._register(testResults.onTestChanged(evt => {
                if (!followRunningTests) {
                    return;
                }
                if (evt.reason !== 1 /* TestResultItemChangeReason.OwnStateChange */) {
                    return;
                }
                if (this.tree.selectionSize > 1) {
                    return; // don't change a multi-selection #180950
                }
                // follow running tests, or tests whose state changed. Tests that
                // complete very fast may not enter the running state at all.
                if (evt.item.ownComputedState !== 2 /* TestResultState.Running */ && !(evt.previousState === 1 /* TestResultState.Queued */ && (0, testingStates_1.isStateWithResult)(evt.item.ownComputedState))) {
                    return;
                }
                this.revealById(evt.item.item.extId, alwaysRevealTestAfterStateChange, false);
            }));
            this._register(testResults.onResultsChanged(() => {
                this.tree.resort(null);
            }));
            this._register(this.testProfileService.onDidChange(() => {
                this.tree.rerender();
            }));
            const onEditorChange = () => {
                if (editorService.activeEditor instanceof diffEditorInput_1.DiffEditorInput) {
                    this.filter.filterToDocumentUri(editorService.activeEditor.primary.resource);
                }
                else {
                    this.filter.filterToDocumentUri(editorService.activeEditor?.resource);
                }
                if (this.filterState.isFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */)) {
                    this.tree.refilter();
                }
            };
            this._register(editorService.onDidActiveEditorChange(onEditorChange));
            this._register(this.storageService.onWillSaveState(({ reason, }) => {
                if (reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this.lastViewState.store(this.tree.getOptimizedViewState());
                }
            }));
            onEditorChange();
        }
        /**
         * Re-layout the tree.
         */
        layout(height, width) {
            this.tree.layout(height, width);
        }
        /**
         * Tries to reveal by extension ID. Queues the request if the extension
         * ID is not currently available.
         */
        revealById(id, expand = true, focus = true) {
            if (!id) {
                this.hasPendingReveal = false;
                return;
            }
            const projection = this.ensureProjection();
            // If the item itself is visible in the tree, show it. Otherwise, expand
            // its closest parent.
            let expandToLevel = 0;
            const idPath = [...testId_1.TestId.fromString(id).idsFromRoot()];
            for (let i = idPath.length - 1; i >= expandToLevel; i--) {
                const element = projection.getElementByTestId(idPath[i].toString());
                // Skip all elements that aren't in the tree.
                if (!element || !this.tree.hasElement(element)) {
                    continue;
                }
                // If this 'if' is true, we're at the closest-visible parent to the node
                // we want to expand. Expand that, and then start the loop again because
                // we might already have children for it.
                if (i < idPath.length - 1) {
                    if (expand) {
                        this.tree.expand(element);
                        expandToLevel = i + 1; // avoid an infinite loop if the test does not exist
                        i = idPath.length - 1; // restart the loop since new children may now be visible
                        continue;
                    }
                }
                // Otherwise, we've arrived!
                // If the node or any of its children are excluded, flip on the 'show
                // excluded tests' checkbox automatically. If we didn't expand, then set
                // target focus target to the first collapsed element.
                let focusTarget = element;
                for (let n = element; n instanceof index_1.TestItemTreeElement; n = n.parent) {
                    if (n.test && this.testService.excluded.contains(n.test)) {
                        this.filterState.toggleFilteringFor("@hidden" /* TestFilterTerm.Hidden */, true);
                        break;
                    }
                    if (!expand && (this.tree.hasElement(n) && this.tree.isCollapsed(n))) {
                        focusTarget = n;
                    }
                }
                this.filterState.reveal.value = undefined;
                this.hasPendingReveal = false;
                if (focus) {
                    this.tree.domFocus();
                }
                if (this.tree.getRelativeTop(focusTarget) === null) {
                    this.tree.reveal(focusTarget, 0.5);
                }
                this.revealTimeout.value = (0, async_1.disposableTimeout)(() => {
                    this.tree.setFocus([focusTarget]);
                    this.tree.setSelection([focusTarget]);
                }, 1);
                return;
            }
            // If here, we've expanded all parents we can. Waiting on data to come
            // in to possibly show the revealed test.
            this.hasPendingReveal = true;
        }
        /**
         * Collapse all items in the tree.
         */
        async collapseAll() {
            this.tree.collapseAll();
        }
        /**
         * Tries to peek the first test error, if the item is in a failed state.
         */
        tryPeekError(item) {
            const lookup = item.test && this.testResults.getStateById(item.test.item.extId);
            return lookup && lookup[1].tasks.some(s => (0, testingStates_1.isFailedState)(s.state))
                ? this.peekOpener.tryPeekFirstError(lookup[0], lookup[1], { preserveFocus: true })
                : false;
        }
        onContextMenu(evt) {
            const element = evt.element;
            if (!(element instanceof index_1.TestItemTreeElement)) {
                return;
            }
            const { actions } = getActionableElementActions(this.contextKeyService, this.menuService, this.testService, this.crService, this.testProfileService, element);
            this.contextMenuService.showContextMenu({
                getAnchor: () => evt.anchor,
                getActions: () => actions.secondary,
                getActionsContext: () => element,
                actionRunner: this.actionRunner,
            });
        }
        handleExecuteKeypress(evt) {
            const focused = this.tree.getFocus();
            const selected = this.tree.getSelection();
            let targeted;
            if (focused.length === 1 && selected.includes(focused[0])) {
                evt.browserEvent?.preventDefault();
                targeted = selected;
            }
            else {
                targeted = focused;
            }
            const toRun = targeted
                .filter((e) => e instanceof index_1.TestItemTreeElement);
            if (toRun.length) {
                this.testService.runTests({
                    group: 2 /* TestRunProfileBitset.Run */,
                    tests: toRun.map(t => t.test),
                });
            }
        }
        reevaluateWelcomeState() {
            const shouldShowWelcome = this.testService.collection.busyProviders === 0 && (0, testService_1.testCollectionIsEmpty)(this.testService.collection);
            const welcomeExperience = shouldShowWelcome
                ? (this.filterState.isFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */) ? 2 /* WelcomeExperience.ForDocument */ : 1 /* WelcomeExperience.ForWorkspace */)
                : 0 /* WelcomeExperience.None */;
            if (welcomeExperience !== this.welcomeExperience) {
                this.welcomeExperience = welcomeExperience;
                this.welcomeVisibilityEmitter.fire(welcomeExperience);
            }
        }
        ensureProjection() {
            return this.projection.value ?? this.updatePreferredProjection();
        }
        updatePreferredProjection() {
            this.projection.clear();
            const lastState = this.lastViewState.get({});
            if (this._viewMode.get() === "list" /* TestExplorerViewMode.List */) {
                this.projection.value = this.instantiationService.createInstance(listProjection_1.ListProjection, lastState);
            }
            else {
                this.projection.value = this.instantiationService.createInstance(treeProjection_1.TreeProjection, lastState);
            }
            const scheduler = this._register(new async_1.RunOnceScheduler(() => this.applyProjectionChanges(), 200));
            this.projection.value.onUpdate(() => {
                if (!scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            });
            this.applyProjectionChanges();
            return this.projection.value;
        }
        applyProjectionChanges() {
            this.reevaluateWelcomeState();
            this.projection.value?.applyTo(this.tree);
            this.tree.refilter();
            if (this.hasPendingReveal) {
                this.revealById(this.filterState.reveal.value);
            }
        }
        /**
         * Gets the selected tests from the tree.
         */
        getSelectedTests() {
            return this.tree.getSelection();
        }
    };
    TestingExplorerViewModel = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorService_1.IEditorService),
        __param(4, actions_2.IMenuService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, testService_1.ITestService),
        __param(7, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, storage_1.IStorageService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, testResultService_1.ITestResultService),
        __param(12, testingPeekOpener_1.ITestingPeekOpener),
        __param(13, testProfileService_1.ITestProfileService),
        __param(14, testingContinuousRunService_1.ITestingContinuousRunService),
        __param(15, commands_1.ICommandService)
    ], TestingExplorerViewModel);
    var FilterResult;
    (function (FilterResult) {
        FilterResult[FilterResult["Exclude"] = 0] = "Exclude";
        FilterResult[FilterResult["Inherit"] = 1] = "Inherit";
        FilterResult[FilterResult["Include"] = 2] = "Include";
    })(FilterResult || (FilterResult = {}));
    const hasNodeInOrParentOfUri = (collection, ident, testUri, fromNode) => {
        const queue = [fromNode ? [fromNode] : collection.rootIds];
        while (queue.length) {
            for (const id of queue.pop()) {
                const node = collection.getNodeById(id);
                if (!node) {
                    continue;
                }
                if (!node.item.uri || !ident.extUri.isEqualOrParent(testUri, node.item.uri)) {
                    continue;
                }
                // Only show nodes that can be expanded (and might have a child with
                // a range) or ones that have a physical location.
                if (node.item.range || node.expand === 1 /* TestItemExpandState.Expandable */) {
                    return true;
                }
                queue.push(node.children);
            }
        }
        return false;
    };
    let TestsFilter = class TestsFilter {
        constructor(collection, state, testService, uriIdentityService) {
            this.collection = collection;
            this.state = state;
            this.testService = testService;
            this.uriIdentityService = uriIdentityService;
        }
        /**
         * @inheritdoc
         */
        filter(element) {
            if (element instanceof index_1.TestTreeErrorMessage) {
                return 1 /* TreeVisibility.Visible */;
            }
            if (element.test
                && !this.state.isFilteringFor("@hidden" /* TestFilterTerm.Hidden */)
                && this.testService.excluded.contains(element.test)) {
                return 0 /* TreeVisibility.Hidden */;
            }
            switch (Math.min(this.testFilterText(element), this.testLocation(element), this.testState(element), this.testTags(element))) {
                case 0 /* FilterResult.Exclude */:
                    return 0 /* TreeVisibility.Hidden */;
                case 2 /* FilterResult.Include */:
                    return 1 /* TreeVisibility.Visible */;
                default:
                    return 2 /* TreeVisibility.Recurse */;
            }
        }
        filterToDocumentUri(uri) {
            this.documentUri = uri;
        }
        testTags(element) {
            if (!this.state.includeTags.size && !this.state.excludeTags.size) {
                return 2 /* FilterResult.Include */;
            }
            return (this.state.includeTags.size ?
                element.test.item.tags.some(t => this.state.includeTags.has(t)) :
                true) && element.test.item.tags.every(t => !this.state.excludeTags.has(t))
                ? 2 /* FilterResult.Include */
                : 1 /* FilterResult.Inherit */;
        }
        testState(element) {
            if (this.state.isFilteringFor("@failed" /* TestFilterTerm.Failed */)) {
                return (0, testingStates_1.isFailedState)(element.state) ? 2 /* FilterResult.Include */ : 1 /* FilterResult.Inherit */;
            }
            if (this.state.isFilteringFor("@executed" /* TestFilterTerm.Executed */)) {
                return element.state !== 0 /* TestResultState.Unset */ ? 2 /* FilterResult.Include */ : 1 /* FilterResult.Inherit */;
            }
            return 2 /* FilterResult.Include */;
        }
        testLocation(element) {
            if (!this.documentUri) {
                return 2 /* FilterResult.Include */;
            }
            if (!this.state.isFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */) || !(element instanceof index_1.TestItemTreeElement)) {
                return 2 /* FilterResult.Include */;
            }
            if (hasNodeInOrParentOfUri(this.collection, this.uriIdentityService, this.documentUri, element.test.item.extId)) {
                return 2 /* FilterResult.Include */;
            }
            return 1 /* FilterResult.Inherit */;
        }
        testFilterText(element) {
            if (this.state.globList.length === 0) {
                return 2 /* FilterResult.Include */;
            }
            const fuzzy = this.state.fuzzy.value;
            for (let e = element; e; e = e.parent) {
                // start as included if the first glob is a negation
                let included = this.state.globList[0].include === false ? 2 /* FilterResult.Include */ : 1 /* FilterResult.Inherit */;
                const data = e.test.item.label.toLowerCase();
                for (const { include, text } of this.state.globList) {
                    if (fuzzy ? (0, strings_1.fuzzyContains)(data, text) : data.includes(text)) {
                        included = include ? 2 /* FilterResult.Include */ : 0 /* FilterResult.Exclude */;
                    }
                }
                if (included !== 1 /* FilterResult.Inherit */) {
                    return included;
                }
            }
            return 1 /* FilterResult.Inherit */;
        }
    };
    TestsFilter = __decorate([
        __param(1, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(2, testService_1.ITestService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], TestsFilter);
    class TreeSorter {
        constructor(viewModel) {
            this.viewModel = viewModel;
        }
        compare(a, b) {
            if (a instanceof index_1.TestTreeErrorMessage || b instanceof index_1.TestTreeErrorMessage) {
                return (a instanceof index_1.TestTreeErrorMessage ? -1 : 0) + (b instanceof index_1.TestTreeErrorMessage ? 1 : 0);
            }
            const durationDelta = (b.duration || 0) - (a.duration || 0);
            if (this.viewModel.viewSorting === "duration" /* TestExplorerViewSorting.ByDuration */ && durationDelta !== 0) {
                return durationDelta;
            }
            const stateDelta = (0, testingStates_1.cmpPriority)(a.state, b.state);
            if (this.viewModel.viewSorting === "status" /* TestExplorerViewSorting.ByStatus */ && stateDelta !== 0) {
                return stateDelta;
            }
            let inSameLocation = false;
            if (a instanceof index_1.TestItemTreeElement && b instanceof index_1.TestItemTreeElement && a.test.item.uri && b.test.item.uri && a.test.item.uri.toString() === b.test.item.uri.toString() && a.test.item.range && b.test.item.range) {
                inSameLocation = true;
                const delta = a.test.item.range.startLineNumber - b.test.item.range.startLineNumber;
                if (delta !== 0) {
                    return delta;
                }
            }
            const sa = a.test.item.sortText;
            const sb = b.test.item.sortText;
            // If tests are in the same location and there's no preferred sortText,
            // keep the extension's insertion order (#163449).
            return inSameLocation && !sa && !sb ? 0 : (sa || a.test.item.label).localeCompare(sb || b.test.item.label);
        }
    }
    let NoTestsForDocumentWidget = class NoTestsForDocumentWidget extends lifecycle_1.Disposable {
        constructor(container, filterState) {
            super();
            const el = this.el = dom.append(container, dom.$('.testing-no-test-placeholder'));
            const emptyParagraph = dom.append(el, dom.$('p'));
            emptyParagraph.innerText = (0, nls_1.localize)('testingNoTest', 'No tests were found in this file.');
            const buttonLabel = (0, nls_1.localize)('testingFindExtension', 'Show Workspace Tests');
            const button = this._register(new button_1.Button(el, { title: buttonLabel, ...defaultStyles_1.defaultButtonStyles }));
            button.label = buttonLabel;
            this._register(button.onDidClick(() => filterState.toggleFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */, false)));
        }
        setVisible(isVisible) {
            this.el.classList.toggle('visible', isVisible);
        }
    };
    NoTestsForDocumentWidget = __decorate([
        __param(1, testExplorerFilterState_1.ITestExplorerFilterState)
    ], NoTestsForDocumentWidget);
    class TestExplorerActionRunner extends actions_1.ActionRunner {
        constructor(getSelectedTests) {
            super();
            this.getSelectedTests = getSelectedTests;
        }
        async runAction(action, context) {
            if (!(action instanceof actions_2.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedTests();
            const contextIsSelected = selection.some(s => s === context);
            const actualContext = contextIsSelected ? selection : [context];
            const actionable = actualContext.filter((t) => t instanceof index_1.TestItemTreeElement);
            await action.run(...actionable);
        }
    }
    const getLabelForTestTreeElement = (element) => {
        let label = (0, constants_1.labelForTestInState)(element.description || element.test.item.label, element.state);
        if (element instanceof index_1.TestItemTreeElement) {
            if (element.duration !== undefined) {
                label = (0, nls_1.localize)({
                    key: 'testing.treeElementLabelDuration',
                    comment: ['{0} is the original label in testing.treeElementLabel, {1} is a duration'],
                }, '{0}, in {1}', label, formatDuration(element.duration));
            }
            if (element.retired) {
                label = (0, nls_1.localize)({
                    key: 'testing.treeElementLabelOutdated',
                    comment: ['{0} is the original label in testing.treeElementLabel'],
                }, '{0}, outdated result', label);
            }
        }
        return label;
    };
    class ListAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('testExplorer', "Test Explorer");
        }
        getAriaLabel(element) {
            return element instanceof index_1.TestTreeErrorMessage
                ? element.description
                : getLabelForTestTreeElement(element);
        }
    }
    class TreeKeyboardNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element instanceof index_1.TestTreeErrorMessage ? element.message : element.test.item.label;
        }
    }
    class ListDelegate {
        getHeight(element) {
            return element instanceof index_1.TestTreeErrorMessage ? 17 + 10 : 22;
        }
        getTemplateId(element) {
            if (element instanceof index_1.TestTreeErrorMessage) {
                return ErrorRenderer.ID;
            }
            return TestItemRenderer.ID;
        }
    }
    class IdentityProvider {
        getId(element) {
            return element.treeId;
        }
    }
    let ErrorRenderer = class ErrorRenderer {
        static { ErrorRenderer_1 = this; }
        static { this.ID = 'error'; }
        constructor(instantionService) {
            this.renderer = instantionService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
        }
        get templateId() {
            return ErrorRenderer_1.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, dom.$('.error'));
            return { label, disposable: new lifecycle_1.DisposableStore() };
        }
        renderElement({ element }, _, data) {
            dom.clearNode(data.label);
            if (typeof element.message === 'string') {
                data.label.innerText = element.message;
            }
            else {
                const result = this.renderer.render(element.message, { inline: true });
                data.label.appendChild(result.element);
            }
            data.disposable.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.label, element.description));
        }
        disposeTemplate(data) {
            data.disposable.dispose();
        }
    };
    ErrorRenderer = ErrorRenderer_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ErrorRenderer);
    let TestItemRenderer = class TestItemRenderer extends lifecycle_1.Disposable {
        static { TestItemRenderer_1 = this; }
        static { this.ID = 'testItem'; }
        constructor(actionRunner, menuService, testService, profiles, contextKeyService, instantiationService, crService) {
            super();
            this.actionRunner = actionRunner;
            this.menuService = menuService;
            this.testService = testService;
            this.profiles = profiles;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.crService = crService;
            /**
             * @inheritdoc
             */
            this.templateId = TestItemRenderer_1.ID;
        }
        /**
         * @inheritdoc
         */
        renderTemplate(container) {
            const wrapper = dom.append(container, dom.$('.test-item'));
            const icon = dom.append(wrapper, dom.$('.computed-state'));
            const label = dom.append(wrapper, dom.$('.label'));
            const disposable = new lifecycle_1.DisposableStore();
            dom.append(wrapper, dom.$(themables_1.ThemeIcon.asCSSSelector(icons.testingHiddenIcon)));
            const actionBar = disposable.add(new actionbar_1.ActionBar(wrapper, {
                actionRunner: this.actionRunner,
                actionViewItemProvider: (action, options) => action instanceof actions_2.MenuItemAction
                    ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate })
                    : undefined
            }));
            disposable.add(this.crService.onDidChange(changed => {
                const id = templateData.current?.test.item.extId;
                if (id && (!changed || changed === id || testId_1.TestId.isChild(id, changed))) {
                    this.fillActionBar(templateData.current, templateData);
                }
            }));
            const templateData = { wrapper, label, actionBar, icon, elementDisposable: new lifecycle_1.DisposableStore(), templateDisposable: disposable };
            return templateData;
        }
        /**
         * @inheritdoc
         */
        disposeTemplate(templateData) {
            templateData.templateDisposable.clear();
        }
        /**
         * @inheritdoc
         */
        disposeElement(_element, _, templateData) {
            templateData.elementDisposable.clear();
        }
        fillActionBar(element, data) {
            const { actions, contextOverlay } = getActionableElementActions(this.contextKeyService, this.menuService, this.testService, this.crService, this.profiles, element);
            const crSelf = !!contextOverlay.getContextKeyValue(testingContextKeys_1.TestingContextKeys.isContinuousModeOn.key);
            const crChild = !crSelf && this.crService.isEnabledForAChildOf(element.test.item.extId);
            data.actionBar.domNode.classList.toggle('testing-is-continuous-run', crSelf || crChild);
            data.actionBar.clear();
            data.actionBar.context = element;
            data.actionBar.push(actions.primary, { icon: true, label: false });
        }
        /**
         * @inheritdoc
         */
        renderElement(node, _depth, data) {
            data.elementDisposable.clear();
            data.current = node.element;
            this.fillActionBar(node.element, data);
            data.elementDisposable.add(node.element.onChange(() => this._renderElement(node, data)));
            this._renderElement(node, data);
        }
        _renderElement(node, data) {
            const testHidden = this.testService.excluded.contains(node.element.test);
            data.wrapper.classList.toggle('test-is-hidden', testHidden);
            const icon = icons.testingStatesToIcons.get(node.element.test.expand === 2 /* TestItemExpandState.BusyExpanding */ || node.element.test.item.busy
                ? 2 /* TestResultState.Running */
                : node.element.state);
            data.icon.className = 'computed-state ' + (icon ? themables_1.ThemeIcon.asClassName(icon) : '');
            if (node.element.retired) {
                data.icon.className += ' retired';
            }
            data.elementDisposable.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.label, getLabelForTestTreeElement(node.element)));
            if (node.element.test.item.label.trim()) {
                dom.reset(data.label, ...(0, iconLabels_1.renderLabelWithIcons)(node.element.test.item.label));
            }
            else {
                data.label.textContent = String.fromCharCode(0xA0); // &nbsp;
            }
            let description = node.element.description;
            if (node.element.duration !== undefined) {
                description = description
                    ? `${description}: ${formatDuration(node.element.duration)}`
                    : formatDuration(node.element.duration);
            }
            if (description) {
                dom.append(data.label, dom.$('span.test-label-description', {}, description));
            }
        }
    };
    TestItemRenderer = TestItemRenderer_1 = __decorate([
        __param(1, actions_2.IMenuService),
        __param(2, testService_1.ITestService),
        __param(3, testProfileService_1.ITestProfileService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, testingContinuousRunService_1.ITestingContinuousRunService)
    ], TestItemRenderer);
    const formatDuration = (ms) => {
        if (ms < 10) {
            return `${ms.toFixed(1)}ms`;
        }
        if (ms < 1_000) {
            return `${ms.toFixed(0)}ms`;
        }
        return `${(ms / 1000).toFixed(1)}s`;
    };
    const getActionableElementActions = (contextKeyService, menuService, testService, crService, profiles, element) => {
        const test = element instanceof index_1.TestItemTreeElement ? element.test : undefined;
        const contextKeys = (0, testItemContextOverlay_1.getTestItemContextOverlay)(test, test ? profiles.capabilitiesForTest(test) : 0);
        contextKeys.push(['view', "workbench.view.testing" /* Testing.ExplorerViewId */]);
        if (test) {
            const ctrl = testService.getTestController(test.controllerId);
            const supportsCr = !!ctrl && profiles.getControllerProfiles(ctrl.id).some(p => p.supportsContinuousRun);
            contextKeys.push([
                testingContextKeys_1.TestingContextKeys.canRefreshTests.key,
                !!ctrl?.canRefresh.value && testId_1.TestId.isRoot(test.item.extId),
            ], [
                testingContextKeys_1.TestingContextKeys.testItemIsHidden.key,
                testService.excluded.contains(test)
            ], [
                testingContextKeys_1.TestingContextKeys.isContinuousModeOn.key,
                supportsCr && crService.isSpecificallyEnabledFor(test.item.extId)
            ], [
                testingContextKeys_1.TestingContextKeys.isParentRunningContinuously.key,
                supportsCr && crService.isEnabledForAParentOf(test.item.extId)
            ], [
                testingContextKeys_1.TestingContextKeys.supportsContinuousRun.key,
                supportsCr,
            ]);
        }
        const contextOverlay = contextKeyService.createOverlay(contextKeys);
        const menu = menuService.createMenu(actions_2.MenuId.TestItem, contextOverlay);
        try {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, {
                shouldForwardArgs: true,
            }, result, 'inline');
            return { actions: result, contextOverlay };
        }
        finally {
            menu.dispose();
        }
    };
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        if (theme.type === 'dark') {
            const foregroundColor = theme.getColor(colorRegistry_1.foreground);
            if (foregroundColor) {
                const fgWithOpacity = new color_1.Color(new color_1.RGBA(foregroundColor.rgba.r, foregroundColor.rgba.g, foregroundColor.rgba.b, 0.65));
                collector.addRule(`.test-explorer .test-explorer-messages { color: ${fgWithOpacity}; }`);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0V4cGxvcmVyVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9icm93c2VyL3Rlc3RpbmdFeHBsb3JlclZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThFaEcsSUFBVyxjQUdWO0lBSEQsV0FBVyxjQUFjO1FBQ3hCLHFEQUFLLENBQUE7UUFDTCxtREFBSSxDQUFBO0lBQ0wsQ0FBQyxFQUhVLGNBQWMsS0FBZCxjQUFjLFFBR3hCO0lBRU0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxtQkFBUTtRQVdoRCxJQUFXLG1CQUFtQjtZQUM3QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxpQkFBUyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVELFlBQ0MsT0FBNEIsRUFDUCxrQkFBdUMsRUFDeEMsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUMzQyxvQkFBMkMsRUFDMUMscUJBQTZDLEVBQ2pELGlCQUFxQyxFQUN6QyxhQUE2QixFQUM5QixZQUEyQixFQUM1QixXQUEwQyxFQUNyQyxnQkFBbUMsRUFDakMsa0JBQXdELEVBQzVELGNBQWdEO1lBRWpFLEtBQUssQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBTDVKLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBRWxCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDM0MsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBMUIxRCxvQkFB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