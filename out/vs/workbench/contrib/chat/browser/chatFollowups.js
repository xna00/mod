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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes"], function (require, exports, dom, button_1, htmlContent_1, lifecycle_1, nls_1, contextkey_1, chatAgents_1, chatParserTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatFollowups = void 0;
    const $ = dom.$;
    let ChatFollowups = class ChatFollowups extends lifecycle_1.Disposable {
        constructor(container, followups, location, options, clickHandler, contextService, chatAgentService) {
            super();
            this.location = location;
            this.options = options;
            this.clickHandler = clickHandler;
            this.contextService = contextService;
            this.chatAgentService = chatAgentService;
            const followupsContainer = dom.append(container, $('.interactive-session-followups'));
            followups.forEach(followup => this.renderFollowup(followupsContainer, followup));
        }
        renderFollowup(container, followup) {
            if (followup.kind === 'command' && followup.when && !this.contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(followup.when))) {
                return;
            }
            if (!this.chatAgentService.getDefaultAgent(this.location)) {
                // No default agent yet, which affects how followups are rendered, so can't render this yet
                return;
            }
            let tooltipPrefix = '';
            if ('agentId' in followup && followup.agentId && followup.agentId !== this.chatAgentService.getDefaultAgent(this.location)?.id) {
                const agent = this.chatAgentService.getAgent(followup.agentId);
                if (!agent) {
                    // Refers to agent that doesn't exist
                    return;
                }
                tooltipPrefix += `${chatParserTypes_1.chatAgentLeader}${agent.name} `;
                if ('subCommand' in followup && followup.subCommand) {
                    tooltipPrefix += `${chatParserTypes_1.chatSubcommandLeader}${followup.subCommand} `;
                }
            }
            const baseTitle = followup.kind === 'reply' ?
                (followup.title || followup.message)
                : followup.title;
            const tooltip = tooltipPrefix +
                ('tooltip' in followup && followup.tooltip || baseTitle);
            const button = this._register(new button_1.Button(container, { ...this.options, supportIcons: true, title: tooltip }));
            if (followup.kind === 'reply') {
                button.element.classList.add('interactive-followup-reply');
            }
            else if (followup.kind === 'command') {
                button.element.classList.add('interactive-followup-command');
            }
            button.element.ariaLabel = (0, nls_1.localize)('followUpAriaLabel', "Follow up question: {0}", followup.title);
            let label = '';
            if (followup.kind === 'reply') {
                label = '$(sparkle) ' + baseTitle;
            }
            else {
                label = baseTitle;
            }
            button.label = new htmlContent_1.MarkdownString(label, { supportThemeIcons: true });
            this._register(button.onDidClick(() => this.clickHandler(followup)));
        }
    };
    exports.ChatFollowups = ChatFollowups;
    exports.ChatFollowups = ChatFollowups = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, chatAgents_1.IChatAgentService)
    ], ChatFollowups);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEZvbGxvd3Vwcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRGb2xsb3d1cHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFVCxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUE2RCxTQUFRLHNCQUFVO1FBQzNGLFlBQ0MsU0FBc0IsRUFDdEIsU0FBYyxFQUNHLFFBQTJCLEVBQzNCLE9BQWtDLEVBQ2xDLFlBQW1DLEVBQ2YsY0FBa0MsRUFDbkMsZ0JBQW1DO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBTlMsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0IsWUFBTyxHQUFQLE9BQU8sQ0FBMkI7WUFDbEMsaUJBQVksR0FBWixZQUFZLENBQXVCO1lBQ2YsbUJBQWMsR0FBZCxjQUFjLENBQW9CO1lBQ25DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFJdkUsTUFBTSxrQkFBa0IsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUVPLGNBQWMsQ0FBQyxTQUFzQixFQUFFLFFBQVc7WUFFekQsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQywyQkFBYyxDQUFDLFdBQVcsQ0FB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