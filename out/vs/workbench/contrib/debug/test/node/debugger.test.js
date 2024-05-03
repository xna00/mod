/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/platform", "vs/workbench/contrib/debug/common/debugger", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/common/uri", "vs/workbench/contrib/debug/node/debugAdapter", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/platform/extensions/common/extensions", "vs/base/test/common/utils"], function (require, exports, assert, path_1, platform, debugger_1, testConfigurationService_1, uri_1, debugAdapter_1, testTextResourcePropertiesService_1, extensions_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - Debugger', () => {
        let _debugger;
        const extensionFolderPath = '/a/b/c/';
        const debuggerContribution = {
            type: 'mock',
            label: 'Mock Debug',
            program: './out/mock/mockDebug.js',
            args: ['arg1', 'arg2'],
            configurationAttributes: {
                launch: {
                    required: ['program'],
                    properties: {
                        program: {
                            'type': 'string',
                            'description': 'Workspace relative path to a text file.',
                            'default': 'readme.md'
                        }
                    }
                }
            },
            variables: null,
            initialConfigurations: [
                {
                    name: 'Mock-Debug',
                    type: 'mock',
                    request: 'launch',
                    program: 'readme.md'
                }
            ]
        };
        const extensionDescriptor0 = {
            id: 'adapter',
            identifier: new extensions_1.ExtensionIdentifier('adapter'),
            name: 'myAdapter',
            version: '1.0.0',
            publisher: 'vscode',
            extensionLocation: uri_1.URI.file(extensionFolderPath),
            isBuiltin: false,
            isUserBuiltin: false,
            isUnderDevelopment: false,
            engines: null,
            targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
            contributes: {
                'debuggers': [
                    debuggerContribution
                ]
            }
        };
        const extensionDescriptor1 = {
            id: 'extension1',
            identifier: new extensions_1.ExtensionIdentifier('extension1'),
            name: 'extension1',
            version: '1.0.0',
            publisher: 'vscode',
            extensionLocation: uri_1.URI.file('/e1/b/c/'),
            isBuiltin: false,
            isUserBuiltin: false,
            isUnderDevelopment: false,
            engines: null,
            targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
            contributes: {
                'debuggers': [
                    {
                        type: 'mock',
                        runtime: 'runtime',
                        runtimeArgs: ['rarg'],
                        program: 'mockprogram',
                        args: ['parg']
                    }
                ]
            }
        };
        const extensionDescriptor2 = {
            id: 'extension2',
            identifier: new extensions_1.ExtensionIdentifier('extension2'),
            name: 'extension2',
            version: '1.0.0',
            publisher: 'vscode',
            extensionLocation: uri_1.URI.file('/e2/b/c/'),
            isBuiltin: false,
            isUserBuiltin: false,
            isUnderDevelopment: false,
            engines: null,
            targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
            contributes: {
                'debuggers': [
                    {
                        type: 'mock',
                        win: {
                            runtime: 'winRuntime',
                            program: 'winProgram'
                        },
                        linux: {
                            runtime: 'linuxRuntime',
                            program: 'linuxProgram'
                        },
                        osx: {
                            runtime: 'osxRuntime',
                            program: 'osxProgram'
                        }
                    }
                ]
            }
        };
        const adapterManager = {
            getDebugAdapterDescriptor(session, config) {
                return Promise.resolve(undefined);
            }
        };
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const configurationService = new testConfigurationService_1.TestConfigurationService();
        const testResourcePropertiesService = new testTextResourcePropertiesService_1.TestTextResourcePropertiesService(configurationService);
        setup(() => {
            _debugger = new debugger_1.Debugger(adapterManager, debuggerContribution, extensionDescriptor0, configurationService, testResourcePropertiesService, undefined, undefined, undefined, undefined);
        });
        teardown(() => {
            _debugger = null;
        });
        test('attributes', () => {
            assert.strictEqual(_debugger.type, debuggerContribution.type);
            assert.strictEqual(_debugger.label, debuggerContribution.label);
            const ae = debugAdapter_1.ExecutableDebugAdapter.platformAdapterExecutable([extensionDescriptor0], 'mock');
            assert.strictEqual(ae.command, (0, path_1.join)(extensionFolderPath, debuggerContribution.program));
            assert.deepStrictEqual(ae.args, debuggerContribution.args);
        });
        test('merge platform specific attributes', function () {
            if (!process.versions.electron) {
                this.skip(); //TODO@debug this test fails when run in node.js environments
            }
            const ae = debugAdapter_1.ExecutableDebugAdapter.platformAdapterExecutable([extensionDescriptor1, extensionDescriptor2], 'mock');
            assert.strictEqual(ae.command, platform.isLinux ? 'linuxRuntime' : (platform.isMacintosh ? 'osxRuntime' : 'winRuntime'));
            const xprogram = platform.isLinux ? 'linuxProgram' : (platform.isMacintosh ? 'osxProgram' : 'winProgram');
            assert.deepStrictEqual(ae.args, ['rarg', (0, path_1.normalize)('/e2/b/c/') + xprogram, 'parg']);
        });
        test('initial config file content', () => {
            const expected = ['{',
                '	// Use IntelliSense to learn about possible attributes.',
                '	// Hover to view descriptions of existing attributes.',
                '	// For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387',
                '	"version": "0.2.0",',
                '	"configurations": [',
                '		{',
                '			"name": "Mock-Debug",',
                '			"type": "mock",',
                '			"request": "launch",',
                '			"program": "readme.md"',
                '		}',
                '	]',
                '}'].join(testResourcePropertiesService.getEOL(uri_1.URI.file('somefile')));
            return _debugger.getInitialConfigurationContent().then(content => {
                assert.strictEqual(content, expected);
            }, err => assert.fail(err));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdnZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9ub2RlL2RlYnVnZ2VyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUM5QixJQUFJLFNBQW1CLENBQUM7UUFFeEIsTUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQUM7UUFDdEMsTUFBTSxvQkFBb0IsR0FBRztZQUM1QixJQUFJLEVBQUUsTUFBTTtZQUNaLEtBQUssRUFBRSxZQUFZO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztZQUN0Qix1QkFBdUIsRUFBRTtnQkFDeEIsTUFBTSxFQUFFO29CQUNQLFFBQVEsRUFBRSxDQUFDLFNBQVMsQ0FBQztvQkFDckIsVUFBVSxFQUFFO3dCQUNYLE9BQU8sRUFBRTs0QkFDUixNQUFNLEVBQUUsUUFBUTs0QkFDaEIsYUFBYSxFQUFFLHlDQUF5Qzs0QkFDeEQsU0FBUyxFQUFFLFdBQVc7eUJBQ3RCO3FCQUNEO2lCQUNEO2FBQ0Q7WUFDRCxTQUFTLEVBQUUsSUFBSztZQUNoQixxQkFBcUIsRUFBRTtnQkFDdEI7b0JBQ0MsSUFBSSxFQUFFLFlBQVk7b0JBQ2xCLElBQUksRUFBRSxNQUFNO29CQUNaLE9BQU8sRUFBRSxRQUFRO29CQUNqQixPQUFPLEVBQUUsV0FBVztpQkFDcEI7YUFDRDtTQUNELENBQUM7UUFFRixNQUFNLG9CQUFvQixHQUEwQjtZQUNuRCxFQUFFLEVBQUUsU0FBUztZQUNiLFVBQVUsRUFBRSxJQUFJLGdDQUFtQixDQUFDLFNBQVMsQ0FBQztZQUM5QyxJQUFJLEVBQUUsV0FBVztZQUNqQixPQUFP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