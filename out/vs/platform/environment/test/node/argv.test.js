/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/platform/environment/node/argv", "vs/platform/environment/node/argvHelper"], function (require, exports, assert, utils_1, argv_1, argvHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function o(description, type = 'string') {
        return {
            description, type
        };
    }
    function c(description, options) {
        return {
            description, type: 'subcommand', options
        };
    }
    suite('formatOptions', () => {
        test('Text should display small columns correctly', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar')
            }, 80), ['  --add        bar']);
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar'),
                'wait': o('ba'),
                'trace': o('b')
            }, 80), [
                '  --add        bar',
                '  --wait       ba',
                '  --trace      b'
            ]);
        });
        test('Text should wrap', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar '.repeat(9))
            }, 40), [
                '  --add        bar bar bar bar bar bar',
                '               bar bar bar'
            ]);
        });
        test('Text should revert to the condensed view when the terminal is too narrow', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'add': o('bar '.repeat(9))
            }, 30), [
                '  --add',
                '      bar bar bar bar bar bar bar bar bar '
            ]);
        });
        test('addArg', () => {
            assert.deepStrictEqual((0, argvHelper_1.addArg)([], 'foo'), ['foo']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)([], 'foo', 'bar'), ['foo', 'bar']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['foo'], 'bar'), ['foo', 'bar']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['--wait'], 'bar'), ['--wait', 'bar']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['--wait', '--', '--foo'], 'bar'), ['--wait', 'bar', '--', '--foo']);
            assert.deepStrictEqual((0, argvHelper_1.addArg)(['--', '--foo'], 'bar'), ['bar', '--', '--foo']);
        });
        test('subcommands', () => {
            assert.deepStrictEqual((0, argv_1.formatOptions)({
                'testcmd': c('A test command', { add: o('A test command option') })
            }, 30), [
                '  --testcmd',
                '      A test command'
            ]);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    suite('parseArgs', () => {
        function newErrorReporter(result = [], command = '') {
            const commandPrefix = command ? command + '-' : '';
            return {
                onDeprecatedOption: (deprecatedId) => result.push(`${commandPrefix}onDeprecatedOption ${deprecatedId}`),
                onUnknownOption: (id) => result.push(`${commandPrefix}onUnknownOption ${id}`),
                onEmptyValue: (id) => result.push(`${commandPrefix}onEmptyValue ${id}`),
                onMultipleValues: (id, usedValue) => result.push(`${commandPrefix}onMultipleValues ${id} ${usedValue}`),
                getSubcommandReporter: (c) => newErrorReporter(result, commandPrefix + c),
                result
            };
        }
        function assertParse(options, input, expected, expectedErrors) {
            const errorReporter = newErrorReporter();
            assert.deepStrictEqual((0, argv_1.parseArgs)(input, options, errorReporter), expected);
            assert.deepStrictEqual(errorReporter.result, expectedErrors);
        }
        test('subcommands', () => {
            const options1 = {
                'testcmd': c('A test command', {
                    testArg: o('A test command option'),
                    _: { type: 'string[]' }
                }),
                _: { type: 'string[]' }
            };
            assertParse(options1, ['testcmd', '--testArg=foo'], { testcmd: { testArg: 'foo', '_': [] }, '_': [] }, []);
            assertParse(options1, ['testcmd', '--testArg=foo', '--testX'], { testcmd: { testArg: 'foo', '_': [] }, '_': [] }, ['testcmd-onUnknownOption testX']);
            const options2 = {
                'testcmd': c('A test command', {
                    testArg: o('A test command option')
                }),
                testX: { type: 'boolean', global: true, description: '' },
                _: { type: 'string[]' }
            };
            assertParse(options2, ['testcmd', '--testArg=foo', '--testX'], { testcmd: { testArg: 'foo', testX: true, '_': [] }, '_': [] }, []);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJndi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9lbnZpcm9ubWVudC90ZXN0L25vZGUvYXJndi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLFNBQVMsQ0FBQyxDQUFDLFdBQW1CLEVBQUUsT0FBMEMsUUFBUTtRQUNqRixPQUFPO1lBQ04sV0FBVyxFQUFFLElBQUk7U0FDakIsQ0FBQztJQUNILENBQUM7SUFDRCxTQUFTLENBQUMsQ0FBQyxXQUFtQixFQUFFLE9BQWdDO1FBQy9ELE9BQU87WUFDTixXQUFXLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPO1NBQ3hDLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFFM0IsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN4RCxNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLG9CQUFhLEVBQUM7Z0JBQ2IsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7YUFDZixFQUFFLEVBQUUsQ0FBQyxFQUNOLENBQUMsb0JBQW9CLENBQUMsQ0FDdEIsQ0FBQztZQUNGLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLElBQUEsb0JBQWEsRUFBQztnQkFDYixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDZixNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDZixPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQzthQUNmLEVBQUUsRUFBRSxDQUFDLEVBQ047Z0JBQ0Msb0JBQW9CO2dCQUNwQixtQkFBbUI7Z0JBQ25CLGtCQUFrQjthQUNsQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSxvQkFBYSxFQUFDO2dCQUNiLEtBQUssRUFBRSxDQUFDLENBQU8sTUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNqQyxFQUFFLEVBQUUsQ0FBQyxFQUNOO2dCQUNDLHdDQUF3QztnQkFDeEMsNEJBQTRCO2FBQzVCLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDBFQUEwRSxFQUFFLEdBQUcsRUFBRTtZQUNyRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLG9CQUFhLEVBQUM7Z0JBQ2IsS0FBSyxFQUFFLENBQUMsQ0FBTyxNQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2pDLEVBQUUsRUFBRSxDQUFDLEVBQ047Z0JBQ0MsU0FBUztnQkFDVCw0Q0FBNEM7YUFDNUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtZQUNuQixNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUJBQU0sRUFBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxtQkFBTSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsbUJBQU0sRUFBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1CQUFNLEVBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxtQkFBTSxFQUFDLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDbkcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG1CQUFNLEVBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDaEYsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUN4QixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLG9CQUFhLEVBQUM7Z0JBQ2IsU0FBUyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDO2FBQ25FLEVBQUUsRUFBRSxDQUFDLEVBQ047Z0JBQ0MsYUFBYTtnQkFDYixzQkFBc0I7YUFDdEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7SUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtRQUN2QixTQUFTLGdCQUFnQixDQUFDLFNBQW1CLEVBQUUsRUFBRSxPQUFPLEdBQUcsRUFBRTtZQUM1RCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNuRCxPQUFPO2dCQUNOLGtCQUFrQixFQUFFLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxzQkFBc0IsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZHLGVBQWUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLGFBQWEsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO2dCQUM3RSxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxhQUFhLGdCQUFnQixFQUFFLEVBQUUsQ0FBQztnQkFDdkUsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxvQkFBb0IsRUFBRSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUN2RyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ3pFLE1BQU07YUFDTixDQUFDO1FBQ0gsQ0FBQztRQUVELFNBQVMsV0FBVyxDQUFJLE9BQThCLEVBQUUsS0FBZSxFQUFFLFFBQVcsRUFBRSxjQUF3QjtZQUM3RyxNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxnQkFBUyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQVV4QixNQUFNLFFBQVEsR0FBRztnQkFDaEIsU0FBUyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDOUIsT0FBTyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDbkMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtpQkFDdkIsQ0FBQztnQkFDRixDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFO2FBQ1UsQ0FBQztZQUNuQyxXQUFXLENBQ1YsUUFBUSxFQUNSLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxFQUM1QixFQUFFLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDakQsRUFBRSxDQUNGLENBQUM7WUFDRixXQUFXLENBQ1YsUUFBUSxFQUNSLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxTQUFTLENBQUMsRUFDdkMsRUFBRSxPQUFPLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQ2pELENBQUMsK0JBQStCLENBQUMsQ0FDakMsQ0FBQztZQVlGLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixTQUFTLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixFQUFFO29CQUM5QixPQUFPLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDO2lCQUNuQyxDQUFDO2dCQUNGLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO2dCQUN6RCxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFO2FBQ1UsQ0FBQztZQUNuQyxXQUFXLENBQ1YsUUFBUSxFQUNSLENBQUMsU0FBUyxFQUFFLGVBQWUsRUFBRSxTQUFTLENBQUMsRUFDdkMsRUFBRSxPQUFPLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDOUQsRUFBRSxDQUNGLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9