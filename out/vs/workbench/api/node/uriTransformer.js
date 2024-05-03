/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uriIpc"], function (require, exports, uriIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createURITransformer = createURITransformer;
    /**
     * ```
     * --------------------------------
     * |    UI SIDE    |  AGENT SIDE  |
     * |---------------|--------------|
     * | vscode-remote | file         |
     * | file          | vscode-local |
     * --------------------------------
     * ```
     */
    function createRawURITransformer(remoteAuthority) {
        return {
            transformIncoming: (uri) => {
                if (uri.scheme === 'vscode-remote') {
                    return { scheme: 'file', path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                if (uri.scheme === 'file') {
                    return { scheme: 'vscode-local', path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                return uri;
            },
            transformOutgoing: (uri) => {
                if (uri.scheme === 'file') {
                    return { scheme: 'vscode-remote', authority: remoteAuthority, path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                if (uri.scheme === 'vscode-local') {
                    return { scheme: 'file', path: uri.path, query: uri.query, fragment: uri.fragment };
                }
                return uri;
            },
            transformOutgoingScheme: (scheme) => {
                if (scheme === 'file') {
                    return 'vscode-remote';
                }
                else if (scheme === 'vscode-local') {
                    return 'file';
                }
                return scheme;
            }
        };
    }
    function createURITransformer(remoteAuthority) {
        return new uriIpc_1.URITransformer(createRawURITransformer(remoteAuthority));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpVHJhbnNmb3JtZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS91cmlUcmFuc2Zvcm1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTZDaEcsb0RBRUM7SUEzQ0Q7Ozs7Ozs7OztPQVNHO0lBQ0gsU0FBUyx1QkFBdUIsQ0FBQyxlQUF1QjtRQUN2RCxPQUFPO1lBQ04saUJBQWlCLEVBQUUsQ0FBQyxHQUFhLEVBQVksRUFBRTtnQkFDOUMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLGVBQWUsRUFBRSxDQUFDO29CQUNwQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNyRixDQUFDO2dCQUNELElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUUsQ0FBQztvQkFDM0IsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDN0YsQ0FBQztnQkFDRCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFDRCxpQkFBaUIsRUFBRSxDQUFDLEdBQWEsRUFBWSxFQUFFO2dCQUM5QyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQzNCLE9BQU8sRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUgsQ0FBQztnQkFDRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssY0FBYyxFQUFFLENBQUM7b0JBQ25DLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3JGLENBQUM7Z0JBQ0QsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsdUJBQXVCLEVBQUUsQ0FBQyxNQUFjLEVBQVUsRUFBRTtnQkFDbkQsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sZUFBZSxDQUFDO2dCQUN4QixDQUFDO3FCQUFNLElBQUksTUFBTSxLQUFLLGNBQWMsRUFBRSxDQUFDO29CQUN0QyxPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztTQUNELENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBZ0Isb0JBQW9CLENBQUMsZUFBdUI7UUFDM0QsT0FBTyxJQUFJLHVCQUFjLENBQUMsdUJBQXVCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztJQUNyRSxDQUFDIn0=