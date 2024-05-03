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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/bracketMatching/browser/bracketMatching", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition", "vs/editor/contrib/hover/browser/hover", "vs/editor/contrib/semanticTokens/browser/viewportSemanticTokens", "vs/editor/contrib/smartSelect/browser/smartSelect", "vs/editor/contrib/wordHighlighter/browser/wordHighlighter", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/toolbar", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/editor/browser/config/tabFocus", "vs/css!./codeBlockPart"], function (require, exports, dom, button_1, codicons_1, event_1, lifecycle_1, network_1, uri_1, editorExtensions_1, codeEditorWidget_1, editorOptions_1, range_1, model_1, resolverService_1, bracketMatching_1, contextmenu_1, goToDefinitionAtPosition_1, hover_1, viewportSemanticTokens_1, smartSelect_1, wordHighlighter_1, nls_1, accessibility_1, toolbar_1, configuration_1, contextkey_1, instantiation_1, serviceCollection_1, chatViewModel_1, menuPreventer_1, selectionClipboard_1, simpleEditorOptions_1, tabFocus_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatCodeBlockContentProvider = exports.CodeBlockPart = exports.localFileLanguageId = void 0;
    exports.parseLocalFileData = parseLocalFileData;
    const $ = dom.$;
    /**
     * Special markdown code block language id used to render a local file.
     *
     * The text of the code path should be a {@link LocalFileCodeBlockData} json object.
     */
    exports.localFileLanguageId = 'vscode-local-file';
    function parseLocalFileData(text) {
        let data;
        try {
            data = JSON.parse(text);
        }
        catch (e) {
            throw new Error('Could not parse code block local file data');
        }
        let uri;
        try {
            uri = uri_1.URI.revive(data?.uri);
        }
        catch (e) {
            throw new Error('Invalid code block local file data URI');
        }
        let range;
        if (data.range) {
            // Note that since this is coming from extensions, position are actually zero based and must be converted.
            range = new range_1.Range(data.range.startLineNumber + 1, data.range.startColumn + 1, data.range.endLineNumber + 1, data.range.endColumn + 1);
        }
        return { uri, range };
    }
    const defaultCodeblockPadding = 10;
    let CodeBlockPart = class CodeBlockPart extends lifecycle_1.Disposable {
        constructor(options, menuId, delegate, overflowWidgetsDomNode, instantiationService, contextKeyService, modelService, configurationService, accessibilityService) {
            super();
            this.options = options;
            this.menuId = menuId;
            this.modelService = modelService;
            this.configurationService = configurationService;
            this.accessibilityService = accessibilityService;
            this._onDidChangeContentHeight = this._register(new event_1.Emitter());
            this.onDidChangeContentHeight = this._onDidChangeContentHeight.event;
            this.currentScrollWidth = 0;
            this.element = $('.interactive-result-code-block');
            this.contextKeyService = this._register(contextKeyService.createScoped(this.element));
            const scopedInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]));
            const editorElement = dom.append(this.element, $('.interactive-result-editor'));
            this.editor = this.createEditor(scopedInstantiationService, editorElement, {
                ...(0, simpleEditorOptions_1.getSimpleEditorOptions)(this.configurationService),
                readOnly: true,
                lineNumbers: 'off',
                selectOnLineNumbers: true,
                scrollBeyondLastLine: false,
                lineDecorationsWidth: 8,
                dragAndDrop: false,
                padding: { top: defaultCodeblockPadding, bottom: defaultCodeblockPadding },
                mouseWheelZoom: false,
                scrollbar: {
                    vertical: 'hidden',
                    alwaysConsumeMouseWheel: false
                },
                definitionLinkOpensInPeek: false,
                gotoLocation: {
                    multiple: 'goto',
                    multipleDeclarations: 'goto',
                    multipleDefinitions: 'goto',
                    multipleImplementations: 'goto',
                },
                ariaLabel: (0, nls_1.localize)('chat.codeBlockHelp', 'Code block'),
                overflowWidgetsDomNode,
                ...this.getEditorOptionsFromConfig(),
            });
            const toolbarElement = dom.append(this.element, $('.interactive-result-code-block-toolbar'));
            const editorScopedService = this.editor.contextKeyService.createScoped(toolbarElement);
            const editorScopedInstantiationService = scopedInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorScopedService]));
            this.toolbar = this._register(editorScopedInstantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, toolbarElement, menuId, {
                menuOptions: {
                    shouldForwardArgs: true
                }
            }));
            const vulnsContainer = dom.append(this.element, $('.interactive-result-vulns'));
            const vulnsHeaderElement = dom.append(vulnsContainer, $('.interactive-result-vulns-header', undefined));
            this.vulnsButton = this._register(new button_1.Button(vulnsHeaderElement, {
                buttonBackground: undefined,
                buttonBorder: undefined,
                buttonForeground: undefined,
                buttonHoverBackground: undefined,
                buttonSecondaryBackground: undefined,
                buttonSecondaryForeground: undefined,
                buttonSecondaryHoverBackground: undefined,
                buttonSeparator: undefined,
                supportIcons: true
            }));
            this.vulnsListElement = dom.append(vulnsContainer, $('ul.interactive-result-vulns-list'));
            this._register(this.vulnsButton.onDidClick(() => {
                const element = this.currentCodeBlockData.element;
                element.vulnerabilitiesListExpanded = !element.vulnerabilitiesListExpanded;
                this.vulnsButton.label = this.getVulnerabilitiesLabel();
                this.element.classList.toggle('chat-vulnerabilities-collapsed', !element.vulnerabilitiesListExpanded);
                this._onDidChangeContentHeight.fire();
                // this.updateAriaLabel(collapseButton.element, referencesLabel, element.usedReferencesExpanded);
            }));
            this._register(this.toolbar.onDidChangeDropdownVisibility(e => {
                toolbarElement.classList.toggle('force-visibility', e);
            }));
            this._configureForScreenReader();
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => this._configureForScreenReader()));
            this._register(this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectedKeys.has("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */)) {
                    this._configureForScreenReader();
                }
            }));
            this._register(this.options.onDidChange(() => {
                this.editor.updateOptions(this.getEditorOptionsFromConfig());
            }));
            this._register(this.editor.onDidScrollChange(e => {
                this.currentScrollWidth = e.scrollWidth;
            }));
            this._register(this.editor.onDidContentSizeChange(e => {
                if (e.contentHeightChanged) {
                    this._onDidChangeContentHeight.fire();
                }
            }));
            this._register(this.editor.onDidBlurEditorWidget(() => {
                this.element.classList.remove('focused');
                wordHighlighter_1.WordHighlighterContribution.get(this.editor)?.stopHighlighting();
                this.clearWidgets();
            }));
            this._register(this.editor.onDidFocusEditorWidget(() => {
                this.element.classList.add('focused');
                wordHighlighter_1.WordHighlighterContribution.get(this.editor)?.restoreViewState(true);
            }));
            // Parent list scrolled
            if (delegate.onDidScroll) {
                this._register(delegate.onDidScroll(e => {
                    this.clearWidgets();
                }));
            }
        }
        get uri() {
            return this.editor.getModel()?.uri;
        }
        createEditor(instantiationService, parent, options) {
            return this._register(instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, options, {
                isSimpleWidget: false,
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    wordHighlighter_1.WordHighlighterContribution.ID,
                    viewportSemanticTokens_1.ViewportSemanticTokensContribution.ID,
                    bracketMatching_1.BracketMatchingController.ID,
                    smartSelect_1.SmartSelectController.ID,
                    hover_1.HoverController.ID,
                    goToDefinitionAtPosition_1.GotoDefinitionAtPositionEditorContribution.ID,
                ])
            }));
        }
        focus() {
            this.editor.focus();
        }
        updatePaddingForLayout() {
            // scrollWidth = "the width of the content that needs to be scrolled"
            // contentWidth = "the width of the area where content is displayed"
            const horizontalScrollbarVisible = this.currentScrollWidth > this.editor.getLayoutInfo().contentWidth;
            const scrollbarHeight = this.editor.getLayoutInfo().horizontalScrollbarHeight;
            const bottomPadding = horizontalScrollbarVisible ?
                Math.max(defaultCodeblockPadding - scrollbarHeight, 2) :
                defaultCodeblockPadding;
            this.editor.updateOptions({ padding: { top: defaultCodeblockPadding, bottom: bottomPadding } });
        }
        _configureForScreenReader() {
            const toolbarElt = this.toolbar.getElement();
            if (this.accessibilityService.isScreenReaderOptimized()) {
                toolbarElt.style.display = 'block';
                toolbarElt.ariaLabel = this.configurationService.getValue("accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */) ? (0, nls_1.localize)('chat.codeBlock.toolbarVerbose', 'Toolbar for code block which can be reached via tab') : (0, nls_1.localize)('chat.codeBlock.toolbar', 'Code block toolbar');
            }
            else {
                toolbarElt.style.display = '';
            }
        }
        getEditorOptionsFromConfig() {
            return {
                wordWrap: this.options.configuration.resultEditor.wordWrap,
                fontLigatures: this.options.configuration.resultEditor.fontLigatures,
                bracketPairColorization: this.options.configuration.resultEditor.bracketPairColorization,
                fontFamily: this.options.configuration.resultEditor.fontFamily === 'default' ?
                    editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily :
                    this.options.configuration.resultEditor.fontFamily,
                fontSize: this.options.configuration.resultEditor.fontSize,
                fontWeight: this.options.configuration.resultEditor.fontWeight,
                lineHeight: this.options.configuration.resultEditor.lineHeight,
            };
        }
        layout(width) {
            const contentHeight = this.getContentHeight();
            const editorBorder = 2;
            this.editor.layout({ width: width - editorBorder, height: contentHeight });
            this.updatePaddingForLayout();
        }
        getContentHeight() {
            if (this.currentCodeBlockData?.range) {
                const lineCount = this.currentCodeBlockData.range.endLineNumber - this.currentCodeBlockData.range.startLineNumber + 1;
                const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
                return lineCount * lineHeight;
            }
            return this.editor.getContentHeight();
        }
        async render(data, width, editable) {
            this.currentCodeBlockData = data;
            if (data.parentContextKeyService) {
                this.contextKeyService.updateParent(data.parentContextKeyService);
            }
            if (this.options.configuration.resultEditor.wordWrap === 'on') {
                // Initialize the editor with the new proper width so that getContentHeight
                // will be computed correctly in the next call to layout()
                this.layout(width);
            }
            await this.updateEditor(data);
            this.layout(width);
            if (editable) {
                this._register(this.editor.onDidFocusEditorWidget(() => tabFocus_1.TabFocus.setTabFocusMode(true)));
                this._register(this.editor.onDidBlurEditorWidget(() => tabFocus_1.TabFocus.setTabFocusMode(false)));
            }
            this.editor.updateOptions({ ariaLabel: (0, nls_1.localize)('chat.codeBlockLabel', "Code block {0}", data.codeBlockIndex + 1), readOnly: !editable });
            if (data.hideToolbar) {
                dom.hide(this.toolbar.getElement());
            }
            else {
                dom.show(this.toolbar.getElement());
            }
            if (data.vulns?.length && (0, chatViewModel_1.isResponseVM)(data.element)) {
                dom.clearNode(this.vulnsListElement);
                this.element.classList.remove('no-vulns');
                this.element.classList.toggle('chat-vulnerabilities-collapsed', !data.element.vulnerabilitiesListExpanded);
                dom.append(this.vulnsListElement, ...data.vulns.map(v => $('li', undefined, $('span.chat-vuln-title', undefined, v.title), ' ' + v.description)));
                this.vulnsButton.label = this.getVulnerabilitiesLabel();
            }
            else {
                this.element.classList.add('no-vulns');
            }
        }
        reset() {
            this.clearWidgets();
        }
        clearWidgets() {
            hover_1.HoverController.get(this.editor)?.hideContentHover();
        }
        async updateEditor(data) {
            const textModel = (await data.textModel).textEditorModel;
            this.editor.setModel(textModel);
            if (data.range) {
                this.editor.setSelection(data.range);
                this.editor.revealRangeInCenter(data.range, 1 /* ScrollType.Immediate */);
            }
            this.toolbar.context = {
                code: textModel.getTextBuffer().getValueInRange(data.range ?? textModel.getFullModelRange(), 0 /* EndOfLinePreference.TextDefined */),
                codeBlockIndex: data.codeBlockIndex,
                element: data.element,
                languageId: textModel.getLanguageId()
            };
        }
        getVulnerabilitiesLabel() {
            if (!this.currentCodeBlockData || !this.currentCodeBlockData.vulns) {
                return '';
            }
            const referencesLabel = this.currentCodeBlockData.vulns.length > 1 ?
                (0, nls_1.localize)('vulnerabilitiesPlural', "{0} vulnerabilities", this.currentCodeBlockData.vulns.length) :
                (0, nls_1.localize)('vulnerabilitiesSingular', "{0} vulnerability", 1);
            const icon = (element) => element.vulnerabilitiesListExpanded ? codicons_1.Codicon.chevronDown : codicons_1.Codicon.chevronRight;
            return `${referencesLabel} $(${icon(this.currentCodeBlockData.element).id})`;
        }
    };
    exports.CodeBlockPart = CodeBlockPart;
    exports.CodeBlockPart = CodeBlockPart = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, model_1.IModelService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, accessibility_1.IAccessibilityService)
    ], CodeBlockPart);
    let ChatCodeBlockContentProvider = class ChatCodeBlockContentProvider extends lifecycle_1.Disposable {
        constructor(textModelService, _modelService) {
            super();
            this._modelService = _modelService;
            this._register(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeChatCodeBlock, this));
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            return this._modelService.createModel('', null, resource);
        }
    };
    exports.ChatCodeBlockContentProvider = ChatCodeBlockContentProvider;
    exports.ChatCodeBlockContentProvider = ChatCodeBlockContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], ChatCodeBlockContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUJsb2NrUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NvZGVCbG9ja1BhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUVoRyxnREE0QkM7SUFwREQsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQWdCaEI7Ozs7T0FJRztJQUNVLFFBQUEsbUJBQW1CLEdBQUcsbUJBQW1CLENBQUM7SUFHdkQsU0FBZ0Isa0JBQWtCLENBQUMsSUFBWTtRQU85QyxJQUFJLElBQStCLENBQUM7UUFDcEMsSUFBSSxDQUFDO1lBQ0osSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELElBQUksR0FBUSxDQUFDO1FBQ2IsSUFBSSxDQUFDO1lBQ0osR0FBRyxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxJQUFJLEtBQXlCLENBQUM7UUFDOUIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDaEIsMEdBQTBHO1lBQzFHLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFF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