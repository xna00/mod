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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, lifecycle_1, extHost_protocol_1, aiEmbeddingVectorService_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadAiEmbeddingVector = void 0;
    let MainThreadAiEmbeddingVector = class MainThreadAiEmbeddingVector extends lifecycle_1.Disposable {
        constructor(context, _AiEmbeddingVectorService) {
            super();
            this._AiEmbeddingVectorService = _AiEmbeddingVectorService;
            this._registrations = this._register(new lifecycle_1.DisposableMap());
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostAiEmbeddingVector);
        }
        $registerAiEmbeddingVectorProvider(model, handle) {
            const provider = {
                provideAiEmbeddingVector: (strings, token) => {
                    return this._proxy.$provideAiEmbeddingVector(handle, strings, token);
                },
            };
            this._registrations.set(handle, this._AiEmbeddingVectorService.registerAiEmbeddingVectorProvider(model, provider));
        }
        $unregisterAiEmbeddingVectorProvider(handle) {
            this._registrations.deleteAndDispose(handle);
        }
    };
    exports.MainThreadAiEmbeddingVector = MainThreadAiEmbeddingVector;
    exports.MainThreadAiEmbeddingVector = MainThreadAiEmbeddingVector = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadAiEmbeddingVector),
        __param(1, aiEmbeddingVectorService_1.IAiEmbeddingVectorService)
    ], MainThreadAiEmbeddingVector);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEFpRW1iZWRkaW5nVmVjdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZEFpRW1iZWRkaW5nVmVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBSTFELFlBQ0MsT0FBd0IsRUFDRyx5QkFBcUU7WUFFaEcsS0FBSyxFQUFFLENBQUM7WUFGb0MsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUEyQjtZQUpoRixtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFVLENBQUMsQ0FBQztZQU83RSxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxrQ0FBa0MsQ0FBQyxLQUFhLEVBQUUsTUFBYztZQUMvRCxNQUFNLFFBQVEsR0FBK0I7Z0JBQzVDLHdCQUF3QixFQUFFLENBQUMsT0FBaUIsRUFBRSxLQUF3QixFQUFFLEVBQUU7b0JBQ3pFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FDM0MsTUFBTSxFQUNOLE9BQU8sRUFDUCxLQUFLLENBQ0wsQ0FBQztnQkFDSCxDQUFDO2FBQ0QsQ0FBQztZQUNGLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMseUJBQXlCLENBQUMsaUNBQWlDLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDcEgsQ0FBQztRQUVELG9DQUFvQyxDQUFDLE1BQWM7WUFDbEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM5QyxDQUFDO0tBQ0QsQ0FBQTtJQTVCWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUR2QyxJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsMkJBQTJCLENBQUM7UUFPM0QsV0FBQSxvREFBeUIsQ0FBQTtPQU5mLDJCQUEyQixDQTRCdkMifQ==