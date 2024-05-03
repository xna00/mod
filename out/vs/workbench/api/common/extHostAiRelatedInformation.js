/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes"], function (require, exports, extHost_protocol_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostRelatedInformation = void 0;
    class ExtHostRelatedInformation {
        constructor(mainContext) {
            this._relatedInformationProviders = new Map();
            this._nextHandle = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadAiRelatedInformation);
        }
        async $provideAiRelatedInformation(handle, query, token) {
            if (this._relatedInformationProviders.size === 0) {
                throw new Error('No related information providers registered');
            }
            const provider = this._relatedInformationProviders.get(handle);
            if (!provider) {
                throw new Error('related information provider not found');
            }
            const result = await provider.provideRelatedInformation(query, token) ?? [];
            return result;
        }
        getRelatedInformation(extension, query, types) {
            return this._proxy.$getAiRelatedInformation(query, types);
        }
        registerRelatedInformationProvider(extension, type, provider) {
            const handle = this._nextHandle;
            this._nextHandle++;
            this._relatedInformationProviders.set(handle, provider);
            this._proxy.$registerAiRelatedInformationProvider(handle, type);
            return new extHostTypes_1.Disposable(() => {
                this._proxy.$unregisterAiRelatedInformationProvider(handle);
                this._relatedInformationProviders.delete(handle);
            });
        }
    }
    exports.ExtHostRelatedInformation = ExtHostRelatedInformation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEFpUmVsYXRlZEluZm9ybWF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0QWlSZWxhdGVkSW5mb3JtYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEseUJBQXlCO1FBTXJDLFlBQVksV0FBeUI7WUFMN0IsaUNBQTRCLEdBQTRDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDbEYsZ0JBQVcsR0FBRyxDQUFDLENBQUM7WUFLdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRUQsS0FBSyxDQUFDLDRCQUE0QixDQUFDLE1BQWMsRUFBRSxLQUFhLEVBQUUsS0FBd0I7WUFDekYsSUFBSSxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7WUFDaEUsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMseUJBQXlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1RSxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxTQUFnQyxFQUFFLEtBQWEsRUFBRSxLQUErQjtZQUNyRyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCxrQ0FBa0MsQ0FBQyxTQUFnQyxFQUFFLElBQTRCLEVBQUUsUUFBb0M7WUFDdEksTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNoQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQ0FBcUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEUsT0FBTyxJQUFJLHlCQUFVLENBQUMsR0FBRyxFQUFFO2dCQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLHVDQUF1QyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM1RCxJQUFJLENBQUMsNEJBQTRCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBdENELDhEQXNDQyJ9