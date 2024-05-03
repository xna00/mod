/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/hash"], function (require, exports, buffer_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sha1Hex = sha1Hex;
    async function sha1Hex(str) {
        // Prefer to use browser's crypto module
        if (globalThis?.crypto?.subtle) {
            // Careful to use `dontUseNodeBuffer` when passing the
            // buffer to the browser `crypto` API. Users reported
            // native crashes in certain cases that we could trace
            // back to passing node.js `Buffer` around
            // (https://github.com/microsoft/vscode/issues/114227)
            const buffer = buffer_1.VSBuffer.fromString(str, { dontUseNodeBuffer: true }).buffer;
            const hash = await globalThis.crypto.subtle.digest({ name: 'sha-1' }, buffer);
            return (0, hash_1.toHexString)(hash);
        }
        // Otherwise fallback to `StringSHA1`
        else {
            const computer = new hash_1.StringSHA1();
            computer.update(str);
            return computer.digest();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2hhc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsMEJBdUJDO0lBdkJNLEtBQUssVUFBVSxPQUFPLENBQUMsR0FBVztRQUV4Qyx3Q0FBd0M7UUFDeEMsSUFBSSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBRWhDLHNEQUFzRDtZQUN0RCxxREFBcUQ7WUFDckQsc0RBQXNEO1lBQ3RELDBDQUEwQztZQUMxQyxzREFBc0Q7WUFDdEQsTUFBTSxNQUFNLEdBQUcsaUJBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDNUUsTUFBTSxJQUFJLEdBQUcsTUFBTSxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFOUUsT0FBTyxJQUFBLGtCQUFXLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELHFDQUFxQzthQUNoQyxDQUFDO1lBQ0wsTUFBTSxRQUFRLEdBQUcsSUFBSSxpQkFBVSxFQUFFLENBQUM7WUFDbEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVyQixPQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMxQixDQUFDO0lBQ0YsQ0FBQyJ9