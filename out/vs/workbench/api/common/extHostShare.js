/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/uri"], function (require, exports, extHost_protocol_1, extHostTypeConverters_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostShare = void 0;
    class ExtHostShare {
        static { this.handlePool = 0; }
        constructor(mainContext, uriTransformer) {
            this.uriTransformer = uriTransformer;
            this.providers = new Map();
            this.proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadShare);
        }
        async $provideShare(handle, shareableItem, token) {
            const provider = this.providers.get(handle);
            const result = await provider?.provideShare({ selection: extHostTypeConverters_1.Range.to(shareableItem.selection), resourceUri: uri_1.URI.revive(shareableItem.resourceUri) }, token);
            return result ?? undefined;
        }
        registerShareProvider(selector, provider) {
            const handle = ExtHostShare.handlePool++;
            this.providers.set(handle, provider);
            this.proxy.$registerShareProvider(handle, extHostTypeConverters_1.DocumentSelector.from(selector, this.uriTransformer), provider.id, provider.label, provider.priority);
            return {
                dispose: () => {
                    this.proxy.$unregisterShareProvider(handle);
                    this.providers.delete(handle);
                }
            };
        }
    }
    exports.ExtHostShare = ExtHostShare;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNoYXJlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0U2hhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsWUFBWTtpQkFDVCxlQUFVLEdBQVcsQ0FBQyxBQUFaLENBQWE7UUFLdEMsWUFDQyxXQUF5QixFQUNSLGNBQTJDO1lBQTNDLG1CQUFjLEdBQWQsY0FBYyxDQUE2QjtZQUpyRCxjQUFTLEdBQXNDLElBQUksR0FBRyxFQUFFLENBQUM7WUFNaEUsSUFBSSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBYyxFQUFFLGFBQWdDLEVBQUUsS0FBd0I7WUFDN0YsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLEVBQUUsWUFBWSxDQUFDLEVBQUUsU0FBUyxFQUFFLDZCQUFLLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxXQUFXLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6SixPQUFPLE1BQU0sSUFBSSxTQUFTLENBQUM7UUFDNUIsQ0FBQztRQUVELHFCQUFxQixDQUFDLFFBQWlDLEVBQUUsUUFBOEI7WUFDdEYsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSx3Q0FBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hKLE9BQU87Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixJQUFJLENBQUMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM1QyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0IsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDOztJQTdCRixvQ0E4QkMifQ==