/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position"], function (require, exports, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewUserInputEvents = void 0;
    class ViewUserInputEvents {
        constructor(coordinatesConverter) {
            this.onKeyDown = null;
            this.onKeyUp = null;
            this.onContextMenu = null;
            this.onMouseMove = null;
            this.onMouseLeave = null;
            this.onMouseDown = null;
            this.onMouseUp = null;
            this.onMouseDrag = null;
            this.onMouseDrop = null;
            this.onMouseDropCanceled = null;
            this.onMouseWheel = null;
            this._coordinatesConverter = coordinatesConverter;
        }
        emitKeyDown(e) {
            this.onKeyDown?.(e);
        }
        emitKeyUp(e) {
            this.onKeyUp?.(e);
        }
        emitContextMenu(e) {
            this.onContextMenu?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseMove(e) {
            this.onMouseMove?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseLeave(e) {
            this.onMouseLeave?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDown(e) {
            this.onMouseDown?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseUp(e) {
            this.onMouseUp?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDrag(e) {
            this.onMouseDrag?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDrop(e) {
            this.onMouseDrop?.(this._convertViewToModelMouseEvent(e));
        }
        emitMouseDropCanceled() {
            this.onMouseDropCanceled?.();
        }
        emitMouseWheel(e) {
            this.onMouseWheel?.(e);
        }
        _convertViewToModelMouseEvent(e) {
            if (e.target) {
                return {
                    event: e.event,
                    target: this._convertViewToModelMouseTarget(e.target)
                };
            }
            return e;
        }
        _convertViewToModelMouseTarget(target) {
            return ViewUserInputEvents.convertViewToModelMouseTarget(target, this._coordinatesConverter);
        }
        static convertViewToModelMouseTarget(target, coordinatesConverter) {
            const result = { ...target };
            if (result.position) {
                result.position = coordinatesConverter.convertViewPositionToModelPosition(result.position);
            }
            if (result.range) {
                result.range = coordinatesConverter.convertViewRangeToModelRange(result.range);
            }
            if (result.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */ || result.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                result.detail = this.convertViewToModelViewZoneData(result.detail, coordinatesConverter);
            }
            return result;
        }
        static convertViewToModelViewZoneData(data, coordinatesConverter) {
            return {
                viewZoneId: data.viewZoneId,
                positionBefore: data.positionBefore ? coordinatesConverter.convertViewPositionToModelPosition(data.positionBefore) : data.positionBefore,
                positionAfter: data.positionAfter ? coordinatesConverter.convertViewPositionToModelPosition(data.positionAfter) : data.positionAfter,
                position: coordinatesConverter.convertViewPositionToModelPosition(data.position),
                afterLineNumber: coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(data.afterLineNumber, 1)).lineNumber,
            };
        }
    }
    exports.ViewUserInputEvents = ViewUserInputEvents;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1VzZXJJbnB1dEV2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlldy92aWV3VXNlcklucHV0RXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLG1CQUFtQjtRQWdCL0IsWUFBWSxvQkFBMkM7WUFkaEQsY0FBUyxHQUF5QyxJQUFJLENBQUM7WUFDdkQsWUFBTyxHQUF5QyxJQUFJLENBQUM7WUFDckQsa0JBQWEsR0FBNEMsSUFBSSxDQUFDO1lBQzlELGdCQUFXLEdBQTRDLElBQUksQ0FBQztZQUM1RCxpQkFBWSxHQUFtRCxJQUFJLENBQUM7WUFDcEUsZ0JBQVcsR0FBNEMsSUFBSSxDQUFDO1lBQzVELGNBQVMsR0FBNEMsSUFBSSxDQUFDO1lBQzFELGdCQUFXLEdBQTRDLElBQUksQ0FBQztZQUM1RCxnQkFBVyxHQUFtRCxJQUFJLENBQUM7WUFDbkUsd0JBQW1CLEdBQStCLElBQUksQ0FBQztZQUN2RCxpQkFBWSxHQUEyQyxJQUFJLENBQUM7WUFLbEUsSUFBSSxDQUFDLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDO1FBQ25ELENBQUM7UUFFTSxXQUFXLENBQUMsQ0FBaUI7WUFDbkMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7UUFFTSxTQUFTLENBQUMsQ0FBaUI7WUFDakMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFFTSxlQUFlLENBQUMsQ0FBb0I7WUFDMUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFTSxhQUFhLENBQUMsQ0FBb0I7WUFDeEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTSxjQUFjLENBQUMsQ0FBMkI7WUFDaEQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFTSxhQUFhLENBQUMsQ0FBb0I7WUFDeEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTSxXQUFXLENBQUMsQ0FBb0I7WUFDdEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFTSxhQUFhLENBQUMsQ0FBb0I7WUFDeEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTSxhQUFhLENBQUMsQ0FBMkI7WUFDL0MsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTSxxQkFBcUI7WUFDM0IsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRU0sY0FBYyxDQUFDLENBQW1CO1lBQ3hDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBSU8sNkJBQTZCLENBQUMsQ0FBK0M7WUFDcEYsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2QsT0FBTztvQkFDTixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7b0JBQ2QsTUFBTSxFQUFFLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2lCQUNyRCxDQUFDO1lBQ0gsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVPLDhCQUE4QixDQUFDLE1BQW9CO1lBQzFELE9BQU8sbUJBQW1CLENBQUMsNkJBQTZCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFFTSxNQUFNLENBQUMsNkJBQTZCLENBQUMsTUFBb0IsRUFBRSxvQkFBMkM7WUFDNUcsTUFBTSxNQUFNLEdBQUcsRUFBRSxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBQzdCLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNyQixNQUFNLENBQUMsUUFBUSxHQUFHLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1RixDQUFDO1lBQ0QsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsb0JBQW9CLENBQUMsNEJBQTRCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFDRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLDZDQUFxQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLDhDQUFzQyxFQUFFLENBQUM7Z0JBQzNHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUMxRixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sTUFBTSxDQUFDLDhCQUE4QixDQUFDLElBQThCLEVBQUUsb0JBQTJDO1lBQ3hILE9BQU87Z0JBQ04sVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUMzQixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYztnQkFDeEksYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWE7Z0JBQ3BJLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNoRixlQUFlLEVBQUUsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsSUFBSSxtQkFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVO2FBQzFILENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUF2R0Qsa0RBdUdDIn0=