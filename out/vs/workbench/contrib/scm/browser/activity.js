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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/activity/common/activity", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/network", "vs/base/common/iterator", "vs/workbench/services/title/browser/titleService"], function (require, exports, nls_1, resources_1, lifecycle_1, event_1, scm_1, activity_1, contextkey_1, statusbar_1, editorService_1, configuration_1, editor_1, uriIdentity_1, network_1, iterator_1, titleService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMActiveResourceContextKeyController = exports.SCMActiveRepositoryContextKeyController = exports.SCMStatusController = void 0;
    function getCount(repository) {
        if (typeof repository.provider.count === 'number') {
            return repository.provider.count;
        }
        else {
            return repository.provider.groups.reduce((r, g) => r + g.resources.length, 0);
        }
    }
    let SCMStatusController = class SCMStatusController {
        constructor(scmService, scmViewService, statusbarService, activityService, editorService, configurationService, uriIdentityService) {
            this.scmService = scmService;
            this.scmViewService = scmViewService;
            this.statusbarService = statusbarService;
            this.activityService = activityService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.uriIdentityService = uriIdentityService;
            this.statusBarDisposable = lifecycle_1.Disposable.None;
            this.focusDisposable = lifecycle_1.Disposable.None;
            this.focusedRepository = undefined;
            this.badgeDisposable = new lifecycle_1.MutableDisposable();
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new Set();
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            this.scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
            const onDidChangeSCMCountBadge = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.countBadge'));
            onDidChangeSCMCountBadge(this.renderActivityCount, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            this.scmViewService.onDidFocusRepository(this.focusRepository, this, this.disposables);
            this.focusRepository(this.scmViewService.focusedRepository);
            editorService.onDidActiveEditorChange(() => this.tryFocusRepositoryBasedOnActiveEditor(), this, this.disposables);
            this.renderActivityCount();
        }
        tryFocusRepositoryBasedOnActiveEditor(repositories = this.scmService.repositories) {
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if (!resource) {
                return false;
            }
            let bestRepository = null;
            let bestMatchLength = Number.POSITIVE_INFINITY;
            for (const repository of repositories) {
                const root = repository.provider.rootUri;
                if (!root) {
                    continue;
                }
                const path = this.uriIdentityService.extUri.relativePath(root, resource);
                if (path && !/^\.\./.test(path) && path.length < bestMatchLength) {
                    bestRepository = repository;
                    bestMatchLength = path.length;
                }
            }
            if (!bestRepository) {
                return false;
            }
            this.focusRepository(bestRepository);
            return true;
        }
        onDidAddRepository(repository) {
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.renderActivityCount());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.repositoryDisposables.delete(disposable);
                this.renderActivityCount();
            });
            const disposable = (0, lifecycle_1.combinedDisposable)(changeDisposable, removeDisposable);
            this.repositoryDisposables.add(disposable);
            this.tryFocusRepositoryBasedOnActiveEditor(iterator_1.Iterable.single(repository));
        }
        onDidRemoveRepository(repository) {
            if (this.focusedRepository !== repository) {
                return;
            }
            this.focusRepository(iterator_1.Iterable.first(this.scmService.repositories));
        }
        focusRepository(repository) {
            if (this.focusedRepository === repository) {
                return;
            }
            this.focusDisposable.dispose();
            this.focusedRepository = repository;
            if (repository && repository.provider.onDidChangeStatusBarCommands) {
                this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(() => this.renderStatusBar(repository));
            }
            this.renderStatusBar(repository);
            this.renderActivityCount();
        }
        renderStatusBar(repository) {
            this.statusBarDisposable.dispose();
            if (!repository) {
                return;
            }
            const commands = repository.provider.statusBarCommands || [];
            const label = repository.provider.rootUri
                ? `${(0, resources_1.basename)(repository.provider.rootUri)} (${repository.provider.label})`
                : repository.provider.label;
            const disposables = new lifecycle_1.DisposableStore();
            for (let index = 0; index < commands.length; index++) {
                const command = commands[index];
                const tooltip = `${label}${command.tooltip ? ` - ${command.tooltip}` : ''}`;
                // Get a repository agnostic name for the status bar action, derive this from the
                // first command argument which is in the form "git.<command>/<number>"
                let repoAgnosticActionName = command.arguments?.[0];
                if (repoAgnosticActionName && typeof repoAgnosticActionName === 'string') {
                    repoAgnosticActionName = repoAgnosticActionName
                        .substring(0, repoAgnosticActionName.lastIndexOf('/'))
                        .replace(/^git\./, '');
                    if (repoAgnosticActionName.length > 1) {
                        repoAgnosticActionName = repoAgnosticActionName[0].toLocaleUpperCase() + repoAgnosticActionName.slice(1);
                    }
                }
                else {
                    repoAgnosticActionName = '';
                }
                const statusbarEntry = {
                    name: (0, nls_1.localize)('status.scm', "Source Control") + (repoAgnosticActionName ? ` ${repoAgnosticActionName}` : ''),
                    text: command.title,
                    ariaLabel: tooltip,
                    tooltip,
                    command: command.id ? command : undefined
                };
                disposables.add(index === 0 ?
                    this.statusbarService.addEntry(statusbarEntry, `status.scm.${index}`, 0 /* MainThreadStatusBarAlignment.LEFT */, 10000) :
                    this.statusbarService.addEntry(statusbarEntry, `status.scm.${index}`, 0 /* MainThreadStatusBarAlignment.LEFT */, { id: `status.scm.${index - 1}`, alignment: 1 /* MainThreadStatusBarAlignment.RIGHT */, compact: true }));
            }
            this.statusBarDisposable = disposables;
        }
        renderActivityCount() {
            const countBadgeType = this.configurationService.getValue('scm.countBadge');
            let count = 0;
            if (countBadgeType === 'all') {
                count = iterator_1.Iterable.reduce(this.scmService.repositories, (r, repository) => r + getCount(repository), 0);
            }
            else if (countBadgeType === 'focused' && this.focusedRepository) {
                count = getCount(this.focusedRepository);
            }
            if (count > 0) {
                const badge = new activity_1.NumberBadge(count, num => (0, nls_1.localize)('scmPendingChangesBadge', '{0} pending changes', num));
                this.badgeDisposable.value = this.activityService.showViewActivity(scm_1.VIEW_PANE_ID, { badge });
            }
            else {
                this.badgeDisposable.value = undefined;
            }
        }
        dispose() {
            this.focusDisposable.dispose();
            this.statusBarDisposable.dispose();
            this.badgeDisposable.dispose();
            this.disposables.dispose();
            (0, lifecycle_1.dispose)(this.repositoryDisposables.values());
            this.repositoryDisposables.clear();
        }
    };
    exports.SCMStatusController = SCMStatusController;
    exports.SCMStatusController = SCMStatusController = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, scm_1.ISCMViewService),
        __param(2, statusbar_1.IStatusbarService),
        __param(3, activity_1.IActivityService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, uriIdentity_1.IUriIdentityService)
    ], SCMStatusController);
    const ActiveRepositoryContextKeys = {
        ActiveRepositoryName: new contextkey_1.RawContextKey('scmActiveRepositoryName', ''),
        ActiveRepositoryBranchName: new contextkey_1.RawContextKey('scmActiveRepositoryBranchName', ''),
    };
    let SCMActiveRepositoryContextKeyController = class SCMActiveRepositoryContextKeyController {
        constructor(contextKeyService, editorService, scmViewService, titleService, uriIdentityService) {
            this.editorService = editorService;
            this.scmViewService = scmViewService;
            this.uriIdentityService = uriIdentityService;
            this.focusedRepository = undefined;
            this.focusDisposable = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this.activeRepositoryNameContextKey = ActiveRepositoryContextKeys.ActiveRepositoryName.bindTo(contextKeyService);
            this.activeRepositoryBranchNameContextKey = ActiveRepositoryContextKeys.ActiveRepositoryBranchName.bindTo(contextKeyService);
            titleService.registerVariables([
                { name: 'activeRepositoryName', contextKey: ActiveRepositoryContextKeys.ActiveRepositoryName.key },
                { name: 'activeRepositoryBranchName', contextKey: ActiveRepositoryContextKeys.ActiveRepositoryBranchName.key, }
            ]);
            editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.disposables);
            scmViewService.onDidFocusRepository(this.onDidFocusRepository, this, this.disposables);
            this.onDidFocusRepository(scmViewService.focusedRepository);
        }
        onDidActiveEditorChange() {
            const activeResource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if (activeResource?.scheme !== network_1.Schemas.file && activeResource?.scheme !== network_1.Schemas.vscodeRemote) {
                return;
            }
            const repository = iterator_1.Iterable.find(this.scmViewService.repositories, r => Boolean(r.provider.rootUri && this.uriIdentityService.extUri.isEqualOrParent(activeResource, r.provider.rootUri)));
            this.onDidFocusRepository(repository);
        }
        onDidFocusRepository(repository) {
            if (!repository || this.focusedRepository === repository) {
                return;
            }
            this.focusDisposable.dispose();
            this.focusedRepository = repository;
            if (repository && repository.provider.onDidChangeStatusBarCommands) {
                this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(() => this.updateContextKeys(repository));
            }
            this.updateContextKeys(repository);
        }
        updateContextKeys(repository) {
            this.activeRepositoryNameContextKey.set(repository?.provider.name ?? '');
            this.activeRepositoryBranchNameContextKey.set(repository?.provider.historyProvider?.currentHistoryItemGroup?.label ?? '');
        }
        dispose() {
            this.focusDisposable.dispose();
            this.disposables.dispose();
        }
    };
    exports.SCMActiveRepositoryContextKeyController = SCMActiveRepositoryContextKeyController;
    exports.SCMActiveRepositoryContextKeyController = SCMActiveRepositoryContextKeyController = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, editorService_1.IEditorService),
        __param(2, scm_1.ISCMViewService),
        __param(3, titleService_1.ITitleService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], SCMActiveRepositoryContextKeyController);
    let SCMActiveResourceContextKeyController = class SCMActiveResourceContextKeyController {
        constructor(contextKeyService, editorService, scmService, uriIdentityService) {
            this.editorService = editorService;
            this.scmService = scmService;
            this.uriIdentityService = uriIdentityService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new Set();
            this.activeResourceHasChangesContextKey = contextKeyService.createKey('scmActiveResourceHasChanges', false);
            this.activeResourceRepositoryContextKey = contextKeyService.createKey('scmActiveResourceRepository', undefined);
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            editorService.onDidActiveEditorChange(this.updateContextKey, this, this.disposables);
        }
        onDidAddRepository(repository) {
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.updateContextKey());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.repositoryDisposables.delete(disposable);
                this.updateContextKey();
            });
            const disposable = (0, lifecycle_1.combinedDisposable)(changeDisposable, removeDisposable);
            this.repositoryDisposables.add(disposable);
        }
        updateContextKey() {
            const activeResource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if (activeResource?.scheme === network_1.Schemas.file || activeResource?.scheme === network_1.Schemas.vscodeRemote) {
                const activeResourceRepository = iterator_1.Iterable.find(this.scmService.repositories, r => Boolean(r.provider.rootUri && this.uriIdentityService.extUri.isEqualOrParent(activeResource, r.provider.rootUri)));
                this.activeResourceRepositoryContextKey.set(activeResourceRepository?.id);
                for (const resourceGroup of activeResourceRepository?.provider.groups ?? []) {
                    if (resourceGroup.resources
                        .some(scmResource => this.uriIdentityService.extUri.isEqual(activeResource, scmResource.sourceUri))) {
                        this.activeResourceHasChangesContextKey.set(true);
                        return;
                    }
                }
                this.activeResourceHasChangesContextKey.set(false);
            }
            else {
                this.activeResourceHasChangesContextKey.set(false);
                this.activeResourceRepositoryContextKey.set(undefined);
            }
        }
        dispose() {
            this.disposables.dispose();
            (0, lifecycle_1.dispose)(this.repositoryDisposables.values());
            this.repositoryDisposables.clear();
        }
    };
    exports.SCMActiveResourceContextKeyController = SCMActiveResourceContextKeyController;
    exports.SCMActiveResourceContextKeyController = SCMActiveResourceContextKeyController = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, editorService_1.IEditorService),
        __param(2, scm_1.ISCMService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], SCMActiveResourceContextKeyController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9icm93c2VyL2FjdGl2aXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CaEcsU0FBUyxRQUFRLENBQUMsVUFBMEI7UUFDM0MsSUFBSSxPQUFPLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ25ELE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDbEMsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RixDQUFDO0lBQ0YsQ0FBQztJQUVNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBUy9CLFlBQ2MsVUFBd0MsRUFDcEMsY0FBZ0QsRUFDOUMsZ0JBQW9ELEVBQ3JELGVBQWtELEVBQ3BELGFBQThDLEVBQ3ZDLG9CQUE0RCxFQUM5RCxrQkFBd0Q7WUFOL0MsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNwQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDbkMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDN0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQWR0RSx3QkFBbUIsR0FBZ0Isc0JBQVUsQ0FBQyxJQUFJLENBQUM7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