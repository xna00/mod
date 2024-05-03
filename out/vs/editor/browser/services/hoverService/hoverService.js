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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/platform/hover/browser/hover", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/editor/browser/services/hoverService/hoverWidget", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/base/browser/keyboardEvent", "vs/platform/accessibility/common/accessibility", "vs/platform/layout/browser/layoutService", "vs/base/browser/window", "vs/platform/contextview/browser/contextViewService"], function (require, exports, extensions_1, themeService_1, colorRegistry_1, hover_1, contextView_1, instantiation_1, hoverWidget_1, lifecycle_1, dom_1, keybinding_1, keyboardEvent_1, accessibility_1, layoutService_1, window_1, contextViewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverService = void 0;
    let HoverService = class HoverService extends lifecycle_1.Disposable {
        constructor(_instantiationService, contextMenuService, _keybindingService, _layoutService, _accessibilityService) {
            super();
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._layoutService = _layoutService;
            this._accessibilityService = _accessibilityService;
            contextMenuService.onDidShowContextMenu(() => this.hideHover());
            this._contextViewHandler = this._register(new contextViewService_1.ContextViewHandler(this._layoutService));
        }
        showHover(options, focus, skipLastFocusedUpdate) {
            if (getHoverOptionsIdentity(this._currentHoverOptions) === getHoverOptionsIdentity(options)) {
                return undefined;
            }
            if (this._currentHover && this._currentHoverOptions?.persistence?.sticky) {
                return undefined;
            }
            this._currentHoverOptions = options;
            this._lastHoverOptions = options;
            const trapFocus = options.trapFocus || this._accessibilityService.isScreenReaderOptimized();
            const activeElement = (0, dom_1.getActiveElement)();
            // HACK, remove this check when #189076 is fixed
            if (!skipLastFocusedUpdate) {
                if (trapFocus && activeElement) {
                    this._lastFocusedElementBeforeOpen = activeElement;
                }
                else {
                    this._lastFocusedElementBeforeOpen = undefined;
                }
            }
            const hoverDisposables = new lifecycle_1.DisposableStore();
            const hover = this._instantiationService.createInstance(hoverWidget_1.HoverWidget, options);
            if (options.persistence?.sticky) {
                hover.isLocked = true;
            }
            hover.onDispose(() => {
                const hoverWasFocused = this._currentHover?.domNode && (0, dom_1.isAncestorOfActiveElement)(this._currentHover.domNode);
                if (hoverWasFocused) {
                    // Required to handle cases such as closing the hover with the escape key
                    this._lastFocusedElementBeforeOpen?.focus();
                }
                // Only clear the current options if it's the current hover, the current options help
                // reduce flickering when the same hover is shown multiple times
                if (this._currentHoverOptions === options) {
                    this._currentHoverOptions = undefined;
                }
                hoverDisposables.dispose();
            });
            // Set the container explicitly to enable aux window support
            if (!options.container) {
                const targetElement = options.target instanceof HTMLElement ? options.target : options.target.targetElements[0];
                options.container = this._layoutService.getContainer((0, dom_1.getWindow)(targetElement));
            }
            this._contextViewHandler.showContextView(new HoverContextViewDelegate(hover, focus), options.container);
            hover.onRequestLayout(() => this._contextViewHandler.layout());
            if (options.persistence?.sticky) {
                hoverDisposables.add((0, dom_1.addDisposableListener)((0, dom_1.getWindow)(options.container).document, dom_1.EventType.MOUSE_DOWN, e => {
                    if (!(0, dom_1.isAncestor)(e.target, hover.domNode)) {
                        this.doHideHover();
                    }
                }));
            }
            else {
                if ('targetElements' in options.target) {
                    for (const element of options.target.targetElements) {
                        hoverDisposables.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.CLICK, () => this.hideHover()));
                    }
                }
                else {
                    hoverDisposables.add((0, dom_1.addDisposableListener)(options.target, dom_1.EventType.CLICK, () => this.hideHover()));
                }
                const focusedElement = (0, dom_1.getActiveElement)();
                if (focusedElement) {
                    const focusedElementDocument = (0, dom_1.getWindow)(focusedElement).document;
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElement, dom_1.EventType.KEY_DOWN, e => this._keyDown(e, hover, !!options.persistence?.hideOnKeyDown)));
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElementDocument, dom_1.EventType.KEY_DOWN, e => this._keyDown(e, hover, !!options.persistence?.hideOnKeyDown)));
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElement, dom_1.EventType.KEY_UP, e => this._keyUp(e, hover)));
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElementDocument, dom_1.EventType.KEY_UP, e => this._keyUp(e, hover)));
                }
            }
            if ('IntersectionObserver' in window_1.mainWindow) {
                const observer = new IntersectionObserver(e => this._intersectionChange(e, hover), { threshold: 0 });
                const firstTargetElement = 'targetElements' in options.target ? options.target.targetElements[0] : options.target;
                observer.observe(firstTargetElement);
                hoverDisposables.add((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
            }
            this._currentHover = hover;
            return hover;
        }
        hideHover() {
            if (this._currentHover?.isLocked || !this._currentHoverOptions) {
                return;
            }
            this.doHideHover();
        }
        doHideHover() {
            this._currentHover = undefined;
            this._currentHoverOptions = undefined;
            this._contextViewHandler.hideContextView();
        }
        _intersectionChange(entries, hover) {
            const entry = entries[entries.length - 1];
            if (!entry.isIntersecting) {
                hover.dispose();
            }
        }
        showAndFocusLastHover() {
            if (!this._lastHoverOptions) {
                return;
            }
            this.showHover(this._lastHoverOptions, true, true);
        }
        _keyDown(e, hover, hideOnKeyDown) {
            if (e.key === 'Alt') {
                hover.isLocked = true;
                return;
            }
            const event = new keyboardEvent_1.StandardKeyboardEvent(e);
            const keybinding = this._keybindingService.resolveKeyboardEvent(event);
            if (keybinding.getSingleModifierDispatchChords().some(value => !!value) || this._keybindingService.softDispatch(event, event.target).kind !== 0 /* ResultKind.NoMatchingKb */) {
                return;
            }
            if (hideOnKeyDown && (!this._currentHoverOptions?.trapFocus || e.key !== 'Tab')) {
                this.hideHover();
                this._lastFocusedElementBeforeOpen?.focus();
            }
        }
        _keyUp(e, hover) {
            if (e.key === 'Alt') {
                hover.isLocked = false;
                // Hide if alt is released while the mouse is not over hover/target
                if (!hover.isMouseIn) {
                    this.hideHover();
                    this._lastFocusedElementBeforeOpen?.focus();
                }
            }
        }
    };
    exports.HoverService = HoverService;
    exports.HoverService = HoverService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, accessibility_1.IAccessibilityService)
    ], HoverService);
    function getHoverOptionsIdentity(options) {
        if (options === undefined) {
            return undefined;
        }
        return options?.id ?? options;
    }
    class HoverContextViewDelegate {
        get anchorPosition() {
            return this._hover.anchor;
        }
        constructor(_hover, _focus = false) {
            this._hover = _hover;
            this._focus = _focus;
            // Render over all other context views
            this.layer = 1;
        }
        render(container) {
            this._hover.render(container);
            if (this._focus) {
                this._hover.focus();
            }
            return this._hover;
        }
        getAnchor() {
            return {
                x: this._hover.x,
                y: this._hover.y
            };
        }
        layout() {
            this._hover.layout();
        }
    }
    (0, extensions_1.registerSingleton)(hover_1.IHoverService, HoverService, 1 /* InstantiationType.Delayed */);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-workbench .workbench-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9zZXJ2aWNlcy9ob3ZlclNlcnZpY2UvaG92ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCekYsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBYSxTQUFRLHNCQUFVO1FBVTNDLFlBQ3lDLHFCQUE0QyxFQUMvRCxrQkFBdUMsRUFDdkIsa0JBQXNDLEVBQzFDLGNBQThCLEVBQ3ZCLHFCQUE0QztZQUVwRixLQUFLLEVBQUUsQ0FBQztZQU5nQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBRS9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDMUMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3ZCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFJcEYsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsU0FBUyxDQUFDLE9BQXNCLEVBQUUsS0FBZSxFQUFFLHFCQUErQjtZQUNqRixJQUFJLHVCQUF1QixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzdGLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUs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