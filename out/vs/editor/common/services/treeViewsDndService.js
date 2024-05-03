/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/treeViewsDnd"], function (require, exports, extensions_1, instantiation_1, treeViewsDnd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITreeViewsDnDService = void 0;
    exports.ITreeViewsDnDService = (0, instantiation_1.createDecorator)('treeViewsDndService');
    (0, extensions_1.registerSingleton)(exports.ITreeViewsDnDService, treeViewsDnd_1.TreeViewsDnDService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVZpZXdzRG5kU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9zZXJ2aWNlcy90cmVlVmlld3NEbmRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFuRixRQUFBLG9CQUFvQixHQUFHLElBQUEsK0JBQWUsRUFBdUIscUJBQXFCLENBQUMsQ0FBQztJQUNqRyxJQUFBLDhCQUFpQixFQUFDLDRCQUFvQixFQUFFLGtDQUFtQixvQ0FBNEIsQ0FBQyJ9