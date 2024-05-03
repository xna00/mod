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
define(["require", "exports", "vs/base/common/marked/marked", "vs/nls", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/chat/common/chatViewModel"], function (require, exports, marked_1, nls_1, accessibleView_1, chatViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatAccessibilityProvider = void 0;
    let ChatAccessibilityProvider = class ChatAccessibilityProvider {
        constructor(_accessibleViewService) {
            this._accessibleViewService = _accessibleViewService;
        }
        getWidgetRole() {
            return 'list';
        }
        getRole(element) {
            return 'listitem';
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('chat', "Chat");
        }
        getAriaLabel(element) {
            if ((0, chatViewModel_1.isRequestVM)(element)) {
                return element.messageText;
            }
            if ((0, chatViewModel_1.isResponseVM)(element)) {
                return this._getLabelWithCodeBlockCount(element);
            }
            if ((0, chatViewModel_1.isWelcomeVM)(element)) {
                return element.content.map(c => 'value' in c ? c.value : c.map(followup => followup.message).join('\n')).join('\n');
            }
            return '';
        }
        _getLabelWithCodeBlockCount(element) {
            const accessibleViewHint = this._accessibleViewService.getOpenAriaHint("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */);
            let label = '';
            const fileTreeCount = element.response.value.filter((v) => !('value' in v))?.length ?? 0;
            let fileTreeCountHint = '';
            switch (fileTreeCount) {
                case 0:
                    break;
                case 1:
                    fileTreeCountHint = (0, nls_1.localize)('singleFileTreeHint', "1 file tree");
                    break;
                default:
                    fileTreeCountHint = (0, nls_1.localize)('multiFileTreeHint', "{0} file trees", fileTreeCount);
                    break;
            }
            const codeBlockCount = marked_1.marked.lexer(element.response.asString()).filter(token => token.type === 'code')?.length ?? 0;
            switch (codeBlockCount) {
                case 0:
                    label = accessibleViewHint ? (0, nls_1.localize)('noCodeBlocksHint', "{0} {1} {2}", fileTreeCountHint, element.response.asString(), accessibleViewHint) : (0, nls_1.localize)('noCodeBlocks', "{0} {1}", fileTreeCountHint, element.response.asString());
                    break;
                case 1:
                    label = accessibleViewHint ? (0, nls_1.localize)('singleCodeBlockHint', "{0} 1 code block: {1} {2}", fileTreeCountHint, element.response.asString(), accessibleViewHint) : (0, nls_1.localize)('singleCodeBlock', "{0} 1 code block: {1}", fileTreeCountHint, element.response.asString());
                    break;
                default:
                    label = accessibleViewHint ? (0, nls_1.localize)('multiCodeBlockHint', "{0} {1} code blocks: {2}", fileTreeCountHint, codeBlockCount, element.response.asString(), accessibleViewHint) : (0, nls_1.localize)('multiCodeBlock', "{0} {1} code blocks", fileTreeCountHint, codeBlockCount, element.response.asString());
                    break;
            }
            return label;
        }
    };
    exports.ChatAccessibilityProvider = ChatAccessibilityProvider;
    exports.ChatAccessibilityProvider = ChatAccessibilityProvider = __decorate([
        __param(0, accessibleView_1.IAccessibleViewService)
    ], ChatAccessibilityProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjY2Vzc2liaWxpdHlQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRBY2Nlc3NpYmlsaXR5UHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQXlCO1FBRXJDLFlBQzBDLHNCQUE4QztZQUE5QywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1FBR3hGLENBQUM7UUFDRCxhQUFhO1lBQ1osT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsT0FBTyxDQUFDLE9BQXFCO1lBQzVCLE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFRCxrQkFBa0I7WUFDakIsT0FBTyxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELFlBQVksQ0FBQyxPQUFxQjtZQUNqQyxJQUFJLElBQUEsMkJBQVcsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDNUIsQ0FBQztZQUVELElBQUksSUFBQSw0QkFBWSxFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sSUFBSSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFFRCxJQUFJLElBQUEsMkJBQVcsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMs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