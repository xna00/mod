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
define(["require", "exports", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editor", "vs/base/common/event", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/textmodelResolver/common/textModelResolverService", "vs/editor/common/services/resolverService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/platform/workspace/common/workspace", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/serviceCollection", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/editor/common/services/languageService", "vs/editor/common/services/modelService", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/languages/language", "vs/workbench/services/history/common/history", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/environment/common/environment", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/common/core/position", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/editor/common/core/range", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/services/extensions/common/extensions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/decorations/common/decorations", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/workbench/browser/editor", "vs/platform/log/common/log", "vs/platform/label/common/label", "vs/base/common/async", "vs/platform/storage/common/storage", "vs/base/common/platform", "vs/workbench/services/label/common/labelService", "vs/base/common/buffer", "vs/base/common/network", "vs/platform/product/common/product", "vs/workbench/services/host/browser/host", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/textfile/browser/browserTextFileService", "vs/workbench/services/environment/common/environmentService", "vs/editor/common/model/textModel", "vs/workbench/services/path/common/pathService", "vs/platform/progress/common/progress", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/editor/editorPane", "vs/base/common/cancellation", "vs/platform/instantiation/common/descriptors", "vs/platform/dialogs/test/common/testDialogService", "vs/workbench/services/editor/browser/codeEditorService", "vs/workbench/browser/parts/editor/editorPart", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/quickinput/browser/quickInputService", "vs/platform/list/browser/listService", "vs/base/common/path", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/stream", "vs/workbench/services/textfile/browser/textFileService", "vs/workbench/services/textfile/common/encoding", "vs/platform/theme/common/theme", "vs/base/common/iterator", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/workbench/services/workingCopy/browser/workingCopyBackupService", "vs/platform/files/common/fileService", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/editor/test/browser/testCodeEditor", "vs/workbench/contrib/files/browser/editors/textFileEditor", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/platform/workspaces/common/workspaces", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/types", "vs/workbench/services/editor/browser/editorResolverService", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/files/browser/elevatedFileService", "vs/editor/common/services/editorWorker", "vs/base/common/map", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/textfile/common/textEditorService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/base/common/process", "vs/base/common/extpath", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/workbench/browser/parts/editor/textEditor", "vs/editor/common/core/selection", "vs/editor/test/common/services/testEditorWorkerService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfileService", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/codicons", "vs/platform/remote/common/remoteSocketFactoryService", "vs/workbench/browser/parts/editor/editorParts", "vs/base/browser/window", "vs/platform/markers/common/markers", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/services/editor/common/editorPaneService", "vs/workbench/services/editor/browser/editorPaneService", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextViewService", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, fileEditorInput_1, instantiationServiceMock_1, resources_1, uri_1, telemetry_1, telemetryUtils_1, editorInput_1, editor_1, editor_2, event_1, workingCopyBackup_1, configuration_1, layoutService_1, textModelResolverService_1, resolverService_1, untitledTextEditorService_1, workspace_1, lifecycle_1, serviceCollection_1, files_1, model_1, languageService_1, modelService_1, textfiles_1, language_1, history_1, instantiation_1, testConfigurationService_1, testWorkspace_1, environment_1, themeService_1, testThemeService_1, textResourceConfiguration_1, position_1, actions_1, contextkey_1, mockKeybindingService_1, range_1, dialogs_1, notification_1, testNotificationService_1, extensions_1, keybinding_1, decorations_1, lifecycle_2, editorGroupsService_1, editorService_1, codeEditorService_1, editor_3, log_1, label_1, async_1, storage_1, platform_1, labelService_1, buffer_1, network_1, product_1, host_1, workingCopyService_1, filesConfigurationService_1, accessibility_1, environmentService_1, browserTextFileService_1, environmentService_2, textModel_1, pathService_1, progress_1, workingCopyFileService_1, undoRedoService_1, undoRedo_1, textFileEditorModel_1, platform_2, editorPane_1, cancellation_1, descriptors_1, testDialogService_1, codeEditorService_2, editorPart_1, quickInput_1, quickInputService_1, listService_1, path_1, workbenchTestServices_1, uriIdentity_1, uriIdentityService_1, inMemoryFilesystemProvider_1, stream_1, textFileService_1, encoding_1, theme_1, iterator_1, workingCopyBackupService_1, workingCopyBackupService_2, fileService_1, textResourceEditor_1, testCodeEditor_1, textFileEditor_1, textResourceEditorInput_1, untitledTextEditorInput_1, sideBySideEditor_1, workspaces_1, workspaceTrust_1, terminal_1, types_1, editorResolverService_1, files_2, editorResolverService_2, workingCopyEditorService_1, elevatedFileService_1, elevatedFileService_2, editorWorker_1, map_1, sideBySideEditorInput_1, textEditorService_1, panecomposite_1, languageConfigurationRegistry_1, testLanguageConfigurationService_1, process_1, extpath_1, testAccessibilityService_1, languageFeatureDebounce_1, languageFeatures_1, languageFeaturesService_1, textEditor_1, selection_1, testEditorWorkerService_1, remoteAgentService_1, languageDetectionWorkerService_1, userDataProfile_1, userDataProfileService_1, userDataProfile_2, codicons_1, remoteSocketFactoryService_1, editorParts_1, window_1, markers_1, accessibilitySignalService_1, editorPaneService_1, editorPaneService_2, contextView_1, contextViewService_1, customEditorLabelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWebExtensionsScannerService = exports.TestUserDataProfileService = exports.TestWorkbenchExtensionManagementService = exports.TestWorkbenchExtensionEnablementService = exports.TestRemoteExtensionsScannerService = exports.TestRemoteAgentService = exports.TestQuickInputService = exports.TestTerminalProfileResolverService = exports.TestTerminalProfileService = exports.TestTerminalGroupService = exports.TestTerminalEditorService = exports.TestTerminalInstanceService = exports.TestWorkspacesService = exports.TestPathService = exports.TestListService = exports.TestEditorPart = exports.TestSingletonFileEditorInput = exports.TestFileEditorInput = exports.TestEditorInput = exports.TestReadonlyTextFileEditorModel = exports.TestFilesConfigurationService = exports.TestHostService = exports.productService = exports.TestInMemoryFileSystemProvider = exports.RemoteFileSystemProvider = exports.TestTextResourceConfigurationService = exports.TestWillShutdownEvent = exports.TestBeforeShutdownEvent = exports.TestLifecycleService = exports.InMemoryTestWorkingCopyBackupService = exports.TestWorkingCopyBackupService = exports.TestFileService = exports.TestEditorService = exports.TestEditorGroupAccessor = exports.TestEditorGroupView = exports.TestEditorGroupsService = exports.TestViewsService = exports.TestPanelPart = exports.TestSideBarPart = exports.TestPaneCompositeService = exports.TestLayoutService = exports.TestFileDialogService = exports.TestMenuService = exports.TestDecorationsService = exports.TestProgressService = exports.TestEnvironmentService = exports.TestEncodingOracle = exports.TestBrowserTextFileServiceWithEncodingOverrides = exports.TestTextFileService = exports.TestServiceAccessor = exports.TestWorkingCopyService = exports.TestTextFileEditor = exports.TestTextResourceEditor = void 0;
    exports.createFileEditorInput = createFileEditorInput;
    exports.workbenchInstantiationService = workbenchInstantiationService;
    exports.toUntypedWorkingCopyId = toUntypedWorkingCopyId;
    exports.toTypedWorkingCopyId = toTypedWorkingCopyId;
    exports.registerTestEditor = registerTestEditor;
    exports.registerTestFileEditor = registerTestFileEditor;
    exports.registerTestResourceEditor = registerTestResourceEditor;
    exports.registerTestSideBySideEditor = registerTestSideBySideEditor;
    exports.createEditorPart = createEditorPart;
    exports.getLastResolvedFileStat = getLastResolvedFileStat;
    exports.workbenchTeardown = workbenchTeardown;
    function createFileEditorInput(instantiationService, resource) {
        return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, undefined, undefined, undefined, undefined, undefined, undefined);
    }
    platform_2.Registry.as(editor_1.EditorExtensions.EditorFactory).registerFileEditorFactory({
        typeId: files_2.FILE_EDITOR_INPUT_ID,
        createFileEditor: (resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents, instantiationService) => {
            return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents);
        },
        isFileEditor: (obj) => {
            return obj instanceof fileEditorInput_1.FileEditorInput;
        }
    });
    class TestTextResourceEditor extends textResourceEditor_1.TextResourceEditor {
        createEditorControl(parent, configuration) {
            this.editorControl = this._register(this.instantiationService.createInstance(testCodeEditor_1.TestCodeEditor, parent, configuration, {}));
        }
    }
    exports.TestTextResourceEditor = TestTextResourceEditor;
    class TestTextFileEditor extends textFileEditor_1.TextFileEditor {
        createEditorControl(parent, configuration) {
            this.editorControl = this._register(this.instantiationService.createInstance(testCodeEditor_1.TestCodeEditor, parent, configuration, { contributions: [] }));
        }
        setSelection(selection, reason) {
            this._options = selection ? { selection } : undefined;
            this._onDidChangeSelection.fire({ reason });
        }
        getSelection() {
            const options = this.options;
            if (!options) {
                return undefined;
            }
            const textSelection = options.selection;
            if (!textSelection) {
                return undefined;
            }
            return new textEditor_1.TextEditorPaneSelection(new selection_1.Selection(textSelection.startLineNumber, textSelection.startColumn, textSelection.endLineNumber ?? textSelection.startLineNumber, textSelection.endColumn ?? textSelection.startColumn));
        }
    }
    exports.TestTextFileEditor = TestTextFileEditor;
    class TestWorkingCopyService extends workingCopyService_1.WorkingCopyService {
        testUnregisterWorkingCopy(workingCopy) {
            return super.unregisterWorkingCopy(workingCopy);
        }
    }
    exports.TestWorkingCopyService = TestWorkingCopyService;
    function workbenchInstantiationService(overrides, disposables = new lifecycle_2.DisposableStore()) {
        const instantiationService = disposables.add(new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([lifecycle_1.ILifecycleService, disposables.add(new TestLifecycleService())])));
        instantiationService.stub(editorWorker_1.IEditorWorkerService, new testEditorWorkerService_1.TestEditorWorkerService());
        instantiationService.stub(workingCopyService_1.IWorkingCopyService, disposables.add(new TestWorkingCopyService()));
        const environmentService = overrides?.environmentService ? overrides.environmentService(instantiationService) : exports.TestEnvironmentService;
        instantiationService.stub(environment_1.IEnvironmentService, environmentService);
        instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, environmentService);
        instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        const contextKeyService = overrides?.contextKeyService ? overrides.contextKeyService(instantiationService) : instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService);
        instantiationService.stub(contextkey_1.IContextKeyService, contextKeyService);
        instantiationService.stub(progress_1.IProgressService, new TestProgressService());
        const workspaceContextService = new workbenchTestServices_1.TestContextService(testWorkspace_1.TestWorkspace);
        instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceContextService);
        const configService = overrides?.configurationService ? overrides.configurationService(instantiationService) : new testConfigurationService_1.TestConfigurationService({
            files: {
                participants: {
                    timeout: 60000
                }
            }
        });
        instantiationService.stub(configuration_1.IConfigurationService, configService);
        const textResourceConfigurationService = new TestTextResourceConfigurationService(configService);
        instantiationService.stub(textResourceConfiguration_1.ITextResourceConfigurationService, textResourceConfigurationService);
        instantiationService.stub(untitledTextEditorService_1.IUntitledTextEditorService, disposables.add(instantiationService.createInstance(untitledTextEditorService_1.UntitledTextEditorService)));
        instantiationService.stub(storage_1.IStorageService, disposables.add(new workbenchTestServices_1.TestStorageService()));
        instantiationService.stub(remoteAgentService_1.IRemoteAgentService, new TestRemoteAgentService());
        instantiationService.stub(languageDetectionWorkerService_1.ILanguageDetectionService, new TestLanguageDetectionService());
        instantiationService.stub(pathService_1.IPathService, overrides?.pathService ? overrides.pathService(instantiationService) : new TestPathService());
        const layoutService = new TestLayoutService();
        instantiationService.stub(layoutService_1.IWorkbenchLayoutService, layoutService);
        instantiationService.stub(dialogs_1.IDialogService, new testDialogService_1.TestDialogService());
        const accessibilityService = new testAccessibilityService_1.TestAccessibilityService();
        instantiationService.stub(accessibility_1.IAccessibilityService, accessibilityService);
        instantiationService.stub(accessibilitySignalService_1.IAccessibilitySignalService, {
            playSignal: async () => { },
            isSoundEnabled(signal) { return false; },
        });
        instantiationService.stub(dialogs_1.IFileDialogService, instantiationService.createInstance(TestFileDialogService));
        instantiationService.stub(language_1.ILanguageService, disposables.add(instantiationService.createInstance(languageService_1.LanguageService)));
        instantiationService.stub(languageFeatures_1.ILanguageFeaturesService, new languageFeaturesService_1.LanguageFeaturesService());
        instantiationService.stub(languageFeatureDebounce_1.ILanguageFeatureDebounceService, instantiationService.createInstance(languageFeatureDebounce_1.LanguageFeatureDebounceService));
        instantiationService.stub(history_1.IHistoryService, new workbenchTestServices_1.TestHistoryService());
        instantiationService.stub(textResourceConfiguration_1.ITextResourcePropertiesService, new workbenchTestServices_1.TestTextResourcePropertiesService(configService));
        instantiationService.stub(undoRedo_1.IUndoRedoService, instantiationService.createInstance(undoRedoService_1.UndoRedoService));
        const themeService = new testThemeService_1.TestThemeService();
        instantiationService.stub(themeService_1.IThemeService, themeService);
        instantiationService.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
        instantiationService.stub(model_1.IModelService, disposables.add(instantiationService.createInstance(modelService_1.ModelService)));
        const fileService = overrides?.fileService ? overrides.fileService(instantiationService) : disposables.add(new TestFileService());
        instantiationService.stub(files_1.IFileService, fileService);
        const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
        disposables.add(uriIdentityService);
        const markerService = new workbenchTestServices_1.TestMarkerService();
        instantiationService.stub(markers_1.IMarkerService, markerService);
        instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, disposables.add(new TestFilesConfigurationService(contextKeyService, configService, workspaceContextService, environmentService, uriIdentityService, fileService, markerService, textResourceConfigurationService)));
        instantiationService.stub(uriIdentity_1.IUriIdentityService, disposables.add(uriIdentityService));
        const userDataProfilesService = instantiationService.stub(userDataProfile_1.IUserDataProfilesService, disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, new log_1.NullLogService())));
        instantiationService.stub(userDataProfile_2.IUserDataProfileService, disposables.add(new userDataProfileService_1.UserDataProfileService(userDataProfilesService.defaultProfile)));
        instantiationService.stub(workingCopyBackup_1.IWorkingCopyBackupService, overrides?.workingCopyBackupService ? overrides?.workingCopyBackupService(instantiationService) : disposables.add(new TestWorkingCopyBackupService()));
        instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
        instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
        instantiationService.stub(untitledTextEditorService_1.IUntitledTextEditorService, disposables.add(instantiationService.createInstance(untitledTextEditorService_1.UntitledTextEditorService)));
        instantiationService.stub(actions_1.IMenuService, new TestMenuService());
        const keybindingService = new mockKeybindingService_1.MockKeybindingService();
        instantiationService.stub(keybinding_1.IKeybindingService, keybindingService);
        instantiationService.stub(decorations_1.IDecorationsService, new TestDecorationsService());
        instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
        instantiationService.stub(workingCopyFileService_1.IWorkingCopyFileService, disposables.add(instantiationService.createInstance(workingCopyFileService_1.WorkingCopyFileService)));
        instantiationService.stub(textfiles_1.ITextFileService, overrides?.textFileService ? overrides.textFileService(instantiationService) : disposables.add(instantiationService.createInstance(TestTextFileService)));
        instantiationService.stub(host_1.IHostService, instantiationService.createInstance(TestHostService));
        instantiationService.stub(resolverService_1.ITextModelService, disposables.add(instantiationService.createInstance(textModelResolverService_1.TextModelResolverService)));
        instantiationService.stub(log_1.ILoggerService, disposables.add(new workbenchTestServices_1.TestLoggerService(exports.TestEnvironmentService.logsHome)));
        const editorGroupService = new TestEditorGroupsService([new TestEditorGroupView(0)]);
        instantiationService.stub(editorGroupsService_1.IEditorGroupsService, editorGroupService);
        instantiationService.stub(label_1.ILabelService, disposables.add(instantiationService.createInstance(labelService_1.LabelService)));
        const editorService = overrides?.editorService ? overrides.editorService(instantiationService) : disposables.add(new TestEditorService(editorGroupService));
        instantiationService.stub(editorService_1.IEditorService, editorService);
        instantiationService.stub(editorPaneService_1.IEditorPaneService, new editorPaneService_2.EditorPaneService());
        instantiationService.stub(workingCopyEditorService_1.IWorkingCopyEditorService, disposables.add(instantiationService.createInstance(workingCopyEditorService_1.WorkingCopyEditorService)));
        instantiationService.stub(editorResolverService_2.IEditorResolverService, disposables.add(instantiationService.createInstance(editorResolverService_1.EditorResolverService)));
        const textEditorService = overrides?.textEditorService ? overrides.textEditorService(instantiationService) : disposables.add(instantiationService.createInstance(textEditorService_1.TextEditorService));
        instantiationService.stub(textEditorService_1.ITextEditorService, textEditorService);
        instantiationService.stub(codeEditorService_1.ICodeEditorService, disposables.add(new codeEditorService_2.CodeEditorService(editorService, themeService, configService)));
        instantiationService.stub(panecomposite_1.IPaneCompositePartService, disposables.add(new TestPaneCompositeService()));
        instantiationService.stub(listService_1.IListService, new TestListService());
        instantiationService.stub(contextView_1.IContextViewService, disposables.add(instantiationService.createInstance(contextViewService_1.ContextViewService)));
        instantiationService.stub(quickInput_1.IQuickInputService, disposables.add(new quickInputService_1.QuickInputService(configService, instantiationService, keybindingService, contextKeyService, themeService, layoutService)));
        instantiationService.stub(workspaces_1.IWorkspacesService, new TestWorkspacesService());
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, disposables.add(new workbenchTestServices_1.TestWorkspaceTrustManagementService()));
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, disposables.add(new workbenchTestServices_1.TestWorkspaceTrustRequestService(false)));
        instantiationService.stub(terminal_1.ITerminalInstanceService, new TestTerminalInstanceService());
        instantiationService.stub(elevatedFileService_1.IElevatedFileService, new elevatedFileService_2.BrowserElevatedFileService());
        instantiationService.stub(remoteSocketFactoryService_1.IRemoteSocketFactoryService, new remoteSocketFactoryService_1.RemoteSocketFactoryService());
        instantiationService.stub(customEditorLabelService_1.ICustomEditorLabelService, disposables.add(new customEditorLabelService_1.CustomEditorLabelService(configService, workspaceContextService)));
        return instantiationService;
    }
    let TestServiceAccessor = class TestServiceAccessor {
        constructor(lifecycleService, textFileService, textEditorService, workingCopyFileService, filesConfigurationService, contextService, modelService, fileService, fileDialogService, dialogService, workingCopyService, editorService, editorPaneService, environmentService, pathService, editorGroupService, editorResolverService, languageService, textModelResolverService, untitledTextEditorService, testConfigurationService, workingCopyBackupService, hostService, quickInputService, labelService, logService, uriIdentityService, instantitionService, notificationService, workingCopyEditorService, instantiationService, elevatedFileService, workspaceTrustRequestService, decorationsService) {
            this.lifecycleService = lifecycleService;
            this.textFileService = textFileService;
            this.textEditorService = textEditorService;
            this.workingCopyFileService = workingCopyFileService;
            this.filesConfigurationService = filesConfigurationService;
            this.contextService = contextService;
            this.modelService = modelService;
            this.fileService = fileService;
            this.fileDialogService = fileDialogService;
            this.dialogService = dialogService;
            this.workingCopyService = workingCopyService;
            this.editorService = editorService;
            this.editorPaneService = editorPaneService;
            this.environmentService = environmentService;
            this.pathService = pathService;
            this.editorGroupService = editorGroupService;
            this.editorResolverService = editorResolverService;
            this.languageService = languageService;
            this.textModelResolverService = textModelResolverService;
            this.untitledTextEditorService = untitledTextEditorService;
            this.testConfigurationService = testConfigurationService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.hostService = hostService;
            this.quickInputService = quickInputService;
            this.labelService = labelService;
            this.logService = logService;
            this.uriIdentityService = uriIdentityService;
            this.instantitionService = instantitionService;
            this.notificationService = notificationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.instantiationService = instantiationService;
            this.elevatedFileService = elevatedFileService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.decorationsService = decorationsService;
        }
    };
    exports.TestServiceAccessor = TestServiceAccessor;
    exports.TestServiceAccessor = TestServiceAccessor = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, textEditorService_1.ITextEditorService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, filesConfigurationService_1.IFilesConfigurationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, model_1.IModelService),
        __param(7, files_1.IFileService),
        __param(8, dialogs_1.IFileDialogService),
        __param(9, dialogs_1.IDialogService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, editorService_1.IEditorService),
        __param(12, editorPaneService_1.IEditorPaneService),
        __param(13, environmentService_2.IWorkbenchEnvironmentService),
        __param(14, pathService_1.IPathService),
        __param(15, editorGroupsService_1.IEditorGroupsService),
        __param(16, editorResolverService_2.IEditorResolverService),
        __param(17, language_1.ILanguageService),
        __param(18, resolverService_1.ITextModelService),
        __param(19, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(20, configuration_1.IConfigurationService),
        __param(21, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(22, host_1.IHostService),
        __param(23, quickInput_1.IQuickInputService),
        __param(24, label_1.ILabelService),
        __param(25, log_1.ILogService),
        __param(26, uriIdentity_1.IUriIdentityService),
        __param(27, instantiation_1.IInstantiationService),
        __param(28, notification_1.INotificationService),
        __param(29, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(30, instantiation_1.IInstantiationService),
        __param(31, elevatedFileService_1.IElevatedFileService),
        __param(32, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(33, decorations_1.IDecorationsService)
    ], TestServiceAccessor);
    let TestTextFileService = class TestTextFileService extends browserTextFileService_1.BrowserTextFileService {
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, logService, elevatedFileService, decorationsService) {
            super(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, elevatedFileService, logService, decorationsService);
            this.readStreamError = undefined;
            this.writeError = undefined;
        }
        setReadStreamErrorOnce(error) {
            this.readStreamError = error;
        }
        async readStream(resource, options) {
            if (this.readStreamError) {
                const error = this.readStreamError;
                this.readStreamError = undefined;
                throw error;
            }
            const content = await this.fileService.readFileStream(resource, options);
            return {
                resource: content.resource,
                name: content.name,
                mtime: content.mtime,
                ctime: content.ctime,
                etag: content.etag,
                encoding: 'utf8',
                value: await (0, textModel_1.createTextBufferFactoryFromStream)(content.value),
                size: 10,
                readonly: false,
                locked: false
            };
        }
        setWriteErrorOnce(error) {
            this.writeError = error;
        }
        async write(resource, value, options) {
            if (this.writeError) {
                const error = this.writeError;
                this.writeError = undefined;
                throw error;
            }
            return super.write(resource, value, options);
        }
    };
    exports.TestTextFileService = TestTextFileService;
    exports.TestTextFileService = TestTextFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_2.IWorkbenchEnvironmentService),
        __param(6, dialogs_1.IDialogService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, codeEditorService_1.ICodeEditorService),
        __param(11, pathService_1.IPathService),
        __param(12, workingCopyFileService_1.IWorkingCopyFileService),
        __param(13, uriIdentity_1.IUriIdentityService),
        __param(14, language_1.ILanguageService),
        __param(15, log_1.ILogService),
        __param(16, elevatedFileService_1.IElevatedFileService),
        __param(17, decorations_1.IDecorationsService)
    ], TestTextFileService);
    class TestBrowserTextFileServiceWithEncodingOverrides extends browserTextFileService_1.BrowserTextFileService {
        get encoding() {
            if (!this._testEncoding) {
                this._testEncoding = this._register(this.instantiationService.createInstance(TestEncodingOracle));
            }
            return this._testEncoding;
        }
    }
    exports.TestBrowserTextFileServiceWithEncodingOverrides = TestBrowserTextFileServiceWithEncodingOverrides;
    class TestEncodingOracle extends textFileService_1.EncodingOracle {
        get encodingOverrides() {
            return [
                { extension: 'utf16le', encoding: encoding_1.UTF16le },
                { extension: 'utf16be', encoding: encoding_1.UTF16be },
                { extension: 'utf8bom', encoding: encoding_1.UTF8_with_bom }
            ];
        }
        set encodingOverrides(overrides) { }
    }
    exports.TestEncodingOracle = TestEncodingOracle;
    class TestEnvironmentServiceWithArgs extends environmentService_1.BrowserWorkbenchEnvironmentService {
        constructor() {
            super(...arguments);
            this.args = [];
        }
    }
    exports.TestEnvironmentService = new TestEnvironmentServiceWithArgs('', uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), Object.create(null), workbenchTestServices_1.TestProductService);
    class TestProgressService {
        withProgress(options, task, onDidCancel) {
            return task(progress_1.Progress.None);
        }
    }
    exports.TestProgressService = TestProgressService;
    class TestDecorationsService {
        constructor() {
            this.onDidChangeDecorations = event_1.Event.None;
        }
        registerDecorationsProvider(_provider) { return lifecycle_2.Disposable.None; }
        getDecoration(_uri, _includeChildren, _overwrite) { return undefined; }
    }
    exports.TestDecorationsService = TestDecorationsService;
    class TestMenuService {
        createMenu(_id, _scopedKeybindingService) {
            return {
                onDidChange: event_1.Event.None,
                dispose: () => undefined,
                getActions: () => []
            };
        }
        resetHiddenStates() {
            // nothing
        }
    }
    exports.TestMenuService = TestMenuService;
    let TestFileDialogService = class TestFileDialogService {
        constructor(pathService) {
            this.pathService = pathService;
        }
        async defaultFilePath(_schemeFilter) { return this.pathService.userHome(); }
        async defaultFolderPath(_schemeFilter) { return this.pathService.userHome(); }
        async defaultWorkspacePath(_schemeFilter) { return this.pathService.userHome(); }
        async preferredHome(_schemeFilter) { return this.pathService.userHome(); }
        pickFileFolderAndOpen(_options) { return Promise.resolve(0); }
        pickFileAndOpen(_options) { return Promise.resolve(0); }
        pickFolderAndOpen(_options) { return Promise.resolve(0); }
        pickWorkspaceAndOpen(_options) { return Promise.resolve(0); }
        setPickFileToSave(path) { this.fileToSave = path; }
        pickFileToSave(defaultUri, availableFileSystems) { return Promise.resolve(this.fileToSave); }
        showSaveDialog(_options) { return Promise.resolve(undefined); }
        showOpenDialog(_options) { return Promise.resolve(undefined); }
        setConfirmResult(result) { this.confirmResult = result; }
        showSaveConfirm(fileNamesOrResources) { return Promise.resolve(this.confirmResult); }
    };
    exports.TestFileDialogService = TestFileDialogService;
    exports.TestFileDialogService = TestFileDialogService = __decorate([
        __param(0, pathService_1.IPathService)
    ], TestFileDialogService);
    class TestLayoutService {
        constructor() {
            this.openedDefaultEditors = false;
            this.mainContainerDimension = { width: 800, height: 600 };
            this.activeContainerDimension = { width: 800, height: 600 };
            this.mainContainerOffset = { top: 0, quickPickTop: 0 };
            this.activeContainerOffset = { top: 0, quickPickTop: 0 };
            this.mainContainer = window_1.mainWindow.document.body;
            this.containers = [window_1.mainWindow.document.body];
            this.activeContainer = window_1.mainWindow.document.body;
            this.onDidChangeZenMode = event_1.Event.None;
            this.onDidChangeMainEditorCenteredLayout = event_1.Event.None;
            this.onDidChangeWindowMaximized = event_1.Event.None;
            this.onDidChangePanelPosition = event_1.Event.None;
            this.onDidChangePanelAlignment = event_1.Event.None;
            this.onDidChangePartVisibility = event_1.Event.None;
            this.onDidLayoutMainContainer = event_1.Event.None;
            this.onDidLayoutActiveContainer = event_1.Event.None;
            this.onDidLayoutContainer = event_1.Event.None;
            this.onDidChangeNotificationsVisibility = event_1.Event.None;
            this.onDidAddContainer = event_1.Event.None;
            this.onDidChangeActiveContainer = event_1.Event.None;
            this.whenReady = Promise.resolve(undefined);
            this.whenRestored = Promise.resolve(undefined);
        }
        layout() { }
        isRestored() { return true; }
        hasFocus(_part) { return false; }
        focusPart(_part) { }
        hasMainWindowBorder() { return false; }
        getMainWindowBorderRadius() { return undefined; }
        isVisible(_part) { return true; }
        getContainer() { return null; }
        whenContainerStylesLoaded() { return undefined; }
        isTitleBarHidden() { return false; }
        isStatusBarHidden() { return false; }
        isActivityBarHidden() { return false; }
        setActivityBarHidden(_hidden) { }
        setBannerHidden(_hidden) { }
        isSideBarHidden() { return false; }
        async setEditorHidden(_hidden) { }
        async setSideBarHidden(_hidden) { }
        async setAuxiliaryBarHidden(_hidden) { }
        async setPartHidden(_hidden, part) { }
        isPanelHidden() { return false; }
        async setPanelHidden(_hidden) { }
        toggleMaximizedPanel() { }
        isPanelMaximized() { return false; }
        getMenubarVisibility() { throw new Error('not implemented'); }
        toggleMenuBar() { }
        getSideBarPosition() { return 0; }
        getPanelPosition() { return 0; }
        getPanelAlignment() { return 'center'; }
        async setPanelPosition(_position) { }
        async setPanelAlignment(_alignment) { }
        addClass(_clazz) { }
        removeClass(_clazz) { }
        getMaximumEditorDimensions() { throw new Error('not implemented'); }
        toggleZenMode() { }
        isMainEditorLayoutCentered() { return false; }
        centerMainEditorLayout(_active) { }
        resizePart(_part, _sizeChangeWidth, _sizeChangeHeight) { }
        registerPart(part) { return lifecycle_2.Disposable.None; }
        isWindowMaximized(targetWindow) { return false; }
        updateWindowMaximizedState(targetWindow, maximized) { }
        getVisibleNeighborPart(part, direction) { return undefined; }
        focus() { }
    }
    exports.TestLayoutService = TestLayoutService;
    const activeViewlet = {};
    class TestPaneCompositeService extends lifecycle_2.Disposable {
        constructor() {
            super();
            this.parts = new Map();
            this.parts.set(1 /* ViewContainerLocation.Panel */, new TestPanelPart());
            this.parts.set(0 /* ViewContainerLocation.Sidebar */, new TestSideBarPart());
            this.onDidPaneCompositeOpen = event_1.Event.any(...([1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */].map(loc => event_1.Event.map(this.parts.get(loc).onDidPaneCompositeOpen, composite => { return { composite, viewContainerLocation: loc }; }))));
            this.onDidPaneCompositeClose = event_1.Event.any(...([1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */].map(loc => event_1.Event.map(this.parts.get(loc).onDidPaneCompositeClose, composite => { return { composite, viewContainerLocation: loc }; }))));
        }
        openPaneComposite(id, viewContainerLocation, focus) {
            return this.getPartByLocation(viewContainerLocation).openPaneComposite(id, focus);
        }
        getActivePaneComposite(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getActivePaneComposite();
        }
        getPaneComposite(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposite(id);
        }
        getPaneComposites(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposites();
        }
        getProgressIndicator(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getProgressIndicator(id);
        }
        hideActivePaneComposite(viewContainerLocation) {
            this.getPartByLocation(viewContainerLocation).hideActivePaneComposite();
        }
        getLastActivePaneCompositeId(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getLastActivePaneCompositeId();
        }
        getPinnedPaneCompositeIds(viewContainerLocation) {
            throw new Error('Method not implemented.');
        }
        getVisiblePaneCompositeIds(viewContainerLocation) {
            throw new Error('Method not implemented.');
        }
        getPartByLocation(viewContainerLocation) {
            return (0, types_1.assertIsDefined)(this.parts.get(viewContainerLocation));
        }
    }
    exports.TestPaneCompositeService = TestPaneCompositeService;
    class TestSideBarPart {
        constructor() {
            this.onDidViewletRegisterEmitter = new event_1.Emitter();
            this.onDidViewletDeregisterEmitter = new event_1.Emitter();
            this.onDidViewletOpenEmitter = new event_1.Emitter();
            this.onDidViewletCloseEmitter = new event_1.Emitter();
            this.partId = "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
            this.element = undefined;
            this.minimumWidth = 0;
            this.maximumWidth = 0;
            this.minimumHeight = 0;
            this.maximumHeight = 0;
            this.onDidChange = event_1.Event.None;
            this.onDidPaneCompositeOpen = this.onDidViewletOpenEmitter.event;
            this.onDidPaneCompositeClose = this.onDidViewletCloseEmitter.event;
        }
        openPaneComposite(id, focus) { return Promise.resolve(undefined); }
        getPaneComposites() { return []; }
        getAllViewlets() { return []; }
        getActivePaneComposite() { return activeViewlet; }
        getDefaultViewletId() { return 'workbench.view.explorer'; }
        getPaneComposite(id) { return undefined; }
        getProgressIndicator(id) { return undefined; }
        hideActivePaneComposite() { }
        getLastActivePaneCompositeId() { return undefined; }
        dispose() { }
        getPinnedPaneCompositeIds() { return []; }
        getVisiblePaneCompositeIds() { return []; }
        layout(width, height, top, left) { }
    }
    exports.TestSideBarPart = TestSideBarPart;
    class TestPanelPart {
        constructor() {
            this.element = undefined;
            this.minimumWidth = 0;
            this.maximumWidth = 0;
            this.minimumHeight = 0;
            this.maximumHeight = 0;
            this.onDidChange = event_1.Event.None;
            this.onDidPaneCompositeOpen = new event_1.Emitter().event;
            this.onDidPaneCompositeClose = new event_1.Emitter().event;
            this.partId = "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */;
        }
        async openPaneComposite(id, focus) { return undefined; }
        getPaneComposite(id) { return activeViewlet; }
        getPaneComposites() { return []; }
        getPinnedPaneCompositeIds() { return []; }
        getVisiblePaneCompositeIds() { return []; }
        getActivePaneComposite() { return activeViewlet; }
        setPanelEnablement(id, enabled) { }
        dispose() { }
        getProgressIndicator(id) { return null; }
        hideActivePaneComposite() { }
        getLastActivePaneCompositeId() { return undefined; }
        layout(width, height, top, left) { }
    }
    exports.TestPanelPart = TestPanelPart;
    class TestViewsService {
        constructor() {
            this.onDidChangeViewContainerVisibility = new event_1.Emitter().event;
            this.onDidChangeViewVisibilityEmitter = new event_1.Emitter();
            this.onDidChangeViewVisibility = this.onDidChangeViewVisibilityEmitter.event;
            this.onDidChangeFocusedViewEmitter = new event_1.Emitter();
            this.onDidChangeFocusedView = this.onDidChangeFocusedViewEmitter.event;
        }
        isViewContainerVisible(id) { return true; }
        getVisibleViewContainer() { return null; }
        openViewContainer(id, focus) { return Promise.resolve(null); }
        closeViewContainer(id) { }
        isViewVisible(id) { return true; }
        getActiveViewWithId(id) { return null; }
        getViewWithId(id) { return null; }
        openView(id, focus) { return Promise.resolve(null); }
        closeView(id) { }
        getViewProgressIndicator(id) { return null; }
        getActiveViewPaneContainerWithId(id) { return null; }
        getFocusedViewName() { return ''; }
    }
    exports.TestViewsService = TestViewsService;
    class TestEditorGroupsService {
        constructor(groups = []) {
            this.groups = groups;
            this.parts = [this];
            this.windowId = window_1.mainWindow.vscodeWindowId;
            this.onDidCreateAuxiliaryEditorPart = event_1.Event.None;
            this.onDidChangeActiveGroup = event_1.Event.None;
            this.onDidActivateGroup = event_1.Event.None;
            this.onDidAddGroup = event_1.Event.None;
            this.onDidRemoveGroup = event_1.Event.None;
            this.onDidMoveGroup = event_1.Event.None;
            this.onDidChangeGroupIndex = event_1.Event.None;
            this.onDidChangeGroupLabel = event_1.Event.None;
            this.onDidChangeGroupLocked = event_1.Event.None;
            this.onDidChangeGroupMaximized = event_1.Event.None;
            this.onDidLayout = event_1.Event.None;
            this.onDidChangeEditorPartOptions = event_1.Event.None;
            this.onDidScroll = event_1.Event.None;
            this.orientation = 0 /* GroupOrientation.HORIZONTAL */;
            this.isReady = true;
            this.whenReady = Promise.resolve(undefined);
            this.whenRestored = Promise.resolve(undefined);
            this.hasRestorableState = false;
            this.contentDimension = { width: 800, height: 600 };
            this.mainPart = this;
        }
        get activeGroup() { return this.groups[0]; }
        get sideGroup() { return this.groups[0]; }
        get count() { return this.groups.length; }
        getPart(group) { return this; }
        getGroups(_order) { return this.groups; }
        getGroup(identifier) { return this.groups.find(group => group.id === identifier); }
        getLabel(_identifier) { return 'Group 1'; }
        findGroup(_scope, _source, _wrap) { throw new Error('not implemented'); }
        activateGroup(_group) { throw new Error('not implemented'); }
        restoreGroup(_group) { throw new Error('not implemented'); }
        getSize(_group) { return { width: 100, height: 100 }; }
        setSize(_group, _size) { }
        arrangeGroups(_arrangement) { }
        toggleMaximizeGroup() { }
        hasMaximizedGroup() { throw new Error('not implemented'); }
        toggleExpandGroup() { }
        applyLayout(_layout) { }
        getLayout() { throw new Error('not implemented'); }
        setGroupOrientation(_orientation) { }
        addGroup(_location, _direction) { throw new Error('not implemented'); }
        removeGroup(_group) { }
        moveGroup(_group, _location, _direction) { throw new Error('not implemented'); }
        mergeGroup(_group, _target, _options) { throw new Error('not implemented'); }
        mergeAllGroups(_group) { throw new Error('not implemented'); }
        copyGroup(_group, _location, _direction) { throw new Error('not implemented'); }
        centerLayout(active) { }
        isLayoutCentered() { return false; }
        createEditorDropTarget(container, delegate) { return lifecycle_2.Disposable.None; }
        enforcePartOptions(options) { return lifecycle_2.Disposable.None; }
        registerEditorPart(part) { return lifecycle_2.Disposable.None; }
        createAuxiliaryEditorPart() { throw new Error('Method not implemented.'); }
    }
    exports.TestEditorGroupsService = TestEditorGroupsService;
    class TestEditorGroupView {
        constructor(id) {
            this.id = id;
            this.windowId = window_1.mainWindow.vscodeWindowId;
            this.groupsView = undefined;
            this.editors = [];
            this.whenRestored = Promise.resolve(undefined);
            this.isEmpty = true;
            this.onWillDispose = event_1.Event.None;
            this.onDidModelChange = event_1.Event.None;
            this.onWillCloseEditor = event_1.Event.None;
            this.onDidCloseEditor = event_1.Event.None;
            this.onDidOpenEditorFail = event_1.Event.None;
            this.onDidFocus = event_1.Event.None;
            this.onDidChange = event_1.Event.None;
            this.onWillMoveEditor = event_1.Event.None;
            this.onWillOpenEditor = event_1.Event.None;
            this.onDidActiveEditorChange = event_1.Event.None;
        }
        getEditors(_order) { return []; }
        findEditors(_resource) { return []; }
        getEditorByIndex(_index) { throw new Error('not implemented'); }
        getIndexOfEditor(_editor) { return -1; }
        isFirst(editor) { return false; }
        isLast(editor) { return false; }
        openEditor(_editor, _options) { throw new Error('not implemented'); }
        openEditors(_editors) { throw new Error('not implemented'); }
        isPinned(_editor) { return false; }
        isSticky(_editor) { return false; }
        isTransient(_editor) { return false; }
        isActive(_editor) { return false; }
        contains(candidate) { return false; }
        moveEditor(_editor, _target, _options) { return true; }
        moveEditors(_editors, _target) { return true; }
        copyEditor(_editor, _target, _options) { }
        copyEditors(_editors, _target) { }
        async closeEditor(_editor, options) { return true; }
        async closeEditors(_editors, options) { return true; }
        async closeAllEditors(options) { return true; }
        async replaceEditors(_editors) { }
        pinEditor(_editor) { }
        stickEditor(editor) { }
        unstickEditor(editor) { }
        lock(locked) { }
        focus() { }
        get scopedContextKeyService() { throw new Error('not implemented'); }
        setActive(_isActive) { }
        notifyIndexChanged(_index) { }
        notifyLabelChanged(_label) { }
        dispose() { }
        toJSON() { return Object.create(null); }
        layout(_width, _height) { }
        relayout() { }
        createEditorActions(_menuDisposable) { throw new Error('not implemented'); }
    }
    exports.TestEditorGroupView = TestEditorGroupView;
    class TestEditorGroupAccessor {
        constructor() {
            this.label = '';
            this.windowId = window_1.mainWindow.vscodeWindowId;
            this.groups = [];
            this.partOptions = { ...editor_2.DEFAULT_EDITOR_PART_OPTIONS };
            this.onDidChangeEditorPartOptions = event_1.Event.None;
            this.onDidVisibilityChange = event_1.Event.None;
        }
        getGroup(identifier) { throw new Error('Method not implemented.'); }
        getGroups(order) { throw new Error('Method not implemented.'); }
        activateGroup(identifier) { throw new Error('Method not implemented.'); }
        restoreGroup(identifier) { throw new Error('Method not implemented.'); }
        addGroup(location, direction) { throw new Error('Method not implemented.'); }
        mergeGroup(group, target, options) { throw new Error('Method not implemented.'); }
        moveGroup(group, location, direction) { throw new Error('Method not implemented.'); }
        copyGroup(group, location, direction) { throw new Error('Method not implemented.'); }
        removeGroup(group) { throw new Error('Method not implemented.'); }
        arrangeGroups(arrangement, target) { throw new Error('Method not implemented.'); }
        toggleMaximizeGroup(group) { throw new Error('Method not implemented.'); }
        toggleExpandGroup(group) { throw new Error('Method not implemented.'); }
    }
    exports.TestEditorGroupAccessor = TestEditorGroupAccessor;
    class TestEditorService extends lifecycle_2.Disposable {
        get activeTextEditorControl() { return this._activeTextEditorControl; }
        set activeTextEditorControl(value) { this._activeTextEditorControl = value; }
        get activeEditor() { return this._activeEditor; }
        set activeEditor(value) { this._activeEditor = value; }
        constructor(editorGroupService) {
            super();
            this.editorGroupService = editorGroupService;
            this.onDidActiveEditorChange = event_1.Event.None;
            this.onDidVisibleEditorsChange = event_1.Event.None;
            this.onDidEditorsChange = event_1.Event.None;
            this.onWillOpenEditor = event_1.Event.None;
            this.onDidCloseEditor = event_1.Event.None;
            this.onDidOpenEditorFail = event_1.Event.None;
            this.onDidMostRecentlyActiveEditorsChange = event_1.Event.None;
            this.editors = [];
            this.mostRecentlyActiveEditors = [];
            this.visibleEditorPanes = [];
            this.visibleTextEditorControls = [];
            this.visibleEditors = [];
            this.count = this.editors.length;
        }
        createScoped(editorGroupsContainer) { return this; }
        getEditors() { return []; }
        findEditors() { return []; }
        async openEditor(editor, optionsOrGroup, group) {
            // openEditor takes ownership of the input, register it to the TestEditorService
            // so it's not marked as leaked during tests.
            if ('dispose' in editor) {
                this._register(editor);
            }
            return undefined;
        }
        async closeEditor(editor, options) { }
        async closeEditors(editors, options) { }
        doResolveEditorOpenRequest(editor) {
            if (!this.editorGroupService) {
                return undefined;
            }
            return [this.editorGroupService.activeGroup, editor, undefined];
        }
        openEditors(_editors, _group) { throw new Error('not implemented'); }
        isOpened(_editor) { return false; }
        isVisible(_editor) { return false; }
        replaceEditors(_editors, _group) { return Promise.resolve(undefined); }
        save(editors, options) { throw new Error('Method not implemented.'); }
        saveAll(options) { throw new Error('Method not implemented.'); }
        revert(editors, options) { throw new Error('Method not implemented.'); }
        revertAll(options) { throw new Error('Method not implemented.'); }
    }
    exports.TestEditorService = TestEditorService;
    class TestFileService {
        constructor() {
            this._onDidFilesChange = new event_1.Emitter();
            this._onDidRunOperation = new event_1.Emitter();
            this._onDidChangeFileSystemProviderCapabilities = new event_1.Emitter();
            this._onWillActivateFileSystemProvider = new event_1.Emitter();
            this.onWillActivateFileSystemProvider = this._onWillActivateFileSystemProvider.event;
            this.onDidWatchError = event_1.Event.None;
            this.content = 'Hello Html';
            this.readonly = false;
            this.notExistsSet = new map_1.ResourceMap();
            this.readShouldThrowError = undefined;
            this.writeShouldThrowError = undefined;
            this.onDidChangeFileSystemProviderRegistrations = event_1.Event.None;
            this.providers = new Map();
            this.watches = [];
        }
        get onDidFilesChange() { return this._onDidFilesChange.event; }
        fireFileChanges(event) { this._onDidFilesChange.fire(event); }
        get onDidRunOperation() { return this._onDidRunOperation.event; }
        fireAfterOperation(event) { this._onDidRunOperation.fire(event); }
        get onDidChangeFileSystemProviderCapabilities() { return this._onDidChangeFileSystemProviderCapabilities.event; }
        fireFileSystemProviderCapabilitiesChangeEvent(event) { this._onDidChangeFileSystemProviderCapabilities.fire(event); }
        setContent(content) { this.content = content; }
        getContent() { return this.content; }
        getLastReadFileUri() { return this.lastReadFileUri; }
        async resolve(resource, _options) {
            return (0, workbenchTestServices_1.createFileStat)(resource, this.readonly);
        }
        stat(resource) {
            return this.resolve(resource, { resolveMetadata: true });
        }
        async resolveAll(toResolve) {
            const stats = await Promise.all(toResolve.map(resourceAndOption => this.resolve(resourceAndOption.resource, resourceAndOption.options)));
            return stats.map(stat => ({ stat, success: true }));
        }
        async exists(_resource) { return !this.notExistsSet.has(_resource); }
        async readFile(resource, options) {
            if (this.readShouldThrowError) {
                throw this.readShouldThrowError;
            }
            this.lastReadFileUri = resource;
            return {
                ...(0, workbenchTestServices_1.createFileStat)(resource, this.readonly),
                value: buffer_1.VSBuffer.fromString(this.content)
            };
        }
        async readFileStream(resource, options) {
            if (this.readShouldThrowError) {
                throw this.readShouldThrowError;
            }
            this.lastReadFileUri = resource;
            return {
                ...(0, workbenchTestServices_1.createFileStat)(resource, this.readonly),
                value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(this.content))
            };
        }
        async writeFile(resource, bufferOrReadable, options) {
            await (0, async_1.timeout)(0);
            if (this.writeShouldThrowError) {
                throw this.writeShouldThrowError;
            }
            return (0, workbenchTestServices_1.createFileStat)(resource, this.readonly);
        }
        move(_source, _target, _overwrite) { return Promise.resolve(null); }
        copy(_source, _target, _overwrite) { return Promise.resolve(null); }
        async cloneFile(_source, _target) { }
        createFile(_resource, _content, _options) { return Promise.resolve(null); }
        createFolder(_resource) { return Promise.resolve(null); }
        registerProvider(scheme, provider) {
            this.providers.set(scheme, provider);
            return (0, lifecycle_2.toDisposable)(() => this.providers.delete(scheme));
        }
        getProvider(scheme) {
            return this.providers.get(scheme);
        }
        async activateProvider(_scheme) {
            this._onWillActivateFileSystemProvider.fire({ scheme: _scheme, join: () => { } });
        }
        async canHandleResource(resource) { return this.hasProvider(resource); }
        hasProvider(resource) { return resource.scheme === network_1.Schemas.file || this.providers.has(resource.scheme); }
        listCapabilities() {
            return [
                { scheme: network_1.Schemas.file, capabilities: 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ },
                ...iterator_1.Iterable.map(this.providers, ([scheme, p]) => { return { scheme, capabilities: p.capabilities }; })
            ];
        }
        hasCapability(resource, capability) {
            if (capability === 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */ && platform_1.isLinux) {
                return true;
            }
            const provider = this.getProvider(resource.scheme);
            return !!(provider && (provider.capabilities & capability));
        }
        async del(_resource, _options) { }
        createWatcher(resource, options) {
            return {
                onDidChange: event_1.Event.None,
                dispose: () => { }
            };
        }
        watch(_resource) {
            this.watches.push(_resource);
            return (0, lifecycle_2.toDisposable)(() => this.watches.splice(this.watches.indexOf(_resource), 1));
        }
        getWriteEncoding(_resource) { return { encoding: 'utf8', hasBOM: false }; }
        dispose() { }
        async canCreateFile(source, options) { return true; }
        async canMove(source, target, overwrite) { return true; }
        async canCopy(source, target, overwrite) { return true; }
        async canDelete(resource, options) { return true; }
    }
    exports.TestFileService = TestFileService;
    class TestWorkingCopyBackupService extends workingCopyBackupService_1.InMemoryWorkingCopyBackupService {
        constructor() {
            super();
            this.resolved = new Set();
        }
        parseBackupContent(textBufferFactory) {
            const textBuffer = textBufferFactory.create(1 /* DefaultEndOfLine.LF */).textBuffer;
            const lineCount = textBuffer.getLineCount();
            const range = new range_1.Range(1, 1, lineCount, textBuffer.getLineLength(lineCount) + 1);
            return textBuffer.getValueInRange(range, 0 /* EndOfLinePreference.TextDefined */);
        }
        async resolve(identifier) {
            this.resolved.add(identifier);
            return super.resolve(identifier);
        }
    }
    exports.TestWorkingCopyBackupService = TestWorkingCopyBackupService;
    function toUntypedWorkingCopyId(resource) {
        return toTypedWorkingCopyId(resource, '');
    }
    function toTypedWorkingCopyId(resource, typeId = 'testBackupTypeId') {
        return { typeId, resource };
    }
    class InMemoryTestWorkingCopyBackupService extends workingCopyBackupService_2.BrowserWorkingCopyBackupService {
        constructor() {
            const disposables = new lifecycle_2.DisposableStore();
            const environmentService = exports.TestEnvironmentService;
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            disposables.add(fileService.registerProvider(network_1.Schemas.file, disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider())));
            super(new workbenchTestServices_1.TestContextService(testWorkspace_1.TestWorkspace), environmentService, fileService, logService);
            this.backupResourceJoiners = [];
            this.discardBackupJoiners = [];
            this.discardedBackups = [];
            this._register(disposables);
        }
        testGetFileService() {
            return this.fileService;
        }
        joinBackupResource() {
            return new Promise(resolve => this.backupResourceJoiners.push(resolve));
        }
        joinDiscardBackup() {
            return new Promise(resolve => this.discardBackupJoiners.push(resolve));
        }
        async backup(identifier, content, versionId, meta, token) {
            await super.backup(identifier, content, versionId, meta, token);
            while (this.backupResourceJoiners.length) {
                this.backupResourceJoiners.pop()();
            }
        }
        async discardBackup(identifier) {
            await super.discardBackup(identifier);
            this.discardedBackups.push(identifier);
            while (this.discardBackupJoiners.length) {
                this.discardBackupJoiners.pop()();
            }
        }
        async getBackupContents(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const fileContents = await this.fileService.readFile(backupResource);
            return fileContents.value.toString();
        }
    }
    exports.InMemoryTestWorkingCopyBackupService = InMemoryTestWorkingCopyBackupService;
    class TestLifecycleService extends lifecycle_2.Disposable {
        constructor() {
            super(...arguments);
            this.usePhases = false;
            this.whenStarted = new async_1.DeferredPromise();
            this.whenReady = new async_1.DeferredPromise();
            this.whenRestored = new async_1.DeferredPromise();
            this.whenEventually = new async_1.DeferredPromise();
            this._onBeforeShutdown = this._register(new event_1.Emitter());
            this._onBeforeShutdownError = this._register(new event_1.Emitter());
            this._onShutdownVeto = this._register(new event_1.Emitter());
            this._onWillShutdown = this._register(new event_1.Emitter());
            this._onDidShutdown = this._register(new event_1.Emitter());
            this.shutdownJoiners = [];
        }
        get phase() { return this._phase; }
        set phase(value) {
            this._phase = value;
            if (value === 1 /* LifecyclePhase.Starting */) {
                this.whenStarted.complete();
            }
            else if (value === 2 /* LifecyclePhase.Ready */) {
                this.whenReady.complete();
            }
            else if (value === 3 /* LifecyclePhase.Restored */) {
                this.whenRestored.complete();
            }
            else if (value === 4 /* LifecyclePhase.Eventually */) {
                this.whenEventually.complete();
            }
        }
        async when(phase) {
            if (!this.usePhases) {
                return;
            }
            if (phase === 1 /* LifecyclePhase.Starting */) {
                await this.whenStarted.p;
            }
            else if (phase === 2 /* LifecyclePhase.Ready */) {
                await this.whenReady.p;
            }
            else if (phase === 3 /* LifecyclePhase.Restored */) {
                await this.whenRestored.p;
            }
            else if (phase === 4 /* LifecyclePhase.Eventually */) {
                await this.whenEventually.p;
            }
        }
        get onBeforeShutdown() { return this._onBeforeShutdown.event; }
        get onBeforeShutdownError() { return this._onBeforeShutdownError.event; }
        get onShutdownVeto() { return this._onShutdownVeto.event; }
        get onWillShutdown() { return this._onWillShutdown.event; }
        get onDidShutdown() { return this._onDidShutdown.event; }
        fireShutdown(reason = 2 /* ShutdownReason.QUIT */) {
            this.shutdownJoiners = [];
            this._onWillShutdown.fire({
                join: p => {
                    this.shutdownJoiners.push(p);
                },
                joiners: () => [],
                force: () => { },
                token: cancellation_1.CancellationToken.None,
                reason
            });
        }
        fireBeforeShutdown(event) { this._onBeforeShutdown.fire(event); }
        fireWillShutdown(event) { this._onWillShutdown.fire(event); }
        async shutdown() {
            this.fireShutdown();
        }
    }
    exports.TestLifecycleService = TestLifecycleService;
    class TestBeforeShutdownEvent {
        constructor() {
            this.reason = 1 /* ShutdownReason.CLOSE */;
        }
        veto(value) {
            this.value = value;
        }
        finalVeto(vetoFn) {
            this.value = vetoFn();
            this.finalValue = vetoFn;
        }
    }
    exports.TestBeforeShutdownEvent = TestBeforeShutdownEvent;
    class TestWillShutdownEvent {
        constructor() {
            this.value = [];
            this.joiners = () => [];
            this.reason = 1 /* ShutdownReason.CLOSE */;
            this.token = cancellation_1.CancellationToken.None;
        }
        join(promise, joiner) {
            this.value.push(promise);
        }
        force() { }
    }
    exports.TestWillShutdownEvent = TestWillShutdownEvent;
    class TestTextResourceConfigurationService {
        constructor(configurationService = new testConfigurationService_1.TestConfigurationService()) {
            this.configurationService = configurationService;
        }
        onDidChangeConfiguration() {
            return { dispose() { } };
        }
        getValue(resource, arg2, arg3) {
            const position = position_1.Position.isIPosition(arg2) ? arg2 : null;
            const section = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
            return this.configurationService.getValue(section, { resource });
        }
        inspect(resource, position, section) {
            return this.configurationService.inspect(section, { resource });
        }
        updateValue(resource, key, value, configurationTarget) {
            return this.configurationService.updateValue(key, value);
        }
    }
    exports.TestTextResourceConfigurationService = TestTextResourceConfigurationService;
    class RemoteFileSystemProvider {
        constructor(wrappedFsp, remoteAuthority) {
            this.wrappedFsp = wrappedFsp;
            this.remoteAuthority = remoteAuthority;
            this.capabilities = this.wrappedFsp.capabilities;
            this.onDidChangeCapabilities = this.wrappedFsp.onDidChangeCapabilities;
            this.onDidChangeFile = event_1.Event.map(this.wrappedFsp.onDidChangeFile, changes => changes.map(c => {
                return {
                    type: c.type,
                    resource: c.resource.with({ scheme: network_1.Schemas.vscodeRemote, authority: this.remoteAuthority }),
                };
            }));
        }
        watch(resource, opts) { return this.wrappedFsp.watch(this.toFileResource(resource), opts); }
        stat(resource) { return this.wrappedFsp.stat(this.toFileResource(resource)); }
        mkdir(resource) { return this.wrappedFsp.mkdir(this.toFileResource(resource)); }
        readdir(resource) { return this.wrappedFsp.readdir(this.toFileResource(resource)); }
        delete(resource, opts) { return this.wrappedFsp.delete(this.toFileResource(resource), opts); }
        rename(from, to, opts) { return this.wrappedFsp.rename(this.toFileResource(from), this.toFileResource(to), opts); }
        copy(from, to, opts) { return this.wrappedFsp.copy(this.toFileResource(from), this.toFileResource(to), opts); }
        readFile(resource) { return this.wrappedFsp.readFile(this.toFileResource(resource)); }
        writeFile(resource, content, opts) { return this.wrappedFsp.writeFile(this.toFileResource(resource), content, opts); }
        open(resource, opts) { return this.wrappedFsp.open(this.toFileResource(resource), opts); }
        close(fd) { return this.wrappedFsp.close(fd); }
        read(fd, pos, data, offset, length) { return this.wrappedFsp.read(fd, pos, data, offset, length); }
        write(fd, pos, data, offset, length) { return this.wrappedFsp.write(fd, pos, data, offset, length); }
        readFileStream(resource, opts, token) { return this.wrappedFsp.readFileStream(this.toFileResource(resource), opts, token); }
        toFileResource(resource) { return resource.with({ scheme: network_1.Schemas.file, authority: '' }); }
    }
    exports.RemoteFileSystemProvider = RemoteFileSystemProvider;
    class TestInMemoryFileSystemProvider extends inMemoryFilesystemProvider_1.InMemoryFileSystemProvider {
        get capabilities() {
            return 2 /* FileSystemProviderCapabilities.FileReadWrite */
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */
                | 16 /* FileSystemProviderCapabilities.FileReadStream */;
        }
        readFileStream(resource) {
            const BUFFER_SIZE = 64 * 1024;
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            (async () => {
                try {
                    const data = await this.readFile(resource);
                    let offset = 0;
                    while (offset < data.length) {
                        await (0, async_1.timeout)(0);
                        await stream.write(data.subarray(offset, offset + BUFFER_SIZE));
                        offset += BUFFER_SIZE;
                    }
                    await (0, async_1.timeout)(0);
                    stream.end();
                }
                catch (error) {
                    stream.end(error);
                }
            })();
            return stream;
        }
    }
    exports.TestInMemoryFileSystemProvider = TestInMemoryFileSystemProvider;
    exports.productService = { _serviceBrand: undefined, ...product_1.default };
    class TestHostService {
        constructor() {
            this._hasFocus = true;
            this._onDidChangeFocus = new event_1.Emitter();
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidChangeWindow = new event_1.Emitter();
            this.onDidChangeActiveWindow = this._onDidChangeWindow.event;
            this.onDidChangeFullScreen = event_1.Event.None;
            this.colorScheme = theme_1.ColorScheme.DARK;
            this.onDidChangeColorScheme = event_1.Event.None;
        }
        get hasFocus() { return this._hasFocus; }
        async hadLastFocus() { return this._hasFocus; }
        setFocus(focus) {
            this._hasFocus = focus;
            this._onDidChangeFocus.fire(this._hasFocus);
        }
        async restart() { }
        async reload() { }
        async close() { }
        async withExpectedShutdown(expectedShutdownTask) {
            return await expectedShutdownTask();
        }
        async focus() { }
        async moveTop() { }
        async getCursorScreenPoint() { return undefined; }
        async openWindow(arg1, arg2) { }
        async toggleFullScreen() { }
    }
    exports.TestHostService = TestHostService;
    class TestFilesConfigurationService extends filesConfigurationService_1.FilesConfigurationService {
        testOnFilesConfigurationChange(configuration) {
            super.onFilesConfigurationChange(configuration, true);
        }
    }
    exports.TestFilesConfigurationService = TestFilesConfigurationService;
    class TestReadonlyTextFileEditorModel extends textFileEditorModel_1.TextFileEditorModel {
        isReadonly() {
            return true;
        }
    }
    exports.TestReadonlyTextFileEditorModel = TestReadonlyTextFileEditorModel;
    class TestEditorInput extends editorInput_1.EditorInput {
        constructor(resource, _typeId) {
            super();
            this.resource = resource;
            this._typeId = _typeId;
        }
        get typeId() {
            return this._typeId;
        }
        get editorId() {
            return this._typeId;
        }
        resolve() {
            return Promise.resolve(null);
        }
    }
    exports.TestEditorInput = TestEditorInput;
    function registerTestEditor(id, inputs, serializerInputId) {
        const disposables = new lifecycle_2.DisposableStore();
        class TestEditor extends editorPane_1.EditorPane {
            constructor(group) {
                super(id, group, telemetryUtils_1.NullTelemetryService, new testThemeService_1.TestThemeService(), disposables.add(new workbenchTestServices_1.TestStorageService()));
                this._scopedContextKeyService = new mockKeybindingService_1.MockContextKeyService();
            }
            async setInput(input, options, context, token) {
                super.setInput(input, options, context, token);
                await input.resolve();
            }
            getId() { return id; }
            layout() { }
            createEditor() { }
            get scopedContextKeyService() {
                return this._scopedContextKeyService;
            }
        }
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(TestEditor, id, 'Test Editor Control'), inputs));
        if (serializerInputId) {
            class EditorsObserverTestEditorInputSerializer {
                canSerialize(editorInput) {
                    return true;
                }
                serialize(editorInput) {
                    const testEditorInput = editorInput;
                    const testInput = {
                        resource: testEditorInput.resource.toString()
                    };
                    return JSON.stringify(testInput);
                }
                deserialize(instantiationService, serializedEditorInput) {
                    const testInput = JSON.parse(serializedEditorInput);
                    return new TestFileEditorInput(uri_1.URI.parse(testInput.resource), serializerInputId);
                }
            }
            disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(serializerInputId, EditorsObserverTestEditorInputSerializer));
        }
        return disposables;
    }
    function registerTestFileEditor() {
        const disposables = new lifecycle_2.DisposableStore();
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(TestTextFileEditor, TestTextFileEditor.ID, 'Text File Editor'), [new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)]));
        return disposables;
    }
    function registerTestResourceEditor() {
        const disposables = new lifecycle_2.DisposableStore();
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(TestTextResourceEditor, TestTextResourceEditor.ID, 'Text Editor'), [
            new descriptors_1.SyncDescriptor(untitledTextEditorInput_1.UntitledTextEditorInput),
            new descriptors_1.SyncDescriptor(textResourceEditorInput_1.TextResourceEditorInput)
        ]));
        return disposables;
    }
    function registerTestSideBySideEditor() {
        const disposables = new lifecycle_2.DisposableStore();
        disposables.add(platform_2.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_3.EditorPaneDescriptor.create(sideBySideEditor_1.SideBySideEditor, sideBySideEditor_1.SideBySideEditor.ID, 'Text Editor'), [
            new descriptors_1.SyncDescriptor(sideBySideEditorInput_1.SideBySideEditorInput)
        ]));
        return disposables;
    }
    class TestFileEditorInput extends editorInput_1.EditorInput {
        constructor(resource, _typeId) {
            super();
            this.resource = resource;
            this._typeId = _typeId;
            this.preferredResource = this.resource;
            this.gotDisposed = false;
            this.gotSaved = false;
            this.gotSavedAs = false;
            this.gotReverted = false;
            this.dirty = false;
            this.fails = false;
            this.disableToUntyped = false;
            this._capabilities = 0 /* EditorInputCapabilities.None */;
            this.movedEditor = undefined;
            this.moveDisabledReason = undefined;
        }
        get typeId() { return this._typeId; }
        get editorId() { return this._typeId; }
        get capabilities() { return this._capabilities; }
        set capabilities(capabilities) {
            if (this._capabilities !== capabilities) {
                this._capabilities = capabilities;
                this._onDidChangeCapabilities.fire();
            }
        }
        resolve() { return !this.fails ? Promise.resolve(null) : Promise.reject(new Error('fails')); }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            if (other instanceof editorInput_1.EditorInput) {
                return !!(other?.resource && this.resource.toString() === other.resource.toString() && other instanceof TestFileEditorInput && other.typeId === this.typeId);
            }
            return (0, resources_1.isEqual)(this.resource, other.resource) && (this.editorId === other.options?.override || other.options?.override === undefined);
        }
        setPreferredResource(resource) { }
        async setEncoding(encoding) { }
        getEncoding() { return undefined; }
        setPreferredName(name) { }
        setPreferredDescription(description) { }
        setPreferredEncoding(encoding) { }
        setPreferredContents(contents) { }
        setLanguageId(languageId, source) { }
        setPreferredLanguageId(languageId) { }
        setForceOpenAsBinary() { }
        setFailToOpen() {
            this.fails = true;
        }
        async save(groupId, options) {
            this.gotSaved = true;
            this.dirty = false;
            return this;
        }
        async saveAs(groupId, options) {
            this.gotSavedAs = true;
            return this;
        }
        async revert(group, options) {
            this.gotReverted = true;
            this.gotSaved = false;
            this.gotSavedAs = false;
            this.dirty = false;
        }
        toUntyped() {
            if (this.disableToUntyped) {
                return undefined;
            }
            return { resource: this.resource };
        }
        setModified() { this.modified = true; }
        isModified() {
            return this.modified === undefined ? this.dirty : this.modified;
        }
        setDirty() { this.dirty = true; }
        isDirty() {
            return this.dirty;
        }
        isResolved() { return false; }
        dispose() {
            super.dispose();
            this.gotDisposed = true;
        }
        async rename() { return this.movedEditor; }
        setMoveDisabled(reason) {
            this.moveDisabledReason = reason;
        }
        canMove(sourceGroup, targetGroup) {
            if (typeof this.moveDisabledReason === 'string') {
                return this.moveDisabledReason;
            }
            return super.canMove(sourceGroup, targetGroup);
        }
    }
    exports.TestFileEditorInput = TestFileEditorInput;
    class TestSingletonFileEditorInput extends TestFileEditorInput {
        get capabilities() { return 8 /* EditorInputCapabilities.Singleton */; }
    }
    exports.TestSingletonFileEditorInput = TestSingletonFileEditorInput;
    class TestEditorPart extends editorPart_1.MainEditorPart {
        constructor() {
            super(...arguments);
            this.mainPart = this;
            this.parts = [this];
            this.onDidCreateAuxiliaryEditorPart = event_1.Event.None;
        }
        testSaveState() {
            return super.saveState();
        }
        clearState() {
            const workspaceMemento = this.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            for (const key of Object.keys(workspaceMemento)) {
                delete workspaceMemento[key];
            }
            const profileMemento = this.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            for (const key of Object.keys(profileMemento)) {
                delete profileMemento[key];
            }
        }
        registerEditorPart(part) {
            return lifecycle_2.Disposable.None;
        }
        createAuxiliaryEditorPart() {
            throw new Error('Method not implemented.');
        }
        getPart(group) { return this; }
    }
    exports.TestEditorPart = TestEditorPart;
    async function createEditorPart(instantiationService, disposables) {
        class TestEditorParts extends editorParts_1.EditorParts {
            createMainEditorPart() {
                this.testMainPart = instantiationService.createInstance(TestEditorPart, this);
                return this.testMainPart;
            }
        }
        const part = disposables.add(instantiationService.createInstance(TestEditorParts)).testMainPart;
        part.create(document.createElement('div'));
        part.layout(1080, 800, 0, 0);
        await part.whenReady;
        return part;
    }
    class TestListService {
        constructor() {
            this.lastFocusedList = undefined;
        }
        register() {
            return lifecycle_2.Disposable.None;
        }
    }
    exports.TestListService = TestListService;
    class TestPathService {
        constructor(fallbackUserHome = uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/' }), defaultUriScheme = network_1.Schemas.file) {
            this.fallbackUserHome = fallbackUserHome;
            this.defaultUriScheme = defaultUriScheme;
        }
        hasValidBasename(resource, arg2, name) {
            if (typeof arg2 === 'string' || typeof arg2 === 'undefined') {
                return (0, extpath_1.isValidBasename)(arg2 ?? (0, resources_1.basename)(resource));
            }
            return (0, extpath_1.isValidBasename)(name ?? (0, resources_1.basename)(resource));
        }
        get path() { return Promise.resolve(platform_1.isWindows ? path_1.win32 : path_1.posix); }
        userHome(options) {
            return options?.preferLocal ? this.fallbackUserHome : Promise.resolve(this.fallbackUserHome);
        }
        get resolvedUserHome() { return this.fallbackUserHome; }
        async fileURI(path) {
            return uri_1.URI.file(path);
        }
    }
    exports.TestPathService = TestPathService;
    function getLastResolvedFileStat(model) {
        const candidate = model;
        return candidate?.lastResolvedFileStat;
    }
    class TestWorkspacesService {
        constructor() {
            this.onDidChangeRecentlyOpened = event_1.Event.None;
        }
        async createUntitledWorkspace(folders, remoteAuthority) { throw new Error('Method not implemented.'); }
        async deleteUntitledWorkspace(workspace) { }
        async addRecentlyOpened(recents) { }
        async removeRecentlyOpened(workspaces) { }
        async clearRecentlyOpened() { }
        async getRecentlyOpened() { return { files: [], workspaces: [] }; }
        async getDirtyWorkspaces() { return []; }
        async enterWorkspace(path) { throw new Error('Method not implemented.'); }
        async getWorkspaceIdentifier(workspacePath) { throw new Error('Method not implemented.'); }
    }
    exports.TestWorkspacesService = TestWorkspacesService;
    class TestTerminalInstanceService {
        constructor() {
            this.onDidCreateInstance = event_1.Event.None;
        }
        convertProfileToShellLaunchConfig(shellLaunchConfigOrProfile, cwd) { throw new Error('Method not implemented.'); }
        preparePathForTerminalAsync(path, executable, title, shellType, remoteAuthority) { throw new Error('Method not implemented.'); }
        createInstance(options, target) { throw new Error('Method not implemented.'); }
        async getBackend(remoteAuthority) { throw new Error('Method not implemented.'); }
        didRegisterBackend(remoteAuthority) { throw new Error('Method not implemented.'); }
        getRegisteredBackends() { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalInstanceService = TestTerminalInstanceService;
    class TestTerminalEditorService {
        constructor() {
            this.instances = [];
            this.onDidDisposeInstance = event_1.Event.None;
            this.onDidFocusInstance = event_1.Event.None;
            this.onDidChangeInstanceCapability = event_1.Event.None;
            this.onDidChangeActiveInstance = event_1.Event.None;
            this.onDidChangeInstances = event_1.Event.None;
        }
        openEditor(instance, editorOptions) { throw new Error('Method not implemented.'); }
        detachInstance(instance) { throw new Error('Method not implemented.'); }
        splitInstance(instanceToSplit, shellLaunchConfig) { throw new Error('Method not implemented.'); }
        revealActiveEditor(preserveFocus) { throw new Error('Method not implemented.'); }
        resolveResource(instance) { throw new Error('Method not implemented.'); }
        reviveInput(deserializedInput) { throw new Error('Method not implemented.'); }
        getInputFromResource(resource) { throw new Error('Method not implemented.'); }
        setActiveInstance(instance) { throw new Error('Method not implemented.'); }
        focusActiveInstance() { throw new Error('Method not implemented.'); }
        getInstanceFromResource(resource) { throw new Error('Method not implemented.'); }
        focusFindWidget() { throw new Error('Method not implemented.'); }
        hideFindWidget() { throw new Error('Method not implemented.'); }
        findNext() { throw new Error('Method not implemented.'); }
        findPrevious() { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalEditorService = TestTerminalEditorService;
    class TestTerminalGroupService {
        constructor() {
            this.instances = [];
            this.groups = [];
            this.activeGroupIndex = 0;
            this.lastAccessedMenu = 'inline-tab';
            this.onDidChangeActiveGroup = event_1.Event.None;
            this.onDidDisposeGroup = event_1.Event.None;
            this.onDidShow = event_1.Event.None;
            this.onDidChangeGroups = event_1.Event.None;
            this.onDidChangePanelOrientation = event_1.Event.None;
            this.onDidDisposeInstance = event_1.Event.None;
            this.onDidFocusInstance = event_1.Event.None;
            this.onDidChangeInstanceCapability = event_1.Event.None;
            this.onDidChangeActiveInstance = event_1.Event.None;
            this.onDidChangeInstances = event_1.Event.None;
        }
        createGroup(instance) { throw new Error('Method not implemented.'); }
        getGroupForInstance(instance) { throw new Error('Method not implemented.'); }
        moveGroup(source, target) { throw new Error('Method not implemented.'); }
        moveGroupToEnd(source) { throw new Error('Method not implemented.'); }
        moveInstance(source, target, side) { throw new Error('Method not implemented.'); }
        unsplitInstance(instance) { throw new Error('Method not implemented.'); }
        joinInstances(instances) { throw new Error('Method not implemented.'); }
        instanceIsSplit(instance) { throw new Error('Method not implemented.'); }
        getGroupLabels() { throw new Error('Method not implemented.'); }
        setActiveGroupByIndex(index) { throw new Error('Method not implemented.'); }
        setActiveGroupToNext() { throw new Error('Method not implemented.'); }
        setActiveGroupToPrevious() { throw new Error('Method not implemented.'); }
        setActiveInstanceByIndex(terminalIndex) { throw new Error('Method not implemented.'); }
        setContainer(container) { throw new Error('Method not implemented.'); }
        showPanel(focus) { throw new Error('Method not implemented.'); }
        hidePanel() { throw new Error('Method not implemented.'); }
        focusTabs() { throw new Error('Method not implemented.'); }
        focusHover() { throw new Error('Method not implemented.'); }
        setActiveInstance(instance) { throw new Error('Method not implemented.'); }
        focusActiveInstance() { throw new Error('Method not implemented.'); }
        getInstanceFromResource(resource) { throw new Error('Method not implemented.'); }
        focusFindWidget() { throw new Error('Method not implemented.'); }
        hideFindWidget() { throw new Error('Method not implemented.'); }
        findNext() { throw new Error('Method not implemented.'); }
        findPrevious() { throw new Error('Method not implemented.'); }
        updateVisibility() { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalGroupService = TestTerminalGroupService;
    class TestTerminalProfileService {
        constructor() {
            this.availableProfiles = [];
            this.contributedProfiles = [];
            this.profilesReady = Promise.resolve();
            this.onDidChangeAvailableProfiles = event_1.Event.None;
        }
        getPlatformKey() { throw new Error('Method not implemented.'); }
        refreshAvailableProfiles() { throw new Error('Method not implemented.'); }
        getDefaultProfileName() { throw new Error('Method not implemented.'); }
        getDefaultProfile() { throw new Error('Method not implemented.'); }
        getContributedDefaultProfile(shellLaunchConfig) { throw new Error('Method not implemented.'); }
        registerContributedProfile(args) { throw new Error('Method not implemented.'); }
        getContributedProfileProvider(extensionIdentifier, id) { throw new Error('Method not implemented.'); }
        registerTerminalProfileProvider(extensionIdentifier, id, profileProvider) { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalProfileService = TestTerminalProfileService;
    class TestTerminalProfileResolverService {
        constructor() {
            this.defaultProfileName = '';
        }
        resolveIcon(shellLaunchConfig) { }
        async resolveShellLaunchConfig(shellLaunchConfig, options) { }
        async getDefaultProfile(options) { return { path: '/default', profileName: 'Default', isDefault: true }; }
        async getDefaultShell(options) { return '/default'; }
        async getDefaultShellArgs(options) { return []; }
        getDefaultIcon() { return codicons_1.Codicon.terminal; }
        async getEnvironment() { return process_1.env; }
        getSafeConfigValue(key, os) { return undefined; }
        getSafeConfigValueFullKey(key) { return undefined; }
        createProfileFromShellAndShellArgs(shell, shellArgs) { throw new Error('Method not implemented.'); }
    }
    exports.TestTerminalProfileResolverService = TestTerminalProfileResolverService;
    class TestQuickInputService {
        constructor() {
            this.onShow = event_1.Event.None;
            this.onHide = event_1.Event.None;
            this.quickAccess = undefined;
        }
        async pick(picks, options, token) {
            if (Array.isArray(picks)) {
                return { label: 'selectedPick', description: 'pick description', value: 'selectedPick' };
            }
            else {
                return undefined;
            }
        }
        async input(options, token) { return options ? 'resolved' + options.prompt : 'resolved'; }
        createQuickPick() { throw new Error('not implemented.'); }
        createInputBox() { throw new Error('not implemented.'); }
        createQuickWidget() { throw new Error('Method not implemented.'); }
        focus() { throw new Error('not implemented.'); }
        toggle() { throw new Error('not implemented.'); }
        navigate(next, quickNavigate) { throw new Error('not implemented.'); }
        accept() { throw new Error('not implemented.'); }
        back() { throw new Error('not implemented.'); }
        cancel() { throw new Error('not implemented.'); }
    }
    exports.TestQuickInputService = TestQuickInputService;
    class TestLanguageDetectionService {
        isEnabledForLanguage(languageId) { return false; }
        async detectLanguage(resource, supportedLangs) { return undefined; }
    }
    class TestRemoteAgentService {
        getConnection() { return null; }
        async getEnvironment() { return null; }
        async getRawEnvironment() { return null; }
        async getExtensionHostExitInfo(reconnectionToken) { return null; }
        async getDiagnosticInfo(options) { return undefined; }
        async updateTelemetryLevel(telemetryLevel) { }
        async logTelemetry(eventName, data) { }
        async flushTelemetry() { }
        async getRoundTripTime() { return undefined; }
    }
    exports.TestRemoteAgentService = TestRemoteAgentService;
    class TestRemoteExtensionsScannerService {
        async whenExtensionsReady() { }
        scanExtensions() { throw new Error('Method not implemented.'); }
        scanSingleExtension() { throw new Error('Method not implemented.'); }
    }
    exports.TestRemoteExtensionsScannerService = TestRemoteExtensionsScannerService;
    class TestWorkbenchExtensionEnablementService {
        constructor() {
            this.onEnablementChanged = event_1.Event.None;
        }
        getEnablementState(extension) { return 8 /* EnablementState.EnabledGlobally */; }
        getEnablementStates(extensions, workspaceTypeOverrides) { return []; }
        getDependenciesEnablementStates(extension) { return []; }
        canChangeEnablement(extension) { return true; }
        canChangeWorkspaceEnablement(extension) { return true; }
        isEnabled(extension) { return true; }
        isEnabledEnablementState(enablementState) { return true; }
        isDisabledGlobally(extension) { return false; }
        async setEnablement(extensions, state) { return []; }
        async updateExtensionsEnablementsWhenWorkspaceTrustChanges() { }
    }
    exports.TestWorkbenchExtensionEnablementService = TestWorkbenchExtensionEnablementService;
    class TestWorkbenchExtensionManagementService {
        constructor() {
            this.onInstallExtension = event_1.Event.None;
            this.onDidInstallExtensions = event_1.Event.None;
            this.onUninstallExtension = event_1.Event.None;
            this.onDidUninstallExtension = event_1.Event.None;
            this.onDidUpdateExtensionMetadata = event_1.Event.None;
            this.onProfileAwareInstallExtension = event_1.Event.None;
            this.onProfileAwareDidInstallExtensions = event_1.Event.None;
            this.onProfileAwareUninstallExtension = event_1.Event.None;
            this.onProfileAwareDidUninstallExtension = event_1.Event.None;
            this.onDidChangeProfile = event_1.Event.None;
            this.onDidEnableExtensions = event_1.Event.None;
        }
        installVSIX(location, manifest, installOptions) {
            throw new Error('Method not implemented.');
        }
        installFromLocation(location) {
            throw new Error('Method not implemented.');
        }
        installGalleryExtensions(extensions) {
            throw new Error('Method not implemented.');
        }
        async updateFromGallery(gallery, extension, installOptions) { return extension; }
        zip(extension) {
            throw new Error('Method not implemented.');
        }
        unzip(zipLocation) {
            throw new Error('Method not implemented.');
        }
        getManifest(vsix) {
            throw new Error('Method not implemented.');
        }
        install(vsix, options) {
            throw new Error('Method not implemented.');
        }
        async canInstall(extension) { return false; }
        installFromGallery(extension, options) {
            throw new Error('Method not implemented.');
        }
        uninstall(extension, options) {
            throw new Error('Method not implemented.');
        }
        async reinstallFromGallery(extension) {
            throw new Error('Method not implemented.');
        }
        async getInstalled(type) { return []; }
        getExtensionsControlManifest() {
            throw new Error('Method not implemented.');
        }
        async updateMetadata(local, metadata) { return local; }
        registerParticipant(pariticipant) { }
        async getTargetPlatform() { return "undefined" /* TargetPlatform.UNDEFINED */; }
        async cleanUp() { }
        download() {
            throw new Error('Method not implemented.');
        }
        copyExtensions() { throw new Error('Not Supported'); }
        toggleAppliationScope() { throw new Error('Not Supported'); }
        installExtensionsFromProfile() { throw new Error('Not Supported'); }
        whenProfileChanged(from, to) { throw new Error('Not Supported'); }
        getInstalledWorkspaceExtensions() { throw new Error('Method not implemented.'); }
        installResourceExtension() { throw new Error('Method not implemented.'); }
        getExtensions() { throw new Error('Method not implemented.'); }
        isWorkspaceExtensionsSupported() { throw new Error('Method not implemented.'); }
    }
    exports.TestWorkbenchExtensionManagementService = TestWorkbenchExtensionManagementService;
    class TestUserDataProfileService {
        constructor() {
            this.onDidChangeCurrentProfile = event_1.Event.None;
            this.currentProfile = (0, userDataProfile_1.toUserDataProfile)('test', 'test', uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }));
        }
        async updateCurrentProfile() { }
        getShortName(profile) { return profile.shortName ?? profile.name; }
    }
    exports.TestUserDataProfileService = TestUserDataProfileService;
    class TestWebExtensionsScannerService {
        constructor() {
            this.onDidChangeProfile = event_1.Event.None;
        }
        async scanSystemExtensions() { return []; }
        async scanUserExtensions() { return []; }
        async scanExtensionsUnderDevelopment() { return []; }
        async copyExtensions() {
            throw new Error('Method not implemented.');
        }
        scanExistingExtension(extensionLocation, extensionType) {
            throw new Error('Method not implemented.');
        }
        addExtension(location, metadata) {
            throw new Error('Method not implemented.');
        }
        addExtensionFromGallery(galleryExtension, metadata) {
            throw new Error('Method not implemented.');
        }
        removeExtension() {
            throw new Error('Method not implemented.');
        }
        updateMetadata(extension, metaData, profileLocation) {
            throw new Error('Method not implemented.');
        }
        scanExtensionManifest(extensionLocation) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestWebExtensionsScannerService = TestWebExtensionsScannerService;
    async function workbenchTeardown(instantiationService) {
        return instantiationService.invokeFunction(async (accessor) => {
            const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            for (const workingCopy of workingCopyService.workingCopies) {
                await workingCopy.revert();
            }
            for (const group of editorGroupService.groups) {
                await group.closeAllEditors();
            }
            for (const group of editorGroupService.groups) {
                editorGroupService.removeGroup(group);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3dvcmtiZW5jaFRlc3RTZXJ2aWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4S2hHLHNEQUVDO0lBMkRELHNFQThHQztJQSsxQkQsd0RBRUM7SUFFRCxvREFFQztJQXdWRCxnREE2REM7SUFFRCx3REFhQztJQUVELGdFQWdCQztJQUVELG9FQWVDO0lBcUpELDRDQW9CQztJQW9ERCwwREFJQztJQXlURCw4Q0FpQkM7SUFsZ0VELFNBQWdCLHFCQUFxQixDQUFDLG9CQUEyQyxFQUFFLFFBQWE7UUFDL0YsT0FBTyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUNBQWUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN6SSxDQUFDO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLHlCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLHlCQUF5QixDQUFDO1FBRTdGLE1BQU0sRUFBRSw0QkFBb0I7UUFFNUIsZ0JBQWdCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFvQixFQUFFO1lBQ3pMLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlDQUFlLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFMLENBQUM7UUFFRCxZQUFZLEVBQUUsQ0FBQyxHQUFHLEVBQTJCLEVBQUU7WUFDOUMsT0FBTyxHQUFHLFlBQVksaUNBQWUsQ0FBQztRQUN2QyxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsTUFBYSxzQkFBdUIsU0FBUSx1Q0FBa0I7UUFFMUMsbUJBQW1CLENBQUMsTUFBbUIsRUFBRSxhQUFrQjtZQUM3RSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQkFBYyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxSCxDQUFDO0tBQ0Q7SUFMRCx3REFLQztJQUVELE1BQWEsa0JBQW1CLFNBQVEsK0JBQWM7UUFFbEMsbUJBQW1CLENBQUMsTUFBbUIsRUFBRSxhQUFrQjtZQUM3RSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQkFBYyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdJLENBQUM7UUFFRCxZQUFZLENBQUMsU0FBZ0MsRUFBRSxNQUF1QztZQUNyRixJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQW9CLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUV4RSxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRVEsWUFBWTtZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzdCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUksT0FBOEIsQ0FBQyxTQUFTLENBQUM7WUFDaEUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxJQUFJLG9DQUF1QixDQUFDLElBQUkscUJBQVMsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxTQUFTLElBQUksYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDak8sQ0FBQztLQUNEO0lBekJELGdEQXlCQztJQU1ELE1BQWEsc0JBQXVCLFNBQVEsdUNBQWtCO1FBQzdELHlCQUF5QixDQUFDLFdBQXlCO1lBQ2xELE9BQU8sS0FBSyxDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pELENBQUM7S0FDRDtJQUpELHdEQUlDO0lBRUQsU0FBZ0IsNkJBQTZCLENBQzVDLFNBVUMsRUFDRCxjQUE0QyxJQUFJLDJCQUFlLEVBQUU7UUFFakUsTUFBTSxvQkFBb0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLENBQUMsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLDZCQUFpQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwSyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsbUNBQW9CLEVBQUUsSUFBSSxpREFBdUIsRUFBRSxDQUFDLENBQUM7UUFDL0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLHdDQUFtQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RixNQUFNLGtCQUFrQixHQUFHLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLDhCQUFzQixDQUFDO1FBQ3ZJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ25FLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpREFBNEIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQzVFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBVyxFQUFFLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7UUFDN0QsTUFBTSxpQkFBaUIsR0FBRyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNkNBQXFCLENBQUMsQ0FBQztRQUN4SyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsK0JBQWtCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNqRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMkJBQWdCLEVBQUUsSUFBSSxtQkFBbUIsRUFBRSxDQUFDLENBQUM7UUFDdkUsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLDBDQUFrQixDQUFDLDZCQUFhLENBQUMsQ0FBQztRQUN0RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsb0NBQXdCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUM3RSxNQUFNLGFBQWEsR0FBRyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1EQUF3QixDQUFDO1lBQzNJLEtBQUssRUFBRTtnQkFDTixZQUFZLEVBQUU7b0JBQ2IsT0FBTyxFQUFFLEtBQUs7aUJBQ2Q7YUFDRDtTQUNELENBQUMsQ0FBQztRQUNILG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQ0FBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNoRSxNQUFNLGdDQUFnQyxHQUFHLElBQUksb0NBQW9DLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDakcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDZEQUFpQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7UUFDL0Ysb0JBQW9CLENBQUMsSUFBSSxDQUFDLHNEQUEwQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFEQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZJLG9CQUFvQixDQUFDLElBQUksQ0FBQyx5QkFBZSxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsd0NBQW1CLEVBQUUsSUFBSSxzQkFBc0IsRUFBRSxDQUFDLENBQUM7UUFDN0Usb0JBQW9CLENBQUMsSUFBSSxDQUFDLDBEQUF5QixFQUFFLElBQUksNEJBQTRCLEVBQUUsQ0FBQyxDQUFDO1FBQ3pGLG9CQUFvQixDQUFDLElBQUksQ0FBQywwQkFBWSxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQ3RJLE1BQU0sYUFBYSxHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztRQUM5QyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsdUNBQXVCLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDbEUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHdCQUFjLEVBQUUsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDLENBQUM7UUFDbkUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7UUFDNUQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFDQUFxQixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDdkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHdEQUEyQixFQUFFO1lBQ3RELFVBQVUsRUFBRSxLQUFLLElBQUksRUFBRSxHQUFHLENBQUM7WUFDM0IsY0FBYyxDQUFDLE1BQWUsSUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDMUMsQ0FBQyxDQUFDO1FBQ1Ysb0JBQW9CLENBQUMsSUFBSSxDQUFDLDRCQUFrQixFQUFFLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDMUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDJCQUFnQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlDQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkgsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDJDQUF3QixFQUFFLElBQUksaURBQXVCLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLG9CQUFvQixDQUFDLElBQUksQ0FBQyx5REFBK0IsRUFBRSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0RBQThCLENBQUMsQ0FBQyxDQUFDO1FBQ2hJLG9CQUFvQixDQUFDLElBQUksQ0FBQyx5QkFBZSxFQUFFLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLG9CQUFvQixDQUFDLElBQUksQ0FBQywwREFBOEIsRUFBRSxJQUFJLHlEQUFpQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDaEgsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDJCQUFnQixFQUFFLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQ0FBZSxDQUFDLENBQUMsQ0FBQztRQUNsRyxNQUFNLFlBQVksR0FBRyxJQUFJLG1DQUFnQixFQUFFLENBQUM7UUFDNUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDRCQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDZEQUE2QixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxtRUFBZ0MsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsSCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMscUJBQWEsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdHLE1BQU0sV0FBVyxHQUFHLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDbEksb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9CQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDckQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLHVDQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9ELFdBQVcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNwQyxNQUFNLGFBQWEsR0FBRyxJQUFJLHlDQUFpQixFQUFFLENBQUM7UUFDOUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHdCQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDekQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHNEQUEwQixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSw2QkFBNkIsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsdUJBQXVCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzUSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUNBQW1CLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDcEYsTUFBTSx1QkFBdUIsR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMENBQXdCLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlDQUF1QixDQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3TSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMseUNBQXVCLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLCtDQUFzQixDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4SSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsNkNBQXlCLEVBQUUsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVNLG9CQUFvQixDQUFDLElBQUksQ0FBQyw2QkFBaUIsRUFBRSxxQ0FBb0IsQ0FBQyxDQUFDO1FBQ25FLG9CQUFvQixDQUFDLElBQUksQ0FBQyxtQ0FBb0IsRUFBRSxJQUFJLGlEQUF1QixFQUFFLENBQUMsQ0FBQztRQUMvRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsc0RBQTBCLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscURBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkksb0JBQW9CLENBQUMsSUFBSSxDQUFDLHNCQUFZLEVBQUUsSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0saUJBQWlCLEdBQUcsSUFBSSw2Q0FBcUIsRUFBRSxDQUFDO1FBQ3RELG9CQUFvQixDQUFDLElBQUksQ0FBQywrQkFBa0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2pFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFBRSxJQUFJLHNCQUFzQixFQUFFLENBQUMsQ0FBQztRQUM3RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOEJBQWlCLEVBQUUsSUFBSSw0Q0FBb0IsRUFBRSxDQUFDLENBQUM7UUFDekUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGdEQUF1QixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLCtDQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pJLG9CQUFvQixDQUFDLElBQUksQ0FBQyw0QkFBZ0IsRUFBRSxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQW1CLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4TixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsbUJBQVksRUFBZ0Isb0JBQW9CLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDNUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG1DQUFpQixFQUFxQixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtREFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoSixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsb0JBQWMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUkseUNBQWlCLENBQUMsOEJBQXNCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ILE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQyxDQUFDLElBQUksbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLG9CQUFvQixDQUFDLElBQUksQ0FBQywwQ0FBb0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3BFLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBYSxFQUFpQixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVILE1BQU0sYUFBYSxHQUFHLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUM1SixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOEJBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN6RCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsc0NBQWtCLEVBQUUsSUFBSSxxQ0FBaUIsRUFBRSxDQUFDLENBQUM7UUFDdkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9EQUF5QixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1EQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JJLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4Q0FBc0IsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2Q0FBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvSCxNQUFNLGlCQUFpQixHQUFHLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFDQUFpQixDQUFDLENBQUMsQ0FBQztRQUNyTCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsc0NBQWtCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNqRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsc0NBQWtCLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xJLG9CQUFvQixDQUFDLElBQUksQ0FBQyx5Q0FBeUIsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDBCQUFZLEVBQUUsSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1Q0FBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6SCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsK0JBQWtCLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlMLG9CQUFvQixDQUFDLElBQUksQ0FBQywrQkFBa0IsRUFBRSxJQUFJLHFCQUFxQixFQUFFLENBQUMsQ0FBQztRQUMzRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaURBQWdDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJEQUFtQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hILG9CQUFvQixDQUFDLElBQUksQ0FBQyw4Q0FBNkIsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksd0RBQWdDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZILG9CQUFvQixDQUFDLElBQUksQ0FBQyxtQ0FBd0IsRUFBRSxJQUFJLDJCQUEyQixFQUFFLENBQUMsQ0FBQztRQUN2RixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsMENBQW9CLEVBQUUsSUFBSSxnREFBMEIsRUFBRSxDQUFDLENBQUM7UUFDbEYsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHdEQUEyQixFQUFFLElBQUksdURBQTBCLEVBQUUsQ0FBQyxDQUFDO1FBQ3pGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvREFBeUIsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLENBQUMsYUFBYSxFQUFFLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTVJLE9BQU8sb0JBQW9CLENBQUM7SUFDN0IsQ0FBQztJQUVNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBQy9CLFlBQzJCLGdCQUFzQyxFQUN2QyxlQUFvQyxFQUNsQyxpQkFBcUMsRUFDaEMsc0JBQStDLEVBQzVDLHlCQUF3RCxFQUMxRCxjQUFrQyxFQUM3QyxZQUEwQixFQUMzQixXQUE0QixFQUN0QixpQkFBd0MsRUFDNUMsYUFBZ0MsRUFDM0Isa0JBQTBDLEVBQy9DLGFBQWdDLEVBQzVCLGlCQUFxQyxFQUMzQixrQkFBZ0QsRUFDaEUsV0FBeUIsRUFDakIsa0JBQXdDLEVBQ3RDLHFCQUE2QyxFQUNuRCxlQUFpQyxFQUNoQyx3QkFBMkMsRUFDbEMseUJBQW9ELEVBQ3pELHdCQUFrRCxFQUM5Qyx3QkFBc0QsRUFDbkUsV0FBNEIsRUFDdEIsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQzdCLFVBQXVCLEVBQ2Ysa0JBQXVDLEVBQ3JDLG1CQUEwQyxFQUMzQyxtQkFBeUMsRUFDcEMsd0JBQW1ELEVBQ3ZELG9CQUEyQyxFQUM1QyxtQkFBeUMsRUFDaEMsNEJBQThELEVBQ3hFLGtCQUF1QztZQWpDekMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFzQjtZQUN2QyxvQkFBZSxHQUFmLGVBQWUsQ0FBcUI7WUFDbEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNoQywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzVDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBK0I7WUFDMUQsbUJBQWMsR0FBZCxjQUFjLENBQW9CO1lBQzdDLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQzNCLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtZQUN0QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXVCO1lBQzVDLGtCQUFhLEdBQWIsYUFBYSxDQUFtQjtZQUMzQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXdCO1lBQy9DLGtCQUFhLEdBQWIsYUFBYSxDQUFtQjtZQUM1QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzNCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDaEUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDakIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUN0QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ25ELG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNoQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQW1CO1lBQ2xDLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBMkI7WUFDekQsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUM5Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQThCO1lBQ25FLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtZQUN0QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzFDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzdCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3JDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBdUI7WUFDM0Msd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNwQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQ3ZELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNoQyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQWtDO1lBQ3hFLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7UUFDaEUsQ0FBQztLQUNMLENBQUE7SUFyQ1ksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFFN0IsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLDRCQUFnQixDQUFBO1FBQ2hCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxnREFBdUIsQ0FBQTtRQUN2QixXQUFBLHNEQUEwQixDQUFBO1FBQzFCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSw0QkFBa0IsQ0FBQTtRQUNsQixXQUFBLHdCQUFjLENBQUE7UUFDZCxZQUFBLHdDQUFtQixDQUFBO1FBQ25CLFlBQUEsOEJBQWMsQ0FBQTtRQUNkLFlBQUEsc0NBQWtCLENBQUE7UUFDbEIsWUFBQSxpREFBNEIsQ0FBQTtRQUM1QixZQUFBLDBCQUFZLENBQUE7UUFDWixZQUFBLDBDQUFvQixDQUFBO1FBQ3BCLFlBQUEsOENBQXNCLENBQUE7UUFDdEIsWUFBQSwyQkFBZ0IsQ0FBQTtRQUNoQixZQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFlBQUEsc0RBQTBCLENBQUE7UUFDMUIsWUFBQSxxQ0FBcUIsQ0FBQTtRQUNyQixZQUFBLDZDQUF5QixDQUFBO1FBQ3pCLFlBQUEsbUJBQVksQ0FBQTtRQUNaLFlBQUEsK0JBQWtCLENBQUE7UUFDbEIsWUFBQSxxQkFBYSxDQUFBO1FBQ2IsWUFBQSxpQkFBVyxDQUFBO1FBQ1gsWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFlBQUEsbUNBQW9CLENBQUE7UUFDcEIsWUFBQSxvREFBeUIsQ0FBQTtRQUN6QixZQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFlBQUEsMENBQW9CLENBQUE7UUFDcEIsWUFBQSw4Q0FBNkIsQ0FBQTtRQUM3QixZQUFBLGlDQUFtQixDQUFBO09BbkNULG1CQUFtQixDQXFDL0I7SUFFTSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLCtDQUFzQjtRQUk5RCxZQUNlLFdBQXlCLEVBQ1gseUJBQXFELEVBQzlELGdCQUFtQyxFQUMvQixvQkFBMkMsRUFDbkQsWUFBMkIsRUFDWixrQkFBZ0QsRUFDOUQsYUFBNkIsRUFDekIsaUJBQXFDLEVBQ3RCLGdDQUFtRSxFQUMxRSx5QkFBcUQsRUFDN0QsaUJBQXFDLEVBQzNDLFdBQXlCLEVBQ2Qsc0JBQStDLEVBQ25ELGtCQUF1QyxFQUMxQyxlQUFpQyxFQUN0QyxVQUF1QixFQUNkLG1CQUF5QyxFQUMxQyxrQkFBdUM7WUFFNUQsS0FBSyxDQUNKLFdBQVcsRUFDWCx5QkFBeUIsRUFDekIsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUNwQixZQUFZLEVBQ1osa0JBQWtCLEVBQ2xCLGFBQWEsRUFDYixpQkFBaUIsRUFDakIsZ0NBQWdDLEVBQ2hDLHlCQUF5QixFQUN6QixpQkFBaUIsRUFDakIsV0FBVyxFQUNYLHNCQUFzQixFQUN0QixrQkFBa0IsRUFDbEIsZUFBZSxFQUNmLG1CQUFtQixFQUNuQixVQUFVLEVBQ1Ysa0JBQWtCLENBQ2xCLENBQUM7WUExQ0ssb0JBQWUsR0FBbUMsU0FBUyxDQUFDO1lBQzVELGVBQVUsR0FBbUMsU0FBUyxDQUFDO1FBMEMvRCxDQUFDO1FBRUQsc0JBQXNCLENBQUMsS0FBeUI7WUFDL0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDOUIsQ0FBQztRQUVRLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBYSxFQUFFLE9BQThCO1lBQ3RFLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQztnQkFFakMsTUFBTSxLQUFLLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDekUsT0FBTztnQkFDTixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7Z0JBQzFCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO2dCQUNwQixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7Z0JBQ3BCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsUUFBUSxFQUFFLE1BQU07Z0JBQ2hCLEtBQUssRUFBRSxNQUFNLElBQUEsNkNBQWlDLEVBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDN0QsSUFBSSxFQUFFLEVBQUU7Z0JBQ1IsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsTUFBTSxFQUFFLEtBQUs7YUFDYixDQUFDO1FBQ0gsQ0FBQztRQUVELGlCQUFpQixDQUFDLEtBQXlCO1lBQzFDLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ3pCLENBQUM7UUFFUSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQWEsRUFBRSxLQUE2QixFQUFFLE9BQStCO1lBQ2pHLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM5QixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztnQkFFNUIsTUFBTSxLQUFLLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUMsQ0FBQztLQUNELENBQUE7SUF2Rlksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFLN0IsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxzREFBMEIsQ0FBQTtRQUMxQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLDRCQUFrQixDQUFBO1FBQ2xCLFdBQUEsNkRBQWlDLENBQUE7UUFDakMsV0FBQSxzREFBMEIsQ0FBQTtRQUMxQixZQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFlBQUEsMEJBQVksQ0FBQTtRQUNaLFlBQUEsZ0RBQXVCLENBQUE7UUFDdkIsWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFlBQUEsaUJBQVcsQ0FBQTtRQUNYLFlBQUEsMENBQW9CLENBQUE7UUFDcEIsWUFBQSxpQ0FBbUIsQ0FBQTtPQXRCVCxtQkFBbUIsQ0F1Ri9CO0lBRUQsTUFBYSwrQ0FBZ0QsU0FBUSwrQ0FBc0I7UUFHMUYsSUFBYSxRQUFRO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNuRyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7S0FDRDtJQVZELDBHQVVDO0lBRUQsTUFBYSxrQkFBbUIsU0FBUSxnQ0FBYztRQUVyRCxJQUF1QixpQkFBaUI7WUFDdkMsT0FBTztnQkFDTixFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLGtCQUFPLEVBQUU7Z0JBQzNDLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsa0JBQU8sRUFBRTtnQkFDM0MsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSx3QkFBYSxFQUFFO2FBQ2pELENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBdUIsaUJBQWlCLENBQUMsU0FBOEIsSUFBSSxDQUFDO0tBQzVFO0lBWEQsZ0RBV0M7SUFFRCxNQUFNLDhCQUErQixTQUFRLHVEQUFrQztRQUEvRTs7WUFDQyxTQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1gsQ0FBQztLQUFBO0lBRVksUUFBQSxzQkFBc0IsR0FBRyxJQUFJLDhCQUE4QixDQUFDLEVBQUUsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsMENBQWtCLENBQUMsQ0FBQztJQUUxSyxNQUFhLG1CQUFtQjtRQUkvQixZQUFZLENBQ1gsT0FBc0ksRUFDdEksSUFBMEQsRUFDMUQsV0FBaUU7WUFFakUsT0FBTyxJQUFJLENBQUMsbUJBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixDQUFDO0tBQ0Q7SUFYRCxrREFXQztJQUVELE1BQWEsc0JBQXNCO1FBQW5DO1lBSUMsMkJBQXNCLEdBQTBDLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFJNUUsQ0FBQztRQUZBLDJCQUEyQixDQUFDLFNBQStCLElBQWlCLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLGFBQWEsQ0FBQyxJQUFTLEVBQUUsZ0JBQXlCLEVBQUUsVUFBNEIsSUFBNkIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO0tBQ2hJO0lBUkQsd0RBUUM7SUFFRCxNQUFhLGVBQWU7UUFJM0IsVUFBVSxDQUFDLEdBQVcsRUFBRSx3QkFBNEM7WUFDbkUsT0FBTztnQkFDTixXQUFXLEVBQUUsYUFBSyxDQUFDLElBQUk7Z0JBQ3ZCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO2dCQUN4QixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTthQUNwQixDQUFDO1FBQ0gsQ0FBQztRQUVELGlCQUFpQjtZQUNoQixVQUFVO1FBQ1gsQ0FBQztLQUNEO0lBZkQsMENBZUM7SUFFTSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQU1qQyxZQUNnQyxXQUF5QjtZQUF6QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztRQUNyRCxDQUFDO1FBQ0wsS0FBSyxDQUFDLGVBQWUsQ0FBQyxhQUFzQixJQUFrQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25HLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxhQUFzQixJQUFrQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxhQUFzQixJQUFrQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hHLEtBQUssQ0FBQyxhQUFhLENBQUMsYUFBc0IsSUFBa0IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRyxxQkFBcUIsQ0FBQyxRQUE2QixJQUFrQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLGVBQWUsQ0FBQyxRQUE2QixJQUFrQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNGLGlCQUFpQixDQUFDLFFBQTZCLElBQWtCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0Ysb0JBQW9CLENBQUMsUUFBNkIsSUFBa0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUdoRyxpQkFBaUIsQ0FBQyxJQUFTLElBQVUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELGNBQWMsQ0FBQyxVQUFlLEVBQUUsb0JBQStCLElBQThCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZJLGNBQWMsQ0FBQyxRQUE0QixJQUE4QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdHLGNBQWMsQ0FBQyxRQUE0QixJQUFnQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRS9HLGdCQUFnQixDQUFDLE1BQXFCLElBQVUsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzlFLGVBQWUsQ0FBQyxvQkFBc0MsSUFBNEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0gsQ0FBQTtJQTNCWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQU8vQixXQUFBLDBCQUFZLENBQUE7T0FQRixxQkFBcUIsQ0EyQmpDO0lBRUQsTUFBYSxpQkFBaUI7UUFBOUI7WUFJQyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7WUFFN0IsMkJBQXNCLEdBQWUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUNqRSw2QkFBd0IsR0FBZSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ25FLHdCQUFtQixHQUFzQixFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ3JFLDBCQUFxQixHQUFzQixFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBRXZFLGtCQUFhLEdBQWdCLG1CQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUN0RCxlQUFVLEdBQUcsQ0FBQyxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QyxvQkFBZSxHQUFnQixtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFFeEQsdUJBQWtCLEdBQW1CLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDaEQsd0NBQW1DLEdBQW1CLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDakUsK0JBQTBCLEdBQW9ELGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDekYsNkJBQXdCLEdBQWtCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDckQsOEJBQXlCLEdBQTBCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDOUQsOEJBQXlCLEdBQWdCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDcEQsNkJBQXdCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUN0QywrQkFBMEIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hDLHlCQUFvQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDbEMsdUNBQWtDLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNoRCxzQkFBaUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQy9CLCtCQUEwQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFJeEMsY0FBUyxHQUFrQixPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3RELGlCQUFZLEdBQWtCLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUF5QzFELENBQUM7UUE1Q0EsTUFBTSxLQUFXLENBQUM7UUFDbEIsVUFBVSxLQUFjLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUd0QyxRQUFRLENBQUMsS0FBWSxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNqRCxTQUFTLENBQUMsS0FBWSxJQUFVLENBQUM7UUFDakMsbUJBQW1CLEtBQWMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2hELHlCQUF5QixLQUF5QixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDckUsU0FBUyxDQUFDLEtBQVksSUFBYSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakQsWUFBWSxLQUFrQixPQUFPLElBQUssQ0FBQyxDQUFDLENBQUM7UUFDN0MseUJBQXlCLEtBQUssT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ2pELGdCQUFnQixLQUFjLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM3QyxpQkFBaUIsS0FBYyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUMsbUJBQW1CLEtBQWMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2hELG9CQUFvQixDQUFDLE9BQWdCLElBQVUsQ0FBQztRQUNoRCxlQUFlLENBQUMsT0FBZ0IsSUFBVSxDQUFDO1FBQzNDLGVBQWUsS0FBYyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDNUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxPQUFnQixJQUFtQixDQUFDO1FBQzFELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFnQixJQUFtQixDQUFDO1FBQzNELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxPQUFnQixJQUFtQixDQUFDO1FBQ2hFLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBZ0IsRUFBRSxJQUFXLElBQW1CLENBQUM7UUFDckUsYUFBYSxLQUFjLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMxQyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQWdCLElBQW1CLENBQUM7UUFDekQsb0JBQW9CLEtBQVcsQ0FBQztRQUNoQyxnQkFBZ0IsS0FBYyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDN0Msb0JBQW9CLEtBQXdCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakYsYUFBYSxLQUFXLENBQUM7UUFDekIsa0JBQWtCLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLGdCQUFnQixLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxpQkFBaUIsS0FBcUIsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3hELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxTQUF1QixJQUFtQixDQUFDO1FBQ2xFLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxVQUEwQixJQUFtQixDQUFDO1FBQ3RFLFFBQVEsQ0FBQyxNQUFjLElBQVUsQ0FBQztRQUNsQyxXQUFXLENBQUMsTUFBYyxJQUFVLENBQUM7UUFDckMsMEJBQTBCLEtBQWlCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEYsYUFBYSxLQUFXLENBQUM7UUFDekIsMEJBQTBCLEtBQWMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELHNCQUFzQixDQUFDLE9BQWdCLElBQVUsQ0FBQztRQUNsRCxVQUFVLENBQUMsS0FBWSxFQUFFLGdCQUF3QixFQUFFLGlCQUF5QixJQUFVLENBQUM7UUFDdkYsWUFBWSxDQUFDLElBQVUsSUFBaUIsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakUsaUJBQWlCLENBQUMsWUFBb0IsSUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDekQsMEJBQTBCLENBQUMsWUFBb0IsRUFBRSxTQUFrQixJQUFVLENBQUM7UUFDOUUsc0JBQXNCLENBQUMsSUFBVyxFQUFFLFNBQW9CLElBQXVCLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNsRyxLQUFLLEtBQUssQ0FBQztLQUNYO0lBeEVELDhDQXdFQztJQUVELE1BQU0sYUFBYSxHQUFrQixFQUFTLENBQUM7SUFFL0MsTUFBYSx3QkFBeUIsU0FBUSxzQkFBVTtRQVF2RDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBSEQsVUFBSyxHQUFHLElBQUksR0FBRyxFQUE2QyxDQUFDO1lBS3BFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxzQ0FBOEIsSUFBSSxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyx3Q0FBZ0MsSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFDO1lBRXJFLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxhQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyw0RUFBNEQsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLHNCQUFzQixFQUFFLFNBQVMsQ0FBQyxFQUFFLEdBQUcsT0FBTyxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xQLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxhQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyw0RUFBNEQsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLHVCQUF1QixFQUFFLFNBQVMsQ0FBQyxFQUFFLEdBQUcsT0FBTyxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JQLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxFQUFzQixFQUFFLHFCQUE0QyxFQUFFLEtBQWU7WUFDdEcsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELHNCQUFzQixDQUFDLHFCQUE0QztZQUNsRSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDL0UsQ0FBQztRQUNELGdCQUFnQixDQUFDLEVBQVUsRUFBRSxxQkFBNEM7WUFDeEUsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBQ0QsaUJBQWlCLENBQUMscUJBQTRDO1lBQzdELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxRSxDQUFDO1FBQ0Qsb0JBQW9CLENBQUMsRUFBVSxFQUFFLHFCQUE0QztZQUM1RSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFDRCx1QkFBdUIsQ0FBQyxxQkFBNEM7WUFDbkUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUN6RSxDQUFDO1FBQ0QsNEJBQTRCLENBQUMscUJBQTRDO1lBQ3hFLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztRQUNyRixDQUFDO1FBRUQseUJBQXlCLENBQUMscUJBQTRDO1lBQ3JFLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsMEJBQTBCLENBQUMscUJBQTRDO1lBQ3RFLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsaUJBQWlCLENBQUMscUJBQTRDO1lBQzdELE9BQU8sSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO0tBQ0Q7SUFuREQsNERBbURDO0lBRUQsTUFBYSxlQUFlO1FBQTVCO1lBR0MsZ0NBQTJCLEdBQUcsSUFBSSxlQUFPLEVBQTJCLENBQUM7WUFDckUsa0NBQTZCLEdBQUcsSUFBSSxlQUFPLEVBQTJCLENBQUM7WUFDdkUsNEJBQXVCLEdBQUcsSUFBSSxlQUFPLEVBQWtCLENBQUM7WUFDeEQsNkJBQXdCLEdBQUcsSUFBSSxlQUFPLEVBQWtCLENBQUM7WUFFaEQsV0FBTSxzREFBc0I7WUFDckMsWUFBTyxHQUFnQixTQUFVLENBQUM7WUFDbEMsaUJBQVksR0FBRyxDQUFDLENBQUM7WUFDakIsaUJBQVksR0FBRyxDQUFDLENBQUM7WUFDakIsa0JBQWEsR0FBRyxDQUFDLENBQUM7WUFDbEIsa0JBQWEsR0FBRyxDQUFDLENBQUM7WUFDbEIsZ0JBQVcsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3pCLDJCQUFzQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUM7WUFDNUQsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQztRQWUvRCxDQUFDO1FBYkEsaUJBQWlCLENBQUMsRUFBVSxFQUFFLEtBQWUsSUFBeUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxSCxpQkFBaUIsS0FBZ0MsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdELGNBQWMsS0FBZ0MsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFELHNCQUFzQixLQUFxQixPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDbEUsbUJBQW1CLEtBQWEsT0FBTyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7UUFDbkUsZ0JBQWdCLENBQUMsRUFBVSxJQUF5QyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdkYsb0JBQW9CLENBQUMsRUFBVSxJQUFJLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN0RCx1QkFBdUIsS0FBVyxDQUFDO1FBQ25DLDRCQUE0QixLQUFhLE9BQU8sU0FBVSxDQUFDLENBQUMsQ0FBQztRQUM3RCxPQUFPLEtBQUssQ0FBQztRQUNiLHlCQUF5QixLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQywwQkFBMEIsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDLEtBQWEsRUFBRSxNQUFjLEVBQUUsR0FBVyxFQUFFLElBQVksSUFBVSxDQUFDO0tBQzFFO0lBL0JELDBDQStCQztJQUVELE1BQWEsYUFBYTtRQUExQjtZQUdDLFlBQU8sR0FBZ0IsU0FBVSxDQUFDO1lBQ2xDLGlCQUFZLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLGlCQUFZLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLGtCQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLGtCQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLGdCQUFXLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUN6QiwyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBa0IsQ0FBQyxLQUFLLENBQUM7WUFDN0QsNEJBQXVCLEdBQUcsSUFBSSxlQUFPLEVBQWtCLENBQUMsS0FBSyxDQUFDO1lBQ3JELFdBQU0sZ0VBQTJCO1FBYzNDLENBQUM7UUFaQSxLQUFLLENBQUMsaUJBQWlCLENBQUMsRUFBVyxFQUFFLEtBQWUsSUFBd0IsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQy9GLGdCQUFnQixDQUFDLEVBQVUsSUFBUyxPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDM0QsaUJBQWlCLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLHlCQUF5QixLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQywwQkFBMEIsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0Msc0JBQXNCLEtBQXFCLE9BQU8sYUFBYSxDQUFDLENBQUMsQ0FBQztRQUNsRSxrQkFBa0IsQ0FBQyxFQUFVLEVBQUUsT0FBZ0IsSUFBVSxDQUFDO1FBQzFELE9BQU8sS0FBSyxDQUFDO1FBQ2Isb0JBQW9CLENBQUMsRUFBVSxJQUFJLE9BQU8sSUFBSyxDQUFDLENBQUMsQ0FBQztRQUNsRCx1QkFBdUIsS0FBVyxDQUFDO1FBQ25DLDRCQUE0QixLQUFhLE9BQU8sU0FBVSxDQUFDLENBQUMsQ0FBQztRQUM3RCxNQUFNLENBQUMsS0FBYSxFQUFFLE1BQWMsRUFBRSxHQUFXLEVBQUUsSUFBWSxJQUFVLENBQUM7S0FDMUU7SUF6QkQsc0NBeUJDO0lBRUQsTUFBYSxnQkFBZ0I7UUFBN0I7WUFJQyx1Q0FBa0MsR0FBRyxJQUFJLGVBQU8sRUFBcUUsQ0FBQyxLQUFLLENBQUM7WUFNNUgscUNBQWdDLEdBQUcsSUFBSSxlQUFPLEVBQW9DLENBQUM7WUFDbkYsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQztZQUN4RSxrQ0FBNkIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3BELDJCQUFzQixHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLENBQUM7UUFTbkUsQ0FBQztRQWpCQSxzQkFBc0IsQ0FBQyxFQUFVLElBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzVELHVCQUF1QixLQUEyQixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEUsaUJBQWlCLENBQUMsRUFBVSxFQUFFLEtBQWUsSUFBb0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoSCxrQkFBa0IsQ0FBQyxFQUFVLElBQVUsQ0FBQztRQU14QyxhQUFhLENBQUMsRUFBVSxJQUFhLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuRCxtQkFBbUIsQ0FBa0IsRUFBVSxJQUFjLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMzRSxhQUFhLENBQWtCLEVBQVUsSUFBYyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDckUsUUFBUSxDQUFrQixFQUFVLEVBQUUsS0FBMkIsSUFBdUIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2SCxTQUFTLENBQUMsRUFBVSxJQUFVLENBQUM7UUFDL0Isd0JBQXdCLENBQUMsRUFBVSxJQUFJLE9BQU8sSUFBSyxDQUFDLENBQUMsQ0FBQztRQUN0RCxnQ0FBZ0MsQ0FBQyxFQUFVLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdELGtCQUFrQixLQUFhLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUMzQztJQXRCRCw0Q0FzQkM7SUFFRCxNQUFhLHVCQUF1QjtRQUluQyxZQUFtQixTQUFnQyxFQUFFO1lBQWxDLFdBQU0sR0FBTixNQUFNLENBQTRCO1lBRTVDLFVBQUssR0FBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVoRCxhQUFRLEdBQUcsbUJBQVUsQ0FBQyxjQUFjLENBQUM7WUFFckMsbUNBQThCLEdBQTJDLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDcEYsMkJBQXNCLEdBQXdCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDekQsdUJBQWtCLEdBQXdCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDckQsa0JBQWEsR0FBd0IsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNoRCxxQkFBZ0IsR0FBd0IsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNuRCxtQkFBYyxHQUF3QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2pELDBCQUFxQixHQUF3QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hELDBCQUFxQixHQUF3QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hELDJCQUFzQixHQUF3QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3pELDhCQUF5QixHQUFtQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3ZELGdCQUFXLEdBQXNCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDNUMsaUNBQTRCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUMxQyxnQkFBVyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFekIsZ0JBQVcsdUNBQStCO1lBQzFDLFlBQU8sR0FBRyxJQUFJLENBQUM7WUFDZixjQUFTLEdBQWtCLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEQsaUJBQVksR0FBa0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN6RCx1QkFBa0IsR0FBRyxLQUFLLENBQUM7WUFFM0IscUJBQWdCLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztZQW1DdEMsYUFBUSxHQUFHLElBQUksQ0FBQztRQTdEZ0MsQ0FBQztRQTRCMUQsSUFBSSxXQUFXLEtBQW1CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxTQUFTLEtBQW1CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsSUFBSSxLQUFLLEtBQWEsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFbEQsT0FBTyxDQUFDLEtBQTRCLElBQWlCLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuRSxTQUFTLENBQUMsTUFBb0IsSUFBNkIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNoRixRQUFRLENBQUMsVUFBa0IsSUFBOEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JILFFBQVEsQ0FBQyxXQUFtQixJQUFZLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMzRCxTQUFTLENBQUMsTUFBdUIsRUFBRSxPQUErQixFQUFFLEtBQWUsSUFBa0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxSSxhQUFhLENBQUMsTUFBNkIsSUFBa0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRyxZQUFZLENBQUMsTUFBNkIsSUFBa0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRyxPQUFPLENBQUMsTUFBNkIsSUFBdUMsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqSCxPQUFPLENBQUMsTUFBNkIsRUFBRSxLQUF3QyxJQUFVLENBQUM7UUFDMUYsYUFBYSxDQUFDLFlBQStCLElBQVUsQ0FBQztRQUN4RCxtQkFBbUIsS0FBVyxDQUFDO1FBQy9CLGlCQUFpQixLQUFjLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsaUJBQWlCLEtBQVcsQ0FBQztRQUM3QixXQUFXLENBQUMsT0FBMEIsSUFBVSxDQUFDO1FBQ2pELFNBQVMsS0FBd0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxtQkFBbUIsQ0FBQyxZQUE4QixJQUFVLENBQUM7UUFDN0QsUUFBUSxDQUFDLFNBQWdDLEVBQUUsVUFBMEIsSUFBa0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1SCxXQUFXLENBQUMsTUFBNkIsSUFBVSxDQUFDO1FBQ3BELFNBQVMsQ0FBQyxNQUE2QixFQUFFLFNBQWdDLEVBQUUsVUFBMEIsSUFBa0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1SixVQUFVLENBQUMsTUFBNkIsRUFBRSxPQUE4QixFQUFFLFFBQTZCLElBQWtCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUosY0FBYyxDQUFDLE1BQTZCLElBQWtCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkcsU0FBUyxDQUFDLE1BQTZCLEVBQUUsU0FBZ0MsRUFBRSxVQUEwQixJQUFrQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVKLFlBQVksQ0FBQyxNQUFlLElBQVUsQ0FBQztRQUN2QyxnQkFBZ0IsS0FBYyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDN0Msc0JBQXNCLENBQUMsU0FBc0IsRUFBRSxRQUFtQyxJQUFpQixPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUc1SCxrQkFBa0IsQ0FBQyxPQUEyQixJQUFpQixPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUd4RixrQkFBa0IsQ0FBQyxJQUFTLElBQWlCLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLHlCQUF5QixLQUFvQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFHO0lBcEVELDBEQW9FQztJQUVELE1BQWEsbUJBQW1CO1FBRS9CLFlBQW1CLEVBQVU7WUFBVixPQUFFLEdBQUYsRUFBRSxDQUFRO1lBRTdCLGFBQVEsR0FBRyxtQkFBVSxDQUFDLGNBQWMsQ0FBQztZQUNyQyxlQUFVLEdBQXNCLFNBQVUsQ0FBQztZQU8zQyxZQUFPLEdBQTJCLEVBQUUsQ0FBQztZQUtyQyxpQkFBWSxHQUFrQixPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBU3pELFlBQU8sR0FBRyxJQUFJLENBQUM7WUFFZixrQkFBYSxHQUFnQixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hDLHFCQUFnQixHQUFrQyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzdELHNCQUFpQixHQUE2QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3pELHFCQUFnQixHQUE2QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hELHdCQUFtQixHQUF1QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3JELGVBQVUsR0FBZ0IsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNyQyxnQkFBVyxHQUE2QyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ25FLHFCQUFnQixHQUFnQyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNELHFCQUFnQixHQUFnQyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNELDRCQUF1QixHQUFvQyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBbkNyQyxDQUFDO1FBcUNsQyxVQUFVLENBQUMsTUFBcUIsSUFBNEIsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLFdBQVcsQ0FBQyxTQUFjLElBQTRCLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsRSxnQkFBZ0IsQ0FBQyxNQUFjLElBQWlCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsZ0JBQWdCLENBQUMsT0FBb0IsSUFBWSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxPQUFPLENBQUMsTUFBbUIsSUFBYSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxDQUFDLE1BQW1CLElBQWEsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RELFVBQVUsQ0FBQyxPQUFvQixFQUFFLFFBQXlCLElBQTBCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekgsV0FBVyxDQUFDLFFBQWtDLElBQTBCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0csUUFBUSxDQUFDLE9BQW9CLElBQWEsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3pELFFBQVEsQ0FBQyxPQUFvQixJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN6RCxXQUFXLENBQUMsT0FBb0IsSUFBYSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDNUQsUUFBUSxDQUFDLE9BQTBDLElBQWEsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9FLFFBQVEsQ0FBQyxTQUE0QyxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNqRixVQUFVLENBQUMsT0FBb0IsRUFBRSxPQUFxQixFQUFFLFFBQXlCLElBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzVHLFdBQVcsQ0FBQyxRQUFrQyxFQUFFLE9BQXFCLElBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLFVBQVUsQ0FBQyxPQUFvQixFQUFFLE9BQXFCLEVBQUUsUUFBeUIsSUFBVSxDQUFDO1FBQzVGLFdBQVcsQ0FBQyxRQUFrQyxFQUFFLE9BQXFCLElBQVUsQ0FBQztRQUNoRixLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXFCLEVBQUUsT0FBNkIsSUFBc0IsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzFHLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBNkMsRUFBRSxPQUE2QixJQUFzQixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbkksS0FBSyxDQUFDLGVBQWUsQ0FBQyxPQUFpQyxJQUFzQixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0YsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUE4QixJQUFtQixDQUFDO1FBQ3ZFLFNBQVMsQ0FBQyxPQUFxQixJQUFVLENBQUM7UUFDMUMsV0FBVyxDQUFDLE1BQWdDLElBQVUsQ0FBQztRQUN2RCxhQUFhLENBQUMsTUFBZ0MsSUFBVSxDQUFDO1FBQ3pELElBQUksQ0FBQyxNQUFlLElBQVUsQ0FBQztRQUMvQixLQUFLLEtBQVcsQ0FBQztRQUNqQixJQUFJLHVCQUF1QixLQUF5QixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLFNBQVMsQ0FBQyxTQUFrQixJQUFVLENBQUM7UUFDdkMsa0JBQWtCLENBQUMsTUFBYyxJQUFVLENBQUM7UUFDNUMsa0JBQWtCLENBQUMsTUFBYyxJQUFVLENBQUM7UUFDNUMsT0FBTyxLQUFXLENBQUM7UUFDbkIsTUFBTSxLQUFhLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEQsTUFBTSxDQUFDLE1BQWMsRUFBRSxPQUFlLElBQVUsQ0FBQztRQUNqRCxRQUFRLEtBQUssQ0FBQztRQUNkLG1CQUFtQixDQUFDLGVBQTRCLElBQXdFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDN0o7SUExRUQsa0RBMEVDO0lBRUQsTUFBYSx1QkFBdUI7UUFBcEM7WUFFQyxVQUFLLEdBQVcsRUFBRSxDQUFDO1lBQ25CLGFBQVEsR0FBRyxtQkFBVSxDQUFDLGNBQWMsQ0FBQztZQUVyQyxXQUFNLEdBQXVCLEVBQUUsQ0FBQztZQUdoQyxnQkFBVyxHQUF1QixFQUFFLEdBQUcsb0NBQTJCLEVBQUUsQ0FBQztZQUVyRSxpQ0FBNEIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzFDLDBCQUFxQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFjcEMsQ0FBQztRQVpBLFFBQVEsQ0FBQyxVQUFrQixJQUFrQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFHLFNBQVMsQ0FBQyxLQUFrQixJQUF3QixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLGFBQWEsQ0FBQyxVQUFxQyxJQUFzQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RILFlBQVksQ0FBQyxVQUFxQyxJQUFzQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JILFFBQVEsQ0FBQyxRQUFtQyxFQUFFLFNBQXlCLElBQXNCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUksVUFBVSxDQUFDLEtBQWdDLEVBQUUsTUFBaUMsRUFBRSxPQUF3QyxJQUFzQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNMLFNBQVMsQ0FBQyxLQUFnQyxFQUFFLFFBQW1DLEVBQUUsU0FBeUIsSUFBc0IsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3SyxTQUFTLENBQUMsS0FBZ0MsRUFBRSxRQUFtQyxFQUFFLFNBQXlCLElBQXNCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0ssV0FBVyxDQUFDLEtBQWdDLElBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRyxhQUFhLENBQUMsV0FBOEIsRUFBRSxNQUE4QyxJQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkosbUJBQW1CLENBQUMsS0FBZ0MsSUFBVSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNHLGlCQUFpQixDQUFDLEtBQWdDLElBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN6RztJQXpCRCwwREF5QkM7SUFFRCxNQUFhLGlCQUFrQixTQUFRLHNCQUFVO1FBYWhELElBQVcsdUJBQXVCLEtBQTRDLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztRQUNySCxJQUFXLHVCQUF1QixDQUFDLEtBQTRDLElBQUksSUFBSSxDQUFDLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFNM0gsSUFBVyxZQUFZLEtBQThCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDakYsSUFBVyxZQUFZLENBQUMsS0FBOEIsSUFBSSxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFTdkYsWUFBb0Isa0JBQXlDO1lBQzVELEtBQUssRUFBRSxDQUFDO1lBRFcsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUF1QjtZQTFCN0QsNEJBQXVCLEdBQWdCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDbEQsOEJBQXlCLEdBQWdCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDcEQsdUJBQWtCLEdBQStCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDNUQscUJBQWdCLEdBQWdDLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDM0QscUJBQWdCLEdBQTZCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDeEQsd0JBQW1CLEdBQTZCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDM0QseUNBQW9DLEdBQWdCLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFhL0QsWUFBTyxHQUEyQixFQUFFLENBQUM7WUFDckMsOEJBQXlCLEdBQWlDLEVBQUUsQ0FBQztZQUM3RCx1QkFBa0IsR0FBa0MsRUFBRSxDQUFDO1lBQ3ZELDhCQUF5QixHQUFHLEVBQUUsQ0FBQztZQUMvQixtQkFBYyxHQUEyQixFQUFFLENBQUM7WUFDNUMsVUFBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBSTVCLENBQUM7UUFDRCxZQUFZLENBQUMscUJBQTZDLElBQW9CLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1RixVQUFVLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNCLFdBQVcsS0FBSyxPQUFPLEVBQVMsQ0FBQyxDQUFDLENBQUM7UUFJbkMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUF5QyxFQUFFLGNBQWdELEVBQUUsS0FBc0I7WUFDbkksZ0ZBQWdGO1lBQ2hGLDZDQUE2QztZQUM3QyxJQUFJLFNBQVMsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUNELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBeUIsRUFBRSxPQUE2QixJQUFtQixDQUFDO1FBQzlGLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBNEIsRUFBRSxPQUE2QixJQUFtQixDQUFDO1FBQ2xHLDBCQUEwQixDQUFDLE1BQXlDO1lBQ25FLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLE1BQXFCLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUNELFdBQVcsQ0FBQyxRQUFhLEVBQUUsTUFBWSxJQUE0QixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hHLFFBQVEsQ0FBQyxPQUF1QyxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM1RSxTQUFTLENBQUMsT0FBb0IsSUFBYSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDMUQsY0FBYyxDQUFDLFFBQWEsRUFBRSxNQUFXLElBQUksT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRixJQUFJLENBQUMsT0FBNEIsRUFBRSxPQUE2QixJQUFpQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlJLE9BQU8sQ0FBQyxPQUE2QixJQUFpQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ILE1BQU0sQ0FBQyxPQUE0QixFQUFFLE9BQXdCLElBQXNCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEksU0FBUyxDQUFDLE9BQWtDLElBQXNCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0c7SUFoRUQsOENBZ0VDO0lBRUQsTUFBYSxlQUFlO1FBQTVCO1lBSWtCLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFvQixDQUFDO1lBSXBELHVCQUFrQixHQUFHLElBQUksZUFBTyxFQUFzQixDQUFDO1lBSXZELCtDQUEwQyxHQUFHLElBQUksZUFBTyxFQUE4QyxDQUFDO1lBSWhILHNDQUFpQyxHQUFHLElBQUksZUFBTyxFQUFzQyxDQUFDO1lBQ3JGLHFDQUFnQyxHQUFHLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUM7WUFDaEYsb0JBQWUsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBRTlCLFlBQU8sR0FBRyxZQUFZLENBQUM7WUFHL0IsYUFBUSxHQUFHLEtBQUssQ0FBQztZQXNCUixpQkFBWSxHQUFHLElBQUksaUJBQVcsRUFBVyxDQUFDO1lBSW5ELHlCQUFvQixHQUFzQixTQUFTLENBQUM7WUE0QnBELDBCQUFxQixHQUFzQixTQUFTLENBQUM7WUFrQnJELCtDQUEwQyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFaEQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1lBMkNsRCxZQUFPLEdBQVUsRUFBRSxDQUFDO1FBZ0I5QixDQUFDO1FBdkpBLElBQUksZ0JBQWdCLEtBQThCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDeEYsZUFBZSxDQUFDLEtBQXVCLElBQVUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFHdEYsSUFBSSxpQkFBaUIsS0FBZ0MsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM1RixrQkFBa0IsQ0FBQyxLQUF5QixJQUFVLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRzVGLElBQUkseUNBQXlDLEtBQXdELE9BQU8sSUFBSSxDQUFDLDBDQUEwQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDcEssNkNBQTZDLENBQUMsS0FBaUQsSUFBVSxJQUFJLENBQUMsMENBQTBDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQVd2SyxVQUFVLENBQUMsT0FBZSxJQUFVLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3RCxVQUFVLEtBQWEsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3QyxrQkFBa0IsS0FBVSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBSTFELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBYSxFQUFFLFFBQThCO1lBQzFELE9BQU8sSUFBQSxzQ0FBYyxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELElBQUksQ0FBQyxRQUFhO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUE2RDtZQUM3RSxNQUFNLEtBQUssR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpJLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBSUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFjLElBQXNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFJNUYsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFhLEVBQUUsT0FBc0M7WUFDbkUsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDL0IsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUM7WUFDakMsQ0FBQztZQUVELElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO1lBRWhDLE9BQU87Z0JBQ04sR0FBRyxJQUFBLHNDQUFjLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQzFDLEtBQUssRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2FBQ3hDLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFhLEVBQUUsT0FBNEM7WUFDL0UsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDL0IsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUM7WUFDakMsQ0FBQztZQUVELElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO1lBRWhDLE9BQU87Z0JBQ04sR0FBRyxJQUFBLHNDQUFjLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQzFDLEtBQUssRUFBRSxJQUFBLHVCQUFjLEVBQUMsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3hELENBQUM7UUFDSCxDQUFDO1FBSUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFhLEVBQUUsZ0JBQTZDLEVBQUUsT0FBMkI7WUFDeEcsTUFBTSxJQUFBLGVBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQztZQUVqQixJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztZQUNsQyxDQUFDO1lBRUQsT0FBTyxJQUFBLHNDQUFjLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQVksRUFBRSxPQUFZLEVBQUUsVUFBb0IsSUFBb0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6SCxJQUFJLENBQUMsT0FBWSxFQUFFLE9BQVksRUFBRSxVQUFvQixJQUFvQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pILEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBWSxFQUFFLE9BQVksSUFBbUIsQ0FBQztRQUM5RCxVQUFVLENBQUMsU0FBYyxFQUFFLFFBQXNDLEVBQUUsUUFBNkIsSUFBb0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwSyxZQUFZLENBQUMsU0FBYyxJQUFvQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBTS9GLGdCQUFnQixDQUFDLE1BQWMsRUFBRSxRQUE2QjtZQUM3RCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFckMsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsV0FBVyxDQUFDLE1BQWM7WUFDekIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE9BQWU7WUFDckMsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUFhLElBQXNCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsV0FBVyxDQUFDLFFBQWEsSUFBYSxPQUFPLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2SCxnQkFBZ0I7WUFDZixPQUFPO2dCQUNOLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLFlBQVksK0RBQXVELEVBQUU7Z0JBQzdGLEdBQUcsbUJBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEcsQ0FBQztRQUNILENBQUM7UUFDRCxhQUFhLENBQUMsUUFBYSxFQUFFLFVBQTBDO1lBQ3RFLElBQUksVUFBVSxnRUFBcUQsSUFBSSxrQkFBTyxFQUFFLENBQUM7Z0JBQ2hGLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRW5ELE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQWMsRUFBRSxRQUFzRCxJQUFtQixDQUFDO1FBRXBHLGFBQWEsQ0FBQyxRQUFhLEVBQUUsT0FBc0I7WUFDbEQsT0FBTztnQkFDTixXQUFXLEVBQUUsYUFBSyxDQUFDLElBQUk7Z0JBQ3ZCLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO2FBQ2xCLENBQUM7UUFDSCxDQUFDO1FBTUQsS0FBSyxDQUFDLFNBQWM7WUFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFN0IsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBRUQsZ0JBQWdCLENBQUMsU0FBYyxJQUF1QixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25HLE9BQU8sS0FBVyxDQUFDO1FBRW5CLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBVyxFQUFFLE9BQTRCLElBQTJCLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0RyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQVcsRUFBRSxNQUFXLEVBQUUsU0FBK0IsSUFBMkIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hILEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBVyxFQUFFLE1BQVcsRUFBRSxTQUErQixJQUEyQixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEgsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFhLEVBQUUsT0FBeUYsSUFBMkIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ2pLO0lBNUpELDBDQTRKQztJQUVELE1BQWEsNEJBQTZCLFNBQVEsMkRBQWdDO1FBSWpGO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFIQSxhQUFRLEdBQWdDLElBQUksR0FBRyxFQUFFLENBQUM7UUFJM0QsQ0FBQztRQUVELGtCQUFrQixDQUFDLGlCQUFxQztZQUN2RCxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLDZCQUFxQixDQUFDLFVBQVUsQ0FBQztZQUM1RSxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDNUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVsRixPQUFPLFVBQVUsQ0FBQyxlQUFlLENBQUMsS0FBSywwQ0FBa0MsQ0FBQztRQUMzRSxDQUFDO1FBRVEsS0FBSyxDQUFDLE9BQU8sQ0FBbUMsVUFBa0M7WUFDMUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFOUIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7S0FDRDtJQXJCRCxvRUFxQkM7SUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxRQUFhO1FBQ25ELE9BQU8sb0JBQW9CLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxTQUFnQixvQkFBb0IsQ0FBQyxRQUFhLEVBQUUsTUFBTSxHQUFHLGtCQUFrQjtRQUM5RSxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRCxNQUFhLG9DQUFxQyxTQUFRLDBEQUErQjtRQU94RjtZQUNDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLE1BQU0sa0JBQWtCLEdBQUcsOEJBQXNCLENBQUM7WUFDbEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBYyxFQUFFLENBQUM7WUFDeEMsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNqRSxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdURBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRyxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBTyxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksdURBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6SCxLQUFLLENBQUMsSUFBSSwwQ0FBa0IsQ0FBQyw2QkFBYSxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTFGLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1lBRTNCLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELGtCQUFrQjtZQUNqQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztRQUVELGtCQUFrQjtZQUNqQixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRVEsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFrQyxFQUFFLE9BQW1ELEVBQUUsU0FBa0IsRUFBRSxJQUFVLEVBQUUsS0FBeUI7WUFDdkssTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVoRSxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRyxFQUFFLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFUSxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQWtDO1lBQzlELE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXZDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFHLEVBQUUsQ0FBQztZQUNwQyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxVQUFrQztZQUN6RCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekQsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVyRSxPQUFPLFlBQVksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEMsQ0FBQztLQUNEO0lBNURELG9GQTREQztJQUVELE1BQWEsb0JBQXFCLFNBQVEsc0JBQVU7UUFBcEQ7O1lBSUMsY0FBUyxHQUFHLEtBQUssQ0FBQztZQWdCRCxnQkFBVyxHQUFHLElBQUksdUJBQWUsRUFBUSxDQUFDO1lBQzFDLGNBQVMsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztZQUN4QyxpQkFBWSxHQUFHLElBQUksdUJBQWUsRUFBUSxDQUFDO1lBQzNDLG1CQUFjLEdBQUcsSUFBSSx1QkFBZSxFQUFRLENBQUM7WUFrQjdDLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQStCLENBQUMsQ0FBQztZQUcvRSwyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE0QixDQUFDLENBQUM7WUFHakYsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUd0RCxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUduRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBR3RFLG9CQUFlLEdBQW9CLEVBQUUsQ0FBQztRQXVCdkMsQ0FBQztRQXpFQSxJQUFJLEtBQUssS0FBcUIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLEtBQUssQ0FBQyxLQUFxQjtZQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLEtBQUssb0NBQTRCLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixDQUFDO2lCQUFNLElBQUksS0FBSyxpQ0FBeUIsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzNCLENBQUM7aUJBQU0sSUFBSSxLQUFLLG9DQUE0QixFQUFFLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxJQUFJLEtBQUssc0NBQThCLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztRQU1ELEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBcUI7WUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLEtBQUssb0NBQTRCLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDO2lCQUFNLElBQUksS0FBSyxpQ0FBeUIsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLENBQUM7aUJBQU0sSUFBSSxLQUFLLG9DQUE0QixFQUFFLENBQUM7Z0JBQzlDLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDM0IsQ0FBQztpQkFBTSxJQUFJLEtBQUssc0NBQThCLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUM3QixDQUFDO1FBQ0YsQ0FBQztRQUtELElBQUksZ0JBQWdCLEtBQXlDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHbkcsSUFBSSxxQkFBcUIsS0FBc0MsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUcxRyxJQUFJLGNBQWMsS0FBa0IsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHeEUsSUFBSSxjQUFjLEtBQStCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBR3JGLElBQUksYUFBYSxLQUFrQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUl0RSxZQUFZLENBQUMsTUFBTSw4QkFBc0I7WUFDeEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7WUFFMUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7Z0JBQ3pCLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDVCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtnQkFDakIsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUF3QixDQUFDO2dCQUNyQyxLQUFLLEVBQUUsZ0NBQWlCLENBQUMsSUFBSTtnQkFDN0IsTUFBTTthQUNOLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxLQUFrQyxJQUFVLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBHLGdCQUFnQixDQUFDLEtBQXdCLElBQVUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXRGLEtBQUssQ0FBQyxRQUFRO1lBQ2IsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3JCLENBQUM7S0FDRDtJQS9FRCxvREErRUM7SUFFRCxNQUFhLHVCQUF1QjtRQUFwQztZQUlDLFdBQU0sZ0NBQXdCO1FBVS9CLENBQUM7UUFSQSxJQUFJLENBQUMsS0FBaUM7WUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDcEIsQ0FBQztRQUVELFNBQVMsQ0FBQyxNQUF3QztZQUNqRCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO1FBQzFCLENBQUM7S0FDRDtJQWRELDBEQWNDO0lBRUQsTUFBYSxxQkFBcUI7UUFBbEM7WUFFQyxVQUFLLEdBQW9CLEVBQUUsQ0FBQztZQUM1QixZQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ25CLFdBQU0sZ0NBQXdCO1lBQzlCLFVBQUssR0FBRyxnQ0FBaUIsQ0FBQyxJQUFJLENBQUM7UUFPaEMsQ0FBQztRQUxBLElBQUksQ0FBQyxPQUFzQixFQUFFLE1BQWdDO1lBQzVELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxLQUFLLEtBQTBCLENBQUM7S0FDaEM7SUFaRCxzREFZQztJQUVELE1BQWEsb0NBQW9DO1FBSWhELFlBQW9CLHVCQUF1QixJQUFJLG1EQUF3QixFQUFFO1lBQXJELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBaUM7UUFBSSxDQUFDO1FBRTlFLHdCQUF3QjtZQUN2QixPQUFPLEVBQUUsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFRCxRQUFRLENBQUksUUFBYSxFQUFFLElBQVUsRUFBRSxJQUFVO1lBQ2hELE1BQU0sUUFBUSxHQUFxQixtQkFBYyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbEYsTUFBTSxPQUFPLEdBQXVCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdJLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxPQUFPLENBQUksUUFBeUIsRUFBRSxRQUEwQixFQUFFLE9BQWU7WUFDaEYsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFJLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVELFdBQVcsQ0FBQyxRQUFhLEVBQUUsR0FBVyxFQUFFLEtBQVUsRUFBRSxtQkFBeUM7WUFDNUYsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQ0Q7SUF2QkQsb0ZBdUJDO0lBRUQsTUFBYSx3QkFBd0I7UUFFcEMsWUFBNkIsVUFBK0IsRUFBbUIsZUFBdUI7WUFBekUsZUFBVSxHQUFWLFVBQVUsQ0FBcUI7WUFBbUIsb0JBQWUsR0FBZixlQUFlLENBQVE7WUFFN0YsaUJBQVksR0FBbUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUM7WUFDNUUsNEJBQXVCLEdBQWdCLElBQUksQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUM7WUFFL0Usb0JBQWUsR0FBa0MsYUFBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9ILE9BQU87b0JBQ04sSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO29CQUNaLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2lCQUM1RixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQVZzRyxDQUFDO1FBVzNHLEtBQUssQ0FBQyxRQUFhLEVBQUUsSUFBbUIsSUFBaUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU3SCxJQUFJLENBQUMsUUFBYSxJQUFvQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkcsS0FBSyxDQUFDLFFBQWEsSUFBbUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLE9BQU8sQ0FBQyxRQUFhLElBQW1DLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4SCxNQUFNLENBQUMsUUFBYSxFQUFFLElBQXdCLElBQW1CLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFdEksTUFBTSxDQUFDLElBQVMsRUFBRSxFQUFPLEVBQUUsSUFBMkIsSUFBbUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25LLElBQUksQ0FBQyxJQUFTLEVBQUUsRUFBTyxFQUFFLElBQTJCLElBQW1CLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVoSyxRQUFRLENBQUMsUUFBYSxJQUF5QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakgsU0FBUyxDQUFDLFFBQWEsRUFBRSxPQUFtQixFQUFFLElBQXVCLElBQW1CLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTFLLElBQUksQ0FBQyxRQUFhLEVBQUUsSUFBc0IsSUFBcUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuSSxLQUFLLENBQUMsRUFBVSxJQUFtQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RSxJQUFJLENBQUMsRUFBVSxFQUFFLEdBQVcsRUFBRSxJQUFnQixFQUFFLE1BQWMsRUFBRSxNQUFjLElBQXFCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqSyxLQUFLLENBQUMsRUFBVSxFQUFFLEdBQVcsRUFBRSxJQUFnQixFQUFFLE1BQWMsRUFBRSxNQUFjLElBQXFCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVuSyxjQUFjLENBQUMsUUFBYSxFQUFFLElBQTRCLEVBQUUsS0FBd0IsSUFBc0MsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFdk0sY0FBYyxDQUFDLFFBQWEsSUFBUyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzdHO0lBbENELDREQWtDQztJQUVELE1BQWEsOEJBQStCLFNBQVEsdURBQTBCO1FBQzdFLElBQWEsWUFBWTtZQUN4QixPQUFPOzZFQUM0Qzt3RUFDSCxDQUFDO1FBQ2xELENBQUM7UUFFUSxjQUFjLENBQUMsUUFBYTtZQUNwQyxNQUFNLFdBQVcsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBQzlCLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWtCLEVBQWEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJILENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDO29CQUNKLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFFM0MsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUNmLE9BQU8sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDN0IsTUFBTSxJQUFBLGVBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQzt3QkFDakIsTUFBTSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDO3dCQUNoRSxNQUFNLElBQUksV0FBVyxDQUFDO29CQUN2QixDQUFDO29CQUVELE1BQU0sSUFBQSxlQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO1lBRUwsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0Q7SUEvQkQsd0VBK0JDO0lBRVksUUFBQSxjQUFjLEdBQW9CLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxHQUFHLGlCQUFPLEVBQUUsQ0FBQztJQUV4RixNQUFhLGVBQWU7UUFBNUI7WUFJUyxjQUFTLEdBQUcsSUFBSSxDQUFDO1lBSWpCLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFXLENBQUM7WUFDMUMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUVqRCx1QkFBa0IsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQzFDLDRCQUF1QixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFeEQsMEJBQXFCLEdBQXFELGFBQUssQ0FBQyxJQUFJLENBQUM7WUFzQnJGLGdCQUFXLEdBQUcsbUJBQVcsQ0FBQyxJQUFJLENBQUM7WUFDeEMsMkJBQXNCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztRQUNyQyxDQUFDO1FBakNBLElBQUksUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDekMsS0FBSyxDQUFDLFlBQVksS0FBdUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQVVqRSxRQUFRLENBQUMsS0FBYztZQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU8sS0FBb0IsQ0FBQztRQUNsQyxLQUFLLENBQUMsTUFBTSxLQUFvQixDQUFDO1FBQ2pDLEtBQUssQ0FBQyxLQUFLLEtBQW9CLENBQUM7UUFDaEMsS0FBSyxDQUFDLG9CQUFvQixDQUFJLG9CQUFzQztZQUNuRSxPQUFPLE1BQU0sb0JBQW9CLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUssS0FBb0IsQ0FBQztRQUNoQyxLQUFLLENBQUMsT0FBTyxLQUFvQixDQUFDO1FBQ2xDLEtBQUssQ0FBQyxvQkFBb0IsS0FBeUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRXRFLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBa0QsRUFBRSxJQUF5QixJQUFtQixDQUFDO1FBRWxILEtBQUssQ0FBQyxnQkFBZ0IsS0FBb0IsQ0FBQztLQUkzQztJQXRDRCwwQ0FzQ0M7SUFFRCxNQUFhLDZCQUE4QixTQUFRLHFEQUF5QjtRQUUzRSw4QkFBOEIsQ0FBQyxhQUFrQjtZQUNoRCxLQUFLLENBQUMsMEJBQTBCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZELENBQUM7S0FDRDtJQUxELHNFQUtDO0lBRUQsTUFBYSwrQkFBZ0MsU0FBUSx5Q0FBbUI7UUFFOUQsVUFBVTtZQUNsQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FDRDtJQUxELDBFQUtDO0lBRUQsTUFBYSxlQUFnQixTQUFRLHlCQUFXO1FBRS9DLFlBQW1CLFFBQWEsRUFBbUIsT0FBZTtZQUNqRSxLQUFLLEVBQUUsQ0FBQztZQURVLGFBQVEsR0FBUixRQUFRLENBQUs7WUFBbUIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUVsRSxDQUFDO1FBRUQsSUFBYSxNQUFNO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsSUFBYSxRQUFRO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRVEsT0FBTztZQUNmLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDO0tBQ0Q7SUFqQkQsMENBaUJDO0lBRUQsU0FBZ0Isa0JBQWtCLENBQUMsRUFBVSxFQUFFLE1BQXFDLEVBQUUsaUJBQTBCO1FBQy9HLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLE1BQU0sVUFBVyxTQUFRLHVCQUFVO1lBSWxDLFlBQVksS0FBbUI7Z0JBQzlCLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLHFDQUFvQixFQUFFLElBQUksbUNBQWdCLEVBQUUsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksMENBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLDZDQUFxQixFQUFFLENBQUM7WUFDN0QsQ0FBQztZQUVRLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBa0IsRUFBRSxPQUFtQyxFQUFFLE9BQTJCLEVBQUUsS0FBd0I7Z0JBQ3JJLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRS9DLE1BQU0sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZCLENBQUM7WUFFUSxLQUFLLEtBQWEsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sS0FBVyxDQUFDO1lBQ1IsWUFBWSxLQUFXLENBQUM7WUFFbEMsSUFBYSx1QkFBdUI7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDO1lBQ3RDLENBQUM7U0FDRDtRQUVELFdBQVcsQ0FBQyxHQUFHLENBQUMsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsa0JBQWtCLENBQUMsNkJBQW9CLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUscUJBQXFCLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRXhLLElBQUksaUJBQWlCLEVBQUUsQ0FBQztZQU12QixNQUFNLHdDQUF3QztnQkFFN0MsWUFBWSxDQUFDLFdBQXdCO29CQUNwQyxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2dCQUVELFNBQVMsQ0FBQyxXQUF3QjtvQkFDakMsTUFBTSxlQUFlLEdBQXdCLFdBQVcsQ0FBQztvQkFDekQsTUFBTSxTQUFTLEdBQXlCO3dCQUN2QyxRQUFRLEVBQUUsZUFBZSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7cUJBQzdDLENBQUM7b0JBRUYsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2dCQUVELFdBQVcsQ0FBQyxvQkFBMkMsRUFBRSxxQkFBNkI7b0JBQ3JGLE1BQU0sU0FBUyxHQUF5QixJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7b0JBRTFFLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxpQkFBa0IsQ0FBQyxDQUFDO2dCQUNuRixDQUFDO2FBQ0Q7WUFFRCxXQUFXLENBQUMsR0FBRyxDQUFDLG1CQUFRLENBQUMsRUFBRSxDQUF5Qix5QkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxpQkFBaUIsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDLENBQUM7UUFDNUssQ0FBQztRQUVELE9BQU8sV0FBVyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxTQUFnQixzQkFBc0I7UUFDckMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsQ0FDekYsNkJBQW9CLENBQUMsTUFBTSxDQUMxQixrQkFBa0IsRUFDbEIsa0JBQWtCLENBQUMsRUFBRSxFQUNyQixrQkFBa0IsQ0FDbEIsRUFDRCxDQUFDLElBQUksNEJBQWMsQ0FBQyxpQ0FBZSxDQUFDLENBQUMsQ0FDckMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQztJQUVELFNBQWdCLDBCQUEwQjtRQUN6QyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxXQUFXLENBQUMsR0FBRyxDQUFDLG1CQUFRLENBQUMsRUFBRSxDQUFzQix5QkFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUN6Riw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLHNCQUFzQixFQUN0QixzQkFBc0IsQ0FBQyxFQUFFLEVBQ3pCLGFBQWEsQ0FDYixFQUNEO1lBQ0MsSUFBSSw0QkFBYyxDQUFDLGlEQUF1QixDQUFDO1lBQzNDLElBQUksNEJBQWMsQ0FBQyxpREFBdUIsQ0FBQztTQUMzQyxDQUNELENBQUMsQ0FBQztRQUVILE9BQU8sV0FBVyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxTQUFnQiw0QkFBNEI7UUFDM0MsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsQ0FDekYsNkJBQW9CLENBQUMsTUFBTSxDQUMxQixtQ0FBZ0IsRUFDaEIsbUNBQWdCLENBQUMsRUFBRSxFQUNuQixhQUFhLENBQ2IsRUFDRDtZQUNDLElBQUksNEJBQWMsQ0FBQyw2Q0FBcUIsQ0FBQztTQUN6QyxDQUNELENBQUMsQ0FBQztRQUVILE9BQU8sV0FBVyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxNQUFhLG1CQUFvQixTQUFRLHlCQUFXO1FBY25ELFlBQ1EsUUFBYSxFQUNaLE9BQWU7WUFFdkIsS0FBSyxFQUFFLENBQUM7WUFIRCxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ1osWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQWRmLHNCQUFpQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFFM0MsZ0JBQVcsR0FBRyxLQUFLLENBQUM7WUFDcEIsYUFBUSxHQUFHLEtBQUssQ0FBQztZQUNqQixlQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ25CLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLFVBQUssR0FBRyxLQUFLLENBQUM7WUFFTixVQUFLLEdBQUcsS0FBSyxDQUFDO1lBRXRCLHFCQUFnQixHQUFHLEtBQUssQ0FBQztZQVlqQixrQkFBYSx3Q0FBeUQ7WUFrRTlFLGdCQUFXLEdBQTRCLFNBQVMsQ0FBQztZQUd6Qyx1QkFBa0IsR0FBdUIsU0FBUyxDQUFDO1FBMUUzRCxDQUFDO1FBRUQsSUFBYSxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM5QyxJQUFhLFFBQVEsS0FBSyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBR2hELElBQWEsWUFBWSxLQUE4QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ25GLElBQWEsWUFBWSxDQUFDLFlBQXFDO1lBQzlELElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxZQUFZLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVRLE9BQU8sS0FBa0MsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0gsT0FBTyxDQUFDLEtBQXVHO1lBQ3ZILElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLEtBQUssWUFBWSx5QkFBVyxFQUFFLENBQUM7Z0JBQ2xDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLElBQUksS0FBSyxZQUFZLG1CQUFtQixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlKLENBQUM7WUFDRCxPQUFPLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEtBQUssU0FBUyxDQUFDLENBQUM7UUFDdkksQ0FBQztRQUNELG9CQUFvQixDQUFDLFFBQWEsSUFBVSxDQUFDO1FBQzdDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBZ0IsSUFBSSxDQUFDO1FBQ3ZDLFdBQVcsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsZ0JBQWdCLENBQUMsSUFBWSxJQUFVLENBQUM7UUFDeEMsdUJBQXVCLENBQUMsV0FBbUIsSUFBVSxDQUFDO1FBQ3RELG9CQUFvQixDQUFDLFFBQWdCLElBQUksQ0FBQztRQUMxQyxvQkFBb0IsQ0FBQyxRQUFnQixJQUFVLENBQUM7UUFDaEQsYUFBYSxDQUFDLFVBQWtCLEVBQUUsTUFBZSxJQUFJLENBQUM7UUFDdEQsc0JBQXNCLENBQUMsVUFBa0IsSUFBSSxDQUFDO1FBQzlDLG9CQUFvQixLQUFXLENBQUM7UUFDaEMsYUFBYTtZQUNaLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ25CLENBQUM7UUFDUSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQXdCLEVBQUUsT0FBc0I7WUFDbkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ1EsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUF3QixFQUFFLE9BQXNCO1lBQ3JFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNRLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBc0IsRUFBRSxPQUF3QjtZQUNyRSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNwQixDQUFDO1FBQ1EsU0FBUztZQUNqQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMzQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUNELFdBQVcsS0FBVyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEMsVUFBVTtZQUNsQixPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ2pFLENBQUM7UUFDRCxRQUFRLEtBQVcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlCLE9BQU87WUFDZixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUNELFVBQVUsS0FBYyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUIsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUN6QixDQUFDO1FBRVEsS0FBSyxDQUFDLE1BQU0sS0FBdUMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUd0RixlQUFlLENBQUMsTUFBYztZQUM3QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDO1FBQ2xDLENBQUM7UUFFUSxPQUFPLENBQUMsV0FBNEIsRUFBRSxXQUE0QjtZQUMxRSxJQUFJLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNqRCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNoRCxDQUFDO0tBQ0Q7SUF4R0Qsa0RBd0dDO0lBRUQsTUFBYSw0QkFBNkIsU0FBUSxtQkFBbUI7UUFFcEUsSUFBYSxZQUFZLEtBQThCLGlEQUF5QyxDQUFDLENBQUM7S0FDbEc7SUFIRCxvRUFHQztJQUVELE1BQWEsY0FBZSxTQUFRLDJCQUFjO1FBQWxEOztZQUlVLGFBQVEsR0FBRyxJQUFJLENBQUM7WUFDaEIsVUFBSyxHQUEyQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZDLG1DQUE4QixHQUEyQyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBMkI5RixDQUFDO1FBekJBLGFBQWE7WUFDWixPQUFPLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsVUFBVTtZQUNULE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFVBQVUsK0RBQStDLENBQUM7WUFDeEYsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDakQsT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsNkRBQTZDLENBQUM7WUFDcEYsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLE9BQU8sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLENBQUM7UUFDRixDQUFDO1FBRUQsa0JBQWtCLENBQUMsSUFBaUI7WUFDbkMsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztRQUN4QixDQUFDO1FBRUQseUJBQXlCO1lBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsT0FBTyxDQUFDLEtBQTRCLElBQWlCLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztLQUNuRTtJQWxDRCx3Q0FrQ0M7SUFFTSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsb0JBQTJDLEVBQUUsV0FBNEI7UUFFL0csTUFBTSxlQUFnQixTQUFRLHlCQUFXO1lBSXJCLG9CQUFvQjtnQkFDdEMsSUFBSSxDQUFDLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUU5RSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDMUIsQ0FBQztTQUNEO1FBRUQsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7UUFDaEcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU3QixNQUFNLElBQUksQ0FBQyxTQUFTLENBQUM7UUFFckIsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsTUFBYSxlQUFlO1FBQTVCO1lBR0Msb0JBQWUsR0FBb0IsU0FBUyxDQUFDO1FBSzlDLENBQUM7UUFIQSxRQUFRO1lBQ1AsT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztRQUN4QixDQUFDO0tBQ0Q7SUFSRCwwQ0FRQztJQUVELE1BQWEsZUFBZTtRQUkzQixZQUE2QixtQkFBd0IsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBUyxtQkFBbUIsaUJBQU8sQ0FBQyxJQUFJO1lBQTdHLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBcUQ7WUFBUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWU7UUFBSSxDQUFDO1FBSS9JLGdCQUFnQixDQUFDLFFBQWEsRUFBRSxJQUErQixFQUFFLElBQWE7WUFDN0UsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQzdELE9BQU8sSUFBQSx5QkFBZSxFQUFDLElBQUksSUFBSSxJQUFBLG9CQUFRLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBRUQsT0FBTyxJQUFBLHlCQUFlLEVBQUMsSUFBSSxJQUFJLElBQUEsb0JBQVEsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxJQUFJLElBQUksS0FBSyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsWUFBSyxDQUFDLENBQUMsQ0FBQyxZQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFJakUsUUFBUSxDQUFDLE9BQWtDO1lBQzFDLE9BQU8sT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFFRCxJQUFJLGdCQUFnQixLQUFLLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUV4RCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQVk7WUFDekIsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7S0FDRDtJQTdCRCwwQ0E2QkM7SUFXRCxTQUFnQix1QkFBdUIsQ0FBQyxLQUFjO1FBQ3JELE1BQU0sU0FBUyxHQUFHLEtBQTZDLENBQUM7UUFFaEUsT0FBTyxTQUFTLEVBQUUsb0JBQW9CLENBQUM7SUFDeEMsQ0FBQztJQUVELE1BQWEscUJBQXFCO1FBQWxDO1lBR0MsOEJBQXlCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztRQVd4QyxDQUFDO1FBVEEsS0FBSyxDQUFDLHVCQUF1QixDQUFDLE9BQXdDLEVBQUUsZUFBd0IsSUFBbUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoTCxLQUFLLENBQUMsdUJBQXVCLENBQUMsU0FBK0IsSUFBbUIsQ0FBQztRQUNqRixLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBa0IsSUFBbUIsQ0FBQztRQUM5RCxLQUFLLENBQUMsb0JBQW9CLENBQUMsVUFBaUIsSUFBbUIsQ0FBQztRQUNoRSxLQUFLLENBQUMsbUJBQW1CLEtBQW9CLENBQUM7UUFDOUMsS0FBSyxDQUFDLGlCQUFpQixLQUErQixPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdGLEtBQUssQ0FBQyxrQkFBa0IsS0FBNEQsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBUyxJQUFnRCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNILEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxhQUFrQixJQUFtQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9IO0lBZEQsc0RBY0M7SUFFRCxNQUFhLDJCQUEyQjtRQUF4QztZQUNDLHdCQUFtQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFTbEMsQ0FBQztRQU5BLGlDQUFpQyxDQUFDLDBCQUFrRSxFQUFFLEdBQWtCLElBQXdCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0wsMkJBQTJCLENBQUMsSUFBWSxFQUFFLFVBQThCLEVBQUUsS0FBYSxFQUFFLFNBQTRCLEVBQUUsZUFBbUMsSUFBcUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1TixjQUFjLENBQUMsT0FBK0IsRUFBRSxNQUF3QixJQUF1QixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVJLEtBQUssQ0FBQyxVQUFVLENBQUMsZUFBd0IsSUFBMkMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqSSxrQkFBa0IsQ0FBQyxlQUF3QixJQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEcscUJBQXFCLEtBQXlDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDM0c7SUFWRCxrRUFVQztJQUVELE1BQWEseUJBQXlCO1FBQXRDO1lBR0MsY0FBUyxHQUFpQyxFQUFFLENBQUM7WUFDN0MseUJBQW9CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNsQyx1QkFBa0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2hDLGtDQUE2QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDM0MsOEJBQXlCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUN2Qyx5QkFBb0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBZW5DLENBQUM7UUFkQSxVQUFVLENBQUMsUUFBMkIsRUFBRSxhQUFzQyxJQUFtQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlJLGNBQWMsQ0FBQyxRQUEyQixJQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakcsYUFBYSxDQUFDLGVBQWtDLEVBQUUsaUJBQXNDLElBQXVCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUosa0JBQWtCLENBQUMsYUFBdUIsSUFBbUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRyxlQUFlLENBQUMsUUFBMkIsSUFBUyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLFdBQVcsQ0FBQyxpQkFBbUQsSUFBeUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNySSxvQkFBb0IsQ0FBQyxRQUFhLElBQXlCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEcsaUJBQWlCLENBQUMsUUFBMkIsSUFBVSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLG1CQUFtQixLQUFvQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BGLHVCQUF1QixDQUFDLFFBQXlCLElBQW1DLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakksZUFBZSxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkUsY0FBYyxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEUsUUFBUSxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsWUFBWSxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDcEU7SUF2QkQsOERBdUJDO0lBRUQsTUFBYSx3QkFBd0I7UUFBckM7WUFHQyxjQUFTLEdBQWlDLEVBQUUsQ0FBQztZQUM3QyxXQUFNLEdBQThCLEVBQUUsQ0FBQztZQUV2QyxxQkFBZ0IsR0FBVyxDQUFDLENBQUM7WUFDN0IscUJBQWdCLEdBQThCLFlBQVksQ0FBQztZQUMzRCwyQkFBc0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3BDLHNCQUFpQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDL0IsY0FBUyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDdkIsc0JBQWlCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUMvQixnQ0FBMkIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3pDLHlCQUFvQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDbEMsdUJBQWtCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNoQyxrQ0FBNkIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNDLDhCQUF5QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDdkMseUJBQW9CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztRQTJCbkMsQ0FBQztRQTFCQSxXQUFXLENBQUMsUUFBYyxJQUFvQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNGLG1CQUFtQixDQUFDLFFBQTJCLElBQWdDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUgsU0FBUyxDQUFDLE1BQXlCLEVBQUUsTUFBeUIsSUFBVSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JILGNBQWMsQ0FBQyxNQUF5QixJQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsWUFBWSxDQUFDLE1BQXlCLEVBQUUsTUFBeUIsRUFBRSxJQUF3QixJQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEosZUFBZSxDQUFDLFFBQTJCLElBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRyxhQUFhLENBQUMsU0FBOEIsSUFBVSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25HLGVBQWUsQ0FBQyxRQUEyQixJQUFhLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckcsY0FBYyxLQUFlLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUUscUJBQXFCLENBQUMsS0FBYSxJQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUYsb0JBQW9CLEtBQVcsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RSx3QkFBd0IsS0FBVyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLHdCQUF3QixDQUFDLGFBQXFCLElBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRyxZQUFZLENBQUMsU0FBc0IsSUFBVSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFGLFNBQVMsQ0FBQyxLQUFlLElBQW1CLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekYsU0FBUyxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsU0FBUyxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakUsVUFBVSxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsaUJBQWlCLENBQUMsUUFBMkIsSUFBVSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLG1CQUFtQixLQUFvQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BGLHVCQUF1QixDQUFDLFFBQXlCLElBQW1DLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakksZUFBZSxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkUsY0FBYyxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEUsUUFBUSxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsWUFBWSxLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsZ0JBQWdCLEtBQVcsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN4RTtJQTVDRCw0REE0Q0M7SUFFRCxNQUFhLDBCQUEwQjtRQUF2QztZQUVDLHNCQUFpQixHQUF1QixFQUFFLENBQUM7WUFDM0Msd0JBQW1CLEdBQWdDLEVBQUUsQ0FBQztZQUN0RCxrQkFBYSxHQUFrQixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakQsaUNBQTRCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztRQVMzQyxDQUFDO1FBUkEsY0FBYyxLQUFzQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLHdCQUF3QixLQUFXLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEYscUJBQXFCLEtBQXlCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0YsaUJBQWlCLEtBQW1DLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakcsNEJBQTRCLENBQUMsaUJBQXFDLElBQW9ELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkssMEJBQTBCLENBQUMsSUFBcUMsSUFBbUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoSSw2QkFBNkIsQ0FBQyxtQkFBMkIsRUFBRSxFQUFVLElBQTBDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUosK0JBQStCLENBQUMsbUJBQTJCLEVBQUUsRUFBVSxFQUFFLGVBQXlDLElBQWlCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEw7SUFkRCxnRUFjQztJQUVELE1BQWEsa0NBQWtDO1FBQS9DO1lBRUMsdUJBQWtCLEdBQUcsRUFBRSxDQUFDO1FBV3pCLENBQUM7UUFWQSxXQUFXLENBQUMsaUJBQXFDLElBQVUsQ0FBQztRQUM1RCxLQUFLLENBQUMsd0JBQXdCLENBQUMsaUJBQXFDLEVBQUUsT0FBeUMsSUFBbUIsQ0FBQztRQUNuSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBeUMsSUFBK0IsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZLLEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBeUMsSUFBcUIsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3hHLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxPQUF5QyxJQUFnQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0csY0FBYyxLQUErQixPQUFPLGtCQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN2RSxLQUFLLENBQUMsY0FBYyxLQUFtQyxPQUFPLGFBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEUsa0JBQWtCLENBQUMsR0FBVyxFQUFFLEVBQW1CLElBQXlCLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMvRix5QkFBeUIsQ0FBQyxHQUFXLElBQXlCLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNqRixrQ0FBa0MsQ0FBQyxLQUFlLEVBQUUsU0FBbUIsSUFBd0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM1SjtJQWJELGdGQWFDO0lBRUQsTUFBYSxxQkFBcUI7UUFBbEM7WUFHVSxXQUFNLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNwQixXQUFNLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUVwQixnQkFBVyxHQUFHLFNBQVUsQ0FBQztRQXdCbkMsQ0FBQztRQW5CQSxLQUFLLENBQUMsSUFBSSxDQUEyQixLQUF5RCxFQUFFLE9BQThDLEVBQUUsS0FBeUI7WUFDeEssSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQVksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUM7WUFDL0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUF1QixFQUFFLEtBQXlCLElBQXFCLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUUvSSxlQUFlLEtBQThDLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkcsY0FBYyxLQUFnQixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLGlCQUFpQixLQUFtQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLEtBQUssS0FBVyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sS0FBVyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELFFBQVEsQ0FBQyxJQUFhLEVBQUUsYUFBMkMsSUFBVSxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ILE1BQU0sS0FBb0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRSxJQUFJLEtBQW9CLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUQsTUFBTSxLQUFvQixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2hFO0lBOUJELHNEQThCQztJQUVELE1BQU0sNEJBQTRCO1FBSWpDLG9CQUFvQixDQUFDLFVBQWtCLElBQWEsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ25FLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBYSxFQUFFLGNBQXFDLElBQWlDLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztLQUM3SDtJQUVELE1BQWEsc0JBQXNCO1FBSWxDLGFBQWEsS0FBb0MsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQy9ELEtBQUssQ0FBQyxjQUFjLEtBQThDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNoRixLQUFLLENBQUMsaUJBQWlCLEtBQThDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuRixLQUFLLENBQUMsd0JBQXdCLENBQUMsaUJBQXlCLElBQTRDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsSCxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBK0IsSUFBMEMsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3BILEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxjQUE4QixJQUFtQixDQUFDO1FBQzdFLEtBQUssQ0FBQyxZQUFZLENBQUMsU0FBaUIsRUFBRSxJQUFxQixJQUFtQixDQUFDO1FBQy9FLEtBQUssQ0FBQyxjQUFjLEtBQW9CLENBQUM7UUFDekMsS0FBSyxDQUFDLGdCQUFnQixLQUFrQyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7S0FDM0U7SUFiRCx3REFhQztJQUVELE1BQWEsa0NBQWtDO1FBRTlDLEtBQUssQ0FBQyxtQkFBbUIsS0FBb0IsQ0FBQztRQUM5QyxjQUFjLEtBQXVDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEcsbUJBQW1CLEtBQTRDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUc7SUFMRCxnRkFLQztJQUVELE1BQWEsdUNBQXVDO1FBQXBEO1lBRUMsd0JBQW1CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztRQVdsQyxDQUFDO1FBVkEsa0JBQWtCLENBQUMsU0FBcUIsSUFBcUIsK0NBQXVDLENBQUMsQ0FBQztRQUN0RyxtQkFBbUIsQ0FBQyxVQUF3QixFQUFFLHNCQUFzRSxJQUF1QixPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkosK0JBQStCLENBQUMsU0FBcUIsSUFBcUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RHLG1CQUFtQixDQUFDLFNBQXFCLElBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLDRCQUE0QixDQUFDLFNBQXFCLElBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdFLFNBQVMsQ0FBQyxTQUFxQixJQUFhLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxRCx3QkFBd0IsQ0FBQyxlQUFnQyxJQUFhLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNwRixrQkFBa0IsQ0FBQyxTQUFxQixJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNwRSxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQXdCLEVBQUUsS0FBc0IsSUFBd0IsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hHLEtBQUssQ0FBQyxvREFBb0QsS0FBb0IsQ0FBQztLQUMvRTtJQWJELDBGQWFDO0lBRUQsTUFBYSx1Q0FBdUM7UUFBcEQ7WUFFQyx1QkFBa0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2hDLDJCQUFzQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDcEMseUJBQW9CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNsQyw0QkFBdUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3JDLGlDQUE0QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDMUMsbUNBQThCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUM1Qyx1Q0FBa0MsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2hELHFDQUFnQyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDOUMsd0NBQW1DLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNqRCx1QkFBa0IsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ2hDLDBCQUFxQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFvRHBDLENBQUM7UUFuREEsV0FBVyxDQUFDLFFBQWEsRUFBRSxRQUE2QyxFQUFFLGNBQTJDO1lBQ3BILE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsbUJBQW1CLENBQUMsUUFBYTtZQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELHdCQUF3QixDQUFDLFVBQWtDO1lBQzFELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQTBCLEVBQUUsU0FBMEIsRUFBRSxjQUEyQyxJQUE4QixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDNUssR0FBRyxDQUFDLFNBQTBCO1lBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsS0FBSyxDQUFDLFdBQWdCO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsV0FBVyxDQUFDLElBQVM7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxPQUFPLENBQUMsSUFBUyxFQUFFLE9BQW9DO1lBQ3RELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUE0QixJQUFzQixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDbEYsa0JBQWtCLENBQUMsU0FBNEIsRUFBRSxPQUFvQztZQUNwRixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELFNBQVMsQ0FBQyxTQUEwQixFQUFFLE9BQXNDO1lBQzNFLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFNBQTBCO1lBQ3BELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFnQyxJQUFnQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0YsNEJBQTRCO1lBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFzQixFQUFFLFFBQTJCLElBQThCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNySCxtQkFBbUIsQ0FBQyxZQUE2QyxJQUFVLENBQUM7UUFDNUUsS0FBSyxDQUFDLGlCQUFpQixLQUE4QixrREFBZ0MsQ0FBQyxDQUFDO1FBQ3ZGLEtBQUssQ0FBQyxPQUFPLEtBQW9CLENBQUM7UUFDbEMsUUFBUTtZQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsY0FBYyxLQUFvQixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxxQkFBcUIsS0FBK0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkYsNEJBQTRCLEtBQWlDLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLGtCQUFrQixDQUFDLElBQXNCLEVBQUUsRUFBb0IsSUFBbUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckgsK0JBQStCLEtBQWlDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0csd0JBQXdCLEtBQStCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEcsYUFBYSxLQUFvQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlGLDhCQUE4QixLQUFjLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDekY7SUFoRUQsMEZBZ0VDO0lBRUQsTUFBYSwwQkFBMEI7UUFBdkM7WUFHVSw4QkFBeUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3ZDLG1CQUFjLEdBQUcsSUFBQSxtQ0FBaUIsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBR3JLLENBQUM7UUFGQSxLQUFLLENBQUMsb0JBQW9CLEtBQW9CLENBQUM7UUFDL0MsWUFBWSxDQUFDLE9BQXlCLElBQVksT0FBTyxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQzdGO0lBUEQsZ0VBT0M7SUFFRCxNQUFhLCtCQUErQjtRQUE1QztZQUVDLHVCQUFrQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUF5QmpDLENBQUM7UUF4QkEsS0FBSyxDQUFDLG9CQUFvQixLQUE0QixPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixLQUFtQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkUsS0FBSyxDQUFDLDhCQUE4QixLQUE0QixPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUUsS0FBSyxDQUFDLGNBQWM7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxxQkFBcUIsQ0FBQyxpQkFBc0IsRUFBRSxhQUE0QjtZQUN6RSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELFlBQVksQ0FBQyxRQUFhLEVBQUUsUUFBdU47WUFDbFAsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCx1QkFBdUIsQ0FBQyxnQkFBbUMsRUFBRSxRQUF1TjtZQUNuUixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELGVBQWU7WUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELGNBQWMsQ0FBQyxTQUE0QixFQUFFLFFBQTJCLEVBQUUsZUFBb0I7WUFDN0YsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxxQkFBcUIsQ0FBQyxpQkFBc0I7WUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDRDtJQTNCRCwwRUEyQkM7SUFFTSxLQUFLLFVBQVUsaUJBQWlCLENBQUMsb0JBQTJDO1FBQ2xGLE9BQU8sb0JBQW9CLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRTtZQUMzRCxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLENBQUMsQ0FBQztZQUM3RCxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMENBQW9CLENBQUMsQ0FBQztZQUU5RCxLQUFLLE1BQU0sV0FBVyxJQUFJLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM1RCxNQUFNLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM1QixDQUFDO1lBRUQsS0FBSyxNQUFNLEtBQUssSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDL0IsQ0FBQztZQUVELEtBQUssTUFBTSxLQUFLLElBQUksa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQy9DLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDIn0=