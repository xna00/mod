/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "http", "https", "tls", "net", "vs/base/common/uri", "vs/platform/log/common/log", "@vscode/proxy-agent"], function (require, exports, http, https, tls, net, uri_1, log_1, proxy_agent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connectProxyResolver = connectProxyResolver;
    const systemCertificatesV2Default = false;
    function connectProxyResolver(extHostWorkspace, configProvider, extensionService, extHostLogService, mainThreadTelemetry, initData) {
        const useHostProxy = initData.environment.useHostProxy;
        const doUseHostProxy = typeof useHostProxy === 'boolean' ? useHostProxy : !initData.remote.isRemote;
        const params = {
            resolveProxy: url => extHostWorkspace.resolveProxy(url),
            lookupProxyAuthorization: lookupProxyAuthorization.bind(undefined, extHostLogService, mainThreadTelemetry, configProvider, {}, initData.remote.isRemote),
            getProxyURL: () => configProvider.getConfiguration('http').get('proxy'),
            getProxySupport: () => configProvider.getConfiguration('http').get('proxySupport') || 'off',
            addCertificatesV1: () => certSettingV1(configProvider),
            addCertificatesV2: () => certSettingV2(configProvider),
            log: extHostLogService,
            getLogLevel: () => {
                const level = extHostLogService.getLevel();
                switch (level) {
                    case log_1.LogLevel.Trace: return proxy_agent_1.LogLevel.Trace;
                    case log_1.LogLevel.Debug: return proxy_agent_1.LogLevel.Debug;
                    case log_1.LogLevel.Info: return proxy_agent_1.LogLevel.Info;
                    case log_1.LogLevel.Warning: return proxy_agent_1.LogLevel.Warning;
                    case log_1.LogLevel.Error: return proxy_agent_1.LogLevel.Error;
                    case log_1.LogLevel.Off: return proxy_agent_1.LogLevel.Off;
                    default: return never(level);
                }
                function never(level) {
                    extHostLogService.error('Unknown log level', level);
                    return proxy_agent_1.LogLevel.Debug;
                }
            },
            proxyResolveTelemetry: () => { },
            useHostProxy: doUseHostProxy,
            loadAdditionalCertificates: async () => {
                const promises = [];
                if (initData.remote.isRemote) {
                    promises.push((0, proxy_agent_1.loadSystemCertificates)({ log: extHostLogService }));
                }
                if (doUseHostProxy) {
                    extHostLogService.trace('ProxyResolver#loadAdditionalCertificates: Loading certificates from main process');
                    const certs = extHostWorkspace.loadCertificates(); // Loading from main process to share cache.
                    certs.then(certs => extHostLogService.trace('ProxyResolver#loadAdditionalCertificates: Loaded certificates from main process', certs.length));
                    promises.push(certs);
                }
                return (await Promise.all(promises)).flat();
            },
            env: process.env,
        };
        const resolveProxy = (0, proxy_agent_1.createProxyResolver)(params);
        const lookup = createPatchedModules(params, resolveProxy);
        return configureModuleLoading(extensionService, lookup);
    }
    function createPatchedModules(params, resolveProxy) {
        return {
            http: Object.assign(http, (0, proxy_agent_1.createHttpPatch)(params, http, resolveProxy)),
            https: Object.assign(https, (0, proxy_agent_1.createHttpPatch)(params, https, resolveProxy)),
            net: Object.assign(net, (0, proxy_agent_1.createNetPatch)(params, net)),
            tls: Object.assign(tls, (0, proxy_agent_1.createTlsPatch)(params, tls))
        };
    }
    function certSettingV1(configProvider) {
        const http = configProvider.getConfiguration('http');
        return !http.get('experimental.systemCertificatesV2', systemCertificatesV2Default) && !!http.get('systemCertificates');
    }
    function certSettingV2(configProvider) {
        const http = configProvider.getConfiguration('http');
        return !!http.get('experimental.systemCertificatesV2', systemCertificatesV2Default) && !!http.get('systemCertificates');
    }
    const modulesCache = new Map();
    function configureModuleLoading(extensionService, lookup) {
        return extensionService.getExtensionPathIndex()
            .then(extensionPaths => {
            const node_module = globalThis._VSCODE_NODE_MODULES.module;
            const original = node_module._load;
            node_module._load = function load(request, parent, isMain) {
                if (request === 'net') {
                    return lookup.net;
                }
                if (request === 'tls') {
                    return lookup.tls;
                }
                if (request !== 'http' && request !== 'https') {
                    return original.apply(this, arguments);
                }
                const ext = extensionPaths.findSubstr(uri_1.URI.file(parent.filename));
                let cache = modulesCache.get(ext);
                if (!cache) {
                    modulesCache.set(ext, cache = {});
                }
                if (!cache[request]) {
                    const mod = lookup[request];
                    cache[request] = { ...mod }; // Copy to work around #93167.
                }
                return cache[request];
            };
        });
    }
    async function lookupProxyAuthorization(extHostLogService, mainThreadTelemetry, configProvider, proxyAuthenticateCache, isRemote, proxyURL, proxyAuthenticate, state) {
        const cached = proxyAuthenticateCache[proxyURL];
        if (proxyAuthenticate) {
            proxyAuthenticateCache[proxyURL] = proxyAuthenticate;
        }
        extHostLogService.trace('ProxyResolver#lookupProxyAuthorization callback', `proxyURL:${proxyURL}`, `proxyAuthenticate:${proxyAuthenticate}`, `proxyAuthenticateCache:${cached}`);
        const header = proxyAuthenticate || cached;
        const authenticate = Array.isArray(header) ? header : typeof header === 'string' ? [header] : [];
        sendTelemetry(mainThreadTelemetry, authenticate, isRemote);
        if (authenticate.some(a => /^(Negotiate|Kerberos)( |$)/i.test(a)) && !state.kerberosRequested) {
            try {
                state.kerberosRequested = true;
                const kerberos = await new Promise((resolve_1, reject_1) => { require(['kerberos'], resolve_1, reject_1); });
                const url = new URL(proxyURL);
                const spn = configProvider.getConfiguration('http').get('proxyKerberosServicePrincipal')
                    || (process.platform === 'win32' ? `HTTP/${url.hostname}` : `HTTP@${url.hostname}`);
                extHostLogService.debug('ProxyResolver#lookupProxyAuthorization Kerberos authentication lookup', `proxyURL:${proxyURL}`, `spn:${spn}`);
                const client = await kerberos.initializeClient(spn);
                const response = await client.step('');
                return 'Negotiate ' + response;
            }
            catch (err) {
                extHostLogService.error('ProxyResolver#lookupProxyAuthorization Kerberos authentication failed', err);
            }
        }
        return undefined;
    }
    let telemetrySent = false;
    function sendTelemetry(mainThreadTelemetry, authenticate, isRemote) {
        if (telemetrySent || !authenticate.length) {
            return;
        }
        telemetrySent = true;
        mainThreadTelemetry.$publicLog2('proxyAuthenticationRequest', {
            authenticationType: authenticate.map(a => a.split(' ')[0]).join(','),
            extensionHostType: isRemote ? 'remote' : 'local',
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHlSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9ub2RlL3Byb3h5UmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLG9EQXNEQztJQXhERCxNQUFNLDJCQUEyQixHQUFHLEtBQUssQ0FBQztJQUUxQyxTQUFnQixvQkFBb0IsQ0FDbkMsZ0JBQTJDLEVBQzNDLGNBQXFDLEVBQ3JDLGdCQUF5QyxFQUN6QyxpQkFBOEIsRUFDOUIsbUJBQTZDLEVBQzdDLFFBQWdDO1FBRWhDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO1FBQ3ZELE1BQU0sY0FBYyxHQUFHLE9BQU8sWUFBWSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ3BHLE1BQU0sTUFBTSxHQUFxQjtZQUNoQyxZQUFZLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDO1lBQ3ZELHdCQUF3QixFQUFFLHdCQUF3QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUN4SixXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7WUFDdkUsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQXNCLGNBQWMsQ0FBQyxJ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