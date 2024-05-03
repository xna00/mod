/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/services/search/test/browser/queryBuilder.test", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/base/common/uri", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/base/common/network", "vs/workbench/test/browser/workbenchTestServices", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert_1, platform_1, terminalInstance_1, workspace_1, testWorkspace_1, instantiationServiceMock_1, workbenchTestServices_1, queryBuilder_test_1, testConfigurationService_1, terminalConfigHelper_1, uri_1, terminalCapabilityStore_1, network_1, workbenchTestServices_2, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const root1 = '/foo/root1';
    const ROOT_1 = (0, queryBuilder_test_1.fixPath)(root1);
    const root2 = '/foo/root2';
    const ROOT_2 = (0, queryBuilder_test_1.fixPath)(root2);
    const emptyRoot = '/foo';
    const ROOT_EMPTY = (0, queryBuilder_test_1.fixPath)(emptyRoot);
    suite('Workbench - TerminalInstance', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('parseExitResult', () => {
            test('should return no message for exit code = undefined', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(undefined, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: undefined, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(undefined, {}, 5 /* ProcessState.KilledByUser */, undefined), { code: undefined, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(undefined, {}, 6 /* ProcessState.KilledByProcess */, undefined), { code: undefined, message: undefined });
            });
            test('should return no message for exit code = 0', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(0, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 0, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(0, {}, 5 /* ProcessState.KilledByUser */, undefined), { code: 0, message: undefined });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(0, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 0, message: undefined });
            });
            test('should return friendly message when executable is specified for non-zero exit codes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo' }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1, message: 'The terminal process "foo" failed to launch (exit code: 1).' });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo' }, 5 /* ProcessState.KilledByUser */, undefined), { code: 1, message: 'The terminal process "foo" terminated with exit code: 1.' });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo' }, 6 /* ProcessState.KilledByProcess */, undefined), { code: 1, message: 'The terminal process "foo" terminated with exit code: 1.' });
            });
            test('should return friendly message when executable and args are specified for non-zero exit codes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo', args: ['bar', 'baz'] }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1, message: `The terminal process "foo 'bar', 'baz'" failed to launch (exit code: 1).` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo', args: ['bar', 'baz'] }, 5 /* ProcessState.KilledByUser */, undefined), { code: 1, message: `The terminal process "foo 'bar', 'baz'" terminated with exit code: 1.` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, { executable: 'foo', args: ['bar', 'baz'] }, 6 /* ProcessState.KilledByProcess */, undefined), { code: 1, message: `The terminal process "foo 'bar', 'baz'" terminated with exit code: 1.` });
            });
            test('should return friendly message when executable and arguments are omitted for non-zero exit codes', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1, message: `The terminal process failed to launch (exit code: 1).` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, {}, 5 /* ProcessState.KilledByUser */, undefined), { code: 1, message: `The terminal process terminated with exit code: 1.` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)(1, {}, 6 /* ProcessState.KilledByProcess */, undefined), { code: 1, message: `The terminal process terminated with exit code: 1.` });
            });
            test('should ignore pty host-related errors', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ message: 'Could not find pty with id 16' }, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: undefined, message: undefined });
            });
            test('should format conpty failure code 5', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 5, message: 'A native exception occurred during launch (Cannot create process, error code: 5)' }, { executable: 'foo' }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 5, message: `The terminal process failed to launch: Access was denied to the path containing your executable "foo". Manage and change your permissions to get this to work.` });
            });
            test('should format conpty failure code 267', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 267, message: 'A native exception occurred during launch (Cannot create process, error code: 267)' }, {}, 4 /* ProcessState.KilledDuringLaunch */, '/foo'), { code: 267, message: `The terminal process failed to launch: Invalid starting directory "/foo", review your terminal.integrated.cwd setting.` });
            });
            test('should format conpty failure code 1260', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 1260, message: 'A native exception occurred during launch (Cannot create process, error code: 1260)' }, { executable: 'foo' }, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 1260, message: `The terminal process failed to launch: Windows cannot open this program because it has been prevented by a software restriction policy. For more information, open Event Viewer or contact your system Administrator.` });
            });
            test('should format generic failures', () => {
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 123, message: 'A native exception occurred during launch (Cannot create process, error code: 123)' }, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 123, message: `The terminal process failed to launch: A native exception occurred during launch (Cannot create process, error code: 123).` });
                (0, assert_1.deepStrictEqual)((0, terminalInstance_1.parseExitResult)({ code: 123, message: 'foo' }, {}, 4 /* ProcessState.KilledDuringLaunch */, undefined), { code: 123, message: `The terminal process failed to launch: foo.` });
            });
        });
        suite('TerminalLabelComputer', () => {
            let store;
            let configurationService;
            let terminalLabelComputer;
            let instantiationService;
            let mockContextService;
            let mockMultiRootContextService;
            let emptyContextService;
            let mockWorkspace;
            let mockMultiRootWorkspace;
            let emptyWorkspace;
            let capabilities;
            let configHelper;
            function createInstance(partial) {
                const capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
                if (!platform_1.isWindows) {
                    capabilities.add(1 /* TerminalCapability.NaiveCwdDetection */, null);
                }
                return {
                    shellLaunchConfig: {},
                    cwd: 'cwd',
                    initialCwd: undefined,
                    processName: '',
                    sequence: undefined,
                    workspaceFolder: undefined,
                    staticTitle: undefined,
                    capabilities,
                    title: '',
                    description: '',
                    userHome: undefined,
                    ...partial
                };
            }
            setup(async () => {
                store = new lifecycle_1.DisposableStore();
                instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
                instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
                capabilities = store.add(new terminalCapabilityStore_1.TerminalCapabilityStore());
                if (!platform_1.isWindows) {
                    capabilities.add(1 /* TerminalCapability.NaiveCwdDetection */, null);
                }
                const ROOT_1_URI = (0, queryBuilder_test_1.getUri)(ROOT_1);
                mockContextService = new workbenchTestServices_1.TestContextService();
                mockWorkspace = new testWorkspace_1.Workspace('workspace', [(0, workspace_1.toWorkspaceFolder)(ROOT_1_URI)]);
                mockContextService.setWorkspace(mockWorkspace);
                const ROOT_2_URI = (0, queryBuilder_test_1.getUri)(ROOT_2);
                mockMultiRootContextService = new workbenchTestServices_1.TestContextService();
                mockMultiRootWorkspace = new testWorkspace_1.Workspace('multi-root-workspace', [(0, workspace_1.toWorkspaceFolder)(ROOT_1_URI), (0, workspace_1.toWorkspaceFolder)(ROOT_2_URI)]);
                mockMultiRootContextService.setWorkspace(mockMultiRootWorkspace);
                const ROOT_EMPTY_URI = (0, queryBuilder_test_1.getUri)(ROOT_EMPTY);
                emptyContextService = new workbenchTestServices_1.TestContextService();
                emptyWorkspace = new testWorkspace_1.Workspace('empty workspace', [], ROOT_EMPTY_URI);
                emptyContextService.setWorkspace(emptyWorkspace);
            });
            teardown(() => store.dispose());
            test('should resolve to "" when the template variables are empty', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' - ', title: '', description: '' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: '' }));
                // TODO:
                // terminalLabelComputer.onLabelChanged(e => {
                // 	strictEqual(e.title, '');
                // 	strictEqual(e.description, '');
                // });
                (0, assert_1.strictEqual)(terminalLabelComputer.title, '');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
            });
            test('should resolve cwd', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' - ', title: '${cwd}', description: '${cwd}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, cwd: ROOT_1 }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, ROOT_1);
                (0, assert_1.strictEqual)(terminalLabelComputer.description, ROOT_1);
            });
            test('should resolve workspaceFolder', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' - ', title: '${workspaceFolder}', description: '${workspaceFolder}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'folder' }) } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'folder');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'folder');
            });
            test('should resolve local', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' - ', title: '${local}', description: '${local}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', shellLaunchConfig: { type: 'Local' } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'Local');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'Local');
            });
            test('should resolve process', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' - ', title: '${process}', description: '${process}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh' }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'zsh');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'zsh');
            });
            test('should resolve sequence', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' - ', title: '${sequence}', description: '${sequence}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, sequence: 'sequence' }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'sequence');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'sequence');
            });
            test('should resolve task', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${task}', description: '${task}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', shellLaunchConfig: { type: 'Task' } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'zsh ~ Task');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'Task');
            });
            test('should resolve separator', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${separator}', description: '${separator}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'zsh', shellLaunchConfig: { type: 'Task' } }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'zsh');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
            });
            test('should always return static title when specified', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}', description: '${workspaceFolder}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: 'folder' }) }, staticTitle: 'my-title' }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'my-title');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, 'folder');
            });
            test('should provide cwdFolder for all cwds only when in multi-root', () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${cwdFolder}', description: '${cwdFolder}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_1 }));
                // single-root, cwd is same as root
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
                // multi-root
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${cwdFolder}', description: '${cwdFolder}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockMultiRootContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_2 }));
                if (platform_1.isWindows) {
                    (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process');
                    (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
                }
                else {
                    (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process ~ root2');
                    (0, assert_1.strictEqual)(terminalLabelComputer.description, 'root2');
                }
            });
            test('should hide cwdFolder in single folder workspaces when cwd matches the workspace\'s default cwd even when slashes differ', async () => {
                configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { tabs: { separator: ' ~ ', title: '${process}${separator}${cwdFolder}', description: '${cwdFolder}' } } } });
                configHelper = store.add(new terminalConfigHelper_1.TerminalConfigHelper(configurationService, null, null, null, null));
                terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_1 }));
                (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process');
                (0, assert_1.strictEqual)(terminalLabelComputer.description, '');
                if (!platform_1.isWindows) {
                    terminalLabelComputer = store.add(new terminalInstance_1.TerminalLabelComputer(configHelper, new workbenchTestServices_2.TestFileService(), mockContextService));
                    terminalLabelComputer.refreshLabel(createInstance({ capabilities, processName: 'process', workspaceFolder: { uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: ROOT_1 }) }, cwd: ROOT_2 }));
                    (0, assert_1.strictEqual)(terminalLabelComputer.title, 'process ~ root2');
                    (0, assert_1.strictEqual)(terminalLabelComputer.description, 'root2');
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJbnN0YW5jZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC90ZXN0L2Jyb3dzZXIvdGVybWluYWxJbnN0YW5jZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUM7SUFDM0IsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQztJQUMzQixNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFPLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLE1BQU0sVUFBVSxHQUFHLElBQUEsMkJBQU8sRUFBQyxTQUFTLENBQUMsQ0FBQztJQUV0QyxLQUFLLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1FBQzFDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLElBQUksQ0FBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7Z0JBQy9ELElBQUEsd0JBQWUsRUFDZCxJQUFBLGtDQUFlLEVBQUMsU0FBUyxFQUFFLEVBQUUsMkNBQW1DLFNBQVMsQ0FBQyxFQUMxRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUN2QyxDQUFDO2dCQUNGLElBQUEsd0JBQWUsRUFDZCxJQUFBLGtDQUFlLEVBQUMsU0FBUyxFQUFFLEVBQUUscUNBQTZCLFNBQVMsQ0FBQyxFQUNwRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUN2QyxDQUFDO2dC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