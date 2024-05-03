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
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/terminalContrib/find/browser/textInputContextMenu"], function (require, exports, dom, simpleFindWidget_1, contextView_1, contextkey_1, terminalContextKey_1, themeService_1, configuration_1, keybinding_1, event_1, clipboardService_1, textInputContextMenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalFindWidget = void 0;
    const TERMINAL_FIND_WIDGET_INITIAL_WIDTH = 419;
    let TerminalFindWidget = class TerminalFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        constructor(_instance, _contextViewService, keybindingService, _contextKeyService, _contextMenuService, _clipboardService, _themeService, _configurationService) {
            super({
                showCommonFindToggles: true,
                checkImeCompletionState: true,
                showResultCount: true,
                initialWidth: TERMINAL_FIND_WIDGET_INITIAL_WIDTH,
                enableSash: true,
                appendCaseSensitiveActionId: "workbench.action.terminal.toggleFindCaseSensitive" /* TerminalCommandId.ToggleFindCaseSensitive */,
                appendRegexActionId: "workbench.action.terminal.toggleFindRegex" /* TerminalCommandId.ToggleFindRegex */,
                appendWholeWordsActionId: "workbench.action.terminal.toggleFindWholeWord" /* TerminalCommandId.ToggleFindWholeWord */,
                previousMatchActionId: "workbench.action.terminal.findPrevious" /* TerminalCommandId.FindPrevious */,
                nextMatchActionId: "workbench.action.terminal.findNext" /* TerminalCommandId.FindNext */,
                closeWidgetActionId: "workbench.action.terminal.hideFind" /* TerminalCommandId.FindHide */,
                type: 'Terminal',
                matchesLimit: 1000 /* XtermTerminalConstants.SearchHighlightLimit */
            }, _contextViewService, _contextKeyService, keybindingService);
            this._instance = _instance;
            this._contextKeyService = _contextKeyService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._register(this.state.onFindReplaceStateChange(() => {
                this.show();
            }));
            this._findInputFocused = terminalContextKey_1.TerminalContextKeys.findInputFocus.bindTo(this._contextKeyService);
            this._findWidgetFocused = terminalContextKey_1.TerminalContextKeys.findFocus.bindTo(this._contextKeyService);
            this._findWidgetVisible = terminalContextKey_1.TerminalContextKeys.findVisible.bindTo(this._contextKeyService);
            const innerDom = this.getDomNode().firstChild;
            if (innerDom) {
                this._register(dom.addDisposableListener(innerDom, 'mousedown', (event) => {
                    event.stopPropagation();
                }));
                this._register(dom.addDisposableListener(innerDom, 'contextmenu', (event) => {
                    event.stopPropagation();
                }));
            }
            const findInputDomNode = this.getFindInputDomNode();
            this._register(dom.addDisposableListener(findInputDomNode, 'contextmenu', (event) => {
                (0, textInputContextMenu_1.openContextMenu)(dom.getWindow(findInputDomNode), event, _clipboardService, _contextMenuService);
                event.stopPropagation();
            }));
            this._register(this._themeService.onDidColorThemeChange(() => {
                if (this.isVisible()) {
                    this.find(true, true);
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('workbench.colorCustomizations') && this.isVisible()) {
                    this.find(true, true);
                }
            }));
            this.updateResultCount();
        }
        find(previous, update) {
            const xterm = this._instance.xterm;
            if (!xterm) {
                return;
            }
            if (previous) {
                this._findPreviousWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue(), incremental: update });
            }
            else {
                this._findNextWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
            }
        }
        reveal() {
            const initialInput = this._instance.hasSelection() && !this._instance.selection.includes('\n') ? this._instance.selection : undefined;
            const inputValue = initialInput ?? this.inputValue;
            const xterm = this._instance.xterm;
            if (xterm && inputValue && inputValue !== '') {
                // trigger highlight all matches
                this._findPreviousWithEvent(xterm, inputValue, { incremental: true, regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() }).then(foundMatch => {
                    this.updateButtons(foundMatch);
                    this._register(event_1.Event.once(xterm.onDidChangeSelection)(() => xterm.clearActiveSearchDecoration()));
                });
            }
            this.updateButtons(false);
            super.reveal(inputValue);
            this._findWidgetVisible.set(true);
        }
        show() {
            const initialInput = this._instance.hasSelection() && !this._instance.selection.includes('\n') ? this._instance.selection : undefined;
            super.show(initialInput);
            this._findWidgetVisible.set(true);
        }
        hide() {
            super.hide();
            this._findWidgetVisible.reset();
            this._instance.focus(true);
            this._instance.xterm?.clearSearchDecorations();
        }
        async _getResultCount() {
            return this._instance.xterm?.findResult;
        }
        _onInputChanged() {
            // Ignore input changes for now
            const xterm = this._instance.xterm;
            if (xterm) {
                this._findPreviousWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue(), incremental: true }).then(foundMatch => {
                    this.updateButtons(foundMatch);
                });
            }
            return false;
        }
        _onFocusTrackerFocus() {
            if ('overrideCopyOnSelection' in this._instance) {
                this._overrideCopyOnSelectionDisposable = this._instance.overrideCopyOnSelection(false);
            }
            this._findWidgetFocused.set(true);
        }
        _onFocusTrackerBlur() {
            this._overrideCopyOnSelectionDisposable?.dispose();
            this._instance.xterm?.clearActiveSearchDecoration();
            this._findWidgetFocused.reset();
        }
        _onFindInputFocusTrackerFocus() {
            this._findInputFocused.set(true);
        }
        _onFindInputFocusTrackerBlur() {
            this._findInputFocused.reset();
        }
        findFirst() {
            const instance = this._instance;
            if (instance.hasSelection()) {
                instance.clearSelection();
            }
            const xterm = instance.xterm;
            if (xterm) {
                this._findPreviousWithEvent(xterm, this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
            }
        }
        async _findNextWithEvent(xterm, term, options) {
            return xterm.findNext(term, options).then(foundMatch => {
                this._register(event_1.Event.once(xterm.onDidChangeSelection)(() => xterm.clearActiveSearchDecoration()));
                return foundMatch;
            });
        }
        async _findPreviousWithEvent(xterm, term, options) {
            return xterm.findPrevious(term, options).then(foundMatch => {
                this._register(event_1.Event.once(xterm.onDidChangeSelection)(() => xterm.clearActiveSearchDecoration()));
                return foundMatch;
            });
        }
    };
    exports.TerminalFindWidget = TerminalFindWidget;
    exports.TerminalFindWidget = TerminalFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, clipboardService_1.IClipboardService),
        __param(6, themeService_1.IThemeService),
        __param(7, configuration_1.IConfigurationService)
    ], TerminalFindWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxGaW5kV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvZmluZC9icm93c2VyL3Rlcm1pbmFsRmluZFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQmhHLE1BQU0sa0NBQWtDLEdBQUcsR0FBRyxDQUFDO0lBRXhDLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsbUNBQWdCO1FBT3ZELFlBQ1MsU0FBd0QsRUFDM0MsbUJBQXdDLEVBQ3pDLGlCQUFxQyxFQUNwQixrQkFBc0MsRUFDdEQsbUJBQXdDLEVBQzFDLGlCQUFvQyxFQUN2QixhQUE0QixFQUNwQixxQkFBNEM7WUFFcEYsS0FBSyxDQUFDO2dCQUNMLHFCQUFxQixFQUFFLElBQUk7Z0JBQzNCLHVCQUF1QixFQUFFLElBQUk7Z0JBQzdCLGVBQWUsRUFBRSxJQUFJO2dCQUNyQixZQUFZLEVBQUUsa0NBQWtDO2dCQUNoRCxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsMkJBQTJCLHFHQUEyQztnQkFDdEUsbUJBQW1CLHFGQUFtQztnQkFDdEQsd0JBQXdCLDZGQUF1QztnQkFDL0QscUJBQXFCLCtFQUFnQztnQkFDckQsaUJBQWlCLHVFQUE0QjtnQkFDN0MsbUJBQW1CLHVFQUE0QjtnQkFDL0MsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLFlBQVksd0RBQTZDO2FBQ3pELEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQXZCdkQsY0FBUyxHQUFULFNBQVMsQ0FBK0M7WUFHM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUczQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNwQiwwQkFBcUIsR0FBckIscUJB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