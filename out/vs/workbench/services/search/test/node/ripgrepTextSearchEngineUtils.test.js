/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/resources", "vs/base/common/uri", "vs/workbench/services/search/node/ripgrepTextSearchEngine", "vs/workbench/services/search/common/searchExtTypes", "vs/base/test/common/utils"], function (require, exports, assert, resources_1, uri_1, ripgrepTextSearchEngine_1, searchExtTypes_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RipgrepTextSearchEngine', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('unicodeEscapesToPCRE2', async () => {
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u1234'), '\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u1234\\u0001'), '\\x{1234}\\x{0001}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\u1234bar'), 'foo\\x{1234}bar');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\\\\\u1234'), '\\\\\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\\\\\u1234'), 'foo\\\\\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u{1234}'), '\\x{1234}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u{1234}\\u{0001}'), '\\x{1234}\\x{0001}');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\u{1234}bar'), 'foo\\x{1234}bar');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('[\\u00A0-\\u00FF]'), '[\\x{00A0}-\\x{00FF}]');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo\\u{123456}7bar'), 'foo\\u{123456}7bar');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('\\u123'), '\\u123');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)('foo'), 'foo');
            assert.strictEqual((0, ripgrepTextSearchEngine_1.unicodeEscapesToPCRE2)(''), '');
        });
        test('fixRegexNewline - src', () => {
            const ttable = [
                ['foo', 'foo'],
                ['invalid(', 'invalid('],
                ['fo\\no', 'fo\\r?\\no'],
                ['f\\no\\no', 'f\\r?\\no\\r?\\no'],
                ['f[a-z\\n1]', 'f(?:[a-z1]|\\r?\\n)'],
                ['f[\\n-a]', 'f[\\n-a]'],
                ['(?<=\\n)\\w', '(?<=\\n)\\w'],
                ['fo\\n+o', 'fo(?:\\r?\\n)+o'],
                ['fo[^\\n]o', 'fo(?!\\r?\\n)o'],
                ['fo[^\\na-z]o', 'fo(?!\\r?\\n|[a-z])o'],
                ['foo[^\\n]+o', 'foo.+o'],
                ['foo[^\\nzq]+o', 'foo[^zq]+o'],
                ['foo[^\\nzq]+o', 'foo[^zq]+o'],
                // preserves quantifies, #137899
                ['fo[^\\S\\n]*o', 'fo[^\\S]*o'],
                ['fo[^\\S\\n]{3,}o', 'fo[^\\S]{3,}o'],
            ];
            for (const [input, expected] of ttable) {
                assert.strictEqual((0, ripgrepTextSearchEngine_1.fixRegexNewline)(input), expected, `${input} -> ${expected}`);
            }
        });
        test('fixRegexNewline - re', () => {
            function testFixRegexNewline([inputReg, testStr, shouldMatch]) {
                const fixed = (0, ripgrepTextSearchEngine_1.fixRegexNewline)(inputReg);
                const reg = new RegExp(fixed);
                assert.strictEqual(reg.test(testStr), shouldMatch, `${inputReg} => ${reg}, ${testStr}, ${shouldMatch}`);
            }
            [
                ['foo', 'foo', true],
                ['foo\\n', 'foo\r\n', true],
                ['foo\\n\\n', 'foo\n\n', true],
                ['foo\\n\\n', 'foo\r\n\r\n', true],
                ['foo\\n', 'foo\n', true],
                ['foo\\nabc', 'foo\r\nabc', true],
                ['foo\\nabc', 'foo\nabc', true],
                ['foo\\r\\n', 'foo\r\n', true],
                ['foo\\n+abc', 'foo\r\nabc', true],
                ['foo\\n+abc', 'foo\n\n\nabc', true],
                ['foo\\n+abc', 'foo\r\n\r\n\r\nabc', true],
                ['foo[\\n-9]+abc', 'foo1abc', true],
            ].forEach(testFixRegexNewline);
        });
        test('fixNewline - matching', () => {
            function testFixNewline([inputReg, testStr, shouldMatch = true]) {
                const fixed = (0, ripgrepTextSearchEngine_1.fixNewline)(inputReg);
                const reg = new RegExp(fixed);
                assert.strictEqual(reg.test(testStr), shouldMatch, `${inputReg} => ${reg}, ${testStr}, ${shouldMatch}`);
            }
            [
                ['foo', 'foo'],
                ['foo\n', 'foo\r\n'],
                ['foo\n', 'foo\n'],
                ['foo\nabc', 'foo\r\nabc'],
                ['foo\nabc', 'foo\nabc'],
                ['foo\r\n', 'foo\r\n'],
                ['foo\nbarc', 'foobar', false],
                ['foobar', 'foo\nbar', false],
            ].forEach(testFixNewline);
        });
        suite('RipgrepParser', () => {
            const TEST_FOLDER = uri_1.URI.file('/foo/bar');
            function testParser(inputData, expectedResults) {
                const testParser = new ripgrepTextSearchEngine_1.RipgrepParser(1000, TEST_FOLDER);
                const actualResults = [];
                testParser.on('result', r => {
                    actualResults.push(r);
                });
                inputData.forEach(d => testParser.handleData(d));
                testParser.flush();
                assert.deepStrictEqual(actualResults, expectedResults);
            }
            function makeRgMatch(relativePath, text, lineNumber, matchRanges) {
                return JSON.stringify({
                    type: 'match',
                    data: {
                        path: {
                            text: relativePath
                        },
                        lines: {
                            text
                        },
                        line_number: lineNumber,
                        absolute_offset: 0, // unused
                        submatches: matchRanges.map(mr => {
                            return {
                                ...mr,
                                match: { text: text.substring(mr.start, mr.end) }
                            };
                        })
                    }
                }) + '\n';
            }
            test('single result', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, [{ start: 3, end: 6 }])
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('multiple results', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app/file2.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app2/file3.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app/file2.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app2/file3.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('chopped-up input chunks', () => {
                const dataStrs = [
                    makeRgMatch('file1.js', 'foo bar', 4, [{ start: 3, end: 7 }]),
                    makeRgMatch('app/file2.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                    makeRgMatch('app2/file3.js', 'foobar', 4, [{ start: 3, end: 6 }]),
                ];
                const dataStr0Space = dataStrs[0].indexOf(' ');
                testParser([
                    dataStrs[0].substring(0, dataStr0Space + 1),
                    dataStrs[0].substring(dataStr0Space + 1),
                    '\n',
                    dataStrs[1].trim(),
                    '\n' + dataStrs[2].substring(0, 25),
                    dataStrs[2].substring(25)
                ], [
                    {
                        preview: {
                            text: 'foo bar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 7)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 7)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app/file2.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    },
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 3, 0, 6)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'app2/file3.js'),
                        ranges: [new searchExtTypes_1.Range(3, 3, 3, 6)]
                    }
                ]);
            });
            test('empty result (#100569)', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobar', 4, []),
                    makeRgMatch('file1.js', '', 5, []),
                ], [
                    {
                        preview: {
                            text: 'foobar',
                            matches: [new searchExtTypes_1.Range(0, 0, 0, 1)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 0, 3, 1)]
                    },
                    {
                        preview: {
                            text: '',
                            matches: [new searchExtTypes_1.Range(0, 0, 0, 0)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(4, 0, 4, 0)]
                    }
                ]);
            });
            test('multiple submatches without newline in between (#131507)', () => {
                testParser([
                    makeRgMatch('file1.js', 'foobarbazquux', 4, [{ start: 0, end: 4 }, { start: 6, end: 10 }]),
                ], [
                    {
                        preview: {
                            text: 'foobarbazquux',
                            matches: [new searchExtTypes_1.Range(0, 0, 0, 4), new searchExtTypes_1.Range(0, 6, 0, 10)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 0, 3, 4), new searchExtTypes_1.Range(3, 6, 3, 10)]
                    }
                ]);
            });
            test('multiple submatches with newline in between (#131507)', () => {
                testParser([
                    makeRgMatch('file1.js', 'foo\nbar\nbaz\nquux', 4, [{ start: 0, end: 5 }, { start: 8, end: 13 }]),
                ], [
                    {
                        preview: {
                            text: 'foo\nbar\nbaz\nquux',
                            matches: [new searchExtTypes_1.Range(0, 0, 1, 1), new searchExtTypes_1.Range(2, 0, 3, 1)]
                        },
                        uri: (0, resources_1.joinPath)(TEST_FOLDER, 'file1.js'),
                        ranges: [new searchExtTypes_1.Range(3, 0, 4, 1), new searchExtTypes_1.Range(5, 0, 6, 1)]
                    }
                ]);
            });
        });
        suite('getRgArgs', () => {
            test('simple includes', () => {
                // Only testing the args that come from includes.
                function testGetRgArgs(includes, expectedFromIncludes) {
                    const query = {
                        pattern: 'test'
                    };
                    const options = {
                        includes: includes,
                        excludes: [],
                        maxResults: 1000,
                        useIgnoreFiles: false,
                        followSymlinks: false,
                        useGlobalIgnoreFiles: false,
                        useParentIgnoreFiles: false,
                        folder: uri_1.URI.file('/some/folder')
                    };
                    const expected = [
                        '--hidden',
                        '--no-require-git',
                        '--ignore-case',
                        ...expectedFromIncludes,
                        '--no-ignore',
                        '--crlf',
                        '--fixed-strings',
                        '--no-config',
                        '--no-ignore-global',
                        '--json',
                        '--',
                        'test',
                        '.'
                    ];
                    const result = (0, ripgrepTextSearchEngine_1.getRgArgs)(query, options);
                    assert.deepStrictEqual(result, expected);
                }
                ([
                    [['a/*', 'b/*'], ['-g', '!*', '-g', '/a', '-g', '/a/*', '-g', '/b', '-g', '/b/*']],
                    [['**/a/*', 'b/*'], ['-g', '!*', '-g', '/b', '-g', '/b/*', '-g', '**/a/*']],
                    [['**/a/*', '**/b/*'], ['-g', '**/a/*', '-g', '**/b/*']],
                    [['foo/*bar/something/**'], ['-g', '!*', '-g', '/foo', '-g', '/foo/*bar', '-g', '/foo/*bar/something', '-g', '/foo/*bar/something/**']],
                ].forEach(([includes, expectedFromIncludes]) => testGetRgArgs(includes, expectedFromIncludes)));
            });
        });
        test('brace expansion for ripgrep', () => {
            function testBraceExpansion(argGlob, expectedGlob) {
                const result = (0, ripgrepTextSearchEngine_1.performBraceExpansionForRipgrep)(argGlob);
                assert.deepStrictEqual(result, expectedGlob);
            }
            [
                ['eep/{a,b}/test', ['eep/a/test', 'eep/b/test']],
                ['eep/{a,b}/{c,d,e}', ['eep/a/c', 'eep/a/d', 'eep/a/e', 'eep/b/c', 'eep/b/d', 'eep/b/e']],
                ['eep/{a,b}/\\{c,d,e}', ['eep/a/{c,d,e}', 'eep/b/{c,d,e}']],
                ['eep/{a,b\\}/test', ['eep/{a,b}/test']],
                ['eep/{a,b\\\\}/test', ['eep/a/test', 'eep/b\\\\/test']],
                ['eep/{a,b\\\\\\}/test', ['eep/{a,b\\\\}/test']],
                ['e\\{ep/{a,b}/test', ['e{ep/a/test', 'e{ep/b/test']],
                ['eep/{a,\\b}/test', ['eep/a/test', 'eep/\\b/test']],
                ['{a/*.*,b/*.*}', ['a/*.*', 'b/*.*']],
                ['{{}', ['{{}']],
                ['aa{{}', ['aa{{}']],
                ['{b{}', ['{b{}']],
                ['{{}c', ['{{}c']],
                ['{{}}', ['{{}}']],
                ['\\{{}}', ['{}']],
                ['{}foo', ['foo']],
                ['bar{ }foo', ['bar foo']],
                ['{}', ['']],
            ].forEach(([includePattern, expectedPatterns]) => testBraceExpansion(includePattern, expectedPatterns));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcFRleHRTZWFyY2hFbmdpbmVVdGlscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL3Rlc3Qvbm9kZS9yaXBncmVwVGV4dFNlYXJjaEVuZ2luZVV0aWxzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUNyQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwrQ0FBcUIsRUFBQyxTQUFTLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsK0NBQXFCLEVBQUMsZ0JBQWdCLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwrQ0FBcUIsRUFBQyxlQUFlLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwrQ0FBcUIsRUFBQyxhQUFhLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsK0NBQXFCLEVBQUMsZ0JBQWdCLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBRWhGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwrQ0FBcUIsRUFBQyxXQUFXLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsK0NBQXFCLEVBQUMsb0JBQW9CLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3RG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