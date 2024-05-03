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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/window", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/layout/browser/layoutService"], function (require, exports, dom_1, aria_1, window_1, event_1, lifecycle_1, accessibility_1, configuration_1, contextkey_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityService = void 0;
    let AccessibilityService = class AccessibilityService extends lifecycle_1.Disposable {
        constructor(_contextKeyService, _layoutService, _configurationService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._layoutService = _layoutService;
            this._configurationService = _configurationService;
            this._accessibilitySupport = 0 /* AccessibilitySupport.Unknown */;
            this._onDidChangeScreenReaderOptimized = new event_1.Emitter();
            this._onDidChangeReducedMotion = new event_1.Emitter();
            this._accessibilityModeEnabledContext = accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.bindTo(this._contextKeyService);
            const updateContextKey = () => this._accessibilityModeEnabledContext.set(this.isScreenReaderOptimized());
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.accessibilitySupport')) {
                    updateContextKey();
                    this._onDidChangeScreenReaderOptimized.fire();
                }
                if (e.affectsConfiguration('workbench.reduceMotion')) {
                    this._configMotionReduced = this._configurationService.getValue('workbench.reduceMotion');
                    this._onDidChangeReducedMotion.fire();
                }
            }));
            updateContextKey();
            this._register(this.onDidChangeScreenReaderOptimized(() => updateContextKey()));
            const reduceMotionMatcher = window_1.mainWindow.matchMedia(`(prefers-reduced-motion: reduce)`);
            this._systemMotionReduced = reduceMotionMatcher.matches;
            this._configMotionReduced = this._configurationService.getValue('workbench.reduceMotion');
            this.initReducedMotionListeners(reduceMotionMatcher);
        }
        initReducedMotionListeners(reduceMotionMatcher) {
            this._register((0, dom_1.addDisposableListener)(reduceMotionMatcher, 'change', () => {
                this._systemMotionReduced = reduceMotionMatcher.matches;
                if (this._configMotionReduced === 'auto') {
                    this._onDidChangeReducedMotion.fire();
                }
            }));
            const updateRootClasses = () => {
                const reduce = this.isMotionReduced();
                this._layoutService.mainContainer.classList.toggle('reduce-motion', reduce);
                this._layoutService.mainContainer.classList.toggle('enable-motion', !reduce);
            };
            updateRootClasses();
            this._register(this.onDidChangeReducedMotion(() => updateRootClasses()));
        }
        get onDidChangeScreenReaderOptimized() {
            return this._onDidChangeScreenReaderOptimized.event;
        }
        isScreenReaderOptimized() {
            const config = this._configurationService.getValue('editor.accessibilitySupport');
            return config === 'on' || (config === 'auto' && this._accessibilitySupport === 2 /* AccessibilitySupport.Enabled */);
        }
        get onDidChangeReducedMotion() {
            return this._onDidChangeReducedMotion.event;
        }
        isMotionReduced() {
            const config = this._configMotionReduced;
            return config === 'on' || (config === 'auto' && this._systemMotionReduced);
        }
        alwaysUnderlineAccessKeys() {
            return Promise.resolve(false);
        }
        getAccessibilitySupport() {
            return this._accessibilitySupport;
        }
        setAccessibilitySupport(accessibilitySupport) {
            if (this._accessibilitySupport === accessibilitySupport) {
                return;
            }
            this._accessibilitySupport = accessibilitySupport;
            this._onDidChangeScreenReaderOptimized.fire();
        }
        alert(message) {
            (0, aria_1.alert)(message);
        }
        status(message) {
            (0, aria_1.status)(message);
        }
    };
    exports.AccessibilityService = AccessibilityService;
    exports.AccessibilityService = AccessibilityService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, layoutService_1.ILayoutService),
        __param(2, configuration_1.IConfigurationService)
    ], AccessibilityService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9hY2Nlc3NpYmlsaXR5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQVduRCxZQUNxQixrQkFBdUQsRUFDM0QsY0FBK0MsRUFDeEMscUJBQStEO1lBRXRGLEtBQUssRUFBRSxDQUFDO1lBSjZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDMUMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3JCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFWN0UsMEJBQXFCLHdDQUFnQztZQUM1QyxzQ0FBaUMsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBSXhELDhCQUF5QixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFRbEUsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLGtEQUFrQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUUzRyxNQUFNLGdCQUFnQixHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQztZQUN6RyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDdEUsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMsNkJBQTZCLENBQUMsRUFBRSxDQUFDO29CQUMzRCxnQkFBZ0IsRUFBRSxDQUFDO29CQUNuQixJQUFJLENBQUMsaUNBQWlDLENB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