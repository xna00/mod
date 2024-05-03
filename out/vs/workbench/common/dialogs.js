/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, async_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogsModel = void 0;
    class DialogsModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.dialogs = [];
            this._onWillShowDialog = this._register(new event_1.Emitter());
            this.onWillShowDialog = this._onWillShowDialog.event;
            this._onDidShowDialog = this._register(new event_1.Emitter());
            this.onDidShowDialog = this._onDidShowDialog.event;
        }
        show(dialog) {
            const promise = new async_1.DeferredPromise();
            const item = {
                args: dialog,
                close: result => {
                    this.dialogs.splice(0, 1);
                    if (result instanceof Error) {
                        promise.error(result);
                    }
                    else {
                        promise.complete(result);
                    }
                    this._onDidShowDialog.fire();
                }
            };
            this.dialogs.push(item);
            this._onWillShowDialog.fire();
            return {
                item,
                result: promise.p
            };
        }
    }
    exports.DialogsModel = DialogsModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9ncy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9kaWFsb2dzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRCaEcsTUFBYSxZQUFhLFNBQVEsc0JBQVU7UUFBNUM7O1lBRVUsWUFBTyxHQUFzQixFQUFFLENBQUM7WUFFeEIsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDaEUscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUV4QyxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMvRCxvQkFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7UUEwQnhELENBQUM7UUF4QkEsSUFBSSxDQUFDLE1BQW1CO1lBQ3ZCLE1BQU0sT0FBTyxHQUFHLElBQUksdUJBQWUsRUFBNkIsQ0FBQztZQUVqRSxNQUFNLElBQUksR0FBb0I7Z0JBQzdCLElBQUksRUFBRSxNQUFNO2dCQUNaLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBRTtvQkFDZixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLElBQUksTUFBTSxZQUFZLEtBQUssRUFBRSxDQUFDO3dCQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUN2QixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzlCLENBQUM7YUFDRCxDQUFDO1lBRUYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1lBRTlCLE9BQU87Z0JBQ04sSUFBSTtnQkFDSixNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDakIsQ0FBQztRQUNILENBQUM7S0FDRDtJQWxDRCxvQ0FrQ0MifQ==