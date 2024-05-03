/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelPart = void 0;
    class TextModelPart extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._isDisposed = false;
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
        assertNotDisposed() {
            if (this._isDisposed) {
                throw new Error('TextModelPart is disposed!');
            }
        }
    }
    exports.TextModelPart = TextModelPart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC90ZXh0TW9kZWxQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyxNQUFhLGFBQWMsU0FBUSxzQkFBVTtRQUE3Qzs7WUFDUyxnQkFBVyxHQUFHLEtBQUssQ0FBQztRQVc3QixDQUFDO1FBVGdCLE9BQU87WUFDdEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLENBQUM7UUFDUyxpQkFBaUI7WUFDMUIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBWkQsc0NBWUMifQ==