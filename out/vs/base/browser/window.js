/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mainWindow = void 0;
    exports.ensureCodeWindow = ensureCodeWindow;
    exports.isAuxiliaryWindow = isAuxiliaryWindow;
    function ensureCodeWindow(targetWindow, fallbackWindowId) {
        const codeWindow = targetWindow;
        if (typeof codeWindow.vscodeWindowId !== 'number') {
            Object.defineProperty(codeWindow, 'vscodeWindowId', {
                get: () => fallbackWindowId
            });
        }
    }
    // eslint-disable-next-line no-restricted-globals
    exports.mainWindow = window;
    function isAuxiliaryWindow(obj) {
        if (obj === exports.mainWindow) {
            return false;
        }
        const candidate = obj;
        return typeof candidate?.vscodeWindowId === 'number';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvd2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyw0Q0FRQztJQUtELDhDQVFDO0lBckJELFNBQWdCLGdCQUFnQixDQUFDLFlBQW9CLEVBQUUsZ0JBQXdCO1FBQzlFLE1BQU0sVUFBVSxHQUFHLFlBQW1DLENBQUM7UUFFdkQsSUFBSSxPQUFPLFVBQVUsQ0FBQyxjQUFjLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDbkQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLEVBQUU7Z0JBQ25ELEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0I7YUFDM0IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUM7SUFFRCxpREFBaUQ7SUFDcEMsUUFBQSxVQUFVLEdBQUcsTUFBb0IsQ0FBQztJQUUvQyxTQUFnQixpQkFBaUIsQ0FBQyxHQUFXO1FBQzVDLElBQUksR0FBRyxLQUFLLGtCQUFVLEVBQUUsQ0FBQztZQUN4QixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBRyxHQUE2QixDQUFDO1FBRWhELE9BQU8sT0FBTyxTQUFTLEVBQUUsY0FBYyxLQUFLLFFBQVEsQ0FBQztJQUN0RCxDQUFDIn0=