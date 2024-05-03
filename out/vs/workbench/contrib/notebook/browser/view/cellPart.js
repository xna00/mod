/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, DOM, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellPartsCollection = exports.CellOverlayPart = exports.CellContentPart = void 0;
    /**
     * A content part is a non-floating element that is rendered inside a cell.
     * The rendering of the content part is synchronous to avoid flickering.
     */
    class CellContentPart extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.cellDisposables = new lifecycle_1.DisposableStore();
        }
        /**
         * Prepare model for cell part rendering
         * No DOM operations recommended within this operation
         */
        prepareRenderCell(element) { }
        /**
         * Update the DOM for the cell `element`
         */
        renderCell(element) {
            this.currentCell = element;
            safeInvokeNoArg(() => this.didRenderCell(element));
        }
        didRenderCell(element) { }
        /**
         * Dispose any disposables generated from `didRenderCell`
         */
        unrenderCell(element) {
            this.currentCell = undefined;
            this.cellDisposables.clear();
        }
        /**
         * Perform DOM read operations to prepare for the list/cell layout update.
         */
        prepareLayout() { }
        /**
         * Update internal DOM (top positions) per cell layout info change
         * Note that a cell part doesn't need to call `DOM.scheduleNextFrame`,
         * the list view will ensure that layout call is invoked in the right frame
         */
        updateInternalLayoutNow(element) { }
        /**
         * Update per cell state change
         */
        updateState(element, e) { }
        /**
         * Update per execution state change.
         */
        updateForExecutionState(element, e) { }
    }
    exports.CellContentPart = CellContentPart;
    /**
     * An overlay part renders on top of other components.
     * The rendering of the overlay part might be postponed to the next animation frame to avoid forced reflow.
     */
    class CellOverlayPart extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.cellDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        /**
         * Prepare model for cell part rendering
         * No DOM operations recommended within this operation
         */
        prepareRenderCell(element) { }
        /**
         * Update the DOM for the cell `element`
         */
        renderCell(element) {
            this.currentCell = element;
            this.didRenderCell(element);
        }
        didRenderCell(element) { }
        /**
         * Dispose any disposables generated from `didRenderCell`
         */
        unrenderCell(element) {
            this.currentCell = undefined;
            this.cellDisposables.clear();
        }
        /**
         * Update internal DOM (top positions) per cell layout info change
         * Note that a cell part doesn't need to call `DOM.scheduleNextFrame`,
         * the list view will ensure that layout call is invoked in the right frame
         */
        updateInternalLayoutNow(element) { }
        /**
         * Update per cell state change
         */
        updateState(element, e) { }
        /**
         * Update per execution state change.
         */
        updateForExecutionState(element, e) { }
    }
    exports.CellOverlayPart = CellOverlayPart;
    function safeInvokeNoArg(func) {
        try {
            return func();
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
            return null;
        }
    }
    class CellPartsCollection extends lifecycle_1.Disposable {
        constructor(targetWindow, contentParts, overlayParts) {
            super();
            this.targetWindow = targetWindow;
            this.contentParts = contentParts;
            this.overlayParts = overlayParts;
            this._scheduledOverlayRendering = this._register(new lifecycle_1.MutableDisposable());
            this._scheduledOverlayUpdateState = this._register(new lifecycle_1.MutableDisposable());
            this._scheduledOverlayUpdateExecutionState = this._register(new lifecycle_1.MutableDisposable());
        }
        concatContentPart(other, targetWindow) {
            return new CellPartsCollection(targetWindow, this.contentParts.concat(other), this.overlayParts);
        }
        concatOverlayPart(other, targetWindow) {
            return new CellPartsCollection(targetWindow, this.contentParts, this.overlayParts.concat(other));
        }
        scheduleRenderCell(element) {
            // prepare model
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.prepareRenderCell(element));
            }
            for (const part of this.overlayParts) {
                safeInvokeNoArg(() => part.prepareRenderCell(element));
            }
            // render content parts
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.renderCell(element));
            }
            this._scheduledOverlayRendering.value = DOM.modify(this.targetWindow, () => {
                for (const part of this.overlayParts) {
                    safeInvokeNoArg(() => part.renderCell(element));
                }
            });
        }
        unrenderCell(element) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.unrenderCell(element));
            }
            this._scheduledOverlayRendering.value = undefined;
            this._scheduledOverlayUpdateState.value = undefined;
            this._scheduledOverlayUpdateExecutionState.value = undefined;
            for (const part of this.overlayParts) {
                safeInvokeNoArg(() => part.unrenderCell(element));
            }
        }
        updateInternalLayoutNow(viewCell) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.updateInternalLayoutNow(viewCell));
            }
            for (const part of this.overlayParts) {
                safeInvokeNoArg(() => part.updateInternalLayoutNow(viewCell));
            }
        }
        prepareLayout() {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.prepareLayout());
            }
        }
        updateState(viewCell, e) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.updateState(viewCell, e));
            }
            this._scheduledOverlayUpdateState.value = DOM.modify(this.targetWindow, () => {
                for (const part of this.overlayParts) {
                    safeInvokeNoArg(() => part.updateState(viewCell, e));
                }
            });
        }
        updateForExecutionState(viewCell, e) {
            for (const part of this.contentParts) {
                safeInvokeNoArg(() => part.updateForExecutionState(viewCell, e));
            }
            this._scheduledOverlayUpdateExecutionState.value = DOM.modify(this.targetWindow, () => {
                for (const part of this.overlayParts) {
                    safeInvokeNoArg(() => part.updateForExecutionState(viewCell, e));
                }
            });
        }
    }
    exports.CellPartsCollection = CellPartsCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFBhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEc7OztPQUdHO0lBQ0gsTUFBc0IsZUFBZ0IsU0FBUSxzQkFBVTtRQUl2RDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBSEMsb0JBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUlsRCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsaUJBQWlCLENBQUMsT0FBdUIsSUFBVSxDQUFDO1FBRXBEOztXQUVHO1FBQ0gsVUFBVSxDQUFDLE9BQXVCO1lBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDO1lBQzNCLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUF1QixJQUFVLENBQUM7UUFFaEQ7O1dBRUc7UUFDSCxZQUFZLENBQUMsT0FBdUI7WUFDbkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7WUFDN0IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRUQ7O1dBRUc7UUFDSCxhQUFhLEtBQVcsQ0FBQztRQUV6Qjs7OztXQUlHO1FBQ0gsdUJBQXVCLENBQUMsT0FBdUIsSUFBVSxDQUFDO1FBRTFEOztXQUVHO1FBQ0gsV0FBVyxDQUFDLE9BQXVCLEVBQUUsQ0FBZ0MsSUFBVSxDQUFDO1FBRWhGOztXQUVHO1FBQ0gsdUJBQXVCLENBQUMsT0FBdUIsRUFBRSxDQUFrQyxJQUFVLENBQUM7S0FDOUY7SUFyREQsMENBcURDO0lBRUQ7OztPQUdHO0lB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