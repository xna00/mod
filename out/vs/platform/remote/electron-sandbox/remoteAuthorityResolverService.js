var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/product/common/productService"], function (require, exports, async_1, errors, event_1, lifecycle_1, network_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverService = void 0;
    let RemoteAuthorityResolverService = class RemoteAuthorityResolverService extends lifecycle_1.Disposable {
        constructor(productService, remoteResourceLoader) {
            super();
            this.remoteResourceLoader = remoteResourceLoader;
            this._onDidChangeConnectionData = this._register(new event_1.Emitter());
            this.onDidChangeConnectionData = this._onDidChangeConnectionData.event;
            this._resolveAuthorityRequests = new Map();
            this._connectionTokens = new Map();
            this._canonicalURIRequests = new Map();
            this._canonicalURIProvider = null;
            network_1.RemoteAuthorities.setServerRootPath(productService, undefined); // on the desktop we don't support custom server base paths
        }
        resolveAuthority(authority) {
            if (!this._resolveAuthorityRequests.has(authority)) {
                this._resolveAuthorityRequests.set(authority, new async_1.DeferredPromise());
            }
            return this._resolveAuthorityRequests.get(authority).p;
        }
        async getCanonicalURI(uri) {
            const key = uri.toString();
            const existing = this._canonicalURIRequests.get(key);
            if (existing) {
                return existing.result.p;
            }
            const result = new async_1.DeferredPromise();
            this._canonicalURIProvider?.(uri).then((uri) => result.complete(uri), (err) => result.error(err));
            this._canonicalURIRequests.set(key, { input: uri, result });
            return result.p;
        }
        getConnectionData(authority) {
            if (!this._resolveAuthorityRequests.has(authority)) {
                return null;
            }
            const request = this._resolveAuthorityRequests.get(authority);
            if (!request.isResolved) {
                return null;
            }
            const connectionToken = this._connectionTokens.get(authority);
            return {
                connectTo: request.value.authority.connectTo,
                connectionToken: connectionToken
            };
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
                if (resolvedAuthority.connectTo.type === 0 /* RemoteConnectionType.WebSocket */) {
                    network_1.RemoteAuthorities.set(resolvedAuthority.authority, resolvedAuthority.connectTo.host, resolvedAuthority.connectTo.port);
                }
                else {
                    network_1.RemoteAuthorities.setDelegate(this.remoteResourceLoader.getResourceUriProvider());
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
            this._canonicalURIProvider = provider;
            this._canonicalURIRequests.forEach(({ result, input }) => {
                this._canonicalURIProvider(input).then((uri) => result.complete(uri), (err) => result.error(err));
            });
        }
    };
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService;
    exports.RemoteAuthorityResolverService = RemoteAuthorityResolverService = __decorate([
        __param(0, productService_1.IProductService)
    ], RemoteAuthorityResolverService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQXV0aG9yaXR5UmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGUvZWxlY3Ryb24tc2FuZGJveC9yZW1vdGVBdXRob3JpdHlSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQWVPLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEsc0JBQVU7UUFZN0QsWUFBNkIsY0FBK0IsRUFBbUIsb0JBQWtEO1lBQ2hJLEtBQUssRUFBRSxDQUFDO1lBRHNFLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBOEI7WUFSaEgsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDbEUsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQztZQVNqRixJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxHQUFHLEVBQTJDLENBQUM7WUFDcEYsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQ25ELElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFFbEMsMkJBQWlCLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsMkRBQTJEO1FBQzVILENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxTQUFpQjtZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMseUJBQXlCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLHVC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