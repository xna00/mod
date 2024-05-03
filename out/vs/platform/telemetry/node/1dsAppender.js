/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/cancellation", "https", "vs/platform/telemetry/common/1dsAppender"], function (require, exports, buffer_1, cancellation_1, https, _1dsAppender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OneDataSystemAppender = void 0;
    /**
     * Completes a request to submit telemetry to the server utilizing the request service
     * @param options The options which will be used to make the request
     * @param requestService The request service
     * @returns An object containing the headers, statusCode, and responseData
     */
    async function makeTelemetryRequest(options, requestService) {
        const response = await requestService.request(options, cancellation_1.CancellationToken.None);
        const responseData = (await (0, buffer_1.streamToBuffer)(response.stream)).toString();
        const statusCode = response.res.statusCode ?? 200;
        const headers = response.res.headers;
        return {
            headers,
            statusCode,
            responseData
        };
    }
    /**
     * Complete a request to submit telemetry to the server utilizing the https module. Only used when the request service is not available
     * @param options The options which will be used to make the request
     * @returns An object containing the headers, statusCode, and responseData
     */
    async function makeLegacyTelemetryRequest(options) {
        const httpsOptions = {
            method: options.type,
            headers: options.headers
        };
        const responsePromise = new Promise((resolve, reject) => {
            const req = https.request(options.url ?? '', httpsOptions, res => {
                res.on('data', function (responseData) {
                    resolve({
                        headers: res.headers,
                        statusCode: res.statusCode ?? 200,
                        responseData: responseData.toString()
                    });
                });
                // On response with error send status of 0 and a blank response to oncomplete so we can retry events
                res.on('error', function (err) {
                    reject(err);
                });
            });
            req.write(options.data, (err) => {
                if (err) {
                    reject(err);
                }
            });
            req.end();
        });
        return responsePromise;
    }
    async function sendPostAsync(requestService, payload, oncomplete) {
        const telemetryRequestData = typeof payload.data === 'string' ? payload.data : new TextDecoder().decode(payload.data);
        const requestOptions = {
            type: 'POST',
            headers: {
                ...payload.headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload.data).toString()
            },
            url: payload.urlString,
            data: telemetryRequestData
        };
        try {
            const responseData = requestService ? await makeTelemetryRequest(requestOptions, requestService) : await makeLegacyTelemetryRequest(requestOptions);
            oncomplete(responseData.statusCode, responseData.headers, responseData.responseData);
        }
        catch {
            // If it errors out, send status of 0 and a blank response to oncomplete so we can retry events
            oncomplete(0, {});
        }
    }
    class OneDataSystemAppender extends _1dsAppender_1.AbstractOneDataSystemAppender {
        constructor(requestService, isInternalTelemetry, eventPrefix, defaultData, iKeyOrClientFactory) {
            // Override the way events get sent since node doesn't have XHTMLRequest
            const customHttpXHROverride = {
                sendPOST: (payload, oncomplete) => {
                    // Fire off the async request without awaiting it
                    sendPostAsync(requestService, payload, oncomplete);
                }
            };
            super(isInternalTelemetry, eventPrefix, defaultData, iKeyOrClientFactory, customHttpXHROverride);
        }
    }
    exports.OneDataSystemAppender = OneDataSystemAppender;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMWRzQXBwZW5kZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9ub2RlLzFkc0FwcGVuZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEc7Ozs7O09BS0c7SUFDSCxLQUFLLFVBQVUsb0JBQW9CLENBQUMsT0FBd0IsRUFBRSxjQUErQjtRQUM1RixNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQWMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9FLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBTSxJQUFBLHVCQUFjLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDeEUsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDO1FBQ2xELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBOEIsQ0FBQztRQUM1RCxPQUFPO1lBQ04sT0FBTztZQUNQLFVBQVU7WUFDVixZQUFZO1NBQ1osQ0FBQztJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxVQUFVLDBCQUEwQixDQUFDLE9BQXdCO1FBQ2pFLE1BQU0sWUFBWSxHQUFHO1lBQ3BCLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSTtZQUNwQixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87U0FDeEIsQ0FBQztRQUNGLE1BQU0sZUFBZSxHQUFHLElBQUksT0FBTyxDQUFnQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUN0RSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLFlBQVksRUFB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