/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isRemoteConsoleLog = isRemoteConsoleLog;
    exports.parse = parse;
    exports.getFirstFrame = getFirstFrame;
    exports.log = log;
    function isRemoteConsoleLog(obj) {
        const entry = obj;
        return entry && typeof entry.type === 'string' && typeof entry.severity === 'string';
    }
    function parse(entry) {
        const args = [];
        let stack;
        // Parse Entry
        try {
            const parsedArguments = JSON.parse(entry.arguments);
            // Check for special stack entry as last entry
            const stackArgument = parsedArguments[parsedArguments.length - 1];
            if (stackArgument && stackArgument.__$stack) {
                parsedArguments.pop(); // stack is handled specially
                stack = stackArgument.__$stack;
            }
            args.push(...parsedArguments);
        }
        catch (error) {
            args.push('Unable to log remote console arguments', entry.arguments);
        }
        return { args, stack };
    }
    function getFirstFrame(arg0) {
        if (typeof arg0 !== 'string') {
            return getFirstFrame(parse(arg0).stack);
        }
        // Parse a source information out of the stack if we have one. Format can be:
        // at vscode.commands.registerCommand (/Users/someone/Desktop/test-ts/out/src/extension.js:18:17)
        // or
        // at /Users/someone/Desktop/test-ts/out/src/extension.js:18:17
        // or
        // at c:\Users\someone\Desktop\end-js\extension.js:19:17
        // or
        // at e.$executeContributedCommand(c:\Users\someone\Desktop\end-js\extension.js:19:17)
        const stack = arg0;
        if (stack) {
            const topFrame = findFirstFrame(stack);
            // at [^\/]* => line starts with "at" followed by any character except '/' (to not capture unix paths too late)
            // (?:(?:[a-zA-Z]+:)|(?:[\/])|(?:\\\\) => windows drive letter OR unix root OR unc root
            // (?:.+) => simple pattern for the path, only works because of the line/col pattern after
            // :(?:\d+):(?:\d+) => :line:column data
            const matches = /at [^\/]*((?:(?:[a-zA-Z]+:)|(?:[\/])|(?:\\\\))(?:.+)):(\d+):(\d+)/.exec(topFrame || '');
            if (matches && matches.length === 4) {
                return {
                    uri: uri_1.URI.file(matches[1]),
                    line: Number(matches[2]),
                    column: Number(matches[3])
                };
            }
        }
        return undefined;
    }
    function findFirstFrame(stack) {
        if (!stack) {
            return stack;
        }
        const newlineIndex = stack.indexOf('\n');
        if (newlineIndex === -1) {
            return stack;
        }
        return stack.substring(0, newlineIndex);
    }
    function log(entry, label) {
        const { args, stack } = parse(entry);
        const isOneStringArg = typeof args[0] === 'string' && args.length === 1;
        let topFrame = findFirstFrame(stack);
        if (topFrame) {
            topFrame = `(${topFrame.trim()})`;
        }
        let consoleArgs = [];
        // First arg is a string
        if (typeof args[0] === 'string') {
            if (topFrame && isOneStringArg) {
                consoleArgs = [`%c[${label}] %c${args[0]} %c${topFrame}`, color('blue'), color(''), color('grey')];
            }
            else {
                consoleArgs = [`%c[${label}] %c${args[0]}`, color('blue'), color(''), ...args.slice(1)];
            }
        }
        // First arg is something else, just apply all
        else {
            consoleArgs = [`%c[${label}]%`, color('blue'), ...args];
        }
        // Stack: add to args unless already added
        if (topFrame && !isOneStringArg) {
            consoleArgs.push(topFrame);
        }
        // Log it
        if (typeof console[entry.severity] !== 'function') {
            throw new Error('Unknown console method');
        }
        console[entry.severity].apply(console, consoleArgs);
    }
    function color(color) {
        return `color: ${color}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vY29uc29sZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9CaEcsZ0RBSUM7SUFFRCxzQkFxQkM7SUFJRCxzQ0FnQ0M7SUFlRCxrQkFvQ0M7SUFsSEQsU0FBZ0Isa0JBQWtCLENBQUMsR0FBUTtRQUMxQyxNQUFNLEtBQUssR0FBRyxHQUF3QixDQUFDO1FBRXZDLE9BQU8sS0FBSyxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQztJQUN0RixDQUFDO0lBRUQsU0FBZ0IsS0FBSyxDQUFDLEtBQXdCO1FBQzdDLE1BQU0sSUFBSSxHQUFVLEVBQUUsQ0FBQztRQUN2QixJQUFJLEtBQXlCLENBQUM7UUFFOUIsY0FBYztRQUNkLElBQUksQ0FBQztZQUNKLE1BQU0sZUFBZSxHQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTNELDhDQUE4QztZQUM5QyxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQW1CLENBQUM7WUFDcEYsSUFBSSxhQUFhLElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM3QyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyw2QkFBNkI7Z0JBQ3BELEtBQUssR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDO1lBQ2hDLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyx3Q0FBd0Ms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