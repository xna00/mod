/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "url", "vs/base/common/types"], function (require, exports, url_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getProxyAgent = getProxyAgent;
    function getSystemProxyURI(requestURL, env) {
        if (requestURL.protocol === 'http:') {
            return env.HTTP_PROXY || env.http_proxy || null;
        }
        else if (requestURL.protocol === 'https:') {
            return env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || null;
        }
        return null;
    }
    async function getProxyAgent(rawRequestURL, env, options = {}) {
        const requestURL = (0, url_1.parse)(rawRequestURL);
        const proxyURL = options.proxyUrl || getSystemProxyURI(requestURL, env);
        if (!proxyURL) {
            return null;
        }
        const proxyEndpoint = (0, url_1.parse)(proxyURL);
        if (!/^https?:$/.test(proxyEndpoint.protocol || '')) {
            return null;
        }
        const opts = {
            host: proxyEndpoint.hostname || '',
            port: (proxyEndpoint.port ? +proxyEndpoint.port : 0) || (proxyEndpoint.protocol === 'https' ? 443 : 80),
            auth: proxyEndpoint.auth,
            rejectUnauthorized: (0, types_1.isBoolean)(options.strictSSL) ? options.strictSSL : true,
        };
        return requestURL.protocol === 'http:'
            ? new (await new Promise((resolve_1, reject_1) => { require(['http-proxy-agent'], resolve_1, reject_1); })).HttpProxyAgent(proxyURL, opts)
            : new (await new Promise((resolve_2, reject_2) => { require(['https-proxy-agent'], resolve_2, reject_2); })).HttpsProxyAgent(proxyURL, opts);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlcXVlc3Qvbm9kZS9wcm94eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsc0NBd0JDO0lBdkNELFNBQVMsaUJBQWlCLENBQUMsVUFBZSxFQUFFLEdBQXVCO1FBQ2xFLElBQUksVUFBVSxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUNyQyxPQUFPLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUM7UUFDakQsQ0FBQzthQUFNLElBQUksVUFBVSxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM3QyxPQUFPLEdBQUcsQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLFdBQVcsSUFBSSxHQUFHLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDO1FBQ3ZGLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFPTSxLQUFLLFVBQVUsYUFBYSxDQUFDLGFBQXFCLEVBQUUsR0FBdUIsRUFBRSxVQUFvQixFQUFFO1FBQ3pHLE1BQU0sVUFBVSxHQUFHLElBQUEsV0FBUSxFQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksaUJBQWlCLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXhFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNmLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE1BQU0sYUFBYSxHQUFHLElBQUEsV0FBUSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXpDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNyRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRztZQUNaLElBQUksRUFBRSxhQUFhLENBQUMsUUFBUSxJQUFJLEVBQUU7WUFDbEMsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUN2RyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUk7WUFDeEIsa0JBQWtCLEVBQUUsSUFBQSxpQkFBUyxFQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSTtTQUMzRSxDQUFDO1FBRUYsT0FBTyxVQUFVLENBQUMsUUFBUSxLQUFLLE9BQU87WUFDckMsQ0FBQyxDQUFDLElBQUksQ0FBQyxzREFBYSxrQkFBa0IsMkJBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDO1lBQ3ZFLENBQUMsQ0FBQyxJQUFJLENBQUMsc0RBQWEsbUJBQW1CLDJCQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVFLENBQUMifQ==