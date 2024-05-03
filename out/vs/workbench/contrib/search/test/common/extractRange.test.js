/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/search/common/search"], function (require, exports, assert, utils_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('extractRangeFromFilter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('basics', async function () {
            assert.ok(!(0, search_1.extractRangeFromFilter)(''));
            assert.ok(!(0, search_1.extractRangeFromFilter)('/some/path'));
            assert.ok(!(0, search_1.extractRangeFromFilter)('/some/path/file.txt'));
            for (const lineSep of [':', '#', '(', ':line ']) {
                for (const colSep of [':', '#', ',']) {
                    const base = '/some/path/file.txt';
                    let res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20`);
                    assert.strictEqual(res?.filter, base);
                    assert.strictEqual(res?.range.startLineNumber, 20);
                    assert.strictEqual(res?.range.startColumn, 1);
                    res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20${colSep}`);
                    assert.strictEqual(res?.filter, base);
                    assert.strictEqual(res?.range.startLineNumber, 20);
                    assert.strictEqual(res?.range.startColumn, 1);
                    res = (0, search_1.extractRangeFromFilter)(`${base}${lineSep}20${colSep}3`);
                    assert.strictEqual(res?.filter, base);
                    assert.strictEqual(res?.range.startLineNumber, 20);
                    assert.strictEqual(res?.range.startColumn, 3);
                }
            }
        });
        test('allow space after path', async function () {
            const res = (0, search_1.extractRangeFromFilter)('/some/path/file.txt (19,20)');
            assert.strictEqual(res?.filter, '/some/path/file.txt');
            assert.strictEqual(res?.range.startLineNumber, 19);
            assert.strictEqual(res?.range.startColumn, 20);
        });
        suite('unless', function () {
            const testSpecs = [
                // alpha-only symbol after unless
                { filter: '/some/path/file.txt@alphasymbol', unless: ['@'], result: undefined },
                // unless as first char
                { filter: '@/some/path/file.txt (19,20)', unless: ['@'], result: undefined },
                // unless as last char
                { filter: '/some/path/file.txt (19,20)@', unless: ['@'], result: undefined },
                // unless before ,
                {
                    filter: '/some/@path/file.txt (19,20)', unless: ['@'], result: {
                        filter: '/some/@path/file.txt',
                        range: {
                            endColumn: 20,
                            endLineNumber: 19,
                            startColumn: 20,
                            startLineNumber: 19
                        }
                    }
                },
                // unless before :
                {
                    filter: '/some/@path/file.txt:19:20', unless: ['@'], result: {
                        filter: '/some/@path/file.txt',
                        range: {
                            endColumn: 20,
                            endLineNumber: 19,
                            startColumn: 20,
                            startLineNumber: 19
                        }
                    }
                },
                // unless before #
                {
                    filter: '/some/@path/file.txt#19', unless: ['@'], result: {
                        filter: '/some/@path/file.txt',
                        range: {
                            endColumn: 1,
                            endLineNumber: 19,
                            startColumn: 1,
                            startLineNumber: 19
                        }
                    }
                },
            ];
            for (const { filter, unless, result } of testSpecs) {
                test(`${filter} - ${JSON.stringify(unless)}`, () => {
                    assert.deepStrictEqual((0, search_1.extractRangeFromFilter)(filter, unless), result);
                });
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdFJhbmdlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC90ZXN0L2NvbW1vbi9leHRyYWN0UmFuZ2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBRXBDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUs7WUFDbkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUEsK0JBQXNCLEVBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBQSwrQkFBc0IsRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFBLCtCQUFzQixFQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUUxRCxLQUFLLE1BQU0sT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakQsS0FBSyxNQUFNLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDdEMsTUFBTSxJQUFJLEdBQUcscUJBQXFCLENBQUM7b0JBRW5DLElBQUksR0FBRyxHQUFHLElBQUEsK0JBQXNCLEVBQUMsR0FBRyxJQUFJLEdBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQztvQkFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLENB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