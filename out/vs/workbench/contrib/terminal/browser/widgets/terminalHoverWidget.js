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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/ui/widget", "vs/base/browser/dom", "vs/platform/hover/browser/hover", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, widget_1, dom, hover_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalHover = void 0;
    const $ = dom.$;
    let TerminalHover = class TerminalHover extends lifecycle_1.Disposable {
        constructor(_targetOptions, _text, _actions, _linkHandler, _hoverService, _configurationService) {
            super();
            this._targetOptions = _targetOptions;
            this._text = _text;
            this._actions = _actions;
            this._linkHandler = _linkHandler;
            this._hoverService = _hoverService;
            this._configurationService = _configurationService;
            this.id = 'hover';
        }
        attach(container) {
            const showLinkHover = this._configurationService.getValue("terminal.integrated.showLinkHover" /* TerminalSettingId.ShowLinkHover */);
            if (!showLinkHover) {
                return;
            }
            const target = new CellHoverTarget(container, this._targetOptions);
            const hover = this._hoverService.showHover({
                target,
                content: this._text,
                actions: this._actions,
                linkHandler: this._linkHandler,
                // .xterm-hover lets xterm know that the hover is part of a link
                additionalClasses: ['xterm-hover']
            });
            if (hover) {
                this._register(hover);
            }
        }
    };
    exports.TerminalHover = TerminalHover;
    exports.TerminalHover = TerminalHover = __decorate([
        __param(4, hover_1.IHoverService),
        __param(5, configuration_1.IConfigurationService)
    ], TerminalHover);
    class CellHoverTarget extends widget_1.Widget {
        get targetElements() { return this._targetElements; }
        constructor(container, _options) {
            super();
            this._options = _options;
            this._targetElements = [];
            this._domNode = $('div.terminal-hover-targets.xterm-hover');
            const rowCount = this._options.viewportRange.end.y - this._options.viewportRange.start.y + 1;
            // Add top target row
            const width = (this._options.viewportRange.end.y > this._options.viewportRange.start.y ? this._options.terminalDimensions.width - this._options.viewportRange.start.x : this._options.viewportRange.end.x - this._options.viewportRange.start.x + 1) * this._options.cellDimensions.width;
            const topTarget = $('div.terminal-hover-target.hoverHighlight');
            topTarget.style.left = `${this._options.viewportRange.start.x * this._options.cellDimensions.width}px`;
            topTarget.style.bottom = `${(this._options.terminalDimensions.height - this._options.viewportRange.start.y - 1) * this._options.cellDimensions.height}px`;
            topTarget.style.width = `${width}px`;
            topTarget.style.height = `${this._options.cellDimensions.height}px`;
            this._targetElements.push(this._domNode.appendChild(topTarget));
            // Add middle target rows
            if (rowCount > 2) {
                const middleTarget = $('div.terminal-hover-target.hoverHighlight');
                middleTarget.style.left = `0px`;
                middleTarget.style.bottom = `${(this._options.terminalDimensions.height - this._options.viewportRange.start.y - 1 - (rowCount - 2)) * this._options.cellDimensions.height}px`;
                middleTarget.style.width = `${this._options.terminalDimensions.width * this._options.cellDimensions.width}px`;
                middleTarget.style.height = `${(rowCount - 2) * this._options.cellDimensions.height}px`;
                this._targetElements.push(this._domNode.appendChild(middleTarget));
            }
            // Add bottom target row
            if (rowCount > 1) {
                const bottomTarget = $('div.terminal-hover-target.hoverHighlight');
                bottomTarget.style.left = `0px`;
                bottomTarget.style.bottom = `${(this._options.terminalDimensions.height - this._options.viewportRange.end.y - 1) * this._options.cellDimensions.height}px`;
                bottomTarget.style.width = `${(this._options.viewportRange.end.x + 1) * this._options.cellDimensions.width}px`;
                bottomTarget.style.height = `${this._options.cellDimensions.height}px`;
                this._targetElements.push(this._domNode.appendChild(bottomTarget));
            }
            if (this._options.modifierDownCallback && this._options.modifierUpCallback) {
                let down = false;
                this._register(dom.addDisposableListener(container.ownerDocument, 'keydown', e => {
                    if (e.ctrlKey && !down) {
                        down = true;
                        this._options.modifierDownCallback();
                    }
                }));
                this._register(dom.addDisposableListener(container.ownerDocument, 'keyup', e => {
                    if (!e.ctrlKey) {
                        down = false;
                        this._options.modifierUpCallback();
                    }
                }));
            }
            container.appendChild(this._domNode);
            this._register((0, lifecycle_1.toDisposable)(() => this._domNode?.remove()));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxIb3ZlcldpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci93aWRnZXRzL3Rlcm1pbmFsSG92ZXJXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWWhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFVVCxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7UUFHNUMsWUFDa0IsY0FBdUMsRUFDdkMsS0FBc0IsRUFDdEIsUUFBb0MsRUFDcEMsWUFBa0MsRUFDcEMsYUFBNkMsRUFDckMscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBUFMsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQ3ZDLFVBQUssR0FBTCxLQUFLLENBQWlCO1lBQ3RCLGFBQVEsR0FBUixRQUFRLENBQTRCO1lBQ3BDLGlCQUFZLEdBQVosWUFBWSxDQUFzQjtZQUNuQixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNwQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBUjVFLE9BQUUsR0FBRyxPQUFPLENBQUM7UUFXdEIsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFzQjtZQUM1QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSwyRUFBaUMsQ0FBQztZQUMzRixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFlLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNuRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQztnQkFDMUMs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