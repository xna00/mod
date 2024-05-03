/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NO_TYPE_ID = exports.WorkingCopyCapabilities = void 0;
    var WorkingCopyCapabilities;
    (function (WorkingCopyCapabilities) {
        /**
         * Signals no specific capability for the working copy.
         */
        WorkingCopyCapabilities[WorkingCopyCapabilities["None"] = 0] = "None";
        /**
         * Signals that the working copy requires
         * additional input when saving, e.g. an
         * associated path to save to.
         */
        WorkingCopyCapabilities[WorkingCopyCapabilities["Untitled"] = 2] = "Untitled";
        /**
         * The working copy will not indicate that
         * it is dirty and unsaved content will be
         * discarded without prompting if closed.
         */
        WorkingCopyCapabilities[WorkingCopyCapabilities["Scratchpad"] = 4] = "Scratchpad";
    })(WorkingCopyCapabilities || (exports.WorkingCopyCapabilities = WorkingCopyCapabilities = {}));
    /**
     * @deprecated it is important to provide a type identifier
     * for working copies to enable all capabilities.
     */
    exports.NO_TYPE_ID = '';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS9jb21tb24vd29ya2luZ0NvcHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLElBQWtCLHVCQW9CakI7SUFwQkQsV0FBa0IsdUJBQXVCO1FBRXhDOztXQUVHO1FBQ0gscUVBQVEsQ0FBQTtRQUVSOzs7O1dBSUc7UUFDSCw2RUFBaUIsQ0FBQTtRQUVqQjs7OztXQUlHO1FBQ0gsaUZBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQXBCaUIsdUJBQXVCLHVDQUF2Qix1QkFBdUIsUUFvQnhDO0lBMENEOzs7T0FHRztJQUNVLFFBQUEsVUFBVSxHQUFHLEVBQUUsQ0FBQyJ9