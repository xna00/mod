/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/product/common/product", "vs/base/common/platform", "vs/base/test/common/utils"], function (require, exports, assert, environmentMainService_1, product_1, platform_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EnvironmentMainService', () => {
        test('can unset and restore snap env variables', () => {
            const service = new environmentMainService_1.EnvironmentMainService({ '_': [] }, { '_serviceBrand': undefined, ...product_1.default });
            process.env['TEST_ARG1_VSCODE_SNAP_ORIG'] = 'original';
            process.env['TEST_ARG1'] = 'modified';
            process.env['TEST_ARG2_SNAP'] = 'test_arg2';
            process.env['TEST_ARG3_VSCODE_SNAP_ORIG'] = '';
            process.env['TEST_ARG3'] = 'test_arg3_non_empty';
            // Unset snap env variables
            service.unsetSnapExportedVariables();
            if (platform_1.isLinux) {
                assert.strictEqual(process.env['TEST_ARG1'], 'original');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], undefined);
            }
            else {
                assert.strictEqual(process.env['TEST_ARG1'], 'modified');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], 'test_arg3_non_empty');
            }
            // Restore snap env variables
            service.restoreSnapExportedVariables();
            if (platform_1.isLinux) {
                assert.strictEqual(process.env['TEST_ARG1'], 'modified');
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], 'test_arg3_non_empty');
            }
            else {
                assert.strictEqual(process.env['TEST_ARG1'], 'modified');
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], 'test_arg3_non_empty');
            }
        });
        test('can invoke unsetSnapExportedVariables and restoreSnapExportedVariables multiple times', () => {
            const service = new environmentMainService_1.EnvironmentMainService({ '_': [] }, { '_serviceBrand': undefined, ...product_1.default });
            // Mock snap environment
            process.env['SNAP'] = '1';
            process.env['SNAP_REVISION'] = 'test_revision';
            process.env['TEST_ARG1_VSCODE_SNAP_ORIG'] = 'original';
            process.env['TEST_ARG1'] = 'modified';
            process.env['TEST_ARG2_SNAP'] = 'test_arg2';
            process.env['TEST_ARG3_VSCODE_SNAP_ORIG'] = '';
            process.env['TEST_ARG3'] = 'test_arg3_non_empty';
            // Unset snap env variables
            service.unsetSnapExportedVariables();
            service.unsetSnapExportedVariables();
            service.unsetSnapExportedVariables();
            if (platform_1.isLinux) {
                assert.strictEqual(process.env['TEST_ARG1'], 'original');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], undefined);
            }
            else {
                assert.strictEqual(process.env['TEST_ARG1'], 'modified');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], 'test_arg3_non_empty');
            }
            // Restore snap env variables
            service.restoreSnapExportedVariables();
            service.restoreSnapExportedVariables();
            if (platform_1.isLinux) {
                assert.strictEqual(process.env['TEST_ARG1'], 'modified');
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], 'test_arg3_non_empty');
            }
            else {
                assert.strictEqual(process.env['TEST_ARG1'], 'modified');
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], 'test_arg3_non_empty');
            }
            // Unset snap env variables
            service.unsetSnapExportedVariables();
            if (platform_1.isLinux) {
                assert.strictEqual(process.env['TEST_ARG1'], 'original');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], undefined);
            }
            else {
                assert.strictEqual(process.env['TEST_ARG1'], 'modified');
                assert.strictEqual(process.env['TEST_ARG2'], undefined);
                assert.strictEqual(process.env['TEST_ARG1_VSCODE_SNAP_ORIG'], 'original');
                assert.strictEqual(process.env['TEST_ARG2_SNAP'], 'test_arg2');
                assert.strictEqual(process.env['TEST_ARG3_VSCODE_SNAP_ORIG'], '');
                assert.strictEqual(process.env['TEST_ARG3'], 'test_arg3_non_empty');
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRNYWluU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9lbnZpcm9ubWVudC90ZXN0L2VsZWN0cm9uLW1haW4vZW52aXJvbm1lbnRNYWluU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7UUFFcEMsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNyRCxNQUFNLE9BQU8sR0FBRyxJQUFJLCtDQUFzQixDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxHQUFHLGlCQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRXBHLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLFdBQVcsQ0FBQztZQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcscUJBQXFCLENBQUM7WUFFakQsMkJBQTJCO1lBQzNCLE9BQU8sQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQ3JDLElBQUksa0JBQU8sRUFBRSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBRUQsNkJBQTZCO1lBQzdCLE9BQU8sQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1lBQ3ZDLElBQUksa0JBQU8sRUFBRSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUNyRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1RkFBdUYsRUFBRSxHQUFHLEVBQUU7WUFDbEcsTUFBTSxPQUFPLEdBQUcsSUFBSSwrQ0FBc0IsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsR0FBRyxpQkFBTyxFQUFFLENBQUMsQ0FBQztZQUNwRyx3QkFBd0I7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsR0FBRyxlQUFlLENBQUM7WUFFL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLFVBQVUsQ0FBQztZQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFVBQVUsQ0FBQztZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsV0FBVyxDQUFDO1lBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxxQkFBcUIsQ0FBQztZQUVqRCwyQkFBMkI7WUFDM0IsT0FBTyxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDckMsT0FBTyxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDckMsT0FBTyxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDckMsSUFBSSxrQkFBTyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7WUFFRCw2QkFBNkI7WUFDN0IsT0FBTyxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDdkMsT0FBTyxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDdkMsSUFBSSxrQkFBTyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDckUsQ0FBQztZQUVELDJCQUEyQjtZQUMzQixPQUFPLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUNyQyxJQUFJLGtCQUFPLEVBQUUsQ0FBQztnQkFDYixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDckUsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=