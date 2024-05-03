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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/chat/common/annotations", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatWordCounter"], function (require, exports, event_1, lifecycle_1, marked_1, instantiation_1, log_1, annotations_1, chatModel_1, chatWordCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatResponseViewModel = exports.ChatRequestViewModel = exports.ChatViewModel = void 0;
    exports.isRequestVM = isRequestVM;
    exports.isResponseVM = isResponseVM;
    exports.isWelcomeVM = isWelcomeVM;
    function isRequestVM(item) {
        return !!item && typeof item === 'object' && 'message' in item;
    }
    function isResponseVM(item) {
        return !!item && typeof item.setVote !== 'undefined';
    }
    function isWelcomeVM(item) {
        return !!item && typeof item === 'object' && 'content' in item;
    }
    let ChatViewModel = class ChatViewModel extends lifecycle_1.Disposable {
        get inputPlaceholder() {
            return this._inputPlaceholder;
        }
        get model() {
            return this._model;
        }
        setInputPlaceholder(text) {
            this._inputPlaceholder = text;
            this._onDidChange.fire({ kind: 'changePlaceholder' });
        }
        resetInputPlaceholder() {
            this._inputPlaceholder = undefined;
            this._onDidChange.fire({ kind: 'changePlaceholder' });
        }
        get sessionId() {
            return this._model.sessionId;
        }
        get requestInProgress() {
            return this._model.requestInProgress;
        }
        get providerId() {
            return this._model.providerId;
        }
        get initState() {
            return this._model.initState;
        }
        constructor(_model, codeBlockModelCollection, instantiationService) {
            super();
            this._model = _model;
            this.codeBlockModelCollection = codeBlockModelCollection;
            this.instantiationService = instantiationService;
            this._onDidDisposeModel = this._register(new event_1.Emitter());
            this.onDidDisposeModel = this._onDidDisposeModel.event;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._items = [];
            this._inputPlaceholder = undefined;
            _model.getRequests().forEach((request, i) => {
                const requestModel = this.instantiationService.createInstance(ChatRequestViewModel, request);
                this._items.push(requestModel);
                this.updateCodeBlockTextModels(requestModel);
                if (request.response) {
                    this.onAddResponse(request.response);
                }
            });
            this._register(_model.onDidDispose(() => this._onDidDisposeModel.fire()));
            this._register(_model.onDidChange(e => {
                if (e.kind === 'addRequest') {
                    const requestModel = this.instantiationService.createInstance(ChatRequestViewModel, e.request);
                    this._items.push(requestModel);
                    this.updateCodeBlockTextModels(requestModel);
                    if (e.request.response) {
                        this.onAddResponse(e.request.response);
                    }
                }
                else if (e.kind === 'addResponse') {
                    this.onAddResponse(e.response);
                }
                else if (e.kind === 'removeRequest') {
                    const requestIdx = this._items.findIndex(item => isRequestVM(item) && item.id === e.requestId);
                    if (requestIdx >= 0) {
                        this._items.splice(requestIdx, 1);
                    }
                    const responseIdx = e.responseId && this._items.findIndex(item => isResponseVM(item) && item.id === e.responseId);
                    if (typeof responseIdx === 'number' && responseIdx >= 0) {
                        const items = this._items.splice(responseIdx, 1);
                        const item = items[0];
                        if (item instanceof ChatResponseViewModel) {
                            item.dispose();
                        }
                    }
                }
                const modelEventToVmEvent = e.kind === 'addRequest' ? { kind: 'addRequest' } :
                    e.kind === 'initialize' ? { kind: 'initialize' } :
                        null;
                this._onDidChange.fire(modelEventToVmEvent);
            }));
        }
        onAddResponse(responseModel) {
            const response = this.instantiationService.createInstance(ChatResponseViewModel, responseModel);
            this._register(response.onDidChange(() => {
                if (response.isComplete) {
                    this.updateCodeBlockTextModels(response);
                }
                return this._onDidChange.fire(null);
            }));
            this._items.push(response);
            this.updateCodeBlockTextModels(response);
        }
        getItems() {
            return [...(this._model.welcomeMessage ? [this._model.welcomeMessage] : []), ...this._items];
        }
        dispose() {
            super.dispose();
            this._items
                .filter((item) => item instanceof ChatResponseViewModel)
                .forEach((item) => item.dispose());
        }
        updateCodeBlockTextModels(model) {
            let content;
            if (isRequestVM(model)) {
                content = model.messageText;
            }
            else {
                content = (0, annotations_1.annotateVulnerabilitiesInText)(model.response.value).map(x => x.content.value).join('');
            }
            let codeBlockIndex = 0;
            const renderer = new marked_1.marked.Renderer();
            renderer.code = (value, languageId) => {
                languageId ??= '';
                const newText = this.fixCodeText(value, languageId);
                this.codeBlockModelCollection.update(this._model.sessionId, model, codeBlockIndex++, { text: newText, languageId });
                return '';
            };
            marked_1.marked.parse(this.ensureFencedCodeBlocksTerminated(content), { renderer });
        }
        fixCodeText(text, languageId) {
            if (languageId === 'php') {
                if (!text.trim().startsWith('<')) {
                    return `<?php\n${text}\n?>`;
                }
            }
            return text;
        }
        /**
         * Marked doesn't consistently render fenced code blocks that aren't terminated.
         *
         * Try to close them ourselves to workaround this.
         */
        ensureFencedCodeBlocksTerminated(content) {
            const lines = content.split('\n');
            let inCodeBlock = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                }
            }
            // If we're still in a code block at the end of the content, add a closing fence
            if (inCodeBlock) {
                lines.push('```');
            }
            return lines.join('\n');
        }
    };
    exports.ChatViewModel = ChatViewModel;
    exports.ChatViewModel = ChatViewModel = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], ChatViewModel);
    class ChatRequestViewModel {
        get id() {
            return this._model.id;
        }
        get dataId() {
            return this.id + `_${chatModel_1.ChatModelInitState[this._model.session.initState]}`;
        }
        get sessionId() {
            return this._model.session.sessionId;
        }
        get username() {
            return this._model.username;
        }
        get avatarIcon() {
            return this._model.avatarIconUri;
        }
        get message() {
            return this._model.message;
        }
        get messageText() {
            return this.message.text;
        }
        constructor(_model) {
            this._model = _model;
        }
    }
    exports.ChatRequestViewModel = ChatRequestViewModel;
    let ChatResponseViewModel = class ChatResponseViewModel extends lifecycle_1.Disposable {
        get id() {
            return this._model.id;
        }
        get dataId() {
            return this._model.id + `_${this._modelChangeCount}` + `_${chatModel_1.ChatModelInitState[this._model.session.initState]}`;
        }
        get providerId() {
            return this._model.providerId;
        }
        get sessionId() {
            return this._model.session.sessionId;
        }
        get username() {
            return this._model.username;
        }
        get avatarIcon() {
            return this._model.avatarIcon;
        }
        get agent() {
            return this._model.agent;
        }
        get slashCommand() {
            return this._model.slashCommand;
        }
        get agentOrSlashCommandDetected() {
            return this._model.agentOrSlashCommandDetected;
        }
        get response() {
            return this._model.response;
        }
        get usedContext() {
            return this._model.usedContext;
        }
        get contentReferences() {
            return this._model.contentReferences;
        }
        get progressMessages() {
            return this._model.progressMessages;
        }
        get edits() {
            return this._model.edits;
        }
        get isComplete() {
            return this._model.isComplete;
        }
        get isCanceled() {
            return this._model.isCanceled;
        }
        get replyFollowups() {
            return this._model.followups?.filter((f) => f.kind === 'reply');
        }
        get result() {
            return this._model.result;
        }
        get errorDetails() {
            return this.result?.errorDetails;
        }
        get vote() {
            return this._model.vote;
        }
        get requestId() {
            return this._model.requestId;
        }
        get isStale() {
            return this._model.isStale;
        }
        get usedReferencesExpanded() {
            if (typeof this._usedReferencesExpanded === 'boolean') {
                return this._usedReferencesExpanded;
            }
            return this.response.value.length === 0;
        }
        set usedReferencesExpanded(v) {
            this._usedReferencesExpanded = v;
        }
        get vulnerabilitiesListExpanded() {
            return this._vulnerabilitiesListExpanded;
        }
        set vulnerabilitiesListExpanded(v) {
            this._vulnerabilitiesListExpanded = v;
        }
        get contentUpdateTimings() {
            return this._contentUpdateTimings;
        }
        constructor(_model, logService) {
            super();
            this._model = _model;
            this.logService = logService;
            this._modelChangeCount = 0;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.renderData = undefined;
            this._vulnerabilitiesListExpanded = false;
            this._contentUpdateTimings = undefined;
            if (!_model.isComplete) {
                this._contentUpdateTimings = {
                    loadingStartTime: Date.now(),
                    lastUpdateTime: Date.now(),
                    impliedWordLoadRate: 0,
                    lastWordCount: 0
                };
            }
            this._register(_model.onDidChange(() => {
                if (this._contentUpdateTimings) {
                    // This should be true, if the model is changing
                    const now = Date.now();
                    const wordCount = (0, chatWordCounter_1.countWords)(_model.response.asString());
                    const timeDiff = now - this._contentUpdateTimings.loadingStartTime;
                    const impliedWordLoadRate = this._contentUpdateTimings.lastWordCount / (timeDiff / 1000);
                    this.trace('onDidChange', `Update- got ${this._contentUpdateTimings.lastWordCount} words over ${timeDiff}ms = ${impliedWordLoadRate} words/s. ${wordCount} words are now available.`);
                    this._contentUpdateTimings = {
                        loadingStartTime: this._contentUpdateTimings.loadingStartTime,
                        lastUpdateTime: now,
                        impliedWordLoadRate,
                        lastWordCount: wordCount
                    };
                }
                else {
                    this.logService.warn('ChatResponseViewModel#onDidChange: got model update but contentUpdateTimings is not initialized');
                }
                // new data -> new id, new content to render
                this._modelChangeCount++;
                this._onDidChange.fire();
            }));
        }
        trace(tag, message) {
            this.logService.trace(`ChatResponseViewModel#${tag}: ${message}`);
        }
        setVote(vote) {
            this._modelChangeCount++;
            this._model.setVote(vote);
        }
    };
    exports.ChatResponseViewModel = ChatResponseViewModel;
    exports.ChatResponseViewModel = ChatResponseViewModel = __decorate([
        __param(1, log_1.ILogService)
    ], ChatResponseViewModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vY2hhdFZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLGtDQUVDO0lBRUQsb0NBRUM7SUFFRCxrQ0FFQztJQVZELFNBQWdCLFdBQVcsQ0FBQyxJQUFhO1FBQ3hDLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQztJQUNoRSxDQUFDO0lBRUQsU0FBZ0IsWUFBWSxDQUFDLElBQWE7UUFDekMsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJLE9BQVEsSUFBK0IsQ0FBQyxPQUFPLEtBQUssV0FBVyxDQUFDO0lBQ2xGLENBQUM7SUFFRCxTQUFnQixXQUFXLENBQUMsSUFBYTtRQUN4QyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUM7SUFDaEUsQ0FBQztJQStHTSxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7UUFXNUMsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRUQsbUJBQW1CLENBQUMsSUFBWTtZQUMvQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQs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