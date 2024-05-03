/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/css!./media/stickyScroll"], function (require, exports, color_1, nls_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalStickyScrollHoverBackground = exports.terminalStickyScrollBackground = void 0;
    exports.terminalStickyScrollBackground = (0, colorRegistry_1.registerColor)('terminalStickyScroll.background', {
        light: null,
        dark: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('terminalStickyScroll.background', 'The background color of the sticky scroll overlay in the terminal.'));
    exports.terminalStickyScrollHoverBackground = (0, colorRegistry_1.registerColor)('terminalStickyScrollHover.background', {
        dark: '#2A2D2E',
        light: '#F0F0F0',
        hcDark: null,
        hcLight: color_1.Color.fromHex('#0F4A85').transparent(0.1)
    }, (0, nls_1.localize)('terminalStickyScrollHover.background', 'The background color of the sticky scroll overlay in the terminal when hovered.'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGlja3lTY3JvbGxDb2xvclJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvdGVybWluYWxTdGlja3lTY3JvbGxDb2xvclJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9uRixRQUFBLDhCQUE4QixHQUFHLElBQUEsNkJBQWEsRUFBQyxpQ0FBaUMsRUFBRTtRQUM5RixLQUFLLEVBQUUsSUFBSTtRQUNYLElBQUksRUFBRSxJQUFJO1FBQ1YsTUFBTSxFQUFFLElBQUk7UUFDWixPQUFPLEVBQUUsSUFBSTtLQUNiLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUNBQWlDLEVBQUUsb0VBQW9FLENBQUMsQ0FBQyxDQUFDO0lBRXpHLFFBQUEsbUNBQW1DLEdBQUcsSUFBQSw2QkFBYSxFQUFDLHNDQUFzQyxFQUFFO1FBQ3hHLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsTUFBTSxFQUFFLElBQUk7UUFDWixPQUFPLEVBQUUsYUFBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO0tBQ2xELEVBQUUsSUFBQSxjQUFRLEVBQUMsc0NBQXNDLEVBQUUsaUZBQWlGLENBQUMsQ0FBQyxDQUFDIn0=