/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.webviewGenericCspSource = exports.webviewRootResourceAuthority = exports.webviewResourceBaseHost = void 0;
    exports.asWebviewUri = asWebviewUri;
    exports.decodeAuthority = decodeAuthority;
    /**
     * Root from which resources in webviews are loaded.
     *
     * This is hardcoded because we never expect to actually hit it. Instead these requests
     * should always go to a service worker.
     */
    exports.webviewResourceBaseHost = 'vscode-cdn.net';
    exports.webviewRootResourceAuthority = `vscode-resource.${exports.webviewResourceBaseHost}`;
    exports.webviewGenericCspSource = `'self' https://*.${exports.webviewResourceBaseHost}`;
    /**
     * Construct a uri that can load resources inside a webview
     *
     * We encode the resource component of the uri so that on the main thread
     * we know where to load the resource from (remote or truly local):
     *
     * ```txt
     * ${scheme}+${resource-authority}.vscode-resource.vscode-cdn.net/${path}
     * ```
     *
     * @param resource Uri of the resource to load.
     * @param remoteInfo Optional information about the remote that specifies where `resource` should be resolved from.
     */
    function asWebviewUri(resource, remoteInfo) {
        if (resource.scheme === network_1.Schemas.http || resource.scheme === network_1.Schemas.https) {
            return resource;
        }
        if (remoteInfo && remoteInfo.authority && remoteInfo.isRemote && resource.scheme === network_1.Schemas.file) {
            resource = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeRemote,
                authority: remoteInfo.authority,
                path: resource.path,
            });
        }
        return uri_1.URI.from({
            scheme: network_1.Schemas.https,
            authority: `${resource.scheme}+${encodeAuthority(resource.authority)}.${exports.webviewRootResourceAuthority}`,
            path: resource.path,
            fragment: resource.fragment,
            query: resource.query,
        });
    }
    function encodeAuthority(authority) {
        return authority.replace(/./g, char => {
            const code = char.charCodeAt(0);
            if ((code >= 97 /* CharCode.a */ && code <= 122 /* CharCode.z */)
                || (code >= 65 /* CharCode.A */ && code <= 90 /* CharCode.Z */)
                || (code >= 48 /* CharCode.Digit0 */ && code <= 57 /* CharCode.Digit9 */)) {
                return char;
            }
            return '-' + code.toString(16).padStart(4, '0');
        });
    }
    function decodeAuthority(authority) {
        return authority.replace(/-([0-9a-f]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2Vidmlldy9jb21tb24vd2Vidmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQ2hHLG9DQW9CQztJQWdCRCwwQ0FFQztJQS9ERDs7Ozs7T0FLRztJQUNVLFFBQUEsdUJBQXVCLEdBQUcsZ0JBQWdCLENBQUM7SUFFM0MsUUFBQSw0QkFBNEIsR0FBRyxtQkFBbUIsK0JBQXVCLEVBQUUsQ0FBQztJQUU1RSxRQUFBLHVCQUF1QixHQUFHLG9CQUFvQiwrQkFBdUIsRUFBRSxDQUFDO0lBRXJGOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILFNBQWdCLFlBQVksQ0FBQyxRQUFhLEVBQUUsVUFBOEI7UUFDekUsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMzRSxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxVQUFVLElBQUksVUFBVSxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuRyxRQUFRLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQztnQkFDbkIsTUFBTSxFQUFFLGlCQUFPLENBQUMsWUFBWTtnQkFDNUIsU0FBUyxFQUFFLFVBQVUsQ0FBQyxTQUFTO2dCQUMvQixJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7YUFDbkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQztZQUNmLE1BQU0sRUFBRSxpQkFBTyxDQUFDLEtBQUs7WUFDckIsU0FBUyxFQUFFLEdBQUcsUUFBUSxDQUFDLE1BQU0sSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG9DQUE0QixFQUFFO1lBQ3RHLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtZQUNuQixRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7WUFDM0IsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1NBQ3JCLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLGVBQWUsQ0FBQyxTQUFpQjtRQUN6QyxPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ3JDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsSUFDQyxDQUFDLElBQUksdUJBQWMsSUFBSSxJQUFJLHdCQUFjLENBQUM7bUJBQ3ZDLENBQUMsSUFBSSx1QkFBYyxJQUFJLElBQUksdUJBQWMsQ0FBQzttQkFDMUMsQ0FBQyxJQUFJLDRCQUFtQixJQUFJLElBQUksNEJBQW1CLENBQUMsRUFDdEQsQ0FBQztnQkFDRixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLFNBQWlCO1FBQ2hELE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkcsQ0FBQyJ9