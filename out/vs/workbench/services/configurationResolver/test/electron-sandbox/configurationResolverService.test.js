/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/common/editorCommon", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/services/configurationResolver/browser/baseConfigurationResolverService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, sinon_1, event_1, lifecycle_1, network_1, path_1, platform, types_1, uri_1, utils_1, selection_1, editorCommon_1, testConfigurationService_1, testWorkspace_1, baseConfigurationResolverService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockLineNumber = 10;
    class TestEditorServiceWithActiveEditor extends workbenchTestServices_1.TestEditorService {
        get activeTextEditorControl() {
            return {
                getEditorType() {
                    return editorCommon_1.EditorType.ICodeEditor;
                },
                getSelection() {
                    return new selection_1.Selection(mockLineNumber, 1, mockLineNumber, 10);
                }
            };
        }
        get activeEditor() {
            return {
                get resource() {
                    return uri_1.URI.parse('file:///VSCode/workspaceLocation/file');
                }
            };
        }
    }
    class TestConfigurationResolverService extends baseConfigurationResolverService_1.BaseConfigurationResolverService {
    }
    const nullContext = {
        getAppRoot: () => undefined,
        getExecPath: () => undefined
    };
    suite('Configuration Resolver Service', () => {
        let configurationResolverService;
        const envVariables = { key1: 'Value for key1', key2: 'Value for key2' };
        // let environmentService: MockWorkbenchEnvironmentService;
        let mockCommandService;
        let editorService;
        let containingWorkspace;
        let workspace;
        let quickInputService;
        let labelService;
        let pathService;
        let extensionService;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            mockCommandService = new MockCommandService();
            editorService = disposables.add(new TestEditorServiceWithActiveEditor());
            quickInputService = new workbenchTestServices_1.TestQuickInputService();
            // environmentService = new MockWorkbenchEnvironmentService(envVariables);
            labelService = new MockLabelService();
            pathService = new MockPathService();
            extensionService = new workbenchTestServices_2.TestExtensionService();
            containingWorkspace = (0, testWorkspace_1.testWorkspace)(uri_1.URI.parse('file:///VSCode/workspaceLocation'));
            workspace = containingWorkspace.folders[0];
            configurationResolverService = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), editorService, new MockInputsConfigurationService(), mockCommandService, new workbenchTestServices_2.TestContextService(containingWorkspace), quickInputService, labelService, pathService, extensionService);
        });
        teardown(() => {
            configurationResolverService = null;
        });
        test('substitute one', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceFolder} xyz'), 'abc \\VSCode\\workspaceLocation xyz');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceFolder} xyz'), 'abc /VSCode/workspaceLocation xyz');
            }
        });
        test('workspace folder with argument', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceFolder:workspaceLocation} xyz'), 'abc \\VSCode\\workspaceLocation xyz');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceFolder:workspaceLocation} xyz'), 'abc /VSCode/workspaceLocation xyz');
            }
        });
        test('workspace folder with invalid argument', () => {
            assert.rejects(async () => await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceFolder:invalidLocation} xyz'));
        });
        test('workspace folder with undefined workspace folder', () => {
            assert.rejects(async () => await configurationResolverService.resolveAsync(undefined, 'abc ${workspaceFolder} xyz'));
        });
        test('workspace folder with argument and undefined workspace folder', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(undefined, 'abc ${workspaceFolder:workspaceLocation} xyz'), 'abc \\VSCode\\workspaceLocation xyz');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(undefined, 'abc ${workspaceFolder:workspaceLocation} xyz'), 'abc /VSCode/workspaceLocation xyz');
            }
        });
        test('workspace folder with invalid argument and undefined workspace folder', () => {
            assert.rejects(async () => await configurationResolverService.resolveAsync(undefined, 'abc ${workspaceFolder:invalidLocation} xyz'));
        });
        test('workspace root folder name', async () => {
            assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceRootFolderName} xyz'), 'abc workspaceLocation xyz');
        });
        test('current selected line number', async () => {
            assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${lineNumber} xyz'), `abc ${mockLineNumber} xyz`);
        });
        test('relative file', async () => {
            assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${relativeFile} xyz'), 'abc file xyz');
        });
        test('relative file with argument', async () => {
            assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${relativeFile:workspaceLocation} xyz'), 'abc file xyz');
        });
        test('relative file with invalid argument', () => {
            assert.rejects(async () => await configurationResolverService.resolveAsync(workspace, 'abc ${relativeFile:invalidLocation} xyz'));
        });
        test('relative file with undefined workspace folder', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(undefined, 'abc ${relativeFile} xyz'), 'abc \\VSCode\\workspaceLocation\\file xyz');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(undefined, 'abc ${relativeFile} xyz'), 'abc /VSCode/workspaceLocation/file xyz');
            }
        });
        test('relative file with argument and undefined workspace folder', async () => {
            assert.strictEqual(await configurationResolverService.resolveAsync(undefined, 'abc ${relativeFile:workspaceLocation} xyz'), 'abc file xyz');
        });
        test('relative file with invalid argument and undefined workspace folder', () => {
            assert.rejects(async () => await configurationResolverService.resolveAsync(undefined, 'abc ${relativeFile:invalidLocation} xyz'));
        });
        test('substitute many', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${workspaceFolder} - ${workspaceFolder}'), '\\VSCode\\workspaceLocation - \\VSCode\\workspaceLocation');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${workspaceFolder} - ${workspaceFolder}'), '/VSCode/workspaceLocation - /VSCode/workspaceLocation');
            }
        });
        test('substitute one env variable', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceFolder} ${env:key1} xyz'), 'abc \\VSCode\\workspaceLocation Value for key1 xyz');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, 'abc ${workspaceFolder} ${env:key1} xyz'), 'abc /VSCode/workspaceLocation Value for key1 xyz');
            }
        });
        test('substitute many env variable', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), '\\VSCode\\workspaceLocation - \\VSCode\\workspaceLocation Value for key1 - Value for key2');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), '/VSCode/workspaceLocation - /VSCode/workspaceLocation Value for key1 - Value for key2');
            }
        });
        test('disallows nested keys (#77289)', async () => {
            assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${env:key1} ${env:key1${env:key2}}'), 'Value for key1 ${env:key1${env:key2}}');
        });
        test('supports extensionDir', async () => {
            const getExtension = (0, sinon_1.stub)(extensionService, 'getExtension');
            getExtension.withArgs('publisher.extId').returns(Promise.resolve({ extensionLocation: uri_1.URI.file('/some/path') }));
            assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${extensionInstallFolder:publisher.extId}'), uri_1.URI.file('/some/path').fsPath);
        });
        // test('substitute keys and values in object', () => {
        // 	const myObject = {
        // 		'${workspaceRootFolderName}': '${lineNumber}',
        // 		'hey ${env:key1} ': '${workspaceRootFolderName}'
        // 	};
        // 	assert.deepStrictEqual(configurationResolverService!.resolveAsync(workspace, myObject), {
        // 		'workspaceLocation': `${editorService.mockLineNumber}`,
        // 		'hey Value for key1 ': 'workspaceLocation'
        // 	});
        // });
        test('substitute one env variable using platform case sensitivity', async () => {
            if (platform.isWindows) {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${env:key1} - ${env:Key1}'), 'Value for key1 - Value for key1');
            }
            else {
                assert.strictEqual(await configurationResolverService.resolveAsync(workspace, '${env:key1} - ${env:Key1}'), 'Value for key1 - ');
            }
        });
        test('substitute one configuration variable', async () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            assert.strictEqual(await service.resolveAsync(workspace, 'abc ${config:editor.fontFamily} xyz'), 'abc foo xyz');
        });
        test('substitute configuration variable with undefined workspace folder', async () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                }
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            assert.strictEqual(await service.resolveAsync(undefined, 'abc ${config:editor.fontFamily} xyz'), 'abc foo xyz');
        });
        test('substitute many configuration variables', async () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            assert.strictEqual(await service.resolveAsync(workspace, 'abc ${config:editor.fontFamily} ${config:terminal.integrated.fontFamily} xyz'), 'abc foo bar xyz');
        });
        test('substitute one env variable and a configuration variable', async () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            if (platform.isWindows) {
                assert.strictEqual(await service.resolveAsync(workspace, 'abc ${config:editor.fontFamily} ${workspaceFolder} ${env:key1} xyz'), 'abc foo \\VSCode\\workspaceLocation Value for key1 xyz');
            }
            else {
                assert.strictEqual(await service.resolveAsync(workspace, 'abc ${config:editor.fontFamily} ${workspaceFolder} ${env:key1} xyz'), 'abc foo /VSCode/workspaceLocation Value for key1 xyz');
            }
        });
        test('substitute many env variable and a configuration variable', async () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                }
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            if (platform.isWindows) {
                assert.strictEqual(await service.resolveAsync(workspace, '${config:editor.fontFamily} ${config:terminal.integrated.fontFamily} ${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), 'foo bar \\VSCode\\workspaceLocation - \\VSCode\\workspaceLocation Value for key1 - Value for key2');
            }
            else {
                assert.strictEqual(await service.resolveAsync(workspace, '${config:editor.fontFamily} ${config:terminal.integrated.fontFamily} ${workspaceFolder} - ${workspaceFolder} ${env:key1} - ${env:key2}'), 'foo bar /VSCode/workspaceLocation - /VSCode/workspaceLocation Value for key1 - Value for key2');
            }
        });
        test('mixed types of configuration variables', async () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo',
                    lineNumbers: 123,
                    insertSpaces: false
                },
                terminal: {
                    integrated: {
                        fontFamily: 'bar'
                    }
                },
                json: {
                    schemas: [
                        {
                            fileMatch: [
                                '/myfile',
                                '/myOtherfile'
                            ],
                            url: 'schemaURL'
                        }
                    ]
                }
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            assert.strictEqual(await service.resolveAsync(workspace, 'abc ${config:editor.fontFamily} ${config:editor.lineNumbers} ${config:editor.insertSpaces} xyz'), 'abc foo 123 false xyz');
        });
        test('uses original variable as fallback', async () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {}
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            assert.strictEqual(await service.resolveAsync(workspace, 'abc ${unknownVariable} xyz'), 'abc ${unknownVariable} xyz');
            assert.strictEqual(await service.resolveAsync(workspace, 'abc ${env:unknownVariable} xyz'), 'abc  xyz');
        });
        test('configuration variables with invalid accessor', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fontFamily: 'foo'
                }
            });
            const service = new TestConfigurationResolverService(nullContext, Promise.resolve(envVariables), disposables.add(new TestEditorServiceWithActiveEditor()), configurationService, mockCommandService, new workbenchTestServices_2.TestContextService(), quickInputService, labelService, pathService, extensionService);
            assert.rejects(async () => await service.resolveAsync(workspace, 'abc ${env} xyz'));
            assert.rejects(async () => await service.resolveAsync(workspace, 'abc ${env:} xyz'));
            assert.rejects(async () => await service.resolveAsync(workspace, 'abc ${config} xyz'));
            assert.rejects(async () => await service.resolveAsync(workspace, 'abc ${config:} xyz'));
            assert.rejects(async () => await service.resolveAsync(workspace, 'abc ${config:editor} xyz'));
            assert.rejects(async () => await service.resolveAsync(workspace, 'abc ${config:editor..fontFamily} xyz'));
            assert.rejects(async () => await service.resolveAsync(workspace, 'abc ${config:editor.none.none2} xyz'));
        });
        test('a single command variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:command1}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration).then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'command1-result',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.strictEqual(1, mockCommandService.callCount);
            });
        });
        test('an old style command variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:commandVariable1}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            const commandVariables = Object.create(null);
            commandVariables['commandVariable1'] = 'command1';
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration, undefined, commandVariables).then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'command1-result',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.strictEqual(1, mockCommandService.callCount);
            });
        });
        test('multiple new and old-style command variables', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:commandVariable1}',
                'pid': '${command:command2}',
                'sourceMaps': false,
                'outDir': 'src/${command:command2}',
                'env': {
                    'processId': '__${command:command2}__',
                }
            };
            const commandVariables = Object.create(null);
            commandVariables['commandVariable1'] = 'command1';
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration, undefined, commandVariables).then(result => {
                const expected = {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'command1-result',
                    'pid': 'command2-result',
                    'sourceMaps': false,
                    'outDir': 'src/command2-result',
                    'env': {
                        'processId': '__command2-result__',
                    }
                };
                assert.deepStrictEqual(Object.keys(result), Object.keys(expected));
                Object.keys(result).forEach(property => {
                    const expectedProperty = expected[property];
                    if ((0, types_1.isObject)(result[property])) {
                        assert.deepStrictEqual({ ...result[property] }, expectedProperty);
                    }
                    else {
                        assert.deepStrictEqual(result[property], expectedProperty);
                    }
                });
                assert.strictEqual(2, mockCommandService.callCount);
            });
        });
        test('a command variable that relies on resolved env vars', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${command:commandVariable1}',
                'value': '${env:key1}'
            };
            const commandVariables = Object.create(null);
            commandVariables['commandVariable1'] = 'command1';
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration, undefined, commandVariables).then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'Value for key1',
                    'value': 'Value for key1'
                });
                assert.strictEqual(1, mockCommandService.callCount);
            });
        });
        test('a single prompt input variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${input:input1}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'resolvedEnterinput1',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.strictEqual(0, mockCommandService.callCount);
            });
        });
        test('a single pick input variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${input:input2}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'selectedPick',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.strictEqual(0, mockCommandService.callCount);
            });
        });
        test('a single command input variable', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${input:input4}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'arg for command',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.strictEqual(1, mockCommandService.callCount);
            });
        });
        test('several input variables and command', () => {
            const configuration = {
                'name': '${input:input3}',
                'type': '${command:command1}',
                'request': '${input:input1}',
                'processId': '${input:input2}',
                'command': '${input:input4}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration, 'tasks').then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'resolvedEnterinput3',
                    'type': 'command1-result',
                    'request': 'resolvedEnterinput1',
                    'processId': 'selectedPick',
                    'command': 'arg for command',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.strictEqual(2, mockCommandService.callCount);
            });
        });
        test('input variable with undefined workspace folder', () => {
            const configuration = {
                'name': 'Attach to Process',
                'type': 'node',
                'request': 'attach',
                'processId': '${input:input1}',
                'port': 5858,
                'sourceMaps': false,
                'outDir': null
            };
            return configurationResolverService.resolveWithInteractionReplace(undefined, configuration, 'tasks').then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': 'Attach to Process',
                    'type': 'node',
                    'request': 'attach',
                    'processId': 'resolvedEnterinput1',
                    'port': 5858,
                    'sourceMaps': false,
                    'outDir': null
                });
                assert.strictEqual(0, mockCommandService.callCount);
            });
        });
        test('contributed variable', () => {
            const buildTask = 'npm: compile';
            const variable = 'defaultBuildTask';
            const configuration = {
                'name': '${' + variable + '}',
            };
            configurationResolverService.contributeVariable(variable, async () => { return buildTask; });
            return configurationResolverService.resolveWithInteractionReplace(workspace, configuration).then(result => {
                assert.deepStrictEqual({ ...result }, {
                    'name': `${buildTask}`
                });
            });
        });
        test('resolveWithEnvironment', async () => {
            const env = {
                'VAR_1': 'VAL_1',
                'VAR_2': 'VAL_2'
            };
            const configuration = 'echo ${env:VAR_1}${env:VAR_2}';
            const resolvedResult = await configurationResolverService.resolveWithEnvironment({ ...env }, undefined, configuration);
            assert.deepStrictEqual(resolvedResult, 'echo VAL_1VAL_2');
        });
    });
    class MockCommandService {
        constructor() {
            this.callCount = 0;
            this.onWillExecuteCommand = () => lifecycle_1.Disposable.None;
            this.onDidExecuteCommand = () => lifecycle_1.Disposable.None;
        }
        executeCommand(commandId, ...args) {
            this.callCount++;
            let result = `${commandId}-result`;
            if (args.length >= 1) {
                if (args[0] && args[0].value) {
                    result = args[0].value;
                }
            }
            return Promise.resolve(result);
        }
    }
    class MockLabelService {
        constructor() {
            this.onDidChangeFormatters = new event_1.Emitter().event;
        }
        getUriLabel(resource, options) {
            return (0, path_1.normalize)(resource.fsPath);
        }
        getUriBasenameLabel(resource) {
            throw new Error('Method not implemented.');
        }
        getWorkspaceLabel(workspace, options) {
            throw new Error('Method not implemented.');
        }
        getHostLabel(scheme, authority) {
            throw new Error('Method not implemented.');
        }
        getHostTooltip() {
            throw new Error('Method not implemented.');
        }
        getSeparator(scheme, authority) {
            throw new Error('Method not implemented.');
        }
        registerFormatter(formatter) {
            throw new Error('Method not implemented.');
        }
        registerCachedFormatter(formatter) {
            throw new Error('Method not implemented.');
        }
    }
    class MockPathService {
        constructor() {
            this.defaultUriScheme = network_1.Schemas.file;
        }
        get path() {
            throw new Error('Property not implemented');
        }
        fileURI(path) {
            throw new Error('Method not implemented.');
        }
        userHome(options) {
            const uri = uri_1.URI.file('c:\\users\\username');
            return options?.preferLocal ? uri : Promise.resolve(uri);
        }
        hasValidBasename(resource, arg2, name) {
            throw new Error('Method not implemented.');
        }
    }
    class MockInputsConfigurationService extends testConfigurationService_1.TestConfigurationService {
        getValue(arg1, arg2) {
            let configuration;
            if (arg1 === 'tasks') {
                configuration = {
                    inputs: [
                        {
                            id: 'input1',
                            type: 'promptString',
                            description: 'Enterinput1',
                            default: 'default input1'
                        },
                        {
                            id: 'input2',
                            type: 'pickString',
                            description: 'Enterinput1',
                            default: 'option2',
                            options: ['option1', 'option2', 'option3']
                        },
                        {
                            id: 'input3',
                            type: 'promptString',
                            description: 'Enterinput3',
                            default: 'default input3',
                            password: true
                        },
                        {
                            id: 'input4',
                            type: 'command',
                            command: 'command1',
                            args: {
                                value: 'arg for command'
                            }
                        }
                    ]
                };
            }
            return configuration;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblJlc29sdmVyU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvblJlc29sdmVyL3Rlc3QvZWxlY3Ryb24tc2FuZGJveC9jb25maWd1cmF0aW9uUmVzb2x2ZXJTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUE0QmhHLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUMxQixNQUFNLGlDQUFrQyxTQUFRLHlDQUFpQjtRQUNoRSxJQUFhLHVCQUF1QjtZQUNuQyxPQUFPO2dCQUNOLGFBQWE7b0JBQ1osT0FBTyx5QkFBVSxDQUFDLFdBQVcsQ0FBQztnQkFDL0IsQ0FBQztnQkFDRCxZQUFZO29CQUNYLE9BQU8sSUFBSSxxQkFBUyxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFhLFlBQVk7WUFDeEIsT0FBTztnQkFDTixJQUFJLFFBQVE7b0JBQ1gsT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7Z0JBQzNELENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBRUQsTUFBTSxnQ0FBaUMsU0FBUSxtRUFBZ0M7S0FFOUU7SUFFRCxNQUFNLFdBQVcsR0FBRztRQUNuQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztRQUMzQixXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUztLQUM1QixDQUFDO0lBRUYsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUM1QyxJQUFJLDRCQUFrRSxDQUFDO1FBQ3ZFLE1BQU0sWUFBWSxHQUE4QixFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuRywyREFBMkQ7UUFDM0QsSUFBSSxrQkFBc0MsQ0FBQztRQUMzQyxJQUFJLGFBQWdELENBQUM7UUFDckQsSUFBSSxtQkFBOEIsQ0FBQztRQUNuQyxJQUFJLFNBQTJCLENBQUM7UUFDaEMsSUFBSSxpQkFBd0MsQ0FBQztRQUM3QyxJQUFJLFlBQThCLENBQUM7UUFDbkMsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksZ0JBQW1DLENBQUM7UUFFeEMsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTlELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixrQkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7WUFDOUMsYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxpQ0FBaUMsRUFBRSxDQUFDLENBQUM7WUFDekUsaUJBQWlCLEdBQUcsSUFBSSw2Q0FBcUIsRUFBRSxDQUFDO1lBQ2hELDBFQUEwRTtZQUMxRSxZQUFZLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3RDLFdBQVcsR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3BDLGdCQUFnQixHQUFHLElBQUksNENBQW9CLEVBQUUsQ0FBQztZQUM5QyxtQkFBbUIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7WUFDbkYsU0FBUyxHQUFHLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyw0QkFBNEIsR0FBRyxJQUFJLGdDQUFnQyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLDhCQUE4QixFQUFFLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSwwQ0FBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN2UyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYiw0QkFBNEIsR0FBRyxJQUFJLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakMsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLEVBQUUscUNBQXFDLENBQUMsQ0FBQztZQUN0SixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsNEJBQTRCLENBQUMsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDO1lBQ3BKLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRCxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsOENBQThDLENBQUMsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDO1lBQ3hLLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSw4Q0FBOEMsQ0FBQyxFQUFFLG1DQUFtQyxDQUFDLENBQUM7WUFDdEssQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdDQUF3QyxFQUFFLEdBQUcsRUFBRTtZQUNuRCxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDRDQUE0QyxDQUFDLENBQUMsQ0FBQztRQUN2SSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrREFBa0QsRUFBRSxHQUFHLEVBQUU7WUFDN0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7UUFDdkgsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0RBQStELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEYsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDhDQUE4QyxDQUFDLEVBQUUscUNBQXFDLENBQUMsQ0FBQztZQUN4SyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsOENBQThDLENBQUMsRUFBRSxtQ0FBbUMsQ0FBQyxDQUFDO1lBQ3RLLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1RUFBdUUsRUFBRSxHQUFHLEVBQUU7WUFDbEYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDLENBQUM7UUFDdkksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsb0NBQW9DLENBQUMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1FBQ3BKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLHVCQUF1QixDQUFDLEVBQUUsT0FBTyxjQUFjLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGVBQWUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSx5QkFBeUIsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzVILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDJDQUEyQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDOUksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUseUNBQXlDLENBQUMsQ0FBQyxDQUFDO1FBQ3BJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtDQUErQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hFLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSx5QkFBeUIsQ0FBQyxFQUFFLDJDQUEyQyxDQUFDLENBQUM7WUFDekosQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLHlCQUF5QixDQUFDLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztZQUN0SixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsMkNBQTJDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUM5SSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvRUFBb0UsRUFBRSxHQUFHLEVBQUU7WUFDL0UsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDLENBQUM7UUFDcEksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEMsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsMkRBQTJELENBQUMsQ0FBQztZQUN6TCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUseUNBQXlDLENBQUMsRUFBRSx1REFBdUQsQ0FBQyxDQUFDO1lBQ3JMLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5QyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsd0NBQXdDLENBQUMsRUFBRSxvREFBb0QsQ0FBQyxDQUFDO1lBQ2pMLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSx3Q0FBd0MsQ0FBQyxFQUFFLGtEQUFrRCxDQUFDLENBQUM7WUFDL0ssQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9DLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sNEJBQTZCLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxtRUFBbUUsQ0FBQyxFQUFFLDJGQUEyRixDQUFDLENBQUM7WUFDblAsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLG1FQUFtRSxDQUFDLEVBQUUsdUZBQXVGLENBQUMsQ0FBQztZQUMvTyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsb0NBQW9DLENBQUMsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO1FBQ2hLLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hDLE1BQU0sWUFBWSxHQUFHLElBQUEsWUFBSSxFQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzVELFlBQVksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLGlCQUFpQixFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQTJCLENBQUMsQ0FBQyxDQUFDO1lBRTFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDJDQUEyQyxDQUFDLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3SixDQUFDLENBQUMsQ0FBQztRQUVILHVEQUF1RDtRQUN2RCxzQkFBc0I7UUFDdEIsbURBQW1EO1FBQ25ELHFEQUFxRDtRQUNyRCxNQUFNO1FBQ04sNkZBQTZGO1FBQzdGLDREQUE0RDtRQUM1RCwrQ0FBK0M7UUFDL0MsT0FBTztRQUNQLE1BQU07UUFHTixJQUFJLENBQUMsNkRBQTZELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUUsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSw0QkFBNkIsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztZQUNqSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLDRCQUE2QixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ25JLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN4RCxNQUFNLG9CQUFvQixHQUEwQixJQUFJLG1EQUF3QixDQUFDO2dCQUNoRixNQUFNLEVBQUU7b0JBQ1AsVUFBVSxFQUFFLEtBQUs7aUJBQ2pCO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxVQUFVLEVBQUU7d0JBQ1gsVUFBVSxFQUFFLEtBQUs7cUJBQ2pCO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWlDLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLElBQUksMENBQWtCLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDL1IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLHFDQUFxQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDakgsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUVBQW1FLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDcEYsTUFBTSxvQkFBb0IsR0FBMEIsSUFBSSxtREFBd0IsQ0FBQztnQkFDaEYsTUFBTSxFQUFFO29CQUNQLFVBQVUsRUFBRSxLQUFLO2lCQUNqQjthQUNELENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFHLElBQUksZ0NBQWdDLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlDQUFpQyxFQUFFLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLDBDQUFrQixFQUFFLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQy9SLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxxQ0FBcUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2pILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsQ0FBQztnQkFDekQsTUFBTSxFQUFFO29CQUNQLFVBQVUsRUFBRSxLQUFLO2lCQUNqQjtnQkFDRCxRQUFRLEVBQUU7b0JBQ1QsVUFBVSxFQUFFO3dCQUNYLFVBQVUsRUFBRSxLQUFLO3FCQUNqQjtpQkFDRDthQUNELENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFHLElBQUksZ0NBQWdDLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlDQUFpQyxFQUFFLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLDBDQUFrQixFQUFFLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQy9SLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSw4RUFBOEUsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDOUosQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMERBQTBELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0UsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixDQUFDO2dCQUN6RCxNQUFNLEVBQUU7b0JBQ1AsVUFBVSxFQUFFLEtBQUs7aUJBQ2pCO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxVQUFVLEVBQUU7d0JBQ1gsVUFBVSxFQUFFLEtBQUs7cUJBQ2pCO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWlDLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLElBQUksMENBQWtCLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDL1IsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxvRUFBb0UsQ0FBQyxFQUFFLHdEQUF3RCxDQUFDLENBQUM7WUFDM0wsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxvRUFBb0UsQ0FBQyxFQUFFLHNEQUFzRCxDQUFDLENBQUM7WUFDekwsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJEQUEyRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsQ0FBQztnQkFDekQsTUFBTSxFQUFFO29CQUNQLFVBQVUsRUFBRSxLQUFLO2lCQUNqQjtnQkFDRCxRQUFRLEVBQUU7b0JBQ1QsVUFBVSxFQUFFO3dCQUNYLFVBQVUsRUFBRSxLQUFLO3FCQUNqQjtpQkFDRDthQUNELENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFHLElBQUksZ0NBQWdDLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlDQUFpQyxFQUFFLENBQUMsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLDBDQUFrQixFQUFFLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQy9SLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN4QixNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsd0lBQXdJLENBQUMsRUFBRSxtR0FBbUcsQ0FBQyxDQUFDO1lBQzFTLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsd0lBQXdJLENBQUMsRUFBRSwrRkFBK0YsQ0FBQyxDQUFDO1lBQ3RTLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN6RCxNQUFNLG9CQUFvQixHQUFHLElBQUksbURBQXdCLENBQUM7Z0JBQ3pELE1BQU0sRUFBRTtvQkFDUCxVQUFVLEVBQUUsS0FBSztvQkFDakIsV0FBVyxFQUFFLEdBQUc7b0JBQ2hCLFlBQVksRUFBRSxLQUFLO2lCQUNuQjtnQkFDRCxRQUFRLEVBQUU7b0JBQ1QsVUFBVSxFQUFFO3dCQUNYLFVBQVUsRUFBRSxLQUFLO3FCQUNqQjtpQkFDRDtnQkFDRCxJQUFJLEVBQUU7b0JBQ0wsT0FBTyxFQUFFO3dCQUNSOzRCQUNDLFNBQVMsRUFBRTtnQ0FDVixTQUFTO2dDQUNULGNBQWM7NkJBQ2Q7NEJBQ0QsR0FBRyxFQUFFLFdBQVc7eUJBQ2hCO3FCQUNEO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWlDLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLElBQUksMENBQWtCLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDL1IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLGdHQUFnRyxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUN0TCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyRCxNQUFNLG9CQUFvQixHQUFHLElBQUksbURBQXdCLENBQUM7Z0JBQ3pELE1BQU0sRUFBRSxFQUFFO2FBQ1YsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWlDLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLElBQUksMENBQWtCLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDL1IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztZQUN0SCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsZ0NBQWdDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN6RyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7WUFDMUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixDQUFDO2dCQUN6RCxNQUFNLEVBQUU7b0JBQ1AsVUFBVSxFQUFFLEtBQUs7aUJBQ2pCO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWlDLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLElBQUksMENBQWtCLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFL1IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUNyRixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLDBCQUEwQixDQUFDLENBQUMsQ0FBQztZQUM5RixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDLENBQUM7WUFDMUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUscUNBQXFDLENBQUMsQ0FBQyxDQUFDO1FBQzFHLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUV0QyxNQUFNLGFBQWEsR0FBRztnQkFDckIsTUFBTSxFQUFFLG1CQUFtQjtnQkFDM0IsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLFdBQVcsRUFBRSxxQkFBcUI7Z0JBQ2xDLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFlBQVksRUFBRSxLQUFLO2dCQUNuQixRQUFRLEVBQUUsSUFBSTthQUNkLENBQUM7WUFFRixPQUFPLDRCQUE2QixDQUFDLDZCQUE2QixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQzFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxFQUFFO29CQUNyQyxNQUFNLEVBQUUsbUJBQW1CO29CQUMzQixNQUFNLEVBQUUsTUFBTTtvQkFDZCxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsV0FBVyxFQUFFLGlCQUFpQjtvQkFDOUIsTUFBTSxFQUFFLElBQUk7b0JBQ1osWUFBWSxFQUFFLEtBQUs7b0JBQ25CLFFBQVEsRUFBRSxJQUFJO2lCQUNkLENBQUMsQ0FBQztnQkFFSCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUMxQyxNQUFNLGFBQWEsR0FBRztnQkFDckIsTUFBTSxFQUFFLG1CQUFtQjtnQkFDM0IsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLFdBQVcsRUFBRSw2QkFBNkI7Z0JBQzFDLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFlBQVksRUFBRSxLQUFLO2dCQUNuQixRQUFRLEVBQUUsSUFBSTthQUNkLENBQUM7WUFDRixNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxVQUFVLENBQUM7WUFFbEQsT0FBTyw0QkFBNkIsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdkksTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUU7b0JBQ3JDLE1BQU0sRUFBRSxtQkFBbUI7b0JBQzNCLE1BQU0sRUFBRSxNQUFNO29CQUNkLFNBQVMsRUFBRSxRQUFRO29CQUNuQixXQUFXLEVBQUUsaUJBQWlCO29CQUM5QixNQUFNLEVBQUUsSUFBSTtvQkFDWixZQUFZLEVBQUUsS0FBSztvQkFDbkIsUUFBUSxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBRXpELE1BQU0sYUFBYSxHQUFHO2dCQUNyQixNQUFNLEVBQUUsbUJBQW1CO2dCQUMzQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxTQUFTLEVBQUUsUUFBUTtnQkFDbkIsV0FBVyxFQUFFLDZCQUE2QjtnQkFDMUMsS0FBSyxFQUFFLHFCQUFxQjtnQkFDNUIsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFFBQVEsRUFBRSx5QkFBeUI7Z0JBQ25DLEtBQUssRUFBRTtvQkFDTixXQUFXLEVBQUUseUJBQXlCO2lCQUN0QzthQUNELENBQUM7WUFDRixNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxVQUFVLENBQUM7WUFFbEQsT0FBTyw0QkFBNkIsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDdkksTUFBTSxRQUFRLEdBQUc7b0JBQ2hCLE1BQU0sRUFBRSxtQkFBbUI7b0JBQzNCLE1BQU0sRUFBRSxNQUFNO29CQUNkLFNBQVMsRUFBRSxRQUFRO29CQUNuQixXQUFXLEVBQUUsaUJBQWlCO29CQUM5QixLQUFLLEVBQUUsaUJBQWlCO29CQUN4QixZQUFZLEVBQUUsS0FBSztvQkFDbkIsUUFBUSxFQUFFLHFCQUFxQjtvQkFDL0IsS0FBSyxFQUFFO3dCQUNOLFdBQVcsRUFBRSxxQkFBcUI7cUJBQ2xDO2lCQUNELENBQUM7Z0JBRUYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ3RDLE1BQU0sZ0JBQWdCLEdBQVMsUUFBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNuRCxJQUFJLElBQUEsZ0JBQVEsRUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNoQyxNQUFNLENBQUMsZUFBZSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO29CQUNuRSxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDNUQsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFEQUFxRCxFQUFFLEdBQUcsRUFBRTtZQUVoRSxNQUFNLGFBQWEsR0FBRztnQkFDckIsTUFBTSxFQUFFLG1CQUFtQjtnQkFDM0IsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLFdBQVcsRUFBRSw2QkFBNkI7Z0JBQzFDLE9BQU8sRUFBRSxhQUFhO2FBQ3RCLENBQUM7WUFDRixNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsR0FBRyxVQUFVLENBQUM7WUFFbEQsT0FBTyw0QkFBNkIsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFFdkksTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUU7b0JBQ3JDLE1BQU0sRUFBRSxtQkFBbUI7b0JBQzNCLE1BQU0sRUFBRSxNQUFNO29CQUNkLFNBQVMsRUFBRSxRQUFRO29CQUNuQixXQUFXLEVBQUUsZ0JBQWdCO29CQUM3QixPQUFPLEVBQUUsZ0JBQWdCO2lCQUN6QixDQUFDLENBQUM7Z0JBRUgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7WUFFM0MsTUFBTSxhQUFhLEdBQUc7Z0JBQ3JCLE1BQU0sRUFBRSxtQkFBbUI7Z0JBQzNCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFNBQVMsRUFBRSxRQUFRO2dCQUNuQixXQUFXLEVBQUUsaUJBQWlCO2dCQUM5QixNQUFNLEVBQUUsSUFBSTtnQkFDWixZQUFZLEVBQUUsS0FBSztnQkFDbkIsUUFBUSxFQUFFLElBQUk7YUFDZCxDQUFDO1lBRUYsT0FBTyw0QkFBNkIsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFFbkgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUU7b0JBQ3JDLE1BQU0sRUFBRSxtQkFBbUI7b0JBQzNCLE1BQU0sRUFBRSxNQUFNO29CQUNkLFNBQVMsRUFBRSxRQUFRO29CQUNuQixXQUFXLEVBQUUscUJBQXFCO29CQUNsQyxNQUFNLEVBQUUsSUFBSTtvQkFDWixZQUFZLEVBQUUsS0FBSztvQkFDbkIsUUFBUSxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBRXpDLE1BQU0sYUFBYSxHQUFHO2dCQUNyQixNQUFNLEVBQUUsbUJBQW1CO2dCQUMzQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxTQUFTLEVBQUUsUUFBUTtnQkFDbkIsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsTUFBTSxFQUFFLElBQUk7Z0JBQ1osWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFFBQVEsRUFBRSxJQUFJO2FBQ2QsQ0FBQztZQUVGLE9BQU8sNEJBQTZCLENBQUMsNkJBQTZCLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBRW5ILE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxFQUFFO29CQUNyQyxNQUFNLEVBQUUsbUJBQW1CO29CQUMzQixNQUFNLEVBQUUsTUFBTTtvQkFDZCxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsV0FBVyxFQUFFLGNBQWM7b0JBQzNCLE1BQU0sRUFBRSxJQUFJO29CQUNaLFlBQVksRUFBRSxLQUFLO29CQUNuQixRQUFRLEVBQUUsSUFBSTtpQkFDZCxDQUFDLENBQUM7Z0JBRUgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7WUFFNUMsTUFBTSxhQUFhLEdBQUc7Z0JBQ3JCLE1BQU0sRUFBRSxtQkFBbUI7Z0JBQzNCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFNBQVMsRUFBRSxRQUFRO2dCQUNuQixXQUFXLEVBQUUsaUJBQWlCO2dCQUM5QixNQUFNLEVBQUUsSUFBSTtnQkFDWixZQUFZLEVBQUUsS0FBSztnQkFDbkIsUUFBUSxFQUFFLElBQUk7YUFDZCxDQUFDO1lBRUYsT0FBTyw0QkFBNkIsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFFbkgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUU7b0JBQ3JDLE1BQU0sRUFBRSxtQkFBbUI7b0JBQzNCLE1BQU0sRUFBRSxNQUFNO29CQUNkLFNBQVMsRUFBRSxRQUFRO29CQUNuQixXQUFXLEVBQUUsaUJBQWlCO29CQUM5QixNQUFNLEVBQUUsSUFBSTtvQkFDWixZQUFZLEVBQUUsS0FBSztvQkFDbkIsUUFBUSxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBRWhELE1BQU0sYUFBYSxHQUFHO2dCQUNyQixNQUFNLEVBQUUsaUJBQWlCO2dCQUN6QixNQUFNLEVBQUUscUJBQXFCO2dCQUM3QixTQUFTLEVBQUUsaUJBQWlCO2dCQUM1QixXQUFXLEVBQUUsaUJBQWlCO2dCQUM5QixTQUFTLEVBQUUsaUJBQWlCO2dCQUM1QixNQUFNLEVBQUUsSUFBSTtnQkFDWixZQUFZLEVBQUUsS0FBSztnQkFDbkIsUUFBUSxFQUFFLElBQUk7YUFDZCxDQUFDO1lBRUYsT0FBTyw0QkFBNkIsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFFbkgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLEVBQUU7b0JBQ3JDLE1BQU0sRUFBRSxxQkFBcUI7b0JBQzdCLE1BQU0sRUFBRSxpQkFBaUI7b0JBQ3pCLFNBQVMsRUFBRSxxQkFBcUI7b0JBQ2hDLFdBQVcsRUFBRSxjQUFjO29CQUMzQixTQUFTLEVBQUUsaUJBQWlCO29CQUM1QixNQUFNLEVBQUUsSUFBSTtvQkFDWixZQUFZLEVBQUUsS0FBSztvQkFDbkIsUUFBUSxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1lBRTNELE1BQU0sYUFBYSxHQUFHO2dCQUNyQixNQUFNLEVBQUUsbUJBQW1CO2dCQUMzQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxTQUFTLEVBQUUsUUFBUTtnQkFDbkIsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsTUFBTSxFQUFFLElBQUk7Z0JBQ1osWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFFBQVEsRUFBRSxJQUFJO2FBQ2QsQ0FBQztZQUVGLE9BQU8sNEJBQTZCLENBQUMsNkJBQTZCLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBRW5ILE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxFQUFFO29CQUNyQyxNQUFNLEVBQUUsbUJBQW1CO29CQUMzQixNQUFNLEVBQUUsTUFBTTtvQkFDZCxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsV0FBVyxFQUFFLHFCQUFxQjtvQkFDbEMsTUFBTSxFQUFFLElBQUk7b0JBQ1osWUFBWSxFQUFFLEtBQUs7b0JBQ25CLFFBQVEsRUFBRSxJQUFJO2lCQUNkLENBQUMsQ0FBQztnQkFFSCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtZQUNqQyxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUM7WUFDakMsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUM7WUFDcEMsTUFBTSxhQUFhLEdBQUc7Z0JBQ3JCLE1BQU0sRUFBRSxJQUFJLEdBQUcsUUFBUSxHQUFHLEdBQUc7YUFDN0IsQ0FBQztZQUNGLDRCQUE2QixDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLLElBQUksRUFBRSxHQUFHLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUYsT0FBTyw0QkFBNkIsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUMxRyxNQUFNLENBQUMsZUFBZSxDQUFDLEVBQUUsR0FBRyxNQUFNLEVBQUUsRUFBRTtvQkFDckMsTUFBTSxFQUFFLEdBQUcsU0FBUyxFQUFFO2lCQUN0QixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pDLE1BQU0sR0FBRyxHQUFHO2dCQUNYLE9BQU8sRUFBRSxPQUFPO2dCQUNoQixPQUFPLEVBQUUsT0FBTzthQUNoQixDQUFDO1lBQ0YsTUFBTSxhQUFhLEdBQUcsK0JBQStCLENBQUM7WUFDdEQsTUFBTSxjQUFjLEdBQUcsTUFBTSw0QkFBNkIsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3hILE1BQU0sQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUdILE1BQU0sa0JBQWtCO1FBQXhCO1lBR1EsY0FBUyxHQUFHLENBQUMsQ0FBQztZQUVyQix5QkFBb0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxzQkFBVSxDQUFDLElBQUksQ0FBQztZQUM3Qyx3QkFBbUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxzQkFBVSxDQUFDLElBQUksQ0FBQztRQWE3QyxDQUFDO1FBWk8sY0FBYyxDQUFDLFNBQWlCLEVBQUUsR0FBRyxJQUFXO1lBQ3RELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUVqQixJQUFJLE1BQU0sR0FBRyxHQUFHLFNBQVMsU0FBUyxDQUFDO1lBQ25DLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM5QixNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEMsQ0FBQztLQUNEO0lBRUQsTUFBTSxnQkFBZ0I7UUFBdEI7WUEwQkMsMEJBQXFCLEdBQWlDLElBQUksZUFBTyxFQUF5QixDQUFDLEtBQUssQ0FBQztRQUNsRyxDQUFDO1FBekJBLFdBQVcsQ0FBQyxRQUFhLEVBQUUsT0FBNEU7WUFDdEcsT0FBTyxJQUFBLGdCQUFTLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCxtQkFBbUIsQ0FBQyxRQUFhO1lBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsaUJBQWlCLENBQUMsU0FBa0QsRUFBRSxPQUFnQztZQUNyRyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELFlBQVksQ0FBQyxNQUFjLEVBQUUsU0FBa0I7WUFDOUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDTSxjQUFjO1lBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsWUFBWSxDQUFDLE1BQWMsRUFBRSxTQUFrQjtZQUM5QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELGlCQUFpQixDQUFDLFNBQWlDO1lBQ2xELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsdUJBQXVCLENBQUMsU0FBaUM7WUFDeEQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FFRDtJQUVELE1BQU0sZUFBZTtRQUFyQjtZQUtDLHFCQUFnQixHQUFXLGlCQUFPLENBQUMsSUFBSSxDQUFDO1FBZ0J6QyxDQUFDO1FBbkJBLElBQUksSUFBSTtZQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsT0FBTyxDQUFDLElBQVk7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFHRCxRQUFRLENBQUMsT0FBa0M7WUFDMUMsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQzVDLE9BQU8sT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFHRCxnQkFBZ0IsQ0FBQyxRQUFhLEVBQUUsSUFBd0MsRUFBRSxJQUFhO1lBQ3RGLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO0tBRUQ7SUFFRCxNQUFNLDhCQUErQixTQUFRLG1EQUF3QjtRQUNwRCxRQUFRLENBQUMsSUFBVSxFQUFFLElBQVU7WUFDOUMsSUFBSSxhQUFhLENBQUM7WUFDbEIsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3RCLGFBQWEsR0FBRztvQkFDZixNQUFNLEVBQUU7d0JBQ1A7NEJBQ0MsRUFBRSxFQUFFLFFBQVE7NEJBQ1osSUFBSSxFQUFFLGNBQWM7NEJBQ3BCLFdBQVcsRUFBRSxhQUFhOzRCQUMxQixPQUFPLEVBQUUsZ0JBQWdCO3lCQUN6Qjt3QkFDRDs0QkFDQyxFQUFFLEVBQUUsUUFBUTs0QkFDWixJQUFJLEVBQUUsWUFBWTs0QkFDbEIsV0FBVyxFQUFFLGFBQWE7NEJBQzFCLE9BQU8sRUFBRSxTQUFTOzRCQUNsQixPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQzt5QkFDMUM7d0JBQ0Q7NEJBQ0MsRUFBRSxFQUFFLFFBQVE7NEJBQ1osSUFBSSxFQUFFLGNBQWM7NEJBQ3BCLFdBQVcsRUFBRSxhQUFhOzRCQUMxQixPQUFPLEVBQUUsZ0JBQWdCOzRCQUN6QixRQUFRLEVBQUUsSUFBSTt5QkFDZDt3QkFDRDs0QkFDQyxFQUFFLEVBQUUsUUFBUTs0QkFDWixJQUFJLEVBQUUsU0FBUzs0QkFDZixPQUFPLEVBQUUsVUFBVTs0QkFDbkIsSUFBSSxFQUFFO2dDQUNMLEtBQUssRUFBRSxpQkFBaUI7NkJBQ3hCO3lCQUNEO3FCQUNEO2lCQUNELENBQUM7WUFDSCxDQUFDO1lBQ0QsT0FBTyxhQUFhLENBQUM7UUFDdEIsQ0FBQztLQUNEIn0=