/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/path"], function (require, exports, errors, platform, strings_1, uri_1, paths) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.COI = exports.FileAccess = exports.VSCODE_AUTHORITY = exports.nodeModulesAsarUnpackedPath = exports.nodeModulesAsarPath = exports.nodeModulesPath = exports.builtinExtensionsPath = exports.RemoteAuthorities = exports.connectionTokenQueryName = exports.connectionTokenCookieName = exports.Schemas = void 0;
    exports.matchesScheme = matchesScheme;
    exports.matchesSomeScheme = matchesSomeScheme;
    exports.getServerRootPath = getServerRootPath;
    var Schemas;
    (function (Schemas) {
        /**
         * A schema that is used for models that exist in memory
         * only and that have no correspondence on a server or such.
         */
        Schemas.inMemory = 'inmemory';
        /**
         * A schema that is used for setting files
         */
        Schemas.vscode = 'vscode';
        /**
         * A schema that is used for internal private files
         */
        Schemas.internal = 'private';
        /**
         * A walk-through document.
         */
        Schemas.walkThrough = 'walkThrough';
        /**
         * An embedded code snippet.
         */
        Schemas.walkThroughSnippet = 'walkThroughSnippet';
        Schemas.http = 'http';
        Schemas.https = 'https';
        Schemas.file = 'file';
        Schemas.mailto = 'mailto';
        Schemas.untitled = 'untitled';
        Schemas.data = 'data';
        Schemas.command = 'command';
        Schemas.vscodeRemote = 'vscode-remote';
        Schemas.vscodeRemoteResource = 'vscode-remote-resource';
        Schemas.vscodeManagedRemoteResource = 'vscode-managed-remote-resource';
        Schemas.vscodeUserData = 'vscode-userdata';
        Schemas.vscodeCustomEditor = 'vscode-custom-editor';
        Schemas.vscodeNotebookCell = 'vscode-notebook-cell';
        Schemas.vscodeNotebookCellMetadata = 'vscode-notebook-cell-metadata';
        Schemas.vscodeNotebookCellOutput = 'vscode-notebook-cell-output';
        Schemas.vscodeInteractiveInput = 'vscode-interactive-input';
        Schemas.vscodeSettings = 'vscode-settings';
        Schemas.vscodeWorkspaceTrust = 'vscode-workspace-trust';
        Schemas.vscodeTerminal = 'vscode-terminal';
        /** Scheme used for code blocks in chat. */
        Schemas.vscodeChatCodeBlock = 'vscode-chat-code-block';
        /** Scheme used for the chat input editor. */
        Schemas.vscodeChatSesssion = 'vscode-chat-editor';
        /**
         * Scheme used internally for webviews that aren't linked to a resource (i.e. not custom editors)
         */
        Schemas.webviewPanel = 'webview-panel';
        /**
         * Scheme used for loading the wrapper html and script in webviews.
         */
        Schemas.vscodeWebview = 'vscode-webview';
        /**
         * Scheme used for extension pages
         */
        Schemas.extension = 'extension';
        /**
         * Scheme used as a replacement of `file` scheme to load
         * files with our custom protocol handler (desktop only).
         */
        Schemas.vscodeFileResource = 'vscode-file';
        /**
         * Scheme used for temporary resources
         */
        Schemas.tmp = 'tmp';
        /**
         * Scheme used vs live share
         */
        Schemas.vsls = 'vsls';
        /**
         * Scheme used for the Source Control commit input's text document
         */
        Schemas.vscodeSourceControl = 'vscode-scm';
        /**
         * Scheme used for special rendering of settings in the release notes
         */
        Schemas.codeSetting = 'code-setting';
    })(Schemas || (exports.Schemas = Schemas = {}));
    function matchesScheme(target, scheme) {
        if (uri_1.URI.isUri(target)) {
            return (0, strings_1.equalsIgnoreCase)(target.scheme, scheme);
        }
        else {
            return (0, strings_1.startsWithIgnoreCase)(target, scheme + ':');
        }
    }
    function matchesSomeScheme(target, ...schemes) {
        return schemes.some(scheme => matchesScheme(target, scheme));
    }
    exports.connectionTokenCookieName = 'vscode-tkn';
    exports.connectionTokenQueryName = 'tkn';
    class RemoteAuthoritiesImpl {
        constructor() {
            this._hosts = Object.create(null);
            this._ports = Object.create(null);
            this._connectionTokens = Object.create(null);
            this._preferredWebSchema = 'http';
            this._delegate = null;
            this._serverRootPath = '/';
        }
        setPreferredWebSchema(schema) {
            this._preferredWebSchema = schema;
        }
        setDelegate(delegate) {
            this._delegate = delegate;
        }
        setServerRootPath(product, serverBasePath) {
            this._serverRootPath = getServerRootPath(product, serverBasePath);
        }
        getServerRootPath() {
            return this._serverRootPath;
        }
        get _remoteResourcesPath() {
            return paths.posix.join(this._serverRootPath, Schemas.vscodeRemoteResource);
        }
        set(authority, host, port) {
            this._hosts[authority] = host;
            this._ports[authority] = port;
        }
        setConnectionToken(authority, connectionToken) {
            this._connectionTokens[authority] = connectionToken;
        }
        getPreferredWebSchema() {
            return this._preferredWebSchema;
        }
        rewrite(uri) {
            if (this._delegate) {
                try {
                    return this._delegate(uri);
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                    return uri;
                }
            }
            const authority = uri.authority;
            let host = this._hosts[authority];
            if (host && host.indexOf(':') !== -1 && host.indexOf('[') === -1) {
                host = `[${host}]`;
            }
            const port = this._ports[authority];
            const connectionToken = this._connectionTokens[authority];
            let query = `path=${encodeURIComponent(uri.path)}`;
            if (typeof connectionToken === 'string') {
                query += `&${exports.connectionTokenQueryName}=${encodeURIComponent(connectionToken)}`;
            }
            return uri_1.URI.from({
                scheme: platform.isWeb ? this._preferredWebSchema : Schemas.vscodeRemoteResource,
                authority: `${host}:${port}`,
                path: this._remoteResourcesPath,
                query
            });
        }
    }
    exports.RemoteAuthorities = new RemoteAuthoritiesImpl();
    function getServerRootPath(product, basePath) {
        return paths.posix.join(basePath ?? '/', `${product.quality ?? 'oss'}-${product.commit ?? 'dev'}`);
    }
    exports.builtinExtensionsPath = 'vs/../../extensions';
    exports.nodeModulesPath = 'vs/../../node_modules';
    exports.nodeModulesAsarPath = 'vs/../../node_modules.asar';
    exports.nodeModulesAsarUnpackedPath = 'vs/../../node_modules.asar.unpacked';
    exports.VSCODE_AUTHORITY = 'vscode-app';
    class FileAccessImpl {
        static { this.FALLBACK_AUTHORITY = exports.VSCODE_AUTHORITY; }
        /**
         * Returns a URI to use in contexts where the browser is responsible
         * for loading (e.g. fetch()) or when used within the DOM.
         *
         * **Note:** use `dom.ts#asCSSUrl` whenever the URL is to be used in CSS context.
         */
        asBrowserUri(resourcePath) {
            const uri = this.toUri(resourcePath, require);
            return this.uriToBrowserUri(uri);
        }
        /**
         * Returns a URI to use in contexts where the browser is responsible
         * for loading (e.g. fetch()) or when used within the DOM.
         *
         * **Note:** use `dom.ts#asCSSUrl` whenever the URL is to be used in CSS context.
         */
        uriToBrowserUri(uri) {
            // Handle remote URIs via `RemoteAuthorities`
            if (uri.scheme === Schemas.vscodeRemote) {
                return exports.RemoteAuthorities.rewrite(uri);
            }
            // Convert to `vscode-file` resource..
            if (
            // ...only ever for `file` resources
            uri.scheme === Schemas.file &&
                (
                // ...and we run in native environments
                platform.isNative ||
                    // ...or web worker extensions on desktop
                    (platform.webWorkerOrigin === `${Schemas.vscodeFileResource}://${FileAccessImpl.FALLBACK_AUTHORITY}`))) {
                return uri.with({
                    scheme: Schemas.vscodeFileResource,
                    // We need to provide an authority here so that it can serve
                    // as origin for network and loading matters in chromium.
                    // If the URI is not coming with an authority already, we
                    // add our own
                    authority: uri.authority || FileAccessImpl.FALLBACK_AUTHORITY,
                    query: null,
                    fragment: null
                });
            }
            return uri;
        }
        /**
         * Returns the `file` URI to use in contexts where node.js
         * is responsible for loading.
         */
        asFileUri(resourcePath) {
            const uri = this.toUri(resourcePath, require);
            return this.uriToFileUri(uri);
        }
        /**
         * Returns the `file` URI to use in contexts where node.js
         * is responsible for loading.
         */
        uriToFileUri(uri) {
            // Only convert the URI if it is `vscode-file:` scheme
            if (uri.scheme === Schemas.vscodeFileResource) {
                return uri.with({
                    scheme: Schemas.file,
                    // Only preserve the `authority` if it is different from
                    // our fallback authority. This ensures we properly preserve
                    // Windows UNC paths that come with their own authority.
                    authority: uri.authority !== FileAccessImpl.FALLBACK_AUTHORITY ? uri.authority : null,
                    query: null,
                    fragment: null
                });
            }
            return uri;
        }
        toUri(uriOrModule, moduleIdToUrl) {
            if (uri_1.URI.isUri(uriOrModule)) {
                return uriOrModule;
            }
            return uri_1.URI.parse(moduleIdToUrl.toUrl(uriOrModule));
        }
    }
    exports.FileAccess = new FileAccessImpl();
    var COI;
    (function (COI) {
        const coiHeaders = new Map([
            ['1', { 'Cross-Origin-Opener-Policy': 'same-origin' }],
            ['2', { 'Cross-Origin-Embedder-Policy': 'require-corp' }],
            ['3', { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' }],
        ]);
        COI.CoopAndCoep = Object.freeze(coiHeaders.get('3'));
        const coiSearchParamName = 'vscode-coi';
        /**
         * Extract desired headers from `vscode-coi` invocation
         */
        function getHeadersFromQuery(url) {
            let params;
            if (typeof url === 'string') {
                params = new URL(url).searchParams;
            }
            else if (url instanceof URL) {
                params = url.searchParams;
            }
            else if (uri_1.URI.isUri(url)) {
                params = new URL(url.toString(true)).searchParams;
            }
            const value = params?.get(coiSearchParamName);
            if (!value) {
                return undefined;
            }
            return coiHeaders.get(value);
        }
        COI.getHeadersFromQuery = getHeadersFromQuery;
        /**
         * Add the `vscode-coi` query attribute based on wanting `COOP` and `COEP`. Will be a noop when `crossOriginIsolated`
         * isn't enabled the current context
         */
        function addSearchParam(urlOrSearch, coop, coep) {
            if (!globalThis.crossOriginIsolated) {
                // depends on the current context being COI
                return;
            }
            const value = coop && coep ? '3' : coep ? '2' : '1';
            if (urlOrSearch instanceof URLSearchParams) {
                urlOrSearch.set(coiSearchParamName, value);
            }
            else {
                urlOrSearch[coiSearchParamName] = value;
            }
        }
        COI.addSearchParam = addSearchParam;
    })(COI || (exports.COI = COI = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29yay5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbmV0d29yay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzSGhHLHNDQU1DO0lBRUQsOENBRUM7SUE2RUQsOENBRUM7SUF2TUQsSUFBaUIsT0FBTyxDQTRHdkI7SUE1R0QsV0FBaUIsT0FBTztRQUV2Qjs7O1dBR0c7UUFDVSxnQkFBUSxHQUFHLFVBQVUsQ0FBQztRQUVuQzs7V0FFRztRQUNVLGNBQU0sR0FBRyxRQUFRLENBQUM7UUFFL0I7O1dBRUc7UUFDVSxnQkFBUSxHQUFHLFNBQVMsQ0FBQztRQUVsQzs7V0FFRztRQUNVLG1CQUFXLEdBQUcsYUFBYSxDQUFDO1FBRXpDOztXQUVHO1FBQ1UsMEJBQWtCLEdBQUcsb0JBQW9CLENBQUM7UUFFMUMsWUFBSSxHQUFHLE1BQU0sQ0FBQztRQUVkLGFBQUssR0FBRyxPQUFPLENBQUM7UUFFaEIsWUFBSSxHQUFHLE1BQU0sQ0FBQztRQUVkLGNBQU0sR0FBRyxRQUFRLENBQUM7UUFFbEIsZ0JBQVEsR0FBRyxVQUFVLENBQUM7UUFFdEIsWUFBSSxHQUFHLE1BQU0sQ0FBQztRQUVkLGVBQU8sR0FBRyxTQUFTLENBQUM7UUFFcEIsb0JBQVksR0FBRyxlQUFlLENBQUM7UUFFL0IsNEJBQW9CLEdBQUcsd0JBQXdCLENBQUM7UUFFaEQsbUNBQTJCLEdBQUcsZ0NBQWdDLENBQUM7UUFFL0Qsc0JBQWMsR0FBRyxpQkFBaUIsQ0FBQztRQUVuQywwQkFBa0IsR0FBRyxzQkFBc0IsQ0FBQztRQUU1QywwQkFBa0IsR0FBRyxzQkFBc0IsQ0FBQztRQUM1QyxrQ0FBMEIsR0FBRywrQkFBK0IsQ0FBQztRQUM3RCxnQ0FBd0IsR0FBRyw2QkFBNkIsQ0FBQztRQUN6RCw4QkFBc0IsR0FBRywwQkFBMEIsQ0FBQztRQUVwRCxzQkFBYyxHQUFHLGlCQUFpQixDQUFDO1FBRW5DLDRCQUFvQixHQUFHLHdCQUF3QixDQUFDO1FBRWhELHNCQUFjLEdBQUcsaUJBQWlCLENBQUM7UUFFaEQsMkNBQTJDO1FBQzlCLDJCQUFtQixHQUFHLHdCQUF3QixDQUFDO1FBQzVELDZDQUE2QztRQUNoQywwQkFBa0IsR0FBRyxvQkFBb0IsQ0FBQztRQUV2RDs7V0FFRztRQUNVLG9CQUFZLEdBQUcsZUFBZSxDQUFDO1FBRTVDOztXQUVHO1FBQ1UscUJBQWEsR0FBRyxnQkFBZ0IsQ0FBQztRQUU5Qzs7V0FFRztRQUNVLGlCQUFTLEdBQUcsV0FBVyxDQUFDO1FBRXJDOzs7V0FHRztRQUNVLDBCQUFrQixHQUFHLGFBQWEsQ0FBQztRQUVoRDs7V0FFRztRQUNVLFdBQUcsR0FBRyxLQUFLLENBQUM7UUFFekI7O1dBRUc7UUFDVSxZQUFJLEdBQUcsTUFBTSxDQUFDO1FBRTNCOztXQUVHO1FBQ1UsMkJBQW1CLEdBQUcsWUFBWSxDQUFDO1FBRWhEOztXQUVHO1FBQ1UsbUJBQVcsR0FBRyxjQUFjLENBQUM7SUFDM0MsQ0FBQyxFQTVHZ0IsT0FBTyx1QkFBUCxPQUFPLFFBNEd2QjtJQUVELFNBQWdCLGFBQWEsQ0FBQyxNQUFvQixFQUFFLE1BQWM7UUFDakUsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDdkIsT0FBTyxJQUFBLDBCQUFnQixFQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDaEQsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLElBQUEsOEJBQW9CLEVBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGlCQUFpQixDQUFDLE1BQW9CLEVBQUUsR0FBRyxPQUFpQjtRQUMzRSxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVZLFFBQUEseUJBQXlCLEdBQUcsWUFBWSxDQUFDO0lBQ3pDLFFBQUEsd0JBQXdCLEdBQUcsS0FBSyxDQUFDO0lBRTlDLE1BQU0scUJBQXFCO1FBQTNCO1lBQ2tCLFdBQU0sR0FBZ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxRSxXQUFNLEdBQWdELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUUsc0JBQWlCLEdBQWdELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUYsd0JBQW1CLEdBQXFCLE1BQU0sQ0FBQztZQUMvQyxjQUFTLEdBQStCLElBQUksQ0FBQztZQUM3QyxvQkFBZSxHQUFXLEdBQUcsQ0FBQztRQThEdkMsQ0FBQztRQTVEQSxxQkFBcUIsQ0FBQyxNQUF3QjtZQUM3QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxDQUFDO1FBQ25DLENBQUM7UUFFRCxXQUFXLENBQUMsUUFBMkI7WUFDdEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDM0IsQ0FBQztRQUVELGlCQUFpQixDQUFDLE9BQThDLEVBQUUsY0FBa0M7WUFDbkcsSUFBSSxDQUFDLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELGlCQUFpQjtZQUNoQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQVksb0JBQW9CO1lBQy9CLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsR0FBRyxDQUFDLFNBQWlCLEVBQUUsSUFBWSxFQUFFLElBQVk7WUFDaEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDL0IsQ0FBQztRQUVELGtCQUFrQixDQUFDLFNBQWlCLEVBQUUsZUFBdUI7WUFDNUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxHQUFHLGVBQWUsQ0FBQztRQUNyRCxDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2pDLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBUTtZQUNmLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUM7b0JBQ0osT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO2dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ2QsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM5QixPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDO1lBQ0YsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7WUFDaEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLENBQUM7WUFDcEIsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzFELElBQUksS0FBSyxHQUFHLFFBQVEsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbkQsSUFBSSxPQUFPLGVBQWUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsS0FBSyxJQUFJLElBQUksZ0NBQXdCLElBQUksa0JBQWtCLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztZQUNoRixDQUFDO1lBQ0QsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNmLE1BQU0sRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0I7Z0JBQ2hGLFNBQVMsRUFBRSxHQUFHLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBQzVCLElBQUksRUFBRSxJQUFJLENBQUMsb0JBQW9CO2dCQUMvQixLQUFLO2FBQ0wsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBRVksUUFBQSxpQkFBaUIsR0FBRyxJQUFJLHFCQUFxQixFQUFFLENBQUM7SUFFN0QsU0FBZ0IsaUJBQWlCLENBQUMsT0FBOEMsRUFBRSxRQUE0QjtRQUM3RyxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxHQUFHLEVBQUUsR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLEtBQUssSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDcEcsQ0FBQztJQWFZLFFBQUEscUJBQXFCLEdBQW9CLHFCQUFxQixDQUFDO0lBQy9ELFFBQUEsZUFBZSxHQUFvQix1QkFBdUIsQ0FBQztJQUMzRCxRQUFBLG1CQUFtQixHQUFvQiw0QkFBNEIsQ0FBQztJQUNwRSxRQUFBLDJCQUEyQixHQUFvQixxQ0FBcUMsQ0FBQztJQUVyRixRQUFBLGdCQUFnQixHQUFHLFlBQVksQ0FBQztJQUU3QyxNQUFNLGNBQWM7aUJBRUssdUJBQWtCLEdBQUcsd0JBQWdCLENBQUM7UUFFOUQ7Ozs7O1dBS0c7UUFDSCxZQUFZLENBQUMsWUFBa0M7WUFDOUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDOUMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNILGVBQWUsQ0FBQyxHQUFRO1lBQ3ZCLDZDQUE2QztZQUM3QyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN6QyxPQUFPLHlCQUFpQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsc0NBQXNDO1lBQ3RDO1lBQ0Msb0NBQW9DO1lBQ3BDLEdBQUcsQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLElBQUk7Z0JBQzNCO2dCQUNDLHVDQUF1QztnQkFDdkMsUUFBUSxDQUFDLFFBQVE7b0JBQ2pCLHlDQUF5QztvQkFDekMsQ0FBQyxRQUFRLENBQUMsZUFBZSxLQUFLLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixNQUFNLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQ3JHLEVBQ0EsQ0FBQztnQkFDRixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQ2YsTUFBTSxFQUFFLE9BQU8sQ0FBQyxrQkFBa0I7b0JBQ2xDLDREQUE0RDtvQkFDNUQseURBQXlEO29CQUN6RCx5REFBeUQ7b0JBQ3pELGNBQWM7b0JBQ2QsU0FBUyxFQUFFLEdBQUcsQ0FBQyxTQUFTLElBQUksY0FBYyxDQUFDLGtCQUFrQjtvQkFDN0QsS0FBSyxFQUFFLElBQUk7b0JBQ1gsUUFBUSxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVEOzs7V0FHRztRQUNILFNBQVMsQ0FBQyxZQUFrQztZQUMzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5QyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVEOzs7V0FHRztRQUNILFlBQVksQ0FBQyxHQUFRO1lBQ3BCLHNEQUFzRDtZQUN0RCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQy9DLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztvQkFDZixNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUk7b0JBQ3BCLHdEQUF3RDtvQkFDeEQsNERBQTREO29CQUM1RCx3REFBd0Q7b0JBQ3hELFNBQVMsRUFBRSxHQUFHLENBQUMsU0FBUyxLQUFLLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSTtvQkFDckYsS0FBSyxFQUFFLElBQUk7b0JBQ1gsUUFBUSxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVPLEtBQUssQ0FBQyxXQUF5QixFQUFFLGFBQWtEO1lBQzFGLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLFdBQVcsQ0FBQztZQUNwQixDQUFDO1lBRUQsT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNwRCxDQUFDOztJQUdXLFFBQUEsVUFBVSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7SUFHL0MsSUFBaUIsR0FBRyxDQStDbkI7SUEvQ0QsV0FBaUIsR0FBRztRQUVuQixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBbUQ7WUFDNUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSw0QkFBNEIsRUFBRSxhQUFhLEVBQUUsQ0FBQztZQUN0RCxDQUFDLEdBQUcsRUFBRSxFQUFFLDhCQUE4QixFQUFFLGNBQWMsRUFBRSxDQUFDO1lBQ3pELENBQUMsR0FBRyxFQUFFLEVBQUUsNEJBQTRCLEVBQUUsYUFBYSxFQUFFLDhCQUE4QixFQUFFLGNBQWMsRUFBRSxDQUFDO1NBQ3RHLENBQUMsQ0FBQztRQUVVLGVBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUU5RCxNQUFNLGtCQUFrQixHQUFHLFlBQVksQ0FBQztRQUV4Qzs7V0FFRztRQUNILFNBQWdCLG1CQUFtQixDQUFDLEdBQXVCO1lBQzFELElBQUksTUFBbUMsQ0FBQztZQUN4QyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM3QixNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQ3BDLENBQUM7aUJBQU0sSUFBSSxHQUFHLFlBQVksR0FBRyxFQUFFLENBQUM7Z0JBQy9CLE1BQU0sR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDO1lBQzNCLENBQUM7aUJBQU0sSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO1lBQ25ELENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLEVBQUUsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQWRlLHVCQUFtQixzQkFjbEMsQ0FBQTtRQUVEOzs7V0FHRztRQUNILFNBQWdCLGNBQWMsQ0FBQyxXQUFxRCxFQUFFLElBQWEsRUFBRSxJQUFhO1lBQ2pILElBQUksQ0FBTyxVQUFXLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDNUMsMkNBQTJDO2dCQUMzQyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUNwRCxJQUFJLFdBQVcsWUFBWSxlQUFlLEVBQUUsQ0FBQztnQkFDNUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ2tCLFdBQVksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUNuRSxDQUFDO1FBQ0YsQ0FBQztRQVhlLGtCQUFjLGlCQVc3QixDQUFBO0lBQ0YsQ0FBQyxFQS9DZ0IsR0FBRyxtQkFBSCxHQUFHLFFBK0NuQiJ9