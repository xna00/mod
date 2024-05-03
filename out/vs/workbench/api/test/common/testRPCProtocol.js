/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/services/extensions/common/rpcProtocol"], function (require, exports, async_1, proxyIdentifier_1, rpcProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestRPCProtocol = void 0;
    exports.SingleProxyRPCProtocol = SingleProxyRPCProtocol;
    exports.AnyCallRPCProtocol = AnyCallRPCProtocol;
    function SingleProxyRPCProtocol(thing) {
        return {
            _serviceBrand: undefined,
            remoteAuthority: null,
            getProxy() {
                return thing;
            },
            set(identifier, value) {
                return value;
            },
            dispose: undefined,
            assertRegistered: undefined,
            drain: undefined,
            extensionHostKind: 1 /* ExtensionHostKind.LocalProcess */
        };
    }
    /** Makes a fake {@link SingleProxyRPCProtocol} on which any method can be called */
    function AnyCallRPCProtocol(useCalls) {
        return SingleProxyRPCProtocol(new Proxy({}, {
            get(_target, prop) {
                if (useCalls && prop in useCalls) {
                    return useCalls[prop];
                }
                return () => Promise.resolve(undefined);
            }
        }));
    }
    class TestRPCProtocol {
        constructor() {
            this.remoteAuthority = null;
            this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
            this._callCountValue = 0;
            this._locals = Object.create(null);
            this._proxies = Object.create(null);
        }
        drain() {
            return Promise.resolve();
        }
        get _callCount() {
            return this._callCountValue;
        }
        set _callCount(value) {
            this._callCountValue = value;
            if (this._callCountValue === 0) {
                this._completeIdle?.();
                this._idle = undefined;
            }
        }
        sync() {
            return new Promise((c) => {
                setTimeout(c, 0);
            }).then(() => {
                if (this._callCount === 0) {
                    return undefined;
                }
                if (!this._idle) {
                    this._idle = new Promise((c, e) => {
                        this._completeIdle = c;
                    });
                }
                return this._idle;
            });
        }
        getProxy(identifier) {
            if (!this._proxies[identifier.sid]) {
                this._proxies[identifier.sid] = this._createProxy(identifier.sid);
            }
            return this._proxies[identifier.sid];
        }
        _createProxy(proxyId) {
            const handler = {
                get: (target, name) => {
                    if (typeof name === 'string' && !target[name] && name.charCodeAt(0) === 36 /* CharCode.DollarSign */) {
                        target[name] = (...myArgs) => {
                            return this._remoteCall(proxyId, name, myArgs);
                        };
                    }
                    return target[name];
                }
            };
            return new Proxy(Object.create(null), handler);
        }
        set(identifier, value) {
            this._locals[identifier.sid] = value;
            return value;
        }
        _remoteCall(proxyId, path, args) {
            this._callCount++;
            return new Promise((c) => {
                setTimeout(c, 0);
            }).then(() => {
                const instance = this._locals[proxyId];
                // pretend the args went over the wire... (invoke .toJSON on objects...)
                const wireArgs = simulateWireTransfer(args);
                let p;
                try {
                    const result = instance[path].apply(instance, wireArgs);
                    p = (0, async_1.isThenable)(result) ? result : Promise.resolve(result);
                }
                catch (err) {
                    p = Promise.reject(err);
                }
                return p.then(result => {
                    this._callCount--;
                    // pretend the result went over the wire... (invoke .toJSON on objects...)
                    const wireResult = simulateWireTransfer(result);
                    return wireResult;
                }, err => {
                    this._callCount--;
                    return Promise.reject(err);
                });
            });
        }
        dispose() {
            throw new Error('Not implemented!');
        }
        assertRegistered(identifiers) {
            throw new Error('Not implemented!');
        }
    }
    exports.TestRPCProtocol = TestRPCProtocol;
    function simulateWireTransfer(obj) {
        if (!obj) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(simulateWireTransfer);
        }
        if (obj instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
            const { jsonString, referencedBuffers } = (0, rpcProtocol_1.stringifyJsonWithBufferRefs)(obj);
            return (0, rpcProtocol_1.parseJsonAndRestoreBufferRefs)(jsonString, referencedBuffers, null);
        }
        else {
            return JSON.parse(JSON.stringify(obj));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJQQ1Byb3RvY29sLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvY29tbW9uL3Rlc3RSUENQcm90b2NvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsd0RBZUM7SUFHRCxnREFTQztJQTNCRCxTQUFnQixzQkFBc0IsQ0FBQyxLQUFVO1FBQ2hELE9BQU87WUFDTixhQUFhLEVBQUUsU0FBUztZQUN4QixlQUFlLEVBQUUsSUFBSztZQUN0QixRQUFRO2dCQUNQLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELEdBQUcsQ0FBaUIsVUFBOEIsRUFBRSxLQUFRO2dCQUMzRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxPQUFPLEVBQUUsU0FBVTtZQUNuQixnQkFBZ0IsRUFBRSxTQUFVO1lBQzVCLEtBQUssRUFBRSxTQUFVO1lBQ2pCLGlCQUFpQix3Q0FBZ0M7U0FDakQsQ0FBQztJQUNILENBQUM7SUFFRCxvRkFBb0Y7SUFDcEYsU0FBZ0Isa0JBQWtCLENBQUksUUFBbUM7UUFDeEUsT0FBTyxzQkFBc0IsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDM0MsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFZO2dCQUN4QixJQUFJLFFBQVEsSUFBSSxJQUFJLElBQUksUUFBUSxFQUFFLENBQUM7b0JBQ2xDLE9BQVEsUUFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztnQkFDRCxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDekMsQ0FBQztTQUNELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQWEsZUFBZTtRQWEzQjtZQVZPLG9CQUFlLEdBQUcsSUFBSyxDQUFDO1lB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