/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation"], function (require, exports, network_1, resources_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostFileSystemInfo = exports.ExtHostFileSystemInfo = void 0;
    class ExtHostFileSystemInfo {
        constructor() {
            this._systemSchemes = new Set(Object.keys(network_1.Schemas));
            this._providerInfo = new Map();
            this.extUri = new resources_1.ExtUri(uri => {
                const capabilities = this._providerInfo.get(uri.scheme);
                if (capabilities === undefined) {
                    // default: not ignore
                    return false;
                }
                if (capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */) {
                    // configured as case sensitive
                    return false;
                }
                return true;
            });
        }
        $acceptProviderInfos(uri, capabilities) {
            if (capabilities === null) {
                this._providerInfo.delete(uri.scheme);
            }
            else {
                this._providerInfo.set(uri.scheme, capabilities);
            }
        }
        isFreeScheme(scheme) {
            return !this._providerInfo.has(scheme) && !this._systemSchemes.has(scheme);
        }
        getCapabilities(scheme) {
            return this._providerInfo.get(scheme);
        }
    }
    exports.ExtHostFileSystemInfo = ExtHostFileSystemInfo;
    exports.IExtHostFileSystemInfo = (0, instantiation_1.createDecorator)('IExtHostFileSystemInfo');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEZpbGVTeXN0ZW1JbmZvLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0RmlsZVN5c3RlbUluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEscUJBQXFCO1FBU2pDO1lBTGlCLG1CQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBTyxDQUFDLENBQUMsQ0FBQztZQUMvQyxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBSzFELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxrQkFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUM5QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hELElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNoQyxzQkFBc0I7b0JBQ3RCLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBQ0QsSUFBSSxZQUFZLDhEQUFtRCxFQUFFLENBQUM7b0JBQ3JFLCtCQUErQjtvQkFDL0IsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELG9CQUFvQixDQUFDLEdBQWtCLEVBQUUsWUFBMkI7WUFDbkUsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQVksQ0FBQyxNQUFjO1lBQzFCLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCxlQUFlLENBQUMsTUFBYztZQUM3QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRDtJQXZDRCxzREF1Q0M7SUFLWSxRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsd0JBQXdCLENBQUMsQ0FBQyJ9