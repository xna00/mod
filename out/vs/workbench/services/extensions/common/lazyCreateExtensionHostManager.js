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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/extensions/common/extensionHostManager", "vs/workbench/services/extensions/common/extensions"], function (require, exports, async_1, event_1, lifecycle_1, instantiation_1, log_1, remoteAuthorityResolver_1, extensionHostManager_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LazyCreateExtensionHostManager = void 0;
    /**
     * Waits until `start()` and only if it has extensions proceeds to really start.
     */
    let LazyCreateExtensionHostManager = class LazyCreateExtensionHostManager extends lifecycle_1.Disposable {
        get pid() {
            if (this._actual) {
                return this._actual.pid;
            }
            return null;
        }
        get kind() {
            return this._extensionHost.runningLocation.kind;
        }
        get startup() {
            return this._extensionHost.startup;
        }
        get friendyName() {
            return (0, extensionHostManager_1.friendlyExtHostName)(this.kind, this.pid);
        }
        constructor(extensionHost, _internalExtensionService, _instantiationService, _logService) {
            super();
            this._internalExtensionService = _internalExtensionService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._extensionHost = extensionHost;
            this.onDidExit = extensionHost.onExit;
            this._startCalled = new async_1.Barrier();
            this._actual = null;
            this._lazyStartExtensions = null;
        }
        _createActual(reason) {
            this._logService.info(`Creating lazy extension host (${this.friendyName}). Reason: ${reason}`);
            this._actual = this._register(this._instantiationService.createInstance(extensionHostManager_1.ExtensionHostManager, this._extensionHost, [], this._internalExtensionService));
            this._register(this._actual.onDidChangeResponsiveState((e) => this._onDidChangeResponsiveState.fire(e)));
            return this._actual;
        }
        async _getOrCreateActualAndStart(reason) {
            if (this._actual) {
                // already created/started
                return this._actual;
            }
            const actual = this._createActual(reason);
            await actual.start(this._lazyStartExtensions.versionId, this._lazyStartExtensions.allExtensions, this._lazyStartExtensions.myExtensions);
            return actual;
        }
        async ready() {
            await this._startCalled.wait();
            if (this._actual) {
                await this._actual.ready();
            }
        }
        representsRunningLocation(runningLocation) {
            return this._extensionHost.runningLocation.equals(runningLocation);
        }
        async deltaExtensions(extensionsDelta) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.deltaExtensions(extensionsDelta);
            }
            this._lazyStartExtensions.delta(extensionsDelta);
            if (extensionsDelta.myToAdd.length > 0) {
                const actual = this._createActual(`contains ${extensionsDelta.myToAdd.length} new extension(s) (installed or enabled): ${extensionsDelta.myToAdd.map(extId => extId.value)}`);
                await actual.start(this._lazyStartExtensions.versionId, this._lazyStartExtensions.allExtensions, this._lazyStartExtensions.myExtensions);
                return;
            }
        }
        containsExtension(extensionId) {
            return this._extensionHost.extensions?.containsExtension(extensionId) ?? false;
        }
        async activate(extension, reason) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.activate(extension, reason);
            }
            return false;
        }
        async activateByEvent(activationEvent, activationKind) {
            if (activationKind === 1 /* ActivationKind.Immediate */) {
                // this is an immediate request, so we cannot wait for start to be called
                if (this._actual) {
                    return this._actual.activateByEvent(activationEvent, activationKind);
                }
                return;
            }
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.activateByEvent(activationEvent, activationKind);
            }
        }
        activationEventIsDone(activationEvent) {
            if (!this._startCalled.isOpen()) {
                return false;
            }
            if (this._actual) {
                return this._actual.activationEventIsDone(activationEvent);
            }
            return true;
        }
        async getInspectPort(tryEnableInspector) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.getInspectPort(tryEnableInspector);
            }
            return 0;
        }
        async resolveAuthority(remoteAuthority, resolveAttempt) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.resolveAuthority(remoteAuthority, resolveAttempt);
            }
            return {
                type: 'error',
                error: {
                    message: `Cannot resolve authority`,
                    code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown,
                    detail: undefined
                }
            };
        }
        async getCanonicalURI(remoteAuthority, uri) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.getCanonicalURI(remoteAuthority, uri);
            }
            throw new Error(`Cannot resolve canonical URI`);
        }
        async start(extensionRegistryVersionId, allExtensions, myExtensions) {
            if (myExtensions.length > 0) {
                // there are actual extensions, so let's launch the extension host
                const actual = this._createActual(`contains ${myExtensions.length} extension(s): ${myExtensions.map(extId => extId.value)}.`);
                const result = actual.start(extensionRegistryVersionId, allExtensions, myExtensions);
                this._startCalled.open();
                return result;
            }
            // there are no actual extensions running, store extensions in `this._lazyStartExtensions`
            this._lazyStartExtensions = new extensions_1.ExtensionHostExtensions(extensionRegistryVersionId, allExtensions, myExtensions);
            this._startCalled.open();
        }
        async extensionTestsExecute() {
            await this._startCalled.wait();
            const actual = await this._getOrCreateActualAndStart(`execute tests.`);
            return actual.extensionTestsExecute();
        }
        async setRemoteEnvironment(env) {
            await this._startCalled.wait();
            if (this._actual) {
                return this._actual.setRemoteEnvironment(env);
            }
        }
    };
    exports.LazyCreateExtensionHostManager = LazyCreateExtensionHostManager;
    exports.LazyCreateExtensionHostManager = LazyCreateExtensionHostManager = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, log_1.ILogService)
    ], LazyCreateExtensionHostManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF6eUNyZWF0ZUV4dGVuc2lvbkhvc3RNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vbGF6eUNyZWF0ZUV4dGVuc2lvbkhvc3RNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CaEc7O09BRUc7SUFDSSxJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHNCQUFVO1FBVzdELElBQVcsR0FBRztZQUNiLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQ3pCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxJQUFXLElBQUk7WUFDZCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQztRQUNqRCxDQUFDO1FBRUQsSUFBVyxPQUFPO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQVcsV0FBVztZQUNyQixPQUFPLElBQUEsMENBQW1CLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELFlBQ0MsYUFBNkIsRUFDWix5QkFBb0QsRUFDOUMscUJBQTZELEVBQ3ZFLFdBQXlDO1lBRXRELEtBQUssRUFBRSxDQUFDO1lBSlMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUEyQjtZQUM3QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3RELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBL0J0QyxnQ0FBMkIsR0FBNkIsSUFBSSxDQUFDLFNBQVMs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