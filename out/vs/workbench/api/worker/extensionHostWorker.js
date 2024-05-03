/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/api/common/extensionHostMain", "vs/workbench/services/extensions/worker/polyfillNestedWorker", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/api/common/extHost.common.services", "vs/workbench/api/worker/extHost.worker.services"], function (require, exports, buffer_1, event_1, extensionHostProtocol_1, extensionHostMain_1, polyfillNestedWorker_1, path, performance, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = create;
    const nativeClose = self.close.bind(self);
    self.close = () => console.trace(`'close' has been blocked`);
    const nativePostMessage = postMessage.bind(self);
    self.postMessage = () => console.trace(`'postMessage' has been blocked`);
    function shouldTransformUri(uri) {
        // In principle, we could convert any URI, but we have concerns
        // that parsing https URIs might end up decoding escape characters
        // and result in an unintended transformation
        return /^(file|vscode-remote):/i.test(uri);
    }
    const nativeFetch = fetch.bind(self);
    function patchFetching(asBrowserUri) {
        self.fetch = async function (input, init) {
            if (input instanceof Request) {
                // Request object - massage not supported
                return nativeFetch(input, init);
            }
            if (shouldTransformUri(String(input))) {
                input = (await asBrowserUri(uri_1.URI.parse(String(input)))).toString(true);
            }
            return nativeFetch(input, init);
        };
        self.XMLHttpRequest = class extends XMLHttpRequest {
            open(method, url, async, username, password) {
                (async () => {
                    if (shouldTransformUri(url.toString())) {
                        url = (await asBrowserUri(uri_1.URI.parse(url.toString()))).toString(true);
                    }
                    super.open(method, url, async ?? true, username, password);
                })();
            }
        };
    }
    self.importScripts = () => { throw new Error(`'importScripts' has been blocked`); };
    // const nativeAddEventListener = addEventListener.bind(self);
    self.addEventListener = () => console.trace(`'addEventListener' has been blocked`);
    self['AMDLoader'] = undefined;
    self['NLSLoaderPlugin'] = undefined;
    self['define'] = undefined;
    self['require'] = undefined;
    self['webkitRequestFileSystem'] = undefined;
    self['webkitRequestFileSystemSync'] = undefined;
    self['webkitResolveLocalFileSystemSyncURL'] = undefined;
    self['webkitResolveLocalFileSystemURL'] = undefined;
    if (self.Worker) {
        // make sure new Worker(...) always uses blob: (to maintain current origin)
        const _Worker = self.Worker;
        Worker = function (stringUrl, options) {
            if (/^file:/i.test(stringUrl.toString())) {
                stringUrl = network_1.FileAccess.uriToBrowserUri(uri_1.URI.parse(stringUrl.toString())).toString(true);
            }
            else if (/^vscode-remote:/i.test(stringUrl.toString())) {
                // Supporting transformation of vscode-remote URIs requires an async call to the main thread,
                // but we cannot do this call from within the embedded Worker, and the only way out would be
                // to use templating instead of a function in the web api (`resourceUriProvider`)
                throw new Error(`Creating workers from remote extensions is currently not supported.`);
            }
            // IMPORTANT: bootstrapFn is stringified and injected as worker blob-url. Because of that it CANNOT
            // have dependencies on other functions or variables. Only constant values are supported. Due to
            // that logic of FileAccess.asBrowserUri had to be copied, see `asWorkerBrowserUrl` (below).
            const bootstrapFnSource = (function bootstrapFn(workerUrl) {
                function asWorkerBrowserUrl(url) {
                    if (typeof url === 'string' || url instanceof URL) {
                        return String(url).replace(/^file:\/\//i, 'vscode-file://vscode-app');
                    }
                    return url;
                }
                const nativeFetch = fetch.bind(self);
                self.fetch = function (input, init) {
                    if (input instanceof Request) {
                        // Request object - massage not supported
                        return nativeFetch(input, init);
                    }
                    return nativeFetch(asWorkerBrowserUrl(input), init);
                };
                self.XMLHttpRequest = class extends XMLHttpRequest {
                    open(method, url, async, username, password) {
                        return super.open(method, asWorkerBrowserUrl(url), async ?? true, username, password);
                    }
                };
                const nativeImportScripts = importScripts.bind(self);
                self.importScripts = (...urls) => {
                    nativeImportScripts(...urls.map(asWorkerBrowserUrl));
                };
                nativeImportScripts(workerUrl);
            }).toString();
            const js = `(${bootstrapFnSource}('${stringUrl}'))`;
            options = options || {};
            options.name = `${name} -> ${options.name || path.basename(stringUrl.toString())}`;
            const blob = new Blob([js], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            return new _Worker(blobUrl, options);
        };
    }
    else {
        self.Worker = class extends polyfillNestedWorker_1.NestedWorker {
            constructor(stringOrUrl, options) {
                super(nativePostMessage, stringOrUrl, { name: path.basename(stringOrUrl.toString()), ...options });
            }
        };
    }
    //#endregion ---
    const hostUtil = new class {
        constructor() {
            this.pid = undefined;
        }
        exit(_code) {
            nativeClose();
        }
    };
    class ExtensionWorker {
        constructor() {
            const channel = new MessageChannel();
            const emitter = new event_1.Emitter();
            let terminating = false;
            // send over port2, keep port1
            nativePostMessage(channel.port2, [channel.port2]);
            channel.port1.onmessage = event => {
                const { data } = event;
                if (!(data instanceof ArrayBuffer)) {
                    console.warn('UNKNOWN data received', data);
                    return;
                }
                const msg = buffer_1.VSBuffer.wrap(new Uint8Array(data, 0, data.byteLength));
                if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 2 /* MessageType.Terminate */)) {
                    // handle terminate-message right here
                    terminating = true;
                    onTerminate('received terminate message from renderer');
                    return;
                }
                // emit non-terminate messages to the outside
                emitter.fire(msg);
            };
            this.protocol = {
                onMessage: emitter.event,
                send: vsbuf => {
                    if (!terminating) {
                        const data = vsbuf.buffer.buffer.slice(vsbuf.buffer.byteOffset, vsbuf.buffer.byteOffset + vsbuf.buffer.byteLength);
                        channel.port1.postMessage(data, [data]);
                    }
                }
            };
        }
    }
    function connectToRenderer(protocol) {
        return new Promise(resolve => {
            const once = protocol.onMessage(raw => {
                once.dispose();
                const initData = JSON.parse(raw.toString());
                protocol.send((0, extensionHostProtocol_1.createMessageOfType)(0 /* MessageType.Initialized */));
                resolve({ protocol, initData });
            });
            protocol.send((0, extensionHostProtocol_1.createMessageOfType)(1 /* MessageType.Ready */));
        });
    }
    let onTerminate = (reason) => nativeClose();
    function isInitMessage(a) {
        return !!a && typeof a === 'object' && a.type === 'vscode.init' && a.data instanceof Map;
    }
    function create() {
        performance.mark(`code/extHost/willConnectToRenderer`);
        const res = new ExtensionWorker();
        return {
            onmessage(message) {
                if (!isInitMessage(message)) {
                    return; // silently ignore foreign messages
                }
                connectToRenderer(res.protocol).then(data => {
                    performance.mark(`code/extHost/didWaitForInitData`);
                    const extHostMain = new extensionHostMain_1.ExtensionHostMain(data.protocol, data.initData, hostUtil, null, message.data);
                    patchFetching(uri => extHostMain.asBrowserUri(uri));
                    onTerminate = (reason) => extHostMain.terminate(reason);
                });
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFdvcmtlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS93b3JrZXIvZXh0ZW5zaW9uSG9zdFdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXlPaEcsd0JBMEJDO0lBL05ELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFDLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRTdELE1BQU0saUJBQWlCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqRCxJQUFJLENBQUMsV0FBVyxHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUV6RSxTQUFTLGtCQUFrQixDQUFDLEdBQVc7UUFDdEMsK0RBQStEO1FBQy9ELGtFQUFrRTtRQUNsRSw2Q0FBNkM7UUFDN0MsT0FBTyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsU0FBUyxhQUFhLENBQUMsWUFBd0M7UUFDOUQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLFdBQVcsS0FBSyxFQUFFLElBQUk7WUFDdkMsSUFBSSxLQUFLLFlBQVksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLHlDQUF5QztnQkFDekMsT0FBTyxXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pDLENBQUM7WUFDRCxJQUFJLGtCQUFrQixDQUFD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