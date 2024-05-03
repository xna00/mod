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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/editor/editorInput", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, cancellation_1, codicons_1, event_1, lifecycle_1, network_1, uri_1, nls, iconRegistry_1, editorInput_1, chatService_1) {
    "use strict";
    var ChatEditorInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatEditorInputSerializer = exports.ChatUri = exports.ChatEditorModel = exports.ChatEditorInput = void 0;
    const ChatEditorIcon = (0, iconRegistry_1.registerIcon)('chat-editor-label-icon', codicons_1.Codicon.commentDiscussion, nls.localize('chatEditorLabelIcon', 'Icon of the chat editor label.'));
    let ChatEditorInput = class ChatEditorInput extends editorInput_1.EditorInput {
        static { ChatEditorInput_1 = this; }
        static { this.countsInUse = new Set(); }
        static { this.TypeID = 'workbench.input.chatSession'; }
        static { this.EditorID = 'workbench.editor.chatSession'; }
        static getNewEditorUri() {
            const handle = Math.floor(Math.random() * 1e9);
            return ChatUri.generate(handle);
        }
        static getNextCount() {
            let count = 0;
            while (ChatEditorInput_1.countsInUse.has(count)) {
                count++;
            }
            return count;
        }
        constructor(resource, options, chatService) {
            super();
            this.resource = resource;
            this.options = options;
            this.chatService = chatService;
            const parsed = ChatUri.parse(resource);
            if (typeof parsed?.handle !== 'number') {
                throw new Error('Invalid chat URI');
            }
            this.sessionId = 'sessionId' in options.target ? options.target.sessionId : undefined;
            this.providerId = 'providerId' in options.target ? options.target.providerId : undefined;
            this.inputCount = ChatEditorInput_1.getNextCount();
            ChatEditorInput_1.countsInUse.add(this.inputCount);
            this._register((0, lifecycle_1.toDisposable)(() => ChatEditorInput_1.countsInUse.delete(this.inputCount)));
        }
        get editorId() {
            return ChatEditorInput_1.EditorID;
        }
        get capabilities() {
            return super.capabilities | 8 /* EditorInputCapabilities.Singleton */;
        }
        matches(otherInput) {
            return otherInput instanceof ChatEditorInput_1 && otherInput.resource.toString() === this.resource.toString();
        }
        get typeId() {
            return ChatEditorInput_1.TypeID;
        }
        getName() {
            return this.model?.title || nls.localize('chatEditorName', "Chat") + (this.inputCount > 0 ? ` ${this.inputCount + 1}` : '');
        }
        getIcon() {
            return ChatEditorIcon;
        }
        async resolve() {
            if (typeof this.sessionId === 'string') {
                this.model = this.chatService.getOrRestoreSession(this.sessionId);
            }
            else if (typeof this.providerId === 'string') {
                this.model = this.chatService.startSession(this.providerId, cancellation_1.CancellationToken.None);
            }
            else if ('data' in this.options.target) {
                this.model = this.chatService.loadSessionFromContent(this.options.target.data);
            }
            if (!this.model) {
                return null;
            }
            this.sessionId = this.model.sessionId;
            this.providerId = this.model.providerId;
            this._register(this.model.onDidChange(() => this._onDidChangeLabel.fire()));
            return this._register(new ChatEditorModel(this.model));
        }
        dispose() {
            super.dispose();
            if (this.sessionId) {
                this.chatService.clearSession(this.sessionId);
            }
        }
    };
    exports.ChatEditorInput = ChatEditorInput;
    exports.ChatEditorInput = ChatEditorInput = ChatEditorInput_1 = __decorate([
        __param(2, chatService_1.IChatService)
    ], ChatEditorInput);
    class ChatEditorModel extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._isDisposed = false;
            this._isResolved = false;
        }
        async resolve() {
            this._isResolved = true;
        }
        isResolved() {
            return this._isResolved;
        }
        isDisposed() {
            return this._isDisposed;
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
    }
    exports.ChatEditorModel = ChatEditorModel;
    var ChatUri;
    (function (ChatUri) {
        ChatUri.scheme = network_1.Schemas.vscodeChatSesssion;
        function generate(handle) {
            return uri_1.URI.from({ scheme: ChatUri.scheme, path: `chat-${handle}` });
        }
        ChatUri.generate = generate;
        function parse(resource) {
            if (resource.scheme !== ChatUri.scheme) {
                return undefined;
            }
            const match = resource.path.match(/chat-(\d+)/);
            const handleStr = match?.[1];
            if (typeof handleStr !== 'string') {
                return undefined;
            }
            const handle = parseInt(handleStr);
            if (isNaN(handle)) {
                return undefined;
            }
            return { handle };
        }
        ChatUri.parse = parse;
    })(ChatUri || (exports.ChatUri = ChatUri = {}));
    class ChatEditorInputSerializer {
        canSerialize(input) {
            return input instanceof ChatEditorInput && typeof input.sessionId === 'string';
        }
        serialize(input) {
            if (!this.canSerialize(input)) {
                return undefined;
            }
            const obj = {
                options: input.options,
                sessionId: input.sessionId,
                resource: input.resource
            };
            return JSON.stringify(obj);
        }
        deserialize(instantiationService, serializedEditor) {
            try {
                const parsed = JSON.parse(serializedEditor);
                const resource = uri_1.URI.revive(parsed.resource);
                return instantiationService.createInstance(ChatEditorInput, resource, { ...parsed.options, target: { sessionId: parsed.sessionId } });
            }
            catch (err) {
                return undefined;
            }
        }
    }
    exports.ChatEditorInputSerializer = ChatEditorInputSerializer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEVkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdEVkaXRvcklucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQmhHLE1BQU0sY0FBYyxHQUFHLElBQUEsMkJBQVksRUFBQyx3QkFBd0IsRUFBRSxrQkFBTyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO0lBRXpKLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEseUJBQVc7O2lCQUMvQixnQkFBVyxHQUFHLElBQUksR0FBRyxFQUFVLEFBQXBCLENBQXFCO2lCQUVoQyxXQUFNLEdBQVcsNkJBQTZCLEFBQXhDLENBQXlDO2lCQUMvQyxhQUFRLEdBQVcsOEJBQThCLEFBQXpDLENBQTBDO1FBUWxFLE1BQU0sQ0FBQyxlQUFlO1lBQ3JCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsTUFBTSxDQUFDLFlBQVk7WUFDbEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsT0FBTyxpQkFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsS0FBSyxFQUFFLENBQUM7WUFDVCxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsWUFDVSxRQUFhLEVBQ2IsT0FBMkIsRUFDTCxXQUF5QjtZQUV4RCxLQUFL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