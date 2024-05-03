/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/menu/menu", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/theme/browser/defaultStyles"], function (require, exports, dom_1, mouseEvent_1, menu_1, actions_1, errors_1, lifecycle_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuHandler = void 0;
    class ContextMenuHandler {
        constructor(contextViewService, telemetryService, notificationService, keybindingService) {
            this.contextViewService = contextViewService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.keybindingService = keybindingService;
            this.focusToReturn = null;
            this.lastContainer = null;
            this.block = null;
            this.blockDisposable = null;
            this.options = { blockMouse: true };
        }
        configure(options) {
            this.options = options;
        }
        showContextMenu(delegate) {
            const actions = delegate.getActions();
            if (!actions.length) {
                return; // Don't render an empty context menu
            }
            this.focusToReturn = (0, dom_1.getActiveElement)();
            let menu;
            const shadowRootElement = delegate.domForShadowRoot instanceof HTMLElement ? delegate.domForShadowRoot : undefined;
            this.contextViewService.showContextView({
                getAnchor: () => delegate.getAnchor(),
                canRelayout: false,
                anchorAlignment: delegate.anchorAlignment,
                anchorAxisAlignment: delegate.anchorAxisAlignment,
                render: (container) => {
                    this.lastContainer = container;
                    const className = delegate.getMenuClassName ? delegate.getMenuClassName() : '';
                    if (className) {
                        container.className += ' ' + className;
                    }
                    // Render invisible div to block mouse interaction in the rest of the UI
                    if (this.options.blockMouse) {
                        this.block = container.appendChild((0, dom_1.$)('.context-view-block'));
                        this.block.style.position = 'fixed';
                        this.block.style.cursor = 'initial';
                        this.block.style.left = '0';
                        this.block.style.top = '0';
                        this.block.style.width = '100%';
                        this.block.style.height = '100%';
                        this.block.style.zIndex = '-1';
                        this.blockDisposable?.dispose();
                        this.blockDisposable = (0, dom_1.addDisposableListener)(this.block, dom_1.EventType.MOUSE_DOWN, e => e.stopPropagation());
                    }
                    const menuDisposables = new lifecycle_1.DisposableStore();
                    const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
                    actionRunner.onWillRun(evt => this.onActionRun(evt, !delegate.skipTelemetry), this, menuDisposables);
                    actionRunner.onDidRun(this.onDidActionRun, this, menuDisposables);
                    menu = new menu_1.Menu(container, actions, {
                        actionViewItemProvider: delegate.getActionViewItem,
                        context: delegate.getActionsContext ? delegate.getActionsContext() : null,
                        actionRunner,
                        getKeyBinding: delegate.getKeyBinding ? delegate.getKeyBinding : action => this.keybindingService.lookupKeybinding(action.id)
                    }, defaultStyles_1.defaultMenuStyles);
                    menu.onDidCancel(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    menu.onDidBlur(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    const targetWindow = (0, dom_1.getWindow)(container);
                    menuDisposables.add((0, dom_1.addDisposableListener)(targetWindow, dom_1.EventType.BLUR, () => this.contextViewService.hideContextView(true)));
                    menuDisposables.add((0, dom_1.addDisposableListener)(targetWindow, dom_1.EventType.MOUSE_DOWN, (e) => {
                        if (e.defaultPrevented) {
                            return;
                        }
                        const event = new mouseEvent_1.StandardMouseEvent(targetWindow, e);
                        let element = event.target;
                        // Don't do anything as we are likely creating a context menu
                        if (event.rightButton) {
                            return;
                        }
                        while (element) {
                            if (element === container) {
                                return;
                            }
                            element = element.parentElement;
                        }
                        this.contextViewService.hideContextView(true);
                    }));
                    return (0, lifecycle_1.combinedDisposable)(menuDisposables, menu);
                },
                focus: () => {
                    menu?.focus(!!delegate.autoSelectFirstItem);
                },
                onHide: (didCancel) => {
                    delegate.onHide?.(!!didCancel);
                    if (this.block) {
                        this.block.remove();
                        this.block = null;
                    }
                    this.blockDisposable?.dispose();
                    this.blockDisposable = null;
                    if (!!this.lastContainer && ((0, dom_1.getActiveElement)() === this.lastContainer || (0, dom_1.isAncestor)((0, dom_1.getActiveElement)(), this.lastContainer))) {
                        this.focusToReturn?.focus();
                    }
                    this.lastContainer = null;
                }
            }, shadowRootElement, !!shadowRootElement);
        }
        onActionRun(e, logTelemetry) {
            if (logTelemetry) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'contextMenu' });
            }
            this.contextViewService.hideContextView(false);
        }
        onDidActionRun(e) {
            if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                this.notificationService.error(e.error);
            }
        }
    }
    exports.ContextMenuHandler = ContextMenuHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dE1lbnVIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb250ZXh0dmlldy9icm93c2VyL2NvbnRleHRNZW51SGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQmhHLE1BQWEsa0JBQWtCO1FBTzlCLFlBQ1Msa0JBQXVDLEVBQ3ZDLGdCQUFtQyxFQUNuQyxtQkFBeUMsRUFDekMsaUJBQXFDO1lBSHJDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNuQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3pDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFWdEMsa0JBQWEsR0FBdUIsSUFBSSxDQUFDO1lBQ3pDLGtCQUFhLEdBQXVCLElBQUksQ0FBQztZQUN6QyxVQUFLLEdBQXVCLElBQUksQ0FBQztZQUNqQyxvQkFBZSxHQUF1QixJQUFJLENBQUM7WUFDM0MsWUFBTyxHQUErQixFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQU8vRCxDQUFDO1FBRUwsU0FBUyxDQUFDLE9BQW1DO1lBQzVDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3hCLENBQUM7UUFFRCxlQUFlLENBQUMsUUFBOEI7WUFDN0MsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sQ0FBQyxxQ0FBcUM7WUFDOUMsQ0FBQztZQUVELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBQSxzQkFBZ0IsR0FBaUIsQ0FBQztZQUV2RCxJQUFJLElBQXNCLENBQUM7WUFFM0IsTUFBTSxpQkFBaUIsR0FB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