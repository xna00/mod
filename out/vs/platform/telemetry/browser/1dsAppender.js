/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/common/1dsAppender"], function (require, exports, _1dsAppender_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OneDataSystemWebAppender = void 0;
    class OneDataSystemWebAppender extends _1dsAppender_1.AbstractOneDataSystemAppender {
        constructor(isInternalTelemetry, eventPrefix, defaultData, iKeyOrClientFactory) {
            super(isInternalTelemetry, eventPrefix, defaultData, iKeyOrClientFactory);
            // If we cannot fetch the endpoint it means it is down and we should not send any telemetry.
            // This is most likely due to ad blockers
            fetch(this.endPointHealthUrl, { method: 'GET' }).catch(err => {
                this._aiCoreOrKey = undefined;
            });
        }
    }
    exports.OneDataSystemWebAppender = OneDataSystemWebAppender;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMWRzQXBwZW5kZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9icm93c2VyLzFkc0FwcGVuZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLHdCQUF5QixTQUFRLDRDQUE2QjtRQUMxRSxZQUNDLG1CQUE0QixFQUM1QixXQUFtQixFQUNuQixXQUEwQyxFQUMxQyxtQkFBc0Q7WUFFdEQsS0FBSyxDQUFDLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUUxRSw0RkFBNEY7WUFDNUYseUNBQXlDO1lBQ3pDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBZkQsNERBZUMifQ==