/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/platform/request/node/requestService"], function (require, exports, electron_1, requestService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestMainService = void 0;
    function getRawRequest(options) {
        return electron_1.net.request;
    }
    class RequestMainService extends requestService_1.RequestService {
        request(options, token) {
            return super.request({ ...(options || {}), getRawRequest, isChromiumNetwork: true }, token);
        }
    }
    exports.RequestMainService = RequestMainService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdE1haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZXF1ZXN0L2VsZWN0cm9uLW1haW4vcmVxdWVzdE1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxTQUFTLGFBQWEsQ0FBQyxPQUF3QjtRQUM5QyxPQUFPLGNBQUcsQ0FBQyxPQUFxQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxNQUFhLGtCQUFtQixTQUFRLCtCQUFrQjtRQUVoRCxPQUFPLENBQUMsT0FBd0IsRUFBRSxLQUF3QjtZQUNsRSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RixDQUFDO0tBQ0Q7SUFMRCxnREFLQyJ9