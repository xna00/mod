/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform"], function (require, exports, buffer_1, errors_1, lifecycle_1, nls_1, configurationRegistry_1, instantiation_1, log_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractRequestService = exports.IRequestService = void 0;
    exports.isSuccess = isSuccess;
    exports.hasNoContent = hasNoContent;
    exports.asText = asText;
    exports.asTextOrError = asTextOrError;
    exports.asJson = asJson;
    exports.updateProxyConfigurationsScope = updateProxyConfigurationsScope;
    exports.IRequestService = (0, instantiation_1.createDecorator)('requestService');
    class LoggableHeaders {
        constructor(original) {
            this.original = original;
        }
        toJSON() {
            if (!this.headers) {
                const headers = Object.create(null);
                for (const key in this.original) {
                    if (key.toLowerCase() === 'authorization' || key.toLowerCase() === 'proxy-authorization') {
                        headers[key] = '*****';
                    }
                    else {
                        headers[key] = this.original[key];
                    }
                }
                this.headers = headers;
            }
            return this.headers;
        }
    }
    class AbstractRequestService extends lifecycle_1.Disposable {
        constructor(loggerService) {
            super();
            this.counter = 0;
            this.logger = loggerService.createLogger('network', {
                name: (0, nls_1.localize)('request', "Network Requests"),
                when: log_1.CONTEXT_LOG_LEVEL.isEqualTo((0, log_1.LogLevelToString)(log_1.LogLevel.Trace)).serialize()
            });
        }
        async logAndRequest(stack, options, request) {
            const prefix = `${stack} #${++this.counter}: ${options.url}`;
            this.logger.trace(`${prefix} - begin`, options.type, new LoggableHeaders(options.headers ?? {}));
            try {
                const result = await request();
                this.logger.trace(`${prefix} - end`, options.type, result.res.statusCode, result.res.headers);
                return result;
            }
            catch (error) {
                this.logger.error(`${prefix} - error`, options.type, (0, errors_1.getErrorMessage)(error));
                throw error;
            }
        }
    }
    exports.AbstractRequestService = AbstractRequestService;
    function isSuccess(context) {
        return (context.res.statusCode && context.res.statusCode >= 200 && context.res.statusCode < 300) || context.res.statusCode === 1223;
    }
    function hasNoContent(context) {
        return context.res.statusCode === 204;
    }
    async function asText(context) {
        if (hasNoContent(context)) {
            return null;
        }
        const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
        return buffer.toString();
    }
    async function asTextOrError(context) {
        if (!isSuccess(context)) {
            throw new Error('Server returned ' + context.res.statusCode);
        }
        return asText(context);
    }
    async function asJson(context) {
        if (!isSuccess(context)) {
            throw new Error('Server returned ' + context.res.statusCode);
        }
        if (hasNoContent(context)) {
            return null;
        }
        const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
        const str = buffer.toString();
        try {
            return JSON.parse(str);
        }
        catch (err) {
            err.message += ':\n' + str;
            throw err;
        }
    }
    function updateProxyConfigurationsScope(scope) {
        registerProxyConfigurations(scope);
    }
    let proxyConfiguration;
    function registerProxyConfigurations(scope) {
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const oldProxyConfiguration = proxyConfiguration;
        proxyConfiguration = {
            id: 'http',
            order: 15,
            title: (0, nls_1.localize)('httpConfigurationTitle', "HTTP"),
            type: 'object',
            scope,
            properties: {
                'http.proxy': {
                    type: 'string',
                    pattern: '^(https?|socks|socks4a?|socks5h?)://([^:]*(:[^@]*)?@)?([^:]+|\\[[:0-9a-fA-F]+\\])(:\\d+)?/?$|^$',
                    markdownDescription: (0, nls_1.localize)('proxy', "The proxy setting to use. If not set, will be inherited from the `http_proxy` and `https_proxy` environment variables."),
                    restricted: true
                },
                'http.proxyStrictSSL': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('strictSSL', "Controls whether the proxy server certificate should be verified against the list of supplied CAs."),
                    restricted: true
                },
                'http.proxyKerberosServicePrincipal': {
                    type: 'string',
                    markdownDescription: (0, nls_1.localize)('proxyKerberosServicePrincipal', "Overrides the principal service name for Kerberos authentication with the HTTP proxy. A default based on the proxy hostname is used when this is not set."),
                    restricted: true
                },
                'http.proxyAuthorization': {
                    type: ['null', 'string'],
                    default: null,
                    markdownDescription: (0, nls_1.localize)('proxyAuthorization', "The value to send as the `Proxy-Authorization` header for every network request."),
                    restricted: true
                },
                'http.proxySupport': {
                    type: 'string',
                    enum: ['off', 'on', 'fallback', 'override'],
                    enumDescriptions: [
                        (0, nls_1.localize)('proxySupportOff', "Disable proxy support for extensions."),
                        (0, nls_1.localize)('proxySupportOn', "Enable proxy support for extensions."),
                        (0, nls_1.localize)('proxySupportFallback', "Enable proxy support for extensions, fall back to request options, when no proxy found."),
                        (0, nls_1.localize)('proxySupportOverride', "Enable proxy support for extensions, override request options."),
                    ],
                    default: 'override',
                    description: (0, nls_1.localize)('proxySupport', "Use the proxy support for extensions."),
                    restricted: true
                },
                'http.systemCertificates': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('systemCertificates', "Controls whether CA certificates should be loaded from the OS. (On Windows and macOS, a reload of the window is required after turning this off.)"),
                    restricted: true
                },
                'http.experimental.systemCertificatesV2': {
                    type: 'boolean',
                    tags: ['experimental'],
                    default: false,
                    description: (0, nls_1.localize)('systemCertificatesV2', "Controls whether experimental loading of CA certificates from the OS should be enabled. This uses a more general approach than the default implemenation."),
                    restricted: true
                }
            }
        };
        configurationRegistry.updateConfigurations({ add: [proxyConfiguration], remove: oldProxyConfiguration ? [oldProxyConfiguration] : [] });
    }
    registerProxyConfigurations(1 /* ConfigurationScope.APPLICATION */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVxdWVzdC9jb21tb24vcmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrRmhHLDhCQUVDO0lBRUQsb0NBRUM7SUFFRCx3QkFNQztJQUVELHNDQUtDO0lBRUQsd0JBZUM7SUFFRCx3RUFFQztJQS9HWSxRQUFBLGVBQWUsR0FBRyxJQUFBLCtCQUFlLEVBQWtCLGdCQUFnQixDQUFDLENBQUM7SUFXbEYsTUFBTSxlQUFlO1FBSXBCLFlBQTZCLFFBQWtCO1lBQWxCLGFBQVEsR0FBUixRQUFRLENBQVU7UUFBSSxDQUFDO1FBRXBELE1BQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQyxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDakMsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssZUFBZSxJQUFJLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxxQkFBcUIsRUFBRSxDQUFDO3dCQUMxRixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDO29CQUN4QixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ25DLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN4QixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3JCLENBQUM7S0FFRDtJQUVELE1BQXNCLHNC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