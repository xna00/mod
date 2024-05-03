/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/async", "vs/base/common/performance", "vs/platform/log/common/log", "vs/platform/environment/common/environment", "vs/base/common/map", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorPaneService"], function (require, exports, instantiation_1, lifecycle_1, platform_1, async_1, performance_1, log_1, environment_1, map_1, lifecycle_2, editorPaneService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWorkbenchContribution = exports.registerWorkbenchContribution2 = exports.WorkbenchContributionsRegistry = exports.WorkbenchPhase = exports.Extensions = void 0;
    var Extensions;
    (function (Extensions) {
        /**
         * @deprecated use `registerWorkbenchContribution2` instead.
         */
        Extensions.Workbench = 'workbench.contributions.kind';
    })(Extensions || (exports.Extensions = Extensions = {}));
    var WorkbenchPhase;
    (function (WorkbenchPhase) {
        /**
         * The first phase signals that we are about to startup getting ready.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use the other types, preferable
         * `Lazy` to only instantiate the contribution when really needed.
         */
        WorkbenchPhase[WorkbenchPhase["BlockStartup"] = 1] = "BlockStartup";
        /**
         * Services are ready and the window is about to restore its UI state.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use the other types, preferable
         * `Lazy` to only instantiate the contribution when really needed.
         */
        WorkbenchPhase[WorkbenchPhase["BlockRestore"] = 2] = "BlockRestore";
        /**
         * Views, panels and editors have restored. Editors are given a bit of
         * time to restore their contents.
         */
        WorkbenchPhase[WorkbenchPhase["AfterRestored"] = 3] = "AfterRestored";
        /**
         * The last phase after views, panels and editors have restored and
         * some time has passed (2-5 seconds).
         */
        WorkbenchPhase[WorkbenchPhase["Eventually"] = 4] = "Eventually";
    })(WorkbenchPhase || (exports.WorkbenchPhase = WorkbenchPhase = {}));
    function isOnEditorWorkbenchContributionInstantiation(obj) {
        const candidate = obj;
        return !!candidate && typeof candidate.editorTypeId === 'string';
    }
    function toWorkbenchPhase(phase) {
        switch (phase) {
            case 3 /* LifecyclePhase.Restored */:
                return 3 /* WorkbenchPhase.AfterRestored */;
            case 4 /* LifecyclePhase.Eventually */:
                return 4 /* WorkbenchPhase.Eventually */;
        }
    }
    function toLifecyclePhase(instantiation) {
        switch (instantiation) {
            case 1 /* WorkbenchPhase.BlockStartup */:
                return 1 /* LifecyclePhase.Starting */;
            case 2 /* WorkbenchPhase.BlockRestore */:
                return 2 /* LifecyclePhase.Ready */;
            case 3 /* WorkbenchPhase.AfterRestored */:
                return 3 /* LifecyclePhase.Restored */;
            case 4 /* WorkbenchPhase.Eventually */:
                return 4 /* LifecyclePhase.Eventually */;
        }
    }
    class WorkbenchContributionsRegistry extends lifecycle_2.Disposable {
        constructor() {
            super(...arguments);
            this.contributionsByPhase = new Map();
            this.contributionsByEditor = new Map();
            this.contributionsById = new Map();
            this.instancesById = new Map();
            this.timingsByPhase = new Map();
            this.pendingRestoredContributions = new async_1.DeferredPromise();
            this.whenRestored = this.pendingRestoredContributions.p;
        }
        static { this.INSTANCE = new WorkbenchContributionsRegistry(); }
        static { this.BLOCK_BEFORE_RESTORE_WARN_THRESHOLD = 20; }
        static { this.BLOCK_AFTER_RESTORE_WARN_THRESHOLD = 100; }
        get timings() { return this.timingsByPhase; }
        registerWorkbenchContribution2(id, ctor, instantiation) {
            const contribution = { id, ctor };
            // Instantiate directly if we already have a matching instantiation condition
            if (this.instantiationService && this.lifecycleService && this.logService && this.environmentService && this.editorPaneService &&
                ((typeof instantiation === 'number' && this.lifecycleService.phase >= instantiation) ||
                    (typeof id === 'string' && isOnEditorWorkbenchContributionInstantiation(instantiation) && this.editorPaneService.didInstantiateEditorPane(instantiation.editorTypeId)))) {
                this.safeCreateContribution(this.instantiationService, this.logService, this.environmentService, contribution, typeof instantiation === 'number' ? toLifecyclePhase(instantiation) : this.lifecycleService.phase);
            }
            // Otherwise keep contributions by instantiation kind for later instantiation
            else {
                // by phase
                if (typeof instantiation === 'number') {
                    (0, map_1.getOrSet)(this.contributionsByPhase, toLifecyclePhase(instantiation), []).push(contribution);
                }
                if (typeof id === 'string') {
                    // by id
                    if (!this.contributionsById.has(id)) {
                        this.contributionsById.set(id, contribution);
                    }
                    else {
                        console.error(`IWorkbenchContributionsRegistry#registerWorkbenchContribution(): Can't register multiple contributions with same id '${id}'`);
                    }
                    // by editor
                    if (isOnEditorWorkbenchContributionInstantiation(instantiation)) {
                        (0, map_1.getOrSet)(this.contributionsByEditor, instantiation.editorTypeId, []).push(contribution);
                    }
                }
            }
        }
        registerWorkbenchContribution(ctor, phase) {
            this.registerWorkbenchContribution2(undefined, ctor, toWorkbenchPhase(phase));
        }
        getWorkbenchContribution(id) {
            if (this.instancesById.has(id)) {
                return this.instancesById.get(id);
            }
            const instantiationService = this.instantiationService;
            const lifecycleService = this.lifecycleService;
            const logService = this.logService;
            const environmentService = this.environmentService;
            if (!instantiationService || !lifecycleService || !logService || !environmentService) {
                throw new Error(`IWorkbenchContributionsRegistry#getContribution('${id}'): cannot be called before registry started`);
            }
            const contribution = this.contributionsById.get(id);
            if (!contribution) {
                throw new Error(`IWorkbenchContributionsRegistry#getContribution('${id}'): contribution with that identifier is unknown.`);
            }
            if (lifecycleService.phase < 3 /* LifecyclePhase.Restored */) {
                logService.warn(`IWorkbenchContributionsRegistry#getContribution('${id}'): contribution instantiated before LifecyclePhase.Restored!`);
            }
            this.safeCreateContribution(instantiationService, logService, environmentService, contribution, lifecycleService.phase);
            const instance = this.instancesById.get(id);
            if (!instance) {
                throw new Error(`IWorkbenchContributionsRegistry#getContribution('${id}'): failed to create contribution.`);
            }
            return instance;
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const lifecycleService = this.lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
            const logService = this.logService = accessor.get(log_1.ILogService);
            const environmentService = this.environmentService = accessor.get(environment_1.IEnvironmentService);
            const editorPaneService = this.editorPaneService = accessor.get(editorPaneService_1.IEditorPaneService);
            // Instantiate contributions by phase when they are ready
            for (const phase of [1 /* LifecyclePhase.Starting */, 2 /* LifecyclePhase.Ready */, 3 /* LifecyclePhase.Restored */, 4 /* LifecyclePhase.Eventually */]) {
                this.instantiateByPhase(instantiationService, lifecycleService, logService, environmentService, phase);
            }
            // Instantiate contributions by editor when they are created or have been
            for (const editorTypeId of this.contributionsByEditor.keys()) {
                if (editorPaneService.didInstantiateEditorPane(editorTypeId)) {
                    this.onEditor(editorTypeId, instantiationService, lifecycleService, logService, environmentService);
                }
            }
            this._register(editorPaneService.onWillInstantiateEditorPane(e => this.onEditor(e.typeId, instantiationService, lifecycleService, logService, environmentService)));
        }
        onEditor(editorTypeId, instantiationService, lifecycleService, logService, environmentService) {
            const contributions = this.contributionsByEditor.get(editorTypeId);
            if (contributions) {
                this.contributionsByEditor.delete(editorTypeId);
                for (const contribution of contributions) {
                    this.safeCreateContribution(instantiationService, logService, environmentService, contribution, lifecycleService.phase);
                }
            }
        }
        instantiateByPhase(instantiationService, lifecycleService, logService, environmentService, phase) {
            // Instantiate contributions directly when phase is already reached
            if (lifecycleService.phase >= phase) {
                this.doInstantiateByPhase(instantiationService, logService, environmentService, phase);
            }
            // Otherwise wait for phase to be reached
            else {
                lifecycleService.when(phase).then(() => this.doInstantiateByPhase(instantiationService, logService, environmentService, phase));
            }
        }
        async doInstantiateByPhase(instantiationService, logService, environmentService, phase) {
            const contributions = this.contributionsByPhase.get(phase);
            if (contributions) {
                this.contributionsByPhase.delete(phase);
                switch (phase) {
                    case 1 /* LifecyclePhase.Starting */:
                    case 2 /* LifecyclePhase.Ready */: {
                        // instantiate everything synchronously and blocking
                        // measure the time it takes as perf marks for diagnosis
                        (0, performance_1.mark)(`code/willCreateWorkbenchContributions/${phase}`);
                        for (const contribution of contributions) {
                            this.safeCreateContribution(instantiationService, logService, environmentService, contribution, phase);
                        }
                        (0, performance_1.mark)(`code/didCreateWorkbenchContributions/${phase}`);
                        break;
                    }
                    case 3 /* LifecyclePhase.Restored */:
                    case 4 /* LifecyclePhase.Eventually */: {
                        // for the Restored/Eventually-phase we instantiate contributions
                        // only when idle. this might take a few idle-busy-cycles but will
                        // finish within the timeouts
                        // given that, we must ensure to await the contributions from the
                        // Restored-phase before we instantiate the Eventually-phase
                        if (phase === 4 /* LifecyclePhase.Eventually */) {
                            await this.pendingRestoredContributions.p;
                        }
                        this.doInstantiateWhenIdle(contributions, instantiationService, logService, environmentService, phase);
                        break;
                    }
                }
            }
        }
        doInstantiateWhenIdle(contributions, instantiationService, logService, environmentService, phase) {
            (0, performance_1.mark)(`code/willCreateWorkbenchContributions/${phase}`);
            let i = 0;
            const forcedTimeout = phase === 4 /* LifecyclePhase.Eventually */ ? 3000 : 500;
            const instantiateSome = (idle) => {
                while (i < contributions.length) {
                    const contribution = contributions[i++];
                    this.safeCreateContribution(instantiationService, logService, environmentService, contribution, phase);
                    if (idle.timeRemaining() < 1) {
                        // time is up -> reschedule
                        (0, async_1.runWhenGlobalIdle)(instantiateSome, forcedTimeout);
                        break;
                    }
                }
                if (i === contributions.length) {
                    (0, performance_1.mark)(`code/didCreateWorkbenchContributions/${phase}`);
                    if (phase === 3 /* LifecyclePhase.Restored */) {
                        this.pendingRestoredContributions.complete();
                    }
                }
            };
            (0, async_1.runWhenGlobalIdle)(instantiateSome, forcedTimeout);
        }
        safeCreateContribution(instantiationService, logService, environmentService, contribution, phase) {
            if (typeof contribution.id === 'string' && this.instancesById.has(contribution.id)) {
                return;
            }
            const now = Date.now();
            try {
                if (typeof contribution.id === 'string') {
                    (0, performance_1.mark)(`code/willCreateWorkbenchContribution/${phase}/${contribution.id}`);
                }
                const instance = instantiationService.createInstance(contribution.ctor);
                if (typeof contribution.id === 'string') {
                    this.instancesById.set(contribution.id, instance);
                    this.contributionsById.delete(contribution.id);
                }
            }
            catch (error) {
                logService.error(`Unable to create workbench contribution '${contribution.id ?? contribution.ctor.name}'.`, error);
            }
            finally {
                if (typeof contribution.id === 'string') {
                    (0, performance_1.mark)(`code/didCreateWorkbenchContribution/${phase}/${contribution.id}`);
                }
            }
            if (typeof contribution.id === 'string' || !environmentService.isBuilt /* only log out of sources where we have good ctor names */) {
                const time = Date.now() - now;
                if (time > (phase < 3 /* LifecyclePhase.Restored */ ? WorkbenchContributionsRegistry.BLOCK_BEFORE_RESTORE_WARN_THRESHOLD : WorkbenchContributionsRegistry.BLOCK_AFTER_RESTORE_WARN_THRESHOLD)) {
                    logService.warn(`Creation of workbench contribution '${contribution.id ?? contribution.ctor.name}' took ${time}ms.`);
                }
                if (typeof contribution.id === 'string') {
                    let timingsForPhase = this.timingsByPhase.get(phase);
                    if (!timingsForPhase) {
                        timingsForPhase = [];
                        this.timingsByPhase.set(phase, timingsForPhase);
                    }
                    timingsForPhase.push([contribution.id, time]);
                }
            }
        }
    }
    exports.WorkbenchContributionsRegistry = WorkbenchContributionsRegistry;
    /**
     * Register a workbench contribution that will be instantiated
     * based on the `instantiation` property.
     */
    exports.registerWorkbenchContribution2 = WorkbenchContributionsRegistry.INSTANCE.registerWorkbenchContribution2.bind(WorkbenchContributionsRegistry.INSTANCE);
    /**
     * Provides access to a workbench contribution with a specific identifier.
     * The contribution is created if not yet done.
     *
     * Note: will throw an error if
     * - called too early before the registry has started
     * - no contribution is known for the given identifier
     */
    exports.getWorkbenchContribution = WorkbenchContributionsRegistry.INSTANCE.getWorkbenchContribution.bind(WorkbenchContributionsRegistry.INSTANCE);
    platform_1.Registry.add(Extensions.Workbench, WorkbenchContributionsRegistry.INSTANCE);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9jb250cmlidXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEcsSUFBaUIsVUFBVSxDQUsxQjtJQUxELFdBQWlCLFVBQVU7UUFDMUI7O1dBRUc7UUFDVSxvQkFBUyxHQUFHLDhCQUE4QixDQUFDO0lBQ3pELENBQUMsRUFMZ0IsVUFBVSwwQkFBVixVQUFVLFFBSzFCO0lBRUQsSUFBa0IsY0ErQmpCO0lBL0JELFdBQWtCLGNBQWM7UUFFL0I7Ozs7OztXQU1HO1FBQ0gsbUVBQXNDLENBQUE7UUFFdEM7Ozs7OztXQU1HO1FBQ0gsbUVBQW1DLENBQUE7UUFFbkM7OztXQUdHO1FBQ0gscUVBQXVDLENBQUE7UUFFdkM7OztXQUdHO1FBQ0gsK0RBQXNDLENBQUE7SUFDdkMsQ0FBQyxFQS9CaUIsY0FBYyw4QkFBZCxjQUFjLFFBK0IvQjtJQWtCRCxTQUFTLDRDQUE0QyxDQUFDLEdBQVk7UUFDakUsTUFBTSxTQUFTLEdBQUcsR0FBOEQsQ0FBQztRQUNqRixPQUFPLENBQUMsQ0FBQyxTQUFTLElBQUksT0FBTyxTQUFTLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQztJQUNsRSxDQUFDO0lBSUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUEwRDtRQUNuRixRQUFRLEtBQUssRUFBRSxDQUFDO1lBQ2Y7Z0JBQ0MsNENBQW9DO1lBQ3JDO2dCQUNDLHlDQUFpQztRQUNuQyxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsYUFBNkI7UUFDdEQsUUFBUSxhQUFhLEVBQUUsQ0FBQztZQUN2QjtnQkFDQyx1Q0FBK0I7WUFDaEM7Z0JBQ0Msb0NBQTRCO1lBQzdCO2dCQUNDLHVDQUErQjtZQUNoQztnQkFDQyx5Q0FB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