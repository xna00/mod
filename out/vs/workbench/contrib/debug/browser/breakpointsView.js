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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/themables", "vs/editor/browser/editorBrowser", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/disassemblyViewInput", "vs/workbench/services/editor/common/editorService", "vs/platform/notification/common/notification"], function (require, exports, dom, touch_1, actionbar_1, hoverDelegateFactory_1, iconLabel_1, updatableHoverWidget_1, inputBox_1, actions_1, arrays_1, async_1, codicons_1, htmlContent_1, lifecycle_1, resources, themables_1, editorBrowser_1, language_1, nls_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextkey_1, contextView_1, hover_1, instantiation_1, keybinding_1, label_1, listService_1, opener_1, quickInput_1, telemetry_1, defaultStyles_1, themeService_1, viewPane_1, views_1, icons, debug_1, debugModel_1, disassemblyViewInput_1, editorService_1, notification_1) {
    "use strict";
    var BreakpointsRenderer_1, FunctionBreakpointsRenderer_1, DataBreakpointsRenderer_1, InstructionBreakpointsRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreakpointsView = void 0;
    exports.getExpandedBodySize = getExpandedBodySize;
    exports.openBreakpointSource = openBreakpointSource;
    exports.getBreakpointMessageAndIcon = getBreakpointMessageAndIcon;
    const $ = dom.$;
    function createCheckbox(disposables) {
        const checkbox = $('input');
        checkbox.type = 'checkbox';
        checkbox.tabIndex = -1;
        disposables.push(touch_1.Gesture.ignoreTarget(checkbox));
        return checkbox;
    }
    const MAX_VISIBLE_BREAKPOINTS = 9;
    function getExpandedBodySize(model, sessionId, countLimit) {
        const length = model.getBreakpoints().length + model.getExceptionBreakpointsForSession(sessionId).length + model.getFunctionBreakpoints().length + model.getDataBreakpoints().length + model.getInstructionBreakpoints().length;
        return Math.min(countLimit, length) * 22;
    }
    let BreakpointsView = class BreakpointsView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, themeService, editorService, contextViewService, configurationService, viewDescriptorService, contextKeyService, openerService, telemetryService, labelService, menuService, hoverService, languageService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.editorService = editorService;
            this.contextViewService = contextViewService;
            this.labelService = labelService;
            this.hoverService = hoverService;
            this.languageService = languageService;
            this.needsRefresh = false;
            this.needsStateChange = false;
            this.ignoreLayout = false;
            this.autoFocusedIndex = -1;
            this.menu = menuService.createMenu(actions_2.MenuId.DebugBreakpointsContext, contextKeyService);
            this._register(this.menu);
            this.breakpointItemType = debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.bindTo(contextKeyService);
            this.breakpointIsDataBytes = debug_1.CONTEXT_BREAKPOINT_ITEM_IS_DATA_BYTES.bindTo(contextKeyService);
            this.breakpointHasMultipleModes = debug_1.CONTEXT_BREAKPOINT_HAS_MODES.bindTo(contextKeyService);
            this.breakpointSupportsCondition = debug_1.CONTEXT_BREAKPOINT_SUPPORTS_CONDITION.bindTo(contextKeyService);
            this.breakpointInputFocused = debug_1.CONTEXT_BREAKPOINT_INPUT_FOCUSED.bindTo(contextKeyService);
            this._register(this.debugService.getModel().onDidChangeBreakpoints(() => this.onBreakpointsChange()));
            this._register(this.debugService.getViewModel().onDidFocusSession(() => this.onBreakpointsChange()));
            this._register(this.debugService.onDidChangeState(() => this.onStateChange()));
            this.hintDelayer = this._register(new async_1.RunOnceScheduler(() => this.updateBreakpointsHint(true), 4000));
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            container.classList.add('debug-breakpoints');
            const delegate = new BreakpointsDelegate(this);
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'Breakpoints', container, delegate, [
                this.instantiationService.createInstance(BreakpointsRenderer, this.menu, this.breakpointHasMultipleModes, this.breakpointSupportsCondition, this.breakpointItemType),
                new ExceptionBreakpointsRenderer(this.menu, this.breakpointHasMultipleModes, this.breakpointSupportsCondition, this.breakpointItemType, this.debugService),
                new ExceptionBreakpointInputRenderer(this, this.debugService, this.contextViewService),
                this.instantiationService.createInstance(FunctionBreakpointsRenderer, this.menu, this.breakpointSupportsCondition, this.breakpointItemType),
                new FunctionBreakpointInputRenderer(this, this.debugService, this.contextViewService, this.labelService),
                this.instantiationService.createInstance(DataBreakpointsRenderer, this.menu, this.breakpointHasMultipleModes, this.breakpointSupportsCondition, this.breakpointItemType, this.breakpointIsDataBytes),
                new DataBreakpointInputRenderer(this, this.debugService, this.contextViewService, this.labelService),
                this.instantiationService.createInstance(InstructionBreakpointsRenderer),
            ], {
                identityProvider: { getId: (element) => element.getId() },
                multipleSelectionSupport: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e },
                accessibilityProvider: new BreakpointsAccessibilityProvider(this.debugService, this.labelService),
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            debug_1.CONTEXT_BREAKPOINTS_FOCUSED.bindTo(this.list.contextKeyService);
            this._register(this.list.onContextMenu(this.onListContextMenu, this));
            this.list.onMouseMiddleClick(async ({ element }) => {
                if (element instanceof debugModel_1.Breakpoint) {
                    await this.debugService.removeBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.FunctionBreakpoint) {
                    await this.debugService.removeFunctionBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.DataBreakpoint) {
                    await this.debugService.removeDataBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.InstructionBreakpoint) {
                    await this.debugService.removeInstructionBreakpoints(element.instructionReference, element.offset);
                }
            });
            this._register(this.list.onDidOpen(async (e) => {
                if (!e.element) {
                    return;
                }
                if (dom.isMouseEvent(e.browserEvent) && e.browserEvent.button === 1) { // middle click
                    return;
                }
                if (e.element instanceof debugModel_1.Breakpoint) {
                    openBreakpointSource(e.element, e.sideBySide, e.editorOptions.preserveFocus || false, e.editorOptions.pinned || !e.editorOptions.preserveFocus, this.debugService, this.editorService);
                }
                if (e.element instanceof debugModel_1.InstructionBreakpoint) {
                    const disassemblyView = await this.editorService.openEditor(disassemblyViewInput_1.DisassemblyViewInput.instance);
                    // Focus on double click
                    disassemblyView.goToInstructionAndOffset(e.element.instructionReference, e.element.offset, dom.isMouseEvent(e.browserEvent) && e.browserEvent.detail === 2);
                }
                if (dom.isMouseEvent(e.browserEvent) && e.browserEvent.detail === 2 && e.element instanceof debugModel_1.FunctionBreakpoint && e.element !== this.inputBoxData?.breakpoint) {
                    // double click
                    this.renderInputBox({ breakpoint: e.element, type: 'name' });
                }
            }));
            this.list.splice(0, this.list.length, this.elements);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    if (this.needsRefresh) {
                        this.onBreakpointsChange();
                    }
                    if (this.needsStateChange) {
                        this.onStateChange();
                    }
                }
            }));
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            this._register(containerModel.onDidChangeAllViewDescriptors(() => {
                this.updateSize();
            }));
        }
        renderHeaderTitle(container, title) {
            super.renderHeaderTitle(container, title);
            const iconLabelContainer = dom.append(container, $('span.breakpoint-warning'));
            this.hintContainer = this._register(new iconLabel_1.IconLabel(iconLabelContainer, {
                supportIcons: true, hoverDelegate: {
                    showHover: (options, focus) => this.hoverService.showHover({ content: options.content, target: this.hintContainer.element }, focus),
                    delay: this.configurationService.getValue('workbench.hover.delay')
                }
            }));
            dom.hide(this.hintContainer.element);
        }
        focus() {
            super.focus();
            this.list?.domFocus();
        }
        renderInputBox(data) {
            this._inputBoxData = data;
            this.onBreakpointsChange();
            this._inputBoxData = undefined;
        }
        get inputBoxData() {
            return this._inputBoxData;
        }
        layoutBody(height, width) {
            if (this.ignoreLayout) {
                return;
            }
            super.layoutBody(height, width);
            this.list?.layout(height, width);
            try {
                this.ignoreLayout = true;
                this.updateSize();
            }
            finally {
                this.ignoreLayout = false;
            }
        }
        onListContextMenu(e) {
            const element = e.element;
            const type = element instanceof debugModel_1.Breakpoint ? 'breakpoint' : element instanceof debugModel_1.ExceptionBreakpoint ? 'exceptionBreakpoint' :
                element instanceof debugModel_1.FunctionBreakpoint ? 'functionBreakpoint' : element instanceof debugModel_1.DataBreakpoint ? 'dataBreakpoint' :
                    element instanceof debugModel_1.InstructionBreakpoint ? 'instructionBreakpoint' : undefined;
            this.breakpointItemType.set(type);
            const session = this.debugService.getViewModel().focusedSession;
            const conditionSupported = element instanceof debugModel_1.ExceptionBreakpoint ? element.supportsCondition : (!session || !!session.capabilities.supportsConditionalBreakpoints);
            this.breakpointSupportsCondition.set(conditionSupported);
            this.breakpointIsDataBytes.set(element instanceof debugModel_1.DataBreakpoint && element.src.type === 1 /* DataBreakpointSetType.Address */);
            const secondary = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.menu, { arg: e.element, shouldForwardArgs: false }, { primary: [], secondary }, 'inline');
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => secondary,
                getActionsContext: () => element
            });
        }
        updateSize() {
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            // Adjust expanded body size
            const sessionId = this.debugService.getViewModel().focusedSession?.getId();
            this.minimumBodySize = this.orientation === 0 /* Orientation.VERTICAL */ ? getExpandedBodySize(this.debugService.getModel(), sessionId, MAX_VISIBLE_BREAKPOINTS) : 170;
            this.maximumBodySize = this.orientation === 0 /* Orientation.VERTICAL */ && containerModel.visibleViewDescriptors.length > 1 ? getExpandedBodySize(this.debugService.getModel(), sessionId, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
        }
        updateBreakpointsHint(delayed = false) {
            if (!this.hintContainer) {
                return;
            }
            const currentType = this.debugService.getViewModel().focusedSession?.configuration.type;
            const dbg = currentType ? this.debugService.getAdapterManager().getDebugger(currentType) : undefined;
            const message = dbg?.strings?.[debug_1.DebuggerString.UnverifiedBreakpoints];
            const debuggerHasUnverifiedBps = message && this.debugService.getModel().getBreakpoints().filter(bp => {
                if (bp.verified || !bp.enabled) {
                    return false;
                }
                const langId = this.languageService.guessLanguageIdByFilepathOrFirstLine(bp.uri);
                return langId && dbg.interestedInLanguage(langId);
            });
            if (message && debuggerHasUnverifiedBps?.length && this.debugService.getModel().areBreakpointsActivated()) {
                if (delayed) {
                    const mdown = new htmlContent_1.MarkdownString(undefined, { isTrusted: true }).appendMarkdown(message);
                    this.hintContainer.setLabel('$(warning)', undefined, { title: { markdown: mdown, markdownNotSupportedFallback: message } });
                    dom.show(this.hintContainer.element);
                }
                else {
                    this.hintDelayer.schedule();
                }
            }
            else {
                dom.hide(this.hintContainer.element);
            }
        }
        onBreakpointsChange() {
            if (this.isBodyVisible()) {
                this.updateSize();
                if (this.list) {
                    const lastFocusIndex = this.list.getFocus()[0];
                    // Check whether focused element was removed
                    const needsRefocus = lastFocusIndex && !this.elements.includes(this.list.element(lastFocusIndex));
                    this.list.splice(0, this.list.length, this.elements);
                    this.needsRefresh = false;
                    if (needsRefocus) {
                        this.list.focusNth(Math.min(lastFocusIndex, this.list.length - 1));
                    }
                }
                this.updateBreakpointsHint();
            }
            else {
                this.needsRefresh = true;
            }
        }
        onStateChange() {
            if (this.isBodyVisible()) {
                this.needsStateChange = false;
                const thread = this.debugService.getViewModel().focusedThread;
                let found = false;
                if (thread && thread.stoppedDetails && thread.stoppedDetails.hitBreakpointIds && thread.stoppedDetails.hitBreakpointIds.length > 0) {
                    const hitBreakpointIds = thread.stoppedDetails.hitBreakpointIds;
                    const elements = this.elements;
                    const index = elements.findIndex(e => {
                        const id = e.getIdFromAdapter(thread.session.getId());
                        return typeof id === 'number' && hitBreakpointIds.indexOf(id) !== -1;
                    });
                    if (index >= 0) {
                        this.list.setFocus([index]);
                        this.list.setSelection([index]);
                        found = true;
                        this.autoFocusedIndex = index;
                    }
                }
                if (!found) {
                    // Deselect breakpoint in breakpoint view when no longer stopped on it #125528
                    const focus = this.list.getFocus();
                    const selection = this.list.getSelection();
                    if (this.autoFocusedIndex >= 0 && (0, arrays_1.equals)(focus, selection) && focus.indexOf(this.autoFocusedIndex) >= 0) {
                        this.list.setFocus([]);
                        this.list.setSelection([]);
                    }
                    this.autoFocusedIndex = -1;
                }
                this.updateBreakpointsHint();
            }
            else {
                this.needsStateChange = true;
            }
        }
        get elements() {
            const model = this.debugService.getModel();
            const sessionId = this.debugService.getViewModel().focusedSession?.getId();
            const elements = model.getExceptionBreakpointsForSession(sessionId).concat(model.getFunctionBreakpoints()).concat(model.getDataBreakpoints()).concat(model.getBreakpoints()).concat(model.getInstructionBreakpoints());
            return elements;
        }
    };
    exports.BreakpointsView = BreakpointsView;
    exports.BreakpointsView = BreakpointsView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorService_1.IEditorService),
        __param(7, contextView_1.IContextViewService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, opener_1.IOpenerService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, label_1.ILabelService),
        __param(14, actions_2.IMenuService),
        __param(15, hover_1.IHoverService),
        __param(16, language_1.ILanguageService)
    ], BreakpointsView);
    class BreakpointsDelegate {
        constructor(view) {
            this.view = view;
            // noop
        }
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Breakpoint) {
                return BreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.FunctionBreakpoint) {
                const inputBoxBreakpoint = this.view.inputBoxData?.breakpoint;
                if (!element.name || (inputBoxBreakpoint && inputBoxBreakpoint.getId() === element.getId())) {
                    return FunctionBreakpointInputRenderer.ID;
                }
                return FunctionBreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.ExceptionBreakpoint) {
                const inputBoxBreakpoint = this.view.inputBoxData?.breakpoint;
                if (inputBoxBreakpoint && inputBoxBreakpoint.getId() === element.getId()) {
                    return ExceptionBreakpointInputRenderer.ID;
                }
                return ExceptionBreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.DataBreakpoint) {
                const inputBoxBreakpoint = this.view.inputBoxData?.breakpoint;
                if (inputBoxBreakpoint && inputBoxBreakpoint.getId() === element.getId()) {
                    return DataBreakpointInputRenderer.ID;
                }
                return DataBreakpointsRenderer.ID;
            }
            if (element instanceof debugModel_1.InstructionBreakpoint) {
                return InstructionBreakpointsRenderer.ID;
            }
            return '';
        }
    }
    const breakpointIdToActionBarDomeNode = new Map();
    let BreakpointsRenderer = class BreakpointsRenderer {
        static { BreakpointsRenderer_1 = this; }
        constructor(menu, breakpointHasMultipleModes, breakpointSupportsCondition, breakpointItemType, debugService, labelService) {
            this.menu = menu;
            this.breakpointHasMultipleModes = breakpointHasMultipleModes;
            this.breakpointSupportsCondition = breakpointSupportsCondition;
            this.breakpointItemType = breakpointItemType;
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        static { this.ID = 'breakpoints'; }
        get templateId() {
            return BreakpointsRenderer_1.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDispose = [];
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox(data.toDispose);
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            data.filePath = dom.append(data.breakpoint, $('span.file-path'));
            data.actionBar = new actionbar_1.ActionBar(data.breakpoint);
            data.toDispose.push(data.actionBar);
            const badgeContainer = dom.append(data.breakpoint, $('.badge-container'));
            data.badge = dom.append(badgeContainer, $('span.line-number.monaco-count-badge'));
            return data;
        }
        renderElement(breakpoint, index, data) {
            data.context = breakpoint;
            data.breakpoint.classList.toggle('disabled', !this.debugService.getModel().areBreakpointsActivated());
            data.name.textContent = resources.basenameOrAuthority(breakpoint.uri);
            let badgeContent = breakpoint.lineNumber.toString();
            if (breakpoint.column) {
                badgeContent += `:${breakpoint.column}`;
            }
            if (breakpoint.modeLabel) {
                badgeContent = `${breakpoint.modeLabel}: ${badgeContent}`;
            }
            data.badge.textContent = badgeContent;
            data.filePath.textContent = this.labelService.getUriLabel(resources.dirname(breakpoint.uri), { relative: true });
            data.checkbox.checked = breakpoint.enabled;
            const { message, icon } = getBreakpointMessageAndIcon(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), breakpoint, this.labelService, this.debugService.getModel());
            data.icon.className = themables_1.ThemeIcon.asClassName(icon);
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.breakpoint, breakpoint.message || message || ''));
            const debugActive = this.debugService.state === 3 /* State.Running */ || this.debugService.state === 2 /* State.Stopped */;
            if (debugActive && !breakpoint.verified) {
                data.breakpoint.classList.add('disabled');
            }
            const primary = [];
            const session = this.debugService.getViewModel().focusedSession;
            this.breakpointSupportsCondition.set(!session || !!session.capabilities.supportsConditionalBreakpoints);
            this.breakpointItemType.set('breakpoint');
            this.breakpointHasMultipleModes.set(this.debugService.getModel().getBreakpointModes('source').length > 1);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { arg: breakpoint, shouldForwardArgs: true }, { primary, secondary: [] }, 'inline');
            data.actionBar.clear();
            data.actionBar.push(primary, { icon: true, label: false });
            breakpointIdToActionBarDomeNode.set(breakpoint.getId(), data.actionBar.domNode);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    };
    BreakpointsRenderer = BreakpointsRenderer_1 = __decorate([
        __param(4, debug_1.IDebugService),
        __param(5, label_1.ILabelService)
    ], BreakpointsRenderer);
    class ExceptionBreakpointsRenderer {
        constructor(menu, breakpointHasMultipleModes, breakpointSupportsCondition, breakpointItemType, debugService) {
            this.menu = menu;
            this.breakpointHasMultipleModes = breakpointHasMultipleModes;
            this.breakpointSupportsCondition = breakpointSupportsCondition;
            this.breakpointItemType = breakpointItemType;
            this.debugService = debugService;
            // noop
        }
        static { this.ID = 'exceptionbreakpoints'; }
        get templateId() {
            return ExceptionBreakpointsRenderer.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDispose = [];
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.checkbox = createCheckbox(data.toDispose);
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            data.condition = dom.append(data.breakpoint, $('span.condition'));
            data.breakpoint.classList.add('exception');
            data.actionBar = new actionbar_1.ActionBar(data.breakpoint);
            data.toDispose.push(data.actionBar);
            const badgeContainer = dom.append(data.breakpoint, $('.badge-container'));
            data.badge = dom.append(badgeContainer, $('span.line-number.monaco-count-badge'));
            return data;
        }
        renderElement(exceptionBreakpoint, index, data) {
            data.context = exceptionBreakpoint;
            data.name.textContent = exceptionBreakpoint.label || `${exceptionBreakpoint.filter} exceptions`;
            const exceptionBreakpointtitle = exceptionBreakpoint.verified ? (exceptionBreakpoint.description || data.name.textContent) : exceptionBreakpoint.message || (0, nls_1.localize)('unverifiedExceptionBreakpoint', "Unverified Exception Breakpoint");
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.breakpoint, exceptionBreakpointtitle));
            data.breakpoint.classList.toggle('disabled', !exceptionBreakpoint.verified);
            data.checkbox.checked = exceptionBreakpoint.enabled;
            data.condition.textContent = exceptionBreakpoint.condition || '';
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.condition, (0, nls_1.localize)('expressionCondition', "Expression condition: {0}", exceptionBreakpoint.condition)));
            if (exceptionBreakpoint.modeLabel) {
                data.badge.textContent = exceptionBreakpoint.modeLabel;
                data.badge.style.display = 'block';
            }
            else {
                data.badge.style.display = 'none';
            }
            const primary = [];
            this.breakpointSupportsCondition.set(exceptionBreakpoint.supportsCondition);
            this.breakpointItemType.set('exceptionBreakpoint');
            this.breakpointHasMultipleModes.set(this.debugService.getModel().getBreakpointModes('exception').length > 1);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { arg: exceptionBreakpoint, shouldForwardArgs: true }, { primary, secondary: [] }, 'inline');
            data.actionBar.clear();
            data.actionBar.push(primary, { icon: true, label: false });
            breakpointIdToActionBarDomeNode.set(exceptionBreakpoint.getId(), data.actionBar.domNode);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    }
    let FunctionBreakpointsRenderer = class FunctionBreakpointsRenderer {
        static { FunctionBreakpointsRenderer_1 = this; }
        constructor(menu, breakpointSupportsCondition, breakpointItemType, debugService, labelService) {
            this.menu = menu;
            this.breakpointSupportsCondition = breakpointSupportsCondition;
            this.breakpointItemType = breakpointItemType;
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        static { this.ID = 'functionbreakpoints'; }
        get templateId() {
            return FunctionBreakpointsRenderer_1.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDispose = [];
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox(data.toDispose);
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            data.condition = dom.append(data.breakpoint, $('span.condition'));
            data.actionBar = new actionbar_1.ActionBar(data.breakpoint);
            data.toDispose.push(data.actionBar);
            const badgeContainer = dom.append(data.breakpoint, $('.badge-container'));
            data.badge = dom.append(badgeContainer, $('span.line-number.monaco-count-badge'));
            return data;
        }
        renderElement(functionBreakpoint, _index, data) {
            data.context = functionBreakpoint;
            data.name.textContent = functionBreakpoint.name;
            const { icon, message } = getBreakpointMessageAndIcon(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), functionBreakpoint, this.labelService, this.debugService.getModel());
            data.icon.className = themables_1.ThemeIcon.asClassName(icon);
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.icon, message ? message : ''));
            data.checkbox.checked = functionBreakpoint.enabled;
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.breakpoint, message ? message : ''));
            if (functionBreakpoint.condition && functionBreakpoint.hitCondition) {
                data.condition.textContent = (0, nls_1.localize)('expressionAndHitCount', "Condition: {0} | Hit Count: {1}", functionBreakpoint.condition, functionBreakpoint.hitCondition);
            }
            else {
                data.condition.textContent = functionBreakpoint.condition || functionBreakpoint.hitCondition || '';
            }
            if (functionBreakpoint.modeLabel) {
                data.badge.textContent = functionBreakpoint.modeLabel;
                data.badge.style.display = 'block';
            }
            else {
                data.badge.style.display = 'none';
            }
            // Mark function breakpoints as disabled if deactivated or if debug type does not support them #9099
            const session = this.debugService.getViewModel().focusedSession;
            data.breakpoint.classList.toggle('disabled', (session && !session.capabilities.supportsFunctionBreakpoints) || !this.debugService.getModel().areBreakpointsActivated());
            if (session && !session.capabilities.supportsFunctionBreakpoints) {
                data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.breakpoint, (0, nls_1.localize)('functionBreakpointsNotSupported', "Function breakpoints are not supported by this debug type")));
            }
            const primary = [];
            this.breakpointSupportsCondition.set(!session || !!session.capabilities.supportsConditionalBreakpoints);
            this.breakpointItemType.set('functionBreakpoint');
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { arg: functionBreakpoint, shouldForwardArgs: true }, { primary, secondary: [] }, 'inline');
            data.actionBar.clear();
            data.actionBar.push(primary, { icon: true, label: false });
            breakpointIdToActionBarDomeNode.set(functionBreakpoint.getId(), data.actionBar.domNode);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    };
    FunctionBreakpointsRenderer = FunctionBreakpointsRenderer_1 = __decorate([
        __param(3, debug_1.IDebugService),
        __param(4, label_1.ILabelService)
    ], FunctionBreakpointsRenderer);
    let DataBreakpointsRenderer = class DataBreakpointsRenderer {
        static { DataBreakpointsRenderer_1 = this; }
        constructor(menu, breakpointHasMultipleModes, breakpointSupportsCondition, breakpointItemType, breakpointIsDataBytes, debugService, labelService) {
            this.menu = menu;
            this.breakpointHasMultipleModes = breakpointHasMultipleModes;
            this.breakpointSupportsCondition = breakpointSupportsCondition;
            this.breakpointItemType = breakpointItemType;
            this.breakpointIsDataBytes = breakpointIsDataBytes;
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        static { this.ID = 'databreakpoints'; }
        get templateId() {
            return DataBreakpointsRenderer_1.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.toDispose = [];
            data.icon = $('.icon');
            data.checkbox = createCheckbox(data.toDispose);
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            data.accessType = dom.append(data.breakpoint, $('span.access-type'));
            data.condition = dom.append(data.breakpoint, $('span.condition'));
            data.actionBar = new actionbar_1.ActionBar(data.breakpoint);
            data.toDispose.push(data.actionBar);
            const badgeContainer = dom.append(data.breakpoint, $('.badge-container'));
            data.badge = dom.append(badgeContainer, $('span.line-number.monaco-count-badge'));
            return data;
        }
        renderElement(dataBreakpoint, _index, data) {
            data.context = dataBreakpoint;
            data.name.textContent = dataBreakpoint.description;
            const { icon, message } = getBreakpointMessageAndIcon(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), dataBreakpoint, this.labelService, this.debugService.getModel());
            data.icon.className = themables_1.ThemeIcon.asClassName(icon);
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.icon, message ? message : ''));
            data.checkbox.checked = dataBreakpoint.enabled;
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.breakpoint, message ? message : ''));
            if (dataBreakpoint.modeLabel) {
                data.badge.textContent = dataBreakpoint.modeLabel;
                data.badge.style.display = 'block';
            }
            else {
                data.badge.style.display = 'none';
            }
            // Mark data breakpoints as disabled if deactivated or if debug type does not support them
            const session = this.debugService.getViewModel().focusedSession;
            data.breakpoint.classList.toggle('disabled', (session && !session.capabilities.supportsDataBreakpoints) || !this.debugService.getModel().areBreakpointsActivated());
            if (session && !session.capabilities.supportsDataBreakpoints) {
                data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.breakpoint, (0, nls_1.localize)('dataBreakpointsNotSupported', "Data breakpoints are not supported by this debug type")));
            }
            if (dataBreakpoint.accessType) {
                const accessType = dataBreakpoint.accessType === 'read' ? (0, nls_1.localize)('read', "Read") : dataBreakpoint.accessType === 'write' ? (0, nls_1.localize)('write', "Write") : (0, nls_1.localize)('access', "Access");
                data.accessType.textContent = accessType;
            }
            else {
                data.accessType.textContent = '';
            }
            if (dataBreakpoint.condition && dataBreakpoint.hitCondition) {
                data.condition.textContent = (0, nls_1.localize)('expressionAndHitCount', "Condition: {0} | Hit Count: {1}", dataBreakpoint.condition, dataBreakpoint.hitCondition);
            }
            else {
                data.condition.textContent = dataBreakpoint.condition || dataBreakpoint.hitCondition || '';
            }
            const primary = [];
            this.breakpointSupportsCondition.set(!session || !!session.capabilities.supportsConditionalBreakpoints);
            this.breakpointHasMultipleModes.set(this.debugService.getModel().getBreakpointModes('data').length > 1);
            this.breakpointItemType.set('dataBreakpoint');
            this.breakpointIsDataBytes.set(dataBreakpoint.src.type === 1 /* DataBreakpointSetType.Address */);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { arg: dataBreakpoint, shouldForwardArgs: true }, { primary, secondary: [] }, 'inline');
            data.actionBar.clear();
            data.actionBar.push(primary, { icon: true, label: false });
            breakpointIdToActionBarDomeNode.set(dataBreakpoint.getId(), data.actionBar.domNode);
            this.breakpointIsDataBytes.reset();
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    };
    DataBreakpointsRenderer = DataBreakpointsRenderer_1 = __decorate([
        __param(5, debug_1.IDebugService),
        __param(6, label_1.ILabelService)
    ], DataBreakpointsRenderer);
    let InstructionBreakpointsRenderer = class InstructionBreakpointsRenderer {
        static { InstructionBreakpointsRenderer_1 = this; }
        constructor(debugService, labelService) {
            this.debugService = debugService;
            this.labelService = labelService;
            // noop
        }
        static { this.ID = 'instructionBreakpoints'; }
        get templateId() {
            return InstructionBreakpointsRenderer_1.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            data.toDispose = [];
            data.breakpoint = dom.append(container, $('.breakpoint'));
            data.icon = $('.icon');
            data.checkbox = createCheckbox(data.toDispose);
            data.toDispose.push(dom.addStandardDisposableListener(data.checkbox, 'change', (e) => {
                this.debugService.enableOrDisableBreakpoints(!data.context.enabled, data.context);
            }));
            dom.append(data.breakpoint, data.icon);
            dom.append(data.breakpoint, data.checkbox);
            data.name = dom.append(data.breakpoint, $('span.name'));
            data.address = dom.append(data.breakpoint, $('span.file-path'));
            data.actionBar = new actionbar_1.ActionBar(data.breakpoint);
            data.toDispose.push(data.actionBar);
            const badgeContainer = dom.append(data.breakpoint, $('.badge-container'));
            data.badge = dom.append(badgeContainer, $('span.line-number.monaco-count-badge'));
            return data;
        }
        renderElement(breakpoint, index, data) {
            data.context = breakpoint;
            data.breakpoint.classList.toggle('disabled', !this.debugService.getModel().areBreakpointsActivated());
            data.name.textContent = '0x' + breakpoint.address.toString(16);
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.name, `Decimal address: breakpoint.address.toString()`));
            data.checkbox.checked = breakpoint.enabled;
            const { message, icon } = getBreakpointMessageAndIcon(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), breakpoint, this.labelService, this.debugService.getModel());
            data.icon.className = themables_1.ThemeIcon.asClassName(icon);
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.breakpoint, breakpoint.message || message || ''));
            const debugActive = this.debugService.state === 3 /* State.Running */ || this.debugService.state === 2 /* State.Stopped */;
            if (debugActive && !breakpoint.verified) {
                data.breakpoint.classList.add('disabled');
            }
            if (breakpoint.modeLabel) {
                data.badge.textContent = breakpoint.modeLabel;
                data.badge.style.display = 'block';
            }
            else {
                data.badge.style.display = 'none';
            }
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    };
    InstructionBreakpointsRenderer = InstructionBreakpointsRenderer_1 = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, label_1.ILabelService)
    ], InstructionBreakpointsRenderer);
    class FunctionBreakpointInputRenderer {
        constructor(view, debugService, contextViewService, labelService) {
            this.view = view;
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            this.labelService = labelService;
        }
        static { this.ID = 'functionbreakpointinput'; }
        get templateId() {
            return FunctionBreakpointInputRenderer.ID;
        }
        renderTemplate(container) {
            const template = Object.create(null);
            const toDispose = [];
            const breakpoint = dom.append(container, $('.breakpoint'));
            template.icon = $('.icon');
            template.checkbox = createCheckbox(toDispose);
            dom.append(breakpoint, template.icon);
            dom.append(breakpoint, template.checkbox);
            this.view.breakpointInputFocused.set(true);
            const inputBoxContainer = dom.append(breakpoint, $('.inputBoxContainer'));
            const inputBox = new inputBox_1.InputBox(inputBoxContainer, this.contextViewService, { inputBoxStyles: defaultStyles_1.defaultInputBoxStyles });
            const wrapUp = (success) => {
                template.updating = true;
                try {
                    this.view.breakpointInputFocused.set(false);
                    const id = template.breakpoint.getId();
                    if (success) {
                        if (template.type === 'name') {
                            this.debugService.updateFunctionBreakpoint(id, { name: inputBox.value });
                        }
                        if (template.type === 'condition') {
                            this.debugService.updateFunctionBreakpoint(id, { condition: inputBox.value });
                        }
                        if (template.type === 'hitCount') {
                            this.debugService.updateFunctionBreakpoint(id, { hitCondition: inputBox.value });
                        }
                    }
                    else {
                        if (template.type === 'name' && !template.breakpoint.name) {
                            this.debugService.removeFunctionBreakpoints(id);
                        }
                        else {
                            this.view.renderInputBox(undefined);
                        }
                    }
                }
                finally {
                    template.updating = false;
                }
            };
            toDispose.push(dom.addStandardDisposableListener(inputBox.inputElement, 'keydown', (e) => {
                const isEscape = e.equals(9 /* KeyCode.Escape */);
                const isEnter = e.equals(3 /* KeyCode.Enter */);
                if (isEscape || isEnter) {
                    e.preventDefault();
                    e.stopPropagation();
                    wrapUp(isEnter);
                }
            }));
            toDispose.push(dom.addDisposableListener(inputBox.inputElement, 'blur', () => {
                if (!template.updating) {
                    wrapUp(!!inputBox.value);
                }
            }));
            template.inputBox = inputBox;
            template.toDispose = toDispose;
            return template;
        }
        renderElement(functionBreakpoint, _index, data) {
            data.breakpoint = functionBreakpoint;
            data.type = this.view.inputBoxData?.type || 'name'; // If there is no type set take the 'name' as the default
            const { icon, message } = getBreakpointMessageAndIcon(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), functionBreakpoint, this.labelService, this.debugService.getModel());
            data.icon.className = themables_1.ThemeIcon.asClassName(icon);
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.icon, message ? message : ''));
            data.checkbox.checked = functionBreakpoint.enabled;
            data.checkbox.disabled = true;
            data.inputBox.value = functionBreakpoint.name || '';
            let placeholder = (0, nls_1.localize)('functionBreakpointPlaceholder', "Function to break on");
            let ariaLabel = (0, nls_1.localize)('functionBreakPointInputAriaLabel', "Type function breakpoint.");
            if (data.type === 'condition') {
                data.inputBox.value = functionBreakpoint.condition || '';
                placeholder = (0, nls_1.localize)('functionBreakpointExpressionPlaceholder', "Break when expression evaluates to true");
                ariaLabel = (0, nls_1.localize)('functionBreakPointExpresionAriaLabel', "Type expression. Function breakpoint will break when expression evaluates to true");
            }
            else if (data.type === 'hitCount') {
                data.inputBox.value = functionBreakpoint.hitCondition || '';
                placeholder = (0, nls_1.localize)('functionBreakpointHitCountPlaceholder', "Break when hit count is met");
                ariaLabel = (0, nls_1.localize)('functionBreakPointHitCountAriaLabel', "Type hit count. Function breakpoint will break when hit count is met.");
            }
            data.inputBox.setAriaLabel(ariaLabel);
            data.inputBox.setPlaceHolder(placeholder);
            setTimeout(() => {
                data.inputBox.focus();
                data.inputBox.select();
            }, 0);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    }
    class DataBreakpointInputRenderer {
        constructor(view, debugService, contextViewService, labelService) {
            this.view = view;
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            this.labelService = labelService;
        }
        static { this.ID = 'databreakpointinput'; }
        get templateId() {
            return DataBreakpointInputRenderer.ID;
        }
        renderTemplate(container) {
            const template = Object.create(null);
            const toDispose = [];
            const breakpoint = dom.append(container, $('.breakpoint'));
            template.icon = $('.icon');
            template.checkbox = createCheckbox(toDispose);
            dom.append(breakpoint, template.icon);
            dom.append(breakpoint, template.checkbox);
            this.view.breakpointInputFocused.set(true);
            const inputBoxContainer = dom.append(breakpoint, $('.inputBoxContainer'));
            const inputBox = new inputBox_1.InputBox(inputBoxContainer, this.contextViewService, { inputBoxStyles: defaultStyles_1.defaultInputBoxStyles });
            const wrapUp = (success) => {
                template.updating = true;
                try {
                    this.view.breakpointInputFocused.set(false);
                    const id = template.breakpoint.getId();
                    if (success) {
                        if (template.type === 'condition') {
                            this.debugService.updateDataBreakpoint(id, { condition: inputBox.value });
                        }
                        if (template.type === 'hitCount') {
                            this.debugService.updateDataBreakpoint(id, { hitCondition: inputBox.value });
                        }
                    }
                    else {
                        this.view.renderInputBox(undefined);
                    }
                }
                finally {
                    template.updating = false;
                }
            };
            toDispose.push(dom.addStandardDisposableListener(inputBox.inputElement, 'keydown', (e) => {
                const isEscape = e.equals(9 /* KeyCode.Escape */);
                const isEnter = e.equals(3 /* KeyCode.Enter */);
                if (isEscape || isEnter) {
                    e.preventDefault();
                    e.stopPropagation();
                    wrapUp(isEnter);
                }
            }));
            toDispose.push(dom.addDisposableListener(inputBox.inputElement, 'blur', () => {
                if (!template.updating) {
                    wrapUp(!!inputBox.value);
                }
            }));
            template.inputBox = inputBox;
            template.toDispose = toDispose;
            return template;
        }
        renderElement(dataBreakpoint, _index, data) {
            data.breakpoint = dataBreakpoint;
            data.type = this.view.inputBoxData?.type || 'condition'; // If there is no type set take the 'condition' as the default
            const { icon, message } = getBreakpointMessageAndIcon(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), dataBreakpoint, this.labelService, this.debugService.getModel());
            data.icon.className = themables_1.ThemeIcon.asClassName(icon);
            data.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), data.icon, message ?? ''));
            data.checkbox.checked = dataBreakpoint.enabled;
            data.checkbox.disabled = true;
            data.inputBox.value = '';
            let placeholder = '';
            let ariaLabel = '';
            if (data.type === 'condition') {
                data.inputBox.value = dataBreakpoint.condition || '';
                placeholder = (0, nls_1.localize)('dataBreakpointExpressionPlaceholder', "Break when expression evaluates to true");
                ariaLabel = (0, nls_1.localize)('dataBreakPointExpresionAriaLabel', "Type expression. Data breakpoint will break when expression evaluates to true");
            }
            else if (data.type === 'hitCount') {
                data.inputBox.value = dataBreakpoint.hitCondition || '';
                placeholder = (0, nls_1.localize)('dataBreakpointHitCountPlaceholder', "Break when hit count is met");
                ariaLabel = (0, nls_1.localize)('dataBreakPointHitCountAriaLabel', "Type hit count. Data breakpoint will break when hit count is met.");
            }
            data.inputBox.setAriaLabel(ariaLabel);
            data.inputBox.setPlaceHolder(placeholder);
            setTimeout(() => {
                data.inputBox.focus();
                data.inputBox.select();
            }, 0);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    }
    class ExceptionBreakpointInputRenderer {
        constructor(view, debugService, contextViewService) {
            this.view = view;
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            // noop
        }
        static { this.ID = 'exceptionbreakpointinput'; }
        get templateId() {
            return ExceptionBreakpointInputRenderer.ID;
        }
        renderTemplate(container) {
            const template = Object.create(null);
            const toDispose = [];
            const breakpoint = dom.append(container, $('.breakpoint'));
            breakpoint.classList.add('exception');
            template.checkbox = createCheckbox(toDispose);
            dom.append(breakpoint, template.checkbox);
            this.view.breakpointInputFocused.set(true);
            const inputBoxContainer = dom.append(breakpoint, $('.inputBoxContainer'));
            const inputBox = new inputBox_1.InputBox(inputBoxContainer, this.contextViewService, {
                ariaLabel: (0, nls_1.localize)('exceptionBreakpointAriaLabel', "Type exception breakpoint condition"),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            const wrapUp = (success) => {
                this.view.breakpointInputFocused.set(false);
                let newCondition = template.breakpoint.condition;
                if (success) {
                    newCondition = inputBox.value !== '' ? inputBox.value : undefined;
                }
                this.debugService.setExceptionBreakpointCondition(template.breakpoint, newCondition);
            };
            toDispose.push(dom.addStandardDisposableListener(inputBox.inputElement, 'keydown', (e) => {
                const isEscape = e.equals(9 /* KeyCode.Escape */);
                const isEnter = e.equals(3 /* KeyCode.Enter */);
                if (isEscape || isEnter) {
                    e.preventDefault();
                    e.stopPropagation();
                    wrapUp(isEnter);
                }
            }));
            toDispose.push(dom.addDisposableListener(inputBox.inputElement, 'blur', () => {
                // Need to react with a timeout on the blur event due to possible concurent splices #56443
                setTimeout(() => {
                    wrapUp(true);
                });
            }));
            template.inputBox = inputBox;
            template.toDispose = toDispose;
            return template;
        }
        renderElement(exceptionBreakpoint, _index, data) {
            const placeHolder = exceptionBreakpoint.conditionDescription || (0, nls_1.localize)('exceptionBreakpointPlaceholder', "Break when expression evaluates to true");
            data.inputBox.setPlaceHolder(placeHolder);
            data.breakpoint = exceptionBreakpoint;
            data.checkbox.checked = exceptionBreakpoint.enabled;
            data.checkbox.disabled = true;
            data.inputBox.value = exceptionBreakpoint.condition || '';
            setTimeout(() => {
                data.inputBox.focus();
                data.inputBox.select();
            }, 0);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
    }
    class BreakpointsAccessibilityProvider {
        constructor(debugService, labelService) {
            this.debugService = debugService;
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('breakpoints', "Breakpoints");
        }
        getRole() {
            return 'checkbox';
        }
        isChecked(breakpoint) {
            return breakpoint.enabled;
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.ExceptionBreakpoint) {
                return element.toString();
            }
            const { message } = getBreakpointMessageAndIcon(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), element, this.labelService, this.debugService.getModel());
            const toString = element.toString();
            return message ? `${toString}, ${message}` : toString;
        }
    }
    function openBreakpointSource(breakpoint, sideBySide, preserveFocus, pinned, debugService, editorService) {
        if (breakpoint.uri.scheme === debug_1.DEBUG_SCHEME && debugService.state === 0 /* State.Inactive */) {
            return Promise.resolve(undefined);
        }
        const selection = breakpoint.endLineNumber ? {
            startLineNumber: breakpoint.lineNumber,
            endLineNumber: breakpoint.endLineNumber,
            startColumn: breakpoint.column || 1,
            endColumn: breakpoint.endColumn || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */
        } : {
            startLineNumber: breakpoint.lineNumber,
            startColumn: breakpoint.column || 1,
            endLineNumber: breakpoint.lineNumber,
            endColumn: breakpoint.column || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */
        };
        return editorService.openEditor({
            resource: breakpoint.uri,
            options: {
                preserveFocus,
                selection,
                revealIfOpened: true,
                selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */,
                pinned
            }
        }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
    }
    function getBreakpointMessageAndIcon(state, breakpointsActivated, breakpoint, labelService, debugModel) {
        const debugActive = state === 3 /* State.Running */ || state === 2 /* State.Stopped */;
        const breakpointIcon = breakpoint instanceof debugModel_1.DataBreakpoint ? icons.dataBreakpoint : breakpoint instanceof debugModel_1.FunctionBreakpoint ? icons.functionBreakpoint : breakpoint.logMessage ? icons.logBreakpoint : icons.breakpoint;
        if (!breakpoint.enabled || !breakpointsActivated) {
            return {
                icon: breakpointIcon.disabled,
                message: breakpoint.logMessage ? (0, nls_1.localize)('disabledLogpoint', "Disabled Logpoint") : (0, nls_1.localize)('disabledBreakpoint', "Disabled Breakpoint"),
            };
        }
        const appendMessage = (text) => {
            return ('message' in breakpoint && breakpoint.message) ? text.concat(', ' + breakpoint.message) : text;
        };
        if (debugActive && breakpoint instanceof debugModel_1.Breakpoint && breakpoint.pending) {
            return {
                icon: icons.breakpoint.pending
            };
        }
        if (debugActive && !breakpoint.verified) {
            return {
                icon: breakpointIcon.unverified,
                message: ('message' in breakpoint && breakpoint.message) ? breakpoint.message : (breakpoint.logMessage ? (0, nls_1.localize)('unverifiedLogpoint', "Unverified Logpoint") : (0, nls_1.localize)('unverifiedBreakpoint', "Unverified Breakpoint")),
                showAdapterUnverifiedMessage: true
            };
        }
        if (breakpoint instanceof debugModel_1.DataBreakpoint) {
            if (!breakpoint.supported) {
                return {
                    icon: breakpointIcon.unverified,
                    message: (0, nls_1.localize)('dataBreakpointUnsupported', "Data breakpoints not supported by this debug type"),
                };
            }
            return {
                icon: breakpointIcon.regular,
                message: breakpoint.message || (0, nls_1.localize)('dataBreakpoint', "Data Breakpoint")
            };
        }
        if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
            if (!breakpoint.supported) {
                return {
                    icon: breakpointIcon.unverified,
                    message: (0, nls_1.localize)('functionBreakpointUnsupported', "Function breakpoints not supported by this debug type"),
                };
            }
            const messages = [];
            messages.push(breakpoint.message || (0, nls_1.localize)('functionBreakpoint', "Function Breakpoint"));
            if (breakpoint.condition) {
                messages.push((0, nls_1.localize)('expression', "Condition: {0}", breakpoint.condition));
            }
            if (breakpoint.hitCondition) {
                messages.push((0, nls_1.localize)('hitCount', "Hit Count: {0}", breakpoint.hitCondition));
            }
            return {
                icon: breakpointIcon.regular,
                message: appendMessage(messages.join('\n'))
            };
        }
        if (breakpoint instanceof debugModel_1.InstructionBreakpoint) {
            if (!breakpoint.supported) {
                return {
                    icon: breakpointIcon.unverified,
                    message: (0, nls_1.localize)('instructionBreakpointUnsupported', "Instruction breakpoints not supported by this debug type"),
                };
            }
            const messages = [];
            if (breakpoint.message) {
                messages.push(breakpoint.message);
            }
            else if (breakpoint.instructionReference) {
                messages.push((0, nls_1.localize)('instructionBreakpointAtAddress', "Instruction breakpoint at address {0}", breakpoint.instructionReference));
            }
            else {
                messages.push((0, nls_1.localize)('instructionBreakpoint', "Instruction breakpoint"));
            }
            if (breakpoint.hitCondition) {
                messages.push((0, nls_1.localize)('hitCount', "Hit Count: {0}", breakpoint.hitCondition));
            }
            return {
                icon: breakpointIcon.regular,
                message: appendMessage(messages.join('\n'))
            };
        }
        // can change this when all breakpoint supports dependent breakpoint condition
        let triggeringBreakpoint;
        if (breakpoint instanceof debugModel_1.Breakpoint && breakpoint.triggeredBy) {
            triggeringBreakpoint = debugModel.getBreakpoints().find(bp => bp.getId() === breakpoint.triggeredBy);
        }
        if (breakpoint.logMessage || breakpoint.condition || breakpoint.hitCondition || triggeringBreakpoint) {
            const messages = [];
            let icon = breakpoint.logMessage ? icons.logBreakpoint.regular : icons.conditionalBreakpoint.regular;
            if (!breakpoint.supported) {
                icon = icons.debugBreakpointUnsupported;
                messages.push((0, nls_1.localize)('breakpointUnsupported', "Breakpoints of this type are not supported by the debugger"));
            }
            if (breakpoint.logMessage) {
                messages.push((0, nls_1.localize)('logMessage', "Log Message: {0}", breakpoint.logMessage));
            }
            if (breakpoint.condition) {
                messages.push((0, nls_1.localize)('expression', "Condition: {0}", breakpoint.condition));
            }
            if (breakpoint.hitCondition) {
                messages.push((0, nls_1.localize)('hitCount', "Hit Count: {0}", breakpoint.hitCondition));
            }
            if (triggeringBreakpoint) {
                messages.push((0, nls_1.localize)('triggeredBy', "Hit after breakpoint: {0}", `${labelService.getUriLabel(triggeringBreakpoint.uri, { relative: true })}: ${triggeringBreakpoint.lineNumber}`));
            }
            return {
                icon,
                message: appendMessage(messages.join('\n'))
            };
        }
        const message = ('message' in breakpoint && breakpoint.message) ? breakpoint.message : breakpoint instanceof debugModel_1.Breakpoint && labelService ? labelService.getUriLabel(breakpoint.uri) : (0, nls_1.localize)('breakpoint', "Breakpoint");
        return {
            icon: breakpointIcon.regular,
            message
        };
    }
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.addFunctionBreakpointAction',
                title: {
                    ...(0, nls_1.localize2)('addFunctionBreakpoint', "Add Function Breakpoint"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miFunctionBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Function Breakpoint..."),
                },
                f1: true,
                icon: icons.watchExpressionsAddFuncBreakpoint,
                menu: [{
                        id: actions_2.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 10,
                        when: contextkey_1.ContextKeyExpr.equals('view', debug_1.BREAKPOINTS_VIEW_ID)
                    }, {
                        id: actions_2.MenuId.MenubarNewBreakpointMenu,
                        group: '1_breakpoints',
                        order: 3,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                    }]
            });
        }
        run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.addFunctionBreakpoint();
        }
    });
    class MemoryBreakpointAction extends actions_2.Action2 {
        async run(accessor, existingBreakpoint) {
            const debugService = accessor.get(debug_1.IDebugService);
            const session = debugService.getViewModel().focusedSession;
            if (!session) {
                return;
            }
            let defaultValue = undefined;
            if (existingBreakpoint && existingBreakpoint.src.type === 1 /* DataBreakpointSetType.Address */) {
                defaultValue = `${existingBreakpoint.src.address} + ${existingBreakpoint.src.bytes}`;
            }
            const quickInput = accessor.get(quickInput_1.IQuickInputService);
            const notifications = accessor.get(notification_1.INotificationService);
            const range = await this.getRange(quickInput, defaultValue);
            if (!range) {
                return;
            }
            let info;
            try {
                info = await session.dataBytesBreakpointInfo(range.address, range.bytes);
            }
            catch (e) {
                notifications.error((0, nls_1.localize)('dataBreakpointError', "Failed to set data breakpoint at {0}: {1}", range.address, e.message));
            }
            if (!info?.dataId) {
                return;
            }
            let accessType = 'write';
            if (info.accessTypes && info.accessTypes?.length > 1) {
                const accessTypes = info.accessTypes.map(type => ({ label: type }));
                const selectedAccessType = await quickInput.pick(accessTypes, { placeHolder: (0, nls_1.localize)('dataBreakpointAccessType', "Select the access type to monitor") });
                if (!selectedAccessType) {
                    return;
                }
                accessType = selectedAccessType.label;
            }
            const src = { type: 1 /* DataBreakpointSetType.Address */, ...range };
            if (existingBreakpoint) {
                await debugService.removeDataBreakpoints(existingBreakpoint.getId());
            }
            await debugService.addDataBreakpoint({
                description: info.description,
                src,
                canPersist: true,
                accessTypes: info.accessTypes,
                accessType: accessType,
                initialSessionData: { session, dataId: info.dataId }
            });
        }
        getRange(quickInput, defaultValue) {
            return new Promise(resolve => {
                const input = quickInput.createInputBox();
                input.prompt = (0, nls_1.localize)('dataBreakpointMemoryRangePrompt', "Enter a memory range in which to break");
                input.placeholder = (0, nls_1.localize)('dataBreakpointMemoryRangePlaceholder', 'Absolute range (0x1234 - 0x1300) or range of bytes after an address (0x1234 + 0xff)');
                if (defaultValue) {
                    input.value = defaultValue;
                    input.valueSelection = [0, defaultValue.length];
                }
                input.onDidChangeValue(e => {
                    const err = this.parseAddress(e, false);
                    input.validationMessage = err?.error;
                });
                input.onDidAccept(() => {
                    const r = this.parseAddress(input.value, true);
                    if ('error' in r) {
                        input.validationMessage = r.error;
                    }
                    else {
                        resolve(r);
                    }
                    input.dispose();
                });
                input.onDidHide(() => {
                    resolve(undefined);
                    input.dispose();
                });
                input.ignoreFocusOut = true;
                input.show();
            });
        }
        parseAddress(range, isFinal) {
            const parts = /^(\S+)\s*(?:([+-])\s*(\S+))?/.exec(range);
            if (!parts) {
                return { error: (0, nls_1.localize)('dataBreakpointAddrFormat', 'Address should be a range of numbers the form "[Start] - [End]" or "[Start] + [Bytes]"') };
            }
            const isNum = (e) => isFinal ? /^0x[0-9a-f]*|[0-9]*$/i.test(e) : /^0x[0-9a-f]+|[0-9]+$/i.test(e);
            const [, startStr, sign = '+', endStr = '1'] = parts;
            for (const n of [startStr, endStr]) {
                if (!isNum(n)) {
                    return { error: (0, nls_1.localize)('dataBreakpointAddrStartEnd', 'Number must be a decimal integer or hex value starting with \"0x\", got {0}', n) };
                }
            }
            if (!isFinal) {
                return;
            }
            const start = BigInt(startStr);
            const end = BigInt(endStr);
            const address = `0x${start.toString(16)}`;
            if (sign === '-') {
                return { address, bytes: Number(start - end) };
            }
            return { address, bytes: Number(end) };
        }
    }
    (0, actions_2.registerAction2)(class extends MemoryBreakpointAction {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.addDataBreakpointOnAddress',
                title: {
                    ...(0, nls_1.localize2)('addDataBreakpointOnAddress', "Add Data Breakpoint at Address"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miDataBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Data Breakpoint..."),
                },
                f1: true,
                icon: icons.watchExpressionsAddDataBreakpoint,
                menu: [{
                        id: actions_2.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 11,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_SET_DATA_BREAKPOINT_BYTES_SUPPORTED, contextkey_1.ContextKeyExpr.equals('view', debug_1.BREAKPOINTS_VIEW_ID))
                    }, {
                        id: actions_2.MenuId.MenubarNewBreakpointMenu,
                        group: '1_breakpoints',
                        order: 4,
                        when: debug_1.CONTEXT_SET_DATA_BREAKPOINT_BYTES_SUPPORTED
                    }]
            });
        }
    });
    (0, actions_2.registerAction2)(class extends MemoryBreakpointAction {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.editDataBreakpointOnAddress',
                title: (0, nls_1.localize2)('editDataBreakpointOnAddress', "Edit Address..."),
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_SET_DATA_BREAKPOINT_BYTES_SUPPORTED, debug_1.CONTEXT_BREAKPOINT_ITEM_IS_DATA_BYTES),
                        group: 'navigation',
                        order: 15,
                    }]
            });
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.toggleBreakpointsActivatedAction',
                title: (0, nls_1.localize2)('activateBreakpoints', 'Toggle Activate Breakpoints'),
                f1: true,
                icon: icons.breakpointsActivate,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    order: 20,
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.BREAKPOINTS_VIEW_ID)
                }
            });
        }
        run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.setBreakpointsActivated(!debugService.getModel().areBreakpointsActivated());
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.removeBreakpoint',
                title: (0, nls_1.localize)('removeBreakpoint', "Remove Breakpoint"),
                icon: codicons_1.Codicon.removeClose,
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: '3_modification',
                        order: 10,
                        when: debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.notEqualsTo('exceptionBreakpoint')
                    }, {
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'inline',
                        order: 20,
                        when: debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.notEqualsTo('exceptionBreakpoint')
                    }]
            });
        }
        async run(accessor, breakpoint) {
            const debugService = accessor.get(debug_1.IDebugService);
            if (breakpoint instanceof debugModel_1.Breakpoint) {
                await debugService.removeBreakpoints(breakpoint.getId());
            }
            else if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
                await debugService.removeFunctionBreakpoints(breakpoint.getId());
            }
            else if (breakpoint instanceof debugModel_1.DataBreakpoint) {
                await debugService.removeDataBreakpoints(breakpoint.getId());
            }
            else if (breakpoint instanceof debugModel_1.InstructionBreakpoint) {
                await debugService.removeInstructionBreakpoints(breakpoint.instructionReference);
            }
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.removeAllBreakpoints',
                title: {
                    ...(0, nls_1.localize2)('removeAllBreakpoints', "Remove All Breakpoints"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miRemoveAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "Remove &&All Breakpoints"),
                },
                f1: true,
                icon: icons.breakpointsRemoveAll,
                menu: [{
                        id: actions_2.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 30,
                        when: contextkey_1.ContextKeyExpr.equals('view', debug_1.BREAKPOINTS_VIEW_ID)
                    }, {
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: '3_modification',
                        order: 20,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_EXIST, debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.notEqualsTo('exceptionBreakpoint'))
                    }, {
                        id: actions_2.MenuId.MenubarDebugMenu,
                        group: '5_breakpoints',
                        order: 3,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                    }]
            });
        }
        run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.removeBreakpoints();
            debugService.removeFunctionBreakpoints();
            debugService.removeDataBreakpoints();
            debugService.removeInstructionBreakpoints();
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.enableAllBreakpoints',
                title: {
                    ...(0, nls_1.localize2)('enableAllBreakpoints', "Enable All Breakpoints"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miEnableAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "&&Enable All Breakpoints"),
                },
                f1: true,
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'z_commands',
                        order: 10,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_EXIST, debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.notEqualsTo('exceptionBreakpoint'))
                    }, {
                        id: actions_2.MenuId.MenubarDebugMenu,
                        group: '5_breakpoints',
                        order: 1,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                    }]
            });
        }
        async run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            await debugService.enableOrDisableBreakpoints(true);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.disableAllBreakpoints',
                title: {
                    ...(0, nls_1.localize2)('disableAllBreakpoints', "Disable All Breakpoints"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miDisableAllBreakpoints', comment: ['&& denotes a mnemonic'] }, "Disable A&&ll Breakpoints"),
                },
                f1: true,
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'z_commands',
                        order: 20,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_EXIST, debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.notEqualsTo('exceptionBreakpoint'))
                    }, {
                        id: actions_2.MenuId.MenubarDebugMenu,
                        group: '5_breakpoints',
                        order: 2,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                    }]
            });
        }
        async run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            await debugService.enableOrDisableBreakpoints(false);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.debug.viewlet.action.reapplyBreakpointsAction',
                title: (0, nls_1.localize2)('reapplyAllBreakpoints', 'Reapply All Breakpoints'),
                f1: true,
                precondition: debug_1.CONTEXT_IN_DEBUG_MODE,
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'z_commands',
                        order: 30,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_EXIST, debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.notEqualsTo('exceptionBreakpoint'))
                    }]
            });
        }
        async run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            await debugService.setBreakpointsActivated(true);
        }
    });
    (0, actions_2.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'debug.editBreakpoint',
                viewId: debug_1.BREAKPOINTS_VIEW_ID,
                title: (0, nls_1.localize)('editCondition', "Edit Condition..."),
                icon: codicons_1.Codicon.edit,
                precondition: debug_1.CONTEXT_BREAKPOINT_SUPPORTS_CONDITION,
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        when: debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.notEqualsTo('functionBreakpoint'),
                        group: 'navigation',
                        order: 10
                    }, {
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'inline',
                        order: 10
                    }]
            });
        }
        async runInView(accessor, view, breakpoint) {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (breakpoint instanceof debugModel_1.Breakpoint) {
                const editor = await openBreakpointSource(breakpoint, false, false, true, debugService, editorService);
                if (editor) {
                    const codeEditor = editor.getControl();
                    if ((0, editorBrowser_1.isCodeEditor)(codeEditor)) {
                        codeEditor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID)?.showBreakpointWidget(breakpoint.lineNumber, breakpoint.column);
                    }
                }
            }
            else if (breakpoint instanceof debugModel_1.FunctionBreakpoint) {
                const contextMenuService = accessor.get(contextView_1.IContextMenuService);
                const actions = [new actions_1.Action('breakpoint.editCondition', (0, nls_1.localize)('editCondition', "Edit Condition..."), undefined, true, async () => view.renderInputBox({ breakpoint, type: 'condition' })),
                    new actions_1.Action('breakpoint.editCondition', (0, nls_1.localize)('editHitCount', "Edit Hit Count..."), undefined, true, async () => view.renderInputBox({ breakpoint, type: 'hitCount' }))];
                const domNode = breakpointIdToActionBarDomeNode.get(breakpoint.getId());
                if (domNode) {
                    contextMenuService.showContextMenu({
                        getActions: () => actions,
                        getAnchor: () => domNode,
                        onHide: () => (0, lifecycle_1.dispose)(actions)
                    });
                }
            }
            else {
                view.renderInputBox({ breakpoint, type: 'condition' });
            }
        }
    });
    (0, actions_2.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'debug.editFunctionBreakpoint',
                viewId: debug_1.BREAKPOINTS_VIEW_ID,
                title: (0, nls_1.localize)('editBreakpoint', "Edit Function Condition..."),
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'navigation',
                        order: 10,
                        when: debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.isEqualTo('functionBreakpoint')
                    }]
            });
        }
        runInView(_accessor, view, breakpoint) {
            view.renderInputBox({ breakpoint, type: 'name' });
        }
    });
    (0, actions_2.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'debug.editFunctionBreakpointHitCount',
                viewId: debug_1.BREAKPOINTS_VIEW_ID,
                title: (0, nls_1.localize)('editHitCount', "Edit Hit Count..."),
                precondition: debug_1.CONTEXT_BREAKPOINT_SUPPORTS_CONDITION,
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'navigation',
                        order: 20,
                        when: contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.isEqualTo('functionBreakpoint'), debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.isEqualTo('dataBreakpoint'))
                    }]
            });
        }
        runInView(_accessor, view, breakpoint) {
            view.renderInputBox({ breakpoint, type: 'hitCount' });
        }
    });
    (0, actions_2.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'debug.editBreakpointMode',
                viewId: debug_1.BREAKPOINTS_VIEW_ID,
                title: (0, nls_1.localize)('editMode', "Edit Mode..."),
                menu: [{
                        id: actions_2.MenuId.DebugBreakpointsContext,
                        group: 'navigation',
                        order: 20,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINT_HAS_MODES, contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.isEqualTo('breakpoint'), debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.isEqualTo('exceptionBreakpoint'), debug_1.CONTEXT_BREAKPOINT_ITEM_TYPE.isEqualTo('instructionBreakpoint')))
                    }]
            });
        }
        async runInView(accessor, view, breakpoint) {
            const kind = breakpoint instanceof debugModel_1.Breakpoint ? 'source' : breakpoint instanceof debugModel_1.InstructionBreakpoint ? 'instruction' : 'exception';
            const debugService = accessor.get(debug_1.IDebugService);
            const modes = debugService.getModel().getBreakpointModes(kind);
            const picked = await accessor.get(quickInput_1.IQuickInputService).pick(modes.map(mode => ({ label: mode.label, description: mode.description, mode: mode.mode })), { placeHolder: (0, nls_1.localize)('selectBreakpointMode', "Select Breakpoint Mode") });
            if (!picked) {
                return;
            }
            if (kind === 'source') {
                const data = new Map();
                data.set(breakpoint.getId(), { mode: picked.mode, modeLabel: picked.label });
                debugService.updateBreakpoints(breakpoint.originalUri, data, false);
            }
            else if (breakpoint instanceof debugModel_1.InstructionBreakpoint) {
                debugService.removeInstructionBreakpoints(breakpoint.instructionReference, breakpoint.offset);
                debugService.addInstructionBreakpoint({ ...breakpoint.toJSON(), mode: picked.mode, modeLabel: picked.label });
            }
            else if (breakpoint instanceof debugModel_1.ExceptionBreakpoint) {
                breakpoint.mode = picked.mode;
                breakpoint.modeLabel = picked.label;
                debugService.setExceptionBreakpointCondition(breakpoint, breakpoint.condition); // no-op to trigger a re-send
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludHNWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2JyZWFrcG9pbnRzVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0VoRyxrREFHQztJQTZvQ0Qsb0RBMkJDO0lBRUQsa0VBa0lDO0lBM3pDRCxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLFNBQVMsY0FBYyxDQUFDLFdBQTBCO1FBQ2pELE1BQU0sUUFBUSxHQUFxQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUMsUUFBUSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7UUFDM0IsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2QixXQUFXLENBQUMsSUFBSSxDQUFDLGVBQU8sQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUVqRCxPQUFPLFFBQVEsQ0FBQztJQUNqQixDQUFDO0lBRUQsTUFBTSx1QkFBdUIsR0FBRyxDQUFDLENBQUM7SUFDbEMsU0FBZ0IsbUJBQW1CLENBQUMsS0FBa0IsRUFBRSxTQUE2QixFQUFFLFVBQWtCO1FBQ3hHLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixFQUFFLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLE1BQU0sQ0FBQztRQUNoTyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFF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