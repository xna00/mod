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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/compositeBarActions", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/widget", "vs/base/common/types", "vs/base/common/event", "vs/workbench/common/views", "vs/workbench/browser/dnd", "vs/base/browser/touch"], function (require, exports, nls_1, actions_1, instantiation_1, actionbar_1, compositeBarActions_1, dom_1, mouseEvent_1, contextView_1, widget_1, types_1, event_1, views_1, dnd_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositeBar = exports.CompositeDragAndDrop = void 0;
    class CompositeDragAndDrop {
        constructor(viewDescriptorService, targetContainerLocation, orientation, openComposite, moveComposite, getItems) {
            this.viewDescriptorService = viewDescriptorService;
            this.targetContainerLocation = targetContainerLocation;
            this.orientation = orientation;
            this.openComposite = openComposite;
            this.moveComposite = moveComposite;
            this.getItems = getItems;
        }
        drop(data, targetCompositeId, originalEvent, before) {
            const dragData = data.getData();
            if (dragData.type === 'composite') {
                const currentContainer = this.viewDescriptorService.getViewContainerById(dragData.id);
                const currentLocation = this.viewDescriptorService.getViewContainerLocation(currentContainer);
                // ... on the same composite bar
                if (currentLocation === this.targetContainerLocation) {
                    if (targetCompositeId) {
                        this.moveComposite(dragData.id, targetCompositeId, before);
                    }
                }
                // ... on a different composite bar
                else {
                    this.viewDescriptorService.moveViewContainerToLocation(currentContainer, this.targetContainerLocation, this.getTargetIndex(targetCompositeId, before), 'dnd');
                }
            }
            if (dragData.type === 'view') {
                const viewToMove = this.viewDescriptorService.getViewDescriptorById(dragData.id);
                if (viewToMove && viewToMove.canMoveView) {
                    this.viewDescriptorService.moveViewToLocation(viewToMove, this.targetContainerLocation, 'dnd');
                    const newContainer = this.viewDescriptorService.getViewContainerByViewId(viewToMove.id);
                    if (targetCompositeId) {
                        this.moveComposite(newContainer.id, targetCompositeId, before);
                    }
                    this.openComposite(newContainer.id, true).then(composite => {
                        composite?.openView(viewToMove.id, true);
                    });
                }
            }
        }
        onDragEnter(data, targetCompositeId, originalEvent) {
            return this.canDrop(data, targetCompositeId);
        }
        onDragOver(data, targetCompositeId, originalEvent) {
            return this.canDrop(data, targetCompositeId);
        }
        getTargetIndex(targetId, before2d) {
            if (!targetId) {
                return undefined;
            }
            const items = this.getItems();
            const before = this.orientation === 0 /* ActionsOrientation.HORIZONTAL */ ? before2d?.horizontallyBefore : before2d?.verticallyBefore;
            return items.filter(item => item.visible).findIndex(item => item.id === targetId) + (before ? 0 : 1);
        }
        canDrop(data, targetCompositeId) {
            const dragData = data.getData();
            if (dragData.type === 'composite') {
                // Dragging a composite
                const currentContainer = this.viewDescriptorService.getViewContainerById(dragData.id);
                const currentLocation = this.viewDescriptorService.getViewContainerLocation(currentContainer);
                // ... to the same composite location
                if (currentLocation === this.targetContainerLocation) {
                    return dragData.id !== targetCompositeId;
                }
                return true;
            }
            else {
                // Dragging an individual view
                const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dragData.id);
                // ... that cannot move
                if (!viewDescriptor || !viewDescriptor.canMoveView) {
                    return false;
                }
                // ... to create a view container
                return true;
            }
        }
    }
    exports.CompositeDragAndDrop = CompositeDragAndDrop;
    let CompositeBar = class CompositeBar extends widget_1.Widget {
        constructor(items, options, instantiationService, contextMenuService, viewDescriptorService) {
            super();
            this.options = options;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.viewDescriptorService = viewDescriptorService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.model = new CompositeBarModel(items, options);
            this.visibleComposites = [];
            this.compositeSizeInBar = new Map();
            this.computeSizes(this.model.visibleItems);
        }
        getCompositeBarItems() {
            return [...this.model.items];
        }
        setCompositeBarItems(items) {
            this.model.setItems(items);
            this.updateCompositeSwitcher();
        }
        getPinnedComposites() {
            return this.model.pinnedItems;
        }
        getVisibleComposites() {
            return this.model.visibleItems;
        }
        create(parent) {
            const actionBarDiv = parent.appendChild((0, dom_1.$)('.composite-bar'));
            this.compositeSwitcherBar = this._register(new actionbar_1.ActionBar(actionBarDiv, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof compositeBarActions_1.CompositeOverflowActivityAction) {
                        return this.compositeOverflowActionViewItem;
                    }
                    const item = this.model.findItem(action.id);
                    return item && this.instantiationService.createInstance(compositeBarActions_1.CompositeActionViewItem, { ...options, draggable: true, colors: this.options.colors, icon: this.options.icon, hoverOptions: this.options.activityHoverOptions, compact: this.options.compact }, action, item.pinnedAction, item.toggleBadgeAction, compositeId => this.options.getContextMenuActionsForComposite(compositeId), () => this.getContextMenuActions(), this.options.dndHandler, this);
                },
                orientation: this.options.orientation,
                ariaLabel: (0, nls_1.localize)('activityBarAriaLabel', "Active View Switcher"),
                ariaRole: 'tablist',
                preventLoopNavigation: this.options.preventLoopNavigation,
                triggerKeys: { keyDown: true }
            }));
            // Contextmenu for composites
            this._register((0, dom_1.addDisposableListener)(parent, dom_1.EventType.CONTEXT_MENU, e => this.showContextMenu((0, dom_1.getWindow)(parent), e)));
            this._register(touch_1.Gesture.addTarget(parent));
            this._register((0, dom_1.addDisposableListener)(parent, touch_1.EventType.Contextmenu, e => this.showContextMenu((0, dom_1.getWindow)(parent), e)));
            // Register a drop target on the whole bar to prevent forbidden feedback
            let insertDropBefore = undefined;
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(parent, {
                onDragOver: (e) => {
                    // don't add feedback if this is over the composite bar actions or there are no actions
                    const visibleItems = this.getVisibleComposites();
                    if (!visibleItems.length || (e.eventData.target && (0, dom_1.isAncestor)(e.eventData.target, actionBarDiv))) {
                        insertDropBefore = this.updateFromDragging(parent, false, false, true);
                        return;
                    }
                    const insertAtFront = this.insertAtFront(actionBarDiv, e.eventData);
                    const target = insertAtFront ? visibleItems[0] : visibleItems[visibleItems.length - 1];
                    const validDropTarget = this.options.dndHandler.onDragOver(e.dragAndDropData, target.id, e.eventData);
                    (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', validDropTarget);
                    insertDropBefore = this.updateFromDragging(parent, validDropTarget, insertAtFront, true);
                },
                onDragLeave: (e) => {
                    insertDropBefore = this.updateFromDragging(parent, false, false, false);
                },
                onDragEnd: (e) => {
                    insertDropBefore = this.updateFromDragging(parent, false, false, false);
                },
                onDrop: (e) => {
                    const visibleItems = this.getVisibleComposites();
                    if (visibleItems.length) {
                        const target = this.insertAtFront(actionBarDiv, e.eventData) ? visibleItems[0] : visibleItems[visibleItems.length - 1];
                        this.options.dndHandler.drop(e.dragAndDropData, target.id, e.eventData, insertDropBefore);
                    }
                    insertDropBefore = this.updateFromDragging(parent, false, false, false);
                }
            }));
            return actionBarDiv;
        }
        insertAtFront(element, event) {
            const rect = element.getBoundingClientRect();
            const posX = event.clientX;
            const posY = event.clientY;
            switch (this.options.orientation) {
                case 0 /* ActionsOrientation.HORIZONTAL */:
                    return posX < rect.left;
                case 1 /* ActionsOrientation.VERTICAL */:
                    return posY < rect.top;
            }
        }
        updateFromDragging(element, showFeedback, front, isDragging) {
            element.classList.toggle('dragged-over', isDragging);
            element.classList.toggle('dragged-over-head', showFeedback && front);
            element.classList.toggle('dragged-over-tail', showFeedback && !front);
            if (!showFeedback) {
                return undefined;
            }
            return { verticallyBefore: front, horizontallyBefore: front };
        }
        focus(index) {
            this.compositeSwitcherBar?.focus(index);
        }
        recomputeSizes() {
            this.computeSizes(this.model.visibleItems);
            this.updateCompositeSwitcher();
        }
        layout(dimension) {
            this.dimension = dimension;
            if (dimension.height === 0 || dimension.width === 0) {
                // Do not layout if not visible. Otherwise the size measurment would be computed wrongly
                return;
            }
            if (this.compositeSizeInBar.size === 0) {
                // Compute size of each composite by getting the size from the css renderer
                // Size is later used for overflow computation
                this.computeSizes(this.model.visibleItems);
            }
            this.updateCompositeSwitcher();
        }
        addComposite({ id, name, order, requestedIndex }) {
            if (this.model.add(id, name, order, requestedIndex)) {
                this.computeSizes([this.model.findItem(id)]);
                this.updateCompositeSwitcher();
            }
        }
        removeComposite(id) {
            // If it pinned, unpin it first
            if (this.isPinned(id)) {
                this.unpin(id);
            }
            // Remove from the model
            if (this.model.remove(id)) {
                this.updateCompositeSwitcher();
            }
        }
        hideComposite(id) {
            if (this.model.hide(id)) {
                this.resetActiveComposite(id);
                this.updateCompositeSwitcher();
            }
        }
        activateComposite(id) {
            const previousActiveItem = this.model.activeItem;
            if (this.model.activate(id)) {
                // Update if current composite is neither visible nor pinned
                // or previous active composite is not pinned
                if (this.visibleComposites.indexOf(id) === -1 || (!!this.model.activeItem && !this.model.activeItem.pinned) || (previousActiveItem && !previousActiveItem.pinned)) {
                    this.updateCompositeSwitcher();
                }
            }
        }
        deactivateComposite(id) {
            const previousActiveItem = this.model.activeItem;
            if (this.model.deactivate()) {
                if (previousActiveItem && !previousActiveItem.pinned) {
                    this.updateCompositeSwitcher();
                }
            }
        }
        async pin(compositeId, open) {
            if (this.model.setPinned(compositeId, true)) {
                this.updateCompositeSwitcher();
                if (open) {
                    await this.options.openComposite(compositeId);
                    this.activateComposite(compositeId); // Activate after opening
                }
            }
        }
        unpin(compositeId) {
            if (this.model.setPinned(compositeId, false)) {
                this.updateCompositeSwitcher();
                this.resetActiveComposite(compositeId);
            }
        }
        areBadgesEnabled(compositeId) {
            return this.viewDescriptorService.getViewContainerBadgeEnablementState(compositeId);
        }
        toggleBadgeEnablement(compositeId) {
            this.viewDescriptorService.setViewContainerBadgeEnablementState(compositeId, !this.areBadgesEnabled(compositeId));
            this.updateCompositeSwitcher();
            const item = this.model.findItem(compositeId);
            if (item) {
                // TODO @lramos15 how do we tell the activity to re-render the badge? This triggers an onDidChange but isn't the right way to do it.
                // I could add another specific function like `activity.updateBadgeEnablement` would then the activity store the sate?
                item.activityAction.activity = item.activityAction.activity;
            }
        }
        resetActiveComposite(compositeId) {
            const defaultCompositeId = this.options.getDefaultCompositeId();
            // Case: composite is not the active one or the active one is a different one
            // Solv: we do nothing
            if (!this.model.activeItem || this.model.activeItem.id !== compositeId) {
                return;
            }
            // Deactivate itself
            this.deactivateComposite(compositeId);
            // Case: composite is not the default composite and default composite is still showing
            // Solv: we open the default composite
            if (defaultCompositeId && defaultCompositeId !== compositeId && this.isPinned(defaultCompositeId)) {
                this.options.openComposite(defaultCompositeId, true);
            }
            // Case: we closed the default composite
            // Solv: we open the next visible composite from top
            else {
                this.options.openComposite(this.visibleComposites.filter(cid => cid !== compositeId)[0]);
            }
        }
        isPinned(compositeId) {
            const item = this.model.findItem(compositeId);
            return item?.pinned;
        }
        move(compositeId, toCompositeId, before) {
            if (before !== undefined) {
                const fromIndex = this.model.items.findIndex(c => c.id === compositeId);
                let toIndex = this.model.items.findIndex(c => c.id === toCompositeId);
                if (fromIndex >= 0 && toIndex >= 0) {
                    if (!before && fromIndex > toIndex) {
                        toIndex++;
                    }
                    if (before && fromIndex < toIndex) {
                        toIndex--;
                    }
                    if (toIndex < this.model.items.length && toIndex >= 0 && toIndex !== fromIndex) {
                        if (this.model.move(this.model.items[fromIndex].id, this.model.items[toIndex].id)) {
                            // timeout helps to prevent artifacts from showing up
                            setTimeout(() => this.updateCompositeSwitcher(), 0);
                        }
                    }
                }
            }
            else {
                if (this.model.move(compositeId, toCompositeId)) {
                    // timeout helps to prevent artifacts from showing up
                    setTimeout(() => this.updateCompositeSwitcher(), 0);
                }
            }
        }
        getAction(compositeId) {
            const item = this.model.findItem(compositeId);
            return item?.activityAction;
        }
        computeSizes(items) {
            const size = this.options.compositeSize;
            if (size) {
                items.forEach(composite => this.compositeSizeInBar.set(composite.id, size));
            }
            else {
                const compositeSwitcherBar = this.compositeSwitcherBar;
                if (compositeSwitcherBar && this.dimension && this.dimension.height !== 0 && this.dimension.width !== 0) {
                    // Compute sizes only if visible. Otherwise the size measurment would be computed wrongly.
                    const currentItemsLength = compositeSwitcherBar.viewItems.length;
                    compositeSwitcherBar.push(items.map(composite => composite.activityAction));
                    items.map((composite, index) => this.compositeSizeInBar.set(composite.id, this.options.orientation === 1 /* ActionsOrientation.VERTICAL */
                        ? compositeSwitcherBar.getHeight(currentItemsLength + index)
                        : compositeSwitcherBar.getWidth(currentItemsLength + index)));
                    items.forEach(() => compositeSwitcherBar.pull(compositeSwitcherBar.viewItems.length - 1));
                }
            }
        }
        updateCompositeSwitcher() {
            const compositeSwitcherBar = this.compositeSwitcherBar;
            if (!compositeSwitcherBar || !this.dimension) {
                return; // We have not been rendered yet so there is nothing to update.
            }
            let compositesToShow = this.model.visibleItems.filter(item => item.pinned
                || (this.model.activeItem && this.model.activeItem.id === item.id) /* Show the active composite even if it is not pinned */).map(item => item.id);
            // Ensure we are not showing more composites than we have height for
            let maxVisible = compositesToShow.length;
            const totalComposites = compositesToShow.length;
            let size = 0;
            const limit = this.options.orientation === 1 /* ActionsOrientation.VERTICAL */ ? this.dimension.height : this.dimension.width;
            // Add composites while they fit
            for (let i = 0; i < compositesToShow.length; i++) {
                const compositeSize = this.compositeSizeInBar.get(compositesToShow[i]);
                // Adding this composite will overflow available size, so don't
                if (size + compositeSize > limit) {
                    maxVisible = i;
                    break;
                }
                size += compositeSize;
            }
            // Remove the tail of composites that did not fit
            if (totalComposites > maxVisible) {
                compositesToShow = compositesToShow.slice(0, maxVisible);
            }
            // We always try show the active composite, so re-add it if it was sliced out
            if (this.model.activeItem && compositesToShow.every(compositeId => !!this.model.activeItem && compositeId !== this.model.activeItem.id)) {
                size += this.compositeSizeInBar.get(this.model.activeItem.id);
                compositesToShow.push(this.model.activeItem.id);
            }
            // The active composite might have pushed us over the limit
            // Keep popping the composite before the active one until it fits
            // If even the active one doesn't fit, we will resort to overflow
            while (size > limit && compositesToShow.length) {
                const removedComposite = compositesToShow.length > 1 ? compositesToShow.splice(compositesToShow.length - 2, 1)[0] : compositesToShow.pop();
                size -= this.compositeSizeInBar.get(removedComposite);
            }
            // We are overflowing, add the overflow size
            if (totalComposites > compositesToShow.length) {
                size += this.options.overflowActionSize;
            }
            // Check if we need to make extra room for the overflow action
            while (size > limit && compositesToShow.length) {
                const removedComposite = compositesToShow.length > 1 && compositesToShow[compositesToShow.length - 1] === this.model.activeItem?.id ?
                    compositesToShow.splice(compositesToShow.length - 2, 1)[0] : compositesToShow.pop();
                size -= this.compositeSizeInBar.get(removedComposite);
            }
            // Remove the overflow action if there are no overflows
            if (totalComposites === compositesToShow.length && this.compositeOverflowAction) {
                compositeSwitcherBar.pull(compositeSwitcherBar.length() - 1);
                this.compositeOverflowAction.dispose();
                this.compositeOverflowAction = undefined;
                this.compositeOverflowActionViewItem?.dispose();
                this.compositeOverflowActionViewItem = undefined;
            }
            // Pull out composites that overflow or got hidden
            const compositesToRemove = [];
            this.visibleComposites.forEach((compositeId, index) => {
                if (!compositesToShow.includes(compositeId)) {
                    compositesToRemove.push(index);
                }
            });
            compositesToRemove.reverse().forEach(index => {
                compositeSwitcherBar.pull(index);
                this.visibleComposites.splice(index, 1);
            });
            // Update the positions of the composites
            compositesToShow.forEach((compositeId, newIndex) => {
                const currentIndex = this.visibleComposites.indexOf(compositeId);
                if (newIndex !== currentIndex) {
                    if (currentIndex !== -1) {
                        compositeSwitcherBar.pull(currentIndex);
                        this.visibleComposites.splice(currentIndex, 1);
                    }
                    compositeSwitcherBar.push(this.model.findItem(compositeId).activityAction, { label: true, icon: this.options.icon, index: newIndex });
                    this.visibleComposites.splice(newIndex, 0, compositeId);
                }
            });
            // Add overflow action as needed
            if (totalComposites > compositesToShow.length && !this.compositeOverflowAction) {
                this.compositeOverflowAction = this._register(this.instantiationService.createInstance(compositeBarActions_1.CompositeOverflowActivityAction, () => {
                    this.compositeOverflowActionViewItem?.showMenu();
                }));
                this.compositeOverflowActionViewItem = this._register(this.instantiationService.createInstance(compositeBarActions_1.CompositeOverflowActivityActionViewItem, this.compositeOverflowAction, () => this.getOverflowingComposites(), () => this.model.activeItem ? this.model.activeItem.id : undefined, compositeId => {
                    const item = this.model.findItem(compositeId);
                    return item?.activity[0]?.badge;
                }, this.options.getOnCompositeClickAction, this.options.colors, this.options.activityHoverOptions));
                compositeSwitcherBar.push(this.compositeOverflowAction, { label: false, icon: true });
            }
            this._onDidChange.fire();
        }
        getOverflowingComposites() {
            let overflowingIds = this.model.visibleItems.filter(item => item.pinned).map(item => item.id);
            // Show the active composite even if it is not pinned
            if (this.model.activeItem && !this.model.activeItem.pinned) {
                overflowingIds.push(this.model.activeItem.id);
            }
            overflowingIds = overflowingIds.filter(compositeId => !this.visibleComposites.includes(compositeId));
            return this.model.visibleItems.filter(c => overflowingIds.includes(c.id)).map(item => { return { id: item.id, name: this.getAction(item.id)?.label || item.name }; });
        }
        showContextMenu(targetWindow, e) {
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent(targetWindow, e);
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => this.getContextMenuActions(e)
            });
        }
        getContextMenuActions(e) {
            const actions = this.model.visibleItems
                .map(({ id, name, activityAction }) => ((0, actions_1.toAction)({
                id,
                label: this.getAction(id).label || name || id,
                checked: this.isPinned(id),
                enabled: activityAction.enabled,
                run: () => {
                    if (this.isPinned(id)) {
                        this.unpin(id);
                    }
                    else {
                        this.pin(id, true);
                    }
                }
            })));
            this.options.fillExtraContextMenuActions(actions, e);
            return actions;
        }
    };
    exports.CompositeBar = CompositeBar;
    exports.CompositeBar = CompositeBar = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, views_1.IViewDescriptorService)
    ], CompositeBar);
    class CompositeBarModel {
        get items() { return this._items; }
        constructor(items, options) {
            this._items = [];
            this.options = options;
            this.setItems(items);
        }
        setItems(items) {
            this._items = [];
            this._items = items
                .map(i => this.createCompositeBarItem(i.id, i.name, i.order, i.pinned, i.visible));
        }
        get visibleItems() {
            return this.items.filter(item => item.visible);
        }
        get pinnedItems() {
            return this.items.filter(item => item.visible && item.pinned);
        }
        createCompositeBarItem(id, name, order, pinned, visible) {
            const options = this.options;
            return {
                id, name, pinned, order, visible,
                activity: [],
                get activityAction() {
                    return options.getActivityAction(id);
                },
                get pinnedAction() {
                    return options.getCompositePinnedAction(id);
                },
                get toggleBadgeAction() {
                    return options.getCompositeBadgeAction(id);
                }
            };
        }
        add(id, name, order, requestedIndex) {
            const item = this.findItem(id);
            if (item) {
                let changed = false;
                item.name = name;
                if (!(0, types_1.isUndefinedOrNull)(order)) {
                    changed = item.order !== order;
                    item.order = order;
                }
                if (!item.visible) {
                    item.visible = true;
                    changed = true;
                }
                return changed;
            }
            else {
                const item = this.createCompositeBarItem(id, name, order, true, true);
                if (!(0, types_1.isUndefinedOrNull)(requestedIndex)) {
                    let index = 0;
                    let rIndex = requestedIndex;
                    while (rIndex > 0 && index < this.items.length) {
                        if (this.items[index++].visible) {
                            rIndex--;
                        }
                    }
                    this.items.splice(index, 0, item);
                }
                else if ((0, types_1.isUndefinedOrNull)(order)) {
                    this.items.push(item);
                }
                else {
                    let index = 0;
                    while (index < this.items.length && typeof this.items[index].order === 'number' && this.items[index].order < order) {
                        index++;
                    }
                    this.items.splice(index, 0, item);
                }
                return true;
            }
        }
        remove(id) {
            for (let index = 0; index < this.items.length; index++) {
                if (this.items[index].id === id) {
                    this.items.splice(index, 1);
                    return true;
                }
            }
            return false;
        }
        hide(id) {
            for (const item of this.items) {
                if (item.id === id) {
                    if (item.visible) {
                        item.visible = false;
                        return true;
                    }
                    return false;
                }
            }
            return false;
        }
        move(compositeId, toCompositeId) {
            const fromIndex = this.findIndex(compositeId);
            const toIndex = this.findIndex(toCompositeId);
            // Make sure both items are known to the model
            if (fromIndex === -1 || toIndex === -1) {
                return false;
            }
            const sourceItem = this.items.splice(fromIndex, 1)[0];
            this.items.splice(toIndex, 0, sourceItem);
            // Make sure a moved composite gets pinned
            sourceItem.pinned = true;
            return true;
        }
        setPinned(id, pinned) {
            for (const item of this.items) {
                if (item.id === id) {
                    if (item.pinned !== pinned) {
                        item.pinned = pinned;
                        return true;
                    }
                    return false;
                }
            }
            return false;
        }
        activate(id) {
            if (!this.activeItem || this.activeItem.id !== id) {
                if (this.activeItem) {
                    this.deactivate();
                }
                for (const item of this.items) {
                    if (item.id === id) {
                        this.activeItem = item;
                        this.activeItem.activityAction.activate();
                        return true;
                    }
                }
            }
            return false;
        }
        deactivate() {
            if (this.activeItem) {
                this.activeItem.activityAction.deactivate();
                this.activeItem = undefined;
                return true;
            }
            return false;
        }
        findItem(id) {
            return this.items.filter(item => item.id === id)[0];
        }
        findIndex(id) {
            for (let index = 0; index < this.items.length; index++) {
                if (this.items[index].id === id) {
                    return index;
                }
            }
            return -1;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9jb21wb3NpdGVCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK0JoRyxNQUFhLG9CQUFvQjtRQUVoQyxZQUNTLHFCQUE2QyxFQUM3Qyx1QkFBOEMsRUFDOUMsV0FBK0IsRUFDL0IsYUFBOEUsRUFDOUUsYUFBb0UsRUFDcEUsUUFBbUM7WUFMbkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUM3Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXVCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFvQjtZQUMvQixrQkFBYSxHQUFiLGFBQWEsQ0FBaUU7WUFDOUUsa0JBQWEsR0FBYixhQUFhLENBQXVEO1lBQ3BFLGFBQVEsR0FBUixRQUFRLENBQTJCO1FBQ3hDLENBQUM7UUFFTCxJQUFJLENBQUMsSUFBOEIsRUFBRSxpQkFBcUMsRUFBRSxhQUF3QixFQUFFLE1BQWlCO1lBQ3RILE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVoQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ25DLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUUsQ0FBQztnQkFDdkYsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBRTlGLGdDQUFnQztnQkFDaEMsSUFBSSxlQUFlLEtBQUssSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JBQ3RELElBQUksaUJBQWlCLEVBQUUsQ0FBQzt3QkFD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