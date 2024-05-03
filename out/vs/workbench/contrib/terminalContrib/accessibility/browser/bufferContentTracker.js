/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/terminal/common/terminal"], function (require, exports, lifecycle_1, configuration_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferContentTracker = void 0;
    let BufferContentTracker = class BufferContentTracker extends lifecycle_1.Disposable {
        get lines() { return this._lines; }
        constructor(_xterm, _logService, _configurationService) {
            super();
            this._xterm = _xterm;
            this._logService = _logService;
            this._configurationService = _configurationService;
            /**
             * The number of wrapped lines in the viewport when the last cached marker was set
             */
            this._priorEditorViewportLineCount = 0;
            this._lines = [];
            this.bufferToEditorLineMapping = new Map();
        }
        reset() {
            this._lines = [];
            this._lastCachedMarker = undefined;
            this.update();
        }
        update() {
            if (this._lastCachedMarker?.isDisposed) {
                // the terminal was cleared, reset the cache
                this._lines = [];
                this._lastCachedMarker = undefined;
            }
            this._removeViewportContent();
            this._updateCachedContent();
            this._updateViewportContent();
            this._lastCachedMarker = this._register(this._xterm.raw.registerMarker());
            this._logService.debug('Buffer content tracker: set ', this._lines.length, ' lines');
        }
        _updateCachedContent() {
            const buffer = this._xterm.raw.buffer.active;
            const start = this._lastCachedMarker?.line ? this._lastCachedMarker.line - this._xterm.raw.rows + 1 : 0;
            const end = buffer.baseY;
            if (start < 0 || start > end) {
                // in the viewport, no need to cache
                return;
            }
            // to keep the cache size down, remove any lines that are no longer in the scrollback
            const scrollback = this._configurationService.getValue("terminal.integrated.scrollback" /* TerminalSettingId.Scrollback */);
            const maxBufferSize = scrollback + this._xterm.raw.rows - 1;
            const linesToAdd = end - start;
            if (linesToAdd + this._lines.length > maxBufferSize) {
                const numToRemove = linesToAdd + this._lines.length - maxBufferSize;
                for (let i = 0; i < numToRemove; i++) {
                    this._lines.shift();
                }
                this._logService.debug('Buffer content tracker: removed ', numToRemove, ' lines from top of cached lines, now ', this._lines.length, ' lines');
            }
            // iterate through the buffer lines and add them to the editor line cache
            const cachedLines = [];
            let currentLine = '';
            for (let i = start; i < end; i++) {
                const line = buffer.getLine(i);
                if (!line) {
                    continue;
                }
                this.bufferToEditorLineMapping.set(i, this._lines.length + cachedLines.length);
                const isWrapped = buffer.getLine(i + 1)?.isWrapped;
                currentLine += line.translateToString(!isWrapped);
                if (currentLine && !isWrapped || i === (buffer.baseY + this._xterm.raw.rows - 1)) {
                    if (line.length) {
                        cachedLines.push(currentLine);
                        currentLine = '';
                    }
                }
            }
            this._logService.debug('Buffer content tracker:', cachedLines.length, ' lines cached');
            this._lines.push(...cachedLines);
        }
        _removeViewportContent() {
            if (!this._lines.length) {
                return;
            }
            // remove previous viewport content in case it has changed
            let linesToRemove = this._priorEditorViewportLineCount;
            let index = 1;
            while (linesToRemove) {
                this.bufferToEditorLineMapping.forEach((value, key) => { if (value === this._lines.length - index) {
                    this.bufferToEditorLineMapping.delete(key);
                } });
                this._lines.pop();
                index++;
                linesToRemove--;
            }
            this._logService.debug('Buffer content tracker: removed lines from viewport, now ', this._lines.length, ' lines cached');
        }
        _updateViewportContent() {
            const buffer = this._xterm.raw.buffer.active;
            this._priorEditorViewportLineCount = 0;
            let currentLine = '';
            for (let i = buffer.baseY; i < buffer.baseY + this._xterm.raw.rows; i++) {
                const line = buffer.getLine(i);
                if (!line) {
                    continue;
                }
                this.bufferToEditorLineMapping.set(i, this._lines.length);
                const isWrapped = buffer.getLine(i + 1)?.isWrapped;
                currentLine += line.translateToString(!isWrapped);
                if (currentLine && !isWrapped || i === (buffer.baseY + this._xterm.raw.rows - 1)) {
                    if (currentLine.length) {
                        this._priorEditorViewportLineCount++;
                        this._lines.push(currentLine);
                        currentLine = '';
                    }
                }
            }
            this._logService.debug('Viewport content update complete, ', this._lines.length, ' lines in the viewport');
        }
    };
    exports.BufferContentTracker = BufferContentTracker;
    exports.BufferContentTracker = BufferContentTracker = __decorate([
        __param(1, terminal_1.ITerminalLogService),
        __param(2, configuration_1.IConfigurationService)
    ], BufferContentTracker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyQ29udGVudFRyYWNrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvYnVmZmVyQ29udGVudFRyYWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFXbkQsSUFBSSxLQUFLLEtBQWUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUk3QyxZQUNrQixNQUEyRCxFQUN2RCxXQUFpRCxFQUMvQyxxQkFBNkQ7WUFDcEYsS0FBSyxFQUFFLENBQUM7WUFIUyxXQUFNLEdBQU4sTUFBTSxDQUFxRDtZQUN0QyxnQkFBVyxHQUFYLFdBQVcsQ0FBcUI7WUFDOUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQWJyRjs7ZUFFRztZQUNLLGtDQUE2QixHQUFXLENBQUMsQ0FBQztZQUUxQyxXQUFNLEdBQWEsRUFBRSxDQUFDO1lBRzlCLDhCQUF5QixHQUF3QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBTzNELENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztZQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxDQUFDO2dCQUN4Qyw0Q0FBNEM7Z0JBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxD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