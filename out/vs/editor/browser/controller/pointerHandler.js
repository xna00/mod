/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/browser/window", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/controller/mouseHandler", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/editorDom"], function (require, exports, canIUse_1, dom, touch_1, window_1, lifecycle_1, platform, mouseHandler_1, textAreaInput_1, editorDom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PointerHandler = exports.PointerEventHandler = void 0;
    /**
     * Currently only tested on iOS 13/ iPadOS.
     */
    class PointerEventHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this._register(touch_1.Gesture.addTarget(this.viewHelper.linesContentDomNode));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Tap, (e) => this.onTap(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Change, (e) => this.onChange(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Contextmenu, (e) => this._onContextMenu(new editorDom_1.EditorMouseEvent(e, false, this.viewHelper.viewDomNode), false)));
            this._lastPointerType = 'mouse';
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, 'pointerdown', (e) => {
                const pointerType = e.pointerType;
                if (pointerType === 'mouse') {
                    this._lastPointerType = 'mouse';
                    return;
                }
                else if (pointerType === 'touch') {
                    this._lastPointerType = 'touch';
                }
                else {
                    this._lastPointerType = 'pen';
                }
            }));
            // PonterEvents
            const pointerEvents = new editorDom_1.EditorPointerEventFactory(this.viewHelper.viewDomNode);
            this._register(pointerEvents.onPointerMove(this.viewHelper.viewDomNode, (e) => this._onMouseMove(e)));
            this._register(pointerEvents.onPointerUp(this.viewHelper.viewDomNode, (e) => this._onMouseUp(e)));
            this._register(pointerEvents.onPointerLeave(this.viewHelper.viewDomNode, (e) => this._onMouseLeave(e)));
            this._register(pointerEvents.onPointerDown(this.viewHelper.viewDomNode, (e, pointerId) => this._onMouseDown(e, pointerId)));
        }
        onTap(event) {
            if (!event.initialTarget || !this.viewHelper.linesContentDomNode.contains(event.initialTarget)) {
                return;
            }
            event.preventDefault();
            this.viewHelper.focusTextArea();
            this._dispatchGesture(event, /*inSelectionMode*/ false);
        }
        onChange(event) {
            if (this._lastPointerType === 'touch') {
                this._context.viewModel.viewLayout.deltaScrollNow(-event.translationX, -event.translationY);
            }
            if (this._lastPointerType === 'pen') {
                this._dispatchGesture(event, /*inSelectionMode*/ true);
            }
        }
        _dispatchGesture(event, inSelectionMode) {
            const target = this._createMouseTarget(new editorDom_1.EditorMouseEvent(event, false, this.viewHelper.viewDomNode), false);
            if (target.position) {
                this.viewController.dispatchMouse({
                    position: target.position,
                    mouseColumn: target.position.column,
                    startedOnLineNumbers: false,
                    revealType: 1 /* NavigationCommandRevealType.Minimal */,
                    mouseDownCount: event.tapCount,
                    inSelectionMode,
                    altKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    shiftKey: false,
                    leftButton: false,
                    middleButton: false,
                    onInjectedText: target.type === 6 /* MouseTargetType.CONTENT_TEXT */ && target.detail.injectedText !== null
                });
            }
        }
        _onMouseDown(e, pointerId) {
            if (e.browserEvent.pointerType === 'touch') {
                return;
            }
            super._onMouseDown(e, pointerId);
        }
    }
    exports.PointerEventHandler = PointerEventHandler;
    class TouchHandler extends mouseHandler_1.MouseHandler {
        constructor(context, viewController, viewHelper) {
            super(context, viewController, viewHelper);
            this._register(touch_1.Gesture.addTarget(this.viewHelper.linesContentDomNode));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Tap, (e) => this.onTap(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Change, (e) => this.onChange(e)));
            this._register(dom.addDisposableListener(this.viewHelper.linesContentDomNode, touch_1.EventType.Contextmenu, (e) => this._onContextMenu(new editorDom_1.EditorMouseEvent(e, false, this.viewHelper.viewDomNode), false)));
        }
        onTap(event) {
            event.preventDefault();
            this.viewHelper.focusTextArea();
            const target = this._createMouseTarget(new editorDom_1.EditorMouseEvent(event, false, this.viewHelper.viewDomNode), false);
            if (target.position) {
                // Send the tap event also to the <textarea> (for input purposes)
                const event = document.createEvent('CustomEvent');
                event.initEvent(textAreaInput_1.TextAreaSyntethicEvents.Tap, false, true);
                this.viewHelper.dispatchTextAreaEvent(event);
                this.viewController.moveTo(target.position, 1 /* NavigationCommandRevealType.Minimal */);
            }
        }
        onChange(e) {
            this._context.viewModel.viewLayout.deltaScrollNow(-e.translationX, -e.translationY);
        }
    }
    class PointerHandler extends lifecycle_1.Disposable {
        constructor(context, viewController, viewHelper) {
            super();
            const isPhone = platform.isIOS || (platform.isAndroid && platform.isMobile);
            if (isPhone && canIUse_1.BrowserFeatures.pointerEvents) {
                this.handler = this._register(new PointerEventHandler(context, viewController, viewHelper));
            }
            else if (window_1.mainWindow.TouchEvent) {
                this.handler = this._register(new TouchHandler(context, viewController, viewHelper));
            }
            else {
                this.handler = this._register(new mouseHandler_1.MouseHandler(context, viewController, viewHelper));
            }
        }
        getTargetAtClientPoint(clientX, clientY) {
            return this.handler.getTargetAtClientPoint(clientX, clientY);
        }
    }
    exports.PointerHandler = PointerHandler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9pbnRlckhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbnRyb2xsZXIvcG9pbnRlckhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRzs7T0FFRztJQUNILE1BQWEsbUJBQW9CLFNBQVEsMkJBQVk7UUFFcEQsWUFBWSxPQUFvQixFQUFFLGNBQThCLEVBQUUsVUFBaUM7WUFDbEcsS0FBSyxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsaUJBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BILElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsaUJBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFILElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsaUJBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFD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