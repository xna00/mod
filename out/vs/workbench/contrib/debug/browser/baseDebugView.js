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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/codicons", "vs/base/common/filters", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugVisualizers", "vs/workbench/contrib/debug/common/replModel"], function (require, exports, dom, actionbar_1, highlightedLabel_1, hoverDelegateFactory_1, updatableHoverWidget_1, inputBox_1, codicons_1, filters_1, functional_1, lifecycle_1, themables_1, nls_1, contextView_1, defaultStyles_1, debug_1, debugModel_1, debugVisualizers_1, replModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExpressionsRenderer = exports.AbstractExpressionDataSource = void 0;
    exports.renderViewTree = renderViewTree;
    exports.renderExpressionValue = renderExpressionValue;
    exports.renderVariable = renderVariable;
    const MAX_VALUE_RENDER_LENGTH_IN_VIEWLET = 1024;
    const booleanRegex = /^(true|false)$/i;
    const stringRegex = /^(['"]).*\1$/;
    const $ = dom.$;
    function renderViewTree(container) {
        const treeContainer = $('.');
        treeContainer.classList.add('debug-view-content');
        container.appendChild(treeContainer);
        return treeContainer;
    }
    function renderExpressionValue(expressionOrValue, container, options) {
        let value = typeof expressionOrValue === 'string' ? expressionOrValue : expressionOrValue.value;
        // remove stale classes
        container.className = 'value';
        // when resolving expressions we represent errors from the server as a variable with name === null.
        if (value === null || ((expressionOrValue instanceof debugModel_1.Expression || expressionOrValue instanceof debugModel_1.Variable || expressionOrValue instanceof replModel_1.ReplEvaluationResult) && !expressionOrValue.available)) {
            container.classList.add('unavailable');
            if (value !== debugModel_1.Expression.DEFAULT_VALUE) {
                container.classList.add('error');
            }
        }
        else {
            if (typeof expressionOrValue !== 'string' && options.showChanged && expressionOrValue.valueChanged && value !== debugModel_1.Expression.DEFAULT_VALUE) {
                // value changed color has priority over other colors.
                container.className = 'value changed';
                expressionOrValue.valueChanged = false;
            }
            if (options.colorize && typeof expressionOrValue !== 'string') {
                if (expressionOrValue.type === 'number' || expressionOrValue.type === 'boolean' || expressionOrValue.type === 'string') {
                    container.classList.add(expressionOrValue.type);
                }
                else if (!isNaN(+value)) {
                    container.classList.add('number');
                }
                else if (booleanRegex.test(value)) {
                    container.classList.add('boolean');
                }
                else if (stringRegex.test(value)) {
                    container.classList.add('string');
                }
            }
        }
        if (options.maxValueLength && value && value.length > options.maxValueLength) {
            value = value.substring(0, options.maxValueLength) + '...';
        }
        if (!value) {
            value = '';
        }
        if (options.linkDetector) {
            container.textContent = '';
            const session = (expressionOrValue instanceof debugModel_1.ExpressionContainer) ? expressionOrValue.getSession() : undefined;
            container.appendChild(options.linkDetector.linkify(value, false, session ? session.root : undefined, true));
        }
        else {
            container.textContent = value;
        }
        if (options.showHover) {
            container.title = value || '';
        }
    }
    function renderVariable(variable, data, showChanged, highlights, linkDetector) {
        if (variable.available) {
            let text = variable.name;
            if (variable.value && typeof variable.name === 'string') {
                text += ':';
            }
            data.label.set(text, highlights, variable.type ? variable.type : variable.name);
            data.name.classList.toggle('virtual', variable.presentationHint?.kind === 'virtual');
            data.name.classList.toggle('internal', variable.presentationHint?.visibility === 'internal');
        }
        else if (variable.value && typeof variable.name === 'string' && variable.name) {
            data.label.set(':');
        }
        data.expression.classList.toggle('lazy', !!variable.presentationHint?.lazy);
        renderExpressionValue(variable, data.value, {
            showChanged,
            maxValueLength: MAX_VALUE_RENDER_LENGTH_IN_VIEWLET,
            showHover: true,
            colorize: true,
            linkDetector
        });
    }
    let AbstractExpressionDataSource = class AbstractExpressionDataSource {
        constructor(debugService, debugVisualizer) {
            this.debugService = debugService;
            this.debugVisualizer = debugVisualizer;
        }
        async getChildren(element) {
            const vm = this.debugService.getViewModel();
            const children = await this.doGetChildren(element);
            return Promise.all(children.map(async (r) => {
                const vizOrTree = vm.getVisualizedExpression(r);
                if (typeof vizOrTree === 'string') {
                    const viz = await this.debugVisualizer.getVisualizedNodeFor(vizOrTree, r);
                    if (viz) {
                        vm.setVisualizedExpression(r, viz);
                        return viz;
                    }
                }
                else if (vizOrTree) {
                    return vizOrTree;
                }
                return r;
            }));
        }
    };
    exports.AbstractExpressionDataSource = AbstractExpressionDataSource;
    exports.AbstractExpressionDataSource = AbstractExpressionDataSource = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, debugVisualizers_1.IDebugVisualizerService)
    ], AbstractExpressionDataSource);
    let AbstractExpressionsRenderer = class AbstractExpressionsRenderer {
        constructor(debugService, contextViewService) {
            this.debugService = debugService;
            this.contextViewService = contextViewService;
        }
        renderTemplate(container) {
            const templateDisposable = new lifecycle_1.DisposableStore();
            const expression = dom.append(container, $('.expression'));
            const name = dom.append(expression, $('span.name'));
            const lazyButton = dom.append(expression, $('span.lazy-button'));
            lazyButton.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.eye));
            templateDisposable.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), lazyButton, (0, nls_1.localize)('debug.lazyButton.tooltip', "Click to expand")));
            const value = dom.append(expression, $('span.value'));
            const label = templateDisposable.add(new highlightedLabel_1.HighlightedLabel(name));
            const inputBoxContainer = dom.append(expression, $('.inputBoxContainer'));
            let actionBar;
            if (this.renderActionBar) {
                dom.append(expression, $('.span.actionbar-spacer'));
                actionBar = templateDisposable.add(new actionbar_1.ActionBar(expression));
            }
            const template = { expression, name, value, label, inputBoxContainer, actionBar, elementDisposable: new lifecycle_1.DisposableStore(), templateDisposable, lazyButton, currentElement: undefined };
            templateDisposable.add(dom.addDisposableListener(lazyButton, dom.EventType.CLICK, () => {
                if (template.currentElement) {
                    this.debugService.getViewModel().evaluateLazyExpression(template.currentElement);
                }
            }));
            return template;
        }
        renderExpressionElement(element, node, data) {
            data.elementDisposable.clear();
            data.currentElement = element;
            this.renderExpression(node.element, data, (0, filters_1.createMatches)(node.filterData));
            if (data.actionBar) {
                this.renderActionBar(data.actionBar, element, data);
            }
            const selectedExpression = this.debugService.getViewModel().getSelectedExpression();
            if (element === selectedExpression?.expression || (element instanceof debugModel_1.Variable && element.errorMessage)) {
                const options = this.getInputBoxOptions(element, !!selectedExpression?.settingWatch);
                if (options) {
                    data.elementDisposable.add(this.renderInputBox(data.name, data.value, data.inputBoxContainer, options));
                }
            }
        }
        renderInputBox(nameElement, valueElement, inputBoxContainer, options) {
            nameElement.style.display = 'none';
            valueElement.style.display = 'none';
            inputBoxContainer.style.display = 'initial';
            dom.clearNode(inputBoxContainer);
            const inputBox = new inputBox_1.InputBox(inputBoxContainer, this.contextViewService, { ...options, inputBoxStyles: defaultStyles_1.defaultInputBoxStyles });
            inputBox.value = options.initialValue;
            inputBox.focus();
            inputBox.select();
            const done = (0, functional_1.createSingleCallFunction)((success, finishEditing) => {
                nameElement.style.display = '';
                valueElement.style.display = '';
                inputBoxContainer.style.display = 'none';
                const value = inputBox.value;
                (0, lifecycle_1.dispose)(toDispose);
                if (finishEditing) {
                    this.debugService.getViewModel().setSelectedExpression(undefined, false);
                    options.onFinish(value, success);
                }
            });
            const toDispose = [
                inputBox,
                dom.addStandardDisposableListener(inputBox.inputElement, dom.EventType.KEY_DOWN, (e) => {
                    const isEscape = e.equals(9 /* KeyCode.Escape */);
                    const isEnter = e.equals(3 /* KeyCode.Enter */);
                    if (isEscape || isEnter) {
                        e.preventDefault();
                        e.stopPropagation();
                        done(isEnter, true);
                    }
                }),
                dom.addDisposableListener(inputBox.inputElement, dom.EventType.BLUR, () => {
                    done(true, true);
                }),
                dom.addDisposableListener(inputBox.inputElement, dom.EventType.CLICK, e => {
                    // Do not expand / collapse selected elements
                    e.preventDefault();
                    e.stopPropagation();
                })
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(node, index, templateData) {
            templateData.elementDisposable.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposable.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    exports.AbstractExpressionsRenderer = AbstractExpressionsRenderer;
    exports.AbstractExpressionsRenderer = AbstractExpressionsRenderer = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, contextView_1.IContextViewService)
    ], AbstractExpressionsRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZURlYnVnVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9iYXNlRGVidWdWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThDaEcsd0NBS0M7SUFFRCxzREFnREM7SUFFRCx3Q0FxQkM7SUFuR0QsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLENBQUM7SUFDaEQsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUM7SUFDdkMsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDO0lBQ25DLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFrQmhCLFNBQWdCLGNBQWMsQ0FBQyxTQUFzQjtRQUNwRCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNsRCxTQUFTLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sYUFBYSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxpQkFBNEMsRUFBRSxTQUFzQixFQUFFLE9BQTRCO1FBQ3ZJLElBQUksS0FBSyxHQUFHLE9BQU8saUJBQWlCLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBRWhHLHVCQUF1QjtRQUN2QixTQUFTLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztRQUM5QixtR0FBbUc7UUFDbkcsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxpQkFBaUIsWUFBWSx1QkFBVSxJQUFJLGlCQUFpQixZQUFZLHFCQUFRLElBQUksaUJBQWlCLFlBQVksZ0NBQW9CLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDak0sU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDdkMsSUFBSSxLQUFLLEtBQUssdUJBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7YUFBTSxDQUFDO1lBQ1AsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLGlCQUFpQixDQUFDLFlBQVksSUFBSSxLQUFLLEtBQUssdUJBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDMUksc0RBQXNEO2dCQUN0RCxTQUFTLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQztnQkFDdEMsaUJBQWlCLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUN4QyxDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8saUJBQWlCLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQy9ELElBQUksaUJBQWlCLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFJLGlCQUFpQixDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDeEgsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pELENBQUM7cUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQzNCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNyQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztxQkFBTSxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDcEMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDLGNBQWMsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDOUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDNUQsQ0FBQztRQUNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNaLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDWixDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDMUIsU0FBUyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDM0IsTUFBTSxPQUFPLEdBQUcsQ0FBQyxpQkFBaUIsWUFBWSxnQ0FBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ2hILFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdHLENBQUM7YUFBTSxDQUFDO1lBQ1AsU0FBUyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3ZCLFNBQVMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUMvQixDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGNBQWMsQ0FBQyxRQUFrQixFQUFFLElBQTJCLEVBQUUsV0FBb0IsRUFBRSxVQUF3QixFQUFFLFlBQTJCO1FBQzFKLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDekIsSUFBSSxRQUFRLENBQUMsS0FBSyxJQUFJLE9BQU8sUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDekQsSUFBSSxJQUFJLEdBQUcsQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxLQUFLLFVBQVUsQ0FBQyxDQUFDO1FBQzlGLENBQUM7YUFBTSxJQUFJLFFBQVEsQ0FBQyxLQUFLLElBQUksT0FBTyxRQUFRLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakYsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckIsQ0FBQztRQUVELElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1RSxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUMzQyxXQUFXO1lBQ1gsY0FBYyxFQUFFLGtDQUFrQztZQUNsRCxTQUFTLEVBQUUsSUFBSTtZQUNmLFFBQVEsRUFBRSxJQUFJO1lBQ2QsWUFBWTtTQUNaLENBQUMsQ0FBQztJQUNKLENBQUM7SUF1Qk0sSUFBZSw0QkFBNEIsR0FBM0MsTUFBZSw0QkFBNEI7UUFDakQsWUFDMEIsWUFBMkIsRUFDakIsZUFBd0M7WUFEbEQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDakIsb0JBQWUsR0FBZixlQUFlLENBQXlCO1FBQ3hFLENBQUM7UUFJRSxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXdCO1lBQ2hELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDNUMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25ELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsRUFBRTtnQkFDekMsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLENBQWdCLENBQUMsQ0FBQztnQkFDL0QsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDbkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDMUUsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDVCxFQUFFLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUNuQyxPQUFPLEdBQTZCLENBQUM7b0JBQ3RDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUN0QixPQUFPLFNBQW9CLENBQUM7Z0JBQzdCLENBQUM7Z0JBR0QsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUdELENBQUE7SUE3QnFCLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBRS9DLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsMENBQXVCLENBQUE7T0FISiw0QkFBNEIsQ0E2QmpEO0lBRU0sSUFBZSwyQkFBMkIsR0FBMUMsTUFBZSwyQkFBMkI7UUFFaEQsWUFDMEIsWUFBMkIsRUFDZCxrQkFBdUM7WUFEcEQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDZCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1FBQzFFLENBQUM7UUFJTCxjQUFjLENBQUMsU0FBc0I7WUFDcEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNqRCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDckUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUEsdUNBQWdCLEVBQUMsSUFBQSw4Q0FBdUIsRUFBQyxPQUFPLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEosTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFFdEQsTUFBTSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksbUNBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVqRSxNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFFMUUsSUFBSSxTQUFnQyxDQUFDO1lBQ3JDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMxQixHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO2dCQUNwRCxTQUFTLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUkscUJBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBNEIsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixFQUFFLElBQUksMkJBQWUsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFFaE4sa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO2dCQUN0RixJQUFJLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2xGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUlTLHVCQUF1QixDQUFDLE9BQW9CLEVBQUUsSUFBOEIsRUFBRSxJQUE2QjtZQUNwSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUM7WUFDOUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUEsdUJBQWEsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUMxRSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLGVBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUNELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3BGLElBQUksT0FBTyxLQUFLLGtCQUFrQixFQUFFLFVBQVUsSUFBSSxDQUFDLE9BQU8sWUFBWSxxQkFBUSxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUN6RyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxrQkFBa0IsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDckYsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDYixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN6RyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxjQUFjLENBQUMsV0FBd0IsRUFBRSxZQUF5QixFQUFFLGlCQUE4QixFQUFFLE9BQXlCO1lBQzVILFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUNuQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDcEMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFDNUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRWpDLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxjQUFjLEVBQUUscUNBQXFCLEVBQUUsQ0FBQyxDQUFDO1lBRWpJLFFBQVEsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztZQUN0QyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDakIsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWxCLE1BQU0sSUFBSSxHQUFHLElBQUEscUNBQXdCLEVBQUMsQ0FBQyxPQUFnQixFQUFFLGFBQXNCLEVBQUUsRUFBRTtnQkFDbEYsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2hDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO2dCQUN6QyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO2dCQUM3QixJQUFBLG1CQUFPLEVBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRW5CLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25CLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUMscUJBQXFCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUN6RSxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxTQUFTLEdBQUc7Z0JBQ2pCLFFBQVE7Z0JBQ1IsR0FBRyxDQUFDLDZCQUE2QixDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFpQixFQUFFLEVBQUU7b0JBQ3RHLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxNQUFNLHdCQUFnQixDQUFDO29CQUMxQyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSx1QkFBZSxDQUFDO29CQUN4QyxJQUFJLFFBQVEsSUFBSSxPQUFPLEVBQUUsQ0FBQzt3QkFDekIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUNuQixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQ3BCLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3JCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDO2dCQUNGLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtvQkFDekUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDO2dCQUNGLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUN6RSw2Q0FBNkM7b0JBQzdDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixDQUFDLENBQUM7YUFDRixDQUFDO1lBRUYsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQU9ELGNBQWMsQ0FBQyxJQUE4QixFQUFFLEtBQWEsRUFBRSxZQUFxQztZQUNsRyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEMsQ0FBQztRQUVELGVBQWUsQ0FBQyxZQUFxQztZQUNwRCxZQUFZLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDekMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNDLENBQUM7S0FDRCxDQUFBO0lBekhxQixrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUc5QyxXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLGlDQUFtQixDQUFBO09BSkEsMkJBQTJCLENBeUhoRCJ9