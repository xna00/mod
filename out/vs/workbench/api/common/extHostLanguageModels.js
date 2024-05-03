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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/platform/progress/common/progress", "vs/platform/extensions/common/extensions", "vs/base/common/async", "vs/base/common/event", "vs/nls", "vs/workbench/services/authentication/common/authentication", "vs/base/common/errors", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostAuthentication", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, extHost_protocol_1, typeConvert, extHostTypes_1, progress_1, extensions_1, async_1, event_1, nls_1, authentication_1, errors_1, instantiation_1, extHostRpcService_1, extHostAuthentication_1, log_1) {
    "use strict";
    var ExtHostLanguageModels_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguageModels = exports.IExtHostLanguageModels = void 0;
    exports.IExtHostLanguageModels = (0, instantiation_1.createDecorator)('IExtHostLanguageModels');
    class LanguageModelResponseStream {
        constructor(option, stream) {
            this.option = option;
            this.stream = new async_1.AsyncIterableSource();
            this.stream = stream ?? new async_1.AsyncIterableSource();
        }
    }
    class LanguageModelResponse {
        constructor() {
            this._responseStreams = new Map();
            this._defaultStream = new async_1.AsyncIterableSource();
            this._isDone = false;
            this._isStreaming = false;
            const that = this;
            this.apiObject = {
                // result: promise,
                stream: that._defaultStream.asyncIterable,
                // streams: AsyncIterable<string>[] // FUTURE responses per N
            };
        }
        *_streams() {
            if (this._responseStreams.size > 0) {
                for (const [, value] of this._responseStreams) {
                    yield value.stream;
                }
            }
            else {
                yield this._defaultStream;
            }
        }
        handleFragment(fragment) {
            if (this._isDone) {
                return;
            }
            this._isStreaming = true;
            let res = this._responseStreams.get(fragment.index);
            if (!res) {
                if (this._responseStreams.size === 0) {
                    // the first response claims the default response
                    res = new LanguageModelResponseStream(fragment.index, this._defaultStream);
                }
                else {
                    res = new LanguageModelResponseStream(fragment.index);
                }
                this._responseStreams.set(fragment.index, res);
            }
            res.stream.emitOne(fragment.part);
        }
        get isStreaming() {
            return this._isStreaming;
        }
        reject(err) {
            this._isDone = true;
            for (const stream of this._streams()) {
                stream.reject(err);
            }
        }
        resolve() {
            this._isDone = true;
            for (const stream of this._streams()) {
                stream.resolve();
            }
        }
    }
    let ExtHostLanguageModels = class ExtHostLanguageModels {
        static { ExtHostLanguageModels_1 = this; }
        static { this._idPool = 1; }
        constructor(extHostRpc, _logService, _extHostAuthentication) {
            this._logService = _logService;
            this._extHostAuthentication = _extHostAuthentication;
            this._onDidChangeModelAccess = new event_1.Emitter();
            this._onDidChangeProviders = new event_1.Emitter();
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._languageModels = new Map();
            this._allLanguageModelData = new Map(); // these are ALL models, not just the one in this EH
            this._modelAccessList = new extensions_1.ExtensionIdentifierMap();
            this._pendingRequest = new Map();
            this._languageAccessInformationExtensions = new Set();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadLanguageModels);
        }
        dispose() {
            this._onDidChangeModelAccess.dispose();
            this._onDidChangeProviders.dispose();
        }
        registerLanguageModel(extension, identifier, provider, metadata) {
            const handle = ExtHostLanguageModels_1._idPool++;
            this._languageModels.set(handle, { extension: extension.identifier, provider, languageModelId: identifier });
            let auth;
            if (metadata.auth) {
                auth = {
                    providerLabel: extension.displayName || extension.name,
                    accountLabel: typeof metadata.auth === 'object' ? metadata.auth.label : undefined
                };
            }
            this._proxy.$registerLanguageModelProvider(handle, identifier, {
                extension: extension.identifier,
                identifier: identifier,
                model: metadata.name ?? '',
                auth
            });
            return (0, lifecycle_1.toDisposable)(() => {
                this._languageModels.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        async $provideLanguageModelResponse(handle, requestId, from, messages, options, token) {
            const data = this._languageModels.get(handle);
            if (!data) {
                return;
            }
            const progress = new progress_1.Progress(async (fragment) => {
                if (token.isCancellationRequested) {
                    this._logService.warn(`[CHAT](${data.extension.value}) CANNOT send progress because the REQUEST IS CANCELLED`);
                    return;
                }
                this._proxy.$handleProgressChunk(requestId, { index: fragment.index, part: fragment.part });
            });
            return data.provider.provideLanguageModelResponse2(messages.map(typeConvert.LanguageModelMessage.to), options, extensions_1.ExtensionIdentifier.toKey(from), progress, token);
        }
        //#region --- making request
        $updateLanguageModels(data) {
            const added = [];
            const removed = [];
            if (data.added) {
                for (const metadata of data.added) {
                    this._allLanguageModelData.set(metadata.identifier, metadata);
                    added.push(metadata.model);
                }
            }
            if (data.removed) {
                for (const id of data.removed) {
                    // clean up
                    this._allLanguageModelData.delete(id);
                    removed.push(id);
                    // cancel pending requests for this model
                    for (const [key, value] of this._pendingRequest) {
                        if (value.languageModelId === id) {
                            value.res.reject(new errors_1.CancellationError());
                            this._pendingRequest.delete(key);
                        }
                    }
                }
            }
            this._onDidChangeProviders.fire(Object.freeze({
                added: Object.freeze(added),
                removed: Object.freeze(removed)
            }));
            // TODO@jrieken@TylerLeonhardt - this is a temporary hack to populate the auth providers
            data.added?.forEach(this._fakeAuthPopulate, this);
        }
        getLanguageModelIds() {
            return Array.from(this._allLanguageModelData.keys());
        }
        $updateModelAccesslist(data) {
            const updated = new Array();
            for (const { from, to, enabled } of data) {
                const set = this._modelAccessList.get(from) ?? new extensions_1.ExtensionIdentifierSet();
                const oldValue = set.has(to);
                if (oldValue !== enabled) {
                    if (enabled) {
                        set.add(to);
                    }
                    else {
                        set.delete(to);
                    }
                    this._modelAccessList.set(from, set);
                    const newItem = { from, to };
                    updated.push(newItem);
                    this._onDidChangeModelAccess.fire(newItem);
                }
            }
        }
        async sendChatRequest(extension, languageModelId, messages, options, token) {
            const from = extension.identifier;
            const metadata = await this._proxy.$prepareChatAccess(from, languageModelId, options.justification);
            if (!metadata || !this._allLanguageModelData.has(languageModelId)) {
                throw extHostTypes_1.LanguageModelError.NotFound(`Language model '${languageModelId}' is unknown.`);
            }
            if (this._isUsingAuth(from, metadata)) {
                const success = await this._getAuthAccess(extension, { identifier: metadata.extension, displayName: metadata.auth.providerLabel }, options.justification, options.silent);
                if (!success || !this._modelAccessList.get(from)?.has(metadata.extension)) {
                    throw extHostTypes_1.LanguageModelError.NoPermissions(`Language model '${languageModelId}' cannot be used by '${from.value}'.`);
                }
            }
            const requestId = (Math.random() * 1e6) | 0;
            const requestPromise = this._proxy.$fetchResponse(from, languageModelId, requestId, messages.map(typeConvert.LanguageModelMessage.from), options.modelOptions ?? {}, token);
            const barrier = new async_1.Barrier();
            const res = new LanguageModelResponse();
            this._pendingRequest.set(requestId, { languageModelId, res });
            let error;
            requestPromise.catch(err => {
                if (barrier.isOpen()) {
                    // we received an error while streaming. this means we need to reject the "stream"
                    // because we have already returned the request object
                    res.reject(err);
                }
                else {
                    error = err;
                }
            }).finally(() => {
                this._pendingRequest.delete(requestId);
                res.resolve();
                barrier.open();
            });
            await barrier.wait();
            if (error) {
                throw new extHostTypes_1.LanguageModelError(`Language model '${languageModelId}' errored, check cause for more details`, 'Unknown', error);
            }
            return res.apiObject;
        }
        async $handleResponseFragment(requestId, chunk) {
            const data = this._pendingRequest.get(requestId); //.report(chunk);
            if (data) {
                data.res.handleFragment(chunk);
            }
        }
        // BIG HACK: Using AuthenticationProviders to check access to Language Models
        async _getAuthAccess(from, to, justification, silent) {
            // This needs to be done in both MainThread & ExtHost ChatProvider
            const providerId = authentication_1.INTERNAL_AUTH_PROVIDER_PREFIX + to.identifier.value;
            const session = await this._extHostAuthentication.getSession(from, providerId, [], { silent: true });
            if (session) {
                this.$updateModelAccesslist([{ from: from.identifier, to: to.identifier, enabled: true }]);
                return true;
            }
            if (silent) {
                return false;
            }
            try {
                const detail = justification
                    ? (0, nls_1.localize)('chatAccessWithJustification', "To allow access to the language models provided by {0}. Justification:\n\n{1}", to.displayName, justification)
                    : (0, nls_1.localize)('chatAccess', "To allow access to the language models provided by {0}", to.displayName);
                await this._extHostAuthentication.getSession(from, providerId, [], { forceNewSession: { detail } });
                this.$updateModelAccesslist([{ from: from.identifier, to: to.identifier, enabled: true }]);
                return true;
            }
            catch (err) {
                // ignore
                return false;
            }
        }
        _isUsingAuth(from, toMetadata) {
            // If the 'to' extension uses an auth check
            return !!toMetadata.auth
                // And we're asking from a different extension
                && !extensions_1.ExtensionIdentifier.equals(toMetadata.extension, from);
        }
        async _fakeAuthPopulate(metadata) {
            for (const from of this._languageAccessInformationExtensions) {
                try {
                    await this._getAuthAccess(from, { identifier: metadata.extension, displayName: '' }, undefined, true);
                }
                catch (err) {
                    this._logService.error('Fake Auth request failed');
                    this._logService.error(err);
                }
            }
        }
        createLanguageModelAccessInformation(from) {
            this._languageAccessInformationExtensions.add(from);
            const that = this;
            const _onDidChangeAccess = event_1.Event.signal(event_1.Event.filter(this._onDidChangeModelAccess.event, e => extensions_1.ExtensionIdentifier.equals(e.from, from.identifier)));
            const _onDidAddRemove = event_1.Event.signal(this._onDidChangeProviders.event);
            return {
                get onDidChange() {
                    return event_1.Event.any(_onDidChangeAccess, _onDidAddRemove);
                },
                canSendRequest(languageModelId) {
                    const data = that._allLanguageModelData.get(languageModelId);
                    if (!data) {
                        return undefined;
                    }
                    if (!that._isUsingAuth(from.identifier, data)) {
                        return true;
                    }
                    const list = that._modelAccessList.get(from.identifier);
                    if (!list) {
                        return undefined;
                    }
                    return list.has(data.extension);
                }
            };
        }
    };
    exports.ExtHostLanguageModels = ExtHostLanguageModels;
    exports.ExtHostLanguageModels = ExtHostLanguageModels = ExtHostLanguageModels_1 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService),
        __param(2, extHostAuthentication_1.IExtHostAuthentication)
    ], ExtHostLanguageModels);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExhbmd1YWdlTW9kZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0TGFuZ3VhZ2VNb2RlbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXVCbkYsUUFBQSxzQkFBc0IsR0FBRyxJQUFBLCtCQUFlLEVBQXlCLHdCQUF3QixDQUFDLENBQUM7SUFReEcsTUFBTSwyQkFBMkI7UUFJaEMsWUFDVSxNQUFjLEVBQ3ZCLE1BQW9DO1lBRDNCLFdBQU0sR0FBTixNQUFNLENBQVE7WUFIZixXQUFNLEdBQUcsSUFBSSwyQkFBbUIsRUFBVSxDQUFDO1lBTW5ELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLElBQUksMkJBQW1CLEVBQVUsQ0FBQztRQUMzRCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLHFCQUFxQjtRQVMxQjtZQUxpQixxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBdUMsQ0FBQztZQUNsRSxtQkFBYyxHQUFHLElBQUksMkJBQW1CLEVBQVUsQ0FBQztZQUM1RCxZQUFPLEdBQVksS0FBSyxDQUFDO1lBQ3pCLGlCQUFZLEdBQVksS0FBSyxDQUFDO1lBSXJDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztZQUNsQixJQUFJLENBQUMsU0FBUyxHQUFHO2dCQUNoQixtQkFBbUI7Z0JBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWE7Z0JBQ3pDLDZEQUE2RDthQUM3RCxDQUFDO1FBQ0gsQ0FBQztRQUVPLENBQUUsUUFBUTtZQUNqQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BDLEtBQUssTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFD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