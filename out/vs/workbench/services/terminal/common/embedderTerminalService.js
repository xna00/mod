/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, extensions_1, instantiation_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IEmbedderTerminalService = void 0;
    exports.IEmbedderTerminalService = (0, instantiation_1.createDecorator)('embedderTerminalService');
    class EmbedderTerminalService {
        constructor() {
            this._onDidCreateTerminal = new event_1.Emitter();
            this.onDidCreateTerminal = event_1.Event.buffer(this._onDidCreateTerminal.event);
        }
        createTerminal(options) {
            const slc = {
                name: options.name,
                isFeatureTerminal: true,
                customPtyImplementation(terminalId, cols, rows) {
                    return new EmbedderTerminalProcess(terminalId, options.pty);
                },
            };
            this._onDidCreateTerminal.fire(slc);
        }
    }
    class EmbedderTerminalProcess extends lifecycle_1.Disposable {
        constructor(id, pty) {
            super();
            this.id = id;
            this.shouldPersist = false;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            this._pty = pty;
            this.onProcessData = this._pty.onDidWrite;
            if (this._pty.onDidClose) {
                this._register(this._pty.onDidClose(e => this._onProcessExit.fire(e || undefined)));
            }
            if (this._pty.onDidChangeName) {
                this._register(this._pty.onDidChangeName(e => this._onDidChangeProperty.fire({
                    type: "title" /* ProcessPropertyType.Title */,
                    value: e
                })));
            }
        }
        async start() {
            this._onProcessReady.fire({ pid: -1, cwd: '', windowsPty: undefined });
            this._pty.open();
            return undefined;
        }
        shutdown() {
            this._pty.close();
        }
        // TODO: A lot of these aren't useful for some implementations of ITerminalChildProcess, should
        // they be optional? Should there be a base class for "external" consumers to implement?
        input() {
            // not supported
        }
        async processBinary() {
            // not supported
        }
        resize() {
            // no-op
        }
        clearBuffer() {
            // no-op
        }
        acknowledgeDataEvent() {
            // no-op, flow control not currently implemented
        }
        async setUnicodeVersion() {
            // no-op
        }
        async getInitialCwd() {
            return '';
        }
        async getCwd() {
            return '';
        }
        refreshProperty(property) {
            throw new Error(`refreshProperty is not suppported in EmbedderTerminalProcess. property: ${property}`);
        }
        updateProperty(property, value) {
            throw new Error(`updateProperty is not suppported in EmbedderTerminalProcess. property: ${property}, value: ${value}`);
        }
    }
    (0, extensions_1.registerSingleton)(exports.IEmbedderTerminalService, EmbedderTerminalService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkZXJUZXJtaW5hbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXJtaW5hbC9jb21tb24vZW1iZWRkZXJUZXJtaW5hbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUW5GLFFBQUEsd0JBQXdCLEdBQUcsSUFBQSwrQkFBZSxFQUEyQix5QkFBeUIsQ0FBQyxDQUFDO0lBMkM3RyxNQUFNLHVCQUF1QjtRQUE3QjtZQUdrQix5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBc0IsQ0FBQztZQUNqRSx3QkFBbUIsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQVk5RSxDQUFDO1FBVkEsY0FBYyxDQUFDLE9BQWlDO1lBQy9DLE1BQU0sR0FBRyxHQUFxQjtnQkFDN0IsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO2dCQUNsQixpQkFBaUIsRUFBRSxJQUFJO2dCQUN2Qix1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUk7b0JBQzdDLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDO2FBQ0QsQ0FBQztZQUNGLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsQ0FBQztLQUNEO0lBR0QsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQWEvQyxZQUNVLEVBQVUsRUFDbkIsR0FBeUI7WUFFekIsS0FBSyxFQUFFLENBQUM7WUFIQyxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBWFgsa0JBQWEsR0FBRyxLQUFLLENBQUM7WUFHZCxvQkFBZSxHQUFHLElBQUksQ0FBQyxT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