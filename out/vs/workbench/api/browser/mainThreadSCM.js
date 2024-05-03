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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/scm/common/scm", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/cancellation", "vs/base/common/themables", "vs/workbench/contrib/scm/common/quickDiff", "vs/base/common/resourceTree", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/base/common/resources"], function (require, exports, uri_1, event_1, lifecycle_1, scm_1, extHost_protocol_1, extHostCustomers_1, cancellation_1, themables_1, quickDiff_1, resourceTree_1, uriIdentity_1, workspace_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSCM = void 0;
    function getIconFromIconDto(iconDto) {
        if (iconDto === undefined) {
            return undefined;
        }
        else if (uri_1.URI.isUri(iconDto)) {
            return uri_1.URI.revive(iconDto);
        }
        else if (themables_1.ThemeIcon.isThemeIcon(iconDto)) {
            return iconDto;
        }
        else {
            const icon = iconDto;
            return { light: uri_1.URI.revive(icon.light), dark: uri_1.URI.revive(icon.dark) };
        }
    }
    class MainThreadSCMResourceGroup {
        get resourceTree() {
            if (!this._resourceTree) {
                const rootUri = this.provider.rootUri ?? uri_1.URI.file('/');
                this._resourceTree = new resourceTree_1.ResourceTree(this, rootUri, this._uriIdentService.extUri);
                for (const resource of this.resources) {
                    this._resourceTree.add(resource.sourceUri, resource);
                }
            }
            return this._resourceTree;
        }
        get hideWhenEmpty() { return !!this.features.hideWhenEmpty; }
        constructor(sourceControlHandle, handle, provider, features, label, id, multiDiffEditorEnableViewChanges, _uriIdentService) {
            this.sourceControlHandle = sourceControlHandle;
            this.handle = handle;
            this.provider = provider;
            this.features = features;
            this.label = label;
            this.id = id;
            this.multiDiffEditorEnableViewChanges = multiDiffEditorEnableViewChanges;
            this._uriIdentService = _uriIdentService;
            this.resources = [];
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._onDidChangeResources = new event_1.Emitter();
            this.onDidChangeResources = this._onDidChangeResources.event;
        }
        toJSON() {
            return {
                $mid: 4 /* MarshalledId.ScmResourceGroup */,
                sourceControlHandle: this.sourceControlHandle,
                groupHandle: this.handle
            };
        }
        splice(start, deleteCount, toInsert) {
            this.resources.splice(start, deleteCount, ...toInsert);
            this._resourceTree = undefined;
            this._onDidChangeResources.fire();
        }
        $updateGroup(features) {
            this.features = { ...this.features, ...features };
            this._onDidChange.fire();
        }
        $updateGroupLabel(label) {
            this.label = label;
            this._onDidChange.fire();
        }
    }
    class MainThreadSCMResource {
        constructor(proxy, sourceControlHandle, groupHandle, handle, sourceUri, resourceGroup, decorations, contextValue, command, multiDiffEditorOriginalUri, multiDiffEditorModifiedUri) {
            this.proxy = proxy;
            this.sourceControlHandle = sourceControlHandle;
            this.groupHandle = groupHandle;
            this.handle = handle;
            this.sourceUri = sourceUri;
            this.resourceGroup = resourceGroup;
            this.decorations = decorations;
            this.contextValue = contextValue;
            this.command = command;
            this.multiDiffEditorOriginalUri = multiDiffEditorOriginalUri;
            this.multiDiffEditorModifiedUri = multiDiffEditorModifiedUri;
        }
        open(preserveFocus) {
            return this.proxy.$executeResourceCommand(this.sourceControlHandle, this.groupHandle, this.handle, preserveFocus);
        }
        toJSON() {
            return {
                $mid: 3 /* MarshalledId.ScmResource */,
                sourceControlHandle: this.sourceControlHandle,
                groupHandle: this.groupHandle,
                handle: this.handle
            };
        }
    }
    class MainThreadSCMHistoryProvider {
        get currentHistoryItemGroup() { return this._currentHistoryItemGroup; }
        set currentHistoryItemGroup(historyItemGroup) {
            this._currentHistoryItemGroup = historyItemGroup;
            this._onDidChangeCurrentHistoryItemGroup.fire();
        }
        constructor(proxy, handle) {
            this.proxy = proxy;
            this.handle = handle;
            this._onDidChangeCurrentHistoryItemGroup = new event_1.Emitter();
            this.onDidChangeCurrentHistoryItemGroup = this._onDidChangeCurrentHistoryItemGroup.event;
        }
        async resolveHistoryItemGroupCommonAncestor(historyItemGroupId1, historyItemGroupId2) {
            return this.proxy.$resolveHistoryItemGroupCommonAncestor(this.handle, historyItemGroupId1, historyItemGroupId2, cancellation_1.CancellationToken.None);
        }
        async provideHistoryItems(historyItemGroupId, options) {
            const historyItems = await this.proxy.$provideHistoryItems(this.handle, historyItemGroupId, options, cancellation_1.CancellationToken.None);
            return historyItems?.map(historyItem => ({ ...historyItem, icon: getIconFromIconDto(historyItem.icon) }));
        }
        async provideHistoryItemSummary(historyItemId, historyItemParentId) {
            const historyItem = await this.proxy.$provideHistoryItemSummary(this.handle, historyItemId, historyItemParentId, cancellation_1.CancellationToken.None);
            return historyItem ? { ...historyItem, icon: getIconFromIconDto(historyItem.icon) } : undefined;
        }
        async provideHistoryItemChanges(historyItemId, historyItemParentId) {
            const changes = await this.proxy.$provideHistoryItemChanges(this.handle, historyItemId, historyItemParentId, cancellation_1.CancellationToken.None);
            return changes?.map(change => ({
                uri: uri_1.URI.revive(change.uri),
                originalUri: change.originalUri && uri_1.URI.revive(change.originalUri),
                modifiedUri: change.modifiedUri && uri_1.URI.revive(change.modifiedUri),
                renameUri: change.renameUri && uri_1.URI.revive(change.renameUri)
            }));
        }
    }
    class MainThreadSCMProvider {
        static { this.ID_HANDLE = 0; }
        get id() { return this._id; }
        get handle() { return this._handle; }
        get label() { return this._label; }
        get rootUri() { return this._rootUri; }
        get inputBoxDocumentUri() { return this._inputBoxDocumentUri; }
        get contextValue() { return this._providerId; }
        get commitTemplate() { return this.features.commitTemplate || ''; }
        get historyProvider() { return this._historyProvider; }
        get acceptInputCommand() { return this.features.acceptInputCommand; }
        get actionButton() { return this.features.actionButton ?? undefined; }
        get statusBarCommands() { return this.features.statusBarCommands; }
        get count() { return this.features.count; }
        get name() { return this._name ?? this._label; }
        get onDidChangeStatusBarCommands() { return this._onDidChangeStatusBarCommands.event; }
        constructor(proxy, _handle, _providerId, _label, _rootUri, _inputBoxDocumentUri, _quickDiffService, _uriIdentService, _workspaceContextService) {
            this.proxy = proxy;
            this._handle = _handle;
            this._providerId = _providerId;
            this._label = _label;
            this._rootUri = _rootUri;
            this._inputBoxDocumentUri = _inputBoxDocumentUri;
            this._quickDiffService = _quickDiffService;
            this._uriIdentService = _uriIdentService;
            this._workspaceContextService = _workspaceContextService;
            this._id = `scm${MainThreadSCMProvider.ID_HANDLE++}`;
            this.groups = [];
            this._onDidChangeResourceGroups = new event_1.Emitter();
            this.onDidChangeResourceGroups = this._onDidChangeResourceGroups.event;
            this._onDidChangeResources = new event_1.Emitter();
            this.onDidChangeResources = this._onDidChangeResources.event;
            this._groupsByHandle = Object.create(null);
            // get groups(): ISequence<ISCMResourceGroup> {
            // 	return {
            // 		elements: this._groups,
            // 		onDidSplice: this._onDidSplice.event
            // 	};
            // 	// return this._groups
            // 	// 	.filter(g => g.resources.elements.length > 0 || !g.features.hideWhenEmpty);
            // }
            this.features = {};
            this._onDidChangeCommitTemplate = new event_1.Emitter();
            this.onDidChangeCommitTemplate = this._onDidChangeCommitTemplate.event;
            this._onDidChangeStatusBarCommands = new event_1.Emitter();
            this._onDidChangeHistoryProvider = new event_1.Emitter();
            this.onDidChangeHistoryProvider = this._onDidChangeHistoryProvider.event;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.isSCM = true;
            if (_rootUri) {
                const folder = this._workspaceContextService.getWorkspaceFolder(_rootUri);
                if (folder?.uri.toString() === _rootUri.toString()) {
                    this._name = folder.name;
                }
                else if (_rootUri.path !== '/') {
                    this._name = (0, resources_1.basename)(_rootUri);
                }
            }
        }
        $updateSourceControl(features) {
            this.features = { ...this.features, ...features };
            this._onDidChange.fire();
            if (typeof features.commitTemplate !== 'undefined') {
                this._onDidChangeCommitTemplate.fire(this.commitTemplate);
            }
            if (typeof features.statusBarCommands !== 'undefined') {
                this._onDidChangeStatusBarCommands.fire(this.statusBarCommands);
            }
            if (features.hasQuickDiffProvider && !this._quickDiff) {
                this._quickDiff = this._quickDiffService.addQuickDiffProvider({
                    label: features.quickDiffLabel ?? this.label,
                    rootUri: this.rootUri,
                    isSCM: this.isSCM,
                    getOriginalResource: (uri) => this.getOriginalResource(uri)
                });
            }
            else if (features.hasQuickDiffProvider === false && this._quickDiff) {
                this._quickDiff.dispose();
                this._quickDiff = undefined;
            }
            if (features.hasHistoryProvider && !this._historyProvider) {
                this._historyProvider = new MainThreadSCMHistoryProvider(this.proxy, this.handle);
                this._onDidChangeHistoryProvider.fire();
            }
            else if (features.hasHistoryProvider === false && this._historyProvider) {
                this._historyProvider = undefined;
                this._onDidChangeHistoryProvider.fire();
            }
        }
        $registerGroups(_groups) {
            const groups = _groups.map(([handle, id, label, features, multiDiffEditorEnableViewChanges]) => {
                const group = new MainThreadSCMResourceGroup(this.handle, handle, this, features, label, id, multiDiffEditorEnableViewChanges, this._uriIdentService);
                this._groupsByHandle[handle] = group;
                return group;
            });
            this.groups.splice(this.groups.length, 0, ...groups);
            this._onDidChangeResourceGroups.fire();
        }
        $updateGroup(handle, features) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            group.$updateGroup(features);
        }
        $updateGroupLabel(handle, label) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            group.$updateGroupLabel(label);
        }
        $spliceGroupResourceStates(splices) {
            for (const [groupHandle, groupSlices] of splices) {
                const group = this._groupsByHandle[groupHandle];
                if (!group) {
                    console.warn(`SCM group ${groupHandle} not found in provider ${this.label}`);
                    continue;
                }
                // reverse the splices sequence in order to apply them correctly
                groupSlices.reverse();
                for (const [start, deleteCount, rawResources] of groupSlices) {
                    const resources = rawResources.map(rawResource => {
                        const [handle, sourceUri, icons, tooltip, strikeThrough, faded, contextValue, command, multiDiffEditorOriginalUri, multiDiffEditorModifiedUri] = rawResource;
                        const [light, dark] = icons;
                        const icon = themables_1.ThemeIcon.isThemeIcon(light) ? light : uri_1.URI.revive(light);
                        const iconDark = (themables_1.ThemeIcon.isThemeIcon(dark) ? dark : uri_1.URI.revive(dark)) || icon;
                        const decorations = {
                            icon: icon,
                            iconDark: iconDark,
                            tooltip,
                            strikeThrough,
                            faded
                        };
                        return new MainThreadSCMResource(this.proxy, this.handle, groupHandle, handle, uri_1.URI.revive(sourceUri), group, decorations, contextValue || undefined, command, uri_1.URI.revive(multiDiffEditorOriginalUri), uri_1.URI.revive(multiDiffEditorModifiedUri));
                    });
                    group.splice(start, deleteCount, resources);
                }
            }
            this._onDidChangeResources.fire();
        }
        $unregisterGroup(handle) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            delete this._groupsByHandle[handle];
            this.groups.splice(this.groups.indexOf(group), 1);
            this._onDidChangeResourceGroups.fire();
        }
        async getOriginalResource(uri) {
            if (!this.features.hasQuickDiffProvider) {
                return null;
            }
            const result = await this.proxy.$provideOriginalResource(this.handle, uri, cancellation_1.CancellationToken.None);
            return result && uri_1.URI.revive(result);
        }
        $onDidChangeHistoryProviderCurrentHistoryItemGroup(currentHistoryItemGroup) {
            if (!this._historyProvider) {
                return;
            }
            this._historyProvider.currentHistoryItemGroup = currentHistoryItemGroup ?? undefined;
        }
        toJSON() {
            return {
                $mid: 5 /* MarshalledId.ScmProvider */,
                handle: this.handle
            };
        }
        dispose() {
            this._quickDiff?.dispose();
        }
    }
    let MainThreadSCM = class MainThreadSCM {
        constructor(extHostContext, scmService, scmViewService, quickDiffService, _uriIdentService, workspaceContextService) {
            this.scmService = scmService;
            this.scmViewService = scmViewService;
            this.quickDiffService = quickDiffService;
            this._uriIdentService = _uriIdentService;
            this.workspaceContextService = workspaceContextService;
            this._repositories = new Map();
            this._repositoryDisposables = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSCM);
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._repositories.values());
            this._repositories.clear();
            (0, lifecycle_1.dispose)(this._repositoryDisposables.values());
            this._repositoryDisposables.clear();
            this._disposables.dispose();
        }
        $registerSourceControl(handle, id, label, rootUri, inputBoxDocumentUri) {
            const provider = new MainThreadSCMProvider(this._proxy, handle, id, label, rootUri ? uri_1.URI.revive(rootUri) : undefined, uri_1.URI.revive(inputBoxDocumentUri), this.quickDiffService, this._uriIdentService, this.workspaceContextService);
            const repository = this.scmService.registerSCMProvider(provider);
            this._repositories.set(handle, repository);
            const disposable = (0, lifecycle_1.combinedDisposable)(event_1.Event.filter(this.scmViewService.onDidFocusRepository, r => r === repository)(_ => this._proxy.$setSelectedSourceControl(handle)), repository.input.onDidChange(({ value }) => this._proxy.$onInputBoxValueChange(handle, value)));
            if (this.scmViewService.focusedRepository === repository) {
                setTimeout(() => this._proxy.$setSelectedSourceControl(handle), 0);
            }
            if (repository.input.value) {
                setTimeout(() => this._proxy.$onInputBoxValueChange(handle, repository.input.value), 0);
            }
            this._repositoryDisposables.set(handle, disposable);
        }
        $updateSourceControl(handle, features) {
            const repository = this._repositories.get(handle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateSourceControl(features);
        }
        $unregisterSourceControl(handle) {
            const repository = this._repositories.get(handle);
            if (!repository) {
                return;
            }
            this._repositoryDisposables.get(handle).dispose();
            this._repositoryDisposables.delete(handle);
            repository.dispose();
            this._repositories.delete(handle);
        }
        $registerGroups(sourceControlHandle, groups, splices) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$registerGroups(groups);
            provider.$spliceGroupResourceStates(splices);
        }
        $updateGroup(sourceControlHandle, groupHandle, features) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateGroup(groupHandle, features);
        }
        $updateGroupLabel(sourceControlHandle, groupHandle, label) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateGroupLabel(groupHandle, label);
        }
        $spliceResourceStates(sourceControlHandle, splices) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$spliceGroupResourceStates(splices);
        }
        $unregisterGroup(sourceControlHandle, handle) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$unregisterGroup(handle);
        }
        $setInputBoxValue(sourceControlHandle, value) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.setValue(value, false);
        }
        $setInputBoxPlaceholder(sourceControlHandle, placeholder) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.placeholder = placeholder;
        }
        $setInputBoxEnablement(sourceControlHandle, enabled) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.enabled = enabled;
        }
        $setInputBoxVisibility(sourceControlHandle, visible) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.visible = visible;
        }
        $showValidationMessage(sourceControlHandle, message, type) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.showValidationMessage(message, type);
        }
        $setValidationProviderIsEnabled(sourceControlHandle, enabled) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            if (enabled) {
                repository.input.validateInput = async (value, pos) => {
                    const result = await this._proxy.$validateInput(sourceControlHandle, value, pos);
                    return result && { message: result[0], type: result[1] };
                };
            }
            else {
                repository.input.validateInput = async () => undefined;
            }
        }
        $onDidChangeHistoryProviderCurrentHistoryItemGroup(sourceControlHandle, historyItemGroup) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$onDidChangeHistoryProviderCurrentHistoryItemGroup(historyItemGroup);
        }
    };
    exports.MainThreadSCM = MainThreadSCM;
    exports.MainThreadSCM = MainThreadSCM = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadSCM),
        __param(1, scm_1.ISCMService),
        __param(2, scm_1.ISCMViewService),
        __param(3, quickDiff_1.IQuickDiffService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], MainThreadSCM);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNDTS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRTQ00udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxTQUFTLGtCQUFrQixDQUFDLE9BQW1GO1FBQzlHLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7YUFBTSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMvQixPQUFPLFNBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsQ0FBQzthQUFNLElBQUkscUJBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUMzQyxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO2FBQU0sQ0FBQztZQUNQLE1BQU0sSUFBSSxHQUFHLE9BQXdELENBQUM7WUFDdEUsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUN2RSxDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQU0sMEJBQTBCO1FBSy9CLElBQUksWUFBWTtZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSwyQkFBWSxDQUFr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