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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/terminal/browser/terminalGroup", "vs/workbench/contrib/terminal/browser/terminalUri", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey"], function (require, exports, async_1, event_1, lifecycle_1, contextkey_1, instantiation_1, views_1, viewsService_1, terminalGroup_1, terminalUri_1, terminal_1, terminalContextKey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalGroupService = void 0;
    let TerminalGroupService = class TerminalGroupService extends lifecycle_1.Disposable {
        get instances() {
            return this.groups.reduce((p, c) => p.concat(c.terminalInstances), []);
        }
        constructor(_contextKeyService, _instantiationService, _viewsService, _viewDescriptorService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._instantiationService = _instantiationService;
            this._viewsService = _viewsService;
            this._viewDescriptorService = _viewDescriptorService;
            this.groups = [];
            this.activeGroupIndex = -1;
            this.lastAccessedMenu = 'inline-tab';
            this._onDidChangeActiveGroup = this._register(new event_1.Emitter());
            this.onDidChangeActiveGroup = this._onDidChangeActiveGroup.event;
            this._onDidDisposeGroup = this._register(new event_1.Emitter());
            this.onDidDisposeGroup = this._onDidDisposeGroup.event;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this._onDidShow = this._register(new event_1.Emitter());
            this.onDidShow = this._onDidShow.event;
            this._onDidDisposeInstance = this._register(new event_1.Emitter());
            this.onDidDisposeInstance = this._onDidDisposeInstance.event;
            this._onDidFocusInstance = this._register(new event_1.Emitter());
            this.onDidFocusInstance = this._onDidFocusInstance.event;
            this._onDidChangeActiveInstance = this._register(new event_1.Emitter());
            this.onDidChangeActiveInstance = this._onDidChangeActiveInstance.event;
            this._onDidChangeInstances = this._register(new event_1.Emitter());
            this.onDidChangeInstances = this._onDidChangeInstances.event;
            this._onDidChangeInstanceCapability = this._register(new event_1.Emitter());
            this.onDidChangeInstanceCapability = this._onDidChangeInstanceCapability.event;
            this._onDidChangePanelOrientation = this._register(new event_1.Emitter());
            this.onDidChangePanelOrientation = this._onDidChangePanelOrientation.event;
            this._terminalGroupCountContextKey = terminalContextKey_1.TerminalContextKeys.groupCount.bindTo(this._contextKeyService);
            this._register(this.onDidDisposeGroup(group => this._removeGroup(group)));
            this._register(this.onDidChangeGroups(() => this._terminalGroupCountContextKey.set(this.groups.length)));
            this._register(event_1.Event.any(this.onDidChangeActiveGroup, this.onDidChangeInstances)(() => this.updateVisibility()));
        }
        hidePanel() {
            // Hide the panel if the terminal is in the panel and it has no sibling views
            const panel = this._viewDescriptorService.getViewContainerByViewId(terminal_1.TERMINAL_VIEW_ID);
            if (panel && this._viewDescriptorService.getViewContainerModel(panel).activeViewDescriptors.length === 1) {
                this._viewsService.closeView(terminal_1.TERMINAL_VIEW_ID);
                terminalContextKey_1.TerminalContextKeys.tabsMouse.bindTo(this._contextKeyService).set(false);
            }
        }
        get activeGroup() {
            if (this.activeGroupIndex < 0 || this.activeGroupIndex >= this.groups.length) {
                return undefined;
            }
            return this.groups[this.activeGroupIndex];
        }
        set activeGroup(value) {
            if (value === undefined) {
                // Setting to undefined is not possible, this can only be done when removing the last group
                return;
            }
            const index = this.groups.findIndex(e => e === value);
            this.setActiveGroupByIndex(index);
        }
        get activeInstance() {
            return this.activeGroup?.activeInstance;
        }
        setActiveInstance(instance) {
            this.setActiveInstanceByIndex(this._getIndexFromId(instance.instanceId));
        }
        _getIndexFromId(terminalId) {
            const terminalIndex = this.instances.findIndex(e => e.instanceId === terminalId);
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        setContainer(container) {
            this._container = container;
            this.groups.forEach(group => group.attachToElement(container));
        }
        async focusTabs() {
            if (this.instances.length === 0) {
                return;
            }
            await this.showPanel(true);
            const pane = this._viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID);
            pane?.terminalTabbedView?.focusTabs();
        }
        async focusHover() {
            if (this.instances.length === 0) {
                return;
            }
            const pane = this._viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID);
            pane?.terminalTabbedView?.focusHover();
        }
        async focusActiveInstance() {
            return this.showPanel(true);
        }
        createGroup(slcOrInstance) {
            const group = this._instantiationService.createInstance(terminalGroup_1.TerminalGroup, this._container, slcOrInstance);
            // TODO: Move panel orientation change into this file so it's not fired many times
            group.onPanelOrientationChanged((orientation) => this._onDidChangePanelOrientation.fire(orientation));
            this.groups.push(group);
            group.addDisposable(group.onDidDisposeInstance(this._onDidDisposeInstance.fire, this._onDidDisposeInstance));
            group.addDisposable(group.onDidFocusInstance(this._onDidFocusInstance.fire, this._onDidFocusInstance));
            group.addDisposable(group.onDidChangeActiveInstance(e => {
                if (group === this.activeGroup) {
                    this._onDidChangeActiveInstance.fire(e);
                }
            }));
            group.addDisposable(group.onDidChangeInstanceCapability(this._onDidChangeInstanceCapability.fire, this._onDidChangeInstanceCapability));
            group.addDisposable(group.onInstancesChanged(this._onDidChangeInstances.fire, this._onDidChangeInstances));
            group.addDisposable(group.onDisposed(this._onDidDisposeGroup.fire, this._onDidDisposeGroup));
            if (group.terminalInstances.length > 0) {
                this._onDidChangeInstances.fire();
            }
            if (this.instances.length === 1) {
                // It's the first instance so it should be made active automatically, this must fire
                // after onInstancesChanged so consumers can react to the instance being added first
                this.setActiveInstanceByIndex(0);
            }
            this._onDidChangeGroups.fire();
            return group;
        }
        async showPanel(focus) {
            const pane = this._viewsService.getActiveViewWithId(terminal_1.TERMINAL_VIEW_ID)
                ?? await this._viewsService.openView(terminal_1.TERMINAL_VIEW_ID, focus);
            pane?.setExpanded(true);
            if (focus) {
                // Do the focus call asynchronously as going through the
                // command palette will force editor focus
                await (0, async_1.timeout)(0);
                const instance = this.activeInstance;
                if (instance) {
                    // HACK: Ensure the panel is still visible at this point as there may have been
                    // a request since it was opened to show a different panel
                    if (pane && !pane.isVisible()) {
                        await this._viewsService.openView(terminal_1.TERMINAL_VIEW_ID, focus);
                    }
                    await instance.focusWhenReady(true);
                }
            }
            this._onDidShow.fire();
        }
        getInstanceFromResource(resource) {
            return (0, terminalUri_1.getInstanceFromResource)(this.instances, resource);
        }
        _removeGroup(group) {
            // Get the index of the group and remove it from the list
            const activeGroup = this.activeGroup;
            const wasActiveGroup = group === activeGroup;
            const index = this.groups.indexOf(group);
            if (index !== -1) {
                this.groups.splice(index, 1);
                this._onDidChangeGroups.fire();
            }
            if (wasActiveGroup) {
                // Adjust focus if the group was active
                if (this.groups.length > 0) {
                    const newIndex = index < this.groups.length ? index : this.groups.length - 1;
                    this.setActiveGroupByIndex(newIndex, true);
                    this.activeInstance?.focus(true);
                }
            }
            else {
                // Adjust the active group if the removed group was above the active group
                if (this.activeGroupIndex > index) {
                    this.setActiveGroupByIndex(this.activeGroupIndex - 1);
                }
            }
            // Ensure the active group is still valid, this should set the activeGroupIndex to -1 if
            // there are no groups
            if (this.activeGroupIndex >= this.groups.length) {
                this.setActiveGroupByIndex(this.groups.length - 1);
            }
            this._onDidChangeInstances.fire();
            this._onDidChangeGroups.fire();
            if (wasActiveGroup) {
                this._onDidChangeActiveGroup.fire(this.activeGroup);
                this._onDidChangeActiveInstance.fire(this.activeInstance);
            }
        }
        /**
         * @param force Whether to force the group change, this should be used when the previous active
         * group has been removed.
         */
        setActiveGroupByIndex(index, force) {
            // Unset active group when the last group is removed
            if (index === -1 && this.groups.length === 0) {
                if (this.activeGroupIndex !== -1) {
                    this.activeGroupIndex = -1;
                    this._onDidChangeActiveGroup.fire(this.activeGroup);
                    this._onDidChangeActiveInstance.fire(this.activeInstance);
                }
                return;
            }
            // Ensure index is valid
            if (index < 0 || index >= this.groups.length) {
                return;
            }
            // Fire group/instance change if needed
            const oldActiveGroup = this.activeGroup;
            this.activeGroupIndex = index;
            if (force || oldActiveGroup !== this.activeGroup) {
                this._onDidChangeActiveGroup.fire(this.activeGroup);
                this._onDidChangeActiveInstance.fire(this.activeInstance);
            }
        }
        _getInstanceLocation(index) {
            let currentGroupIndex = 0;
            while (index >= 0 && currentGroupIndex < this.groups.length) {
                const group = this.groups[currentGroupIndex];
                const count = group.terminalInstances.length;
                if (index < count) {
                    return {
                        group,
                        groupIndex: currentGroupIndex,
                        instance: group.terminalInstances[index],
                        instanceIndex: index
                    };
                }
                index -= count;
                currentGroupIndex++;
            }
            return undefined;
        }
        setActiveInstanceByIndex(index) {
            const activeInstance = this.activeInstance;
            const instanceLocation = this._getInstanceLocation(index);
            const newActiveInstance = instanceLocation?.group.terminalInstances[instanceLocation.instanceIndex];
            if (!instanceLocation || activeInstance === newActiveInstance) {
                return;
            }
            const activeInstanceIndex = instanceLocation.instanceIndex;
            this.activeGroupIndex = instanceLocation.groupIndex;
            this._onDidChangeActiveGroup.fire(this.activeGroup);
            instanceLocation.group.setActiveInstanceByIndex(activeInstanceIndex, true);
        }
        setActiveGroupToNext() {
            if (this.groups.length <= 1) {
                return;
            }
            let newIndex = this.activeGroupIndex + 1;
            if (newIndex >= this.groups.length) {
                newIndex = 0;
            }
            this.setActiveGroupByIndex(newIndex);
        }
        setActiveGroupToPrevious() {
            if (this.groups.length <= 1) {
                return;
            }
            let newIndex = this.activeGroupIndex - 1;
            if (newIndex < 0) {
                newIndex = this.groups.length - 1;
            }
            this.setActiveGroupByIndex(newIndex);
        }
        moveGroup(source, target) {
            const sourceGroup = this.getGroupForInstance(source);
            const targetGroup = this.getGroupForInstance(target);
            // Something went wrong
            if (!sourceGroup || !targetGroup) {
                return;
            }
            // The groups are the same, rearrange within the group
            if (sourceGroup === targetGroup) {
                const index = sourceGroup.terminalInstances.indexOf(target);
                if (index !== -1) {
                    sourceGroup.moveInstance(source, index);
                }
                return;
            }
            // The groups differ, rearrange groups
            const sourceGroupIndex = this.groups.indexOf(sourceGroup);
            const targetGroupIndex = this.groups.indexOf(targetGroup);
            this.groups.splice(sourceGroupIndex, 1);
            this.groups.splice(targetGroupIndex, 0, sourceGroup);
            this._onDidChangeInstances.fire();
        }
        moveGroupToEnd(source) {
            const sourceGroup = this.getGroupForInstance(source);
            if (!sourceGroup) {
                return;
            }
            const sourceGroupIndex = this.groups.indexOf(sourceGroup);
            this.groups.splice(sourceGroupIndex, 1);
            this.groups.push(sourceGroup);
            this._onDidChangeInstances.fire();
        }
        moveInstance(source, target, side) {
            const sourceGroup = this.getGroupForInstance(source);
            const targetGroup = this.getGroupForInstance(target);
            if (!sourceGroup || !targetGroup) {
                return;
            }
            // Move from the source group to the target group
            if (sourceGroup !== targetGroup) {
                // Move groups
                sourceGroup.removeInstance(source);
                targetGroup.addInstance(source);
            }
            // Rearrange within the target group
            const index = targetGroup.terminalInstances.indexOf(target) + (side === 'after' ? 1 : 0);
            targetGroup.moveInstance(source, index);
        }
        unsplitInstance(instance) {
            const oldGroup = this.getGroupForInstance(instance);
            if (!oldGroup || oldGroup.terminalInstances.length < 2) {
                return;
            }
            oldGroup.removeInstance(instance);
            this.createGroup(instance);
        }
        joinInstances(instances) {
            const group = this.getGroupForInstance(instances[0]);
            if (group) {
                let differentGroups = true;
                for (let i = 1; i < group.terminalInstances.length; i++) {
                    if (group.terminalInstances.includes(instances[i])) {
                        differentGroups = false;
                        break;
                    }
                }
                if (!differentGroups) {
                    return;
                }
            }
            // Find the group of the first instance that is the only instance in the group, if one exists
            let candidateInstance = undefined;
            let candidateGroup = undefined;
            for (const instance of instances) {
                const group = this.getGroupForInstance(instance);
                if (group?.terminalInstances.length === 1) {
                    candidateInstance = instance;
                    candidateGroup = group;
                    break;
                }
            }
            // Create a new group if needed
            if (!candidateGroup) {
                candidateGroup = this.createGroup();
            }
            const wasActiveGroup = this.activeGroup === candidateGroup;
            // Unsplit all other instances and add them to the new group
            for (const instance of instances) {
                if (instance === candidateInstance) {
                    continue;
                }
                const oldGroup = this.getGroupForInstance(instance);
                if (!oldGroup) {
                    // Something went wrong, don't join this one
                    continue;
                }
                oldGroup.removeInstance(instance);
                candidateGroup.addInstance(instance);
            }
            // Set the active terminal
            this.setActiveInstance(instances[0]);
            // Fire events
            this._onDidChangeInstances.fire();
            if (!wasActiveGroup) {
                this._onDidChangeActiveGroup.fire(this.activeGroup);
            }
        }
        instanceIsSplit(instance) {
            const group = this.getGroupForInstance(instance);
            if (!group) {
                return false;
            }
            return group.terminalInstances.length > 1;
        }
        getGroupForInstance(instance) {
            return this.groups.find(group => group.terminalInstances.includes(instance));
        }
        getGroupLabels() {
            return this.groups.filter(group => group.terminalInstances.length > 0).map((group, index) => {
                return `${index + 1}: ${group.title ? group.title : ''}`;
            });
        }
        /**
         * Visibility should be updated in the following cases:
         * 1. Toggle `TERMINAL_VIEW_ID` visibility
         * 2. Change active group
         * 3. Change instances in active group
         */
        updateVisibility() {
            const visible = this._viewsService.isViewVisible(terminal_1.TERMINAL_VIEW_ID);
            this.groups.forEach((g, i) => g.setVisible(visible && i === this.activeGroupIndex));
        }
    };
    exports.TerminalGroupService = TerminalGroupService;
    exports.TerminalGroupService = TerminalGroupService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, viewsService_1.IViewsService),
        __param(3, views_1.IViewDescriptorService)
    ], TerminalGroupService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxHcm91cFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxHcm91cFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBS25ELElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQXlCLENBQUMsQ0FBQztRQUMvRixDQUFDO1FBK0JELFlBQ3FCLGtCQUE4QyxFQUMzQyxxQkFBNkQsRUFDckUsYUFBNkMsRUFDcEMsc0JBQStEO1lBRXZGLEtBQUssRUFBRSxDQUFDO1lBTG9CLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDMUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNwRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNuQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBdkN4RixXQUFNLEdBQXFCLEVBQUUsQ0FBQztZQUM5QixxQkFBZ0IsR0FBVyxDQUFDLENBQUMsQ0FBQztZQUs5QixxQkFBZ0IsR0FBOEIsWUFBWSxDQUFDO1lBTTFDLDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQThCLENBQUMsQ0FBQztZQUM1RiwyQkFBc0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBQ3BELHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMs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