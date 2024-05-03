/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageModelsService = exports.ILanguageModelsService = exports.ChatMessageRole = void 0;
    var ChatMessageRole;
    (function (ChatMessageRole) {
        ChatMessageRole[ChatMessageRole["System"] = 0] = "System";
        ChatMessageRole[ChatMessageRole["User"] = 1] = "User";
        ChatMessageRole[ChatMessageRole["Assistant"] = 2] = "Assistant";
    })(ChatMessageRole || (exports.ChatMessageRole = ChatMessageRole = {}));
    exports.ILanguageModelsService = (0, instantiation_1.createDecorator)('ILanguageModelsService');
    class LanguageModelsService {
        constructor() {
            this._providers = new Map();
            this._onDidChangeProviders = new event_1.Emitter();
            this.onDidChangeLanguageModels = this._onDidChangeProviders.event;
        }
        dispose() {
            this._onDidChangeProviders.dispose();
            this._providers.clear();
        }
        getLanguageModelIds() {
            return Array.from(this._providers.keys());
        }
        lookupLanguageModel(identifier) {
            return this._providers.get(identifier)?.metadata;
        }
        registerLanguageModelChat(identifier, provider) {
            if (this._providers.has(identifier)) {
                throw new Error(`Chat response provider with identifier ${identifier} is already registered.`);
            }
            this._providers.set(identifier, provider);
            this._onDidChangeProviders.fire({ added: [provider.metadata] });
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._providers.delete(identifier)) {
                    this._onDidChangeProviders.fire({ removed: [identifier] });
                }
            });
        }
        makeLanguageModelChatRequest(identifier, from, messages, options, progress, token) {
            const provider = this._providers.get(identifier);
            if (!provider) {
                throw new Error(`Chat response provider with identifier ${identifier} is not registered.`);
            }
            return provider.provideChatResponse(messages, from, options, progress, token);
        }
    }
    exports.LanguageModelsService = LanguageModelsService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VNb2RlbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvY29tbW9uL2xhbmd1YWdlTW9kZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxJQUFrQixlQUlqQjtJQUpELFdBQWtCLGVBQWU7UUFDaEMseURBQU0sQ0FBQTtRQUNOLHFEQUFJLENBQUE7UUFDSiwrREFBUyxDQUFBO0lBQ1YsQ0FBQyxFQUppQixlQUFlLCtCQUFmLGVBQWUsUUFJaEM7SUE0QlksUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHdCQUF3QixDQUFDLENBQUM7SUFpQnhHLE1BQWEscUJBQXFCO1FBQWxDO1lBR2tCLGVBQVUsR0FBb0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUV4RCwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBZ0UsQ0FBQztZQUM1Ryw4QkFBeUIsR0FBd0UsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztRQW1DNUksQ0FBQztRQWpDQSxPQUFPO1lBQ04sSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELG1CQUFtQjtZQUNsQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxVQUFrQjtZQUNyQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsQ0FBQztRQUNsRCxDQUFDO1FBRUQseUJBQXlCLENBQUMsVUFBa0IsRUFBRSxRQUE0QjtZQUN6RSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLFVBQVUseUJBQXlCLENBQUMsQ0FBQztZQUNoRyxDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO29CQUN4QyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM1RCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsNEJBQTRCLENBQUMsVUFBa0IsRUFBRSxJQUF5QixFQUFFLFFBQXdCLEVBQUUsT0FBZ0MsRUFBRSxRQUEwQyxFQUFFLEtBQXdCO1lBQzNNLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxVQUFVLHFCQUFxQixDQUFDLENBQUM7WUFDNUYsQ0FBQztZQUNELE9BQU8sUUFBUSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvRSxDQUFDO0tBQ0Q7SUF6Q0Qsc0RBeUNDIn0=