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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry"], function (require, exports, dom_1, widget_1, event_1, lifecycle_1, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FloatingClickMenu = exports.AbstractFloatingClickMenu = exports.FloatingClickWidget = void 0;
    class FloatingClickWidget extends widget_1.Widget {
        constructor(label) {
            super();
            this.label = label;
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._domNode = (0, dom_1.$)('.floating-click-widget');
            this._domNode.style.padding = '6px 11px';
            this._domNode.style.borderRadius = '2px';
            this._domNode.style.cursor = 'pointer';
            this._domNode.style.zIndex = '1';
        }
        getDomNode() {
            return this._domNode;
        }
        render() {
            (0, dom_1.clearNode)(this._domNode);
            this._domNode.style.backgroundColor = (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.buttonBackground, (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorBackground));
            this._domNode.style.color = (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.buttonForeground, (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorForeground));
            this._domNode.style.border = `1px solid ${(0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder)}`;
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('')).textContent = this.label;
            this.onclick(this._domNode, () => this._onClick.fire());
        }
    }
    exports.FloatingClickWidget = FloatingClickWidget;
    let AbstractFloatingClickMenu = class AbstractFloatingClickMenu extends lifecycle_1.Disposable {
        constructor(menuId, menuService, contextKeyService) {
            super();
            this.renderEmitter = new event_1.Emitter();
            this.onDidRender = this.renderEmitter.event;
            this.menu = this._register(menuService.createMenu(menuId, contextKeyService));
        }
        /** Should be called in implementation constructors after they initialized */
        render() {
            const menuDisposables = this._register(new lifecycle_1.DisposableStore());
            const renderMenuAsFloatingClickBtn = () => {
                menuDisposables.clear();
                if (!this.isVisible()) {
                    return;
                }
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { renderShortTitle: true, shouldForwardArgs: true }, actions);
                if (actions.length === 0) {
                    return;
                }
                // todo@jrieken find a way to handle N actions, like showing a context menu
                const [first] = actions;
                const widget = this.createWidget(first, menuDisposables);
                menuDisposables.add(widget);
                menuDisposables.add(widget.onClick(() => first.run(this.getActionArg())));
                widget.render();
            };
            this._register(this.menu.onDidChange(renderMenuAsFloatingClickBtn));
            renderMenuAsFloatingClickBtn();
        }
        getActionArg() {
            return undefined;
        }
        isVisible() {
            return true;
        }
    };
    exports.AbstractFloatingClickMenu = AbstractFloatingClickMenu;
    exports.AbstractFloatingClickMenu = AbstractFloatingClickMenu = __decorate([
        __param(1, actions_1.IMenuService),
        __param(2, contextkey_1.IContextKeyService)
    ], AbstractFloatingClickMenu);
    let FloatingClickMenu = class FloatingClickMenu extends AbstractFloatingClickMenu {
        constructor(options, instantiationService, menuService, contextKeyService) {
            super(options.menuId, menuService, contextKeyService);
            this.options = options;
            this.instantiationService = instantiationService;
            this.render();
        }
        createWidget(action, disposable) {
            const w = this.instantiationService.createInstance(FloatingClickWidget, action.label);
            const node = w.getDomNode();
            this.options.container.appendChild(node);
            disposable.add((0, lifecycle_1.toDisposable)(() => this.options.container.removeChild(node)));
            return w;
        }
        getActionArg() {
            return this.options.getActionArg();
        }
    };
    exports.FloatingClickMenu = FloatingClickMenu;
    exports.FloatingClickMenu = FloatingClickMenu = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService)
    ], FloatingClickMenu);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxvYXRpbmdNZW51LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY3Rpb25zL2Jyb3dzZXIvZmxvYXRpbmdNZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWFoRyxNQUFhLG1CQUFvQixTQUFRLGVBQU07UUFPOUMsWUFBb0IsS0FBYTtZQUNoQyxLQUFLLEVBQUUsQ0FBQztZQURXLFVBQUssR0FBTCxLQUFLLENBQVE7WUFMaEIsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3ZELFlBQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztZQU90QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUEsT0FBQyxFQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztZQUN6QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUNsQyxDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUEsZUFBUyxFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBQSx3Q0FBd0IsRUFBQyxnQ0FBZ0IsRUFBRSxJQUFBLDZCQUFh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