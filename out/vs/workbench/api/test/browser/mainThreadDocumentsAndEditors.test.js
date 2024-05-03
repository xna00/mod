/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadDocumentsAndEditors", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelService", "vs/editor/test/browser/editorTestServices", "vs/editor/test/browser/testCodeEditor", "vs/base/test/common/mock", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/event", "vs/platform/instantiation/common/serviceCollection", "vs/editor/browser/services/codeEditorService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentityService", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/common/model/textModel", "vs/editor/common/services/languageService", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, mainThreadDocumentsAndEditors_1, testRPCProtocol_1, testConfigurationService_1, modelService_1, editorTestServices_1, testCodeEditor_1, mock_1, workbenchTestServices_1, event_1, serviceCollection_1, codeEditorService_1, testThemeService_1, undoRedoService_1, testDialogService_1, testNotificationService_1, workbenchTestServices_2, uriIdentityService_1, testLanguageConfigurationService_1, textModel_1, languageService_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadDocumentsAndEditors', () => {
        let disposables;
        let modelService;
        let codeEditorService;
        let textFileService;
        const deltas = [];
        function myCreateTestCodeEditor(model) {
            return (0, testCodeEditor_1.createTestCodeEditor)(model, {
                hasTextFocus: false,
                serviceCollection: new serviceCollection_1.ServiceCollection([codeEditorService_1.ICodeEditorService, codeEditorService])
            });
        }
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            deltas.length = 0;
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('editor', { 'detectIndentation': false });
            const dialogService = new testDialogService_1.TestDialogService();
            const notificationService = new testNotificationService_1.TestNotificationService();
            const undoRedoService = new undoRedoService_1.UndoRedoService(dialogService, notificationService);
            const themeService = new testThemeService_1.TestThemeService();
            modelService = new modelService_1.ModelService(configService, new workbenchTestServices_2.TestTextResourcePropertiesService(configService), undoRedoService, disposables.add(new languageService_1.LanguageService()), new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            codeEditorService = new editorTestServices_1.TestCodeEditorService(themeService);
            textFileService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.files = {
                        onDidSave: event_1.Event.None,
                        onDidRevert: event_1.Event.None,
                        onDidChangeDirty: event_1.Event.None
                    };
                }
                isDirty() { return false; }
            };
            const workbenchEditorService = disposables.add(new workbenchTestServices_1.TestEditorService());
            const editorGroupService = new workbenchTestServices_1.TestEditorGroupsService();
            const fileService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidRunOperation = event_1.Event.None;
                    this.onDidChangeFileSystemProviderCapabilities = event_1.Event.None;
                    this.onDidChangeFileSystemProviderRegistrations = event_1.Event.None;
                }
            };
            new mainThreadDocumentsAndEditors_1.MainThreadDocumentsAndEditors((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
                $acceptDocumentsAndEditorsDelta(delta) { deltas.push(delta); }
            }), modelService, textFileService, workbenchEditorService, codeEditorService, fileService, null, editorGroupService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidPaneCompositeOpen = event_1.Event.None;
                    this.onDidPaneCompositeClose = event_1.Event.None;
                }
                getActivePaneComposite() {
                    return undefined;
                }
            }, workbenchTestServices_1.TestEnvironmentService, new workbenchTestServices_2.TestWorkingCopyFileService(), new uriIdentityService_1.UriIdentityService(fileService), new class extends (0, mock_1.mock)() {
                readText() {
                    return Promise.resolve('clipboard_contents');
                }
            }, new workbenchTestServices_1.TestPathService(), new testConfigurationService_1.TestConfigurationService());
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Model#add', () => {
            deltas.length = 0;
            disposables.add(modelService.createModel('farboo', null));
            assert.strictEqual(deltas.length, 1);
            const [delta] = deltas;
            assert.strictEqual(delta.addedDocuments.length, 1);
            assert.strictEqual(delta.removedDocuments, undefined);
            assert.strictEqual(delta.addedEditors, undefined);
            assert.strictEqual(delta.removedEditors, undefined);
            assert.strictEqual(delta.newActiveEditor, undefined);
        });
        test('ignore huge model', function () {
            const oldLimit = textModel_1.TextModel._MODEL_SYNC_LIMIT;
            try {
                const largeModelString = 'abc'.repeat(1024);
                textModel_1.TextModel._MODEL_SYNC_LIMIT = largeModelString.length / 2;
                const model = modelService.createModel(largeModelString, null);
                disposables.add(model);
                assert.ok(model.isTooLargeForSyncing());
                assert.strictEqual(deltas.length, 1);
                const [delta] = deltas;
                assert.strictEqual(delta.newActiveEditor, null);
                assert.strictEqual(delta.addedDocuments, undefined);
                assert.strictEqual(delta.removedDocuments, undefined);
                assert.strictEqual(delta.addedEditors, undefined);
                assert.strictEqual(delta.removedEditors, undefined);
            }
            finally {
                textModel_1.TextModel._MODEL_SYNC_LIMIT = oldLimit;
            }
        });
        test('ignore huge model from editor', function () {
            const oldLimit = textModel_1.TextModel._MODEL_SYNC_LIMIT;
            try {
                const largeModelString = 'abc'.repeat(1024);
                textModel_1.TextModel._MODEL_SYNC_LIMIT = largeModelString.length / 2;
                const model = modelService.createModel(largeModelString, null);
                const editor = myCreateTestCodeEditor(model);
                assert.strictEqual(deltas.length, 1);
                deltas.length = 0;
                assert.strictEqual(deltas.length, 0);
                editor.dispose();
                model.dispose();
            }
            finally {
                textModel_1.TextModel._MODEL_SYNC_LIMIT = oldLimit;
            }
        });
        test('ignore simple widget model', function () {
            this.timeout(1000 * 60); // increase timeout for this one test
            const model = modelService.createModel('test', null, undefined, true);
            disposables.add(model);
            assert.ok(model.isForSimpleWidget);
            assert.strictEqual(deltas.length, 1);
            const [delta] = deltas;
            assert.strictEqual(delta.newActiveEditor, null);
            assert.strictEqual(delta.addedDocuments, undefined);
            assert.strictEqual(delta.removedDocuments, undefined);
            assert.strictEqual(delta.addedEditors, undefined);
            assert.strictEqual(delta.removedEditors, undefined);
        });
        test('ignore editor w/o model', () => {
            const editor = myCreateTestCodeEditor(undefined);
            assert.strictEqual(deltas.length, 1);
            const [delta] = deltas;
            assert.strictEqual(delta.newActiveEditor, null);
            assert.strictEqual(delta.addedDocuments, undefined);
            assert.strictEqual(delta.removedDocuments, undefined);
            assert.strictEqual(delta.addedEditors, undefined);
            assert.strictEqual(delta.removedEditors, undefined);
            editor.dispose();
        });
        test('editor with model', () => {
            deltas.length = 0;
            const model = modelService.createModel('farboo', null);
            const editor = myCreateTestCodeEditor(model);
            assert.strictEqual(deltas.length, 2);
            const [first, second] = deltas;
            assert.strictEqual(first.addedDocuments.length, 1);
            assert.strictEqual(first.newActiveEditor, undefined);
            assert.strictEqual(first.removedDocuments, undefined);
            assert.strictEqual(first.addedEditors, undefined);
            assert.strictEqual(first.removedEditors, undefined);
            assert.strictEqual(second.addedEditors.length, 1);
            assert.strictEqual(second.addedDocuments, undefined);
            assert.strictEqual(second.removedDocuments, undefined);
            assert.strictEqual(second.removedEditors, undefined);
            assert.strictEqual(second.newActiveEditor, undefined);
            editor.dispose();
            model.dispose();
        });
        test('editor with dispos-ed/-ing model', () => {
            const model = modelService.createModel('farboo', null);
            const editor = myCreateTestCodeEditor(model);
            // ignore things until now
            deltas.length = 0;
            modelService.destroyModel(model.uri);
            assert.strictEqual(deltas.length, 1);
            const [first] = deltas;
            assert.strictEqual(first.newActiveEditor, undefined);
            assert.strictEqual(first.removedEditors.length, 1);
            assert.strictEqual(first.removedDocuments.length, 1);
            assert.strictEqual(first.addedDocuments, undefined);
            assert.strictEqual(first.addedEditors, undefined);
            editor.dispose();
            model.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERvY3VtZW50c0FuZEVkaXRvcnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvbWFpblRocmVhZERvY3VtZW50c0FuZEVkaXRvcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdDaEcsS0FBSyxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUUzQyxJQUFJLFdBQTRCLENBQUM7UUFFakMsSUFBSSxZQUEwQixDQUFDO1FBQy9CLElBQUksaUJBQXdDLENBQUM7UUFDN0MsSUFBSSxlQUFpQyxDQUFDO1FBQ3RDLE1BQU0sTUFBTSxHQUFnQyxFQUFFLENBQUM7UUFFL0MsU0FBUyxzQkFBc0IsQ0FBQyxLQUE2QjtZQUM1RCxPQUFPLElBQUEscUNBQW9CLEVBQUMsS0FBSyxFQUFFO2dCQUNsQyxZQUFZLEVBQUUsS0FBSztnQkFDbkIsaUJBQWlCLEVBQUUsSUFBSSxxQ0FBaUIsQ0FDdkMsQ0FBQyxzQ0FBa0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUN2QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXBDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sYUFBYSxHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUNyRCxhQUFhLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM3RSxNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFpQixFQUFFLENBQUM7WUFDOUMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLGlEQUF1QixFQUFFLENB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