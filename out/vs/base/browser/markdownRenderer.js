/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/dompurify/dompurify", "vs/base/browser/event", "vs/base/browser/formattedTextRenderer", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iconLabels", "vs/base/common/idGenerator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri"], function (require, exports, DOM, dompurify, event_1, formattedTextRenderer_1, keyboardEvent_1, mouseEvent_1, iconLabels_1, errors_1, event_2, htmlContent_1, iconLabels_2, idGenerator_1, lazy_1, lifecycle_1, marked_1, marshalling_1, network_1, objects_1, resources_1, strings_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.allowedMarkdownAttr = void 0;
    exports.renderMarkdown = renderMarkdown;
    exports.renderStringAsPlaintext = renderStringAsPlaintext;
    exports.renderMarkdownAsPlaintext = renderMarkdownAsPlaintext;
    exports.fillInIncompleteTokens = fillInIncompleteTokens;
    const defaultMarkedRenderers = Object.freeze({
        image: (href, title, text) => {
            let dimensions = [];
            let attributes = [];
            if (href) {
                ({ href, dimensions } = (0, htmlContent_1.parseHrefAndDimensions)(href));
                attributes.push(`src="${(0, htmlContent_1.escapeDoubleQuotes)(href)}"`);
            }
            if (text) {
                attributes.push(`alt="${(0, htmlContent_1.escapeDoubleQuotes)(text)}"`);
            }
            if (title) {
                attributes.push(`title="${(0, htmlContent_1.escapeDoubleQuotes)(title)}"`);
            }
            if (dimensions.length) {
                attributes = attributes.concat(dimensions);
            }
            return '<img ' + attributes.join(' ') + '>';
        },
        paragraph: (text) => {
            return `<p>${text}</p>`;
        },
        link: (href, title, text) => {
            if (typeof href !== 'string') {
                return '';
            }
            // Remove markdown escapes. Workaround for https://github.com/chjj/marked/issues/829
            if (href === text) { // raw link case
                text = (0, htmlContent_1.removeMarkdownEscapes)(text);
            }
            title = typeof title === 'string' ? (0, htmlContent_1.escapeDoubleQuotes)((0, htmlContent_1.removeMarkdownEscapes)(title)) : '';
            href = (0, htmlContent_1.removeMarkdownEscapes)(href);
            // HTML Encode href
            href = href.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            return `<a href="${href}" title="${title || href}" draggable="false">${text}</a>`;
        },
    });
    /**
     * Low-level way create a html element from a markdown string.
     *
     * **Note** that for most cases you should be using [`MarkdownRenderer`](./src/vs/editor/contrib/markdownRenderer/browser/markdownRenderer.ts)
     * which comes with support for pretty code block rendering and which uses the default way of handling links.
     */
    function renderMarkdown(markdown, options = {}, markedOptions = {}) {
        const disposables = new lifecycle_1.DisposableStore();
        let isDisposed = false;
        const element = (0, formattedTextRenderer_1.createElement)(options);
        const _uriMassage = function (part) {
            let data;
            try {
                data = (0, marshalling_1.parse)(decodeURIComponent(part));
            }
            catch (e) {
                // ignore
            }
            if (!data) {
                return part;
            }
            data = (0, objects_1.cloneAndChange)(data, value => {
                if (markdown.uris && markdown.uris[value]) {
                    return uri_1.URI.revive(markdown.uris[value]);
                }
                else {
                    return undefined;
                }
            });
            return encodeURIComponent(JSON.stringify(data));
        };
        const _href = function (href, isDomUri) {
            const data = markdown.uris && markdown.uris[href];
            let uri = uri_1.URI.revive(data);
            if (isDomUri) {
                if (href.startsWith(network_1.Schemas.data + ':')) {
                    return href;
                }
                if (!uri) {
                    uri = uri_1.URI.parse(href);
                }
                // this URI will end up as "src"-attribute of a dom node
                // and because of that special rewriting needs to be done
                // so that the URI uses a protocol that's understood by
                // browsers (like http or https)
                return network_1.FileAccess.uriToBrowserUri(uri).toString(true);
            }
            if (!uri) {
                return href;
            }
            if (uri_1.URI.parse(href).toString() === uri.toString()) {
                return href; // no transformation performed
            }
            if (uri.query) {
                uri = uri.with({ query: _uriMassage(uri.query) });
            }
            return uri.toString();
        };
        const renderer = new marked_1.marked.Renderer();
        renderer.image = defaultMarkedRenderers.image;
        renderer.link = defaultMarkedRenderers.link;
        renderer.paragraph = defaultMarkedRenderers.paragraph;
        // Will collect [id, renderedElement] tuples
        const codeBlocks = [];
        const syncCodeBlocks = [];
        if (options.codeBlockRendererSync) {
            renderer.code = (code, lang) => {
                const id = idGenerator_1.defaultGenerator.nextId();
                const value = options.codeBlockRendererSync(postProcessCodeBlockLanguageId(lang), code);
                syncCodeBlocks.push([id, value]);
                return `<div class="code" data-code="${id}">${(0, strings_1.escape)(code)}</div>`;
            };
        }
        else if (options.codeBlockRenderer) {
            renderer.code = (code, lang) => {
                const id = idGenerator_1.defaultGenerator.nextId();
                const value = options.codeBlockRenderer(postProcessCodeBlockLanguageId(lang), code);
                codeBlocks.push(value.then(element => [id, element]));
                return `<div class="code" data-code="${id}">${(0, strings_1.escape)(code)}</div>`;
            };
        }
        if (options.actionHandler) {
            const _activateLink = function (event) {
                let target = event.target;
                if (target.tagName !== 'A') {
                    target = target.parentElement;
                    if (!target || target.tagName !== 'A') {
                        return;
                    }
                }
                try {
                    let href = target.dataset['href'];
                    if (href) {
                        if (markdown.baseUri) {
                            href = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                        }
                        options.actionHandler.callback(href, event);
                    }
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    event.preventDefault();
                }
            };
            const onClick = options.actionHandler.disposables.add(new event_1.DomEmitter(element, 'click'));
            const onAuxClick = options.actionHandler.disposables.add(new event_1.DomEmitter(element, 'auxclick'));
            options.actionHandler.disposables.add(event_2.Event.any(onClick.event, onAuxClick.event)(e => {
                const mouseEvent = new mouseEvent_1.StandardMouseEvent(DOM.getWindow(element), e);
                if (!mouseEvent.leftButton && !mouseEvent.middleButton) {
                    return;
                }
                _activateLink(mouseEvent);
            }));
            options.actionHandler.disposables.add(DOM.addDisposableListener(element, 'keydown', (e) => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (!keyboardEvent.equals(10 /* KeyCode.Space */) && !keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                    return;
                }
                _activateLink(keyboardEvent);
            }));
        }
        if (!markdown.supportHtml) {
            // TODO: Can we deprecated this in favor of 'supportHtml'?
            // Use our own sanitizer so that we can let through only spans.
            // Otherwise, we'd be letting all html be rendered.
            // If we want to allow markdown permitted tags, then we can delete sanitizer and sanitize.
            // We always pass the output through dompurify after this so that we don't rely on
            // marked for sanitization.
            markedOptions.sanitizer = (html) => {
                const match = markdown.isTrusted ? html.match(/^(<span[^>]+>)|(<\/\s*span>)$/) : undefined;
                return match ? html : '';
            };
            markedOptions.sanitize = true;
            markedOptions.silent = true;
        }
        markedOptions.renderer = renderer;
        // values that are too long will freeze the UI
        let value = markdown.value ?? '';
        if (value.length > 100_000) {
            value = `${value.substr(0, 100_000)}…`;
        }
        // escape theme icons
        if (markdown.supportThemeIcons) {
            value = (0, iconLabels_2.markdownEscapeEscapedIcons)(value);
        }
        let renderedMarkdown;
        if (options.fillInIncompleteTokens) {
            // The defaults are applied by parse but not lexer()/parser(), and they need to be present
            const opts = {
                ...marked_1.marked.defaults,
                ...markedOptions
            };
            const tokens = marked_1.marked.lexer(value, opts);
            const newTokens = fillInIncompleteTokens(tokens);
            renderedMarkdown = marked_1.marked.parser(newTokens, opts);
        }
        else {
            renderedMarkdown = marked_1.marked.parse(value, markedOptions);
        }
        // Rewrite theme icons
        if (markdown.supportThemeIcons) {
            const elements = (0, iconLabels_1.renderLabelWithIcons)(renderedMarkdown);
            renderedMarkdown = elements.map(e => typeof e === 'string' ? e : e.outerHTML).join('');
        }
        const htmlParser = new DOMParser();
        const markdownHtmlDoc = htmlParser.parseFromString(sanitizeRenderedMarkdown(markdown, renderedMarkdown), 'text/html');
        markdownHtmlDoc.body.querySelectorAll('img')
            .forEach(img => {
            const src = img.getAttribute('src'); // Get the raw 'src' attribute value as text, not the resolved 'src'
            if (src) {
                let href = src;
                try {
                    if (markdown.baseUri) { // absolute or relative local path, or file: uri
                        href = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                    }
                }
                catch (err) { }
                img.src = _href(href, true);
            }
        });
        markdownHtmlDoc.body.querySelectorAll('a')
            .forEach(a => {
            const href = a.getAttribute('href'); // Get the raw 'href' attribute value as text, not the resolved 'href'
            a.setAttribute('href', ''); // Clear out href. We use the `data-href` for handling clicks instead
            if (!href
                || /^data:|javascript:/i.test(href)
                || (/^command:/i.test(href) && !markdown.isTrusted)
                || /^command:(\/\/\/)?_workbench\.downloadResource/i.test(href)) {
                // drop the link
                a.replaceWith(...a.childNodes);
            }
            else {
                let resolvedHref = _href(href, false);
                if (markdown.baseUri) {
                    resolvedHref = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                }
                a.dataset.href = resolvedHref;
            }
        });
        element.innerHTML = sanitizeRenderedMarkdown(markdown, markdownHtmlDoc.body.innerHTML);
        if (codeBlocks.length > 0) {
            Promise.all(codeBlocks).then((tuples) => {
                if (isDisposed) {
                    return;
                }
                const renderedElements = new Map(tuples);
                const placeholderElements = element.querySelectorAll(`div[data-code]`);
                for (const placeholderElement of placeholderElements) {
                    const renderedElement = renderedElements.get(placeholderElement.dataset['code'] ?? '');
                    if (renderedElement) {
                        DOM.reset(placeholderElement, renderedElement);
                    }
                }
                options.asyncRenderCallback?.();
            });
        }
        else if (syncCodeBlocks.length > 0) {
            const renderedElements = new Map(syncCodeBlocks);
            const placeholderElements = element.querySelectorAll(`div[data-code]`);
            for (const placeholderElement of placeholderElements) {
                const renderedElement = renderedElements.get(placeholderElement.dataset['code'] ?? '');
                if (renderedElement) {
                    DOM.reset(placeholderElement, renderedElement);
                }
            }
        }
        // signal size changes for image tags
        if (options.asyncRenderCallback) {
            for (const img of element.getElementsByTagName('img')) {
                const listener = disposables.add(DOM.addDisposableListener(img, 'load', () => {
                    listener.dispose();
                    options.asyncRenderCallback();
                }));
            }
        }
        return {
            element,
            dispose: () => {
                isDisposed = true;
                disposables.dispose();
            }
        };
    }
    function postProcessCodeBlockLanguageId(lang) {
        if (!lang) {
            return '';
        }
        const parts = lang.split(/[\s+|:|,|\{|\?]/, 1);
        if (parts.length) {
            return parts[0];
        }
        return lang;
    }
    function resolveWithBaseUri(baseUri, href) {
        const hasScheme = /^\w[\w\d+.-]*:/.test(href);
        if (hasScheme) {
            return href;
        }
        if (baseUri.path.endsWith('/')) {
            return (0, resources_1.resolvePath)(baseUri, href).toString();
        }
        else {
            return (0, resources_1.resolvePath)((0, resources_1.dirname)(baseUri), href).toString();
        }
    }
    function sanitizeRenderedMarkdown(options, renderedMarkdown) {
        const { config, allowedSchemes } = getSanitizerOptions(options);
        dompurify.addHook('uponSanitizeAttribute', (element, e) => {
            if (e.attrName === 'style' || e.attrName === 'class') {
                if (element.tagName === 'SPAN') {
                    if (e.attrName === 'style') {
                        e.keepAttr = /^(color\:(#[0-9a-fA-F]+|var\(--vscode(-[a-zA-Z]+)+\));)?(background-color\:(#[0-9a-fA-F]+|var\(--vscode(-[a-zA-Z]+)+\));)?$/.test(e.attrValue);
                        return;
                    }
                    else if (e.attrName === 'class') {
                        e.keepAttr = /^codicon codicon-[a-z\-]+( codicon-modifier-[a-z\-]+)?$/.test(e.attrValue);
                        return;
                    }
                }
                e.keepAttr = false;
                return;
            }
            else if (element.tagName === 'INPUT' && element.attributes.getNamedItem('type')?.value === 'checkbox') {
                if ((e.attrName === 'type' && e.attrValue === 'checkbox') || e.attrName === 'disabled' || e.attrName === 'checked') {
                    e.keepAttr = true;
                    return;
                }
                e.keepAttr = false;
            }
        });
        dompurify.addHook('uponSanitizeElement', (element, e) => {
            if (e.tagName === 'input') {
                if (element.attributes.getNamedItem('type')?.value === 'checkbox') {
                    element.setAttribute('disabled', '');
                }
                else {
                    element.parentElement?.removeChild(element);
                }
            }
        });
        const hook = DOM.hookDomPurifyHrefAndSrcSanitizer(allowedSchemes);
        try {
            return dompurify.sanitize(renderedMarkdown, { ...config, RETURN_TRUSTED_TYPE: true });
        }
        finally {
            dompurify.removeHook('uponSanitizeAttribute');
            hook.dispose();
        }
    }
    exports.allowedMarkdownAttr = [
        'align',
        'autoplay',
        'alt',
        'checked',
        'class',
        'controls',
        'data-code',
        'data-href',
        'disabled',
        'draggable',
        'height',
        'href',
        'loop',
        'muted',
        'playsinline',
        'poster',
        'src',
        'style',
        'target',
        'title',
        'type',
        'width',
        'start',
    ];
    function getSanitizerOptions(options) {
        const allowedSchemes = [
            network_1.Schemas.http,
            network_1.Schemas.https,
            network_1.Schemas.mailto,
            network_1.Schemas.data,
            network_1.Schemas.file,
            network_1.Schemas.vscodeFileResource,
            network_1.Schemas.vscodeRemote,
            network_1.Schemas.vscodeRemoteResource,
        ];
        if (options.isTrusted) {
            allowedSchemes.push(network_1.Schemas.command);
        }
        return {
            config: {
                // allowedTags should included everything that markdown renders to.
                // Since we have our own sanitize function for marked, it's possible we missed some tag so let dompurify make sure.
                // HTML tags that can result from markdown are from reading https://spec.commonmark.org/0.29/
                // HTML table tags that can result from markdown are from https://github.github.com/gfm/#tables-extension-
                ALLOWED_TAGS: [...DOM.basicMarkupHtmlTags],
                ALLOWED_ATTR: exports.allowedMarkdownAttr,
                ALLOW_UNKNOWN_PROTOCOLS: true,
            },
            allowedSchemes
        };
    }
    /**
     * Strips all markdown from `string`, if it's an IMarkdownString. For example
     * `# Header` would be output as `Header`. If it's not, the string is returned.
     */
    function renderStringAsPlaintext(string) {
        return typeof string === 'string' ? string : renderMarkdownAsPlaintext(string);
    }
    /**
     * Strips all markdown from `markdown`. For example `# Header` would be output as `Header`.
     */
    function renderMarkdownAsPlaintext(markdown) {
        // values that are too long will freeze the UI
        let value = markdown.value ?? '';
        if (value.length > 100_000) {
            value = `${value.substr(0, 100_000)}…`;
        }
        const html = marked_1.marked.parse(value, { renderer: plainTextRenderer.value }).replace(/&(#\d+|[a-zA-Z]+);/g, m => unescapeInfo.get(m) ?? m);
        return sanitizeRenderedMarkdown({ isTrusted: false }, html).toString();
    }
    const unescapeInfo = new Map([
        ['&quot;', '"'],
        ['&nbsp;', ' '],
        ['&amp;', '&'],
        ['&#39;', '\''],
        ['&lt;', '<'],
        ['&gt;', '>'],
    ]);
    const plainTextRenderer = new lazy_1.Lazy(() => {
        const renderer = new marked_1.marked.Renderer();
        renderer.code = (code) => {
            return code;
        };
        renderer.blockquote = (quote) => {
            return quote;
        };
        renderer.html = (_html) => {
            return '';
        };
        renderer.heading = (text, _level, _raw) => {
            return text + '\n';
        };
        renderer.hr = () => {
            return '';
        };
        renderer.list = (body, _ordered) => {
            return body;
        };
        renderer.listitem = (text) => {
            return text + '\n';
        };
        renderer.paragraph = (text) => {
            return text + '\n';
        };
        renderer.table = (header, body) => {
            return header + body + '\n';
        };
        renderer.tablerow = (content) => {
            return content;
        };
        renderer.tablecell = (content, _flags) => {
            return content + ' ';
        };
        renderer.strong = (text) => {
            return text;
        };
        renderer.em = (text) => {
            return text;
        };
        renderer.codespan = (code) => {
            return code;
        };
        renderer.br = () => {
            return '\n';
        };
        renderer.del = (text) => {
            return text;
        };
        renderer.image = (_href, _title, _text) => {
            return '';
        };
        renderer.text = (text) => {
            return text;
        };
        renderer.link = (_href, _title, text) => {
            return text;
        };
        return renderer;
    });
    function mergeRawTokenText(tokens) {
        let mergedTokenText = '';
        tokens.forEach(token => {
            mergedTokenText += token.raw;
        });
        return mergedTokenText;
    }
    function completeSingleLinePattern(token) {
        for (let i = 0; i < token.tokens.length; i++) {
            const subtoken = token.tokens[i];
            if (subtoken.type === 'text') {
                const lines = subtoken.raw.split('\n');
                const lastLine = lines[lines.length - 1];
                if (lastLine.includes('`')) {
                    return completeCodespan(token);
                }
                else if (lastLine.includes('**')) {
                    return completeDoublestar(token);
                }
                else if (lastLine.match(/\*\w/)) {
                    return completeStar(token);
                }
                else if (lastLine.match(/(^|\s)__\w/)) {
                    return completeDoubleUnderscore(token);
                }
                else if (lastLine.match(/(^|\s)_\w/)) {
                    return completeUnderscore(token);
                }
                else if (lastLine.match(/(^|\s)\[.*\]\(\w*/)) {
                    const nextTwoSubTokens = token.tokens.slice(i + 1);
                    if (nextTwoSubTokens[0]?.type === 'link' && nextTwoSubTokens[1]?.type === 'text' && nextTwoSubTokens[1].raw.match(/^ *"[^"]*$/)) {
                        // A markdown link can look like
                        // [link text](https://microsoft.com "more text")
                        // Where "more text" is a title for the link or an argument to a vscode command link
                        return completeLinkTargetArg(token);
                    }
                    return completeLinkTarget(token);
                }
                else if (hasStartOfLinkTarget(lastLine)) {
                    return completeLinkTarget(token);
                }
                else if (lastLine.match(/(^|\s)\[\w/) && !token.tokens.slice(i + 1).some(t => hasStartOfLinkTarget(t.raw))) {
                    return completeLinkText(token);
                }
            }
        }
        return undefined;
    }
    function hasStartOfLinkTarget(str) {
        return !!str.match(/^[^\[]*\]\([^\)]*$/);
    }
    // function completeListItemPattern(token: marked.Tokens.List): marked.Tokens.List | undefined {
    // 	// Patch up this one list item
    // 	const lastItem = token.items[token.items.length - 1];
    // 	const newList = completeSingleLinePattern(lastItem);
    // 	if (!newList || newList.type !== 'list') {
    // 		// Nothing to fix, or not a pattern we were expecting
    // 		return;
    // 	}
    // 	// Re-parse the whole list with the last item replaced
    // 	const completeList = marked.lexer(mergeRawTokenText(token.items.slice(0, token.items.length - 1)) + newList.items[0].raw);
    // 	if (completeList.length === 1 && completeList[0].type === 'list') {
    // 		return completeList[0];
    // 	}
    // 	// Not a pattern we were expecting
    // 	return undefined;
    // }
    function fillInIncompleteTokens(tokens) {
        let i;
        let newTokens;
        for (i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            let codeblockStart;
            if (token.type === 'paragraph' && (codeblockStart = token.raw.match(/(\n|^)(````*)/))) {
                const codeblockLead = codeblockStart[2];
                // If the code block was complete, it would be in a type='code'
                newTokens = completeCodeBlock(tokens.slice(i), codeblockLead);
                break;
            }
            if (token.type === 'paragraph' && token.raw.match(/(\n|^)\|/)) {
                newTokens = completeTable(tokens.slice(i));
                break;
            }
            // if (i === tokens.length - 1 && token.type === 'list') {
            // 	const newListToken = completeListItemPattern(token);
            // 	if (newListToken) {
            // 		newTokens = [newListToken];
            // 		break;
            // 	}
            // }
            if (i === tokens.length - 1 && token.type === 'paragraph') {
                // Only operates on a single token, because any newline that follows this should break these patterns
                const newToken = completeSingleLinePattern(token);
                if (newToken) {
                    newTokens = [newToken];
                    break;
                }
            }
        }
        if (newTokens) {
            const newTokensList = [
                ...tokens.slice(0, i),
                ...newTokens
            ];
            newTokensList.links = tokens.links;
            return newTokensList;
        }
        return tokens;
    }
    function completeCodeBlock(tokens, leader) {
        const mergedRawText = mergeRawTokenText(tokens);
        return marked_1.marked.lexer(mergedRawText + `\n${leader}`);
    }
    function completeCodespan(token) {
        return completeWithString(token, '`');
    }
    function completeStar(tokens) {
        return completeWithString(tokens, '*');
    }
    function completeUnderscore(tokens) {
        return completeWithString(tokens, '_');
    }
    function completeLinkTarget(tokens) {
        return completeWithString(tokens, ')');
    }
    function completeLinkTargetArg(tokens) {
        return completeWithString(tokens, '")');
    }
    function completeLinkText(tokens) {
        return completeWithString(tokens, '](about:blank)');
    }
    function completeDoublestar(tokens) {
        return completeWithString(tokens, '**');
    }
    function completeDoubleUnderscore(tokens) {
        return completeWithString(tokens, '__');
    }
    function completeWithString(tokens, closingString) {
        const mergedRawText = mergeRawTokenText(Array.isArray(tokens) ? tokens : [tokens]);
        // If it was completed correctly, this should be a single token.
        // Expecting either a Paragraph or a List
        return marked_1.marked.lexer(mergedRawText + closingString)[0];
    }
    function completeTable(tokens) {
        const mergedRawText = mergeRawTokenText(tokens);
        const lines = mergedRawText.split('\n');
        let numCols; // The number of line1 col headers
        let hasSeparatorRow = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (typeof numCols === 'undefined' && line.match(/^\s*\|/)) {
                const line1Matches = line.match(/(\|[^\|]+)(?=\||$)/g);
                if (line1Matches) {
                    numCols = line1Matches.length;
                }
            }
            else if (typeof numCols === 'number') {
                if (line.match(/^\s*\|/)) {
                    if (i !== lines.length - 1) {
                        // We got the line1 header row, and the line2 separator row, but there are more lines, and it wasn't parsed as a table!
                        // That's strange and means that the table is probably malformed in the source, so I won't try to patch it up.
                        return undefined;
                    }
                    // Got a line2 separator row- partial or complete, doesn't matter, we'll replace it with a correct one
                    hasSeparatorRow = true;
                }
                else {
                    // The line after the header row isn't a valid separator row, so the table is malformed, don't fix it up
                    return undefined;
                }
            }
        }
        if (typeof numCols === 'number' && numCols > 0) {
            const prefixText = hasSeparatorRow ? lines.slice(0, -1).join('\n') : mergedRawText;
            const line1EndsInPipe = !!prefixText.match(/\|\s*$/);
            const newRawText = prefixText + (line1EndsInPipe ? '' : '|') + `\n|${' --- |'.repeat(numCols)}`;
            return marked_1.marked.lexer(newRawText);
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd25SZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL21hcmtkb3duUmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEZoRyx3Q0E0UEM7SUF1SUQsMERBRUM7SUFLRCw4REFVQztJQWlKRCx3REE4Q0M7SUF6b0JELE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM1QyxLQUFLLEVBQUUsQ0FBQyxJQUFtQixFQUFFLEtBQW9CLEVBQUUsSUFBWSxFQUFVLEVBQUU7WUFDMUUsSUFBSSxVQUFVLEdBQWEsRUFBRSxDQUFDO1lBQzlCLElBQUksVUFBVSxHQUFhLEVBQUUsQ0FBQztZQUM5QixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNWLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBQSxvQ0FBc0IsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBQSxnQ0FBa0IsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUNELElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUEsZ0NBQWtCLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFDRCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFBLGdDQUFrQixFQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3ZCLFVBQVUsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLFVB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