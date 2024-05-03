/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/globalPointerMoveMonitor", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/base/common/themables", "vs/base/browser/dom"], function (require, exports, globalPointerMoveMonitor_1, widget_1, async_1, themables_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollbarArrow = exports.ARROW_IMG_SIZE = void 0;
    /**
     * The arrow image size.
     */
    exports.ARROW_IMG_SIZE = 11;
    class ScrollbarArrow extends widget_1.Widget {
        constructor(opts) {
            super();
            this._onActivate = opts.onActivate;
            this.bgDomNode = document.createElement('div');
            this.bgDomNode.className = 'arrow-background';
            this.bgDomNode.style.position = 'absolute';
            this.bgDomNode.style.width = opts.bgWidth + 'px';
            this.bgDomNode.style.height = opts.bgHeight + 'px';
            if (typeof opts.top !== 'undefined') {
                this.bgDomNode.style.top = '0px';
            }
            if (typeof opts.left !== 'undefined') {
                this.bgDomNode.style.left = '0px';
            }
            if (typeof opts.bottom !== 'undefined') {
                this.bgDomNode.style.bottom = '0px';
            }
            if (typeof opts.right !== 'undefined') {
                this.bgDomNode.style.right = '0px';
            }
            this.domNode = document.createElement('div');
            this.domNode.className = opts.className;
            this.domNode.classList.add(...themables_1.ThemeIcon.asClassNameArray(opts.icon));
            this.domNode.style.position = 'absolute';
            this.domNode.style.width = exports.ARROW_IMG_SIZE + 'px';
            this.domNode.style.height = exports.ARROW_IMG_SIZE + 'px';
            if (typeof opts.top !== 'undefined') {
                this.domNode.style.top = opts.top + 'px';
            }
            if (typeof opts.left !== 'undefined') {
                this.domNode.style.left = opts.left + 'px';
            }
            if (typeof opts.bottom !== 'undefined') {
                this.domNode.style.bottom = opts.bottom + 'px';
            }
            if (typeof opts.right !== 'undefined') {
                this.domNode.style.right = opts.right + 'px';
            }
            this._pointerMoveMonitor = this._register(new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor());
            this._register(dom.addStandardDisposableListener(this.bgDomNode, dom.EventType.POINTER_DOWN, (e) => this._arrowPointerDown(e)));
            this._register(dom.addStandardDisposableListener(this.domNode, dom.EventType.POINTER_DOWN, (e) => this._arrowPointerDown(e)));
            this._pointerdownRepeatTimer = this._register(new dom.WindowIntervalTimer());
            this._pointerdownScheduleRepeatTimer = this._register(new async_1.TimeoutTimer());
        }
        _arrowPointerDown(e) {
            if (!e.target || !(e.target instanceof Element)) {
                return;
            }
            const scheduleRepeater = () => {
                this._pointerdownRepeatTimer.cancelAndSet(() => this._onActivate(), 1000 / 24, dom.getWindow(e));
            };
            this._onActivate();
            this._pointerdownRepeatTimer.cancel();
            this._pointerdownScheduleRepeatTimer.cancelAndSet(scheduleRepeater, 200);
            this._pointerMoveMonitor.startMonitoring(e.target, e.pointerId, e.buttons, (pointerMoveData) => { }, () => {
                this._pointerdownRepeatTimer.cancel();
                this._pointerdownScheduleRepeatTimer.cancel();
            });
            e.preventDefault();
        }
    }
    exports.ScrollbarArrow = ScrollbarArrow;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYmFyQXJyb3cuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zY3JvbGxiYXIvc2Nyb2xsYmFyQXJyb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHOztPQUVHO0lBQ1UsUUFBQSxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBZ0JqQyxNQUFhLGNBQWUsU0FBUSxlQUFNO1FBU3pDLFlBQVksSUFBMkI7WUFDdEMsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFFbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLGtCQUFrQixDQUFDO1lBQzlDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7WUFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUNuRCxJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztZQUNsQyxDQUFDO1lBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxL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