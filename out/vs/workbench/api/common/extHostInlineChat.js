/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, async_1, lifecycle_1, uri_1, extHost_protocol_1, extHostCommands_1, typeConvert, extHostTypes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostInteractiveEditor = void 0;
    class ProviderWrapper {
        static { this._pool = 0; }
        constructor(extension, provider) {
            this.extension = extension;
            this.provider = provider;
            this.handle = ProviderWrapper._pool++;
        }
    }
    class SessionWrapper {
        constructor(session) {
            this.session = session;
            this.responses = [];
        }
    }
    class ExtHostInteractiveEditor {
        static { this._nextId = 0; }
        constructor(mainContext, extHostCommands, _documents, _logService) {
            this._documents = _documents;
            this._logService = _logService;
            this._inputProvider = new Map();
            this._inputSessions = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadInlineChat);
            extHostCommands.registerApiCommand(new extHostCommands_1.ApiCommand('vscode.editorChat.start', 'inlineChat.start', 'Invoke a new editor chat session', [new extHostCommands_1.ApiCommandArgument('Run arguments', '', _v => true, v => {
                    if (!v) {
                        return undefined;
                    }
                    return {
                        initialRange: v.initialRange ? typeConvert.Range.from(v.initialRange) : undefined,
                        initialSelection: extHostTypes.Selection.isSelection(v.initialSelection) ? typeConvert.Selection.from(v.initialSelection) : undefined,
                        message: v.message,
                        autoSend: v.autoSend,
                        position: v.position ? typeConvert.Position.from(v.position) : undefined,
                    };
                })], extHostCommands_1.ApiCommandResult.Void));
        }
        registerProvider(extension, provider, metadata) {
            const wrapper = new ProviderWrapper(extension, provider);
            this._inputProvider.set(wrapper.handle, wrapper);
            this._proxy.$registerInteractiveEditorProvider(wrapper.handle, metadata?.label ?? extension.displayName ?? extension.name, extension.identifier, typeof provider.handleInteractiveEditorResponseFeedback === 'function', typeof provider.provideFollowups === 'function', metadata?.supportReportIssue ?? false);
            return (0, lifecycle_1.toDisposable)(() => {
                this._proxy.$unregisterInteractiveEditorProvider(wrapper.handle);
                this._inputProvider.delete(wrapper.handle);
            });
        }
        async $prepareSession(handle, uri, range, token) {
            const entry = this._inputProvider.get(handle);
            if (!entry) {
                this._logService.warn('CANNOT prepare session because the PROVIDER IS GONE');
                return undefined;
            }
            const document = this._documents.getDocument(uri_1.URI.revive(uri));
            const selection = typeConvert.Selection.to(range);
            const session = await entry.provider.prepareInteractiveEditorSession({ document, selection }, token);
            if (!session) {
                return undefined;
            }
            if (session.wholeRange && !session.wholeRange.contains(selection)) {
                throw new Error(`InteractiveEditorSessionProvider returned a wholeRange that does not contain the selection.`);
            }
            const id = ExtHostInteractiveEditor._nextId++;
            this._inputSessions.set(id, new SessionWrapper(session));
            return {
                id,
                placeholder: session.placeholder,
                input: session.input,
                slashCommands: session.slashCommands?.map(c => ({ command: c.command, detail: c.detail, refer: c.refer, executeImmediately: c.executeImmediately })),
                wholeRange: typeConvert.Range.from(session.wholeRange),
                message: session.message
            };
        }
        async $provideResponse(handle, item, request, token) {
            const entry = this._inputProvider.get(handle);
            if (!entry) {
                return undefined;
            }
            const sessionData = this._inputSessions.get(item.id);
            if (!sessionData) {
                return;
            }
            const apiRequest = {
                prompt: request.prompt,
                selection: typeConvert.Selection.to(request.selection),
                wholeRange: typeConvert.Range.to(request.wholeRange),
                attempt: request.attempt,
                live: request.live,
                previewDocument: this._documents.getDocument(uri_1.URI.revive(request.previewDocument)),
                withIntentDetection: request.withIntentDetection,
            };
            let done = false;
            const progress = {
                report: async (value) => {
                    if (!request.live && value.edits?.length) {
                        throw new Error('Progress reporting is only supported for live sessions');
                    }
                    if (done || token.isCancellationRequested) {
                        return;
                    }
                    await this._proxy.$handleProgressChunk(request.requestId, {
                        message: value.message,
                        edits: value.edits?.map(typeConvert.TextEdit.from),
                        editsShouldBeInstant: value.editsShouldBeInstant,
                        slashCommand: value.slashCommand?.command,
                        markdownFragment: extHostTypes.MarkdownString.isMarkdownString(value.content) ? value.content.value : value.content
                    });
                }
            };
            const task = Promise.resolve(entry.provider.provideInteractiveEditorResponse(sessionData.session, apiRequest, progress, token));
            let res;
            try {
                res = await (0, async_1.raceCancellation)(task, token);
            }
            finally {
                done = true;
            }
            if (!res) {
                return undefined;
            }
            const id = sessionData.responses.push(res) - 1;
            const stub = {
                wholeRange: typeConvert.Range.from(res.wholeRange),
                placeholder: res.placeholder,
            };
            if (!ExtHostInteractiveEditor._isEditResponse(res)) {
                return {
                    ...stub,
                    id,
                    type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                    message: typeConvert.MarkdownString.from(res.contents),
                    edits: []
                };
            }
            const { edits, contents } = res;
            const message = contents !== undefined ? typeConvert.MarkdownString.from(contents) : undefined;
            if (edits instanceof extHostTypes.WorkspaceEdit) {
                return {
                    ...stub,
                    id,
                    type: "bulkEdit" /* InlineChatResponseType.BulkEdit */,
                    edits: typeConvert.WorkspaceEdit.from(edits),
                    message
                };
            }
            else {
                return {
                    ...stub,
                    id,
                    type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                    edits: edits.map(typeConvert.TextEdit.from),
                    message
                };
            }
        }
        async $provideFollowups(handle, sessionId, responseId, token) {
            const entry = this._inputProvider.get(handle);
            const sessionData = this._inputSessions.get(sessionId);
            const response = sessionData?.responses[responseId];
            if (entry && response && entry.provider.provideFollowups) {
                const task = Promise.resolve(entry.provider.provideFollowups(sessionData.session, response, token));
                const followups = await (0, async_1.raceCancellation)(task, token);
                return followups?.map(typeConvert.ChatInlineFollowup.from);
            }
            return undefined;
        }
        $handleFeedback(handle, sessionId, responseId, kind) {
            const entry = this._inputProvider.get(handle);
            const sessionData = this._inputSessions.get(sessionId);
            const response = sessionData?.responses[responseId];
            if (entry && response) {
                const apiKind = typeConvert.InteractiveEditorResponseFeedbackKind.to(kind);
                entry.provider.handleInteractiveEditorResponseFeedback?.(sessionData.session, response, apiKind);
            }
        }
        $releaseSession(handle, sessionId) {
            // TODO@jrieken remove this
        }
        static _isEditResponse(thing) {
            return typeof thing === 'object' && typeof thing.edits === 'object';
        }
    }
    exports.ExtHostInteractiveEditor = ExtHostInteractiveEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdElubGluZUNoYXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RJbmxpbmVDaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBTSxlQUFlO2lCQUVMLFVBQUssR0FBRyxDQUFDLEFBQUosQ0FBSztRQUl6QixZQUNVLFNBQWlELEVBQ2pELFFBQWlEO1lBRGpELGNBQVMsR0FBVCxTQUFTLENBQXdDO1lBQ2pELGFBQVEsR0FBUixRQUFRLENBQXlDO1lBSmxELFdBQU0sR0FBVyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7UUFLOUMsQ0FBQzs7SUFHTixNQUFNLGNBQWM7UUFJbkIsWUFDVSxPQUF3QztZQUF4QyxZQUFPLEdBQVAsT0FBTyxDQUFpQztZQUh6QyxjQUFTLEdBQW1GLEVBQUUsQ0FBQztRQUlwRyxDQUFDO0tBQ0w7SUFFRCxNQUFhLHdCQUF3QjtpQkFFckIsWUFBTyxHQUFHLENBQUMsQUFBSixDQUFLO1FBTTNCLFlBQ0MsV0FBeUIsRUFDekIsZUFBZ0MsRUFDZixVQUE0QixFQUM1QixXQUF3QjtZQUR4QixlQUFVLEdBQVYsVUFBVSxDQUFrQjtZQUM1QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQVJ6QixtQkFBYyxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBQ3BELG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFTbkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQWtCckUsZUFBZSxDQUFDLGtCQUFrQixDQUFDLElBQUksNEJBQVUsQ0FDaEQseUJBQXlCLEVBQUUsa0JBQWtCLEVBQUUsa0NBQWtDLEVBQ2pGLENBQUMsSUFBSSxv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