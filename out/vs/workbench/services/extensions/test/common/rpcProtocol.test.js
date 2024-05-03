/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/services/extensions/common/rpcProtocol"], function (require, exports, assert, buffer_1, cancellation_1, event_1, lifecycle_1, utils_1, proxyIdentifier_1, rpcProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RPCProtocol', () => {
        let disposables;
        class MessagePassingProtocol {
            constructor() {
                this._onMessage = new event_1.Emitter();
                this.onMessage = this._onMessage.event;
            }
            setPair(other) {
                this._pair = other;
            }
            send(buffer) {
                Promise.resolve().then(() => {
                    this._pair._onMessage.fire(buffer);
                });
            }
        }
        let delegate;
        let bProxy;
        class BClass {
            $m(a1, a2) {
                return Promise.resolve(delegate.call(null, a1, a2));
            }
        }
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const a_protocol = new MessagePassingProtocol();
            const b_protocol = new MessagePassingProtocol();
            a_protocol.setPair(b_protocol);
            b_protocol.setPair(a_protocol);
            const A = disposables.add(new rpcProtocol_1.RPCProtocol(a_protocol));
            const B = disposables.add(new rpcProtocol_1.RPCProtocol(b_protocol));
            const bIdentifier = new proxyIdentifier_1.ProxyIdentifier('bb');
            const bInstance = new BClass();
            B.set(bIdentifier, bInstance);
            bProxy = A.getProxy(bIdentifier);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('simple call', function (done) {
            delegate = (a1, a2) => a1 + a2;
            bProxy.$m(4, 1).then((res) => {
                assert.strictEqual(res, 5);
                done(null);
            }, done);
        });
        test('simple call without result', function (done) {
            delegate = (a1, a2) => { };
            bProxy.$m(4, 1).then((res) => {
                assert.strictEqual(res, undefined);
                done(null);
            }, done);
        });
        test('passing buffer as argument', function (done) {
            delegate = (a1, a2) => {
                assert.ok(a1 instanceof buffer_1.VSBuffer);
                return a1.buffer[a2];
            };
            const b = buffer_1.VSBuffer.alloc(4);
            b.buffer[0] = 1;
            b.buffer[1] = 2;
            b.buffer[2] = 3;
            b.buffer[3] = 4;
            bProxy.$m(b, 2).then((res) => {
                assert.strictEqual(res, 3);
                done(null);
            }, done);
        });
        test('returning a buffer', function (done) {
            delegate = (a1, a2) => {
                const b = buffer_1.VSBuffer.alloc(4);
                b.buffer[0] = 1;
                b.buffer[1] = 2;
                b.buffer[2] = 3;
                b.buffer[3] = 4;
                return b;
            };
            bProxy.$m(4, 1).then((res) => {
                assert.ok(res instanceof buffer_1.VSBuffer);
                assert.strictEqual(res.buffer[0], 1);
                assert.strictEqual(res.buffer[1], 2);
                assert.strictEqual(res.buffer[2], 3);
                assert.strictEqual(res.buffer[3], 4);
                done(null);
            }, done);
        });
        test('cancelling a call via CancellationToken before', function (done) {
            delegate = (a1, a2) => a1 + a2;
            const p = bProxy.$m(4, cancellation_1.CancellationToken.Cancelled);
            p.then((res) => {
                assert.fail('should not receive result');
            }, (err) => {
                assert.ok(true);
                done(null);
            });
        });
        test('passing CancellationToken.None', function (done) {
            delegate = (a1, token) => {
                assert.ok(!!token);
                return a1 + 1;
            };
            bProxy.$m(4, cancellation_1.CancellationToken.None).then((res) => {
                assert.strictEqual(res, 5);
                done(null);
            }, done);
        });
        test('cancelling a call via CancellationToken quickly', function (done) {
            // this is an implementation which, when cancellation is triggered, will return 7
            delegate = (a1, token) => {
                return new Promise((resolve, reject) => {
                    const disposable = token.onCancellationRequested((e) => {
                        disposable.dispose();
                        resolve(7);
                    });
                });
            };
            const tokenSource = new cancellation_1.CancellationTokenSource();
            const p = bProxy.$m(4, tokenSource.token);
            p.then((res) => {
                assert.strictEqual(res, 7);
            }, (err) => {
                assert.fail('should not receive error');
            }).finally(done);
            tokenSource.cancel();
        });
        test('throwing an error', function (done) {
            delegate = (a1, a2) => {
                throw new Error(`nope`);
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
            }, (err) => {
                assert.strictEqual(err.message, 'nope');
            }).finally(done);
        });
        test('error promise', function (done) {
            delegate = (a1, a2) => {
                return Promise.reject(undefined);
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
            }, (err) => {
                assert.strictEqual(err, undefined);
            }).finally(done);
        });
        test('issue #60450: Converting circular structure to JSON', function (done) {
            delegate = (a1, a2) => {
                const circular = {};
                circular.self = circular;
                return circular;
            };
            bProxy.$m(4, 1).then((res) => {
                assert.strictEqual(res, null);
            }, (err) => {
                assert.fail('unexpected');
            }).finally(done);
        });
        test('issue #72798: null errors are hard to digest', function (done) {
            delegate = (a1, a2) => {
                // eslint-disable-next-line no-throw-literal
                throw { 'what': 'what' };
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
            }, (err) => {
                assert.strictEqual(err.what, 'what');
            }).finally(done);
        });
        test('undefined arguments arrive as null', function () {
            delegate = (a1, a2) => {
                assert.strictEqual(typeof a1, 'undefined');
                assert.strictEqual(a2, null);
                return 7;
            };
            return bProxy.$m(undefined, null).then((res) => {
                assert.strictEqual(res, 7);
            });
        });
        test('issue #81424: SerializeRequest should throw if an argument can not be serialized', () => {
            const badObject = {};
            badObject.loop = badObject;
            assert.throws(() => {
                bProxy.$m(badObject, '2');
            });
        });
        test('SerializableObjectWithBuffers is correctly transfered', function (done) {
            delegate = (a1, a2) => {
                return new proxyIdentifier_1.SerializableObjectWithBuffers({ string: a1.value.string + ' world', buff: a1.value.buff });
            };
            const b = buffer_1.VSBuffer.alloc(4);
            b.buffer[0] = 1;
            b.buffer[1] = 2;
            b.buffer[2] = 3;
            b.buffer[3] = 4;
            bProxy.$m(new proxyIdentifier_1.SerializableObjectWithBuffers({ string: 'hello', buff: b }), undefined).then((res) => {
                assert.ok(res instanceof proxyIdentifier_1.SerializableObjectWithBuffers);
                assert.strictEqual(res.value.string, 'hello world');
                assert.ok(res.value.buff instanceof buffer_1.VSBuffer);
                const bufferValues = Array.from(res.value.buff.buffer);
                assert.strictEqual(bufferValues[0], 1);
                assert.strictEqual(bufferValues[1], 2);
                assert.strictEqual(bufferValues[2], 3);
                assert.strictEqual(bufferValues[3], 4);
                done(null);
            }, done);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnBjUHJvdG9jb2wudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvdGVzdC9jb21tb24vcnBjUHJvdG9jb2wudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtRQUV6QixJQUFJLFdBQTRCLENBQUM7UUFFakMsTUFBTSxzQkFBc0I7WUFBNUI7Z0JBR2tCLGVBQVUsR0FBRyxJQUFJLGVBQU8sRUFBWSxDQUFDO2dCQUN0QyxjQUFTLEdBQW9CLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBV3BFLENBQUM7WUFUTyxPQUFPLENBQUMsS0FBNkI7Z0JBQzNDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLENBQUM7WUFFTSxJQUFJLENBQUMsTUFBZ0I7Z0JBQzNCLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO29CQUMzQixJQUFJLENBQUMsS0FBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztTQUNEO1FBRUQsSUFBSSxRQUFtQyxDQUFDO1FBQ3hDLElBQUksTUFBYyxDQUFDO1FBQ25CLE1BQU0sTUFBTTtZQUNYLEVBQUUsQ0FBQyxFQUFPLEVBQUUsRUFBTztnQkFDbEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JELENBQUM7U0FDRDtRQUVELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxF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