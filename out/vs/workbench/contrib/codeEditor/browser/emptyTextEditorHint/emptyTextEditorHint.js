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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/browser/parts/editor/editorStatus", "vs/platform/commands/common/commands", "vs/editor/common/languages/modesRegistry", "vs/base/common/network", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/editor/browser/editorExtensions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/formattedTextRenderer", "vs/workbench/contrib/snippets/browser/commands/fileTemplateSnippets", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/platform/telemetry/common/telemetry", "vs/platform/product/common/productService", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/platform", "vs/base/browser/ui/aria/aria", "vs/platform/registry/common/platform", "vs/workbench/common/configuration", "vs/workbench/services/output/common/output", "vs/workbench/services/search/common/search", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./emptyTextEditorHint"], function (require, exports, dom, lifecycle_1, nls_1, editorStatus_1, commands_1, modesRegistry_1, network_1, event_1, configuration_1, editorExtensions_1, keybinding_1, editorGroupsService_1, formattedTextRenderer_1, fileTemplateSnippets_1, inlineChatSessionService_1, inlineChat_1, telemetry_1, productService_1, keybindingLabel_1, platform_1, aria_1, platform_2, configuration_2, output_1, search_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptyTextEditorHintContribution = exports.emptyTextEditorHintSetting = void 0;
    const $ = dom.$;
    // TODO@joyceerhl remove this after a few iterations
    platform_2.Registry.as(configuration_2.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'workbench.editor.untitled.hint',
            migrateFn: (value, _accessor) => ([
                [exports.emptyTextEditorHintSetting, { value }],
                ['workbench.editor.untitled.hint', { value: undefined }]
            ])
        },
        {
            key: 'accessibility.verbosity.untitledHint',
            migrateFn: (value, _accessor) => ([
                ["accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */, { value }],
                ['accessibility.verbosity.untitledHint', { value: undefined }]
            ])
        }]);
    exports.emptyTextEditorHintSetting = 'workbench.editor.empty.hint';
    let EmptyTextEditorHintContribution = class EmptyTextEditorHintContribution {
        static { this.ID = 'editor.contrib.emptyTextEditorHint'; }
        constructor(editor, editorGroupsService, commandService, configurationService, keybindingService, inlineChatSessionService, inlineChatService, telemetryService, productService) {
            this.editor = editor;
            this.editorGroupsService = editorGroupsService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.inlineChatSessionService = inlineChatSessionService;
            this.inlineChatService = inlineChatService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.toDispose = [];
            this.toDispose.push(this.editor.onDidChangeModel(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeModelLanguage(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeModelContent(() => this.update()));
            this.toDispose.push(this.inlineChatService.onDidChangeProviders(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeModelDecorations(() => this.update()));
            this.toDispose.push(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(91 /* EditorOption.readOnly */)) {
                    this.update();
                }
            }));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.emptyTextEditorHintSetting)) {
                    this.update();
                }
            }));
            this.toDispose.push(inlineChatSessionService.onWillStartSession(editor => {
                if (this.editor === editor) {
                    this.textHintContentWidget?.dispose();
                }
            }));
            this.toDispose.push(inlineChatSessionService.onDidEndSession(e => {
                if (this.editor === e.editor) {
                    this.update();
                }
            }));
        }
        _getOptions() {
            return { clickable: true };
        }
        _shouldRenderHint() {
            const configValue = this.configurationService.getValue(exports.emptyTextEditorHintSetting);
            if (configValue === 'hidden') {
                return false;
            }
            if (this.editor.getOption(91 /* EditorOption.readOnly */)) {
                return false;
            }
            const model = this.editor.getModel();
            const languageId = model?.getLanguageId();
            if (!model || languageId === output_1.OUTPUT_MODE_ID || languageId === output_1.LOG_MODE_ID || languageId === search_1.SEARCH_RESULT_LANGUAGE_ID) {
                return false;
            }
            if (this.inlineChatSessionService.getSession(this.editor, model.uri)) {
                return false;
            }
            if (this.editor.getModel()?.getValueLength()) {
                return false;
            }
            const hasConflictingDecorations = Boolean(this.editor.getLineDecorations(1)?.find((d) => d.options.beforeContentClassName
                || d.options.afterContentClassName
                || d.options.before?.content
                || d.options.after?.content));
            if (hasConflictingDecorations) {
                return false;
            }
            const inlineChatProviders = [...this.inlineChatService.getAllProvider()];
            const shouldRenderDefaultHint = model?.uri.scheme === network_1.Schemas.untitled && languageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID && !inlineChatProviders.length;
            return inlineChatProviders.length > 0 || shouldRenderDefaultHint;
        }
        update() {
            const shouldRenderHint = this._shouldRenderHint();
            if (shouldRenderHint && !this.textHintContentWidget) {
                this.textHintContentWidget = new EmptyTextEditorHintContentWidget(this.editor, this._getOptions(), this.editorGroupsService, this.commandService, this.configurationService, this.keybindingService, this.inlineChatService, this.telemetryService, this.productService);
            }
            else if (!shouldRenderHint && this.textHintContentWidget) {
                this.textHintContentWidget.dispose();
                this.textHintContentWidget = undefined;
            }
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
            this.textHintContentWidget?.dispose();
        }
    };
    exports.EmptyTextEditorHintContribution = EmptyTextEditorHintContribution;
    exports.EmptyTextEditorHintContribution = EmptyTextEditorHintContribution = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, commands_1.ICommandService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, inlineChatSessionService_1.IInlineChatSessionService),
        __param(6, inlineChat_1.IInlineChatService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, productService_1.IProductService)
    ], EmptyTextEditorHintContribution);
    class EmptyTextEditorHintContentWidget {
        static { this.ID = 'editor.widget.emptyHint'; }
        constructor(editor, options, editorGroupsService, commandService, configurationService, keybindingService, inlineChatService, telemetryService, productService) {
            this.editor = editor;
            this.options = options;
            this.editorGroupsService = editorGroupsService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.inlineChatService = inlineChatService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.isVisible = false;
            this.ariaLabel = '';
            this.toDispose = new lifecycle_1.DisposableStore();
            this.toDispose.add(this.editor.onDidChangeConfiguration((e) => {
                if (this.domNode && e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this.editor.applyFontInfo(this.domNode);
                }
            }));
            const onDidFocusEditorText = event_1.Event.debounce(this.editor.onDidFocusEditorText, () => undefined, 500);
            this.toDispose.add(onDidFocusEditorText(() => {
                if (this.editor.hasTextFocus() && this.isVisible && this.ariaLabel && this.configurationService.getValue("accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */)) {
                    (0, aria_1.status)(this.ariaLabel);
                }
            }));
            this.editor.addContentWidget(this);
        }
        getId() {
            return EmptyTextEditorHintContentWidget.ID;
        }
        _getHintInlineChat(providers) {
            const providerName = (providers.length === 1 ? providers[0].label : undefined) ?? this.productService.nameShort;
            const inlineChatId = 'inlineChat.start';
            let ariaLabel = `Ask ${providerName} something or start typing to dismiss.`;
            const handleClick = () => {
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: 'inlineChat.hintAction',
                    from: 'hint'
                });
                this.commandService.executeCommand(inlineChatId, { from: 'hint' });
            };
            const hintHandler = {
                disposables: this.toDispose,
                callback: (index, _event) => {
                    switch (index) {
                        case '0':
                            handleClick();
                            break;
                    }
                }
            };
            const hintElement = $('empty-hint-text');
            hintElement.style.display = 'block';
            const keybindingHint = this.keybindingService.lookupKeybinding(inlineChatId);
            const keybindingHintLabel = keybindingHint?.getLabel();
            if (keybindingHint && keybindingHintLabel) {
                const actionPart = (0, nls_1.localize)('emptyHintText', 'Press {0} to ask {1} to do something. ', keybindingHintLabel, providerName);
                const [before, after] = actionPart.split(keybindingHintLabel).map((fragment) => {
                    if (this.options.clickable) {
                        const hintPart = $('a', undefined, fragment);
                        hintPart.style.fontStyle = 'italic';
                        hintPart.style.cursor = 'pointer';
                        this.toDispose.add(dom.addDisposableListener(hintPart, dom.EventType.CLICK, handleClick));
                        return hintPart;
                    }
                    else {
                        const hintPart = $('span', undefined, fragment);
                        hintPart.style.fontStyle = 'italic';
                        return hintPart;
                    }
                });
                hintElement.appendChild(before);
                const label = hintHandler.disposables.add(new keybindingLabel_1.KeybindingLabel(hintElement, platform_1.OS));
                label.set(keybindingHint);
                label.element.style.width = 'min-content';
                label.element.style.display = 'inline';
                if (this.options.clickable) {
                    label.element.style.cursor = 'pointer';
                    this.toDispose.add(dom.addDisposableListener(label.element, dom.EventType.CLICK, handleClick));
                }
                hintElement.appendChild(after);
                const typeToDismiss = (0, nls_1.localize)('emptyHintTextDismiss', 'Start typing to dismiss.');
                const textHint2 = $('span', undefined, typeToDismiss);
                textHint2.style.fontStyle = 'italic';
                hintElement.appendChild(textHint2);
                ariaLabel = actionPart.concat(typeToDismiss);
            }
            else {
                const hintMsg = (0, nls_1.localize)({
                    key: 'inlineChatHint',
                    comment: [
                        'Preserve double-square brackets and their order',
                    ]
                }, '[[Ask {0} to do something]] or start typing to dismiss.', providerName);
                const rendered = (0, formattedTextRenderer_1.renderFormattedText)(hintMsg, { actionHandler: hintHandler });
                hintElement.appendChild(rendered);
            }
            return { ariaLabel, hintHandler, hintElement };
        }
        _getHintDefault() {
            const hintHandler = {
                disposables: this.toDispose,
                callback: (index, event) => {
                    switch (index) {
                        case '0':
                            languageOnClickOrTap(event.browserEvent);
                            break;
                        case '1':
                            snippetOnClickOrTap(event.browserEvent);
                            break;
                        case '2':
                            chooseEditorOnClickOrTap(event.browserEvent);
                            break;
                        case '3':
                            dontShowOnClickOrTap();
                            break;
                    }
                }
            };
            // the actual command handlers...
            const languageOnClickOrTap = async (e) => {
                e.stopPropagation();
                // Need to focus editor before so current editor becomes active and the command is properly executed
                this.editor.focus();
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: editorStatus_1.ChangeLanguageAction.ID,
                    from: 'hint'
                });
                await this.commandService.executeCommand(editorStatus_1.ChangeLanguageAction.ID, { from: 'hint' });
                this.editor.focus();
            };
            const snippetOnClickOrTap = async (e) => {
                e.stopPropagation();
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: fileTemplateSnippets_1.ApplyFileSnippetAction.Id,
                    from: 'hint'
                });
                await this.commandService.executeCommand(fileTemplateSnippets_1.ApplyFileSnippetAction.Id);
            };
            const chooseEditorOnClickOrTap = async (e) => {
                e.stopPropagation();
                const activeEditorInput = this.editorGroupsService.activeGroup.activeEditor;
                this.telemetryService.publicLog2('workbenchActionExecuted', {
                    id: 'welcome.showNewFileEntries',
                    from: 'hint'
                });
                const newEditorSelected = await this.commandService.executeCommand('welcome.showNewFileEntries', { from: 'hint' });
                // Close the active editor as long as it is untitled (swap the editors out)
                if (newEditorSelected && activeEditorInput !== null && activeEditorInput.resource?.scheme === network_1.Schemas.untitled) {
                    this.editorGroupsService.activeGroup.closeEditor(activeEditorInput, { preserveFocus: true });
                }
            };
            const dontShowOnClickOrTap = () => {
                this.configurationService.updateValue(exports.emptyTextEditorHintSetting, 'hidden');
                this.dispose();
                this.editor.focus();
            };
            const hintMsg = (0, nls_1.localize)({
                key: 'message',
                comment: [
                    'Preserve double-square brackets and their order',
                    'language refers to a programming language'
                ]
            }, '[[Select a language]], or [[fill with template]], or [[open a different editor]] to get started.\nStart typing to dismiss or [[don\'t show]] this again.');
            const hintElement = (0, formattedTextRenderer_1.renderFormattedText)(hintMsg, {
                actionHandler: hintHandler,
                renderCodeSegments: false,
            });
            hintElement.style.fontStyle = 'italic';
            // ugly way to associate keybindings...
            const keybindingsLookup = [editorStatus_1.ChangeLanguageAction.ID, fileTemplateSnippets_1.ApplyFileSnippetAction.Id, 'welcome.showNewFileEntries'];
            const keybindingLabels = keybindingsLookup.map((id) => this.keybindingService.lookupKeybinding(id)?.getLabel() ?? id);
            const ariaLabel = (0, nls_1.localize)('defaultHintAriaLabel', 'Execute {0} to select a language, execute {1} to fill with template, or execute {2} to open a different editor and get started. Start typing to dismiss.', ...keybindingLabels);
            for (const anchor of hintElement.querySelectorAll('a')) {
                anchor.style.cursor = 'pointer';
                const id = keybindingsLookup.shift();
                const title = id && this.keybindingService.lookupKeybinding(id)?.getLabel();
                hintHandler.disposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), anchor, title ?? ''));
            }
            return { hintElement, ariaLabel };
        }
        getDomNode() {
            if (!this.domNode) {
                this.domNode = $('.empty-editor-hint');
                this.domNode.style.width = 'max-content';
                this.domNode.style.paddingLeft = '4px';
                const inlineChatProviders = [...this.inlineChatService.getAllProvider()];
                const { hintElement, ariaLabel } = !inlineChatProviders.length ? this._getHintDefault() : this._getHintInlineChat(inlineChatProviders);
                this.domNode.append(hintElement);
                this.ariaLabel = ariaLabel.concat((0, nls_1.localize)('disableHint', ' Toggle {0} in settings to disable this hint.', "accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */));
                this.toDispose.add(dom.addDisposableListener(this.domNode, 'click', () => {
                    this.editor.focus();
                }));
                this.editor.applyFontInfo(this.domNode);
            }
            return this.domNode;
        }
        getPosition() {
            return {
                position: { lineNumber: 1, column: 1 },
                preference: [0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        dispose() {
            this.editor.removeContentWidget(this);
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(EmptyTextEditorHintContribution.ID, EmptyTextEditorHintContribution, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to render a help message
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHlUZXh0RWRpdG9ySGludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL2VtcHR5VGV4dEVkaXRvckhpbnQvZW1wdHlUZXh0RWRpdG9ySGludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQ2hHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsb0RBQW9EO0lBQ3BELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBVSxDQUFDLHNCQUFzQixDQUFDO1NBQzdFLCtCQUErQixDQUFDLENBQUM7WUFDakMsR0FBRyxFQUFFLGdDQUFnQztZQUNyQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDLGtDQUEwQixFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQ3ZDLENBQUMsZ0NBQWdDLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7YUFDeEQsQ0FBQztTQUNGO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsc0NBQXNDO1lBQzNDLFNBQVMsRUFBRSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLGtHQUFrRCxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUM1RCxDQUFDLHNDQUFzQyxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDO2FBQzlELENBQUM7U0FDRixDQUFDLENBQUMsQ0FBQztJQU1RLFFBQUEsMEJBQTBCLEdBQUcsNkJBQTZCLENBQUM7SUFDakUsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBK0I7aUJBRXBCLE9BQUUsR0FBRyxvQ0FBb0MsQUFBdkMsQ0FBd0M7UUFLakUs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