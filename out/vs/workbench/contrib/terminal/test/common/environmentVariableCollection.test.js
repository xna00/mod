/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/terminal/common/environmentVariable", "vs/base/common/platform", "vs/platform/terminal/common/environmentVariableCollection", "vs/platform/terminal/common/environmentVariableShared", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert_1, environmentVariable_1, platform_1, environmentVariableCollection_1, environmentVariableShared_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EnvironmentVariable - MergedEnvironmentVariableCollection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('ctor', () => {
            test('Should keep entries that come after a Prepend or Append type mutators', () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' }]
                            ])
                        }],
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }],
                    ['ext3', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' }]
                            ])
                        }],
                    ['ext4', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A', options: { applyAtProcessCreation: true, applyAtShellIntegration: true } }]
                            ])
                        }]
                ]));
                (0, assert_1.deepStrictEqual)([...merged.getVariableMap(undefined).entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a4', variable: 'A', options: { applyAtProcessCreation: true, applyAtShellIntegration: true } },
                            { extensionIdentifier: 'ext3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a3', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a2', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a1', variable: 'A', options: undefined }
                        ]]
                ]);
            });
            test('Should remove entries that come after a Replace type mutator', () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' }]
                            ])
                        }],
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }],
                    ['ext3', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }],
                    ['ext4', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }]
                ]));
                (0, assert_1.deepStrictEqual)([...merged.getVariableMap(undefined).entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a3', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a2', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a1', variable: 'A', options: undefined }
                        ]]
                ], 'The ext4 entry should be removed as it comes after a Replace');
            });
            test('Appropriate workspace scoped entries are returned when querying for a particular workspace folder', () => {
                const scope1 = { workspaceFolder: { uri: uri_1.URI.file('workspace1'), name: 'workspace1', index: 0 } };
                const scope2 = { workspaceFolder: { uri: uri_1.URI.file('workspace2'), name: 'workspace2', index: 3 } };
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, scope: scope1, variable: 'A' }]
                            ])
                        }],
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }],
                    ['ext3', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, scope: scope2, variable: 'A' }]
                            ])
                        }],
                    ['ext4', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }]
                ]));
                (0, assert_1.deepStrictEqual)([...merged.getVariableMap(scope2).entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a4', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a3', scope: scope2, variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a2', variable: 'A', options: undefined },
                        ]]
                ]);
            });
            test('Workspace scoped entries are not included when looking for global entries', () => {
                const scope1 = { workspaceFolder: { uri: uri_1.URI.file('workspace1'), name: 'workspace1', index: 0 } };
                const scope2 = { workspaceFolder: { uri: uri_1.URI.file('workspace2'), name: 'workspace2', index: 3 } };
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, scope: scope1, variable: 'A' }]
                            ])
                        }],
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }],
                    ['ext3', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, scope: scope2, variable: 'A' }]
                            ])
                        }],
                    ['ext4', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }]
                ]));
                (0, assert_1.deepStrictEqual)([...merged.getVariableMap(undefined).entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a4', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a2', variable: 'A', options: undefined },
                        ]]
                ]);
            });
            test('Workspace scoped description entries are properly filtered for each extension', () => {
                const scope1 = { workspaceFolder: { uri: uri_1.URI.file('workspace1'), name: 'workspace1', index: 0 } };
                const scope2 = { workspaceFolder: { uri: uri_1.URI.file('workspace2'), name: 'workspace2', index: 3 } };
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, scope: scope1, variable: 'A' }]
                            ]),
                            descriptionMap: (0, environmentVariableShared_1.deserializeEnvironmentDescriptionMap)([
                                ['A-key-scope1', { description: 'ext1 scope1 description', scope: scope1 }],
                                ['A-key-scope2', { description: 'ext1 scope2 description', scope: scope2 }],
                            ])
                        }],
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ]),
                            descriptionMap: (0, environmentVariableShared_1.deserializeEnvironmentDescriptionMap)([
                                ['A-key', { description: 'ext2 global description' }],
                            ])
                        }],
                    ['ext3', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, scope: scope2, variable: 'A' }]
                            ]),
                            descriptionMap: (0, environmentVariableShared_1.deserializeEnvironmentDescriptionMap)([
                                ['A-key', { description: 'ext3 scope2 description', scope: scope2 }],
                            ])
                        }],
                    ['ext4', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }]
                ]));
                (0, assert_1.deepStrictEqual)([...merged.getDescriptionMap(scope1).entries()], [
                    ['ext1', 'ext1 scope1 description'],
                ]);
                (0, assert_1.deepStrictEqual)([...merged.getDescriptionMap(undefined).entries()], [
                    ['ext2', 'ext2 global description'],
                ]);
            });
        });
        suite('applyToProcessEnvironment', () => {
            test('should apply the collection to an environment', async () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C' }]
                            ])
                        }]
                ]));
                const env = {
                    A: 'foo',
                    B: 'bar',
                    C: 'baz'
                };
                await merged.applyToProcessEnvironment(env, undefined);
                (0, assert_1.deepStrictEqual)(env, {
                    A: 'a',
                    B: 'barb',
                    C: 'cbaz'
                });
            });
            test('should apply the appropriate workspace scoped entries to an environment', async () => {
                const scope1 = { workspaceFolder: { uri: uri_1.URI.file('workspace1'), name: 'workspace1', index: 0 } };
                const scope2 = { workspaceFolder: { uri: uri_1.URI.file('workspace2'), name: 'workspace2', index: 3 } };
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, scope: scope1, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, scope: scope2, variable: 'B' }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C' }]
                            ])
                        }]
                ]));
                const env = {
                    A: 'foo',
                    B: 'bar',
                    C: 'baz'
                };
                await merged.applyToProcessEnvironment(env, scope1);
                (0, assert_1.deepStrictEqual)(env, {
                    A: 'a',
                    B: 'bar', // This is not changed because the scope does not match
                    C: 'cbaz'
                });
            });
            test('should apply the collection to environment entries with no values', async () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C' }]
                            ])
                        }]
                ]));
                const env = {};
                await merged.applyToProcessEnvironment(env, undefined);
                (0, assert_1.deepStrictEqual)(env, {
                    A: 'a',
                    B: 'b',
                    C: 'c'
                });
            });
            test('should apply to variable case insensitively on Windows only', async () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'a' }],
                                ['b', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'b' }],
                                ['c', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'c' }]
                            ])
                        }]
                ]));
                const env = {
                    A: 'A',
                    B: 'B',
                    C: 'C'
                };
                await merged.applyToProcessEnvironment(env, undefined);
                if (platform_1.isWindows) {
                    (0, assert_1.deepStrictEqual)(env, {
                        A: 'a',
                        B: 'Bb',
                        C: 'cC'
                    });
                }
                else {
                    (0, assert_1.deepStrictEqual)(env, {
                        a: 'a',
                        A: 'A',
                        b: 'b',
                        B: 'B',
                        c: 'c',
                        C: 'C'
                    });
                }
            });
        });
        suite('diff', () => {
            test('should return undefined when collectinos are the same', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, undefined);
                (0, assert_1.strictEqual)(diff, undefined);
            });
            test('should generate added diffs from when the first entry is added', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, undefined);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                const entries = [...diff.added.entries()];
                (0, assert_1.deepStrictEqual)(entries, [
                    ['A', [{ extensionIdentifier: 'ext1', value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A', options: undefined }]]
                ]);
            });
            test('should generate added diffs from the same extension', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, undefined);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                const entries = [...diff.added.entries()];
                (0, assert_1.deepStrictEqual)(entries, [
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B', options: undefined }]]
                ]);
            });
            test('should generate added diffs from a different extension', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }],
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, undefined);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.added.entries()], [
                    ['A', [{ extensionIdentifier: 'ext2', value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A', options: undefined }]]
                ]);
                const merged3 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' }]
                            ])
                        }],
                    // This entry should get removed
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }]
                ]));
                const diff2 = merged1.diff(merged3, undefined);
                (0, assert_1.strictEqual)(diff2.changed.size, 0);
                (0, assert_1.strictEqual)(diff2.removed.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.added.entries()], [...diff2.added.entries()], 'Swapping the order of the entries in the other collection should yield the same result');
            });
            test('should remove entries in the diff that come after a Replace', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }]
                ]));
                const merged4 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }],
                    // This entry should get removed as it comes after a replace
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged4, undefined);
                (0, assert_1.strictEqual)(diff, undefined, 'Replace should ignore any entries after it');
            });
            test('should generate removed diffs', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'B' }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, undefined);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.added.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.removed.entries()], [
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'B', options: undefined }]]
                ]);
            });
            test('should generate changed diffs', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'B' }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, undefined);
                (0, assert_1.strictEqual)(diff.added.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.changed.entries()], [
                    ['A', [{ extensionIdentifier: 'ext1', value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A', options: undefined }]],
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B', options: undefined }]]
                ]);
            });
            test('should generate diffs with added, changed and removed', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'B' }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'C' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, undefined);
                (0, assert_1.deepStrictEqual)([...diff.added.entries()], [
                    ['C', [{ extensionIdentifier: 'ext1', value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'C', options: undefined }]],
                ]);
                (0, assert_1.deepStrictEqual)([...diff.removed.entries()], [
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'B', options: undefined }]]
                ]);
                (0, assert_1.deepStrictEqual)([...diff.changed.entries()], [
                    ['A', [{ extensionIdentifier: 'ext1', value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A', options: undefined }]]
                ]);
            });
            test('should only generate workspace specific diffs', () => {
                const scope1 = { workspaceFolder: { uri: uri_1.URI.file('workspace1'), name: 'workspace1', index: 0 } };
                const scope2 = { workspaceFolder: { uri: uri_1.URI.file('workspace2'), name: 'workspace2', index: 3 } };
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, scope: scope1, variable: 'A' }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'B' }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, scope: scope1, variable: 'A' }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, scope: scope2, variable: 'C' }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2, scope1);
                (0, assert_1.strictEqual)(diff.added.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.removed.entries()], [
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'B', options: undefined }]]
                ]);
                (0, assert_1.deepStrictEqual)([...diff.changed.entries()], [
                    ['A', [{ extensionIdentifier: 'ext1', value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, scope: scope1, variable: 'A', options: undefined }]]
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZUNvbGxlY3Rpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9jb21tb24vZW52aXJvbm1lbnRWYXJpYWJsZUNvbGxlY3Rpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxLQUFLLENBQUMsMkRBQTJELEVBQUUsR0FBRyxFQUFFO1FBQ3ZFLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUNsQixJQUFJLENBQUMsdUVBQXVFLEVBQUUsR0FBRyxFQUFFO2dCQUNsRixNQUFNLE1BQU0sR0FBRyxJQUFJLG1FQUFtQyxDQUFDLElBQUksR0FBRyxDQUFDO29CQUM5RCxDQUFDLE1BQU0sRUFBRTs0QkFDUixHQUFHLEVBQUUsSUFBQSxvRUFBd0MsRUFBQztnQ0FDN0MsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxvREFBOEIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDOzZCQUN2RixDQUFDO3lCQUNGLENBQUM7b0JBQ0YsQ0FBQyxNQUFNLEVBQUU7NEJBQ1IsR0FBRyxFQUFFLElBQUEsb0VBQXdDLEVBQUM7Z0NBQzdDLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsb0RBQThCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQzs2QkFDdEYsQ0FBQzt5QkFDRixDQUFDO29CQUNGLENBQUMsTUFBTSxFQUFFOzRCQUNSLEdBQUcsRUFBRSxJQUFBLG9FQUF3QyxFQUFDO2dDQUM3QyxDQUFDLE9BQU8sRUFBRSxF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