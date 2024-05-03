/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/base/test/common/utils"], function (require, exports, assert, globals_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Sandbox', () => {
        test('globals', async () => {
            assert.ok(typeof globals_1.ipcRenderer.send === 'function');
            assert.ok(typeof globals_1.webFrame.setZoomLevel === 'function');
            assert.ok(typeof globals_1.process.platform === 'string');
            const config = await globals_1.context.resolveConfiguration();
            assert.ok(config);
            assert.ok(globals_1.context.configuration());
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL3NhbmRib3gvdGVzdC9lbGVjdHJvbi1zYW5kYm94L2dsb2JhbHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtRQUVyQixJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFCLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxxQkFBVyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sa0JBQVEsQ0FBQyxZQUFZLEtBQUssVUFBVSxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLGlCQUFPLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxDQUFDO1lBRWhELE1BQU0sTUFBTSxHQUFHLE1BQU0saUJBQU8sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxpQkFBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUMifQ==