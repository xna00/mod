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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/services/output/common/output", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/views/common/viewsService", "vs/base/common/types"], function (require, exports, platform_1, output_1, extHost_protocol_1, extHostCustomers_1, uri_1, lifecycle_1, event_1, viewsService_1, types_1) {
    "use strict";
    var MainThreadOutputService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadOutputService = void 0;
    let MainThreadOutputService = class MainThreadOutputService extends lifecycle_1.Disposable {
        static { MainThreadOutputService_1 = this; }
        static { this._extensionIdPool = new Map(); }
        constructor(extHostContext, outputService, viewsService) {
            super();
            this._outputService = outputService;
            this._viewsService = viewsService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostOutputService);
            const setVisibleChannel = () => {
                const visibleChannel = this._viewsService.isViewVisible(output_1.OUTPUT_VIEW_ID) ? this._outputService.getActiveChannel() : undefined;
                this._proxy.$setVisibleChannel(visibleChannel ? visibleChannel.id : null);
            };
            this._register(event_1.Event.any(this._outputService.onActiveOutputChannel, event_1.Event.filter(this._viewsService.onDidChangeViewVisibility, ({ id }) => id === output_1.OUTPUT_VIEW_ID))(() => setVisibleChannel()));
            setVisibleChannel();
        }
        async $register(label, file, languageId, extensionId) {
            const idCounter = (MainThreadOutputService_1._extensionIdPool.get(extensionId) || 0) + 1;
            MainThreadOutputService_1._extensionIdPool.set(extensionId, idCounter);
            const id = `extension-output-${extensionId}-#${idCounter}-${label}`;
            const resource = uri_1.URI.revive(file);
            platform_1.Registry.as(output_1.Extensions.OutputChannels).registerChannel({ id, label, file: resource, log: false, languageId, extensionId });
            this._register((0, lifecycle_1.toDisposable)(() => this.$dispose(id)));
            return id;
        }
        async $update(channelId, mode, till) {
            const channel = this._getChannel(channelId);
            if (channel) {
                if (mode === output_1.OutputChannelUpdateMode.Append) {
                    channel.update(mode);
                }
                else if ((0, types_1.isNumber)(till)) {
                    channel.update(mode, till);
                }
            }
        }
        async $reveal(channelId, preserveFocus) {
            const channel = this._getChannel(channelId);
            if (channel) {
                this._outputService.showChannel(channel.id, preserveFocus);
            }
        }
        async $close(channelId) {
            if (this._viewsService.isViewVisible(output_1.OUTPUT_VIEW_ID)) {
                const activeChannel = this._outputService.getActiveChannel();
                if (activeChannel && channelId === activeChannel.id) {
                    this._viewsService.closeView(output_1.OUTPUT_VIEW_ID);
                }
            }
        }
        async $dispose(channelId) {
            const channel = this._getChannel(channelId);
            channel?.dispose();
        }
        _getChannel(channelId) {
            return this._outputService.getChannel(channelId);
        }
    };
    exports.MainThreadOutputService = MainThreadOutputService;
    exports.MainThreadOutputService = MainThreadOutputService = MainThreadOutputService_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadOutputService),
        __param(1, output_1.IOutputService),
        __param(2, viewsService_1.IViewsService)
    ], MainThreadOutputService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE91dHB1dFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkT3V0cHV0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7O2lCQUV2QyxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQUFBNUIsQ0FBNkI7UUFNNUQsWUFDQyxjQUErQixFQUNmLGFBQTZCLEVBQzlCLFlBQTJCO1lBRTFDLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUM7WUFDcEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7WUFFbEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUUzRSxNQUFNLGlCQUFpQixHQUFHLEdBQUcsRUFBRTtnQkFDOUIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsdUJBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDN0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNFLENBQUMsQ0FBQztZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBTSxJQUFJLENBQUMsY0FBYyxDQUFDLHFCQUFxQixF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