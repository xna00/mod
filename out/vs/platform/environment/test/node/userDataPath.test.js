/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/environment/node/argv", "vs/platform/environment/node/userDataPath", "vs/platform/product/common/product"], function (require, exports, assert, utils_1, argv_1, userDataPath_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('User data path', () => {
        test('getUserDataPath - default', () => {
            const path = (0, userDataPath_1.getUserDataPath)((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), product_1.default.nameShort);
            assert.ok(path.length > 0);
        });
        test('getUserDataPath - portable mode', () => {
            const origPortable = process.env['VSCODE_PORTABLE'];
            try {
                const portableDir = 'portable-dir';
                process.env['VSCODE_PORTABLE'] = portableDir;
                const path = (0, userDataPath_1.getUserDataPath)((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), product_1.default.nameShort);
                assert.ok(path.includes(portableDir));
            }
            finally {
                if (typeof origPortable === 'string') {
                    process.env['VSCODE_PORTABLE'] = origPortable;
                }
                else {
                    delete process.env['VSCODE_PORTABLE'];
                }
            }
        });
        test('getUserDataPath - --user-data-dir', () => {
            const cliUserDataDir = 'cli-data-dir';
            const args = (0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS);
            args['user-data-dir'] = cliUserDataDir;
            const path = (0, userDataPath_1.getUserDataPath)(args, product_1.default.nameShort);
            assert.ok(path.includes(cliUserDataDir));
        });
        test('getUserDataPath - VSCODE_APPDATA', () => {
            const origAppData = process.env['VSCODE_APPDATA'];
            try {
                const appDataDir = 'appdata-dir';
                process.env['VSCODE_APPDATA'] = appDataDir;
                const path = (0, userDataPath_1.getUserDataPath)((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), product_1.default.nameShort);
                assert.ok(path.includes(appDataDir));
            }
            finally {
                if (typeof origAppData === 'string') {
                    process.env['VSCODE_APPDATA'] = origAppData;
                }
                else {
                    delete process.env['VSCODE_APPDATA'];
                }
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQYXRoLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2Vudmlyb25tZW50L3Rlc3Qvbm9kZS91c2VyRGF0YVBhdGgudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBRTVCLElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEdBQUcsSUFBQSw4QkFBZSxFQUFDLElBQUEsZ0JBQVMsRUFBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQU8sQ0FBQyxFQUFFLGlCQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDO2dCQUNKLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQztnQkFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFdBQVcsQ0FBQztnQkFFN0MsTUFBTSxJQUFJLEdBQUcsSUFBQSw4QkFBZSxFQUFDLElBQUEsZ0JBQVMsRUFBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQU8sQ0FBQyxFQUFFLGlCQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2xGLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLE9BQU8sWUFBWSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsWUFBWSxDQUFDO2dCQUMvQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sY0FBYyxHQUFHLGNBQWMsQ0FBQztZQUN0QyxNQUFNLElBQUksR0FBRyxJQUFBLGdCQUFTLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFPLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsY0FBYyxDQUFDO1lBRXZDLE1BQU0sSUFBSSxHQUFHLElBQUEsOEJBQWUsRUFBQyxJQUFJLEVBQUUsaUJBQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7WUFDN0MsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQztnQkFDSixNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUM7Z0JBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxVQUFVLENBQUM7Z0JBRTNDLE1BQU0sSUFBSSxHQUFHLElBQUEsOEJBQWUsRUFBQyxJQUFBLGdCQUFTLEVBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFPLENBQUMsRUFBRSxpQkFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNsRixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN0QyxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLFdBQVcsQ0FBQztnQkFDN0MsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=