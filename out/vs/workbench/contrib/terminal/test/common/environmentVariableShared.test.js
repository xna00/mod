/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/terminal/common/environmentVariableShared", "vs/platform/terminal/common/environmentVariable", "vs/base/test/common/utils"], function (require, exports, assert_1, environmentVariableShared_1, environmentVariable_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EnvironmentVariable - deserializeEnvironmentVariableCollection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should construct correctly with 3 arguments', () => {
            const c = (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' }],
                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C' }]
            ]);
            const keys = [...c.keys()];
            (0, assert_1.deepStrictEqual)(keys, ['A', 'B', 'C']);
            (0, assert_1.deepStrictEqual)(c.get('A'), { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' });
            (0, assert_1.deepStrictEqual)(c.get('B'), { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' });
            (0, assert_1.deepStrictEqual)(c.get('C'), { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C' });
        });
    });
    suite('EnvironmentVariable - serializeEnvironmentVariableCollection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should correctly serialize the object', () => {
            const collection = new Map();
            (0, assert_1.deepStrictEqual)((0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(collection), []);
            collection.set('A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' });
            collection.set('B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' });
            collection.set('C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C' });
            (0, assert_1.deepStrictEqual)((0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(collection), [
                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' }],
                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C' }]
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZVNoYXJlZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2NvbW1vbi9lbnZpcm9ubWVudFZhcmlhYmxlU2hhcmVkLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsS0FBSyxDQUFDLGdFQUFnRSxFQUFFLEdBQUcsRUFBRTtRQUM1RSxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN4RCxNQUFNLENBQUMsR0FBRyxJQUFBLG9FQUF3QyxFQUFDO2dCQUNsRCxDQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9EQUE4QixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUM7Z0JBQ2xGLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQztnQkFDakYsQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvREFBOEIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDO2FBQ2xGLENBQUMsQ0FBQztZQUNILE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMzQixJQUFBLHdCQUFlLEVBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUEsd0JBQWUsRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3pHLElBQUEsd0JBQWUsRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3hHLElBQUEsd0JBQWUsRUFBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzFHLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO1FBQzFFLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1lBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxFQUF1QyxDQUFDO1lBQ2xFLElBQUEsd0JBQWUsRUFBQyxJQUFBLGtFQUFzQyxFQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ2pHLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ2hHLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ2pHLElBQUEsd0JBQWUsRUFBQyxJQUFBLGtFQUFzQyxFQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNuRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG9EQUE4QixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUM7Z0JBQ2xGLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQztnQkFDakYsQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxvREFBOEIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDO2FBQ2xGLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==