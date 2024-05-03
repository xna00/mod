/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/console", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/node/processes", "vs/base/common/processes", "vs/base/parts/ipc/common/ipc"], function (require, exports, child_process_1, async_1, buffer_1, cancellation_1, console_1, errors, event_1, lifecycle_1, objects_1, processes_1, processes_2, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = exports.Server = void 0;
    /**
     * This implementation doesn't perform well since it uses base64 encoding for buffers.
     * We should move all implementations to use named ipc.net, so we stop depending on cp.fork.
     */
    class Server extends ipc_1.ChannelServer {
        constructor(ctx) {
            super({
                send: r => {
                    try {
                        process.send?.(r.buffer.toString('base64'));
                    }
                    catch (e) { /* not much to do */ }
                },
                onMessage: event_1.Event.fromNodeEventEmitter(process, 'message', msg => buffer_1.VSBuffer.wrap(Buffer.from(msg, 'base64')))
            }, ctx);
            process.once('disconnect', () => this.dispose());
        }
    }
    exports.Server = Server;
    class Client {
        constructor(modulePath, options) {
            this.modulePath = modulePath;
            this.options = options;
            this.activeRequests = new Set();
            this.channels = new Map();
            this._onDidProcessExit = new event_1.Emitter();
            this.onDidProcessExit = this._onDidProcessExit.event;
            const timeout = options && options.timeout ? options.timeout : 60000;
            this.disposeDelayer = new async_1.Delayer(timeout);
            this.child = null;
            this._client = null;
        }
        getChannel(channelName) {
            const that = this;
            return {
                call(command, arg, cancellationToken) {
                    return that.requestPromise(channelName, command, arg, cancellationToken);
                },
                listen(event, arg) {
                    return that.requestEvent(channelName, event, arg);
                }
            };
        }
        requestPromise(channelName, name, arg, cancellationToken = cancellation_1.CancellationToken.None) {
            if (!this.disposeDelayer) {
                return Promise.reject(new Error('disposed'));
            }
            if (cancellationToken.isCancellationRequested) {
                return Promise.reject(errors.canceled());
            }
            this.disposeDelayer.cancel();
            const channel = this.getCachedChannel(channelName);
            const result = (0, async_1.createCancelablePromise)(token => channel.call(name, arg, token));
            const cancellationTokenListener = cancellationToken.onCancellationRequested(() => result.cancel());
            const disposable = (0, lifecycle_1.toDisposable)(() => result.cancel());
            this.activeRequests.add(disposable);
            result.finally(() => {
                cancellationTokenListener.dispose();
                this.activeRequests.delete(disposable);
                if (this.activeRequests.size === 0 && this.disposeDelayer) {
                    this.disposeDelayer.trigger(() => this.disposeClient());
                }
            });
            return result;
        }
        requestEvent(channelName, name, arg) {
            if (!this.disposeDelayer) {
                return event_1.Event.None;
            }
            this.disposeDelayer.cancel();
            let listener;
            const emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    const channel = this.getCachedChannel(channelName);
                    const event = channel.listen(name, arg);
                    listener = event(emitter.fire, emitter);
                    this.activeRequests.add(listener);
                },
                onDidRemoveLastListener: () => {
                    this.activeRequests.delete(listener);
                    listener.dispose();
                    if (this.activeRequests.size === 0 && this.disposeDelayer) {
                        this.disposeDelayer.trigger(() => this.disposeClient());
                    }
                }
            });
            return emitter.event;
        }
        get client() {
            if (!this._client) {
                const args = this.options && this.options.args ? this.options.args : [];
                const forkOpts = Object.create(null);
                forkOpts.env = { ...(0, objects_1.deepClone)(process.env), 'VSCODE_PARENT_PID': String(process.pid) };
                if (this.options && this.options.env) {
                    forkOpts.env = { ...forkOpts.env, ...this.options.env };
                }
                if (this.options && this.options.freshExecArgv) {
                    forkOpts.execArgv = [];
                }
                if (this.options && typeof this.options.debug === 'number') {
                    forkOpts.execArgv = ['--nolazy', '--inspect=' + this.options.debug];
                }
                if (this.options && typeof this.options.debugBrk === 'number') {
                    forkOpts.execArgv = ['--nolazy', '--inspect-brk=' + this.options.debugBrk];
                }
                if (forkOpts.execArgv === undefined) {
                    forkOpts.execArgv = process.execArgv // if not set, the forked process inherits the execArgv of the parent process
                        .filter(a => !/^--inspect(-brk)?=/.test(a)) // --inspect and --inspect-brk can not be inherited as the port would conflict
                        .filter(a => !a.startsWith('--vscode-')); // --vscode-* arguments are unsupported by node.js and thus need to remove
                }
                (0, processes_2.removeDangerousEnvVariables)(forkOpts.env);
                this.child = (0, child_process_1.fork)(this.modulePath, args, forkOpts);
                const onMessageEmitter = new event_1.Emitter();
                const onRawMessage = event_1.Event.fromNodeEventEmitter(this.child, 'message', msg => msg);
                const rawMessageDisposable = onRawMessage(msg => {
                    // Handle remote console logs specially
                    if ((0, console_1.isRemoteConsoleLog)(msg)) {
                        (0, console_1.log)(msg, `IPC Library: ${this.options.serverName}`);
                        return;
                    }
                    // Anything else goes to the outside
                    onMessageEmitter.fire(buffer_1.VSBuffer.wrap(Buffer.from(msg, 'base64')));
                });
                const sender = this.options.useQueue ? (0, processes_1.createQueuedSender)(this.child) : this.child;
                const send = (r) => this.child && this.child.connected && sender.send(r.buffer.toString('base64'));
                const onMessage = onMessageEmitter.event;
                const protocol = { send, onMessage };
                this._client = new ipc_1.ChannelClient(protocol);
                const onExit = () => this.disposeClient();
                process.once('exit', onExit);
                this.child.on('error', err => console.warn('IPC "' + this.options.serverName + '" errored with ' + err));
                this.child.on('exit', (code, signal) => {
                    process.removeListener('exit', onExit); // https://github.com/electron/electron/issues/21475
                    rawMessageDisposable.dispose();
                    this.activeRequests.forEach(r => (0, lifecycle_1.dispose)(r));
                    this.activeRequests.clear();
                    if (code !== 0 && signal !== 'SIGTERM') {
                        console.warn('IPC "' + this.options.serverName + '" crashed with exit code ' + code + ' and signal ' + signal);
                    }
                    this.disposeDelayer?.cancel();
                    this.disposeClient();
                    this._onDidProcessExit.fire({ code, signal });
                });
            }
            return this._client;
        }
        getCachedChannel(name) {
            let channel = this.channels.get(name);
            if (!channel) {
                channel = this.client.getChannel(name);
                this.channels.set(name, channel);
            }
            return channel;
        }
        disposeClient() {
            if (this._client) {
                if (this.child) {
                    this.child.kill();
                    this.child = null;
                }
                this._client = null;
                this.channels.clear();
            }
        }
        dispose() {
            this._onDidProcessExit.dispose();
            this.disposeDelayer?.cancel();
            this.disposeDelayer = undefined;
            this.disposeClient();
            this.activeRequests.clear();
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLmNwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9ub2RlL2lwYy5jcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEc7OztPQUdHO0lBRUgsTUFBYSxNQUFnQyxTQUFRLG1CQUFtQjtRQUN2RSxZQUFZLEdBQWE7WUFDeEIsS0FBSyxDQUFDO2dCQUNMLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDVCxJQUFJLENBQUM7d0JBQ0osT0FBTyxDQUFDLElBQUksRUFBRSxDQUFVLENBQUMsQ0FBQyxNQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZELENBQUM7b0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3JDLENBQUM7Z0JBQ0QsU0FBUyxFQUFFLGFBQUssQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUMzRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRVIsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDbEQsQ0FBQztLQUNEO0lBYkQsd0JBYUM7SUErQ0QsTUFBYSxNQUFNO1FBV2xCLFlBQW9CLFVBQWtCLEVBQVUsT0FBb0I7WUFBaEQsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUFVLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFSNUQsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO1lBR3hDLGFBQVEsR0FBRyxJQUFJ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