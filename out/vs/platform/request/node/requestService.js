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
define(["require", "exports", "url", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/shell/node/shellEnv", "vs/platform/log/common/log", "vs/platform/request/common/request", "vs/platform/request/node/proxy", "zlib"], function (require, exports, url_1, async_1, buffer_1, errors_1, types_1, configuration_1, environment_1, shellEnv_1, log_1, request_1, proxy_1, zlib_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestService = void 0;
    exports.nodeRequest = nodeRequest;
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    let RequestService = class RequestService extends request_1.AbstractRequestService {
        constructor(configurationService, environmentService, logService, loggerService) {
            super(loggerService);
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.logService = logService;
            this.configure();
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('http')) {
                    this.configure();
                }
            }));
        }
        configure() {
            const config = this.configurationService.getValue('http');
            this.proxyUrl = config?.proxy;
            this.strictSSL = !!config?.proxyStrictSSL;
            this.authorization = config?.proxyAuthorization;
        }
        async request(options, token) {
            const { proxyUrl, strictSSL } = this;
            let shellEnv = undefined;
            try {
                shellEnv = await (0, shellEnv_1.getResolvedShellEnv)(this.configurationService, this.logService, this.environmentService.args, process.env);
            }
            catch (error) {
                if (!this.shellEnvErrorLogged) {
                    this.shellEnvErrorLogged = true;
                    this.logService.error(`resolving shell environment failed`, (0, errors_1.getErrorMessage)(error));
                }
            }
            const env = {
                ...process.env,
                ...shellEnv
            };
            const agent = options.agent ? options.agent : await (0, proxy_1.getProxyAgent)(options.url || '', env, { proxyUrl, strictSSL });
            options.agent = agent;
            options.strictSSL = strictSSL;
            if (this.authorization) {
                options.headers = {
                    ...(options.headers || {}),
                    'Proxy-Authorization': this.authorization
                };
            }
            return this.logAndRequest(options.isChromiumNetwork ? 'electron' : 'node', options, () => nodeRequest(options, token));
        }
        async resolveProxy(url) {
            return undefined; // currently not implemented in node
        }
        async loadCertificates() {
            const proxyAgent = await new Promise((resolve_1, reject_1) => { require(['@vscode/proxy-agent'], resolve_1, reject_1); });
            return proxyAgent.loadSystemCertificates({ log: this.logService });
        }
    };
    exports.RequestService = RequestService;
    exports.RequestService = RequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, log_1.ILoggerService)
    ], RequestService);
    async function getNodeRequest(options) {
        const endpoint = (0, url_1.parse)(options.url);
        const module = endpoint.protocol === 'https:' ? await new Promise((resolve_2, reject_2) => { require(['https'], resolve_2, reject_2); }) : await new Promise((resolve_3, reject_3) => { require(['http'], resolve_3, reject_3); });
        return module.request;
    }
    async function nodeRequest(options, token) {
        return async_1.Promises.withAsyncBody(async (resolve, reject) => {
            const endpoint = (0, url_1.parse)(options.url);
            const rawRequest = options.getRawRequest
                ? options.getRawRequest(options)
                : await getNodeRequest(options);
            const opts = {
                hostname: endpoint.hostname,
                port: endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80),
                protocol: endpoint.protocol,
                path: endpoint.path,
                method: options.type || 'GET',
                headers: options.headers,
                agent: options.agent,
                rejectUnauthorized: (0, types_1.isBoolean)(options.strictSSL) ? options.strictSSL : true
            };
            if (options.user && options.password) {
                opts.auth = options.user + ':' + options.password;
            }
            const req = rawRequest(opts, (res) => {
                const followRedirects = (0, types_1.isNumber)(options.followRedirects) ? options.followRedirects : 3;
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && followRedirects > 0 && res.headers['location']) {
                    nodeRequest({
                        ...options,
                        url: res.headers['location'],
                        followRedirects: followRedirects - 1
                    }, token).then(resolve, reject);
                }
                else {
                    let stream = res;
                    // Responses from Electron net module should be treated as response
                    // from browser, which will apply gzip filter and decompress the response
                    // using zlib before passing the result to us. Following step can be bypassed
                    // in this case and proceed further.
                    // Refs https://source.chromium.org/chromium/chromium/src/+/main:net/url_request/url_request_http_job.cc;l=1266-1318
                    if (!options.isChromiumNetwork && res.headers['content-encoding'] === 'gzip') {
                        stream = res.pipe((0, zlib_1.createGunzip)());
                    }
                    resolve({ res, stream: (0, buffer_1.streamToBufferReadableStream)(stream) });
                }
            });
            req.on('error', reject);
            if (options.timeout) {
                req.setTimeout(options.timeout);
            }
            // Chromium will abort the request if forbidden headers are set.
            // Ref https://source.chromium.org/chromium/chromium/src/+/main:services/network/public/cpp/header_util.cc;l=14-48;
            // for additional context.
            if (options.isChromiumNetwork) {
                req.removeHeader('Content-Length');
            }
            if (options.data) {
                if (typeof options.data === 'string') {
                    req.write(options.data);
                }
            }
            req.end();
            token.onCancellationRequested(() => {
                req.abort();
                reject(new errors_1.CancellationError());
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlcXVlc3Qvbm9kZS9yZXF1ZXN0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwSGhHLGtDQXlFQztJQTlKRDs7O09BR0c7SUFDSSxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsZ0NBQXNCO1FBU3pELFlBQ3lDLG9CQUEyQyxFQUN2QyxrQkFBNkMsRUFDM0QsVUFBdUIsRUFDckMsYUFBNkI7WUFFN0MsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBTG1CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDdkMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUEyQjtZQUMzRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBSXJELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUNwQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2xCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLFNBQVM7WUFDaEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBaUMsTUFBTSxDQUFDLENBQUM7WUFFMUYsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLEVBQUUsS0FBSyxDQUFDO1lBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FB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