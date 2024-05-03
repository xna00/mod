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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/date", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/hover/browser/hover"], function (require, exports, dom, async_1, date_1, htmlContent_1, lifecycle_1, nls_1, configuration_1, contextView_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDecorationHoverManager = exports.DecorationSelector = void 0;
    exports.updateLayout = updateLayout;
    var DecorationStyles;
    (function (DecorationStyles) {
        DecorationStyles[DecorationStyles["DefaultDimension"] = 16] = "DefaultDimension";
        DecorationStyles[DecorationStyles["MarginLeft"] = -17] = "MarginLeft";
    })(DecorationStyles || (DecorationStyles = {}));
    var DecorationSelector;
    (function (DecorationSelector) {
        DecorationSelector["CommandDecoration"] = "terminal-command-decoration";
        DecorationSelector["Hide"] = "hide";
        DecorationSelector["ErrorColor"] = "error";
        DecorationSelector["DefaultColor"] = "default-color";
        DecorationSelector["Default"] = "default";
        DecorationSelector["Codicon"] = "codicon";
        DecorationSelector["XtermDecoration"] = "xterm-decoration";
        DecorationSelector["OverviewRuler"] = ".xterm-decoration-overview-ruler";
        DecorationSelector["QuickFix"] = "quick-fix";
    })(DecorationSelector || (exports.DecorationSelector = DecorationSelector = {}));
    let TerminalDecorationHoverManager = class TerminalDecorationHoverManager extends lifecycle_1.Disposable {
        constructor(_hoverService, configurationService, contextMenuService) {
            super();
            this._hoverService = _hoverService;
            this._contextMenuVisible = false;
            this._register(contextMenuService.onDidShowContextMenu(() => this._contextMenuVisible = true));
            this._register(contextMenuService.onDidHideContextMenu(() => this._contextMenuVisible = false));
            this._hoverDelayer = this._register(new async_1.Delayer(configurationService.getValue('workbench.hover.delay')));
        }
        hideHover() {
            this._hoverDelayer.cancel();
            this._hoverService.hideHover();
        }
        createHover(element, command, hoverMessage) {
            return (0, lifecycle_1.combinedDisposable)(dom.addDisposableListener(element, dom.EventType.MOUSE_ENTER, () => {
                if (this._contextMenuVisible) {
                    return;
                }
                this._hoverDelayer.trigger(() => {
                    let hoverContent = `${(0, nls_1.localize)('terminalPromptContextMenu', "Show Command Actions")}`;
                    hoverContent += '\n\n---\n\n';
                    if (!command) {
                        if (hoverMessage) {
                            hoverContent = hoverMessage;
                        }
                        else {
                            return;
                        }
                    }
                    else if (command.markProperties || hoverMessage) {
                        if (command.markProperties?.hoverMessage || hoverMessage) {
                            hoverContent = command.markProperties?.hoverMessage || hoverMessage || '';
                        }
                        else {
                            return;
                        }
                    }
                    else {
                        if (command.duration) {
                            const durationText = (0, date_1.getDurationString)(command.duration);
                            if (command.exitCode) {
                                if (command.exitCode === -1) {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailed.duration', 'Command executed {0}, took {1} and failed', (0, date_1.fromNow)(command.timestamp, true), durationText);
                                }
                                else {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailedWithExitCode.duration', 'Command executed {0}, took {1} and failed (Exit Code {2})', (0, date_1.fromNow)(command.timestamp, true), durationText, command.exitCode);
                                }
                            }
                            else {
                                hoverContent += (0, nls_1.localize)('terminalPromptCommandSuccess.duration', 'Command executed {0} and took {1}', (0, date_1.fromNow)(command.timestamp, true), durationText);
                            }
                        }
                        else {
                            if (command.exitCode) {
                                if (command.exitCode === -1) {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailed', 'Command executed {0} and failed', (0, date_1.fromNow)(command.timestamp, true));
                                }
                                else {
                                    hoverContent += (0, nls_1.localize)('terminalPromptCommandFailedWithExitCode', 'Command executed {0} and failed (Exit Code {1})', (0, date_1.fromNow)(command.timestamp, true), command.exitCode);
                                }
                            }
                            else {
                                hoverContent += (0, nls_1.localize)('terminalPromptCommandSuccess', 'Command executed {0}', (0, date_1.fromNow)(command.timestamp, true));
                            }
                        }
                    }
                    this._hoverService.showHover({ content: new htmlContent_1.MarkdownString(hoverContent), target: element });
                });
            }), dom.addDisposableListener(element, dom.EventType.MOUSE_LEAVE, () => this.hideHover()), dom.addDisposableListener(element, dom.EventType.MOUSE_OUT, () => this.hideHover()));
        }
    };
    exports.TerminalDecorationHoverManager = TerminalDecorationHoverManager;
    exports.TerminalDecorationHoverManager = TerminalDecorationHoverManager = __decorate([
        __param(0, hover_1.IHoverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, contextView_1.IContextMenuService)
    ], TerminalDecorationHoverManager);
    function updateLayout(configurationService, element) {
        if (!element) {
            return;
        }
        const fontSize = configurationService.inspect("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */).value;
        const defaultFontSize = configurationService.inspect("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */).defaultValue;
        const lineHeight = configurationService.inspect("terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */).value;
        if (typeof fontSize === 'number' && typeof defaultFontSize === 'number' && typeof lineHeight === 'number') {
            const scalar = (fontSize / defaultFontSize) <= 1 ? (fontSize / defaultFontSize) : 1;
            // must be inlined to override the inlined styles from xterm
            element.style.width = `${scalar * 16 /* DecorationStyles.DefaultDimension */}px`;
            element.style.height = `${scalar * 16 /* DecorationStyles.DefaultDimension */ * lineHeight}px`;
            element.style.fontSize = `${scalar * 16 /* DecorationStyles.DefaultDimension */}px`;
            element.style.marginLeft = `${scalar * -17 /* DecorationStyles.MarginLeft */}px`;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvblN0eWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci94dGVybS9kZWNvcmF0aW9uU3R5bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdHaEcsb0NBZUM7SUF6R0QsSUFBVyxnQkFHVjtJQUhELFdBQVcsZ0JBQWdCO1FBQzFCLGdGQUFxQixDQUFBO1FBQ3JCLHFFQUFnQixDQUFBO0lBQ2pCLENBQUMsRUFIVSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBRzFCO0lBRUQsSUFBa0Isa0JBVWpCO0lBVkQsV0FBa0Isa0JBQWtCO1FBQ25DLHVFQUFpRCxDQUFBO1FBQ2pELG1DQUFhLENBQUE7UUFDYiwwQ0FBb0IsQ0FBQTtRQUNwQixvREFBOEIsQ0FBQTtRQUM5Qix5Q0FBbUIsQ0FBQTtRQUNuQix5Q0FBbUIsQ0FBQTtRQUNuQiwwREFBb0MsQ0FBQTtRQUNwQyx3RUFBa0QsQ0FBQTtRQUNsRCw0Q0FBc0IsQ0FBQTtJQUN2QixDQUFDLEVBVmlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBVW5DO0lBRU0sSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBK0IsU0FBUSxzQkFBVTtRQUk3RCxZQUEyQixhQUE2QyxFQUNoRCxvQkFBMkMsRUFDN0Msa0JBQXVDO1lBQzVELEtBQUssRUFBRSxDQUFDO1lBSG1DLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBRmhFLHdCQUFtQixHQUFZLEtBQUssQ0FBQztZQU01QyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxTQUFT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