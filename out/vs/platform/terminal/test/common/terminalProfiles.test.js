/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/codicons", "vs/base/test/common/utils", "vs/platform/terminal/common/terminalProfiles"], function (require, exports, assert_1, codicons_1, utils_1, terminalProfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('terminalProfiles', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('createProfileSchemaEnums', () => {
            test('should return an empty array when there are no profiles', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([]), {
                    values: [
                        null
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default'
                    ]
                });
            });
            test('should return a single entry when there is one profile', () => {
                const profile = {
                    profileName: 'name',
                    path: 'path',
                    isDefault: true
                };
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([profile]), {
                    values: [
                        null,
                        'name'
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default',
                        '$(terminal) name\n- path: path'
                    ]
                });
            });
            test('should show all profile information', () => {
                const profile = {
                    profileName: 'name',
                    path: 'path',
                    isDefault: true,
                    args: ['a', 'b'],
                    color: 'terminal.ansiRed',
                    env: {
                        c: 'd',
                        e: 'f'
                    },
                    icon: codicons_1.Codicon.zap,
                    overrideName: true
                };
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([profile]), {
                    values: [
                        null,
                        'name'
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default',
                        `$(zap) name\n- path: path\n- args: ['a','b']\n- overrideName: true\n- color: terminal.ansiRed\n- env: {\"c\":\"d\",\"e\":\"f\"}`
                    ]
                });
            });
            test('should return a multiple entries when there are multiple profiles', () => {
                const profile1 = {
                    profileName: 'name',
                    path: 'path',
                    isDefault: true
                };
                const profile2 = {
                    profileName: 'foo',
                    path: 'bar',
                    isDefault: false
                };
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([profile1, profile2]), {
                    values: [
                        null,
                        'name',
                        'foo'
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default',
                        '$(terminal) name\n- path: path',
                        '$(terminal) foo\n- path: bar'
                    ]
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC90ZXN0L2NvbW1vbi90ZXJtaW5hbFByb2ZpbGVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUM5QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxJQUFJLENBQUMseURBQXlELEVBQUUsR0FBRyxFQUFFO2dCQUNwRSxJQUFBLHdCQUFlLEVBQUMsSUFBQSwyQ0FBd0IsRUFBQyxFQUFFLENBQUMsRUFBRTtvQkFDN0MsTUFBTSxFQUFFO3dCQUNQLElBQUk7cUJBQ0o7b0JBQ0Qsb0JBQW9CLEVBQUU7d0JBQ3JCLGtDQUFrQztxQkFDbEM7aUJBQ0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsd0RBQXdELEVBQUUsR0FBRyxFQUFFO2dCQUNuRSxNQUFNLE9BQU8sR0FBcUI7b0JBQ2pDLFdBQVcsRUFBRSxNQUFNO29CQUNuQixJQUFJLEVBQUUsTUFBTTtvQkFDWixTQUFTLEVBQUUsSUFBSTtpQkFDZixDQUFDO2dCQUNGLElBQUEsd0JBQWUsRUFBQyxJQUFBLDJDQUF3QixFQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtvQkFDcEQsTUFBTSxFQUFFO3dCQUNQLElBQUk7d0JBQ0osTUFBTTtxQkFDTjtvQkFDRCxvQkFBb0IsRUFBRTt3QkFDckIsa0NBQWtDO3dCQUNsQyxnQ0FBZ0M7cUJBQ2hDO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtnQkFDaEQsTUFBTSxPQUFPLEdBQXFCO29CQUNqQyxXQUFXLEVBQUUsTUFBTTtvQkFDbkIsSUFBSSxFQUFFLE1BQU07b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDaEIsS0FBSyxFQUFFLGtCQUFrQjtvQkFDekIsR0FBRyxFQUFFO3dCQUNKLENBQUMsRUFBRSxHQUFHO3dCQUNOLENBQUMsRUFBRSxHQUFHO3FCQUNOO29CQUNELElBQUksRUFBRSxrQkFBTyxDQUFDLEdBQUc7b0JBQ2pCLFlBQVksRUFBRSxJQUFJO2lCQUNsQixDQUFDO2dCQUNGLElBQUEsd0JBQWUsRUFBQyxJQUFBLDJDQUF3QixFQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRTtvQkFDcEQsTUFBTSxFQUFFO3dCQUNQLElBQUk7d0JBQ0osTUFBTTtxQkFDTjtvQkFDRCxvQkFBb0IsRUFBRTt3QkFDckIsa0NBQWtDO3dCQUNsQyxpSUFBaUk7cUJBQ2pJO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLG1FQUFtRSxFQUFFLEdBQUcsRUFBRTtnQkFDOUUsTUFBTSxRQUFRLEdBQXFCO29CQUNsQyxXQUFXLEVBQUUsTUFBTTtvQkFDbkIsSUFBSSxFQUFFLE1BQU07b0JBQ1osU0FBUyxFQUFFLElBQUk7aUJBQ2YsQ0FBQztnQkFDRixNQUFNLFFBQVEsR0FBcUI7b0JBQ2xDLFdBQVcsRUFBRSxLQUFLO29CQUNsQixJQUFJLEVBQUUsS0FBSztvQkFDWCxTQUFTLEVBQUUsS0FBSztpQkFDaEIsQ0FBQztnQkFDRixJQUFBLHdCQUFlLEVBQUMsSUFBQSwyQ0FBd0IsRUFBQyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO29CQUMvRCxNQUFNLEVBQUU7d0JBQ1AsSUFBSTt3QkFDSixNQUFNO3dCQUNOLEtBQUs7cUJBQ0w7b0JBQ0Qsb0JBQW9CLEVBQUU7d0JBQ3JCLGtDQUFrQzt3QkFDbEMsZ0NBQWdDO3dCQUNoQyw4QkFBOEI7cUJBQzlCO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9