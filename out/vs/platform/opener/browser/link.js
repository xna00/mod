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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./link"], function (require, exports, dom_1, event_1, keyboardEvent_1, touch_1, event_2, lifecycle_1, opener_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Link = void 0;
    let Link = class Link extends lifecycle_1.Disposable {
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            if (enabled) {
                this.el.setAttribute('aria-disabled', 'false');
                this.el.tabIndex = 0;
                this.el.style.pointerEvents = 'auto';
                this.el.style.opacity = '1';
                this.el.style.cursor = 'pointer';
                this._enabled = false;
            }
            else {
                this.el.setAttribute('aria-disabled', 'true');
                this.el.tabIndex = -1;
                this.el.style.pointerEvents = 'none';
                this.el.style.opacity = '0.4';
                this.el.style.cursor = 'default';
                this._enabled = true;
            }
            this._enabled = enabled;
        }
        set link(link) {
            if (typeof link.label === 'string') {
                this.el.textContent = link.label;
            }
            else {
                (0, dom_1.clearNode)(this.el);
                this.el.appendChild(link.label);
            }
            this.el.href = link.href;
            if (typeof link.tabIndex !== 'undefined') {
                this.el.tabIndex = link.tabIndex;
            }
            this.setTooltip(link.title);
            this._link = link;
        }
        constructor(container, _link, options = {}, openerService) {
            super();
            this._link = _link;
            this._enabled = true;
            this.el = (0, dom_1.append)(container, (0, dom_1.$)('a.monaco-link', {
                tabIndex: _link.tabIndex ?? 0,
                href: _link.href,
            }, _link.label));
            this.hoverDelegate = options.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse');
            this.setTooltip(_link.title);
            this.el.setAttribute('role', 'button');
            const onClickEmitter = this._register(new event_1.DomEmitter(this.el, 'click'));
            const onKeyPress = this._register(new event_1.DomEmitter(this.el, 'keypress'));
            const onEnterPress = event_2.Event.chain(onKeyPress.event, $ => $.map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => e.keyCode === 3 /* KeyCode.Enter */));
            const onTap = this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Tap)).event;
            this._register(touch_1.Gesture.addTarget(this.el));
            const onOpen = event_2.Event.any(onClickEmitter.event, onEnterPress, onTap);
            this._register(onOpen(e => {
                if (!this.enabled) {
                    return;
                }
                dom_1.EventHelper.stop(e, true);
                if (options?.opener) {
                    options.opener(this._link.href);
                }
                else {
                    openerService.open(this._link.href, { allowCommands: true });
                }
            }));
            this.enabled = true;
        }
        setTooltip(title) {
            if (this.hoverDelegate.showNativeHover) {
                this.el.title = title ?? '';
            }
            else if (!this.hover && title) {
                this.hover = this._register((0, updatableHoverWidget_1.setupCustomHover)(this.hoverDelegate, this.el, title));
            }
            else if (this.hover) {
                this.hover.update(title);
            }
        }
    };
    exports.Link = Link;
    exports.Link = Link = __decorate([
        __param(3, opener_1.IOpenerService)
    ], Link);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vb3BlbmVyL2Jyb3dzZXIvbGluay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0QnpGLElBQU0sSUFBSSxHQUFWLE1BQU0sSUFBSyxTQUFRLHNCQUFVO1FBUW5DLElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBSSxPQUFPLENBQUMsT0FBZ0I7WUFDM0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQztnQkFDckMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDdkIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9B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