/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/parts/request/common/request"], function (require, exports, buffer_1, errors_1, request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.request = request;
    function request(options, token) {
        if (options.proxyAuthorization) {
            options.headers = {
                ...(options.headers || {}),
                'Proxy-Authorization': options.proxyAuthorization
            };
        }
        const xhr = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhr.open(options.type || 'GET', options.url || '', true, options.user, options.password);
            setRequestHeaders(xhr, options);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = e => reject(navigator.onLine ? new Error(xhr.statusText && ('XHR failed: ' + xhr.statusText) || 'XHR failed') : new request_1.OfflineError());
            xhr.onload = (e) => {
                resolve({
                    res: {
                        statusCode: xhr.status,
                        headers: getResponseHeaders(xhr)
                    },
                    stream: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.wrap(new Uint8Array(xhr.response)))
                });
            };
            xhr.ontimeout = e => reject(new Error(`XHR timeout: ${options.timeout}ms`));
            if (options.timeout) {
                xhr.timeout = options.timeout;
            }
            xhr.send(options.data);
            // cancel
            token.onCancellationRequested(() => {
                xhr.abort();
                reject((0, errors_1.canceled)());
            });
        });
    }
    function setRequestHeaders(xhr, options) {
        if (options.headers) {
            outer: for (const k in options.headers) {
                switch (k) {
                    case 'User-Agent':
                    case 'Accept-Encoding':
                    case 'Content-Length':
                        // unsafe headers
                        continue outer;
                }
                xhr.setRequestHeader(k, options.headers[k]);
            }
        }
    }
    function getResponseHeaders(xhr) {
        const headers = Object.create(null);
        for (const line of xhr.getAllResponseHeaders().split(/\r\n|\n|\r/g)) {
            if (line) {
                const idx = line.indexOf(':');
                headers[line.substr(0, idx).trim().toLowerCase()] = line.substr(idx + 1).trim();
            }
        }
        return headers;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9yZXF1ZXN0L2Jyb3dzZXIvcmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRywwQkF5Q0M7SUF6Q0QsU0FBZ0IsT0FBTyxDQUFDLE9BQXdCLEVBQUUsS0FBd0I7UUFDekUsSUFBSSxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUNoQyxPQUFPLENBQUMsT0FBTyxHQUFHO2dCQUNqQixHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQzFCLHFCQUFxQixFQUFFLE9BQU8sQ0FBQyxrQkFBa0I7YUFDakQsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sSUFBSSxPQUFPLENBQWtCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBRXZELEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsT0FBTyxDQUFDLEdBQUcsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pGLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVoQyxHQUFHLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztZQUNqQyxHQUFHLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUN4QixTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxZ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