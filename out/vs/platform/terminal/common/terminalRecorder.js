/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalRecorder = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["MaxRecorderDataSize"] = 1048576] = "MaxRecorderDataSize"; // 1MB
    })(Constants || (Constants = {}));
    class TerminalRecorder {
        constructor(cols, rows) {
            this._totalDataLength = 0;
            this._entries = [{ cols, rows, data: [] }];
        }
        handleResize(cols, rows) {
            if (this._entries.length > 0) {
                const lastEntry = this._entries[this._entries.length - 1];
                if (lastEntry.data.length === 0) {
                    // last entry is just a resize, so just remove it
                    this._entries.pop();
                }
            }
            if (this._entries.length > 0) {
                const lastEntry = this._entries[this._entries.length - 1];
                if (lastEntry.cols === cols && lastEntry.rows === rows) {
                    // nothing changed
                    return;
                }
                if (lastEntry.cols === 0 && lastEntry.rows === 0) {
                    // we finally received a good size!
                    lastEntry.cols = cols;
                    lastEntry.rows = rows;
                    return;
                }
            }
            this._entries.push({ cols, rows, data: [] });
        }
        handleData(data) {
            const lastEntry = this._entries[this._entries.length - 1];
            lastEntry.data.push(data);
            this._totalDataLength += data.length;
            while (this._totalDataLength > 1048576 /* Constants.MaxRecorderDataSize */) {
                const firstEntry = this._entries[0];
                const remainingToDelete = this._totalDataLength - 1048576 /* Constants.MaxRecorderDataSize */;
                if (remainingToDelete >= firstEntry.data[0].length) {
                    // the first data piece must be deleted
                    this._totalDataLength -= firstEntry.data[0].length;
                    firstEntry.data.shift();
                    if (firstEntry.data.length === 0) {
                        // the first entry must be deleted
                        this._entries.shift();
                    }
                }
                else {
                    // the first data piece must be partially deleted
                    firstEntry.data[0] = firstEntry.data[0].substr(remainingToDelete);
                    this._totalDataLength -= remainingToDelete;
                }
            }
        }
        generateReplayEventSync() {
            // normalize entries to one element per data array
            this._entries.forEach((entry) => {
                if (entry.data.length > 0) {
                    entry.data = [entry.data.join('')];
                }
            });
            return {
                events: this._entries.map(entry => ({ cols: entry.cols, rows: entry.rows, data: entry.data[0] ?? '' })),
                // No command restoration is needed when relaunching terminals
                commands: {
                    isWindowsPty: false,
                    commands: []
                }
            };
        }
        async generateReplayEvent() {
            return this.generateReplayEventSync();
        }
    }
    exports.TerminalRecorder = TerminalRecorder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxSZWNvcmRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsUmVjb3JkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLElBQVcsU0FFVjtJQUZELFdBQVcsU0FBUztRQUNuQiw2RUFBaUMsQ0FBQSxDQUFDLE1BQU07SUFDekMsQ0FBQyxFQUZVLFNBQVMsS0FBVCxTQUFTLFFBRW5CO0lBWUQsTUFBYSxnQkFBZ0I7UUFLNUIsWUFBWSxJQUFZLEVBQUUsSUFBWTtZQUY5QixxQkFBZ0IsR0FBVyxDQUFDLENBQUM7WUFHcEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsWUFBWSxDQUFDLElBQVksRUFBRSxJQUFZO1lBQ3RDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2pDLGlEQUFpRDtvQkFDakQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFR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