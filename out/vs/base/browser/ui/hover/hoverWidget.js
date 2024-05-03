/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/lifecycle", "vs/nls", "vs/css!./hoverWidget"], function (require, exports, dom, keyboardEvent_1, scrollableElement_1, lifecycle_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverAction = exports.HoverWidget = exports.HoverPosition = void 0;
    exports.getHoverAccessibleViewHint = getHoverAccessibleViewHint;
    const $ = dom.$;
    var HoverPosition;
    (function (HoverPosition) {
        HoverPosition[HoverPosition["LEFT"] = 0] = "LEFT";
        HoverPosition[HoverPosition["RIGHT"] = 1] = "RIGHT";
        HoverPosition[HoverPosition["BELOW"] = 2] = "BELOW";
        HoverPosition[HoverPosition["ABOVE"] = 3] = "ABOVE";
    })(HoverPosition || (exports.HoverPosition = HoverPosition = {}));
    class HoverWidget extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.containerDomNode = document.createElement('div');
            this.containerDomNode.className = 'monaco-hover';
            this.containerDomNode.tabIndex = 0;
            this.containerDomNode.setAttribute('role', 'tooltip');
            this.contentsDomNode = document.createElement('div');
            this.contentsDomNode.className = 'monaco-hover-content';
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.contentsDomNode, {
                consumeMouseWheelIfScrollbarIsNeeded: true
            }));
            this.containerDomNode.appendChild(this.scrollbar.getDomNode());
        }
        onContentsChanged() {
            this.scrollbar.scanDomNode();
        }
    }
    exports.HoverWidget = HoverWidget;
    class HoverAction extends lifecycle_1.Disposable {
        static render(parent, actionOptions, keybindingLabel) {
            return new HoverAction(parent, actionOptions, keybindingLabel);
        }
        constructor(parent, actionOptions, keybindingLabel) {
            super();
            this.actionContainer = dom.append(parent, $('div.action-container'));
            this.actionContainer.setAttribute('tabindex', '0');
            this.action = dom.append(this.actionContainer, $('a.action'));
            this.action.setAttribute('role', 'button');
            if (actionOptions.iconClass) {
                dom.append(this.action, $(`span.icon.${actionOptions.iconClass}`));
            }
            const label = dom.append(this.action, $('span'));
            label.textContent = keybindingLabel ? `${actionOptions.label} (${keybindingLabel})` : actionOptions.label;
            this._register(dom.addDisposableListener(this.actionContainer, dom.EventType.CLICK, e => {
                e.stopPropagation();
                e.preventDefault();
                actionOptions.run(this.actionContainer);
            }));
            this._register(dom.addDisposableListener(this.actionContainer, dom.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    e.stopPropagation();
                    e.preventDefault();
                    actionOptions.run(this.actionContainer);
                }
            }));
            this.setEnabled(true);
        }
        setEnabled(enabled) {
            if (enabled) {
                this.actionContainer.classList.remove('disabled');
                this.actionContainer.removeAttribute('aria-disabled');
            }
            else {
                this.actionContainer.classList.add('disabled');
                this.actionContainer.setAttribute('aria-disabled', 'true');
            }
        }
    }
    exports.HoverAction = HoverAction;
    function getHoverAccessibleViewHint(shouldHaveHint, keybinding) {
        return shouldHaveHint && keybinding ? (0, nls_1.localize)('acessibleViewHint', "Inspect this in the accessible view with {0}.", keybinding) : shouldHaveHint ? (0, nls_1.localize)('acessibleViewHintNoKbOpen', "Inspect this in the accessible view via the command Open Accessible View which is currently not triggerable via keybinding.") : '';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9ob3Zlci9ob3ZlcldpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErRmhHLGdFQUVDO0lBdkZELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsSUFBa0IsYUFFakI7SUFGRCxXQUFrQixhQUFhO1FBQzlCLGlEQUFJLENBQUE7UUFBRSxtREFBSyxDQUFBO1FBQUUsbURBQUssQ0FBQTtRQUFFLG1EQUFLLENBQUE7SUFDMUIsQ0FBQyxFQUZpQixhQUFhLDZCQUFiLGFBQWEsUUFFOUI7SUFFRCxNQUFhLFdBQVksU0FBUSxzQkFBVTtRQU0xQztZQUNDLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsR0FBRyxjQUFjLENBQUM7WUFDakQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxHQUFHLHNCQUFzQixDQUFDO1lBRXhELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdDQUFvQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQzlFLG9DQUFvQyxFQUFFLElBQUk7YUFDMUMsQ0FBQyxDQUFD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