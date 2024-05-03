/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StaticServiceAccessor = void 0;
    class StaticServiceAccessor {
        constructor() {
            this.services = new Map();
        }
        withService(id, service) {
            this.services.set(id, service);
            return this;
        }
        get(id) {
            const value = this.services.get(id);
            if (!value) {
                throw new Error('Service does not exist');
            }
            return value;
        }
    }
    exports.StaticServiceAccessor = StaticServiceAccessor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3dvcmRQYXJ0T3BlcmF0aW9ucy90ZXN0L2Jyb3dzZXIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLE1BQWEscUJBQXFCO1FBQWxDO1lBQ1MsYUFBUSxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1FBYzNELENBQUM7UUFaTyxXQUFXLENBQUksRUFBd0IsRUFBRSxPQUFVO1lBQ3pELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTSxHQUFHLENBQUksRUFBd0I7WUFDckMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0tBQ0Q7SUFmRCxzREFlQyJ9