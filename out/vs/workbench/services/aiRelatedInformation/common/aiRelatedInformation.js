/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RelatedInformationType = exports.IAiRelatedInformationService = void 0;
    exports.IAiRelatedInformationService = (0, instantiation_1.createDecorator)('IAiRelatedInformationService');
    var RelatedInformationType;
    (function (RelatedInformationType) {
        RelatedInformationType[RelatedInformationType["SymbolInformation"] = 1] = "SymbolInformation";
        RelatedInformationType[RelatedInformationType["CommandInformation"] = 2] = "CommandInformation";
        RelatedInformationType[RelatedInformationType["SearchInformation"] = 3] = "SearchInformation";
        RelatedInformationType[RelatedInformationType["SettingInformation"] = 4] = "SettingInformation";
    })(RelatedInformationType || (exports.RelatedInformationType = RelatedInformationType = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlSZWxhdGVkSW5mb3JtYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9haVJlbGF0ZWRJbmZvcm1hdGlvbi9jb21tb24vYWlSZWxhdGVkSW5mb3JtYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTW5GLFFBQUEsNEJBQTRCLEdBQUcsSUFBQSwrQkFBZSxFQUErQiw4QkFBOEIsQ0FBQyxDQUFDO0lBRTFILElBQVksc0JBS1g7SUFMRCxXQUFZLHNCQUFzQjtRQUNqQyw2RkFBcUIsQ0FBQTtRQUNyQiwrRkFBc0IsQ0FBQTtRQUN0Qiw2RkFBcUIsQ0FBQTtRQUNyQiwrRkFBc0IsQ0FBQTtJQUN2QixDQUFDLEVBTFcsc0JBQXNCLHNDQUF0QixzQkFBc0IsUUFLakMifQ==