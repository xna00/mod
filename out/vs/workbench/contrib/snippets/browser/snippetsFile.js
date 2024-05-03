/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/nls", "vs/base/common/path", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetVariables", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/browser/dom"], function (require, exports, json_1, nls_1, path_1, snippetParser_1, snippetVariables_1, resources_1, types_1, arrays_1, iterator_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetFile = exports.SnippetSource = exports.Snippet = void 0;
    class SnippetBodyInsights {
        constructor(body) {
            // init with defaults
            this.isBogous = false;
            this.isTrivial = false;
            this.usesClipboardVariable = false;
            this.usesSelectionVariable = false;
            this.codeSnippet = body;
            // check snippet...
            const textmateSnippet = new snippetParser_1.SnippetParser().parse(body, false);
            const placeholders = new Map();
            let placeholderMax = 0;
            for (const placeholder of textmateSnippet.placeholders) {
                placeholderMax = Math.max(placeholderMax, placeholder.index);
            }
            // mark snippet as trivial when there is no placeholders or when the only
            // placeholder is the final tabstop and it is at the very end.
            if (textmateSnippet.placeholders.length === 0) {
                this.isTrivial = true;
            }
            else if (placeholderMax === 0) {
                const last = (0, arrays_1.tail)(textmateSnippet.children);
                this.isTrivial = last instanceof snippetParser_1.Placeholder && last.isFinalTabstop;
            }
            const stack = [...textmateSnippet.children];
            while (stack.length > 0) {
                const marker = stack.shift();
                if (marker instanceof snippetParser_1.Variable) {
                    if (marker.children.length === 0 && !snippetVariables_1.KnownSnippetVariableNames[marker.name]) {
                        // a 'variable' without a default value and not being one of our supported
                        // variables is automatically turned into a placeholder. This is to restore
                        // a bug we had before. So `${foo}` becomes `${N:foo}`
                        const index = placeholders.has(marker.name) ? placeholders.get(marker.name) : ++placeholderMax;
                        placeholders.set(marker.name, index);
                        const synthetic = new snippetParser_1.Placeholder(index).appendChild(new snippetParser_1.Text(marker.name));
                        textmateSnippet.replace(marker, [synthetic]);
                        this.isBogous = true;
                    }
                    switch (marker.name) {
                        case 'CLIPBOARD':
                            this.usesClipboardVariable = true;
                            break;
                        case 'SELECTION':
                        case 'TM_SELECTED_TEXT':
                            this.usesSelectionVariable = true;
                            break;
                    }
                }
                else {
                    // recurse
                    stack.push(...marker.children);
                }
            }
            if (this.isBogous) {
                this.codeSnippet = textmateSnippet.toTextmateString();
            }
        }
    }
    class Snippet {
        constructor(isFileTemplate, scopes, name, prefix, description, body, source, snippetSource, snippetIdentifier, extensionId) {
            this.isFileTemplate = isFileTemplate;
            this.scopes = scopes;
            this.name = name;
            this.prefix = prefix;
            this.description = description;
            this.body = body;
            this.source = source;
            this.snippetSource = snippetSource;
            this.snippetIdentifier = snippetIdentifier;
            this.extensionId = extensionId;
            this.prefixLow = prefix.toLowerCase();
            this._bodyInsights = new dom_1.WindowIdleValue((0, dom_1.getActiveWindow)(), () => new SnippetBodyInsights(this.body));
        }
        get codeSnippet() {
            return this._bodyInsights.value.codeSnippet;
        }
        get isBogous() {
            return this._bodyInsights.value.isBogous;
        }
        get isTrivial() {
            return this._bodyInsights.value.isTrivial;
        }
        get needsClipboard() {
            return this._bodyInsights.value.usesClipboardVariable;
        }
        get usesSelection() {
            return this._bodyInsights.value.usesSelectionVariable;
        }
    }
    exports.Snippet = Snippet;
    function isJsonSerializedSnippet(thing) {
        return (0, types_1.isObject)(thing) && Boolean(thing.body);
    }
    var SnippetSource;
    (function (SnippetSource) {
        SnippetSource[SnippetSource["User"] = 1] = "User";
        SnippetSource[SnippetSource["Workspace"] = 2] = "Workspace";
        SnippetSource[SnippetSource["Extension"] = 3] = "Extension";
    })(SnippetSource || (exports.SnippetSource = SnippetSource = {}));
    class SnippetFile {
        constructor(source, location, defaultScopes, _extension, _fileService, _extensionResourceLoaderService) {
            this.source = source;
            this.location = location;
            this.defaultScopes = defaultScopes;
            this._extension = _extension;
            this._fileService = _fileService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this.data = [];
            this.isGlobalSnippets = (0, path_1.extname)(location.path) === '.code-snippets';
            this.isUserSnippets = !this._extension;
        }
        select(selector, bucket) {
            if (this.isGlobalSnippets || !this.isUserSnippets) {
                this._scopeSelect(selector, bucket);
            }
            else {
                this._filepathSelect(selector, bucket);
            }
        }
        _filepathSelect(selector, bucket) {
            // for `fooLang.json` files all snippets are accepted
            if (selector + '.json' === (0, path_1.basename)(this.location.path)) {
                bucket.push(...this.data);
            }
        }
        _scopeSelect(selector, bucket) {
            // for `my.code-snippets` files we need to look at each snippet
            for (const snippet of this.data) {
                const len = snippet.scopes.length;
                if (len === 0) {
                    // always accept
                    bucket.push(snippet);
                }
                else {
                    for (let i = 0; i < len; i++) {
                        // match
                        if (snippet.scopes[i] === selector) {
                            bucket.push(snippet);
                            break; // match only once!
                        }
                    }
                }
            }
            const idx = selector.lastIndexOf('.');
            if (idx >= 0) {
                this._scopeSelect(selector.substring(0, idx), bucket);
            }
        }
        async _load() {
            if (this._extension) {
                return this._extensionResourceLoaderService.readExtensionResource(this.location);
            }
            else {
                const content = await this._fileService.readFile(this.location);
                return content.value.toString();
            }
        }
        load() {
            if (!this._loadPromise) {
                this._loadPromise = Promise.resolve(this._load()).then(content => {
                    const data = (0, json_1.parse)(content);
                    if ((0, json_1.getNodeType)(data) === 'object') {
                        for (const [name, scopeOrTemplate] of Object.entries(data)) {
                            if (isJsonSerializedSnippet(scopeOrTemplate)) {
                                this._parseSnippet(name, scopeOrTemplate, this.data);
                            }
                            else {
                                for (const [name, template] of Object.entries(scopeOrTemplate)) {
                                    this._parseSnippet(name, template, this.data);
                                }
                            }
                        }
                    }
                    return this;
                });
            }
            return this._loadPromise;
        }
        reset() {
            this._loadPromise = undefined;
            this.data.length = 0;
        }
        _parseSnippet(name, snippet, bucket) {
            let { isFileTemplate, prefix, body, description } = snippet;
            if (!prefix) {
                prefix = '';
            }
            if (Array.isArray(body)) {
                body = body.join('\n');
            }
            if (typeof body !== 'string') {
                return;
            }
            if (Array.isArray(description)) {
                description = description.join('\n');
            }
            let scopes;
            if (this.defaultScopes) {
                scopes = this.defaultScopes;
            }
            else if (typeof snippet.scope === 'string') {
                scopes = snippet.scope.split(',').map(s => s.trim()).filter(Boolean);
            }
            else {
                scopes = [];
            }
            let source;
            if (this._extension) {
                // extension snippet -> show the name of the extension
                source = this._extension.displayName || this._extension.name;
            }
            else if (this.source === 2 /* SnippetSource.Workspace */) {
                // workspace -> only *.code-snippets files
                source = (0, nls_1.localize)('source.workspaceSnippetGlobal', "Workspace Snippet");
            }
            else {
                // user -> global (*.code-snippets) and language snippets
                if (this.isGlobalSnippets) {
                    source = (0, nls_1.localize)('source.userSnippetGlobal', "Global User Snippet");
                }
                else {
                    source = (0, nls_1.localize)('source.userSnippet', "User Snippet");
                }
            }
            for (const _prefix of iterator_1.Iterable.wrap(prefix)) {
                bucket.push(new Snippet(Boolean(isFileTemplate), scopes, name, _prefix, description, body, source, this.source, this._extension ? `${(0, resources_1.relativePath)(this._extension.extensionLocation, this.location)}/${name}` : `${(0, path_1.basename)(this.location.path)}/${name}`, this._extension?.identifier));
            }
        }
    }
    exports.SnippetFile = SnippetFile;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNGaWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zbmlwcGV0cy9icm93c2VyL3NuaXBwZXRzRmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQU0sbUJBQW1CO1FBYXhCLFlBQVksSUFBWTtZQUV2QixxQkFBcUI7WUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztZQUNuQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBRXhCLG1CQUFtQjtZQUNuQixNQUFNLGVBQWUsR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRS9ELE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQy9DLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN2QixLQUFLLE1BQU0sV0FBVyxJQUFJLGVBQWUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEQsY0FBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQseUVBQXlFO1lBQ3pFLDhEQUE4RDtZQUM5RCxJQUFJLGVBQWUsQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUN2QixDQUFDO2lCQUFNLElBQUksY0FBYyxLQUFLLENB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