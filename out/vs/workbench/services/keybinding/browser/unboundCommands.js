/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/editor/browser/editorExtensions", "vs/platform/actions/common/actions"], function (require, exports, commands_1, arrays_1, editorExtensions_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAllUnboundCommands = getAllUnboundCommands;
    function getAllUnboundCommands(boundCommands) {
        const unboundCommands = [];
        const seenMap = new Map();
        const addCommand = (id, includeCommandWithArgs) => {
            if (seenMap.has(id)) {
                return;
            }
            seenMap.set(id, true);
            if (id[0] === '_' || id.indexOf('vscode.') === 0) { // private command
                return;
            }
            if (boundCommands.get(id) === true) {
                return;
            }
            if (!includeCommandWithArgs) {
                const command = commands_1.CommandsRegistry.getCommand(id);
                if (command && typeof command.metadata === 'object'
                    && (0, arrays_1.isNonEmptyArray)(command.metadata.args)) { // command with args
                    return;
                }
            }
            unboundCommands.push(id);
        };
        // Add all commands from Command Palette
        for (const menuItem of actions_1.MenuRegistry.getMenuItems(actions_1.MenuId.CommandPalette)) {
            if ((0, actions_1.isIMenuItem)(menuItem)) {
                addCommand(menuItem.command.id, true);
            }
        }
        // Add all editor actions
        for (const editorAction of editorExtensions_1.EditorExtensionsRegistry.getEditorActions()) {
            addCommand(editorAction.id, true);
        }
        for (const id of commands_1.CommandsRegistry.getCommands().keys()) {
            addCommand(id, false);
        }
        return unboundCommands;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5ib3VuZENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy9icm93c2VyL3VuYm91bmRDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxzREF5Q0M7SUF6Q0QsU0FBZ0IscUJBQXFCLENBQUMsYUFBbUM7UUFDeEUsTUFBTSxlQUFlLEdBQWEsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sT0FBTyxHQUF5QixJQUFJLEdBQUcsRUFBbUIsQ0FBQztRQUNqRSxNQUFNLFVBQVUsR0FBRyxDQUFDLEVBQVUsRUFBRSxzQkFBK0IsRUFBRSxFQUFFO1lBQ2xFLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RCLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsa0JBQWtCO2dCQUNyRSxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDcEMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxPQUFPLEdBQUcsMkJBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLE9BQU8sSUFBSSxPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUTt1QkFDL0MsSUFBQSx3QkFBZSxFQUFvQixPQUFPLENBQUMsUUFBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxvQkFBb0I7b0JBQ3JGLE9BQU87Z0JBQ1IsQ0FBQztZQUNGLENBQUM7WUFDRCxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQztRQUVGLHdDQUF3QztRQUN4QyxLQUFLLE1BQU0sUUFBUSxJQUFJLHNCQUFZLENBQUMsWUFBWSxDQUFDLGdCQUFNLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztZQUN6RSxJQUFJLElBQUEscUJBQVcsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMzQixVQUFVLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNGLENBQUM7UUFFRCx5QkFBeUI7UUFDekIsS0FBSyxNQUFNLFlBQVksSUFBSSwyQ0FBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUM7WUFDeEUsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELEtBQUssTUFBTSxFQUFFLElBQUksMkJBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUN4RCxVQUFVLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxPQUFPLGVBQWUsQ0FBQztJQUN4QixDQUFDIn0=