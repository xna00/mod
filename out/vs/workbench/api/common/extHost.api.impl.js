/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/severity", "vs/base/common/uri", "vs/editor/common/config/editorOptions", "vs/editor/common/languageSelector", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/model", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/remote/common/remoteHosts", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/editSessions", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostAiRelatedInformation", "vs/workbench/api/common/extHostApiCommands", "vs/workbench/api/common/extHostApiDeprecationService", "vs/workbench/api/common/extHostAuthentication", "vs/workbench/api/common/extHostBulkEdits", "vs/workbench/api/common/extHostChat", "vs/workbench/api/common/extHostChatAgents2", "vs/workbench/api/common/extHostLanguageModels", "vs/workbench/api/common/extHostChatVariables", "vs/workbench/api/common/extHostClipboard", "vs/workbench/api/common/extHostCodeInsets", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostComments", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/api/common/extHostCustomEditors", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostDecorations", "vs/workbench/api/common/extHostDiagnostics", "vs/workbench/api/common/extHostDialogs", "vs/workbench/api/common/extHostDocumentContentProviders", "vs/workbench/api/common/extHostDocumentSaveParticipant", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostEmbeddingVector", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostFileSystem", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/workbench/api/common/extHostFileSystemEventService", "vs/workbench/api/common/extHostFileSystemInfo", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostInlineChat", "vs/workbench/api/common/extHostInteractive", "vs/workbench/api/common/extHostIssueReporter", "vs/workbench/api/common/extHostLabelService", "vs/workbench/api/common/extHostLanguageFeatures", "vs/workbench/api/common/extHostLanguages", "vs/workbench/api/common/extHostLocalizationService", "vs/workbench/api/common/extHostManagedSockets", "vs/workbench/api/common/extHostMessageService", "vs/workbench/api/common/extHostNotebook", "vs/workbench/api/common/extHostNotebookDocumentSaveParticipant", "vs/workbench/api/common/extHostNotebookDocuments", "vs/workbench/api/common/extHostNotebookEditors", "vs/workbench/api/common/extHostNotebookKernels", "vs/workbench/api/common/extHostNotebookRenderers", "vs/workbench/api/common/extHostOutput", "vs/workbench/api/common/extHostProfileContentHandler", "vs/workbench/api/common/extHostProgress", "vs/workbench/api/common/extHostQuickDiff", "vs/workbench/api/common/extHostQuickOpen", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostSCM", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostSecretState", "vs/workbench/api/common/extHostShare", "vs/workbench/api/common/extHostSpeech", "vs/workbench/api/common/extHostStatusBar", "vs/workbench/api/common/extHostStorage", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/common/extHostTask", "vs/workbench/api/common/extHostTelemetry", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostTesting", "vs/workbench/api/common/extHostTextEditors", "vs/workbench/api/common/extHostTheming", "vs/workbench/api/common/extHostTimeline", "vs/workbench/api/common/extHostTreeViews", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostUriOpener", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/common/extHostUrls", "vs/workbench/api/common/extHostWebview", "vs/workbench/api/common/extHostWebviewPanels", "vs/workbench/api/common/extHostWebviewView", "vs/workbench/api/common/extHostWindow", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/searchExtTypes", "vs/workbench/api/common/extHostTerminalShellIntegration"], function (require, exports, cancellation_1, errors, event_1, lifecycle_1, network_1, severity_1, uri_1, editorOptions_1, languageSelector_1, languageConfiguration, model_1, extensions_1, files, log_1, remoteHosts_1, telemetryUtils_1, editSessions_1, extHost_protocol_1, extHostAiRelatedInformation_1, extHostApiCommands_1, extHostApiDeprecationService_1, extHostAuthentication_1, extHostBulkEdits_1, extHostChat_1, extHostChatAgents2_1, extHostLanguageModels_1, extHostChatVariables_1, extHostClipboard_1, extHostCodeInsets_1, extHostCommands_1, extHostComments_1, extHostConfiguration_1, extHostCustomEditors_1, extHostDebugService_1, extHostDecorations_1, extHostDiagnostics_1, extHostDialogs_1, extHostDocumentContentProviders_1, extHostDocumentSaveParticipant_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostEditorTabs_1, extHostEmbeddingVector_1, extHostExtensionService_1, extHostFileSystem_1, extHostFileSystemConsumer_1, extHostFileSystemEventService_1, extHostFileSystemInfo_1, extHostInitDataService_1, extHostInlineChat_1, extHostInteractive_1, extHostIssueReporter_1, extHostLabelService_1, extHostLanguageFeatures_1, extHostLanguages_1, extHostLocalizationService_1, extHostManagedSockets_1, extHostMessageService_1, extHostNotebook_1, extHostNotebookDocumentSaveParticipant_1, extHostNotebookDocuments_1, extHostNotebookEditors_1, extHostNotebookKernels_1, extHostNotebookRenderers_1, extHostOutput_1, extHostProfileContentHandler_1, extHostProgress_1, extHostQuickDiff_1, extHostQuickOpen_1, extHostRpcService_1, extHostSCM_1, extHostSearch_1, extHostSecretState_1, extHostShare_1, extHostSpeech_1, extHostStatusBar_1, extHostStorage_1, extHostStoragePaths_1, extHostTask_1, extHostTelemetry_1, extHostTerminalService_1, extHostTesting_1, extHostTextEditors_1, extHostTheming_1, extHostTimeline_1, extHostTreeViews_1, extHostTunnelService_1, typeConverters, extHostTypes, extHostUriOpener_1, extHostUriTransformerService_1, extHostUrls_1, extHostWebview_1, extHostWebviewPanels_1, extHostWebviewView_1, extHostWindow_1, extHostWorkspace_1, debug_1, extensionHostProtocol_1, extensions_2, searchExtTypes_1, extHostTerminalShellIntegration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createApiFactoryAndRegisterActors = createApiFactoryAndRegisterActors;
    /**
     * This method instantiates and returns the extension API surface
     */
    function createApiFactoryAndRegisterActors(accessor) {
        // services
        const initData = accessor.get(extHostInitDataService_1.IExtHostInitDataService);
        const extHostFileSystemInfo = accessor.get(extHostFileSystemInfo_1.IExtHostFileSystemInfo);
        const extHostConsumerFileSystem = accessor.get(extHostFileSystemConsumer_1.IExtHostConsumerFileSystem);
        const extensionService = accessor.get(extHostExtensionService_1.IExtHostExtensionService);
        const extHostWorkspace = accessor.get(extHostWorkspace_1.IExtHostWorkspace);
        const extHostTelemetry = accessor.get(extHostTelemetry_1.IExtHostTelemetry);
        const extHostConfiguration = accessor.get(extHostConfiguration_1.IExtHostConfiguration);
        const uriTransformer = accessor.get(extHostUriTransformerService_1.IURITransformerService);
        const rpcProtocol = accessor.get(extHostRpcService_1.IExtHostRpcService);
        const extHostStorage = accessor.get(extHostStorage_1.IExtHostStorage);
        const extensionStoragePaths = accessor.get(extHostStoragePaths_1.IExtensionStoragePaths);
        const extHostLoggerService = accessor.get(log_1.ILoggerService);
        const extHostLogService = accessor.get(log_1.ILogService);
        const extHostTunnelService = accessor.get(extHostTunnelService_1.IExtHostTunnelService);
        const extHostApiDeprecation = accessor.get(extHostApiDeprecationService_1.IExtHostApiDeprecationService);
        const extHostWindow = accessor.get(extHostWindow_1.IExtHostWindow);
        const extHostSecretState = accessor.get(extHostSecretState_1.IExtHostSecretState);
        const extHostEditorTabs = accessor.get(extHostEditorTabs_1.IExtHostEditorTabs);
        const extHostManagedSockets = accessor.get(extHostManagedSockets_1.IExtHostManagedSockets);
        const extHostAuthentication = accessor.get(extHostAuthentication_1.IExtHostAuthentication);
        const extHostLanguageModels = accessor.get(extHostLanguageModels_1.IExtHostLanguageModels);
        // register addressable instances
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystemInfo, extHostFileSystemInfo);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLogLevelServiceShape, extHostLoggerService);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWorkspace, extHostWorkspace);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostConfiguration, extHostConfiguration);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostExtensionService, extensionService);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostStorage, extHostStorage);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTunnelService, extHostTunnelService);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWindow, extHostWindow);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSecretState, extHostSecretState);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTelemetry, extHostTelemetry);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostEditorTabs, extHostEditorTabs);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostManagedSockets, extHostManagedSockets);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostAuthentication, extHostAuthentication);
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostChatProvider, extHostLanguageModels);
        // automatically create and register addressable instances
        const extHostDecorations = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDecorations, accessor.get(extHostDecorations_1.IExtHostDecorations));
        const extHostDocumentsAndEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentsAndEditors, accessor.get(extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors));
        const extHostCommands = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, accessor.get(extHostCommands_1.IExtHostCommands));
        const extHostTerminalService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTerminalService, accessor.get(extHostTerminalService_1.IExtHostTerminalService));
        const extHostTerminalShellIntegration = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTerminalShellIntegration, accessor.get(extHostTerminalShellIntegration_1.IExtHostTerminalShellIntegration));
        const extHostDebugService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDebugService, accessor.get(extHostDebugService_1.IExtHostDebugService));
        const extHostSearch = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSearch, accessor.get(extHostSearch_1.IExtHostSearch));
        const extHostTask = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTask, accessor.get(extHostTask_1.IExtHostTask));
        const extHostOutputService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostOutputService, accessor.get(extHostOutput_1.IExtHostOutputService));
        const extHostLocalization = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLocalization, accessor.get(extHostLocalizationService_1.IExtHostLocalizationService));
        // manually create and register addressable instances
        const extHostUrls = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostUrls, new extHostUrls_1.ExtHostUrls(rpcProtocol));
        const extHostDocuments = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocuments, new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors));
        const extHostDocumentContentProviders = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentContentProviders, new extHostDocumentContentProviders_1.ExtHostDocumentContentProvider(rpcProtocol, extHostDocumentsAndEditors, extHostLogService));
        const extHostDocumentSaveParticipant = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocumentSaveParticipant, new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(extHostLogService, extHostDocuments, rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadBulkEdits)));
        const extHostNotebook = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebook, new extHostNotebook_1.ExtHostNotebookController(rpcProtocol, extHostCommands, extHostDocumentsAndEditors, extHostDocuments, extHostConsumerFileSystem, extHostSearch));
        const extHostNotebookDocuments = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookDocuments, new extHostNotebookDocuments_1.ExtHostNotebookDocuments(extHostNotebook));
        const extHostNotebookEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookEditors, new extHostNotebookEditors_1.ExtHostNotebookEditors(extHostLogService, extHostNotebook));
        const extHostNotebookKernels = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookKernels, new extHostNotebookKernels_1.ExtHostNotebookKernels(rpcProtocol, initData, extHostNotebook, extHostCommands, extHostLogService));
        const extHostNotebookRenderers = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookRenderers, new extHostNotebookRenderers_1.ExtHostNotebookRenderers(rpcProtocol, extHostNotebook));
        const extHostNotebookDocumentSaveParticipant = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostNotebookDocumentSaveParticipant, new extHostNotebookDocumentSaveParticipant_1.ExtHostNotebookDocumentSaveParticipant(extHostLogService, extHostNotebook, rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadBulkEdits)));
        const extHostEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostEditors, new extHostTextEditors_1.ExtHostEditors(rpcProtocol, extHostDocumentsAndEditors));
        const extHostTreeViews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTreeViews, new extHostTreeViews_1.ExtHostTreeViews(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadTreeViews), extHostCommands, extHostLogService));
        const extHostEditorInsets = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostEditorInsets, new extHostCodeInsets_1.ExtHostEditorInsets(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadEditorInsets), extHostEditors, initData.remote));
        const extHostDiagnostics = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol, extHostLogService, extHostFileSystemInfo, extHostDocumentsAndEditors));
        const extHostLanguages = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguages, new extHostLanguages_1.ExtHostLanguages(rpcProtocol, extHostDocuments, extHostCommands.converter, uriTransformer));
        const extHostLanguageFeatures = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, uriTransformer, extHostDocuments, extHostCommands, extHostDiagnostics, extHostLogService, extHostApiDeprecation, extHostTelemetry));
        const extHostFileSystem = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystem, new extHostFileSystem_1.ExtHostFileSystem(rpcProtocol, extHostLanguageFeatures));
        const extHostFileSystemEvent = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService, new extHostFileSystemEventService_1.ExtHostFileSystemEventService(rpcProtocol, extHostLogService, extHostDocumentsAndEditors));
        const extHostQuickOpen = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostQuickOpen, (0, extHostQuickOpen_1.createExtHostQuickOpen)(rpcProtocol, extHostWorkspace, extHostCommands));
        const extHostSCM = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSCM, new extHostSCM_1.ExtHostSCM(rpcProtocol, extHostCommands, extHostDocuments, extHostLogService));
        const extHostQuickDiff = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostQuickDiff, new extHostQuickDiff_1.ExtHostQuickDiff(rpcProtocol, uriTransformer));
        const extHostShare = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostShare, new extHostShare_1.ExtHostShare(rpcProtocol, uriTransformer));
        const extHostComment = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostComments, (0, extHostComments_1.createExtHostComments)(rpcProtocol, extHostCommands, extHostDocuments));
        const extHostProgress = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostProgress, new extHostProgress_1.ExtHostProgress(rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadProgress)));
        const extHostLabelService = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLabelService, new extHostLabelService_1.ExtHostLabelService(rpcProtocol));
        const extHostTheming = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTheming, new extHostTheming_1.ExtHostTheming(rpcProtocol));
        const extHostTimeline = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTimeline, new extHostTimeline_1.ExtHostTimeline(rpcProtocol, extHostCommands));
        const extHostWebviews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWebviews, new extHostWebview_1.ExtHostWebviews(rpcProtocol, initData.remote, extHostWorkspace, extHostLogService, extHostApiDeprecation));
        const extHostWebviewPanels = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWebviewPanels, new extHostWebviewPanels_1.ExtHostWebviewPanels(rpcProtocol, extHostWebviews, extHostWorkspace));
        const extHostCustomEditors = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCustomEditors, new extHostCustomEditors_1.ExtHostCustomEditors(rpcProtocol, extHostDocuments, extensionStoragePaths, extHostWebviews, extHostWebviewPanels));
        const extHostWebviewViews = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostWebviewViews, new extHostWebviewView_1.ExtHostWebviewViews(rpcProtocol, extHostWebviews));
        const extHostTesting = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostTesting, new extHostTesting_1.ExtHostTesting(rpcProtocol, extHostLogService, extHostCommands, extHostDocumentsAndEditors));
        const extHostUriOpeners = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostUriOpeners, new extHostUriOpener_1.ExtHostUriOpeners(rpcProtocol));
        const extHostProfileContentHandlers = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostProfileContentHandlers, new extHostProfileContentHandler_1.ExtHostProfileContentHandlers(rpcProtocol));
        rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostInteractive, new extHostInteractive_1.ExtHostInteractive(rpcProtocol, extHostNotebook, extHostDocumentsAndEditors, extHostCommands, extHostLogService));
        const extHostInteractiveEditor = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostInlineChat, new extHostInlineChat_1.ExtHostInteractiveEditor(rpcProtocol, extHostCommands, extHostDocuments, extHostLogService));
        const extHostChatAgents2 = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostChatAgents2, new extHostChatAgents2_1.ExtHostChatAgents2(rpcProtocol, extHostLogService, extHostCommands));
        const extHostChatVariables = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostChatVariables, new extHostChatVariables_1.ExtHostChatVariables(rpcProtocol));
        const extHostChat = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostChat, new extHostChat_1.ExtHostChat(rpcProtocol));
        const extHostAiRelatedInformation = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostAiRelatedInformation, new extHostAiRelatedInformation_1.ExtHostRelatedInformation(rpcProtocol));
        const extHostAiEmbeddingVector = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostAiEmbeddingVector, new extHostEmbeddingVector_1.ExtHostAiEmbeddingVector(rpcProtocol));
        const extHostIssueReporter = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostIssueReporter, new extHostIssueReporter_1.ExtHostIssueReporter(rpcProtocol));
        const extHostStatusBar = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostStatusBar, new extHostStatusBar_1.ExtHostStatusBar(rpcProtocol, extHostCommands.converter));
        const extHostSpeech = rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostSpeech, new extHostSpeech_1.ExtHostSpeech(rpcProtocol));
        // Check that no named customers are missing
        const expected = Object.values(extHost_protocol_1.ExtHostContext);
        rpcProtocol.assertRegistered(expected);
        // Other instances
        const extHostBulkEdits = new extHostBulkEdits_1.ExtHostBulkEdits(rpcProtocol, extHostDocumentsAndEditors);
        const extHostClipboard = new extHostClipboard_1.ExtHostClipboard(rpcProtocol);
        const extHostMessageService = new extHostMessageService_1.ExtHostMessageService(rpcProtocol, extHostLogService);
        const extHostDialogs = new extHostDialogs_1.ExtHostDialogs(rpcProtocol);
        // Register API-ish commands
        extHostApiCommands_1.ExtHostApiCommands.register(extHostCommands);
        return function (extension, extensionInfo, configProvider) {
            // Wraps an event with error handling and telemetry so that we know what extension fails
            // handling events. This will prevent us from reporting this as "our" error-telemetry and
            // allows for better blaming
            function _asExtensionEvent(actual) {
                return (listener, thisArgs, disposables) => {
                    const handle = actual(e => {
                        try {
                            listener.call(thisArgs, e);
                        }
                        catch (err) {
                            errors.onUnexpectedExternalError(new Error(`[ExtensionListenerError] Extension '${extension.identifier.value}' FAILED to handle event: ${err.toString()}`, { cause: err }));
                            extHostTelemetry.onExtensionError(extension.identifier, err);
                        }
                    });
                    disposables?.push(handle);
                    return handle;
                };
            }
            // Check document selectors for being overly generic. Technically this isn't a problem but
            // in practice many extensions say they support `fooLang` but need fs-access to do so. Those
            // extension should specify then the `file`-scheme, e.g. `{ scheme: 'fooLang', language: 'fooLang' }`
            // We only inform once, it is not a warning because we just want to raise awareness and because
            // we cannot say if the extension is doing it right or wrong...
            const checkSelector = (function () {
                let done = !extension.isUnderDevelopment;
                function informOnce() {
                    if (!done) {
                        extHostLogService.info(`Extension '${extension.identifier.value}' uses a document selector without scheme. Learn more about this: https://go.microsoft.com/fwlink/?linkid=872305`);
                        done = true;
                    }
                }
                return function perform(selector) {
                    if (Array.isArray(selector)) {
                        selector.forEach(perform);
                    }
                    else if (typeof selector === 'string') {
                        informOnce();
                    }
                    else {
                        const filter = selector; // TODO: microsoft/TypeScript#42768
                        if (typeof filter.scheme === 'undefined') {
                            informOnce();
                        }
                        if (typeof filter.exclusive === 'boolean') {
                            (0, extensions_2.checkProposedApiEnabled)(extension, 'documentFiltersExclusive');
                        }
                    }
                    return selector;
                };
            })();
            const authentication = {
                getSession(providerId, scopes, options) {
                    if (typeof options?.forceNewSession === 'object' && options.forceNewSession.learnMore) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'authLearnMore');
                    }
                    return extHostAuthentication.getSession(extension, providerId, scopes, options);
                },
                getSessions(providerId, scopes) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'authGetSessions');
                    return extHostAuthentication.getSessions(extension, providerId, scopes);
                },
                // TODO: remove this after GHPR and Codespaces move off of it
                async hasSession(providerId, scopes) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'authSession');
                    return !!(await extHostAuthentication.getSession(extension, providerId, scopes, { silent: true }));
                },
                get onDidChangeSessions() {
                    return _asExtensionEvent(extHostAuthentication.onDidChangeSessions);
                },
                registerAuthenticationProvider(id, label, provider, options) {
                    return extHostAuthentication.registerAuthenticationProvider(id, label, provider, options);
                }
            };
            // namespace: commands
            const commands = {
                registerCommand(id, command, thisArgs) {
                    return extHostCommands.registerCommand(true, id, command, thisArgs, undefined, extension);
                },
                registerTextEditorCommand(id, callback, thisArg) {
                    return extHostCommands.registerCommand(true, id, (...args) => {
                        const activeTextEditor = extHostEditors.getActiveTextEditor();
                        if (!activeTextEditor) {
                            extHostLogService.warn('Cannot execute ' + id + ' because there is no active text editor.');
                            return undefined;
                        }
                        return activeTextEditor.edit((edit) => {
                            callback.apply(thisArg, [activeTextEditor, edit, ...args]);
                        }).then((result) => {
                            if (!result) {
                                extHostLogService.warn('Edits from command ' + id + ' were not applied.');
                            }
                        }, (err) => {
                            extHostLogService.warn('An error occurred while running command ' + id, err);
                        });
                    }, undefined, undefined, extension);
                },
                registerDiffInformationCommand: (id, callback, thisArg) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'diffCommand');
                    return extHostCommands.registerCommand(true, id, async (...args) => {
                        const activeTextEditor = extHostDocumentsAndEditors.activeEditor(true);
                        if (!activeTextEditor) {
                            extHostLogService.warn('Cannot execute ' + id + ' because there is no active text editor.');
                            return undefined;
                        }
                        const diff = await extHostEditors.getDiffInformation(activeTextEditor.id);
                        callback.apply(thisArg, [diff, ...args]);
                    }, undefined, undefined, extension);
                },
                executeCommand(id, ...args) {
                    return extHostCommands.executeCommand(id, ...args);
                },
                getCommands(filterInternal = false) {
                    return extHostCommands.getCommands(filterInternal);
                }
            };
            // namespace: env
            const env = {
                get machineId() { return initData.telemetryInfo.machineId; },
                get sessionId() { return initData.telemetryInfo.sessionId; },
                get language() { return initData.environment.appLanguage; },
                get appName() { return initData.environment.appName; },
                get appRoot() { return initData.environment.appRoot?.fsPath ?? ''; },
                get appHost() { return initData.environment.appHost; },
                get uriScheme() { return initData.environment.appUriScheme; },
                get clipboard() { return extHostClipboard.value; },
                get shell() {
                    return extHostTerminalService.getDefaultShell(false);
                },
                get onDidChangeShell() {
                    return _asExtensionEvent(extHostTerminalService.onDidChangeShell);
                },
                get isTelemetryEnabled() {
                    return extHostTelemetry.getTelemetryConfiguration();
                },
                get onDidChangeTelemetryEnabled() {
                    return _asExtensionEvent(extHostTelemetry.onDidChangeTelemetryEnabled);
                },
                get telemetryConfiguration() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'telemetry');
                    return extHostTelemetry.getTelemetryDetails();
                },
                get onDidChangeTelemetryConfiguration() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'telemetry');
                    return _asExtensionEvent(extHostTelemetry.onDidChangeTelemetryConfiguration);
                },
                get isNewAppInstall() {
                    return (0, extHostTelemetry_1.isNewAppInstall)(initData.telemetryInfo.firstSessionDate);
                },
                createTelemetryLogger(sender, options) {
                    extHostTelemetry_1.ExtHostTelemetryLogger.validateSender(sender);
                    return extHostTelemetry.instantiateLogger(extension, sender, options);
                },
                openExternal(uri, options) {
                    return extHostWindow.openUri(uri, {
                        allowTunneling: !!initData.remote.authority,
                        allowContributedOpeners: options?.allowContributedOpeners,
                    });
                },
                async asExternalUri(uri) {
                    if (uri.scheme === initData.environment.appUriScheme) {
                        return extHostUrls.createAppUri(uri);
                    }
                    try {
                        return await extHostWindow.asExternalUri(uri, { allowTunneling: !!initData.remote.authority });
                    }
                    catch (err) {
                        if ((0, network_1.matchesScheme)(uri, network_1.Schemas.http) || (0, network_1.matchesScheme)(uri, network_1.Schemas.https)) {
                            return uri;
                        }
                        throw err;
                    }
                },
                get remoteName() {
                    return (0, remoteHosts_1.getRemoteName)(initData.remote.authority);
                },
                get remoteAuthority() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return initData.remote.authority;
                },
                get uiKind() {
                    return initData.uiKind;
                },
                get logLevel() {
                    return extHostLogService.getLevel();
                },
                get onDidChangeLogLevel() {
                    return _asExtensionEvent(extHostLogService.onDidChangeLogLevel);
                },
                registerIssueUriRequestHandler(handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'handleIssueUri');
                    return extHostIssueReporter.registerIssueUriRequestHandler(extension, handler);
                },
                registerIssueDataProvider(handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'handleIssueUri');
                    return extHostIssueReporter.registerIssueDataProvider(extension, handler);
                },
                get appQuality() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return initData.quality;
                },
                get appCommit() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return initData.commit;
                },
            };
            if (!initData.environment.extensionTestsLocationURI) {
                // allow to patch env-function when running tests
                Object.freeze(env);
            }
            // namespace: tests
            const tests = {
                createTestController(provider, label, refreshHandler) {
                    return extHostTesting.createTestController(extension, provider, label, refreshHandler);
                },
                createTestObserver() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return extHostTesting.createTestObserver();
                },
                runTests(provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return extHostTesting.runTests(provider);
                },
                get onDidChangeTestResults() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return _asExtensionEvent(extHostTesting.onResultsChanged);
                },
                get testResults() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'testObserver');
                    return extHostTesting.results;
                },
            };
            // namespace: extensions
            const extensionKind = initData.remote.isRemote
                ? extHostTypes.ExtensionKind.Workspace
                : extHostTypes.ExtensionKind.UI;
            const extensions = {
                getExtension(extensionId, includeFromDifferentExtensionHosts) {
                    if (!(0, extensions_2.isProposedApiEnabled)(extension, 'extensionsAny')) {
                        includeFromDifferentExtensionHosts = false;
                    }
                    const mine = extensionInfo.mine.getExtensionDescription(extensionId);
                    if (mine) {
                        return new extHostExtensionService_1.Extension(extensionService, extension.identifier, mine, extensionKind, false);
                    }
                    if (includeFromDifferentExtensionHosts) {
                        const foreign = extensionInfo.all.getExtensionDescription(extensionId);
                        if (foreign) {
                            return new extHostExtensionService_1.Extension(extensionService, extension.identifier, foreign, extensionKind /* TODO@alexdima THIS IS WRONG */, true);
                        }
                    }
                    return undefined;
                },
                get all() {
                    const result = [];
                    for (const desc of extensionInfo.mine.getAllExtensionDescriptions()) {
                        result.push(new extHostExtensionService_1.Extension(extensionService, extension.identifier, desc, extensionKind, false));
                    }
                    return result;
                },
                get allAcrossExtensionHosts() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'extensionsAny');
                    const local = new extensions_1.ExtensionIdentifierSet(extensionInfo.mine.getAllExtensionDescriptions().map(desc => desc.identifier));
                    const result = [];
                    for (const desc of extensionInfo.all.getAllExtensionDescriptions()) {
                        const isFromDifferentExtensionHost = !local.has(desc.identifier);
                        result.push(new extHostExtensionService_1.Extension(extensionService, extension.identifier, desc, extensionKind /* TODO@alexdima THIS IS WRONG */, isFromDifferentExtensionHost));
                    }
                    return result;
                },
                get onDidChange() {
                    if ((0, extensions_2.isProposedApiEnabled)(extension, 'extensionsAny')) {
                        return _asExtensionEvent(event_1.Event.any(extensionInfo.mine.onDidChange, extensionInfo.all.onDidChange));
                    }
                    return _asExtensionEvent(extensionInfo.mine.onDidChange);
                }
            };
            // namespace: languages
            const languages = {
                createDiagnosticCollection(name) {
                    return extHostDiagnostics.createDiagnosticCollection(extension.identifier, name);
                },
                get onDidChangeDiagnostics() {
                    return _asExtensionEvent(extHostDiagnostics.onDidChangeDiagnostics);
                },
                getDiagnostics: (resource) => {
                    return extHostDiagnostics.getDiagnostics(resource);
                },
                getLanguages() {
                    return extHostLanguages.getLanguages();
                },
                setTextDocumentLanguage(document, languageId) {
                    return extHostLanguages.changeLanguage(document.uri, languageId);
                },
                match(selector, document) {
                    const interalSelector = typeConverters.LanguageSelector.from(selector);
                    let notebook;
                    if ((0, languageSelector_1.targetsNotebooks)(interalSelector)) {
                        notebook = extHostNotebook.notebookDocuments.find(value => value.apiNotebook.getCells().find(c => c.document === document))?.apiNotebook;
                    }
                    return (0, languageSelector_1.score)(interalSelector, document.uri, document.languageId, true, notebook?.uri, notebook?.notebookType);
                },
                registerCodeActionsProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerCodeActionProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerDocumentPasteEditProvider(selector, provider, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'documentPaste');
                    return extHostLanguageFeatures.registerDocumentPasteEditProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerCodeLensProvider(selector, provider) {
                    return extHostLanguageFeatures.registerCodeLensProvider(extension, checkSelector(selector), provider);
                },
                registerDefinitionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDefinitionProvider(extension, checkSelector(selector), provider);
                },
                registerDeclarationProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDeclarationProvider(extension, checkSelector(selector), provider);
                },
                registerImplementationProvider(selector, provider) {
                    return extHostLanguageFeatures.registerImplementationProvider(extension, checkSelector(selector), provider);
                },
                registerTypeDefinitionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerTypeDefinitionProvider(extension, checkSelector(selector), provider);
                },
                registerHoverProvider(selector, provider) {
                    return extHostLanguageFeatures.registerHoverProvider(extension, checkSelector(selector), provider, extension.identifier);
                },
                registerEvaluatableExpressionProvider(selector, provider) {
                    return extHostLanguageFeatures.registerEvaluatableExpressionProvider(extension, checkSelector(selector), provider, extension.identifier);
                },
                registerInlineValuesProvider(selector, provider) {
                    return extHostLanguageFeatures.registerInlineValuesProvider(extension, checkSelector(selector), provider, extension.identifier);
                },
                registerDocumentHighlightProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentHighlightProvider(extension, checkSelector(selector), provider);
                },
                registerMultiDocumentHighlightProvider(selector, provider) {
                    return extHostLanguageFeatures.registerMultiDocumentHighlightProvider(extension, checkSelector(selector), provider);
                },
                registerLinkedEditingRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerLinkedEditingRangeProvider(extension, checkSelector(selector), provider);
                },
                registerReferenceProvider(selector, provider) {
                    return extHostLanguageFeatures.registerReferenceProvider(extension, checkSelector(selector), provider);
                },
                registerRenameProvider(selector, provider) {
                    return extHostLanguageFeatures.registerRenameProvider(extension, checkSelector(selector), provider);
                },
                registerNewSymbolNamesProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'newSymbolNamesProvider');
                    return extHostLanguageFeatures.registerNewSymbolNamesProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentSymbolProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerDocumentSymbolProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerWorkspaceSymbolProvider(provider) {
                    return extHostLanguageFeatures.registerWorkspaceSymbolProvider(extension, provider);
                },
                registerDocumentFormattingEditProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentFormattingEditProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentRangeFormattingEditProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentRangeFormattingEditProvider(extension, checkSelector(selector), provider);
                },
                registerOnTypeFormattingEditProvider(selector, provider, firstTriggerCharacter, ...moreTriggerCharacters) {
                    return extHostLanguageFeatures.registerOnTypeFormattingEditProvider(extension, checkSelector(selector), provider, [firstTriggerCharacter].concat(moreTriggerCharacters));
                },
                registerDocumentSemanticTokensProvider(selector, provider, legend) {
                    return extHostLanguageFeatures.registerDocumentSemanticTokensProvider(extension, checkSelector(selector), provider, legend);
                },
                registerDocumentRangeSemanticTokensProvider(selector, provider, legend) {
                    return extHostLanguageFeatures.registerDocumentRangeSemanticTokensProvider(extension, checkSelector(selector), provider, legend);
                },
                registerSignatureHelpProvider(selector, provider, firstItem, ...remaining) {
                    if (typeof firstItem === 'object') {
                        return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, firstItem);
                    }
                    return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, typeof firstItem === 'undefined' ? [] : [firstItem, ...remaining]);
                },
                registerCompletionItemProvider(selector, provider, ...triggerCharacters) {
                    return extHostLanguageFeatures.registerCompletionItemProvider(extension, checkSelector(selector), provider, triggerCharacters);
                },
                registerInlineCompletionItemProvider(selector, provider, metadata) {
                    if (provider.handleDidShowCompletionItem) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineCompletionsAdditions');
                    }
                    if (provider.handleDidPartiallyAcceptCompletionItem) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineCompletionsAdditions');
                    }
                    if (metadata) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineCompletionsAdditions');
                    }
                    return extHostLanguageFeatures.registerInlineCompletionsProvider(extension, checkSelector(selector), provider, metadata);
                },
                registerInlineEditProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'inlineEdit');
                    return extHostLanguageFeatures.registerInlineEditProvider(extension, checkSelector(selector), provider);
                },
                registerDocumentLinkProvider(selector, provider) {
                    return extHostLanguageFeatures.registerDocumentLinkProvider(extension, checkSelector(selector), provider);
                },
                registerColorProvider(selector, provider) {
                    return extHostLanguageFeatures.registerColorProvider(extension, checkSelector(selector), provider);
                },
                registerFoldingRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerFoldingRangeProvider(extension, checkSelector(selector), provider);
                },
                registerSelectionRangeProvider(selector, provider) {
                    return extHostLanguageFeatures.registerSelectionRangeProvider(extension, selector, provider);
                },
                registerCallHierarchyProvider(selector, provider) {
                    return extHostLanguageFeatures.registerCallHierarchyProvider(extension, selector, provider);
                },
                registerTypeHierarchyProvider(selector, provider) {
                    return extHostLanguageFeatures.registerTypeHierarchyProvider(extension, selector, provider);
                },
                setLanguageConfiguration: (language, configuration) => {
                    return extHostLanguageFeatures.setLanguageConfiguration(extension, language, configuration);
                },
                getTokenInformationAtPosition(doc, pos) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tokenInformation');
                    return extHostLanguages.tokenAtPosition(doc, pos);
                },
                registerInlayHintsProvider(selector, provider) {
                    return extHostLanguageFeatures.registerInlayHintsProvider(extension, selector, provider);
                },
                createLanguageStatusItem(id, selector) {
                    return extHostLanguages.createLanguageStatusItem(extension, id, selector);
                },
                registerDocumentDropEditProvider(selector, provider, metadata) {
                    return extHostLanguageFeatures.registerDocumentOnDropEditProvider(extension, selector, provider, (0, extensions_2.isProposedApiEnabled)(extension, 'dropMetadata') ? metadata : undefined);
                }
            };
            // namespace: window
            const window = {
                get activeTextEditor() {
                    return extHostEditors.getActiveTextEditor();
                },
                get visibleTextEditors() {
                    return extHostEditors.getVisibleTextEditors();
                },
                get activeTerminal() {
                    return extHostTerminalService.activeTerminal;
                },
                get terminals() {
                    return extHostTerminalService.terminals;
                },
                async showTextDocument(documentOrUri, columnOrOptions, preserveFocus) {
                    if (uri_1.URI.isUri(documentOrUri) && documentOrUri.scheme === network_1.Schemas.vscodeRemote && !documentOrUri.authority) {
                        extHostApiDeprecation.report('workspace.showTextDocument', extension, `A URI of 'vscode-remote' scheme requires an authority.`);
                    }
                    const document = await (uri_1.URI.isUri(documentOrUri)
                        ? Promise.resolve(workspace.openTextDocument(documentOrUri))
                        : Promise.resolve(documentOrUri));
                    return extHostEditors.showTextDocument(document, columnOrOptions, preserveFocus);
                },
                createTextEditorDecorationType(options) {
                    return extHostEditors.createTextEditorDecorationType(extension, options);
                },
                onDidChangeActiveTextEditor(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeActiveTextEditor)(listener, thisArg, disposables);
                },
                onDidChangeVisibleTextEditors(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeVisibleTextEditors)(listener, thisArg, disposables);
                },
                onDidChangeTextEditorSelection(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorSelection)(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorOptions(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorOptions)(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorVisibleRanges)(listener, thisArgs, disposables);
                },
                onDidChangeTextEditorViewColumn(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostEditors.onDidChangeTextEditorViewColumn)(listener, thisArg, disposables);
                },
                onDidCloseTerminal(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidCloseTerminal)(listener, thisArg, disposables);
                },
                onDidOpenTerminal(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidOpenTerminal)(listener, thisArg, disposables);
                },
                onDidChangeActiveTerminal(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidChangeActiveTerminal)(listener, thisArg, disposables);
                },
                onDidChangeTerminalDimensions(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalDimensions');
                    return _asExtensionEvent(extHostTerminalService.onDidChangeTerminalDimensions)(listener, thisArg, disposables);
                },
                onDidChangeTerminalState(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTerminalService.onDidChangeTerminalState)(listener, thisArg, disposables);
                },
                onDidWriteTerminalData(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalDataWriteEvent');
                    return _asExtensionEvent(extHostTerminalService.onDidWriteTerminalData)(listener, thisArg, disposables);
                },
                onDidExecuteTerminalCommand(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalExecuteCommandEvent');
                    return _asExtensionEvent(extHostTerminalService.onDidExecuteTerminalCommand)(listener, thisArg, disposables);
                },
                onDidChangeTerminalShellIntegration(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalShellIntegration');
                    return _asExtensionEvent(extHostTerminalShellIntegration.onDidChangeTerminalShellIntegration)(listener, thisArg, disposables);
                },
                onDidStartTerminalShellExecution(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalShellIntegration');
                    return _asExtensionEvent(extHostTerminalShellIntegration.onDidStartTerminalShellExecution)(listener, thisArg, disposables);
                },
                onDidEndTerminalShellExecution(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalShellIntegration');
                    return _asExtensionEvent(extHostTerminalShellIntegration.onDidEndTerminalShellExecution)(listener, thisArg, disposables);
                },
                get state() {
                    return extHostWindow.getState(extension);
                },
                onDidChangeWindowState(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostWindow.onDidChangeWindowState)(listener, thisArg, disposables);
                },
                showInformationMessage(message, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Info, message, rest[0], rest.slice(1));
                },
                showWarningMessage(message, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Warning, message, rest[0], rest.slice(1));
                },
                showErrorMessage(message, ...rest) {
                    return extHostMessageService.showMessage(extension, severity_1.default.Error, message, rest[0], rest.slice(1));
                },
                showQuickPick(items, options, token) {
                    return extHostQuickOpen.showQuickPick(extension, items, options, token);
                },
                showWorkspaceFolderPick(options) {
                    return extHostQuickOpen.showWorkspaceFolderPick(options);
                },
                showInputBox(options, token) {
                    return extHostQuickOpen.showInput(options, token);
                },
                showOpenDialog(options) {
                    return extHostDialogs.showOpenDialog(extension, options);
                },
                showSaveDialog(options) {
                    return extHostDialogs.showSaveDialog(options);
                },
                createStatusBarItem(alignmentOrId, priorityOrAlignment, priorityArg) {
                    let id;
                    let alignment;
                    let priority;
                    if (typeof alignmentOrId === 'string') {
                        id = alignmentOrId;
                        alignment = priorityOrAlignment;
                        priority = priorityArg;
                    }
                    else {
                        alignment = alignmentOrId;
                        priority = priorityOrAlignment;
                    }
                    return extHostStatusBar.createStatusBarEntry(extension, id, alignment, priority);
                },
                setStatusBarMessage(text, timeoutOrThenable) {
                    return extHostStatusBar.setStatusBarMessage(text, timeoutOrThenable);
                },
                withScmProgress(task) {
                    extHostApiDeprecation.report('window.withScmProgress', extension, `Use 'withProgress' instead.`);
                    return extHostProgress.withProgress(extension, { location: extHostTypes.ProgressLocation.SourceControl }, (progress, token) => task({ report(n) { } }));
                },
                withProgress(options, task) {
                    return extHostProgress.withProgress(extension, options, task);
                },
                createOutputChannel(name, options) {
                    return extHostOutputService.createOutputChannel(name, options, extension);
                },
                createWebviewPanel(viewType, title, showOptions, options) {
                    return extHostWebviewPanels.createWebviewPanel(extension, viewType, title, showOptions, options);
                },
                createWebviewTextEditorInset(editor, line, height, options) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'editorInsets');
                    return extHostEditorInsets.createWebviewEditorInset(editor, line, height, options, extension);
                },
                createTerminal(nameOrOptions, shellPath, shellArgs) {
                    if (typeof nameOrOptions === 'object') {
                        if ('pty' in nameOrOptions) {
                            return extHostTerminalService.createExtensionTerminal(nameOrOptions);
                        }
                        return extHostTerminalService.createTerminalFromOptions(nameOrOptions);
                    }
                    return extHostTerminalService.createTerminal(nameOrOptions, shellPath, shellArgs);
                },
                registerTerminalLinkProvider(provider) {
                    return extHostTerminalService.registerLinkProvider(provider);
                },
                registerTerminalProfileProvider(id, provider) {
                    return extHostTerminalService.registerProfileProvider(extension, id, provider);
                },
                registerTerminalQuickFixProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'terminalQuickFixProvider');
                    return extHostTerminalService.registerTerminalQuickFixProvider(id, extension.identifier.value, provider);
                },
                registerTreeDataProvider(viewId, treeDataProvider) {
                    return extHostTreeViews.registerTreeDataProvider(viewId, treeDataProvider, extension);
                },
                createTreeView(viewId, options) {
                    return extHostTreeViews.createTreeView(viewId, options, extension);
                },
                registerWebviewPanelSerializer: (viewType, serializer) => {
                    return extHostWebviewPanels.registerWebviewPanelSerializer(extension, viewType, serializer);
                },
                registerCustomEditorProvider: (viewType, provider, options = {}) => {
                    return extHostCustomEditors.registerCustomEditorProvider(extension, viewType, provider, options);
                },
                registerFileDecorationProvider(provider) {
                    return extHostDecorations.registerFileDecorationProvider(provider, extension);
                },
                registerUriHandler(handler) {
                    return extHostUrls.registerUriHandler(extension, handler);
                },
                createQuickPick() {
                    return extHostQuickOpen.createQuickPick(extension);
                },
                createInputBox() {
                    return extHostQuickOpen.createInputBox(extension);
                },
                get activeColorTheme() {
                    return extHostTheming.activeColorTheme;
                },
                onDidChangeActiveColorTheme(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostTheming.onDidChangeActiveColorTheme)(listener, thisArg, disposables);
                },
                registerWebviewViewProvider(viewId, provider, options) {
                    return extHostWebviewViews.registerWebviewViewProvider(extension, viewId, provider, options?.webviewOptions);
                },
                get activeNotebookEditor() {
                    return extHostNotebook.activeNotebookEditor;
                },
                onDidChangeActiveNotebookEditor(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostNotebook.onDidChangeActiveNotebookEditor)(listener, thisArgs, disposables);
                },
                get visibleNotebookEditors() {
                    return extHostNotebook.visibleNotebookEditors;
                },
                get onDidChangeVisibleNotebookEditors() {
                    return _asExtensionEvent(extHostNotebook.onDidChangeVisibleNotebookEditors);
                },
                onDidChangeNotebookEditorSelection(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostNotebookEditors.onDidChangeNotebookEditorSelection)(listener, thisArgs, disposables);
                },
                onDidChangeNotebookEditorVisibleRanges(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostNotebookEditors.onDidChangeNotebookEditorVisibleRanges)(listener, thisArgs, disposables);
                },
                showNotebookDocument(document, options) {
                    return extHostNotebook.showNotebookDocument(document, options);
                },
                registerExternalUriOpener(id, opener, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'externalUriOpener');
                    return extHostUriOpeners.registerExternalUriOpener(extension.identifier, id, opener, metadata);
                },
                registerProfileContentHandler(id, handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'profileContentHandlers');
                    return extHostProfileContentHandlers.registerProfileContentHandler(extension, id, handler);
                },
                registerQuickDiffProvider(selector, quickDiffProvider, label, rootUri) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'quickDiffProvider');
                    return extHostQuickDiff.registerQuickDiffProvider(checkSelector(selector), quickDiffProvider, label, rootUri);
                },
                get tabGroups() {
                    return extHostEditorTabs.tabGroups;
                },
                registerShareProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'shareProvider');
                    return extHostShare.registerShareProvider(checkSelector(selector), provider);
                }
            };
            // namespace: workspace
            const workspace = {
                get rootPath() {
                    extHostApiDeprecation.report('workspace.rootPath', extension, `Please use 'workspace.workspaceFolders' instead. More details: https://aka.ms/vscode-eliminating-rootpath`);
                    return extHostWorkspace.getPath();
                },
                set rootPath(value) {
                    throw new errors.ReadonlyError('rootPath');
                },
                getWorkspaceFolder(resource) {
                    return extHostWorkspace.getWorkspaceFolder(resource);
                },
                get workspaceFolders() {
                    return extHostWorkspace.getWorkspaceFolders();
                },
                get name() {
                    return extHostWorkspace.name;
                },
                set name(value) {
                    throw new errors.ReadonlyError('name');
                },
                get workspaceFile() {
                    return extHostWorkspace.workspaceFile;
                },
                set workspaceFile(value) {
                    throw new errors.ReadonlyError('workspaceFile');
                },
                updateWorkspaceFolders: (index, deleteCount, ...workspaceFoldersToAdd) => {
                    return extHostWorkspace.updateWorkspaceFolders(extension, index, deleteCount || 0, ...workspaceFoldersToAdd);
                },
                onDidChangeWorkspaceFolders: function (listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostWorkspace.onDidChangeWorkspace)(listener, thisArgs, disposables);
                },
                asRelativePath: (pathOrUri, includeWorkspace) => {
                    return extHostWorkspace.getRelativePath(pathOrUri, includeWorkspace);
                },
                findFiles: (include, exclude, maxResults, token) => {
                    // Note, undefined/null have different meanings on "exclude"
                    return extHostWorkspace.findFiles(include, exclude, maxResults, extension.identifier, token);
                },
                findFiles2: (filePattern, options, token) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'findFiles2');
                    return extHostWorkspace.findFiles2(filePattern, options, extension.identifier, token);
                },
                findTextInFiles: (query, optionsOrCallback, callbackOrToken, token) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'findTextInFiles');
                    let options;
                    let callback;
                    if (typeof optionsOrCallback === 'object') {
                        options = optionsOrCallback;
                        callback = callbackOrToken;
                    }
                    else {
                        options = {};
                        callback = optionsOrCallback;
                        token = callbackOrToken;
                    }
                    return extHostWorkspace.findTextInFiles(query, options || {}, callback, extension.identifier, token);
                },
                save: (uri) => {
                    return extHostWorkspace.save(uri);
                },
                saveAs: (uri) => {
                    return extHostWorkspace.saveAs(uri);
                },
                saveAll: (includeUntitled) => {
                    return extHostWorkspace.saveAll(includeUntitled);
                },
                applyEdit(edit, metadata) {
                    return extHostBulkEdits.applyWorkspaceEdit(edit, extension, metadata);
                },
                createFileSystemWatcher: (pattern, optionsOrIgnoreCreate, ignoreChange, ignoreDelete) => {
                    let options = undefined;
                    if (typeof optionsOrIgnoreCreate === 'boolean') {
                        options = {
                            ignoreCreateEvents: Boolean(optionsOrIgnoreCreate),
                            ignoreChangeEvents: Boolean(ignoreChange),
                            ignoreDeleteEvents: Boolean(ignoreDelete),
                            correlate: false
                        };
                    }
                    else if (optionsOrIgnoreCreate) {
                        (0, extensions_2.checkProposedApiEnabled)(extension, 'createFileSystemWatcher');
                        options = {
                            ...optionsOrIgnoreCreate,
                            correlate: true
                        };
                    }
                    return extHostFileSystemEvent.createFileSystemWatcher(extHostWorkspace, extension, pattern, options);
                },
                get textDocuments() {
                    return extHostDocuments.getAllDocumentData().map(data => data.document);
                },
                set textDocuments(value) {
                    throw new errors.ReadonlyError('textDocuments');
                },
                openTextDocument(uriOrFileNameOrOptions) {
                    let uriPromise;
                    const options = uriOrFileNameOrOptions;
                    if (typeof uriOrFileNameOrOptions === 'string') {
                        uriPromise = Promise.resolve(uri_1.URI.file(uriOrFileNameOrOptions));
                    }
                    else if (uri_1.URI.isUri(uriOrFileNameOrOptions)) {
                        uriPromise = Promise.resolve(uriOrFileNameOrOptions);
                    }
                    else if (!options || typeof options === 'object') {
                        uriPromise = extHostDocuments.createDocumentData(options);
                    }
                    else {
                        throw new Error('illegal argument - uriOrFileNameOrOptions');
                    }
                    return uriPromise.then(uri => {
                        if (uri.scheme === network_1.Schemas.vscodeRemote && !uri.authority) {
                            extHostApiDeprecation.report('workspace.openTextDocument', extension, `A URI of 'vscode-remote' scheme requires an authority.`);
                        }
                        return extHostDocuments.ensureDocumentData(uri).then(documentData => {
                            return documentData.document;
                        });
                    });
                },
                onDidOpenTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidAddDocument)(listener, thisArgs, disposables);
                },
                onDidCloseTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidRemoveDocument)(listener, thisArgs, disposables);
                },
                onDidChangeTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidChangeDocument)(listener, thisArgs, disposables);
                },
                onDidSaveTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocuments.onDidSaveDocument)(listener, thisArgs, disposables);
                },
                onWillSaveTextDocument: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostDocumentSaveParticipant.getOnWillSaveTextDocumentEvent(extension))(listener, thisArgs, disposables);
                },
                get notebookDocuments() {
                    return extHostNotebook.notebookDocuments.map(d => d.apiNotebook);
                },
                async openNotebookDocument(uriOrType, content) {
                    let uri;
                    if (uri_1.URI.isUri(uriOrType)) {
                        uri = uriOrType;
                        await extHostNotebook.openNotebookDocument(uriOrType);
                    }
                    else if (typeof uriOrType === 'string') {
                        uri = uri_1.URI.revive(await extHostNotebook.createNotebookDocument({ viewType: uriOrType, content }));
                    }
                    else {
                        throw new Error('Invalid arguments');
                    }
                    return extHostNotebook.getNotebookDocument(uri).apiNotebook;
                },
                onDidSaveNotebookDocument(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostNotebookDocuments.onDidSaveNotebookDocument)(listener, thisArg, disposables);
                },
                onDidChangeNotebookDocument(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostNotebookDocuments.onDidChangeNotebookDocument)(listener, thisArg, disposables);
                },
                onWillSaveNotebookDocument(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostNotebookDocumentSaveParticipant.getOnWillSaveNotebookDocumentEvent(extension))(listener, thisArg, disposables);
                },
                get onDidOpenNotebookDocument() {
                    return _asExtensionEvent(extHostNotebook.onDidOpenNotebookDocument);
                },
                get onDidCloseNotebookDocument() {
                    return _asExtensionEvent(extHostNotebook.onDidCloseNotebookDocument);
                },
                registerNotebookSerializer(viewType, serializer, options, registration) {
                    return extHostNotebook.registerNotebookSerializer(extension, viewType, serializer, options, (0, extensions_2.isProposedApiEnabled)(extension, 'notebookLiveShare') ? registration : undefined);
                },
                onDidChangeConfiguration: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(configProvider.onDidChangeConfiguration)(listener, thisArgs, disposables);
                },
                getConfiguration(section, scope) {
                    scope = arguments.length === 1 ? undefined : scope;
                    return configProvider.getConfiguration(section, scope, extension);
                },
                registerTextDocumentContentProvider(scheme, provider) {
                    return extHostDocumentContentProviders.registerTextDocumentContentProvider(scheme, provider);
                },
                registerTaskProvider: (type, provider) => {
                    extHostApiDeprecation.report('window.registerTaskProvider', extension, `Use the corresponding function on the 'tasks' namespace instead`);
                    return extHostTask.registerTaskProvider(extension, type, provider);
                },
                registerFileSystemProvider(scheme, provider, options) {
                    return (0, lifecycle_1.combinedDisposable)(extHostFileSystem.registerFileSystemProvider(extension, scheme, provider, options), extHostConsumerFileSystem.addFileSystemProvider(scheme, provider, options));
                },
                get fs() {
                    return extHostConsumerFileSystem.value;
                },
                registerFileSearchProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'fileSearchProvider');
                    return extHostSearch.registerFileSearchProvider(scheme, provider);
                },
                registerTextSearchProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'textSearchProvider');
                    return extHostSearch.registerTextSearchProvider(scheme, provider);
                },
                registerAITextSearchProvider: (scheme, provider) => {
                    // there are some dependencies on textSearchProvider, so we need to check for both
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiTextSearchProvider');
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'textSearchProvider');
                    return extHostSearch.registerAITextSearchProvider(scheme, provider);
                },
                registerRemoteAuthorityResolver: (authorityPrefix, resolver) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return extensionService.registerRemoteAuthorityResolver(authorityPrefix, resolver);
                },
                registerResourceLabelFormatter: (formatter) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return extHostLabelService.$registerResourceLabelFormatter(formatter);
                },
                getRemoteExecServer: (authority) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'resolvers');
                    return extensionService.getRemoteExecServer(authority);
                },
                onDidCreateFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.onDidCreateFile)(listener, thisArg, disposables);
                },
                onDidDeleteFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.onDidDeleteFile)(listener, thisArg, disposables);
                },
                onDidRenameFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.onDidRenameFile)(listener, thisArg, disposables);
                },
                onWillCreateFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.getOnWillCreateFileEvent(extension))(listener, thisArg, disposables);
                },
                onWillDeleteFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.getOnWillDeleteFileEvent(extension))(listener, thisArg, disposables);
                },
                onWillRenameFiles: (listener, thisArg, disposables) => {
                    return _asExtensionEvent(extHostFileSystemEvent.getOnWillRenameFileEvent(extension))(listener, thisArg, disposables);
                },
                openTunnel: (forward) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnels');
                    return extHostTunnelService.openTunnel(extension, forward).then(value => {
                        if (!value) {
                            throw new Error('cannot open tunnel');
                        }
                        return value;
                    });
                },
                get tunnels() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnels');
                    return extHostTunnelService.getTunnels();
                },
                onDidChangeTunnels: (listener, thisArg, disposables) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnels');
                    return _asExtensionEvent(extHostTunnelService.onDidChangeTunnels)(listener, thisArg, disposables);
                },
                registerPortAttributesProvider: (portSelector, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'portsAttributes');
                    return extHostTunnelService.registerPortsAttributesProvider(portSelector, provider);
                },
                registerTunnelProvider: (tunnelProvider, information) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'tunnelFactory');
                    return extHostTunnelService.registerTunnelProvider(tunnelProvider, information);
                },
                registerTimelineProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'timeline');
                    return extHostTimeline.registerTimelineProvider(scheme, provider, extension.identifier, extHostCommands.converter);
                },
                get isTrusted() {
                    return extHostWorkspace.trusted;
                },
                requestWorkspaceTrust: (options) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'workspaceTrust');
                    return extHostWorkspace.requestWorkspaceTrust(options);
                },
                onDidGrantWorkspaceTrust: (listener, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostWorkspace.onDidGrantWorkspaceTrust)(listener, thisArgs, disposables);
                },
                registerEditSessionIdentityProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'editSessionIdentityProvider');
                    return extHostWorkspace.registerEditSessionIdentityProvider(scheme, provider);
                },
                onWillCreateEditSessionIdentity: (listener, thisArgs, disposables) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'editSessionIdentityProvider');
                    return _asExtensionEvent(extHostWorkspace.getOnWillCreateEditSessionIdentityEvent(extension))(listener, thisArgs, disposables);
                },
                registerCanonicalUriProvider: (scheme, provider) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'canonicalUriProvider');
                    return extHostWorkspace.registerCanonicalUriProvider(scheme, provider);
                },
                getCanonicalUri: (uri, options, token) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'canonicalUriProvider');
                    return extHostWorkspace.provideCanonicalUri(uri, options, token);
                }
            };
            // namespace: scm
            const scm = {
                get inputBox() {
                    extHostApiDeprecation.report('scm.inputBox', extension, `Use 'SourceControl.inputBox' instead`);
                    return extHostSCM.getLastInputBox(extension); // Strict null override - Deprecated api
                },
                createSourceControl(id, label, rootUri) {
                    return extHostSCM.createSourceControl(extension, id, label, rootUri);
                }
            };
            // namespace: comments
            const comments = {
                createCommentController(id, label) {
                    return extHostComment.createCommentController(extension, id, label);
                }
            };
            // namespace: debug
            const debug = {
                get activeDebugSession() {
                    return extHostDebugService.activeDebugSession;
                },
                get activeDebugConsole() {
                    return extHostDebugService.activeDebugConsole;
                },
                get breakpoints() {
                    return extHostDebugService.breakpoints;
                },
                get activeStackItem() {
                    if (!(0, extensions_2.isProposedApiEnabled)(extension, 'debugFocus')) {
                        return undefined;
                    }
                    return extHostDebugService.activeStackItem;
                },
                registerDebugVisualizationProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'debugVisualization');
                    return extHostDebugService.registerDebugVisualizationProvider(extension, id, provider);
                },
                registerDebugVisualizationTreeProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'debugVisualization');
                    return extHostDebugService.registerDebugVisualizationTree(extension, id, provider);
                },
                onDidStartDebugSession(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidStartDebugSession)(listener, thisArg, disposables);
                },
                onDidTerminateDebugSession(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidTerminateDebugSession)(listener, thisArg, disposables);
                },
                onDidChangeActiveDebugSession(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidChangeActiveDebugSession)(listener, thisArg, disposables);
                },
                onDidReceiveDebugSessionCustomEvent(listener, thisArg, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidReceiveDebugSessionCustomEvent)(listener, thisArg, disposables);
                },
                onDidChangeBreakpoints(listener, thisArgs, disposables) {
                    return _asExtensionEvent(extHostDebugService.onDidChangeBreakpoints)(listener, thisArgs, disposables);
                },
                onDidChangeActiveStackItem(listener, thisArg, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'debugFocus');
                    return _asExtensionEvent(extHostDebugService.onDidChangeActiveStackItem)(listener, thisArg, disposables);
                },
                registerDebugConfigurationProvider(debugType, provider, triggerKind) {
                    return extHostDebugService.registerDebugConfigurationProvider(debugType, provider, triggerKind || debug_1.DebugConfigurationProviderTriggerKind.Initial);
                },
                registerDebugAdapterDescriptorFactory(debugType, factory) {
                    return extHostDebugService.registerDebugAdapterDescriptorFactory(extension, debugType, factory);
                },
                registerDebugAdapterTrackerFactory(debugType, factory) {
                    return extHostDebugService.registerDebugAdapterTrackerFactory(debugType, factory);
                },
                startDebugging(folder, nameOrConfig, parentSessionOrOptions) {
                    if (!parentSessionOrOptions || (typeof parentSessionOrOptions === 'object' && 'configuration' in parentSessionOrOptions)) {
                        return extHostDebugService.startDebugging(folder, nameOrConfig, { parentSession: parentSessionOrOptions });
                    }
                    return extHostDebugService.startDebugging(folder, nameOrConfig, parentSessionOrOptions || {});
                },
                stopDebugging(session) {
                    return extHostDebugService.stopDebugging(session);
                },
                addBreakpoints(breakpoints) {
                    return extHostDebugService.addBreakpoints(breakpoints);
                },
                removeBreakpoints(breakpoints) {
                    return extHostDebugService.removeBreakpoints(breakpoints);
                },
                asDebugSourceUri(source, session) {
                    return extHostDebugService.asDebugSourceUri(source, session);
                }
            };
            const tasks = {
                registerTaskProvider: (type, provider) => {
                    return extHostTask.registerTaskProvider(extension, type, provider);
                },
                fetchTasks: (filter) => {
                    return extHostTask.fetchTasks(filter);
                },
                executeTask: (task) => {
                    return extHostTask.executeTask(extension, task);
                },
                get taskExecutions() {
                    return extHostTask.taskExecutions;
                },
                onDidStartTask: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidStartTask)(listeners, thisArgs, disposables);
                },
                onDidEndTask: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidEndTask)(listeners, thisArgs, disposables);
                },
                onDidStartTaskProcess: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidStartTaskProcess)(listeners, thisArgs, disposables);
                },
                onDidEndTaskProcess: (listeners, thisArgs, disposables) => {
                    return _asExtensionEvent(extHostTask.onDidEndTaskProcess)(listeners, thisArgs, disposables);
                }
            };
            // namespace: notebook
            const notebooks = {
                createNotebookController(id, notebookType, label, handler, rendererScripts) {
                    return extHostNotebookKernels.createNotebookController(extension, id, notebookType, label, handler, (0, extensions_2.isProposedApiEnabled)(extension, 'notebookMessaging') ? rendererScripts : undefined);
                },
                registerNotebookCellStatusBarItemProvider: (notebookType, provider) => {
                    return extHostNotebook.registerNotebookCellStatusBarItemProvider(extension, notebookType, provider);
                },
                createRendererMessaging(rendererId) {
                    return extHostNotebookRenderers.createRendererMessaging(extension, rendererId);
                },
                createNotebookControllerDetectionTask(notebookType) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookKernelSource');
                    return extHostNotebookKernels.createNotebookControllerDetectionTask(extension, notebookType);
                },
                registerKernelSourceActionProvider(notebookType, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookKernelSource');
                    return extHostNotebookKernels.registerKernelSourceActionProvider(extension, notebookType, provider);
                },
                onDidChangeNotebookCellExecutionState(listener, thisArgs, disposables) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'notebookCellExecutionState');
                    return _asExtensionEvent(extHostNotebookKernels.onDidChangeNotebookCellExecutionState)(listener, thisArgs, disposables);
                }
            };
            // namespace: l10n
            const l10n = {
                t(...params) {
                    if (typeof params[0] === 'string') {
                        const key = params.shift();
                        // We have either rest args which are Array<string | number | boolean> or an array with a single Record<string, any>.
                        // This ensures we get a Record<string | number, any> which will be formatted correctly.
                        const argsFormatted = !params || typeof params[0] !== 'object' ? params : params[0];
                        return extHostLocalization.getMessage(extension.identifier.value, { message: key, args: argsFormatted });
                    }
                    return extHostLocalization.getMessage(extension.identifier.value, params[0]);
                },
                get bundle() {
                    return extHostLocalization.getBundle(extension.identifier.value);
                },
                get uri() {
                    return extHostLocalization.getBundleUri(extension.identifier.value);
                }
            };
            // namespace: interactive
            const interactive = {
                // IMPORTANT
                // this needs to be updated whenever the API proposal changes
                _version: 1,
                registerInteractiveEditorSessionProvider(provider, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'interactive');
                    return extHostInteractiveEditor.registerProvider(extension, provider, metadata);
                },
                registerInteractiveSessionProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'interactive');
                    return extHostChat.registerChatProvider(extension, id, provider);
                },
                transferChatSession(session, toWorkspace) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'interactive');
                    return extHostChat.transferChatSession(session, toWorkspace);
                }
            };
            // namespace: ai
            const ai = {
                getRelatedInformation(query, types) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiRelatedInformation');
                    return extHostAiRelatedInformation.getRelatedInformation(extension, query, types);
                },
                registerRelatedInformationProvider(type, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiRelatedInformation');
                    return extHostAiRelatedInformation.registerRelatedInformationProvider(extension, type, provider);
                },
                registerEmbeddingVectorProvider(model, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'aiRelatedInformation');
                    return extHostAiEmbeddingVector.registerEmbeddingVectorProvider(extension, model, provider);
                }
            };
            // namespace: chat
            const chat = {
                registerChatResponseProvider(id, provider, metadata) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatProvider');
                    return extHostLanguageModels.registerLanguageModel(extension, id, provider, metadata);
                },
                registerChatVariableResolver(name, description, resolver) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatVariableResolver');
                    return extHostChatVariables.registerVariableResolver(extension, name, description, resolver);
                },
                registerMappedEditsProvider(selector, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'mappedEditsProvider');
                    return extHostLanguageFeatures.registerMappedEditsProvider(extension, selector, provider);
                },
                createChatParticipant(id, handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatParticipant');
                    return extHostChatAgents2.createChatAgent(extension, id, handler);
                },
                createDynamicChatParticipant(id, name, description, handler) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'chatParticipantAdditions');
                    return extHostChatAgents2.createDynamicChatAgent(extension, id, name, description, handler);
                }
            };
            // namespace: lm
            const lm = {
                get languageModels() {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    return extHostLanguageModels.getLanguageModelIds();
                },
                onDidChangeLanguageModels: (listener, thisArgs, disposables) => {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    return extHostLanguageModels.onDidChangeProviders(listener, thisArgs, disposables);
                },
                sendChatRequest(languageModel, messages, options, token) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'languageModels');
                    return extHostLanguageModels.sendChatRequest(extension, languageModel, messages, options, token);
                }
            };
            // namespace: speech
            const speech = {
                registerSpeechProvider(id, provider) {
                    (0, extensions_2.checkProposedApiEnabled)(extension, 'speech');
                    return extHostSpeech.registerProvider(extension.identifier, id, provider);
                }
            };
            return {
                version: initData.version,
                // namespaces
                ai,
                authentication,
                commands,
                comments,
                chat,
                debug,
                env,
                extensions,
                interactive,
                l10n,
                languages,
                lm,
                notebooks,
                scm,
                speech,
                tasks,
                tests,
                window,
                workspace,
                // types
                Breakpoint: extHostTypes.Breakpoint,
                TerminalOutputAnchor: extHostTypes.TerminalOutputAnchor,
                ChatResultFeedbackKind: extHostTypes.ChatResultFeedbackKind,
                ChatVariableLevel: extHostTypes.ChatVariableLevel,
                ChatCompletionItem: extHostTypes.ChatCompletionItem,
                CallHierarchyIncomingCall: extHostTypes.CallHierarchyIncomingCall,
                CallHierarchyItem: extHostTypes.CallHierarchyItem,
                CallHierarchyOutgoingCall: extHostTypes.CallHierarchyOutgoingCall,
                CancellationError: errors.CancellationError,
                CancellationTokenSource: cancellation_1.CancellationTokenSource,
                CandidatePortSource: extHost_protocol_1.CandidatePortSource,
                CodeAction: extHostTypes.CodeAction,
                CodeActionKind: extHostTypes.CodeActionKind,
                CodeActionTriggerKind: extHostTypes.CodeActionTriggerKind,
                CodeLens: extHostTypes.CodeLens,
                Color: extHostTypes.Color,
                ColorInformation: extHostTypes.ColorInformation,
                ColorPresentation: extHostTypes.ColorPresentation,
                ColorThemeKind: extHostTypes.ColorThemeKind,
                CommentMode: extHostTypes.CommentMode,
                CommentState: extHostTypes.CommentState,
                CommentThreadCollapsibleState: extHostTypes.CommentThreadCollapsibleState,
                CommentThreadState: extHostTypes.CommentThreadState,
                CommentThreadApplicability: extHostTypes.CommentThreadApplicability,
                CompletionItem: extHostTypes.CompletionItem,
                CompletionItemKind: extHostTypes.CompletionItemKind,
                CompletionItemTag: extHostTypes.CompletionItemTag,
                CompletionList: extHostTypes.CompletionList,
                CompletionTriggerKind: extHostTypes.CompletionTriggerKind,
                ConfigurationTarget: extHostTypes.ConfigurationTarget,
                CustomExecution: extHostTypes.CustomExecution,
                DebugAdapterExecutable: extHostTypes.DebugAdapterExecutable,
                DebugAdapterInlineImplementation: extHostTypes.DebugAdapterInlineImplementation,
                DebugAdapterNamedPipeServer: extHostTypes.DebugAdapterNamedPipeServer,
                DebugAdapterServer: extHostTypes.DebugAdapterServer,
                DebugConfigurationProviderTriggerKind: debug_1.DebugConfigurationProviderTriggerKind,
                DebugConsoleMode: extHostTypes.DebugConsoleMode,
                DebugVisualization: extHostTypes.DebugVisualization,
                DecorationRangeBehavior: extHostTypes.DecorationRangeBehavior,
                Diagnostic: extHostTypes.Diagnostic,
                DiagnosticRelatedInformation: extHostTypes.DiagnosticRelatedInformation,
                DiagnosticSeverity: extHostTypes.DiagnosticSeverity,
                DiagnosticTag: extHostTypes.DiagnosticTag,
                Disposable: extHostTypes.Disposable,
                DocumentHighlight: extHostTypes.DocumentHighlight,
                DocumentHighlightKind: extHostTypes.DocumentHighlightKind,
                MultiDocumentHighlight: extHostTypes.MultiDocumentHighlight,
                DocumentLink: extHostTypes.DocumentLink,
                DocumentSymbol: extHostTypes.DocumentSymbol,
                EndOfLine: extHostTypes.EndOfLine,
                EnvironmentVariableMutatorType: extHostTypes.EnvironmentVariableMutatorType,
                EvaluatableExpression: extHostTypes.EvaluatableExpression,
                InlineValueText: extHostTypes.InlineValueText,
                InlineValueVariableLookup: extHostTypes.InlineValueVariableLookup,
                InlineValueEvaluatableExpression: extHostTypes.InlineValueEvaluatableExpression,
                InlineCompletionTriggerKind: extHostTypes.InlineCompletionTriggerKind,
                EventEmitter: event_1.Emitter,
                ExtensionKind: extHostTypes.ExtensionKind,
                ExtensionMode: extHostTypes.ExtensionMode,
                ExternalUriOpenerPriority: extHostTypes.ExternalUriOpenerPriority,
                FileChangeType: extHostTypes.FileChangeType,
                FileDecoration: extHostTypes.FileDecoration,
                FileDecoration2: extHostTypes.FileDecoration,
                FileSystemError: extHostTypes.FileSystemError,
                FileType: files.FileType,
                FilePermission: files.FilePermission,
                FoldingRange: extHostTypes.FoldingRange,
                FoldingRangeKind: extHostTypes.FoldingRangeKind,
                FunctionBreakpoint: extHostTypes.FunctionBreakpoint,
                InlineCompletionItem: extHostTypes.InlineSuggestion,
                InlineCompletionList: extHostTypes.InlineSuggestionList,
                Hover: extHostTypes.Hover,
                IndentAction: languageConfiguration.IndentAction,
                Location: extHostTypes.Location,
                MarkdownString: extHostTypes.MarkdownString,
                OverviewRulerLane: model_1.OverviewRulerLane,
                ParameterInformation: extHostTypes.ParameterInformation,
                PortAutoForwardAction: extHostTypes.PortAutoForwardAction,
                Position: extHostTypes.Position,
                ProcessExecution: extHostTypes.ProcessExecution,
                ProgressLocation: extHostTypes.ProgressLocation,
                QuickInputButtons: extHostTypes.QuickInputButtons,
                Range: extHostTypes.Range,
                RelativePattern: extHostTypes.RelativePattern,
                Selection: extHostTypes.Selection,
                SelectionRange: extHostTypes.SelectionRange,
                SemanticTokens: extHostTypes.SemanticTokens,
                SemanticTokensBuilder: extHostTypes.SemanticTokensBuilder,
                SemanticTokensEdit: extHostTypes.SemanticTokensEdit,
                SemanticTokensEdits: extHostTypes.SemanticTokensEdits,
                SemanticTokensLegend: extHostTypes.SemanticTokensLegend,
                ShellExecution: extHostTypes.ShellExecution,
                ShellQuoting: extHostTypes.ShellQuoting,
                SignatureHelp: extHostTypes.SignatureHelp,
                SignatureHelpTriggerKind: extHostTypes.SignatureHelpTriggerKind,
                SignatureInformation: extHostTypes.SignatureInformation,
                SnippetString: extHostTypes.SnippetString,
                SourceBreakpoint: extHostTypes.SourceBreakpoint,
                StandardTokenType: extHostTypes.StandardTokenType,
                StatusBarAlignment: extHostTypes.StatusBarAlignment,
                SymbolInformation: extHostTypes.SymbolInformation,
                SymbolKind: extHostTypes.SymbolKind,
                SymbolTag: extHostTypes.SymbolTag,
                Task: extHostTypes.Task,
                TaskGroup: extHostTypes.TaskGroup,
                TaskPanelKind: extHostTypes.TaskPanelKind,
                TaskRevealKind: extHostTypes.TaskRevealKind,
                TaskScope: extHostTypes.TaskScope,
                TerminalLink: extHostTypes.TerminalLink,
                TerminalQuickFixTerminalCommand: extHostTypes.TerminalQuickFixCommand,
                TerminalQuickFixOpener: extHostTypes.TerminalQuickFixOpener,
                TerminalLocation: extHostTypes.TerminalLocation,
                TerminalProfile: extHostTypes.TerminalProfile,
                TerminalExitReason: extHostTypes.TerminalExitReason,
                TextDocumentSaveReason: extHostTypes.TextDocumentSaveReason,
                TextEdit: extHostTypes.TextEdit,
                SnippetTextEdit: extHostTypes.SnippetTextEdit,
                TextEditorCursorStyle: editorOptions_1.TextEditorCursorStyle,
                TextEditorLineNumbersStyle: extHostTypes.TextEditorLineNumbersStyle,
                TextEditorRevealType: extHostTypes.TextEditorRevealType,
                TextEditorSelectionChangeKind: extHostTypes.TextEditorSelectionChangeKind,
                SyntaxTokenType: extHostTypes.SyntaxTokenType,
                TextDocumentChangeReason: extHostTypes.TextDocumentChangeReason,
                ThemeColor: extHostTypes.ThemeColor,
                ThemeIcon: extHostTypes.ThemeIcon,
                TreeItem: extHostTypes.TreeItem,
                TreeItemCheckboxState: extHostTypes.TreeItemCheckboxState,
                TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
                TypeHierarchyItem: extHostTypes.TypeHierarchyItem,
                UIKind: extensionHostProtocol_1.UIKind,
                Uri: uri_1.URI,
                ViewColumn: extHostTypes.ViewColumn,
                WorkspaceEdit: extHostTypes.WorkspaceEdit,
                // proposed api types
                DocumentPasteTriggerKind: extHostTypes.DocumentPasteTriggerKind,
                DocumentDropEdit: extHostTypes.DocumentDropEdit,
                DocumentPasteEditKind: extHostTypes.DocumentPasteEditKind,
                DocumentPasteEdit: extHostTypes.DocumentPasteEdit,
                InlayHint: extHostTypes.InlayHint,
                InlayHintLabelPart: extHostTypes.InlayHintLabelPart,
                InlayHintKind: extHostTypes.InlayHintKind,
                RemoteAuthorityResolverError: extHostTypes.RemoteAuthorityResolverError,
                ResolvedAuthority: extHostTypes.ResolvedAuthority,
                ManagedResolvedAuthority: extHostTypes.ManagedResolvedAuthority,
                SourceControlInputBoxValidationType: extHostTypes.SourceControlInputBoxValidationType,
                ExtensionRuntime: extHostTypes.ExtensionRuntime,
                TimelineItem: extHostTypes.TimelineItem,
                NotebookRange: extHostTypes.NotebookRange,
                NotebookCellKind: extHostTypes.NotebookCellKind,
                NotebookCellExecutionState: extHostTypes.NotebookCellExecutionState,
                NotebookCellData: extHostTypes.NotebookCellData,
                NotebookData: extHostTypes.NotebookData,
                NotebookRendererScript: extHostTypes.NotebookRendererScript,
                NotebookCellStatusBarAlignment: extHostTypes.NotebookCellStatusBarAlignment,
                NotebookEditorRevealType: extHostTypes.NotebookEditorRevealType,
                NotebookCellOutput: extHostTypes.NotebookCellOutput,
                NotebookCellOutputItem: extHostTypes.NotebookCellOutputItem,
                NotebookCellStatusBarItem: extHostTypes.NotebookCellStatusBarItem,
                NotebookControllerAffinity: extHostTypes.NotebookControllerAffinity,
                NotebookControllerAffinity2: extHostTypes.NotebookControllerAffinity2,
                NotebookEdit: extHostTypes.NotebookEdit,
                NotebookKernelSourceAction: extHostTypes.NotebookKernelSourceAction,
                NotebookVariablesRequestKind: extHostTypes.NotebookVariablesRequestKind,
                PortAttributes: extHostTypes.PortAttributes,
                LinkedEditingRanges: extHostTypes.LinkedEditingRanges,
                TestResultState: extHostTypes.TestResultState,
                TestRunRequest: extHostTypes.TestRunRequest,
                TestMessage: extHostTypes.TestMessage,
                TestTag: extHostTypes.TestTag,
                TestRunProfileKind: extHostTypes.TestRunProfileKind,
                TextSearchCompleteMessageType: searchExtTypes_1.TextSearchCompleteMessageType,
                DataTransfer: extHostTypes.DataTransfer,
                DataTransferItem: extHostTypes.DataTransferItem,
                TestCoverageCount: extHostTypes.TestCoverageCount,
                FileCoverage: extHostTypes.FileCoverage,
                StatementCoverage: extHostTypes.StatementCoverage,
                BranchCoverage: extHostTypes.BranchCoverage,
                DeclarationCoverage: extHostTypes.DeclarationCoverage,
                FunctionCoverage: extHostTypes.DeclarationCoverage, // back compat for Feb 2024
                WorkspaceTrustState: extHostTypes.WorkspaceTrustState,
                LanguageStatusSeverity: extHostTypes.LanguageStatusSeverity,
                QuickPickItemKind: extHostTypes.QuickPickItemKind,
                InputBoxValidationSeverity: extHostTypes.InputBoxValidationSeverity,
                TabInputText: extHostTypes.TextTabInput,
                TabInputTextDiff: extHostTypes.TextDiffTabInput,
                TabInputTextMerge: extHostTypes.TextMergeTabInput,
                TabInputCustom: extHostTypes.CustomEditorTabInput,
                TabInputNotebook: extHostTypes.NotebookEditorTabInput,
                TabInputNotebookDiff: extHostTypes.NotebookDiffEditorTabInput,
                TabInputWebview: extHostTypes.WebviewEditorTabInput,
                TabInputTerminal: extHostTypes.TerminalEditorTabInput,
                TabInputInteractiveWindow: extHostTypes.InteractiveWindowInput,
                TabInputChat: extHostTypes.ChatEditorTabInput,
                TabInputTextMultiDiff: extHostTypes.TextMultiDiffTabInput,
                TelemetryTrustedValue: telemetryUtils_1.TelemetryTrustedValue,
                LogLevel: log_1.LogLevel,
                EditSessionIdentityMatch: editSessions_1.EditSessionIdentityMatch,
                InteractiveSessionVoteDirection: extHostTypes.InteractiveSessionVoteDirection,
                ChatCopyKind: extHostTypes.ChatCopyKind,
                InteractiveEditorResponseFeedbackKind: extHostTypes.InteractiveEditorResponseFeedbackKind,
                StackFrame: extHostTypes.StackFrame,
                Thread: extHostTypes.Thread,
                RelatedInformationType: extHostTypes.RelatedInformationType,
                SpeechToTextStatus: extHostTypes.SpeechToTextStatus,
                PartialAcceptTriggerKind: extHostTypes.PartialAcceptTriggerKind,
                KeywordRecognitionStatus: extHostTypes.KeywordRecognitionStatus,
                ChatResponseMarkdownPart: extHostTypes.ChatResponseMarkdownPart,
                ChatResponseFileTreePart: extHostTypes.ChatResponseFileTreePart,
                ChatResponseAnchorPart: extHostTypes.ChatResponseAnchorPart,
                ChatResponseProgressPart: extHostTypes.ChatResponseProgressPart,
                ChatResponseReferencePart: extHostTypes.ChatResponseReferencePart,
                ChatResponseCommandButtonPart: extHostTypes.ChatResponseCommandButtonPart,
                ChatRequestTurn: extHostTypes.ChatRequestTurn,
                ChatResponseTurn: extHostTypes.ChatResponseTurn,
                ChatLocation: extHostTypes.ChatLocation,
                LanguageModelChatSystemMessage: extHostTypes.LanguageModelChatSystemMessage,
                LanguageModelChatUserMessage: extHostTypes.LanguageModelChatUserMessage,
                LanguageModelChatAssistantMessage: extHostTypes.LanguageModelChatAssistantMessage,
                LanguageModelSystemMessage: extHostTypes.LanguageModelChatSystemMessage,
                LanguageModelUserMessage: extHostTypes.LanguageModelChatUserMessage,
                LanguageModelAssistantMessage: extHostTypes.LanguageModelChatAssistantMessage,
                LanguageModelError: extHostTypes.LanguageModelError,
                NewSymbolName: extHostTypes.NewSymbolName,
                NewSymbolNameTag: extHostTypes.NewSymbolNameTag,
                InlineEdit: extHostTypes.InlineEdit,
                InlineEditTriggerKind: extHostTypes.InlineEditTriggerKind,
            };
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdC5hcGkuaW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdC5hcGkuaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXlIaEcsOEVBb2tEQztJQXZrREQ7O09BRUc7SUFDSCxTQUFnQixpQ0FBaUMsQ0FBQyxRQUEwQjtRQUUzRSxXQUFXO1FBQ1gsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnREFBdUIsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4Q0FBc0IsQ0FBQyxDQUFDO1FBQ25FLE1BQU0seUJBQXlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzREFBMEIsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrREFBd0IsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0Q0FBcUIsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscURBQXNCLENBQUMsQ0FBQztRQUM1RCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHNDQUFrQixDQUFDLENBQUM7UUFDckQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQ0FBZSxDQUFDLENBQUM7UUFDckQsTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENB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