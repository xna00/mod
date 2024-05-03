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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/workbench/services/environment/common/environmentService", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/common/remoteAgentEnvironmentChannel", "vs/base/common/event", "vs/platform/sign/common/sign", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/remote/common/remoteSocketFactoryService"], function (require, exports, lifecycle_1, ipc_1, environmentService_1, remoteAgentConnection_1, remoteAuthorityResolver_1, remoteAgentEnvironmentChannel_1, event_1, sign_1, log_1, productService_1, userDataProfile_1, remoteSocketFactoryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractRemoteAgentService = void 0;
    let AbstractRemoteAgentService = class AbstractRemoteAgentService extends lifecycle_1.Disposable {
        constructor(remoteSocketFactoryService, userDataProfileService, _environmentService, productService, _remoteAuthorityResolverService, signService, logService) {
            super();
            this.remoteSocketFactoryService = remoteSocketFactoryService;
            this.userDataProfileService = userDataProfileService;
            this._environmentService = _environmentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            if (this._environmentService.remoteAuthority) {
                this._connection = this._register(new RemoteAgentConnection(this._environmentService.remoteAuthority, productService.commit, productService.quality, this.remoteSocketFactoryService, this._remoteAuthorityResolverService, signService, logService));
            }
            else {
                this._connection = null;
            }
            this._environment = null;
        }
        getConnection() {
            return this._connection;
        }
        getEnvironment() {
            return this.getRawEnvironment().then(undefined, () => null);
        }
        getRawEnvironment() {
            if (!this._environment) {
                this._environment = this._withChannel(async (channel, connection) => {
                    const env = await remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getEnvironmentData(channel, connection.remoteAuthority, this.userDataProfileService.currentProfile.isDefault ? undefined : this.userDataProfileService.currentProfile.id);
                    this._remoteAuthorityResolverService._setAuthorityConnectionToken(connection.remoteAuthority, env.connectionToken);
                    return env;
                }, null);
            }
            return this._environment;
        }
        getExtensionHostExitInfo(reconnectionToken) {
            return this._withChannel((channel, connection) => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getExtensionHostExitInfo(channel, connection.remoteAuthority, reconnectionToken), null);
        }
        getDiagnosticInfo(options) {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getDiagnosticInfo(channel, options), undefined);
        }
        updateTelemetryLevel(telemetryLevel) {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.updateTelemetryLevel(channel, telemetryLevel), undefined);
        }
        logTelemetry(eventName, data) {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.logTelemetry(channel, eventName, data), undefined);
        }
        flushTelemetry() {
            return this._withTelemetryChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.flushTelemetry(channel), undefined);
        }
        getRoundTripTime() {
            return this._withTelemetryChannel(async (channel) => {
                const start = Date.now();
                await remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.ping(channel);
                return Date.now() - start;
            }, undefined);
        }
        _withChannel(callback, fallback) {
            const connection = this.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel('remoteextensionsenvironment', (channel) => callback(channel, connection));
        }
        _withTelemetryChannel(callback, fallback) {
            const connection = this.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel('telemetry', (channel) => callback(channel, connection));
        }
    };
    exports.AbstractRemoteAgentService = AbstractRemoteAgentService;
    exports.AbstractRemoteAgentService = AbstractRemoteAgentService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, productService_1.IProductService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(5, sign_1.ISignService),
        __param(6, log_1.ILogService)
    ], AbstractRemoteAgentService);
    class RemoteAgentConnection extends lifecycle_1.Disposable {
        constructor(remoteAuthority, _commit, _quality, _remoteSocketFactoryService, _remoteAuthorityResolverService, _signService, _logService) {
            super();
            this._commit = _commit;
            this._quality = _quality;
            this._remoteSocketFactoryService = _remoteSocketFactoryService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._signService = _signService;
            this._logService = _logService;
            this._onReconnecting = this._register(new event_1.Emitter());
            this.onReconnecting = this._onReconnecting.event;
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.onDidStateChange = this._onDidStateChange.event;
            this.remoteAuthority = remoteAuthority;
            this._connection = null;
        }
        getChannel(channelName) {
            return (0, ipc_1.getDelayedChannel)(this._getOrCreateConnection().then(c => c.getChannel(channelName)));
        }
        withChannel(channelName, callback) {
            const channel = this.getChannel(channelName);
            const result = callback(channel);
            return result;
        }
        registerChannel(channelName, channel) {
            this._getOrCreateConnection().then(client => client.registerChannel(channelName, channel));
        }
        async getInitialConnectionTimeMs() {
            try {
                await this._getOrCreateConnection();
            }
            catch {
                // ignored -- time is measured even if connection fails
            }
            return this._initialConnectionMs;
        }
        _getOrCreateConnection() {
            if (!this._connection) {
                this._connection = this._createConnection();
            }
            return this._connection;
        }
        async _createConnection() {
            let firstCall = true;
            const options = {
                commit: this._commit,
                quality: this._quality,
                addressProvider: {
                    getAddress: async () => {
                        if (firstCall) {
                            firstCall = false;
                        }
                        else {
                            this._onReconnecting.fire(undefined);
                        }
                        const { authority } = await this._remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority);
                        return { connectTo: authority.connectTo, connectionToken: authority.connectionToken };
                    }
                },
                remoteSocketFactoryService: this._remoteSocketFactoryService,
                signService: this._signService,
                logService: this._logService,
                ipcLogger: false ? new ipc_1.IPCLogger(`Local \u2192 Remote`, `Remote \u2192 Local`) : null
            };
            let connection;
            const start = Date.now();
            try {
                connection = this._register(await (0, remoteAgentConnection_1.connectRemoteAgentManagement)(options, this.remoteAuthority, `renderer`));
            }
            finally {
                this._initialConnectionMs = Date.now() - start;
            }
            connection.protocol.onDidDispose(() => {
                connection.dispose();
            });
            this._register(connection.onDidStateChange(e => this._onDidStateChange.fire(e)));
            return connection.client;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RSZW1vdGVBZ2VudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9yZW1vdGUvY29tbW9uL2Fic3RyYWN0UmVtb3RlQWdlbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CekYsSUFBZSwwQkFBMEIsR0FBekMsTUFBZSwwQkFBMkIsU0FBUSxzQkFBVTtRQU9sRSxZQUMrQywwQkFBdUQsRUFDM0Qsc0JBQStDLEVBQ3hDLG1CQUFpRCxFQUNqRixjQUErQixFQUNFLCtCQUFnRSxFQUNwRyxXQUF5QixFQUMxQixVQUF1QjtZQUVwQyxLQUFLLEVBQUUsQ0FBQztZQVJzQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzNELDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDeEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE4QjtZQUVoRCxvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWlDO1lBS2xILElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxFQUFFLGNBQWMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLCtCQUErQixFQUFFLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3ZQLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN6QixDQUFDO1lBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJ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