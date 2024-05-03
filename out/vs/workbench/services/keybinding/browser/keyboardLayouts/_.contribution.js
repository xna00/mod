/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyboardLayoutContribution = void 0;
    class KeyboardLayoutContribution {
        static { this.INSTANCE = new KeyboardLayoutContribution(); }
        get layoutInfos() {
            return this._layoutInfos;
        }
        constructor() {
            this._layoutInfos = [];
        }
        registerKeyboardLayout(layout) {
            this._layoutInfos.push(layout);
        }
    }
    exports.KeyboardLayoutContribution = KeyboardLayoutContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiXy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9rZXliaW5kaW5nL2Jyb3dzZXIva2V5Ym9hcmRMYXlvdXRzL18uY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxNQUFhLDBCQUEwQjtpQkFDZixhQUFRLEdBQStCLElBQUksMEJBQTBCLEVBQUUsQUFBL0QsQ0FBZ0U7UUFJL0YsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFRDtZQU5RLGlCQUFZLEdBQWtCLEVBQUUsQ0FBQztRQU96QyxDQUFDO1FBRUQsc0JBQXNCLENBQUMsTUFBbUI7WUFDekMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEMsQ0FBQzs7SUFkRixnRUFlQyJ9