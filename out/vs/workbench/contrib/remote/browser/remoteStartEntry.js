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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/platform/product/common/productService", "vs/platform/actions/common/actions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/telemetry/common/telemetry", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, lifecycle_1, commands_1, productService_1, actions_1, extensionManagement_1, telemetry_1, extensions_1, extensionManagement_2, contextkey_1) {
    "use strict";
    var RemoteStartEntry_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteStartEntry = exports.showStartEntryInWeb = void 0;
    exports.showStartEntryInWeb = new contextkey_1.RawContextKey('showRemoteStartEntryInWeb', false);
    let RemoteStartEntry = class RemoteStartEntry extends lifecycle_1.Disposable {
        static { RemoteStartEntry_1 = this; }
        static { this.REMOTE_WEB_START_ENTRY_ACTIONS_COMMAND_ID = 'workbench.action.remote.showWebStartEntryActions'; }
        constructor(commandService, productService, extensionManagementService, extensionEnablementService, telemetryService, contextKeyService) {
            super();
            this.commandService = commandService;
            this.productService = productService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.telemetryService = telemetryService;
            this.contextKeyService = contextKeyService;
            const remoteExtensionTips = this.productService.remoteExtensionTips?.['tunnel'];
            this.startCommand = remoteExtensionTips?.startEntry?.startCommand ?? '';
            this.remoteExtensionId = remoteExtensionTips?.extensionId ?? '';
            this._init();
            this.registerActions();
            this.registerListeners();
        }
        registerActions() {
            const category = nls.localize2('remote.category', "Remote");
            // Show Remote Start Action
            const startEntry = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: RemoteStartEntry_1.REMOTE_WEB_START_ENTRY_ACTIONS_COMMAND_ID,
                        category,
                        title: nls.localize2('remote.showWebStartEntryActions', "Show Remote Start Entry for web"),
                        f1: false
                    });
                }
                async run() {
                    await startEntry.showWebRemoteStartActions();
                }
            }));
        }
        registerListeners() {
            this._register(this.extensionEnablementService.onEnablementChanged(async (result) => {
                for (const ext of result) {
                    if (extensions_1.ExtensionIdentifier.equals(this.remoteExtensionId, ext.identifier.id)) {
                        if (this.extensionEnablementService.isEnabled(ext)) {
                            exports.showStartEntryInWeb.bindTo(this.contextKeyService).set(true);
                        }
                        else {
                            exports.showStartEntryInWeb.bindTo(this.contextKeyService).set(false);
                        }
                    }
                }
            }));
        }
        async _init() {
            // Check if installed and enabled
            const installed = (await this.extensionManagementService.getInstalled()).find(value => extensions_1.ExtensionIdentifier.equals(value.identifier.id, this.remoteExtensionId));
            if (installed) {
                if (this.extensionEnablementService.isEnabled(installed)) {
                    exports.showStartEntryInWeb.bindTo(this.contextKeyService).set(true);
                }
            }
        }
        async showWebRemoteStartActions() {
            this.commandService.executeCommand(this.startCommand);
            this.telemetryService.publicLog2('workbenchActionExecuted', {
                id: this.startCommand,
                from: 'remote start entry'
            });
        }
    };
    exports.RemoteStartEntry = RemoteStartEntry;
    exports.RemoteStartEntry = RemoteStartEntry = RemoteStartEntry_1 = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, productService_1.IProductService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, contextkey_1.IContextKeyService)
    ], RemoteStartEntry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlU3RhcnRFbnRyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2Jyb3dzZXIvcmVtb3RlU3RhcnRFbnRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZW5GLFFBQUEsbUJBQW1CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7O2lCQUV2Qiw4Q0FBeUMsR0FBRyxrREFBa0QsQUFBckQsQ0FBc0Q7UUFLdkgsWUFDbUMsY0FBK0IsRUFDL0IsY0FBK0IsRUFDbkIsMEJBQXVELEVBQzlDLDBCQUFnRSxFQUNuRixnQkFBbUMsRUFDbEMsaUJBQXFDO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBUDBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbkIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUM5QywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQXNDO1lBQ25GLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDbEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUkxRSxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsWUFBWSxHQUFHLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxZQUFZLElBQUksRUFBRSxDQUFDO1lBQ3hFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxtQkFBbUIsRUFBRSxXQUFXLElBQUksRUFBRSxDQUFDO1lBRWhFLElBQUksQ0FBQyxLQUFLLEVB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