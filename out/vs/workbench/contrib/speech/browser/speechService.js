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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "vs/workbench/services/host/browser/host", "vs/base/common/async", "vs/workbench/contrib/speech/common/speechService", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, arrays_1, cancellation_1, event_1, lifecycle_1, contextkey_1, log_1, host_1, async_1, speechService_1, telemetry_1, configuration_1, accessibilitySignalService_1, extensionsRegistry_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpeechService = void 0;
    const speechProvidersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'speechProviders',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.speechProvider', 'Contributes a Speech Provider'),
            type: 'array',
            items: {
                additionalProperties: false,
                type: 'object',
                defaultSnippets: [{ body: { name: '', description: '' } }],
                required: ['name'],
                properties: {
                    name: {
                        description: (0, nls_1.localize)('speechProviderName', "Unique name for this Speech Provider."),
                        type: 'string'
                    },
                    description: {
                        description: (0, nls_1.localize)('speechProviderDescription', "A description of this Speech Provider, shown in the UI."),
                        type: 'string'
                    }
                }
            }
        }
    });
    let SpeechService = class SpeechService extends lifecycle_1.Disposable {
        get hasSpeechProvider() { return this.providerDescriptors.size > 0 || this.providers.size > 0; }
        constructor(logService, contextKeyService, hostService, telemetryService, configurationService, accessibilitySignalService, extensionService) {
            super();
            this.logService = logService;
            this.contextKeyService = contextKeyService;
            this.hostService = hostService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.accessibilitySignalService = accessibilitySignalService;
            this.extensionService = extensionService;
            this._onDidChangeHasSpeechProvider = this._register(new event_1.Emitter());
            this.onDidChangeHasSpeechProvider = this._onDidChangeHasSpeechProvider.event;
            this.providers = new Map();
            this.providerDescriptors = new Map();
            this.hasSpeechProviderContext = speechService_1.HasSpeechProvider.bindTo(this.contextKeyService);
            this._onDidStartSpeechToTextSession = this._register(new event_1.Emitter());
            this.onDidStartSpeechToTextSession = this._onDidStartSpeechToTextSession.event;
            this._onDidEndSpeechToTextSession = this._register(new event_1.Emitter());
            this.onDidEndSpeechToTextSession = this._onDidEndSpeechToTextSession.event;
            this._activeSpeechToTextSession = undefined;
            this.speechToTextInProgress = speechService_1.SpeechToTextInProgress.bindTo(this.contextKeyService);
            this._onDidStartKeywordRecognition = this._register(new event_1.Emitter());
            this.onDidStartKeywordRecognition = this._onDidStartKeywordRecognition.event;
            this._onDidEndKeywordRecognition = this._register(new event_1.Emitter());
            this.onDidEndKeywordRecognition = this._onDidEndKeywordRecognition.event;
            this._activeKeywordRecognitionSession = undefined;
            this.handleAndRegisterSpeechExtensions();
        }
        handleAndRegisterSpeechExtensions() {
            speechProvidersExtensionPoint.setHandler((extensions, delta) => {
                const oldHasSpeechProvider = this.hasSpeechProvider;
                for (const extension of delta.removed) {
                    for (const descriptor of extension.value) {
                        this.providerDescriptors.delete(descriptor.name);
                    }
                }
                for (const extension of delta.added) {
                    for (const descriptor of extension.value) {
                        this.providerDescriptors.set(descriptor.name, descriptor);
                    }
                }
                if (oldHasSpeechProvider !== this.hasSpeechProvider) {
                    this.handleHasSpeechProviderChange();
                }
            });
        }
        registerSpeechProvider(identifier, provider) {
            if (this.providers.has(identifier)) {
                throw new Error(`Speech provider with identifier ${identifier} is already registered.`);
            }
            const oldHasSpeechProvider = this.hasSpeechProvider;
            this.providers.set(identifier, provider);
            if (oldHasSpeechProvider !== this.hasSpeechProvider) {
                this.handleHasSpeechProviderChange();
            }
            return (0, lifecycle_1.toDisposable)(() => {
                const oldHasSpeechProvider = this.hasSpeechProvider;
                this.providers.delete(identifier);
                if (oldHasSpeechProvider !== this.hasSpeechProvider) {
                    this.handleHasSpeechProviderChange();
                }
            });
        }
        handleHasSpeechProviderChange() {
            this.hasSpeechProviderContext.set(this.hasSpeechProvider);
            this._onDidChangeHasSpeechProvider.fire();
        }
        get hasActiveSpeechToTextSession() { return !!this._activeSpeechToTextSession; }
        async createSpeechToTextSession(token, context = 'speech') {
            const provider = await this.getProvider();
            const language = (0, speechService_1.speechLanguageConfigToLanguage)(this.configurationService.getValue(speechService_1.SPEECH_LANGUAGE_CONFIG));
            const session = this._activeSpeechToTextSession = provider.createSpeechToTextSession(token, typeof language === 'string' ? { language } : undefined);
            const sessionStart = Date.now();
            let sessionRecognized = false;
            let sessionContentLength = 0;
            const disposables = new lifecycle_1.DisposableStore();
            const onSessionStoppedOrCanceled = () => {
                if (session === this._activeSpeechToTextSession) {
                    this._activeSpeechToTextSession = undefined;
                    this.speechToTextInProgress.reset();
                    this.accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.voiceRecordingStopped, { allowManyInParallel: true });
                    this._onDidEndSpeechToTextSession.fire();
                    this.telemetryService.publicLog2('speechToTextSession', {
                        context,
                        sessionDuration: Date.now() - sessionStart,
                        sessionRecognized,
                        sessionContentLength,
                        sessionLanguage: language
                    });
                }
                disposables.dispose();
            };
            disposables.add(token.onCancellationRequested(() => onSessionStoppedOrCanceled()));
            if (token.isCancellationRequested) {
                onSessionStoppedOrCanceled();
            }
            disposables.add(session.onDidChange(e => {
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        if (session === this._activeSpeechToTextSession) {
                            this.speechToTextInProgress.set(true);
                            this._onDidStartSpeechToTextSession.fire();
                            this.accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.voiceRecordingStarted);
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing:
                        sessionRecognized = true;
                        break;
                    case speechService_1.SpeechToTextStatus.Recognized:
                        if (typeof e.text === 'string') {
                            sessionContentLength += e.text.length;
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        onSessionStoppedOrCanceled();
                        break;
                }
            }));
            return session;
        }
        async getProvider() {
            // Send out extension activation to ensure providers can register
            await this.extensionService.activateByEvent('onSpeech');
            const provider = (0, arrays_1.firstOrDefault)(Array.from(this.providers.values()));
            if (!provider) {
                throw new Error(`No Speech provider is registered.`);
            }
            else if (this.providers.size > 1) {
                this.logService.warn(`Multiple speech providers registered. Picking first one: ${provider.metadata.displayName}`);
            }
            return provider;
        }
        get hasActiveKeywordRecognition() { return !!this._activeKeywordRecognitionSession; }
        async recognizeKeyword(token) {
            const result = new async_1.DeferredPromise();
            // Send out extension activation to ensure providers can register
            await this.extensionService.activateByEvent('onSpeech');
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(token.onCancellationRequested(() => {
                disposables.dispose();
                result.complete(speechService_1.KeywordRecognitionStatus.Canceled);
            }));
            const recognizeKeywordDisposables = disposables.add(new lifecycle_1.DisposableStore());
            let activeRecognizeKeywordSession = undefined;
            const recognizeKeyword = () => {
                recognizeKeywordDisposables.clear();
                const cts = new cancellation_1.CancellationTokenSource(token);
                recognizeKeywordDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
                const currentRecognizeKeywordSession = activeRecognizeKeywordSession = this.doRecognizeKeyword(cts.token).then(status => {
                    if (currentRecognizeKeywordSession === activeRecognizeKeywordSession) {
                        result.complete(status);
                    }
                }, error => {
                    if (currentRecognizeKeywordSession === activeRecognizeKeywordSession) {
                        result.error(error);
                    }
                });
            };
            disposables.add(this.hostService.onDidChangeFocus(focused => {
                if (!focused && activeRecognizeKeywordSession) {
                    recognizeKeywordDisposables.clear();
                    activeRecognizeKeywordSession = undefined;
                }
                else if (!activeRecognizeKeywordSession) {
                    recognizeKeyword();
                }
            }));
            if (this.hostService.hasFocus) {
                recognizeKeyword();
            }
            let status;
            try {
                status = await result.p;
            }
            finally {
                disposables.dispose();
            }
            this.telemetryService.publicLog2('keywordRecognition', {
                keywordRecognized: status === speechService_1.KeywordRecognitionStatus.Recognized
            });
            return status;
        }
        async doRecognizeKeyword(token) {
            const provider = await this.getProvider();
            const session = this._activeKeywordRecognitionSession = provider.createKeywordRecognitionSession(token);
            this._onDidStartKeywordRecognition.fire();
            const disposables = new lifecycle_1.DisposableStore();
            const onSessionStoppedOrCanceled = () => {
                if (session === this._activeKeywordRecognitionSession) {
                    this._activeKeywordRecognitionSession = undefined;
                    this._onDidEndKeywordRecognition.fire();
                }
                disposables.dispose();
            };
            disposables.add(token.onCancellationRequested(() => onSessionStoppedOrCanceled()));
            if (token.isCancellationRequested) {
                onSessionStoppedOrCanceled();
            }
            disposables.add(session.onDidChange(e => {
                if (e.status === speechService_1.KeywordRecognitionStatus.Stopped) {
                    onSessionStoppedOrCanceled();
                }
            }));
            try {
                return (await event_1.Event.toPromise(session.onDidChange)).status;
            }
            finally {
                onSessionStoppedOrCanceled();
            }
        }
    };
    exports.SpeechService = SpeechService;
    exports.SpeechService = SpeechService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, host_1.IHostService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(6, extensions_1.IExtensionService)
    ], SpeechService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlZWNoU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc3BlZWNoL2Jyb3dzZXIvc3BlZWNoU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QmhHLE1BQU0sNkJBQTZCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQThCO1FBQzVHLGNBQWMsRUFBRSxpQkFBaUI7UUFDakMsVUFBVSxFQUFFO1lBQ1gsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDZDQUE2QyxFQUFFLCtCQUErQixDQUFDO1lBQ3JHLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFO2dCQUNOLG9CQUFvQixFQUFFLEtBQUs7Z0JBQzNCLElBQUksRUFBRSxRQUFRO2dCQUNkLGVBQWUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDMUQsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUNsQixVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFO3dCQUNMLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSx1Q0FBdUMsQ0FBQzt3QkFDcEYsSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7b0JBQ0QsV0FBVyxFQUFFO3dCQUNaLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSx5REFBeUQsQ0FBQzt3QkFDN0csSUFBSSxFQUFFLFFBQVE7cUJBQ2Q7aUJBQ0Q7YUFDRDtTQUNEO0tBQ0QsQ0FBQyxDQUFDO0lBRUksSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLHNCQUFVO1FBTzVDLElBQUksaUJBQWlCLEtBQUssT0FBTyxJQUFJLENBQUMs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