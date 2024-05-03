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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/platform/configuration/common/configuration"], function (require, exports, dom_1, event_1, lifecycle_1, numbers_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnfocusedViewDimmingContribution = void 0;
    let UnfocusedViewDimmingContribution = class UnfocusedViewDimmingContribution extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this._styleElementDisposables = undefined;
            this._register((0, lifecycle_1.toDisposable)(() => this._removeStyleElement()));
            this._register(event_1.Event.runAndSubscribe(configurationService.onDidChangeConfiguration, e => {
                if (e && !e.affectsConfiguration("accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */) && !e.affectsConfiguration("accessibility.dimUnfocused.opacity" /* AccessibilityWorkbenchSettingId.DimUnfocusedOpacity */)) {
                    return;
                }
                let cssTextContent = '';
                const enabled = ensureBoolean(configurationService.getValue("accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */), false);
                if (enabled) {
                    const opacity = (0, numbers_1.clamp)(ensureNumber(configurationService.getValue("accessibility.dimUnfocused.opacity" /* AccessibilityWorkbenchSettingId.DimUnfocusedOpacity */), 0.75 /* ViewDimUnfocusedOpacityProperties.Default */), 0.2 /* ViewDimUnfocusedOpacityProperties.Minimum */, 1 /* ViewDimUnfocusedOpacityProperties.Maximum */);
                    if (opacity !== 1) {
                        // These filter rules are more specific than may be expected as the `filter`
                        // rule can cause problems if it's used inside the element like on editor hovers
                        const rules = new Set();
                        const filterRule = `filter: opacity(${opacity});`;
                        // Terminal tabs
                        rules.add(`.monaco-workbench .pane-body.integrated-terminal:not(:focus-within) .tabs-container { ${filterRule} }`);
                        // Terminals
                        rules.add(`.monaco-workbench .pane-body.integrated-terminal .terminal-wrapper:not(:focus-within) { ${filterRule} }`);
                        // Text editors
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .monaco-editor { ${filterRule} }`);
                        // Breadcrumbs
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .breadcrumbs-below-tabs { ${filterRule} }`);
                        // Terminal editors
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .terminal-wrapper { ${filterRule} }`);
                        // Settings editor
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .settings-editor { ${filterRule} }`);
                        // Keybindings editor
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .keybindings-editor { ${filterRule} }`);
                        // Editor placeholder (error case)
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .monaco-editor-pane-placeholder { ${filterRule} }`);
                        // Welcome editor
                        rules.add(`.monaco-workbench .editor-instance:not(:focus-within) .gettingStartedContainer { ${filterRule} }`);
                        cssTextContent = [...rules].join('\n');
                    }
                }
                if (cssTextContent.length === 0) {
                    this._removeStyleElement();
                }
                else {
                    this._getStyleElement().textContent = cssTextContent;
                }
            }));
        }
        _getStyleElement() {
            if (!this._styleElement) {
                this._styleElementDisposables = new lifecycle_1.DisposableStore();
                this._styleElement = (0, dom_1.createStyleSheet)(undefined, undefined, this._styleElementDisposables);
                this._styleElement.className = 'accessibilityUnfocusedViewOpacity';
            }
            return this._styleElement;
        }
        _removeStyleElement() {
            this._styleElementDisposables?.dispose();
            this._styleElementDisposables = undefined;
            this._styleElement = undefined;
        }
    };
    exports.UnfocusedViewDimmingContribution = UnfocusedViewDimmingContribution;
    exports.UnfocusedViewDimmingContribution = UnfocusedViewDimmingContribution = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], UnfocusedViewDimmingContribution);
    function ensureBoolean(value, defaultValue) {
        return typeof value === 'boolean' ? value : defaultValue;
    }
    function ensureNumber(value, defaultValue) {
        return typeof value === 'number' ? value : defaultValue;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5mb2N1c2VkVmlld0RpbW1pbmdDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci91bmZvY3VzZWRWaWV3RGltbWluZ0NvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtRQUkvRCxZQUN3QixvQkFBMkM7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFMRCw2QkFBd0IsR0FBZ0MsU0FBUyxDQUFDO1lBT3pFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUvRCxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZGLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixnR0FBcUQsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsZ0dBQXFELEVBQUUsQ0FBQztvQkFDdkssT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztnQkFFeEIsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsZ0dBQXFELEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3pILElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsTUFBTSxPQUFPLEdBQUcsSUFBQSxlQUFLLEVBQ3BCLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLGdHQUFxRCx1REFBNEMseUdB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