/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatMessageForTerminal = formatMessageForTerminal;
    /**
     * Formats a message from the product to be written to the terminal.
     */
    function formatMessageForTerminal(message, options = {}) {
        let result = '';
        if (!options.excludeLeadingNewLine) {
            result += '\r\n';
        }
        result += '\x1b[0m\x1b[7m * ';
        if (options.loudFormatting) {
            result += '\x1b[0;104m';
        }
        else {
            result += '\x1b[0m';
        }
        result += ` ${message} \x1b[0m\n\r`;
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdHJpbmdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vdGVybWluYWxTdHJpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyw0REFhQztJQWhCRDs7T0FFRztJQUNILFNBQWdCLHdCQUF3QixDQUFDLE9BQWUsRUFBRSxVQUF5QyxFQUFFO1FBQ3BHLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDcEMsTUFBTSxJQUFJLE1BQU0sQ0FBQztRQUNsQixDQUFDO1FBQ0QsTUFBTSxJQUFJLG1CQUFtQixDQUFDO1FBQzlCLElBQUksT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzVCLE1BQU0sSUFBSSxhQUFhLENBQUM7UUFDekIsQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLElBQUksU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFDRCxNQUFNLElBQUksSUFBSSxPQUFPLGNBQWMsQ0FBQztRQUNwQyxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMifQ==