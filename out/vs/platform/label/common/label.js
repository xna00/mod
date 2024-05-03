/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Verbosity = exports.ILabelService = void 0;
    exports.ILabelService = (0, instantiation_1.createDecorator)('labelService');
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity || (exports.Verbosity = Verbosity = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFiZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2xhYmVsL2NvbW1vbi9sYWJlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRbkYsUUFBQSxhQUFhLEdBQUcsSUFBQSwrQkFBZSxFQUFnQixjQUFjLENBQUMsQ0FBQztJQThCNUUsSUFBa0IsU0FJakI7SUFKRCxXQUFrQixTQUFTO1FBQzFCLDJDQUFLLENBQUE7UUFDTCw2Q0FBTSxDQUFBO1FBQ04seUNBQUksQ0FBQTtJQUNMLENBQUMsRUFKaUIsU0FBUyx5QkFBVCxTQUFTLFFBSTFCIn0=