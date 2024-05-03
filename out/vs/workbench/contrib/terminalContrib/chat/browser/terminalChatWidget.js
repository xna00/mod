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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/inlineChat/browser/inlineChatWidget", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/css!./media/terminalChatWidget"], function (require, exports, dom_1, event_1, lifecycle_1, nls_1, contextkey_1, instantiation_1, chatAgents_1, inlineChatWidget_1, terminalChat_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatWidget = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["HorizontalMargin"] = 10] = "HorizontalMargin";
    })(Constants || (Constants = {}));
    let TerminalChatWidget = class TerminalChatWidget extends lifecycle_1.Disposable {
        get inlineChatWidget() { return this._inlineChatWidget; }
        constructor(_terminalElement, _instance, _instantiationService, _contextKeyService) {
            super();
            this._terminalElement = _terminalElement;
            this._instance = _instance;
            this._instantiationService = _instantiationService;
            this._contextKeyService = _contextKeyService;
            this._focusedContextKey = terminalChat_1.TerminalChatContextKeys.focused.bindTo(this._contextKeyService);
            this._visibleContextKey = terminalChat_1.TerminalChatContextKeys.visible.bindTo(this._contextKeyService);
            this._container = document.createElement('div');
            this._container.classList.add('terminal-inline-chat');
            _terminalElement.appendChild(this._container);
            this._inlineChatWidget = this._instantiationService.createInstance(inlineChatWidget_1.InlineChatWidget, chatAgents_1.ChatAgentLocation.Terminal, {
                inputMenuId: terminalChat_1.MENU_TERMINAL_CHAT_INPUT,
                widgetMenuId: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET,
                statusMenuId: {
                    menu: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_STATUS,
                    options: {
                        buttonConfigProvider: action => {
                            if (action.id === "workbench.action.terminal.chat.viewInChat" /* TerminalChatCommandId.ViewInChat */ || action.id === "workbench.action.terminal.chat.runCommand" /* TerminalChatCommandId.RunCommand */) {
                                return { isSecondary: false };
                            }
                            else {
                                return { isSecondary: true };
                            }
                        }
                    }
                },
                feedbackMenuId: terminalChat_1.MENU_TERMINAL_CHAT_WIDGET_FEEDBACK,
                telemetrySource: 'terminal-inline-chat',
                editableCodeBlocks: true
            });
            this._register(event_1.Event.any(this._inlineChatWidget.onDidChangeHeight, this._instance.onDimensionsChanged)(() => this._relayout()));
            const observer = new ResizeObserver(() => this._relayout());
            observer.observe(this._terminalElement);
            this._register((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
            this._reset();
            this._container.appendChild(this._inlineChatWidget.domNode);
            this._focusTracker = this._register((0, dom_1.trackFocus)(this._container));
            this.hide();
        }
        _relayout() {
            if (this._dimension) {
                this._doLayout(this._inlineChatWidget.contentHeight);
            }
        }
        _doLayout(heightInPixel) {
            const width = Math.min(640, this._terminalElement.clientWidth - 12 /* padding */ - 2 /* border */ - 10 /* Constants.HorizontalMargin */);
            const height = Math.min(480, heightInPixel, this._getTerminalWrapperHeight() ?? Number.MAX_SAFE_INTEGER);
            if (width === 0 || height === 0) {
                return;
            }
            this._dimension = new dom_1.Dimension(width, height);
            this._inlineChatWidget.layout(this._dimension);
            this._updateVerticalPosition();
        }
        _reset() {
            this._inlineChatWidget.placeholder = (0, nls_1.localize)('default.placeholder', "Ask how to do something in the terminal");
            this._inlineChatWidget.updateInfo((0, nls_1.localize)('welcome.1', "AI-generated commands may be incorrect"));
        }
        reveal() {
            this._doLayout(this._inlineChatWidget.contentHeight);
            this._container.classList.remove('hide');
            this._focusedContextKey.set(true);
            this._visibleContextKey.set(true);
            this._inlineChatWidget.focus();
        }
        _updateVerticalPosition() {
            const font = this._instance.xterm?.getFont();
            if (!font?.charHeight) {
                return;
            }
            const terminalWrapperHeight = this._getTerminalWrapperHeight() ?? 0;
            const cellHeight = font.charHeight * font.lineHeight;
            const topPadding = terminalWrapperHeight - (this._instance.rows * cellHeight);
            const cursorY = (this._instance.xterm?.raw.buffer.active.cursorY ?? 0) + 1;
            const top = topPadding + cursorY * cellHeight;
            this._container.style.top = `${top}px`;
            const widgetHeight = this._inlineChatWidget.contentHeight;
            if (!terminalWrapperHeight) {
                return;
            }
            if (top > terminalWrapperHeight - widgetHeight) {
                this._container.style.top = '';
            }
        }
        _getTerminalWrapperHeight() {
            return this._terminalElement.clientHeight;
        }
        hide() {
            this._container.classList.add('hide');
            this._reset();
            this._inlineChatWidget.updateChatMessage(undefined);
            this._inlineChatWidget.updateFollowUps(undefined);
            this._inlineChatWidget.updateProgress(false);
            this._inlineChatWidget.updateToolbar(false);
            this._inlineChatWidget.reset();
            this._focusedContextKey.set(false);
            this._visibleContextKey.set(false);
            this._inlineChatWidget.value = '';
            this._instance.focus();
        }
        focus() {
            this._inlineChatWidget.focus();
        }
        hasFocus() {
            return this._inlineChatWidget.hasFocus();
        }
        input() {
            return this._inlineChatWidget.value;
        }
        addToHistory(input) {
            this._inlineChatWidget.addToHistory(input);
            this._inlineChatWidget.saveState();
        }
        setValue(value) {
            this._inlineChatWidget.value = value ?? '';
        }
        acceptCommand(code, shouldExecute) {
            this._instance.runCommand(code, shouldExecute);
            this.hide();
        }
        updateProgress(progress) {
            this._inlineChatWidget.updateProgress(progress?.kind === 'content' || progress?.kind === 'markdownContent');
        }
        get focusTracker() {
            return this._focusTracker;
        }
    };
    exports.TerminalChatWidget = TerminalChatWidget;
    exports.TerminalChatWidget = TerminalChatWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextkey_1.IContextKeyService)
    ], TerminalChatWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0V2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvY2hhdC9icm93c2VyL3Rlcm1pbmFsQ2hhdFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlaEcsSUFBVyxTQUVWO0lBRkQsV0FBVyxTQUFTO1FBQ25CLGtFQUFxQixDQUFBO0lBQ3RCLENBQUMsRUFGVSxTQUFTLEtBQVQsU0FBUyxRQUVuQjtJQUVNLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7UUFLakQsSUFBVyxnQkFBZ0IsS0FBdUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBT2xGLFlBQ2tCLGdCQUE2QixFQUM3QixTQUE0QixFQUNMLHFCQUE0QyxFQUMvQyxrQkFBc0M7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFMUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWE7WUFDN0IsY0FBUyxHQUFULFNBQVMsQ0FBbUI7WUFDTCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQy9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFJM0UsSUFBSSxDQUFDLGtCQUFrQixHQUFHLHNDQUF1QixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLGtCQUFrQixHQUFHLHNDQUF1QixDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFMUYsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3RELGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFOUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQ2pFLG1DQUFnQixFQUNoQiw4QkFBaUIsQ0FBQyxRQUFRLEVBQzFCO2dCQUNDLFdBQVcsRUFBRSx1Q0FBd0I7Z0JBQ3JDLFlBQVksRUFBRSx3Q0FBeUI7Z0JBQ3ZDLFlBQVksRUFBRTtvQkFDYixJQUFJLEVBQUUsK0NBQWdDO29CQUN0QyxPQUFPLEVBQUU7d0JBQ1Isb0JBQW9CLEVBQUUsTUFBTSxDQUFDLEVBQUU7NEJBQzlCLElBQUksTUFBTSxDQUFDLEVBQUUsdUZBQXFDLElBQUksTUFBTSxDQUFDLEVBQUUsdUZBQXFDLEVBQUUsQ0FBQztnQ0FDdEcsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQzs0QkFDL0IsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUM7NEJBQzlCLENBQUM7d0JBQ0YsQ0FBQztxQkFDRDtpQkFDRDtnQkFDRCxjQUFjLEVBQUUsaURBQWtDO2dCQUNsRCxlQUFlLEVBQUUsc0JBQXNCO2dCQUN2QyxrQkFBa0IsRUFBRSxJQUFJO2FBQ3hCLENBQ0QsQ0FBQztZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FDdkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixFQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUNsQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDNUQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTFELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU1RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxnQkFBVSxFQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLENBQUM7UUFJTyxTQUFTO1lBQ2hCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN0RCxDQUFDO1FBQ0YsQ0FBQztRQUVPLFNBQVMsQ0FBQyxhQUFxQjtZQUN0QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQSxhQUFhLEdBQUcsQ0FBQyxDQUFBLFlBQVksc0NBQTZCLENBQUMsQ0FBQztZQUM5SCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixFQUFFLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDekcsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksZUFBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRU8sTUFBTTtZQUNiLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUseUNBQXlDLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDLENBQUM7UUFDcEcsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBRU8sdUJBQXVCO1lBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3JELE1BQU0sVUFBVSxHQUFHLHFCQUFxQixHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLENBQUM7WUFDOUUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sR0FBRyxHQUFHLFVBQVUsR0FBRyxPQUFPLEdBQUcsVUFBVSxDQUFDO1lBQzlDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBQ3ZDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUM7WUFDMUQsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQzVCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcscUJBQXFCLEdBQUcsWUFBWSxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFTyx5QkFBeUI7WUFDaEMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDO1FBQzNDLENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUNELEtBQUs7WUFDSixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUNELFFBQVE7WUFDUCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsS0FBSztZQUNKLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztRQUNyQyxDQUFDO1FBQ0QsWUFBWSxDQUFDLEtBQWE7WUFDekIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUNELFFBQVEsQ0FBQyxLQUFjO1lBQ3RCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsYUFBYSxDQUFDLElBQVksRUFBRSxhQUFzQjtZQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUVELGNBQWMsQ0FBQyxRQUF3QjtZQUN0QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxJQUFJLEtBQUssU0FBUyxJQUFJLFFBQVEsRUFBRSxJQUFJLEtBQUssaUJBQWlCLENBQUMsQ0FBQztRQUM3RyxDQUFDO1FBQ0QsSUFBVyxZQUFZO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO0tBQ0QsQ0FBQTtJQWxLWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQWU1QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsK0JBQWtCLENBQUE7T0FoQlIsa0JBQWtCLENBa0s5QiJ9