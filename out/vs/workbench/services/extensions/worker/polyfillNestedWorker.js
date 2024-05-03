/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NestedWorker = void 0;
    const _bootstrapFnSource = (function _bootstrapFn(workerUrl) {
        const listener = (event) => {
            // uninstall handler
            globalThis.removeEventListener('message', listener);
            // get data
            const port = event.data;
            // postMessage
            // onmessage
            Object.defineProperties(globalThis, {
                'postMessage': {
                    value(data, transferOrOptions) {
                        port.postMessage(data, transferOrOptions);
                    }
                },
                'onmessage': {
                    get() {
                        return port.onmessage;
                    },
                    set(value) {
                        port.onmessage = value;
                    }
                }
                // todo onerror
            });
            port.addEventListener('message', msg => {
                globalThis.dispatchEvent(new MessageEvent('message', { data: msg.data, ports: msg.ports ? [...msg.ports] : undefined }));
            });
            port.start();
            // fake recursively nested worker
            globalThis.Worker = class {
                constructor() { throw new TypeError('Nested workers from within nested worker are NOT supported.'); }
            };
            // load module
            importScripts(workerUrl);
        };
        globalThis.addEventListener('message', listener);
    }).toString();
    class NestedWorker extends EventTarget {
        constructor(nativePostMessage, stringOrUrl, options) {
            super();
            this.onmessage = null;
            this.onmessageerror = null;
            this.onerror = null;
            // create bootstrap script
            const bootstrap = `((${_bootstrapFnSource})('${stringOrUrl}'))`;
            const blob = new Blob([bootstrap], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            const channel = new MessageChannel();
            const id = blobUrl; // works because blob url is unique, needs ID pool otherwise
            const msg = {
                type: '_newWorker',
                id,
                port: channel.port2,
                url: blobUrl,
                options,
            };
            nativePostMessage(msg, [channel.port2]);
            // worker-impl: functions
            this.postMessage = channel.port1.postMessage.bind(channel.port1);
            this.terminate = () => {
                const msg = {
                    type: '_terminateWorker',
                    id
                };
                nativePostMessage(msg);
                URL.revokeObjectURL(blobUrl);
                channel.port1.close();
                channel.port2.close();
            };
            // worker-impl: events
            Object.defineProperties(this, {
                'onmessage': {
                    get() {
                        return channel.port1.onmessage;
                    },
                    set(value) {
                        channel.port1.onmessage = value;
                    }
                },
                'onmessageerror': {
                    get() {
                        return channel.port1.onmessageerror;
                    },
                    set(value) {
                        channel.port1.onmessageerror = value;
                    }
                },
                // todo onerror
            });
            channel.port1.addEventListener('messageerror', evt => {
                const msgEvent = new MessageEvent('messageerror', { data: evt.data });
                this.dispatchEvent(msgEvent);
            });
            channel.port1.addEventListener('message', evt => {
                const msgEvent = new MessageEvent('message', { data: evt.data });
                this.dispatchEvent(msgEvent);
            });
            channel.port1.start();
        }
    }
    exports.NestedWorker = NestedWorker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9seWZpbGxOZXN0ZWRXb3JrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL3dvcmtlci9wb2x5ZmlsbE5lc3RlZFdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLFNBQVMsWUFBWSxDQUFDLFNBQWlCO1FBRWxFLE1BQU0sUUFBUSxHQUFrQixDQUFDLEtBQVksRUFBUSxFQUFFO1lBQ3RELG9CQUFvQjtZQUNwQixVQUFVLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXBELFdBQVc7WUFDWCxNQUFNLElBQUksR0FBK0IsS0FBTSxDQUFDLElBQUksQ0FBQztZQUVyRCxjQUFjO1lBQ2QsWUFBWTtZQUNaLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUU7Z0JBQ25DLGFBQWEsRUFBRTtvQkFDZCxLQUFLLENBQUMsSUFBUyxFQUFFLGlCQUF1Qjt3QkFDdkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztvQkFDM0MsQ0FBQztpQkFDRDtnQkFDRCxXQUFXLEVBQUU7b0JBQ1osR0FBRzt3QkFDRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ3ZCLENBQUM7b0JBQ0QsR0FBRyxDQUFDLEtBQTBCO3dCQUM3QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztvQkFDeEIsQ0FBQztpQkFDRDtnQkFDRCxlQUFlO2FBQ2YsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDdEMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFlBQVksQ0FBQyxTQUFTLEVB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