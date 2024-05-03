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
define(["require", "exports", "vs/base/common/types", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/objects", "./extHost.protocol", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/marshalling", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTestItem", "vs/base/common/buffer", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/base/common/errorMessage", "vs/base/common/stopwatch", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/api/common/extHostTelemetry", "vs/base/common/uuid"], function (require, exports, types_1, extHostTypes, extHostTypeConverter, objects_1, extHost_protocol_1, arrays_1, log_1, marshalling_1, range_1, position_1, uri_1, lifecycle_1, instantiation_1, extHostRpcService_1, extHostTestItem_1, buffer_1, proxyIdentifier_1, errorMessage_1, stopwatch_1, telemetryUtils_1, extHostTelemetry_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApiCommand = exports.ApiCommandResult = exports.ApiCommandArgument = exports.CommandsConverter = exports.IExtHostCommands = exports.ExtHostCommands = void 0;
    let ExtHostCommands = class ExtHostCommands {
        #proxy;
        #telemetry;
        #extHostTelemetry;
        constructor(extHostRpc, logService, extHostTelemetry) {
            this._commands = new Map();
            this._apiCommands = new Map();
            this.#proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadCommands);
            this._logService = logService;
            this.#extHostTelemetry = extHostTelemetry;
            this.#telemetry = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            this.converter = new CommandsConverter(this, id => {
                // API commands that have no return type (void) can be
                // converted to their internal command and don't need
                // any indirection commands
                const candidate = this._apiCommands.get(id);
                return candidate?.result === ApiCommandResult.Void
                    ? candidate : undefined;
            }, logService);
            this._argumentProcessors = [
                {
                    processArgument(a) {
                        // URI, Regex
                        return (0, marshalling_1.revive)(a);
                    }
                },
                {
                    processArgument(arg) {
                        return (0, objects_1.cloneAndChange)(arg, function (obj) {
                            // Reverse of https://github.com/microsoft/vscode/blob/1f28c5fc681f4c01226460b6d1c7e91b8acb4a5b/src/vs/workbench/api/node/extHostCommands.ts#L112-L127
                            if (range_1.Range.isIRange(obj)) {
                                return extHostTypeConverter.Range.to(obj);
                            }
                            if (position_1.Position.isIPosition(obj)) {
                                return extHostTypeConverter.Position.to(obj);
                            }
                            if (range_1.Range.isIRange(obj.range) && uri_1.URI.isUri(obj.uri)) {
                                return extHostTypeConverter.location.to(obj);
                            }
                            if (obj instanceof buffer_1.VSBuffer) {
                                return obj.buffer.buffer;
                            }
                            if (!Array.isArray(obj)) {
                                return obj;
                            }
                        });
                    }
                }
            ];
        }
        registerArgumentProcessor(processor) {
            this._argumentProcessors.push(processor);
        }
        registerApiCommand(apiCommand) {
            const registration = this.registerCommand(false, apiCommand.id, async (...apiArgs) => {
                const internalArgs = apiCommand.args.map((arg, i) => {
                    if (!arg.validate(apiArgs[i])) {
                        throw new Error(`Invalid argument '${arg.name}' when running '${apiCommand.id}', received: ${typeof apiArgs[i] === 'object' ? JSON.stringify(apiArgs[i], null, '\t') : apiArgs[i]} `);
                    }
                    return arg.convert(apiArgs[i]);
                });
                const internalResult = await this.executeCommand(apiCommand.internalId, ...internalArgs);
                return apiCommand.result.convert(internalResult, apiArgs, this.converter);
            }, undefined, {
                description: apiCommand.description,
                args: apiCommand.args,
                returns: apiCommand.result.description
            });
            this._apiCommands.set(apiCommand.id, apiCommand);
            return new extHostTypes.Disposable(() => {
                registration.dispose();
                this._apiCommands.delete(apiCommand.id);
            });
        }
        registerCommand(global, id, callback, thisArg, metadata, extension) {
            this._logService.trace('ExtHostCommands#registerCommand', id);
            if (!id.trim().length) {
                throw new Error('invalid id');
            }
            if (this._commands.has(id)) {
                throw new Error(`command '${id}' already exists`);
            }
            this._commands.set(id, { callback, thisArg, metadata, extension });
            if (global) {
                this.#proxy.$registerCommand(id);
            }
            return new extHostTypes.Disposable(() => {
                if (this._commands.delete(id)) {
                    if (global) {
                        this.#proxy.$unregisterCommand(id);
                    }
                }
            });
        }
        executeCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#executeCommand', id);
            return this._doExecuteCommand(id, args, true);
        }
        async _doExecuteCommand(id, args, retry) {
            if (this._commands.has(id)) {
                // - We stay inside the extension host and support
                // 	 to pass any kind of parameters around.
                // - We still emit the corresponding activation event
                //   BUT we don't await that event
                this.#proxy.$fireCommandActivationEvent(id);
                return this._executeContributedCommand(id, args, false);
            }
            else {
                // automagically convert some argument types
                let hasBuffers = false;
                const toArgs = (0, objects_1.cloneAndChange)(args, function (value) {
                    if (value instanceof extHostTypes.Position) {
                        return extHostTypeConverter.Position.from(value);
                    }
                    else if (value instanceof extHostTypes.Range) {
                        return extHostTypeConverter.Range.from(value);
                    }
                    else if (value instanceof extHostTypes.Location) {
                        return extHostTypeConverter.location.from(value);
                    }
                    else if (extHostTypes.NotebookRange.isNotebookRange(value)) {
                        return extHostTypeConverter.NotebookRange.from(value);
                    }
                    else if (value instanceof ArrayBuffer) {
                        hasBuffers = true;
                        return buffer_1.VSBuffer.wrap(new Uint8Array(value));
                    }
                    else if (value instanceof Uint8Array) {
                        hasBuffers = true;
                        return buffer_1.VSBuffer.wrap(value);
                    }
                    else if (value instanceof buffer_1.VSBuffer) {
                        hasBuffers = true;
                        return value;
                    }
                    if (!Array.isArray(value)) {
                        return value;
                    }
                });
                try {
                    const result = await this.#proxy.$executeCommand(id, hasBuffers ? new proxyIdentifier_1.SerializableObjectWithBuffers(toArgs) : toArgs, retry);
                    return (0, marshalling_1.revive)(result);
                }
                catch (e) {
                    // Rerun the command when it wasn't known, had arguments, and when retry
                    // is enabled. We do this because the command might be registered inside
                    // the extension host now and can therefore accept the arguments as-is.
                    if (e instanceof Error && e.message === '$executeCommand:retry') {
                        return this._doExecuteCommand(id, args, false);
                    }
                    else {
                        throw e;
                    }
                }
            }
        }
        async _executeContributedCommand(id, args, annotateError) {
            const command = this._commands.get(id);
            if (!command) {
                throw new Error('Unknown command');
            }
            const { callback, thisArg, metadata } = command;
            if (metadata?.args) {
                for (let i = 0; i < metadata.args.length; i++) {
                    try {
                        (0, types_1.validateConstraint)(args[i], metadata.args[i].constraint);
                    }
                    catch (err) {
                        throw new Error(`Running the contributed command: '${id}' failed. Illegal argument '${metadata.args[i].name}' - ${metadata.args[i].description}`);
                    }
                }
            }
            const stopWatch = stopwatch_1.StopWatch.create();
            try {
                return await callback.apply(thisArg, args);
            }
            catch (err) {
                // The indirection-command from the converter can fail when invoking the actual
                // command and in that case it is better to blame the correct command
                if (id === this.converter.delegatingCommandId) {
                    const actual = this.converter.getActualCommand(...args);
                    if (actual) {
                        id = actual.command;
                    }
                }
                this._logService.error(err, id, command.extension?.identifier);
                if (!annotateError) {
                    throw err;
                }
                if (command.extension?.identifier) {
                    const reported = this.#extHostTelemetry.onExtensionError(command.extension.identifier, err);
                    this._logService.trace('forwarded error to extension?', reported, command.extension?.identifier);
                }
                throw new class CommandError extends Error {
                    constructor() {
                        super((0, errorMessage_1.toErrorMessage)(err));
                        this.id = id;
                        this.source = command.extension?.displayName ?? command.extension?.name;
                    }
                };
            }
            finally {
                this._reportTelemetry(command, id, stopWatch.elapsed());
            }
        }
        _reportTelemetry(command, id, duration) {
            if (!command.extension) {
                return;
            }
            this.#telemetry.$publicLog2('Extension:ActionExecuted', {
                extensionId: command.extension.identifier.value,
                id: new telemetryUtils_1.TelemetryTrustedValue(id),
                duration: duration,
            });
        }
        $executeContributedCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#$executeContributedCommand', id);
            const cmdHandler = this._commands.get(id);
            if (!cmdHandler) {
                return Promise.reject(new Error(`Contributed command '${id}' does not exist.`));
            }
            else {
                args = args.map(arg => this._argumentProcessors.reduce((r, p) => p.processArgument(r, cmdHandler.extension?.identifier), arg));
                return this._executeContributedCommand(id, args, true);
            }
        }
        getCommands(filterUnderscoreCommands = false) {
            this._logService.trace('ExtHostCommands#getCommands', filterUnderscoreCommands);
            return this.#proxy.$getCommands().then(result => {
                if (filterUnderscoreCommands) {
                    result = result.filter(command => command[0] !== '_');
                }
                return result;
            });
        }
        $getContributedCommandMetadata() {
            const result = Object.create(null);
            for (const [id, command] of this._commands) {
                const { metadata } = command;
                if (metadata) {
                    result[id] = metadata;
                }
            }
            return Promise.resolve(result);
        }
    };
    exports.ExtHostCommands = ExtHostCommands;
    exports.ExtHostCommands = ExtHostCommands = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService),
        __param(2, extHostTelemetry_1.IExtHostTelemetry)
    ], ExtHostCommands);
    exports.IExtHostCommands = (0, instantiation_1.createDecorator)('IExtHostCommands');
    class CommandsConverter {
        // --- conversion between internal and api commands
        constructor(_commands, _lookupApiCommand, _logService) {
            this._commands = _commands;
            this._lookupApiCommand = _lookupApiCommand;
            this._logService = _logService;
            this.delegatingCommandId = `__vsc${(0, uuid_1.generateUuid)()}`;
            this._cache = new Map();
            this._cachIdPool = 0;
            this._commands.registerCommand(true, this.delegatingCommandId, this._executeConvertedCommand, this);
        }
        toInternal(command, disposables) {
            if (!command) {
                return undefined;
            }
            const result = {
                $ident: undefined,
                id: command.command,
                title: command.title,
                tooltip: command.tooltip
            };
            if (!command.command) {
                // falsy command id -> return converted command but don't attempt any
                // argument or API-command dance since this command won't run anyways
                return result;
            }
            const apiCommand = this._lookupApiCommand(command.command);
            if (apiCommand) {
                // API command with return-value can be converted inplace
                result.id = apiCommand.internalId;
                result.arguments = apiCommand.args.map((arg, i) => arg.convert(command.arguments && command.arguments[i]));
            }
            else if ((0, arrays_1.isNonEmptyArray)(command.arguments)) {
                // we have a contributed command with arguments. that
                // means we don't want to send the arguments around
                const id = `${command.command} /${++this._cachIdPool}`;
                this._cache.set(id, command);
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    this._cache.delete(id);
                    this._logService.trace('CommandsConverter#DISPOSE', id);
                }));
                result.$ident = id;
                result.id = this.delegatingCommandId;
                result.arguments = [id];
                this._logService.trace('CommandsConverter#CREATE', command.command, id);
            }
            return result;
        }
        fromInternal(command) {
            if (typeof command.$ident === 'string') {
                return this._cache.get(command.$ident);
            }
            else {
                return {
                    command: command.id,
                    title: command.title,
                    arguments: command.arguments
                };
            }
        }
        getActualCommand(...args) {
            return this._cache.get(args[0]);
        }
        _executeConvertedCommand(...args) {
            const actualCmd = this.getActualCommand(...args);
            this._logService.trace('CommandsConverter#EXECUTE', args[0], actualCmd ? actualCmd.command : 'MISSING');
            if (!actualCmd) {
                return Promise.reject(`Actual command not found, wanted to execute ${args[0]}`);
            }
            return this._commands.executeCommand(actualCmd.command, ...(actualCmd.arguments || []));
        }
    }
    exports.CommandsConverter = CommandsConverter;
    class ApiCommandArgument {
        static { this.Uri = new ApiCommandArgument('uri', 'Uri of a text document', v => uri_1.URI.isUri(v), v => v); }
        static { this.Position = new ApiCommandArgument('position', 'A position in a text document', v => extHostTypes.Position.isPosition(v), extHostTypeConverter.Position.from); }
        static { this.Range = new ApiCommandArgument('range', 'A range in a text document', v => extHostTypes.Range.isRange(v), extHostTypeConverter.Range.from); }
        static { this.Selection = new ApiCommandArgument('selection', 'A selection in a text document', v => extHostTypes.Selection.isSelection(v), extHostTypeConverter.Selection.from); }
        static { this.Number = new ApiCommandArgument('number', '', v => typeof v === 'number', v => v); }
        static { this.String = new ApiCommandArgument('string', '', v => typeof v === 'string', v => v); }
        static { this.StringArray = ApiCommandArgument.Arr(ApiCommandArgument.String); }
        static Arr(element) {
            return new ApiCommandArgument(`${element.name}_array`, `Array of ${element.name}, ${element.description}`, (v) => Array.isArray(v) && v.every(e => element.validate(e)), (v) => v.map(e => element.convert(e)));
        }
        static { this.CallHierarchyItem = new ApiCommandArgument('item', 'A call hierarchy item', v => v instanceof extHostTypes.CallHierarchyItem, extHostTypeConverter.CallHierarchyItem.from); }
        static { this.TypeHierarchyItem = new ApiCommandArgument('item', 'A type hierarchy item', v => v instanceof extHostTypes.TypeHierarchyItem, extHostTypeConverter.TypeHierarchyItem.from); }
        static { this.TestItem = new ApiCommandArgument('testItem', 'A VS Code TestItem', v => v instanceof extHostTestItem_1.TestItemImpl, extHostTypeConverter.TestItem.from); }
        constructor(name, description, validate, convert) {
            this.name = name;
            this.description = description;
            this.validate = validate;
            this.convert = convert;
        }
        optional() {
            return new ApiCommandArgument(this.name, `(optional) ${this.description}`, value => value === undefined || value === null || this.validate(value), value => value === undefined ? undefined : value === null ? null : this.convert(value));
        }
        with(name, description) {
            return new ApiCommandArgument(name ?? this.name, description ?? this.description, this.validate, this.convert);
        }
    }
    exports.ApiCommandArgument = ApiCommandArgument;
    class ApiCommandResult {
        static { this.Void = new ApiCommandResult('no result', v => v); }
        constructor(description, convert) {
            this.description = description;
            this.convert = convert;
        }
    }
    exports.ApiCommandResult = ApiCommandResult;
    class ApiCommand {
        constructor(id, internalId, description, args, result) {
            this.id = id;
            this.internalId = internalId;
            this.description = description;
            this.args = args;
            this.result = result;
        }
    }
    exports.ApiCommand = ApiCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkN6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO1FBSTNCLE1BQU0sQ0FBMEI7UUFJaEMsVUFBVSxDQUEyQjtRQUc1QixpQkFBaUIsQ0FBb0I7UUFLOUMsWUFDcUIsVUFBOEIsRUFDckMsVUFBdUIsRUFDakIsZ0JBQW1DO1lBYnRDLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztZQUM5QyxpQkFBWSxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO1lBYzdELElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDbEUsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDO1lBQzFDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLGlCQUFpQixDQUNyQyxJQUFJLEVBQ0osRUFBRSxDQUFDLEVBQUU7Z0JBQ0osc0RBQXNEO2dCQUN0RCxxREFBcUQ7Z0JBQ3JELDJCQUEyQjtnQkFDM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVDLE9BQU8sU0FBUyxFQUFFLE1BQU0sS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJO29CQUNqRCxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDMUIsQ0FBQyxFQUNELFVBQVUsQ0FDVixDQUFDO1lBQ0YsSUFBSSxDQUFDLG1CQUFtQixHQUFHO2dCQUMxQjtvQkFDQyxlQUFlLENBQUMsQ0FBQzt3QkFDaEIsYUFBYTt3QkFDYixPQUFPLElBQUEsb0JBQU0sRUFBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEIsQ0FBQztpQkFDRDtnQkFDRDtvQkFDQyxlQUFlLENBQUMsR0FBRzt3QkFDbEIsT0FBTyxJQUFBLHdCQUFjLEVBQUMsR0FBRyxFQUFFLFVBQVUsR0FBRzs0QkFDdkMsc0pBQXNKOzRCQUN0SixJQUFJLGFBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQ0FDekIsT0FBTyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUMzQyxDQUFDOzRCQUNELElBQUksbUJBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQ0FDL0IsT0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUM5QyxDQUFDOzRCQUNELElBQUksYUFBSyxDQUFDLFFBQVEsQ0FBRSxHQUEwQixDQUFDLEtBQUssQ0FBQyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUUsR0FBMEIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dDQUNyRyxPQUFPLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQzlDLENBQUM7NEJBQ0QsSUFBSSxHQUFHLFlBQVksaUJBQVEsRUFBRSxDQUFDO2dDQUM3QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDOzRCQUMxQixDQUFDOzRCQUNELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0NBQ3pCLE9BQU8sR0FBRyxDQUFDOzRCQUNaLENBQUM7d0JBQ0YsQ0FBQyxDQUFDLENBQUM7b0JBQ0osQ0FBQztpQkFDRDthQUNELENBQUM7UUFDSCxDQUFDO1FBRUQseUJBQXlCLENBQUMsU0FBNEI7WUFDckQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRUQsa0JBQWtCLENBQUMsVUFBc0I7WUFHeEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxPQUFPLEVBQUUsRUFBRTtnQkFFcEYsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ25ELElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxJQUFJLG1CQUFtQixVQUFVLENBQUMsRUFBRSxnQkFBZ0IsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3ZMLENBQUM7b0JBQ0QsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDLENBQUMsQ0FBQztnQkFFSCxNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxHQUFHLFlBQVksQ0FBQyxDQUFDO2dCQUN6RixPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNFLENBQUMsRUFBRSxTQUFTLEVBQUU7Z0JBQ2IsV0FBVyxFQUFFLFVBQVUsQ0FBQyxXQUFXO2dCQUNuQyxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7Z0JBQ3JCLE9BQU8sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLFdBQVc7YUFDdEMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVqRCxPQUFPLElBQUksWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3ZDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGVBQWUsQ0FBQyxNQUFlLEVBQUUsRUFBVSxFQUFFLFFBQWdELEVBQUUsT0FBYSxFQUFFLFFBQTJCLEVBQUUsU0FBaUM7WUFDM0ssSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFOUQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBRUQsT0FBTyxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUN2QyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQy9CLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsY0FBYyxDQUFJLEVBQVUsRUFBRSxHQUFHLElBQVc7WUFDM0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBRU8sS0FBSyxDQUFDLGlCQUFpQixDQUFJLEVBQVUsRUFBRSxJQUFXLEVBQUUsS0FBYztZQUV6RSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLGtEQUFrRDtnQkFDbEQsMkNBQTJDO2dCQUMzQyxxREFBcUQ7Z0JBQ3JELGtDQUFrQztnQkFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDNUMsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUksRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUU1RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsNENBQTRDO2dCQUM1QyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZCLE1BQU0sTUFBTSxHQUFHLElBQUEsd0JBQWMsRUFBQyxJQUFJLEVBQUUsVUFBVSxLQUFLO29CQUNsRCxJQUFJLEtBQUssWUFBWSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQzVDLE9BQU8sb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbEQsQ0FBQzt5QkFBTSxJQUFJLEtBQUssWUFBWSxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2hELE9BQU8sb0JBQW9CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDL0MsQ0FBQzt5QkFBTSxJQUFJLEtBQUssWUFBWSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ25ELE9BQU8sb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbEQsQ0FBQzt5QkFBTSxJQUFJLFlBQVksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQzlELE9BQU8sb0JBQW9CLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdkQsQ0FBQzt5QkFBTSxJQUFJLEtBQUssWUFBWSxXQUFXLEVBQUUsQ0FBQzt3QkFDekMsVUFBVSxHQUFHLElBQUksQ0FBQzt3QkFDbEIsT0FBTyxpQkFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUM3QyxDQUFDO3lCQUFNLElBQUksS0FBSyxZQUFZLFVBQVUsRUFBRSxDQUFDO3dCQUN4QyxVQUFVLEdBQUcsSUFBSSxDQUFDO3dCQUNsQixPQUFPLGlCQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM3QixDQUFDO3lCQUFNLElBQUksS0FBSyxZQUFZLGlCQUFRLEVBQUUsQ0FBQzt3QkFDdEMsVUFBVSxHQUFHLElBQUksQ0FBQzt3QkFDbEIsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztvQkFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUMzQixPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQztvQkFDSixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksK0NBQTZCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDN0gsT0FBTyxJQUFBLG9CQUFNLEVBQU0sTUFBTSxDQUFDLENBQUM7Z0JBQzVCLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWix3RUFBd0U7b0JBQ3hFLHdFQUF3RTtvQkFDeEUsdUVBQXVFO29CQUN2RSxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxDQUFDLE9BQU8sS0FBSyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNqRSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNoRCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxDQUFDLENBQUM7b0JBQ1QsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsMEJBQTBCLENBQWMsRUFBVSxFQUFFLElBQVcsRUFBRSxhQUFzQjtZQUNwRyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFDRCxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDaEQsSUFBSSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMvQyxJQUFJLENBQUM7d0JBQ0osSUFBQSwwQkFBa0IsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDMUQsQ0FBQztvQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO3dCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLEVBQUUsK0JBQStCLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztvQkFDbkosQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLHFCQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDO2dCQUNKLE9BQU8sTUFBTSxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCwrRUFBK0U7Z0JBQy9FLHFFQUFxRTtnQkFDckUsSUFBSSxFQUFFLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUMvQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7b0JBQ3hELElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ1osRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7b0JBQ3JCLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRS9ELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDcEIsTUFBTSxHQUFHLENBQUM7Z0JBQ1gsQ0FBQztnQkFFRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUM7b0JBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDNUYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2xHLENBQUM7Z0JBRUQsTUFBTSxJQUFJLE1BQU0sWUFBYSxTQUFRLEtBQUs7b0JBR3pDO3dCQUNDLEtBQUssQ0FBQyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFIbkIsT0FBRSxHQUFHLEVBQUUsQ0FBQzt3QkFDUixXQUFNLEdBQUcsT0FBUSxDQUFDLFNBQVMsRUFBRSxXQUFXLElBQUksT0FBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUM7b0JBRzlFLENBQUM7aUJBQ0QsQ0FBQztZQUNILENBQUM7b0JBQ08sQ0FBQztnQkFDUixJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN6RCxDQUFDO1FBQ0YsQ0FBQztRQUVPLGdCQUFnQixDQUFDLE9BQXVCLEVBQUUsRUFBVSxFQUFFLFFBQWdCO1lBQzdFLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBYUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQXlELDBCQUEwQixFQUFFO2dCQUMvRyxXQUFXLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSztnQkFDL0MsRUFBRSxFQUFFLElBQUksc0NBQXFCLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxRQUFRLEVBQUUsUUFBUTthQUNsQixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsMEJBQTBCLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBVztZQUNwRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV6RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDL0gsT0FBTyxJQUFJLENBQUMsMEJBQTBCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxDQUFDO1FBQ0YsQ0FBQztRQUVELFdBQVcsQ0FBQywyQkFBb0MsS0FBSztZQUNwRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBRWhGLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQy9DLElBQUksd0JBQXdCLEVBQUUsQ0FBQztvQkFDOUIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ3ZELENBQUM7Z0JBQ0QsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCw4QkFBOEI7WUFDN0IsTUFBTSxNQUFNLEdBQWdELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEYsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQztnQkFDN0IsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDO2dCQUN2QixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoQyxDQUFDO0tBQ0QsQ0FBQTtJQXBTWSwwQ0FBZTs4QkFBZixlQUFlO1FBaUJ6QixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsb0NBQWlCLENBQUE7T0FuQlAsZUFBZSxDQW9TM0I7SUFHWSxRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsa0JBQWtCLENBQUMsQ0FBQztJQUV0RixNQUFhLGlCQUFpQjtRQU03QixtREFBbUQ7UUFDbkQsWUFDa0IsU0FBMEIsRUFDMUIsaUJBQXlELEVBQ3pELFdBQXdCO1lBRnhCLGNBQVMsR0FBVCxTQUFTLENBQWlCO1lBQzFCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBd0M7WUFDekQsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFSakMsd0JBQW1CLEdBQVcsUUFBUSxJQUFBLG1CQUFZLEdBQUUsRUFBRSxDQUFDO1lBQy9DLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztZQUNwRCxnQkFBVyxHQUFHLENBQUMsQ0FBQztZQVF2QixJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyRyxDQUFDO1FBSUQsVUFBVSxDQUFDLE9BQW1DLEVBQUUsV0FBNEI7WUFFM0UsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBZ0I7Z0JBQzNCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixFQUFFLEVBQUUsT0FBTyxDQUFDLE9BQU87Z0JBQ25CLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztnQkFDcEIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO2FBQ3hCLENBQUM7WUFFRixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QixxRUFBcUU7Z0JBQ3JFLHFFQUFxRTtnQkFDckUsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQix5REFBeUQ7Z0JBQ3pELE1BQU0sQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUc1RyxDQUFDO2lCQUFNLElBQUksSUFBQSx3QkFBZSxFQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxxREFBcUQ7Z0JBQ3JELG1EQUFtRDtnQkFFbkQsTUFBTSxFQUFFLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzdCLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtvQkFDakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUVuQixNQUFNLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztnQkFDckMsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUV4QixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pFLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxZQUFZLENBQUMsT0FBb0I7WUFFaEMsSUFBSSxPQUFPLE9BQU8sQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3hDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXhDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPO29CQUNOLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTtvQkFDbkIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO29CQUNwQixTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7aUJBQzVCLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztRQUdELGdCQUFnQixDQUFDLEdBQUcsSUFBVztZQUM5QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFTyx3QkFBd0IsQ0FBSSxHQUFHLElBQVc7WUFDakQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFeEcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsK0NBQStDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7S0FFRDtJQTdGRCw4Q0E2RkM7SUFHRCxNQUFhLGtCQUFrQjtpQkFFZCxRQUFHLEdBQUcsSUFBSSxrQkFBa0IsQ0FBTSxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQzlGLGFBQVEsR0FBRyxJQUFJLGtCQUFrQixDQUFtQyxVQUFVLEVBQUUsK0JBQStCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQy9MLFVBQUssR0FBRyxJQUFJLGtCQUFrQixDQUE2QixPQUFPLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3ZLLGNBQVMsR0FBRyxJQUFJLGtCQUFrQixDQUFxQyxXQUFXLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3ZNLFdBQU0sR0FBRyxJQUFJLGtCQUFrQixDQUFTLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDMUYsV0FBTSxHQUFHLElBQUksa0JBQWtCLENBQVMsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUMxRixnQkFBVyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVoRixNQUFNLENBQUMsR0FBRyxDQUFXLE9BQWlDO1lBQ3JELE9BQU8sSUFBSSxrQkFBa0IsQ0FDNUIsR0FBRyxPQUFPLENBQUMsSUFBSSxRQUFRLEVBQ3ZCLFlBQVksT0FBTyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQ2xELENBQUMsQ0FBVSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3JFLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUMxQyxDQUFDO1FBQ0gsQ0FBQztpQkFFZSxzQkFBaUIsR0FBRyxJQUFJLGtCQUFrQixDQUFDLE1BQU0sRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxZQUFZLENBQUMsaUJBQWlCLEVBQUUsb0JBQW9CLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzNLLHNCQUFpQixHQUFHLElBQUksa0JBQWtCLENBQUMsTUFBTSxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDM0ssYUFBUSxHQUFHLElBQUksa0JBQWtCLENBQUMsVUFBVSxFQUFFLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLDhCQUFZLEVBQUUsb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXhKLFlBQ1UsSUFBWSxFQUNaLFdBQW1CLEVBQ25CLFFBQTJCLEVBQzNCLE9BQW9CO1lBSHBCLFNBQUksR0FBSixJQUFJLENBQVE7WUFDWixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixZQUFPLEdBQVAsT0FBTyxDQUFhO1FBQzFCLENBQUM7UUFFTCxRQUFRO1lBQ1AsT0FBTyxJQUFJLGtCQUFrQixDQUM1QixJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUMzQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUN0RSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUN0RixDQUFDO1FBQ0gsQ0FBQztRQUVELElBQUksQ0FBQyxJQUF3QixFQUFFLFdBQStCO1lBQzdELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoSCxDQUFDOztJQXhDRixnREF5Q0M7SUFFRCxNQUFhLGdCQUFnQjtpQkFFWixTQUFJLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBYSxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU3RSxZQUNVLFdBQW1CLEVBQ25CLE9BQXFFO1lBRHJFLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLFlBQU8sR0FBUCxPQUFPLENBQThEO1FBQzNFLENBQUM7O0lBUE4sNENBUUM7SUFFRCxNQUFhLFVBQVU7UUFFdEIsWUFDVSxFQUFVLEVBQ1YsVUFBa0IsRUFDbEIsV0FBbUIsRUFDbkIsSUFBb0MsRUFDcEMsTUFBa0M7WUFKbEMsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUNWLGVBQVUsR0FBVixVQUFVLENBQVE7WUFDbEIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDbkIsU0FBSSxHQUFKLElBQUksQ0FBZ0M7WUFDcEMsV0FBTSxHQUFOLE1BQU0sQ0FBNEI7UUFDeEMsQ0FBQztLQUNMO0lBVEQsZ0NBU0MifQ==