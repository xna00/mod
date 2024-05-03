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
define(["require", "exports", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/base/common/severity", "vs/base/browser/ui/dialog/dialog", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/platform/product/common/productService", "vs/platform/clipboard/common/clipboardService", "vs/base/common/date", "vs/platform/instantiation/common/instantiation", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/platform/theme/browser/defaultStyles"], function (require, exports, nls_1, dialogs_1, layoutService_1, log_1, severity_1, dialog_1, lifecycle_1, dom_1, keybinding_1, productService_1, clipboardService_1, date_1, instantiation_1, markdownRenderer_1, defaultStyles_1) {
    "use strict";
    var BrowserDialogHandler_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserDialogHandler = void 0;
    let BrowserDialogHandler = class BrowserDialogHandler extends dialogs_1.AbstractDialogHandler {
        static { BrowserDialogHandler_1 = this; }
        static { this.ALLOWABLE_COMMANDS = [
            'copy',
            'cut',
            'editor.action.selectAll',
            'editor.action.clipboardCopyAction',
            'editor.action.clipboardCutAction',
            'editor.action.clipboardPasteAction'
        ]; }
        constructor(logService, layoutService, keybindingService, instantiationService, productService, clipboardService) {
            super();
            this.logService = logService;
            this.layoutService = layoutService;
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            this.productService = productService;
            this.clipboardService = clipboardService;
            this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
        }
        async prompt(prompt) {
            this.logService.trace('DialogService#prompt', prompt.message);
            const buttons = this.getPromptButtons(prompt);
            const { button, checkboxChecked } = await this.doShow(prompt.type, prompt.message, buttons, prompt.detail, prompt.cancelButton ? buttons.length - 1 : -1 /* Disabled */, prompt.checkbox, undefined, typeof prompt?.custom === 'object' ? prompt.custom : undefined);
            return this.getPromptResult(prompt, button, checkboxChecked);
        }
        async confirm(confirmation) {
            this.logService.trace('DialogService#confirm', confirmation.message);
            const buttons = this.getConfirmationButtons(confirmation);
            const { button, checkboxChecked } = await this.doShow(confirmation.type ?? 'question', confirmation.message, buttons, confirmation.detail, buttons.length - 1, confirmation.checkbox, undefined, typeof confirmation?.custom === 'object' ? confirmation.custom : undefined);
            return { confirmed: button === 0, checkboxChecked };
        }
        async input(input) {
            this.logService.trace('DialogService#input', input.message);
            const buttons = this.getInputButtons(input);
            const { button, checkboxChecked, values } = await this.doShow(input.type ?? 'question', input.message, buttons, input.detail, buttons.length - 1, input?.checkbox, input.inputs, typeof input.custom === 'object' ? input.custom : undefined);
            return { confirmed: button === 0, checkboxChecked, values };
        }
        async about() {
            const detailString = (useAgo) => {
                return (0, nls_1.localize)('aboutDetail', "Version: {0}\nCommit: {1}\nDate: {2}\nBrowser: {3}", this.productService.version || 'Unknown', this.productService.commit || 'Unknown', this.productService.date ? `${this.productService.date}${useAgo ? ' (' + (0, date_1.fromNow)(new Date(this.productService.date), true) + ')' : ''}` : 'Unknown', navigator.userAgent);
            };
            const detail = detailString(true);
            const detailToCopy = detailString(false);
            const { button } = await this.doShow(severity_1.default.Info, this.productService.nameLong, [
                (0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
                (0, nls_1.localize)('ok', "OK")
            ], detail, 1);
            if (button === 0) {
                this.clipboardService.writeText(detailToCopy);
            }
        }
        async doShow(type, message, buttons, detail, cancelId, checkbox, inputs, customOptions) {
            const dialogDisposables = new lifecycle_1.DisposableStore();
            const renderBody = customOptions ? (parent) => {
                parent.classList.add(...(customOptions.classes || []));
                customOptions.markdownDetails?.forEach(markdownDetail => {
                    const result = this.markdownRenderer.render(markdownDetail.markdown);
                    parent.appendChild(result.element);
                    result.element.classList.add(...(markdownDetail.classes || []));
                    dialogDisposables.add(result);
                });
            } : undefined;
            const dialog = new dialog_1.Dialog(this.layoutService.activeContainer, message, buttons, {
                detail,
                cancelId,
                type: this.getDialogType(type),
                keyEventProcessor: (event) => {
                    const resolved = this.keybindingService.softDispatch(event, this.layoutService.activeContainer);
                    if (resolved.kind === 2 /* ResultKind.KbFound */ && resolved.commandId) {
                        if (BrowserDialogHandler_1.ALLOWABLE_COMMANDS.indexOf(resolved.commandId) === -1) {
                            dom_1.EventHelper.stop(event, true);
                        }
                    }
                },
                renderBody,
                icon: customOptions?.icon,
                disableCloseAction: customOptions?.disableCloseAction,
                buttonDetails: customOptions?.buttonDetails,
                checkboxLabel: checkbox?.label,
                checkboxChecked: checkbox?.checked,
                inputs,
                buttonStyles: defaultStyles_1.defaultButtonStyles,
                checkboxStyles: defaultStyles_1.defaultCheckboxStyles,
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                dialogStyles: defaultStyles_1.defaultDialogStyles
            });
            dialogDisposables.add(dialog);
            const result = await dialog.show();
            dialogDisposables.dispose();
            return result;
        }
    };
    exports.BrowserDialogHandler = BrowserDialogHandler;
    exports.BrowserDialogHandler = BrowserDialogHandler = BrowserDialogHandler_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, layoutService_1.ILayoutService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, productService_1.IProductService),
        __param(5, clipboardService_1.IClipboardService)
    ], BrowserDialogHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZGlhbG9ncy9kaWFsb2dIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsK0JBQXFCOztpQkFFdEMsdUJBQWtCLEdBQUc7WUFDNUMsTUFBTTtZQUNOLEtBQUs7WUFDTCx5QkFBeUI7WUFDekIsbUNBQW1DO1lBQ25DLGtDQUFrQztZQUNsQyxvQ0FBb0M7U0FDcEMsQUFQeUMsQ0FPeEM7UUFJRixZQUNjLFVBQXdDLEVBQ3JDLGFBQThDLEVBQzFDLGlCQUFzRCxFQUNuRCxvQkFBNEQsRUFDbEUsY0FBZ0QsRUFDOUMsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBUHNCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVJ2RCxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBV25HLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFJLE1BQWtCO1lBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU5RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxNQUFNLEVBQUUsTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFclEsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBMkI7WUFDeEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXJFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUUxRCxNQUFNLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLFVBQVUsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLFlBQVksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sWUFBWSxFQUFFLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTdRLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFBRSxlQUFlLEVBQUUsQ0FBQztRQUNyRCxDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFhO1lBQ3hCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU1RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTVDLE1BQU0sRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLFVBQVUsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUU5TyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sS0FBSyxDQUFDLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRSxDQUFDO1FBQzdELENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSztZQUNWLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBZSxFQUFVLEVBQUU7Z0JBQ2hELE9BQU8sSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUM1QixvREFBb0QsRUFDcEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLElBQUksU0FBUyxFQUN4QyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxTQUFTLEVBQ3ZDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUEsY0FBTyxFQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUNuSixTQUFTLENBQUMsU0FBUyxDQUNuQixDQUFDO1lBQ0gsQ0FBQyxDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV6QyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUNuQyxrQkFBUSxDQUFDLElBQUksRUFDYixJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFDNUI7Z0JBQ0MsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUM7Z0JBQ3ZFLElBQUEsY0FBUSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUM7YUFDcEIsRUFDRCxNQUFNLEVBQ04sQ0FBQyxDQUNELENBQUM7WUFFRixJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBdUMsRUFBRSxPQUFlLEVBQUUsT0FBa0IsRUFBRSxNQUFlLEVBQUUsUUFBaUIsRUFBRSxRQUFvQixFQUFFLE1BQXdCLEVBQUUsYUFBb0M7WUFDMU4sTUFBTSxpQkFBaUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVoRCxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBbUIsRUFBRSxFQUFFO2dCQUMxRCxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxhQUFhLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRTtvQkFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNuQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDaEUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRWQsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQ3hCLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUNsQyxPQUFPLEVBQ1AsT0FBTyxFQUNQO2dCQUNDLE1BQU07Z0JBQ04sUUFBUTtnQkFDUixJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7Z0JBQzlCLGlCQUFpQixFQUFFLENBQUMsS0FBNEIsRUFBRSxFQUFFO29CQUNuRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNoRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLCtCQUF1QixJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDaEUsSUFBSSxzQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2hGLGlCQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDL0IsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsVUFBVTtnQkFDVixJQUFJLEVBQUUsYUFBYSxFQUFFLElBQUk7Z0JBQ3pCLGtCQUFrQixFQUFFLGFBQWEsRUFBRSxrQkFBa0I7Z0JBQ3JELGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYTtnQkFDM0MsYUFBYSxFQUFFLFFBQVEsRUFBRSxLQUFLO2dCQUM5QixlQUFlLEVBQUUsUUFBUSxFQUFFLE9BQU87Z0JBQ2xDLE1BQU07Z0JBQ04sWUFBWSxFQUFFLG1DQUFtQjtnQkFDakMsY0FBYyxFQUFFLHFDQUFxQjtnQkFDckMsY0FBYyxFQUFFLHFDQUFxQjtnQkFDckMsWUFBWSxFQUFFLG1DQUFtQjthQUNqQyxDQUNELENBQUM7WUFFRixpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFNUIsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDOztJQXJJVyxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQWM5QixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSxvQ0FBaUIsQ0FBQTtPQW5CUCxvQkFBb0IsQ0FzSWhDIn0=