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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/scm/common/quickDiff", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, cancellation_1, lifecycle_1, uri_1, extHost_protocol_1, quickDiff_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadQuickDiff = void 0;
    let MainThreadQuickDiff = class MainThreadQuickDiff {
        constructor(extHostContext, quickDiffService) {
            this.quickDiffService = quickDiffService;
            this.providerDisposables = new lifecycle_1.DisposableMap();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostQuickDiff);
        }
        async $registerQuickDiffProvider(handle, selector, label, rootUri) {
            const provider = {
                label,
                rootUri: uri_1.URI.revive(rootUri),
                selector,
                isSCM: false,
                getOriginalResource: async (uri) => {
                    return uri_1.URI.revive(await this.proxy.$provideOriginalResource(handle, uri, cancellation_1.CancellationToken.None));
                }
            };
            const disposable = this.quickDiffService.addQuickDiffProvider(provider);
            this.providerDisposables.set(handle, disposable);
        }
        async $unregisterQuickDiffProvider(handle) {
            if (this.providerDisposables.has(handle)) {
                this.providerDisposables.deleteAndDispose(handle);
            }
        }
        dispose() {
            this.providerDisposables.dispose();
        }
    };
    exports.MainThreadQuickDiff = MainThreadQuickDiff;
    exports.MainThreadQuickDiff = MainThreadQuickDiff = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadQuickDiff),
        __param(1, quickDiff_1.IQuickDiffService)
    ], MainThreadQuickDiff);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFF1aWNrRGlmZi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRRdWlja0RpZmYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBSy9CLFlBQ0MsY0FBK0IsRUFDWixnQkFBb0Q7WUFBbkMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUpoRSx3QkFBbUIsR0FBRyxJQUFJLHlCQUFhLEVBQXVCLENBQUM7WUFNdEUsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN2RSxDQUFDO1FBRUQsS0FBSyxDQUFDLDBCQUEwQixDQUFDLE1BQWMsRUFBRSxRQUE4QixFQUFFLEtBQWEsRUFBRSxPQUFrQztZQUNqSSxNQUFNLFFBQVEsR0FBc0I7Z0JBQ25DLEtBQUs7Z0JBQ0wsT0FBTyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO2dCQUM1QixRQUFRO2dCQUNSLEtBQUssRUFBRSxLQUFLO2dCQUNaLG1CQUFtQixFQUFFLEtBQUssRUFBRSxHQUFRLEVBQUUsRUFBRTtvQkFDdkMsT0FBTyxTQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25HLENBQUM7YUFDRCxDQUFDO1lBQ0YsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCxLQUFLLENBQUMsNEJBQTRCLENBQUMsTUFBYztZQUNoRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25ELENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNwQyxDQUFDO0tBQ0QsQ0FBQTtJQW5DWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQUQvQixJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsbUJBQW1CLENBQUM7UUFRbkQsV0FBQSw2QkFBaUIsQ0FBQTtPQVBQLG1CQUFtQixDQW1DL0IifQ==