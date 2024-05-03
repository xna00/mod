/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/markers/common/markers", "vs/base/common/uri", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, markers_1, uri_1, extHost_protocol_1, extHostCustomers_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDiagnostics = void 0;
    let MainThreadDiagnostics = class MainThreadDiagnostics {
        constructor(extHostContext, _markerService, _uriIdentService) {
            this._markerService = _markerService;
            this._uriIdentService = _uriIdentService;
            this._activeOwners = new Set();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics);
            this._markerListener = this._markerService.onMarkerChanged(this._forwardMarkers, this);
        }
        dispose() {
            this._markerListener.dispose();
            this._activeOwners.forEach(owner => this._markerService.changeAll(owner, []));
            this._activeOwners.clear();
        }
        _forwardMarkers(resources) {
            const data = [];
            for (const resource of resources) {
                const allMarkerData = this._markerService.read({ resource });
                if (allMarkerData.length === 0) {
                    data.push([resource, []]);
                }
                else {
                    const forgeinMarkerData = allMarkerData.filter(marker => !this._activeOwners.has(marker.owner));
                    if (forgeinMarkerData.length > 0) {
                        data.push([resource, forgeinMarkerData]);
                    }
                }
            }
            if (data.length > 0) {
                this._proxy.$acceptMarkersChange(data);
            }
        }
        $changeMany(owner, entries) {
            for (const entry of entries) {
                const [uri, markers] = entry;
                if (markers) {
                    for (const marker of markers) {
                        if (marker.relatedInformation) {
                            for (const relatedInformation of marker.relatedInformation) {
                                relatedInformation.resource = uri_1.URI.revive(relatedInformation.resource);
                            }
                        }
                        if (marker.code && typeof marker.code !== 'string') {
                            marker.code.target = uri_1.URI.revive(marker.code.target);
                        }
                    }
                }
                this._markerService.changeOne(owner, this._uriIdentService.asCanonicalUri(uri_1.URI.revive(uri)), markers);
            }
            this._activeOwners.add(owner);
        }
        $clear(owner) {
            this._markerService.changeAll(owner, []);
            this._activeOwners.delete(owner);
        }
    };
    exports.MainThreadDiagnostics = MainThreadDiagnostics;
    exports.MainThreadDiagnostics = MainThreadDiagnostics = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDiagnostics),
        __param(1, markers_1.IMarkerService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], MainThreadDiagnostics);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERpYWdub3N0aWNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZERpYWdub3N0aWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQU9qQyxZQUNDLGNBQStCLEVBQ2YsY0FBK0MsRUFDMUMsZ0JBQXNEO1lBRDFDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN6QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXFCO1lBUjNELGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztZQVVsRCxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRXpFLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVCLENBQUM7UUFFTyxlQUFlLENBQUMsU0FBeUI7WUFDaEQsTUFBTSxJQUFJLEdBQXFDLEVBQUUsQ0FBQztZQUNsRCxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzdELElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDaEcsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDRixDQUFDO1FBRUQsV0FBVyxDQUFDLEtBQWEsRUFBRSxPQUF5QztZQUNuRSxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDN0IsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDYixLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUM5QixJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDOzRCQUMvQixLQUFLLE1BQU0sa0JBQWtCLElBQUksTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0NBQzVELGtCQUFrQixDQUFDLFFBQVEsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDOzRCQUN2RSxDQUFDO3dCQUNGLENBQUM7d0JBQ0QsSUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDcEQsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNyRCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEcsQ0FBQztZQUNELElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBYTtZQUNuQixJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsQ0FBQztLQUNELENBQUE7SUFqRVksc0RBQXFCO29DQUFyQixxQkFBcUI7UUFEakMsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLHFCQUFxQixDQUFDO1FBVXJELFdBQUEsd0JBQWMsQ0FBQTtRQUNkLFdBQUEsaUNBQW1CLENBQUE7T0FWVCxxQkFBcUIsQ0FpRWpDIn0=