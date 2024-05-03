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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/speech/common/speechService", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, event_1, lifecycle_1, log_1, extHost_protocol_1, speechService_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSpeech = void 0;
    let MainThreadSpeech = class MainThreadSpeech {
        constructor(extHostContext, speechService, logService) {
            this.speechService = speechService;
            this.logService = logService;
            this.providerRegistrations = new Map();
            this.speechToTextSessions = new Map();
            this.keywordRecognitionSessions = new Map();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSpeech);
        }
        $registerProvider(handle, identifier, metadata) {
            this.logService.trace('[Speech] extension registered provider', metadata.extension.value);
            const registration = this.speechService.registerSpeechProvider(identifier, {
                metadata,
                createSpeechToTextSession: (token, options) => {
                    if (token.isCancellationRequested) {
                        return {
                            onDidChange: event_1.Event.None
                        };
                    }
                    const disposables = new lifecycle_1.DisposableStore();
                    const session = Math.random();
                    this.proxy.$createSpeechToTextSession(handle, session, options?.language);
                    const onDidChange = disposables.add(new event_1.Emitter());
                    this.speechToTextSessions.set(session, { onDidChange });
                    disposables.add(token.onCancellationRequested(() => {
                        this.proxy.$cancelSpeechToTextSession(session);
                        this.speechToTextSessions.delete(session);
                        disposables.dispose();
                    }));
                    return {
                        onDidChange: onDidChange.event
                    };
                },
                createKeywordRecognitionSession: token => {
                    if (token.isCancellationRequested) {
                        return {
                            onDidChange: event_1.Event.None
                        };
                    }
                    const disposables = new lifecycle_1.DisposableStore();
                    const session = Math.random();
                    this.proxy.$createKeywordRecognitionSession(handle, session);
                    const onDidChange = disposables.add(new event_1.Emitter());
                    this.keywordRecognitionSessions.set(session, { onDidChange });
                    disposables.add(token.onCancellationRequested(() => {
                        this.proxy.$cancelKeywordRecognitionSession(session);
                        this.keywordRecognitionSessions.delete(session);
                        disposables.dispose();
                    }));
                    return {
                        onDidChange: onDidChange.event
                    };
                }
            });
            this.providerRegistrations.set(handle, {
                dispose: () => {
                    registration.dispose();
                }
            });
        }
        $unregisterProvider(handle) {
            const registration = this.providerRegistrations.get(handle);
            if (registration) {
                registration.dispose();
                this.providerRegistrations.delete(handle);
            }
        }
        $emitSpeechToTextEvent(session, event) {
            const providerSession = this.speechToTextSessions.get(session);
            providerSession?.onDidChange.fire(event);
        }
        $emitKeywordRecognitionEvent(session, event) {
            const providerSession = this.keywordRecognitionSessions.get(session);
            providerSession?.onDidChange.fire(event);
        }
        dispose() {
            this.providerRegistrations.forEach(disposable => disposable.dispose());
            this.providerRegistrations.clear();
            this.speechToTextSessions.forEach(session => session.onDidChange.dispose());
            this.speechToTextSessions.clear();
            this.keywordRecognitionSessions.forEach(session => session.onDidChange.dispose());
            this.keywordRecognitionSessions.clear();
        }
    };
    exports.MainThreadSpeech = MainThreadSpeech;
    exports.MainThreadSpeech = MainThreadSpeech = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadSpeech),
        __param(1, speechService_1.ISpeechService),
        __param(2, log_1.ILogService)
    ], MainThreadSpeech);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNwZWVjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRTcGVlY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjtRQVM1QixZQUNDLGNBQStCLEVBQ2YsYUFBOEMsRUFDakQsVUFBd0M7WUFEcEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ2hDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFSckMsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFFdkQseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQStCLENBQUM7WUFDOUQsK0JBQTBCLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7WUFPMUYsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVELGlCQUFpQixDQUFDLE1BQWMsRUFBRSxVQUFrQixFQUFFLFFBQWlDO1lBQ3RGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFMUYsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLEVBQUU7Z0JBQzFFLFFBQVE7Z0JBQ1IseUJBQXlCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7b0JBQzdDLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7d0JBQ25DLE9BQU87NEJBQ04sV0FBVyxFQUFFLGFBQUssQ0FBQyxJQUFJO3lCQUN2QixDQUFDO29C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