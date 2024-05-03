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
define(["require", "exports", "vs/base/browser/ui/icons/iconSelectBox", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry"], function (require, exports, iconSelectBox_1, dom, contextkey_1, keybindingsRegistry_1) {
    "use strict";
    var WorkbenchIconSelectBox_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchIconSelectBox = exports.WorkbenchIconSelectBoxInputEmptyContextKey = exports.WorkbenchIconSelectBoxInputFocusContextKey = exports.WorkbenchIconSelectBoxFocusContextKey = void 0;
    exports.WorkbenchIconSelectBoxFocusContextKey = new contextkey_1.RawContextKey('iconSelectBoxFocus', true);
    exports.WorkbenchIconSelectBoxInputFocusContextKey = new contextkey_1.RawContextKey('iconSelectBoxInputFocus', true);
    exports.WorkbenchIconSelectBoxInputEmptyContextKey = new contextkey_1.RawContextKey('iconSelectBoxInputEmpty', true);
    let WorkbenchIconSelectBox = class WorkbenchIconSelectBox extends iconSelectBox_1.IconSelectBox {
        static { WorkbenchIconSelectBox_1 = this; }
        static getFocusedWidget() {
            return WorkbenchIconSelectBox_1.focusedWidget;
        }
        constructor(options, contextKeyService) {
            super(options);
            this.contextKeyService = this._register(contextKeyService.createScoped(this.domNode));
            exports.WorkbenchIconSelectBoxFocusContextKey.bindTo(this.contextKeyService);
            this.inputFocusContextKey = exports.WorkbenchIconSelectBoxInputFocusContextKey.bindTo(this.contextKeyService);
            this.inputEmptyContextKey = exports.WorkbenchIconSelectBoxInputEmptyContextKey.bindTo(this.contextKeyService);
            if (this.inputBox) {
                const focusTracker = this._register(dom.trackFocus(this.inputBox.inputElement));
                this._register(focusTracker.onDidFocus(() => this.inputFocusContextKey.set(true)));
                this._register(focusTracker.onDidBlur(() => this.inputFocusContextKey.set(false)));
                this._register(this.inputBox.onDidChange(() => this.inputEmptyContextKey.set(this.inputBox?.value.length === 0)));
            }
        }
        focus() {
            super.focus();
            WorkbenchIconSelectBox_1.focusedWidget = this;
        }
    };
    exports.WorkbenchIconSelectBox = WorkbenchIconSelectBox;
    exports.WorkbenchIconSelectBox = WorkbenchIconSelectBox = WorkbenchIconSelectBox_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], WorkbenchIconSelectBox);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusUp',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: exports.WorkbenchIconSelectBoxFocusContextKey,
        primary: 16 /* KeyCode.UpArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusPreviousRow();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusDown',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: exports.WorkbenchIconSelectBoxFocusContextKey,
        primary: 18 /* KeyCode.DownArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusNextRow();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(exports.WorkbenchIconSelectBoxFocusContextKey, contextkey_1.ContextKeyExpr.or(exports.WorkbenchIconSelectBoxInputEmptyContextKey, exports.WorkbenchIconSelectBoxInputFocusContextKey.toNegated())),
        primary: 17 /* KeyCode.RightArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusNext();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(exports.WorkbenchIconSelectBoxFocusContextKey, contextkey_1.ContextKeyExpr.or(exports.WorkbenchIconSelectBoxInputEmptyContextKey, exports.WorkbenchIconSelectBoxInputFocusContextKey.toNegated())),
        primary: 15 /* KeyCode.LeftArrow */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.focusPrevious();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'iconSelectBox.selectFocused',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: exports.WorkbenchIconSelectBoxFocusContextKey,
        primary: 3 /* KeyCode.Enter */,
        handler: () => {
            const selectBox = WorkbenchIconSelectBox.getFocusedWidget();
            if (selectBox) {
                selectBox.setSelection(selectBox.getFocus()[0]);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvblNlbGVjdEJveC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL2ljb25TZWxlY3RCb3gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVFuRixRQUFBLHFDQUFxQyxHQUFHLElBQUksMEJBQWEsQ0FBVSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvRixRQUFBLDBDQUEwQyxHQUFHLElBQUksMEJBQWEsQ0FBVSx5QkFBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN6RyxRQUFBLDBDQUEwQyxHQUFHLElBQUksMEJBQWEsQ0FBVSx5QkFBeUIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUUvRyxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLDZCQUFhOztRQUd4RCxNQUFNLENBQUMsZ0JBQWdCO1lBQ3RCLE9BQU8sd0JBQXNCLENBQUMsYUFBYSxDQUFDO1FBQzdDLENBQUM7UUFNRCxZQUNDLE9BQThCLEVBQ1YsaUJBQXFDO1lBRXpELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN0Riw2Q0FBcUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDckUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGtEQUEwQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN0RyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsa0RBQTBDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FB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