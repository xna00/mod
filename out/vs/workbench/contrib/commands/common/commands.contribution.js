/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/platform/notification/common/notification"], function (require, exports, nls, actions_1, commands_1, log_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Runs several commands passed to it as an argument */
    class RunCommands extends actions_1.Action2 {
        constructor() {
            super({
                id: 'runCommands',
                title: nls.localize2('runCommands', "Run Commands"),
                f1: false,
                metadata: {
                    description: nls.localize('runCommands.description', "Run several commands"),
                    args: [
                        {
                            name: 'args',
                            schema: {
                                type: 'object',
                                required: ['commands'],
                                properties: {
                                    commands: {
                                        type: 'array',
                                        description: nls.localize('runCommands.commands', "Commands to run"),
                                        items: {
                                            anyOf: [
                                                {
                                                    $ref: 'vscode://schemas/keybindings#/definitions/commandNames'
                                                },
                                                {
                                                    type: 'string',
                                                },
                                                {
                                                    type: 'object',
                                                    required: ['command'],
                                                    properties: {
                                                        command: {
                                                            'anyOf': [
                                                                {
                                                                    $ref: 'vscode://schemas/keybindings#/definitions/commandNames'
                                                                },
                                                                {
                                                                    type: 'string'
                                                                },
                                                            ]
                                                        }
                                                    },
                                                    $ref: 'vscode://schemas/keybindings#/definitions/commandsSchemas'
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        // dev decisions:
        // - this command takes a single argument-object because
        //	- keybinding definitions don't allow running commands with several arguments
        //  - and we want to be able to take on different other arguments in future, e.g., `runMode : 'serial' | 'concurrent'`
        async run(accessor, args) {
            const notificationService = accessor.get(notification_1.INotificationService);
            if (!this._isCommandArgs(args)) {
                notificationService.error(nls.localize('runCommands.invalidArgs', "'runCommands' has received an argument with incorrect type. Please, review the argument passed to the command."));
                return;
            }
            if (args.commands.length === 0) {
                notificationService.warn(nls.localize('runCommands.noCommandsToRun', "'runCommands' has not received commands to run. Did you forget to pass commands in the 'runCommands' argument?"));
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const logService = accessor.get(log_1.ILogService);
            let i = 0;
            try {
                for (; i < args.commands.length; ++i) {
                    const cmd = args.commands[i];
                    logService.debug(`runCommands: executing ${i}-th command: ${JSON.stringify(cmd)}`);
                    const r = await this._runCommand(commandService, cmd);
                    logService.debug(`runCommands: executed ${i}-th command with return value: ${JSON.stringify(r)}`);
                }
            }
            catch (err) {
                logService.debug(`runCommands: executing ${i}-th command resulted in an error: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
                notificationService.error(err);
            }
        }
        _isCommandArgs(args) {
            if (!args || typeof args !== 'object') {
                return false;
            }
            if (!('commands' in args) || !Array.isArray(args.commands)) {
                return false;
            }
            for (const cmd of args.commands) {
                if (typeof cmd === 'string') {
                    continue;
                }
                if (typeof cmd === 'object' && typeof cmd.command === 'string') {
                    continue;
                }
                return false;
            }
            return true;
        }
        _runCommand(commandService, cmd) {
            let commandID, commandArgs;
            if (typeof cmd === 'string') {
                commandID = cmd;
            }
            else {
                commandID = cmd.command;
                commandArgs = cmd.args;
            }
            if (commandArgs === undefined) {
                return commandService.executeCommand(commandID);
            }
            else {
                if (Array.isArray(commandArgs)) {
                    return commandService.executeCommand(commandID, ...commandArgs);
                }
                else {
                    return commandService.executeCommand(commandID, commandArgs);
                }
            }
        }
    }
    (0, actions_1.registerAction2)(RunCommands);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tYW5kcy9jb21tb24vY29tbWFuZHMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZWhHLHdEQUF3RDtJQUN4RCxNQUFNLFdBQVksU0FBUSxpQkFBTztRQUVoQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsYUFBYTtnQkFDakIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLGNBQWMsQ0FBQztnQkFDbkQsRUFBRSxFQUFFLEtBQUs7Z0JBQ1QsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLHNCQUFzQixDQUFDO29CQUM1RSxJQUFJLEVBQUU7d0JBQ0w7NEJBQ0MsSUFBSSxFQUFFLE1BQU07NEJBQ1osTUFBTSxFQUFFO2dDQUNQLElBQUksRUFBRSxRQUFRO2dDQUNkLFFBQVEsRUFBRSxDQUFDLFVBQVUsQ0FBQztnQ0FDdEIsVUFBVSxFQUFFO29DQUNYLFFBQVEsRUFBRTt3Q0FDVCxJQUFJLEVBQUUsT0FBTzt3Q0FDYixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxpQkFBaUIsQ0FBQzt3Q0FDcEUsS0FBSyxFQUFFOzRDQUNOLEtBQUssRUFBRTtnREFDTjtvREFDQyxJQUFJLEVBQUUsd0RBQXdEO2lEQUM5RDtnREFDRDtvREFDQyxJQUFJLEVBQUUsUUFBUTtpREFDZDtnREFDRDtvREFDQyxJQUFJLEVBQUUsUUFBUTtvREFDZCxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0RBQ3JCLFVBQVUsRUFBRTt3REFDWCxPQUFPLEVBQUU7NERBQ1IsT0FB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