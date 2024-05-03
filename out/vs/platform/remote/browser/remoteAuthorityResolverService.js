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
define(["require", "exports", "vs/base/browser/window", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/stopwatch", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteHosts"], function (require, exports, window_1, async_1, errors, event_1, lifecycle_1, network_1, performance, stopwatch_1, log_1, productService_1, remoteAuthorityResolver_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverService = void 0;
    let RemoteAuthorityResolverService = class RemoteAuthorityResolverService extends lifecycle_1.Disposable {
        constructor(isWorkbenchOptionsBasedResolution, connectionToken, resourceUriProvider, serverBasePath, productService, _logService) {
            super();
            this._logService = _logService;
            this._onDidChangeConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeConnectionData = this._onDidChangeConnectionData.event;
            this._resolveAuthorityRequests = new Map();
            this._cache = new Map();
            this._connectionToken = connectionToken;
            this._connectionTokens = new Map();
            this._isWorkbenchOptionsBasedResolution = isWorkbenchOptionsBasedResolution;
            if (resourceUriProvider) {
                network_1.RemoteAuthorities.setDelegate(resourceUriProvider);
            }
            network_1.RemoteAuthorities.setServerRootPath(productService, serverBasePath);
        }
        async resolveAuthority(authority) {
            let result = this._resolveAuthorityRequests.get(authority);
            if (!result) {
                result = new async_1.DeferredPromise();
                this._resolveAuthorityRequests.set(authority, result);
                if (this._isWorkbenchOptionsBasedResolution) {
                    this._doResolveAuthority(authority).then(v => result.complete(v), (err) => result.error(err));
                }
            }
            return result.p;
        }
        async getCanonicalURI(uri) {
            // todo@connor4312 make this work for web
            return uri;
        }
        getConnectionData(authority) {
            if (!this._cache.has(authority)) {
                return null;
            }
            const resolverResult = this._cache.get(authority);
            const connectionToken = this._connectionTokens.get(authority) || resolverResult.authority.connectionToken;
            return {
                connectTo: resolverResult.authority.connectTo,
                connectionToken: connectionToken
            };
        }
        async _doResolveAuthority(authority) {
            const authorityPrefix = (0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(authority);
            const sw = stopwatch_1.StopWatch.create(false);
            this._logService.info(`Resolving connection token (${authorityPrefix})...`);
            performance.mark(`code/willResolveConnectionToken/${authorityPrefix}`);
            const connectionToken = await Promise.resolve(this._connectionTokens.get(authority) || this._connectionToken);
            performance.mark(`code/didResolveConnectionToken/${authorityPrefix}`);
            this._logService.info(`Resolved connection token (${authorityPrefix}) after ${sw.elapsed()} ms`);
            const defaultPort = (/^https:/.test(window_1.mainWindow.location.href) ? 443 : 80);
            const { host, port } = (0, remoteHosts_1.parseAuthorityWithOptionalPort)(authority, defaultPort);
            const result = { authority: { authority, connectTo: new remoteAuthorityResolver_1.WebSocketRemoteConnection(host, port), connectionToken } };
            network_1.RemoteAuthorities.set(authority, host, port);
            this._cache.set(authority, result);
            this._onDidChangeConnectionData.fire();
            return result;
        }
        _clearResolvedAuthority(authority) {
            if (this._resolveAuthorityRequests.has(authority)) {
                this._resolveAuthorityRequests.get(authority).cancel();
                this._resolveAuthorityRequests.delete(authority);
            }
        }
        _setResolvedAuthority(resolvedAuthority, options) {
            if (this._resolveAuthorityRequests.has(resolvedAuthority.authority)) {
                const request = this._resolveAuthorityRequests.get(resolvedAuthority.authority);
                // For non-websocket types, it's expected the embedder passes a `remoteResourceProvider`
                // which is wrapped to a `IResourceUriProvider` and is not handled here.
                if (resolvedAuthority.connectTo.type === 0 /* RemoteConnectionType.WebSocket */) {
                    network_1.RemoteAuthorities.set(resolvedAuthority.authority, resolvedAuthority.connectTo.host, resolvedAuthority.connectTo.port);
                }
                if (resolvedAuthority.connectionToken) {
                    network_1.RemoteAuthorities.setConnectionToken(resolvedAuthority.authority, resolvedAuthority.connectionToken);
                }
                request.complete({ authority: resolvedAuthority, options });
                this._onDidChangeConnectionData.fire();
            }
        }
        _setResolvedAuthorityError(authority, err) {
            if (this._resolveAuthorityRequests.has(authority)) {
                const request = this._resolveAuthorityRequests.get(authority);
                // Avoid that this error makes it to telemetry
                request.error(errors.ErrorNoTelemetry.fromError(err));
            }
        }
        _setAuthorityConnectionToken(authority, connectionToken) {
            this._connectionTokens.set(authority, connectionToken);
            network_1.RemoteAuthorities.setConnectionToken(authority, connectionToken);
            this._onDidChangeConnectionData.fire();
        }
        _setCanonicalURIProvider(provider) {
        }
    };
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService;
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService = __decorate([
        __param(4, productService_1.IProductService),
        __param(5, log_1.ILogService)
    ], RemoteAuthorityResolverService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQXV0aG9yaXR5UmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvYnJvd3Nlci9yZW1vdGVBdXRob3JpdHlSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHNCQUFVO1FBYTdELFlBQ0MsaUNBQTBDLEVBQzFDLGVBQXFELEVBQ3JELG1CQUFvRCxFQUNwRCxjQUFrQyxFQUNqQixjQUErQixFQUNuQyxXQUF5QztZQUV0RCxLQUFLLEVBQUUsQ0FBQztZQUZzQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQWZ0QywrQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNsRSw4QkFBeUIsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBRWpFLDhCQUF5QixHQUFHLElBQUksR0FBRyxFQUEyQyxDQUFDO1lBQy9FLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztZQWMzRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUNuRCxJQUFJLENBQUMsa0NBQWtDLEdBQUcsaUNBQWlDLENBQUM7WUFDNUUsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO2dCQUN6QiwyQkFBaUIsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQ0QsMkJBQWlCLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCxL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