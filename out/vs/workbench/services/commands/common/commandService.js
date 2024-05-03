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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extensions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/base/common/async"], function (require, exports, instantiation_1, commands_1, extensions_1, event_1, lifecycle_1, log_1, extensions_2, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandService = void 0;
    let CommandService = class CommandService extends lifecycle_1.Disposable {
        constructor(_instantiationService, _extensionService, _logService) {
            super();
            this._instantiationService = _instantiationService;
            this._extensionService = _extensionService;
            this._logService = _logService;
            this._extensionHostIsReady = false;
            this._onWillExecuteCommand = this._register(new event_1.Emitter());
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._extensionService.whenInstalledExtensionsRegistered().then(value => this._extensionHostIsReady = value);
            this._starActivation = null;
        }
        _activateStar() {
            if (!this._starActivation) {
                // wait for * activation, limited to at most 30s
                this._starActivation = Promise.race([
                    this._extensionService.activateByEvent(`*`),
                    (0, async_1.timeout)(30000)
                ]);
            }
            return this._starActivation;
        }
        async executeCommand(id, ...args) {
            this._logService.trace('CommandService#executeCommand', id);
            const activationEvent = `onCommand:${id}`;
            const commandIsRegistered = !!commands_1.CommandsRegistry.getCommand(id);
            if (commandIsRegistered) {
                // if the activation event has already resolved (i.e. subsequent call),
                // we will execute the registered command immediately
                if (this._extensionService.activationEventIsDone(activationEvent)) {
                    return this._tryExecuteCommand(id, args);
                }
                // if the extension host didn't start yet, we will execute the registered
                // command immediately and send an activation event, but not wait for it
                if (!this._extensionHostIsReady) {
                    this._extensionService.activateByEvent(activationEvent); // intentionally not awaited
                    return this._tryExecuteCommand(id, args);
                }
                // we will wait for a simple activation event (e.g. in case an extension wants to overwrite it)
                await this._extensionService.activateByEvent(activationEvent);
                return this._tryExecuteCommand(id, args);
            }
            // finally, if the command is not registered we will send a simple activation event
            // as well as a * activation event raced against registration and against 30s
            await Promise.all([
                this._extensionService.activateByEvent(activationEvent),
                Promise.race([
                    // race * activation against command registration
                    this._activateStar(),
                    event_1.Event.toPromise(event_1.Event.filter(commands_1.CommandsRegistry.onDidRegisterCommand, e => e === id))
                ]),
            ]);
            return this._tryExecuteCommand(id, args);
        }
        _tryExecuteCommand(id, args) {
            const command = commands_1.CommandsRegistry.getCommand(id);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction(command.handler, ...args);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    };
    exports.CommandService = CommandService;
    exports.CommandService = CommandService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, extensions_1.IExtensionService),
        __param(2, log_1.ILogService)
    ], CommandService);
    (0, extensions_2.registerSingleton)(commands_1.ICommandService, CommandService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb21tYW5kcy9jb21tb24vY29tbWFuZFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQWE3QyxZQUN3QixxQkFBNkQsRUFDakUsaUJBQXFELEVBQzNELFdBQXlDO1lBRXRELEtBQUssRUFBRSxDQUFDO1lBSmdDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDaEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUMxQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQVovQywwQkFBcUIsR0FBWSxLQUFLLENBQUM7WUFHOUIsMEJBQXFCLEdBQTJCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWlCLENBQUMsQ0FBQztZQUM5Rix5QkFBb0IsR0FBeUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQUU3RSx5QkFBb0IsR0FBMkIsSUFBSSxlQUFPLEVBQWlCLENBQUM7WUFDN0Usd0JBQW1CLEdBQXlCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFRM0YsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlDQUFpQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQzdHLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFFTyxhQUFhO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzNCLGdEQUFnRDtnQkFDaEQsSUFB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