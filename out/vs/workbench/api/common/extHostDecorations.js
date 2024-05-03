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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/platform/log/common/log", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/path", "vs/workbench/services/extensions/common/extensions"], function (require, exports, uri_1, extHost_protocol_1, extHostTypes_1, instantiation_1, extHostRpcService_1, log_1, arrays_1, strings_1, path_1, extensions_1) {
    "use strict";
    var ExtHostDecorations_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostDecorations = exports.ExtHostDecorations = void 0;
    let ExtHostDecorations = class ExtHostDecorations {
        static { ExtHostDecorations_1 = this; }
        static { this._handlePool = 0; }
        static { this._maxEventSize = 250; }
        constructor(extHostRpc, _logService) {
            this._logService = _logService;
            this._provider = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadDecorations);
        }
        registerFileDecorationProvider(provider, extensionDescription) {
            const handle = ExtHostDecorations_1._handlePool++;
            this._provider.set(handle, { provider, extensionDescription });
            this._proxy.$registerDecorationProvider(handle, extensionDescription.identifier.value);
            const listener = provider.onDidChangeFileDecorations && provider.onDidChangeFileDecorations(e => {
                if (!e) {
                    this._proxy.$onDidChange(handle, null);
                    return;
                }
                const array = (0, arrays_1.asArray)(e);
                if (array.length <= ExtHostDecorations_1._maxEventSize) {
                    this._proxy.$onDidChange(handle, array);
                    return;
                }
                // too many resources per event. pick one resource per folder, starting
                // with parent folders
                this._logService.warn('[Decorations] CAPPING events from decorations provider', extensionDescription.identifier.value, array.length);
                const mapped = array.map(uri => ({ uri, rank: (0, strings_1.count)(uri.path, '/') }));
                const groups = (0, arrays_1.groupBy)(mapped, (a, b) => a.rank - b.rank || (0, strings_1.compare)(a.uri.path, b.uri.path));
                const picked = [];
                outer: for (const uris of groups) {
                    let lastDirname;
                    for (const obj of uris) {
                        const myDirname = (0, path_1.dirname)(obj.uri.path);
                        if (lastDirname !== myDirname) {
                            lastDirname = myDirname;
                            if (picked.push(obj.uri) >= ExtHostDecorations_1._maxEventSize) {
                                break outer;
                            }
                        }
                    }
                }
                this._proxy.$onDidChange(handle, picked);
            });
            return new extHostTypes_1.Disposable(() => {
                listener?.dispose();
                this._proxy.$unregisterDecorationProvider(handle);
                this._provider.delete(handle);
            });
        }
        async $provideDecorations(handle, requests, token) {
            if (!this._provider.has(handle)) {
                // might have been unregistered in the meantime
                return Object.create(null);
            }
            const result = Object.create(null);
            const { provider, extensionDescription: extensionId } = this._provider.get(handle);
            await Promise.all(requests.map(async (request) => {
                try {
                    const { uri, id } = request;
                    const data = await Promise.resolve(provider.provideFileDecoration(uri_1.URI.revive(uri), token));
                    if (!data) {
                        return;
                    }
                    try {
                        extHostTypes_1.FileDecoration.validate(data);
                        if (data.badge && typeof data.badge !== 'string') {
                            (0, extensions_1.checkProposedApiEnabled)(extensionId, 'codiconDecoration');
                        }
                        result[id] = [data.propagate, data.tooltip, data.badge, data.color];
                    }
                    catch (e) {
                        this._logService.warn(`INVALID decoration from extension '${extensionId.identifier.value}': ${e}`);
                    }
                }
                catch (err) {
                    this._logService.error(err);
                }
            }));
            return result;
        }
    };
    exports.ExtHostDecorations = ExtHostDecorations;
    exports.ExtHostDecorations = ExtHostDecorations = ExtHostDecorations_1 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostDecorations);
    exports.IExtHostDecorations = (0, instantiation_1.createDecorator)('IExtHostDecorations');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0RGVjb3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFCekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7O2lCQUVmLGdCQUFXLEdBQUcsQ0FBQyxBQUFKLENBQUs7aUJBQ2hCLGtCQUFhLEdBQUcsR0FBRyxBQUFOLENBQU87UUFNbkMsWUFDcUIsVUFBOEIsRUFDckMsV0FBeUM7WUFBeEIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFMdEMsY0FBUyxHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1lBTzVELElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELDhCQUE4QixDQUFDLFFBQXVDLEVBQUUsb0JBQTJDO1lBQ2xILE1BQU0sTUFBTSxHQUFHLG9CQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLEVBQUUsb0JBQW9CLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXZGLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQywwQkFBMEIsSUFBSSxRQUFRLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9GLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDUixJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3ZDLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxNQUFNLEtBQUssR0FBRyxJQUFBLGdCQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxvQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUN4QyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsdUVBQXVFO2dCQUN2RSxzQkFBc0I7Z0JBQ3RCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNySSxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBQSxlQUFLLEVBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdkUsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBTyxFQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFBLGlCQUFPLEVBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUM3RixNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7Z0JBQ3pCLEtBQUssRUFBRSxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNsQyxJQUFJLFdBQStCLENBQUM7b0JBQ3BDLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ3hCLE1BQU0sU0FBUyxHQUFHLElBQUEsY0FBTyxFQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3hDLElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDOzRCQUMvQixXQUFXLEdBQUcsU0FBUyxDQUFDOzRCQUN4QixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG9CQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO2dDQUM5RCxNQUFNLEtBQUssQ0FBQzs0QkFDYixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sSUFBSSx5QkFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDMUIsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsbUJBQW1CLENBQUMsTUFBYyxFQUFFLFFBQTZCLEVBQUUsS0FBd0I7WUFFaEcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ2pDLCtDQUErQztnQkFDL0MsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBb0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRCxNQUFNLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDO1lBRXBGLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxPQUFPLEVBQUMsRUFBRTtnQkFDOUMsSUFBSSxDQUFDO29CQUNKLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDO29CQUM1QixNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDM0YsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNYLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxJQUFJLENBQUM7d0JBQ0osNkJBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQzlCLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7NEJBQ2xELElBQUEsb0NBQXVCLEVBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUM7d0JBQzNELENBQUM7d0JBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFtQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDckYsQ0FBQztvQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNaLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxXQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNwRyxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7O0lBNUZXLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBVTVCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSxpQkFBVyxDQUFBO09BWEQsa0JBQWtCLENBNkY5QjtJQUVZLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwrQkFBZSxFQUFzQixxQkFBcUIsQ0FBQyxDQUFDIn0=