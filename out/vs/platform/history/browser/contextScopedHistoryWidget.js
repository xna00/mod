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
define(["require", "exports", "vs/base/browser/ui/findinput/findInput", "vs/base/browser/ui/findinput/replaceInput", "vs/base/browser/ui/inputbox/inputBox", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/dom"], function (require, exports, findInput_1, replaceInput_1, inputBox_1, contextkey_1, keybindingsRegistry_1, nls_1, lifecycle_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextScopedReplaceInput = exports.ContextScopedFindInput = exports.ContextScopedHistoryInputBox = exports.historyNavigationVisible = void 0;
    exports.registerAndCreateHistoryNavigationContext = registerAndCreateHistoryNavigationContext;
    exports.historyNavigationVisible = new contextkey_1.RawContextKey('suggestWidgetVisible', false, (0, nls_1.localize)('suggestWidgetVisible', "Whether suggestion are visible"));
    const HistoryNavigationWidgetFocusContext = 'historyNavigationWidgetFocus';
    const HistoryNavigationForwardsEnablementContext = 'historyNavigationForwardsEnabled';
    const HistoryNavigationBackwardsEnablementContext = 'historyNavigationBackwardsEnabled';
    let lastFocusedWidget = undefined;
    const widgets = [];
    function registerAndCreateHistoryNavigationContext(scopedContextKeyService, widget) {
        if (widgets.includes(widget)) {
            throw new Error('Cannot register the same widget multiple times');
        }
        widgets.push(widget);
        const disposableStore = new lifecycle_1.DisposableStore();
        const historyNavigationWidgetFocus = new contextkey_1.RawContextKey(HistoryNavigationWidgetFocusContext, false).bindTo(scopedContextKeyService);
        const historyNavigationForwardsEnablement = new contextkey_1.RawContextKey(HistoryNavigationForwardsEnablementContext, true).bindTo(scopedContextKeyService);
        const historyNavigationBackwardsEnablement = new contextkey_1.RawContextKey(HistoryNavigationBackwardsEnablementContext, true).bindTo(scopedContextKeyService);
        const onDidFocus = () => {
            historyNavigationWidgetFocus.set(true);
            lastFocusedWidget = widget;
        };
        const onDidBlur = () => {
            historyNavigationWidgetFocus.set(false);
            if (lastFocusedWidget === widget) {
                lastFocusedWidget = undefined;
            }
        };
        // Check for currently being focused
        if ((0, dom_1.isActiveElement)(widget.element)) {
            onDidFocus();
        }
        disposableStore.add(widget.onDidFocus(() => onDidFocus()));
        disposableStore.add(widget.onDidBlur(() => onDidBlur()));
        disposableStore.add((0, lifecycle_1.toDisposable)(() => {
            widgets.splice(widgets.indexOf(widget), 1);
            onDidBlur();
        }));
        return {
            historyNavigationForwardsEnablement,
            historyNavigationBackwardsEnablement,
            dispose() {
                disposableStore.dispose();
            }
        };
    }
    let ContextScopedHistoryInputBox = class ContextScopedHistoryInputBox extends inputBox_1.HistoryInputBox {
        constructor(container, contextViewProvider, options, contextKeyService) {
            super(container, contextViewProvider, options);
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.element));
            this._register(registerAndCreateHistoryNavigationContext(scopedContextKeyService, this));
        }
    };
    exports.ContextScopedHistoryInputBox = ContextScopedHistoryInputBox;
    exports.ContextScopedHistoryInputBox = ContextScopedHistoryInputBox = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedHistoryInputBox);
    let ContextScopedFindInput = class ContextScopedFindInput extends findInput_1.FindInput {
        constructor(container, contextViewProvider, options, contextKeyService) {
            super(container, contextViewProvider, options);
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.inputBox.element));
            this._register(registerAndCreateHistoryNavigationContext(scopedContextKeyService, this.inputBox));
        }
    };
    exports.ContextScopedFindInput = ContextScopedFindInput;
    exports.ContextScopedFindInput = ContextScopedFindInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedFindInput);
    let ContextScopedReplaceInput = class ContextScopedReplaceInput extends replaceInput_1.ReplaceInput {
        constructor(container, contextViewProvider, options, contextKeyService, showReplaceOptions = false) {
            super(container, contextViewProvider, showReplaceOptions, options);
            const scopedContextKeyService = this._register(contextKeyService.createScoped(this.inputBox.element));
            this._register(registerAndCreateHistoryNavigationContext(scopedContextKeyService, this.inputBox));
        }
    };
    exports.ContextScopedReplaceInput = ContextScopedReplaceInput;
    exports.ContextScopedReplaceInput = ContextScopedReplaceInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedReplaceInput);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(HistoryNavigationWidgetFocusContext), contextkey_1.ContextKeyExpr.equals(HistoryNavigationBackwardsEnablementContext, true), contextkey_1.ContextKeyExpr.not('isComposing'), exports.historyNavigationVisible.isEqualTo(false)),
        primary: 16 /* KeyCode.UpArrow */,
        secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
        handler: (accessor) => {
            lastFocusedWidget?.showPreviousValue();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(HistoryNavigationWidgetFocusContext), contextkey_1.ContextKeyExpr.equals(HistoryNavigationForwardsEnablementContext, true), contextkey_1.ContextKeyExpr.not('isComposing'), exports.historyNavigationVisible.isEqualTo(false)),
        primary: 18 /* KeyCode.DownArrow */,
        secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
        handler: (accessor) => {
            lastFocusedWidget?.showNextValue();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dFNjb3BlZEhpc3RvcnlXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2hpc3RvcnkvYnJvd3Nlci9jb250ZXh0U2NvcGVkSGlzdG9yeVdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0QmhHLDhGQTBDQztJQXhEWSxRQUFBLHdCQUF3QixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO0lBRXRLLE1BQU0sbUNBQW1DLEdBQUcsOEJBQThCLENBQUM7SUFDM0UsTUFBTSwwQ0FBMEMsR0FBRyxrQ0FBa0MsQ0FBQztJQUN0RixNQUFNLDJDQUEyQyxHQUFHLG1DQUFtQyxDQUFDO0lBT3hGLElBQUksaUJBQWlCLEdBQXlDLFNBQVMsQ0FBQztJQUN4RSxNQUFNLE9BQU8sR0FBK0IsRUFBRSxDQUFDO0lBRS9DLFNBQWdCLHlDQUF5QyxDQUFDLHVCQUEyQyxFQUFFLE1BQWdDO1FBQ3RJLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQixNQUFNLGVBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUM5QyxNQUFNLDRCQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBVSxtQ0FBbUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUM1SSxNQUFNLG1DQUFtQyxHQUFHLElBQUksMEJBQWEsQ0FB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