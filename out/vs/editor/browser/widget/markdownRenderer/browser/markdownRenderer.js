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
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/base/browser/trustedTypes", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/config/domFontInfo", "vs/editor/common/languages/language", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/textToHtmlTokenizer", "vs/platform/opener/common/opener", "vs/css!./renderedMarkdown"], function (require, exports, markdownRenderer_1, trustedTypes_1, errors_1, event_1, lifecycle_1, domFontInfo_1, language_1, modesRegistry_1, textToHtmlTokenizer_1, opener_1) {
    "use strict";
    var MarkdownRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownRenderer = void 0;
    exports.openLinkFromMarkdown = openLinkFromMarkdown;
    /**
     * Markdown renderer that can render codeblocks with the editor mechanics. This
     * renderer should always be preferred.
     */
    let MarkdownRenderer = class MarkdownRenderer {
        static { MarkdownRenderer_1 = this; }
        static { this._ttpTokenizer = (0, trustedTypes_1.createTrustedTypesPolicy)('tokenizeToString', {
            createHTML(html) {
                return html;
            }
        }); }
        constructor(_options, _languageService, _openerService) {
            this._options = _options;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._onDidRenderAsync = new event_1.Emitter();
            this.onDidRenderAsync = this._onDidRenderAsync.event;
        }
        dispose() {
            this._onDidRenderAsync.dispose();
        }
        render(markdown, options, markedOptions) {
            if (!markdown) {
                const element = document.createElement('span');
                return { element, dispose: () => { } };
            }
            const disposables = new lifecycle_1.DisposableStore();
            const rendered = disposables.add((0, markdownRenderer_1.renderMarkdown)(markdown, { ...this._getRenderOptions(markdown, disposables), ...options }, markedOptions));
            rendered.element.classList.add('rendered-markdown');
            return {
                element: rendered.element,
                dispose: () => disposables.dispose()
            };
        }
        _getRenderOptions(markdown, disposables) {
            return {
                codeBlockRenderer: async (languageAlias, value) => {
                    // In markdown,
                    // it is possible that we stumble upon language aliases (e.g.js instead of javascript)
                    // it is possible no alias is given in which case we fall back to the current editor lang
                    let languageId;
                    if (languageAlias) {
                        languageId = this._languageService.getLanguageIdByLanguageName(languageAlias);
                    }
                    else if (this._options.editor) {
                        languageId = this._options.editor.getModel()?.getLanguageId();
                    }
                    if (!languageId) {
                        languageId = modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                    }
                    const html = await (0, textToHtmlTokenizer_1.tokenizeToString)(this._languageService, value, languageId);
                    const element = document.createElement('span');
                    element.innerHTML = (MarkdownRenderer_1._ttpTokenizer?.createHTML(html) ?? html);
                    // use "good" font
                    if (this._options.editor) {
                        const fontInfo = this._options.editor.getOption(50 /* EditorOption.fontInfo */);
                        (0, domFontInfo_1.applyFontInfo)(element, fontInfo);
                    }
                    else if (this._options.codeBlockFontFamily) {
                        element.style.fontFamily = this._options.codeBlockFontFamily;
                    }
                    if (this._options.codeBlockFontSize !== undefined) {
                        element.style.fontSize = this._options.codeBlockFontSize;
                    }
                    return element;
                },
                asyncRenderCallback: () => this._onDidRenderAsync.fire(),
                actionHandler: {
                    callback: (link) => openLinkFromMarkdown(this._openerService, link, markdown.isTrusted),
                    disposables: disposables
                }
            };
        }
    };
    exports.MarkdownRenderer = MarkdownRenderer;
    exports.MarkdownRenderer = MarkdownRenderer = MarkdownRenderer_1 = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService)
    ], MarkdownRenderer);
    async function openLinkFromMarkdown(openerService, link, isTrusted) {
        try {
            return await openerService.open(link, {
                fromUserGesture: true,
                allowContributedOpeners: true,
                allowCommands: toAllowCommandsOption(isTrusted),
            });
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
            return false;
        }
    }
    function toAllowCommandsOption(isTrusted) {
        if (isTrusted === true) {
            return true; // Allow all commands
        }
        if (isTrusted && Array.isArray(isTrusted.enabledCommands)) {
            return isTrusted.enabledCommands; // Allow subset of commands
        }
        return false; // Block commands
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25SZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L21hcmtkb3duUmVuZGVyZXIvYnJvd3Nlci9tYXJrZG93blJlbmRlcmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErR2hHLG9EQVdDO0lBL0ZEOzs7T0FHRztJQUNJLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCOztpQkFFYixrQkFBYSxHQUFHLElBQUEsdUNBQXdCLEVBQUMsa0JBQWtCLEVBQUU7WUFDM0UsVUFBVSxDQUFDLElBQVk7Z0JBQ3RCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztTQUNELENBQUMsQUFKMEIsQ0FJekI7UUFLSCxZQUNrQixRQUFrQyxFQUNqQyxnQkFBbUQsRUFDckQsY0FBK0M7WUFGOUMsYUFBUSxHQUFSLFFBQVEsQ0FBMEI7WUFDaEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNwQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFOL0Msc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNoRCxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBTXJELENBQUM7UUFFTCxPQUFPO1lBQ04sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFRCxNQUFNLENBQUMsUUFBcUMsRUFBRSxPQUErQixFQUFFLGFBQTZCO1lBQzNHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUs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