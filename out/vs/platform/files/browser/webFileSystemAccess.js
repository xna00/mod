/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebFileSystemAccess = void 0;
    /**
     * Typings for the https://wicg.github.io/file-system-access
     *
     * Use `supported(window)` to find out if the browser supports this kind of API.
     */
    var WebFileSystemAccess;
    (function (WebFileSystemAccess) {
        function supported(obj) {
            if (typeof obj?.showDirectoryPicker === 'function') {
                return true;
            }
            return false;
        }
        WebFileSystemAccess.supported = supported;
        function isFileSystemHandle(handle) {
            const candidate = handle;
            if (!candidate) {
                return false;
            }
            return typeof candidate.kind === 'string' && typeof candidate.queryPermission === 'function' && typeof candidate.requestPermission === 'function';
        }
        WebFileSystemAccess.isFileSystemHandle = isFileSystemHandle;
        function isFileSystemFileHandle(handle) {
            return handle.kind === 'file';
        }
        WebFileSystemAccess.isFileSystemFileHandle = isFileSystemFileHandle;
        function isFileSystemDirectoryHandle(handle) {
            return handle.kind === 'directory';
        }
        WebFileSystemAccess.isFileSystemDirectoryHandle = isFileSystemDirectoryHandle;
    })(WebFileSystemAccess || (exports.WebFileSystemAccess = WebFileSystemAccess = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViRmlsZVN5c3RlbUFjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvYnJvd3Nlci93ZWJGaWxlU3lzdGVtQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRzs7OztPQUlHO0lBQ0gsSUFBaUIsbUJBQW1CLENBMEJuQztJQTFCRCxXQUFpQixtQkFBbUI7UUFFbkMsU0FBZ0IsU0FBUyxDQUFDLEdBQWlCO1lBQzFDLElBQUksT0FBTyxHQUFHLEVBQUUsbUJBQW1CLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3BELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQU5lLDZCQUFTLFlBTXhCLENBQUE7UUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxNQUFlO1lBQ2pELE1BQU0sU0FBUyxHQUFHLE1BQXNDLENBQUM7WUFDekQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLE9BQU8sU0FBUyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxTQUFTLENBQUMsZUFBZSxLQUFLLFVBQVUsSUFBSSxPQUFPLFNBQVMsQ0FBQyxpQkFBaUIsS0FBSyxVQUFVLENBQUM7UUFDbkosQ0FBQztRQVBlLHNDQUFrQixxQkFPakMsQ0FBQTtRQUVELFNBQWdCLHNCQUFzQixDQUFDLE1BQXdCO1lBQzlELE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUM7UUFDL0IsQ0FBQztRQUZlLDBDQUFzQix5QkFFckMsQ0FBQTtRQUVELFNBQWdCLDJCQUEyQixDQUFDLE1BQXdCO1lBQ25FLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxXQUFXLENBQUM7UUFDcEMsQ0FBQztRQUZlLCtDQUEyQiw4QkFFMUMsQ0FBQTtJQUNGLENBQUMsRUExQmdCLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBMEJuQyJ9