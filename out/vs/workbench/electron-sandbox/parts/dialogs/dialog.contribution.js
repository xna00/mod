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
define(["require", "exports", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/keybinding/common/keybinding", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/workbench/common/contributions", "vs/workbench/browser/parts/dialogs/dialogHandler", "vs/workbench/electron-sandbox/parts/dialogs/dialogHandler", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/lazy"], function (require, exports, clipboardService_1, configuration_1, dialogs_1, keybinding_1, layoutService_1, log_1, native_1, productService_1, contributions_1, dialogHandler_1, dialogHandler_2, lifecycle_1, instantiation_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogHandlerContribution = void 0;
    let DialogHandlerContribution = class DialogHandlerContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.dialogHandler'; }
        constructor(configurationService, dialogService, logService, layoutService, keybindingService, instantiationService, productService, clipboardService, nativeHostService) {
            super();
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            this.browserImpl = new lazy_1.Lazy(() => new dialogHandler_1.BrowserDialogHandler(logService, layoutService, keybindingService, instantiationService, productService, clipboardService));
            this.nativeImpl = new lazy_1.Lazy(() => new dialogHandler_2.NativeDialogHandler(logService, nativeHostService, productService, clipboardService));
            this.model = this.dialogService.model;
            this._register(this.model.onWillShowDialog(() => {
                if (!this.currentDialog) {
                    this.processDialogs();
                }
            }));
            this.processDialogs();
        }
        async processDialogs() {
            while (this.model.dialogs.length) {
                this.currentDialog = this.model.dialogs[0];
                let result = undefined;
                try {
                    // Confirm
                    if (this.currentDialog.args.confirmArgs) {
                        const args = this.currentDialog.args.confirmArgs;
                        result = (this.useCustomDialog || args?.confirmation.custom) ?
                            await this.browserImpl.value.confirm(args.confirmation) :
                            await this.nativeImpl.value.confirm(args.confirmation);
                    }
                    // Input (custom only)
                    else if (this.currentDialog.args.inputArgs) {
                        const args = this.currentDialog.args.inputArgs;
                        result = await this.browserImpl.value.input(args.input);
                    }
                    // Prompt
                    else if (this.currentDialog.args.promptArgs) {
                        const args = this.currentDialog.args.promptArgs;
                        result = (this.useCustomDialog || args?.prompt.custom) ?
                            await this.browserImpl.value.prompt(args.prompt) :
                            await this.nativeImpl.value.prompt(args.prompt);
                    }
                    // About
                    else {
                        if (this.useCustomDialog) {
                            await this.browserImpl.value.about();
                        }
                        else {
                            await this.nativeImpl.value.about();
                        }
                    }
                }
                catch (error) {
                    result = error;
                }
                this.currentDialog.close(result);
                this.currentDialog = undefined;
            }
        }
        get useCustomDialog() {
            return this.configurationService.getValue('window.dialogStyle') === 'custom';
        }
    };
    exports.DialogHandlerContribution = DialogHandlerContribution;
    exports.DialogHandlerContribution = DialogHandlerContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, dialogs_1.IDialogService),
        __param(2, log_1.ILogService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, productService_1.IProductService),
        __param(7, clipboardService_1.IClipboardService),
        __param(8, native_1.INativeHostService)
    ], DialogHandlerContribution);
    (0, contributions_1.registerWorkbenchContribution2)(DialogHandlerContribution.ID, DialogHandlerContribution, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2VsZWN0cm9uLXNhbmRib3gvcGFydHMvZGlhbG9ncy9kaWFsb2cuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTtpQkFFeEMsT0FBRSxHQUFHLGlDQUFpQyxBQUFwQyxDQUFxQztRQVF2RCxZQUNnQyxvQkFBMkMsRUFDbEQsYUFBNkIsRUFDeEMsVUFBdUIsRUFDcEIsYUFBNkIsRUFDekIsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUNqRCxjQUErQixFQUM3QixnQkFBbUMsRUFDbEMsaUJBQXFDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBVnVCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBV3JELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxXQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxvQ0FBb0IsQ0FBQyxVQUFVLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDbEssSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLG1DQUFtQixDQUFDLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBRTNILElBQUksQ0FBQyxLQUFLLEdBQUksSUFBSSxDQUFDLGFBQStCLENBQUMsS0FBSyxDQUFDO1lBRXpELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFD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