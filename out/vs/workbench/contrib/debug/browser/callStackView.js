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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/strings", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugUtils", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, dom, actionbar_1, highlightedLabel_1, actions_1, async_1, codicons_1, event_1, filters_1, lifecycle_1, path_1, strings_1, nls_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, label_1, listService_1, notification_1, opener_1, telemetry_1, colorRegistry_1, themeService_1, themables_1, viewPane_1, views_1, baseDebugView_1, debugCommands_1, icons, debugToolBar_1, debug_1, debugModel_1, debugUtils_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var SessionsRenderer_1, ThreadsRenderer_1, StackFramesRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallStackView = void 0;
    exports.getContext = getContext;
    exports.getContextForContributedActions = getContextForContributedActions;
    exports.getSpecificSourceName = getSpecificSourceName;
    const $ = dom.$;
    function assignSessionContext(element, context) {
        context.sessionId = element.getId();
        return context;
    }
    function assignThreadContext(element, context) {
        context.threadId = element.getId();
        assignSessionContext(element.session, context);
        return context;
    }
    function assignStackFrameContext(element, context) {
        context.frameId = element.getId();
        context.frameName = element.name;
        context.frameLocation = { range: element.range, source: element.source.raw };
        assignThreadContext(element.thread, context);
        return context;
    }
    function getContext(element) {
        if (element instanceof debugModel_1.StackFrame) {
            return assignStackFrameContext(element, {});
        }
        else if (element instanceof debugModel_1.Thread) {
            return assignThreadContext(element, {});
        }
        else if (isDebugSession(element)) {
            return assignSessionContext(element, {});
        }
        else {
            return undefined;
        }
    }
    // Extensions depend on this context, should not be changed even though it is not fully deterministic
    function getContextForContributedActions(element) {
        if (element instanceof debugModel_1.StackFrame) {
            if (element.source.inMemory) {
                return element.source.raw.path || element.source.reference || element.source.name;
            }
            return element.source.uri.toString();
        }
        if (element instanceof debugModel_1.Thread) {
            return element.threadId;
        }
        if (isDebugSession(element)) {
            return element.getId();
        }
        return '';
    }
    function getSpecificSourceName(stackFrame) {
        // To reduce flashing of the path name and the way we fetch stack frames
        // We need to compute the source name based on the other frames in the stale call stack
        let callStack = stackFrame.thread.getStaleCallStack();
        callStack = callStack.length > 0 ? callStack : stackFrame.thread.getCallStack();
        const otherSources = callStack.map(sf => sf.source).filter(s => s !== stackFrame.source);
        let suffixLength = 0;
        otherSources.forEach(s => {
            if (s.name === stackFrame.source.name) {
                suffixLength = Math.max(suffixLength, (0, strings_1.commonSuffixLength)(stackFrame.source.uri.path, s.uri.path));
            }
        });
        if (suffixLength === 0) {
            return stackFrame.source.name;
        }
        const from = Math.max(0, stackFrame.source.uri.path.lastIndexOf(path_1.posix.sep, stackFrame.source.uri.path.length - suffixLength - 1));
        return (from > 0 ? '...' : '') + stackFrame.source.uri.path.substring(from);
    }
    async function expandTo(session, tree) {
        if (session.parentSession) {
            await expandTo(session.parentSession, tree);
        }
        await tree.expand(session);
    }
    let CallStackView = class CallStackView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, viewDescriptorService, configurationService, contextKeyService, openerService, themeService, telemetryService, menuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.options = options;
            this.debugService = debugService;
            this.menuService = menuService;
            this.needsRefresh = false;
            this.ignoreSelectionChangedEvent = false;
            this.ignoreFocusStackFrameEvent = false;
            this.autoExpandedSessions = new Set();
            this.selectionNeedsUpdate = false;
            // Create scheduler to prevent unnecessary flashing of tree when reacting to changes
            this.onCallStackChangeScheduler = this._register(new async_1.RunOnceScheduler(async () => {
                // Only show the global pause message if we do not display threads.
                // Otherwise there will be a pause message per thread and there is no need for a global one.
                const sessions = this.debugService.getModel().getSessions();
                if (sessions.length === 0) {
                    this.autoExpandedSessions.clear();
                }
                const thread = sessions.length === 1 && sessions[0].getAllThreads().length === 1 ? sessions[0].getAllThreads()[0] : undefined;
                const stoppedDetails = sessions.length === 1 ? sessions[0].getStoppedDetails() : undefined;
                if (stoppedDetails && (thread || typeof stoppedDetails.threadId !== 'number')) {
                    this.stateMessageLabel.textContent = stoppedDescription(stoppedDetails);
                    this.stateMessageLabelHover.update(stoppedText(stoppedDetails));
                    this.stateMessageLabel.classList.toggle('exception', stoppedDetails.reason === 'exception');
                    this.stateMessage.hidden = false;
                }
                else if (sessions.length === 1 && sessions[0].state === 3 /* State.Running */) {
                    this.stateMessageLabel.textContent = (0, nls_1.localize)({ key: 'running', comment: ['indicates state'] }, "Running");
                    this.stateMessageLabelHover.update(sessions[0].getLabel());
                    this.stateMessageLabel.classList.remove('exception');
                    this.stateMessage.hidden = false;
                }
                else {
                    this.stateMessage.hidden = true;
                }
                this.updateActions();
                this.needsRefresh = false;
                this.dataSource.deemphasizedStackFramesToShow = [];
                await this.tree.updateChildren();
                try {
                    const toExpand = new Set();
                    sessions.forEach(s => {
                        // Automatically expand sessions that have children, but only do this once.
                        if (s.parentSession && !this.autoExpandedSessions.has(s.parentSession)) {
                            toExpand.add(s.parentSession);
                        }
                    });
                    for (const session of toExpand) {
                        await expandTo(session, this.tree);
                        this.autoExpandedSessions.add(session);
                    }
                }
                catch (e) {
                    // Ignore tree expand errors if element no longer present
                }
                if (this.selectionNeedsUpdate) {
                    this.selectionNeedsUpdate = false;
                    await this.updateTreeSelection();
                }
            }, 50));
        }
        renderHeaderTitle(container) {
            super.renderHeaderTitle(container, this.options.title);
            this.stateMessage = dom.append(container, $('span.call-stack-state-message'));
            this.stateMessage.hidden = true;
            this.stateMessageLabel = dom.append(this.stateMessage, $('span.label'));
            this.stateMessageLabelHover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.stateMessage, ''));
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            container.classList.add('debug-call-stack');
            const treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            this.dataSource = new CallStackDataSource(this.debugService);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'CallStackView', treeContainer, new CallStackDelegate(), new CallStackCompressionDelegate(this.debugService), [
                this.instantiationService.createInstance(SessionsRenderer),
                this.instantiationService.createInstance(ThreadsRenderer),
                this.instantiationService.createInstance(StackFramesRenderer),
                new ErrorsRenderer(),
                new LoadMoreRenderer(),
                new ShowMoreRenderer()
            ], this.dataSource, {
                accessibilityProvider: new CallStackAccessibilityProvider(),
                compressionEnabled: true,
                autoExpandSingleChildren: true,
                identityProvider: {
                    getId: (element) => {
                        if (typeof element === 'string') {
                            return element;
                        }
                        if (element instanceof Array) {
                            return `showMore ${element[0].getId()}`;
                        }
                        return element.getId();
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (e) => {
                        if (isDebugSession(e)) {
                            return e.getLabel();
                        }
                        if (e instanceof debugModel_1.Thread) {
                            return `${e.name} ${e.stateLabel}`;
                        }
                        if (e instanceof debugModel_1.StackFrame || typeof e === 'string') {
                            return e;
                        }
                        if (e instanceof debugModel_1.ThreadAndSessionIds) {
                            return LoadMoreRenderer.LABEL;
                        }
                        return (0, nls_1.localize)('showMoreStackFrames2', "Show More Stack Frames");
                    },
                    getCompressedNodeKeyboardNavigationLabel: (e) => {
                        const firstItem = e[0];
                        if (isDebugSession(firstItem)) {
                            return firstItem.getLabel();
                        }
                        return '';
                    }
                },
                expandOnlyOnTwistieClick: true,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this.tree.setInput(this.debugService.getModel());
            this._register(this.tree);
            this._register(this.tree.onDidOpen(async (e) => {
                if (this.ignoreSelectionChangedEvent) {
                    return;
                }
                const focusStackFrame = (stackFrame, thread, session, options = {}) => {
                    this.ignoreFocusStackFrameEvent = true;
                    try {
                        this.debugService.focusStackFrame(stackFrame, thread, session, { ...options, ...{ explicit: true } });
                    }
                    finally {
                        this.ignoreFocusStackFrameEvent = false;
                    }
                };
                const element = e.element;
                if (element instanceof debugModel_1.StackFrame) {
                    const opts = {
                        preserveFocus: e.editorOptions.preserveFocus,
                        sideBySide: e.sideBySide,
                        pinned: e.editorOptions.pinned
                    };
                    focusStackFrame(element, element.thread, element.thread.session, opts);
                }
                if (element instanceof debugModel_1.Thread) {
                    focusStackFrame(undefined, element, element.session);
                }
                if (isDebugSession(element)) {
                    focusStackFrame(undefined, undefined, element);
                }
                if (element instanceof debugModel_1.ThreadAndSessionIds) {
                    const session = this.debugService.getModel().getSession(element.sessionId);
                    const thread = session && session.getThread(element.threadId);
                    if (thread) {
                        const totalFrames = thread.stoppedDetails?.totalFrames;
                        const remainingFramesCount = typeof totalFrames === 'number' ? (totalFrames - thread.getCallStack().length) : undefined;
                        // Get all the remaining frames
                        await thread.fetchCallStack(remainingFramesCount);
                        await this.tree.updateChildren();
                    }
                }
                if (element instanceof Array) {
                    this.dataSource.deemphasizedStackFramesToShow.push(...element);
                    this.tree.updateChildren();
                }
            }));
            this._register(this.debugService.getModel().onDidChangeCallStack(() => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (!this.onCallStackChangeScheduler.isScheduled()) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            const onFocusChange = event_1.Event.any(this.debugService.getViewModel().onDidFocusStackFrame, this.debugService.getViewModel().onDidFocusSession);
            this._register(onFocusChange(async () => {
                if (this.ignoreFocusStackFrameEvent) {
                    return;
                }
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    this.selectionNeedsUpdate = true;
                    return;
                }
                if (this.onCallStackChangeScheduler.isScheduled()) {
                    this.selectionNeedsUpdate = true;
                    return;
                }
                await this.updateTreeSelection();
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            // Schedule the update of the call stack tree if the viewlet is opened after a session started #14684
            if (this.debugService.state === 2 /* State.Stopped */) {
                this.onCallStackChangeScheduler.schedule(0);
            }
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            this._register(this.debugService.onDidNewSession(s => {
                const sessionListeners = [];
                sessionListeners.push(s.onDidChangeName(() => {
                    // this.tree.updateChildren is called on a delay after a session is added,
                    // so don't rerender if the tree doesn't have the node yet
                    if (this.tree.hasNode(s)) {
                        this.tree.rerender(s);
                    }
                }));
                sessionListeners.push(s.onDidEndAdapter(() => (0, lifecycle_1.dispose)(sessionListeners)));
                if (s.parentSession) {
                    // A session we already expanded has a new child session, allow to expand it again.
                    this.autoExpandedSessions.delete(s.parentSession);
                }
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        focus() {
            super.focus();
            this.tree.domFocus();
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        async updateTreeSelection() {
            if (!this.tree || !this.tree.getInput()) {
                // Tree not initialized yet
                return;
            }
            const updateSelectionAndReveal = (element) => {
                this.ignoreSelectionChangedEvent = true;
                try {
                    this.tree.setSelection([element]);
                    // If the element is outside of the screen bounds,
                    // position it in the middle
                    if (this.tree.getRelativeTop(element) === null) {
                        this.tree.reveal(element, 0.5);
                    }
                    else {
                        this.tree.reveal(element);
                    }
                }
                catch (e) { }
                finally {
                    this.ignoreSelectionChangedEvent = false;
                }
            };
            const thread = this.debugService.getViewModel().focusedThread;
            const session = this.debugService.getViewModel().focusedSession;
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (!thread) {
                if (!session) {
                    this.tree.setSelection([]);
                }
                else {
                    updateSelectionAndReveal(session);
                }
            }
            else {
                // Ignore errors from this expansions because we are not aware if we rendered the threads and sessions or we hide them to declutter the view
                try {
                    await expandTo(thread.session, this.tree);
                }
                catch (e) { }
                try {
                    await this.tree.expand(thread);
                }
                catch (e) { }
                const toReveal = stackFrame || session;
                if (toReveal) {
                    updateSelectionAndReveal(toReveal);
                }
            }
        }
        onContextMenu(e) {
            const element = e.element;
            let overlay = [];
            if (isDebugSession(element)) {
                overlay = getSessionContextOverlay(element);
            }
            else if (element instanceof debugModel_1.Thread) {
                overlay = getThreadContextOverlay(element);
            }
            else if (element instanceof debugModel_1.StackFrame) {
                overlay = getStackFrameContextOverlay(element);
            }
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            const contextKeyService = this.contextKeyService.createOverlay(overlay);
            const menu = this.menuService.createMenu(actions_2.MenuId.DebugCallStackContext, contextKeyService);
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg: getContextForContributedActions(element), shouldForwardArgs: true }, result, 'inline');
            menu.dispose();
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => result.secondary,
                getActionsContext: () => getContext(element)
            });
        }
    };
    exports.CallStackView = CallStackView;
    exports.CallStackView = CallStackView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, actions_2.IMenuService)
    ], CallStackView);
    function getSessionContextOverlay(session) {
        return [
            [debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.key, 'session'],
            [debug_1.CONTEXT_CALLSTACK_SESSION_IS_ATTACH.key, (0, debugUtils_1.isSessionAttach)(session)],
            [debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED.key, session.state === 2 /* State.Stopped */],
            [debug_1.CONTEXT_CALLSTACK_SESSION_HAS_ONE_THREAD.key, session.getAllThreads().length === 1],
        ];
    }
    let SessionsRenderer = class SessionsRenderer {
        static { SessionsRenderer_1 = this; }
        static { this.ID = 'session'; }
        constructor(instantiationService, contextKeyService, menuService) {
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        get templateId() {
            return SessionsRenderer_1.ID;
        }
        renderTemplate(container) {
            const session = dom.append(container, $('.session'));
            dom.append(session, $(themables_1.ThemeIcon.asCSSSelector(icons.callstackViewSession)));
            const name = dom.append(session, $('.name'));
            const stateLabel = dom.append(session, $('span.state.label.monaco-count-badge.long'));
            const templateDisposable = new lifecycle_1.DisposableStore();
            const label = templateDisposable.add(new highlightedLabel_1.HighlightedLabel(name));
            const stopActionViewItemDisposables = templateDisposable.add(new lifecycle_1.DisposableStore());
            const actionBar = templateDisposable.add(new actionbar_1.ActionBar(session, {
                actionViewItemProvider: (action, options) => {
                    if ((action.id === debugCommands_1.STOP_ID || action.id === debugCommands_1.DISCONNECT_ID) && action instanceof actions_2.MenuItemAction) {
                        stopActionViewItemDisposables.clear();
                        const item = this.instantiationService.invokeFunction(accessor => (0, debugToolBar_1.createDisconnectMenuItemAction)(action, stopActionViewItemDisposables, accessor, options));
                        if (item) {
                            return item;
                        }
                    }
                    if (action instanceof actions_2.MenuItemAction) {
                        return this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                    }
                    else if (action instanceof actions_2.SubmenuItemAction) {
                        return this.instantiationService.createInstance(menuEntryActionViewItem_1.SubmenuEntryActionViewItem, action, { hoverDelegate: options.hoverDelegate });
                    }
                    return undefined;
                }
            }));
            const elementDisposable = templateDisposable.add(new lifecycle_1.DisposableStore());
            return { session, name, stateLabel, label, actionBar, elementDisposable, templateDisposable };
        }
        renderElement(element, _, data) {
            this.doRenderElement(element.element, (0, filters_1.createMatches)(element.filterData), data);
        }
        renderCompressedElements(node, _index, templateData) {
            const lastElement = node.element.elements[node.element.elements.length - 1];
            const matches = (0, filters_1.createMatches)(node.filterData);
            this.doRenderElement(lastElement, matches, templateData);
        }
        doRenderElement(session, matches, data) {
            const sessionHover = data.elementDisposable.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.session, (0, nls_1.localize)({ key: 'session', comment: ['Session is a noun'] }, "Session")));
            data.label.set(session.getLabel(), matches);
            const stoppedDetails = session.getStoppedDetails();
            const thread = session.getAllThreads().find(t => t.stopped);
            const contextKeyService = this.contextKeyService.createOverlay(getSessionContextOverlay(session));
            const menu = data.elementDisposable.add(this.menuService.createMenu(actions_2.MenuId.DebugCallStackContext, contextKeyService));
            const setupActionBar = () => {
                data.actionBar.clear();
                const primary = [];
                const secondary = [];
                const result = { primary, secondary };
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { arg: getContextForContributedActions(session), shouldForwardArgs: true }, result, 'inline');
                data.actionBar.push(primary, { icon: true, label: false });
                // We need to set our internal context on the action bar, since our commands depend on that one
                // While the external context our extensions rely on
                data.actionBar.context = getContext(session);
            };
            data.elementDisposable.add(menu.onDidChange(() => setupActionBar()));
            setupActionBar();
            data.stateLabel.style.display = '';
            if (stoppedDetails) {
                data.stateLabel.textContent = stoppedDescription(stoppedDetails);
                sessionHover.update(`${session.getLabel()}: ${stoppedText(stoppedDetails)}`);
                data.stateLabel.classList.toggle('exception', stoppedDetails.reason === 'exception');
            }
            else if (thread && thread.stoppedDetails) {
                data.stateLabel.textContent = stoppedDescription(thread.stoppedDetails);
                sessionHover.update(`${session.getLabel()}: ${stoppedText(thread.stoppedDetails)}`);
                data.stateLabel.classList.toggle('exception', thread.stoppedDetails.reason === 'exception');
            }
            else {
                data.stateLabel.textContent = (0, nls_1.localize)({ key: 'running', comment: ['indicates state'] }, "Running");
                data.stateLabel.classList.remove('exception');
            }
        }
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
        disposeElement(_element, _, templateData) {
            templateData.elementDisposable.clear();
        }
        disposeCompressedElements(node, index, templateData, height) {
            templateData.elementDisposable.clear();
        }
    };
    SessionsRenderer = SessionsRenderer_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService)
    ], SessionsRenderer);
    function getThreadContextOverlay(thread) {
        return [
            [debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.key, 'thread'],
            [debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED.key, thread.stopped]
        ];
    }
    let ThreadsRenderer = class ThreadsRenderer {
        static { ThreadsRenderer_1 = this; }
        static { this.ID = 'thread'; }
        constructor(contextKeyService, menuService) {
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        get templateId() {
            return ThreadsRenderer_1.ID;
        }
        renderTemplate(container) {
            const thread = dom.append(container, $('.thread'));
            const name = dom.append(thread, $('.name'));
            const stateLabel = dom.append(thread, $('span.state.label.monaco-count-badge.long'));
            const templateDisposable = new lifecycle_1.DisposableStore();
            const label = templateDisposable.add(new highlightedLabel_1.HighlightedLabel(name));
            const actionBar = templateDisposable.add(new actionbar_1.ActionBar(thread));
            const elementDisposable = templateDisposable.add(new lifecycle_1.DisposableStore());
            return { thread, name, stateLabel, label, actionBar, elementDisposable, templateDisposable };
        }
        renderElement(element, _index, data) {
            const thread = element.element;
            data.elementDisposable.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.thread, thread.name));
            data.label.set(thread.name, (0, filters_1.createMatches)(element.filterData));
            data.stateLabel.textContent = thread.stateLabel;
            data.stateLabel.classList.toggle('exception', thread.stoppedDetails?.reason === 'exception');
            const contextKeyService = this.contextKeyService.createOverlay(getThreadContextOverlay(thread));
            const menu = data.elementDisposable.add(this.menuService.createMenu(actions_2.MenuId.DebugCallStackContext, contextKeyService));
            const setupActionBar = () => {
                data.actionBar.clear();
                const primary = [];
                const secondary = [];
                const result = { primary, secondary };
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { arg: getContextForContributedActions(thread), shouldForwardArgs: true }, result, 'inline');
                data.actionBar.push(primary, { icon: true, label: false });
                // We need to set our internal context on the action bar, since our commands depend on that one
                // While the external context our extensions rely on
                data.actionBar.context = getContext(thread);
            };
            data.elementDisposable.add(menu.onDidChange(() => setupActionBar()));
            setupActionBar();
        }
        renderCompressedElements(_node, _index, _templateData, _height) {
            throw new Error('Method not implemented.');
        }
        disposeElement(_element, _index, templateData) {
            templateData.elementDisposable.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
    };
    ThreadsRenderer = ThreadsRenderer_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, actions_2.IMenuService)
    ], ThreadsRenderer);
    function getStackFrameContextOverlay(stackFrame) {
        return [
            [debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.key, 'stackFrame'],
            [debug_1.CONTEXT_STACK_FRAME_SUPPORTS_RESTART.key, stackFrame.canRestart]
        ];
    }
    let StackFramesRenderer = class StackFramesRenderer {
        static { StackFramesRenderer_1 = this; }
        static { this.ID = 'stackFrame'; }
        constructor(labelService, notificationService) {
            this.labelService = labelService;
            this.notificationService = notificationService;
        }
        get templateId() {
            return StackFramesRenderer_1.ID;
        }
        renderTemplate(container) {
            const stackFrame = dom.append(container, $('.stack-frame'));
            const labelDiv = dom.append(stackFrame, $('span.label.expression'));
            const file = dom.append(stackFrame, $('.file'));
            const fileName = dom.append(file, $('span.file-name'));
            const wrapper = dom.append(file, $('span.line-number-wrapper'));
            const lineNumber = dom.append(wrapper, $('span.line-number.monaco-count-badge'));
            const templateDisposable = new lifecycle_1.DisposableStore();
            const label = templateDisposable.add(new highlightedLabel_1.HighlightedLabel(labelDiv));
            const actionBar = templateDisposable.add(new actionbar_1.ActionBar(stackFrame));
            return { file, fileName, label, lineNumber, stackFrame, actionBar, templateDisposable };
        }
        renderElement(element, index, data) {
            const stackFrame = element.element;
            data.stackFrame.classList.toggle('disabled', !stackFrame.source || !stackFrame.source.available || isDeemphasized(stackFrame));
            data.stackFrame.classList.toggle('label', stackFrame.presentationHint === 'label');
            data.stackFrame.classList.toggle('subtle', stackFrame.presentationHint === 'subtle');
            const hasActions = !!stackFrame.thread.session.capabilities.supportsRestartFrame && stackFrame.presentationHint !== 'label' && stackFrame.presentationHint !== 'subtle' && stackFrame.canRestart;
            data.stackFrame.classList.toggle('has-actions', hasActions);
            let title = stackFrame.source.inMemory ? stackFrame.source.uri.path : this.labelService.getUriLabel(stackFrame.source.uri);
            if (stackFrame.source.raw.origin) {
                title += `\n${stackFrame.source.raw.origin}`;
            }
            data.templateDisposable.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.file, title));
            data.label.set(stackFrame.name, (0, filters_1.createMatches)(element.filterData), stackFrame.name);
            data.fileName.textContent = getSpecificSourceName(stackFrame);
            if (stackFrame.range.startLineNumber !== undefined) {
                data.lineNumber.textContent = `${stackFrame.range.startLineNumber}`;
                if (stackFrame.range.startColumn) {
                    data.lineNumber.textContent += `:${stackFrame.range.startColumn}`;
                }
                data.lineNumber.classList.remove('unavailable');
            }
            else {
                data.lineNumber.classList.add('unavailable');
            }
            data.actionBar.clear();
            if (hasActions) {
                const action = new actions_1.Action('debug.callStack.restartFrame', (0, nls_1.localize)('restartFrame', "Restart Frame"), themables_1.ThemeIcon.asClassName(icons.debugRestartFrame), true, async () => {
                    try {
                        await stackFrame.restart();
                    }
                    catch (e) {
                        this.notificationService.error(e);
                    }
                });
                data.actionBar.push(action, { icon: true, label: false });
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    StackFramesRenderer = StackFramesRenderer_1 = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, notification_1.INotificationService)
    ], StackFramesRenderer);
    class ErrorsRenderer {
        static { this.ID = 'error'; }
        get templateId() {
            return ErrorsRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.error'));
            return { label, templateDisposable: new lifecycle_1.DisposableStore() };
        }
        renderElement(element, index, data) {
            const error = element.element;
            data.label.textContent = error;
            data.templateDisposable.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.label, error));
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    class LoadMoreRenderer {
        static { this.ID = 'loadMore'; }
        static { this.LABEL = (0, nls_1.localize)('loadAllStackFrames', "Load More Stack Frames"); }
        constructor() { }
        get templateId() {
            return LoadMoreRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.load-all'));
            label.style.color = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.textLinkForeground);
            return { label };
        }
        renderElement(element, index, data) {
            data.label.textContent = LoadMoreRenderer.LABEL;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    class ShowMoreRenderer {
        static { this.ID = 'showMore'; }
        constructor() { }
        get templateId() {
            return ShowMoreRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.show-more'));
            label.style.color = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.textLinkForeground);
            return { label };
        }
        renderElement(element, index, data) {
            const stackFrames = element.element;
            if (stackFrames.every(sf => !!(sf.source && sf.source.origin && sf.source.origin === stackFrames[0].source.origin))) {
                data.label.textContent = (0, nls_1.localize)('showMoreAndOrigin', "Show {0} More: {1}", stackFrames.length, stackFrames[0].source.origin);
            }
            else {
                data.label.textContent = (0, nls_1.localize)('showMoreStackFrames', "Show {0} More Stack Frames", stackFrames.length);
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    class CallStackDelegate {
        getHeight(element) {
            if (element instanceof debugModel_1.StackFrame && element.presentationHint === 'label') {
                return 16;
            }
            if (element instanceof debugModel_1.ThreadAndSessionIds || element instanceof Array) {
                return 16;
            }
            return 22;
        }
        getTemplateId(element) {
            if (isDebugSession(element)) {
                return SessionsRenderer.ID;
            }
            if (element instanceof debugModel_1.Thread) {
                return ThreadsRenderer.ID;
            }
            if (element instanceof debugModel_1.StackFrame) {
                return StackFramesRenderer.ID;
            }
            if (typeof element === 'string') {
                return ErrorsRenderer.ID;
            }
            if (element instanceof debugModel_1.ThreadAndSessionIds) {
                return LoadMoreRenderer.ID;
            }
            // element instanceof Array
            return ShowMoreRenderer.ID;
        }
    }
    function stoppedText(stoppedDetails) {
        return stoppedDetails.text ?? stoppedDescription(stoppedDetails);
    }
    function stoppedDescription(stoppedDetails) {
        return stoppedDetails.description ||
            (stoppedDetails.reason ? (0, nls_1.localize)({ key: 'pausedOn', comment: ['indicates reason for program being paused'] }, "Paused on {0}", stoppedDetails.reason) : (0, nls_1.localize)('paused', "Paused"));
    }
    function isDebugModel(obj) {
        return typeof obj.getSessions === 'function';
    }
    function isDebugSession(obj) {
        return obj && typeof obj.getAllThreads === 'function';
    }
    function isDeemphasized(frame) {
        return frame.source.presentationHint === 'deemphasize' || frame.presentationHint === 'deemphasize';
    }
    class CallStackDataSource {
        constructor(debugService) {
            this.debugService = debugService;
            this.deemphasizedStackFramesToShow = [];
        }
        hasChildren(element) {
            if (isDebugSession(element)) {
                const threads = element.getAllThreads();
                return (threads.length > 1) || (threads.length === 1 && threads[0].stopped) || !!(this.debugService.getModel().getSessions().find(s => s.parentSession === element));
            }
            return isDebugModel(element) || (element instanceof debugModel_1.Thread && element.stopped);
        }
        async getChildren(element) {
            if (isDebugModel(element)) {
                const sessions = element.getSessions();
                if (sessions.length === 0) {
                    return Promise.resolve([]);
                }
                if (sessions.length > 1 || this.debugService.getViewModel().isMultiSessionView()) {
                    return Promise.resolve(sessions.filter(s => !s.parentSession));
                }
                const threads = sessions[0].getAllThreads();
                // Only show the threads in the call stack if there is more than 1 thread.
                return threads.length === 1 ? this.getThreadChildren(threads[0]) : Promise.resolve(threads);
            }
            else if (isDebugSession(element)) {
                const childSessions = this.debugService.getModel().getSessions().filter(s => s.parentSession === element);
                const threads = element.getAllThreads();
                if (threads.length === 1) {
                    // Do not show thread when there is only one to be compact.
                    const children = await this.getThreadChildren(threads[0]);
                    return children.concat(childSessions);
                }
                return Promise.resolve(threads.concat(childSessions));
            }
            else {
                return this.getThreadChildren(element);
            }
        }
        getThreadChildren(thread) {
            return this.getThreadCallstack(thread).then(children => {
                // Check if some stack frames should be hidden under a parent element since they are deemphasized
                const result = [];
                children.forEach((child, index) => {
                    if (child instanceof debugModel_1.StackFrame && child.source && isDeemphasized(child)) {
                        // Check if the user clicked to show the deemphasized source
                        if (this.deemphasizedStackFramesToShow.indexOf(child) === -1) {
                            if (result.length) {
                                const last = result[result.length - 1];
                                if (last instanceof Array) {
                                    // Collect all the stackframes that will be "collapsed"
                                    last.push(child);
                                    return;
                                }
                            }
                            const nextChild = index < children.length - 1 ? children[index + 1] : undefined;
                            if (nextChild instanceof debugModel_1.StackFrame && nextChild.source && isDeemphasized(nextChild)) {
                                // Start collecting stackframes that will be "collapsed"
                                result.push([child]);
                                return;
                            }
                        }
                    }
                    result.push(child);
                });
                return result;
            });
        }
        async getThreadCallstack(thread) {
            let callStack = thread.getCallStack();
            if (!callStack || !callStack.length) {
                await thread.fetchCallStack();
                callStack = thread.getCallStack();
            }
            if (callStack.length === 1 && thread.session.capabilities.supportsDelayedStackTraceLoading && thread.stoppedDetails && thread.stoppedDetails.totalFrames && thread.stoppedDetails.totalFrames > 1) {
                // To reduce flashing of the call stack view simply append the stale call stack
                // once we have the correct data the tree will refresh and we will no longer display it.
                callStack = callStack.concat(thread.getStaleCallStack().slice(1));
            }
            if (thread.stoppedDetails && thread.stoppedDetails.framesErrorMessage) {
                callStack = callStack.concat([thread.stoppedDetails.framesErrorMessage]);
            }
            if (!thread.reachedEndOfCallStack && thread.stoppedDetails) {
                callStack = callStack.concat([new debugModel_1.ThreadAndSessionIds(thread.session.getId(), thread.threadId)]);
            }
            return callStack;
        }
    }
    class CallStackAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)({ comment: ['Debug is a noun in this context, not a verb.'], key: 'callStackAriaLabel' }, "Debug Call Stack");
        }
        getWidgetRole() {
            // Use treegrid as a role since each element can have additional actions inside #146210
            return 'treegrid';
        }
        getRole(_element) {
            return 'row';
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Thread) {
                return (0, nls_1.localize)({ key: 'threadAriaLabel', comment: ['Placeholders stand for the thread name and the thread state.For example "Thread 1" and "Stopped'] }, "Thread {0} {1}", element.name, element.stateLabel);
            }
            if (element instanceof debugModel_1.StackFrame) {
                return (0, nls_1.localize)('stackFrameAriaLabel', "Stack Frame {0}, line {1}, {2}", element.name, element.range.startLineNumber, getSpecificSourceName(element));
            }
            if (isDebugSession(element)) {
                const thread = element.getAllThreads().find(t => t.stopped);
                const state = thread ? thread.stateLabel : (0, nls_1.localize)({ key: 'running', comment: ['indicates state'] }, "Running");
                return (0, nls_1.localize)({ key: 'sessionLabel', comment: ['Placeholders stand for the session name and the session state. For example "Launch Program" and "Running"'] }, "Session {0} {1}", element.getLabel(), state);
            }
            if (typeof element === 'string') {
                return element;
            }
            if (element instanceof Array) {
                return (0, nls_1.localize)('showMoreStackFrames', "Show {0} More Stack Frames", element.length);
            }
            // element instanceof ThreadAndSessionIds
            return LoadMoreRenderer.LABEL;
        }
    }
    class CallStackCompressionDelegate {
        constructor(debugService) {
            this.debugService = debugService;
        }
        isIncompressible(stat) {
            if (isDebugSession(stat)) {
                if (stat.compact) {
                    return false;
                }
                const sessions = this.debugService.getModel().getSessions();
                if (sessions.some(s => s.parentSession === stat && s.compact)) {
                    return false;
                }
                return true;
            }
            return true;
        }
    }
    (0, actions_2.registerAction2)(class Collapse extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'callStack.collapse',
                viewId: debug_1.CALLSTACK_VIEW_ID,
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo((0, debug_1.getStateLabel)(2 /* State.Stopped */)),
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    order: 10,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.CALLSTACK_VIEW_ID)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
    function registerCallStackInlineMenuItem(id, title, icon, when, order, precondition) {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugCallStackContext, {
            group: 'inline',
            order,
            when,
            command: { id, title, icon, precondition }
        });
    }
    const threadOrSessionWithOneThread = contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), debug_1.CONTEXT_CALLSTACK_SESSION_HAS_ONE_THREAD));
    registerCallStackInlineMenuItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, icons.debugPause, contextkey_1.ContextKeyExpr.and(threadOrSessionWithOneThread, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED.toNegated()), 10, debug_1.CONTEXT_FOCUSED_SESSION_IS_NO_DEBUG.toNegated());
    registerCallStackInlineMenuItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, icons.debugContinue, contextkey_1.ContextKeyExpr.and(threadOrSessionWithOneThread, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED), 10);
    registerCallStackInlineMenuItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, icons.debugStepOver, threadOrSessionWithOneThread, 20, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED);
    registerCallStackInlineMenuItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, icons.debugStepInto, threadOrSessionWithOneThread, 30, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED);
    registerCallStackInlineMenuItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, icons.debugStepOut, threadOrSessionWithOneThread, 40, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED);
    registerCallStackInlineMenuItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, icons.debugRestart, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), 50);
    registerCallStackInlineMenuItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, icons.debugStop, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session')), 60);
    registerCallStackInlineMenuItem(debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, icons.debugDisconnect, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_SESSION_IS_ATTACH, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session')), 60);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbFN0YWNrVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9jYWxsU3RhY2tWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5RWhHLGdDQVVDO0lBR0QsMEVBZ0JDO0lBRUQsc0RBa0JDO0lBeEVELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFJaEIsU0FBUyxvQkFBb0IsQ0FBQyxPQUFzQixFQUFFLE9BQVk7UUFDakUsT0FBTyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDcEMsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQVMsbUJBQW1CLENBQUMsT0FBZ0IsRUFBRSxPQUFZO1FBQzFELE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ25DLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0MsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUMsT0FBbUIsRUFBRSxPQUFZO1FBQ2pFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUNqQyxPQUFPLENBQUMsYUFBYSxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0UsbUJBQW1CLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3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