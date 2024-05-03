/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostStatusService = exports.IExtensionHostStatusService = void 0;
    exports.IExtensionHostStatusService = (0, instantiation_1.createDecorator)('extensionHostStatusService');
    class ExtensionHostStatusService {
        constructor() {
            this._exitInfo = new Map();
        }
        setExitInfo(reconnectionToken, info) {
            this._exitInfo.set(reconnectionToken, info);
        }
        getExitInfo(reconnectionToken) {
            return this._exitInfo.get(reconnectionToken) || null;
        }
    }
    exports.ExtensionHostStatusService = ExtensionHostStatusService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFN0YXR1c1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3NlcnZlci9ub2RlL2V4dGVuc2lvbkhvc3RTdGF0dXNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtuRixRQUFBLDJCQUEyQixHQUFHLElBQUEsK0JBQWUsRUFBOEIsNEJBQTRCLENBQUMsQ0FBQztJQVN0SCxNQUFhLDBCQUEwQjtRQUF2QztZQUdrQixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWtDLENBQUM7UUFTeEUsQ0FBQztRQVBBLFdBQVcsQ0FBQyxpQkFBeUIsRUFBRSxJQUE0QjtZQUNsRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsV0FBVyxDQUFDLGlCQUF5QjtZQUNwQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksSUFBSSxDQUFDO1FBQ3RELENBQUM7S0FDRDtJQVpELGdFQVlDIn0=