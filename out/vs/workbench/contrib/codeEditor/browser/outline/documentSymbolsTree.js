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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/filters", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/nls", "vs/base/browser/ui/iconLabel/iconLabel", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/editor/common/services/textResourceConfiguration", "vs/base/common/themables", "vs/base/browser/window", "vs/css!./documentSymbolsTree", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, dom, highlightedLabel_1, filters_1, range_1, languages_1, outlineModel_1, nls_1, iconLabel_1, configuration_1, markers_1, themeService_1, colorRegistry_1, textResourceConfiguration_1, themables_1, window_1) {
    "use strict";
    var DocumentSymbolFilter_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentSymbolComparator = exports.DocumentSymbolFilter = exports.DocumentSymbolRenderer = exports.DocumentSymbolGroupRenderer = exports.DocumentSymbolVirtualDelegate = exports.DocumentSymbolIdentityProvider = exports.DocumentSymbolAccessibilityProvider = exports.DocumentSymbolNavigationLabelProvider = void 0;
    class DocumentSymbolNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return element.symbol.name;
            }
        }
    }
    exports.DocumentSymbolNavigationLabelProvider = DocumentSymbolNavigationLabelProvider;
    class DocumentSymbolAccessibilityProvider {
        constructor(_ariaLabel) {
            this._ariaLabel = _ariaLabel;
        }
        getWidgetAriaLabel() {
            return this._ariaLabel;
        }
        getAriaLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return (0, languages_1.getAriaLabelForSymbol)(element.symbol.name, element.symbol.kind);
            }
        }
    }
    exports.DocumentSymbolAccessibilityProvider = DocumentSymbolAccessibilityProvider;
    class DocumentSymbolIdentityProvider {
        getId(element) {
            return element.id;
        }
    }
    exports.DocumentSymbolIdentityProvider = DocumentSymbolIdentityProvider;
    class DocumentSymbolGroupTemplate {
        static { this.id = 'DocumentSymbolGroupTemplate'; }
        constructor(labelContainer, label) {
            this.labelContainer = labelContainer;
            this.label = label;
        }
        dispose() {
            this.label.dispose();
        }
    }
    class DocumentSymbolTemplate {
        static { this.id = 'DocumentSymbolTemplate'; }
        constructor(container, iconLabel, iconClass, decoration) {
            this.container = container;
            this.iconLabel = iconLabel;
            this.iconClass = iconClass;
            this.decoration = decoration;
        }
    }
    class DocumentSymbolVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            return element instanceof outlineModel_1.OutlineGroup
                ? DocumentSymbolGroupTemplate.id
                : DocumentSymbolTemplate.id;
        }
    }
    exports.DocumentSymbolVirtualDelegate = DocumentSymbolVirtualDelegate;
    class DocumentSymbolGroupRenderer {
        constructor() {
            this.templateId = DocumentSymbolGroupTemplate.id;
        }
        renderTemplate(container) {
            const labelContainer = dom.$('.outline-element-label');
            container.classList.add('outline-element');
            dom.append(container, labelContainer);
            return new DocumentSymbolGroupTemplate(labelContainer, new highlightedLabel_1.HighlightedLabel(labelContainer));
        }
        renderElement(node, _index, template) {
            template.label.set(node.element.label, (0, filters_1.createMatches)(node.filterData));
        }
        disposeTemplate(_template) {
            _template.dispose();
        }
    }
    exports.DocumentSymbolGroupRenderer = DocumentSymbolGroupRenderer;
    let DocumentSymbolRenderer = class DocumentSymbolRenderer {
        constructor(_renderMarker, target, _configurationService, _themeService) {
            this._renderMarker = _renderMarker;
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this.templateId = DocumentSymbolTemplate.id;
        }
        renderTemplate(container) {
            container.classList.add('outline-element');
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            const iconClass = dom.$('.outline-element-icon');
            const decoration = dom.$('.outline-element-decoration');
            container.prepend(iconClass);
            container.appendChild(decoration);
            return new DocumentSymbolTemplate(container, iconLabel, iconClass, decoration);
        }
        renderElement(node, _index, template) {
            const { element } = node;
            const extraClasses = ['nowrap'];
            const options = {
                matches: (0, filters_1.createMatches)(node.filterData),
                labelEscapeNewLines: true,
                extraClasses,
                title: (0, nls_1.localize)('title.template', "{0} ({1})", element.symbol.name, languages_1.symbolKindNames[element.symbol.kind])
            };
            if (this._configurationService.getValue("outline.icons" /* OutlineConfigKeys.icons */)) {
                // add styles for the icons
                template.iconClass.className = '';
                template.iconClass.classList.add('outline-element-icon', 'inline', ...themables_1.ThemeIcon.asClassNameArray(languages_1.SymbolKinds.toIcon(element.symbol.kind)));
            }
            if (element.symbol.tags.indexOf(1 /* SymbolTag.Deprecated */) >= 0) {
                extraClasses.push(`deprecated`);
                options.matches = [];
            }
            template.iconLabel.setLabel(element.symbol.name, element.symbol.detail, options);
            if (this._renderMarker) {
                this._renderMarkerInfo(element, template);
            }
        }
        _renderMarkerInfo(element, template) {
            if (!element.marker) {
                dom.hide(template.decoration);
                template.container.style.removeProperty('--outline-element-color');
                return;
            }
            const { count, topSev } = element.marker;
            const color = this._themeService.getColorTheme().getColor(topSev === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground);
            const cssColor = color ? color.toString() : 'inherit';
            // color of the label
            const problem = this._configurationService.getValue('problems.visibility');
            const configProblems = this._configurationService.getValue("outline.problems.colors" /* OutlineConfigKeys.problemsColors */);
            if (!problem || !configProblems) {
                template.container.style.removeProperty('--outline-element-color');
            }
            else {
                template.container.style.setProperty('--outline-element-color', cssColor);
            }
            // badge with color/rollup
            if (problem === undefined) {
                return;
            }
            const configBadges = this._configurationService.getValue("outline.problems.badges" /* OutlineConfigKeys.problemsBadges */);
            if (!configBadges || !problem) {
                dom.hide(template.decoration);
            }
            else if (count > 0) {
                dom.show(template.decoration);
                template.decoration.classList.remove('bubble');
                template.decoration.innerText = count < 10 ? count.toString() : '+9';
                template.decoration.title = count === 1 ? (0, nls_1.localize)('1.problem', "1 problem in this element") : (0, nls_1.localize)('N.problem', "{0} problems in this element", count);
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                dom.show(template.decoration);
                template.decoration.classList.add('bubble');
                template.decoration.innerText = '\uea71';
                template.decoration.title = (0, nls_1.localize)('deep.problem', "Contains elements with problems");
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
        }
        disposeTemplate(_template) {
            _template.iconLabel.dispose();
        }
    };
    exports.DocumentSymbolRenderer = DocumentSymbolRenderer;
    exports.DocumentSymbolRenderer = DocumentSymbolRenderer = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, themeService_1.IThemeService)
    ], DocumentSymbolRenderer);
    let DocumentSymbolFilter = class DocumentSymbolFilter {
        static { DocumentSymbolFilter_1 = this; }
        static { this.kindToConfigName = Object.freeze({
            [0 /* SymbolKind.File */]: 'showFiles',
            [1 /* SymbolKind.Module */]: 'showModules',
            [2 /* SymbolKind.Namespace */]: 'showNamespaces',
            [3 /* SymbolKind.Package */]: 'showPackages',
            [4 /* SymbolKind.Class */]: 'showClasses',
            [5 /* SymbolKind.Method */]: 'showMethods',
            [6 /* SymbolKind.Property */]: 'showProperties',
            [7 /* SymbolKind.Field */]: 'showFields',
            [8 /* SymbolKind.Constructor */]: 'showConstructors',
            [9 /* SymbolKind.Enum */]: 'showEnums',
            [10 /* SymbolKind.Interface */]: 'showInterfaces',
            [11 /* SymbolKind.Function */]: 'showFunctions',
            [12 /* SymbolKind.Variable */]: 'showVariables',
            [13 /* SymbolKind.Constant */]: 'showConstants',
            [14 /* SymbolKind.String */]: 'showStrings',
            [15 /* SymbolKind.Number */]: 'showNumbers',
            [16 /* SymbolKind.Boolean */]: 'showBooleans',
            [17 /* SymbolKind.Array */]: 'showArrays',
            [18 /* SymbolKind.Object */]: 'showObjects',
            [19 /* SymbolKind.Key */]: 'showKeys',
            [20 /* SymbolKind.Null */]: 'showNull',
            [21 /* SymbolKind.EnumMember */]: 'showEnumMembers',
            [22 /* SymbolKind.Struct */]: 'showStructs',
            [23 /* SymbolKind.Event */]: 'showEvents',
            [24 /* SymbolKind.Operator */]: 'showOperators',
            [25 /* SymbolKind.TypeParameter */]: 'showTypeParameters',
        }); }
        constructor(_prefix, _textResourceConfigService) {
            this._prefix = _prefix;
            this._textResourceConfigService = _textResourceConfigService;
        }
        filter(element) {
            const outline = outlineModel_1.OutlineModel.get(element);
            if (!(element instanceof outlineModel_1.OutlineElement)) {
                return true;
            }
            const configName = DocumentSymbolFilter_1.kindToConfigName[element.symbol.kind];
            const configKey = `${this._prefix}.${configName}`;
            return this._textResourceConfigService.getValue(outline?.uri, configKey);
        }
    };
    exports.DocumentSymbolFilter = DocumentSymbolFilter;
    exports.DocumentSymbolFilter = DocumentSymbolFilter = DocumentSymbolFilter_1 = __decorate([
        __param(1, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], DocumentSymbolFilter);
    class DocumentSymbolComparator {
        constructor() {
            this._collator = new dom.WindowIdleValue(window_1.mainWindow, () => new Intl.Collator(undefined, { numeric: true }));
        }
        compareByPosition(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range) || this._collator.value.compare(a.symbol.name, b.symbol.name);
            }
            return 0;
        }
        compareByType(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return a.symbol.kind - b.symbol.kind || this._collator.value.compare(a.symbol.name, b.symbol.name);
            }
            return 0;
        }
        compareByName(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                return this._collator.value.compare(a.symbol.name, b.symbol.name) || range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range);
            }
            return 0;
        }
    }
    exports.DocumentSymbolComparator = DocumentSymbolComparator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTeW1ib2xzVHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL291dGxpbmUvZG9jdW1lbnRTeW1ib2xzVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMEJoRyxNQUFhLHFDQUFxQztRQUVqRCwwQkFBMEIsQ0FBQyxPQUEyQjtZQUNyRCxJQUFJLE9BQU8sWUFBWSwyQkFBWSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQztZQUN0QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUM1QixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBVEQsc0ZBU0M7SUFFRCxNQUFhLG1DQUFtQztRQUUvQyxZQUE2QixVQUFrQjtZQUFsQixlQUFVLEdBQVYsVUFBVSxDQUFRO1FBQUksQ0FBQztRQUVwRCxrQkFBa0I7WUFDakIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFDRCxZQUFZLENBQUMsT0FBMkI7WUFDdkMsSUFBSSxPQUFPLFlBQVksMkJBQVksRUFBRSxDQUFDO2dCQUNyQyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDdEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBQSxpQ0FBcUIsRUFBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hFLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFkRCxrRkFjQztJQUVELE1BQWEsOEJBQThCO1FBQzFDLEtBQUssQ0FBQyxPQUEyQjtZQUNoQyxPQUFPLE9BQU8sQ0FBQyxFQUFFLENB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