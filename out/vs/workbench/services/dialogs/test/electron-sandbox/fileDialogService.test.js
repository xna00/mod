/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "sinon", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/browser/services/codeEditorService", "vs/editor/common/languages/language", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/opener/common/opener", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/dialogs/electron-sandbox/fileDialogService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/host/browser/host", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workspaces/browser/workspaceEditingService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, sinon, network_1, uri_1, mock_1, utils_1, codeEditorService_1, language_1, commands_1, configuration_1, testConfigurationService_1, dialogs_1, files_1, instantiation_1, label_1, log_1, native_1, opener_1, workspace_1, workspaces_1, fileDialogService_1, editorService_1, environmentService_1, history_1, host_1, pathService_1, workspaceEditingService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TestFileDialogService = class TestFileDialogService extends fileDialogService_1.FileDialogService {
        constructor(simple, hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, nativeHostService, dialogService, languageService, workspacesService, labelService, pathService, commandService, editorService, codeEditorService, logService) {
            super(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, nativeHostService, dialogService, languageService, workspacesService, labelService, pathService, commandService, editorService, codeEditorService, logService);
            this.simple = simple;
        }
        getSimpleFileDialog() {
            if (this.simple) {
                return this.simple;
            }
            else {
                return super.getSimpleFileDialog();
            }
        }
    };
    TestFileDialogService = __decorate([
        __param(1, host_1.IHostService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, history_1.IHistoryService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, files_1.IFileService),
        __param(8, opener_1.IOpenerService),
        __param(9, native_1.INativeHostService),
        __param(10, dialogs_1.IDialogService),
        __param(11, language_1.ILanguageService),
        __param(12, workspaces_1.IWorkspacesService),
        __param(13, label_1.ILabelService),
        __param(14, pathService_1.IPathService),
        __param(15, commands_1.ICommandService),
        __param(16, editorService_1.IEditorService),
        __param(17, codeEditorService_1.ICodeEditorService),
        __param(18, log_1.ILogService)
    ], TestFileDialogService);
    suite('FileDialogService', function () {
        let instantiationService;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const testFile = uri_1.URI.file('/test/file');
        setup(async function () {
            disposables.add(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables));
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('files', { simpleDialog: { enable: true } });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
        });
        test('Local - open/save workspaces availableFilesystems', async function () {
            class TestSimpleFileDialog {
                async showOpenDialog(options) {
                    assert.strictEqual(options.availableFileSystems?.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
                async showSaveDialog(options) {
                    assert.strictEqual(options.availableFileSystems?.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
            }
            const dialogService = instantiationService.createInstance(TestFileDialogService, new TestSimpleFileDialog());
            instantiationService.set(dialogs_1.IFileDialogService, dialogService);
            const workspaceService = instantiationService.createInstance(workspaceEditingService_1.BrowserWorkspaceEditingService);
            assert.strictEqual((await workspaceService.pickNewWorkspacePath())?.path.startsWith(testFile.path), true);
            assert.strictEqual(await dialogService.pickWorkspaceAndOpen({}), undefined);
        });
        test('Virtual - open/save workspaces availableFilesystems', async function () {
            class TestSimpleFileDialog {
                async showOpenDialog(options) {
                    assert.strictEqual(options.availableFileSystems?.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
                async showSaveDialog(options) {
                    assert.strictEqual(options.availableFileSystems?.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
            }
            instantiationService.stub(pathService_1.IPathService, new class {
                constructor() {
                    this.defaultUriScheme = 'vscode-virtual-test';
                    this.userHome = async () => uri_1.URI.file('/user/home');
                }
            });
            const dialogService = instantiationService.createInstance(TestFileDialogService, new TestSimpleFileDialog());
            instantiationService.set(dialogs_1.IFileDialogService, dialogService);
            const workspaceService = instantiationService.createInstance(workspaceEditingService_1.BrowserWorkspaceEditingService);
            assert.strictEqual((await workspaceService.pickNewWorkspacePath())?.path.startsWith(testFile.path), true);
            assert.strictEqual(await dialogService.pickWorkspaceAndOpen({}), undefined);
        });
        test('Remote - open/save workspaces availableFilesystems', async function () {
            class TestSimpleFileDialog {
                async showOpenDialog(options) {
                    assert.strictEqual(options.availableFileSystems?.length, 2);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.vscodeRemote);
                    assert.strictEqual(options.availableFileSystems[1], network_1.Schemas.file);
                    return testFile;
                }
                async showSaveDialog(options) {
                    assert.strictEqual(options.availableFileSystems?.length, 2);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.vscodeRemote);
                    assert.strictEqual(options.availableFileSystems[1], network_1.Schemas.file);
                    return testFile;
                }
            }
            instantiationService.set(environmentService_1.IWorkbenchEnvironmentService, new class extends (0, mock_1.mock)() {
                get remoteAuthority() {
                    return 'testRemote';
                }
            });
            instantiationService.stub(pathService_1.IPathService, new class {
                constructor() {
                    this.defaultUriScheme = network_1.Schemas.vscodeRemote;
                    this.userHome = async () => uri_1.URI.file('/user/home');
                }
            });
            const dialogService = instantiationService.createInstance(TestFileDialogService, new TestSimpleFileDialog());
            instantiationService.set(dialogs_1.IFileDialogService, dialogService);
            const workspaceService = instantiationService.createInstance(workspaceEditingService_1.BrowserWorkspaceEditingService);
            assert.strictEqual((await workspaceService.pickNewWorkspacePath())?.path.startsWith(testFile.path), true);
            assert.strictEqual(await dialogService.pickWorkspaceAndOpen({}), undefined);
        });
        test('Remote - filters default files/folders to RA (#195938)', async function () {
            class TestSimpleFileDialog {
                async showOpenDialog() {
                    return testFile;
                }
                async showSaveDialog() {
                    return testFile;
                }
            }
            instantiationService.set(environmentService_1.IWorkbenchEnvironmentService, new class extends (0, mock_1.mock)() {
                get remoteAuthority() {
                    return 'testRemote';
                }
            });
            instantiationService.stub(pathService_1.IPathService, new class {
                constructor() {
                    this.defaultUriScheme = network_1.Schemas.vscodeRemote;
                    this.userHome = async () => uri_1.URI.file('/user/home');
                }
            });
            const dialogService = instantiationService.createInstance(TestFileDialogService, new TestSimpleFileDialog());
            const historyService = instantiationService.get(history_1.IHistoryService);
            const getLastActiveWorkspaceRoot = sinon.spy(historyService, 'getLastActiveWorkspaceRoot');
            const getLastActiveFile = sinon.spy(historyService, 'getLastActiveFile');
            await dialogService.defaultFilePath();
            assert.deepStrictEqual(getLastActiveFile.args, [[network_1.Schemas.vscodeRemote, 'testRemote']]);
            assert.deepStrictEqual(getLastActiveWorkspaceRoot.args, [[network_1.Schemas.vscodeRemote, 'testRemote']]);
            await dialogService.defaultFolderPath();
            assert.deepStrictEqual(getLastActiveWorkspaceRoot.args[1], [network_1.Schemas.vscodeRemote, 'testRemote']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZURpYWxvZ1NlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2RpYWxvZ3MvdGVzdC9lbGVjdHJvbi1zYW5kYm94L2ZpbGVEaWFsb2dTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFtQ2hHLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEscUNBQWlCO1FBQ3BELFlBQ1MsTUFBeUIsRUFDbkIsV0FBeUIsRUFDYixjQUF3QyxFQUNqRCxjQUErQixFQUNsQixrQkFBZ0QsRUFDdkQsb0JBQTJDLEVBQzNDLG9CQUEyQyxFQUNwRCxXQUF5QixFQUN2QixhQUE2QixFQUN6QixpQkFBcUMsRUFDekMsYUFBNkIsRUFDM0IsZUFBaUMsRUFDL0IsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQzVCLFdBQXlCLEVBQ3RCLGNBQStCLEVBQ2hDLGFBQTZCLEVBQ3pCLGlCQUFxQyxFQUM1QyxVQUF1QjtZQUVwQyxLQUFLLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsV0FBVyxFQUM3SCxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFyQnZLLFdBQU0sR0FBTixNQUFNLENBQW1CO1FBc0JsQyxDQUFDO1FBRWtCLG1CQUFtQjtZQUNyQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3BCLENBQUM7aUJBQU0s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