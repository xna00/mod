/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/globalPointerMoveMonitor", "vs/base/browser/mouseEvent", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/theme/common/colorRegistry"], function (require, exports, dom, globalPointerMoveMonitor_1, mouseEvent_1, async_1, lifecycle_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicCssRules = exports.GlobalEditorPointerMoveMonitor = exports.EditorPointerEventFactory = exports.EditorMouseEventFactory = exports.EditorMouseEvent = exports.CoordinatesRelativeToEditor = exports.EditorPagePosition = exports.ClientCoordinates = exports.PageCoordinates = void 0;
    exports.createEditorPagePosition = createEditorPagePosition;
    exports.createCoordinatesRelativeToEditor = createCoordinatesRelativeToEditor;
    /**
     * Coordinates relative to the whole document (e.g. mouse event's pageX and pageY)
     */
    class PageCoordinates {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this._pageCoordinatesBrand = undefined;
        }
        toClientCoordinates(targetWindow) {
            return new ClientCoordinates(this.x - targetWindow.scrollX, this.y - targetWindow.scrollY);
        }
    }
    exports.PageCoordinates = PageCoordinates;
    /**
     * Coordinates within the application's client area (i.e. origin is document's scroll position).
     *
     * For example, clicking in the top-left corner of the client area will
     * always result in a mouse event with a client.x value of 0, regardless
     * of whether the page is scrolled horizontally.
     */
    class ClientCoordinates {
        constructor(clientX, clientY) {
            this.clientX = clientX;
            this.clientY = clientY;
            this._clientCoordinatesBrand = undefined;
        }
        toPageCoordinates(targetWindow) {
            return new PageCoordinates(this.clientX + targetWindow.scrollX, this.clientY + targetWindow.scrollY);
        }
    }
    exports.ClientCoordinates = ClientCoordinates;
    /**
     * The position of the editor in the page.
     */
    class EditorPagePosition {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this._editorPagePositionBrand = undefined;
        }
    }
    exports.EditorPagePosition = EditorPagePosition;
    /**
     * Coordinates relative to the the (top;left) of the editor that can be used safely with other internal editor metrics.
     * **NOTE**: This position is obtained by taking page coordinates and transforming them relative to the
     * editor's (top;left) position in a way in which scale transformations are taken into account.
     * **NOTE**: These coordinates could be negative if the mouse position is outside the editor.
     */
    class CoordinatesRelativeToEditor {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this._positionRelativeToEditorBrand = undefined;
        }
    }
    exports.CoordinatesRelativeToEditor = CoordinatesRelativeToEditor;
    function createEditorPagePosition(editorViewDomNode) {
        const editorPos = dom.getDomNodePagePosition(editorViewDomNode);
        return new EditorPagePosition(editorPos.left, editorPos.top, editorPos.width, editorPos.height);
    }
    function createCoordinatesRelativeToEditor(editorViewDomNode, editorPagePosition, pos) {
        // The editor's page position is read from the DOM using getBoundingClientRect().
        //
        // getBoundingClientRect() returns the actual dimensions, while offsetWidth and offsetHeight
        // reflect the unscaled size. We can use this difference to detect a transform:scale()
        // and we will apply the transformation in inverse to get mouse coordinates that make sense inside the editor.
        //
        // This could be expanded to cover rotation as well maybe by walking the DOM up from `editorViewDomNode`
        // and computing the effective transformation matrix using getComputedStyle(element).transform.
        //
        const scaleX = editorPagePosition.width / editorViewDomNode.offsetWidth;
        const scaleY = editorPagePosition.height / editorViewDomNode.offsetHeight;
        // Adjust mouse offsets if editor appears to be scaled via transforms
        const relativeX = (pos.x - editorPagePosition.x) / scaleX;
        const relativeY = (pos.y - editorPagePosition.y) / scaleY;
        return new CoordinatesRelativeToEditor(relativeX, relativeY);
    }
    class EditorMouseEvent extends mouseEvent_1.StandardMouseEvent {
        constructor(e, isFromPointerCapture, editorViewDomNode) {
            super(dom.getWindow(editorViewDomNode), e);
            this._editorMouseEventBrand = undefined;
            this.isFromPointerCapture = isFromPointerCapture;
            this.pos = new PageCoordinates(this.posx, this.posy);
            this.editorPos = createEditorPagePosition(editorViewDomNode);
            this.relativePos = createCoordinatesRelativeToEditor(editorViewDomNode, this.editorPos, this.pos);
        }
    }
    exports.EditorMouseEvent = EditorMouseEvent;
    class EditorMouseEventFactory {
        constructor(editorViewDomNode) {
            this._editorViewDomNode = editorViewDomNode;
        }
        _create(e) {
            return new EditorMouseEvent(e, false, this._editorViewDomNode);
        }
        onContextMenu(target, callback) {
            return dom.addDisposableListener(target, 'contextmenu', (e) => {
                callback(this._create(e));
            });
        }
        onMouseUp(target, callback) {
            return dom.addDisposableListener(target, 'mouseup', (e) => {
                callback(this._create(e));
            });
        }
        onMouseDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.MOUSE_DOWN, (e) => {
                callback(this._create(e));
            });
        }
        onPointerDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_DOWN, (e) => {
                callback(this._create(e), e.pointerId);
            });
        }
        onMouseLeave(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.MOUSE_LEAVE, (e) => {
                callback(this._create(e));
            });
        }
        onMouseMove(target, callback) {
            return dom.addDisposableListener(target, 'mousemove', (e) => callback(this._create(e)));
        }
    }
    exports.EditorMouseEventFactory = EditorMouseEventFactory;
    class EditorPointerEventFactory {
        constructor(editorViewDomNode) {
            this._editorViewDomNode = editorViewDomNode;
        }
        _create(e) {
            return new EditorMouseEvent(e, false, this._editorViewDomNode);
        }
        onPointerUp(target, callback) {
            return dom.addDisposableListener(target, 'pointerup', (e) => {
                callback(this._create(e));
            });
        }
        onPointerDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_DOWN, (e) => {
                callback(this._create(e), e.pointerId);
            });
        }
        onPointerLeave(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_LEAVE, (e) => {
                callback(this._create(e));
            });
        }
        onPointerMove(target, callback) {
            return dom.addDisposableListener(target, 'pointermove', (e) => callback(this._create(e)));
        }
    }
    exports.EditorPointerEventFactory = EditorPointerEventFactory;
    class GlobalEditorPointerMoveMonitor extends lifecycle_1.Disposable {
        constructor(editorViewDomNode) {
            super();
            this._editorViewDomNode = editorViewDomNode;
            this._globalPointerMoveMonitor = this._register(new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor());
            this._keydownListener = null;
        }
        startMonitoring(initialElement, pointerId, initialButtons, pointerMoveCallback, onStopCallback) {
            // Add a <<capture>> keydown event listener that will cancel the monitoring
            // if something other than a modifier key is pressed
            this._keydownListener = dom.addStandardDisposableListener(initialElement.ownerDocument, 'keydown', (e) => {
                const chord = e.toKeyCodeChord();
                if (chord.isModifierKey()) {
                    // Allow modifier keys
                    return;
                }
                this._globalPointerMoveMonitor.stopMonitoring(true, e.browserEvent);
            }, true);
            this._globalPointerMoveMonitor.startMonitoring(initialElement, pointerId, initialButtons, (e) => {
                pointerMoveCallback(new EditorMouseEvent(e, true, this._editorViewDomNode));
            }, (e) => {
                this._keydownListener.dispose();
                onStopCallback(e);
            });
        }
        stopMonitoring() {
            this._globalPointerMoveMonitor.stopMonitoring(true);
        }
    }
    exports.GlobalEditorPointerMoveMonitor = GlobalEditorPointerMoveMonitor;
    /**
     * A helper to create dynamic css rules, bound to a class name.
     * Rules are reused.
     * Reference counting and delayed garbage collection ensure that no rules leak.
    */
    class DynamicCssRules {
        static { this._idPool = 0; }
        constructor(_editor) {
            this._editor = _editor;
            this._instanceId = ++DynamicCssRules._idPool;
            this._counter = 0;
            this._rules = new Map();
            // We delay garbage collection so that hanging rules can be reused.
            this._garbageCollectionScheduler = new async_1.RunOnceScheduler(() => this.garbageCollect(), 1000);
        }
        createClassNameRef(options) {
            const rule = this.getOrCreateRule(options);
            rule.increaseRefCount();
            return {
                className: rule.className,
                dispose: () => {
                    rule.decreaseRefCount();
                    this._garbageCollectionScheduler.schedule();
                }
            };
        }
        getOrCreateRule(properties) {
            const key = this.computeUniqueKey(properties);
            let existingRule = this._rules.get(key);
            if (!existingRule) {
                const counter = this._counter++;
                existingRule = new RefCountedCssRule(key, `dyn-rule-${this._instanceId}-${counter}`, dom.isInShadowDOM(this._editor.getContainerDomNode())
                    ? this._editor.getContainerDomNode()
                    : undefined, properties);
                this._rules.set(key, existingRule);
            }
            return existingRule;
        }
        computeUniqueKey(properties) {
            return JSON.stringify(properties);
        }
        garbageCollect() {
            for (const rule of this._rules.values()) {
                if (!rule.hasReferences()) {
                    this._rules.delete(rule.key);
                    rule.dispose();
                }
            }
        }
    }
    exports.DynamicCssRules = DynamicCssRules;
    class RefCountedCssRule {
        constructor(key, className, _containerElement, properties) {
            this.key = key;
            this.className = className;
            this.properties = properties;
            this._referenceCount = 0;
            this._styleElementDisposables = new lifecycle_1.DisposableStore();
            this._styleElement = dom.createStyleSheet(_containerElement, undefined, this._styleElementDisposables);
            this._styleElement.textContent = this.getCssText(this.className, this.properties);
        }
        getCssText(className, properties) {
            let str = `.${className} {`;
            for (const prop in properties) {
                const value = properties[prop];
                let cssValue;
                if (typeof value === 'object') {
                    cssValue = (0, colorRegistry_1.asCssVariable)(value.id);
                }
                else {
                    cssValue = value;
                }
                const cssPropName = camelToDashes(prop);
                str += `\n\t${cssPropName}: ${cssValue};`;
            }
            str += `\n}`;
            return str;
        }
        dispose() {
            this._styleElementDisposables.dispose();
            this._styleElement = undefined;
        }
        increaseRefCount() {
            this._referenceCount++;
        }
        decreaseRefCount() {
            this._referenceCount--;
        }
        hasReferences() {
            return this._referenceCount > 0;
        }
    }
    function camelToDashes(str) {
        return str.replace(/(^[A-Z])/, ([first]) => first.toLowerCase())
            .replace(/([A-Z])/g, ([letter]) => `-${letter.toLowerCase()}`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRG9tLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9lZGl0b3JEb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNEVoRyw0REFHQztJQUVELDhFQWlCQztJQXZGRDs7T0FFRztJQUNILE1BQWEsZUFBZTtRQUczQixZQUNpQixDQUFTLEVBQ1QsQ0FBUztZQURULE1BQUMsR0FBRCxDQUFDLENBQVE7WUFDVCxNQUFDLEdBQUQsQ0FBQyxDQUFRO1lBSjFCLDBCQUFxQixHQUFTLFNBQVMsQ0FBQztRQUtwQyxDQUFDO1FBRUUsbUJBQW1CLENBQUMsWUFBb0I7WUFDOUMsT0FBTyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1RixDQUFDO0tBQ0Q7SUFYRCwwQ0FXQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQWEsaUJBQWlCO1FBRzdCLFlBQ2lCLE9BQWUsRUFDZixPQUFlO1lBRGYsWUFBTyxHQUFQLE9BQU8sQ0FBUTtZQUNmLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFKaEMsNEJBQXVCLEdBQVMsU0FBUyxDQUFDO1FBS3RDLENBQUM7UUFFRSxpQkFBaUIsQ0FBQyxZQUFvQjtZQUM1QyxPQUFPLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0RyxDQUFDO0tBQ0Q7SUFYRCw4Q0FXQztJQUVEOztPQUVHO0lBQ0gsTUFBYSxrQkFBa0I7UUFHOUIsWUFDaUIsQ0FBUyxFQUNULENBQVMsRUFDVCxLQUFhLEVB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