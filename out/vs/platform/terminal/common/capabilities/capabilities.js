/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandInvalidationReason = exports.TerminalCapability = void 0;
    /**
     * Primarily driven by the shell integration feature, a terminal capability is the mechanism for
     * progressively enhancing various features that may not be supported in all terminals/shells.
     */
    var TerminalCapability;
    (function (TerminalCapability) {
        /**
         * The terminal can reliably detect the current working directory as soon as the change happens
         * within the buffer.
         */
        TerminalCapability[TerminalCapability["CwdDetection"] = 0] = "CwdDetection";
        /**
         * The terminal can reliably detect the current working directory when requested.
         */
        TerminalCapability[TerminalCapability["NaiveCwdDetection"] = 1] = "NaiveCwdDetection";
        /**
         * The terminal can reliably identify prompts, commands and command outputs within the buffer.
         */
        TerminalCapability[TerminalCapability["CommandDetection"] = 2] = "CommandDetection";
        /**
         * The terminal can often identify prompts, commands and command outputs within the buffer. It
         * may not be so good at remembering the position of commands that ran in the past. This state
         * may be enabled when something goes wrong or when using conpty for example.
         */
        TerminalCapability[TerminalCapability["PartialCommandDetection"] = 3] = "PartialCommandDetection";
        /**
         * Manages buffer marks that can be used for terminal navigation. The source of
         * the request (task, debug, etc) provides an ID, optional marker, hoverMessage, and hidden property. When
         * hidden is not provided, a generic decoration is added to the buffer and overview ruler.
         */
        TerminalCapability[TerminalCapability["BufferMarkDetection"] = 4] = "BufferMarkDetection";
    })(TerminalCapability || (exports.TerminalCapability = TerminalCapability = {}));
    var CommandInvalidationReason;
    (function (CommandInvalidationReason) {
        CommandInvalidationReason["Windows"] = "windows";
        CommandInvalidationReason["NoProblemsReported"] = "noProblemsReported";
    })(CommandInvalidationReason || (exports.CommandInvalidationReason = CommandInvalidationReason = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FwYWJpbGl0aWVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vY2FwYWJpbGl0aWVzL2NhcGFiaWxpdGllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQ2hHOzs7T0FHRztJQUNILElBQWtCLGtCQTJCakI7SUEzQkQsV0FBa0Isa0JBQWtCO1FBQ25DOzs7V0FHRztRQUNILDJFQUFZLENBQUE7UUFDWjs7V0FFRztRQUNILHFGQUFpQixDQUFBO1FBQ2pCOztXQUVHO1FBQ0gsbUZBQWdCLENBQUE7UUFDaEI7Ozs7V0FJRztRQUNILGlHQUF1QixDQUFBO1FBRXZCOzs7O1dBSUc7UUFDSCx5RkFBbUIsQ0FBQTtJQUNwQixDQUFDLEVBM0JpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQTJCbkM7SUF3RUQsSUFBa0IseUJBR2pCO0lBSEQsV0FBa0IseUJBQXlCO1FBQzFDLGdEQUFtQixDQUFBO1FBQ25CLHNFQUF5QyxDQUFBO0lBQzFDLENBQUMsRUFIaUIseUJBQXlCLHlDQUF6Qix5QkFBeUIsUUFHMUMifQ==