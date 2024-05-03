/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/textfile/common/encoding", "vs/base/node/pfs", "vs/workbench/services/search/common/textSearchManager"], function (require, exports, encoding_1, pfs, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeTextSearchManager = void 0;
    class NativeTextSearchManager extends textSearchManager_1.TextSearchManager {
        constructor(query, provider, _pfs = pfs, processType = 'searchProcess') {
            super({ query, provider }, {
                readdir: resource => _pfs.Promises.readdir(resource.fsPath),
                toCanonicalName: name => (0, encoding_1.toCanonicalName)(name)
            }, processType);
        }
    }
    exports.NativeTextSearchManager = NativeTextSearchManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvbm9kZS90ZXh0U2VhcmNoTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSx1QkFBd0IsU0FBUSxxQ0FBaUI7UUFFN0QsWUFBWSxLQUFpQixFQUFFLFFBQTRCLEVBQUUsT0FBbUIsR0FBRyxFQUFFLGNBQXdDLGVBQWU7WUFDM0ksS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUMxQixPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO2dCQUMzRCxlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFBLDBCQUFlLEVBQUMsSUFBSSxDQUFDO2FBQzlDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDakIsQ0FBQztLQUNEO0lBUkQsMERBUUMifQ==