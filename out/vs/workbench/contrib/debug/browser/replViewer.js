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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/list/list", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/severity", "vs/nls", "vs/platform/contextview/browser/contextView", "vs/platform/label/common/label", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/debugANSIHandling", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/replModel", "vs/workbench/services/editor/common/editorService", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, dom, countBadge_1, highlightedLabel_1, list_1, filters_1, lifecycle_1, path_1, severity_1, nls_1, contextView_1, label_1, defaultStyles_1, themeService_1, themables_1, baseDebugView_1, debugANSIHandling_1, debugIcons_1, debug_1, debugModel_1, replModel_1, editorService_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var ReplGroupRenderer_1, ReplOutputElementRenderer_1, ReplVariablesRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplAccessibilityProvider = exports.ReplDataSource = exports.ReplDelegate = exports.ReplRawObjectsRenderer = exports.ReplVariablesRenderer = exports.ReplOutputElementRenderer = exports.ReplEvaluationResultsRenderer = exports.ReplGroupRenderer = exports.ReplEvaluationInputsRenderer = void 0;
    const $ = dom.$;
    class ReplEvaluationInputsRenderer {
        static { this.ID = 'replEvaluationInput'; }
        get templateId() {
            return ReplEvaluationInputsRenderer.ID;
        }
        renderTemplate(container) {
            dom.append(container, $('span.arrow' + themables_1.ThemeIcon.asCSSSelector(debugIcons_1.debugConsoleEvaluationInput)));
            const input = dom.append(container, $('.expression'));
            const label = new highlightedLabel_1.HighlightedLabel(input);
            return { label };
        }
        renderElement(element, index, templateData) {
            const evaluation = element.element;
            templateData.label.set(evaluation.value, (0, filters_1.createMatches)(element.filterData));
        }
        disposeTemplate(templateData) {
            templateData.label.dispose();
        }
    }
    exports.ReplEvaluationInputsRenderer = ReplEvaluationInputsRenderer;
    let ReplGroupRenderer = class ReplGroupRenderer {
        static { ReplGroupRenderer_1 = this; }
        static { this.ID = 'replGroup'; }
        constructor(linkDetector, themeService) {
            this.linkDetector = linkDetector;
            this.themeService = themeService;
        }
        get templateId() {
            return ReplGroupRenderer_1.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.expression'));
            return { label };
        }
        renderElement(element, _index, templateData) {
            const replGroup = element.element;
            dom.clearNode(templateData.label);
            const result = (0, debugANSIHandling_1.handleANSIOutput)(replGroup.name, this.linkDetector, this.themeService, undefined);
            templateData.label.appendChild(result);
        }
        disposeTemplate(_templateData) {
            // noop
        }
    };
    exports.ReplGroupRenderer = ReplGroupRenderer;
    exports.ReplGroupRenderer = ReplGroupRenderer = ReplGroupRenderer_1 = __decorate([
        __param(1, themeService_1.IThemeService)
    ], ReplGroupRenderer);
    class ReplEvaluationResultsRenderer {
        static { this.ID = 'replEvaluationResult'; }
        get templateId() {
            return ReplEvaluationResultsRenderer.ID;
        }
        constructor(linkDetector) {
            this.linkDetector = linkDetector;
        }
        renderTemplate(container) {
            const output = dom.append(container, $('.evaluation-result.expression'));
            const value = dom.append(output, $('span.value'));
            return { value };
        }
        renderElement(element, index, templateData) {
            const expression = element.element;
            (0, baseDebugView_1.renderExpressionValue)(expression, templateData.value, {
                showHover: false,
                colorize: true,
                linkDetector: this.linkDetector
            });
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    exports.ReplEvaluationResultsRenderer = ReplEvaluationResultsRenderer;
    let ReplOutputElementRenderer = class ReplOutputElementRenderer {
        static { ReplOutputElementRenderer_1 = this; }
        static { this.ID = 'outputReplElement'; }
        constructor(linkDetector, editorService, labelService, themeService) {
            this.linkDetector = linkDetector;
            this.editorService = editorService;
            this.labelService = labelService;
            this.themeService = themeService;
        }
        get templateId() {
            return ReplOutputElementRenderer_1.ID;
        }
        renderTemplate(container) {
            const data = Object.create(null);
            container.classList.add('output');
            const expression = dom.append(container, $('.output.expression.value-and-source'));
            data.container = container;
            data.countContainer = dom.append(expression, $('.count-badge-wrapper'));
            data.count = new countBadge_1.CountBadge(data.countContainer, {}, defaultStyles_1.defaultCountBadgeStyles);
            data.value = dom.append(expression, $('span.value'));
            data.source = dom.append(expression, $('.source'));
            data.toDispose = [];
            data.toDispose.push(dom.addDisposableListener(data.source, 'click', e => {
                e.preventDefault();
                e.stopPropagation();
                const source = data.getReplElementSource();
                if (source) {
                    source.source.openInEditor(this.editorService, {
                        startLineNumber: source.lineNumber,
                        startColumn: source.column,
                        endLineNumber: source.lineNumber,
                        endColumn: source.column
                    });
                }
            }));
            return data;
        }
        renderElement({ element }, index, templateData) {
            this.setElementCount(element, templateData);
            templateData.elementListener = element.onDidChangeCount(() => this.setElementCount(element, templateData));
            // value
            dom.clearNode(templateData.value);
            // Reset classes to clear ansi decorations since templates are reused
            templateData.value.className = 'value';
            templateData.value.appendChild((0, debugANSIHandling_1.handleANSIOutput)(element.value, this.linkDetector, this.themeService, element.session.root));
            templateData.value.classList.add((element.severity === severity_1.default.Warning) ? 'warn' : (element.severity === severity_1.default.Error) ? 'error' : (element.severity === severity_1.default.Ignore) ? 'ignore' : 'info');
            templateData.source.textContent = element.sourceData ? `${(0, path_1.basename)(element.sourceData.source.name)}:${element.sourceData.lineNumber}` : '';
            templateData.toDispose.push((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), templateData.source, element.sourceData ? `${this.labelService.getUriLabel(element.sourceData.source.uri)}:${element.sourceData.lineNumber}` : ''));
            templateData.getReplElementSource = () => element.sourceData;
        }
        setElementCount(element, templateData) {
            if (element.count >= 2) {
                templateData.count.setCount(element.count);
                templateData.countContainer.hidden = false;
            }
            else {
                templateData.countContainer.hidden = true;
            }
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.toDispose);
        }
        disposeElement(_element, _index, templateData) {
            templateData.elementListener.dispose();
        }
    };
    exports.ReplOutputElementRenderer = ReplOutputElementRenderer;
    exports.ReplOutputElementRenderer = ReplOutputElementRenderer = ReplOutputElementRenderer_1 = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, label_1.ILabelService),
        __param(3, themeService_1.IThemeService)
    ], ReplOutputElementRenderer);
    let ReplVariablesRenderer = class ReplVariablesRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        static { ReplVariablesRenderer_1 = this; }
        static { this.ID = 'replVariable'; }
        get templateId() {
            return ReplVariablesRenderer_1.ID;
        }
        constructor(linkDetector, debugService, contextViewService) {
            super(debugService, contextViewService);
            this.linkDetector = linkDetector;
        }
        renderElement(node, _index, data) {
            const element = node.element;
            super.renderExpressionElement(element instanceof replModel_1.ReplVariableElement ? element.expression : element, node, data);
        }
        renderExpression(expression, data, highlights) {
            const isReplVariable = expression instanceof replModel_1.ReplVariableElement;
            if (isReplVariable || !expression.name) {
                data.label.set('');
                (0, baseDebugView_1.renderExpressionValue)(isReplVariable ? expression.expression : expression, data.value, { showHover: false, colorize: true, linkDetector: this.linkDetector });
                data.expression.classList.remove('nested-variable');
            }
            else {
                (0, baseDebugView_1.renderVariable)(expression, data, true, highlights, this.linkDetector);
                data.expression.classList.toggle('nested-variable', isNestedVariable(expression));
            }
        }
        getInputBoxOptions(expression) {
            return undefined;
        }
    };
    exports.ReplVariablesRenderer = ReplVariablesRenderer;
    exports.ReplVariablesRenderer = ReplVariablesRenderer = ReplVariablesRenderer_1 = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, contextView_1.IContextViewService)
    ], ReplVariablesRenderer);
    class ReplRawObjectsRenderer {
        static { this.ID = 'rawObject'; }
        constructor(linkDetector) {
            this.linkDetector = linkDetector;
        }
        get templateId() {
            return ReplRawObjectsRenderer.ID;
        }
        renderTemplate(container) {
            container.classList.add('output');
            const expression = dom.append(container, $('.output.expression'));
            const name = dom.append(expression, $('span.name'));
            const label = new highlightedLabel_1.HighlightedLabel(name);
            const value = dom.append(expression, $('span.value'));
            return { container, expression, name, label, value };
        }
        renderElement(node, index, templateData) {
            // key
            const element = node.element;
            templateData.label.set(element.name ? `${element.name}:` : '', (0, filters_1.createMatches)(node.filterData));
            if (element.name) {
                templateData.name.textContent = `${element.name}:`;
            }
            else {
                templateData.name.textContent = '';
            }
            // value
            (0, baseDebugView_1.renderExpressionValue)(element.value, templateData.value, {
                showHover: false,
                linkDetector: this.linkDetector
            });
        }
        disposeTemplate(templateData) {
            templateData.label.dispose();
        }
    }
    exports.ReplRawObjectsRenderer = ReplRawObjectsRenderer;
    function isNestedVariable(element) {
        return element instanceof debugModel_1.Variable && (element.parent instanceof replModel_1.ReplEvaluationResult || element.parent instanceof debugModel_1.Variable);
    }
    class ReplDelegate extends list_1.CachedListVirtualDelegate {
        constructor(configurationService, replOptions) {
            super();
            this.configurationService = configurationService;
            this.replOptions = replOptions;
        }
        getHeight(element) {
            const config = this.configurationService.getValue('debug');
            if (!config.console.wordWrap) {
                return this.estimateHeight(element, true);
            }
            return super.getHeight(element);
        }
        /**
         * With wordWrap enabled, this is an estimate. With wordWrap disabled, this is the real height that the list will use.
         */
        estimateHeight(element, ignoreValueLength = false) {
            const lineHeight = this.replOptions.replConfiguration.lineHeight;
            const countNumberOfLines = (str) => str.match(/\n/g)?.length ?? 0;
            const hasValue = (e) => typeof e.value === 'string';
            if (hasValue(element) && !isNestedVariable(element)) {
                const value = element.value;
                const valueRows = countNumberOfLines(value)
                    + (ignoreValueLength ? 0 : Math.floor(value.length / 70)) // Make an estimate for wrapping
                    + (element instanceof replModel_1.ReplOutputElement ? 0 : 1); // A SimpleReplElement ends in \n if it's a complete line
                return Math.max(valueRows, 1) * lineHeight;
            }
            return lineHeight;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Variable || element instanceof replModel_1.ReplVariableElement) {
                return ReplVariablesRenderer.ID;
            }
            if (element instanceof replModel_1.ReplEvaluationResult) {
                return ReplEvaluationResultsRenderer.ID;
            }
            if (element instanceof replModel_1.ReplEvaluationInput) {
                return ReplEvaluationInputsRenderer.ID;
            }
            if (element instanceof replModel_1.ReplOutputElement) {
                return ReplOutputElementRenderer.ID;
            }
            if (element instanceof replModel_1.ReplGroup) {
                return ReplGroupRenderer.ID;
            }
            return ReplRawObjectsRenderer.ID;
        }
        hasDynamicHeight(element) {
            if (isNestedVariable(element)) {
                // Nested variables should always be in one line #111843
                return false;
            }
            // Empty elements should not have dynamic height since they will be invisible
            return element.toString().length > 0;
        }
    }
    exports.ReplDelegate = ReplDelegate;
    function isDebugSession(obj) {
        return typeof obj.getReplElements === 'function';
    }
    class ReplDataSource {
        hasChildren(element) {
            if (isDebugSession(element)) {
                return true;
            }
            return !!element.hasChildren;
        }
        getChildren(element) {
            if (isDebugSession(element)) {
                return Promise.resolve(element.getReplElements());
            }
            return Promise.resolve(element.getChildren());
        }
    }
    exports.ReplDataSource = ReplDataSource;
    class ReplAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('debugConsole', "Debug Console");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Variable) {
                return (0, nls_1.localize)('replVariableAriaLabel', "Variable {0}, value {1}", element.name, element.value);
            }
            if (element instanceof replModel_1.ReplOutputElement || element instanceof replModel_1.ReplEvaluationInput || element instanceof replModel_1.ReplEvaluationResult) {
                return element.value + (element instanceof replModel_1.ReplOutputElement && element.count > 1 ? (0, nls_1.localize)({ key: 'occurred', comment: ['Front will the value of the debug console element. Placeholder will be replaced by a number which represents occurrance count.'] }, ", occurred {0} times", element.count) : '');
            }
            if (element instanceof replModel_1.RawObjectReplElement) {
                return (0, nls_1.localize)('replRawObjectAriaLabel', "Debug console variable {0}, value {1}", element.name, element.value);
            }
            if (element instanceof replModel_1.ReplGroup) {
                return (0, nls_1.localize)('replGroup', "Debug console group {0}", element.name);
            }
            return '';
        }
    }
    exports.ReplAccessibilityProvider = ReplAccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbFZpZXdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9yZXBsVmlld2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4QmhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFpQ2hCLE1BQWEsNEJBQTRCO2lCQUN4QixPQUFFLEdBQUcscUJBQXFCLENBQUM7UUFFM0MsSUFBSSxVQUFVO1lBQ2IsT0FBTyw0QkFBNEIsQ0FBQyxFQUFFLENBQUM7UUFDeEMsQ0FBQztRQUVELGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsWUFBWSxHQUFHLHFCQUFTLENBQUMsYUFBYSxDQUFDLHdDQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sS0FBSyxHQUFHLElBQUksbUNBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ2xCLENBQUM7UUFFRCxhQUFhLENBQUMsT0FBbUQsRUFBRSxLQUFhLEVBQUUsWUFBOEM7WUFDL0gsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNuQyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUEsdUJBQWEsRUFBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsZUFBZSxDQUFDLFlBQThDO1lBQzdELFlBQVks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