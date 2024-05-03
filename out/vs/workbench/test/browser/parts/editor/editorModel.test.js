/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/languages/language", "vs/editor/common/services/languageService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelService", "vs/editor/common/model/textModel", "vs/editor/common/services/textResourceConfiguration", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/test/common/testNotificationService", "vs/platform/notification/common/notification", "vs/workbench/test/common/workbenchTestServices", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/common/editor/editorModel", "vs/base/common/mime", "vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl", "vs/workbench/services/environment/common/environmentService", "vs/workbench/test/browser/workbenchTestServices", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/workbench/services/editor/common/editorService", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, instantiationServiceMock_1, textEditorModel_1, language_1, languageService_1, configuration_1, testConfigurationService_1, modelService_1, textModel_1, textResourceConfiguration_1, undoRedo_1, undoRedoService_1, testDialogService_1, dialogs_1, testNotificationService_1, notification_1, workbenchTestServices_1, themeService_1, testThemeService_1, editorModel_1, mime_1, languageDetectionWorkerServiceImpl_1, environmentService_1, workbenchTestServices_2, testLanguageConfigurationService_1, languageConfigurationRegistry_1, testAccessibilityService_1, editorService_1, storage_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorModel', () => {
        class MyEditorModel extends editorModel_1.EditorModel {
        }
        class MyTextEditorModel extends textEditorModel_1.BaseTextEditorModel {
            testCreateTextEditorModel(value, resource, preferredLanguageId) {
                return super.createTextEditorModel(value, resource, preferredLanguageId);
            }
            isReadonly() {
                return false;
            }
        }
        function stubModelService(instantiationService) {
            const dialogService = new testDialogService_1.TestDialogService();
            const notificationService = new testNotificationService_1.TestNotificationService();
            const undoRedoService = new undoRedoService_1.UndoRedoService(dialogService, notificationService);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, workbenchTestServices_2.TestEnvironmentService);
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(textResourceConfiguration_1.ITextResourcePropertiesService, new workbenchTestServices_1.TestTextResourcePropertiesService(instantiationService.get(configuration_1.IConfigurationService)));
            instantiationService.stub(dialogs_1.IDialogService, dialogService);
            instantiationService.stub(notification_1.INotificationService, notificationService);
            instantiationService.stub(undoRedo_1.IUndoRedoService, undoRedoService);
            instantiationService.stub(editorService_1.IEditorService, disposables.add(new workbenchTestServices_2.TestEditorService()));
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            instantiationService.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            instantiationService.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_1.TestStorageService()));
            return disposables.add(instantiationService.createInstance(modelService_1.ModelService));
        }
        let instantiationService;
        let languageService;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService());
            languageService = instantiationService.stub(language_1.ILanguageService, languageService_1.LanguageService);
        });
        teardown(() => {
            disposables.clear();
        });
        test('basics', async () => {
            let counter = 0;
            const model = disposables.add(new MyEditorModel());
            disposables.add(model.onWillDispose(() => {
                assert(true);
                counter++;
            }));
            await model.resolve();
            assert.strictEqual(model.isDisposed(), false);
            assert.strictEqual(model.isResolved(), true);
            model.dispose();
            assert.strictEqual(counter, 1);
            assert.strictEqual(model.isDisposed(), true);
        });
        test('BaseTextEditorModel', async () => {
            const modelService = stubModelService(instantiationService);
            const model = disposables.add(new MyTextEditorModel(modelService, languageService, disposables.add(instantiationService.createInstance(languageDetectionWorkerServiceImpl_1.LanguageDetectionService)), instantiationService.createInstance(testAccessibilityService_1.TestAccessibilityService)));
            await model.resolve();
            disposables.add(model.testCreateTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'), null, mime_1.Mimes.text));
            assert.strictEqual(model.isResolved(), true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yTW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yTW9kZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFDaEcsS0FBSyxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFFekIsTUFBTSxhQUFjLFNBQVEseUJBQVc7U0FBSTtRQUMzQyxNQUFNLGlCQUFrQixTQUFRLHFDQUFtQjtZQUNsRCx5QkFBeUIsQ0FBQyxLQUF5QixFQUFFLFFBQWMsRUFBRSxtQkFBNEI7Z0JBQ2hHLE9BQU8sS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUMxRSxDQUFDO1lBRVEsVUFBVTtnQkFDbEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1NBQ0Q7UUFFRCxTQUFTLGdCQUFnQixDQUFDLG9CQUE4QztZQUN2RSxNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFpQixFQUFFLENBQUM7WUFDOUMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLGlEQUF1QixFQUFFLENBQUM7WUFDMUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxpQ0FBZSxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2hGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpREFBNEIsRUFBRSw4Q0FBc0IsQ0FBQyxDQUFDO1lBQ2hGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztZQUNqRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMERBQThCLEVBQUUsSUFBSSx5REFBaUMsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FB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