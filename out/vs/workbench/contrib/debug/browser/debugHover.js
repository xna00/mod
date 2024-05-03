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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/platform", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatures", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/contrib/debug/browser/variablesView", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, dom, scrollableElement_1, arrays_1, cancellation_1, lifecycle, numbers_1, platform_1, range_1, textModel_1, languageFeatures_1, nls, actions_1, contextkey_1, contextView_1, instantiation_1, listService_1, log_1, colorRegistry_1, baseDebugView_1, linkDetector_1, variablesView_1, debug_1, debugModel_1, debugUtils_1) {
    "use strict";
    var DebugHoverWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugHoverWidget = exports.ShowDebugHoverResult = void 0;
    exports.findExpressionInStackFrame = findExpressionInStackFrame;
    const $ = dom.$;
    var ShowDebugHoverResult;
    (function (ShowDebugHoverResult) {
        ShowDebugHoverResult[ShowDebugHoverResult["NOT_CHANGED"] = 0] = "NOT_CHANGED";
        ShowDebugHoverResult[ShowDebugHoverResult["NOT_AVAILABLE"] = 1] = "NOT_AVAILABLE";
        ShowDebugHoverResult[ShowDebugHoverResult["CANCELLED"] = 2] = "CANCELLED";
    })(ShowDebugHoverResult || (exports.ShowDebugHoverResult = ShowDebugHoverResult = {}));
    async function doFindExpression(container, namesToFind) {
        if (!container) {
            return null;
        }
        const children = await container.getChildren();
        // look for our variable in the list. First find the parents of the hovered variable if there are any.
        const filtered = children.filter(v => namesToFind[0] === v.name);
        if (filtered.length !== 1) {
            return null;
        }
        if (namesToFind.length === 1) {
            return filtered[0];
        }
        else {
            return doFindExpression(filtered[0], namesToFind.slice(1));
        }
    }
    async function findExpressionInStackFrame(stackFrame, namesToFind) {
        const scopes = await stackFrame.getScopes();
        const nonExpensive = scopes.filter(s => !s.expensive);
        const expressions = (0, arrays_1.coalesce)(await Promise.all(nonExpensive.map(scope => doFindExpression(scope, namesToFind))));
        // only show if all expressions found have the same value
        return expressions.length > 0 && expressions.every(e => e.value === expressions[0].value) ? expressions[0] : undefined;
    }
    let DebugHoverWidget = class DebugHoverWidget {
        static { DebugHoverWidget_1 = this; }
        static { this.ID = 'debug.hoverWidget'; }
        get isShowingComplexValue() {
            return this.complexValueContainer?.hidden === false;
        }
        constructor(editor, debugService, instantiationService, menuService, contextKeyService, contextMenuService) {
            this.editor = editor;
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            // editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this.highlightDecorations = this.editor.createDecorationsCollection();
            this.isUpdatingTree = false;
            this.toDispose = [];
            this._isVisible = false;
            this.showAtPosition = null;
            this.positionPreference = [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */];
            this.debugHoverComputer = this.instantiationService.createInstance(DebugHoverComputer, this.editor);
        }
        create() {
            this.domNode = $('.debug-hover-widget');
            this.complexValueContainer = dom.append(this.domNode, $('.complex-value'));
            this.complexValueTitle = dom.append(this.complexValueContainer, $('.title'));
            this.treeContainer = dom.append(this.complexValueContainer, $('.debug-hover-tree'));
            this.treeContainer.setAttribute('role', 'tree');
            const tip = dom.append(this.complexValueContainer, $('.tip'));
            tip.textContent = nls.localize({ key: 'quickTip', comment: ['"switch to editor language hover" means to show the programming language hover widget instead of the debug hover'] }, 'Hold {0} key to switch to editor language hover', platform_1.isMacintosh ? 'Option' : 'Alt');
            const dataSource = this.instantiationService.createInstance(DebugHoverDataSource);
            const linkeDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'DebugHover', this.treeContainer, new DebugHoverDelegate(), [
                this.instantiationService.createInstance(variablesView_1.VariablesRenderer, linkeDetector),
                this.instantiationService.createInstance(variablesView_1.VisualizedVariableRenderer, linkeDetector),
            ], dataSource, {
                accessibilityProvider: new DebugHoverAccessibilityProvider(),
                mouseSupport: false,
                horizontalScrolling: true,
                useShadows: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e.name },
                overrideStyles: {
                    listBackground: colorRegistry_1.editorHoverBackground
                }
            });
            this.toDispose.push(variablesView_1.VisualizedVariableRenderer.rendererOnVisualizationRange(this.debugService.getViewModel(), this.tree));
            this.valueContainer = $('.value');
            this.valueContainer.tabIndex = 0;
            this.valueContainer.setAttribute('role', 'tooltip');
            this.scrollbar = new scrollableElement_1.DomScrollableElement(this.valueContainer, { horizontal: 2 /* ScrollbarVisibility.Hidden */ });
            this.domNode.appendChild(this.scrollbar.getDomNode());
            this.toDispose.push(this.scrollbar);
            this.editor.applyFontInfo(this.domNode);
            this.domNode.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorHoverBackground);
            this.domNode.style.border = `1px solid ${(0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorHoverBorder)}`;
            this.domNode.style.color = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorHoverForeground);
            this.toDispose.push(this.tree.onContextMenu(async (e) => await this.onContextMenu(e)));
            this.toDispose.push(this.tree.onDidChangeContentHeight(() => {
                if (!this.isUpdatingTree) {
                    // Don't do a layout in the middle of the async setInput
                    this.layoutTreeAndContainer();
                }
            }));
            this.toDispose.push(this.tree.onDidChangeContentWidth(() => {
                if (!this.isUpdatingTree) {
                    // Don't do a layout in the middle of the async setInput
                    this.layoutTreeAndContainer();
                }
            }));
            this.registerListeners();
            this.editor.addContentWidget(this);
        }
        async onContextMenu(e) {
            const variable = e.element;
            if (!(variable instanceof debugModel_1.Variable) || !variable.value) {
                return;
            }
            return (0, variablesView_1.openContextMenuForVariableTreeElement)(this.contextKeyService, this.menuService, this.contextMenuService, actions_1.MenuId.DebugHoverContext, e);
        }
        registerListeners() {
            this.toDispose.push(dom.addStandardDisposableListener(this.domNode, 'keydown', (e) => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                }
            }));
            this.toDispose.push(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this.editor.applyFontInfo(this.domNode);
                }
            }));
            this.toDispose.push(this.debugService.getViewModel().onDidEvaluateLazyExpression(async (e) => {
                if (e instanceof debugModel_1.Variable && this.tree.hasNode(e)) {
                    await this.tree.updateChildren(e, false, true);
                    await this.tree.expand(e);
                }
            }));
        }
        isHovered() {
            return !!this.domNode?.matches(':hover');
        }
        isVisible() {
            return this._isVisible;
        }
        willBeVisible() {
            return !!this.showCancellationSource;
        }
        getId() {
            return DebugHoverWidget_1.ID;
        }
        getDomNode() {
            return this.domNode;
        }
        async showAt(position, focus) {
            this.showCancellationSource?.cancel();
            const cancellationSource = this.showCancellationSource = new cancellation_1.CancellationTokenSource();
            const session = this.debugService.getViewModel().focusedSession;
            if (!session || !this.editor.hasModel()) {
                this.hide();
                return 1 /* ShowDebugHoverResult.NOT_AVAILABLE */;
            }
            const result = await this.debugHoverComputer.compute(position, cancellationSource.token);
            if (cancellationSource.token.isCancellationRequested) {
                this.hide();
                return 2 /* ShowDebugHoverResult.CANCELLED */;
            }
            if (!result.range) {
                this.hide();
                return 1 /* ShowDebugHoverResult.NOT_AVAILABLE */;
            }
            if (this.isVisible() && !result.rangeChanged) {
                return 0 /* ShowDebugHoverResult.NOT_CHANGED */;
            }
            const expression = await this.debugHoverComputer.evaluate(session);
            if (cancellationSource.token.isCancellationRequested) {
                this.hide();
                return 2 /* ShowDebugHoverResult.CANCELLED */;
            }
            if (!expression || (expression instanceof debugModel_1.Expression && !expression.available)) {
                this.hide();
                return 1 /* ShowDebugHoverResult.NOT_AVAILABLE */;
            }
            this.highlightDecorations.set([{
                    range: result.range,
                    options: DebugHoverWidget_1._HOVER_HIGHLIGHT_DECORATION_OPTIONS
                }]);
            return this.doShow(result.range.getStartPosition(), expression, focus);
        }
        static { this._HOVER_HIGHLIGHT_DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
            description: 'bdebug-hover-highlight',
            className: 'hoverHighlight'
        }); }
        async doShow(position, expression, focus, forceValueHover = false) {
            if (!this.domNode) {
                this.create();
            }
            this.showAtPosition = position;
            this._isVisible = true;
            if (!expression.hasChildren || forceValueHover) {
                this.complexValueContainer.hidden = true;
                this.valueContainer.hidden = false;
                (0, baseDebugView_1.renderExpressionValue)(expression, this.valueContainer, {
                    showChanged: false,
                    colorize: true
                });
                this.valueContainer.title = '';
                this.editor.layoutContentWidget(this);
                this.scrollbar.scanDomNode();
                if (focus) {
                    this.editor.render();
                    this.valueContainer.focus();
                }
                return undefined;
            }
            this.valueContainer.hidden = true;
            this.expressionToRender = expression;
            this.complexValueTitle.textContent = expression.value;
            this.complexValueTitle.title = expression.value;
            this.editor.layoutContentWidget(this);
            this.tree.scrollTop = 0;
            this.tree.scrollLeft = 0;
            this.complexValueContainer.hidden = false;
            if (focus) {
                this.editor.render();
                this.tree.domFocus();
            }
        }
        layoutTreeAndContainer() {
            this.layoutTree();
            this.editor.layoutContentWidget(this);
        }
        layoutTree() {
            const scrollBarHeight = 10;
            let maxHeightToAvoidCursorOverlay = Infinity;
            if (this.showAtPosition) {
                const editorTop = this.editor.getDomNode()?.offsetTop || 0;
                const containerTop = this.treeContainer.offsetTop + editorTop;
                const hoveredCharTop = this.editor.getTopForLineNumber(this.showAtPosition.lineNumber, true) - this.editor.getScrollTop();
                if (containerTop < hoveredCharTop) {
                    maxHeightToAvoidCursorOverlay = hoveredCharTop + editorTop - 22; // 22 is monaco top padding https://github.com/microsoft/vscode/blob/a1df2d7319382d42f66ad7f411af01e4cc49c80a/src/vs/editor/browser/viewParts/contentWidgets/contentWidgets.ts#L364
                }
            }
            const treeHeight = Math.min(Math.max(266, this.editor.getLayoutInfo().height * 0.55), this.tree.contentHeight + scrollBarHeight, maxHeightToAvoidCursorOverlay);
            const realTreeWidth = this.tree.contentWidth;
            const treeWidth = (0, numbers_1.clamp)(realTreeWidth, 400, 550);
            this.tree.layout(treeHeight, treeWidth);
            this.treeContainer.style.height = `${treeHeight}px`;
            this.scrollbar.scanDomNode();
        }
        beforeRender() {
            // beforeRender will be called each time the hover size changes, and the content widget is layed out again.
            if (this.expressionToRender) {
                const expression = this.expressionToRender;
                this.expressionToRender = undefined;
                // Do this in beforeRender once the content widget is no longer display=none so that its elements' sizes will be measured correctly.
                this.isUpdatingTree = true;
                this.tree.setInput(expression).finally(() => {
                    this.isUpdatingTree = false;
                });
            }
            return null;
        }
        afterRender(positionPreference) {
            if (positionPreference) {
                // Remember where the editor placed you to keep position stable #109226
                this.positionPreference = [positionPreference];
            }
        }
        hide() {
            if (this.showCancellationSource) {
                this.showCancellationSource.cancel();
                this.showCancellationSource = undefined;
            }
            if (!this._isVisible) {
                return;
            }
            if (dom.isAncestorOfActiveElement(this.domNode)) {
                this.editor.focus();
            }
            this._isVisible = false;
            this.highlightDecorations.clear();
            this.editor.layoutContentWidget(this);
            this.positionPreference = [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */];
        }
        getPosition() {
            return this._isVisible ? {
                position: this.showAtPosition,
                preference: this.positionPreference
            } : null;
        }
        dispose() {
            this.toDispose = lifecycle.dispose(this.toDispose);
        }
    };
    exports.DebugHoverWidget = DebugHoverWidget;
    exports.DebugHoverWidget = DebugHoverWidget = DebugHoverWidget_1 = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, actions_1.IMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService)
    ], DebugHoverWidget);
    class DebugHoverAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize('treeAriaLabel', "Debug Hover");
        }
        getAriaLabel(element) {
            return nls.localize({ key: 'variableAriaLabel', comment: ['Do not translate placeholders. Placeholders are name and value of a variable.'] }, "{0}, value {1}, variables, debug", element.name, element.value);
        }
    }
    class DebugHoverDataSource extends baseDebugView_1.AbstractExpressionDataSource {
        hasChildren(element) {
            return element.hasChildren;
        }
        doGetChildren(element) {
            return element.getChildren();
        }
    }
    class DebugHoverDelegate {
        getHeight(element) {
            return 18;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.VisualizedExpression) {
                return variablesView_1.VisualizedVariableRenderer.ID;
            }
            return variablesView_1.VariablesRenderer.ID;
        }
    }
    let DebugHoverComputer = class DebugHoverComputer {
        constructor(editor, debugService, languageFeaturesService, logService) {
            this.editor = editor;
            this.debugService = debugService;
            this.languageFeaturesService = languageFeaturesService;
            this.logService = logService;
        }
        async compute(position, token) {
            const session = this.debugService.getViewModel().focusedSession;
            if (!session || !this.editor.hasModel()) {
                return { rangeChanged: false };
            }
            const model = this.editor.getModel();
            const result = await (0, debugUtils_1.getEvaluatableExpressionAtPosition)(this.languageFeaturesService, model, position, token);
            if (!result) {
                return { rangeChanged: false };
            }
            const { range, matchingExpression } = result;
            const rangeChanged = this._currentRange ?
                !this._currentRange.equalsRange(range) :
                true;
            this._currentExpression = matchingExpression;
            this._currentRange = range_1.Range.lift(range);
            return { rangeChanged, range: this._currentRange };
        }
        async evaluate(session) {
            if (!this._currentExpression) {
                this.logService.error('No expression to evaluate');
                return;
            }
            if (session.capabilities.supportsEvaluateForHovers) {
                const expression = new debugModel_1.Expression(this._currentExpression);
                await expression.evaluate(session, this.debugService.getViewModel().focusedStackFrame, 'hover');
                return expression;
            }
            else {
                const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                if (focusedStackFrame) {
                    return await findExpressionInStackFrame(focusedStackFrame, (0, arrays_1.coalesce)(this._currentExpression.split('.').map(word => word.trim())));
                }
            }
            return undefined;
        }
    };
    DebugHoverComputer = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, log_1.ILogService)
    ], DebugHoverComputer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdIb3Zlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z0hvdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpRWhHLGdFQU9DO0lBbENELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsSUFBa0Isb0JBSWpCO0lBSkQsV0FBa0Isb0JBQW9CO1FBQ3JDLDZFQUFXLENBQUE7UUFDWCxpRkFBYSxDQUFBO1FBQ2IseUVBQVMsQ0FBQTtJQUNWLENBQUMsRUFKaUIsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFJckM7SUFFRCxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsU0FBK0IsRUFBRSxXQUFxQjtRQUNyRixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDaEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDL0Msc0dBQXNHO1FBQ3RHLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pFLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUIsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEIsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFD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