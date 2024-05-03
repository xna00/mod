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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/workbench/services/output/common/output", "vs/workbench/contrib/output/browser/outputLinkProvider", "vs/editor/common/services/resolverService", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/output/common/outputChannelModelService", "vs/editor/common/languages/language", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/logs/common/logsActions", "vs/workbench/contrib/logs/common/defaultLogLevels"], function (require, exports, event_1, uri_1, lifecycle_1, instantiation_1, storage_1, platform_1, output_1, outputLinkProvider_1, resolverService_1, log_1, lifecycle_2, viewsService_1, outputChannelModelService_1, language_1, contextkey_1, logsActions_1, defaultLogLevels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputService = void 0;
    const OUTPUT_ACTIVE_CHANNEL_KEY = 'output.activechannel';
    let OutputChannel = class OutputChannel extends lifecycle_1.Disposable {
        constructor(outputChannelDescriptor, outputChannelModelService, languageService) {
            super();
            this.outputChannelDescriptor = outputChannelDescriptor;
            this.scrollLock = false;
            this.id = outputChannelDescriptor.id;
            this.label = outputChannelDescriptor.label;
            this.uri = uri_1.URI.from({ scheme: output_1.OUTPUT_SCHEME, path: this.id });
            this.model = this._register(outputChannelModelService.createOutputChannelModel(this.id, this.uri, outputChannelDescriptor.languageId ? languageService.createById(outputChannelDescriptor.languageId) : languageService.createByMimeType(outputChannelDescriptor.log ? output_1.LOG_MIME : output_1.OUTPUT_MIME), outputChannelDescriptor.file));
        }
        append(output) {
            this.model.append(output);
        }
        update(mode, till) {
            this.model.update(mode, till, true);
        }
        clear() {
            this.model.clear();
        }
        replace(value) {
            this.model.replace(value);
        }
    };
    OutputChannel = __decorate([
        __param(1, outputChannelModelService_1.IOutputChannelModelService),
        __param(2, language_1.ILanguageService)
    ], OutputChannel);
    let OutputService = class OutputService extends lifecycle_1.Disposable {
        constructor(storageService, instantiationService, textModelResolverService, logService, loggerService, lifecycleService, viewsService, contextKeyService, defaultLogLevelsService) {
            super();
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.loggerService = loggerService;
            this.lifecycleService = lifecycleService;
            this.viewsService = viewsService;
            this.defaultLogLevelsService = defaultLogLevelsService;
            this.channels = new Map();
            this._onActiveOutputChannel = this._register(new event_1.Emitter());
            this.onActiveOutputChannel = this._onActiveOutputChannel.event;
            this.activeChannelIdInStorage = this.storageService.get(OUTPUT_ACTIVE_CHANNEL_KEY, 1 /* StorageScope.WORKSPACE */, '');
            this.activeOutputChannelContext = output_1.ACTIVE_OUTPUT_CHANNEL_CONTEXT.bindTo(contextKeyService);
            this.activeOutputChannelContext.set(this.activeChannelIdInStorage);
            this._register(this.onActiveOutputChannel(channel => this.activeOutputChannelContext.set(channel)));
            this.activeFileOutputChannelContext = output_1.CONTEXT_ACTIVE_FILE_OUTPUT.bindTo(contextKeyService);
            this.activeOutputChannelLevelSettableContext = output_1.CONTEXT_ACTIVE_OUTPUT_LEVEL_SETTABLE.bindTo(contextKeyService);
            this.activeOutputChannelLevelContext = output_1.CONTEXT_ACTIVE_OUTPUT_LEVEL.bindTo(contextKeyService);
            this.activeOutputChannelLevelIsDefaultContext = output_1.CONTEXT_ACTIVE_OUTPUT_LEVEL_IS_DEFAULT.bindTo(contextKeyService);
            // Register as text model content provider for output
            textModelResolverService.registerTextModelContentProvider(output_1.OUTPUT_SCHEME, this);
            instantiationService.createInstance(outputLinkProvider_1.OutputLinkProvider);
            // Create output channels for already registered channels
            const registry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            for (const channelIdentifier of registry.getChannels()) {
                this.onDidRegisterChannel(channelIdentifier.id);
            }
            this._register(registry.onDidRegisterChannel(this.onDidRegisterChannel, this));
            // Set active channel to first channel if not set
            if (!this.activeChannel) {
                const channels = this.getChannelDescriptors();
                this.setActiveChannel(channels && channels.length > 0 ? this.getChannel(channels[0].id) : undefined);
            }
            this._register(event_1.Event.filter(this.viewsService.onDidChangeViewVisibility, e => e.id === output_1.OUTPUT_VIEW_ID && e.visible)(() => {
                if (this.activeChannel) {
                    this.viewsService.getActiveViewWithId(output_1.OUTPUT_VIEW_ID)?.showChannel(this.activeChannel, true);
                }
            }));
            this._register(this.loggerService.onDidChangeLogLevel(_level => {
                this.setLevelContext();
                this.setLevelIsDefaultContext();
            }));
            this._register(this.defaultLogLevelsService.onDidChangeDefaultLogLevels(() => {
                this.setLevelIsDefaultContext();
            }));
            this._register(this.lifecycleService.onDidShutdown(() => this.dispose()));
        }
        provideTextContent(resource) {
            const channel = this.getChannel(resource.path);
            if (channel) {
                return channel.model.loadModel();
            }
            return null;
        }
        async showChannel(id, preserveFocus) {
            const channel = this.getChannel(id);
            if (this.activeChannel?.id !== channel?.id) {
                this.setActiveChannel(channel);
                this._onActiveOutputChannel.fire(id);
            }
            const outputView = await this.viewsService.openView(output_1.OUTPUT_VIEW_ID, !preserveFocus);
            if (outputView && channel) {
                outputView.showChannel(channel, !!preserveFocus);
            }
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        getChannelDescriptor(id) {
            return platform_1.Registry.as(output_1.Extensions.OutputChannels).getChannel(id);
        }
        getChannelDescriptors() {
            return platform_1.Registry.as(output_1.Extensions.OutputChannels).getChannels();
        }
        getActiveChannel() {
            return this.activeChannel;
        }
        async onDidRegisterChannel(channelId) {
            const channel = this.createChannel(channelId);
            this.channels.set(channelId, channel);
            if (!this.activeChannel || this.activeChannelIdInStorage === channelId) {
                this.setActiveChannel(channel);
                this._onActiveOutputChannel.fire(channelId);
                const outputView = this.viewsService.getActiveViewWithId(output_1.OUTPUT_VIEW_ID);
                outputView?.showChannel(channel, true);
            }
        }
        createChannel(id) {
            const channel = this.instantiateChannel(id);
            this._register(event_1.Event.once(channel.model.onDispose)(() => {
                if (this.activeChannel === channel) {
                    const channels = this.getChannelDescriptors();
                    const channel = channels.length ? this.getChannel(channels[0].id) : undefined;
                    if (channel && this.viewsService.isViewVisible(output_1.OUTPUT_VIEW_ID)) {
                        this.showChannel(channel.id);
                    }
                    else {
                        this.setActiveChannel(undefined);
                    }
                }
                platform_1.Registry.as(output_1.Extensions.OutputChannels).removeChannel(id);
            }));
            return channel;
        }
        instantiateChannel(id) {
            const channelData = platform_1.Registry.as(output_1.Extensions.OutputChannels).getChannel(id);
            if (!channelData) {
                this.logService.error(`Channel '${id}' is not registered yet`);
                throw new Error(`Channel '${id}' is not registered yet`);
            }
            return this.instantiationService.createInstance(OutputChannel, channelData);
        }
        setLevelContext() {
            const descriptor = this.activeChannel?.outputChannelDescriptor;
            const channelLogLevel = descriptor?.log ? this.loggerService.getLogLevel(descriptor.file) : undefined;
            this.activeOutputChannelLevelContext.set(channelLogLevel !== undefined ? (0, log_1.LogLevelToString)(channelLogLevel) : '');
        }
        async setLevelIsDefaultContext() {
            const descriptor = this.activeChannel?.outputChannelDescriptor;
            if (descriptor?.log) {
                const channelLogLevel = this.loggerService.getLogLevel(descriptor.file);
                const channelDefaultLogLevel = await this.defaultLogLevelsService.getDefaultLogLevel(descriptor.extensionId);
                this.activeOutputChannelLevelIsDefaultContext.set(channelDefaultLogLevel === channelLogLevel);
            }
            else {
                this.activeOutputChannelLevelIsDefaultContext.set(false);
            }
        }
        setActiveChannel(channel) {
            this.activeChannel = channel;
            const descriptor = channel?.outputChannelDescriptor;
            this.activeFileOutputChannelContext.set(!!descriptor?.file);
            this.activeOutputChannelLevelSettableContext.set(descriptor !== undefined && logsActions_1.SetLogLevelAction.isLevelSettable(descriptor));
            this.setLevelIsDefaultContext();
            this.setLevelContext();
            if (this.activeChannel) {
                this.storageService.store(OUTPUT_ACTIVE_CHANNEL_KEY, this.activeChannel.id, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(OUTPUT_ACTIVE_CHANNEL_KEY, 1 /* StorageScope.WORKSPACE */);
            }
        }
    };
    exports.OutputService = OutputService;
    exports.OutputService = OutputService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, log_1.ILogService),
        __param(4, log_1.ILoggerService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, viewsService_1.IViewsService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, defaultLogLevels_1.IDefaultLogLevelsService)
    ], OutputService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0U2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL291dHB1dC9icm93c2VyL291dHB1dFNlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCaEcsTUFBTSx5QkFBeUIsR0FBRyxzQkFBc0IsQ0FBQztJQUV6RCxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7UUFRckMsWUFDVSx1QkFBaUQsRUFDOUIseUJBQXFELEVBQy9ELGVBQWlDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBSkMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQVAzRCxlQUFVLEdBQVksS0FBSyxDQUFDO1lBWTNCLElBQUksQ0FBQyxFQUFFLEdBQUcsdUJBQXVCLENBQUMsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxLQUFLLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBQzNDLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxzQkFBYSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMseUJBQXlCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsaUJBQVEsQ0FB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