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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages/textToHtmlTokenizer", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/view/renderers/webviewPreloads", "vs/workbench/contrib/notebook/browser/view/renderers/webviewThemeMapping", "vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookLoggingService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewWindowDragMonitor", "vs/workbench/contrib/webview/common/webview", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService"], function (require, exports, dom_1, arrays_1, async_1, buffer_1, event_1, mime_1, network_1, objects_1, osPath, platform_1, resources_1, uri_1, UUID, languages_1, language_1, tokenization_1, textToHtmlTokenizer_1, nls, actions_1, configuration_1, contextkey_1, contextView_1, dialogs_1, files_1, opener_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, workspace_1, workspaceTrust_1, notebookBrowser_1, notebookCellList_1, webviewPreloads_1, webviewThemeMapping_1, markupCellViewModel_1, notebookCommon_1, notebookLoggingService_1, notebookService_1, webview_1, webviewWindowDragMonitor_1, webview_2, editorGroupsService_1, environmentService_1, pathService_1) {
    "use strict";
    var BackLayerWebView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackLayerWebView = void 0;
    const LINE_COLUMN_REGEX = /:([\d]+)(?::([\d]+))?$/;
    const LineQueryRegex = /line=(\d+)$/;
    const FRAGMENT_REGEX = /^(.*)#([^#]*)$/;
    let BackLayerWebView = class BackLayerWebView extends themeService_1.Themable {
        static { BackLayerWebView_1 = this; }
        static getOriginStore(storageService) {
            this._originStore ??= new webview_1.WebviewOriginStore('notebook.backlayerWebview.origins', storageService);
            return this._originStore;
        }
        constructor(notebookEditor, id, notebookViewType, documentUri, options, rendererMessaging, webviewService, openerService, notebookService, contextService, environmentService, fileDialogService, fileService, contextMenuService, contextKeyService, workspaceTrustManagementService, configurationService, languageService, workspaceContextService, editorGroupService, storageService, pathService, notebookLogService, themeService, telemetryService) {
            super(themeService);
            this.notebookEditor = notebookEditor;
            this.id = id;
            this.notebookViewType = notebookViewType;
            this.documentUri = documentUri;
            this.options = options;
            this.rendererMessaging = rendererMessaging;
            this.webviewService = webviewService;
            this.openerService = openerService;
            this.notebookService = notebookService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.fileDialogService = fileDialogService;
            this.fileService = fileService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.languageService = languageService;
            this.workspaceContextService = workspaceContextService;
            this.editorGroupService = editorGroupService;
            this.storageService = storageService;
            this.pathService = pathService;
            this.notebookLogService = notebookLogService;
            this.telemetryService = telemetryService;
            this.webview = undefined;
            this.insetMapping = new Map();
            this.pendingWebviewIdleCreationRequest = new Map();
            this.pendingWebviewIdleInsetMapping = new Map();
            this.reversedPendingWebviewIdleInsetMapping = new Map();
            this.markupPreviewMapping = new Map();
            this.hiddenInsetMapping = new Set();
            this.reversedInsetMapping = new Map();
            this.localResourceRootsCache = undefined;
            this._onMessage = this._register(new event_1.Emitter());
            this._preloadsCache = new Set();
            this.onMessage = this._onMessage.event;
            this._disposed = false;
            this.firstInit = true;
            this.nonce = UUID.generateUuid();
            this._logRendererDebugMessage('Creating backlayer webview for notebook');
            this.element = document.createElement('div');
            this.element.style.height = '1400px';
            this.element.style.position = 'absolute';
            if (rendererMessaging) {
                this._register(rendererMessaging);
                rendererMessaging.receiveMessageHandler = (rendererId, message) => {
                    if (!this.webview || this._disposed) {
                        return Promise.resolve(false);
                    }
                    this._sendMessageToWebview({
                        __vscode_notebook_message: true,
                        type: 'customRendererMessage',
                        rendererId: rendererId,
                        message: message
                    });
                    return Promise.resolve(true);
                };
            }
            this._register(workspaceTrustManagementService.onDidChangeTrust(e => {
                const baseUrl = this.asWebviewUri(this.getNotebookBaseUri(), undefined);
                const htmlContent = this.generateContent(baseUrl.toString());
                this.webview?.setHtml(htmlContent);
            }));
            this._register(languages_1.TokenizationRegistry.onDidChange(() => {
                this._sendMessageToWebview({
                    type: 'tokenizedStylesChanged',
                    css: getTokenizationCss(),
                });
            }));
        }
        updateOptions(options) {
            this.options = options;
            this._updateStyles();
            this._updateOptions();
        }
        _logRendererDebugMessage(msg) {
            this.notebookLogService.debug('BacklayerWebview', `${this.documentUri} (${this.id}) - ${msg}`);
        }
        _updateStyles() {
            this._sendMessageToWebview({
                type: 'notebookStyles',
                styles: this._generateStyles()
            });
        }
        _updateOptions() {
            this._sendMessageToWebview({
                type: 'notebookOptions',
                options: {
                    dragAndDropEnabled: this.options.dragAndDropEnabled
                },
                renderOptions: {
                    lineLimit: this.options.outputLineLimit,
                    outputScrolling: this.options.outputScrolling,
                    outputWordWrap: this.options.outputWordWrap,
                    linkifyFilePaths: this.options.outputLinkifyFilePaths,
                }
            });
        }
        _generateStyles() {
            return {
                'notebook-output-left-margin': `${this.options.leftMargin + this.options.runGutter}px`,
                'notebook-output-width': `calc(100% - ${this.options.leftMargin + this.options.rightMargin + this.options.runGutter}px)`,
                'notebook-output-node-padding': `${this.options.outputNodePadding}px`,
                'notebook-run-gutter': `${this.options.runGutter}px`,
                'notebook-preview-node-padding': `${this.options.previewNodePadding}px`,
                'notebook-markdown-left-margin': `${this.options.markdownLeftMargin}px`,
                'notebook-output-node-left-padding': `${this.options.outputNodeLeftPadding}px`,
                'notebook-markdown-min-height': `${this.options.previewNodePadding * 2}px`,
                'notebook-markup-font-size': typeof this.options.markupFontSize === 'number' && this.options.markupFontSize > 0 ? `${this.options.markupFontSize}px` : `calc(${this.options.fontSize}px * 1.2)`,
                'notebook-cell-output-font-size': `${this.options.outputFontSize || this.options.fontSize}px`,
                'notebook-cell-output-line-height': `${this.options.outputLineHeight}px`,
                'notebook-cell-output-max-height': `${this.options.outputLineHeight * this.options.outputLineLimit}px`,
                'notebook-cell-output-font-family': this.options.outputFontFamily || this.options.fontFamily,
                'notebook-cell-markup-empty-content': nls.localize('notebook.emptyMarkdownPlaceholder', "Empty markdown cell, double-click or press enter to edit."),
                'notebook-cell-renderer-not-found-error': nls.localize({
                    key: 'notebook.error.rendererNotFound',
                    comment: ['$0 is a placeholder for the mime type']
                }, "No renderer found for '$0'"),
                'notebook-cell-renderer-fallbacks-exhausted': nls.localize({
                    key: 'notebook.error.rendererFallbacksExhausted',
                    comment: ['$0 is a placeholder for the mime type']
                }, "Could not render content for '$0'"),
            };
        }
        generateContent(baseUrl) {
            const renderersData = this.getRendererData();
            const preloadsData = this.getStaticPreloadsData();
            const renderOptions = {
                lineLimit: this.options.outputLineLimit,
                outputScrolling: this.options.outputScrolling,
                outputWordWrap: this.options.outputWordWrap,
                linkifyFilePaths: this.options.outputLinkifyFilePaths
            };
            const preloadScript = (0, webviewPreloads_1.preloadsScriptStr)({
                ...this.options,
                tokenizationCss: getTokenizationCss(),
            }, { dragAndDropEnabled: this.options.dragAndDropEnabled }, renderOptions, renderersData, preloadsData, this.workspaceTrustManagementService.isWorkspaceTrusted(), this.nonce);
            const enableCsp = this.configurationService.getValue('notebook.experimental.enableCsp');
            const currentHighlight = this.getColor(colorRegistry_1.editorFindMatch);
            const findMatchHighlight = this.getColor(colorRegistry_1.editorFindMatchHighlight);
            return /* html */ `
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<base href="${baseUrl}/" />
				${enableCsp ?
                `<meta http-equiv="Content-Security-Policy" content="
					default-src 'none';
					script-src ${webview_2.webviewGenericCspSource} 'unsafe-inline' 'unsafe-eval';
					style-src ${webview_2.webviewGenericCspSource} 'unsafe-inline';
					img-src ${webview_2.webviewGenericCspSource} https: http: data:;
					font-src ${webview_2.webviewGenericCspSource} https:;
					connect-src https:;
					child-src https: data:;
				">` : ''}
				<style nonce="${this.nonce}">
					::highlight(find-highlight) {
						background-color: var(--vscode-editor-findMatchBackground, ${findMatchHighlight});
					}

					::highlight(current-find-highlight) {
						background-color: var(--vscode-editor-findMatchHighlightBackground, ${currentHighlight});
					}

					#container .cell_container {
						width: 100%;
					}

					#container .output_container {
						width: 100%;
					}

					#container > div > div > div.output {
						font-size: var(--notebook-cell-output-font-size);
						width: var(--notebook-output-width);
						margin-left: var(--notebook-output-left-margin);
						background-color: var(--theme-notebook-output-background);
						padding-top: var(--notebook-output-node-padding);
						padding-right: var(--notebook-output-node-padding);
						padding-bottom: var(--notebook-output-node-padding);
						padding-left: var(--notebook-output-node-left-padding);
						box-sizing: border-box;
						border-top: none;
					}

					/* markdown */
					#container div.preview {
						width: 100%;
						padding-right: var(--notebook-preview-node-padding);
						padding-left: var(--notebook-markdown-left-margin);
						padding-top: var(--notebook-preview-node-padding);
						padding-bottom: var(--notebook-preview-node-padding);

						box-sizing: border-box;
						white-space: nowrap;
						overflow: hidden;
						white-space: initial;

						font-size: var(--notebook-markup-font-size);
						color: var(--theme-ui-foreground);
					}

					#container div.preview.draggable {
						user-select: none;
						-webkit-user-select: none;
						-ms-user-select: none;
						cursor: grab;
					}

					#container div.preview.selected {
						background: var(--theme-notebook-cell-selected-background);
					}

					#container div.preview.dragging {
						background-color: var(--theme-background);
						opacity: 0.5 !important;
					}

					.monaco-workbench.vs-dark .notebookOverlay .cell.markdown .latex img,
					.monaco-workbench.vs-dark .notebookOverlay .cell.markdown .latex-block img {
						filter: brightness(0) invert(1)
					}

					#container .markup > div.nb-symbolHighlight {
						background-color: var(--theme-notebook-symbol-highlight-background);
					}

					#container .nb-symbolHighlight .output_container .output {
						background-color: var(--theme-notebook-symbol-highlight-background);
					}

					#container .nb-chatGenerationHighlight .output_container .output {
						background-color: var(--vscode-notebook-selectedCellBackground);
					}

					#container > div.nb-cellDeleted .output_container {
						background-color: var(--theme-notebook-diff-removed-background);
					}

					#container > div.nb-cellAdded .output_container {
						background-color: var(--theme-notebook-diff-inserted-background);
					}

					#container > div > div:not(.preview) > div {
						overflow-x: auto;
					}

					#container .no-renderer-error {
						color: var(--vscode-editorError-foreground);
					}

					body {
						padding: 0px;
						height: 100%;
						width: 100%;
					}

					table, thead, tr, th, td, tbody {
						border: none !important;
						border-color: transparent;
						border-spacing: 0;
						border-collapse: collapse;
					}

					table, th, tr {
						vertical-align: middle;
						text-align: right;
					}

					thead {
						font-weight: bold;
						background-color: rgba(130, 130, 130, 0.16);
					}

					th, td {
						padding: 4px 8px;
					}

					tr:nth-child(even) {
						background-color: rgba(130, 130, 130, 0.08);
					}

					tbody th {
						font-weight: normal;
					}

					.find-match {
						background-color: var(--vscode-editor-findMatchHighlightBackground);
					}

					.current-find-match {
						background-color: var(--vscode-editor-findMatchBackground);
					}

					#_defaultColorPalatte {
						color: var(--vscode-editor-findMatchHighlightBackground);
						background-color: var(--vscode-editor-findMatchBackground);
					}
				</style>
			</head>
			<body style="overflow: hidden;">
				<div id='findStart' tabIndex=-1></div>
				<div id='container' class="widgetarea" style="position: absolute;width:100%;top: 0px"></div>
				<div id="_defaultColorPalatte"></div>
				<script type="module">${preloadScript}</script>
			</body>
		</html>`;
        }
        getRendererData() {
            return this.notebookService.getRenderers().map((renderer) => {
                const entrypoint = {
                    extends: renderer.entrypoint.extends,
                    path: this.asWebviewUri(renderer.entrypoint.path, renderer.extensionLocation).toString()
                };
                return {
                    id: renderer.id,
                    entrypoint,
                    mimeTypes: renderer.mimeTypes,
                    messaging: renderer.messaging !== "never" /* RendererMessagingSpec.Never */,
                    isBuiltin: renderer.isBuiltin
                };
            });
        }
        getStaticPreloadsData() {
            return Array.from(this.notebookService.getStaticPreloads(this.notebookViewType), preload => {
                return { entrypoint: this.asWebviewUri(preload.entrypoint, preload.extensionLocation).toString().toString() };
            });
        }
        asWebviewUri(uri, fromExtension) {
            return (0, webview_2.asWebviewUri)(uri, fromExtension?.scheme === network_1.Schemas.vscodeRemote ? { isRemote: true, authority: fromExtension.authority } : undefined);
        }
        postKernelMessage(message) {
            this._sendMessageToWebview({
                __vscode_notebook_message: true,
                type: 'customKernelMessage',
                message,
            });
        }
        resolveOutputId(id) {
            const output = this.reversedInsetMapping.get(id);
            if (!output) {
                return;
            }
            const cellInfo = this.insetMapping.get(output).cellInfo;
            return { cellInfo, output };
        }
        isResolved() {
            return !!this.webview;
        }
        createWebview(targetWindow) {
            const baseUrl = this.asWebviewUri(this.getNotebookBaseUri(), undefined);
            const htmlContent = this.generateContent(baseUrl.toString());
            return this._initialize(htmlContent, targetWindow);
        }
        getNotebookBaseUri() {
            if (this.documentUri.scheme === network_1.Schemas.untitled) {
                const folder = this.workspaceContextService.getWorkspaceFolder(this.documentUri);
                if (folder) {
                    return folder.uri;
                }
                const folders = this.workspaceContextService.getWorkspace().folders;
                if (folders.length) {
                    return folders[0].uri;
                }
            }
            return (0, resources_1.dirname)(this.documentUri);
        }
        getBuiltinLocalResourceRoots() {
            // Python notebooks assume that requirejs is a global.
            // For all other notebooks, they need to provide their own loader.
            if (!this.documentUri.path.toLowerCase().endsWith('.ipynb')) {
                return [];
            }
            if (platform_1.isWeb) {
                return []; // script is inlined
            }
            return [
                (0, resources_1.dirname)(network_1.FileAccess.asFileUri('vs/loader.js')),
            ];
        }
        _initialize(content, targetWindow) {
            if (!(0, dom_1.getWindow)(this.element).document.body.contains(this.element)) {
                throw new Error('Element is already detached from the DOM tree');
            }
            this.webview = this._createInset(this.webviewService, content);
            this.webview.mountTo(this.element, targetWindow);
            this._register(this.webview);
            this._register(new webviewWindowDragMonitor_1.WebviewWindowDragMonitor(targetWindow, () => this.webview));
            const initializePromise = new async_1.DeferredPromise();
            this._register(this.webview.onFatalError(e => {
                initializePromise.error(new Error(`Could not initialize webview: ${e.message}}`));
            }));
            this._register(this.webview.onMessage(async (message) => {
                const data = message.message;
                if (this._disposed) {
                    return;
                }
                if (!data.__vscode_notebook_message) {
                    return;
                }
                switch (data.type) {
                    case 'initialized': {
                        initializePromise.complete();
                        this.initializeWebViewState();
                        break;
                    }
                    case 'initializedMarkup': {
                        if (this.initializeMarkupPromise?.requestId === data.requestId) {
                            this.initializeMarkupPromise?.p.complete();
                            this.initializeMarkupPromise = undefined;
                        }
                        break;
                    }
                    case 'dimension': {
                        for (const update of data.updates) {
                            const height = update.height;
                            if (update.isOutput) {
                                const resolvedResult = this.resolveOutputId(update.id);
                                if (resolvedResult) {
                                    const { cellInfo, output } = resolvedResult;
                                    this.notebookEditor.updateOutputHeight(cellInfo, output, height, !!update.init, 'webview#dimension');
                                    this.notebookEditor.scheduleOutputHeightAck(cellInfo, update.id, height);
                                }
                                else if (update.init) {
                                    // might be idle render request's ack
                                    const outputRequest = this.reversedPendingWebviewIdleInsetMapping.get(update.id);
                                    if (outputRequest) {
                                        const inset = this.pendingWebviewIdleInsetMapping.get(outputRequest);
                                        // clear the pending mapping
                                        this.pendingWebviewIdleCreationRequest.delete(outputRequest);
                                        this.pendingWebviewIdleCreationRequest.delete(outputRequest);
                                        const cellInfo = inset.cellInfo;
                                        this.reversedInsetMapping.set(update.id, outputRequest);
                                        this.insetMapping.set(outputRequest, inset);
                                        this.notebookEditor.updateOutputHeight(cellInfo, outputRequest, height, !!update.init, 'webview#dimension');
                                        this.notebookEditor.scheduleOutputHeightAck(cellInfo, update.id, height);
                                    }
                                    this.reversedPendingWebviewIdleInsetMapping.delete(update.id);
                                }
                                {
                                    if (!update.init) {
                                        continue;
                                    }
                                    const output = this.reversedInsetMapping.get(update.id);
                                    if (!output) {
                                        continue;
                                    }
                                    const inset = this.insetMapping.get(output);
                                    inset.initialized = true;
                                }
                            }
                            else {
                                this.notebookEditor.updateMarkupCellHeight(update.id, height, !!update.init);
                            }
                        }
                        break;
                    }
                    case 'mouseenter': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsHovered = true;
                            }
                        }
                        break;
                    }
                    case 'mouseleave': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsHovered = false;
                            }
                        }
                        break;
                    }
                    case 'outputFocus': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsFocused = true;
                                this.notebookEditor.focusNotebookCell(latestCell, 'output', { outputId: resolvedResult.output.model.outputId, skipReveal: true, outputWebviewFocused: true });
                            }
                        }
                        break;
                    }
                    case 'outputBlur': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsFocused = false;
                                latestCell.inputInOutputIsFocused = false;
                            }
                        }
                        break;
                    }
                    case 'scroll-ack': {
                        // const date = new Date();
                        // const top = data.data.top;
                        // console.log('ack top ', top, ' version: ', data.version, ' - ', date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
                        break;
                    }
                    case 'scroll-to-reveal': {
                        this.notebookEditor.setScrollTop(data.scrollTop - notebookCellList_1.NOTEBOOK_WEBVIEW_BOUNDARY);
                        break;
                    }
                    case 'did-scroll-wheel': {
                        this.notebookEditor.triggerScroll({
                            ...data.payload,
                            preventDefault: () => { },
                            stopPropagation: () => { }
                        });
                        break;
                    }
                    case 'focus-editor': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            if (data.focusNext) {
                                this.notebookEditor.focusNextNotebookCell(cell, 'editor');
                            }
                            else {
                                await this.notebookEditor.focusNotebookCell(cell, 'editor');
                            }
                        }
                        break;
                    }
                    case 'clicked-data-url': {
                        this._onDidClickDataLink(data);
                        break;
                    }
                    case 'clicked-link': {
                        if ((0, network_1.matchesScheme)(data.href, network_1.Schemas.command)) {
                            const uri = uri_1.URI.parse(data.href);
                            if (uri.path === 'workbench.action.openLargeOutput') {
                                const outputId = uri.query;
                                const group = this.editorGroupService.activeGroup;
                                if (group) {
                                    if (group.activeEditor) {
                                        group.pinEditor(group.activeEditor);
                                    }
                                }
                                this.openerService.open(notebookCommon_1.CellUri.generateCellOutputUri(this.documentUri, outputId));
                                return;
                            }
                            if (uri.path === 'cellOutput.enableScrolling') {
                                const outputId = uri.query;
                                const cell = this.reversedInsetMapping.get(outputId);
                                if (cell) {
                                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'notebook.cell.toggleOutputScrolling', from: 'inlineLink' });
                                    cell.cellViewModel.outputsViewModels.forEach((vm) => {
                                        if (vm.model.metadata) {
                                            vm.model.metadata['scrollable'] = true;
                                            vm.resetRenderer();
                                        }
                                    });
                                }
                                return;
                            }
                            // We allow a very limited set of commands
                            this.openerService.open(data.href, {
                                fromUserGesture: true,
                                fromWorkspace: true,
                                allowCommands: [
                                    'github-issues.authNow',
                                    'workbench.extensions.search',
                                    'workbench.action.openSettings',
                                    '_notebook.selectKernel',
                                    // TODO@rebornix explore open output channel with name command
                                    'jupyter.viewOutput'
                                ],
                            });
                            return;
                        }
                        if ((0, network_1.matchesSomeScheme)(data.href, network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.mailto)) {
                            this.openerService.open(data.href, { fromUserGesture: true, fromWorkspace: true });
                        }
                        else if ((0, network_1.matchesScheme)(data.href, network_1.Schemas.vscodeNotebookCell)) {
                            const uri = uri_1.URI.parse(data.href);
                            await this._handleNotebookCellResource(uri);
                        }
                        else if (!/^[\w\-]+:/.test(data.href)) {
                            // Uri without scheme, such as a file path
                            await this._handleResourceOpening(tryDecodeURIComponent(data.href));
                        }
                        else {
                            // uri with scheme
                            if (osPath.isAbsolute(data.href)) {
                                this._openUri(uri_1.URI.file(data.href));
                            }
                            else {
                                this._openUri(uri_1.URI.parse(data.href));
                            }
                        }
                        break;
                    }
                    case 'customKernelMessage': {
                        this._onMessage.fire({ message: data.message });
                        break;
                    }
                    case 'customRendererMessage': {
                        this.rendererMessaging?.postMessage(data.rendererId, data.message);
                        break;
                    }
                    case 'clickMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            if (data.shiftKey || (platform_1.isMacintosh ? data.metaKey : data.ctrlKey)) {
                                // Modify selection
                                this.notebookEditor.toggleNotebookCellSelection(cell, /* fromPrevious */ data.shiftKey);
                            }
                            else {
                                // Normal click
                                await this.notebookEditor.focusNotebookCell(cell, 'container', { skipReveal: true });
                            }
                        }
                        break;
                    }
                    case 'contextMenuMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            // Focus the cell first
                            await this.notebookEditor.focusNotebookCell(cell, 'container', { skipReveal: true });
                            // Then show the context menu
                            const webviewRect = this.element.getBoundingClientRect();
                            this.contextMenuService.showContextMenu({
                                menuId: actions_1.MenuId.NotebookCellTitle,
                                contextKeyService: this.contextKeyService,
                                getAnchor: () => ({
                                    x: webviewRect.x + data.clientX,
                                    y: webviewRect.y + data.clientY
                                })
                            });
                        }
                        break;
                    }
                    case 'toggleMarkupPreview': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell && !this.notebookEditor.creationOptions.isReadOnly) {
                            this.notebookEditor.setMarkupCellEditState(data.cellId, notebookBrowser_1.CellEditState.Editing);
                            await this.notebookEditor.focusNotebookCell(cell, 'editor', { skipReveal: true });
                        }
                        break;
                    }
                    case 'mouseEnterMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.cellIsHovered = true;
                        }
                        break;
                    }
                    case 'mouseLeaveMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.cellIsHovered = false;
                        }
                        break;
                    }
                    case 'cell-drag-start': {
                        this.notebookEditor.didStartDragMarkupCell(data.cellId, data);
                        break;
                    }
                    case 'cell-drag': {
                        this.notebookEditor.didDragMarkupCell(data.cellId, data);
                        break;
                    }
                    case 'cell-drop': {
                        this.notebookEditor.didDropMarkupCell(data.cellId, {
                            dragOffsetY: data.dragOffsetY,
                            ctrlKey: data.ctrlKey,
                            altKey: data.altKey,
                        });
                        break;
                    }
                    case 'cell-drag-end': {
                        this.notebookEditor.didEndDragMarkupCell(data.cellId);
                        break;
                    }
                    case 'renderedMarkup': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.renderedHtml = data.html;
                        }
                        this._handleHighlightCodeBlock(data.codeBlocks);
                        break;
                    }
                    case 'renderedCellOutput': {
                        this._handleHighlightCodeBlock(data.codeBlocks);
                        break;
                    }
                    case 'outputResized': {
                        this.notebookEditor.didResizeOutput(data.cellId);
                        break;
                    }
                    case 'getOutputItem': {
                        const resolvedResult = this.resolveOutputId(data.outputId);
                        const output = resolvedResult?.output.model.outputs.find(output => output.mime === data.mime);
                        this._sendMessageToWebview({
                            type: 'returnOutputItem',
                            requestId: data.requestId,
                            output: output ? { mime: output.mime, valueBytes: output.data.buffer } : undefined,
                        });
                        break;
                    }
                    case 'logRendererDebugMessage': {
                        this._logRendererDebugMessage(`${data.message}${data.data ? ' ' + JSON.stringify(data.data, null, 4) : ''}`);
                        break;
                    }
                    case 'notebookPerformanceMessage': {
                        this.notebookEditor.updatePerformanceMetadata(data.cellId, data.executionId, data.duration, data.rendererId);
                        break;
                    }
                    case 'outputInputFocus': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.inputInOutputIsFocused = data.inputFocused;
                            }
                        }
                        this.notebookEditor.didFocusOutputInputChange(data.inputFocused);
                    }
                }
            }));
            return initializePromise.p;
        }
        _handleNotebookCellResource(uri) {
            const notebookResource = uri.path.length > 0 ? uri : this.documentUri;
            const lineMatch = /(?:^|&)line=([^&]+)/.exec(uri.query);
            let editorOptions = undefined;
            if (lineMatch) {
                const parsedLineNumber = parseInt(lineMatch[1], 10);
                if (!isNaN(parsedLineNumber)) {
                    const lineNumber = parsedLineNumber;
                    editorOptions = {
                        selection: { startLineNumber: lineNumber, startColumn: 1 }
                    };
                }
            }
            const executionMatch = /(?:^|&)execution_count=([^&]+)/.exec(uri.query);
            if (executionMatch) {
                const executionCount = parseInt(executionMatch[1], 10);
                if (!isNaN(executionCount)) {
                    const notebookModel = this.notebookService.getNotebookTextModel(notebookResource);
                    // multiple cells with the same execution count can exist if the kernel is restarted
                    // so look for the most recently added cell with the matching execution count.
                    // Somewhat more likely to be correct in notebooks, an much more likely for the interactive window
                    const cell = notebookModel?.cells.slice().reverse().find(cell => {
                        return cell.internalMetadata.executionOrder === executionCount;
                    });
                    if (cell?.uri) {
                        return this.openerService.open(cell.uri, {
                            fromUserGesture: true,
                            fromWorkspace: true,
                            editorOptions: editorOptions
                        });
                    }
                }
            }
            // URLs built by the jupyter extension put the line query param in the fragment
            // They also have the cell fragment pre-calculated
            const fragmentLineMatch = /\?line=(\d+)$/.exec(uri.fragment);
            if (fragmentLineMatch) {
                const parsedLineNumber = parseInt(fragmentLineMatch[1], 10);
                if (!isNaN(parsedLineNumber)) {
                    const lineNumber = parsedLineNumber + 1;
                    const fragment = uri.fragment.substring(0, fragmentLineMatch.index);
                    // open the uri with selection
                    const editorOptions = {
                        selection: { startLineNumber: lineNumber, startColumn: 1, endLineNumber: lineNumber, endColumn: 1 }
                    };
                    return this.openerService.open(notebookResource.with({ fragment }), {
                        fromUserGesture: true,
                        fromWorkspace: true,
                        editorOptions: editorOptions
                    });
                }
            }
            return this.openerService.open(notebookResource, { fromUserGesture: true, fromWorkspace: true });
        }
        async _handleResourceOpening(href) {
            let linkToOpen = undefined;
            let fragment = undefined;
            // Separate out the fragment so that the subsequent calls
            // to URI.joinPath() don't URL encode it. This allows opening
            // links with both paths and fragments.
            const hrefWithFragment = FRAGMENT_REGEX.exec(href);
            if (hrefWithFragment) {
                href = hrefWithFragment[1];
                fragment = hrefWithFragment[2];
            }
            if (href.startsWith('/')) {
                linkToOpen = await this.pathService.fileURI(href);
                const folders = this.workspaceContextService.getWorkspace().folders;
                if (folders.length) {
                    linkToOpen = linkToOpen.with({
                        scheme: folders[0].uri.scheme,
                        authority: folders[0].uri.authority
                    });
                }
            }
            else if (href.startsWith('~')) {
                const userHome = await this.pathService.userHome();
                if (userHome) {
                    linkToOpen = uri_1.URI.joinPath(userHome, href.substring(2));
                }
            }
            else {
                if (this.documentUri.scheme === network_1.Schemas.untitled) {
                    const folders = this.workspaceContextService.getWorkspace().folders;
                    if (!folders.length) {
                        return;
                    }
                    linkToOpen = uri_1.URI.joinPath(folders[0].uri, href);
                }
                else {
                    // Resolve relative to notebook document
                    linkToOpen = uri_1.URI.joinPath((0, resources_1.dirname)(this.documentUri), href);
                }
            }
            if (linkToOpen) {
                // Re-attach fragment now that we have the full file path.
                if (fragment) {
                    linkToOpen = linkToOpen.with({ fragment });
                }
                this._openUri(linkToOpen);
            }
        }
        _openUri(uri) {
            let lineNumber = undefined;
            let column = undefined;
            const lineCol = LINE_COLUMN_REGEX.exec(uri.path);
            if (lineCol) {
                uri = uri.with({
                    path: uri.path.slice(0, lineCol.index),
                    fragment: `L${lineCol[0].slice(1)}`
                });
                lineNumber = parseInt(lineCol[1], 10);
                column = parseInt(lineCol[2], 10);
            }
            //#region error renderer migration, remove once done
            const lineMatch = LineQueryRegex.exec(uri.query);
            if (lineMatch) {
                const parsedLineNumber = parseInt(lineMatch[1], 10);
                if (!isNaN(parsedLineNumber)) {
                    lineNumber = parsedLineNumber + 1;
                    column = 1;
                    uri = uri.with({ fragment: `L${lineNumber}` });
                }
            }
            uri = uri.with({
                query: null
            });
            //#endregion
            let match = undefined;
            for (const group of this.editorGroupService.groups) {
                const editorInput = group.editors.find(editor => editor.resource && (0, resources_1.isEqual)(editor.resource, uri, true));
                if (editorInput) {
                    match = { group, editor: editorInput };
                    break;
                }
            }
            if (match) {
                match.group.openEditor(match.editor, lineNumber !== undefined && column !== undefined ? { selection: { startLineNumber: lineNumber, startColumn: column } } : undefined);
            }
            else {
                this.openerService.open(uri, { fromUserGesture: true, fromWorkspace: true });
            }
        }
        _handleHighlightCodeBlock(codeBlocks) {
            for (const { id, value, lang } of codeBlocks) {
                // The language id may be a language aliases (e.g.js instead of javascript)
                const languageId = this.languageService.getLanguageIdByLanguageName(lang);
                if (!languageId) {
                    continue;
                }
                (0, textToHtmlTokenizer_1.tokenizeToString)(this.languageService, value, languageId).then((html) => {
                    if (this._disposed) {
                        return;
                    }
                    this._sendMessageToWebview({
                        type: 'tokenizedCodeBlock',
                        html,
                        codeBlockId: id
                    });
                });
            }
        }
        async _onDidClickDataLink(event) {
            if (typeof event.data !== 'string') {
                return;
            }
            const [splitStart, splitData] = event.data.split(';base64,');
            if (!splitData || !splitStart) {
                return;
            }
            const defaultDir = (0, resources_1.extname)(this.documentUri) === '.interactive' ?
                this.workspaceContextService.getWorkspace().folders[0]?.uri ?? await this.fileDialogService.defaultFilePath() :
                (0, resources_1.dirname)(this.documentUri);
            let defaultName;
            if (event.downloadName) {
                defaultName = event.downloadName;
            }
            else {
                const mimeType = splitStart.replace(/^data:/, '');
                const candidateExtension = mimeType && (0, mime_1.getExtensionForMimeType)(mimeType);
                defaultName = candidateExtension ? `download${candidateExtension}` : 'download';
            }
            const defaultUri = (0, resources_1.joinPath)(defaultDir, defaultName);
            const newFileUri = await this.fileDialogService.showSaveDialog({
                defaultUri
            });
            if (!newFileUri) {
                return;
            }
            const buff = (0, buffer_1.decodeBase64)(splitData);
            await this.fileService.writeFile(newFileUri, buff);
            await this.openerService.open(newFileUri);
        }
        _createInset(webviewService, content) {
            this.localResourceRootsCache = this._getResourceRootsCache();
            const webview = webviewService.createWebviewElement({
                origin: BackLayerWebView_1.getOriginStore(this.storageService).getOrigin(this.notebookViewType, undefined),
                title: nls.localize('webview title', "Notebook webview content"),
                options: {
                    purpose: "notebookRenderer" /* WebviewContentPurpose.NotebookRenderer */,
                    enableFindWidget: false,
                    transformCssVariables: webviewThemeMapping_1.transformWebviewThemeVars,
                },
                contentOptions: {
                    allowMultipleAPIAcquire: true,
                    allowScripts: true,
                    localResourceRoots: this.localResourceRootsCache,
                },
                extension: undefined,
                providedViewType: 'notebook.output'
            });
            webview.setHtml(content);
            webview.setContextKeyService(this.contextKeyService);
            return webview;
        }
        _getResourceRootsCache() {
            const workspaceFolders = this.contextService.getWorkspace().folders.map(x => x.uri);
            const notebookDir = this.getNotebookBaseUri();
            return [
                this.notebookService.getNotebookProviderResourceRoots(),
                this.notebookService.getRenderers().map(x => (0, resources_1.dirname)(x.entrypoint.path)),
                ...Array.from(this.notebookService.getStaticPreloads(this.notebookViewType), x => [
                    (0, resources_1.dirname)(x.entrypoint),
                    ...x.localResourceRoots,
                ]),
                workspaceFolders,
                notebookDir,
                this.getBuiltinLocalResourceRoots()
            ].flat();
        }
        initializeWebViewState() {
            this._preloadsCache.clear();
            if (this._currentKernel) {
                this._updatePreloadsFromKernel(this._currentKernel);
            }
            for (const [output, inset] of this.insetMapping.entries()) {
                this._sendMessageToWebview({ ...inset.cachedCreation, initiallyHidden: this.hiddenInsetMapping.has(output) });
            }
            if (this.initializeMarkupPromise?.isFirstInit) {
                // On first run the contents have already been initialized so we don't need to init them again
                // no op
            }
            else {
                const mdCells = [...this.markupPreviewMapping.values()];
                this.markupPreviewMapping.clear();
                this.initializeMarkup(mdCells);
            }
            this._updateStyles();
            this._updateOptions();
        }
        shouldUpdateInset(cell, output, cellTop, outputOffset) {
            if (this._disposed) {
                return false;
            }
            if ('isOutputCollapsed' in cell && cell.isOutputCollapsed) {
                return false;
            }
            if (this.hiddenInsetMapping.has(output)) {
                return true;
            }
            const outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return false;
            }
            if (outputOffset === outputCache.cachedCreation.outputOffset && cellTop === outputCache.cachedCreation.cellTop) {
                return false;
            }
            return true;
        }
        ackHeight(updates) {
            this._sendMessageToWebview({
                type: 'ack-dimension',
                updates
            });
        }
        updateScrollTops(outputRequests, markupPreviews) {
            if (this._disposed) {
                return;
            }
            const widgets = (0, arrays_1.coalesce)(outputRequests.map((request) => {
                const outputCache = this.insetMapping.get(request.output);
                if (!outputCache) {
                    return;
                }
                if (!request.forceDisplay && !this.shouldUpdateInset(request.cell, request.output, request.cellTop, request.outputOffset)) {
                    return;
                }
                const id = outputCache.outputId;
                outputCache.cachedCreation.cellTop = request.cellTop;
                outputCache.cachedCreation.outputOffset = request.outputOffset;
                this.hiddenInsetMapping.delete(request.output);
                return {
                    cellId: request.cell.id,
                    outputId: id,
                    cellTop: request.cellTop,
                    outputOffset: request.outputOffset,
                    forceDisplay: request.forceDisplay,
                };
            }));
            if (!widgets.length && !markupPreviews.length) {
                return;
            }
            this._sendMessageToWebview({
                type: 'view-scroll',
                widgets: widgets,
                markupCells: markupPreviews,
            });
        }
        async createMarkupPreview(initialization) {
            if (this._disposed) {
                return;
            }
            if (this.markupPreviewMapping.has(initialization.cellId)) {
                console.error('Trying to create markup preview that already exists');
                return;
            }
            this.markupPreviewMapping.set(initialization.cellId, initialization);
            this._sendMessageToWebview({
                type: 'createMarkupCell',
                cell: initialization
            });
        }
        async showMarkupPreview(newContent) {
            if (this._disposed) {
                return;
            }
            const entry = this.markupPreviewMapping.get(newContent.cellId);
            if (!entry) {
                return this.createMarkupPreview(newContent);
            }
            const sameContent = newContent.content === entry.content;
            const sameMetadata = ((0, objects_1.equals)(newContent.metadata, entry.metadata));
            if (!sameContent || !sameMetadata || !entry.visible) {
                this._sendMessageToWebview({
                    type: 'showMarkupCell',
                    id: newContent.cellId,
                    handle: newContent.cellHandle,
                    // If the content has not changed, we still want to make sure the
                    // preview is visible but don't need to send anything over
                    content: sameContent ? undefined : newContent.content,
                    top: newContent.offset,
                    metadata: sameMetadata ? undefined : newContent.metadata
                });
            }
            entry.metadata = newContent.metadata;
            entry.content = newContent.content;
            entry.offset = newContent.offset;
            entry.visible = true;
        }
        async hideMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            const cellsToHide = [];
            for (const cellId of cellIds) {
                const entry = this.markupPreviewMapping.get(cellId);
                if (entry) {
                    if (entry.visible) {
                        cellsToHide.push(cellId);
                        entry.visible = false;
                    }
                }
            }
            if (cellsToHide.length) {
                this._sendMessageToWebview({
                    type: 'hideMarkupCells',
                    ids: cellsToHide
                });
            }
        }
        async unhideMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            const toUnhide = [];
            for (const cellId of cellIds) {
                const entry = this.markupPreviewMapping.get(cellId);
                if (entry) {
                    if (!entry.visible) {
                        entry.visible = true;
                        toUnhide.push(cellId);
                    }
                }
                else {
                    console.error(`Trying to unhide a preview that does not exist: ${cellId}`);
                }
            }
            this._sendMessageToWebview({
                type: 'unhideMarkupCells',
                ids: toUnhide,
            });
        }
        async deleteMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            for (const id of cellIds) {
                if (!this.markupPreviewMapping.has(id)) {
                    console.error(`Trying to delete a preview that does not exist: ${id}`);
                }
                this.markupPreviewMapping.delete(id);
            }
            if (cellIds.length) {
                this._sendMessageToWebview({
                    type: 'deleteMarkupCell',
                    ids: cellIds
                });
            }
        }
        async updateMarkupPreviewSelections(selectedCellsIds) {
            if (this._disposed) {
                return;
            }
            this._sendMessageToWebview({
                type: 'updateSelectedMarkupCells',
                selectedCellIds: selectedCellsIds.filter(id => this.markupPreviewMapping.has(id)),
            });
        }
        async initializeMarkup(cells) {
            if (this._disposed) {
                return;
            }
            this.initializeMarkupPromise?.p.complete();
            const requestId = UUID.generateUuid();
            this.initializeMarkupPromise = { p: new async_1.DeferredPromise(), requestId, isFirstInit: this.firstInit };
            this.firstInit = false;
            for (const cell of cells) {
                this.markupPreviewMapping.set(cell.cellId, cell);
            }
            this._sendMessageToWebview({
                type: 'initializeMarkup',
                cells,
                requestId,
            });
            return this.initializeMarkupPromise.p.p;
        }
        /**
         * Validate if cached inset is out of date and require a rerender
         * Note that it doesn't account for output content change.
         */
        _cachedInsetEqual(cachedInset, content) {
            if (content.type === 1 /* RenderOutputType.Extension */) {
                // Use a new renderer
                return cachedInset.renderer?.id === content.renderer.id;
            }
            else {
                // The new renderer is the default HTML renderer
                return cachedInset.cachedCreation.type === 'html';
            }
        }
        requestCreateOutputWhenWebviewIdle(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            if (this.insetMapping.has(content.source)) {
                return;
            }
            if (this.pendingWebviewIdleCreationRequest.has(content.source)) {
                return;
            }
            if (this.pendingWebviewIdleInsetMapping.has(content.source)) {
                // handled in renderer process, waiting for webview to process it when idle
                return;
            }
            this.pendingWebviewIdleCreationRequest.set(content.source, (0, async_1.runWhenGlobalIdle)(() => {
                const { message, renderer, transfer: transferable } = this._createOutputCreationMessage(cellInfo, content, cellTop, offset, true, true);
                this._sendMessageToWebview(message, transferable);
                this.pendingWebviewIdleInsetMapping.set(content.source, { outputId: message.outputId, versionId: content.source.model.versionId, cellInfo: cellInfo, renderer, cachedCreation: message });
                this.reversedPendingWebviewIdleInsetMapping.set(message.outputId, content.source);
                this.pendingWebviewIdleCreationRequest.delete(content.source);
            }));
        }
        createOutput(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            const cachedInset = this.insetMapping.get(content.source);
            // we now request to render the output immediately, so we can remove the pending request
            // dispose the pending request in renderer process if it exists
            this.pendingWebviewIdleCreationRequest.get(content.source)?.dispose();
            this.pendingWebviewIdleCreationRequest.delete(content.source);
            // if request has already been sent out, we then remove it from the pending mapping
            this.pendingWebviewIdleInsetMapping.delete(content.source);
            if (cachedInset) {
                this.reversedPendingWebviewIdleInsetMapping.delete(cachedInset.outputId);
            }
            if (cachedInset && this._cachedInsetEqual(cachedInset, content)) {
                this.hiddenInsetMapping.delete(content.source);
                this._sendMessageToWebview({
                    type: 'showOutput',
                    cellId: cachedInset.cellInfo.cellId,
                    outputId: cachedInset.outputId,
                    cellTop: cellTop,
                    outputOffset: offset
                });
                return;
            }
            // create new output
            const { message, renderer, transfer: transferable } = this._createOutputCreationMessage(cellInfo, content, cellTop, offset, false, false);
            this._sendMessageToWebview(message, transferable);
            this.insetMapping.set(content.source, { outputId: message.outputId, versionId: content.source.model.versionId, cellInfo: cellInfo, renderer, cachedCreation: message });
            this.hiddenInsetMapping.delete(content.source);
            this.reversedInsetMapping.set(message.outputId, content.source);
        }
        createMetadata(output, mimeType) {
            if (mimeType.startsWith('image')) {
                const buffer = output.outputs.find(out => out.mime === 'text/plain')?.data.buffer;
                if (buffer?.length && buffer?.length > 0) {
                    const altText = new TextDecoder().decode(buffer);
                    return { ...output.metadata, vscode_altText: altText };
                }
            }
            return output.metadata;
        }
        _createOutputCreationMessage(cellInfo, content, cellTop, offset, createOnIdle, initiallyHidden) {
            const messageBase = {
                type: 'html',
                executionId: cellInfo.executionId,
                cellId: cellInfo.cellId,
                cellTop: cellTop,
                outputOffset: offset,
                left: 0,
                requiredPreloads: [],
                createOnIdle: createOnIdle
            };
            const transfer = [];
            let message;
            let renderer;
            if (content.type === 1 /* RenderOutputType.Extension */) {
                const output = content.source.model;
                renderer = content.renderer;
                const first = output.outputs.find(op => op.mime === content.mimeType);
                const metadata = this.createMetadata(output, content.mimeType);
                const valueBytes = copyBufferIfNeeded(first.data.buffer, transfer);
                message = {
                    ...messageBase,
                    outputId: output.outputId,
                    rendererId: content.renderer.id,
                    content: {
                        type: 1 /* RenderOutputType.Extension */,
                        outputId: output.outputId,
                        metadata: metadata,
                        output: {
                            mime: first.mime,
                            valueBytes,
                        },
                        allOutputs: output.outputs.map(output => ({ mime: output.mime })),
                    },
                    initiallyHidden: initiallyHidden
                };
            }
            else {
                message = {
                    ...messageBase,
                    outputId: UUID.generateUuid(),
                    content: {
                        type: content.type,
                        htmlContent: content.htmlContent,
                    },
                    initiallyHidden: initiallyHidden
                };
            }
            return {
                message,
                renderer,
                transfer,
            };
        }
        updateOutput(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            if (!this.insetMapping.has(content.source)) {
                this.createOutput(cellInfo, content, cellTop, offset);
                return;
            }
            const outputCache = this.insetMapping.get(content.source);
            if (outputCache.versionId === content.source.model.versionId) {
                // already sent this output version to the renderer
                return;
            }
            this.hiddenInsetMapping.delete(content.source);
            let updatedContent = undefined;
            const transfer = [];
            if (content.type === 1 /* RenderOutputType.Extension */) {
                const output = content.source.model;
                const firstBuffer = output.outputs.find(op => op.mime === content.mimeType);
                const appenededData = output.appendedSinceVersion(outputCache.versionId, content.mimeType);
                const appended = appenededData ? { valueBytes: appenededData.buffer, previousVersion: outputCache.versionId } : undefined;
                const valueBytes = copyBufferIfNeeded(firstBuffer.data.buffer, transfer);
                updatedContent = {
                    type: 1 /* RenderOutputType.Extension */,
                    outputId: outputCache.outputId,
                    metadata: output.metadata,
                    output: {
                        mime: content.mimeType,
                        valueBytes,
                        appended: appended
                    },
                    allOutputs: output.outputs.map(output => ({ mime: output.mime }))
                };
            }
            this._sendMessageToWebview({
                type: 'showOutput',
                cellId: outputCache.cellInfo.cellId,
                outputId: outputCache.outputId,
                cellTop: cellTop,
                outputOffset: offset,
                content: updatedContent
            }, transfer);
            outputCache.versionId = content.source.model.versionId;
            return;
        }
        async copyImage(output) {
            this._sendMessageToWebview({
                type: 'copyImage',
                outputId: output.model.outputId,
                altOutputId: output.model.alternativeOutputId
            });
        }
        removeInsets(outputs) {
            if (this._disposed) {
                return;
            }
            for (const output of outputs) {
                const outputCache = this.insetMapping.get(output);
                if (!outputCache) {
                    continue;
                }
                const id = outputCache.outputId;
                this._sendMessageToWebview({
                    type: 'clearOutput',
                    rendererId: outputCache.cachedCreation.rendererId,
                    cellUri: outputCache.cellInfo.cellUri.toString(),
                    outputId: id,
                    cellId: outputCache.cellInfo.cellId
                });
                this.insetMapping.delete(output);
                this.pendingWebviewIdleCreationRequest.get(output)?.dispose();
                this.pendingWebviewIdleCreationRequest.delete(output);
                this.pendingWebviewIdleInsetMapping.delete(output);
                this.reversedPendingWebviewIdleInsetMapping.delete(id);
                this.reversedInsetMapping.delete(id);
            }
        }
        hideInset(output) {
            if (this._disposed) {
                return;
            }
            const outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return;
            }
            this.hiddenInsetMapping.add(output);
            this._sendMessageToWebview({
                type: 'hideOutput',
                outputId: outputCache.outputId,
                cellId: outputCache.cellInfo.cellId,
            });
        }
        focusWebview() {
            if (this._disposed) {
                return;
            }
            this.webview?.focus();
        }
        selectOutputContents(cell) {
            if (this._disposed) {
                return;
            }
            const output = cell.outputsViewModels.find(o => o.model.outputId === cell.focusedOutputId);
            const outputId = output ? this.insetMapping.get(output)?.outputId : undefined;
            this._sendMessageToWebview({
                type: 'select-output-contents',
                cellOrOutputId: outputId || cell.id
            });
        }
        selectInputContents(cell) {
            if (this._disposed) {
                return;
            }
            const output = cell.outputsViewModels.find(o => o.model.outputId === cell.focusedOutputId);
            const outputId = output ? this.insetMapping.get(output)?.outputId : undefined;
            this._sendMessageToWebview({
                type: 'select-input-contents',
                cellOrOutputId: outputId || cell.id
            });
        }
        focusOutput(cellOrOutputId, alternateId, viewFocused) {
            if (this._disposed) {
                return;
            }
            if (!viewFocused) {
                this.webview?.focus();
            }
            this._sendMessageToWebview({
                type: 'focus-output',
                cellOrOutputId: cellOrOutputId,
                alternateId: alternateId
            });
        }
        async find(query, options) {
            if (query === '') {
                this._sendMessageToWebview({
                    type: 'findStop',
                    ownerID: options.ownerID
                });
                return [];
            }
            const p = new Promise(resolve => {
                const sub = this.webview?.onMessage(e => {
                    if (e.message.type === 'didFind') {
                        resolve(e.message.matches);
                        sub?.dispose();
                    }
                });
            });
            this._sendMessageToWebview({
                type: 'find',
                query: query,
                options
            });
            const ret = await p;
            return ret;
        }
        findStop(ownerID) {
            this._sendMessageToWebview({
                type: 'findStop',
                ownerID
            });
        }
        async findHighlightCurrent(index, ownerID) {
            const p = new Promise(resolve => {
                const sub = this.webview?.onMessage(e => {
                    if (e.message.type === 'didFindHighlightCurrent') {
                        resolve(e.message.offset);
                        sub?.dispose();
                    }
                });
            });
            this._sendMessageToWebview({
                type: 'findHighlightCurrent',
                index,
                ownerID
            });
            const ret = await p;
            return ret;
        }
        async findUnHighlightCurrent(index, ownerID) {
            this._sendMessageToWebview({
                type: 'findUnHighlightCurrent',
                index,
                ownerID
            });
        }
        deltaCellContainerClassNames(cellId, added, removed) {
            this._sendMessageToWebview({
                type: 'decorations',
                cellId,
                addedClassNames: added,
                removedClassNames: removed
            });
        }
        updateOutputRenderers() {
            if (!this.webview) {
                return;
            }
            const renderersData = this.getRendererData();
            this.localResourceRootsCache = this._getResourceRootsCache();
            const mixedResourceRoots = [
                ...(this.localResourceRootsCache || []),
                ...(this._currentKernel ? [this._currentKernel.localResourceRoot] : []),
            ];
            this.webview.localResourcesRoot = mixedResourceRoots;
            this._sendMessageToWebview({
                type: 'updateRenderers',
                rendererData: renderersData
            });
        }
        async updateKernelPreloads(kernel) {
            if (this._disposed || kernel === this._currentKernel) {
                return;
            }
            const previousKernel = this._currentKernel;
            this._currentKernel = kernel;
            if (previousKernel && previousKernel.preloadUris.length > 0) {
                this.webview?.reload(); // preloads will be restored after reload
            }
            else if (kernel) {
                this._updatePreloadsFromKernel(kernel);
            }
        }
        _updatePreloadsFromKernel(kernel) {
            const resources = [];
            for (const preload of kernel.preloadUris) {
                const uri = this.environmentService.isExtensionDevelopment && (preload.scheme === 'http' || preload.scheme === 'https')
                    ? preload : this.asWebviewUri(preload, undefined);
                if (!this._preloadsCache.has(uri.toString())) {
                    resources.push({ uri: uri.toString(), originalUri: preload.toString() });
                    this._preloadsCache.add(uri.toString());
                }
            }
            if (!resources.length) {
                return;
            }
            this._updatePreloads(resources);
        }
        _updatePreloads(resources) {
            if (!this.webview) {
                return;
            }
            const mixedResourceRoots = [
                ...(this.localResourceRootsCache || []),
                ...(this._currentKernel ? [this._currentKernel.localResourceRoot] : []),
            ];
            this.webview.localResourcesRoot = mixedResourceRoots;
            this._sendMessageToWebview({
                type: 'preload',
                resources: resources,
            });
        }
        _sendMessageToWebview(message, transfer) {
            if (this._disposed) {
                return;
            }
            this.webview?.postMessage(message, transfer);
        }
        dispose() {
            this._disposed = true;
            this.webview?.dispose();
            this.webview = undefined;
            this.notebookEditor = null;
            this.insetMapping.clear();
            this.pendingWebviewIdleCreationRequest.clear();
            super.dispose();
        }
    };
    exports.BackLayerWebView = BackLayerWebView;
    exports.BackLayerWebView = BackLayerWebView = BackLayerWebView_1 = __decorate([
        __param(6, webview_1.IWebviewService),
        __param(7, opener_1.IOpenerService),
        __param(8, notebookService_1.INotebookService),
        __param(9, workspace_1.IWorkspaceContextService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, dialogs_1.IFileDialogService),
        __param(12, files_1.IFileService),
        __param(13, contextView_1.IContextMenuService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(16, configuration_1.IConfigurationService),
        __param(17, language_1.ILanguageService),
        __param(18, workspace_1.IWorkspaceContextService),
        __param(19, editorGroupsService_1.IEditorGroupsService),
        __param(20, storage_1.IStorageService),
        __param(21, pathService_1.IPathService),
        __param(22, notebookLoggingService_1.INotebookLoggingService),
        __param(23, themeService_1.IThemeService),
        __param(24, telemetry_1.ITelemetryService)
    ], BackLayerWebView);
    function copyBufferIfNeeded(buffer, transfer) {
        if (buffer.byteLength === buffer.buffer.byteLength) {
            // No copy needed but we can't transfer either
            return buffer;
        }
        else {
            // The buffer is smaller than its backing array buffer.
            // Create a copy to avoid sending the entire array buffer.
            const valueBytes = new Uint8Array(buffer);
            transfer.push(valueBytes.buffer);
            return valueBytes;
        }
    }
    function getTokenizationCss() {
        const colorMap = languages_1.TokenizationRegistry.getColorMap();
        const tokenizationCss = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
        return tokenizationCss;
    }
    function tryDecodeURIComponent(uri) {
        try {
            return decodeURIComponent(uri);
        }
        catch {
            return uri;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja0xheWVyV2ViVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L3JlbmRlcmVycy9iYWNrTGF5ZXJXZWJWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5RGhHLE1BQU0saUJBQWlCLEdBQUcsd0JBQXdCLENBQUM7SUFDbkQsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDO0lBQ3JDLE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDO0lBOERqQyxJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUE0QyxTQUFRLHVCQUFROztRQUloRSxNQUFNLENBQUMsY0FBYyxDQUFDLGNBQStCO1lBQzVELElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSw0QkFBa0IsQ0FBQyxtQ0FBbUMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQXdCRCxZQUNRLGNBQTJDLEVBQ2pDLEVBQVUsRUFDWCxnQkFBd0IsRUFDeEIsV0FBZ0IsRUFDeEIsT0FBZ0MsRUFDdkIsaUJBQXVELEVBQ3ZELGNBQWdELEVBQ2pELGFBQThDLEVBQzVDLGVBQWtELEVBQzFDLGNBQXlELEVBQ3JELGtCQUFpRSxFQUMzRSxpQkFBc0QsRUFDNUQsV0FBMEMsRUFDbkMsa0JBQXdELEVBQ3pELGlCQUFzRCxFQUN4QywrQkFBa0YsRUFDN0Ysb0JBQTRELEVBQ2pFLGVBQWtELEVBQzFDLHVCQUFrRSxFQUN0RSxrQkFBeUQsRUFDOUQsY0FBZ0QsRUFDbkQsV0FBMEMsRUFDL0Isa0JBQTRELEVBQ3RFLFlBQTJCLEVBQ3ZCLGdCQUFvRDtZQUV2RSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUExQmIsbUJB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