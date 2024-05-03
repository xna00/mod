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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/formattedTextRenderer", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/button/button", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/ui/toggle/toggle", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/errors", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/themables", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages/language", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/opener/browser/link", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/workbench/browser/actions/windowActions", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/contextkeys", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedDetailsRenderer", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedIcons", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/workbench/contrib/welcomeGettingStarted/browser/startupPage", "vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/host/browser/host", "vs/workbench/services/themes/common/workbenchThemeService", "./gettingStartedList", "vs/workbench/services/assignment/common/assignmentService", "vs/css!./media/gettingStarted", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedColors"], function (require, exports, dom_1, formattedTextRenderer_1, keyboardEvent_1, button_1, iconLabels_1, scrollableElement_1, toggle_1, arrays_1, async_1, codicons_1, errors_1, labels_1, lifecycle_1, marshalling_1, network_1, platform_1, themables_1, types_1, uri_1, uuid_1, language_1, markdownRenderer_1, nls_1, accessibility_1, commands_1, configuration_1, contextkey_1, files_1, instantiation_1, keybinding_1, label_1, notification_1, link_1, opener_1, productService_1, quickInput_1, storage_1, telemetry_1, telemetryUtils_1, defaultStyles_1, themeService_1, workspace_1, workspaces_1, windowActions_1, workspaceActions_1, editorPane_1, contextkeys_1, webview_1, gettingStartedDetailsRenderer_1, gettingStartedIcons_1, gettingStartedInput_1, gettingStartedService_1, startupPage_1, gettingStartedContent_1, editorGroupsService_1, extensions_1, host_1, workbenchThemeService_1, gettingStartedList_1, assignmentService_1) {
    "use strict";
    var GettingStartedPage_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedInputSerializer = exports.GettingStartedPage = exports.inWelcomeContext = exports.allWalkthroughsHiddenContext = void 0;
    const SLIDE_TRANSITION_TIME_MS = 250;
    const configurationKey = 'workbench.startupEditor';
    exports.allWalkthroughsHiddenContext = new contextkey_1.RawContextKey('allWalkthroughsHidden', false);
    exports.inWelcomeContext = new contextkey_1.RawContextKey('inWelcome', false);
    const parsedStartEntries = gettingStartedContent_1.startEntries.map((e, i) => ({
        command: e.content.command,
        description: e.description,
        icon: { type: 'icon', icon: e.icon },
        id: e.id,
        order: i,
        title: e.title,
        when: contextkey_1.ContextKeyExpr.deserialize(e.when) ?? contextkey_1.ContextKeyExpr.true()
    }));
    const REDUCED_MOTION_KEY = 'workbench.welcomePage.preferReducedMotion';
    let GettingStartedPage = class GettingStartedPage extends editorPane_1.EditorPane {
        static { GettingStartedPage_1 = this; }
        static { this.ID = 'gettingStartedPage'; }
        constructor(group, commandService, productService, keybindingService, gettingStartedService, configurationService, telemetryService, languageService, fileService, openerService, themeService, storageService, extensionService, instantiationService, notificationService, groupsService, contextService, quickInputService, workspacesService, labelService, hostService, webviewService, workspaceContextService, accessibilityService, tasExperimentService) {
            super(GettingStartedPage_1.ID, group, telemetryService, themeService, storageService);
            this.commandService = commandService;
            this.productService = productService;
            this.keybindingService = keybindingService;
            this.gettingStartedService = gettingStartedService;
            this.configurationService = configurationService;
            this.languageService = languageService;
            this.fileService = fileService;
            this.openerService = openerService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.groupsService = groupsService;
            this.quickInputService = quickInputService;
            this.workspacesService = workspacesService;
            this.labelService = labelService;
            this.hostService = hostService;
            this.webviewService = webviewService;
            this.workspaceContextService = workspaceContextService;
            this.accessibilityService = accessibilityService;
            this.tasExperimentService = tasExperimentService;
            this.inProgressScroll = Promise.resolve();
            this.dispatchListeners = new lifecycle_1.DisposableStore();
            this.stepDisposables = new lifecycle_1.DisposableStore();
            this.detailsPageDisposables = new lifecycle_1.DisposableStore();
            this.mediaDisposables = new lifecycle_1.DisposableStore();
            this.buildSlideThrottle = new async_1.Throttler();
            this.hasScrolledToFirstCategory = false;
            this.showFeaturedWalkthrough = true;
            this.currentMediaComponent = undefined;
            this.currentMediaType = undefined;
            this.container = (0, dom_1.$)('.gettingStartedContainer', {
                role: 'document',
                tabindex: 0,
                'aria-label': (0, nls_1.localize)('welcomeAriaLabel', "Overview of how to get up to speed with your editor.")
            });
            this.stepMediaComponent = (0, dom_1.$)('.getting-started-media');
            this.stepMediaComponent.id = (0, uuid_1.generateUuid)();
            this.categoriesSlideDisposables = this._register(new lifecycle_1.DisposableStore());
            this.detailsRenderer = new gettingStartedDetailsRenderer_1.GettingStartedDetailsRenderer(this.fileService, this.notificationService, this.extensionService, this.languageService);
            this.contextService = this._register(contextService.createScoped(this.container));
            exports.inWelcomeContext.bindTo(this.contextService).set(true);
            this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
            this._register(this.dispatchListeners);
            this.buildSlideThrottle = new async_1.Throttler();
            const rerender = () => {
                this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
                if (this.currentWalkthrough) {
                    const existingSteps = this.currentWalkthrough.steps.map(step => step.id);
                    const newCategory = this.gettingStartedCategories.find(category => this.currentWalkthrough?.id === category.id);
                    if (newCategory) {
                        const newSteps = newCategory.steps.map(step => step.id);
                        if (!(0, arrays_1.equals)(newSteps, existingSteps)) {
                            this.buildSlideThrottle.queue(() => this.buildCategoriesSlide());
                        }
                    }
                }
                else {
                    this.buildSlideThrottle.queue(() => this.buildCategoriesSlide());
                }
            };
            this._register(this.gettingStartedService.onDidAddWalkthrough(rerender));
            this._register(this.gettingStartedService.onDidRemoveWalkthrough(rerender));
            this.recentlyOpened = this.workspacesService.getRecentlyOpened();
            this._register(workspacesService.onDidChangeRecentlyOpened(() => {
                this.recentlyOpened = workspacesService.getRecentlyOpened();
                rerender();
            }));
            this._register(this.gettingStartedService.onDidChangeWalkthrough(category => {
                const ourCategory = this.gettingStartedCategories.find(c => c.id === category.id);
                if (!ourCategory) {
                    return;
                }
                ourCategory.title = category.title;
                ourCategory.description = category.description;
                this.container.querySelectorAll(`[x-category-title-for="${category.id}"]`).forEach(step => step.innerText = ourCategory.title);
                this.container.querySelectorAll(`[x-category-description-for="${category.id}"]`).forEach(step => step.innerText = ourCategory.description);
            }));
            this._register(this.gettingStartedService.onDidProgressStep(step => {
                const category = this.gettingStartedCategories.find(category => category.id === step.category);
                if (!category) {
                    throw Error('Could not find category with ID: ' + step.category);
                }
                const ourStep = category.steps.find(_step => _step.id === step.id);
                if (!ourStep) {
                    throw Error('Could not find step with ID: ' + step.id);
                }
                const stats = this.getWalkthroughCompletionStats(category);
                if (!ourStep.done && stats.stepsComplete === stats.stepsTotal - 1) {
                    this.hideCategory(category.id);
                }
                this._register(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(REDUCED_MOTION_KEY)) {
                        this.container.classList.toggle('animatable', this.shouldAnimate());
                    }
                }));
                ourStep.done = step.done;
                if (category.id === this.currentWalkthrough?.id) {
                    const badgeelements = (0, types_1.assertIsDefined)(this.window.document.querySelectorAll(`[data-done-step-id="${step.id}"]`));
                    badgeelements.forEach(badgeelement => {
                        if (step.done) {
                            badgeelement.setAttribute('aria-checked', 'true');
                            badgeelement.parentElement?.setAttribute('aria-checked', 'true');
                            badgeelement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedUncheckedCodicon));
                            badgeelement.classList.add('complete', ...themables_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedCheckedCodicon));
                        }
                        else {
                            badgeelement.setAttribute('aria-checked', 'false');
                            badgeelement.parentElement?.setAttribute('aria-checked', 'false');
                            badgeelement.classList.remove('complete', ...themables_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedCheckedCodicon));
                            badgeelement.classList.add(...themables_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedUncheckedCodicon));
                        }
                    });
                }
                this.updateCategoryProgress();
            }));
            this._register(this.storageService.onWillSaveState((e) => {
                if (e.reason !== storage_1.WillSaveStateReason.SHUTDOWN) {
                    return;
                }
                if (this.workspaceContextService.getWorkspace().folders.length !== 0) {
                    return;
                }
                if (!this.editorInput || !this.currentWalkthrough || !this.editorInput.selectedCategory || !this.editorInput.selectedStep) {
                    return;
                }
                // Save the state of the walkthrough so we can restore it on reload
                const restoreData = { folder: workspace_1.UNKNOWN_EMPTY_WINDOW_WORKSPACE.id, category: this.editorInput.selectedCategory, step: this.editorInput.selectedStep };
                this.storageService.store(startupPage_1.restoreWalkthroughsConfigurationKey, JSON.stringify(restoreData), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            }));
        }
        // remove when 'workbench.welcomePage.preferReducedMotion' deprecated
        shouldAnimate() {
            if (this.configurationService.getValue(REDUCED_MOTION_KEY)) {
                return false;
            }
            if (this.accessibilityService.isMotionReduced()) {
                return false;
            }
            return true;
        }
        getWalkthroughCompletionStats(walkthrough) {
            const activeSteps = walkthrough.steps.filter(s => this.contextService.contextMatchesRules(s.when));
            return {
                stepsComplete: activeSteps.filter(s => s.done).length,
                stepsTotal: activeSteps.length,
            };
        }
        async setInput(newInput, options, context, token) {
            this.container.classList.remove('animatable');
            this.editorInput = newInput;
            await super.setInput(newInput, options, context, token);
            await this.buildCategoriesSlide();
            if (this.shouldAnimate()) {
                setTimeout(() => this.container.classList.add('animatable'), 0);
            }
        }
        async makeCategoryVisibleWhenAvailable(categoryID, stepId) {
            this.scrollToCategory(categoryID, stepId);
        }
        registerDispatchListeners() {
            this.dispatchListeners.clear();
            this.container.querySelectorAll('[x-dispatch]').forEach(element => {
                const dispatch = element.getAttribute('x-dispatch') ?? '';
                let command, argument;
                if (dispatch.startsWith('openLink:https')) {
                    [command, argument] = ['openLink', dispatch.replace('openLink:', '')];
                }
                else {
                    [command, argument] = dispatch.split(':');
                }
                if (command) {
                    this.dispatchListeners.add((0, dom_1.addDisposableListener)(element, 'click', (e) => {
                        e.stopPropagation();
                        this.runDispatchCommand(command, argument);
                    }));
                    this.dispatchListeners.add((0, dom_1.addDisposableListener)(element, 'keyup', (e) => {
                        const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                        e.stopPropagation();
                        switch (keyboardEvent.keyCode) {
                            case 3 /* KeyCode.Enter */:
                            case 10 /* KeyCode.Space */:
                                this.runDispatchCommand(command, argument);
                                return;
                        }
                    }));
                }
            });
        }
        async runDispatchCommand(command, argument) {
            this.commandService.executeCommand('workbench.action.keepEditor');
            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command, argument, walkthroughId: this.currentWalkthrough?.id });
            switch (command) {
                case 'scrollPrev': {
                    this.scrollPrev();
                    break;
                }
                case 'skip': {
                    this.runSkip();
                    break;
                }
                case 'showMoreRecents': {
                    this.commandService.executeCommand(windowActions_1.OpenRecentAction.ID);
                    break;
                }
                case 'seeAllWalkthroughs': {
                    await this.openWalkthroughSelector();
                    break;
                }
                case 'openFolder': {
                    if (this.contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))) {
                        this.commandService.executeCommand(workspaceActions_1.OpenFolderViaWorkspaceAction.ID);
                    }
                    else {
                        this.commandService.executeCommand(platform_1.isMacintosh ? 'workbench.action.files.openFileFolder' : 'workbench.action.files.openFolder');
                    }
                    break;
                }
                case 'selectCategory': {
                    this.scrollToCategory(argument);
                    this.gettingStartedService.markWalkthroughOpened(argument);
                    break;
                }
                case 'selectStartEntry': {
                    const selected = gettingStartedContent_1.startEntries.find(e => e.id === argument);
                    if (selected) {
                        this.runStepCommand(selected.content.command);
                    }
                    else {
                        throw Error('could not find start entry with id: ' + argument);
                    }
                    break;
                }
                case 'hideCategory': {
                    this.hideCategory(argument);
                    break;
                }
                // Use selectTask over selectStep to keep telemetry consistant:https://github.com/microsoft/vscode/issues/122256
                case 'selectTask': {
                    this.selectStep(argument);
                    break;
                }
                case 'toggleStepCompletion': {
                    this.toggleStepCompletion(argument);
                    break;
                }
                case 'allDone': {
                    this.markAllStepsComplete();
                    break;
                }
                case 'nextSection': {
                    const next = this.currentWalkthrough?.next;
                    if (next) {
                        this.scrollToCategory(next);
                    }
                    else {
                        console.error('Error scrolling to next section of', this.currentWalkthrough);
                    }
                    break;
                }
                case 'hideVideos': {
                    this.hideVideos();
                    break;
                }
                case 'openLink': {
                    this.openerService.open(argument);
                    break;
                }
                default: {
                    console.error('Dispatch to', command, argument, 'not defined');
                    break;
                }
            }
        }
        hideCategory(categoryId) {
            const selectedCategory = this.gettingStartedCategories.find(category => category.id === categoryId);
            if (!selectedCategory) {
                throw Error('Could not find category with ID ' + categoryId);
            }
            this.setHiddenCategories([...this.getHiddenCategories().add(categoryId)]);
            this.gettingStartedList?.rerender();
        }
        hideVideos() {
            this.setHiddenCategories([...this.getHiddenCategories().add('getting-started-videos')]);
            this.videoList?.setEntries(undefined);
        }
        markAllStepsComplete() {
            if (this.currentWalkthrough) {
                this.currentWalkthrough?.steps.forEach(step => {
                    if (!step.done) {
                        this.gettingStartedService.progressStep(step.id);
                    }
                });
                this.hideCategory(this.currentWalkthrough?.id);
                this.scrollPrev();
            }
            else {
                throw Error('No walkthrough opened');
            }
        }
        toggleStepCompletion(argument) {
            const stepToggle = (0, types_1.assertIsDefined)(this.currentWalkthrough?.steps.find(step => step.id === argument));
            if (stepToggle.done) {
                this.gettingStartedService.deprogressStep(argument);
            }
            else {
                this.gettingStartedService.progressStep(argument);
            }
        }
        async openWalkthroughSelector() {
            const selection = await this.quickInputService.pick(this.gettingStartedCategories
                .filter(c => this.contextService.contextMatchesRules(c.when))
                .map(x => ({
                id: x.id,
                label: x.title,
                detail: x.description,
                description: x.source,
            })), { canPickMany: false, matchOnDescription: true, matchOnDetail: true, title: (0, nls_1.localize)('pickWalkthroughs', "Open Walkthrough...") });
            if (selection) {
                this.runDispatchCommand('selectCategory', selection.id);
            }
        }
        getHiddenCategories() {
            return new Set(JSON.parse(this.storageService.get(gettingStartedService_1.hiddenEntriesConfigurationKey, 0 /* StorageScope.PROFILE */, '[]')));
        }
        setHiddenCategories(hidden) {
            this.storageService.store(gettingStartedService_1.hiddenEntriesConfigurationKey, JSON.stringify(hidden), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        async buildMediaComponent(stepId, forceRebuild = false) {
            if (!this.currentWalkthrough) {
                throw Error('no walkthrough selected');
            }
            const stepToExpand = (0, types_1.assertIsDefined)(this.currentWalkthrough.steps.find(step => step.id === stepId));
            if (!forceRebuild && this.currentMediaComponent === stepId) {
                return;
            }
            this.currentMediaComponent = stepId;
            this.stepDisposables.clear();
            this.stepDisposables.add({
                dispose: () => {
                    this.currentMediaComponent = undefined;
                }
            });
            if (this.currentMediaType !== stepToExpand.media.type) {
                this.currentMediaType = stepToExpand.media.type;
                this.mediaDisposables.add((0, lifecycle_1.toDisposable)(() => {
                    this.currentMediaType = undefined;
                }));
                (0, dom_1.clearNode)(this.stepMediaComponent);
                if (stepToExpand.media.type === 'svg') {
                    this.webview = this.mediaDisposables.add(this.webviewService.createWebviewElement({ title: undefined, options: { disableServiceWorker: true }, contentOptions: {}, extension: undefined }));
                    this.webview.mountTo(this.stepMediaComponent, this.window);
                }
                else if (stepToExpand.media.type === 'markdown') {
                    this.webview = this.mediaDisposables.add(this.webviewService.createWebviewElement({ options: {}, contentOptions: { localResourceRoots: [stepToExpand.media.root], allowScripts: true }, title: '', extension: undefined }));
                    this.webview.mountTo(this.stepMediaComponent, this.window);
                }
            }
            if (stepToExpand.media.type === 'image') {
                this.stepsContent.classList.add('image');
                this.stepsContent.classList.remove('markdown');
                const media = stepToExpand.media;
                const mediaElement = (0, dom_1.$)('img');
                (0, dom_1.clearNode)(this.stepMediaComponent);
                this.stepMediaComponent.appendChild(mediaElement);
                mediaElement.setAttribute('alt', media.altText);
                this.updateMediaSourceForColorMode(mediaElement, media.path);
                this.stepDisposables.add((0, dom_1.addDisposableListener)(this.stepMediaComponent, 'click', () => {
                    const hrefs = (0, arrays_1.flatten)(stepToExpand.description.map(lt => lt.nodes.filter((node) => typeof node !== 'string').map(node => node.href)));
                    if (hrefs.length === 1) {
                        const href = hrefs[0];
                        if (href.startsWith('http')) {
                            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'runStepAction', argument: href, walkthroughId: this.currentWalkthrough?.id });
                            this.openerService.open(href);
                        }
                    }
                }));
                this.stepDisposables.add(this.themeService.onDidColorThemeChange(() => this.updateMediaSourceForColorMode(mediaElement, media.path)));
            }
            else if (stepToExpand.media.type === 'svg') {
                this.stepsContent.classList.add('image');
                this.stepsContent.classList.remove('markdown');
                const media = stepToExpand.media;
                this.webview.setHtml(await this.detailsRenderer.renderSVG(media.path));
                let isDisposed = false;
                this.stepDisposables.add((0, lifecycle_1.toDisposable)(() => { isDisposed = true; }));
                this.stepDisposables.add(this.themeService.onDidColorThemeChange(async () => {
                    // Render again since color vars change
                    const body = await this.detailsRenderer.renderSVG(media.path);
                    if (!isDisposed) { // Make sure we weren't disposed of in the meantime
                        this.webview.setHtml(body);
                    }
                }));
                this.stepDisposables.add((0, dom_1.addDisposableListener)(this.stepMediaComponent, 'click', () => {
                    const hrefs = (0, arrays_1.flatten)(stepToExpand.description.map(lt => lt.nodes.filter((node) => typeof node !== 'string').map(node => node.href)));
                    if (hrefs.length === 1) {
                        const href = hrefs[0];
                        if (href.startsWith('http')) {
                            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'runStepAction', argument: href, walkthroughId: this.currentWalkthrough?.id });
                            this.openerService.open(href);
                        }
                    }
                }));
                this.stepDisposables.add(this.webview.onDidClickLink(link => {
                    if ((0, network_1.matchesScheme)(link, network_1.Schemas.https) || (0, network_1.matchesScheme)(link, network_1.Schemas.http) || ((0, network_1.matchesScheme)(link, network_1.Schemas.command))) {
                        this.openerService.open(link, { allowCommands: true });
                    }
                }));
            }
            else if (stepToExpand.media.type === 'markdown') {
                this.stepsContent.classList.remove('image');
                this.stepsContent.classList.add('markdown');
                const media = stepToExpand.media;
                const rawHTML = await this.detailsRenderer.renderMarkdown(media.path, media.base);
                this.webview.setHtml(rawHTML);
                const serializedContextKeyExprs = rawHTML.match(/checked-on=\"([^'][^"]*)\"/g)?.map(attr => attr.slice('checked-on="'.length, -1)
                    .replace(/&#39;/g, '\'')
                    .replace(/&amp;/g, '&'));
                const postTrueKeysMessage = () => {
                    const enabledContextKeys = serializedContextKeyExprs?.filter(expr => this.contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(expr)));
                    if (enabledContextKeys) {
                        this.webview.postMessage({
                            enabledContextKeys
                        });
                    }
                };
                if (serializedContextKeyExprs) {
                    const contextKeyExprs = (0, arrays_1.coalesce)(serializedContextKeyExprs.map(expr => contextkey_1.ContextKeyExpr.deserialize(expr)));
                    const watchingKeys = new Set((0, arrays_1.flatten)(contextKeyExprs.map(expr => expr.keys())));
                    this.stepDisposables.add(this.contextService.onDidChangeContext(e => {
                        if (e.affectsSome(watchingKeys)) {
                            postTrueKeysMessage();
                        }
                    }));
                }
                let isDisposed = false;
                this.stepDisposables.add((0, lifecycle_1.toDisposable)(() => { isDisposed = true; }));
                this.stepDisposables.add(this.webview.onDidClickLink(link => {
                    if ((0, network_1.matchesScheme)(link, network_1.Schemas.https) || (0, network_1.matchesScheme)(link, network_1.Schemas.http) || ((0, network_1.matchesScheme)(link, network_1.Schemas.command))) {
                        const toSide = link.startsWith('command:toSide:');
                        if (toSide) {
                            link = link.replace('command:toSide:', 'command:');
                            this.focusSideEditorGroup();
                        }
                        this.openerService.open(link, { allowCommands: true, openToSide: toSide });
                    }
                }));
                if (rawHTML.indexOf('<code>') >= 0) {
                    // Render again when Theme changes since syntax highlighting of code blocks may have changed
                    this.stepDisposables.add(this.themeService.onDidColorThemeChange(async () => {
                        const body = await this.detailsRenderer.renderMarkdown(media.path, media.base);
                        if (!isDisposed) { // Make sure we weren't disposed of in the meantime
                            this.webview.setHtml(body);
                            postTrueKeysMessage();
                        }
                    }));
                }
                const layoutDelayer = new async_1.Delayer(50);
                this.layoutMarkdown = () => {
                    layoutDelayer.trigger(() => {
                        this.webview.postMessage({ layoutMeNow: true });
                    });
                };
                this.stepDisposables.add(layoutDelayer);
                this.stepDisposables.add({ dispose: () => this.layoutMarkdown = undefined });
                postTrueKeysMessage();
                this.stepDisposables.add(this.webview.onMessage(e => {
                    const message = e.message;
                    if (message.startsWith('command:')) {
                        this.openerService.open(message, { allowCommands: true });
                    }
                    else if (message.startsWith('setTheme:')) {
                        this.configurationService.updateValue(workbenchThemeService_1.ThemeSettings.COLOR_THEME, message.slice('setTheme:'.length), 2 /* ConfigurationTarget.USER */);
                    }
                    else {
                        console.error('Unexpected message', message);
                    }
                }));
            }
        }
        async selectStepLoose(id) {
            // Allow passing in id with a category appended or with just the id of the step
            if (id.startsWith(`${this.editorInput.selectedCategory}#`)) {
                this.selectStep(id);
            }
            else {
                const toSelect = this.editorInput.selectedCategory + '#' + id;
                this.selectStep(toSelect);
            }
        }
        async selectStep(id, delayFocus = true) {
            if (id) {
                let stepElement = this.container.querySelector(`[data-step-id="${id}"]`);
                if (!stepElement) {
                    // Selected an element that is not in-context, just fallback to whatever.
                    stepElement = this.container.querySelector(`[data-step-id]`);
                    if (!stepElement) {
                        // No steps around... just ignore.
                        return;
                    }
                    id = (0, types_1.assertIsDefined)(stepElement.getAttribute('data-step-id'));
                }
                stepElement.parentElement?.querySelectorAll('.expanded').forEach(node => {
                    if (node.getAttribute('data-step-id') !== id) {
                        node.classList.remove('expanded');
                        node.setAttribute('aria-expanded', 'false');
                    }
                });
                setTimeout(() => stepElement.focus(), delayFocus && this.shouldAnimate() ? SLIDE_TRANSITION_TIME_MS : 0);
                this.editorInput.selectedStep = id;
                stepElement.classList.add('expanded');
                stepElement.setAttribute('aria-expanded', 'true');
                this.buildMediaComponent(id, true);
                this.gettingStartedService.progressByEvent('stepSelected:' + id);
            }
            else {
                this.editorInput.selectedStep = undefined;
            }
            this.detailsPageScrollbar?.scanDomNode();
            this.detailsScrollbar?.scanDomNode();
        }
        updateMediaSourceForColorMode(element, sources) {
            const themeType = this.themeService.getColorTheme().type;
            const src = sources[themeType].toString(true).replace(/ /g, '%20');
            element.srcset = src.toLowerCase().endsWith('.svg') ? src : (src + ' 1.5x');
        }
        createEditor(parent) {
            if (this.detailsPageScrollbar) {
                this.detailsPageScrollbar.dispose();
            }
            if (this.categoriesPageScrollbar) {
                this.categoriesPageScrollbar.dispose();
            }
            this.categoriesSlide = (0, dom_1.$)('.gettingStartedSlideCategories.gettingStartedSlide');
            const prevButton = (0, dom_1.$)('button.prev-button.button-link', { 'x-dispatch': 'scrollPrev' }, (0, dom_1.$)('span.scroll-button.codicon.codicon-chevron-left'), (0, dom_1.$)('span.moreText', {}, (0, nls_1.localize)('welcome', "Welcome")));
            this.stepsSlide = (0, dom_1.$)('.gettingStartedSlideDetails.gettingStartedSlide', {}, prevButton);
            this.stepsContent = (0, dom_1.$)('.gettingStartedDetailsContent', {});
            this.detailsPageScrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.stepsContent, { className: 'full-height-scrollable' }));
            this.categoriesPageScrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.categoriesSlide, { className: 'full-height-scrollable categoriesScrollbar' }));
            this.stepsSlide.appendChild(this.detailsPageScrollbar.getDomNode());
            const gettingStartedPage = (0, dom_1.$)('.gettingStarted', {}, this.categoriesPageScrollbar.getDomNode(), this.stepsSlide);
            this.container.appendChild(gettingStartedPage);
            this.categoriesPageScrollbar.scanDomNode();
            this.detailsPageScrollbar.scanDomNode();
            parent.appendChild(this.container);
        }
        async buildCategoriesSlide() {
            this.categoriesSlideDisposables.clear();
            const showOnStartupCheckbox = new toggle_1.Toggle({
                icon: codicons_1.Codicon.check,
                actionClassName: 'getting-started-checkbox',
                isChecked: this.configurationService.getValue(configurationKey) === 'welcomePage',
                title: (0, nls_1.localize)('checkboxTitle', "When checked, this page will be shown on startup."),
                ...defaultStyles_1.defaultToggleStyles
            });
            showOnStartupCheckbox.domNode.id = 'showOnStartup';
            const showOnStartupLabel = (0, dom_1.$)('label.caption', { for: 'showOnStartup' }, (0, nls_1.localize)('welcomePage.showOnStartup', "Show welcome page on startup"));
            const onShowOnStartupChanged = () => {
                if (showOnStartupCheckbox.checked) {
                    this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'showOnStartupChecked', argument: undefined, walkthroughId: this.currentWalkthrough?.id });
                    this.configurationService.updateValue(configurationKey, 'welcomePage');
                }
                else {
                    this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'showOnStartupUnchecked', argument: undefined, walkthroughId: this.currentWalkthrough?.id });
                    this.configurationService.updateValue(configurationKey, 'none');
                }
            };
            this.categoriesSlideDisposables.add(showOnStartupCheckbox);
            this.categoriesSlideDisposables.add(showOnStartupCheckbox.onChange(() => {
                onShowOnStartupChanged();
            }));
            this.categoriesSlideDisposables.add((0, dom_1.addDisposableListener)(showOnStartupLabel, 'click', () => {
                showOnStartupCheckbox.checked = !showOnStartupCheckbox.checked;
                onShowOnStartupChanged();
            }));
            const header = (0, dom_1.$)('.header', {}, (0, dom_1.$)('h1.product-name.caption', {}, this.productService.nameLong), (0, dom_1.$)('p.subtitle.description', {}, (0, nls_1.localize)({ key: 'gettingStarted.editingEvolved', comment: ['Shown as subtitle on the Welcome page.'] }, "Editing evolved")));
            const leftColumn = (0, dom_1.$)('.categories-column.categories-column-left', {});
            const rightColumn = (0, dom_1.$)('.categories-column.categories-column-right', {});
            const startList = this.buildStartList();
            const recentList = this.buildRecentlyOpenedList();
            const showVideoTutorials = await Promise.race([
                this.tasExperimentService?.getTreatment('gettingStarted.showVideoTutorials'),
                new Promise(resolve => setTimeout(() => resolve(false), 200))
            ]);
            let videoList;
            if (showVideoTutorials === true) {
                this.showFeaturedWalkthrough = false;
                videoList = this.buildVideosList();
                const layoutVideos = () => {
                    if (videoList?.itemCount > 0) {
                        (0, dom_1.reset)(rightColumn, videoList?.getDomElement(), gettingStartedList.getDomElement());
                    }
                    else {
                        (0, dom_1.reset)(rightColumn, gettingStartedList.getDomElement());
                    }
                    setTimeout(() => this.categoriesPageScrollbar?.scanDomNode(), 50);
                    layoutRecentList();
                };
                videoList.onDidChange(layoutVideos);
            }
            const gettingStartedList = this.buildGettingStartedWalkthroughsList();
            const footer = (0, dom_1.$)('.footer', {}, (0, dom_1.$)('p.showOnStartup', {}, showOnStartupCheckbox.domNode, showOnStartupLabel));
            const layoutLists = () => {
                if (gettingStartedList.itemCount) {
                    this.container.classList.remove('noWalkthroughs');
                    if (videoList?.itemCount > 0) {
                        this.container.classList.remove('noVideos');
                        (0, dom_1.reset)(rightColumn, videoList?.getDomElement(), gettingStartedList.getDomElement());
                    }
                    else {
                        this.container.classList.add('noVideos');
                        (0, dom_1.reset)(rightColumn, gettingStartedList.getDomElement());
                    }
                }
                else {
                    this.container.classList.add('noWalkthroughs');
                    if (videoList?.itemCount > 0) {
                        this.container.classList.remove('noVideos');
                        (0, dom_1.reset)(rightColumn, videoList?.getDomElement());
                    }
                    else {
                        this.container.classList.add('noVideos');
                        (0, dom_1.reset)(rightColumn);
                    }
                }
                setTimeout(() => this.categoriesPageScrollbar?.scanDomNode(), 50);
                layoutRecentList();
            };
            const layoutRecentList = () => {
                if (this.container.classList.contains('noWalkthroughs') && this.container.classList.contains('noVideos')) {
                    recentList.setLimit(10);
                    (0, dom_1.reset)(leftColumn, startList.getDomElement());
                    (0, dom_1.reset)(rightColumn, recentList.getDomElement());
                }
                else {
                    recentList.setLimit(5);
                    (0, dom_1.reset)(leftColumn, startList.getDomElement(), recentList.getDomElement());
                }
            };
            gettingStartedList.onDidChange(layoutLists);
            layoutLists();
            (0, dom_1.reset)(this.categoriesSlide, (0, dom_1.$)('.gettingStartedCategoriesContainer', {}, header, leftColumn, rightColumn, footer));
            this.categoriesPageScrollbar?.scanDomNode();
            this.updateCategoryProgress();
            this.registerDispatchListeners();
            if (this.editorInput.selectedCategory) {
                this.currentWalkthrough = this.gettingStartedCategories.find(category => category.id === this.editorInput.selectedCategory);
                if (!this.currentWalkthrough) {
                    this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
                    this.currentWalkthrough = this.gettingStartedCategories.find(category => category.id === this.editorInput.selectedCategory);
                    if (this.currentWalkthrough) {
                        this.buildCategorySlide(this.editorInput.selectedCategory, this.editorInput.selectedStep);
                        this.setSlide('details');
                        return;
                    }
                }
                else {
                    this.buildCategorySlide(this.editorInput.selectedCategory, this.editorInput.selectedStep);
                    this.setSlide('details');
                    return;
                }
            }
            const someStepsComplete = this.gettingStartedCategories.some(category => category.steps.find(s => s.done));
            if (this.editorInput.showTelemetryNotice && this.productService.openToWelcomeMainPage) {
                const telemetryNotice = (0, dom_1.$)('p.telemetry-notice');
                this.buildTelemetryFooter(telemetryNotice);
                footer.appendChild(telemetryNotice);
            }
            else if (!this.productService.openToWelcomeMainPage && !someStepsComplete && !this.hasScrolledToFirstCategory && this.showFeaturedWalkthrough) {
                const firstSessionDateString = this.storageService.get(telemetry_1.firstSessionDateStorageKey, -1 /* StorageScope.APPLICATION */) || new Date().toUTCString();
                const daysSinceFirstSession = ((+new Date()) - (+new Date(firstSessionDateString))) / 1000 / 60 / 60 / 24;
                const fistContentBehaviour = daysSinceFirstSession < 1 ? 'openToFirstCategory' : 'index';
                if (fistContentBehaviour === 'openToFirstCategory') {
                    const first = this.gettingStartedCategories.filter(c => !c.when || this.contextService.contextMatchesRules(c.when))[0];
                    if (first) {
                        this.hasScrolledToFirstCategory = true;
                        this.currentWalkthrough = first;
                        this.editorInput.selectedCategory = this.currentWalkthrough?.id;
                        this.buildCategorySlide(this.editorInput.selectedCategory, undefined);
                        this.setSlide('details');
                        return;
                    }
                }
            }
            this.setSlide('categories');
        }
        buildRecentlyOpenedList() {
            const renderRecent = (recent) => {
                let fullPath;
                let windowOpenable;
                if ((0, workspaces_1.isRecentFolder)(recent)) {
                    windowOpenable = { folderUri: recent.folderUri };
                    fullPath = recent.label || this.labelService.getWorkspaceLabel(recent.folderUri, { verbose: 2 /* Verbosity.LONG */ });
                }
                else {
                    fullPath = recent.label || this.labelService.getWorkspaceLabel(recent.workspace, { verbose: 2 /* Verbosity.LONG */ });
                    windowOpenable = { workspaceUri: recent.workspace.configPath };
                }
                const { name, parentPath } = (0, labels_1.splitRecentLabel)(fullPath);
                const li = (0, dom_1.$)('li');
                const link = (0, dom_1.$)('button.button-link');
                link.innerText = name;
                link.title = fullPath;
                link.setAttribute('aria-label', (0, nls_1.localize)('welcomePage.openFolderWithPath', "Open folder {0} with path {1}", name, parentPath));
                link.addEventListener('click', e => {
                    this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'openRecent', argument: undefined, walkthroughId: this.currentWalkthrough?.id });
                    this.hostService.openWindow([windowOpenable], {
                        forceNewWindow: e.ctrlKey || e.metaKey,
                        remoteAuthority: recent.remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                    });
                    e.preventDefault();
                    e.stopPropagation();
                });
                li.appendChild(link);
                const span = (0, dom_1.$)('span');
                span.classList.add('path');
                span.classList.add('detail');
                span.innerText = parentPath;
                span.title = fullPath;
                li.appendChild(span);
                return li;
            };
            if (this.recentlyOpenedList) {
                this.recentlyOpenedList.dispose();
            }
            const recentlyOpenedList = this.recentlyOpenedList = new gettingStartedList_1.GettingStartedIndexList({
                title: (0, nls_1.localize)('recent', "Recent"),
                klass: 'recently-opened',
                limit: 5,
                empty: (0, dom_1.$)('.empty-recent', {}, (0, nls_1.localize)('noRecents', "You have no recent folders,"), (0, dom_1.$)('button.button-link', { 'x-dispatch': 'openFolder' }, (0, nls_1.localize)('openFolder', "open a folder")), (0, nls_1.localize)('toStart', "to start.")),
                more: (0, dom_1.$)('.more', {}, (0, dom_1.$)('button.button-link', {
                    'x-dispatch': 'showMoreRecents',
                    title: (0, nls_1.localize)('show more recents', "Show All Recent Folders {0}", this.getKeybindingLabel(windowActions_1.OpenRecentAction.ID))
                }, (0, nls_1.localize)('showAll', "More..."))),
                renderElement: renderRecent,
                contextService: this.contextService
            });
            recentlyOpenedList.onDidChange(() => this.registerDispatchListeners());
            this.recentlyOpened.then(({ workspaces }) => {
                // Filter out the current workspace
                const workspacesWithID = workspaces
                    .filter(recent => !this.workspaceContextService.isCurrentWorkspace((0, workspaces_1.isRecentWorkspace)(recent) ? recent.workspace : recent.folderUri))
                    .map(recent => ({ ...recent, id: (0, workspaces_1.isRecentWorkspace)(recent) ? recent.workspace.id : recent.folderUri.toString() }));
                const updateEntries = () => {
                    recentlyOpenedList.setEntries(workspacesWithID);
                };
                updateEntries();
                recentlyOpenedList.register(this.labelService.onDidChangeFormatters(() => updateEntries()));
            }).catch(errors_1.onUnexpectedError);
            return recentlyOpenedList;
        }
        buildStartList() {
            const renderStartEntry = (entry) => (0, dom_1.$)('li', {}, (0, dom_1.$)('button.button-link', {
                'x-dispatch': 'selectStartEntry:' + entry.id,
                title: entry.description + ' ' + this.getKeybindingLabel(entry.command),
            }, this.iconWidgetFor(entry), (0, dom_1.$)('span', {}, entry.title)));
            if (this.startList) {
                this.startList.dispose();
            }
            const startList = this.startList = new gettingStartedList_1.GettingStartedIndexList({
                title: (0, nls_1.localize)('start', "Start"),
                klass: 'start-container',
                limit: 10,
                renderElement: renderStartEntry,
                rankElement: e => -e.order,
                contextService: this.contextService
            });
            startList.setEntries(parsedStartEntries);
            startList.onDidChange(() => this.registerDispatchListeners());
            return startList;
        }
        buildGettingStartedWalkthroughsList() {
            const renderGetttingStaredWalkthrough = (category) => {
                const renderNewBadge = (category.newItems || category.newEntry) && !category.isFeatured;
                const newBadge = (0, dom_1.$)('.new-badge', {});
                if (category.newEntry) {
                    (0, dom_1.reset)(newBadge, (0, dom_1.$)('.new-category', {}, (0, nls_1.localize)('new', "New")));
                }
                else if (category.newItems) {
                    (0, dom_1.reset)(newBadge, (0, dom_1.$)('.new-items', {}, (0, nls_1.localize)({ key: 'newItems', comment: ['Shown when a list of items has changed based on an update from a remote source'] }, "Updated")));
                }
                const featuredBadge = (0, dom_1.$)('.featured-badge', {});
                const descriptionContent = (0, dom_1.$)('.description-content', {});
                if (category.isFeatured && this.showFeaturedWalkthrough) {
                    (0, dom_1.reset)(featuredBadge, (0, dom_1.$)('.featured', {}, (0, dom_1.$)('span.featured-icon.codicon.codicon-star-full')));
                    (0, dom_1.reset)(descriptionContent, ...(0, iconLabels_1.renderLabelWithIcons)(category.description));
                }
                const titleContent = (0, dom_1.$)('h3.category-title.max-lines-3', { 'x-category-title-for': category.id });
                (0, dom_1.reset)(titleContent, ...(0, iconLabels_1.renderLabelWithIcons)(category.title));
                return (0, dom_1.$)('button.getting-started-category' + (category.isFeatured && this.showFeaturedWalkthrough ? '.featured' : ''), {
                    'x-dispatch': 'selectCategory:' + category.id,
                    'title': category.description
                }, featuredBadge, (0, dom_1.$)('.main-content', {}, this.iconWidgetFor(category), titleContent, renderNewBadge ? newBadge : (0, dom_1.$)('.no-badge'), (0, dom_1.$)('a.codicon.codicon-close.hide-category-button', {
                    'tabindex': 0,
                    'x-dispatch': 'hideCategory:' + category.id,
                    'title': (0, nls_1.localize)('close', "Hide"),
                    'role': 'button',
                    'aria-label': (0, nls_1.localize)('closeAriaLabel', "Hide"),
                })), descriptionContent, (0, dom_1.$)('.category-progress', { 'x-data-category-id': category.id, }, (0, dom_1.$)('.progress-bar-outer', { 'role': 'progressbar' }, (0, dom_1.$)('.progress-bar-inner'))));
            };
            if (this.gettingStartedList) {
                this.gettingStartedList.dispose();
            }
            const rankWalkthrough = (e) => {
                let rank = e.order;
                if (e.isFeatured) {
                    rank += 7;
                }
                if (e.newEntry) {
                    rank += 3;
                }
                if (e.newItems) {
                    rank += 2;
                }
                if (e.recencyBonus) {
                    rank += 4 * e.recencyBonus;
                }
                if (this.getHiddenCategories().has(e.id)) {
                    rank = null;
                }
                return rank;
            };
            const gettingStartedList = this.gettingStartedList = new gettingStartedList_1.GettingStartedIndexList({
                title: (0, nls_1.localize)('walkthroughs', "Walkthroughs"),
                klass: 'getting-started',
                limit: 5,
                footer: (0, dom_1.$)('span.button-link.see-all-walkthroughs', { 'x-dispatch': 'seeAllWalkthroughs', 'tabindex': 0 }, (0, nls_1.localize)('showAll', "More...")),
                renderElement: renderGetttingStaredWalkthrough,
                rankElement: rankWalkthrough,
                contextService: this.contextService,
            });
            gettingStartedList.onDidChange(() => {
                const hidden = this.getHiddenCategories();
                const someWalkthroughsHidden = hidden.size || gettingStartedList.itemCount < this.gettingStartedCategories.filter(c => this.contextService.contextMatchesRules(c.when)).length;
                this.container.classList.toggle('someWalkthroughsHidden', !!someWalkthroughsHidden);
                this.registerDispatchListeners();
                exports.allWalkthroughsHiddenContext.bindTo(this.contextService).set(gettingStartedList.itemCount === 0);
                this.updateCategoryProgress();
            });
            gettingStartedList.setEntries(this.gettingStartedCategories);
            exports.allWalkthroughsHiddenContext.bindTo(this.contextService).set(gettingStartedList.itemCount === 0);
            return gettingStartedList;
        }
        buildVideosList() {
            const renderFeaturedExtensions = (entry) => {
                const featuredBadge = (0, dom_1.$)('.featured-badge', {});
                const descriptionContent = (0, dom_1.$)('.description-content', {});
                (0, dom_1.reset)(featuredBadge, (0, dom_1.$)('.featured', {}, (0, dom_1.$)('span.featured-icon.codicon.codicon-star-full')));
                (0, dom_1.reset)(descriptionContent, ...(0, iconLabels_1.renderLabelWithIcons)(entry.description));
                const titleContent = (0, dom_1.$)('h3.category-title.max-lines-3', { 'x-category-title-for': entry.id });
                (0, dom_1.reset)(titleContent, ...(0, iconLabels_1.renderLabelWithIcons)(entry.title));
                return (0, dom_1.$)('button.getting-started-category' + '.featured', {
                    'x-dispatch': 'openLink:' + entry.command,
                    'title': entry.title
                }, featuredBadge, (0, dom_1.$)('.main-content', {}, this.iconWidgetFor(entry), titleContent, (0, dom_1.$)('a.codicon.codicon-close.hide-category-button', {
                    'tabindex': 0,
                    'x-dispatch': 'hideVideos',
                    'title': (0, nls_1.localize)('close', "Hide"),
                    'role': 'button',
                    'aria-label': (0, nls_1.localize)('closeAriaLabel', "Hide"),
                })), descriptionContent);
            };
            if (this.videoList) {
                this.videoList.dispose();
            }
            const videoList = this.videoList = new gettingStartedList_1.GettingStartedIndexList({
                title: (0, nls_1.localize)('videos', "Videos"),
                klass: 'getting-started-videos',
                limit: 1,
                renderElement: renderFeaturedExtensions,
                contextService: this.contextService,
            });
            if (this.getHiddenCategories().has('getting-started-videos')) {
                return videoList;
            }
            videoList.setEntries([{
                    id: 'getting-started-videos',
                    title: (0, nls_1.localize)('videos-title', 'Watch Getting Started Tutorials'),
                    description: (0, nls_1.localize)('videos-description', 'Learn VS Code\'s must-have features in short and practical videos'),
                    command: 'https://aka.ms/vscode-getting-started-tutorials',
                    order: 0,
                    icon: { type: 'icon', icon: codicons_1.Codicon.deviceCameraVideo },
                    when: contextkey_1.ContextKeyExpr.true(),
                }]);
            videoList.onDidChange(() => this.registerDispatchListeners());
            return videoList;
        }
        layout(size) {
            this.detailsScrollbar?.scanDomNode();
            this.categoriesPageScrollbar?.scanDomNode();
            this.detailsPageScrollbar?.scanDomNode();
            this.startList?.layout(size);
            this.gettingStartedList?.layout(size);
            this.recentlyOpenedList?.layout(size);
            this.videoList?.layout(size);
            if (this.editorInput?.selectedStep && this.currentMediaType) {
                this.mediaDisposables.clear();
                this.stepDisposables.clear();
                this.buildMediaComponent(this.editorInput.selectedStep);
            }
            this.layoutMarkdown?.();
            this.container.classList.toggle('height-constrained', size.height <= 600);
            this.container.classList.toggle('width-constrained', size.width <= 400);
            this.container.classList.toggle('width-semi-constrained', size.width <= 800);
            this.categoriesPageScrollbar?.scanDomNode();
            this.detailsPageScrollbar?.scanDomNode();
            this.detailsScrollbar?.scanDomNode();
        }
        updateCategoryProgress() {
            this.window.document.querySelectorAll('.category-progress').forEach(element => {
                const categoryID = element.getAttribute('x-data-category-id');
                const category = this.gettingStartedCategories.find(category => category.id === categoryID);
                if (!category) {
                    throw Error('Could not find category with ID ' + categoryID);
                }
                const stats = this.getWalkthroughCompletionStats(category);
                const bar = (0, types_1.assertIsDefined)(element.querySelector('.progress-bar-inner'));
                bar.setAttribute('aria-valuemin', '0');
                bar.setAttribute('aria-valuenow', '' + stats.stepsComplete);
                bar.setAttribute('aria-valuemax', '' + stats.stepsTotal);
                const progress = (stats.stepsComplete / stats.stepsTotal) * 100;
                bar.style.width = `${progress}%`;
                element.parentElement.classList.toggle('no-progress', stats.stepsComplete === 0);
                if (stats.stepsTotal === stats.stepsComplete) {
                    bar.title = (0, nls_1.localize)('gettingStarted.allStepsComplete', "All {0} steps complete!", stats.stepsComplete);
                }
                else {
                    bar.title = (0, nls_1.localize)('gettingStarted.someStepsComplete', "{0} of {1} steps complete", stats.stepsComplete, stats.stepsTotal);
                }
            });
        }
        async scrollToCategory(categoryID, stepId) {
            if (!this.gettingStartedCategories.some(c => c.id === categoryID)) {
                this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
            }
            const ourCategory = this.gettingStartedCategories.find(c => c.id === categoryID);
            if (!ourCategory) {
                throw Error('Could not find category with ID: ' + categoryID);
            }
            this.inProgressScroll = this.inProgressScroll.then(async () => {
                (0, dom_1.reset)(this.stepsContent);
                this.editorInput.selectedCategory = categoryID;
                this.editorInput.selectedStep = stepId;
                this.currentWalkthrough = ourCategory;
                this.buildCategorySlide(categoryID, stepId);
                this.setSlide('details');
            });
        }
        iconWidgetFor(category) {
            const widget = category.icon.type === 'icon' ? (0, dom_1.$)(themables_1.ThemeIcon.asCSSSelector(category.icon.icon)) : (0, dom_1.$)('img.category-icon', { src: category.icon.path });
            widget.classList.add('icon-widget');
            return widget;
        }
        focusSideEditorGroup() {
            const fullSize = this.groupsService.getPart(this.group).contentDimension;
            if (!fullSize || fullSize.width <= 700) {
                return;
            }
            if (this.groupsService.count === 1) {
                const sideGroup = this.groupsService.addGroup(this.groupsService.groups[0], 3 /* GroupDirection.RIGHT */);
                this.groupsService.activateGroup(sideGroup);
                const gettingStartedSize = Math.floor(fullSize.width / 2);
                const gettingStartedGroup = this.groupsService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).find(group => (group.activeEditor instanceof gettingStartedInput_1.GettingStartedInput));
                this.groupsService.setSize((0, types_1.assertIsDefined)(gettingStartedGroup), { width: gettingStartedSize, height: fullSize.height });
            }
            const nonGettingStartedGroup = this.groupsService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).find(group => !(group.activeEditor instanceof gettingStartedInput_1.GettingStartedInput));
            if (nonGettingStartedGroup) {
                this.groupsService.activateGroup(nonGettingStartedGroup);
                nonGettingStartedGroup.focus();
            }
        }
        runStepCommand(href) {
            const isCommand = href.startsWith('command:');
            const toSide = href.startsWith('command:toSide:');
            const command = href.replace(/command:(toSide:)?/, 'command:');
            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'runStepAction', argument: href, walkthroughId: this.currentWalkthrough?.id });
            if (toSide) {
                this.focusSideEditorGroup();
            }
            if (isCommand) {
                const commandURI = uri_1.URI.parse(command);
                // execute as command
                let args = [];
                try {
                    args = (0, marshalling_1.parse)(decodeURIComponent(commandURI.query));
                }
                catch {
                    // ignore and retry
                    try {
                        args = (0, marshalling_1.parse)(commandURI.query);
                    }
                    catch {
                        // ignore error
                    }
                }
                if (!Array.isArray(args)) {
                    args = [args];
                }
                // If a step is requesting the OpenFolder action to be executed in an empty workspace...
                if ((commandURI.path === workspaceActions_1.OpenFileFolderAction.ID.toString() ||
                    commandURI.path === workspaceActions_1.OpenFolderAction.ID.toString()) &&
                    this.workspaceContextService.getWorkspace().folders.length === 0) {
                    const selectedStepIndex = this.currentWalkthrough?.steps.findIndex(step => step.id === this.editorInput.selectedStep);
                    // and there are a few more steps after this step which are yet to be completed...
                    if (selectedStepIndex !== undefined &&
                        selectedStepIndex > -1 &&
                        this.currentWalkthrough?.steps.slice(selectedStepIndex + 1).some(step => !step.done)) {
                        const restoreData = { folder: workspace_1.UNKNOWN_EMPTY_WINDOW_WORKSPACE.id, category: this.editorInput.selectedCategory, step: this.editorInput.selectedStep };
                        // save state to restore after reload
                        this.storageService.store(startupPage_1.restoreWalkthroughsConfigurationKey, JSON.stringify(restoreData), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                    }
                }
                this.commandService.executeCommand(commandURI.path, ...args).then(result => {
                    const toOpen = result?.openFolder;
                    if (toOpen) {
                        if (!uri_1.URI.isUri(toOpen)) {
                            console.warn('Warn: Running walkthrough command', href, 'yielded non-URI `openFolder` result', toOpen, '. It will be disregarded.');
                            return;
                        }
                        const restoreData = { folder: toOpen.toString(), category: this.editorInput.selectedCategory, step: this.editorInput.selectedStep };
                        this.storageService.store(startupPage_1.restoreWalkthroughsConfigurationKey, JSON.stringify(restoreData), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                        this.hostService.openWindow([{ folderUri: toOpen }]);
                    }
                });
            }
            else {
                this.openerService.open(command, { allowCommands: true });
            }
            if (!isCommand && (href.startsWith('https://') || href.startsWith('http://'))) {
                this.gettingStartedService.progressByEvent('onLink:' + href);
            }
        }
        buildMarkdownDescription(container, text) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            for (const linkedText of text) {
                if (linkedText.nodes.length === 1 && typeof linkedText.nodes[0] !== 'string') {
                    const node = linkedText.nodes[0];
                    const buttonContainer = (0, dom_1.append)(container, (0, dom_1.$)('.button-container'));
                    const button = new button_1.Button(buttonContainer, { title: node.title, supportIcons: true, ...defaultStyles_1.defaultButtonStyles });
                    const isCommand = node.href.startsWith('command:');
                    const command = node.href.replace(/command:(toSide:)?/, 'command:');
                    button.label = node.label;
                    button.onDidClick(e => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.runStepCommand(node.href);
                    }, null, this.detailsPageDisposables);
                    if (isCommand) {
                        const keybindingLabel = this.getKeybindingLabel(command);
                        if (keybindingLabel) {
                            container.appendChild((0, dom_1.$)('span.shortcut-message', {}, (0, nls_1.localize)('gettingStarted.keyboardTip', 'Tip: Use keyboard shortcut '), (0, dom_1.$)('span.keybinding', {}, keybindingLabel)));
                        }
                    }
                    this.detailsPageDisposables.add(button);
                }
                else {
                    const p = (0, dom_1.append)(container, (0, dom_1.$)('p'));
                    for (const node of linkedText.nodes) {
                        if (typeof node === 'string') {
                            const labelWithIcon = (0, iconLabels_1.renderLabelWithIcons)(node);
                            for (const element of labelWithIcon) {
                                if (typeof element === 'string') {
                                    p.appendChild((0, formattedTextRenderer_1.renderFormattedText)(element, { inline: true, renderCodeSegments: true }));
                                }
                                else {
                                    p.appendChild(element);
                                }
                            }
                        }
                        else {
                            const link = this.instantiationService.createInstance(link_1.Link, p, node, { opener: (href) => this.runStepCommand(href) });
                            this.detailsPageDisposables.add(link);
                        }
                    }
                }
            }
            return container;
        }
        clearInput() {
            this.stepDisposables.clear();
            super.clearInput();
        }
        buildCategorySlide(categoryID, selectedStep) {
            if (this.detailsScrollbar) {
                this.detailsScrollbar.dispose();
            }
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                // Remove internal extension id specifier from exposed id's
                this.extensionService.activateByEvent(`onWalkthrough:${categoryID.replace(/[^#]+#/, '')}`);
            });
            this.detailsPageDisposables.clear();
            this.mediaDisposables.clear();
            const category = this.gettingStartedCategories.find(category => category.id === categoryID);
            if (!category) {
                throw Error('could not find category with ID ' + categoryID);
            }
            const descriptionContainer = (0, dom_1.$)('.category-description.description.max-lines-3', { 'x-category-description-for': category.id });
            this.buildMarkdownDescription(descriptionContainer, (0, gettingStartedService_1.parseDescription)(category.description));
            const categoryDescriptorComponent = (0, dom_1.$)('.getting-started-category', {}, (0, dom_1.$)('.category-description-container', {}, (0, dom_1.$)('h2.category-title.max-lines-3', { 'x-category-title-for': category.id }, ...(0, iconLabels_1.renderLabelWithIcons)(category.title)), descriptionContainer));
            const stepListContainer = (0, dom_1.$)('.step-list-container');
            this.detailsPageDisposables.add((0, dom_1.addDisposableListener)(stepListContainer, 'keydown', (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                const currentStepIndex = () => category.steps.findIndex(e => e.id === this.editorInput.selectedStep);
                if (event.keyCode === 16 /* KeyCode.UpArrow */) {
                    const toExpand = category.steps.filter((step, index) => index < currentStepIndex() && this.contextService.contextMatchesRules(step.when));
                    if (toExpand.length) {
                        this.selectStep(toExpand[toExpand.length - 1].id, false);
                    }
                }
                if (event.keyCode === 18 /* KeyCode.DownArrow */) {
                    const toExpand = category.steps.find((step, index) => index > currentStepIndex() && this.contextService.contextMatchesRules(step.when));
                    if (toExpand) {
                        this.selectStep(toExpand.id, false);
                    }
                }
            }));
            let renderedSteps = undefined;
            const contextKeysToWatch = new Set(category.steps.flatMap(step => step.when.keys()));
            const buildStepList = () => {
                category.steps.sort((a, b) => a.order - b.order);
                const toRender = category.steps
                    .filter(step => this.contextService.contextMatchesRules(step.when));
                if ((0, arrays_1.equals)(renderedSteps, toRender, (a, b) => a.id === b.id)) {
                    return;
                }
                renderedSteps = toRender;
                (0, dom_1.reset)(stepListContainer, ...renderedSteps
                    .map(step => {
                    const codicon = (0, dom_1.$)('.codicon' + (step.done ? '.complete' + themables_1.ThemeIcon.asCSSSelector(gettingStartedIcons_1.gettingStartedCheckedCodicon) : themables_1.ThemeIcon.asCSSSelector(gettingStartedIcons_1.gettingStartedUncheckedCodicon)), {
                        'data-done-step-id': step.id,
                        'x-dispatch': 'toggleStepCompletion:' + step.id,
                        'role': 'checkbox',
                        'tabindex': '0',
                        'aria-checked': step.done ? 'true' : 'false'
                    });
                    const container = (0, dom_1.$)('.step-description-container', { 'x-step-description-for': step.id });
                    this.buildMarkdownDescription(container, step.description);
                    const stepTitle = (0, dom_1.$)('h3.step-title.max-lines-3', { 'x-step-title-for': step.id });
                    (0, dom_1.reset)(stepTitle, ...(0, iconLabels_1.renderLabelWithIcons)(step.title));
                    const stepDescription = (0, dom_1.$)('.step-container', {}, stepTitle, container);
                    if (step.media.type === 'image') {
                        stepDescription.appendChild((0, dom_1.$)('.image-description', { 'aria-label': (0, nls_1.localize)('imageShowing', "Image showing {0}", step.media.altText) }));
                    }
                    return (0, dom_1.$)('button.getting-started-step', {
                        'x-dispatch': 'selectTask:' + step.id,
                        'data-step-id': step.id,
                        'aria-expanded': 'false',
                        'aria-checked': step.done ? 'true' : 'false',
                        'role': 'button',
                    }, codicon, stepDescription);
                }));
            };
            buildStepList();
            this.detailsPageDisposables.add(this.contextService.onDidChangeContext(e => {
                if (e.affectsSome(contextKeysToWatch)) {
                    buildStepList();
                    this.registerDispatchListeners();
                    this.selectStep(this.editorInput.selectedStep, false);
                }
            }));
            const showNextCategory = this.gettingStartedCategories.find(_category => _category.id === category.next);
            const stepsContainer = (0, dom_1.$)('.getting-started-detail-container', { 'role': 'list' }, stepListContainer, (0, dom_1.$)('.done-next-container', {}, (0, dom_1.$)('button.button-link.all-done', { 'x-dispatch': 'allDone' }, (0, dom_1.$)('span.codicon.codicon-check-all'), (0, nls_1.localize)('allDone', "Mark Done")), ...(showNextCategory
                ? [(0, dom_1.$)('button.button-link.next', { 'x-dispatch': 'nextSection' }, (0, nls_1.localize)('nextOne', "Next Section"), (0, dom_1.$)('span.codicon.codicon-arrow-right'))]
                : [])));
            this.detailsScrollbar = this._register(new scrollableElement_1.DomScrollableElement(stepsContainer, { className: 'steps-container' }));
            const stepListComponent = this.detailsScrollbar.getDomNode();
            const categoryFooter = (0, dom_1.$)('.getting-started-footer');
            if (this.editorInput.showTelemetryNotice && (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService) !== 0 /* TelemetryLevel.NONE */ && this.productService.enableTelemetry) {
                this.buildTelemetryFooter(categoryFooter);
            }
            (0, dom_1.reset)(this.stepsContent, categoryDescriptorComponent, stepListComponent, this.stepMediaComponent, categoryFooter);
            const toExpand = category.steps.find(step => this.contextService.contextMatchesRules(step.when) && !step.done) ?? category.steps[0];
            this.selectStep(selectedStep ?? toExpand.id, !selectedStep);
            this.detailsScrollbar.scanDomNode();
            this.detailsPageScrollbar?.scanDomNode();
            this.registerDispatchListeners();
        }
        buildTelemetryFooter(parent) {
            const mdRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
            const privacyStatementCopy = (0, nls_1.localize)('privacy statement', "privacy statement");
            const privacyStatementButton = `[${privacyStatementCopy}](command:workbench.action.openPrivacyStatementUrl)`;
            const optOutCopy = (0, nls_1.localize)('optOut', "opt out");
            const optOutButton = `[${optOutCopy}](command:settings.filterByTelemetry)`;
            const text = (0, nls_1.localize)({ key: 'footer', comment: ['fist substitution is "vs code", second is "privacy statement", third is "opt out".'] }, "{0} collects usage data. Read our {1} and learn how to {2}.", this.productService.nameShort, privacyStatementButton, optOutButton);
            parent.append(mdRenderer.render({ value: text, isTrusted: true }).element);
            mdRenderer.dispose();
        }
        getKeybindingLabel(command) {
            command = command.replace(/^command:/, '');
            const label = this.keybindingService.lookupKeybinding(command)?.getLabel();
            if (!label) {
                return '';
            }
            else {
                return `(${label})`;
            }
        }
        async scrollPrev() {
            this.inProgressScroll = this.inProgressScroll.then(async () => {
                this.currentWalkthrough = undefined;
                this.editorInput.selectedCategory = undefined;
                this.editorInput.selectedStep = undefined;
                this.editorInput.showTelemetryNotice = false;
                if (this.gettingStartedCategories.length !== this.gettingStartedList?.itemCount) {
                    // extensions may have changed in the time since we last displayed the walkthrough list
                    // rebuild the list
                    this.buildCategoriesSlide();
                }
                this.selectStep(undefined);
                this.setSlide('categories');
                this.container.focus();
            });
        }
        runSkip() {
            this.commandService.executeCommand('workbench.action.closeActiveEditor');
        }
        escape() {
            if (this.editorInput.selectedCategory) {
                this.scrollPrev();
            }
            else {
                this.runSkip();
            }
        }
        setSlide(toEnable) {
            const slideManager = (0, types_1.assertIsDefined)(this.container.querySelector('.gettingStarted'));
            if (toEnable === 'categories') {
                slideManager.classList.remove('showDetails');
                slideManager.classList.add('showCategories');
                this.container.querySelector('.prev-button.button-link').style.display = 'none';
                this.container.querySelector('.gettingStartedSlideDetails').querySelectorAll('button').forEach(button => button.disabled = true);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('button').forEach(button => button.disabled = false);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('input').forEach(button => button.disabled = false);
            }
            else {
                slideManager.classList.add('showDetails');
                slideManager.classList.remove('showCategories');
                this.container.querySelector('.prev-button.button-link').style.display = 'block';
                this.container.querySelector('.gettingStartedSlideDetails').querySelectorAll('button').forEach(button => button.disabled = false);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('button').forEach(button => button.disabled = true);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('input').forEach(button => button.disabled = true);
            }
        }
        focus() {
            super.focus();
            const active = this.container.ownerDocument.activeElement;
            let parent = this.container.parentElement;
            while (parent && parent !== active) {
                parent = parent.parentElement;
            }
            if (parent) {
                // Only set focus if there is no other focued element outside this chain.
                // This prevents us from stealing back focus from other focused elements such as quick pick due to delayed load.
                this.container.focus();
            }
        }
    };
    exports.GettingStartedPage = GettingStartedPage;
    exports.GettingStartedPage = GettingStartedPage = GettingStartedPage_1 = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, productService_1.IProductService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, gettingStartedService_1.IWalkthroughsService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, language_1.ILanguageService),
        __param(8, files_1.IFileService),
        __param(9, opener_1.IOpenerService),
        __param(10, themeService_1.IThemeService),
        __param(11, storage_1.IStorageService),
        __param(12, extensions_1.IExtensionService),
        __param(13, instantiation_1.IInstantiationService),
        __param(14, notification_1.INotificationService),
        __param(15, editorGroupsService_1.IEditorGroupsService),
        __param(16, contextkey_1.IContextKeyService),
        __param(17, quickInput_1.IQuickInputService),
        __param(18, workspaces_1.IWorkspacesService),
        __param(19, label_1.ILabelService),
        __param(20, host_1.IHostService),
        __param(21, webview_1.IWebviewService),
        __param(22, workspace_1.IWorkspaceContextService),
        __param(23, accessibility_1.IAccessibilityService),
        __param(24, assignmentService_1.IWorkbenchAssignmentService)
    ], GettingStartedPage);
    class GettingStartedInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return JSON.stringify({ selectedCategory: editorInput.selectedCategory, selectedStep: editorInput.selectedStep });
        }
        deserialize(instantiationService, serializedEditorInput) {
            try {
                const { selectedCategory, selectedStep } = JSON.parse(serializedEditorInput);
                return new gettingStartedInput_1.GettingStartedInput({ selectedCategory, selectedStep });
            }
            catch { }
            return new gettingStartedInput_1.GettingStartedInput({});
        }
    }
    exports.GettingStartedInputSerializer = GettingStartedInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVHZXR0aW5nU3RhcnRlZC9icm93c2VyL2dldHRpbmdTdGFydGVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1RWhHLE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxDQUFDO0lBQ3JDLE1BQU0sZ0JBQWdCLEdBQUcseUJBQXlCLENBQUM7SUFFdEMsUUFBQSw0QkFBNEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUYsUUFBQSxnQkFBZ0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBWS9FLE1BQU0sa0JBQWtCLEdBQTZCLG9DQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNoRixPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPO1FBQzFCLFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBVztRQUMxQixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFO1FBQ3BDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRTtRQUNSLEtBQUssRUFBRSxDQUFDO1FBQ1IsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO1FBQ2QsSUFBSSxFQUFFLDJCQUFjLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSwyQkFBYyxDQUFDLElBQUksRUFBRTtLQUNqRSxDQUFDLENBQUMsQ0FBQztJQWtCSixNQUFNLGtCQUFrQixHQUFHLDJDQUEyQyxDQUFDO0lBQ2hFLElB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