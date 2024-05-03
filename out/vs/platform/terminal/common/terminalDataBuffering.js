/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDataBufferer = void 0;
    class TerminalDataBufferer {
        constructor(_callback) {
            this._callback = _callback;
            this._terminalBufferMap = new Map();
        }
        dispose() {
            for (const buffer of this._terminalBufferMap.values()) {
                buffer.dispose();
            }
        }
        startBuffering(id, event, throttleBy = 5) {
            const disposable = event((e) => {
                const data = (typeof e === 'string' ? e : e.data);
                let buffer = this._terminalBufferMap.get(id);
                if (buffer) {
                    buffer.data.push(data);
                    return;
                }
                const timeoutId = setTimeout(() => this.flushBuffer(id), throttleBy);
                buffer = {
                    data: [data],
                    timeoutId: timeoutId,
                    dispose: () => {
                        clearTimeout(timeoutId);
                        this.flushBuffer(id);
                        disposable.dispose();
                    }
                };
                this._terminalBufferMap.set(id, buffer);
            });
            return disposable;
        }
        stopBuffering(id) {
            const buffer = this._terminalBufferMap.get(id);
            buffer?.dispose();
        }
        flushBuffer(id) {
            const buffer = this._terminalBufferMap.get(id);
            if (buffer) {
                this._terminalBufferMap.delete(id);
                this._callback(id, buffer.data.join(''));
            }
        }
    }
    exports.TerminalDataBufferer = TerminalDataBufferer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxEYXRhQnVmZmVyaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vdGVybWluYWxEYXRhQnVmZmVyaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFhLG9CQUFvQjtRQUdoQyxZQUE2QixTQUE2QztZQUE3QyxjQUFTLEdBQVQsU0FBUyxDQUFvQztZQUZ6RCx1QkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztRQUc1RSxDQUFDO1FBRUQsT0FBTztZQUNOLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNsQixDQUFDO1FBQ0YsQ0FBQztRQUVELGNBQWMsQ0FBQyxFQUFVLEVBQUUsS0FBd0MsRUFBRSxhQUFxQixDQUFDO1lBRTFGLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQTZCLEVBQUUsRUFBRTtnQkFDMUQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUN2QixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3JFLE1BQU0sR0FBRztvQkFDUixJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBQ1osU0FBUyxFQUFFLFNBQVM7b0JBQ3BCLE9BQU8sRUFBRSxHQUFHLEVBQUU7d0JBQ2IsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUN4QixJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNyQixVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3RCLENBQUM7aUJBQ0QsQ0FBQztnQkFDRixJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6QyxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFRCxhQUFhLENBQUMsRUFBVTtZQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBRUQsV0FBVyxDQUFDLEVBQVU7WUFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvQyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWpERCxvREFpREMifQ==