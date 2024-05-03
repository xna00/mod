/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServiceCollection = void 0;
    class ServiceCollection {
        constructor(...entries) {
            this._entries = new Map();
            for (const [id, service] of entries) {
                this.set(id, service);
            }
        }
        set(id, instanceOrDescriptor) {
            const result = this._entries.get(id);
            this._entries.set(id, instanceOrDescriptor);
            return result;
        }
        has(id) {
            return this._entries.has(id);
        }
        get(id) {
            return this._entries.get(id);
        }
    }
    exports.ServiceCollection = ServiceCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZUNvbGxlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2luc3RhbnRpYXRpb24vY29tbW9uL3NlcnZpY2VDb2xsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLGlCQUFpQjtRQUk3QixZQUFZLEdBQUcsT0FBd0M7WUFGL0MsYUFBUSxHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1lBR3pELEtBQUssTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFFRCxHQUFHLENBQUksRUFBd0IsRUFBRSxvQkFBMkM7WUFDM0UsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDNUMsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsR0FBRyxDQUFDLEVBQTBCO1lBQzdCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELEdBQUcsQ0FBSSxFQUF3QjtZQUM5QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlCLENBQUM7S0FDRDtJQXZCRCw4Q0F1QkMifQ==