/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extensions"], function (require, exports, uri_1, extHost_protocol_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDialogs = void 0;
    class ExtHostDialogs {
        constructor(mainContext) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDialogs);
        }
        showOpenDialog(extension, options) {
            if (options?.allowUIResources) {
                (0, extensions_1.checkProposedApiEnabled)(extension, 'showLocal');
            }
            return this._proxy.$showOpenDialog(options).then(filepaths => {
                return filepaths ? filepaths.map(p => uri_1.URI.revive(p)) : undefined;
            });
        }
        showSaveDialog(options) {
            return this._proxy.$showSaveDialog(options).then(filepath => {
                return filepath ? uri_1.URI.revive(filepath) : undefined;
            });
        }
    }
    exports.ExtHostDialogs = ExtHostDialogs;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERpYWxvZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3REaWFsb2dzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLGNBQWM7UUFJMUIsWUFBWSxXQUF5QjtZQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxjQUFjLENBQUMsU0FBdUMsRUFBRSxPQUFrQztZQUN6RixJQUFJLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMvQixJQUFBLG9DQUF1QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQzVELE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsY0FBYyxDQUFDLE9BQWtDO1lBQ2hELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMzRCxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBdEJELHdDQXNCQyJ9