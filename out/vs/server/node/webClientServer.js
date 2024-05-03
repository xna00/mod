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
define(["require", "exports", "fs", "vs/base/node/pfs", "path", "url", "cookie", "crypto", "vs/base/common/extpath", "vs/base/common/mime", "vs/base/common/platform", "vs/platform/log/common/log", "vs/server/node/serverEnvironmentService", "vs/base/common/path", "vs/base/common/network", "vs/base/common/uuid", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/common/buffer", "vs/base/common/types"], function (require, exports, fs_1, pfs_1, path, url, cookie, crypto, extpath_1, mime_1, platform_1, log_1, serverEnvironmentService_1, path_1, network_1, uuid_1, productService_1, request_1, cancellation_1, uri_1, buffer_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebClientServer = exports.CacheControl = void 0;
    exports.serveError = serveError;
    exports.serveFile = serveFile;
    const textMimeType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
    };
    /**
     * Return an error to the client.
     */
    async function serveError(req, res, errorCode, errorMessage) {
        res.writeHead(errorCode, { 'Content-Type': 'text/plain' });
        res.end(errorMessage);
    }
    var CacheControl;
    (function (CacheControl) {
        CacheControl[CacheControl["NO_CACHING"] = 0] = "NO_CACHING";
        CacheControl[CacheControl["ETAG"] = 1] = "ETAG";
        CacheControl[CacheControl["NO_EXPIRY"] = 2] = "NO_EXPIRY";
    })(CacheControl || (exports.CacheControl = CacheControl = {}));
    /**
     * Serve a file at a given path or 404 if the file is missing.
     */
    async function serveFile(filePath, cacheControl, logService, req, res, responseHeaders) {
        try {
            const stat = await pfs_1.Promises.stat(filePath); // throws an error if file doesn't exist
            if (cacheControl === 1 /* CacheControl.ETAG */) {
                // Check if file modified since
                const etag = `W/"${[stat.ino, stat.size, stat.mtime.getTime()].join('-')}"`; // weak validator (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
                if (req.headers['if-none-match'] === etag) {
                    res.writeHead(304);
                    return void res.end();
                }
                responseHeaders['Etag'] = etag;
            }
            else if (cacheControl === 2 /* CacheControl.NO_EXPIRY */) {
                responseHeaders['Cache-Control'] = 'public, max-age=31536000';
            }
            else if (cacheControl === 0 /* CacheControl.NO_CACHING */) {
                responseHeaders['Cache-Control'] = 'no-store';
            }
            responseHeaders['Content-Type'] = textMimeType[(0, path_1.extname)(filePath)] || (0, mime_1.getMediaMime)(filePath) || 'text/plain';
            res.writeHead(200, responseHeaders);
            // Data
            (0, fs_1.createReadStream)(filePath).pipe(res);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                logService.error(error);
                console.error(error.toString());
            }
            else {
                console.error(`File not found: ${filePath}`);
            }
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return void res.end('Not found');
        }
    }
    const APP_ROOT = (0, path_1.dirname)(network_1.FileAccess.asFileUri('').fsPath);
    let WebClientServer = class WebClientServer {
        constructor(_connectionToken, _basePath, serverRootPath, _environmentService, _logService, _requestService, _productService) {
            this._connectionToken = _connectionToken;
            this._basePath = _basePath;
            this.serverRootPath = serverRootPath;
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._requestService = _requestService;
            this._productService = _productService;
            this._webExtensionResourceUrlTemplate = this._productService.extensionsGallery?.resourceUrlTemplate ? uri_1.URI.parse(this._productService.extensionsGallery.resourceUrlTemplate) : undefined;
            this._staticRoute = `${serverRootPath}/static`;
            this._callbackRoute = `${serverRootPath}/callback`;
            this._webExtensionRoute = `${serverRootPath}/web-extension-resource`;
        }
        /**
         * Handle web resources (i.e. only needed by the web client).
         * **NOTE**: This method is only invoked when the server has web bits.
         * **NOTE**: This method is only invoked after the connection token has been validated.
         */
        async handle(req, res, parsedUrl) {
            try {
                const pathname = parsedUrl.pathname;
                if (pathname.startsWith(this._staticRoute) && pathname.charCodeAt(this._staticRoute.length) === 47 /* CharCode.Slash */) {
                    return this._handleStatic(req, res, parsedUrl);
                }
                if (pathname === this._basePath) {
                    return this._handleRoot(req, res, parsedUrl);
                }
                if (pathname === this._callbackRoute) {
                    // callback support
                    return this._handleCallback(res);
                }
                if (pathname.startsWith(this._webExtensionRoute) && pathname.charCodeAt(this._webExtensionRoute.length) === 47 /* CharCode.Slash */) {
                    // extension resource support
                    return this._handleWebExtensionResource(req, res, parsedUrl);
                }
                return serveError(req, res, 404, 'Not found.');
            }
            catch (error) {
                this._logService.error(error);
                console.error(error.toString());
                return serveError(req, res, 500, 'Internal Server Error.');
            }
        }
        /**
         * Handle HTTP requests for /static/*
         */
        async _handleStatic(req, res, parsedUrl) {
            const headers = Object.create(null);
            // Strip the this._staticRoute from the path
            const normalizedPathname = decodeURIComponent(parsedUrl.pathname); // support paths that are uri-encoded (e.g. spaces => %20)
            const relativeFilePath = normalizedPathname.substring(this._staticRoute.length + 1);
            const filePath = (0, path_1.join)(APP_ROOT, relativeFilePath); // join also normalizes the path
            if (!(0, extpath_1.isEqualOrParent)(filePath, APP_ROOT, !platform_1.isLinux)) {
                return serveError(req, res, 400, `Bad request.`);
            }
            return serveFile(filePath, this._environmentService.isBuilt ? 2 /* CacheControl.NO_EXPIRY */ : 1 /* CacheControl.ETAG */, this._logService, req, res, headers);
        }
        _getResourceURLTemplateAuthority(uri) {
            const index = uri.authority.indexOf('.');
            return index !== -1 ? uri.authority.substring(index + 1) : undefined;
        }
        /**
         * Handle extension resources
         */
        async _handleWebExtensionResource(req, res, parsedUrl) {
            if (!this._webExtensionResourceUrlTemplate) {
                return serveError(req, res, 500, 'No extension gallery service configured.');
            }
            // Strip `/web-extension-resource/` from the path
            const normalizedPathname = decodeURIComponent(parsedUrl.pathname); // support paths that are uri-encoded (e.g. spaces => %20)
            const path = (0, path_1.normalize)(normalizedPathname.substring(this._webExtensionRoute.length + 1));
            const uri = uri_1.URI.parse(path).with({
                scheme: this._webExtensionResourceUrlTemplate.scheme,
                authority: path.substring(0, path.indexOf('/')),
                path: path.substring(path.indexOf('/') + 1)
            });
            if (this._getResourceURLTemplateAuthority(this._webExtensionResourceUrlTemplate) !== this._getResourceURLTemplateAuthority(uri)) {
                return serveError(req, res, 403, 'Request Forbidden');
            }
            const headers = {};
            const setRequestHeader = (header) => {
                const value = req.headers[header];
                if (value && ((0, types_1.isString)(value) || value[0])) {
                    headers[header] = (0, types_1.isString)(value) ? value : value[0];
                }
                else if (header !== header.toLowerCase()) {
                    setRequestHeader(header.toLowerCase());
                }
            };
            setRequestHeader('X-Client-Name');
            setRequestHeader('X-Client-Version');
            setRequestHeader('X-Machine-Id');
            setRequestHeader('X-Client-Commit');
            const context = await this._requestService.request({
                type: 'GET',
                url: uri.toString(true),
                headers
            }, cancellation_1.CancellationToken.None);
            const status = context.res.statusCode || 500;
            if (status !== 200) {
                let text = null;
                try {
                    text = await (0, request_1.asTextOrError)(context);
                }
                catch (error) { /* Ignore */ }
                return serveError(req, res, status, text || `Request failed with status ${status}`);
            }
            const responseHeaders = Object.create(null);
            const setResponseHeader = (header) => {
                const value = context.res.headers[header];
                if (value) {
                    responseHeaders[header] = value;
                }
                else if (header !== header.toLowerCase()) {
                    setResponseHeader(header.toLowerCase());
                }
            };
            setResponseHeader('Cache-Control');
            setResponseHeader('Content-Type');
            res.writeHead(200, responseHeaders);
            const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
            return void res.end(buffer.buffer);
        }
        /**
         * Handle HTTP requests for /
         */
        async _handleRoot(req, res, parsedUrl) {
            const queryConnectionToken = parsedUrl.query[network_1.connectionTokenQueryName];
            if (typeof queryConnectionToken === 'string') {
                // We got a connection token as a query parameter.
                // We want to have a clean URL, so we strip it
                const responseHeaders = Object.create(null);
                responseHeaders['Set-Cookie'] = cookie.serialize(network_1.connectionTokenCookieName, queryConnectionToken, {
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 /* 1 week */
                });
                const newQuery = Object.create(null);
                for (const key in parsedUrl.query) {
                    if (key !== network_1.connectionTokenQueryName) {
                        newQuery[key] = parsedUrl.query[key];
                    }
                }
                const newLocation = url.format({ pathname: parsedUrl.pathname, query: newQuery });
                responseHeaders['Location'] = newLocation;
                res.writeHead(302, responseHeaders);
                return void res.end();
            }
            const getFirstHeader = (headerName) => {
                const val = req.headers[headerName];
                return Array.isArray(val) ? val[0] : val;
            };
            const useTestResolver = (!this._environmentService.isBuilt && this._environmentService.args['use-test-resolver']);
            const remoteAuthority = (useTestResolver
                ? 'test+test'
                : (getFirstHeader('x-original-host') || getFirstHeader('x-forwarded-host') || req.headers.host));
            if (!remoteAuthority) {
                return serveError(req, res, 400, `Bad request.`);
            }
            function asJSON(value) {
                return JSON.stringify(value).replace(/"/g, '&quot;');
            }
            let _wrapWebWorkerExtHostInIframe = undefined;
            if (this._environmentService.args['enable-smoke-test-driver']) {
                // integration tests run at a time when the built output is not yet published to the CDN
                // so we must disable the iframe wrapping because the iframe URL will give a 404
                _wrapWebWorkerExtHostInIframe = false;
            }
            const resolveWorkspaceURI = (defaultLocation) => defaultLocation && uri_1.URI.file(path.resolve(defaultLocation)).with({ scheme: network_1.Schemas.vscodeRemote, authority: remoteAuthority });
            const filePath = network_1.FileAccess.asFileUri(this._environmentService.isBuilt ? 'vs/code/browser/workbench/workbench.html' : 'vs/code/browser/workbench/workbench-dev.html').fsPath;
            const authSessionInfo = !this._environmentService.isBuilt && this._environmentService.args['github-auth'] ? {
                id: (0, uuid_1.generateUuid)(),
                providerId: 'github',
                accessToken: this._environmentService.args['github-auth'],
                scopes: [['user:email'], ['repo']]
            } : undefined;
            const productConfiguration = {
                embedderIdentifier: 'server-distro',
                extensionsGallery: this._webExtensionResourceUrlTemplate ? {
                    ...this._productService.extensionsGallery,
                    'resourceUrlTemplate': this._webExtensionResourceUrlTemplate.with({
                        scheme: 'http',
                        authority: remoteAuthority,
                        path: `${this._webExtensionRoute}/${this._webExtensionResourceUrlTemplate.authority}${this._webExtensionResourceUrlTemplate.path}`
                    }).toString(true)
                } : undefined
            };
            if (!this._environmentService.isBuilt) {
                try {
                    const productOverrides = JSON.parse((await pfs_1.Promises.readFile((0, path_1.join)(APP_ROOT, 'product.overrides.json'))).toString());
                    Object.assign(productConfiguration, productOverrides);
                }
                catch (err) { /* Ignore Error */ }
            }
            const workbenchWebConfiguration = {
                remoteAuthority,
                serverBasePath: this._basePath,
                _wrapWebWorkerExtHostInIframe,
                developmentOptions: { enableSmokeTestDriver: this._environmentService.args['enable-smoke-test-driver'] ? true : undefined, logLevel: this._logService.getLevel() },
                settingsSyncOptions: !this._environmentService.isBuilt && this._environmentService.args['enable-sync'] ? { enabled: true } : undefined,
                enableWorkspaceTrust: !this._environmentService.args['disable-workspace-trust'],
                folderUri: resolveWorkspaceURI(this._environmentService.args['default-folder']),
                workspaceUri: resolveWorkspaceURI(this._environmentService.args['default-workspace']),
                productConfiguration,
                callbackRoute: this._callbackRoute
            };
            const nlsBaseUrl = this._productService.extensionsGallery?.nlsBaseUrl;
            const values = {
                WORKBENCH_WEB_CONFIGURATION: asJSON(workbenchWebConfiguration),
                WORKBENCH_AUTH_SESSION: authSessionInfo ? asJSON(authSessionInfo) : '',
                WORKBENCH_WEB_BASE_URL: this._staticRoute,
                WORKBENCH_NLS_BASE_URL: nlsBaseUrl ? `${nlsBaseUrl}${!nlsBaseUrl.endsWith('/') ? '/' : ''}${this._productService.commit}/${this._productService.version}/` : '',
            };
            if (useTestResolver) {
                const bundledExtensions = [];
                for (const extensionPath of ['vscode-test-resolver', 'github-authentication']) {
                    const packageJSON = JSON.parse((await pfs_1.Promises.readFile(network_1.FileAccess.asFileUri(`${network_1.builtinExtensionsPath}/${extensionPath}/package.json`).fsPath)).toString());
                    bundledExtensions.push({ extensionPath, packageJSON });
                }
                values['WORKBENCH_BUILTIN_EXTENSIONS'] = asJSON(bundledExtensions);
            }
            let data;
            try {
                const workbenchTemplate = (await pfs_1.Promises.readFile(filePath)).toString();
                data = workbenchTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => values[key] ?? 'undefined');
            }
            catch (e) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return void res.end('Not found');
            }
            const webWorkerExtensionHostIframeScriptSHA = 'sha256-75NYUUvf+5++1WbfCZOV3PSWxBhONpaxwx+mkOFRv/Y=';
            const cspDirectives = [
                'default-src \'self\';',
                'img-src \'self\' https: data: blob:;',
                'media-src \'self\';',
                `script-src 'self' 'unsafe-eval' ${this._getScriptCspHashes(data).join(' ')} '${webWorkerExtensionHostIframeScriptSHA}' ${useTestResolver ? '' : `http://${remoteAuthority}`};`, // the sha is the same as in src/vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html
                'child-src \'self\';',
                `frame-src 'self' https://*.vscode-cdn.net data:;`,
                'worker-src \'self\' data: blob:;',
                'style-src \'self\' \'unsafe-inline\';',
                'connect-src \'self\' ws: wss: https:;',
                'font-src \'self\' blob:;',
                'manifest-src \'self\';'
            ].join(' ');
            const headers = {
                'Content-Type': 'text/html',
                'Content-Security-Policy': cspDirectives
            };
            if (this._connectionToken.type !== 0 /* ServerConnectionTokenType.None */) {
                // At this point we know the client has a valid cookie
                // and we want to set it prolong it to ensure that this
                // client is valid for another 1 week at least
                headers['Set-Cookie'] = cookie.serialize(network_1.connectionTokenCookieName, this._connectionToken.value, {
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 /* 1 week */
                });
            }
            res.writeHead(200, headers);
            return void res.end(data);
        }
        _getScriptCspHashes(content) {
            // Compute the CSP hashes for line scripts. Uses regex
            // which means it isn't 100% good.
            const regex = /<script>([\s\S]+?)<\/script>/img;
            const result = [];
            let match;
            while (match = regex.exec(content)) {
                const hasher = crypto.createHash('sha256');
                // This only works on Windows if we strip `\r` from `\r\n`.
                const script = match[1].replace(/\r\n/g, '\n');
                const hash = hasher
                    .update(Buffer.from(script))
                    .digest().toString('base64');
                result.push(`'sha256-${hash}'`);
            }
            return result;
        }
        /**
         * Handle HTTP requests for /callback
         */
        async _handleCallback(res) {
            const filePath = network_1.FileAccess.asFileUri('vs/code/browser/workbench/callback.html').fsPath;
            const data = (await pfs_1.Promises.readFile(filePath)).toString();
            const cspDirectives = [
                'default-src \'self\';',
                'img-src \'self\' https: data: blob:;',
                'media-src \'none\';',
                `script-src 'self' ${this._getScriptCspHashes(data).join(' ')};`,
                'style-src \'self\' \'unsafe-inline\';',
                'font-src \'self\' blob:;'
            ].join(' ');
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Content-Security-Policy': cspDirectives
            });
            return void res.end(data);
        }
    };
    exports.WebClientServer = WebClientServer;
    exports.WebClientServer = WebClientServer = __decorate([
        __param(3, serverEnvironmentService_1.IServerEnvironmentService),
        __param(4, log_1.ILogService),
        __param(5, request_1.IRequestService),
        __param(6, productService_1.IProductService)
    ], WebClientServer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViQ2xpZW50U2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS93ZWJDbGllbnRTZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0NoRyxnQ0FHQztJQVNELDhCQW9DQztJQTNERCxNQUFNLFlBQVksR0FBRztRQUNwQixPQUFPLEVBQUUsV0FBVztRQUNwQixLQUFLLEVBQUUsaUJBQWlCO1FBQ3hCLE9BQU8sRUFBRSxrQkFBa0I7UUFDM0IsTUFBTSxFQUFFLFVBQVU7UUFDbEIsTUFBTSxFQUFFLGVBQWU7S0FDa0IsQ0FBQztJQUUzQzs7T0FFRztJQUNJLEtBQUssVUFBVSxVQUFVLENBQUMsR0FBeUIsRUFBRSxHQUF3QixFQUFFLFNBQWlCLEVBQUUsWUFBb0I7UUFDNUgsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUMzRCxHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxJQUFrQixZQUVqQjtJQUZELFdBQWtCLFlBQVk7UUFDN0IsMkRBQVUsQ0FBQTtRQUFFLCtDQUFJLENBQUE7UUFBRSx5REFBUyxDQUFBO0lBQzVCLENBQUMsRUFGaUIsWUFBWSw0QkFBWixZQUFZLFFBRTdCO0lBRUQ7O09BRUc7SUFDSSxLQUFLLFVBQVUsU0FBUyxDQUFDLFFBQWdCLEVBQUUsWUFBMEIsRUFBRSxVQUF1QixFQUFFLEdBQXlCLEVBQUUsR0FBd0IsRUFBRSxlQUF1QztRQUNsTSxJQUFJLENBQUM7WUFDSixNQUFNLElBQUksR0FBRyxNQUFNLGNBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyx3Q0FBd0M7WUFDcEYsSUFBSSxZQUFZLDhC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