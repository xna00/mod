/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeviewsService = void 0;
    class TreeviewsService {
        constructor() {
            this._renderedElements = new Map();
        }
        getRenderedTreeElement(node) {
            if (this._renderedElements.has(node)) {
                return this._renderedElements.get(node);
            }
            return undefined;
        }
        addRenderedTreeItemElement(node, element) {
            this._renderedElements.set(node, element);
        }
        removeRenderedTreeItemElement(node) {
            if (this._renderedElements.has(node)) {
                this._renderedElements.delete(node);
            }
        }
    }
    exports.TreeviewsService = TreeviewsService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVZpZXdzU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3ZpZXdzL2NvbW1vbi90cmVlVmlld3NTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLGdCQUFnQjtRQUE3QjtZQUVTLHNCQUFpQixHQUFtQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBa0J2RCxDQUFDO1FBaEJBLHNCQUFzQixDQUFDLElBQVk7WUFDbEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELDBCQUEwQixDQUFDLElBQVksRUFBRSxPQUFVO1lBQ2xELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCw2QkFBNkIsQ0FBQyxJQUFZO1lBQ3pDLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JDLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFwQkQsNENBb0JDIn0=