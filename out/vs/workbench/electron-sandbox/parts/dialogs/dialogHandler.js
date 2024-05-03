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
define(["require", "exports", "vs/nls", "vs/base/common/date", "vs/base/common/platform", "vs/platform/clipboard/common/clipboardService", "vs/platform/dialogs/common/dialogs", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/base/browser/dom"], function (require, exports, nls_1, date_1, platform_1, clipboardService_1, dialogs_1, log_1, native_1, productService_1, globals_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeDialogHandler = void 0;
    let NativeDialogHandler = class NativeDialogHandler extends dialogs_1.AbstractDialogHandler {
        constructor(logService, nativeHostService, productService, clipboardService) {
            super();
            this.logService = logService;
            this.nativeHostService = nativeHostService;
            this.productService = productService;
            this.clipboardService = clipboardService;
        }
        async prompt(prompt) {
            this.logService.trace('DialogService#prompt', prompt.message);
            const buttons = this.getPromptButtons(prompt);
            const { response, checkboxChecked } = await this.nativeHostService.showMessageBox({
                type: this.getDialogType(prompt.type),
                title: prompt.title,
                message: prompt.message,
                detail: prompt.detail,
                buttons,
                cancelId: prompt.cancelButton ? buttons.length - 1 : -1 /* Disabled */,
                checkboxLabel: prompt.checkbox?.label,
                checkboxChecked: prompt.checkbox?.checked,
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            });
            return this.getPromptResult(prompt, response, checkboxChecked);
        }
        async confirm(confirmation) {
            this.logService.trace('DialogService#confirm', confirmation.message);
            const buttons = this.getConfirmationButtons(confirmation);
            const { response, checkboxChecked } = await this.nativeHostService.showMessageBox({
                type: this.getDialogType(confirmation.type) ?? 'question',
                title: confirmation.title,
                message: confirmation.message,
                detail: confirmation.detail,
                buttons,
                cancelId: buttons.length - 1,
                checkboxLabel: confirmation.checkbox?.label,
                checkboxChecked: confirmation.checkbox?.checked,
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            });
            return { confirmed: response === 0, checkboxChecked };
        }
        input() {
            throw new Error('Unsupported'); // we have no native API for password dialogs in Electron
        }
        async about() {
            let version = this.productService.version;
            if (this.productService.target) {
                version = `${version} (${this.productService.target} setup)`;
            }
            else if (this.productService.darwinUniversalAssetId) {
                version = `${version} (Universal)`;
            }
            const osProps = await this.nativeHostService.getOSProperties();
            const detailString = (useAgo) => {
                return (0, nls_1.localize)({ key: 'aboutDetail', comment: ['Electron, Chromium, Node.js and V8 are product names that need no translation'] }, "Version: {0}\nCommit: {1}\nDate: {2}\nElectron: {3}\nElectronBuildId: {4}\nChromium: {5}\nNode.js: {6}\nV8: {7}\nOS: {8}", version, this.productService.commit || 'Unknown', this.productService.date ? `${this.productService.date}${useAgo ? ' (' + (0, date_1.fromNow)(new Date(this.productService.date), true) + ')' : ''}` : 'Unknown', globals_1.process.versions['electron'], globals_1.process.versions['microsoft-build'], globals_1.process.versions['chrome'], globals_1.process.versions['node'], globals_1.process.versions['v8'], `${osProps.type} ${osProps.arch} ${osProps.release}${platform_1.isLinuxSnap ? ' snap' : ''}`);
            };
            const detail = detailString(true);
            const detailToCopy = detailString(false);
            const { response } = await this.nativeHostService.showMessageBox({
                type: 'info',
                message: this.productService.nameLong,
                detail: `\n${detail}`,
                buttons: [
                    (0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
                    (0, nls_1.localize)('okButton', "OK")
                ],
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            });
            if (response === 0) {
                this.clipboardService.writeText(detailToCopy);
            }
        }
    };
    exports.NativeDialogHandler = NativeDialogHandler;
    exports.NativeDialogHandler = NativeDialogHandler = __decorate([
        __param(0, log_1.ILogService),
        __param(1, native_1.INativeHostService),
        __param(2, productService_1.IProductService),
        __param(3, clipboardService_1.IClipboardService)
    ], NativeDialogHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2VsZWN0cm9uLXNhbmRib3gvcGFydHMvZGlhbG9ncy9kaWFsb2dIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLCtCQUFxQjtRQUU3RCxZQUMrQixVQUF1QixFQUNoQixpQkFBcUMsRUFDeEMsY0FBK0IsRUFDN0IsZ0JBQW1DO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBTHNCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDaEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtRQUd4RSxDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBSSxNQUFrQjtZQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFOUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTlDLE1BQU0sRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDO2dCQUNqRixJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNyQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7Z0JBQ25CLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztnQkFDdkIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO2dCQUNyQixPQUFPO2dCQUNQ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