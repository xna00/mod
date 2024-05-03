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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/network", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent", "vs/workbench/services/assignment/common/assignmentService", "vs/workbench/services/host/browser/host", "vs/platform/configuration/common/configuration", "vs/base/common/linkedText", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedExtensionPoint", "vs/platform/instantiation/common/extensions", "vs/base/common/path", "vs/base/common/arrays", "vs/workbench/services/views/common/viewsService", "vs/nls", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/workspaceContains", "vs/platform/workspace/common/workspace", "vs/base/common/cancellation", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, instantiation_1, event_1, storage_1, memento_1, actions_1, commands_1, contextkey_1, lifecycle_1, userDataSync_1, uri_1, resources_1, network_1, extensionManagement_1, gettingStartedContent_1, assignmentService_1, host_1, configuration_1, linkedText_1, gettingStartedExtensionPoint_1, extensions_1, path_1, arrays_1, viewsService_1, nls_1, telemetry_1, workspaceContains_1, workspace_1, cancellation_1, extensionManagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertInternalMediaPathToFileURI = exports.parseDescription = exports.WalkthroughsService = exports.walkthroughMetadataConfigurationKey = exports.hiddenEntriesConfigurationKey = exports.IWalkthroughsService = exports.HasMultipleNewFileEntries = void 0;
    exports.HasMultipleNewFileEntries = new contextkey_1.RawContextKey('hasMultipleNewFileEntries', false);
    exports.IWalkthroughsService = (0, instantiation_1.createDecorator)('walkthroughsService');
    exports.hiddenEntriesConfigurationKey = 'workbench.welcomePage.hiddenCategories';
    exports.walkthroughMetadataConfigurationKey = 'workbench.welcomePage.walkthroughMetadata';
    const BUILT_IN_SOURCE = (0, nls_1.localize)('builtin', "Built-In");
    // Show walkthrough as "new" for 7 days after first install
    const DAYS = 24 * 60 * 60 * 1000;
    const NEW_WALKTHROUGH_TIME = 7 * DAYS;
    let WalkthroughsService = class WalkthroughsService extends lifecycle_1.Disposable {
        constructor(storageService, commandService, instantiationService, workspaceContextService, contextService, userDataSyncEnablementService, configurationService, extensionManagementService, hostService, viewsService, telemetryService, tasExperimentService) {
            super();
            this.storageService = storageService;
            this.commandService = commandService;
            this.instantiationService = instantiationService;
            this.workspaceContextService = workspaceContextService;
            this.contextService = contextService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.configurationService = configurationService;
            this.extensionManagementService = extensionManagementService;
            this.hostService = hostService;
            this.viewsService = viewsService;
            this.telemetryService = telemetryService;
            this.tasExperimentService = tasExperimentService;
            this._onDidAddWalkthrough = new event_1.Emitter();
            this.onDidAddWalkthrough = this._onDidAddWalkthrough.event;
            this._onDidRemoveWalkthrough = new event_1.Emitter();
            this.onDidRemoveWalkthrough = this._onDidRemoveWalkthrough.event;
            this._onDidChangeWalkthrough = new event_1.Emitter();
            this.onDidChangeWalkthrough = this._onDidChangeWalkthrough.event;
            this._onDidProgressStep = new event_1.Emitter();
            this.onDidProgressStep = this._onDidProgressStep.event;
            this.sessionEvents = new Set();
            this.completionListeners = new Map();
            this.gettingStartedContributions = new Map();
            this.steps = new Map();
            this.sessionInstalledExtensions = new Set();
            this.categoryVisibilityContextKeys = new Set();
            this.stepCompletionContextKeyExpressions = new Set();
            this.stepCompletionContextKeys = new Set();
            this.metadata = new Map(JSON.parse(this.storageService.get(exports.walkthroughMetadataConfigurationKey, 0 /* StorageScope.PROFILE */, '[]')));
            this.memento = new memento_1.Memento('gettingStartedService', this.storageService);
            this.stepProgress = this.memento.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            this.initCompletionEventListeners();
            exports.HasMultipleNewFileEntries.bindTo(this.contextService).set(false);
            this.registerWalkthroughs();
        }
        registerWalkthroughs() {
            gettingStartedContent_1.walkthroughs.forEach(async (category, index) => {
                this._registerWalkthrough({
                    ...category,
                    icon: { type: 'icon', icon: category.icon },
                    order: gettingStartedContent_1.walkthroughs.length - index,
                    source: BUILT_IN_SOURCE,
                    when: contextkey_1.ContextKeyExpr.deserialize(category.when) ?? contextkey_1.ContextKeyExpr.true(),
                    steps: category.content.steps.map((step, index) => {
                        return ({
                            ...step,
                            completionEvents: step.completionEvents ?? [],
                            description: (0, exports.parseDescription)(step.description),
                            category: category.id,
                            order: index,
                            when: contextkey_1.ContextKeyExpr.deserialize(step.when) ?? contextkey_1.ContextKeyExpr.true(),
                            media: step.media.type === 'image'
                                ? {
                                    type: 'image',
                                    altText: step.media.altText,
                                    path: convertInternalMediaPathsToBrowserURIs(step.media.path)
                                }
                                : step.media.type === 'svg'
                                    ? {
                                        type: 'svg',
                                        altText: step.media.altText,
                                        path: (0, exports.convertInternalMediaPathToFileURI)(step.media.path).with({ query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeGettingStarted/common/media/' + step.media.path }) })
                                    }
                                    : {
                                        type: 'markdown',
                                        path: (0, exports.convertInternalMediaPathToFileURI)(step.media.path).with({ query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeGettingStarted/common/media/' + step.media.path }) }),
                                        base: network_1.FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/'),
                                        root: network_1.FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/'),
                                    },
                        });
                    })
                });
            });
            gettingStartedExtensionPoint_1.walkthroughsExtensionPoint.setHandler((_, { added, removed }) => {
                added.map(e => this.registerExtensionWalkthroughContributions(e.description));
                removed.map(e => this.unregisterExtensionWalkthroughContributions(e.description));
            });
        }
        initCompletionEventListeners() {
            this._register(this.commandService.onDidExecuteCommand(command => this.progressByEvent(`onCommand:${command.commandId}`)));
            this.extensionManagementService.getInstalled().then(installed => {
                installed.forEach(ext => this.progressByEvent(`extensionInstalled:${ext.identifier.id.toLowerCase()}`));
            });
            this._register(this.extensionManagementService.onDidInstallExtensions(async (result) => {
                const hadLastFoucs = await this.hostService.hadLastFocus();
                for (const e of result) {
                    const skipWalkthrough = e?.context?.[extensionManagement_1.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT] || e?.context?.[extensionManagement_1.EXTENSION_INSTALL_DEP_PACK_CONTEXT];
                    // If the window had last focus and the install didn't specify to skip the walkthrough
                    // Then add it to the sessionInstallExtensions to be opened
                    if (hadLastFoucs && !skipWalkthrough) {
                        this.sessionInstalledExtensions.add(e.identifier.id.toLowerCase());
                    }
                    this.progressByEvent(`extensionInstalled:${e.identifier.id.toLowerCase()}`);
                }
            }));
            this._register(this.contextService.onDidChangeContext(event => {
                if (event.affectsSome(this.stepCompletionContextKeys)) {
                    this.stepCompletionContextKeyExpressions.forEach(expression => {
                        if (event.affectsSome(new Set(expression.keys())) && this.contextService.contextMatchesRules(expression)) {
                            this.progressByEvent(`onContext:` + expression.serialize());
                        }
                    });
                }
            }));
            this._register(this.viewsService.onDidChangeViewVisibility(e => {
                if (e.visible) {
                    this.progressByEvent('onView:' + e.id);
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                e.affectedKeys.forEach(key => { this.progressByEvent('onSettingChanged:' + key); });
            }));
            if (this.userDataSyncEnablementService.isEnabled()) {
                this.progressByEvent('onEvent:sync-enabled');
            }
            this._register(this.userDataSyncEnablementService.onDidChangeEnablement(() => {
                if (this.userDataSyncEnablementService.isEnabled()) {
                    this.progressByEvent('onEvent:sync-enabled');
                }
            }));
        }
        markWalkthroughOpened(id) {
            const walkthrough = this.gettingStartedContributions.get(id);
            const prior = this.metadata.get(id);
            if (prior && walkthrough) {
                this.metadata.set(id, { ...prior, manaullyOpened: true, stepIDs: walkthrough.steps.map(s => s.id) });
            }
            this.storageService.store(exports.walkthroughMetadataConfigurationKey, JSON.stringify([...this.metadata.entries()]), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        async registerExtensionWalkthroughContributions(extension) {
            const convertExtensionPathToFileURI = (path) => path.startsWith('https://')
                ? uri_1.URI.parse(path, true)
                : network_1.FileAccess.uriToFileUri((0, resources_1.joinPath)(extension.extensionLocation, path));
            const convertExtensionRelativePathsToBrowserURIs = (path) => {
                const convertPath = (path) => path.startsWith('https://')
                    ? uri_1.URI.parse(path, true)
                    : network_1.FileAccess.uriToBrowserUri((0, resources_1.joinPath)(extension.extensionLocation, path));
                if (typeof path === 'string') {
                    const converted = convertPath(path);
                    return { hcDark: converted, hcLight: converted, dark: converted, light: converted };
                }
                else {
                    return {
                        hcDark: convertPath(path.hc),
                        hcLight: convertPath(path.hcLight ?? path.light),
                        light: convertPath(path.light),
                        dark: convertPath(path.dark)
                    };
                }
            };
            if (!(extension.contributes?.walkthroughs?.length)) {
                return;
            }
            let sectionToOpen;
            let sectionToOpenIndex = Math.min(); // '+Infinity';
            await Promise.all(extension.contributes?.walkthroughs?.map(async (walkthrough, index) => {
                const categoryID = extension.identifier.value + '#' + walkthrough.id;
                const isNewlyInstalled = !this.metadata.get(categoryID);
                if (isNewlyInstalled) {
                    this.metadata.set(categoryID, { firstSeen: +new Date(), stepIDs: walkthrough.steps?.map(s => s.id) ?? [], manaullyOpened: false });
                }
                const override = await Promise.race([
                    this.tasExperimentService?.getTreatment(`gettingStarted.overrideCategory.${extension.identifier.value + '.' + walkthrough.id}.when`),
                    new Promise(resolve => setTimeout(() => resolve(walkthrough.when), 5000))
                ]);
                if (this.sessionInstalledExtensions.has(extension.identifier.value.toLowerCase())
                    && this.contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(override ?? walkthrough.when) ?? contextkey_1.ContextKeyExpr.true())) {
                    this.sessionInstalledExtensions.delete(extension.identifier.value.toLowerCase());
                    if (index < sectionToOpenIndex && isNewlyInstalled) {
                        sectionToOpen = categoryID;
                        sectionToOpenIndex = index;
                    }
                }
                const steps = (walkthrough.steps ?? []).map((step, index) => {
                    const description = (0, exports.parseDescription)(step.description || '');
                    const fullyQualifiedID = extension.identifier.value + '#' + walkthrough.id + '#' + step.id;
                    let media;
                    if (!step.media) {
                        throw Error('missing media in walkthrough step: ' + walkthrough.id + '@' + step.id);
                    }
                    if (step.media.image) {
                        const altText = step.media.altText;
                        if (altText === undefined) {
                            console.error('Walkthrough item:', fullyQualifiedID, 'is missing altText for its media element.');
                        }
                        media = { type: 'image', altText, path: convertExtensionRelativePathsToBrowserURIs(step.media.image) };
                    }
                    else if (step.media.markdown) {
                        media = {
                            type: 'markdown',
                            path: convertExtensionPathToFileURI(step.media.markdown),
                            base: convertExtensionPathToFileURI((0, path_1.dirname)(step.media.markdown)),
                            root: network_1.FileAccess.uriToFileUri(extension.extensionLocation),
                        };
                    }
                    else if (step.media.svg) {
                        media = {
                            type: 'svg',
                            path: convertExtensionPathToFileURI(step.media.svg),
                            altText: step.media.svg,
                        };
                    }
                    // Throw error for unknown walkthrough format
                    else {
                        throw new Error('Unknown walkthrough format detected for ' + fullyQualifiedID);
                    }
                    return ({
                        description,
                        media,
                        completionEvents: step.completionEvents?.filter(x => typeof x === 'string') ?? [],
                        id: fullyQualifiedID,
                        title: step.title,
                        when: contextkey_1.ContextKeyExpr.deserialize(step.when) ?? contextkey_1.ContextKeyExpr.true(),
                        category: categoryID,
                        order: index,
                    });
                });
                let isFeatured = false;
                if (walkthrough.featuredFor) {
                    const folders = this.workspaceContextService.getWorkspace().folders.map(f => f.uri);
                    const token = new cancellation_1.CancellationTokenSource();
                    setTimeout(() => token.cancel(), 2000);
                    isFeatured = await this.instantiationService.invokeFunction(a => (0, workspaceContains_1.checkGlobFileExists)(a, folders, walkthrough.featuredFor, token.token));
                }
                const iconStr = walkthrough.icon ?? extension.icon;
                const walkthoughDescriptor = {
                    description: walkthrough.description,
                    title: walkthrough.title,
                    id: categoryID,
                    isFeatured,
                    source: extension.displayName ?? extension.name,
                    order: 0,
                    steps,
                    icon: {
                        type: 'image',
                        path: iconStr
                            ? network_1.FileAccess.uriToBrowserUri((0, resources_1.joinPath)(extension.extensionLocation, iconStr)).toString(true)
                            : extensionManagement_2.DefaultIconPath
                    },
                    when: contextkey_1.ContextKeyExpr.deserialize(override ?? walkthrough.when) ?? contextkey_1.ContextKeyExpr.true(),
                };
                this._registerWalkthrough(walkthoughDescriptor);
                this._onDidAddWalkthrough.fire(this.resolveWalkthrough(walkthoughDescriptor));
            }));
            this.storageService.store(exports.walkthroughMetadataConfigurationKey, JSON.stringify([...this.metadata.entries()]), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            if (sectionToOpen && this.configurationService.getValue('workbench.welcomePage.walkthroughs.openOnInstall')) {
                this.telemetryService.publicLog2('gettingStarted.didAutoOpenWalkthrough', { id: sectionToOpen });
                this.commandService.executeCommand('workbench.action.openWalkthrough', sectionToOpen, true);
            }
        }
        unregisterExtensionWalkthroughContributions(extension) {
            if (!(extension.contributes?.walkthroughs?.length)) {
                return;
            }
            extension.contributes?.walkthroughs?.forEach(section => {
                const categoryID = extension.identifier.value + '#' + section.id;
                section.steps.forEach(step => {
                    const fullyQualifiedID = extension.identifier.value + '#' + section.id + '#' + step.id;
                    this.steps.delete(fullyQualifiedID);
                });
                this.gettingStartedContributions.delete(categoryID);
                this._onDidRemoveWalkthrough.fire(categoryID);
            });
        }
        getWalkthrough(id) {
            const walkthrough = this.gettingStartedContributions.get(id);
            if (!walkthrough) {
                throw Error('Trying to get unknown walkthrough: ' + id);
            }
            return this.resolveWalkthrough(walkthrough);
        }
        getWalkthroughs() {
            const registeredCategories = [...this.gettingStartedContributions.values()];
            const categoriesWithCompletion = registeredCategories
                .map(category => {
                return {
                    ...category,
                    content: {
                        type: 'steps',
                        steps: category.steps
                    }
                };
            })
                .filter(category => category.content.type !== 'steps' || category.content.steps.length)
                .map(category => this.resolveWalkthrough(category));
            return categoriesWithCompletion;
        }
        resolveWalkthrough(category) {
            const stepsWithProgress = category.steps.map(step => this.getStepProgress(step));
            const hasOpened = this.metadata.get(category.id)?.manaullyOpened;
            const firstSeenDate = this.metadata.get(category.id)?.firstSeen;
            const isNew = firstSeenDate && firstSeenDate > (+new Date() - NEW_WALKTHROUGH_TIME);
            const lastStepIDs = this.metadata.get(category.id)?.stepIDs;
            const rawCategory = this.gettingStartedContributions.get(category.id);
            if (!rawCategory) {
                throw Error('Could not find walkthrough with id ' + category.id);
            }
            const currentStepIds = rawCategory.steps.map(s => s.id);
            const hasNewSteps = lastStepIDs && (currentStepIds.length !== lastStepIDs.length || currentStepIds.some((id, index) => id !== lastStepIDs[index]));
            let recencyBonus = 0;
            if (firstSeenDate) {
                const currentDate = +new Date();
                const timeSinceFirstSeen = currentDate - firstSeenDate;
                recencyBonus = Math.max(0, (NEW_WALKTHROUGH_TIME - timeSinceFirstSeen) / NEW_WALKTHROUGH_TIME);
            }
            return {
                ...category,
                recencyBonus,
                steps: stepsWithProgress,
                newItems: !!hasNewSteps,
                newEntry: !!(isNew && !hasOpened),
            };
        }
        getStepProgress(step) {
            return {
                ...step,
                done: false,
                ...this.stepProgress[step.id]
            };
        }
        progressStep(id) {
            const oldProgress = this.stepProgress[id];
            if (!oldProgress || oldProgress.done !== true) {
                this.stepProgress[id] = { done: true };
                this.memento.saveMemento();
                const step = this.getStep(id);
                if (!step) {
                    throw Error('Tried to progress unknown step');
                }
                this._onDidProgressStep.fire(this.getStepProgress(step));
            }
        }
        deprogressStep(id) {
            delete this.stepProgress[id];
            this.memento.saveMemento();
            const step = this.getStep(id);
            this._onDidProgressStep.fire(this.getStepProgress(step));
        }
        progressByEvent(event) {
            if (this.sessionEvents.has(event)) {
                return;
            }
            this.sessionEvents.add(event);
            this.completionListeners.get(event)?.forEach(id => this.progressStep(id));
        }
        registerWalkthrough(walkthoughDescriptor) {
            this._registerWalkthrough({
                ...walkthoughDescriptor,
                steps: walkthoughDescriptor.steps.map(step => ({ ...step, description: (0, exports.parseDescription)(step.description) }))
            });
        }
        _registerWalkthrough(walkthroughDescriptor) {
            const oldCategory = this.gettingStartedContributions.get(walkthroughDescriptor.id);
            if (oldCategory) {
                console.error(`Skipping attempt to overwrite walkthrough. (${walkthroughDescriptor.id})`);
                return;
            }
            this.gettingStartedContributions.set(walkthroughDescriptor.id, walkthroughDescriptor);
            walkthroughDescriptor.steps.forEach(step => {
                if (this.steps.has(step.id)) {
                    throw Error('Attempting to register step with id ' + step.id + ' twice. Second is dropped.');
                }
                this.steps.set(step.id, step);
                step.when.keys().forEach(key => this.categoryVisibilityContextKeys.add(key));
                this.registerDoneListeners(step);
            });
            walkthroughDescriptor.when.keys().forEach(key => this.categoryVisibilityContextKeys.add(key));
        }
        registerDoneListeners(step) {
            if (step.doneOn) {
                console.error(`wakthrough step`, step, `uses deprecated 'doneOn' property. Adopt 'completionEvents' to silence this warning`);
                return;
            }
            if (!step.completionEvents.length) {
                step.completionEvents = (0, arrays_1.coalesce)((0, arrays_1.flatten)(step.description
                    .filter(linkedText => linkedText.nodes.length === 1) // only buttons
                    .map(linkedText => linkedText.nodes
                    .filter(((node) => typeof node !== 'string'))
                    .map(({ href }) => {
                    if (href.startsWith('command:')) {
                        return 'onCommand:' + href.slice('command:'.length, href.includes('?') ? href.indexOf('?') : undefined);
                    }
                    if (href.startsWith('https://') || href.startsWith('http://')) {
                        return 'onLink:' + href;
                    }
                    return undefined;
                }))));
            }
            if (!step.completionEvents.length) {
                step.completionEvents.push('stepSelected');
            }
            for (let event of step.completionEvents) {
                const [_, eventType, argument] = /^([^:]*):?(.*)$/.exec(event) ?? [];
                if (!eventType) {
                    console.error(`Unknown completionEvent ${event} when registering step ${step.id}`);
                    continue;
                }
                switch (eventType) {
                    case 'onLink':
                    case 'onEvent':
                    case 'onView':
                    case 'onSettingChanged':
                        break;
                    case 'onContext': {
                        const expression = contextkey_1.ContextKeyExpr.deserialize(argument);
                        if (expression) {
                            this.stepCompletionContextKeyExpressions.add(expression);
                            expression.keys().forEach(key => this.stepCompletionContextKeys.add(key));
                            event = eventType + ':' + expression.serialize();
                            if (this.contextService.contextMatchesRules(expression)) {
                                this.sessionEvents.add(event);
                            }
                        }
                        else {
                            console.error('Unable to parse context key expression:', expression, 'in walkthrough step', step.id);
                        }
                        break;
                    }
                    case 'onStepSelected':
                    case 'stepSelected':
                        event = 'stepSelected:' + step.id;
                        break;
                    case 'onCommand':
                        event = eventType + ':' + argument.replace(/^toSide:/, '');
                        break;
                    case 'onExtensionInstalled':
                    case 'extensionInstalled':
                        event = 'extensionInstalled:' + argument.toLowerCase();
                        break;
                    default:
                        console.error(`Unknown completionEvent ${event} when registering step ${step.id}`);
                        continue;
                }
                this.registerCompletionListener(event, step);
            }
        }
        registerCompletionListener(event, step) {
            if (!this.completionListeners.has(event)) {
                this.completionListeners.set(event, new Set());
            }
            this.completionListeners.get(event)?.add(step.id);
        }
        getStep(id) {
            const step = this.steps.get(id);
            if (!step) {
                throw Error('Attempting to access step which does not exist in registry ' + id);
            }
            return step;
        }
    };
    exports.WalkthroughsService = WalkthroughsService;
    exports.WalkthroughsService = WalkthroughsService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, commands_1.ICommandService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, userDataSync_1.IUserDataSyncEnablementService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, extensionManagement_1.IExtensionManagementService),
        __param(8, host_1.IHostService),
        __param(9, viewsService_1.IViewsService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, assignmentService_1.IWorkbenchAssignmentService)
    ], WalkthroughsService);
    const parseDescription = (desc) => desc.split('\n').filter(x => x).map(text => (0, linkedText_1.parseLinkedText)(text));
    exports.parseDescription = parseDescription;
    const convertInternalMediaPathToFileURI = (path) => path.startsWith('https://')
        ? uri_1.URI.parse(path, true)
        : network_1.FileAccess.asFileUri(`vs/workbench/contrib/welcomeGettingStarted/common/media/${path}`);
    exports.convertInternalMediaPathToFileURI = convertInternalMediaPathToFileURI;
    const convertInternalMediaPathToBrowserURI = (path) => path.startsWith('https://')
        ? uri_1.URI.parse(path, true)
        : network_1.FileAccess.asBrowserUri(`vs/workbench/contrib/welcomeGettingStarted/common/media/${path}`);
    const convertInternalMediaPathsToBrowserURIs = (path) => {
        if (typeof path === 'string') {
            const converted = convertInternalMediaPathToBrowserURI(path);
            return { hcDark: converted, hcLight: converted, dark: converted, light: converted };
        }
        else {
            return {
                hcDark: convertInternalMediaPathToBrowserURI(path.hc),
                hcLight: convertInternalMediaPathToBrowserURI(path.hcLight ?? path.light),
                light: convertInternalMediaPathToBrowserURI(path.light),
                dark: convertInternalMediaPathToBrowserURI(path.dark)
            };
        }
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'resetGettingStartedProgress',
                category: (0, nls_1.localize2)('developer', "Developer"),
                title: (0, nls_1.localize2)('resetWelcomePageWalkthroughProgress', "Reset Welcome Page Walkthrough Progress"),
                f1: true
            });
        }
        run(accessor) {
            const gettingStartedService = accessor.get(exports.IWalkthroughsService);
            const storageService = accessor.get(storage_1.IStorageService);
            storageService.store(exports.hiddenEntriesConfigurationKey, JSON.stringify([]), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            storageService.store(exports.walkthroughMetadataConfigurationKey, JSON.stringify([]), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            const memento = new memento_1.Memento('gettingStartedService', accessor.get(storage_1.IStorageService));
            const record = memento.getMemento(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            for (const key in record) {
                if (Object.prototype.hasOwnProperty.call(record, key)) {
                    try {
                        gettingStartedService.deprogressStep(key);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
            memento.saveMemento();
        }
    });
    (0, extensions_1.registerSingleton)(exports.IWalkthroughsService, WalkthroughsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvYnJvd3Nlci9nZXR0aW5nU3RhcnRlZFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0NuRixRQUFBLHlCQUF5QixHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUzRixRQUFBLG9CQUFvQixHQUFHLElBQUEsK0JBQWUsRUFBdUIscUJBQXFCLENBQUMsQ0FBQztJQUVwRixRQUFBLDZCQUE2QixHQUFHLHdDQUF3QyxDQUFDO0lBRXpFLFFBQUEsbUNBQW1DLEdBQUcsMkNBQTJDLENBQUM7SUFHL0YsTUFBTSxlQUFlLEdBQUcsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBZ0V4RCwyREFBMkQ7SUFDM0QsTUFBTSxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ2pDLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUUvQixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBNkJsRCxZQUNrQixjQUFnRCxFQUNoRCxjQUFnRCxFQUMxQyxvQkFBNEQsRUFDekQsdUJBQWtFLEVBQ3hFLGNBQW1ELEVBQ3ZDLDZCQUE4RSxFQUN2RixvQkFBNEQsRUFDdEQsMEJBQXdFLEVBQ3ZGLFdBQTBDLEVBQ3pDLFlBQTRDLEVBQ3hDLGdCQUFvRCxFQUMxQyxvQkFBa0U7WUFFL0YsS0FBSyxFQUFFLENBQUM7WUFiMEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLG1CQUFjLEdB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