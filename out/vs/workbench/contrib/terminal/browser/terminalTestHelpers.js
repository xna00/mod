/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async"], function (require, exports, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.writeP = writeP;
    async function writeP(terminal, data) {
        return new Promise((resolve, reject) => {
            const failTimeout = (0, async_1.timeout)(2000);
            failTimeout.then(() => reject('Writing to xterm is taking longer than 2 seconds'));
            terminal.write(data, () => {
                failTimeout.cancel();
                resolve();
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUZXN0SGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFRlc3RIZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLHdCQVNDO0lBVE0sS0FBSyxVQUFVLE1BQU0sQ0FBQyxRQUFrQixFQUFFLElBQVk7UUFDNUQsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QyxNQUFNLFdBQVcsR0FBRyxJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxrREFBa0QsQ0FBQyxDQUFDLENBQUM7WUFDbkYsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUN6QixXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMifQ==