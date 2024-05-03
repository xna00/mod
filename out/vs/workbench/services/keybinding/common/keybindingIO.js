/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keybindingParser", "vs/platform/contextkey/common/contextkey"], function (require, exports, keybindingParser_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputBuilder = exports.KeybindingIO = void 0;
    class KeybindingIO {
        static writeKeybindingItem(out, item) {
            if (!item.resolvedKeybinding) {
                return;
            }
            const quotedSerializedKeybinding = JSON.stringify(item.resolvedKeybinding.getUserSettingsLabel());
            out.write(`{ "key": ${rightPaddedString(quotedSerializedKeybinding + ',', 25)} "command": `);
            const quotedSerializedWhen = item.when ? JSON.stringify(item.when.serialize()) : '';
            const quotedSerializeCommand = JSON.stringify(item.command);
            if (quotedSerializedWhen.length > 0) {
                out.write(`${quotedSerializeCommand},`);
                out.writeLine();
                out.write(`                                     "when": ${quotedSerializedWhen}`);
            }
            else {
                out.write(`${quotedSerializeCommand}`);
            }
            if (item.commandArgs) {
                out.write(',');
                out.writeLine();
                out.write(`                                     "args": ${JSON.stringify(item.commandArgs)}`);
            }
            out.write(' }');
        }
        static readUserKeybindingItem(input) {
            const keybinding = 'key' in input && typeof input.key === 'string'
                ? keybindingParser_1.KeybindingParser.parseKeybinding(input.key)
                : null;
            const when = 'when' in input && typeof input.when === 'string'
                ? contextkey_1.ContextKeyExpr.deserialize(input.when)
                : undefined;
            const command = 'command' in input && typeof input.command === 'string'
                ? input.command
                : null;
            const commandArgs = 'args' in input && typeof input.args !== 'undefined'
                ? input.args
                : undefined;
            return {
                keybinding,
                command,
                commandArgs,
                when,
                _sourceKey: 'key' in input && typeof input.key === 'string' ? input.key : undefined,
            };
        }
    }
    exports.KeybindingIO = KeybindingIO;
    function rightPaddedString(str, minChars) {
        if (str.length < minChars) {
            return str + (new Array(minChars - str.length).join(' '));
        }
        return str;
    }
    class OutputBuilder {
        constructor() {
            this._lines = [];
            this._currentLine = '';
        }
        write(str) {
            this._currentLine += str;
        }
        writeLine(str = '') {
            this._lines.push(this._currentLine + str);
            this._currentLine = '';
        }
        toString() {
            this.writeLine();
            return this._lines.join('\n');
        }
    }
    exports.OutputBuilder = OutputBuilder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0lPLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMva2V5YmluZGluZy9jb21tb24va2V5YmluZGluZ0lPLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLFlBQVk7UUFFakIsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEdBQWtCLEVBQUUsSUFBNEI7WUFDakYsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM5QixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sMEJBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1lBQ2xHLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxpQkFBaUIsQ0FBQywwQkFBMEIsR0FBRyxHQUFHLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTdGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNwRixNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVELElBQUksb0JBQW9CLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0RBQWdELG9CQUFvQixF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