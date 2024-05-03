/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITimelineService = exports.TimelinePaneId = void 0;
    exports.toKey = toKey;
    function toKey(extension, source) {
        return `${typeof extension === 'string' ? extension : extensions_1.ExtensionIdentifier.toKey(extension)}|${source}`;
    }
    exports.TimelinePaneId = 'timeline';
    const TIMELINE_SERVICE_ID = 'timeline';
    exports.ITimelineService = (0, instantiation_1.createDecorator)(TIMELINE_SERVICE_ID);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZWxpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3RpbWVsaW5lL2NvbW1vbi90aW1lbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsc0JBRUM7SUFGRCxTQUFnQixLQUFLLENBQUMsU0FBdUMsRUFBRSxNQUFjO1FBQzVFLE9BQU8sR0FBRyxPQUFPLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZ0NBQW1CLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO0lBQ3hHLENBQUM7SUFFWSxRQUFBLGNBQWMsR0FBRyxVQUFVLENBQUM7SUF3SXpDLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDO0lBQzFCLFFBQUEsZ0JBQWdCLEdBQUcsSUFBQSwrQkFBZSxFQUFtQixtQkFBbUIsQ0FBQyxDQUFDIn0=