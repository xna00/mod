/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.chunkInput = chunkInput;
    var Constants;
    (function (Constants) {
        /**
         * Writing large amounts of data can be corrupted for some reason, after looking into this is
         * appears to be a race condition around writing to the FD which may be based on how powerful
         * the hardware is. The workaround for this is to space out when large amounts of data is being
         * written to the terminal. See https://github.com/microsoft/vscode/issues/38137
         */
        Constants[Constants["WriteMaxChunkSize"] = 50] = "WriteMaxChunkSize";
    })(Constants || (Constants = {}));
    /**
     * Splits incoming pty data into chunks to try prevent data corruption that could occur when pasting
     * large amounts of data.
     */
    function chunkInput(data) {
        const chunks = [];
        let nextChunkStartIndex = 0;
        for (let i = 0; i < data.length - 1; i++) {
            if (
            // If the max chunk size is reached
            i - nextChunkStartIndex + 1 >= 50 /* Constants.WriteMaxChunkSize */ ||
                // If the next character is ESC, send the pending data to avoid splitting the escape
                // sequence.
                data[i + 1] === '\x1b') {
                chunks.push(data.substring(nextChunkStartIndex, i + 1));
                nextChunkStartIndex = i + 1;
                // Skip the next character as the chunk would be a single character
                i++;
            }
        }
        // Push final chunk
        if (nextChunkStartIndex !== data.length) {
            chunks.push(data.substring(nextChunkStartIndex));
        }
        return chunks;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vdGVybWluYWxQcm9jZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUZoRyxnQ0FzQkM7SUFwQ0QsSUFBVyxTQVFWO0lBUkQsV0FBVyxTQUFTO1FBQ25COzs7OztXQUtHO1FBQ0gsb0VBQXNCLENBQUE7SUFDdkIsQ0FBQyxFQVJVLFNBQVMsS0FBVCxTQUFTLFFBUW5CO0lBRUQ7OztPQUdHO0lBQ0gsU0FBZ0IsVUFBVSxDQUFDLElBQVk7UUFDdEMsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBQzVCLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzFDO1lBQ0MsbUNBQW1DO1lBQ25DLENBQUMsR0FBRyxtQkFBbUIsR0FBRyxDQUFDLHdDQUErQjtnQkFDMUQsb0ZBQW9GO2dCQUNwRixZQUFZO2dCQUNaLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssTUFBTSxFQUNyQixDQUFDO2dCQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEQsbUJBQW1CLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDNUIsbUVBQW1FO2dCQUNuRSxDQUFDLEVBQUUsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO1FBQ0QsbUJBQW1CO1FBQ25CLElBQUksbUJBQW1CLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyJ9