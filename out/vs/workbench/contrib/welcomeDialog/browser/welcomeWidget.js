/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/htmlContent", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/base/browser/ui/button/button", "vs/base/common/labels", "vs/platform/theme/browser/defaultStyles", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/nls", "vs/base/common/themables", "vs/base/common/codicons", "vs/base/common/linkedText", "vs/platform/opener/browser/link", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/formattedTextRenderer", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/css!./media/welcomeWidget"], function (require, exports, lifecycle_1, dom_1, htmlContent_1, markdownRenderer_1, button_1, labels_1, defaultStyles_1, actions_1, actionbar_1, nls_1, themables_1, codicons_1, linkedText_1, link_1, iconLabels_1, formattedTextRenderer_1, themeService_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WelcomeWidget = void 0;
    class WelcomeWidget extends lifecycle_1.Disposable {
        constructor(_editor, instantiationService, commandService, telemetryService, openerService) {
            super();
            this._editor = _editor;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.openerService = openerService;
            this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
            this._isVisible = false;
            this._rootDomNode = document.createElement('div');
            this._rootDomNode.className = 'welcome-widget';
            this.element = this._rootDomNode.appendChild((0, dom_1.$)('.monaco-dialog-box'));
            this.element.setAttribute('role', 'dialog');
            (0, dom_1.hide)(this._rootDomNode);
            this.messageContainer = this.element.appendChild((0, dom_1.$)('.dialog-message-container'));
        }
        async executeCommand(commandId, ...args) {
            try {
                await this.commandService.executeCommand(commandId, ...args);
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: commandId,
                    from: 'welcomeWidget'
                });
            }
            catch (ex) {
            }
        }
        async render(title, message, buttonText, buttonAction) {
            if (!this._editor._getViewModel()) {
                return;
            }
            await this.buildWidgetContent(title, message, buttonText, buttonAction);
            this._editor.addOverlayWidget(this);
            this._show();
            this.telemetryService.publicLog2('workbenchActionExecuted', {
                id: 'welcomeWidgetRendered',
                from: 'welcomeWidget'
            });
        }
        async buildWidgetContent(title, message, buttonText, buttonAction) {
            const actionBar = this._register(new actionbar_1.ActionBar(this.element, {}));
            const action = this._register(new actions_1.Action('dialog.close', (0, nls_1.localize)('dialogClose', "Close Dialog"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.dialogClose), true, async () => {
                this._hide();
            }));
            actionBar.push(action, { icon: true, label: false });
            const renderBody = (message, icon) => {
                const mds = new htmlContent_1.MarkdownString(undefined, { supportThemeIcons: true, supportHtml: true });
                mds.appendMarkdown(`<a class="copilot">$(${icon})</a>`);
                mds.appendMarkdown(message);
                return mds;
            };
            const titleElement = this.messageContainer.appendChild((0, dom_1.$)('#monaco-dialog-message-detail.dialog-message-detail-title'));
            const titleElementMdt = this.markdownRenderer.render(renderBody(title, 'zap'));
            titleElement.appendChild(titleElementMdt.element);
            this.buildStepMarkdownDescription(this.messageContainer, message.split('\n').filter(x => x).map(text => (0, linkedText_1.parseLinkedText)(text)));
            const buttonsRowElement = this.messageContainer.appendChild((0, dom_1.$)('.dialog-buttons-row'));
            const buttonContainer = buttonsRowElement.appendChild((0, dom_1.$)('.dialog-buttons'));
            const buttonBar = this._register(new button_1.ButtonBar(buttonContainer));
            const primaryButton = this._register(buttonBar.addButtonWithDescription({ title: true, secondary: false, ...defaultStyles_1.defaultButtonStyles }));
            primaryButton.label = (0, labels_1.mnemonicButtonLabel)(buttonText, true);
            this._register(primaryButton.onDidClick(async () => {
                await this.executeCommand(buttonAction);
            }));
            buttonBar.buttons[0].focus();
        }
        buildStepMarkdownDescription(container, text) {
            for (const linkedText of text) {
                const p = (0, dom_1.append)(container, (0, dom_1.$)('p'));
                for (const node of linkedText.nodes) {
                    if (typeof node === 'string') {
                        const labelWithIcon = (0, iconLabels_1.renderLabelWithIcons)(node);
                        for (const element of labelWithIcon) {
                            if (typeof element === 'string') {
                                p.appendChild((0, formattedTextRenderer_1.renderFormattedText)(element, { inline: true, renderCodeSegments: true }));
                            }
                            else {
                                p.appendChild(element);
                            }
                        }
                    }
                    else {
                        const link = this.instantiationService.createInstance(link_1.Link, p, node, {
                            opener: (href) => {
                                this.telemetryService.publicLog2('workbenchActionExecuted', {
                                    id: 'welcomeWidetLinkAction',
                                    from: 'welcomeWidget'
                                });
                                this.openerService.open(href, { allowCommands: true });
                            }
                        });
                        this._register(link);
                    }
                }
            }
            return container;
        }
        getId() {
            return 'editor.contrib.welcomeWidget';
        }
        getDomNode() {
            return this._rootDomNode;
        }
        getPosition() {
            return {
                preference: 0 /* OverlayWidgetPositionPreference.TOP_RIGHT_CORNER */
            };
        }
        _show() {
            if (this._isVisible) {
                return;
            }
            this._isVisible = true;
            this._rootDomNode.style.display = 'block';
        }
        _hide() {
            if (!this._isVisible) {
                return;
            }
            this._isVisible = true;
            this._rootDomNode.style.display = 'none';
            this._editor.removeOverlayWidget(this);
            this.telemetryService.publicLog2('workbenchActionExecuted', {
                id: 'welcomeWidgetDismissed',
                from: 'welcomeWidget'
            });
        }
    }
    exports.WelcomeWidget = WelcomeWidget;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const addBackgroundColorRule = (selector, color) => {
            if (color) {
                collector.addRule(`.monaco-editor ${selector} { background-color: ${color}; }`);
            }
        };
        const widgetBackground = theme.getColor(colorRegistry_1.editorWidgetBackground);
        addBackgroundColorRule('.welcome-widget', widgetBackground);
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.welcome-widget { box-shadow: 0 0 8px 2px ${widgetShadowColor}; }`);
        }
        const widgetBorderColor = theme.getColor(colorRegistry_1.widgetBorder);
        if (widgetBorderColor) {
            collector.addRule(`.welcome-widget { border-left: 1px solid ${widgetBorderColor}; border-right: 1px solid ${widgetBorderColor}; border-bottom: 1px solid ${widgetBorderColor}; }`);
        }
        const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
        if (hcBorder) {
            collector.addRule(`.welcome-widget { border: 1px solid ${hcBorder}; }`);
        }
        const foreground = theme.getColor(colorRegistry_1.editorWidgetForeground);
        if (foreground) {
            collector.addRule(`.welcome-widget { color: ${foreground}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VsY29tZVdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZURpYWxvZy9icm93c2VyL3dlbGNvbWVXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNEJoRyxNQUFhLGFBQWMsU0FBUSxzQkFBVTtRQU81QyxZQUNrQixPQUFvQixFQUNwQixvQkFBMkMsRUFDM0MsY0FBK0IsRUFDL0IsZ0JBQW1DLEVBQ25DLGFBQTZCO1lBRTlDLEtBQUssRUFBRSxDQUFDO1lBTlMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNwQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQVA5QixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1DQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBK0gzRixlQUFVLEdBQVksS0FBSyxDQUFDO1lBckhuQyxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUM7WUFFL0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFBLE9BQUMsRUFBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTVDLElBQUEsVUFBSSxFQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FB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