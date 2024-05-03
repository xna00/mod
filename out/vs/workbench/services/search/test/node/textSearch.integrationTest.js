/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/cancellation", "vs/base/common/uri", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/textSearchAdapter", "vs/base/test/node/testUtils", "vs/base/common/network"], function (require, exports, assert, path, cancellation_1, uri_1, search_1, textSearchAdapter_1, testUtils_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TEST_FIXTURES = path.normalize(network_1.FileAccess.asFileUri('vs/workbench/services/search/test/node/fixtures').fsPath);
    const EXAMPLES_FIXTURES = path.join(TEST_FIXTURES, 'examples');
    const MORE_FIXTURES = path.join(TEST_FIXTURES, 'more');
    const TEST_ROOT_FOLDER = { folder: uri_1.URI.file(TEST_FIXTURES) };
    const ROOT_FOLDER_QUERY = [
        TEST_ROOT_FOLDER
    ];
    const MULTIROOT_QUERIES = [
        { folder: uri_1.URI.file(EXAMPLES_FIXTURES) },
        { folder: uri_1.URI.file(MORE_FIXTURES) }
    ];
    function doSearchTest(query, expectedResultCount) {
        const engine = new textSearchAdapter_1.TextSearchEngineAdapter(query);
        let c = 0;
        const results = [];
        return engine.search(new cancellation_1.CancellationTokenSource().token, _results => {
            if (_results) {
                c += _results.reduce((acc, cur) => acc + cur.numMatches, 0);
                results.push(..._results);
            }
        }, () => { }).then(() => {
            if (typeof expectedResultCount === 'function') {
                assert(expectedResultCount(c));
            }
            else {
                assert.strictEqual(c, expectedResultCount, `rg ${c} !== ${expectedResultCount}`);
            }
            return results;
        });
    }
    (0, testUtils_1.flakySuite)('TextSearch-integration', function () {
        test('Text: GameOfLife', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'GameOfLife' },
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (RegExp)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'Game.?fL\\w?fe', isRegExp: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (unicode escape sequences)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'G\\u{0061}m\\u0065OfLife', isRegExp: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (unicode escape sequences, force PCRE2)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: '(?<!a)G\\u{0061}m\\u0065OfLife', isRegExp: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (PCRE2 RegExp)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                usePCRE2: true,
                contentPattern: { pattern: 'Life(?!P)', isRegExp: true }
            };
            return doSearchTest(config, 8);
        });
        test('Text: GameOfLife (RegExp to EOL)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'GameOfLife.*', isRegExp: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (Word Match, Case Sensitive)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'GameOfLife', isWordMatch: true, isCaseSensitive: true }
            };
            return doSearchTest(config, 4);
        });
        test('Text: GameOfLife (Word Match, Spaces)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: ' GameOfLife ', isWordMatch: true }
            };
            return doSearchTest(config, 1);
        });
        test('Text: GameOfLife (Word Match, Punctuation and Spaces)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: ', as =', isWordMatch: true }
            };
            return doSearchTest(config, 1);
        });
        test('Text: Helvetica (UTF 16)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'Helvetica' }
            };
            return doSearchTest(config, 3);
        });
        test('Text: e', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' }
            };
            return doSearchTest(config, 785);
        });
        test('Text: e (with excludes)', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' },
                excludePattern: { '**/examples': true }
            };
            return doSearchTest(config, 391);
        });
        test('Text: e (with includes)', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' },
                includePattern: { '**/examples/**': true }
            };
            return doSearchTest(config, 394);
        });
        // TODO
        // test('Text: e (with absolute path excludes)', () => {
        // 	const config: any = {
        // 		folderQueries: ROOT_FOLDER_QUERY,
        // 		contentPattern: { pattern: 'e' },
        // 		excludePattern: makeExpression(path.join(TEST_FIXTURES, '**/examples'))
        // 	};
        // 	return doSearchTest(config, 394);
        // });
        // test('Text: e (with mixed absolute/relative path excludes)', () => {
        // 	const config: any = {
        // 		folderQueries: ROOT_FOLDER_QUERY,
        // 		contentPattern: { pattern: 'e' },
        // 		excludePattern: makeExpression(path.join(TEST_FIXTURES, '**/examples'), '*.css')
        // 	};
        // 	return doSearchTest(config, 310);
        // });
        test('Text: sibling exclude', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'm' },
                includePattern: makeExpression('**/site*'),
                excludePattern: { '*.css': { when: '$(basename).less' } }
            };
            return doSearchTest(config, 1);
        });
        test('Text: e (with includes and exclude)', () => {
            const config = {
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'e' },
                includePattern: { '**/examples/**': true },
                excludePattern: { '**/examples/small.js': true }
            };
            return doSearchTest(config, 371);
        });
        test('Text: a (capped)', () => {
            const maxResults = 520;
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'a' },
                maxResults
            };
            return doSearchTest(config, maxResults);
        });
        test('Text: a (no results)', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'ahsogehtdas' }
            };
            return doSearchTest(config, 0);
        });
        test('Text: -size', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: '-size' }
            };
            return doSearchTest(config, 9);
        });
        test('Multiroot: Conway', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: MULTIROOT_QUERIES,
                contentPattern: { pattern: 'conway' }
            };
            return doSearchTest(config, 8);
        });
        test('Multiroot: e with partial global exclude', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: MULTIROOT_QUERIES,
                contentPattern: { pattern: 'e' },
                excludePattern: makeExpression('**/*.txt')
            };
            return doSearchTest(config, 394);
        });
        test('Multiroot: e with global excludes', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: MULTIROOT_QUERIES,
                contentPattern: { pattern: 'e' },
                excludePattern: makeExpression('**/*.txt', '**/*.js')
            };
            return doSearchTest(config, 0);
        });
        test('Multiroot: e with folder exclude', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: [
                    { folder: uri_1.URI.file(EXAMPLES_FIXTURES), excludePattern: makeExpression('**/e*.js') },
                    { folder: uri_1.URI.file(MORE_FIXTURES) }
                ],
                contentPattern: { pattern: 'e' }
            };
            return doSearchTest(config, 298);
        });
        test('Text: 语', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: '语' }
            };
            return doSearchTest(config, 1).then(results => {
                const matchRange = results[0].results[0].ranges;
                assert.deepStrictEqual(matchRange, [{
                        startLineNumber: 0,
                        startColumn: 1,
                        endLineNumber: 0,
                        endColumn: 2
                    }]);
            });
        });
        test('Multiple matches on line: h\\d,', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'h\\d,', isRegExp: true }
            };
            return doSearchTest(config, 15).then(results => {
                assert.strictEqual(results.length, 3);
                assert.strictEqual(results[0].results.length, 1);
                const match = results[0].results[0];
                assert.strictEqual(match.ranges.length, 5);
            });
        });
        test('Search with context matches', () => {
            const config = {
                type: 2 /* QueryType.Text */,
                folderQueries: ROOT_FOLDER_QUERY,
                contentPattern: { pattern: 'compiler.typeCheck();' },
                beforeContext: 1,
                afterContext: 2
            };
            return doSearchTest(config, 4).then(results => {
                assert.strictEqual(results.length, 4);
                assert.strictEqual(results[0].results[0].lineNumber, 24);
                assert.strictEqual(results[0].results[0].text, '        compiler.addUnit(prog,"input.ts");');
                // assert.strictEqual((<ITextSearchMatch>results[1].results[0]).preview.text, '        compiler.typeCheck();\n'); // See https://github.com/BurntSushi/ripgrep/issues/1095
                assert.strictEqual(results[2].results[0].lineNumber, 26);
                assert.strictEqual(results[2].results[0].text, '        compiler.emit();');
                assert.strictEqual(results[3].results[0].lineNumber, 27);
                assert.strictEqual(results[3].results[0].text, '');
            });
        });
        suite('error messages', () => {
            test('invalid encoding', () => {
                const config = {
                    type: 2 /* QueryType.Text */,
                    folderQueries: [
                        {
                            ...TEST_ROOT_FOLDER,
                            fileEncoding: 'invalidEncoding'
                        }
                    ],
                    contentPattern: { pattern: 'test' },
                };
                return doSearchTest(config, 0).then(() => {
                    throw new Error('expected fail');
                }, err => {
                    const searchError = (0, search_1.deserializeSearchError)(err);
                    assert.strictEqual(searchError.message, 'Unknown encoding: invalidEncoding');
                    assert.strictEqual(searchError.code, search_1.SearchErrorCode.unknownEncoding);
                });
            });
            test('invalid regex case 1', () => {
                const config = {
                    type: 2 /* QueryType.Text */,
                    folderQueries: ROOT_FOLDER_QUERY,
                    contentPattern: { pattern: ')', isRegExp: true },
                };
                return doSearchTest(config, 0).then(() => {
                    throw new Error('expected fail');
                }, err => {
                    const searchError = (0, search_1.deserializeSearchError)(err);
                    const regexParseErrorForUnclosedParenthesis = 'Regex parse error: unmatched closing parenthesis';
                    assert.strictEqual(searchError.message, regexParseErrorForUnclosedParenthesis);
                    assert.strictEqual(searchError.code, search_1.SearchErrorCode.regexParseError);
                });
            });
            test('invalid regex case 2', () => {
                const config = {
                    type: 2 /* QueryType.Text */,
                    folderQueries: ROOT_FOLDER_QUERY,
                    contentPattern: { pattern: '(?<!a.*)', isRegExp: true },
                };
                return doSearchTest(config, 0).then(() => {
                    throw new Error('expected fail');
                }, err => {
                    const searchError = (0, search_1.deserializeSearchError)(err);
                    const regexParseErrorForLookAround = 'Regex parse error: lookbehind assertion is not fixed length';
                    assert.strictEqual(searchError.message, regexParseErrorForLookAround);
                    assert.strictEqual(searchError.code, search_1.SearchErrorCode.regexParseError);
                });
            });
            test('invalid glob', () => {
                const config = {
                    type: 2 /* QueryType.Text */,
                    folderQueries: ROOT_FOLDER_QUERY,
                    contentPattern: { pattern: 'foo' },
                    includePattern: {
                        '{{}': true
                    }
                };
                return doSearchTest(config, 0).then(() => {
                    throw new Error('expected fail');
                }, err => {
                    const searchError = (0, search_1.deserializeSearchError)(err);
                    assert.strictEqual(searchError.message, 'Error parsing glob \'/{{}\': nested alternate groups are not allowed');
                    assert.strictEqual(searchError.code, search_1.SearchErrorCode.globParseError);
                });
            });
        });
    });
    function makeExpression(...patterns) {
        return patterns.reduce((glob, pattern) => {
            // glob.ts needs forward slashes
            pattern = pattern.replace(/\\/g, '/');
            glob[pattern] = true;
            return glob;
        }, Object.create(null));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaC5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvdGVzdC9ub2RlL3RleHRTZWFyY2guaW50ZWdyYXRpb25UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQVUsQ0FBQyxTQUFTLENBQUMsaURBQWlELENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNySCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQy9ELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sZ0JBQWdCLEdBQWlCLEVBQUUsTUFBTSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztJQUMzRSxNQUFNLGlCQUFpQixHQUFtQjtRQUN6QyxnQkFBZ0I7S0FDaEIsQ0FBQztJQUVGLE1BQU0saUJBQWlCLEdBQW1CO1FBQ3pDLEVBQUUsTUFBTSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRTtRQUN2QyxFQUFFLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFO0tBQ25DLENBQUM7SUFFRixTQUFTLFlBQVksQ0FBQyxLQUFpQixFQUFFLG1CQUFzQztRQUM5RSxNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE1BQU0sT0FBTyxHQUEyQixFQUFFLENB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