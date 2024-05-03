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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/base/common/uri", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/resources", "vs/workbench/common/editor/editorGroupModel", "vs/workbench/contrib/interactive/browser/interactiveEditorInput", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/platform/log/common/log", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput"], function (require, exports, lifecycle_1, extHost_protocol_1, extHostCustomers_1, editor_1, diffEditorInput_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, textResourceEditorInput_1, notebookEditorInput_1, customEditorInput_1, uri_1, webviewEditorInput_1, terminalEditorInput_1, configuration_1, sideBySideEditorInput_1, resources_1, editorGroupModel_1, interactiveEditorInput_1, mergeEditorInput_1, log_1, chatEditorInput_1, multiDiffEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadEditorTabs = void 0;
    let MainThreadEditorTabs = class MainThreadEditorTabs {
        constructor(extHostContext, _editorGroupsService, _configurationService, _logService, editorService) {
            this._editorGroupsService = _editorGroupsService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._dispoables = new lifecycle_1.DisposableStore();
            // List of all groups and their corresponding tabs, this is **the** model
            this._tabGroupModel = [];
            // Lookup table for finding group by id
            this._groupLookup = new Map();
            // Lookup table for finding tab by id
            this._tabInfoLookup = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostEditorTabs);
            // Main listener which responds to events from the editor service
            this._dispoables.add(editorService.onDidEditorsChange((event) => {
                try {
                    this._updateTabsModel(event);
                }
                catch {
                    this._logService.error('Failed to update model, rebuilding');
                    this._createTabsModel();
                }
            }));
            // Structural group changes (add, remove, move, etc) are difficult to patch.
            // Since they happen infrequently we just rebuild the entire model
            this._dispoables.add(this._editorGroupsService.onDidAddGroup(() => this._createTabsModel()));
            this._dispoables.add(this._editorGroupsService.onDidRemoveGroup(() => this._createTabsModel()));
            // Once everything is read go ahead and initialize the model
            this._editorGroupsService.whenReady.then(() => this._createTabsModel());
        }
        dispose() {
            this._groupLookup.clear();
            this._tabInfoLookup.clear();
            this._dispoables.dispose();
        }
        /**
         * Creates a tab object with the correct properties
         * @param editor The editor input represented by the tab
         * @param group The group the tab is in
         * @returns A tab object
         */
        _buildTabObject(group, editor, editorIndex) {
            const editorId = editor.editorId;
            const tab = {
                id: this._generateTabId(editor, group.id),
                label: editor.getName(),
                editorId,
                input: this._editorInputToDto(editor),
                isPinned: group.isSticky(editorIndex),
                isPreview: !group.isPinned(editorIndex),
                isActive: group.isActive(editor),
                isDirty: editor.isDirty()
            };
            return tab;
        }
        _editorInputToDto(editor) {
            if (editor instanceof mergeEditorInput_1.MergeEditorInput) {
                return {
                    kind: 3 /* TabInputKind.TextMergeInput */,
                    base: editor.base,
                    input1: editor.input1.uri,
                    input2: editor.input2.uri,
                    result: editor.resource
                };
            }
            if (editor instanceof textResourceEditorInput_1.AbstractTextResourceEditorInput) {
                return {
                    kind: 1 /* TabInputKind.TextInput */,
                    uri: editor.resource
                };
            }
            if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput && !(editor instanceof diffEditorInput_1.DiffEditorInput)) {
                const primaryResource = editor.primary.resource;
                const secondaryResource = editor.secondary.resource;
                // If side by side editor with same resource on both sides treat it as a singular tab kind
                if (editor.primary instanceof textResourceEditorInput_1.AbstractTextResourceEditorInput
                    && editor.secondary instanceof textResourceEditorInput_1.AbstractTextResourceEditorInput
                    && (0, resources_1.isEqual)(primaryResource, secondaryResource)
                    && primaryResource
                    && secondaryResource) {
                    return {
                        kind: 1 /* TabInputKind.TextInput */,
                        uri: primaryResource
                    };
                }
                return { kind: 0 /* TabInputKind.UnknownInput */ };
            }
            if (editor instanceof notebookEditorInput_1.NotebookEditorInput) {
                return {
                    kind: 4 /* TabInputKind.NotebookInput */,
                    notebookType: editor.viewType,
                    uri: editor.resource
                };
            }
            if (editor instanceof customEditorInput_1.CustomEditorInput) {
                return {
                    kind: 6 /* TabInputKind.CustomEditorInput */,
                    viewType: editor.viewType,
                    uri: editor.resource,
                };
            }
            if (editor instanceof webviewEditorInput_1.WebviewInput) {
                return {
                    kind: 7 /* TabInputKind.WebviewEditorInput */,
                    viewType: editor.viewType
                };
            }
            if (editor instanceof terminalEditorInput_1.TerminalEditorInput) {
                return {
                    kind: 8 /* TabInputKind.TerminalEditorInput */
                };
            }
            if (editor instanceof diffEditorInput_1.DiffEditorInput) {
                if (editor.modified instanceof textResourceEditorInput_1.AbstractTextResourceEditorInput && editor.original instanceof textResourceEditorInput_1.AbstractTextResourceEditorInput) {
                    return {
                        kind: 2 /* TabInputKind.TextDiffInput */,
                        modified: editor.modified.resource,
                        original: editor.original.resource
                    };
                }
                if (editor.modified instanceof notebookEditorInput_1.NotebookEditorInput && editor.original instanceof notebookEditorInput_1.NotebookEditorInput) {
                    return {
                        kind: 5 /* TabInputKind.NotebookDiffInput */,
                        notebookType: editor.original.viewType,
                        modified: editor.modified.resource,
                        original: editor.original.resource
                    };
                }
            }
            if (editor instanceof interactiveEditorInput_1.InteractiveEditorInput) {
                return {
                    kind: 9 /* TabInputKind.InteractiveEditorInput */,
                    uri: editor.resource,
                    inputBoxUri: editor.inputResource
                };
            }
            if (editor instanceof chatEditorInput_1.ChatEditorInput) {
                return {
                    kind: 10 /* TabInputKind.ChatEditorInput */,
                    providerId: editor.providerId ?? 'unknown',
                };
            }
            if (editor instanceof multiDiffEditorInput_1.MultiDiffEditorInput) {
                const diffEditors = [];
                for (const resource of (editor?.initialResources ?? [])) {
                    if (resource.original && resource.modified) {
                        diffEditors.push({
                            kind: 2 /* TabInputKind.TextDiffInput */,
                            original: resource.original,
                            modified: resource.modified
                        });
                    }
                }
                return {
                    kind: 11 /* TabInputKind.MultiDiffEditorInput */,
                    diffEditors
                };
            }
            return { kind: 0 /* TabInputKind.UnknownInput */ };
        }
        /**
         * Generates a unique id for a tab
         * @param editor The editor input
         * @param groupId The group id
         * @returns A unique identifier for a specific tab
         */
        _generateTabId(editor, groupId) {
            let resourceString;
            // Properly get the resource and account for side by side editors
            const resource = editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH });
            if (resource instanceof uri_1.URI) {
                resourceString = resource.toString();
            }
            else {
                resourceString = `${resource?.primary?.toString()}-${resource?.secondary?.toString()}`;
            }
            return `${groupId}~${editor.editorId}-${editor.typeId}-${resourceString} `;
        }
        /**
         * Called whenever a group activates, updates the model by marking the group as active an notifies the extension host
         */
        _onDidGroupActivate() {
            const activeGroupId = this._editorGroupsService.activeGroup.id;
            const activeGroup = this._groupLookup.get(activeGroupId);
            if (activeGroup) {
                // Ok not to loop as exthost accepts last active group
                activeGroup.isActive = true;
                this._proxy.$acceptTabGroupUpdate(activeGroup);
            }
        }
        /**
         * Called when the tab label changes
         * @param groupId The id of the group the tab exists in
         * @param editorInput The editor input represented by the tab
         */
        _onDidTabLabelChange(groupId, editorInput, editorIndex) {
            const tabId = this._generateTabId(editorInput, groupId);
            const tabInfo = this._tabInfoLookup.get(tabId);
            // If tab is found patch, else rebuild
            if (tabInfo) {
                tabInfo.tab.label = editorInput.getName();
                this._proxy.$acceptTabOperation({
                    groupId,
                    index: editorIndex,
                    tabDto: tabInfo.tab,
                    kind: 2 /* TabModelOperationKind.TAB_UPDATE */
                });
            }
            else {
                this._logService.error('Invalid model for label change, rebuilding');
                this._createTabsModel();
            }
        }
        /**
         * Called when a new tab is opened
         * @param groupId The id of the group the tab is being created in
         * @param editorInput The editor input being opened
         * @param editorIndex The index of the editor within that group
         */
        _onDidTabOpen(groupId, editorInput, editorIndex) {
            const group = this._editorGroupsService.getGroup(groupId);
            // Even if the editor service knows about the group the group might not exist yet in our model
            const groupInModel = this._groupLookup.get(groupId) !== undefined;
            // Means a new group was likely created so we rebuild the model
            if (!group || !groupInModel) {
                this._createTabsModel();
                return;
            }
            const tabs = this._groupLookup.get(groupId)?.tabs;
            if (!tabs) {
                return;
            }
            // Splice tab into group at index editorIndex
            const tabObject = this._buildTabObject(group, editorInput, editorIndex);
            tabs.splice(editorIndex, 0, tabObject);
            // Update lookup
            this._tabInfoLookup.set(this._generateTabId(editorInput, groupId), { group, editorInput, tab: tabObject });
            this._proxy.$acceptTabOperation({
                groupId,
                index: editorIndex,
                tabDto: tabObject,
                kind: 0 /* TabModelOperationKind.TAB_OPEN */
            });
        }
        /**
         * Called when a tab is closed
         * @param groupId The id of the group the tab is being removed from
         * @param editorIndex The index of the editor within that group
         */
        _onDidTabClose(groupId, editorIndex) {
            const group = this._editorGroupsService.getGroup(groupId);
            const tabs = this._groupLookup.get(groupId)?.tabs;
            // Something is wrong with the model state so we rebuild
            if (!group || !tabs) {
                this._createTabsModel();
                return;
            }
            // Splice tab into group at index editorIndex
            const removedTab = tabs.splice(editorIndex, 1);
            // Index must no longer be valid so we return prematurely
            if (removedTab.length === 0) {
                return;
            }
            // Update lookup
            this._tabInfoLookup.delete(removedTab[0]?.id ?? '');
            this._proxy.$acceptTabOperation({
                groupId,
                index: editorIndex,
                tabDto: removedTab[0],
                kind: 1 /* TabModelOperationKind.TAB_CLOSE */
            });
        }
        /**
         * Called when the active tab changes
         * @param groupId The id of the group the tab is contained in
         * @param editorIndex The index of the tab
         */
        _onDidTabActiveChange(groupId, editorIndex) {
            // TODO @lramos15 use the tab lookup here if possible. Do we have an editor input?!
            const tabs = this._groupLookup.get(groupId)?.tabs;
            if (!tabs) {
                return;
            }
            const activeTab = tabs[editorIndex];
            // No need to loop over as the exthost uses the most recently marked active tab
            activeTab.isActive = true;
            // Send DTO update to the exthost
            this._proxy.$acceptTabOperation({
                groupId,
                index: editorIndex,
                tabDto: activeTab,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */
            });
        }
        /**
         * Called when the dirty indicator on the tab changes
         * @param groupId The id of the group the tab is in
         * @param editorIndex The index of the tab
         * @param editor The editor input represented by the tab
         */
        _onDidTabDirty(groupId, editorIndex, editor) {
            const tabId = this._generateTabId(editor, groupId);
            const tabInfo = this._tabInfoLookup.get(tabId);
            // Something wrong with the model state so we rebuild
            if (!tabInfo) {
                this._logService.error('Invalid model for dirty change, rebuilding');
                this._createTabsModel();
                return;
            }
            tabInfo.tab.isDirty = editor.isDirty();
            this._proxy.$acceptTabOperation({
                groupId,
                index: editorIndex,
                tabDto: tabInfo.tab,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */
            });
        }
        /**
         * Called when the tab is pinned/unpinned
         * @param groupId The id of the group the tab is in
         * @param editorIndex The index of the tab
         * @param editor The editor input represented by the tab
         */
        _onDidTabPinChange(groupId, editorIndex, editor) {
            const tabId = this._generateTabId(editor, groupId);
            const tabInfo = this._tabInfoLookup.get(tabId);
            const group = tabInfo?.group;
            const tab = tabInfo?.tab;
            // Something wrong with the model state so we rebuild
            if (!group || !tab) {
                this._logService.error('Invalid model for sticky change, rebuilding');
                this._createTabsModel();
                return;
            }
            // Whether or not the tab has the pin icon (internally it's called sticky)
            tab.isPinned = group.isSticky(editorIndex);
            this._proxy.$acceptTabOperation({
                groupId,
                index: editorIndex,
                tabDto: tab,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */
            });
        }
        /**
     * Called when the tab is preview / unpreviewed
     * @param groupId The id of the group the tab is in
     * @param editorIndex The index of the tab
     * @param editor The editor input represented by the tab
     */
        _onDidTabPreviewChange(groupId, editorIndex, editor) {
            const tabId = this._generateTabId(editor, groupId);
            const tabInfo = this._tabInfoLookup.get(tabId);
            const group = tabInfo?.group;
            const tab = tabInfo?.tab;
            // Something wrong with the model state so we rebuild
            if (!group || !tab) {
                this._logService.error('Invalid model for sticky change, rebuilding');
                this._createTabsModel();
                return;
            }
            // Whether or not the tab has the pin icon (internally it's called pinned)
            tab.isPreview = !group.isPinned(editorIndex);
            this._proxy.$acceptTabOperation({
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                groupId,
                tabDto: tab,
                index: editorIndex
            });
        }
        _onDidTabMove(groupId, editorIndex, oldEditorIndex, editor) {
            const tabs = this._groupLookup.get(groupId)?.tabs;
            // Something wrong with the model state so we rebuild
            if (!tabs) {
                this._logService.error('Invalid model for move change, rebuilding');
                this._createTabsModel();
                return;
            }
            // Move tab from old index to new index
            const removedTab = tabs.splice(oldEditorIndex, 1);
            if (removedTab.length === 0) {
                return;
            }
            tabs.splice(editorIndex, 0, removedTab[0]);
            // Notify exthost of move
            this._proxy.$acceptTabOperation({
                kind: 3 /* TabModelOperationKind.TAB_MOVE */,
                groupId,
                tabDto: removedTab[0],
                index: editorIndex,
                oldIndex: oldEditorIndex
            });
        }
        /**
         * Builds the model from scratch based on the current state of the editor service.
         */
        _createTabsModel() {
            this._tabGroupModel = [];
            this._groupLookup.clear();
            this._tabInfoLookup.clear();
            let tabs = [];
            for (const group of this._editorGroupsService.groups) {
                const currentTabGroupModel = {
                    groupId: group.id,
                    isActive: group.id === this._editorGroupsService.activeGroup.id,
                    viewColumn: (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupsService, group),
                    tabs: []
                };
                group.editors.forEach((editor, editorIndex) => {
                    const tab = this._buildTabObject(group, editor, editorIndex);
                    tabs.push(tab);
                    // Add information about the tab to the lookup
                    this._tabInfoLookup.set(this._generateTabId(editor, group.id), {
                        group,
                        tab,
                        editorInput: editor
                    });
                });
                currentTabGroupModel.tabs = tabs;
                this._tabGroupModel.push(currentTabGroupModel);
                this._groupLookup.set(group.id, currentTabGroupModel);
                tabs = [];
            }
            // notify the ext host of the new model
            this._proxy.$acceptEditorTabModel(this._tabGroupModel);
        }
        // TODOD @lramos15 Remove this after done finishing the tab model code
        // private _eventToString(event: IEditorsChangeEvent | IEditorsMoveEvent): string {
        // 	let eventString = '';
        // 	switch (event.kind) {
        // 		case GroupModelChangeKind.GROUP_INDEX: eventString += 'GROUP_INDEX'; break;
        // 		case GroupModelChangeKind.EDITOR_ACTIVE: eventString += 'EDITOR_ACTIVE'; break;
        // 		case GroupModelChangeKind.EDITOR_PIN: eventString += 'EDITOR_PIN'; break;
        // 		case GroupModelChangeKind.EDITOR_OPEN: eventString += 'EDITOR_OPEN'; break;
        // 		case GroupModelChangeKind.EDITOR_CLOSE: eventString += 'EDITOR_CLOSE'; break;
        // 		case GroupModelChangeKind.EDITOR_MOVE: eventString += 'EDITOR_MOVE'; break;
        // 		case GroupModelChangeKind.EDITOR_LABEL: eventString += 'EDITOR_LABEL'; break;
        // 		case GroupModelChangeKind.GROUP_ACTIVE: eventString += 'GROUP_ACTIVE'; break;
        // 		case GroupModelChangeKind.GROUP_LOCKED: eventString += 'GROUP_LOCKED'; break;
        // 		case GroupModelChangeKind.EDITOR_DIRTY: eventString += 'EDITOR_DIRTY'; break;
        // 		case GroupModelChangeKind.EDITOR_STICKY: eventString += 'EDITOR_STICKY'; break;
        // 		default: eventString += `UNKNOWN: ${event.kind}`; break;
        // 	}
        // 	return eventString;
        // }
        /**
         * The main handler for the tab events
         * @param events The list of events to process
         */
        _updateTabsModel(changeEvent) {
            const event = changeEvent.event;
            const groupId = changeEvent.groupId;
            switch (event.kind) {
                case 0 /* GroupModelChangeKind.GROUP_ACTIVE */:
                    if (groupId === this._editorGroupsService.activeGroup.id) {
                        this._onDidGroupActivate();
                        break;
                    }
                    else {
                        return;
                    }
                case 8 /* GroupModelChangeKind.EDITOR_LABEL */:
                    if (event.editor !== undefined && event.editorIndex !== undefined) {
                        this._onDidTabLabelChange(groupId, event.editor, event.editorIndex);
                        break;
                    }
                case 4 /* GroupModelChangeKind.EDITOR_OPEN */:
                    if (event.editor !== undefined && event.editorIndex !== undefined) {
                        this._onDidTabOpen(groupId, event.editor, event.editorIndex);
                        break;
                    }
                case 5 /* GroupModelChangeKind.EDITOR_CLOSE */:
                    if (event.editorIndex !== undefined) {
                        this._onDidTabClose(groupId, event.editorIndex);
                        break;
                    }
                case 7 /* GroupModelChangeKind.EDITOR_ACTIVE */:
                    if (event.editorIndex !== undefined) {
                        this._onDidTabActiveChange(groupId, event.editorIndex);
                        break;
                    }
                case 13 /* GroupModelChangeKind.EDITOR_DIRTY */:
                    if (event.editorIndex !== undefined && event.editor !== undefined) {
                        this._onDidTabDirty(groupId, event.editorIndex, event.editor);
                        break;
                    }
                case 12 /* GroupModelChangeKind.EDITOR_STICKY */:
                    if (event.editorIndex !== undefined && event.editor !== undefined) {
                        this._onDidTabPinChange(groupId, event.editorIndex, event.editor);
                        break;
                    }
                case 10 /* GroupModelChangeKind.EDITOR_PIN */:
                    if (event.editorIndex !== undefined && event.editor !== undefined) {
                        this._onDidTabPreviewChange(groupId, event.editorIndex, event.editor);
                        break;
                    }
                case 11 /* GroupModelChangeKind.EDITOR_TRANSIENT */:
                    // Currently not exposed in the API
                    break;
                case 6 /* GroupModelChangeKind.EDITOR_MOVE */:
                    if ((0, editorGroupModel_1.isGroupEditorMoveEvent)(event) && event.editor && event.editorIndex !== undefined && event.oldEditorIndex !== undefined) {
                        this._onDidTabMove(groupId, event.editorIndex, event.oldEditorIndex, event.editor);
                        break;
                    }
                default:
                    // If it's not an optimized case we rebuild the tabs model from scratch
                    this._createTabsModel();
            }
        }
        //#region Messages received from Ext Host
        $moveTab(tabId, index, viewColumn, preserveFocus) {
            const groupId = (0, editorGroupColumn_1.columnToEditorGroup)(this._editorGroupsService, this._configurationService, viewColumn);
            const tabInfo = this._tabInfoLookup.get(tabId);
            const tab = tabInfo?.tab;
            if (!tab) {
                throw new Error(`Attempted to close tab with id ${tabId} which does not exist`);
            }
            let targetGroup;
            const sourceGroup = this._editorGroupsService.getGroup(tabInfo.group.id);
            if (!sourceGroup) {
                return;
            }
            // If group index is out of bounds then we make a new one that's to the right of the last group
            if (this._groupLookup.get(groupId) === undefined) {
                let direction = 3 /* GroupDirection.RIGHT */;
                // Make sure we respect the user's preferred side direction
                if (viewColumn === editorService_1.SIDE_GROUP) {
                    direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this._configurationService);
                }
                targetGroup = this._editorGroupsService.addGroup(this._editorGroupsService.groups[this._editorGroupsService.groups.length - 1], direction);
            }
            else {
                targetGroup = this._editorGroupsService.getGroup(groupId);
            }
            if (!targetGroup) {
                return;
            }
            // Similar logic to if index is out of bounds we place it at the end
            if (index < 0 || index > targetGroup.editors.length) {
                index = targetGroup.editors.length;
            }
            // Find the correct EditorInput using the tab info
            const editorInput = tabInfo?.editorInput;
            if (!editorInput) {
                return;
            }
            // Move the editor to the target group
            sourceGroup.moveEditor(editorInput, targetGroup, { index, preserveFocus });
            return;
        }
        async $closeTab(tabIds, preserveFocus) {
            const groups = new Map();
            for (const tabId of tabIds) {
                const tabInfo = this._tabInfoLookup.get(tabId);
                const tab = tabInfo?.tab;
                const group = tabInfo?.group;
                const editorTab = tabInfo?.editorInput;
                // If not found skip
                if (!group || !tab || !tabInfo || !editorTab) {
                    continue;
                }
                const groupEditors = groups.get(group);
                if (!groupEditors) {
                    groups.set(group, [editorTab]);
                }
                else {
                    groupEditors.push(editorTab);
                }
            }
            // Loop over keys of the groups map and call closeEditors
            const results = [];
            for (const [group, editors] of groups) {
                results.push(await group.closeEditors(editors, { preserveFocus }));
            }
            // TODO @jrieken This isn't quite right how can we say true for some but not others?
            return results.every(result => result);
        }
        async $closeGroup(groupIds, preserveFocus) {
            const groupCloseResults = [];
            for (const groupId of groupIds) {
                const group = this._editorGroupsService.getGroup(groupId);
                if (group) {
                    groupCloseResults.push(await group.closeAllEditors());
                    // Make sure group is empty but still there before removing it
                    if (group.count === 0 && this._editorGroupsService.getGroup(group.id)) {
                        this._editorGroupsService.removeGroup(group);
                    }
                }
            }
            return groupCloseResults.every(result => result);
        }
    };
    exports.MainThreadEditorTabs = MainThreadEditorTabs;
    exports.MainThreadEditorTabs = MainThreadEditorTabs = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadEditorTabs),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, log_1.ILogService),
        __param(4, editorService_1.IEditorService)
    ], MainThreadEditorTabs);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVkaXRvclRhYnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRWRpdG9yVGFicy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ3pGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQW9CO1FBV2hDLFlBQ0MsY0FBK0IsRUFDVCxvQkFBMkQsRUFDMUQscUJBQTZELEVBQ3ZFLFdBQXlDLEVBQ3RDLGFBQTZCO1lBSE4seUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUN6QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3RELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBYnRDLGdCQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFckQseUVBQXlFO1lBQ2pFLG1CQUFjLEdBQXlCLEVBQUUsQ0FBQztZQUNsRCx1Q0FBdUM7WUFDdEIsaUJBQVksR0FBb0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMzRSxxQ0FBcUM7WUFDcEIsbUJBQWMsR0FBeUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQVVqRSxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRXhFLGlFQUFpRTtZQUNqRSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDL0QsSUFBSSxDQUFDO29CQUNKLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFBQyxNQUFNLENBQUM7b0JBQ1IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsb0NBQW9DLENBQUMsQ0FBQztvQkFDN0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3pCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosNEVBQTRFO1lBQzVFLGtFQUFrRTtZQUNsRSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWhHLDREQUE0RDtZQUM1RCxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0ssZUFBZSxDQUFDLEtBQW1CLEVBQUUsTUFBbUIsRUFBRSxXQUFtQjtZQUNwRixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQ2pDLE1BQU0sR0FBRyxHQUFrQjtnQkFDMUIsRUFBRSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLEtBQUssRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFO2dCQUN2QixRQUFRO2dCQUNSLEtBQUssRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDO2dCQUNyQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7Z0JBQ3JDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO2dCQUN2QyxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ2hDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFO2FBQ3pCLENBQUM7WUFDRixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFFTyxpQkFBaUIsQ0FBQyxNQUFtQjtZQUU1QyxJQUFJLE1BQU0sWUFBWSxtQ0FBZ0IsRUFBRSxDQUFDO2dCQUN4QyxPQUFPO29CQUNOLElBQUkscUNBQTZCO29CQUNqQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7b0JBQ2pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUc7b0JBQ3pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUc7b0JBQ3pCLE1BQU0sRUFBRSxNQUFNLENBQUMsUUFBUTtpQkFDdkIsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLE1BQU0sWUFBWSx5REFBK0IsRUFBRSxDQUFDO2dCQUN2RCxPQUFPO29CQUNOLElBQUksZ0NBQXdCO29CQUM1QixHQUFHLEVBQUUsTUFBTSxDQUFDLFFBQVE7aUJBQ3BCLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxNQUFNLFlBQVksNkNBQXFCLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSxpQ0FBZSxDQUFDLEVBQUUsQ0FBQztnQkFDckYsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ2hELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7Z0JBQ3BELDBGQUEwRjtnQkFDMUYsSUFBSSxNQUFNLENBQUMsT0FBTyxZQUFZLHlEQUErQjt1QkFDekQsTUFBTSxDQUFDLFNBQVMsWUFBWSx5REFBK0I7dUJBQzNELElBQUEsbUJBQU8sRUFBQyxlQUFlLEVBQUUsaUJBQWlCLENBQUM7dUJBQzNDLGVBQWU7dUJBQ2YsaUJBQWlCLEVBQ25CLENBQUM7b0JBQ0YsT0FBTzt3QkFDTixJQUFJLGdDQUF3Qjt3QkFDNUIsR0FBRyxFQUFFLGVBQWU7cUJBQ3BCLENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxPQUFPLEVBQUUsSUFBSSxtQ0FBMkIsRUFBRSxDQUFDO1lBQzVDLENBQUM7WUFFRCxJQUFJLE1BQU0sWUFBWSx5Q0FBbUIsRUFBRSxDQUFDO2dCQUMzQyxPQUFPO29CQUNOLElBQUksb0NBQTRCO29CQUNoQyxZQUFZLEVBQUUsTUFBTSxDQUFDLFFBQVE7b0JBQzdCLEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUTtpQkFDcEIsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLE1BQU0sWUFBWSxxQ0FBaUIsRUFBRSxDQUFDO2dCQUN6QyxPQUFPO29CQUNOLElBQUksd0NBQWdDO29CQUNwQyxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7b0JBQ3pCLEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUTtpQkFDcEIsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLE1BQU0sWUFBWSxpQ0FBWSxFQUFFLENBQUM7Z0JBQ3BDLE9BQU87b0JBQ04sSUFBSSx5Q0FBaUM7b0JBQ3JDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtpQkFDekIsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLE1BQU0sWUFBWSx5Q0FBbUIsRUFBRSxDQUFDO2dCQUMzQyxPQUFPO29CQUNOLElBQUksMENBQWtDO2lCQUN0QyxDQUFDO1lBQ0gsQ0FBQztZQUVELElBQUksTUFBTSxZQUFZLGlDQUFlLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxNQUFNLENBQUMsUUFBUSxZQUFZLHlEQUErQixJQUFJLE1BQU0sQ0FBQyxRQUFRLFlBQVkseURBQStCLEVBQUUsQ0FBQztvQkFDOUgsT0FBTzt3QkFDTixJQUFJLG9DQUE0Qjt3QkFDaEMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUTt3QkFDbEMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUTtxQkFDbEMsQ0FBQztnQkFDSCxDQUFDO2dCQUNELElBQUksTUFBTSxDQUFDLFFBQVEsWUFBWSx5Q0FBbUIsSUFBSSxNQUFNLENBQUMsUUFBUSxZQUFZLHlDQUFtQixFQUFFLENBQUM7b0JBQ3RHLE9BQU87d0JBQ04sSUFBSSx3Q0FBZ0M7d0JBQ3BDLFlBQVksRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVE7d0JBQ3RDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVE7d0JBQ2xDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVE7cUJBQ2xDLENBQUM7Z0JBQ0gsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLE1BQU0sWUFBWSwrQ0FBc0IsRUFBRSxDQUFDO2dCQUM5QyxPQUFPO29CQUNOLElBQUksNkNBQXFDO29CQUN6QyxHQUFHLEVBQUUsTUFBTSxDQUFDLFFBQVE7b0JBQ3BCLFdBQVcsRUFBRSxNQUFNLENBQUMsYUFBYTtpQkFDakMsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLE1BQU0sWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU87b0JBQ04sSUFBSSx1Q0FBOEI7b0JBQ2xDLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVSxJQUFJLFNBQVM7aUJBQzFDLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxNQUFNLFlBQVksMkNBQW9CLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxXQUFXLEdBQXVCLEVBQUUsQ0FBQztnQkFDM0MsS0FBSyxNQUFNLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRSxnQkFBZ0IsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUN6RCxJQUFJLFFBQVEsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUM1QyxXQUFXLENBQUMsSUFBSSxDQUFDOzRCQUNoQixJQUFJLG9DQUE0Qjs0QkFDaEMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFROzRCQUMzQixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7eUJBQzNCLENBQUMsQ0FBQztvQkFDSixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsT0FBTztvQkFDTixJQUFJLDRDQUFtQztvQkFDdkMsV0FBVztpQkFDWCxDQUFDO1lBQ0gsQ0FBQztZQUVELE9BQU8sRUFBRSxJQUFJLG1DQUEyQixFQUFFLENBQUM7UUFDNUMsQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0ssY0FBYyxDQUFDLE1BQW1CLEVBQUUsT0FBZTtZQUMxRCxJQUFJLGNBQWtDLENBQUM7WUFDdkMsaUVBQWlFO1lBQ2pFLE1BQU0sUUFBUSxHQUFHLCtCQUFzQixDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzlHLElBQUksUUFBUSxZQUFZLFNBQUcsRUFBRSxDQUFDO2dCQUM3QixjQUFjLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxjQUFjLEdBQUcsR0FBRyxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQztZQUN4RixDQUFDO1lBQ0QsT0FBTyxHQUFHLE9BQU8sSUFBSSxNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksY0FBYyxHQUFHLENBQUM7UUFDNUUsQ0FBQztRQUVEOztXQUVHO1FBQ0ssbUJBQW1CO1lBQzFCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO1lBQy9ELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3pELElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLHNEQUFzRDtnQkFDdEQsV0FBVyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNGLENBQUM7UUFFRDs7OztXQUlHO1FBQ0ssb0JBQW9CLENBQUMsT0FBZSxFQUFFLFdBQXdCLEVBQUUsV0FBbUI7WUFDMUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDeEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0Msc0NBQXNDO1lBQ3RDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO29CQUMvQixPQUFPO29CQUNQLEtBQUssRUFBRSxXQUFXO29CQUNsQixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUc7b0JBQ25CLElBQUksMENBQWtDO2lCQUN0QyxDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztnQkFDckUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNLLGFBQWEsQ0FBQyxPQUFlLEVBQUUsV0FBd0IsRUFBRSxXQUFtQjtZQUNuRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFELDhGQUE4RjtZQUM5RixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxTQUFTLENBQUM7WUFDbEUsK0RBQStEO1lBQy9ELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDO1lBQ2xELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPO1lBQ1IsQ0FBQztZQUNELDZDQUE2QztZQUM3QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLGdCQUFnQjtZQUNoQixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFFM0csSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztnQkFDL0IsT0FBTztnQkFDUCxLQUFLLEVBQUUsV0FBVztnQkFDbEIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLElBQUksd0NBQWdDO2FBQ3BDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRDs7OztXQUlHO1FBQ0ssY0FBYyxDQUFDLE9BQWUsRUFBRSxXQUFtQjtZQUMxRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQztZQUNsRCx3REFBd0Q7WUFDeEQsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFDRCw2Q0FBNkM7WUFDN0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFL0MseURBQXlEO1lBQ3pELElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTztZQUNSLENBQUM7WUFFRCxnQkFBZ0I7WUFDaEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVwRCxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO2dCQUMvQixPQUFPO2dCQUNQLEtBQUssRUFBRSxXQUFXO2dCQUNsQixNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDckIsSUFBSSx5Q0FBaUM7YUFDckMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEOzs7O1dBSUc7UUFDSyxxQkFBcUIsQ0FBQyxPQUFlLEVBQUUsV0FBbUI7WUFDakUsbUZBQW1GO1lBQ25GLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQztZQUNsRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDcEMsK0VBQStFO1lBQy9FLFNBQVMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQzFCLGlDQUFpQztZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO2dCQUMvQixPQUFPO2dCQUNQLEtBQUssRUFBRSxXQUFXO2dCQUNsQixNQUFNLEVBQUUsU0FBUztnQkFDakIsSUFBSSwwQ0FBa0M7YUFDdEMsQ0FBQyxDQUFDO1FBRUosQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0ssY0FBYyxDQUFDLE9BQWUsRUFBRSxXQUFtQixFQUFFLE1BQW1CO1lBQy9FLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ25ELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLHFEQUFxRDtZQUNyRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztnQkFDckUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUM7Z0JBQy9CLE9BQU87Z0JBQ1AsS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRztnQkFDbkIsSUFBSSwwQ0FBa0M7YUFDdEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEOzs7OztXQUtHO1FBQ0ssa0JBQWtCLENBQUMsT0FBZSxFQUFFLFdBQW1CLEVBQUUsTUFBbUI7WUFDbkYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxFQUFFLEtBQUssQ0FBQztZQUM3QixNQUFNLEdBQUcsR0FBRyxPQUFPLEVBQUUsR0FBRyxDQUFDO1lBQ3pCLHFEQUFxRDtZQUNyRCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7Z0JBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELDBFQUEwRTtZQUMxRSxHQUFHLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztnQkFDL0IsT0FBTztnQkFDUCxLQUFLLEVBQUUsV0FBVztnQkFDbEIsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsSUFBSSwwQ0FBa0M7YUFDdEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEOzs7OztPQUtFO1FBQ00sc0JBQXNCLENBQUMsT0FBZSxFQUFFLFdBQW1CLEVBQUUsTUFBbUI7WUFDdkYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxFQUFFLEtBQUssQ0FBQztZQUM3QixNQUFNLEdBQUcsR0FBRyxPQUFPLEVBQUUsR0FBRyxDQUFDO1lBQ3pCLHFEQUFxRDtZQUNyRCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7Z0JBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELDBFQUEwRTtZQUMxRSxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDO2dCQUMvQixJQUFJLDBDQUFrQztnQkFDdEMsT0FBTztnQkFDUCxNQUFNLEVBQUUsR0FBRztnQkFDWCxLQUFLLEVBQUUsV0FBVzthQUNsQixDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sYUFBYSxDQUFDLE9BQWUsRUFBRSxXQUFtQixFQUFFLGNBQXNCLEVBQUUsTUFBbUI7WUFDdEcsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDO1lBQ2xELHFEQUFxRDtZQUNyRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsdUNBQXVDO1lBQ3ZDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0MseUJBQXlCO1lBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUM7Z0JBQy9CLElBQUksd0NBQWdDO2dCQUNwQyxPQUFPO2dCQUNQLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixLQUFLLEVBQUUsV0FBVztnQkFDbEIsUUFBUSxFQUFFLGNBQWM7YUFDeEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEOztXQUVHO1FBQ0ssZ0JBQWdCO1lBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM1QixJQUFJLElBQUksR0FBb0IsRUFBRSxDQUFDO1lBQy9CLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0RCxNQUFNLG9CQUFvQixHQUF1QjtvQkFDaEQsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNqQixRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEVBQUU7b0JBQy9ELFVBQVUsRUFBRSxJQUFBLHVDQUFtQixFQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUM7b0JBQ2pFLElBQUksRUFBRSxFQUFFO2lCQUNSLENBQUM7Z0JBQ0YsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUU7b0JBQzdDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDN0QsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZiw4Q0FBOEM7b0JBQzlDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRTt3QkFDOUQsS0FBSzt3QkFDTCxHQUFHO3dCQUNILFdBQVcsRUFBRSxNQUFNO3FCQUNuQixDQUFDLENBQUM7Z0JBQ0osQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsb0JBQW9CLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDakMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELHVDQUF1QztZQUN2QyxJQUFJLENBQUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsc0VBQXNFO1FBQ3RFLG1GQUFtRjtRQUNuRix5QkFBeUI7UUFDekIseUJBQXlCO1FBQ3pCLGdGQUFnRjtRQUNoRixvRkFBb0Y7UUFDcEYsOEVBQThFO1FBQzlFLGdGQUFnRjtRQUNoRixrRkFBa0Y7UUFDbEYsZ0ZBQWdGO1FBQ2hGLGtGQUFrRjtRQUNsRixrRkFBa0Y7UUFDbEYsa0ZBQWtGO1FBQ2xGLGtGQUFrRjtRQUNsRixvRkFBb0Y7UUFDcEYsNkRBQTZEO1FBQzdELEtBQUs7UUFDTCx1QkFBdUI7UUFDdkIsSUFBSTtRQUVKOzs7V0FHRztRQUNLLGdCQUFnQixDQUFDLFdBQWdDO1lBQ3hELE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFDaEMsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztZQUNwQyxRQUFRLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDcEI7b0JBQ0MsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDMUQsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7d0JBQzNCLE1BQU07b0JBQ1AsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU87b0JBQ1IsQ0FBQztnQkFDRjtvQkFDQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ25FLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBQ3BFLE1BQU07b0JBQ1AsQ0FBQztnQkFDRjtvQkFDQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ25FLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUM3RCxNQUFNO29CQUNQLENBQUM7Z0JBQ0Y7b0JBQ0MsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUNyQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBQ2hELE1BQU07b0JBQ1AsQ0FBQztnQkFDRjtvQkFDQyxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ3JDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUN2RCxNQUFNO29CQUNQLENBQUM7Z0JBQ0Y7b0JBQ0MsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUNuRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDOUQsTUFBTTtvQkFDUCxDQUFDO2dCQUNGO29CQUNDLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDbkUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDbEUsTUFBTTtvQkFDUCxDQUFDO2dCQUNGO29CQUNDLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDbkUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDdEUsTUFBTTtvQkFDUCxDQUFDO2dCQUNGO29CQUNDLG1DQUFtQztvQkFDbkMsTUFBTTtnQkFDUDtvQkFDQyxJQUFJLElBQUEseUNBQXNCLEVBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFNBQVMsSUFBSSxLQUFLLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUM1SCxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNuRixNQUFNO29CQUNQLENBQUM7Z0JBQ0Y7b0JBQ0MsdUVBQXVFO29CQUN2RSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQixDQUFDO1FBQ0YsQ0FBQztRQUNELHlDQUF5QztRQUN6QyxRQUFRLENBQUMsS0FBYSxFQUFFLEtBQWEsRUFBRSxVQUE2QixFQUFFLGFBQXVCO1lBQzVGLE1BQU0sT0FBTyxHQUFHLElBQUEsdUNBQW1CLEVBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN2RyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQyxNQUFNLEdBQUcsR0FBRyxPQUFPLEVBQUUsR0FBRyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxLQUFLLHVCQUF1QixDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELElBQUksV0FBcUMsQ0FBQztZQUMxQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUNELCtGQUErRjtZQUMvRixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLFNBQVMsK0JBQXVCLENBQUM7Z0JBQ3JDLDJEQUEyRDtnQkFDM0QsSUFBSSxVQUFVLEtBQUssMEJBQVUsRUFBRSxDQUFDO29CQUMvQixTQUFTLEdBQUcsSUFBQSx1REFBaUMsRUFBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDM0UsQ0FBQztnQkFDRCxXQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzVJLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxXQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUVELG9FQUFvRTtZQUNwRSxJQUFJLEtBQUssR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JELEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUNwQyxDQUFDO1lBQ0Qsa0RBQWtEO1lBQ2xELE1BQU0sV0FBVyxHQUFHLE9BQU8sRUFBRSxXQUFXLENBQUM7WUFDekMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNsQixPQUFPO1lBQ1IsQ0FBQztZQUNELHNDQUFzQztZQUN0QyxXQUFXLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUMzRSxPQUFPO1FBQ1IsQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBZ0IsRUFBRSxhQUF1QjtZQUN4RCxNQUFNLE1BQU0sR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMzRCxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUM1QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxHQUFHLEdBQUcsT0FBTyxFQUFFLEdBQUcsQ0FBQztnQkFDekIsTUFBTSxLQUFLLEdBQUcsT0FBTyxFQUFFLEtBQUssQ0FBQztnQkFDN0IsTUFBTSxTQUFTLEdBQUcsT0FBTyxFQUFFLFdBQVcsQ0FBQztnQkFDdkMsb0JBQW9CO2dCQUNwQixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzlDLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDO1lBQ0QseURBQXlEO1lBQ3pELE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztZQUM5QixLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBQ0Qsb0ZBQW9GO1lBQ3BGLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQWtCLEVBQUUsYUFBdUI7WUFDNUQsTUFBTSxpQkFBaUIsR0FBYyxFQUFFLENBQUM7WUFDeEMsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztvQkFDdEQsOERBQThEO29CQUM5RCxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQ3ZFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzlDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xELENBQUM7S0FFRCxDQUFBO0lBM25CWSxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQURoQyxJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsb0JBQW9CLENBQUM7UUFjcEQsV0FBQSwwQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsOEJBQWMsQ0FBQTtPQWhCSixvQkFBb0IsQ0EybkJoQyJ9