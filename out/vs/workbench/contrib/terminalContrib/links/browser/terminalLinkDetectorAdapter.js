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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminalContrib/links/browser/terminalLink"], function (require, exports, event_1, lifecycle_1, nls_1, instantiation_1, terminalLink_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkDetectorAdapter = void 0;
    /**
     * Wrap a link detector object so it can be used in xterm.js
     */
    let TerminalLinkDetectorAdapter = class TerminalLinkDetectorAdapter extends lifecycle_1.Disposable {
        constructor(_detector, _instantiationService) {
            super();
            this._detector = _detector;
            this._instantiationService = _instantiationService;
            this._onDidActivateLink = this._register(new event_1.Emitter());
            this.onDidActivateLink = this._onDidActivateLink.event;
            this._onDidShowHover = this._register(new event_1.Emitter());
            this.onDidShowHover = this._onDidShowHover.event;
            this._activeProvideLinkRequests = new Map();
        }
        async provideLinks(bufferLineNumber, callback) {
            let activeRequest = this._activeProvideLinkRequests.get(bufferLineNumber);
            if (activeRequest) {
                await activeRequest;
                callback(this._activeLinks);
                return;
            }
            if (this._activeLinks) {
                for (const link of this._activeLinks) {
                    link.dispose();
                }
            }
            activeRequest = this._provideLinks(bufferLineNumber);
            this._activeProvideLinkRequests.set(bufferLineNumber, activeRequest);
            this._activeLinks = await activeRequest;
            this._activeProvideLinkRequests.delete(bufferLineNumber);
            callback(this._activeLinks);
        }
        async _provideLinks(bufferLineNumber) {
            // Dispose of all old links if new links are provided, links are only cached for the current line
            const links = [];
            let startLine = bufferLineNumber - 1;
            let endLine = startLine;
            const lines = [
                this._detector.xterm.buffer.active.getLine(startLine)
            ];
            // Cap the maximum context on either side of the line being provided, by taking the context
            // around the line being provided for this ensures the line the pointer is on will have
            // links provided.
            const maxLineContext = Math.max(this._detector.maxLinkLength, this._detector.xterm.cols);
            const minStartLine = Math.max(startLine - maxLineContext, 0);
            const maxEndLine = Math.min(endLine + maxLineContext, this._detector.xterm.buffer.active.length);
            while (startLine >= minStartLine && this._detector.xterm.buffer.active.getLine(startLine)?.isWrapped) {
                lines.unshift(this._detector.xterm.buffer.active.getLine(startLine - 1));
                startLine--;
            }
            while (endLine < maxEndLine && this._detector.xterm.buffer.active.getLine(endLine + 1)?.isWrapped) {
                lines.push(this._detector.xterm.buffer.active.getLine(endLine + 1));
                endLine++;
            }
            const detectedLinks = await this._detector.detect(lines, startLine, endLine);
            for (const link of detectedLinks) {
                links.push(this._createTerminalLink(link, async (event) => this._onDidActivateLink.fire({ link, event })));
            }
            return links;
        }
        _createTerminalLink(l, activateCallback) {
            // Remove trailing colon if there is one so the link is more useful
            if (!l.disableTrimColon && l.text.length > 0 && l.text.charAt(l.text.length - 1) === ':') {
                l.text = l.text.slice(0, -1);
                l.bufferRange.end.x--;
            }
            return this._instantiationService.createInstance(terminalLink_1.TerminalLink, this._detector.xterm, l.bufferRange, l.text, l.uri, l.parsedLink, l.actions, this._detector.xterm.buffer.active.viewportY, activateCallback, (link, viewportRange, modifierDownCallback, modifierUpCallback) => this._onDidShowHover.fire({
                link,
                viewportRange,
                modifierDownCallback,
                modifierUpCallback
            }), l.type !== "Search" /* TerminalBuiltinLinkType.Search */, // Only search is low confidence
            l.label || this._getLabel(l.type), l.type);
        }
        _getLabel(type) {
            switch (type) {
                case "Search" /* TerminalBuiltinLinkType.Search */: return (0, nls_1.localize)('searchWorkspace', 'Search workspace');
                case "LocalFile" /* TerminalBuiltinLinkType.LocalFile */: return (0, nls_1.localize)('openFile', 'Open file in editor');
                case "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */: return (0, nls_1.localize)('focusFolder', 'Focus folder in explorer');
                case "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */: return (0, nls_1.localize)('openFolder', 'Open folder in new window');
                case "Url" /* TerminalBuiltinLinkType.Url */:
                default:
                    return (0, nls_1.localize)('followLink', 'Follow link');
            }
        }
    };
    exports.TerminalLinkDetectorAdapter = TerminalLinkDetectorAdapter;
    exports.TerminalLinkDetectorAdapter = TerminalLinkDetectorAdapter = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], TerminalLinkDetectorAdapter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rRGV0ZWN0b3JBZGFwdGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbExpbmtEZXRlY3RvckFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRzs7T0FFRztJQUNJLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFRMUQsWUFDa0IsU0FBZ0MsRUFDMUIscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSFMsY0FBUyxHQUFULFNBQVMsQ0FBdUI7WUFDVCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBUHBFLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUMvRSxzQkFBaUIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQzFDLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUIsQ0FBQyxDQUFDO1lBQ3pFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFTN0MsK0JBQTBCLEdBQXlDLElBQUksR0FBRyxFQUFFLENBQUM7UUFGckYsQ0FBQztRQUdELEtBQUssQ0FBQyxZQUFZLENBQUMsZ0JBQXdCLEVBQUUsUUFBOEM7WUFDMUYsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzFFLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sYUFBYSxDQUFDO2dCQUNwQixRQUFRLENBQUMsSUFBSSxDQUFD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