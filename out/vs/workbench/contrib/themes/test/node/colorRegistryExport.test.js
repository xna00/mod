/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/base/test/common/utils", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry"], function (require, exports, color_1, utils_1, platform_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ColorRegistry', () => {
        if (process.env.VSCODE_COLOR_REGISTRY_EXPORT) {
            test('exports', () => {
                const themingRegistry = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution);
                const colors = themingRegistry.getColors();
                const replacer = (_key, value) => value instanceof color_1.Color ? color_1.Color.Format.CSS.formatHexA(value) : value;
                console.log(`#colors:${JSON.stringify(colors, replacer)}\n`);
            });
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JSZWdpc3RyeUV4cG9ydC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90aGVtZXMvdGVzdC9ub2RlL2NvbG9yUmVnaXN0cnlFeHBvcnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUMzQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtnQkFDcEIsTUFBTSxlQUFlLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWlCLDBCQUFVLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDbEYsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQVksRUFBRSxLQUFjLEVBQUUsRUFBRSxDQUNqRCxLQUFLLFlBQVksYUFBSyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==