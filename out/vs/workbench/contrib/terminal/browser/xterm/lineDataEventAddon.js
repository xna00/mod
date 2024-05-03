/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineDataEventAddon = void 0;
    /**
     * Provides extensions to the xterm object in a modular, testable way.
     */
    class LineDataEventAddon extends lifecycle_1.Disposable {
        constructor(_initializationPromise) {
            super();
            this._initializationPromise = _initializationPromise;
            this._isOsSet = false;
            this._onLineData = this._register(new event_1.Emitter());
            this.onLineData = this._onLineData.event;
        }
        async activate(xterm) {
            this._xterm = xterm;
            // If there is an initialization promise, wait for it before registering the event
            await this._initializationPromise;
            // Fire onLineData when a line feed occurs, taking into account wrapped lines
            this._register(xterm.onLineFeed(() => {
                const buffer = xterm.buffer;
                const newLine = buffer.active.getLine(buffer.active.baseY + buffer.active.cursorY);
                if (newLine && !newLine.isWrapped) {
                    this._sendLineData(buffer.active, buffer.active.baseY + buffer.active.cursorY - 1);
                }
            }));
            // Fire onLineData when disposing object to flush last line
            this._register((0, lifecycle_1.toDisposable)(() => {
                const buffer = xterm.buffer;
                this._sendLineData(buffer.active, buffer.active.baseY + buffer.active.cursorY);
            }));
        }
        setOperatingSystem(os) {
            if (this._isOsSet || !this._xterm) {
                return;
            }
            this._isOsSet = true;
            // Force line data to be sent when the cursor is moved, the main purpose for
            // this is because ConPTY will often not do a line feed but instead move the
            // cursor, in which case we still want to send the current line's data to tasks.
            if (os === 1 /* OperatingSystem.Windows */) {
                const xterm = this._xterm;
                this._register(xterm.parser.registerCsiHandler({ final: 'H' }, () => {
                    const buffer = xterm.buffer;
                    this._sendLineData(buffer.active, buffer.active.baseY + buffer.active.cursorY);
                    return false;
                }));
            }
        }
        _sendLineData(buffer, lineIndex) {
            let line = buffer.getLine(lineIndex);
            if (!line) {
                return;
            }
            let lineData = line.translateToString(true);
            while (lineIndex > 0 && line.isWrapped) {
                line = buffer.getLine(--lineIndex);
                if (!line) {
                    break;
                }
                lineData = line.translateToString(false) + lineData;
            }
            this._onLineData.fire(lineData);
        }
    }
    exports.LineDataEventAddon = LineDataEventAddon;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZURhdGFFdmVudEFkZG9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3h0ZXJtL2xpbmVEYXRhRXZlbnRBZGRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEc7O09BRUc7SUFDSCxNQUFhLGtCQUFtQixTQUFRLHNCQUFVO1FBUWpELFlBQTZCLHNCQUFzQztZQUNsRSxLQUFLLEVBQUUsQ0FBQztZQURvQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWdCO1lBTDNELGFBQVEsR0FBRyxLQUFLLENBQUM7WUFFUixnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQzVELGVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztRQUk3QyxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFvQjtZQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUVwQixrRkFBa0Y7WUFDbEYsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUM7WUFFbEMsNkVBQTZFO1lBQzdFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3BDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQzVCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ25GLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNuQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosMkRBQTJEO1lBQzNELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDaEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEYsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxFQUFtQjtZQUNyQyxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFFckIsNEVBQTRFO1lBQzVFLDRFQUE0RTtZQUM1RSxnRkFBZ0Y7WUFDaEYsSUFBSSxFQUFFLG9DQUE0QixFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUU7b0JBQ25FLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7b0JBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvRSxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhLENBQUMsTUFBZSxFQUFFLFNBQWlCO1lBQ3ZELElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLE9BQU8sU0FBUyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxRQUFRLENBQUM7WUFDckQsQ0FBQztZQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7S0FDRDtJQXBFRCxnREFvRUMifQ==