/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes"], function (require, exports, extHost_protocol_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostAiEmbeddingVector = void 0;
    class ExtHostAiEmbeddingVector {
        constructor(mainContext) {
            this._AiEmbeddingVectorProviders = new Map();
            this._nextHandle = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadAiEmbeddingVector);
        }
        async $provideAiEmbeddingVector(handle, strings, token) {
            if (this._AiEmbeddingVectorProviders.size === 0) {
                throw new Error('No embedding vector providers registered');
            }
            const provider = this._AiEmbeddingVectorProviders.get(handle);
            if (!provider) {
                throw new Error('Embedding vector provider not found');
            }
            const result = await provider.provideEmbeddingVector(strings, token);
            if (!result) {
                throw new Error('Embedding vector provider returned undefined');
            }
            return result;
        }
        registerEmbeddingVectorProvider(extension, model, provider) {
            const handle = this._nextHandle;
            this._nextHandle++;
            this._AiEmbeddingVectorProviders.set(handle, provider);
            this._proxy.$registerAiEmbeddingVectorProvider(model, handle);
            return new extHostTypes_1.Disposable(() => {
                this._proxy.$unregisterAiEmbeddingVectorProvider(handle);
                this._AiEmbeddingVectorProviders.delete(handle);
            });
        }
    }
    exports.ExtHostAiEmbeddingVector = ExtHostAiEmbeddingVector;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEVtYmVkZGluZ1ZlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEVtYmVkZGluZ1ZlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSx3QkFBd0I7UUFNcEMsWUFDQyxXQUF5QjtZQU5sQixnQ0FBMkIsR0FBeUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUM5RSxnQkFBVyxHQUFHLENBQUMsQ0FBQztZQU92QixJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCxLQUFLLENBQUMseUJBQXlCLENBQUMsTUFBYyxFQUFFLE9BQWlCLEVBQUUsS0FBd0I7WUFDMUYsSUFBSSxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7WUFDN0QsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsc0JBQXNCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixNQUFNLElBQUksS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7WUFDakUsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELCtCQUErQixDQUFDLFNBQWdDLEVBQUUsS0FBYSxFQUFFLFFBQWlDO1lBQ2pILE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxNQUFNLENBQUMsa0NBQWtDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlELE9BQU8sSUFBSSx5QkFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQ0FBb0MsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLDJCQUEyQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQXZDRCw0REF1Q0MifQ==