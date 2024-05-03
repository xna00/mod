/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/dompurify/dompurify", "vs/base/browser/markdownRenderer", "vs/base/common/marked/marked", "vs/base/common/network", "vs/editor/common/languages/textToHtmlTokenizer", "vs/base/common/strings"], function (require, exports, dom_1, dompurify, markdownRenderer_1, marked_1, network_1, textToHtmlTokenizer_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_MARKDOWN_STYLES = void 0;
    exports.renderMarkdownDocument = renderMarkdownDocument;
    exports.DEFAULT_MARKDOWN_STYLES = `
body {
	padding: 10px 20px;
	line-height: 22px;
	max-width: 882px;
	margin: 0 auto;
}

body *:last-child {
	margin-bottom: 0;
}

img {
	max-width: 100%;
	max-height: 100%;
}

a {
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

a:focus,
input:focus,
select:focus,
textarea:focus {
	outline: 1px solid -webkit-focus-ring-color;
	outline-offset: -1px;
}

hr {
	border: 0;
	height: 2px;
	border-bottom: 2px solid;
}

h1 {
	padding-bottom: 0.3em;
	line-height: 1.2;
	border-bottom-width: 1px;
	border-bottom-style: solid;
}

h1, h2, h3 {
	font-weight: normal;
}

table {
	border-collapse: collapse;
}

th {
	text-align: left;
	border-bottom: 1px solid;
}

th,
td {
	padding: 5px 10px;
}

table > tbody > tr + tr > td {
	border-top-width: 1px;
	border-top-style: solid;
}

blockquote {
	margin: 0 7px 0 5px;
	padding: 0 16px 0 10px;
	border-left-width: 5px;
	border-left-style: solid;
}

code {
	font-family: "SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace;
}

pre {
	padding: 16px;
	border-radius: 3px;
	overflow: auto;
}

pre code {
	font-family: var(--vscode-editor-font-family);
	font-weight: var(--vscode-editor-font-weight);
	font-size: var(--vscode-editor-font-size);
	line-height: 1.5;
	color: var(--vscode-editor-foreground);
	tab-size: 4;
}

.monaco-tokenized-source {
	white-space: pre;
}

/** Theming */

.pre {
	background-color: var(--vscode-textCodeBlock-background);
}

.vscode-high-contrast h1 {
	border-color: rgb(0, 0, 0);
}

.vscode-light th {
	border-color: rgba(0, 0, 0, 0.69);
}

.vscode-dark th {
	border-color: rgba(255, 255, 255, 0.69);
}

.vscode-light h1,
.vscode-light hr,
.vscode-light td {
	border-color: rgba(0, 0, 0, 0.18);
}

.vscode-dark h1,
.vscode-dark hr,
.vscode-dark td {
	border-color: rgba(255, 255, 255, 0.18);
}

@media (forced-colors: active) and (prefers-color-scheme: light){
	body {
		forced-color-adjust: none;
	}
}

@media (forced-colors: active) and (prefers-color-scheme: dark){
	body {
		forced-color-adjust: none;
	}
}
`;
    const allowedProtocols = [network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.command];
    function sanitize(documentContent, allowUnknownProtocols) {
        const hook = (0, dom_1.hookDomPurifyHrefAndSrcSanitizer)(allowedProtocols, true);
        try {
            return dompurify.sanitize(documentContent, {
                ...{
                    ALLOWED_TAGS: [
                        ...dom_1.basicMarkupHtmlTags,
                        'checkbox',
                        'checklist',
                    ],
                    ALLOWED_ATTR: [
                        ...markdownRenderer_1.allowedMarkdownAttr,
                        'data-command', 'name', 'id', 'role', 'tabindex',
                        'x-dispatch',
                        'required', 'checked', 'placeholder', 'when-checked', 'checked-on',
                    ],
                },
                ...(allowUnknownProtocols ? { ALLOW_UNKNOWN_PROTOCOLS: true } : {}),
            });
        }
        finally {
            hook.dispose();
        }
    }
    /**
     * Renders a string of markdown as a document.
     *
     * Uses VS Code's syntax highlighting code blocks.
     */
    async function renderMarkdownDocument(text, extensionService, languageService, shouldSanitize = true, allowUnknownProtocols = false, token, settingRenderer) {
        const highlight = (code, lang, callback) => {
            if (!callback) {
                return code;
            }
            if (typeof lang !== 'string') {
                callback(null, (0, strings_1.escape)(code));
                return '';
            }
            extensionService.whenInstalledExtensionsRegistered().then(async () => {
                if (token?.isCancellationRequested) {
                    callback(null, '');
                    return;
                }
                const languageId = languageService.getLanguageIdByLanguageName(lang) ?? languageService.getLanguageIdByLanguageName(lang.split(/\s+|:|,|(?!^)\{|\?]/, 1)[0]);
                const html = await (0, textToHtmlTokenizer_1.tokenizeToString)(languageService, code, languageId);
                callback(null, html);
            });
            return '';
        };
        const renderer = new marked_1.marked.Renderer();
        if (settingRenderer) {
            renderer.html = settingRenderer.getHtmlRenderer();
        }
        return new Promise((resolve, reject) => {
            (0, marked_1.marked)(text, { highlight, renderer }, (err, value) => err ? reject(err) : resolve(value));
        }).then(raw => {
            if (shouldSanitize) {
                return sanitize(raw, allowUnknownProtocols);
            }
            else {
                return raw;
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25Eb2N1bWVudFJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tYXJrZG93bi9icm93c2VyL21hcmtkb3duRG9jdW1lbnRSZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0TGhHLHdEQStDQztJQTdOWSxRQUFBLHVCQUF1QixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTRJdEMsQ0FBQztJQUVGLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxpQkFBTyxDQUFDLEtBQUssRUFBRSxpQkFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hFLFNBQVMsUUFBUSxDQUFDLGVBQXVCLEVBQUUscUJBQThCO1FBRXhFLE1BQU0sSUFBSSxHQUFHLElBQUEsc0NBQWdDLEVBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdEUsSUFBSSxDQUFDO1lBQ0osT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRTtnQkFDMUMsR0FBRztvQkFDRixZQUFZLEVBQUU7d0JBQ2IsR0FBRyx5QkFBbUI7d0JBQ3RCLFVBQVU7d0JBQ1YsV0FBVztxQkFDWDtvQkFDRCxZQUFZLEVBQUU7d0JBQ2IsR0FBRyxzQ0FBbUI7d0JBQ3RCLGNBQWMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVO3dCQUNoRCxZQUFZO3dCQUNaLFVBQVUsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLGNBQWMs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