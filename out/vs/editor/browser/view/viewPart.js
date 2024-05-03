/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/viewEventHandler"], function (require, exports, viewEventHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartFingerprints = exports.PartFingerprint = exports.ViewPart = void 0;
    class ViewPart extends viewEventHandler_1.ViewEventHandler {
        constructor(context) {
            super();
            this._context = context;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
    }
    exports.ViewPart = ViewPart;
    var PartFingerprint;
    (function (PartFingerprint) {
        PartFingerprint[PartFingerprint["None"] = 0] = "None";
        PartFingerprint[PartFingerprint["ContentWidgets"] = 1] = "ContentWidgets";
        PartFingerprint[PartFingerprint["OverflowingContentWidgets"] = 2] = "OverflowingContentWidgets";
        PartFingerprint[PartFingerprint["OverflowGuard"] = 3] = "OverflowGuard";
        PartFingerprint[PartFingerprint["OverlayWidgets"] = 4] = "OverlayWidgets";
        PartFingerprint[PartFingerprint["OverflowingOverlayWidgets"] = 5] = "OverflowingOverlayWidgets";
        PartFingerprint[PartFingerprint["ScrollableElement"] = 6] = "ScrollableElement";
        PartFingerprint[PartFingerprint["TextArea"] = 7] = "TextArea";
        PartFingerprint[PartFingerprint["ViewLines"] = 8] = "ViewLines";
        PartFingerprint[PartFingerprint["Minimap"] = 9] = "Minimap";
    })(PartFingerprint || (exports.PartFingerprint = PartFingerprint = {}));
    class PartFingerprints {
        static write(target, partId) {
            target.setAttribute('data-mprt', String(partId));
        }
        static read(target) {
            const r = target.getAttribute('data-mprt');
            if (r === null) {
                return 0 /* PartFingerprint.None */;
            }
            return parseInt(r, 10);
        }
        static collect(child, stopAt) {
            const result = [];
            let resultLen = 0;
            while (child && child !== child.ownerDocument.body) {
                if (child === stopAt) {
                    break;
                }
                if (child.nodeType === child.ELEMENT_NODE) {
                    result[resultLen++] = this.read(child);
                }
                child = child.parentElement;
            }
            const r = new Uint8Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                r[i] = result[resultLen - i - 1];
            }
            return r;
        }
    }
    exports.PartFingerprints = PartFingerprints;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1BhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXcvdmlld1BhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQXNCLFFBQVMsU0FBUSxtQ0FBZ0I7UUFJdEQsWUFBWSxPQUFvQjtZQUMvQixLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFZSxPQUFPO1lBQ3RCLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FJRDtJQWpCRCw0QkFpQkM7SUFFRCxJQUFrQixlQVdqQjtJQVhELFdBQWtCLGVBQWU7UUFDaEMscURBQUksQ0FBQTtRQUNKLHlFQUFjLENBQUE7UUFDZCwrRkFBeUIsQ0FBQTtRQUN6Qix1RUFBYSxDQUFBO1FBQ2IseUVBQWMsQ0FBQTtRQUNkLCtGQUF5QixDQUFBO1FBQ3pCLCtFQUFpQixDQUFBO1FBQ2pCLDZEQUFRLENBQUE7UUFDUiwrREFBUyxDQUFBO1FBQ1QsMkRBQU8sQ0FBQTtJQUNSLENBQUMsRUFYaUIsZUFBZSwrQkFBZixlQUFlLFFBV2hDO0lBRUQsTUFBYSxnQkFBZ0I7UUFFckIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUEwQyxFQUFFLE1BQXVCO1lBQ3RGLE1BQU0sQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFTSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQWU7WUFDakMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDaEIsb0NBQTRCO1lBQzdCLENBQUM7WUFDRCxPQUFPLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUVNLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBcUIsRUFBRSxNQUFlO1lBQzNELE1BQU0sTUFBTSxHQUFzQixFQUFFLENBQUM7WUFDckMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBRWxCLE9BQU8sS0FBSyxJQUFJLEtBQUssS0FBSyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNwRCxJQUFJLEtBQUssS0FBSyxNQUFNLEVBQUUsQ0FBQztvQkFDdEIsTUFBTTtnQkFDUCxDQUFDO2dCQUNELElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQzNDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLENBQUM7Z0JBQ0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFDN0IsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7WUFDRCxPQUFPLENBQUMsQ0FBQztRQUNWLENBQUM7S0FDRDtJQWxDRCw0Q0FrQ0MifQ==