define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/path/common/pathService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/platform/environment/common/environment", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/resources", "vs/base/test/common/utils"], function (require, exports, assert, path_1, platform_1, uri_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, workspace_1, workspaces_1, queryBuilder_1, pathService_1, workbenchTestServices_1, workbenchTestServices_2, environment_1, testWorkspace_1, resources_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertEqualQueries = assertEqualQueries;
    exports.assertEqualSearchPathResults = assertEqualSearchPathResults;
    exports.cleanUndefinedQueryValues = cleanUndefinedQueryValues;
    exports.globalGlob = globalGlob;
    exports.patternsToIExpression = patternsToIExpression;
    exports.getUri = getUri;
    exports.fixPath = fixPath;
    exports.normalizeExpression = normalizeExpression;
    const DEFAULT_EDITOR_CONFIG = {};
    const DEFAULT_USER_CONFIG = { useRipgrep: true, useIgnoreFiles: true, useGlobalIgnoreFiles: true, useParentIgnoreFiles: true };
    const DEFAULT_QUERY_PROPS = {};
    const DEFAULT_TEXT_QUERY_PROPS = { usePCRE2: false };
    suite('QueryBuilder', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const PATTERN_INFO = { pattern: 'a' };
        const ROOT_1 = fixPath('/foo/root1');
        const ROOT_1_URI = getUri(ROOT_1);
        const ROOT_1_NAMED_FOLDER = (0, workspace_1.toWorkspaceFolder)(ROOT_1_URI);
        const WS_CONFIG_PATH = getUri('/bar/test.code-workspace'); // location of the workspace file (not important except that it is a file URI)
        let instantiationService;
        let queryBuilder;
        let mockConfigService;
        let mockContextService;
        let mockWorkspace;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            mockConfigService = new testConfigurationService_1.TestConfigurationService();
            mockConfigService.setUserConfiguration('search', DEFAULT_USER_CONFIG);
            mockConfigService.setUserConfiguration('editor', DEFAULT_EDITOR_CONFIG);
            instantiationService.stub(configuration_1.IConfigurationService, mockConfigService);
            mockContextService = new workbenchTestServices_2.TestContextService();
            mockWorkspace = new testWorkspace_1.Workspace('workspace', [(0, workspace_1.toWorkspaceFolder)(ROOT_1_URI)]);
            mockContextService.setWorkspace(mockWorkspace);
            instantiationService.stub(workspace_1.IWorkspaceContextService, mockContextService);
            instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            instantiationService.stub(pathService_1.IPathService, new workbenchTestServices_1.TestPathService());
            queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        });
        teardown(() => {
            instantiationService.dispose();
        });
        test('simple text pattern', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO), {
                folderQueries: [],
                contentPattern: PATTERN_INFO,
                type: 2 /* QueryType.Text */
            });
        });
        test('normalize literal newlines', () => {
            assertEqualTextQueries(queryBuilder.text({ pattern: 'foo\nbar', isRegExp: true }), {
                folderQueries: [],
                contentPattern: {
                    pattern: 'foo\\nbar',
                    isRegExp: true,
                    isMultiline: true
                },
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text({ pattern: 'foo\nbar', isRegExp: false }), {
                folderQueries: [],
                contentPattern: {
                    pattern: 'foo\nbar',
                    isRegExp: false,
                    isMultiline: true
                },
                type: 2 /* QueryType.Text */
            });
        });
        test('splits include pattern when expandPatterns enabled', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: '**/foo, **/bar', expandPatterns: true }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo': true,
                    '**/foo/**': true,
                    '**/bar': true,
                    '**/bar/**': true,
                }
            });
        });
        test('does not split include pattern when expandPatterns disabled', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: '**/foo, **/bar' }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo, **/bar': true
                }
            });
        });
        test('includePattern array', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: ['**/foo', '**/bar'] }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo': true,
                    '**/bar': true
                }
            });
        });
        test('includePattern array with expandPatterns', () => {
            assertEqualQueries(queryBuilder.file([ROOT_1_NAMED_FOLDER], { includePattern: ['**/foo', '**/bar'], expandPatterns: true }), {
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 1 /* QueryType.File */,
                includePattern: {
                    '**/foo': true,
                    '**/foo/**': true,
                    '**/bar': true,
                    '**/bar/**': true,
                }
            });
        });
        test('folderResources', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI]), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{ folder: ROOT_1_URI }],
                type: 2 /* QueryType.Text */
            });
        });
        test('simple exclude setting', () => {
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: {
                    'bar/**': true,
                    'foo/**': {
                        'when': '$(basename).ts'
                    }
                }
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                expandPatterns: true // verify that this doesn't affect patterns from configuration
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: {
                            'bar/**': true,
                            'foo/**': {
                                'when': '$(basename).ts'
                            }
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('simple include', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: 'bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: {
                    '**/bar': true,
                    '**/bar/**': true
                },
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: 'bar'
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: {
                    'bar': true
                },
                type: 2 /* QueryType.Text */
            });
        });
        test('simple include with ./ syntax', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: './bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'bar': true,
                            'bar/**': true
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: '.\\bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'bar': true,
                            'bar/**': true
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('exclude setting and searchPath', () => {
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: {
                    'foo/**/*.js': true,
                    'bar/**': {
                        'when': '$(basename).ts'
                    }
                }
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                includePattern: './foo',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        includePattern: {
                            'foo': true,
                            'foo/**': true
                        },
                        excludePattern: {
                            'foo/**/*.js': true,
                            'bar/**': {
                                'when': '$(basename).ts'
                            }
                        }
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('multiroot exclude settings', () => {
            const ROOT_2 = fixPath('/project/root2');
            const ROOT_2_URI = getUri(ROOT_2);
            const ROOT_3 = fixPath('/project/root3');
            const ROOT_3_URI = getUri(ROOT_3);
            mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath }, { path: ROOT_2_URI.fsPath }, { path: ROOT_3_URI.fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
            mockWorkspace.configuration = uri_1.URI.file(fixPath('/config'));
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: { 'foo/**/*.js': true }
            }, ROOT_1_URI);
            mockConfigService.setUserConfiguration('search', {
                ...DEFAULT_USER_CONFIG,
                exclude: { 'bar': true }
            }, ROOT_2_URI);
            // There are 3 roots, the first two have search.exclude settings, test that the correct basic query is returned
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI, ROOT_2_URI, ROOT_3_URI]), {
                contentPattern: PATTERN_INFO,
                folderQueries: [
                    { folder: ROOT_1_URI, excludePattern: patternsToIExpression('foo/**/*.js') },
                    { folder: ROOT_2_URI, excludePattern: patternsToIExpression('bar') },
                    { folder: ROOT_3_URI }
                ],
                type: 2 /* QueryType.Text */
            });
            // Now test that it merges the root excludes when an 'include' is used
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI, ROOT_2_URI, ROOT_3_URI], {
                includePattern: './root2/src',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [
                    {
                        folder: ROOT_2_URI,
                        includePattern: {
                            'src': true,
                            'src/**': true
                        },
                        excludePattern: {
                            'bar': true
                        },
                    }
                ],
                type: 2 /* QueryType.Text */
            });
        });
        test('simple exclude input pattern', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: 'foo',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                type: 2 /* QueryType.Text */,
                excludePattern: patternsToIExpression(...globalGlob('foo'))
            });
        });
        test('file pattern trimming', () => {
            const content = 'content';
            assertEqualQueries(queryBuilder.file([], { filePattern: ` ${content} ` }), {
                folderQueries: [],
                filePattern: content,
                type: 1 /* QueryType.File */
            });
        });
        test('exclude ./ syntax', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: './bar',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar', 'bar/**'),
                    }],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: './bar/**/*.ts',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar/**/*.ts', 'bar/**/*.ts/**'),
                    }],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                excludePattern: '.\\bar\\**\\*.ts',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI,
                        excludePattern: patternsToIExpression('bar/**/*.ts', 'bar/**/*.ts/**'),
                    }],
                type: 2 /* QueryType.Text */
            });
        });
        test('extraFileResources', () => {
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], { extraFileResources: [getUri('/foo/bar.js')] }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                extraFileResources: [getUri('/foo/bar.js')],
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                extraFileResources: [getUri('/foo/bar.js')],
                excludePattern: '*.js',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                excludePattern: patternsToIExpression(...globalGlob('*.js')),
                type: 2 /* QueryType.Text */
            });
            assertEqualTextQueries(queryBuilder.text(PATTERN_INFO, [ROOT_1_URI], {
                extraFileResources: [getUri('/foo/bar.js')],
                includePattern: '*.txt',
                expandPatterns: true
            }), {
                contentPattern: PATTERN_INFO,
                folderQueries: [{
                        folder: ROOT_1_URI
                    }],
                includePattern: patternsToIExpression(...globalGlob('*.txt')),
                type: 2 /* QueryType.Text */
            });
        });
        suite('parseSearchPaths 1', () => {
            test('simple includes', () => {
                function testSimpleIncludes(includePattern, expectedPatterns) {
                    const result = queryBuilder.parseSearchPaths(includePattern);
                    assert.deepStrictEqual({ ...result.pattern }, patternsToIExpression(...expectedPatterns), includePattern);
                    assert.strictEqual(result.searchPaths, undefined);
                }
                [
                    ['a', ['**/a/**', '**/a']],
                    ['a/b', ['**/a/b', '**/a/b/**']],
                    ['a/b,  c', ['**/a/b', '**/c', '**/a/b/**', '**/c/**']],
                    ['a,.txt', ['**/a', '**/a/**', '**/*.txt', '**/*.txt/**']],
                    ['a,,,b', ['**/a', '**/a/**', '**/b', '**/b/**']],
                    ['**/a,b/**', ['**/a', '**/a/**', '**/b/**']]
                ].forEach(([includePattern, expectedPatterns]) => testSimpleIncludes(includePattern, expectedPatterns));
            });
            function testIncludes(includePattern, expectedResult) {
                let actual;
                try {
                    actual = queryBuilder.parseSearchPaths(includePattern);
                }
                catch (_) {
                    actual = { searchPaths: [] };
                }
                assertEqualSearchPathResults(actual, expectedResult, includePattern);
            }
            function testIncludesDataItem([includePattern, expectedResult]) {
                testIncludes(includePattern, expectedResult);
            }
            test('absolute includes', () => {
                const cases = [
                    [
                        fixPath('/foo/bar'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }]
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + 'a',
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }],
                            pattern: patternsToIExpression(...globalGlob('a'))
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + fixPath('/1/2'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/bar') }, { searchPath: getUri('/1/2') }]
                        }
                    ],
                    [
                        fixPath('/foo/bar') + ',' + fixPath('/foo/../foo/bar/fooar/..'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/bar/**/*.ts'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar'),
                                    pattern: patternsToIExpression('**/*.ts', '**/*.ts/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/bar/*a/b/c'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar'),
                                    pattern: patternsToIExpression('*a/b/c', '*a/b/c/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/*a/b/c'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/'),
                                    pattern: patternsToIExpression('*a/b/c', '*a/b/c/**')
                                }]
                        }
                    ],
                    [
                        fixPath('/foo/{b,c}ar'),
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo'),
                                    pattern: patternsToIExpression('{b,c}ar', '{b,c}ar/**')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/single root folder', () => {
                const cases = [
                    [
                        './a',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a', 'a/**')
                                }]
                        }
                    ],
                    [
                        './a/',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a', 'a/**')
                                }]
                        }
                    ],
                    [
                        './a/*b/c',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/*b/c', 'a/*b/c/**')
                                }]
                        }
                    ],
                    [
                        './a/*b/c, ' + fixPath('/project/foo'),
                        {
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/*b/c', 'a/*b/c/**')
                                },
                                {
                                    searchPath: getUri('/project/foo')
                                }
                            ]
                        }
                    ],
                    [
                        './a/b/,./c/d',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/b', 'a/b/**', 'c/d', 'c/d/**')
                                }]
                        }
                    ],
                    [
                        '../',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo')
                                }]
                        }
                    ],
                    [
                        '..',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo')
                                }]
                        }
                    ],
                    [
                        '..\\bar',
                        {
                            searchPaths: [{
                                    searchPath: getUri('/foo/bar')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/two root folders', () => {
                const ROOT_2 = '/project/root2';
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath }, { path: getUri(ROOT_2).fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './root1',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './root2',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_2),
                                }]
                        }
                    ],
                    [
                        './root1/a/**/b, ./root2/**/*.txt',
                        {
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**')
                                },
                                {
                                    searchPath: getUri(ROOT_2),
                                    pattern: patternsToIExpression('**/*.txt', '**/*.txt/**')
                                }
                            ]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('include ./foldername', () => {
                const ROOT_2 = '/project/root2';
                const ROOT_1_FOLDERNAME = 'foldername';
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath, name: ROOT_1_FOLDERNAME }, { path: getUri(ROOT_2).fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './foldername',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI
                                }]
                        }
                    ],
                    [
                        './foldername/foo',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('foo', 'foo/**')
                                }]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('folder with slash in the name', () => {
                const ROOT_2 = '/project/root2';
                const ROOT_2_URI = getUri(ROOT_2);
                const ROOT_1_FOLDERNAME = 'folder/one';
                const ROOT_2_FOLDERNAME = 'folder/two+'; // And another regex character, #126003
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath, name: ROOT_1_FOLDERNAME }, { path: ROOT_2_URI.fsPath, name: ROOT_2_FOLDERNAME }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('config'));
                const cases = [
                    [
                        './folder/one',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_1_URI
                                }]
                        }
                    ],
                    [
                        './folder/two+/foo/',
                        {
                            searchPaths: [{
                                    searchPath: ROOT_2_URI,
                                    pattern: patternsToIExpression('foo', 'foo/**')
                                }]
                        }
                    ],
                    [
                        './folder/onesomethingelse',
                        { searchPaths: [] }
                    ],
                    [
                        './folder/onesomethingelse/foo',
                        { searchPaths: [] }
                    ],
                    [
                        './folder',
                        { searchPaths: [] }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
            test('relative includes w/multiple ambiguous root folders', () => {
                const ROOT_2 = '/project/rootB';
                const ROOT_3 = '/otherproject/rootB';
                mockWorkspace.folders = (0, workspaces_1.toWorkspaceFolders)([{ path: ROOT_1_URI.fsPath }, { path: getUri(ROOT_2).fsPath }, { path: getUri(ROOT_3).fsPath }], WS_CONFIG_PATH, resources_1.extUriBiasedIgnorePathCase);
                mockWorkspace.configuration = uri_1.URI.file(fixPath('/config'));
                const cases = [
                    [
                        '',
                        {
                            searchPaths: undefined
                        }
                    ],
                    [
                        './',
                        {
                            searchPaths: undefined
                        }
                    ],
                    [
                        './root1',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './root1,./',
                        {
                            searchPaths: [{
                                    searchPath: getUri(ROOT_1)
                                }]
                        }
                    ],
                    [
                        './rootB',
                        {
                            searchPaths: [
                                {
                                    searchPath: getUri(ROOT_2),
                                },
                                {
                                    searchPath: getUri(ROOT_3),
                                }
                            ]
                        }
                    ],
                    [
                        './rootB/a/**/b, ./rootB/b/**/*.txt',
                        {
                            searchPaths: [
                                {
                                    searchPath: getUri(ROOT_2),
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**', 'b/**/*.txt', 'b/**/*.txt/**')
                                },
                                {
                                    searchPath: getUri(ROOT_3),
                                    pattern: patternsToIExpression('a/**/b', 'a/**/b/**', 'b/**/*.txt', 'b/**/*.txt/**')
                                }
                            ]
                        }
                    ],
                    [
                        './root1/**/foo/, bar/',
                        {
                            pattern: patternsToIExpression('**/bar', '**/bar/**'),
                            searchPaths: [
                                {
                                    searchPath: ROOT_1_URI,
                                    pattern: patternsToIExpression('**/foo', '**/foo/**')
                                }
                            ]
                        }
                    ]
                ];
                cases.forEach(testIncludesDataItem);
            });
        });
        suite('parseSearchPaths 2', () => {
            function testIncludes(includePattern, expectedResult) {
                assertEqualSearchPathResults(queryBuilder.parseSearchPaths(includePattern), expectedResult, includePattern);
            }
            function testIncludesDataItem([includePattern, expectedResult]) {
                testIncludes(includePattern, expectedResult);
            }
            (platform_1.isWindows ? test.skip : test)('includes with tilde', () => {
                const userHome = uri_1.URI.file('/');
                const cases = [
                    [
                        '~/foo/bar',
                        {
                            searchPaths: [{ searchPath: getUri(userHome.fsPath, '/foo/bar') }]
                        }
                    ],
                    [
                        '~/foo/bar, a',
                        {
                            searchPaths: [{ searchPath: getUri(userHome.fsPath, '/foo/bar') }],
                            pattern: patternsToIExpression(...globalGlob('a'))
                        }
                    ],
                    [
                        fixPath('/foo/~/bar'),
                        {
                            searchPaths: [{ searchPath: getUri('/foo/~/bar') }]
                        }
                    ],
                ];
                cases.forEach(testIncludesDataItem);
            });
        });
        suite('smartCase', () => {
            test('no flags -> no change', () => {
                const query = queryBuilder.text({
                    pattern: 'a'
                }, []);
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('maintains isCaseSensitive when smartCase not set', () => {
                const query = queryBuilder.text({
                    pattern: 'a',
                    isCaseSensitive: true
                }, []);
                assert(query.contentPattern.isCaseSensitive);
            });
            test('maintains isCaseSensitive when smartCase set', () => {
                const query = queryBuilder.text({
                    pattern: 'a',
                    isCaseSensitive: true
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines not case sensitive', () => {
                const query = queryBuilder.text({
                    pattern: 'abcd'
                }, [], {
                    isSmartCase: true
                });
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines case sensitive', () => {
                const query = queryBuilder.text({
                    pattern: 'abCd'
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines not case sensitive (regex)', () => {
                const query = queryBuilder.text({
                    pattern: 'ab\\Sd',
                    isRegExp: true
                }, [], {
                    isSmartCase: true
                });
                assert(!query.contentPattern.isCaseSensitive);
            });
            test('smartCase determines case sensitive (regex)', () => {
                const query = queryBuilder.text({
                    pattern: 'ab[A-Z]d',
                    isRegExp: true
                }, [], {
                    isSmartCase: true
                });
                assert(query.contentPattern.isCaseSensitive);
            });
        });
        suite('file', () => {
            test('simple file query', () => {
                const cacheKey = 'asdf';
                const query = queryBuilder.file([ROOT_1_NAMED_FOLDER], {
                    cacheKey,
                    sortByScore: true
                });
                assert.strictEqual(query.folderQueries.length, 1);
                assert.strictEqual(query.cacheKey, cacheKey);
                assert(query.sortByScore);
            });
        });
    });
    function assertEqualTextQueries(actual, expected) {
        expected = {
            ...DEFAULT_TEXT_QUERY_PROPS,
            ...expected
        };
        return assertEqualQueries(actual, expected);
    }
    function assertEqualQueries(actual, expected) {
        expected = {
            ...DEFAULT_QUERY_PROPS,
            ...expected
        };
        const folderQueryToCompareObject = (fq) => {
            return {
                path: fq.folder.fsPath,
                excludePattern: normalizeExpression(fq.excludePattern),
                includePattern: normalizeExpression(fq.includePattern),
                fileEncoding: fq.fileEncoding
            };
        };
        // Avoid comparing URI objects, not a good idea
        if (expected.folderQueries) {
            assert.deepStrictEqual(actual.folderQueries.map(folderQueryToCompareObject), expected.folderQueries.map(folderQueryToCompareObject));
            actual.folderQueries = [];
            expected.folderQueries = [];
        }
        if (expected.extraFileResources) {
            assert.deepStrictEqual(actual.extraFileResources.map(extraFile => extraFile.fsPath), expected.extraFileResources.map(extraFile => extraFile.fsPath));
            delete expected.extraFileResources;
            delete actual.extraFileResources;
        }
        delete actual.usingSearchPaths;
        actual.includePattern = normalizeExpression(actual.includePattern);
        actual.excludePattern = normalizeExpression(actual.excludePattern);
        cleanUndefinedQueryValues(actual);
        assert.deepStrictEqual(actual, expected);
    }
    function assertEqualSearchPathResults(actual, expected, message) {
        cleanUndefinedQueryValues(actual);
        assert.deepStrictEqual({ ...actual.pattern }, { ...expected.pattern }, message);
        assert.strictEqual(actual.searchPaths && actual.searchPaths.length, expected.searchPaths && expected.searchPaths.length);
        if (actual.searchPaths) {
            actual.searchPaths.forEach((searchPath, i) => {
                const expectedSearchPath = expected.searchPaths[i];
                assert.deepStrictEqual(searchPath.pattern && { ...searchPath.pattern }, expectedSearchPath.pattern);
                assert.strictEqual(searchPath.searchPath.toString(), expectedSearchPath.searchPath.toString());
            });
        }
    }
    /**
     * Recursively delete all undefined property values from the search query, to make it easier to
     * assert.deepStrictEqual with some expected object.
     */
    function cleanUndefinedQueryValues(q) {
        for (const key in q) {
            if (q[key] === undefined) {
                delete q[key];
            }
            else if (typeof q[key] === 'object') {
                cleanUndefinedQueryValues(q[key]);
            }
        }
        return q;
    }
    function globalGlob(pattern) {
        return [
            `**/${pattern}/**`,
            `**/${pattern}`
        ];
    }
    function patternsToIExpression(...patterns) {
        return patterns.length ?
            patterns.reduce((glob, cur) => { glob[cur] = true; return glob; }, {}) :
            undefined;
    }
    function getUri(...slashPathParts) {
        return uri_1.URI.file(fixPath(...slashPathParts));
    }
    function fixPath(...slashPathParts) {
        if (platform_1.isWindows && slashPathParts.length && !slashPathParts[0].match(/^c:/i)) {
            slashPathParts.unshift('c:');
        }
        return (0, path_1.join)(...slashPathParts);
    }
    function normalizeExpression(expression) {
        if (!expression) {
            return expression;
        }
        const normalized = {};
        Object.keys(expression).forEach(key => {
            normalized[key.replace(/\\/g, '/')] = expression[key];
        });
        return normalized;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlCdWlsZGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvdGVzdC9icm93c2VyL3F1ZXJ5QnVpbGRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQW1rQ0EsZ0RBa0NDO0lBRUQsb0VBWUM7SUFNRCw4REFVQztJQUVELGdDQUtDO0lBRUQsc0RBSUM7SUFFRCx3QkFFQztJQUVELDBCQU1DO0lBRUQsa0RBV0M7SUFqcENELE1BQU0scUJBQXFCLEdBQUcsRUFBRSxDQUFDO0lBQ2pDLE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxDQUFDO0lBQy9ILE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0lBQy9CLE1BQU0sd0JBQXdCLEdBQUcsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFFckQsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDMUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzFDLE1BQU0sWUFBWSxHQUFpQixFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNwRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDckMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sbUJBQW1CLEdBQUcsSUFBQSw2QkFBaUIsRUFBQyxVQUFVLENBQUMsQ0FBQztRQUMxRCxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLDhFQUE4RTtRQUV6SSxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElB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