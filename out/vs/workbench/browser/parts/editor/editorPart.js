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
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/workbench/browser/part", "vs/base/browser/dom", "vs/base/common/event", "vs/platform/theme/common/colorRegistry", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/grid/grid", "vs/workbench/common/theme", "vs/base/common/arrays", "vs/workbench/browser/parts/editor/editor", "vs/workbench/browser/parts/editor/editorGroupView", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/common/editor/editorGroupModel", "vs/workbench/browser/parts/editor/editorDropTarget", "vs/base/common/color", "vs/base/browser/ui/centered/centeredViewLayout", "vs/base/common/errors", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/types", "vs/workbench/browser/dnd", "vs/base/common/async", "vs/workbench/services/editor/common/editorGroupFinder", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/common/contextkeys", "vs/base/browser/window"], function (require, exports, themeService_1, part_1, dom_1, event_1, colorRegistry_1, instantiation_1, grid_1, theme_1, arrays_1, editor_1, editorGroupView_1, configuration_1, lifecycle_1, storage_1, editorGroupModel_1, editorDropTarget_1, color_1, centeredViewLayout_1, errors_1, layoutService_1, types_1, dnd_1, async_1, editorGroupFinder_1, editorService_1, host_1, contextkey_1, serviceCollection_1, contextkeys_1, window_1) {
    "use strict";
    var EditorPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainEditorPart = exports.EditorPart = void 0;
    class GridWidgetView {
        constructor() {
            this.element = (0, dom_1.$)('.grid-view-container');
            this._onDidChange = new event_1.Relay();
            this.onDidChange = this._onDidChange.event;
        }
        get minimumWidth() { return this.gridWidget ? this.gridWidget.minimumWidth : 0; }
        get maximumWidth() { return this.gridWidget ? this.gridWidget.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumHeight() { return this.gridWidget ? this.gridWidget.minimumHeight : 0; }
        get maximumHeight() { return this.gridWidget ? this.gridWidget.maximumHeight : Number.POSITIVE_INFINITY; }
        get gridWidget() {
            return this._gridWidget;
        }
        set gridWidget(grid) {
            this.element.innerText = '';
            if (grid) {
                this.element.appendChild(grid.element);
                this._onDidChange.input = grid.onDidChange;
            }
            else {
                this._onDidChange.input = event_1.Event.None;
            }
            this._gridWidget = grid;
        }
        layout(width, height, top, left) {
            this.gridWidget?.layout(width, height, top, left);
        }
        dispose() {
            this._onDidChange.dispose();
        }
    }
    let EditorPart = class EditorPart extends part_1.Part {
        static { EditorPart_1 = this; }
        static { this.EDITOR_PART_UI_STATE_STORAGE_KEY = 'editorpart.state'; }
        static { this.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY = 'editorpart.centeredview'; }
        constructor(editorPartsView, id, groupsLabel, windowId, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService) {
            super(id, { hasTitle: false }, themeService, storageService, layoutService);
            this.editorPartsView = editorPartsView;
            this.groupsLabel = groupsLabel;
            this.windowId = windowId;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.hostService = hostService;
            this.contextKeyService = contextKeyService;
            //#region Events
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidLayout = this._register(new event_1.Emitter());
            this.onDidLayout = this._onDidLayout.event;
            this._onDidChangeActiveGroup = this._register(new event_1.Emitter());
            this.onDidChangeActiveGroup = this._onDidChangeActiveGroup.event;
            this._onDidChangeGroupIndex = this._register(new event_1.Emitter());
            this.onDidChangeGroupIndex = this._onDidChangeGroupIndex.event;
            this._onDidChangeGroupLabel = this._register(new event_1.Emitter());
            this.onDidChangeGroupLabel = this._onDidChangeGroupLabel.event;
            this._onDidChangeGroupLocked = this._register(new event_1.Emitter());
            this.onDidChangeGroupLocked = this._onDidChangeGroupLocked.event;
            this._onDidChangeGroupMaximized = this._register(new event_1.Emitter());
            this.onDidChangeGroupMaximized = this._onDidChangeGroupMaximized.event;
            this._onDidActivateGroup = this._register(new event_1.Emitter());
            this.onDidActivateGroup = this._onDidActivateGroup.event;
            this._onDidAddGroup = this._register(new event_1.Emitter());
            this.onDidAddGroup = this._onDidAddGroup.event;
            this._onDidRemoveGroup = this._register(new event_1.Emitter());
            this.onDidRemoveGroup = this._onDidRemoveGroup.event;
            this._onDidMoveGroup = this._register(new event_1.Emitter());
            this.onDidMoveGroup = this._onDidMoveGroup.event;
            this.onDidSetGridWidget = this._register(new event_1.Emitter());
            this._onDidChangeSizeConstraints = this._register(new event_1.Relay());
            this.onDidChangeSizeConstraints = event_1.Event.any(this.onDidSetGridWidget.event, this._onDidChangeSizeConstraints.event);
            this._onDidScroll = this._register(new event_1.Relay());
            this.onDidScroll = event_1.Event.any(this.onDidSetGridWidget.event, this._onDidScroll.event);
            this._onDidChangeEditorPartOptions = this._register(new event_1.Emitter());
            this.onDidChangeEditorPartOptions = this._onDidChangeEditorPartOptions.event;
            //#endregion
            this.workspaceMemento = this.getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            this.profileMemento = this.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            this.groupViews = new Map();
            this.mostRecentActiveGroups = [];
            this.gridWidgetDisposables = this._register(new lifecycle_1.DisposableStore());
            this.gridWidgetView = this._register(new GridWidgetView());
            this.enforcedPartOptions = [];
            this._partOptions = (0, editor_1.getEditorPartOptions)(this.configurationService, this.themeService);
            this.top = 0;
            this.left = 0;
            this.sideGroup = {
                openEditor: (editor, options) => {
                    const [group] = this.scopedInstantiationService.invokeFunction(accessor => (0, editorGroupFinder_1.findGroup)(accessor, { editor, options }, editorService_1.SIDE_GROUP));
                    return group.openEditor(editor, options);
                }
            };
            this._isReady = false;
            this.whenReadyPromise = new async_1.DeferredPromise();
            this.whenReady = this.whenReadyPromise.p;
            this.whenRestoredPromise = new async_1.DeferredPromise();
            this.whenRestored = this.whenRestoredPromise.p;
            this._willRestoreState = false;
            this.priority = 2 /* LayoutPriority.High */;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            this._register(this.themeService.onDidFileIconThemeChange(() => this.handleChangedPartOptions()));
            this._register(this.onDidChangeMementoValue(1 /* StorageScope.WORKSPACE */, this._store)(e => this.onDidChangeMementoState(e)));
        }
        onConfigurationUpdated(event) {
            if ((0, editor_1.impactsEditorPartOptions)(event)) {
                this.handleChangedPartOptions();
            }
        }
        handleChangedPartOptions() {
            const oldPartOptions = this._partOptions;
            const newPartOptions = (0, editor_1.getEditorPartOptions)(this.configurationService, this.themeService);
            for (const enforcedPartOptions of this.enforcedPartOptions) {
                Object.assign(newPartOptions, enforcedPartOptions); // check for overrides
            }
            this._partOptions = newPartOptions;
            this._onDidChangeEditorPartOptions.fire({ oldPartOptions, newPartOptions });
        }
        get partOptions() { return this._partOptions; }
        enforcePartOptions(options) {
            this.enforcedPartOptions.push(options);
            this.handleChangedPartOptions();
            return (0, lifecycle_1.toDisposable)(() => {
                this.enforcedPartOptions.splice(this.enforcedPartOptions.indexOf(options), 1);
                this.handleChangedPartOptions();
            });
        }
        get contentDimension() { return this._contentDimension; }
        get activeGroup() {
            return this._activeGroup;
        }
        get groups() {
            return Array.from(this.groupViews.values());
        }
        get count() {
            return this.groupViews.size;
        }
        get orientation() {
            return (this.gridWidget && this.gridWidget.orientation === 0 /* Orientation.VERTICAL */) ? 1 /* GroupOrientation.VERTICAL */ : 0 /* GroupOrientation.HORIZONTAL */;
        }
        get isReady() { return this._isReady; }
        get hasRestorableState() {
            return !!this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY];
        }
        get willRestoreState() { return this._willRestoreState; }
        getGroups(order = 0 /* GroupsOrder.CREATION_TIME */) {
            switch (order) {
                case 0 /* GroupsOrder.CREATION_TIME */:
                    return this.groups;
                case 1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */: {
                    const mostRecentActive = (0, arrays_1.coalesce)(this.mostRecentActiveGroups.map(groupId => this.getGroup(groupId)));
                    // there can be groups that got never active, even though they exist. in this case
                    // make sure to just append them at the end so that all groups are returned properly
                    return (0, arrays_1.distinct)([...mostRecentActive, ...this.groups]);
                }
                case 2 /* GroupsOrder.GRID_APPEARANCE */: {
                    const views = [];
                    if (this.gridWidget) {
                        this.fillGridNodes(views, this.gridWidget.getViews());
                    }
                    return views;
                }
            }
        }
        fillGridNodes(target, node) {
            if ((0, grid_1.isGridBranchNode)(node)) {
                node.children.forEach(child => this.fillGridNodes(target, child));
            }
            else {
                target.push(node.view);
            }
        }
        hasGroup(identifier) {
            return this.groupViews.has(identifier);
        }
        getGroup(identifier) {
            return this.groupViews.get(identifier);
        }
        findGroup(scope, source = this.activeGroup, wrap) {
            // by direction
            if (typeof scope.direction === 'number') {
                return this.doFindGroupByDirection(scope.direction, source, wrap);
            }
            // by location
            if (typeof scope.location === 'number') {
                return this.doFindGroupByLocation(scope.location, source, wrap);
            }
            throw new Error('invalid arguments');
        }
        doFindGroupByDirection(direction, source, wrap) {
            const sourceGroupView = this.assertGroupView(source);
            // Find neighbours and sort by our MRU list
            const neighbours = this.gridWidget.getNeighborViews(sourceGroupView, this.toGridViewDirection(direction), wrap);
            neighbours.sort(((n1, n2) => this.mostRecentActiveGroups.indexOf(n1.id) - this.mostRecentActiveGroups.indexOf(n2.id)));
            return neighbours[0];
        }
        doFindGroupByLocation(location, source, wrap) {
            const sourceGroupView = this.assertGroupView(source);
            const groups = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            const index = groups.indexOf(sourceGroupView);
            switch (location) {
                case 0 /* GroupLocation.FIRST */:
                    return groups[0];
                case 1 /* GroupLocation.LAST */:
                    return groups[groups.length - 1];
                case 2 /* GroupLocation.NEXT */: {
                    let nextGroup = groups[index + 1];
                    if (!nextGroup && wrap) {
                        nextGroup = this.doFindGroupByLocation(0 /* GroupLocation.FIRST */, source);
                    }
                    return nextGroup;
                }
                case 3 /* GroupLocation.PREVIOUS */: {
                    let previousGroup = groups[index - 1];
                    if (!previousGroup && wrap) {
                        previousGroup = this.doFindGroupByLocation(1 /* GroupLocation.LAST */, source);
                    }
                    return previousGroup;
                }
            }
        }
        activateGroup(group, preserveWindowOrder) {
            const groupView = this.assertGroupView(group);
            this.doSetGroupActive(groupView);
            // Ensure window on top unless disabled
            if (!preserveWindowOrder) {
                this.hostService.moveTop((0, dom_1.getWindow)(this.element));
            }
            return groupView;
        }
        restoreGroup(group) {
            const groupView = this.assertGroupView(group);
            this.doRestoreGroup(groupView);
            return groupView;
        }
        getSize(group) {
            const groupView = this.assertGroupView(group);
            return this.gridWidget.getViewSize(groupView);
        }
        setSize(group, size) {
            const groupView = this.assertGroupView(group);
            this.gridWidget.resizeView(groupView, size);
        }
        arrangeGroups(arrangement, target = this.activeGroup) {
            if (this.count < 2) {
                return; // require at least 2 groups to show
            }
            if (!this.gridWidget) {
                return; // we have not been created yet
            }
            const groupView = this.assertGroupView(target);
            switch (arrangement) {
                case 2 /* GroupsArrangement.EVEN */:
                    this.gridWidget.distributeViewSizes();
                    break;
                case 0 /* GroupsArrangement.MAXIMIZE */:
                    if (this.groups.length < 2) {
                        return; // need at least 2 groups to be maximized
                    }
                    this.gridWidget.maximizeView(groupView);
                    groupView.focus();
                    break;
                case 1 /* GroupsArrangement.EXPAND */:
                    this.gridWidget.expandView(groupView);
                    break;
            }
        }
        toggleMaximizeGroup(target = this.activeGroup) {
            if (this.hasMaximizedGroup()) {
                this.unmaximizeGroup();
            }
            else {
                this.arrangeGroups(0 /* GroupsArrangement.MAXIMIZE */, target);
            }
        }
        toggleExpandGroup(target = this.activeGroup) {
            if (this.isGroupExpanded(this.activeGroup)) {
                this.arrangeGroups(2 /* GroupsArrangement.EVEN */);
            }
            else {
                this.arrangeGroups(1 /* GroupsArrangement.EXPAND */, target);
            }
        }
        unmaximizeGroup() {
            this.gridWidget.exitMaximizedView();
            this._activeGroup.focus(); // When making views visible the focus can be affected, so restore it
        }
        hasMaximizedGroup() {
            return this.gridWidget.hasMaximizedView();
        }
        isGroupMaximized(targetGroup) {
            return this.gridWidget.isViewMaximized(targetGroup);
        }
        isGroupExpanded(targetGroup) {
            return this.gridWidget.isViewExpanded(targetGroup);
        }
        setGroupOrientation(orientation) {
            if (!this.gridWidget) {
                return; // we have not been created yet
            }
            const newOrientation = (orientation === 0 /* GroupOrientation.HORIZONTAL */) ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
            if (this.gridWidget.orientation !== newOrientation) {
                this.gridWidget.orientation = newOrientation;
            }
        }
        applyLayout(layout) {
            const restoreFocus = this.shouldRestoreFocus(this.container);
            // Determine how many groups we need overall
            let layoutGroupsCount = 0;
            function countGroups(groups) {
                for (const group of groups) {
                    if (Array.isArray(group.groups)) {
                        countGroups(group.groups);
                    }
                    else {
                        layoutGroupsCount++;
                    }
                }
            }
            countGroups(layout.groups);
            // If we currently have too many groups, merge them into the last one
            let currentGroupViews = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            if (layoutGroupsCount < currentGroupViews.length) {
                const lastGroupInLayout = currentGroupViews[layoutGroupsCount - 1];
                currentGroupViews.forEach((group, index) => {
                    if (index >= layoutGroupsCount) {
                        this.mergeGroup(group, lastGroupInLayout);
                    }
                });
                currentGroupViews = this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            }
            const activeGroup = this.activeGroup;
            // Prepare grid descriptor to create new grid from
            const gridDescriptor = (0, grid_1.createSerializedGrid)({
                orientation: this.toGridViewOrientation(layout.orientation, this.isTwoDimensionalGrid() ?
                    this.gridWidget.orientation : // preserve original orientation for 2-dimensional grids
                    (0, grid_1.orthogonal)(this.gridWidget.orientation) // otherwise flip (fix https://github.com/microsoft/vscode/issues/52975)
                ),
                groups: layout.groups
            });
            // Recreate gridwidget with descriptor
            this.doApplyGridState(gridDescriptor, activeGroup.id, currentGroupViews);
            // Restore focus as needed
            if (restoreFocus) {
                this._activeGroup.focus();
            }
        }
        getLayout() {
            // Example return value:
            // { orientation: 0, groups: [ { groups: [ { size: 0.4 }, { size: 0.6 } ], size: 0.5 }, { groups: [ {}, {} ], size: 0.5 } ] }
            const serializedGrid = this.gridWidget.serialize();
            const orientation = serializedGrid.orientation === 1 /* Orientation.HORIZONTAL */ ? 0 /* GroupOrientation.HORIZONTAL */ : 1 /* GroupOrientation.VERTICAL */;
            const root = this.serializedNodeToGroupLayoutArgument(serializedGrid.root);
            return {
                orientation,
                groups: root.groups
            };
        }
        serializedNodeToGroupLayoutArgument(serializedNode) {
            if (serializedNode.type === 'branch') {
                return {
                    size: serializedNode.size,
                    groups: serializedNode.data.map(node => this.serializedNodeToGroupLayoutArgument(node))
                };
            }
            return { size: serializedNode.size };
        }
        shouldRestoreFocus(target) {
            if (!target) {
                return false;
            }
            const activeElement = (0, dom_1.getActiveElement)();
            if (activeElement === target.ownerDocument.body) {
                return true; // always restore focus if nothing is focused currently
            }
            // otherwise check for the active element being an ancestor of the target
            return (0, dom_1.isAncestorOfActiveElement)(target);
        }
        isTwoDimensionalGrid() {
            const views = this.gridWidget.getViews();
            if ((0, grid_1.isGridBranchNode)(views)) {
                // the grid is 2-dimensional if any children
                // of the grid is a branch node
                return views.children.some(child => (0, grid_1.isGridBranchNode)(child));
            }
            return false;
        }
        addGroup(location, direction, groupToCopy) {
            const locationView = this.assertGroupView(location);
            let newGroupView;
            // Same groups view: add to grid widget directly
            if (locationView.groupsView === this) {
                const restoreFocus = this.shouldRestoreFocus(locationView.element);
                const shouldExpand = this.groupViews.size > 1 && this.isGroupExpanded(locationView);
                newGroupView = this.doCreateGroupView(groupToCopy);
                // Add to grid widget
                this.gridWidget.addView(newGroupView, this.getSplitSizingStyle(), locationView, this.toGridViewDirection(direction));
                // Update container
                this.updateContainer();
                // Event
                this._onDidAddGroup.fire(newGroupView);
                // Notify group index change given a new group was added
                this.notifyGroupIndexChange();
                // Expand new group, if the reference view was previously expanded
                if (shouldExpand) {
                    this.arrangeGroups(1 /* GroupsArrangement.EXPAND */, newGroupView);
                }
                // Restore focus if we had it previously after completing the grid
                // operation. That operation might cause reparenting of grid views
                // which moves focus to the <body> element otherwise.
                if (restoreFocus) {
                    locationView.focus();
                }
            }
            // Different group view: add to grid widget of that group
            else {
                newGroupView = locationView.groupsView.addGroup(locationView, direction, groupToCopy);
            }
            return newGroupView;
        }
        getSplitSizingStyle() {
            switch (this._partOptions.splitSizing) {
                case 'distribute':
                    return grid_1.Sizing.Distribute;
                case 'split':
                    return grid_1.Sizing.Split;
                default:
                    return grid_1.Sizing.Auto;
            }
        }
        doCreateGroupView(from) {
            // Create group view
            let groupView;
            if (from instanceof editorGroupView_1.EditorGroupView) {
                groupView = editorGroupView_1.EditorGroupView.createCopy(from, this.editorPartsView, this, this.groupsLabel, this.count, this.scopedInstantiationService);
            }
            else if ((0, editorGroupModel_1.isSerializedEditorGroupModel)(from)) {
                groupView = editorGroupView_1.EditorGroupView.createFromSerialized(from, this.editorPartsView, this, this.groupsLabel, this.count, this.scopedInstantiationService);
            }
            else {
                groupView = editorGroupView_1.EditorGroupView.createNew(this.editorPartsView, this, this.groupsLabel, this.count, this.scopedInstantiationService);
            }
            // Keep in map
            this.groupViews.set(groupView.id, groupView);
            // Track focus
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(groupView.onDidFocus(() => {
                this.doSetGroupActive(groupView);
                this._onDidFocus.fire();
            }));
            // Track group changes
            groupDisposables.add(groupView.onDidModelChange(e => {
                switch (e.kind) {
                    case 3 /* GroupModelChangeKind.GROUP_LOCKED */:
                        this._onDidChangeGroupLocked.fire(groupView);
                        break;
                    case 1 /* GroupModelChangeKind.GROUP_INDEX */:
                        this._onDidChangeGroupIndex.fire(groupView);
                        break;
                    case 2 /* GroupModelChangeKind.GROUP_LABEL */:
                        this._onDidChangeGroupLabel.fire(groupView);
                        break;
                }
            }));
            // Track active editor change after it occurred
            groupDisposables.add(groupView.onDidActiveEditorChange(() => {
                this.updateContainer();
            }));
            // Track dispose
            event_1.Event.once(groupView.onWillDispose)(() => {
                (0, lifecycle_1.dispose)(groupDisposables);
                this.groupViews.delete(groupView.id);
                this.doUpdateMostRecentActive(groupView);
            });
            return groupView;
        }
        doSetGroupActive(group) {
            if (this._activeGroup !== group) {
                const previousActiveGroup = this._activeGroup;
                this._activeGroup = group;
                // Update list of most recently active groups
                this.doUpdateMostRecentActive(group, true);
                // Mark previous one as inactive
                if (previousActiveGroup && !previousActiveGroup.disposed) {
                    previousActiveGroup.setActive(false);
                }
                // Mark group as new active
                group.setActive(true);
                // Expand the group if it is currently minimized
                this.doRestoreGroup(group);
                // Event
                this._onDidChangeActiveGroup.fire(group);
            }
            // Always fire the event that a group has been activated
            // even if its the same group that is already active to
            // signal the intent even when nothing has changed.
            this._onDidActivateGroup.fire(group);
        }
        doRestoreGroup(group) {
            if (!this.gridWidget) {
                return; // method is called as part of state restore very early
            }
            if (this.hasMaximizedGroup() && !this.isGroupMaximized(group)) {
                this.unmaximizeGroup();
            }
            try {
                const viewSize = this.gridWidget.getViewSize(group);
                if (viewSize.width === group.minimumWidth || viewSize.height === group.minimumHeight) {
                    this.arrangeGroups(1 /* GroupsArrangement.EXPAND */, group);
                }
            }
            catch (error) {
                // ignore: method might be called too early before view is known to grid
            }
        }
        doUpdateMostRecentActive(group, makeMostRecentlyActive) {
            const index = this.mostRecentActiveGroups.indexOf(group.id);
            // Remove from MRU list
            if (index !== -1) {
                this.mostRecentActiveGroups.splice(index, 1);
            }
            // Add to front as needed
            if (makeMostRecentlyActive) {
                this.mostRecentActiveGroups.unshift(group.id);
            }
        }
        toGridViewDirection(direction) {
            switch (direction) {
                case 0 /* GroupDirection.UP */: return 0 /* Direction.Up */;
                case 1 /* GroupDirection.DOWN */: return 1 /* Direction.Down */;
                case 2 /* GroupDirection.LEFT */: return 2 /* Direction.Left */;
                case 3 /* GroupDirection.RIGHT */: return 3 /* Direction.Right */;
            }
        }
        toGridViewOrientation(orientation, fallback) {
            if (typeof orientation === 'number') {
                return orientation === 0 /* GroupOrientation.HORIZONTAL */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
            }
            return fallback;
        }
        removeGroup(group, preserveFocus) {
            const groupView = this.assertGroupView(group);
            if (this.count === 1) {
                return; // Cannot remove the last root group
            }
            // Remove empty group
            if (groupView.isEmpty) {
                this.doRemoveEmptyGroup(groupView, preserveFocus);
            }
            // Remove group with editors
            else {
                this.doRemoveGroupWithEditors(groupView);
            }
        }
        doRemoveGroupWithEditors(groupView) {
            const mostRecentlyActiveGroups = this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
            let lastActiveGroup;
            if (this._activeGroup === groupView) {
                lastActiveGroup = mostRecentlyActiveGroups[1];
            }
            else {
                lastActiveGroup = mostRecentlyActiveGroups[0];
            }
            // Removing a group with editors should merge these editors into the
            // last active group and then remove this group.
            this.mergeGroup(groupView, lastActiveGroup);
        }
        doRemoveEmptyGroup(groupView, preserveFocus) {
            const restoreFocus = !preserveFocus && this.shouldRestoreFocus(this.container);
            // Activate next group if the removed one was active
            if (this._activeGroup === groupView) {
                const mostRecentlyActiveGroups = this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
                const nextActiveGroup = mostRecentlyActiveGroups[1]; // [0] will be the current group we are about to dispose
                this.doSetGroupActive(nextActiveGroup);
            }
            // Remove from grid widget & dispose
            this.gridWidget.removeView(groupView, this.getSplitSizingStyle());
            groupView.dispose();
            // Restore focus if we had it previously after completing the grid
            // operation. That operation might cause reparenting of grid views
            // which moves focus to the <body> element otherwise.
            if (restoreFocus) {
                this._activeGroup.focus();
            }
            // Notify group index change given a group was removed
            this.notifyGroupIndexChange();
            // Update container
            this.updateContainer();
            // Event
            this._onDidRemoveGroup.fire(groupView);
        }
        moveGroup(group, location, direction) {
            const sourceView = this.assertGroupView(group);
            const targetView = this.assertGroupView(location);
            if (sourceView.id === targetView.id) {
                throw new Error('Cannot move group into its own');
            }
            const restoreFocus = this.shouldRestoreFocus(sourceView.element);
            let movedView;
            // Same groups view: move via grid widget API
            if (sourceView.groupsView === targetView.groupsView) {
                this.gridWidget.moveView(sourceView, this.getSplitSizingStyle(), targetView, this.toGridViewDirection(direction));
                movedView = sourceView;
            }
            // Different groups view: move via groups view API
            else {
                movedView = targetView.groupsView.addGroup(targetView, direction, sourceView);
                sourceView.closeAllEditors();
                this.removeGroup(sourceView, restoreFocus);
            }
            // Restore focus if we had it previously after completing the grid
            // operation. That operation might cause reparenting of grid views
            // which moves focus to the <body> element otherwise.
            if (restoreFocus) {
                movedView.focus();
            }
            // Event
            this._onDidMoveGroup.fire(movedView);
            // Notify group index change given a group was moved
            this.notifyGroupIndexChange();
            return movedView;
        }
        copyGroup(group, location, direction) {
            const groupView = this.assertGroupView(group);
            const locationView = this.assertGroupView(location);
            const restoreFocus = this.shouldRestoreFocus(groupView.element);
            // Copy the group view
            const copiedGroupView = this.addGroup(locationView, direction, groupView);
            // Restore focus if we had it
            if (restoreFocus) {
                copiedGroupView.focus();
            }
            return copiedGroupView;
        }
        mergeGroup(group, target, options) {
            const sourceView = this.assertGroupView(group);
            const targetView = this.assertGroupView(target);
            // Collect editors to move/copy
            const editors = [];
            let index = (options && typeof options.index === 'number') ? options.index : targetView.count;
            for (const editor of sourceView.editors) {
                const inactive = !sourceView.isActive(editor) || this._activeGroup !== sourceView;
                const sticky = sourceView.isSticky(editor);
                const options = { index: !sticky ? index : undefined /* do not set index to preserve sticky flag */, inactive, preserveFocus: inactive };
                editors.push({ editor, options });
                index++;
            }
            // Move/Copy editors over into target
            if (options?.mode === 0 /* MergeGroupMode.COPY_EDITORS */) {
                sourceView.copyEditors(editors, targetView);
            }
            else {
                sourceView.moveEditors(editors, targetView);
            }
            // Remove source if the view is now empty and not already removed
            if (sourceView.isEmpty && !sourceView.disposed /* could have been disposed already via workbench.editor.closeEmptyGroups setting */) {
                this.removeGroup(sourceView, true);
            }
            return targetView;
        }
        mergeAllGroups(target) {
            const targetView = this.assertGroupView(target);
            for (const group of this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (group === targetView) {
                    continue; // keep target
                }
                this.mergeGroup(group, targetView);
            }
            return targetView;
        }
        assertGroupView(group) {
            let groupView;
            if (typeof group === 'number') {
                groupView = this.editorPartsView.getGroup(group);
            }
            else {
                groupView = group;
            }
            if (!groupView) {
                throw new Error('Invalid editor group provided!');
            }
            return groupView;
        }
        createEditorDropTarget(container, delegate) {
            (0, types_1.assertType)(container instanceof HTMLElement);
            return this.scopedInstantiationService.createInstance(editorDropTarget_1.EditorDropTarget, container, delegate);
        }
        //#region Part
        // TODO @sbatten @joao find something better to prevent editor taking over #79897
        get minimumWidth() { return Math.min(this.centeredLayoutWidget.minimumWidth, this.layoutService.getMaximumEditorDimensions(this.layoutService.getContainer((0, dom_1.getWindow)(this.container))).width); }
        get maximumWidth() { return this.centeredLayoutWidget.maximumWidth; }
        get minimumHeight() { return Math.min(this.centeredLayoutWidget.minimumHeight, this.layoutService.getMaximumEditorDimensions(this.layoutService.getContainer((0, dom_1.getWindow)(this.container))).height); }
        get maximumHeight() { return this.centeredLayoutWidget.maximumHeight; }
        get snap() { return this.layoutService.getPanelAlignment() === 'center'; }
        get onDidChange() { return event_1.Event.any(this.centeredLayoutWidget.onDidChange, this.onDidSetGridWidget.event); }
        get gridSeparatorBorder() {
            return this.theme.getColor(theme_1.EDITOR_GROUP_BORDER) || this.theme.getColor(colorRegistry_1.contrastBorder) || color_1.Color.transparent;
        }
        updateStyles() {
            const container = (0, types_1.assertIsDefined)(this.container);
            container.style.backgroundColor = this.getColor(colorRegistry_1.editorBackground) || '';
            const separatorBorderStyle = { separatorBorder: this.gridSeparatorBorder, background: this.theme.getColor(theme_1.EDITOR_PANE_BACKGROUND) || color_1.Color.transparent };
            this.gridWidget.style(separatorBorderStyle);
            this.centeredLayoutWidget.styles(separatorBorderStyle);
        }
        createContentArea(parent, options) {
            // Container
            this.element = parent;
            this.container = document.createElement('div');
            this.container.classList.add('content');
            if (this.windowId !== window_1.mainWindow.vscodeWindowId) {
                this.container.classList.add('auxiliary');
            }
            parent.appendChild(this.container);
            // Scoped instantiation service
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped(this.container));
            this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            // Grid control
            this._willRestoreState = !options || options.restorePreviousState;
            this.doCreateGridControl();
            // Centered layout widget
            this.centeredLayoutWidget = this._register(new centeredViewLayout_1.CenteredViewLayout(this.container, this.gridWidgetView, this.profileMemento[EditorPart_1.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY], this._partOptions.centeredLayoutFixedWidth));
            this._register(this.onDidChangeEditorPartOptions(e => this.centeredLayoutWidget.setFixedWidth(e.newPartOptions.centeredLayoutFixedWidth ?? false)));
            // Drag & Drop support
            this.setupDragAndDropSupport(parent, this.container);
            // Context keys
            this.handleContextKeys(scopedContextKeyService);
            // Signal ready
            this.whenReadyPromise.complete();
            this._isReady = true;
            // Signal restored
            async_1.Promises.settled(this.groups.map(group => group.whenRestored)).finally(() => {
                this.whenRestoredPromise.complete();
            });
            return this.container;
        }
        handleContextKeys(contextKeyService) {
            const isAuxiliaryEditorPartContext = contextkeys_1.IsAuxiliaryEditorPartContext.bindTo(contextKeyService);
            isAuxiliaryEditorPartContext.set(this.windowId !== window_1.mainWindow.vscodeWindowId);
            const multipleEditorGroupsContext = contextkeys_1.EditorPartMultipleEditorGroupsContext.bindTo(contextKeyService);
            const maximizedEditorGroupContext = contextkeys_1.EditorPartMaximizedEditorGroupContext.bindTo(contextKeyService);
            const updateContextKeys = () => {
                const groupCount = this.count;
                if (groupCount > 1) {
                    multipleEditorGroupsContext.set(true);
                }
                else {
                    multipleEditorGroupsContext.reset();
                }
                if (this.hasMaximizedGroup()) {
                    maximizedEditorGroupContext.set(true);
                }
                else {
                    maximizedEditorGroupContext.reset();
                }
            };
            updateContextKeys();
            this._register(this.onDidAddGroup(() => updateContextKeys()));
            this._register(this.onDidRemoveGroup(() => updateContextKeys()));
            this._register(this.onDidChangeGroupMaximized(() => updateContextKeys()));
        }
        setupDragAndDropSupport(parent, container) {
            // Editor drop target
            this._register(this.createEditorDropTarget(container, Object.create(null)));
            // No drop in the editor
            const overlay = document.createElement('div');
            overlay.classList.add('drop-block-overlay');
            parent.appendChild(overlay);
            // Hide the block if a mouse down event occurs #99065
            this._register((0, dom_1.addDisposableGenericMouseDownListener)(overlay, () => overlay.classList.remove('visible')));
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(this.element, {
                onDragStart: e => overlay.classList.add('visible'),
                onDragEnd: e => overlay.classList.remove('visible')
            }));
            let horizontalOpenerTimeout;
            let verticalOpenerTimeout;
            let lastOpenHorizontalPosition;
            let lastOpenVerticalPosition;
            const openPartAtPosition = (position) => {
                if (!this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) && position === this.layoutService.getPanelPosition()) {
                    this.layoutService.setPartHidden(false, "workbench.parts.panel" /* Parts.PANEL_PART */);
                }
                else if (!this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) && position === (this.layoutService.getSideBarPosition() === 1 /* Position.RIGHT */ ? 0 /* Position.LEFT */ : 1 /* Position.RIGHT */)) {
                    this.layoutService.setPartHidden(false, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                }
            };
            const clearAllTimeouts = () => {
                if (horizontalOpenerTimeout) {
                    clearTimeout(horizontalOpenerTimeout);
                    horizontalOpenerTimeout = undefined;
                }
                if (verticalOpenerTimeout) {
                    clearTimeout(verticalOpenerTimeout);
                    verticalOpenerTimeout = undefined;
                }
            };
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(overlay, {
                onDragOver: e => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    if (e.eventData.dataTransfer) {
                        e.eventData.dataTransfer.dropEffect = 'none';
                    }
                    const boundingRect = overlay.getBoundingClientRect();
                    let openHorizontalPosition = undefined;
                    let openVerticalPosition = undefined;
                    const proximity = 100;
                    if (e.eventData.clientX < boundingRect.left + proximity) {
                        openHorizontalPosition = 0 /* Position.LEFT */;
                    }
                    if (e.eventData.clientX > boundingRect.right - proximity) {
                        openHorizontalPosition = 1 /* Position.RIGHT */;
                    }
                    if (e.eventData.clientY > boundingRect.bottom - proximity) {
                        openVerticalPosition = 2 /* Position.BOTTOM */;
                    }
                    if (horizontalOpenerTimeout && openHorizontalPosition !== lastOpenHorizontalPosition) {
                        clearTimeout(horizontalOpenerTimeout);
                        horizontalOpenerTimeout = undefined;
                    }
                    if (verticalOpenerTimeout && openVerticalPosition !== lastOpenVerticalPosition) {
                        clearTimeout(verticalOpenerTimeout);
                        verticalOpenerTimeout = undefined;
                    }
                    if (!horizontalOpenerTimeout && openHorizontalPosition !== undefined) {
                        lastOpenHorizontalPosition = openHorizontalPosition;
                        horizontalOpenerTimeout = setTimeout(() => openPartAtPosition(openHorizontalPosition), 200);
                    }
                    if (!verticalOpenerTimeout && openVerticalPosition !== undefined) {
                        lastOpenVerticalPosition = openVerticalPosition;
                        verticalOpenerTimeout = setTimeout(() => openPartAtPosition(openVerticalPosition), 200);
                    }
                },
                onDragLeave: () => clearAllTimeouts(),
                onDragEnd: () => clearAllTimeouts(),
                onDrop: () => clearAllTimeouts()
            }));
        }
        centerLayout(active) {
            this.centeredLayoutWidget.activate(active);
            this._activeGroup.focus();
        }
        isLayoutCentered() {
            if (this.centeredLayoutWidget) {
                return this.centeredLayoutWidget.isActive();
            }
            return false;
        }
        doCreateGridControl() {
            // Grid Widget (with previous UI state)
            let restoreError = false;
            if (this._willRestoreState) {
                restoreError = !this.doCreateGridControlWithPreviousState();
            }
            // Grid Widget (no previous UI state or failed to restore)
            if (!this.gridWidget || restoreError) {
                const initialGroup = this.doCreateGroupView();
                this.doSetGridWidget(new grid_1.SerializableGrid(initialGroup));
                // Ensure a group is active
                this.doSetGroupActive(initialGroup);
            }
            // Update container
            this.updateContainer();
            // Notify group index change we created the entire grid
            this.notifyGroupIndexChange();
        }
        doCreateGridControlWithPreviousState() {
            const state = this.loadState();
            if (state?.serializedGrid) {
                try {
                    // MRU
                    this.mostRecentActiveGroups = state.mostRecentActiveGroups;
                    // Grid Widget
                    this.doCreateGridControlWithState(state.serializedGrid, state.activeGroup);
                }
                catch (error) {
                    // Log error
                    (0, errors_1.onUnexpectedError)(new Error(`Error restoring editor grid widget: ${error} (with state: ${JSON.stringify(state)})`));
                    // Clear any state we have from the failing restore
                    this.disposeGroups();
                    return false; // failure
                }
            }
            return true; // success
        }
        doCreateGridControlWithState(serializedGrid, activeGroupId, editorGroupViewsToReuse) {
            // Determine group views to reuse if any
            let reuseGroupViews;
            if (editorGroupViewsToReuse) {
                reuseGroupViews = editorGroupViewsToReuse.slice(0); // do not modify original array
            }
            else {
                reuseGroupViews = [];
            }
            // Create new
            const groupViews = [];
            const gridWidget = grid_1.SerializableGrid.deserialize(serializedGrid, {
                fromJSON: (serializedEditorGroup) => {
                    let groupView;
                    if (reuseGroupViews.length > 0) {
                        groupView = reuseGroupViews.shift();
                    }
                    else {
                        groupView = this.doCreateGroupView(serializedEditorGroup);
                    }
                    groupViews.push(groupView);
                    if (groupView.id === activeGroupId) {
                        this.doSetGroupActive(groupView);
                    }
                    return groupView;
                }
            }, { styles: { separatorBorder: this.gridSeparatorBorder } });
            // If the active group was not found when restoring the grid
            // make sure to make at least one group active. We always need
            // an active group.
            if (!this._activeGroup) {
                this.doSetGroupActive(groupViews[0]);
            }
            // Validate MRU group views matches grid widget state
            if (this.mostRecentActiveGroups.some(groupId => !this.getGroup(groupId))) {
                this.mostRecentActiveGroups = groupViews.map(group => group.id);
            }
            // Set it
            this.doSetGridWidget(gridWidget);
        }
        doSetGridWidget(gridWidget) {
            let boundarySashes = {};
            if (this.gridWidget) {
                boundarySashes = this.gridWidget.boundarySashes;
                this.gridWidget.dispose();
            }
            this.gridWidget = gridWidget;
            this.gridWidget.boundarySashes = boundarySashes;
            this.gridWidgetView.gridWidget = gridWidget;
            this._onDidChangeSizeConstraints.input = gridWidget.onDidChange;
            this._onDidScroll.input = gridWidget.onDidScroll;
            this.gridWidgetDisposables.clear();
            this.gridWidgetDisposables.add(gridWidget.onDidChangeViewMaximized(maximized => this._onDidChangeGroupMaximized.fire(maximized)));
            this._onDidChangeGroupMaximized.fire(this.hasMaximizedGroup());
            this.onDidSetGridWidget.fire(undefined);
        }
        updateContainer() {
            const container = (0, types_1.assertIsDefined)(this.container);
            container.classList.toggle('empty', this.isEmpty);
        }
        notifyGroupIndexChange() {
            this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).forEach((group, index) => group.notifyIndexChanged(index));
        }
        notifyGroupsLabelChange(newLabel) {
            for (const group of this.groups) {
                group.notifyLabelChanged(newLabel);
            }
        }
        get isEmpty() {
            return this.count === 1 && this._activeGroup.isEmpty;
        }
        setBoundarySashes(sashes) {
            this.gridWidget.boundarySashes = sashes;
            this.centeredLayoutWidget.boundarySashes = sashes;
        }
        layout(width, height, top, left) {
            this.top = top;
            this.left = left;
            // Layout contents
            const contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout editor container
            this.doLayout(dom_1.Dimension.lift(contentAreaSize), top, left);
        }
        doLayout(dimension, top = this.top, left = this.left) {
            this._contentDimension = dimension;
            // Layout Grid
            this.centeredLayoutWidget.layout(this._contentDimension.width, this._contentDimension.height, top, left);
            // Event
            this._onDidLayout.fire(dimension);
        }
        saveState() {
            // Persist grid UI state
            if (this.gridWidget) {
                if (this.isEmpty) {
                    delete this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY];
                }
                else {
                    this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY] = this.createState();
                }
            }
            // Persist centered view state
            if (this.centeredLayoutWidget) {
                const centeredLayoutState = this.centeredLayoutWidget.state;
                if (this.centeredLayoutWidget.isDefault(centeredLayoutState)) {
                    delete this.profileMemento[EditorPart_1.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY];
                }
                else {
                    this.profileMemento[EditorPart_1.EDITOR_PART_CENTERED_VIEW_STORAGE_KEY] = centeredLayoutState;
                }
            }
            super.saveState();
        }
        loadState() {
            return this.workspaceMemento[EditorPart_1.EDITOR_PART_UI_STATE_STORAGE_KEY];
        }
        createState() {
            return {
                serializedGrid: this.gridWidget.serialize(),
                activeGroup: this._activeGroup.id,
                mostRecentActiveGroups: this.mostRecentActiveGroups
            };
        }
        async applyState(state) {
            // Close all opened editors and dispose groups
            for (const group of this.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                const closed = await group.closeAllEditors();
                if (!closed) {
                    return false;
                }
            }
            this.disposeGroups();
            // MRU
            this.mostRecentActiveGroups = state.mostRecentActiveGroups;
            // Grid Widget
            this.doApplyGridState(state.serializedGrid, state.activeGroup);
            return true;
        }
        doApplyGridState(gridState, activeGroupId, editorGroupViewsToReuse) {
            // Recreate grid widget from state
            this.doCreateGridControlWithState(gridState, activeGroupId, editorGroupViewsToReuse);
            // Layout
            this.doLayout(this._contentDimension);
            // Update container
            this.updateContainer();
            // Events for groups that got added
            for (const groupView of this.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)) {
                if (!editorGroupViewsToReuse?.includes(groupView)) {
                    this._onDidAddGroup.fire(groupView);
                }
            }
            // Notify group index change given layout has changed
            this.notifyGroupIndexChange();
        }
        onDidChangeMementoState(e) {
            if (e.external && e.scope === 1 /* StorageScope.WORKSPACE */) {
                this.reloadMemento(e.scope);
                const state = this.loadState();
                if (state) {
                    this.applyState(state);
                }
            }
        }
        toJSON() {
            return {
                type: "workbench.parts.editor" /* Parts.EDITOR_PART */
            };
        }
        disposeGroups() {
            for (const group of this.groups) {
                group.dispose();
                this._onDidRemoveGroup.fire(group);
            }
            this.groupViews.clear();
            this.mostRecentActiveGroups = [];
        }
        dispose() {
            // Forward to all groups
            this.disposeGroups();
            // Grid widget
            this.gridWidget?.dispose();
            super.dispose();
        }
    };
    exports.EditorPart = EditorPart;
    exports.EditorPart = EditorPart = EditorPart_1 = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, storage_1.IStorageService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, host_1.IHostService),
        __param(10, contextkey_1.IContextKeyService)
    ], EditorPart);
    let MainEditorPart = class MainEditorPart extends EditorPart {
        constructor(editorPartsView, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService) {
            super(editorPartsView, "workbench.parts.editor" /* Parts.EDITOR_PART */, '', window_1.mainWindow.vscodeWindowId, instantiationService, themeService, configurationService, storageService, layoutService, hostService, contextKeyService);
        }
    };
    exports.MainEditorPart = MainEditorPart;
    exports.MainEditorPart = MainEditorPart = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, host_1.IHostService),
        __param(7, contextkey_1.IContextKeyService)
    ], MainEditorPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvclBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBDaEcsTUFBTSxjQUFjO1FBQXBCO1lBRVUsWUFBTyxHQUFnQixJQUFBLE9BQUMsRUFBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBT2xELGlCQUFZLEdBQUcsSUFBSSxhQUFLLEVBQWlELENBQUM7WUFDekUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQTRCaEQsQ0FBQztRQWxDQSxJQUFJLFlBQVksS0FBYSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLElBQUksWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDaEgsSUFBSSxhQUFhLEtBQWEsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzRixJQUFJLGFBQWEsS0FBYSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBT2xILElBQUksVUFBVTtZQUNiLE9B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