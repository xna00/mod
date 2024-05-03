/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/processes", "vs/base/test/common/utils"], function (require, exports, assert, processes, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Processes', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('sanitizeProcessEnvironment', () => {
            const env = {
                FOO: 'bar',
                ELECTRON_ENABLE_STACK_DUMPING: 'x',
                ELECTRON_ENABLE_LOGGING: 'x',
                ELECTRON_NO_ASAR: 'x',
                ELECTRON_NO_ATTACH_CONSOLE: 'x',
                ELECTRON_RUN_AS_NODE: 'x',
                VSCODE_CLI: 'x',
                VSCODE_DEV: 'x',
                VSCODE_IPC_HOOK: 'x',
                VSCODE_NLS_CONFIG: 'x',
                VSCODE_PORTABLE: '3',
                VSCODE_PID: 'x',
                VSCODE_SHELL_LOGIN: '1',
                VSCODE_CODE_CACHE_PATH: 'x',
                VSCODE_NEW_VAR: 'x',
                GDK_PIXBUF_MODULE_FILE: 'x',
                GDK_PIXBUF_MODULEDIR: 'x'
            };
            processes.sanitizeProcessEnvironment(env);
            assert.strictEqual(env['FOO'], 'bar');
            assert.strictEqual(env['VSCODE_SHELL_LOGIN'], '1');
            assert.strictEqual(env['VSCODE_PORTABLE'], '3');
            assert.strictEqual(Object.keys(env).length, 3);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc2VzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vcHJvY2Vzc2VzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDdkIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7WUFDdkMsTUFBTSxHQUFHLEdBQUc7Z0JBQ1gsR0FBRyxFQUFFLEtBQUs7Z0JBQ1YsNkJBQTZCLEVBQUUsR0FBRztnQkFDbEMsdUJBQXVCLEVBQUUsR0FBRztnQkFDNUIsZ0JBQWdCLEVBQUUsR0FBRztnQkFDckIsMEJBQTBCLEVBQUUsR0FBRztnQkFDL0Isb0JBQW9CLEVBQUUsR0FBRztnQkFDekIsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsZUFBZSxFQUFFLEdBQUc7Z0JBQ3BCLGlCQUFpQixFQUFFLEdBQUc7Z0JBQ3RCLGVBQWUsRUFBRSxHQUFHO2dCQUNwQixVQUFVLEVBQUUsR0FBRztnQkFDZixrQkFBa0IsRUFBRSxHQUFHO2dCQUN2QixzQkFBc0IsRUFBRSxHQUFHO2dCQUMzQixjQUFjLEVBQUUsR0FBRztnQkFDbkIsc0JBQXNCLEVBQUUsR0FBRztnQkFDM0Isb0JBQW9CLEVBQUUsR0FBRzthQUN6QixDQUFDO1lBQ0YsU0FBUyxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==