/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/trustedTypes", "vs/base/common/errors", "vs/base/common/network", "vs/base/common/worker/simpleWorker", "vs/base/common/lifecycle"], function (require, exports, trustedTypes_1, errors_1, network_1, simpleWorker_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultWorkerFactory = void 0;
    exports.createBlobWorker = createBlobWorker;
    exports.getWorkerBootstrapUrl = getWorkerBootstrapUrl;
    const ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('defaultWorkerFactory', { createScriptURL: value => value });
    function createBlobWorker(blobUrl, options) {
        if (!blobUrl.startsWith('blob:')) {
            throw new URIError('Not a blob-url: ' + blobUrl);
        }
        return new Worker(ttPolicy ? ttPolicy.createScriptURL(blobUrl) : blobUrl, options);
    }
    function getWorker(label) {
        const monacoEnvironment = globalThis.MonacoEnvironment;
        if (monacoEnvironment) {
            if (typeof monacoEnvironment.getWorker === 'function') {
                return monacoEnvironment.getWorker('workerMain.js', label);
            }
            if (typeof monacoEnvironment.getWorkerUrl === 'function') {
                const workerUrl = monacoEnvironment.getWorkerUrl('workerMain.js', label);
                return new Worker(ttPolicy ? ttPolicy.createScriptURL(workerUrl) : workerUrl, { name: label });
            }
        }
        // ESM-comment-begin
        if (typeof require === 'function') {
            // check if the JS lives on a different origin
            const workerMain = require.toUrl('vs/base/worker/workerMain.js'); // explicitly using require.toUrl(), see https://github.com/microsoft/vscode/issues/107440#issuecomment-698982321
            const workerUrl = getWorkerBootstrapUrl(workerMain, label);
            return new Worker(ttPolicy ? ttPolicy.createScriptURL(workerUrl) : workerUrl, { name: label });
        }
        // ESM-comment-end
        throw new Error(`You must define a function MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker`);
    }
    // ESM-comment-begin
    function getWorkerBootstrapUrl(scriptPath, label) {
        if (/^((http:)|(https:)|(file:))/.test(scriptPath) && scriptPath.substring(0, globalThis.origin.length) !== globalThis.origin) {
            // this is the cross-origin case
            // i.e. the webpage is running at a different origin than where the scripts are loaded from
            const myPath = 'vs/base/worker/defaultWorkerFactory.js';
            const workerBaseUrl = require.toUrl(myPath).slice(0, -myPath.length); // explicitly using require.toUrl(), see https://github.com/microsoft/vscode/issues/107440#issuecomment-698982321
            const js = `/*${label}*/globalThis.MonacoEnvironment={baseUrl: '${workerBaseUrl}'};const ttPolicy = globalThis.trustedTypes?.createPolicy('defaultWorkerFactory', { createScriptURL: value => value });importScripts(ttPolicy?.createScriptURL('${scriptPath}') ?? '${scriptPath}');/*${label}*/`;
            const blob = new Blob([js], { type: 'application/javascript' });
            return URL.createObjectURL(blob);
        }
        const start = scriptPath.lastIndexOf('?');
        const end = scriptPath.lastIndexOf('#', start);
        const params = start > 0
            ? new URLSearchParams(scriptPath.substring(start + 1, ~end ? end : undefined))
            : new URLSearchParams();
        network_1.COI.addSearchParam(params, true, true);
        const search = params.toString();
        if (!search) {
            return `${scriptPath}#${label}`;
        }
        else {
            return `${scriptPath}?${params.toString()}#${label}`;
        }
    }
    // ESM-comment-end
    function isPromiseLike(obj) {
        if (typeof obj.then === 'function') {
            return true;
        }
        return false;
    }
    /**
     * A worker that uses HTML5 web workers so that is has
     * its own global scope and its own thread.
     */
    class WebWorker extends lifecycle_1.Disposable {
        constructor(moduleId, id, label, onMessageCallback, onErrorCallback) {
            super();
            this.id = id;
            this.label = label;
            const workerOrPromise = getWorker(label);
            if (isPromiseLike(workerOrPromise)) {
                this.worker = workerOrPromise;
            }
            else {
                this.worker = Promise.resolve(workerOrPromise);
            }
            this.postMessage(moduleId, []);
            this.worker.then((w) => {
                w.onmessage = function (ev) {
                    onMessageCallback(ev.data);
                };
                w.onmessageerror = onErrorCallback;
                if (typeof w.addEventListener === 'function') {
                    w.addEventListener('error', onErrorCallback);
                }
            });
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.worker?.then(w => {
                    w.onmessage = null;
                    w.onmessageerror = null;
                    w.removeEventListener('error', onErrorCallback);
                    w.terminate();
                });
                this.worker = null;
            }));
        }
        getId() {
            return this.id;
        }
        postMessage(message, transfer) {
            this.worker?.then(w => {
                try {
                    w.postMessage(message, transfer);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                    (0, errors_1.onUnexpectedError)(new Error(`FAILED to post message to '${this.label}'-worker`, { cause: err }));
                }
            });
        }
    }
    class DefaultWorkerFactory {
        static { this.LAST_WORKER_ID = 0; }
        constructor(label) {
            this._label = label;
            this._webWorkerFailedBeforeError = false;
        }
        create(moduleId, onMessageCallback, onErrorCallback) {
            const workerId = (++DefaultWorkerFactory.LAST_WORKER_ID);
            if (this._webWorkerFailedBeforeError) {
                throw this._webWorkerFailedBeforeError;
            }
            return new WebWorker(moduleId, workerId, this._label || 'anonymous' + workerId, onMessageCallback, (err) => {
                (0, simpleWorker_1.logOnceWebWorkerWarning)(err);
                this._webWorkerFailedBeforeError = err;
                onErrorCallback(err);
            });
        }
    }
    exports.DefaultWorkerFactory = DefaultWorkerFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdFdvcmtlckZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9kZWZhdWx0V29ya2VyRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsNENBS0M7SUE4QkQsc0RBeUJDO0lBOURELE1BQU0sUUFBUSxHQUFHLElBQUEsdUNBQXdCLEVBQUMsc0JBQXNCLEVBQUUsRUFBRSxlQUFlLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBRXZHLFNBQWdCLGdCQUFnQixDQUFDLE9BQWUsRUFBRSxPQUF1QjtRQUN4RSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sSUFBSSxRQUFRLENBQUMsa0JBQWtCLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUNELE9BQU8sSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBc0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pHLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFhO1FBTS9CLE1BQU0saUJBQWlCLEdBQW9DLFVBQWtCLENBQUMsaUJBQWlCLENBQUM7UUFDaEcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3ZCLElBQUksT0FBTyxpQkFBaUIsQ0FBQyxTQUFTLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3ZELE9BQU8saUJBQWlCLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsSUFBSSxPQUFPLGlCQUFpQixDQUFDLFlBQVksS0FBSyxVQUFVLEVBQUUs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