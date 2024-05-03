/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullOpenerService = void 0;
    exports.NullOpenerService = Object.freeze({
        _serviceBrand: undefined,
        registerOpener() { return lifecycle_1.Disposable.None; },
        registerValidator() { return lifecycle_1.Disposable.None; },
        registerExternalUriResolver() { return lifecycle_1.Disposable.None; },
        setDefaultExternalOpener() { },
        registerExternalOpener() { return lifecycle_1.Disposable.None; },
        async open() { return false; },
        async resolveExternalUri(uri) { return { resolved: uri, dispose() { } }; },
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbE9wZW5lclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL29wZW5lci90ZXN0L2NvbW1vbi9udWxsT3BlbmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNbkYsUUFBQSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzlDLGFBQWEsRUFBRSxTQUFTO1FBQ3hCLGNBQWMsS0FBSyxPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1QyxpQkFBaUIsS0FBSyxPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvQywyQkFBMkIsS0FBSyxPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RCx3QkFBd0IsS0FBSyxDQUFDO1FBQzlCLHNCQUFzQixLQUFLLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BELEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzlCLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFRLElBQUksT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM3RCxDQUFDLENBQUMifQ==