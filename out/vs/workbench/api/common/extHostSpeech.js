/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol"], function (require, exports, cancellation_1, lifecycle_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostSpeech = void 0;
    class ExtHostSpeech {
        static { this.ID_POOL = 1; }
        constructor(mainContext) {
            this.providers = new Map();
            this.sessions = new Map();
            this.proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadSpeech);
        }
        async $createSpeechToTextSession(handle, session, language) {
            const provider = this.providers.get(handle);
            if (!provider) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const cts = new cancellation_1.CancellationTokenSource();
            this.sessions.set(session, cts);
            const speechToTextSession = disposables.add(provider.provideSpeechToTextSession(cts.token, language ? { language } : undefined));
            disposables.add(speechToTextSession.onDidChange(e => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                this.proxy.$emitSpeechToTextEvent(session, e);
            }));
            disposables.add(cts.token.onCancellationRequested(() => disposables.dispose()));
        }
        async $cancelSpeechToTextSession(session) {
            this.sessions.get(session)?.dispose(true);
            this.sessions.delete(session);
        }
        async $createKeywordRecognitionSession(handle, session) {
            const provider = this.providers.get(handle);
            if (!provider) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const cts = new cancellation_1.CancellationTokenSource();
            this.sessions.set(session, cts);
            const keywordRecognitionSession = disposables.add(provider.provideKeywordRecognitionSession(cts.token));
            disposables.add(keywordRecognitionSession.onDidChange(e => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                this.proxy.$emitKeywordRecognitionEvent(session, e);
            }));
            disposables.add(cts.token.onCancellationRequested(() => disposables.dispose()));
        }
        async $cancelKeywordRecognitionSession(session) {
            this.sessions.get(session)?.dispose(true);
            this.sessions.delete(session);
        }
        registerProvider(extension, identifier, provider) {
            const handle = ExtHostSpeech.ID_POOL++;
            this.providers.set(handle, provider);
            this.proxy.$registerProvider(handle, identifier, { extension, displayName: extension.value });
            return (0, lifecycle_1.toDisposable)(() => {
                this.proxy.$unregisterProvider(handle);
                this.providers.delete(handle);
            });
        }
    }
    exports.ExtHostSpeech = ExtHostSpeech;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNwZWVjaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFNwZWVjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxhQUFhO2lCQUVWLFlBQU8sR0FBRyxDQUFDLEFBQUosQ0FBSztRQU8zQixZQUNDLFdBQXlCO1lBSlQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFpQyxDQUFDO1lBQ3JELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBbUMsQ0FBQztZQUt0RSxJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFRCxLQUFLLENBQUMsMEJBQTBCLENBQUMsTUFBYyxFQUFFLE9BQWUsRUFBRSxRQUFpQjtZQUNsRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUxQyxNQUFNLEdBQUcsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRWhDLE1BQU0sbUJBQW1CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7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