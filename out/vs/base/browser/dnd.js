/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/mime"], function (require, exports, dom_1, lifecycle_1, mime_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTransfers = exports.DelayedDragHandler = void 0;
    exports.applyDragImage = applyDragImage;
    /**
     * A helper that will execute a provided function when the provided HTMLElement receives
     *  dragover event for 800ms. If the drag is aborted before, the callback will not be triggered.
     */
    class DelayedDragHandler extends lifecycle_1.Disposable {
        constructor(container, callback) {
            super();
            this._register((0, dom_1.addDisposableListener)(container, 'dragover', e => {
                e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
                if (!this.timeout) {
                    this.timeout = setTimeout(() => {
                        callback();
                        this.timeout = null;
                    }, 800);
                }
            }));
            ['dragleave', 'drop', 'dragend'].forEach(type => {
                this._register((0, dom_1.addDisposableListener)(container, type, () => {
                    this.clearDragTimeout();
                }));
            });
        }
        clearDragTimeout() {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        }
        dispose() {
            super.dispose();
            this.clearDragTimeout();
        }
    }
    exports.DelayedDragHandler = DelayedDragHandler;
    // Common data transfers
    exports.DataTransfers = {
        /**
         * Application specific resource transfer type
         */
        RESOURCES: 'ResourceURLs',
        /**
         * Browser specific transfer type to download
         */
        DOWNLOAD_URL: 'DownloadURL',
        /**
         * Browser specific transfer type for files
         */
        FILES: 'Files',
        /**
         * Typically transfer type for copy/paste transfers.
         */
        TEXT: mime_1.Mimes.text,
        /**
         * Internal type used to pass around text/uri-list data.
         *
         * This is needed to work around https://bugs.chromium.org/p/chromium/issues/detail?id=239745.
         */
        INTERNAL_URI_LIST: 'application/vnd.code.uri-list',
    };
    function applyDragImage(event, label, clazz, backgroundColor, foregroundColor) {
        const dragImage = document.createElement('div');
        dragImage.className = clazz;
        dragImage.textContent = label;
        if (foregroundColor) {
            dragImage.style.color = foregroundColor;
        }
        if (backgroundColor) {
            dragImage.style.background = backgroundColor;
        }
        if (event.dataTransfer) {
            const ownerDocument = (0, dom_1.getWindow)(event).document;
            ownerDocument.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, -10, -10);
            // Removes the element when the DND operation is done
            setTimeout(() => ownerDocument.body.removeChild(dragImage), 0);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvZG5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdGaEcsd0NBcUJDO0lBL0ZEOzs7T0FHRztJQUNILE1BQWEsa0JBQW1CLFNBQVEsc0JBQVU7UUFHakQsWUFBWSxTQUFzQixFQUFFLFFBQW9CO1lBQ3ZELEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9ELENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLHFIQUFxSDtnQkFFekksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO3dCQUM5QixRQUFRLEVBQUUsQ0FBQzt3QkFFWCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDckIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNULENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO29CQUMxRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLGdCQUFnQjtZQUN2QixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDckIsQ0FBQztRQUNGLENBQUM7UUFFUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWhCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3pCLENBQUM7S0FDRDtJQXJDRCxnREFxQ0M7SUFFRCx3QkFBd0I7SUFDWCxRQUFBLGFBQWEsR0FBRztRQUU1Qjs7V0FFRztRQUNILFNBQVMsRUFBRSxjQUFjO1FBRXpCOztXQUVHO1FBQ0gsWUFBWSxFQUFFLGFBQWE7UUFFM0I7O1dBRUc7UUFDSCxLQUFLLEVBQUUsT0FBTztRQUVkOztXQUVHO1FBQ0gsSUFBSSxFQUFFLFlBQUssQ0FBQyxJQUFJO1FBRWhCOzs7O1dBSUc7UUFDSCxpQkFBaUIsRUFBRSwrQkFBK0I7S0FDbEQsQ0FBQztJQUVGLFNBQWdCLGNBQWMsQ0FBQyxLQUFnQixFQUFFLEtBQW9CLEVBQUUsS0FBYSxFQUFFLGVBQStCLEVBQUUsZUFBK0I7UUFDckosTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxTQUFTLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUM1QixTQUFTLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUU5QixJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGVBQWUsQ0FBQztRQUN6QyxDQUFDO1FBRUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUNyQixTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUM7UUFDOUMsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3hCLE1BQU0sYUFBYSxHQUFHLElBQUEsZUFBUyxFQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUNoRCxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxQyxLQUFLLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVyRCxxREFBcUQ7WUFDckQsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7SUFDRixDQUFDIn0=