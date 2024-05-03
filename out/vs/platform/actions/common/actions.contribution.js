/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/actions/common/actions", "vs/platform/actions/common/menuResetAction", "vs/platform/actions/common/menuService", "vs/platform/instantiation/common/extensions"], function (require, exports, actions_1, menuResetAction_1, menuService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(actions_1.IMenuService, menuService_1.MenuService, 1 /* InstantiationType.Delayed */);
    (0, actions_1.registerAction2)(menuResetAction_1.MenuHiddenStatesReset);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjdGlvbnMvY29tbW9uL2FjdGlvbnMuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLElBQUEsOEJBQWlCLEVBQUMsc0JBQVksRUFBRSx5QkFBVyxvQ0FBNEIsQ0FBQztJQUV4RSxJQUFBLHlCQUFlLEVBQUMsdUNBQXFCLENBQUMsQ0FBQyJ9