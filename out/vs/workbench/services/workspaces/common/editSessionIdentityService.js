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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/workspace/common/editSessions", "vs/workbench/services/extensions/common/extensions"], function (require, exports, arrays_1, lifecycle_1, extensions_1, log_1, editSessions_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionIdentityService = void 0;
    let EditSessionIdentityService = class EditSessionIdentityService {
        constructor(_extensionService, _logService) {
            this._extensionService = _extensionService;
            this._logService = _logService;
            this._editSessionIdentifierProviders = new Map();
            this._participants = [];
        }
        registerEditSessionIdentityProvider(provider) {
            if (this._editSessionIdentifierProviders.get(provider.scheme)) {
                throw new Error(`A provider has already been registered for scheme ${provider.scheme}`);
            }
            this._editSessionIdentifierProviders.set(provider.scheme, provider);
            return (0, lifecycle_1.toDisposable)(() => {
                this._editSessionIdentifierProviders.delete(provider.scheme);
            });
        }
        async getEditSessionIdentifier(workspaceFolder, token) {
            const { scheme } = workspaceFolder.uri;
            const provider = await this.activateProvider(scheme);
            this._logService.trace(`EditSessionIdentityProvider for scheme ${scheme} available: ${!!provider}`);
            return provider?.getEditSessionIdentifier(workspaceFolder, token);
        }
        async provideEditSessionIdentityMatch(workspaceFolder, identity1, identity2, cancellationToken) {
            const { scheme } = workspaceFolder.uri;
            const provider = await this.activateProvider(scheme);
            this._logService.trace(`EditSessionIdentityProvider for scheme ${scheme} available: ${!!provider}`);
            return provider?.provideEditSessionIdentityMatch?.(workspaceFolder, identity1, identity2, cancellationToken);
        }
        async onWillCreateEditSessionIdentity(workspaceFolder, cancellationToken) {
            this._logService.debug('Running onWillCreateEditSessionIdentity participants...');
            // TODO@joyceerhl show progress notification?
            for (const participant of this._participants) {
                await participant.participate(workspaceFolder, cancellationToken);
            }
            this._logService.debug(`Done running ${this._participants.length} onWillCreateEditSessionIdentity participants.`);
        }
        addEditSessionIdentityCreateParticipant(participant) {
            const dispose = (0, arrays_1.insert)(this._participants, participant);
            return (0, lifecycle_1.toDisposable)(() => dispose());
        }
        async activateProvider(scheme) {
            const transformedScheme = scheme === 'vscode-remote' ? 'file' : scheme;
            const provider = this._editSessionIdentifierProviders.get(scheme);
            if (provider) {
                return provider;
            }
            await this._extensionService.activateByEvent(`onEditSession:${transformedScheme}`);
            return this._editSessionIdentifierProviders.get(scheme);
        }
    };
    exports.EditSessionIdentityService = EditSessionIdentityService;
    exports.EditSessionIdentityService = EditSessionIdentityService = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, log_1.ILogService)
    ], EditSessionIdentityService);
    (0, extensions_1.registerSingleton)(editSessions_1.IEditSessionIdentityService, EditSessionIdentityService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25JZGVudGl0eVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3Jrc3BhY2VzL2NvbW1vbi9lZGl0U2Vzc2lvbklkZW50aXR5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMEI7UUFLdEMsWUFDb0IsaUJBQXFELEVBQzNELFdBQXlDO1lBRGxCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDMUMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFKL0Msb0NBQStCLEdBQUcsSUFBSSxHQUFHLEVBQXdDLENBQUM7WUErQ2xGLGtCQUFhLEdBQTRDLEVBQUUsQ0FBQztRQTFDaEUsQ0FBQztRQUVMLG1DQUFtQyxDQUFDLFFBQXNDO1lBQ3pFLElBQUksSUFBSSxDQUFDLCtCQUErQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDekYsQ0FBQztZQUVELElBQUksQ0FBQywrQkFBK0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNwRSxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxlQUFpQyxFQUFFLEtBQXdCO1lBQ3pGLE1BQU0sRUFBRSxN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