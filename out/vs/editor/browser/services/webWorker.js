/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/editor/browser/services/editorWorkerService"], function (require, exports, objects_1, editorWorkerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createWebWorker = createWebWorker;
    /**
     * Create a new web worker that has model syncing capabilities built in.
     * Specify an AMD module to load that will `create` an object that will be proxied.
     */
    function createWebWorker(modelService, languageConfigurationService, opts) {
        return new MonacoWebWorkerImpl(modelService, languageConfigurationService, opts);
    }
    class MonacoWebWorkerImpl extends editorWorkerService_1.EditorWorkerClient {
        constructor(modelService, languageConfigurationService, opts) {
            super(modelService, opts.keepIdleModels || false, opts.label, languageConfigurationService);
            this._foreignModuleId = opts.moduleId;
            this._foreignModuleCreateData = opts.createData || null;
            this._foreignModuleHost = opts.host || null;
            this._foreignProxy = null;
        }
        // foreign host request
        fhr(method, args) {
            if (!this._foreignModuleHost || typeof this._foreignModuleHost[method] !== 'function') {
                return Promise.reject(new Error('Missing method ' + method + ' or missing main thread foreign host.'));
            }
            try {
                return Promise.resolve(this._foreignModuleHost[method].apply(this._foreignModuleHost, args));
            }
            catch (e) {
                return Promise.reject(e);
            }
        }
        _getForeignProxy() {
            if (!this._foreignProxy) {
                this._foreignProxy = this._getProxy().then((proxy) => {
                    const foreignHostMethods = this._foreignModuleHost ? (0, objects_1.getAllMethodNames)(this._foreignModuleHost) : [];
                    return proxy.loadForeignModule(this._foreignModuleId, this._foreignModuleCreateData, foreignHostMethods).then((foreignMethods) => {
                        this._foreignModuleCreateData = null;
                        const proxyMethodRequest = (method, args) => {
                            return proxy.fmr(method, args);
                        };
                        const createProxyMethod = (method, proxyMethodRequest) => {
                            return function () {
                                const args = Array.prototype.slice.call(arguments, 0);
                                return proxyMethodRequest(method, args);
                            };
                        };
                        const foreignProxy = {};
                        for (const foreignMethod of foreignMethods) {
                            foreignProxy[foreignMethod] = createProxyMethod(foreignMethod, proxyMethodRequest);
                        }
                        return foreignProxy;
                    });
                });
            }
            return this._foreignProxy;
        }
        getProxy() {
            return this._getForeignProxy();
        }
        withSyncedResources(resources) {
            return this._withSyncedResources(resources).then(_ => this.getProxy());
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViV29ya2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9zZXJ2aWNlcy93ZWJXb3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsMENBRUM7SUFORDs7O09BR0c7SUFDSCxTQUFnQixlQUFlLENBQW1CLFlBQTJCLEVBQUUsNEJBQTJELEVBQUUsSUFBdUI7UUFDbEssT0FBTyxJQUFJLG1CQUFtQixDQUFJLFlBQVksRUFBRSw0QkFBNEIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNyRixDQUFDO0lBOENELE1BQU0sbUJBQXNDLFNBQVEsd0NBQWtCO1FBT3JFLFlBQVksWUFBMkIsRUFBRSw0QkFBMkQsRUFBRSxJQUF1QjtZQUM1SCxLQUFLLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxjQUFjLElBQUksS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztZQUM1RixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUM7WUFDeEQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO1lBQzVDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzNCLENBQUM7UUFFRCx1QkFBdUI7UUFDUCxHQUFHLENBQUMsTUFBYyxFQUFFLElBQVc7WUFDOUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDdkYsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUks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