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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/common/logsActions", "vs/workbench/common/contributions", "vs/platform/files/common/files", "vs/workbench/services/output/common/output", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/workbench/services/log/common/logConstants", "vs/base/common/async", "vs/base/common/errors", "vs/workbench/contrib/logs/common/defaultLogLevels", "vs/platform/contextkey/common/contextkey", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/network"], function (require, exports, nls, platform_1, actionCommonCategories_1, actions_1, logsActions_1, contributions_1, files_1, output_1, lifecycle_1, log_1, instantiation_1, event_1, logConstants_1, async_1, errors_1, defaultLogLevels_1, contextkey_1, map_1, uriIdentity_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: logsActions_1.SetLogLevelAction.ID,
                title: logsActions_1.SetLogLevelAction.TITLE,
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(servicesAccessor) {
            return servicesAccessor.get(instantiation_1.IInstantiationService).createInstance(logsActions_1.SetLogLevelAction, logsActions_1.SetLogLevelAction.ID, logsActions_1.SetLogLevelAction.TITLE.value).run();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.setDefaultLogLevel',
                title: nls.localize2('setDefaultLogLevel', "Set Default Log Level"),
                category: actionCommonCategories_1.Categories.Developer,
            });
        }
        run(servicesAccessor, logLevel, extensionId) {
            return servicesAccessor.get(defaultLogLevels_1.IDefaultLogLevelsService).setDefaultLogLevel(logLevel, extensionId);
        }
    });
    let LogOutputChannels = class LogOutputChannels extends lifecycle_1.Disposable {
        constructor(logService, loggerService, contextKeyService, fileService, uriIdentityService) {
            super();
            this.logService = logService;
            this.loggerService = loggerService;
            this.contextKeyService = contextKeyService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.contextKeys = new map_1.CounterSet();
            this.outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            this.loggerDisposables = this._register(new lifecycle_1.DisposableMap());
            const contextKey = log_1.CONTEXT_LOG_LEVEL.bindTo(contextKeyService);
            contextKey.set((0, log_1.LogLevelToString)(loggerService.getLogLevel()));
            loggerService.onDidChangeLogLevel(e => {
                if ((0, log_1.isLogLevel)(e)) {
                    contextKey.set((0, log_1.LogLevelToString)(loggerService.getLogLevel()));
                }
            });
            this.onDidAddLoggers(loggerService.getRegisteredLoggers());
            this._register(loggerService.onDidChangeLoggers(({ added, removed }) => {
                this.onDidAddLoggers(added);
                this.onDidRemoveLoggers(removed);
            }));
            this._register(loggerService.onDidChangeVisibility(([resource, visibility]) => {
                const logger = loggerService.getRegisteredLogger(resource);
                if (logger) {
                    if (visibility) {
                        this.registerLogChannel(logger);
                    }
                    else {
                        this.deregisterLogChannel(logger);
                    }
                }
            }));
            this.registerShowWindowLogAction();
            this._register(event_1.Event.filter(contextKeyService.onDidChangeContext, e => e.affectsSome(this.contextKeys))(() => this.onDidChangeContext()));
        }
        onDidAddLoggers(loggers) {
            for (const logger of loggers) {
                if (logger.when) {
                    const contextKeyExpr = contextkey_1.ContextKeyExpr.deserialize(logger.when);
                    if (contextKeyExpr) {
                        for (const key of contextKeyExpr.keys()) {
                            this.contextKeys.add(key);
                        }
                        if (!this.contextKeyService.contextMatchesRules(contextKeyExpr)) {
                            continue;
                        }
                    }
                }
                if (logger.hidden) {
                    continue;
                }
                this.registerLogChannel(logger);
            }
        }
        onDidChangeContext() {
            for (const logger of this.loggerService.getRegisteredLoggers()) {
                if (logger.when) {
                    if (this.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(logger.when))) {
                        this.registerLogChannel(logger);
                    }
                    else {
                        this.deregisterLogChannel(logger);
                    }
                }
            }
        }
        onDidRemoveLoggers(loggers) {
            for (const logger of loggers) {
                if (logger.when) {
                    const contextKeyExpr = contextkey_1.ContextKeyExpr.deserialize(logger.when);
                    if (contextKeyExpr) {
                        for (const key of contextKeyExpr.keys()) {
                            this.contextKeys.delete(key);
                        }
                    }
                }
                this.deregisterLogChannel(logger);
            }
        }
        registerLogChannel(logger) {
            const channel = this.outputChannelRegistry.getChannel(logger.id);
            if (channel && this.uriIdentityService.extUri.isEqual(channel.file, logger.resource)) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const promise = (0, async_1.createCancelablePromise)(async (token) => {
                await (0, files_1.whenProviderRegistered)(logger.resource, this.fileService);
                try {
                    await this.whenFileExists(logger.resource, 1, token);
                    const existingChannel = this.outputChannelRegistry.getChannel(logger.id);
                    const remoteLogger = existingChannel?.file?.scheme === network_1.Schemas.vscodeRemote ? this.loggerService.getRegisteredLogger(existingChannel.file) : undefined;
                    if (remoteLogger) {
                        this.deregisterLogChannel(remoteLogger);
                    }
                    const hasToAppendRemote = existingChannel && logger.resource.scheme === network_1.Schemas.vscodeRemote;
                    const id = hasToAppendRemote ? `${logger.id}.remote` : logger.id;
                    const label = hasToAppendRemote ? nls.localize('remote name', "{0} (Remote)", logger.name ?? logger.id) : logger.name ?? logger.id;
                    this.outputChannelRegistry.registerChannel({ id, label, file: logger.resource, log: true, extensionId: logger.extensionId });
                    disposables.add((0, lifecycle_1.toDisposable)(() => this.outputChannelRegistry.removeChannel(id)));
                    if (remoteLogger) {
                        this.registerLogChannel(remoteLogger);
                    }
                }
                catch (error) {
                    if (!(0, errors_1.isCancellationError)(error)) {
                        this.logService.error('Error while registering log channel', logger.resource.toString(), (0, errors_1.getErrorMessage)(error));
                    }
                }
            });
            disposables.add((0, lifecycle_1.toDisposable)(() => promise.cancel()));
            this.loggerDisposables.set(logger.resource.toString(), disposables);
        }
        deregisterLogChannel(logger) {
            this.loggerDisposables.deleteAndDispose(logger.resource.toString());
        }
        async whenFileExists(file, trial, token) {
            const exists = await this.fileService.exists(file);
            if (exists) {
                return;
            }
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            if (trial > 10) {
                throw new Error(`Timed out while waiting for file to be created`);
            }
            this.logService.debug(`[Registering Log Channel] File does not exist. Waiting for 1s to retry.`, file.toString());
            await (0, async_1.timeout)(1000, token);
            await this.whenFileExists(file, trial + 1, token);
        }
        registerShowWindowLogAction() {
            this._register((0, actions_1.registerAction2)(class ShowWindowLogAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: logConstants_1.showWindowLogActionId,
                        title: nls.localize2('show window log', "Show Window Log"),
                        category: actionCommonCategories_1.Categories.Developer,
                        f1: true
                    });
                }
                async run(servicesAccessor) {
                    const outputService = servicesAccessor.get(output_1.IOutputService);
                    outputService.showChannel(logConstants_1.windowLogId);
                }
            }));
        }
    };
    LogOutputChannels = __decorate([
        __param(0, log_1.ILogService),
        __param(1, log_1.ILoggerService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, files_1.IFileService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], LogOutputChannels);
    let LogLevelMigration = class LogLevelMigration {
        constructor(defaultLogLevelsService) {
            defaultLogLevelsService.migrateLogLevels();
        }
    };
    LogLevelMigration = __decorate([
        __param(0, defaultLogLevels_1.IDefaultLogLevelsService)
    ], LogLevelMigration);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LogOutputChannels, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LogLevelMigration, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ncy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvZ3MvY29tbW9uL2xvZ3MuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBMEJoRyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwrQkFBaUIsQ0FBQyxFQUFFO2dCQUN4QixLQUFLLEVBQUUsK0JBQWlCLENBQUMsS0FBSztnQkFDOUIsUUFBUSxFQUFFLG1DQUFVLENBQUMsU0FBUztnQkFDOUIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLGdCQUFrQztZQUNyQyxPQUFPLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQywrQkFBaUIsRUFBRSwrQkFBaUIsQ0FBQyxFQUFFLEVBQUUsK0JBQWlCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2pKLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO1FBQ3BDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxxQ0FBcUM7Z0JBQ3pDLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLHVCQUF1QixDQUFDO2dCQUNuRSxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2FBQzlCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxHQUFHLENBQUMsZ0JBQWtDLEVBQUUsUUFBa0IsRUFBRSxXQUFvQjtZQUMvRSxPQUFPLGdCQUFnQixDQUFD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