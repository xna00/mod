/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/amd", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, amd_1, network_1, platform, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.importAMDNodeModule = importAMDNodeModule;
    class DefineCall {
        constructor(id, dependencies, callback) {
            this.id = id;
            this.dependencies = dependencies;
            this.callback = callback;
        }
    }
    class AMDModuleImporter {
        static { this.INSTANCE = new AMDModuleImporter(); }
        constructor() {
            this._isWebWorker = (typeof self === 'object' && self.constructor && self.constructor.name === 'DedicatedWorkerGlobalScope');
            this._isRenderer = typeof document === 'object';
            this._defineCalls = [];
            this._initialized = false;
        }
        _initialize() {
            if (this._initialized) {
                return;
            }
            this._initialized = true;
            globalThis.define = (id, dependencies, callback) => {
                if (typeof id !== 'string') {
                    callback = dependencies;
                    dependencies = id;
                    id = null;
                }
                if (typeof dependencies !== 'object' || !Array.isArray(dependencies)) {
                    callback = dependencies;
                    dependencies = null;
                }
                // if (!dependencies) {
                // 	dependencies = ['require', 'exports', 'module'];
                // }
                this._defineCalls.push(new DefineCall(id, dependencies, callback));
            };
            globalThis.define.amd = true;
            if (this._isRenderer) {
                // eslint-disable-next-line no-restricted-globals
                this._amdPolicy = window.trustedTypes?.createPolicy('amdLoader', {
                    createScriptURL(value) {
                        // eslint-disable-next-line no-restricted-globals
                        if (value.startsWith(window.location.origin)) {
                            return value;
                        }
                        if (value.startsWith('vscode-file://vscode-app')) {
                            return value;
                        }
                        throw new Error(`[trusted_script_src] Invalid script url: ${value}`);
                    }
                });
            }
            else if (this._isWebWorker) {
                this._amdPolicy = globalThis.trustedTypes?.createPolicy('amdLoader', {
                    createScriptURL(value) {
                        return value;
                    }
                });
            }
        }
        async load(scriptSrc) {
            this._initialize();
            const defineCall = await (this._isWebWorker ? this._workerLoadScript(scriptSrc) : this._isRenderer ? this._rendererLoadScript(scriptSrc) : this._nodeJSLoadScript(scriptSrc));
            if (!defineCall) {
                throw new Error(`Did not receive a define call from script ${scriptSrc}`);
            }
            // TODO require, exports, module
            if (Array.isArray(defineCall.dependencies) && defineCall.dependencies.length > 0) {
                throw new Error(`Cannot resolve dependencies for script ${scriptSrc}. The dependencies are: ${defineCall.dependencies.join(', ')}`);
            }
            if (typeof defineCall.callback === 'function') {
                return defineCall.callback([]);
            }
            else {
                return defineCall.callback;
            }
        }
        _rendererLoadScript(scriptSrc) {
            return new Promise((resolve, reject) => {
                const scriptElement = document.createElement('script');
                scriptElement.setAttribute('async', 'async');
                scriptElement.setAttribute('type', 'text/javascript');
                const unbind = () => {
                    scriptElement.removeEventListener('load', loadEventListener);
                    scriptElement.removeEventListener('error', errorEventListener);
                };
                const loadEventListener = (e) => {
                    unbind();
                    resolve(this._defineCalls.pop());
                };
                const errorEventListener = (e) => {
                    unbind();
                    reject(e);
                };
                scriptElement.addEventListener('load', loadEventListener);
                scriptElement.addEventListener('error', errorEventListener);
                if (this._amdPolicy) {
                    scriptSrc = this._amdPolicy.createScriptURL(scriptSrc);
                }
                scriptElement.setAttribute('src', scriptSrc);
                // eslint-disable-next-line no-restricted-globals
                window.document.getElementsByTagName('head')[0].appendChild(scriptElement);
            });
        }
        _workerLoadScript(scriptSrc) {
            return new Promise((resolve, reject) => {
                try {
                    if (this._amdPolicy) {
                        scriptSrc = this._amdPolicy.createScriptURL(scriptSrc);
                    }
                    importScripts(scriptSrc);
                    resolve(this._defineCalls.pop());
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        async _nodeJSLoadScript(scriptSrc) {
            try {
                const fs = globalThis._VSCODE_NODE_MODULES['fs'];
                const vm = globalThis._VSCODE_NODE_MODULES['vm'];
                const module = globalThis._VSCODE_NODE_MODULES['module'];
                const filePath = uri_1.URI.parse(scriptSrc).fsPath;
                const content = fs.readFileSync(filePath).toString();
                const scriptSource = module.wrap(content.replace(/^#!.*/, ''));
                const script = new vm.Script(scriptSource);
                const compileWrapper = script.runInThisContext();
                compileWrapper.apply();
                return this._defineCalls.pop();
            }
            catch (error) {
                throw error;
            }
        }
    }
    const cache = new Map();
    let _paths = {};
    if (typeof globalThis.require === 'object') {
        _paths = globalThis.require.paths ?? {};
    }
    /**
     * Utility for importing an AMD node module. This util supports AMD and ESM contexts and should be used while the ESM adoption
     * is on its way.
     *
     * e.g. pass in `vscode-textmate/release/main.js`
     */
    async function importAMDNodeModule(nodeModuleName, pathInsideNodeModule, isBuilt) {
        if (amd_1.isESM) {
            if (isBuilt === undefined) {
                const product = globalThis._VSCODE_PRODUCT_JSON;
                isBuilt = Boolean((product ?? globalThis.vscode?.context?.configuration()?.product)?.commit);
            }
            if (_paths[nodeModuleName]) {
                nodeModuleName = _paths[nodeModuleName];
            }
            const nodeModulePath = `${nodeModuleName}/${pathInsideNodeModule}`;
            if (cache.has(nodeModulePath)) {
                return cache.get(nodeModulePath);
            }
            let scriptSrc;
            if (/^\w[\w\d+.-]*:\/\//.test(nodeModulePath)) {
                // looks like a URL
                // bit of a special case for: src/vs/workbench/services/languageDetection/browser/languageDetectionSimpleWorker.ts
                scriptSrc = nodeModulePath;
            }
            else {
                const useASAR = (isBuilt && !platform.isWeb);
                const actualNodeModulesPath = (useASAR ? network_1.nodeModulesAsarPath : network_1.nodeModulesPath);
                const resourcePath = `${actualNodeModulesPath}/${nodeModulePath}`;
                scriptSrc = network_1.FileAccess.asBrowserUri(resourcePath).toString(true);
            }
            const result = AMDModuleImporter.INSTANCE.load(scriptSrc);
            cache.set(nodeModulePath, result);
            return result;
        }
        else {
            return await new Promise((resolve_1, reject_1) => { require([nodeModuleName], resolve_1, reject_1); });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1kWC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYW1kWC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQThLaEcsa0RBaUNDO0lBdE1ELE1BQU0sVUFBVTtRQUNmLFlBQ2lCLEVBQTZCLEVBQzdCLFlBQXlDLEVBQ3pDLFFBQWE7WUFGYixPQUFFLEdBQUYsRUFBRSxDQUEyQjtZQUM3QixpQkFBWSxHQUFaLFlBQVksQ0FBNkI7WUFDekMsYUFBUSxHQUFSLFFBQVEsQ0FBSztRQUMxQixDQUFDO0tBQ0w7SUFFRCxNQUFNLGlCQUFpQjtpQkFDUixhQUFRLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxBQUExQixDQUEyQjtRQVdqRDtZQVRpQixpQkFBWSxHQUFHLENBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssNEJBQTRCLENBQUMsQ0FBQztZQUN4SCxnQkFBVyxHQUFHLE9BQU8sUUFBUSxLQUFLLFFBQVEsQ0FBQztZQUUzQyxpQkFBWSxHQUFpQixFQUFFLENBQUM7WUFDekMsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFLYixDQUFDO1FBRVQsV0FBVztZQUNsQixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdkIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUVuQixVQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBTyxFQUFFLFlBQWlCLEVBQUUsUUFBYSxFQUFFLEVBQUU7Z0JBQ3hFLElBQUksT0FBTyxFQUFFLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQzVCLFFBQVEsR0FBRyxZQUFZLENBQUM7b0JBQ3hCLFlBQVksR0FBRyxFQUFFLENBQUM7b0JBQ2xCLEVBQUUs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