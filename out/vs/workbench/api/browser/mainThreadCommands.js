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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/proxyIdentifier", "../common/extHost.protocol", "vs/base/common/types"], function (require, exports, lifecycle_1, marshalling_1, commands_1, extHostCustomers_1, extensions_1, proxyIdentifier_1, extHost_protocol_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadCommands = void 0;
    let MainThreadCommands = class MainThreadCommands {
        constructor(extHostContext, _commandService, _extensionService) {
            this._commandService = _commandService;
            this._extensionService = _extensionService;
            this._commandRegistrations = new lifecycle_1.DisposableMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostCommands);
            this._generateCommandsDocumentationRegistration = commands_1.CommandsRegistry.registerCommand('_generateCommandsDocumentation', () => this._generateCommandsDocumentation());
        }
        dispose() {
            this._commandRegistrations.dispose();
            this._generateCommandsDocumentationRegistration.dispose();
        }
        async _generateCommandsDocumentation() {
            const result = await this._proxy.$getContributedCommandMetadata();
            // add local commands
            const commands = commands_1.CommandsRegistry.getCommands();
            for (const [id, command] of commands) {
                if (command.metadata) {
                    result[id] = command.metadata;
                }
            }
            // print all as markdown
            const all = [];
            for (const id in result) {
                all.push('`' + id + '` - ' + _generateMarkdown(result[id]));
            }
            console.log(all.join('\n'));
        }
        $registerCommand(id) {
            this._commandRegistrations.set(id, commands_1.CommandsRegistry.registerCommand(id, (accessor, ...args) => {
                return this._proxy.$executeContributedCommand(id, ...args).then(result => {
                    return (0, marshalling_1.revive)(result);
                });
            }));
        }
        $unregisterCommand(id) {
            this._commandRegistrations.deleteAndDispose(id);
        }
        $fireCommandActivationEvent(id) {
            const activationEvent = `onCommand:${id}`;
            if (!this._extensionService.activationEventIsDone(activationEvent)) {
                // this is NOT awaited because we only use it as drive-by-activation
                // for commands that are already known inside the extension host
                this._extensionService.activateByEvent(activationEvent);
            }
        }
        async $executeCommand(id, args, retry) {
            if (args instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
                args = args.value;
            }
            for (let i = 0; i < args.length; i++) {
                args[i] = (0, marshalling_1.revive)(args[i]);
            }
            if (retry && args.length > 0 && !commands_1.CommandsRegistry.getCommand(id)) {
                await this._extensionService.activateByEvent(`onCommand:${id}`);
                throw new Error('$executeCommand:retry');
            }
            return this._commandService.executeCommand(id, ...args);
        }
        $getCommands() {
            return Promise.resolve([...commands_1.CommandsRegistry.getCommands().keys()]);
        }
    };
    exports.MainThreadCommands = MainThreadCommands;
    exports.MainThreadCommands = MainThreadCommands = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadCommands),
        __param(1, commands_1.ICommandService),
        __param(2, extensions_1.IExtensionService)
    ], MainThreadCommands);
    // --- command doc
    function _generateMarkdown(description) {
        if (typeof description === 'string') {
            return description;
        }
        else {
            const descriptionString = (0, types_1.isString)(description.description)
                ? description.description
                // Our docs website is in English, so keep the original here.
                : description.description.original;
            const parts = [descriptionString];
            parts.push('\n\n');
            if (description.args) {
                for (const arg of description.args) {
                    parts.push(`* _${arg.name}_ - ${arg.description || ''}\n`);
                }
            }
            if (description.returns) {
                parts.push(`* _(returns)_ - ${description.returns}`);
            }
            parts.push('\n\n');
            return parts.join('');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZENvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtRQU05QixZQUNDLGNBQStCLEVBQ2QsZUFBaUQsRUFDL0MsaUJBQXFEO1lBRHRDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUM5QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBUHhELDBCQUFxQixHQUFHLElBQUkseUJBQWEsRUFBVSxDQUFDO1lBU3BFLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRXRFLElBQUksQ0FBQywwQ0FBMEMsR0FBRywyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUMsQ0FBQztRQUNuSyxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsMENBQTBDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0QsQ0FBQztRQUVPLEtBQUssQ0FBQyw4QkFBOEI7WUFDM0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLDhCQUE4QixFQUFFLENBQUM7WUFFbEUscUJBQXFCO1lBQ3JCLE1BQU0sUUFBUSxHQUFHLDJCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hELEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsSUFBSSxRQUFRLEVB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