/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookPerfMarks = void 0;
    class NotebookPerfMarks {
        constructor() {
            this._marks = {};
        }
        get value() {
            return { ...this._marks };
        }
        mark(name) {
            if (this._marks[name]) {
                console.error(`Skipping overwrite of notebook perf value: ${name}`);
                return;
            }
            this._marks[name] = Date.now();
        }
    }
    exports.NotebookPerfMarks = NotebookPerfMarks;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tQZXJmb3JtYW5jZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svY29tbW9uL25vdGVib29rUGVyZm9ybWFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLE1BQWEsaUJBQWlCO1FBQTlCO1lBQ1MsV0FBTSxHQUFvQixFQUFFLENBQUM7UUFjdEMsQ0FBQztRQVpBLElBQUksS0FBSztZQUNSLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsSUFBSSxDQUFDLElBQWM7WUFDbEIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU8sQ0FBQyxLQUFLLENBQUMsOENBQThDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDaEMsQ0FBQztLQUNEO0lBZkQsOENBZUMifQ==