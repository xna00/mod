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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/async", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/base/common/platform", "vs/base/common/event", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, dom, async_1, terminalLinkHelpers_1, platform_1, event_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLink = void 0;
    let TerminalLink = class TerminalLink extends lifecycle_1.DisposableStore {
        get onInvalidated() { return this._onInvalidated.event; }
        get type() { return this._type; }
        constructor(_xterm, range, text, uri, parsedLink, actions, _viewportY, _activateCallback, _tooltipCallback, _isHighConfidenceLink, label, _type, _configurationService) {
            super();
            this._xterm = _xterm;
            this.range = range;
            this.text = text;
            this.uri = uri;
            this.parsedLink = parsedLink;
            this.actions = actions;
            this._viewportY = _viewportY;
            this._activateCallback = _activateCallback;
            this._tooltipCallback = _tooltipCallback;
            this._isHighConfidenceLink = _isHighConfidenceLink;
            this.label = label;
            this._type = _type;
            this._configurationService = _configurationService;
            this._onInvalidated = new event_1.Emitter();
            this.decorations = {
                pointerCursor: false,
                underline: this._isHighConfidenceLink
            };
        }
        dispose() {
            super.dispose();
            this._hoverListeners?.dispose();
            this._hoverListeners = undefined;
            this._tooltipScheduler?.dispose();
            this._tooltipScheduler = undefined;
        }
        activate(event, text) {
            // Trigger the xterm.js callback synchronously but track the promise resolution so we can
            // use it in tests
            this.asyncActivate = this._activateCallback(event, text);
        }
        hover(event, text) {
            const w = dom.getWindow(event);
            const d = w.document;
            // Listen for modifier before handing it off to the hover to handle so it gets disposed correctly
            this._hoverListeners = new lifecycle_1.DisposableStore();
            this._hoverListeners.add(dom.addDisposableListener(d, 'keydown', e => {
                if (!e.repeat && this._isModifierDown(e)) {
                    this._enableDecorations();
                }
            }));
            this._hoverListeners.add(dom.addDisposableListener(d, 'keyup', e => {
                if (!e.repeat && !this._isModifierDown(e)) {
                    this._disableDecorations();
                }
            }));
            // Listen for when the terminal renders on the same line as the link
            this._hoverListeners.add(this._xterm.onRender(e => {
                const viewportRangeY = this.range.start.y - this._viewportY;
                if (viewportRangeY >= e.start && viewportRangeY <= e.end) {
                    this._onInvalidated.fire();
                }
            }));
            // Only show the tooltip and highlight for high confidence links (not word/search workspace
            // links). Feedback was that this makes using the terminal overly noisy.
            if (this._isHighConfidenceLink) {
                this._tooltipScheduler = new async_1.RunOnceScheduler(() => {
                    this._tooltipCallback(this, (0, terminalLinkHelpers_1.convertBufferRangeToViewport)(this.range, this._viewportY), this._isHighConfidenceLink ? () => this._enableDecorations() : undefined, this._isHighConfidenceLink ? () => this._disableDecorations() : undefined);
                    // Clear out scheduler until next hover event
                    this._tooltipScheduler?.dispose();
                    this._tooltipScheduler = undefined;
                }, this._configurationService.getValue('workbench.hover.delay'));
                this.add(this._tooltipScheduler);
                this._tooltipScheduler.schedule();
            }
            const origin = { x: event.pageX, y: event.pageY };
            this._hoverListeners.add(dom.addDisposableListener(d, dom.EventType.MOUSE_MOVE, e => {
                // Update decorations
                if (this._isModifierDown(e)) {
                    this._enableDecorations();
                }
                else {
                    this._disableDecorations();
                }
                // Reset the scheduler if the mouse moves too much
                if (Math.abs(e.pageX - origin.x) > w.devicePixelRatio * 2 || Math.abs(e.pageY - origin.y) > w.devicePixelRatio * 2) {
                    origin.x = e.pageX;
                    origin.y = e.pageY;
                    this._tooltipScheduler?.schedule();
                }
            }));
        }
        leave() {
            this._hoverListeners?.dispose();
            this._hoverListeners = undefined;
            this._tooltipScheduler?.dispose();
            this._tooltipScheduler = undefined;
        }
        _enableDecorations() {
            if (!this.decorations.pointerCursor) {
                this.decorations.pointerCursor = true;
            }
            if (!this.decorations.underline) {
                this.decorations.underline = true;
            }
        }
        _disableDecorations() {
            if (this.decorations.pointerCursor) {
                this.decorations.pointerCursor = false;
            }
            if (this.decorations.underline !== this._isHighConfidenceLink) {
                this.decorations.underline = this._isHighConfidenceLink;
            }
        }
        _isModifierDown(event) {
            const multiCursorModifier = this._configurationService.getValue('editor.multiCursorModifier');
            if (multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
        }
    };
    exports.TerminalLink = TerminalLink;
    exports.TerminalLink = TerminalLink = __decorate([
        __param(12, configuration_1.IConfigurationService)
    ], TerminalLink);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbExpbmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSwyQkFBZTtRQVFoRCxJQUFJLGFBQWEsS0FBa0IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFdEUsSUFBSSxJQUFJLEtBQXVCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFbkQsWUFDa0IsTUFBZ0IsRUFDeEIsS0FBbUIsRUFDbkIsSUFBWSxFQUNaLEdBQW9CLEVBQ3BCLFVBQW1DLEVBQ25DLE9BQW1DLEVBQzNCLFVBQWtCLEVBQ2xCLGlCQUFnRixFQUNoRixnQkFBaUosRUFDakoscUJBQThCLEVBQ3RDLEtBQXlCLEVBQ2pCLEtBQXVCLEVBQ2pCLHFCQUE2RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQWRTLFdBQU0sR0FBTixNQUFNLENBQVU7WUFDeEIsVUFBSyxHQUFMLEtBQUssQ0FBYztZQUNuQixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ1osUUFBRyxHQUFILEdBQUcsQ0FBaUI7WUFDcEIsZUFBVSxHQUFWLFVBQVUsQ0FBeUI7WUFDbkMsWUFBTyxHQUFQLE9BQU8sQ0FBNEI7WUFDM0IsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQStEO1lBQ2hGLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBaUk7WUFDakosMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFTO1lBQ3RDLFVBQUssR0FBTCxLQUFLLENBQW9CO1lB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