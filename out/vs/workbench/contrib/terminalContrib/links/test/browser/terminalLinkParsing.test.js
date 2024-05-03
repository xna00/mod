/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing"], function (require, exports, assert_1, utils_1, terminalLinkParsing_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const operatingSystems = [
        3 /* OperatingSystem.Linux */,
        2 /* OperatingSystem.Macintosh */,
        1 /* OperatingSystem.Windows */
    ];
    const osTestPath = {
        [3 /* OperatingSystem.Linux */]: '/test/path/linux',
        [2 /* OperatingSystem.Macintosh */]: '/test/path/macintosh',
        [1 /* OperatingSystem.Windows */]: 'C:\\test\\path\\windows'
    };
    const osLabel = {
        [3 /* OperatingSystem.Linux */]: '[Linux]',
        [2 /* OperatingSystem.Macintosh */]: '[macOS]',
        [1 /* OperatingSystem.Windows */]: '[Windows]'
    };
    const testRow = 339;
    const testCol = 12;
    const testRowEnd = 341;
    const testColEnd = 789;
    const testLinks = [
        // Simple
        { link: 'foo', prefix: undefined, suffix: undefined, hasRow: false, hasCol: false },
        { link: 'foo:339', prefix: undefined, suffix: ':339', hasRow: true, hasCol: false },
        { link: 'foo:339:12', prefix: undefined, suffix: ':339:12', hasRow: true, hasCol: true },
        { link: 'foo:339:12-789', prefix: undefined, suffix: ':339:12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo:339.12', prefix: undefined, suffix: ':339.12', hasRow: true, hasCol: true },
        { link: 'foo:339.12-789', prefix: undefined, suffix: ':339.12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo:339.12-341.789', prefix: undefined, suffix: ':339.12-341.789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        { link: 'foo#339', prefix: undefined, suffix: '#339', hasRow: true, hasCol: false },
        { link: 'foo#339:12', prefix: undefined, suffix: '#339:12', hasRow: true, hasCol: true },
        { link: 'foo#339:12-789', prefix: undefined, suffix: '#339:12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo#339.12', prefix: undefined, suffix: '#339.12', hasRow: true, hasCol: true },
        { link: 'foo#339.12-789', prefix: undefined, suffix: '#339.12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo#339.12-341.789', prefix: undefined, suffix: '#339.12-341.789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        { link: 'foo 339', prefix: undefined, suffix: ' 339', hasRow: true, hasCol: false },
        { link: 'foo 339:12', prefix: undefined, suffix: ' 339:12', hasRow: true, hasCol: true },
        { link: 'foo 339:12-789', prefix: undefined, suffix: ' 339:12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo 339.12', prefix: undefined, suffix: ' 339.12', hasRow: true, hasCol: true },
        { link: 'foo 339.12-789', prefix: undefined, suffix: ' 339.12-789', hasRow: true, hasCol: true, hasRowEnd: false, hasColEnd: true },
        { link: 'foo 339.12-341.789', prefix: undefined, suffix: ' 339.12-341.789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        // Double quotes
        { link: '"foo",339', prefix: '"', suffix: '",339', hasRow: true, hasCol: false },
        { link: '"foo",339:12', prefix: '"', suffix: '",339:12', hasRow: true, hasCol: true },
        { link: '"foo",339.12', prefix: '"', suffix: '",339.12', hasRow: true, hasCol: true },
        { link: '"foo", line 339', prefix: '"', suffix: '", line 339', hasRow: true, hasCol: false },
        { link: '"foo", line 339, col 12', prefix: '"', suffix: '", line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo", line 339, column 12', prefix: '"', suffix: '", line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo":line 339', prefix: '"', suffix: '":line 339', hasRow: true, hasCol: false },
        { link: '"foo":line 339, col 12', prefix: '"', suffix: '":line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo":line 339, column 12', prefix: '"', suffix: '":line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo": line 339', prefix: '"', suffix: '": line 339', hasRow: true, hasCol: false },
        { link: '"foo": line 339, col 12', prefix: '"', suffix: '": line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo": line 339, column 12', prefix: '"', suffix: '": line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo" on line 339', prefix: '"', suffix: '" on line 339', hasRow: true, hasCol: false },
        { link: '"foo" on line 339, col 12', prefix: '"', suffix: '" on line 339, col 12', hasRow: true, hasCol: true },
        { link: '"foo" on line 339, column 12', prefix: '"', suffix: '" on line 339, column 12', hasRow: true, hasCol: true },
        { link: '"foo" line 339', prefix: '"', suffix: '" line 339', hasRow: true, hasCol: false },
        { link: '"foo" line 339 column 12', prefix: '"', suffix: '" line 339 column 12', hasRow: true, hasCol: true },
        // Single quotes
        { link: '\'foo\',339', prefix: '\'', suffix: '\',339', hasRow: true, hasCol: false },
        { link: '\'foo\',339:12', prefix: '\'', suffix: '\',339:12', hasRow: true, hasCol: true },
        { link: '\'foo\',339.12', prefix: '\'', suffix: '\',339.12', hasRow: true, hasCol: true },
        { link: '\'foo\', line 339', prefix: '\'', suffix: '\', line 339', hasRow: true, hasCol: false },
        { link: '\'foo\', line 339, col 12', prefix: '\'', suffix: '\', line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\', line 339, column 12', prefix: '\'', suffix: '\', line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\':line 339', prefix: '\'', suffix: '\':line 339', hasRow: true, hasCol: false },
        { link: '\'foo\':line 339, col 12', prefix: '\'', suffix: '\':line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\':line 339, column 12', prefix: '\'', suffix: '\':line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\': line 339', prefix: '\'', suffix: '\': line 339', hasRow: true, hasCol: false },
        { link: '\'foo\': line 339, col 12', prefix: '\'', suffix: '\': line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\': line 339, column 12', prefix: '\'', suffix: '\': line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\' on line 339', prefix: '\'', suffix: '\' on line 339', hasRow: true, hasCol: false },
        { link: '\'foo\' on line 339, col 12', prefix: '\'', suffix: '\' on line 339, col 12', hasRow: true, hasCol: true },
        { link: '\'foo\' on line 339, column 12', prefix: '\'', suffix: '\' on line 339, column 12', hasRow: true, hasCol: true },
        { link: '\'foo\' line 339', prefix: '\'', suffix: '\' line 339', hasRow: true, hasCol: false },
        { link: '\'foo\' line 339 column 12', prefix: '\'', suffix: '\' line 339 column 12', hasRow: true, hasCol: true },
        // No quotes
        { link: 'foo, line 339', prefix: undefined, suffix: ', line 339', hasRow: true, hasCol: false },
        { link: 'foo, line 339, col 12', prefix: undefined, suffix: ', line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo, line 339, column 12', prefix: undefined, suffix: ', line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo:line 339', prefix: undefined, suffix: ':line 339', hasRow: true, hasCol: false },
        { link: 'foo:line 339, col 12', prefix: undefined, suffix: ':line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo:line 339, column 12', prefix: undefined, suffix: ':line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo: line 339', prefix: undefined, suffix: ': line 339', hasRow: true, hasCol: false },
        { link: 'foo: line 339, col 12', prefix: undefined, suffix: ': line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo: line 339, column 12', prefix: undefined, suffix: ': line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo on line 339', prefix: undefined, suffix: ' on line 339', hasRow: true, hasCol: false },
        { link: 'foo on line 339, col 12', prefix: undefined, suffix: ' on line 339, col 12', hasRow: true, hasCol: true },
        { link: 'foo on line 339, column 12', prefix: undefined, suffix: ' on line 339, column 12', hasRow: true, hasCol: true },
        { link: 'foo line 339', prefix: undefined, suffix: ' line 339', hasRow: true, hasCol: false },
        { link: 'foo line 339 column 12', prefix: undefined, suffix: ' line 339 column 12', hasRow: true, hasCol: true },
        // Parentheses
        { link: 'foo(339)', prefix: undefined, suffix: '(339)', hasRow: true, hasCol: false },
        { link: 'foo(339,12)', prefix: undefined, suffix: '(339,12)', hasRow: true, hasCol: true },
        { link: 'foo(339, 12)', prefix: undefined, suffix: '(339, 12)', hasRow: true, hasCol: true },
        { link: 'foo (339)', prefix: undefined, suffix: ' (339)', hasRow: true, hasCol: false },
        { link: 'foo (339,12)', prefix: undefined, suffix: ' (339,12)', hasRow: true, hasCol: true },
        { link: 'foo (339, 12)', prefix: undefined, suffix: ' (339, 12)', hasRow: true, hasCol: true },
        { link: 'foo: (339)', prefix: undefined, suffix: ': (339)', hasRow: true, hasCol: false },
        { link: 'foo: (339,12)', prefix: undefined, suffix: ': (339,12)', hasRow: true, hasCol: true },
        { link: 'foo: (339, 12)', prefix: undefined, suffix: ': (339, 12)', hasRow: true, hasCol: true },
        // Square brackets
        { link: 'foo[339]', prefix: undefined, suffix: '[339]', hasRow: true, hasCol: false },
        { link: 'foo[339,12]', prefix: undefined, suffix: '[339,12]', hasRow: true, hasCol: true },
        { link: 'foo[339, 12]', prefix: undefined, suffix: '[339, 12]', hasRow: true, hasCol: true },
        { link: 'foo [339]', prefix: undefined, suffix: ' [339]', hasRow: true, hasCol: false },
        { link: 'foo [339,12]', prefix: undefined, suffix: ' [339,12]', hasRow: true, hasCol: true },
        { link: 'foo [339, 12]', prefix: undefined, suffix: ' [339, 12]', hasRow: true, hasCol: true },
        { link: 'foo: [339]', prefix: undefined, suffix: ': [339]', hasRow: true, hasCol: false },
        { link: 'foo: [339,12]', prefix: undefined, suffix: ': [339,12]', hasRow: true, hasCol: true },
        { link: 'foo: [339, 12]', prefix: undefined, suffix: ': [339, 12]', hasRow: true, hasCol: true },
        // OCaml-style
        { link: '"foo", line 339, character 12', prefix: '"', suffix: '", line 339, character 12', hasRow: true, hasCol: true },
        { link: '"foo", line 339, characters 12-789', prefix: '"', suffix: '", line 339, characters 12-789', hasRow: true, hasCol: true, hasColEnd: true },
        { link: '"foo", lines 339-341', prefix: '"', suffix: '", lines 339-341', hasRow: true, hasCol: false, hasRowEnd: true },
        { link: '"foo", lines 339-341, characters 12-789', prefix: '"', suffix: '", lines 339-341, characters 12-789', hasRow: true, hasCol: true, hasRowEnd: true, hasColEnd: true },
        // Non-breaking space
        { link: 'foo\u00A0339:12', prefix: undefined, suffix: '\u00A0339:12', hasRow: true, hasCol: true },
        { link: '"foo" on line 339,\u00A0column 12', prefix: '"', suffix: '" on line 339,\u00A0column 12', hasRow: true, hasCol: true },
        { link: '\'foo\' on line\u00A0339, column 12', prefix: '\'', suffix: '\' on line\u00A0339, column 12', hasRow: true, hasCol: true },
        { link: 'foo (339,\u00A012)', prefix: undefined, suffix: ' (339,\u00A012)', hasRow: true, hasCol: true },
        { link: 'foo\u00A0[339, 12]', prefix: undefined, suffix: '\u00A0[339, 12]', hasRow: true, hasCol: true },
    ];
    const testLinksWithSuffix = testLinks.filter(e => !!e.suffix);
    suite('TerminalLinkParsing', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('removeLinkSuffix', () => {
            for (const testLink of testLinks) {
                test('`' + testLink.link + '`', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.removeLinkSuffix)(testLink.link), testLink.suffix === undefined ? testLink.link : testLink.link.replace(testLink.suffix, ''));
                });
            }
        });
        suite('getLinkSuffix', () => {
            for (const testLink of testLinks) {
                test('`' + testLink.link + '`', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.getLinkSuffix)(testLink.link), testLink.suffix === undefined ? null : {
                        row: testLink.hasRow ? testRow : undefined,
                        col: testLink.hasCol ? testCol : undefined,
                        rowEnd: testLink.hasRowEnd ? testRowEnd : undefined,
                        colEnd: testLink.hasColEnd ? testColEnd : undefined,
                        suffix: {
                            index: testLink.link.length - testLink.suffix.length,
                            text: testLink.suffix
                        }
                    });
                });
            }
        });
        suite('detectLinkSuffixes', () => {
            for (const testLink of testLinks) {
                test('`' + testLink.link + '`', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinkSuffixes)(testLink.link), testLink.suffix === undefined ? [] : [{
                            row: testLink.hasRow ? testRow : undefined,
                            col: testLink.hasCol ? testCol : undefined,
                            rowEnd: testLink.hasRowEnd ? testRowEnd : undefined,
                            colEnd: testLink.hasColEnd ? testColEnd : undefined,
                            suffix: {
                                index: testLink.link.length - testLink.suffix.length,
                                text: testLink.suffix
                            }
                        }]);
                });
            }
            test('foo(1, 2) bar[3, 4] baz on line 5', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinkSuffixes)('foo(1, 2) bar[3, 4] baz on line 5'), [
                    {
                        col: 2,
                        row: 1,
                        rowEnd: undefined,
                        colEnd: undefined,
                        suffix: {
                            index: 3,
                            text: '(1, 2)'
                        }
                    },
                    {
                        col: 4,
                        row: 3,
                        rowEnd: undefined,
                        colEnd: undefined,
                        suffix: {
                            index: 13,
                            text: '[3, 4]'
                        }
                    },
                    {
                        col: undefined,
                        row: 5,
                        rowEnd: undefined,
                        colEnd: undefined,
                        suffix: {
                            index: 23,
                            text: ' on line 5'
                        }
                    }
                ]);
            });
        });
        suite('removeLinkQueryString', () => {
            test('should remove any query string from the link', () => {
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('?a=b'), '');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('foo?a=b'), 'foo');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('./foo?a=b'), './foo');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('/foo/bar?a=b'), '/foo/bar');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('foo?a=b?'), 'foo');
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('foo?a=b&c=d'), 'foo');
            });
            test('should respect ? in UNC paths', () => {
                (0, assert_1.strictEqual)((0, terminalLinkParsing_1.removeLinkQueryString)('\\\\?\\foo?a=b'), '\\\\?\\foo');
            });
        });
        suite('detectLinks', () => {
            test('foo(1, 2) bar[3, 4] "baz" on line 5', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('foo(1, 2) bar[3, 4] "baz" on line 5', 3 /* OperatingSystem.Linux */), [
                    {
                        path: {
                            index: 0,
                            text: 'foo'
                        },
                        prefix: undefined,
                        suffix: {
                            col: 2,
                            row: 1,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 3,
                                text: '(1, 2)'
                            }
                        }
                    },
                    {
                        path: {
                            index: 10,
                            text: 'bar'
                        },
                        prefix: undefined,
                        suffix: {
                            col: 4,
                            row: 3,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 13,
                                text: '[3, 4]'
                            }
                        }
                    },
                    {
                        path: {
                            index: 21,
                            text: 'baz'
                        },
                        prefix: {
                            index: 20,
                            text: '"'
                        },
                        suffix: {
                            col: undefined,
                            row: 5,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 24,
                                text: '" on line 5'
                            }
                        }
                    }
                ]);
            });
            test('should extract the link prefix', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('"foo", line 5, col 6', 3 /* OperatingSystem.Linux */), [
                    {
                        path: {
                            index: 1,
                            text: 'foo'
                        },
                        prefix: {
                            index: 0,
                            text: '"',
                        },
                        suffix: {
                            row: 5,
                            col: 6,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 4,
                                text: '", line 5, col 6'
                            }
                        }
                    },
                ]);
            });
            test('should be smart about determining the link prefix when multiple prefix characters exist', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('echo \'"foo", line 5, col 6\'', 3 /* OperatingSystem.Linux */), [
                    {
                        path: {
                            index: 7,
                            text: 'foo'
                        },
                        prefix: {
                            index: 6,
                            text: '"',
                        },
                        suffix: {
                            row: 5,
                            col: 6,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 10,
                                text: '", line 5, col 6'
                            }
                        }
                    },
                ], 'The outer single quotes should be excluded from the link prefix and suffix');
            });
            test('should detect both suffix and non-suffix links on a single line', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('PS C:\\Github\\microsoft\\vscode> echo \'"foo", line 5, col 6\'', 1 /* OperatingSystem.Windows */), [
                    {
                        path: {
                            index: 3,
                            text: 'C:\\Github\\microsoft\\vscode'
                        },
                        prefix: undefined,
                        suffix: undefined
                    },
                    {
                        path: {
                            index: 38,
                            text: 'foo'
                        },
                        prefix: {
                            index: 37,
                            text: '"',
                        },
                        suffix: {
                            row: 5,
                            col: 6,
                            rowEnd: undefined,
                            colEnd: undefined,
                            suffix: {
                                index: 41,
                                text: '", line 5, col 6'
                            }
                        }
                    }
                ]);
            });
            suite('"|"', () => {
                test('should exclude pipe characters from link paths', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('|C:\\Github\\microsoft\\vscode|', 1 /* OperatingSystem.Windows */), [
                        {
                            path: {
                                index: 1,
                                text: 'C:\\Github\\microsoft\\vscode'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
                test('should exclude pipe characters from link paths with suffixes', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('|C:\\Github\\microsoft\\vscode:400|', 1 /* OperatingSystem.Windows */), [
                        {
                            path: {
                                index: 1,
                                text: 'C:\\Github\\microsoft\\vscode'
                            },
                            prefix: undefined,
                            suffix: {
                                col: undefined,
                                row: 400,
                                rowEnd: undefined,
                                colEnd: undefined,
                                suffix: {
                                    index: 27,
                                    text: ':400'
                                }
                            }
                        }
                    ]);
                });
            });
            suite('"<>"', () => {
                for (const os of operatingSystems) {
                    test(`should exclude bracket characters from link paths ${osLabel[os]}`, () => {
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`<${osTestPath[os]}<`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`>${osTestPath[os]}>`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                    });
                    test(`should exclude bracket characters from link paths with suffixes ${osLabel[os]}`, () => {
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`<${osTestPath[os]}:400<`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: {
                                    col: undefined,
                                    row: 400,
                                    rowEnd: undefined,
                                    colEnd: undefined,
                                    suffix: {
                                        index: 1 + osTestPath[os].length,
                                        text: ':400'
                                    }
                                }
                            }
                        ]);
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`>${osTestPath[os]}:400>`, os), [
                            {
                                path: {
                                    index: 1,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: {
                                    col: undefined,
                                    row: 400,
                                    rowEnd: undefined,
                                    colEnd: undefined,
                                    suffix: {
                                        index: 1 + osTestPath[os].length,
                                        text: ':400'
                                    }
                                }
                            }
                        ]);
                    });
                }
            });
            suite('query strings', () => {
                for (const os of operatingSystems) {
                    test(`should exclude query strings from link paths ${osLabel[os]}`, () => {
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`${osTestPath[os]}?a=b`, os), [
                            {
                                path: {
                                    index: 0,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(`${osTestPath[os]}?a=b&c=d`, os), [
                            {
                                path: {
                                    index: 0,
                                    text: osTestPath[os]
                                },
                                prefix: undefined,
                                suffix: undefined
                            }
                        ]);
                    });
                    test('should not detect links starting with ? within query strings that contain posix-style paths (#204195)', () => {
                        // ? appended to the cwd will exist since it's just the cwd
                        (0, assert_1.strictEqual)((0, terminalLinkParsing_1.detectLinks)(`http://foo.com/?bar=/a/b&baz=c`, os).some(e => e.path.text.startsWith('?')), false);
                    });
                    test('should not detect links starting with ? within query strings that contain Windows-style paths (#204195)', () => {
                        // ? appended to the cwd will exist since it's just the cwd
                        (0, assert_1.strictEqual)((0, terminalLinkParsing_1.detectLinks)(`http://foo.com/?bar=a:\\b&baz=c`, os).some(e => e.path.text.startsWith('?')), false);
                    });
                }
            });
            suite('should detect file names in git diffs', () => {
                test('--- a/foo/bar', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('--- a/foo/bar', 3 /* OperatingSystem.Linux */), [
                        {
                            path: {
                                index: 6,
                                text: 'foo/bar'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
                test('+++ b/foo/bar', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('+++ b/foo/bar', 3 /* OperatingSystem.Linux */), [
                        {
                            path: {
                                index: 6,
                                text: 'foo/bar'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
                test('diff --git a/foo/bar b/foo/baz', () => {
                    (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('diff --git a/foo/bar b/foo/baz', 3 /* OperatingSystem.Linux */), [
                        {
                            path: {
                                index: 13,
                                text: 'foo/bar'
                            },
                            prefix: undefined,
                            suffix: undefined
                        },
                        {
                            path: {
                                index: 23,
                                text: 'foo/baz'
                            },
                            prefix: undefined,
                            suffix: undefined
                        }
                    ]);
                });
            });
            suite('should detect 3 suffix links on a single line', () => {
                for (let i = 0; i < testLinksWithSuffix.length - 2; i++) {
                    const link1 = testLinksWithSuffix[i];
                    const link2 = testLinksWithSuffix[i + 1];
                    const link3 = testLinksWithSuffix[i + 2];
                    const line = ` ${link1.link} ${link2.link} ${link3.link} `;
                    test('`' + line.replaceAll('\u00A0', '<nbsp>') + '`', () => {
                        (0, assert_1.strictEqual)((0, terminalLinkParsing_1.detectLinks)(line, 3 /* OperatingSystem.Linux */).length, 3);
                        (0, assert_1.ok)(link1.suffix);
                        (0, assert_1.ok)(link2.suffix);
                        (0, assert_1.ok)(link3.suffix);
                        const detectedLink1 = {
                            prefix: link1.prefix ? {
                                index: 1,
                                text: link1.prefix
                            } : undefined,
                            path: {
                                index: 1 + (link1.prefix?.length ?? 0),
                                text: link1.link.replace(link1.suffix, '').replace(link1.prefix || '', '')
                            },
                            suffix: {
                                row: link1.hasRow ? testRow : undefined,
                                col: link1.hasCol ? testCol : undefined,
                                rowEnd: link1.hasRowEnd ? testRowEnd : undefined,
                                colEnd: link1.hasColEnd ? testColEnd : undefined,
                                suffix: {
                                    index: 1 + (link1.link.length - link1.suffix.length),
                                    text: link1.suffix
                                }
                            }
                        };
                        const detectedLink2 = {
                            prefix: link2.prefix ? {
                                index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1,
                                text: link2.prefix
                            } : undefined,
                            path: {
                                index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1 + (link2.prefix ?? '').length,
                                text: link2.link.replace(link2.suffix, '').replace(link2.prefix ?? '', '')
                            },
                            suffix: {
                                row: link2.hasRow ? testRow : undefined,
                                col: link2.hasCol ? testCol : undefined,
                                rowEnd: link2.hasRowEnd ? testRowEnd : undefined,
                                colEnd: link2.hasColEnd ? testColEnd : undefined,
                                suffix: {
                                    index: (detectedLink1.prefix?.index ?? detectedLink1.path.index) + link1.link.length + 1 + (link2.link.length - link2.suffix.length),
                                    text: link2.suffix
                                }
                            }
                        };
                        const detectedLink3 = {
                            prefix: link3.prefix ? {
                                index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1,
                                text: link3.prefix
                            } : undefined,
                            path: {
                                index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1 + (link3.prefix ?? '').length,
                                text: link3.link.replace(link3.suffix, '').replace(link3.prefix ?? '', '')
                            },
                            suffix: {
                                row: link3.hasRow ? testRow : undefined,
                                col: link3.hasCol ? testCol : undefined,
                                rowEnd: link3.hasRowEnd ? testRowEnd : undefined,
                                colEnd: link3.hasColEnd ? testColEnd : undefined,
                                suffix: {
                                    index: (detectedLink2.prefix?.index ?? detectedLink2.path.index) + link2.link.length + 1 + (link3.link.length - link3.suffix.length),
                                    text: link3.suffix
                                }
                            }
                        };
                        (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)(line, 3 /* OperatingSystem.Linux */), [detectedLink1, detectedLink2, detectedLink3]);
                    });
                }
            });
            suite('should ignore links with suffixes when the path itself is the empty string', () => {
                (0, assert_1.deepStrictEqual)((0, terminalLinkParsing_1.detectLinks)('""",1', 3 /* OperatingSystem.Linux */), []);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUGFyc2luZy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvdGVzdC9icm93c2VyL3Rlcm1pbmFsTGlua1BhcnNpbmcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsTUFBTSxnQkFBZ0IsR0FBbUM7Ozs7S0FJeEQsQ0FBQztJQUNGLE1BQU0sVUFBVSxHQUFnRDtRQUMvRCwrQkFBdUIsRUFBRSxrQkFBa0I7UUFDM0MsbUNBQTJCLEVBQUUsc0JBQXNCO1FBQ25ELGlDQUF5QixFQUFFLHlCQUF5QjtLQUNwRCxDQUFDO0lBQ0YsTUFBTSxPQUFPLEdBQWdEO1FBQzVELCtCQUF1QixFQUFFLFNBQVM7UUFDbEMsbUNBQTJCLEVBQUUsU0FBUztRQUN0QyxpQ0FBeUIsRUFBRSxXQUFXO0tBQ3RDLENBQUM7SUFFRixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDcEIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztJQUN2QixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7SUFDdkIsTUFBTSxTQUFTLEdBQWdCO1FBQzlCLFNBQVM7UUFDVCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUNuRixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtRQUNuRixFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUN4RixFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtRQUNuSSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUN4RixFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtRQUNuSSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQzFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO1FBQ25GLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQ3hGLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQ25JLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQ3hGLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBQ25JLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDMUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7UUFDbkYsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDeEYsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDbkksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDeEYsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDbkksRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtRQUUxSSxnQkFBZ0I7UUFDaEIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7UUFDaEYsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDckYsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDckYsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxF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QzVGLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO1FBQ3ZGLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzVGLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzlGLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO1FBQ3pGLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzlGLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFFaEcsa0JBQWtCO1FBQ2xCLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO1FBQ3JGLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzFGLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzVGLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO1FBQ3ZGLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzVGLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzlGLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO1FBQ3pGLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQzlGLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFFaEcsY0FBYztRQUNkLEVBQUUsSUFBSSxFQUFFLCtCQUErQixFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLDJCQUEyQixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUN2SCxFQUFFLElBQUksRUFBRSxvQ0FBb0MsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxnQ0FBZ0MsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtRQUNsSixFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRTtRQUN2SCxFQUFFLElBQUksRUFBRSx5Q0FBeUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxxQ0FBcUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO1FBRTdLLHFCQUFxQjtRQUNyQixFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQ2xHLEVBQUUsSUFBSSxFQUFFLG1DQUFtQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLCtCQUErQixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtRQUMvSCxFQUFFLElBQUksRUFBRSxxQ0FBcUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxnQ0FBZ0MsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7UUFDbkksRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1FBQ3hHLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtLQUN4RyxDQUFDO0lBQ0YsTUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU5RCxLQUFLLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQzlCLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFO29CQUNwQyxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxzQ0FBZ0IsRUFBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQy9CLFFBQVEsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUMxRixDQUFDO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDM0IsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUU7b0JBQ3BDLElBQUEsd0JBQWUsRUFDZCxJQUFBLG1DQUFhLEVBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUM1QixRQUFRLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDdEMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUzt3QkFDMUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUzt3QkFDMUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUzt3QkFDbkQsTUFBTSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUzt3QkFDbkQsTUFBTSxFQUFFOzRCQUNQLEtBQUssRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU07NEJBQ3BELElBQUksRUFBRSxRQUFRLENBQUMsTUFBTTt5QkFDckI7cUJBQ21DLENBQ3JDLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFO29CQUNwQyxJQUFBLHdCQUFlLEVBQ2QsSUFBQSx3Q0FBa0IsRUFBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQ2pDLFFBQVEsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3JDLEdBQUcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7NEJBQzFDLEdBQUcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7NEJBQzFDLE1BQU0sRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7NEJBQ25ELE1BQU0sRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7NEJBQ25ELE1BQU0sRUFBRTtnQ0FDUCxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNO2dDQUNwRCxJQUFJLEVBQUUsUUFBUSxDQUFDLE1BQU07NkJBQ3JCO3lCQUNtQyxDQUFDLENBQ3RDLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtnQkFDOUMsSUFBQSx3QkFBZSxFQUNkLElBQUEsd0NBQWtCLEVBQUMsbUNBQW1DLENBQUMsRUFDdkQ7b0JBQ0M7d0JBQ0MsR0FBRyxFQUFFLENBQUM7d0JBQ04sR0FBRyxFQUFFLENBQUM7d0JBQ04sTUFBTSxFQUFFLFNBQVM7d0JBQ2pCLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUU7NEJBQ1AsS0FBSyxFQUFFLENBQUM7NEJBQ1IsSUFBSSxFQUFFLFFBQVE7eUJBQ2Q7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsR0FBRyxFQUFFLENBQUM7d0JBQ04sR0FBRyxFQUFFLENBQUM7d0JBQ04sTUFBTSxFQUFFLFNBQVM7d0JBQ2pCLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUU7NEJBQ1AsS0FBSyxFQUFFLEVBQUU7NEJBQ1QsSUFBSSxFQUFFLFFBQVE7eUJBQ2Q7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsR0FBRyxFQUFFLFNBQVM7d0JBQ2QsR0FBRyxFQUFFLENBQUM7d0JBQ04sTUFBTSxFQUFFLFNBQVM7d0JBQ2pCLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUU7NEJBQ1AsS0FBSyxFQUFFLEVBQUU7NEJBQ1QsSUFBSSxFQUFFLFlBQVk7eUJBQ2xCO3FCQUNEO2lCQUNELENBQ0QsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1lBQ25DLElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxHQUFHLEVBQUU7Z0JBQ3pELElBQUEsb0JBQVcsRUFBQyxJQUFBLDJDQUFxQixFQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxJQUFBLG9CQUFXLEVBQUMsSUFBQSwyQ0FBcUIsRUFBQyxTQUFTLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckQsSUFBQSxvQkFBVyxFQUFDLElBQUEsMkNBQXFCLEVBQUMsV0FBVyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3pELElBQUEsb0JBQVcsRUFBQyxJQUFBLDJDQUFxQixFQUFDLGNBQWMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUMvRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSwyQ0FBcUIsRUFBQyxVQUFVLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdEQsSUFBQSxvQkFBVyxFQUFDLElBQUEsMkNBQXFCLEVBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUQsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO2dCQUMxQyxJQUFBLG9CQUFXLEVBQUMsSUFBQSwyQ0FBcUIsRUFBQyxnQkFBZ0IsQ0FBQyxFQUFFLFlBQVksQ0FBRSxDQUFDO1lBQ3JFLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtZQUN6QixJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO2dCQUNoRCxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLHFDQUFxQyxnQ0FBd0IsRUFDekU7b0JBQ0M7d0JBQ0MsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxDQUFDOzRCQUNSLElBQUksRUFBRSxLQUFLO3lCQUNYO3dCQUNELE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLENBQUM7NEJBQ04sR0FBRyxFQUFFLENBQUM7NEJBQ04sTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUU7Z0NBQ1AsS0FBSyxFQUFFLENBQUM7Z0NBQ1IsSUFBSSxFQUFFLFFBQVE7NkJBQ2Q7eUJBQ0Q7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxFQUFFOzRCQUNULElBQUksRUFBRSxLQUFLO3lCQUNYO3dCQUNELE1BQU0sRUFBRSxTQUFTO3dCQUNqQixNQUFNLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLENBQUM7NEJBQ04sR0FBRyxFQUFFLENBQUM7NEJBQ04sTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUU7Z0NBQ1AsS0FBSyxFQUFFLEVBQUU7Z0NBQ1QsSUFBSSxFQUFFLFFBQVE7NkJBQ2Q7eUJBQ0Q7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxFQUFFOzRCQUNULElBQUksRUFBRSxLQUFLO3lCQUNYO3dCQUNELE1BQU0sRUFBRTs0QkFDUCxLQUFLLEVBQUUsRUFBRTs0QkFDVCxJQUFJLEVBQUUsR0FBRzt5QkFDVDt3QkFDRCxNQUFNLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLFNBQVM7NEJBQ2QsR0FBRyxFQUFFLENBQUM7NEJBQ04sTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUU7Z0NBQ1AsS0FBSyxFQUFFLEVBQUU7Z0NBQ1QsSUFBSSxFQUFFLGFBQWE7NkJBQ25CO3lCQUNEO3FCQUNEO2lCQUNnQixDQUNsQixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO2dCQUMzQyxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLHNCQUFzQixnQ0FBd0IsRUFDMUQ7b0JBQ0M7d0JBQ0MsSUFBSSxFQUFFOzRCQUNMLEtBQUssRUFBRSxDQUFDOzRCQUNSLElBQUksRUFBRSxLQUFLO3lCQUNYO3dCQUNELE1BQU0sRUFBRTs0QkFDUCxLQUFLLEVBQUUsQ0FBQzs0QkFDUixJQUFJLEVBQUUsR0FBRzt5QkFDVDt3QkFDRCxNQUFNLEVBQUU7NEJBQ1AsR0FBRyxFQUFFLENBQUM7NEJBQ04sR0FBRyxFQUFFLENBQUM7NEJBQ04sTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUU7Z0NBQ1AsS0FBSyxFQUFFLENBQUM7Z0NBQ1IsSUFBSSxFQUFFLGtCQUFrQjs2QkFDeEI7eUJBQ0Q7cUJBQ0Q7aUJBQ2dCLENBQ2xCLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyx5RkFBeUYsRUFBRSxHQUFHLEVBQUU7Z0JBQ3BHLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsK0JBQStCLGdDQUF3QixFQUNuRTtvQkFDQzt3QkFDQyxJQUFJLEVBQUU7NEJBQ0wsS0FBSyxFQUFFLENBQUM7NEJBQ1IsSUFBSSxFQUFFLEtBQUs7eUJBQ1g7d0JBQ0QsTUFBTSxFQUFFOzRCQUNQLEtBQUssRUFBRSxDQUFDOzRCQUNSLElBQUksRUFBRSxHQUFHO3lCQUNUO3dCQUNELE1BQU0sRUFBRTs0QkFDUCxHQUFHLEVBQUUsQ0FBQzs0QkFDTixHQUFHLEVBQUUsQ0FBQzs0QkFDTixNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRTtnQ0FDUCxLQUFLLEVBQUUsRUFBRTtnQ0FDVCxJQUFJLEVBQUUsa0JBQWtCOzZCQUN4Qjt5QkFDRDtxQkFDRDtpQkFDZ0IsRUFDbEIsNEVBQTRFLENBQzVFLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7Z0JBQzVFLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsaUVBQWlFLGtDQUEwQixFQUN2RztvQkFDQzt3QkFDQyxJQUFJLEVBQUU7NEJBQ0wsS0FBSyxFQUFFLENBQUM7NEJBQ1IsSUFBSSxFQUFFLCtCQUErQjt5QkFDckM7d0JBQ0QsTUFBTSxFQUFFLFNBQVM7d0JBQ2pCLE1BQU0sRUFBRSxTQUFTO3FCQUNqQjtvQkFDRDt3QkFDQyxJQUFJLEVBQUU7NEJBQ0wsS0FBSyxFQUFFLEVBQUU7NEJBQ1QsSUFBSSxFQUFFLEtBQUs7eUJBQ1g7d0JBQ0QsTUFBTSxFQUFFOzRCQUNQLEtBQUssRUFBRSxFQUFFOzRCQUNULElBQUksRUFBRSxHQUFHO3lCQUNUO3dCQUNELE1BQU0sRUFBRTs0QkFDUCxHQUFHLEVBQUUsQ0FBQzs0QkFDTixHQUFHLEVBQUUsQ0FBQzs0QkFDTixNQUFNLEVBQUUsU0FBUzs0QkFDakIsTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRTtnQ0FDUCxLQUFLLEVBQUUsRUFBRTtnQ0FDVCxJQUFJLEVBQUUsa0JBQWtCOzZCQUN4Qjt5QkFDRDtxQkFDRDtpQkFDZ0IsQ0FDbEIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7b0JBQzNELElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsaUNBQWlDLGtDQUEwQixFQUN2RTt3QkFDQzs0QkFDQyxJQUFJLEVBQUU7Z0NBQ0wsS0FBSyxFQUFFLENBQUM7Z0NBQ1IsSUFBSSxFQUFFLCtCQUErQjs2QkFDckM7NEJBQ0QsTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTO3lCQUNqQjtxQkFDZ0IsQ0FDbEIsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO29CQUN6RSxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLHFDQUFxQyxrQ0FBMEIsRUFDM0U7d0JBQ0M7NEJBQ0MsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxDQUFDO2dDQUNSLElBQUksRUFBRSwrQkFBK0I7NkJBQ3JDOzRCQUNELE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUU7Z0NBQ1AsR0FBRyxFQUFFLFNBQVM7Z0NBQ2QsR0FBRyxFQUFFLEdBQUc7Z0NBQ1IsTUFBTSxFQUFFLFNBQVM7Z0NBQ2pCLE1BQU0sRUFBRSxTQUFTO2dDQUNqQixNQUFNLEVBQUU7b0NBQ1AsS0FBSyxFQUFFLEVBQUU7b0NBQ1QsSUFBSSxFQUFFLE1BQU07aUNBQ1o7NkJBQ0Q7eUJBQ0Q7cUJBQ2dCLENBQ2xCLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO2dCQUNsQixLQUFLLE1BQU0sRUFBRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQ25DLElBQUksQ0FBQyxxREFBcUQsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFO3dCQUM3RSxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQ3RDOzRCQUNDO2dDQUNDLElBQUksRUFBRTtvQ0FDTCxLQUFLLEVBQUUsQ0FBQztvQ0FDUixJQUFJLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQztpQ0FDcEI7Z0NBQ0QsTUFBTSxFQUFFLFNBQVM7Z0NBQ2pCLE1BQU0sRUFBRSxTQUFTOzZCQUNqQjt5QkFDZ0IsQ0FDbEIsQ0FBQzt3QkFDRixJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQ3RDOzRCQUNDO2dDQUNDLElBQUksRUFBRTtvQ0FDTCxLQUFLLEVBQUUsQ0FBQztvQ0FDUixJQUFJLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQztpQ0FDcEI7Z0NBQ0QsTUFBTSxFQUFFLFNBQVM7Z0NBQ2pCLE1BQU0sRUFBRSxTQUFTOzZCQUNqQjt5QkFDZ0IsQ0FDbEIsQ0FBQztvQkFDSCxDQUFDLENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsbUVBQW1FLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTt3QkFDM0YsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUMxQzs0QkFDQztnQ0FDQyxJQUFJLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLENBQUM7b0NBQ1IsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7aUNBQ3BCO2dDQUNELE1BQU0sRUFBRSxTQUFTO2dDQUNqQixNQUFNLEVBQUU7b0NBQ1AsR0FBRyxFQUFFLFNBQVM7b0NBQ2QsR0FBRyxFQUFFLEdBQUc7b0NBQ1IsTUFBTSxFQUFFLFNBQVM7b0NBQ2pCLE1BQU0sRUFBRSxTQUFTO29DQUNqQixNQUFNLEVBQUU7d0NBQ1AsS0FBSyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTTt3Q0FDaEMsSUFBSSxFQUFFLE1BQU07cUNBQ1o7aUNBQ0Q7NkJBQ0Q7eUJBQ2dCLENBQ2xCLENBQUM7d0JBQ0YsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUMxQzs0QkFDQztnQ0FDQyxJQUFJLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLENBQUM7b0NBQ1IsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUM7aUNBQ3BCO2dDQUNELE1BQU0sRUFBRSxTQUFTO2dDQUNqQixNQUFNLEVBQUU7b0NBQ1AsR0FBRyxFQUFFLFNBQVM7b0NBQ2QsR0FBRyxFQUFFLEdBQUc7b0NBQ1IsTUFBTSxFQUFFLFNBQVM7b0NBQ2pCLE1BQU0sRUFBRSxTQUFTO29DQUNqQixNQUFNLEVBQUU7d0NBQ1AsS0FBSyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTTt3Q0FDaEMsSUFBSSxFQUFFLE1BQU07cUNBQ1o7aUNBQ0Q7NkJBQ0Q7eUJBQ2dCLENBQ2xCLENBQUM7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7Z0JBQzNCLEtBQUssTUFBTSxFQUFFLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLGdEQUFnRCxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7d0JBQ3hFLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFDeEM7NEJBQ0M7Z0NBQ0MsSUFBSSxFQUFFO29DQUNMLEtBQUssRUFBRSxDQUFDO29DQUNSLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO2lDQUNwQjtnQ0FDRCxNQUFNLEVBQUUsU0FBUztnQ0FDakIsTUFBTSxFQUFFLFNBQVM7NkJBQ2pCO3lCQUNnQixDQUNsQixDQUFDO3dCQUNGLElBQUEsd0JBQWUsRUFDZCxJQUFBLGlDQUFXLEVBQUMsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFDNUM7NEJBQ0M7Z0NBQ0MsSUFBSSxFQUFFO29DQUNMLEtBQUssRUFBRSxDQUFDO29DQUNSLElBQUksRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO2lDQUNwQjtnQ0FDRCxNQUFNLEVBQUUsU0FBUztnQ0FDakIsTUFBTSxFQUFFLFNBQVM7NkJBQ2pCO3lCQUNnQixDQUNsQixDQUFDO29CQUNILENBQUMsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyx1R0FBdUcsRUFBRSxHQUFHLEVBQUU7d0JBQ2xILDJEQUEyRDt3QkFDM0QsSUFBQSxvQkFBVyxFQUFDLElBQUEsaUNBQVcsRUFBQyxnQ0FBZ0MsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDOUcsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLHlHQUF5RyxFQUFFLEdBQUcsRUFBRTt3QkFDcEgsMkRBQTJEO3dCQUMzRCxJQUFBLG9CQUFXLEVBQUMsSUFBQSxpQ0FBVyxFQUFDLGlDQUFpQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUMvRyxDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxLQUFLLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO2dCQUNuRCxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtvQkFDMUIsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxlQUFlLGdDQUF3QixFQUNuRDt3QkFDQzs0QkFDQyxJQUFJLEVBQUU7Z0NBQ0wsS0FBSyxFQUFFLENBQUM7Z0NBQ1IsSUFBSSxFQUFFLFNBQVM7NkJBQ2Y7NEJBQ0QsTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTO3lCQUNqQjtxQkFDZ0IsQ0FDbEIsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtvQkFDMUIsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxlQUFlLGdDQUF3QixFQUNuRDt3QkFDQzs0QkFDQyxJQUFJLEVBQUU7Z0NBQ0wsS0FBSyxFQUFFLENBQUM7Z0NBQ1IsSUFBSSxFQUFFLFNBQVM7NkJBQ2Y7NEJBQ0QsTUFBTSxFQUFFLFNBQVM7NEJBQ2pCLE1BQU0sRUFBRSxTQUFTO3lCQUNqQjtxQkFDZ0IsQ0FDbEIsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO29CQUMzQyxJQUFBLHdCQUFlLEVBQ2QsSUFBQSxpQ0FBVyxFQUFDLGdDQUFnQyxnQ0FBd0IsRUFDcEU7d0JBQ0M7NEJBQ0MsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxFQUFFO2dDQUNULElBQUksRUFBRSxTQUFTOzZCQUNmOzRCQUNELE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzt5QkFDakI7d0JBQ0Q7NEJBQ0MsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxFQUFFO2dDQUNULElBQUksRUFBRSxTQUFTOzZCQUNmOzRCQUNELE1BQU0sRUFBRSxTQUFTOzRCQUNqQixNQUFNLEVBQUUsU0FBUzt5QkFDakI7cUJBQ2dCLENBQ2xCLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7Z0JBQzNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3pELE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3pDLE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDekMsTUFBTSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDO29CQUMzRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUU7d0JBQzFELElBQUEsb0JBQVcsRUFBQyxJQUFBLGlDQUFXLEVBQUMsSUFBSSxnQ0FBd0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ2hFLElBQUEsV0FBRSxFQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDakIsSUFBQSxXQUFFLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNqQixJQUFBLFdBQUUsRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ2pCLE1BQU0sYUFBYSxHQUFnQjs0QkFDbEMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dDQUN0QixLQUFLLEVBQUUsQ0FBQztnQ0FDUixJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU07NkJBQ2xCLENBQUMsQ0FBQyxDQUFDLFNBQVM7NEJBQ2IsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUM7Z0NBQ3RDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7NkJBQzFFOzRCQUNELE1BQU0sRUFBRTtnQ0FDUCxHQUFHLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUN2QyxHQUFHLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUN2QyxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUNoRCxNQUFNLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTO2dDQUNoRCxNQUFNLEVBQUU7b0NBQ1AsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO29DQUNwRCxJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU07aUNBQ2xCOzZCQUNEO3lCQUNELENBQUM7d0JBQ0YsTUFBTSxhQUFhLEdBQWdCOzRCQUNsQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0NBQ3RCLEtBQUssRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQ0FDeEYsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNOzZCQUNsQixDQUFDLENBQUMsQ0FBQyxTQUFTOzRCQUNiLElBQUksRUFBRTtnQ0FDTCxLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTTtnQ0FDdEgsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQzs2QkFDMUU7NEJBQ0QsTUFBTSxFQUFFO2dDQUNQLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ3ZDLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ3ZDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ2hELE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ2hELE1BQU0sRUFBRTtvQ0FDUCxLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO29DQUNwSSxJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU07aUNBQ2xCOzZCQUNEO3lCQUNELENBQUM7d0JBQ0YsTUFBTSxhQUFhLEdBQWdCOzRCQUNsQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0NBQ3RCLEtBQUssRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQ0FDeEYsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNOzZCQUNsQixDQUFDLENBQUMsQ0FBQyxTQUFTOzRCQUNiLElBQUksRUFBRTtnQ0FDTCxLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTTtnQ0FDdEgsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQzs2QkFDMUU7NEJBQ0QsTUFBTSxFQUFFO2dDQUNQLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ3ZDLEdBQUcsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ3ZDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ2hELE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0NBQ2hELE1BQU0sRUFBRTtvQ0FDUCxLQUFLLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO29DQUNwSSxJQUFJLEVBQUUsS0FBSyxDQUFDLE1BQU07aUNBQ2xCOzZCQUNEO3lCQUNELENBQUM7d0JBQ0YsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxJQUFJLGdDQUF3QixFQUN4QyxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQzdDLENBQUM7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsS0FBSyxDQUFDLDRFQUE0RSxFQUFFLEdBQUcsRUFBRTtnQkFDeEYsSUFBQSx3QkFBZSxFQUNkLElBQUEsaUNBQVcsRUFBQyxPQUFPLGdDQUF3QixFQUMzQyxFQUFtQixDQUNuQixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=