/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/services/extensions/common/extensions"], function (require, exports, errors_1, lifecycle_1, extHost_protocol_1, typeConvert, extHostTypes, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostChatVariables = void 0;
    class ExtHostChatVariables {
        static { this._idPool = 0; }
        constructor(mainContext) {
            this._resolver = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadChatVariables);
        }
        async $resolveVariable(handle, requestId, messageText, token) {
            const item = this._resolver.get(handle);
            if (!item) {
                return undefined;
            }
            try {
                if (item.resolver.resolve2) {
                    (0, extensions_1.checkProposedApiEnabled)(item.extension, 'chatParticipantAdditions');
                    const stream = new ChatVariableResolverResponseStream(requestId, this._proxy);
                    const value = await item.resolver.resolve2(item.data.name, { prompt: messageText }, stream.apiObject, token);
                    if (value) {
                        return value.map(typeConvert.ChatVariable.from);
                    }
                }
                else {
                    const value = await item.resolver.resolve(item.data.name, { prompt: messageText }, token);
                    if (value) {
                        return value.map(typeConvert.ChatVariable.from);
                    }
                }
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
            }
            return undefined;
        }
        registerVariableResolver(extension, name, description, resolver) {
            const handle = ExtHostChatVariables._idPool++;
            this._resolver.set(handle, { extension, data: { name, description }, resolver: resolver });
            this._proxy.$registerVariable(handle, { name, description });
            return (0, lifecycle_1.toDisposable)(() => {
                this._resolver.delete(handle);
                this._proxy.$unregisterVariable(handle);
            });
        }
    }
    exports.ExtHostChatVariables = ExtHostChatVariables;
    class ChatVariableResolverResponseStream {
        constructor(_requestId, _proxy) {
            this._requestId = _requestId;
            this._proxy = _proxy;
            this._isClosed = false;
        }
        close() {
            this._isClosed = true;
        }
        get apiObject() {
            if (!this._apiObject) {
                const that = this;
                function throwIfDone(source) {
                    if (that._isClosed) {
                        const err = new Error('Response stream has been closed');
                        Error.captureStackTrace(err, source);
                        throw err;
                    }
                }
                const _report = (progress) => {
                    this._proxy.$handleProgressChunk(this._requestId, progress);
                };
                this._apiObject = {
                    progress(value) {
                        throwIfDone(this.progress);
                        const part = new extHostTypes.ChatResponseProgressPart(value);
                        const dto = typeConvert.ChatResponseProgressPart.to(part);
                        _report(dto);
                        return this;
                    },
                    reference(value) {
                        throwIfDone(this.reference);
                        const part = new extHostTypes.ChatResponseReferencePart(value);
                        const dto = typeConvert.ChatResponseReferencePart.to(part);
                        _report(dto);
                        return this;
                    },
                    push(part) {
                        throwIfDone(this.push);
                        if (part instanceof extHostTypes.ChatResponseReferencePart) {
                            _report(typeConvert.ChatResponseReferencePart.to(part));
                        }
                        else if (part instanceof extHostTypes.ChatResponseProgressPart) {
                            _report(typeConvert.ChatResponseProgressPart.to(part));
                        }
                        return this;
                    }
                };
            }
            return this._apiObject;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENoYXRWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RDaGF0VmFyaWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLG9CQUFvQjtpQkFFakIsWUFBTyxHQUFHLENBQUMsQUFBSixDQUFLO1FBSzNCLFlBQVksV0FBeUI7WUFIcEIsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFnSCxDQUFDO1lBSXBKLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsU0FBaUIsRUFBRSxXQUFtQixFQUFFLEtBQXdCO1lBQ3RHLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsSUFBSSxDQUFDO2dCQUNKLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDNUIsSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDBCQUEwQixDQUFDLENBQUM7b0JBQ3BFLE1BQU0sTUFBTSxHQUFHLElBQUksa0NBQWtDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDOUUsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sRUFB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