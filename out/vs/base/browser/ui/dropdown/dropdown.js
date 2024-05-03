/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/common/actions", "vs/base/common/event", "vs/css!./dropdown"], function (require, exports, dom_1, keyboardEvent_1, touch_1, hoverDelegateFactory_1, updatableHoverWidget_1, actions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropdownMenu = void 0;
    class BaseDropdown extends actions_1.ActionRunner {
        constructor(container, options) {
            super();
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._element = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-dropdown'));
            this._label = (0, dom_1.append)(this._element, (0, dom_1.$)('.dropdown-label'));
            let labelRenderer = options.labelRenderer;
            if (!labelRenderer) {
                labelRenderer = (container) => {
                    container.textContent = options.label || '';
                    return null;
                };
            }
            for (const event of [dom_1.EventType.CLICK, dom_1.EventType.MOUSE_DOWN, touch_1.EventType.Tap]) {
                this._register((0, dom_1.addDisposableListener)(this.element, event, e => dom_1.EventHelper.stop(e, true))); // prevent default click behaviour to trigger
            }
            for (const event of [dom_1.EventType.MOUSE_DOWN, touch_1.EventType.Tap]) {
                this._register((0, dom_1.addDisposableListener)(this._label, event, e => {
                    if ((0, dom_1.isMouseEvent)(e) && (e.detail > 1 || e.button !== 0)) {
                        // prevent right click trigger to allow separate context menu (https://github.com/microsoft/vscode/issues/151064)
                        // prevent multiple clicks to open multiple context menus (https://github.com/microsoft/vscode/issues/41363)
                        return;
                    }
                    if (this.visible) {
                        this.hide();
                    }
                    else {
                        this.show();
                    }
                }));
            }
            this._register((0, dom_1.addDisposableListener)(this._label, dom_1.EventType.KEY_UP, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    dom_1.EventHelper.stop(e, true); // https://github.com/microsoft/vscode/issues/57997
                    if (this.visible) {
                        this.hide();
                    }
                    else {
                        this.show();
                    }
                }
            }));
            const cleanupFn = labelRenderer(this._label);
            if (cleanupFn) {
                this._register(cleanupFn);
            }
            this._register(touch_1.Gesture.addTarget(this._label));
        }
        get element() {
            return this._element;
        }
        get label() {
            return this._label;
        }
        set tooltip(tooltip) {
            if (this._label) {
                if (!this.hover && tooltip !== '') {
                    this.hover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this._label, tooltip));
                }
                else if (this.hover) {
                    this.hover.update(tooltip);
                }
            }
        }
        show() {
            if (!this.visible) {
                this.visible = true;
                this._onDidChangeVisibility.fire(true);
            }
        }
        hide() {
            if (this.visible) {
                this.visible = false;
                this._onDidChangeVisibility.fire(false);
            }
        }
        isVisible() {
            return !!this.visible;
        }
        onEvent(_e, activeElement) {
            this.hide();
        }
        dispose() {
            super.dispose();
            this.hide();
            if (this.boxContainer) {
                this.boxContainer.remove();
                this.boxContainer = undefined;
            }
            if (this.contents) {
                this.contents.remove();
                this.contents = undefined;
            }
            if (this._label) {
                this._label.remove();
                this._label = undefined;
            }
        }
    }
    class DropdownMenu extends BaseDropdown {
        constructor(container, _options) {
            super(container, _options);
            this._options = _options;
            this._actions = [];
            this.actions = _options.actions || [];
        }
        set menuOptions(options) {
            this._menuOptions = options;
        }
        get menuOptions() {
            return this._menuOptions;
        }
        get actions() {
            if (this._options.actionProvider) {
                return this._options.actionProvider.getActions();
            }
            return this._actions;
        }
        set actions(actions) {
            this._actions = actions;
        }
        show() {
            super.show();
            this.element.classList.add('active');
            this._options.contextMenuProvider.showContextMenu({
                getAnchor: () => this.element,
                getActions: () => this.actions,
                getActionsContext: () => this.menuOptions ? this.menuOptions.context : null,
                getActionViewItem: (action, options) => this.menuOptions && this.menuOptions.actionViewItemProvider ? this.menuOptions.actionViewItemProvider(action, options) : undefined,
                getKeyBinding: action => this.menuOptions && this.menuOptions.getKeyBinding ? this.menuOptions.getKeyBinding(action) : undefined,
                getMenuClassName: () => this._options.menuClassName || '',
                onHide: () => this.onHide(),
                actionRunner: this.menuOptions ? this.menuOptions.actionRunner : undefined,
                anchorAlignment: this.menuOptions ? this.menuOptions.anchorAlignment : 0 /* AnchorAlignment.LEFT */,
                domForShadowRoot: this._options.menuAsChild ? this.element : undefined,
                skipTelemetry: this._options.skipTelemetry
            });
        }
        hide() {
            super.hide();
        }
        onHide() {
            this.hide();
            this.element.classList.remove('active');
        }
    }
    exports.DropdownMenu = DropdownMenu;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcGRvd24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9kcm9wZG93bi9kcm9wZG93bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5QmhHLE1BQU0sWUFBYSxTQUFRLHNCQUFZO1FBWXRDLFlBQVksU0FBc0IsRUFBRSxPQUE2QjtZQUNoRSxLQUFLLEVBQUUsQ0FBQztZQU5ELDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVcsQ0FBQyxDQUFDO1lBQy9ELDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFPbEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLFlBQU0sRUFBQyxTQUFTLEVBQUUsSUFBQSxPQUFDLEVBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBRXpELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSxZQUFNLEVBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFBLE9BQUMsRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFFMUQsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUMxQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3BCLGFBQWEsR0FBRyxDQUFDLFNBQXNCLEVBQXNCLEVBQUU7b0JBQzlELFNBQVMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBRTVDLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUMsQ0FBQztZQUNILENBQUM7WUFFRCxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsZUFBUyxDQUFDLEtBQUssRUFBRSxlQUFTLENBQUMsVUFBVSxFQUFFLGlCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ25G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