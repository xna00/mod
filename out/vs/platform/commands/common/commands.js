/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, iterator_1, lifecycle_1, linkedList_1, types_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandsRegistry = exports.ICommandService = void 0;
    exports.ICommandService = (0, instantiation_1.createDecorator)('commandService');
    exports.CommandsRegistry = new class {
        constructor() {
            this._commands = new Map();
            this._onDidRegisterCommand = new event_1.Emitter();
            this.onDidRegisterCommand = this._onDidRegisterCommand.event;
        }
        registerCommand(idOrCommand, handler) {
            if (!idOrCommand) {
                throw new Error(`invalid command`);
            }
            if (typeof idOrCommand === 'string') {
                if (!handler) {
                    throw new Error(`invalid command`);
                }
                return this.registerCommand({ id: idOrCommand, handler });
            }
            // add argument validation if rich command metadata is provided
            if (idOrCommand.metadata && Array.isArray(idOrCommand.metadata.args)) {
                const constraints = [];
                for (const arg of idOrCommand.metadata.args) {
                    constraints.push(arg.constraint);
                }
                const actualHandler = idOrCommand.handler;
                idOrCommand.handler = function (accessor, ...args) {
                    (0, types_1.validateConstraints)(args, constraints);
                    return actualHandler(accessor, ...args);
                };
            }
            // find a place to store the command
            const { id } = idOrCommand;
            let commands = this._commands.get(id);
            if (!commands) {
                commands = new linkedList_1.LinkedList();
                this._commands.set(id, commands);
            }
            const removeFn = commands.unshift(idOrCommand);
            const ret = (0, lifecycle_1.toDisposable)(() => {
                removeFn();
                const command = this._commands.get(id);
                if (command?.isEmpty()) {
                    this._commands.delete(id);
                }
            });
            // tell the world about this command
            this._onDidRegisterCommand.fire(id);
            return ret;
        }
        registerCommandAlias(oldId, newId) {
            return exports.CommandsRegistry.registerCommand(oldId, (accessor, ...args) => accessor.get(exports.ICommandService).executeCommand(newId, ...args));
        }
        getCommand(id) {
            const list = this._commands.get(id);
            if (!list || list.isEmpty()) {
                return undefined;
            }
            return iterator_1.Iterable.first(list);
        }
        getCommands() {
            const result = new Map();
            for (const key of this._commands.keys()) {
                const command = this.getCommand(key);
                if (command) {
                    result.set(key, command);
                }
            }
            return result;
        }
    };
    exports.CommandsRegistry.registerCommand('noop', () => { });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NvbW1hbmRzL2NvbW1vbi9jb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXbkYsUUFBQSxlQUFlLEdBQUcsSUFBQSwrQkFBZSxFQUFrQixnQkFBZ0IsQ0FBQyxDQUFDO0lBc0RyRSxRQUFBLGdCQUFnQixHQUFxQixJQUFJO1FBQUE7WUFFcEMsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1lBRXBELDBCQUFxQixHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFDdEQseUJBQW9CLEdBQWtCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7UUEyRWpGLENBQUM7UUF6RUEsZUFBZSxDQUFDLFdBQThCLEVBQUUsT0FBeUI7WUFFeEUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUVELElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3BDLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCwrREFBK0Q7WUFDL0QsSUFBSSxXQUFXLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0RSxNQUFNLFdBQVcsR0FBc0MsRUFBRSxDQUFDO2dC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