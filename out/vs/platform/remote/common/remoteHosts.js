/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRemoteAuthority = getRemoteAuthority;
    exports.getRemoteName = getRemoteName;
    exports.parseAuthorityWithPort = parseAuthorityWithPort;
    exports.parseAuthorityWithOptionalPort = parseAuthorityWithOptionalPort;
    function getRemoteAuthority(uri) {
        return uri.scheme === network_1.Schemas.vscodeRemote ? uri.authority : undefined;
    }
    function getRemoteName(authority) {
        if (!authority) {
            return undefined;
        }
        const pos = authority.indexOf('+');
        if (pos < 0) {
            // e.g. localhost:8000
            return authority;
        }
        return authority.substr(0, pos);
    }
    function parseAuthorityWithPort(authority) {
        const { host, port } = parseAuthority(authority);
        if (typeof port === 'undefined') {
            throw new Error(`Invalid remote authority: ${authority}. It must either be a remote of form <remoteName>+<arg> or a remote host of form <host>:<port>.`);
        }
        return { host, port };
    }
    function parseAuthorityWithOptionalPort(authority, defaultPort) {
        let { host, port } = parseAuthority(authority);
        if (typeof port === 'undefined') {
            port = defaultPort;
        }
        return { host, port };
    }
    function parseAuthority(authority) {
        // check for ipv6 with port
        const m1 = authority.match(/^(\[[0-9a-z:]+\]):(\d+)$/);
        if (m1) {
            return { host: m1[1], port: parseInt(m1[2], 10) };
        }
        // check for ipv6 without port
        const m2 = authority.match(/^(\[[0-9a-z:]+\])$/);
        if (m2) {
            return { host: m2[1], port: undefined };
        }
        // anything with a trailing port
        const m3 = authority.match(/(.*):(\d+)$/);
        if (m3) {
            return { host: m3[1], port: parseInt(m3[2], 10) };
        }
        // doesn't contain a port
        return { host: authority, port: undefined };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlSG9zdHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlbW90ZS9jb21tb24vcmVtb3RlSG9zdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsZ0RBRUM7SUFLRCxzQ0FVQztJQUVELHdEQU1DO0lBRUQsd0VBTUM7SUFqQ0QsU0FBZ0Isa0JBQWtCLENBQUMsR0FBUTtRQUMxQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUN4RSxDQUFDO0lBS0QsU0FBZ0IsYUFBYSxDQUFDLFNBQTZCO1FBQzFELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNoQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNiLHNCQUFzQjtZQUN0QixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsU0FBZ0Isc0JBQXNCLENBQUMsU0FBaUI7UUFDdkQsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakQsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixTQUFTLGlHQUFpRyxDQUFDLENBQUM7UUFDMUosQ0FBQztRQUNELE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELFNBQWdCLDhCQUE4QixDQUFDLFNBQWlCLEVBQUUsV0FBbUI7UUFDcEYsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0MsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUNqQyxJQUFJLEdBQUcsV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFDRCxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FBQyxTQUFpQjtRQUN4QywyQkFBMkI7UUFDM0IsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3ZELElBQUksRUFBRSxFQUFFLENBQUM7WUFDUixPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ25ELENBQUM7UUFFRCw4QkFBOEI7UUFDOUIsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2pELElBQUksRUFBRSxFQUFFLENBQUM7WUFDUixPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7UUFDekMsQ0FBQztRQUVELGdDQUFnQztRQUNoQyxNQUFNLEVBQUUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzFDLElBQUksRUFBRSxFQUFFLENBQUM7WUFDUixPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ25ELENBQUM7UUFFRCx5QkFBeUI7UUFDekIsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQzdDLENBQUMifQ==