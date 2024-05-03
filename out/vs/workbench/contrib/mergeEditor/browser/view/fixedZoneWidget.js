/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, dom_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FixedZoneWidget = void 0;
    class FixedZoneWidget extends lifecycle_1.Disposable {
        static { this.counter = 0; }
        constructor(editor, viewZoneAccessor, afterLineNumber, height, viewZoneIdsToCleanUp) {
            super();
            this.editor = editor;
            this.overlayWidgetId = `fixedZoneWidget-${FixedZoneWidget.counter++}`;
            this.widgetDomNode = (0, dom_1.h)('div.fixed-zone-widget').root;
            this.overlayWidget = {
                getId: () => this.overlayWidgetId,
                getDomNode: () => this.widgetDomNode,
                getPosition: () => null
            };
            this.viewZoneId = viewZoneAccessor.addZone({
                domNode: document.createElement('div'),
                afterLineNumber: afterLineNumber,
                heightInPx: height,
                onComputedHeight: (height) => {
                    this.widgetDomNode.style.height = `${height}px`;
                },
                onDomNodeTop: (top) => {
                    this.widgetDomNode.style.top = `${top}px`;
                }
            });
            viewZoneIdsToCleanUp.push(this.viewZoneId);
            this._register(event_1.Event.runAndSubscribe(this.editor.onDidLayoutChange, () => {
                this.widgetDomNode.style.left = this.editor.getLayoutInfo().contentLeft + 'px';
            }));
            this.editor.addOverlayWidget(this.overlayWidget);
            this._register({
                dispose: () => {
                    this.editor.removeOverlayWidget(this.overlayWidget);
                },
            });
        }
    }
    exports.FixedZoneWidget = FixedZoneWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4ZWRab25lV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3ZpZXcvZml4ZWRab25lV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFzQixlQUFnQixTQUFRLHNCQUFVO2lCQUN4QyxZQUFPLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFXM0IsWUFDa0IsTUFBbUIsRUFDcEMsZ0JBQXlDLEVBQ3pDLGVBQXVCLEVBQ3ZCLE1BQWMsRUFDZCxvQkFBOEI7WUFFOUIsS0FBSyxFQUFFLENBQUM7WUFOUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBWHBCLG9CQUFlLEdBQUcsbUJBQW1CLGVBQWUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBRy9ELGtCQUFhLEdBQUcsSUFBQSxPQUFDLEVBQUMsdUJBQXVCLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbEQsa0JBQWEsR0FBbUI7Z0JBQ2hELEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZTtnQkFDakMsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhO2dCQUNwQyxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSTthQUN2QixDQUFDO1lBV0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7Z0JBQzFDLE9BQU8sRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztnQkFDdEMsZUFBZSxFQUFFLGVBQWU7Z0JBQ2hDLFVBQVUsRUFBRSxNQUFNO2dCQUNsQixnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM1QixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQztnQkFDakQsQ0FBQztnQkFDRCxZQUFZLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDckIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQzNDLENBQUM7YUFDRCxDQUFDLENBQUM7WUFDSCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTNDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtnQkFDeEUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUNoRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFakQsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDZCxPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNyRCxDQUFDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUE3Q0YsMENBOENDIn0=