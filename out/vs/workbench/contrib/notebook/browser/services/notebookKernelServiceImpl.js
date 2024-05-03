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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/storage/common/storage", "vs/base/common/uri", "vs/workbench/contrib/notebook/common/notebookService", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/base/browser/dom"], function (require, exports, event_1, lifecycle_1, map_1, storage_1, uri_1, notebookService_1, actions_1, contextkey_1, network_1, dom_1) {
    "use strict";
    var NotebookKernelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookKernelService = void 0;
    class KernelInfo {
        static { this._logicClock = 0; }
        constructor(kernel) {
            this.notebookPriorities = new map_1.ResourceMap();
            this.kernel = kernel;
            this.score = -1;
            this.time = KernelInfo._logicClock++;
        }
    }
    class NotebookTextModelLikeId {
        static str(k) {
            return `${k.viewType}/${k.uri.toString()}`;
        }
        static obj(s) {
            const idx = s.indexOf('/');
            return {
                viewType: s.substring(0, idx),
                uri: uri_1.URI.parse(s.substring(idx + 1))
            };
        }
    }
    class SourceAction extends lifecycle_1.Disposable {
        constructor(action, model, isPrimary) {
            super();
            this.action = action;
            this.model = model;
            this.isPrimary = isPrimary;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
        }
        async runAction() {
            if (this.execution) {
                return this.execution;
            }
            this.execution = this._runAction();
            this._onDidChangeState.fire();
            await this.execution;
            this.execution = undefined;
            this._onDidChangeState.fire();
        }
        async _runAction() {
            try {
                await this.action.run({
                    uri: this.model.uri,
                    $mid: 14 /* MarshalledId.NotebookActionContext */
                });
            }
            catch (error) {
                console.warn(`Kernel source command failed: ${error}`);
            }
        }
    }
    let NotebookKernelService = class NotebookKernelService extends lifecycle_1.Disposable {
        static { NotebookKernelService_1 = this; }
        static { this._storageNotebookBinding = 'notebook.controller2NotebookBindings'; }
        constructor(_notebookService, _storageService, _menuService, _contextKeyService) {
            super();
            this._notebookService = _notebookService;
            this._storageService = _storageService;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._kernels = new Map();
            this._notebookBindings = new map_1.LRUCache(1000, 0.7);
            this._onDidChangeNotebookKernelBinding = this._register(new event_1.Emitter());
            this._onDidAddKernel = this._register(new event_1.Emitter());
            this._onDidRemoveKernel = this._register(new event_1.Emitter());
            this._onDidChangeNotebookAffinity = this._register(new event_1.Emitter());
            this._onDidChangeSourceActions = this._register(new event_1.Emitter());
            this._onDidNotebookVariablesChange = this._register(new event_1.Emitter());
            this._kernelSources = new Map();
            this._kernelSourceActionsUpdates = new Map();
            this._kernelDetectionTasks = new Map();
            this._onDidChangeKernelDetectionTasks = this._register(new event_1.Emitter());
            this._kernelSourceActionProviders = new Map();
            this.onDidChangeSelectedNotebooks = this._onDidChangeNotebookKernelBinding.event;
            this.onDidAddKernel = this._onDidAddKernel.event;
            this.onDidRemoveKernel = this._onDidRemoveKernel.event;
            this.onDidChangeNotebookAffinity = this._onDidChangeNotebookAffinity.event;
            this.onDidChangeSourceActions = this._onDidChangeSourceActions.event;
            this.onDidChangeKernelDetectionTasks = this._onDidChangeKernelDetectionTasks.event;
            this.onDidNotebookVariablesUpdate = this._onDidNotebookVariablesChange.event;
            // auto associate kernels to new notebook documents, also emit event when
            // a notebook has been closed (but don't update the memento)
            this._register(_notebookService.onDidAddNotebookDocument(this._tryAutoBindNotebook, this));
            this._register(_notebookService.onWillRemoveNotebookDocument(notebook => {
                const id = NotebookTextModelLikeId.str(notebook);
                const kernelId = this._notebookBindings.get(id);
                if (kernelId && notebook.uri.scheme === network_1.Schemas.untitled) {
                    this.selectKernelForNotebook(undefined, notebook);
                }
                this._kernelSourceActionsUpdates.get(id)?.dispose();
                this._kernelSourceActionsUpdates.delete(id);
            }));
            // restore from storage
            try {
                const data = JSON.parse(this._storageService.get(NotebookKernelService_1._storageNotebookBinding, 1 /* StorageScope.WORKSPACE */, '[]'));
                this._notebookBindings.fromJSON(data);
            }
            catch {
                // ignore
            }
        }
        dispose() {
            this._kernels.clear();
            this._kernelSources.forEach(v => {
                v.menu.dispose();
                v.actions.forEach(a => a[1].dispose());
            });
            this._kernelSourceActionsUpdates.forEach(v => {
                v.dispose();
            });
            this._kernelSourceActionsUpdates.clear();
            super.dispose();
        }
        _persistMementos() {
            this._persistSoonHandle?.dispose();
            this._persistSoonHandle = (0, dom_1.runWhenWindowIdle)((0, dom_1.getActiveWindow)(), () => {
                this._storageService.store(NotebookKernelService_1._storageNotebookBinding, JSON.stringify(this._notebookBindings), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }, 100);
        }
        static _score(kernel, notebook) {
            if (kernel.viewType === '*') {
                return 5;
            }
            else if (kernel.viewType === notebook.viewType) {
                return 10;
            }
            else {
                return 0;
            }
        }
        _tryAutoBindNotebook(notebook, onlyThisKernel) {
            const id = this._notebookBindings.get(NotebookTextModelLikeId.str(notebook));
            if (!id) {
                // no kernel associated
                return;
            }
            const existingKernel = this._kernels.get(id);
            if (!existingKernel || !NotebookKernelService_1._score(existingKernel.kernel, notebook)) {
                // associated kernel not known, not matching
                return;
            }
            if (!onlyThisKernel || existingKernel.kernel === onlyThisKernel) {
                this._onDidChangeNotebookKernelBinding.fire({ notebook: notebook.uri, oldKernel: undefined, newKernel: existingKernel.kernel.id });
            }
        }
        notifyVariablesChange(notebookUri) {
            this._onDidNotebookVariablesChange.fire(notebookUri);
        }
        registerKernel(kernel) {
            if (this._kernels.has(kernel.id)) {
                throw new Error(`NOTEBOOK CONTROLLER with id '${kernel.id}' already exists`);
            }
            this._kernels.set(kernel.id, new KernelInfo(kernel));
            this._onDidAddKernel.fire(kernel);
            // auto associate the new kernel to existing notebooks it was
            // associated to in the past.
            for (const notebook of this._notebookService.getNotebookTextModels()) {
                this._tryAutoBindNotebook(notebook, kernel);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._kernels.delete(kernel.id)) {
                    this._onDidRemoveKernel.fire(kernel);
                }
                for (const [key, candidate] of Array.from(this._notebookBindings)) {
                    if (candidate === kernel.id) {
                        this._onDidChangeNotebookKernelBinding.fire({ notebook: NotebookTextModelLikeId.obj(key).uri, oldKernel: kernel.id, newKernel: undefined });
                    }
                }
            });
        }
        getMatchingKernel(notebook) {
            // all applicable kernels
            const kernels = [];
            for (const info of this._kernels.values()) {
                const score = NotebookKernelService_1._score(info.kernel, notebook);
                if (score) {
                    kernels.push({
                        score,
                        kernel: info.kernel,
                        instanceAffinity: info.notebookPriorities.get(notebook.uri) ?? 1 /* vscode.NotebookControllerPriority.Default */,
                    });
                }
            }
            kernels
                .sort((a, b) => b.instanceAffinity - a.instanceAffinity || a.score - b.score || a.kernel.label.localeCompare(b.kernel.label));
            const all = kernels.map(obj => obj.kernel);
            // bound kernel
            const selectedId = this._notebookBindings.get(NotebookTextModelLikeId.str(notebook));
            const selected = selectedId ? this._kernels.get(selectedId)?.kernel : undefined;
            const suggestions = kernels.filter(item => item.instanceAffinity > 1).map(item => item.kernel);
            const hidden = kernels.filter(item => item.instanceAffinity < 0).map(item => item.kernel);
            return { all, selected, suggestions, hidden };
        }
        getSelectedOrSuggestedKernel(notebook) {
            const info = this.getMatchingKernel(notebook);
            if (info.selected) {
                return info.selected;
            }
            const preferred = info.all.filter(kernel => this._kernels.get(kernel.id)?.notebookPriorities.get(notebook.uri) === 2 /* vscode.NotebookControllerPriority.Preferred */);
            if (preferred.length === 1) {
                return preferred[0];
            }
            return info.all.length === 1 ? info.all[0] : undefined;
        }
        // a notebook has one kernel, a kernel has N notebooks
        // notebook <-1----N-> kernel
        selectKernelForNotebook(kernel, notebook) {
            const key = NotebookTextModelLikeId.str(notebook);
            const oldKernel = this._notebookBindings.get(key);
            if (oldKernel !== kernel?.id) {
                if (kernel) {
                    this._notebookBindings.set(key, kernel.id);
                }
                else {
                    this._notebookBindings.delete(key);
                }
                this._onDidChangeNotebookKernelBinding.fire({ notebook: notebook.uri, oldKernel, newKernel: kernel?.id });
                this._persistMementos();
            }
        }
        preselectKernelForNotebook(kernel, notebook) {
            const key = NotebookTextModelLikeId.str(notebook);
            const oldKernel = this._notebookBindings.get(key);
            if (oldKernel !== kernel?.id) {
                this._notebookBindings.set(key, kernel.id);
                this._persistMementos();
            }
        }
        updateKernelNotebookAffinity(kernel, notebook, preference) {
            const info = this._kernels.get(kernel.id);
            if (!info) {
                throw new Error(`UNKNOWN kernel '${kernel.id}'`);
            }
            if (preference === undefined) {
                info.notebookPriorities.delete(notebook);
            }
            else {
                info.notebookPriorities.set(notebook, preference);
            }
            this._onDidChangeNotebookAffinity.fire();
        }
        getRunningSourceActions(notebook) {
            const id = NotebookTextModelLikeId.str(notebook);
            const existingInfo = this._kernelSources.get(id);
            if (existingInfo) {
                return existingInfo.actions.filter(action => action[0].execution).map(action => action[0]);
            }
            return [];
        }
        getSourceActions(notebook, contextKeyService) {
            contextKeyService = contextKeyService ?? this._contextKeyService;
            const id = NotebookTextModelLikeId.str(notebook);
            const existingInfo = this._kernelSources.get(id);
            if (existingInfo) {
                return existingInfo.actions.map(a => a[0]);
            }
            const sourceMenu = this._register(this._menuService.createMenu(actions_1.MenuId.NotebookKernelSource, contextKeyService));
            const info = { menu: sourceMenu, actions: [] };
            const loadActionsFromMenu = (menu, document) => {
                const groups = menu.getActions({ shouldForwardArgs: true });
                const sourceActions = [];
                groups.forEach(group => {
                    const isPrimary = /^primary/.test(group[0]);
                    group[1].forEach(action => {
                        const sourceAction = new SourceAction(action, document, isPrimary);
                        const stateChangeListener = sourceAction.onDidChangeState(() => {
                            this._onDidChangeSourceActions.fire({
                                notebook: document.uri,
                                viewType: document.viewType,
                            });
                        });
                        sourceActions.push([sourceAction, stateChangeListener]);
                    });
                });
                info.actions = sourceActions;
                this._kernelSources.set(id, info);
                this._onDidChangeSourceActions.fire({ notebook: document.uri, viewType: document.viewType });
            };
            this._kernelSourceActionsUpdates.get(id)?.dispose();
            this._kernelSourceActionsUpdates.set(id, sourceMenu.onDidChange(() => {
                loadActionsFromMenu(sourceMenu, notebook);
            }));
            loadActionsFromMenu(sourceMenu, notebook);
            return info.actions.map(a => a[0]);
        }
        registerNotebookKernelDetectionTask(task) {
            const notebookType = task.notebookType;
            const all = this._kernelDetectionTasks.get(notebookType) ?? [];
            all.push(task);
            this._kernelDetectionTasks.set(notebookType, all);
            this._onDidChangeKernelDetectionTasks.fire(notebookType);
            return (0, lifecycle_1.toDisposable)(() => {
                const all = this._kernelDetectionTasks.get(notebookType) ?? [];
                const idx = all.indexOf(task);
                if (idx >= 0) {
                    all.splice(idx, 1);
                    this._kernelDetectionTasks.set(notebookType, all);
                    this._onDidChangeKernelDetectionTasks.fire(notebookType);
                }
            });
        }
        getKernelDetectionTasks(notebook) {
            return this._kernelDetectionTasks.get(notebook.viewType) ?? [];
        }
        registerKernelSourceActionProvider(viewType, provider) {
            const providers = this._kernelSourceActionProviders.get(viewType) ?? [];
            providers.push(provider);
            this._kernelSourceActionProviders.set(viewType, providers);
            this._onDidChangeSourceActions.fire({ viewType: viewType });
            const eventEmitterDisposable = provider.onDidChangeSourceActions?.(() => {
                this._onDidChangeSourceActions.fire({ viewType: viewType });
            });
            return (0, lifecycle_1.toDisposable)(() => {
                const providers = this._kernelSourceActionProviders.get(viewType) ?? [];
                const idx = providers.indexOf(provider);
                if (idx >= 0) {
                    providers.splice(idx, 1);
                    this._kernelSourceActionProviders.set(viewType, providers);
                }
                eventEmitterDisposable?.dispose();
            });
        }
        /**
         * Get kernel source actions from providers
         */
        getKernelSourceActions2(notebook) {
            const viewType = notebook.viewType;
            const providers = this._kernelSourceActionProviders.get(viewType) ?? [];
            const promises = providers.map(provider => provider.provideKernelSourceActions());
            return Promise.all(promises).then(actions => {
                return actions.reduce((a, b) => a.concat(b), []);
            });
        }
    };
    exports.NotebookKernelService = NotebookKernelService;
    exports.NotebookKernelService = NotebookKernelService = NotebookKernelService_1 = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, storage_1.IStorageService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService)
    ], NotebookKernelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9zZXJ2aWNlcy9ub3RlYm9va0tlcm5lbFNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLE1BQU0sVUFBVTtpQkFFQSxnQkFBVyxHQUFHLENBQUMsQUFBSixDQUFLO1FBUS9CLFlBQVksTUFBdUI7WUFGMUIsdUJBQWtCLEdBQUcsSUFBSSxpQkFBVyxFQUFVLENBQUM7WUFHdkQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN0QyxDQUFDOztJQUdGLE1BQU0sdUJBQXVCO1FBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBeUI7WUFDbkMsT0FBTyxHQUFHLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1FBQzVDLENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQVM7WUFDbkIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQixPQUFPO2dCQUNOLFFBQVEsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7Z0JBQzdCLEdBQUcsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3BDLENBQUM7UUFDSCxDQUFD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