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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget", "vs/workbench/contrib/webview/browser/webview"], function (require, exports, contextkey_1, contextView_1, keybinding_1, simpleFindWidget_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewFindWidget = void 0;
    let WebviewFindWidget = class WebviewFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        async _getResultCount(dataChanged) {
            return undefined;
        }
        constructor(_delegate, contextViewService, contextKeyService, keybindingService) {
            super({
                showCommonFindToggles: false,
                checkImeCompletionState: _delegate.checkImeCompletionState,
                enableSash: true,
            }, contextViewService, contextKeyService, keybindingService);
            this._delegate = _delegate;
            this._findWidgetFocused = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED.bindTo(contextKeyService);
            this._register(_delegate.hasFindResult(hasResult => {
                this.updateButtons(hasResult);
                this.focusFindBox();
            }));
            this._register(_delegate.onDidStopFind(() => {
                this.updateButtons(false);
            }));
        }
        find(previous) {
            const val = this.inputValue;
            if (val) {
                this._delegate.find(val, previous);
            }
        }
        hide(animated = true) {
            super.hide(animated);
            this._delegate.stopFind(true);
            this._delegate.focus();
        }
        _onInputChanged() {
            const val = this.inputValue;
            if (val) {
                this._delegate.updateFind(val);
            }
            else {
                this._delegate.stopFind(false);
            }
            return false;
        }
        _onFocusTrackerFocus() {
            this._findWidgetFocused.set(true);
        }
        _onFocusTrackerBlur() {
            this._findWidgetFocused.reset();
        }
        _onFindInputFocusTrackerFocus() { }
        _onFindInputFocusTrackerBlur() { }
        findFirst() { }
    };
    exports.WebviewFindWidget = WebviewFindWidget;
    exports.WebviewFindWidget = WebviewFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService)
    ], WebviewFindWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0ZpbmRXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvYnJvd3Nlci93ZWJ2aWV3RmluZFdpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsbUNBQWdCO1FBQzVDLEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBcUI7WUFDcEQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUlELFlBQ2tCLFNBQThCLEVBQzFCLGtCQUF1QyxFQUN4QyxpQkFBcUMsRUFDckMsaUJBQXFDO1lBRXpELEtBQUssQ0FBQztnQkFDTCxxQkFBcUIsRUFBRSxLQUFLO2dCQUM1Qix1QkFBdUIsRUFBRSxTQUFTLENBQUMsdUJBQXVCO2dCQUMxRCxVQUFVLEVBQUUsSUFBSTthQUNoQixFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFUNUMsY0FBUyxHQUFULFNBQVMsQ0FBcUI7WUFVL0MsSUFBSSxDQUFDLGtCQUFrQixHQUFHLHdEQUE4QyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRW5HLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDbEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU0sSUFBSSxDQUFDLFFBQWlCO1lBQzVCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDNUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDVCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7UUFFZSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUk7WUFDbkMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFUyxlQUFlO1lBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDNUIsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDVCxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEMsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVTLG9CQUFvQjtZQUM3QixJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFUyxtQkFBbUI7WUFDNUIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFFUyw2QkFBNkIsS0FBSyxDQUFDO1FBRW5DLDRCQUE0QixLQUFLLENBQUM7UUFFNUMsU0FBUyxLQUFLLENBQUM7S0FDZixDQUFBO0lBbEVZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBUzNCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLCtCQUFrQixDQUFBO09BWFIsaUJBQWlCLENBa0U3QiJ9