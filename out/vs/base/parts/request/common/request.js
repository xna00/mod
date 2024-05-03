/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OfflineError = void 0;
    exports.isOfflineError = isOfflineError;
    const offlineName = 'Offline';
    /**
     * Checks if the given error is offline error
     */
    function isOfflineError(error) {
        if (error instanceof OfflineError) {
            return true;
        }
        return error instanceof Error && error.name === offlineName && error.message === offlineName;
    }
    class OfflineError extends Error {
        constructor() {
            super(offlineName);
            this.name = this.message;
        }
    }
    exports.OfflineError = OfflineError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9yZXF1ZXN0L2NvbW1vbi9yZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyx3Q0FLQztJQVZELE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQztJQUU5Qjs7T0FFRztJQUNILFNBQWdCLGNBQWMsQ0FBQyxLQUFVO1FBQ3hDLElBQUksS0FBSyxZQUFZLFlBQVksRUFBRSxDQUFDO1lBQ25DLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELE9BQU8sS0FBSyxZQUFZLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLFdBQVcsQ0FBQztJQUM5RixDQUFDO0lBRUQsTUFBYSxZQUFhLFNBQVEsS0FBSztRQUN0QztZQUNDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDMUIsQ0FBQztLQUNEO0lBTEQsb0NBS0MifQ==