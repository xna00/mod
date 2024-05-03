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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugContext", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugVisualizers", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, dom, highlightedLabel_1, actions_1, arrays_1, async_1, cancellation_1, codicons_1, filters_1, lifecycle_1, themables_1, nls_1, menuEntryActionViewItem_1, actions_2, clipboardService_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, listService_1, notification_1, opener_1, telemetry_1, themeService_1, viewPane_1, views_1, baseDebugView_1, linkDetector_1, debug_1, debugContext_1, debugModel_1, debugVisualizers_1, extensions_1, editorService_1, extensions_2) {
    "use strict";
    var VisualizedVariableRenderer_1, VariablesRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ADD_TO_WATCH_ID = exports.COPY_EVALUATE_PATH_ID = exports.BREAK_WHEN_VALUE_IS_READ_ID = exports.BREAK_WHEN_VALUE_IS_ACCESSED_ID = exports.BREAK_WHEN_VALUE_CHANGES_ID = exports.VIEW_MEMORY_ID = exports.COPY_VALUE_ID = exports.SET_VARIABLE_ID = exports.VariablesRenderer = exports.VisualizedVariableRenderer = exports.VariablesView = void 0;
    exports.openContextMenuForVariableTreeElement = openContextMenuForVariableTreeElement;
    const $ = dom.$;
    let forgetScopes = true;
    let variableInternalContext;
    let dataBreakpointInfoResponse;
    let VariablesView = class VariablesView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, configurationService, instantiationService, viewDescriptorService, contextKeyService, openerService, themeService, telemetryService, menuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.menuService = menuService;
            this.needsRefresh = false;
            this.savedViewState = new Map();
            this.autoExpandedScopes = new Set();
            // Use scheduler to prevent unnecessary flashing
            this.updateTreeScheduler = new async_1.RunOnceScheduler(async () => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                this.needsRefresh = false;
                const input = this.tree.getInput();
                if (input) {
                    this.savedViewState.set(input.getId(), this.tree.getViewState());
                }
                if (!stackFrame) {
                    await this.tree.setInput(null);
                    return;
                }
                const viewState = this.savedViewState.get(stackFrame.getId());
                await this.tree.setInput(stackFrame, viewState);
                // Automatically expand the first non-expensive scope
                const scopes = await stackFrame.getScopes();
                const toExpand = scopes.find(s => !s.expensive);
                // A race condition could be present causing the scopes here to be different from the scopes that the tree just retrieved.
                // If that happened, don't try to reveal anything, it will be straightened out on the next update
                if (toExpand && this.tree.hasNode(toExpand)) {
                    this.autoExpandedScopes.add(toExpand.getId());
                    await this.tree.expand(toExpand);
                }
            }, 400);
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            container.classList.add('debug-variables');
            const treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            const linkDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'VariablesView', treeContainer, new VariablesDelegate(), [
                this.instantiationService.createInstance(VariablesRenderer, linkDetector),
                this.instantiationService.createInstance(VisualizedVariableRenderer, linkDetector),
                new ScopesRenderer(),
                new ScopeErrorRenderer(),
            ], this.instantiationService.createInstance(VariablesDataSource), {
                accessibilityProvider: new VariablesAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e.name },
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this._register(VisualizedVariableRenderer.rendererOnVisualizationRange(this.debugService.getViewModel(), this.tree));
            this.tree.setInput(this.debugService.getViewModel().focusedStackFrame ?? null);
            debug_1.CONTEXT_VARIABLES_FOCUSED.bindTo(this.tree.contextKeyService);
            this._register(this.debugService.getViewModel().onDidFocusStackFrame(sf => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                // Refresh the tree immediately if the user explictly changed stack frames.
                // Otherwise postpone the refresh until user stops stepping.
                const timeout = sf.explicit ? 0 : undefined;
                this.updateTreeScheduler.schedule(timeout);
            }));
            this._register(this.debugService.getViewModel().onWillUpdateViews(() => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                if (stackFrame && forgetScopes) {
                    stackFrame.forgetScopes();
                }
                forgetScopes = true;
                this.tree.updateChildren();
            }));
            this._register(this.tree);
            this._register(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this._register(this.tree.onContextMenu(async (e) => await this.onContextMenu(e)));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.updateTreeScheduler.schedule();
                }
            }));
            let horizontalScrolling;
            this._register(this.debugService.getViewModel().onDidSelectExpression(e => {
                const variable = e?.expression;
                if (variable && this.tree.hasNode(variable)) {
                    horizontalScrolling = this.tree.options.horizontalScrolling;
                    if (horizontalScrolling) {
                        this.tree.updateOptions({ horizontalScrolling: false });
                    }
                    this.tree.rerender(variable);
                }
                else if (!e && horizontalScrolling !== undefined) {
                    this.tree.updateOptions({ horizontalScrolling: horizontalScrolling });
                    horizontalScrolling = undefined;
                }
            }));
            this._register(this.debugService.getViewModel().onDidEvaluateLazyExpression(async (e) => {
                if (e instanceof debugModel_1.Variable && this.tree.hasNode(e)) {
                    await this.tree.updateChildren(e, false, true);
                    await this.tree.expand(e);
                }
            }));
            this._register(this.debugService.onDidEndSession(() => {
                this.savedViewState.clear();
                this.autoExpandedScopes.clear();
            }));
        }
        layoutBody(width, height) {
            super.layoutBody(height, width);
            this.tree.layout(width, height);
        }
        focus() {
            super.focus();
            this.tree.domFocus();
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        onMouseDblClick(e) {
            if (this.canSetExpressionValue(e.element)) {
                this.debugService.getViewModel().setSelectedExpression(e.element, false);
            }
        }
        canSetExpressionValue(e) {
            const session = this.debugService.getViewModel().focusedSession;
            if (!session) {
                return false;
            }
            if (e instanceof debugModel_1.VisualizedExpression) {
                return !!e.treeItem.canEdit;
            }
            return e instanceof debugModel_1.Variable && !e.presentationHint?.attributes?.includes('readOnly') && !e.presentationHint?.lazy;
        }
        async onContextMenu(e) {
            const variable = e.element;
            if (!(variable instanceof debugModel_1.Variable) || !variable.value) {
                return;
            }
            return openContextMenuForVariableTreeElement(this.contextKeyService, this.menuService, this.contextMenuService, actions_2.MenuId.DebugVariablesContext, e);
        }
    };
    exports.VariablesView = VariablesView;
    exports.VariablesView = VariablesView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, actions_2.IMenuService)
    ], VariablesView);
    async function openContextMenuForVariableTreeElement(parentContextKeyService, menuService, contextMenuService, menuId, e) {
        const variable = e.element;
        if (!(variable instanceof debugModel_1.Variable) || !variable.value) {
            return;
        }
        const toDispose = new lifecycle_1.DisposableStore();
        try {
            const contextKeyService = await getContextForVariableMenuWithDataAccess(parentContextKeyService, variable);
            const menu = toDispose.add(menuService.createMenu(menuId, contextKeyService));
            const context = getVariablesContext(variable);
            const secondary = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg: context, shouldForwardArgs: false }, { primary: [], secondary }, 'inline');
            contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => secondary
            });
        }
        finally {
            toDispose.dispose();
        }
    }
    const getVariablesContext = (variable) => ({
        sessionId: variable.getSession()?.getId(),
        container: variable.parent instanceof debugModel_1.Expression
            ? { expression: variable.parent.name }
            : variable.parent.toDebugProtocolObject(),
        variable: variable.toDebugProtocolObject()
    });
    /**
     * Gets a context key overlay that has context for the given variable, including data access info.
     */
    async function getContextForVariableMenuWithDataAccess(parentContext, variable) {
        const session = variable.getSession();
        if (!session || !session.capabilities.supportsDataBreakpoints) {
            return getContextForVariableMenuBase(parentContext, variable);
        }
        const contextKeys = [];
        dataBreakpointInfoResponse = await session.dataBreakpointInfo(variable.name, variable.parent.reference);
        const dataBreakpointId = dataBreakpointInfoResponse?.dataId;
        const dataBreakpointAccessTypes = dataBreakpointInfoResponse?.accessTypes;
        if (!dataBreakpointAccessTypes) {
            contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_CHANGES_SUPPORTED.key, !!dataBreakpointId]);
        }
        else {
            for (const accessType of dataBreakpointAccessTypes) {
                switch (accessType) {
                    case 'read':
                        contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_IS_READ_SUPPORTED.key, !!dataBreakpointId]);
                        break;
                    case 'write':
                        contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_CHANGES_SUPPORTED.key, !!dataBreakpointId]);
                        break;
                    case 'readWrite':
                        contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_IS_ACCESSED_SUPPORTED.key, !!dataBreakpointId]);
                        break;
                }
            }
        }
        return getContextForVariableMenuBase(parentContext, variable, contextKeys);
    }
    /**
     * Gets a context key overlay that has context for the given variable.
     */
    function getContextForVariableMenuBase(parentContext, variable, additionalContext = []) {
        variableInternalContext = variable;
        return (0, debugContext_1.getContextForVariable)(parentContext, variable, additionalContext);
    }
    function isStackFrame(obj) {
        return obj instanceof debugModel_1.StackFrame;
    }
    class VariablesDataSource extends baseDebugView_1.AbstractExpressionDataSource {
        hasChildren(element) {
            if (!element) {
                return false;
            }
            if (isStackFrame(element)) {
                return true;
            }
            return element.hasChildren;
        }
        doGetChildren(element) {
            if (isStackFrame(element)) {
                return element.getScopes();
            }
            return element.getChildren();
        }
    }
    class VariablesDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.ErrorScope) {
                return ScopeErrorRenderer.ID;
            }
            if (element instanceof debugModel_1.Scope) {
                return ScopesRenderer.ID;
            }
            if (element instanceof debugModel_1.VisualizedExpression) {
                return VisualizedVariableRenderer.ID;
            }
            return VariablesRenderer.ID;
        }
    }
    class ScopesRenderer {
        static { this.ID = 'scope'; }
        get templateId() {
            return ScopesRenderer.ID;
        }
        renderTemplate(container) {
            const name = dom.append(container, $('.scope'));
            const label = new highlightedLabel_1.HighlightedLabel(name);
            return { name, label };
        }
        renderElement(element, index, templateData) {
            templateData.label.set(element.element.name, (0, filters_1.createMatches)(element.filterData));
        }
        disposeTemplate(templateData) {
            templateData.label.dispose();
        }
    }
    class ScopeErrorRenderer {
        static { this.ID = 'scopeError'; }
        get templateId() {
            return ScopeErrorRenderer.ID;
        }
        renderTemplate(container) {
            const wrapper = dom.append(container, $('.scope'));
            const error = dom.append(wrapper, $('.error'));
            return { error };
        }
        renderElement(element, index, templateData) {
            templateData.error.innerText = element.element.name;
        }
        disposeTemplate() {
            // noop
        }
    }
    let VisualizedVariableRenderer = class VisualizedVariableRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        static { VisualizedVariableRenderer_1 = this; }
        static { this.ID = 'viz'; }
        /**
         * Registers a helper that rerenders the tree when visualization is requested
         * or cancelled./
         */
        static rendererOnVisualizationRange(model, tree) {
            return model.onDidChangeVisualization(({ original }) => {
                if (!tree.hasNode(original)) {
                    return;
                }
                const parent = tree.getParentElement(original);
                tree.updateChildren(parent, false, false);
            });
        }
        constructor(linkDetector, debugService, contextViewService, menuService, contextKeyService) {
            super(debugService, contextViewService);
            this.linkDetector = linkDetector;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
        }
        get templateId() {
            return VisualizedVariableRenderer_1.ID;
        }
        renderElement(node, index, data) {
            super.renderExpressionElement(node.element, node, data);
        }
        renderExpression(expression, data, highlights) {
            const viz = expression;
            let text = viz.name;
            if (viz.value && typeof viz.name === 'string') {
                text += ':';
            }
            data.label.set(text, highlights, viz.name);
            (0, baseDebugView_1.renderExpressionValue)(viz, data.value, {
                showChanged: false,
                maxValueLength: 1024,
                showHover: true,
                colorize: true,
                linkDetector: this.linkDetector
            });
        }
        getInputBoxOptions(expression) {
            const viz = expression;
            return {
                initialValue: expression.value,
                ariaLabel: (0, nls_1.localize)('variableValueAriaLabel', "Type new variable value"),
                validationOptions: {
                    validation: () => viz.errorMessage ? ({ content: viz.errorMessage }) : null
                },
                onFinish: (value, success) => {
                    viz.errorMessage = undefined;
                    if (success) {
                        viz.edit(value).then(() => {
                            // Do not refresh scopes due to a node limitation #15520
                            forgetScopes = false;
                            this.debugService.getViewModel().updateViews();
                        });
                    }
                }
            };
        }
        renderActionBar(actionBar, expression, _data) {
            const viz = expression;
            const contextKeyService = viz.original ? getContextForVariableMenuBase(this.contextKeyService, viz.original) : this.contextKeyService;
            const menu = this.menuService.createMenu(actions_2.MenuId.DebugVariablesContext, contextKeyService);
            const primary = [];
            const context = viz.original ? getVariablesContext(viz.original) : undefined;
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg: context, shouldForwardArgs: false }, { primary, secondary: [] }, 'inline');
            if (viz.original) {
                const action = new actions_1.Action('debugViz', (0, nls_1.localize)('removeVisualizer', 'Remove Visualizer'), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.eye), true, () => this.debugService.getViewModel().setVisualizedExpression(viz.original, undefined));
                action.checked = true;
                primary.push(action);
                actionBar.domNode.style.display = 'initial';
            }
            actionBar.clear();
            actionBar.context = context;
            actionBar.push(primary, { icon: true, label: false });
        }
    };
    exports.VisualizedVariableRenderer = VisualizedVariableRenderer;
    exports.VisualizedVariableRenderer = VisualizedVariableRenderer = VisualizedVariableRenderer_1 = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, contextView_1.IContextViewService),
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService)
    ], VisualizedVariableRenderer);
    let VariablesRenderer = class VariablesRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        static { VariablesRenderer_1 = this; }
        static { this.ID = 'variable'; }
        constructor(linkDetector, menuService, contextKeyService, visualization, contextMenuService, debugService, contextViewService) {
            super(debugService, contextViewService);
            this.linkDetector = linkDetector;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.visualization = visualization;
            this.contextMenuService = contextMenuService;
        }
        get templateId() {
            return VariablesRenderer_1.ID;
        }
        renderExpression(expression, data, highlights) {
            (0, baseDebugView_1.renderVariable)(expression, data, true, highlights, this.linkDetector);
        }
        renderElement(node, index, data) {
            super.renderExpressionElement(node.element, node, data);
        }
        getInputBoxOptions(expression) {
            const variable = expression;
            return {
                initialValue: expression.value,
                ariaLabel: (0, nls_1.localize)('variableValueAriaLabel', "Type new variable value"),
                validationOptions: {
                    validation: () => variable.errorMessage ? ({ content: variable.errorMessage }) : null
                },
                onFinish: (value, success) => {
                    variable.errorMessage = undefined;
                    const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                    if (success && variable.value !== value && focusedStackFrame) {
                        variable.setVariable(value, focusedStackFrame)
                            // Need to force watch expressions and variables to update since a variable change can have an effect on both
                            .then(() => {
                            // Do not refresh scopes due to a node limitation #15520
                            forgetScopes = false;
                            this.debugService.getViewModel().updateViews();
                        });
                    }
                }
            };
        }
        renderActionBar(actionBar, expression, data) {
            const variable = expression;
            const contextKeyService = getContextForVariableMenuBase(this.contextKeyService, variable);
            const menu = this.menuService.createMenu(actions_2.MenuId.DebugVariablesContext, contextKeyService);
            const primary = [];
            const context = getVariablesContext(variable);
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg: context, shouldForwardArgs: false }, { primary, secondary: [] }, 'inline');
            actionBar.clear();
            actionBar.context = context;
            actionBar.push(primary, { icon: true, label: false });
            const cts = new cancellation_1.CancellationTokenSource();
            data.elementDisposable.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            this.visualization.getApplicableFor(expression, cts.token).then(result => {
                data.elementDisposable.add(result);
                const originalExpression = (expression instanceof debugModel_1.VisualizedExpression && expression.original) || expression;
                const actions = result.object.map(v => new actions_1.Action('debugViz', v.name, v.iconClass || 'debug-viz-icon', undefined, this.useVisualizer(v, originalExpression, cts.token)));
                if (actions.length === 0) {
                    // no-op
                }
                else if (actions.length === 1) {
                    actionBar.push(actions[0], { icon: true, label: false });
                }
                else {
                    actionBar.push(new actions_1.Action('debugViz', (0, nls_1.localize)('useVisualizer', 'Visualize Variable...'), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.eye), undefined, () => this.pickVisualizer(actions, originalExpression, data)), { icon: true, label: false });
                }
            });
        }
        pickVisualizer(actions, expression, data) {
            this.contextMenuService.showContextMenu({
                getAnchor: () => data.actionBar.getContainer(),
                getActions: () => actions,
            });
        }
        useVisualizer(viz, expression, token) {
            return async () => {
                const resolved = await viz.resolve(token);
                if (token.isCancellationRequested) {
                    return;
                }
                if (resolved.type === 0 /* DebugVisualizationType.Command */) {
                    viz.execute();
                }
                else {
                    const replacement = await this.visualization.getVisualizedNodeFor(resolved.id, expression);
                    if (replacement) {
                        this.debugService.getViewModel().setVisualizedExpression(expression, replacement);
                    }
                }
            };
        }
    };
    exports.VariablesRenderer = VariablesRenderer;
    exports.VariablesRenderer = VariablesRenderer = VariablesRenderer_1 = __decorate([
        __param(1, actions_2.IMenuService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, debugVisualizers_1.IDebugVisualizerService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, debug_1.IDebugService),
        __param(6, contextView_1.IContextViewService)
    ], VariablesRenderer);
    class VariablesAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('variablesAriaTreeLabel', "Debug Variables");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Scope) {
                return (0, nls_1.localize)('variableScopeAriaLabel', "Scope {0}", element.name);
            }
            if (element instanceof debugModel_1.Variable) {
                return (0, nls_1.localize)({ key: 'variableAriaLabel', comment: ['Placeholders are variable name and variable value respectivly. They should not be translated.'] }, "{0}, value {1}", element.name, element.value);
            }
            return null;
        }
    }
    exports.SET_VARIABLE_ID = 'debug.setVariable';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SET_VARIABLE_ID,
        handler: (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.getViewModel().setSelectedExpression(variableInternalContext, false);
        }
    });
    exports.COPY_VALUE_ID = 'workbench.debug.viewlet.action.copyValue';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COPY_VALUE_ID,
        handler: async (accessor, arg, ctx) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            let elementContext = '';
            let elements;
            if (arg instanceof debugModel_1.Variable || arg instanceof debugModel_1.Expression) {
                elementContext = 'watch';
                elements = ctx ? ctx : [];
            }
            else {
                elementContext = 'variables';
                elements = variableInternalContext ? [variableInternalContext] : [];
            }
            const stackFrame = debugService.getViewModel().focusedStackFrame;
            const session = debugService.getViewModel().focusedSession;
            if (!stackFrame || !session || elements.length === 0) {
                return;
            }
            const evalContext = session.capabilities.supportsClipboardContext ? 'clipboard' : elementContext;
            const toEvaluate = elements.map(element => element instanceof debugModel_1.Variable ? (element.evaluateName || element.value) : element.name);
            try {
                const evaluations = await Promise.all(toEvaluate.map(expr => session.evaluate(expr, stackFrame.frameId, evalContext)));
                const result = (0, arrays_1.coalesce)(evaluations).map(evaluation => evaluation.body.result);
                if (result.length) {
                    clipboardService.writeText(result.join('\n'));
                }
            }
            catch (e) {
                const result = elements.map(element => element.value);
                clipboardService.writeText(result.join('\n'));
            }
        }
    });
    exports.VIEW_MEMORY_ID = 'workbench.debug.viewlet.action.viewMemory';
    const HEX_EDITOR_EXTENSION_ID = 'ms-vscode.hexeditor';
    const HEX_EDITOR_EDITOR_ID = 'hexEditor.hexedit';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.VIEW_MEMORY_ID,
        handler: async (accessor, arg, ctx) => {
            const debugService = accessor.get(debug_1.IDebugService);
            let sessionId;
            let memoryReference;
            if ('sessionId' in arg) { // IVariablesContext
                if (!arg.sessionId || !arg.variable.memoryReference) {
                    return;
                }
                sessionId = arg.sessionId;
                memoryReference = arg.variable.memoryReference;
            }
            else { // IExpression
                if (!arg.memoryReference) {
                    return;
                }
                const focused = debugService.getViewModel().focusedSession;
                if (!focused) {
                    return;
                }
                sessionId = focused.getId();
                memoryReference = arg.memoryReference;
            }
            const extensionsWorkbenchService = accessor.get(extensions_1.IExtensionsWorkbenchService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const extensionService = accessor.get(extensions_2.IExtensionService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const ext = await extensionService.getExtension(HEX_EDITOR_EXTENSION_ID);
            if (ext || await tryInstallHexEditor(extensionsWorkbenchService, notificationService)) {
                /* __GDPR__
                    "debug/didViewMemory" : {
                        "owner": "connor4312",
                        "debugType" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                telemetryService.publicLog('debug/didViewMemory', {
                    debugType: debugService.getModel().getSession(sessionId)?.configuration.type,
                });
                await editorService.openEditor({
                    resource: (0, debugModel_1.getUriForDebugMemory)(sessionId, memoryReference),
                    options: {
                        revealIfOpened: true,
                        override: HEX_EDITOR_EDITOR_ID,
                    },
                }, editorService_1.SIDE_GROUP);
            }
        }
    });
    async function tryInstallHexEditor(extensionsWorkbenchService, notificationService) {
        try {
            await extensionsWorkbenchService.install(HEX_EDITOR_EXTENSION_ID, {
                justification: (0, nls_1.localize)("viewMemory.prompt", "Inspecting binary data requires this extension."),
                enable: true
            }, 15 /* ProgressLocation.Notification */);
            return true;
        }
        catch (error) {
            notificationService.error(error);
            return false;
        }
    }
    exports.BREAK_WHEN_VALUE_CHANGES_ID = 'debug.breakWhenValueChanges';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.BREAK_WHEN_VALUE_CHANGES_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (dataBreakpointInfoResponse) {
                await debugService.addDataBreakpoint({ description: dataBreakpointInfoResponse.description, src: { type: 0 /* DataBreakpointSetType.Variable */, dataId: dataBreakpointInfoResponse.dataId }, canPersist: !!dataBreakpointInfoResponse.canPersist, accessTypes: dataBreakpointInfoResponse.accessTypes, accessType: 'write' });
            }
        }
    });
    exports.BREAK_WHEN_VALUE_IS_ACCESSED_ID = 'debug.breakWhenValueIsAccessed';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.BREAK_WHEN_VALUE_IS_ACCESSED_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (dataBreakpointInfoResponse) {
                await debugService.addDataBreakpoint({ description: dataBreakpointInfoResponse.description, src: { type: 0 /* DataBreakpointSetType.Variable */, dataId: dataBreakpointInfoResponse.dataId }, canPersist: !!dataBreakpointInfoResponse.canPersist, accessTypes: dataBreakpointInfoResponse.accessTypes, accessType: 'readWrite' });
            }
        }
    });
    exports.BREAK_WHEN_VALUE_IS_READ_ID = 'debug.breakWhenValueIsRead';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.BREAK_WHEN_VALUE_IS_READ_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (dataBreakpointInfoResponse) {
                await debugService.addDataBreakpoint({ description: dataBreakpointInfoResponse.description, src: { type: 0 /* DataBreakpointSetType.Variable */, dataId: dataBreakpointInfoResponse.dataId }, canPersist: !!dataBreakpointInfoResponse.canPersist, accessTypes: dataBreakpointInfoResponse.accessTypes, accessType: 'read' });
            }
        }
    });
    exports.COPY_EVALUATE_PATH_ID = 'debug.copyEvaluatePath';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COPY_EVALUATE_PATH_ID,
        handler: async (accessor, context) => {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            await clipboardService.writeText(context.variable.evaluateName);
        }
    });
    exports.ADD_TO_WATCH_ID = 'debug.addToWatchExpressions';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.ADD_TO_WATCH_ID,
        handler: async (accessor, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.addWatchExpression(context.variable.evaluateName);
        }
    });
    (0, actions_2.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'variables.collapse',
                viewId: debug_1.VARIABLES_VIEW_ID,
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.VARIABLES_VIEW_ID)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFyaWFibGVzVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci92YXJpYWJsZXNWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4T2hHLHNGQXNCQztJQXRORCxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hCLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztJQUV4QixJQUFJLHVCQUE2QyxDQUFDO0lBQ2xELElBQUksMEJBQW1FLENBQUM7SUFRakUsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLG1CQUFRO1FBUTFDLFlBQ0MsT0FBNEIsRUFDUCxrQkFBdUMsRUFDN0MsWUFBNEMsRUFDdkMsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUMzQyxvQkFBMkMsRUFDMUMscUJBQTZDLEVBQ2pELGlCQUFxQyxFQUN6QyxhQUE2QixFQUM5QixZQUEyQixFQUN2QixnQkFBbUMsRUFDeEMsV0FBMEM7WUFFeEQsS0FBSyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFYM0osaUJBQVksR0FBWixZQUFZLENBQWU7WUFTNUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFqQmpELGlCQUFZLEdBQUcsS0FBSyxDQUFDO1lBRXJCLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7WUFDNUQsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQWtCOUMsZ0RBQWdEO1lBQ2hELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLHdC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