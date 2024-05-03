/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/languages/modesRegistry", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/interactive/browser/interactiveDocumentService"], function (require, exports, lifecycle_1, modesRegistry_1, extHost_protocol_1, extHostCustomers_1, interactiveDocumentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadInteractive = void 0;
    let MainThreadInteractive = class MainThreadInteractive {
        constructor(extHostContext, interactiveDocumentService) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostInteractive);
            this._disposables.add(interactiveDocumentService.onWillAddInteractiveDocument((e) => {
                this._proxy.$willAddInteractiveDocument(e.inputUri, '\n', modesRegistry_1.PLAINTEXT_LANGUAGE_ID, e.notebookUri);
            }));
            this._disposables.add(interactiveDocumentService.onWillRemoveInteractiveDocument((e) => {
                this._proxy.$willRemoveInteractiveDocument(e.inputUri, e.notebookUri);
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
    };
    exports.MainThreadInteractive = MainThreadInteractive;
    exports.MainThreadInteractive = MainThreadInteractive = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadInteractive),
        __param(1, interactiveDocumentService_1.IInteractiveDocumentService)
    ], MainThreadInteractive);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEludGVyYWN0aXZlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZEludGVyYWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQUtqQyxZQUNDLGNBQStCLEVBQ0YsMEJBQXVEO1lBSnBFLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFNckQsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV6RSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNuRixJQUFJLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLHFDQUFxQixFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDdEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN2RSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRTdCLENBQUM7S0FDRCxDQUFBO0lBeEJZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBRGpDLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxxQkFBcUIsQ0FBQztRQVFyRCxXQUFBLHdEQUEyQixDQUFBO09BUGpCLHFCQUFxQixDQXdCakMifQ==