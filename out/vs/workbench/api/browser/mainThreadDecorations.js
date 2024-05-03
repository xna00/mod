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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/decorations/common/decorations", "vs/base/common/cancellation"], function (require, exports, uri_1, event_1, lifecycle_1, extHost_protocol_1, extHostCustomers_1, decorations_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDecorations = void 0;
    class DecorationRequestsQueue {
        constructor(_proxy, _handle) {
            this._proxy = _proxy;
            this._handle = _handle;
            this._idPool = 0;
            this._requests = new Map();
            this._resolver = new Map();
            //
        }
        enqueue(uri, token) {
            const id = ++this._idPool;
            const result = new Promise(resolve => {
                this._requests.set(id, { id, uri });
                this._resolver.set(id, resolve);
                this._processQueue();
            });
            const sub = token.onCancellationRequested(() => {
                this._requests.delete(id);
                this._resolver.delete(id);
            });
            return result.finally(() => sub.dispose());
        }
        _processQueue() {
            if (typeof this._timer === 'number') {
                // already queued
                return;
            }
            this._timer = setTimeout(() => {
                // make request
                const requests = this._requests;
                const resolver = this._resolver;
                this._proxy.$provideDecorations(this._handle, [...requests.values()], cancellation_1.CancellationToken.None).then(data => {
                    for (const [id, resolve] of resolver) {
                        resolve(data[id]);
                    }
                });
                // reset
                this._requests = new Map();
                this._resolver = new Map();
                this._timer = undefined;
            }, 0);
        }
    }
    let MainThreadDecorations = class MainThreadDecorations {
        constructor(context, _decorationsService) {
            this._decorationsService = _decorationsService;
            this._provider = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDecorations);
        }
        dispose() {
            this._provider.forEach(value => (0, lifecycle_1.dispose)(value));
            this._provider.clear();
        }
        $registerDecorationProvider(handle, label) {
            const emitter = new event_1.Emitter();
            const queue = new DecorationRequestsQueue(this._proxy, handle);
            const registration = this._decorationsService.registerDecorationsProvider({
                label,
                onDidChange: emitter.event,
                provideDecorations: async (uri, token) => {
                    const data = await queue.enqueue(uri, token);
                    if (!data) {
                        return undefined;
                    }
                    const [bubble, tooltip, letter, themeColor] = data;
                    return {
                        weight: 10,
                        bubble: bubble ?? false,
                        color: themeColor?.id,
                        tooltip,
                        letter
                    };
                }
            });
            this._provider.set(handle, [emitter, registration]);
        }
        $onDidChange(handle, resources) {
            const provider = this._provider.get(handle);
            if (provider) {
                const [emitter] = provider;
                emitter.fire(resources && resources.map(r => uri_1.URI.revive(r)));
            }
        }
        $unregisterDecorationProvider(handle) {
            const provider = this._provider.get(handle);
            if (provider) {
                (0, lifecycle_1.dispose)(provider);
                this._provider.delete(handle);
            }
        }
    };
    exports.MainThreadDecorations = MainThreadDecorations;
    exports.MainThreadDecorations = MainThreadDecorations = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDecorations),
        __param(1, decorations_1.IDecorationsService)
    ], MainThreadDecorations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZERlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxNQUFNLHVCQUF1QjtRQVE1QixZQUNrQixNQUErQixFQUMvQixPQUFlO1lBRGYsV0FBTSxHQUFOLE1BQU0sQ0FBeUI7WUFDL0IsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQVJ6QixZQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ1osY0FBUyxHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO1lBQ2pELGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztZQVFwRSxFQUFFO1FBQ0gsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFRLEVBQUUsS0FBd0I7WUFDekMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUksT0FBTyxDQUFpQixPQUFPLENBQUMsRUFBRTtnQkFDcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtnQkFDOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxT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