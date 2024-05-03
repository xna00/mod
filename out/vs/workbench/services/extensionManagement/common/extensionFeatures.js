/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionFeaturesManagementService = exports.Extensions = void 0;
    var Extensions;
    (function (Extensions) {
        Extensions.ExtensionFeaturesRegistry = 'workbench.registry.extensionFeatures';
    })(Extensions || (exports.Extensions = Extensions = {}));
    exports.IExtensionFeaturesManagementService = (0, instantiation_1.createDecorator)('IExtensionFeaturesManagementService');
    class ExtensionFeaturesRegistry {
        constructor() {
            this.extensionFeatures = new Map();
        }
        registerExtensionFeature(descriptor) {
            if (this.extensionFeatures.has(descriptor.id)) {
                throw new Error(`Extension feature with id '${descriptor.id}' already exists`);
            }
            this.extensionFeatures.set(descriptor.id, descriptor);
            return {
                dispose: () => this.extensionFeatures.delete(descriptor.id)
            };
        }
        getExtensionFeature(id) {
            return this.extensionFeatures.get(id);
        }
        getExtensionFeatures() {
            return Array.from(this.extensionFeatures.values());
        }
    }
    platform_1.Registry.add(Extensions.ExtensionFeaturesRegistry, new ExtensionFeaturesRegistry());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRmVhdHVyZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9leHRlbnNpb25GZWF0dXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsSUFBaUIsVUFBVSxDQUUxQjtJQUZELFdBQWlCLFVBQVU7UUFDYixvQ0FBeUIsR0FBRyxzQ0FBc0MsQ0FBQztJQUNqRixDQUFDLEVBRmdCLFVBQVUsMEJBQVYsVUFBVSxRQUUxQjtJQTBEWSxRQUFBLG1DQUFtQyxHQUFHLElBQUEsK0JBQWUsRUFBc0MscUNBQXFDLENBQUMsQ0FBQztJQWdCL0ksTUFBTSx5QkFBeUI7UUFBL0I7WUFFa0Isc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQXVDLENBQUM7UUFtQnJGLENBQUM7UUFqQkEsd0JBQXdCLENBQUMsVUFBdUM7WUFDL0QsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixVQUFVLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDdEQsT0FBTztnQkFDTixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2FBQzNELENBQUM7UUFDSCxDQUFDO1FBRUQsbUJBQW1CLENBQUMsRUFBVTtZQUM3QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELG9CQUFvQjtZQUNuQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDcEQsQ0FBQztLQUNEO0lBRUQsbUJBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLHlCQUF5QixFQUFFLElBQUkseUJBQXlCLEVBQUUsQ0FBQyxDQUFDIn0=