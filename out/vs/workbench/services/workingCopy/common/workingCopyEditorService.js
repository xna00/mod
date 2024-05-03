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
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorService"], function (require, exports, event_1, instantiation_1, extensions_1, lifecycle_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyEditorService = exports.IWorkingCopyEditorService = void 0;
    exports.IWorkingCopyEditorService = (0, instantiation_1.createDecorator)('workingCopyEditorService');
    let WorkingCopyEditorService = class WorkingCopyEditorService extends lifecycle_1.Disposable {
        constructor(editorService) {
            super();
            this.editorService = editorService;
            this._onDidRegisterHandler = this._register(new event_1.Emitter());
            this.onDidRegisterHandler = this._onDidRegisterHandler.event;
            this.handlers = new Set();
        }
        registerHandler(handler) {
            // Add to registry and emit as event
            this.handlers.add(handler);
            this._onDidRegisterHandler.fire(handler);
            return (0, lifecycle_1.toDisposable)(() => this.handlers.delete(handler));
        }
        findEditor(workingCopy) {
            for (const editorIdentifier of this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (this.isOpen(workingCopy, editorIdentifier.editor)) {
                    return editorIdentifier;
                }
            }
            return undefined;
        }
        isOpen(workingCopy, editor) {
            for (const handler of this.handlers) {
                if (handler.isOpen(workingCopy, editor)) {
                    return true;
                }
            }
            return false;
        }
    };
    exports.WorkingCopyEditorService = WorkingCopyEditorService;
    exports.WorkingCopyEditorService = WorkingCopyEditorService = __decorate([
        __param(0, editorService_1.IEditorService)
    ], WorkingCopyEditorService);
    // Register Service
    (0, extensions_1.registerSingleton)(exports.IWorkingCopyEditorService, WorkingCopyEditorService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlFZGl0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3dvcmtpbmdDb3B5RWRpdG9yU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXbkYsUUFBQSx5QkFBeUIsR0FBRyxJQUFBLCtCQUFlLEVBQTRCLDBCQUEwQixDQUFDLENBQUM7SUF5Q3pHLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFTdkQsWUFBNEIsYUFBOEM7WUFDekUsS0FBSyxFQUFFLENBQUM7WUFEb0Msa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBTHpELDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTZCLENBQUMsQ0FBQztZQUN6Rix5QkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDO1lBRWhELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkIsQ0FBQztRQUlqRSxDQUFDO1FBRUQsZUFBZSxDQUFDLE9BQWtDO1lBRWpELG9DQUFvQztZQUNwQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXpDLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELFVBQVUsQ0FBQyxXQUF5QjtZQUNuQyxLQUFLLE1BQU0sZ0JBQWdCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLDJDQUFtQyxFQUFFLENBQUM7Z0JBQ2pHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDdkQsT0FBTyxnQkFBZ0IsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8sTUFBTSxDQUFDLFdBQXlCLEVBQUUsTUFBbUI7WUFDNUQsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDekMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7S0FDRCxDQUFBO0lBekNZLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBU3ZCLFdBQUEsOEJBQWMsQ0FBQTtPQVRmLHdCQUF3QixDQXlDcEM7SUFFRCxtQkFBbUI7SUFDbkIsSUFBQSw4QkFBaUIsRUFBQyxpQ0FBeUIsRUFBRSx3QkFBd0Isb0NBQTRCLENBQUMifQ==