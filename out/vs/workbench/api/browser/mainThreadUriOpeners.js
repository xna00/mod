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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/externalUriOpener/common/contributedOpeners", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService", "vs/workbench/services/extensions/common/extensions", "../../services/extensions/common/extHostCustomers"], function (require, exports, actions_1, errors_1, lifecycle_1, network_1, nls_1, notification_1, opener_1, storage_1, extHost_protocol_1, configuration_1, contributedOpeners_1, externalUriOpenerService_1, extensions_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadUriOpeners = void 0;
    let MainThreadUriOpeners = class MainThreadUriOpeners extends lifecycle_1.Disposable {
        constructor(context, storageService, externalUriOpenerService, extensionService, openerService, notificationService) {
            super();
            this.extensionService = extensionService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this._registeredOpeners = new Map();
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostUriOpeners);
            this._register(externalUriOpenerService.registerExternalOpenerProvider(this));
            this._contributedExternalUriOpenersStore = this._register(new contributedOpeners_1.ContributedExternalUriOpenersStore(storageService, extensionService));
        }
        async *getOpeners(targetUri) {
            // Currently we only allow openers for http and https urls
            if (targetUri.scheme !== network_1.Schemas.http && targetUri.scheme !== network_1.Schemas.https) {
                return;
            }
            await this.extensionService.activateByEvent(`onOpenExternalUri:${targetUri.scheme}`);
            for (const [id, openerMetadata] of this._registeredOpeners) {
                if (openerMetadata.schemes.has(targetUri.scheme)) {
                    yield this.createOpener(id, openerMetadata);
                }
            }
        }
        createOpener(id, metadata) {
            return {
                id: id,
                label: metadata.label,
                canOpen: (uri, token) => {
                    return this.proxy.$canOpenUri(id, uri, token);
                },
                openExternalUri: async (uri, ctx, token) => {
                    try {
                        await this.proxy.$openUri(id, { resolvedUri: uri, sourceUri: ctx.sourceUri }, token);
                    }
                    catch (e) {
                        if (!(0, errors_1.isCancellationError)(e)) {
                            const openDefaultAction = new actions_1.Action('default', (0, nls_1.localize)('openerFailedUseDefault', "Open using default opener"), undefined, undefined, async () => {
                                await this.openerService.open(uri, {
                                    allowTunneling: false,
                                    allowContributedOpeners: configuration_1.defaultExternalUriOpenerId,
                                });
                            });
                            openDefaultAction.tooltip = uri.toString();
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: (0, nls_1.localize)({
                                    key: 'openerFailedMessage',
                                    comment: ['{0} is the id of the opener. {1} is the url being opened.'],
                                }, 'Could not open uri with \'{0}\': {1}', id, e.toString()),
                                actions: {
                                    primary: [
                                        openDefaultAction
                                    ]
                                }
                            });
                        }
                    }
                    return true;
                },
            };
        }
        async $registerUriOpener(id, schemes, extensionId, label) {
            if (this._registeredOpeners.has(id)) {
                throw new Error(`Opener with id '${id}' already registered`);
            }
            this._registeredOpeners.set(id, {
                schemes: new Set(schemes),
                label,
                extensionId,
            });
            this._contributedExternalUriOpenersStore.didRegisterOpener(id, extensionId.value);
        }
        async $unregisterUriOpener(id) {
            this._registeredOpeners.delete(id);
            this._contributedExternalUriOpenersStore.delete(id);
        }
        dispose() {
            super.dispose();
            this._registeredOpeners.clear();
        }
    };
    exports.MainThreadUriOpeners = MainThreadUriOpeners;
    exports.MainThreadUriOpeners = MainThreadUriOpeners = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadUriOpeners),
        __param(1, storage_1.IStorageService),
        __param(2, externalUriOpenerService_1.IExternalUriOpenerService),
        __param(3, extensions_1.IExtensionService),
        __param(4, opener_1.IOpenerService),
        __param(5, notification_1.INotificationService)
    ], MainThreadUriOpeners);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFVyaU9wZW5lcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVXJpT3BlbmVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFNbkQsWUFDQyxPQUF3QixFQUNQLGNBQStCLEVBQ3JCLHdCQUFtRCxFQUMzRCxnQkFBb0QsRUFDdkQsYUFBOEMsRUFDeEMsbUJBQTBEO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBSjRCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFUaEUsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7WUFZakYsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUVoRSxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFOUUsSUFBSSxDQUFDLG1DQUFtQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx1REFBa0MsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ3JJLENBQUM7UUFFTSxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBYztZQUV0QywwREFBMEQ7WUFDMUQsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxLQUFLLEVB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