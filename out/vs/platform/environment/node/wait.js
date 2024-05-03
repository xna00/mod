/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "os", "vs/base/common/extpath"], function (require, exports, fs_1, os_1, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createWaitMarkerFileSync = createWaitMarkerFileSync;
    function createWaitMarkerFileSync(verbose) {
        const randomWaitMarkerPath = (0, extpath_1.randomPath)((0, os_1.tmpdir)());
        try {
            (0, fs_1.writeFileSync)(randomWaitMarkerPath, ''); // use built-in fs to avoid dragging in more dependencies
            if (verbose) {
                console.log(`Marker file for --wait created: ${randomWaitMarkerPath}`);
            }
            return randomWaitMarkerPath;
        }
        catch (err) {
            if (verbose) {
                console.error(`Failed to create marker file for --wait: ${err}`);
            }
            return undefined;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FpdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZW52aXJvbm1lbnQvbm9kZS93YWl0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLDREQWVDO0lBZkQsU0FBZ0Isd0JBQXdCLENBQUMsT0FBaUI7UUFDekQsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLG9CQUFVLEVBQUMsSUFBQSxXQUFNLEdBQUUsQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQztZQUNKLElBQUEsa0JBQWEsRUFBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLHlEQUF5RDtZQUNsRyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLG9CQUFvQixFQUFFLENBQUMsQ0FBQztZQUN4RSxDQUFDO1lBQ0QsT0FBTyxvQkFBb0IsQ0FBQztRQUM3QixDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNkLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztJQUNGLENBQUMifQ==