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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/keybindingParser", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages/language", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/workbench/contrib/markdown/browser/markdownDocumentRenderer", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/contrib/markdown/browser/markdownSettingRenderer", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/editor/browser/services/codeEditorService", "vs/css!./media/releasenoteseditor"], function (require, exports, cancellation_1, errors_1, htmlContent_1, keybindingParser_1, strings_1, uri_1, uuid_1, languages_1, tokenization_1, language_1, nls, environment_1, keybinding_1, opener_1, productService_1, request_1, markdownDocumentRenderer_1, webviewWorkbenchService_1, editorGroupsService_1, editorService_1, extensions_1, telemetryUtils_1, configuration_1, lifecycle_1, markdownSettingRenderer_1, instantiation_1, network_1, codeEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReleaseNotesManager = void 0;
    let ReleaseNotesManager = class ReleaseNotesManager {
        constructor(_environmentService, _keybindingService, _languageService, _openerService, _requestService, _configurationService, _editorService, _editorGroupService, _codeEditorService, _webviewWorkbenchService, _extensionService, _productService, _instantiationService) {
            this._environmentService = _environmentService;
            this._keybindingService = _keybindingService;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._requestService = _requestService;
            this._configurationService = _configurationService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._codeEditorService = _codeEditorService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this._extensionService = _extensionService;
            this._productService = _productService;
            this._instantiationService = _instantiationService;
            this._releaseNotesCache = new Map();
            this._currentReleaseNotes = undefined;
            this.disposables = new lifecycle_1.DisposableStore();
            languages_1.TokenizationRegistry.onDidChange(() => {
                return this.updateHtml();
            });
            _configurationService.onDidChangeConfiguration(this.onDidChangeConfiguration, this, this.disposables);
            _webviewWorkbenchService.onDidChangeActiveWebviewEditor(this.onDidChangeActiveWebviewEditor, this, this.disposables);
            this._simpleSettingRenderer = this._instantiationService.createInstance(markdownSettingRenderer_1.SimpleSettingRenderer);
        }
        async updateHtml() {
            if (!this._currentReleaseNotes || !this._lastText) {
                return;
            }
            const html = await this.renderBody(this._lastText);
            if (this._currentReleaseNotes) {
                this._currentReleaseNotes.webview.setHtml(html);
            }
        }
        async show(version, useCurrentFile) {
            const releaseNoteText = await this.loadReleaseNotes(version, useCurrentFile);
            this._lastText = releaseNoteText;
            const html = await this.renderBody(releaseNoteText);
            const title = nls.localize('releaseNotesInputName', "Release Notes: {0}", version);
            const activeEditorPane = this._editorService.activeEditorPane;
            if (this._currentReleaseNotes) {
                this._currentReleaseNotes.setName(title);
                this._currentReleaseNotes.webview.setHtml(html);
                this._webviewWorkbenchService.revealWebview(this._currentReleaseNotes, activeEditorPane ? activeEditorPane.group : this._editorGroupService.activeGroup, false);
            }
            else {
                this._currentReleaseNotes = this._webviewWorkbenchService.openWebview({
                    title,
                    options: {
                        tryRestoreScrollPosition: true,
                        enableFindWidget: true,
                        disableServiceWorker: true,
                    },
                    contentOptions: {
                        localResourceRoots: [],
                        allowScripts: true
                    },
                    extension: undefined
                }, 'releaseNotes', title, { group: editorService_1.ACTIVE_GROUP, preserveFocus: false });
                this._currentReleaseNotes.webview.onDidClickLink(uri => this.onDidClickLink(uri_1.URI.parse(uri)));
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(this._currentReleaseNotes.webview.onMessage(e => {
                    if (e.message.type === 'showReleaseNotes') {
                        this._configurationService.updateValue('update.showReleaseNotes', e.message.value);
                    }
                    else if (e.message.type === 'clickSetting') {
                        const x = this._currentReleaseNotes?.webview.container.offsetLeft + e.message.value.x;
                        const y = this._currentReleaseNotes?.webview.container.offsetTop + e.message.value.y;
                        this._simpleSettingRenderer.updateSetting(uri_1.URI.parse(e.message.value.uri), x, y);
                    }
                }));
                disposables.add(this._currentReleaseNotes.onWillDispose(() => {
                    disposables.dispose();
                    this._currentReleaseNotes = undefined;
                }));
                this._currentReleaseNotes.webview.setHtml(html);
            }
            return true;
        }
        async loadReleaseNotes(version, useCurrentFile) {
            const match = /^(\d+\.\d+)\./.exec(version);
            if (!match) {
                throw new Error('not found');
            }
            const versionLabel = match[1].replace(/\./g, '_');
            const baseUrl = 'https://code.visualstudio.com/raw';
            const url = `${baseUrl}/v${versionLabel}.md`;
            const unassigned = nls.localize('unassigned', "unassigned");
            const escapeMdHtml = (text) => {
                return (0, strings_1.escape)(text).replace(/\\/g, '\\\\');
            };
            const patchKeybindings = (text) => {
                const kb = (match, kb) => {
                    const keybinding = this._keybindingService.lookupKeybinding(kb);
                    if (!keybinding) {
                        return unassigned;
                    }
                    return keybinding.getLabel() || unassigned;
                };
                const kbstyle = (match, kb) => {
                    const keybinding = keybindingParser_1.KeybindingParser.parseKeybinding(kb);
                    if (!keybinding) {
                        return unassigned;
                    }
                    const resolvedKeybindings = this._keybindingService.resolveKeybinding(keybinding);
                    if (resolvedKeybindings.length === 0) {
                        return unassigned;
                    }
                    return resolvedKeybindings[0].getLabel() || unassigned;
                };
                const kbCode = (match, binding) => {
                    const resolved = kb(match, binding);
                    return resolved ? `<code title="${binding}">${escapeMdHtml(resolved)}</code>` : resolved;
                };
                const kbstyleCode = (match, binding) => {
                    const resolved = kbstyle(match, binding);
                    return resolved ? `<code title="${binding}">${escapeMdHtml(resolved)}</code>` : resolved;
                };
                return text
                    .replace(/`kb\(([a-z.\d\-]+)\)`/gi, kbCode)
                    .replace(/`kbstyle\(([^\)]+)\)`/gi, kbstyleCode)
                    .replace(/kb\(([a-z.\d\-]+)\)/gi, (match, binding) => (0, htmlContent_1.escapeMarkdownSyntaxTokens)(kb(match, binding)))
                    .replace(/kbstyle\(([^\)]+)\)/gi, (match, binding) => (0, htmlContent_1.escapeMarkdownSyntaxTokens)(kbstyle(match, binding)));
            };
            const fetchReleaseNotes = async () => {
                let text;
                try {
                    if (useCurrentFile) {
                        const file = this._codeEditorService.getActiveCodeEditor()?.getModel()?.getValue();
                        text = file ? file.substring(file.indexOf('#')) : undefined;
                    }
                    else {
                        text = await (0, request_1.asTextOrError)(await this._requestService.request({ url }, cancellation_1.CancellationToken.None));
                    }
                }
                catch {
                    throw new Error('Failed to fetch release notes');
                }
                if (!text || !/^#\s/.test(text)) { // release notes always starts with `#` followed by whitespace
                    throw new Error('Invalid release notes');
                }
                return patchKeybindings(text);
            };
            // Don't cache the current file
            if (useCurrentFile) {
                return fetchReleaseNotes();
            }
            if (!this._releaseNotesCache.has(version)) {
                this._releaseNotesCache.set(version, (async () => {
                    try {
                        return await fetchReleaseNotes();
                    }
                    catch (err) {
                        this._releaseNotesCache.delete(version);
                        throw err;
                    }
                })());
            }
            return this._releaseNotesCache.get(version);
        }
        async onDidClickLink(uri) {
            if (uri.scheme === network_1.Schemas.codeSetting) {
                // handled in receive message
            }
            else {
                this.addGAParameters(uri, 'ReleaseNotes')
                    .then(updated => this._openerService.open(updated, { allowCommands: ['workbench.action.openSettings'] }))
                    .then(undefined, errors_1.onUnexpectedError);
            }
        }
        async addGAParameters(uri, origin, experiment = '1') {
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService) === 3 /* TelemetryLevel.USAGE */) {
                if (uri.scheme === 'https' && uri.authority === 'code.visualstudio.com') {
                    return uri.with({ query: `${uri.query ? uri.query + '&' : ''}utm_source=VsCode&utm_medium=${encodeURIComponent(origin)}&utm_content=${encodeURIComponent(experiment)}` });
                }
            }
            return uri;
        }
        async renderBody(text) {
            const nonce = (0, uuid_1.generateUuid)();
            const content = await (0, markdownDocumentRenderer_1.renderMarkdownDocument)(text, this._extensionService, this._languageService, false, undefined, undefined, this._simpleSettingRenderer);
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            const showReleaseNotes = Boolean(this._configurationService.getValue('update.showReleaseNotes'));
            return `<!DOCTYPE html>
		<html>
			<head>
				<base href="https://code.visualstudio.com/raw/">
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; style-src 'nonce-${nonce}' https://code.visualstudio.com; script-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}

					/* codesetting */

					code:has(.codesetting)+code {
						display: none;
					}

					code:has(.codesetting) {
						background-color: var(--vscode-textPreformat-background);
						color: var(--vscode-textPreformat-foreground);
						padding-left: 1px;
						margin-right: 3px;
						padding-right: 0px;
					}

					code:has(.codesetting):focus {
						border: 1px solid var(--vscode-button-border, transparent);
					}

					.codesetting {
						color: var(--vscode-textPreformat-foreground);
						padding: 0px 1px 1px 0px;
						font-size: 0px;
						overflow: hidden;
						text-overflow: ellipsis;
						outline-offset: 2px !important;
						box-sizing: border-box;
						text-align: center;
						cursor: pointer;
						display: inline;
						margin-right: 3px;
					}
					.codesetting svg {
						font-size: 12px;
						text-align: center;
						cursor: pointer;
						border: 1px solid var(--vscode-button-secondaryBorder, transparent);
						outline: 1px solid transparent;
						line-height: 9px;
						margin-bottom: -5px;
						padding-left: 0px;
						padding-top: 2px;
						padding-bottom: 2px;
						padding-right: 2px;
						display: inline-block;
						text-decoration: none;
						text-rendering: auto;
						text-transform: none;
						-webkit-font-smoothing: antialiased;
						-moz-osx-font-smoothing: grayscale;
						user-select: none;
						-webkit-user-select: none;
					}
					.codesetting .setting-name {
						font-size: 13px;
						padding-left: 2px;
						padding-right: 3px;
						padding-top: 1px;
						padding-bottom: 1px;
						margin-left: -5px;
						margin-top: -3px;
					}
					.codesetting:hover {
						color: var(--vscode-textPreformat-foreground) !important;
						text-decoration: none !important;
					}
					code:has(.codesetting):hover {
						filter: brightness(140%);
						text-decoration: none !important;
					}
					.codesetting:focus {
						outline: 0 !important;
						text-decoration: none !important;
						color: var(--vscode-button-hoverForeground) !important;
					}
					.codesetting .separator {
						width: 1px;
						height: 14px;
						margin-bottom: -3px;
						display: inline-block;
						background-color: var(--vscode-editor-background);
						font-size: 12px;
						margin-right: 8px;
					}

					header { display: flex; align-items: center; padding-top: 1em; }
				</style>
			</head>
			<body>
				${content}
				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
					const container = document.createElement('p');
					container.style.display = 'flex';
					container.style.alignItems = 'center';

					const input = document.createElement('input');
					input.type = 'checkbox';
					input.id = 'showReleaseNotes';
					input.checked = ${showReleaseNotes};
					container.appendChild(input);

					const label = document.createElement('label');
					label.htmlFor = 'showReleaseNotes';
					label.textContent = '${nls.localize('showOnUpdate', "Show release notes after an update")}';
					container.appendChild(label);

					const beforeElement = document.querySelector("body > h1")?.nextElementSibling;
					if (beforeElement) {
						document.body.insertBefore(container, beforeElement);
					} else {
						document.body.appendChild(container);
					}

					window.addEventListener('message', event => {
						if (event.data.type === 'showReleaseNotes') {
							input.checked = event.data.value;
						}
					});

					window.addEventListener('click', event => {
						const href = event.target.href ?? event.target.parentElement.href ?? event.target.parentElement.parentElement?.href;
						if (href && (href.startsWith('${network_1.Schemas.codeSetting}'))) {
							vscode.postMessage({ type: 'clickSetting', value: { uri: href, x: event.clientX, y: event.clientY }});
						}
					});

					window.addEventListener('keypress', event => {
						if (event.keyCode === 13) {
							if (event.target.children.length > 0 && event.target.children[0].href) {
								const clientRect = event.target.getBoundingClientRect();
								vscode.postMessage({ type: 'clickSetting', value: { uri: event.target.children[0].href, x: clientRect.right , y: clientRect.bottom }});
							}
						}
					});

					input.addEventListener('change', event => {
						vscode.postMessage({ type: 'showReleaseNotes', value: input.checked }, '*');
					});
				</script>
			</body>
		</html>`;
        }
        onDidChangeConfiguration(e) {
            if (e.affectsConfiguration('update.showReleaseNotes')) {
                this.updateCheckboxWebview();
            }
        }
        onDidChangeActiveWebviewEditor(input) {
            if (input && input === this._currentReleaseNotes) {
                this.updateCheckboxWebview();
            }
        }
        updateCheckboxWebview() {
            if (this._currentReleaseNotes) {
                this._currentReleaseNotes.webview.postMessage({
                    type: 'showReleaseNotes',
                    value: this._configurationService.getValue('update.showReleaseNotes')
                });
            }
        }
    };
    exports.ReleaseNotesManager = ReleaseNotesManager;
    exports.ReleaseNotesManager = ReleaseNotesManager = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, keybinding_1.IKeybindingService),
        __param(2, language_1.ILanguageService),
        __param(3, opener_1.IOpenerService),
        __param(4, request_1.IRequestService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, codeEditorService_1.ICodeEditorService),
        __param(9, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(10, extensions_1.IExtensionService),
        __param(11, productService_1.IProductService),
        __param(12, instantiation_1.IInstantiationService)
    ], ReleaseNotesManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsZWFzZU5vdGVzRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi91cGRhdGUvYnJvd3Nlci9yZWxlYXNlTm90ZXNFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0N6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFtQjtRQVEvQixZQUNzQixtQkFBeUQsRUFDMUQsa0JBQXVELEVBQ3pELGdCQUFtRCxFQUNyRCxjQUErQyxFQUM5QyxlQUFpRCxFQUMzQyxxQkFBNkQsRUFDcEUsY0FBK0MsRUFDekMsbUJBQTBELEVBQzVELGtCQUF1RCxFQUNqRCx3QkFBbUUsRUFDMUUsaUJBQXFELEVBQ3ZELGVBQWlELEVBQzNDLHFCQUE2RDtZQVo5Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ3pDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDeEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNwQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDN0Isb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQzFCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDbkQsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3hCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDM0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNoQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3pELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDdEMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQzFCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFuQnBFLHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBRWpFLHlCQUFvQixH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