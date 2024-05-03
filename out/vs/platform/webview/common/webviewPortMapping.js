/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/platform/tunnel/common/tunnel"], function (require, exports, network_1, uri_1, tunnel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewPortMappingManager = void 0;
    /**
     * Manages port mappings for a single webview.
     */
    class WebviewPortMappingManager {
        constructor(_getExtensionLocation, _getMappings, tunnelService) {
            this._getExtensionLocation = _getExtensionLocation;
            this._getMappings = _getMappings;
            this.tunnelService = tunnelService;
            this._tunnels = new Map();
        }
        async getRedirect(resolveAuthority, url) {
            const uri = uri_1.URI.parse(url);
            const requestLocalHostInfo = (0, tunnel_1.extractLocalHostUriMetaDataForPortMapping)(uri);
            if (!requestLocalHostInfo) {
                return undefined;
            }
            for (const mapping of this._getMappings()) {
                if (mapping.webviewPort === requestLocalHostInfo.port) {
                    const extensionLocation = this._getExtensionLocation();
                    if (extensionLocation && extensionLocation.scheme === network_1.Schemas.vscodeRemote) {
                        const tunnel = resolveAuthority && await this.getOrCreateTunnel(resolveAuthority, mapping.extensionHostPort);
                        if (tunnel) {
                            if (tunnel.tunnelLocalPort === mapping.webviewPort) {
                                return undefined;
                            }
                            return encodeURI(uri.with({
                                authority: `127.0.0.1:${tunnel.tunnelLocalPort}`,
                            }).toString(true));
                        }
                    }
                    if (mapping.webviewPort !== mapping.extensionHostPort) {
                        return encodeURI(uri.with({
                            authority: `${requestLocalHostInfo.address}:${mapping.extensionHostPort}`
                        }).toString(true));
                    }
                }
            }
            return undefined;
        }
        async dispose() {
            for (const tunnel of this._tunnels.values()) {
                await tunnel.dispose();
            }
            this._tunnels.clear();
        }
        async getOrCreateTunnel(remoteAuthority, remotePort) {
            const existing = this._tunnels.get(remotePort);
            if (existing) {
                return existing;
            }
            const tunnelOrError = await this.tunnelService.openTunnel({ getAddress: async () => remoteAuthority }, undefined, remotePort);
            let tunnel;
            if (typeof tunnelOrError === 'string') {
                tunnel = undefined;
            }
            if (tunnel) {
                this._tunnels.set(remotePort, tunnel);
            }
            return tunnel;
        }
    }
    exports.WebviewPortMappingManager = WebviewPortMappingManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1BvcnRNYXBwaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93ZWJ2aWV3L2NvbW1vbi93ZWJ2aWV3UG9ydE1hcHBpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHOztPQUVHO0lBQ0gsTUFBYSx5QkFBeUI7UUFJckMsWUFDa0IscUJBQTRDLEVBQzVDLFlBQWtELEVBQ2xELGFBQTZCO1lBRjdCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsaUJBQVksR0FBWixZQUFZLENBQXNDO1lBQ2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUw5QixhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7UUFNeEQsQ0FBQztRQUVFLEtBQUssQ0FBQyxXQUFXLENBQUMsZ0JBQTZDLEVBQUUsR0FBVztZQUNsRixNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxrREFBeUMsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQzNDLElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDdkQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDdkQsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDNUUsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLElBQUksTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7d0JBQzdHLElBQUksTUFBTSxFQUFFLENBQUM7NEJBQ1osSUFBSSxNQUFNLENBQUMsZUFBZSxLQUFLLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQ0FDcEQsT0FBTyxTQUFTLENBQUM7NEJBQ2xCLENBQUM7NEJBQ0QsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztnQ0FDekIsU0FBUyxFQUFFLGFBQWEsTUFBTSxDQUFDLGVBQWUsRUFBRTs2QkFDaEQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNwQixDQUFDO29CQUNGLENBQUM7b0JBRUQsSUFBSSxPQUFPLENBQUMsV0FBVyxLQUFLLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO3dCQUN2RCxPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDOzRCQUN6QixTQUFTLEVBQUUsR0FBRyxvQkFBb0IsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFO3lCQUN6RSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3BCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU87WUFDWixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxlQUF5QixFQUFFLFVBQWtCO1lBQzVFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9DLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxRQUFRLENBQUM7WUFDakIsQ0FBQztZQUNELE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxVQUFVLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxlQUFlLEVBQUUsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDOUgsSUFBSSxNQUFnQyxDQUFDO1lBQ3JDLElBQUksT0FBTyxhQUFhLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3ZDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDcEIsQ0FBQztZQUNELElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7S0FDRDtJQWpFRCw4REFpRUMifQ==