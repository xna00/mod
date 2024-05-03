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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/marshalling", "vs/editor/browser/services/bulkEditService", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, buffer_1, marshalling_1, bulkEditService_1, log_1, uriIdentity_1, extHost_protocol_1, bulkCellEdits_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadBulkEdits = void 0;
    exports.reviveWorkspaceEditDto = reviveWorkspaceEditDto;
    let MainThreadBulkEdits = class MainThreadBulkEdits {
        constructor(_extHostContext, _bulkEditService, _logService, _uriIdentService) {
            this._bulkEditService = _bulkEditService;
            this._logService = _logService;
            this._uriIdentService = _uriIdentService;
        }
        dispose() { }
        $tryApplyWorkspaceEdit(dto, undoRedoGroupId, isRefactoring) {
            const edits = reviveWorkspaceEditDto(dto, this._uriIdentService);
            return this._bulkEditService.apply(edits, { undoRedoGroupId, respectAutoSaveConfig: isRefactoring }).then((res) => res.isApplied, err => {
                this._logService.warn(`IGNORING workspace edit: ${err}`);
                return false;
            });
        }
    };
    exports.MainThreadBulkEdits = MainThreadBulkEdits;
    exports.MainThreadBulkEdits = MainThreadBulkEdits = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadBulkEdits),
        __param(1, bulkEditService_1.IBulkEditService),
        __param(2, log_1.ILogService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], MainThreadBulkEdits);
    function reviveWorkspaceEditDto(data, uriIdentityService, resolveDataTransferFile) {
        if (!data || !data.edits) {
            return data;
        }
        const result = (0, marshalling_1.revive)(data);
        for (const edit of result.edits) {
            if (bulkEditService_1.ResourceTextEdit.is(edit)) {
                edit.resource = uriIdentityService.asCanonicalUri(edit.resource);
            }
            if (bulkEditService_1.ResourceFileEdit.is(edit)) {
                if (edit.options) {
                    const inContents = edit.options?.contents;
                    if (inContents) {
                        if (inContents.type === 'base64') {
                            edit.options.contents = Promise.resolve((0, buffer_1.decodeBase64)(inContents.value));
                        }
                        else {
                            if (resolveDataTransferFile) {
                                edit.options.contents = resolveDataTransferFile(inContents.id);
                            }
                            else {
                                throw new Error('Could not revive data transfer file');
                            }
                        }
                    }
                }
                edit.newResource = edit.newResource && uriIdentityService.asCanonicalUri(edit.newResource);
                edit.oldResource = edit.oldResource && uriIdentityService.asCanonicalUri(edit.oldResource);
            }
            if (bulkCellEdits_1.ResourceNotebookCellEdit.is(edit)) {
                edit.resource = uriIdentityService.asCanonicalUri(edit.resource);
            }
        }
        return data;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEJ1bGtFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRCdWxrRWRpdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0NoRyx3REFnQ0M7SUF0RE0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7UUFFL0IsWUFDQyxlQUFnQyxFQUNHLGdCQUFrQyxFQUN2QyxXQUF3QixFQUNoQixnQkFBcUM7WUFGeEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUN2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNoQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXFCO1FBQ3hFLENBQUM7UUFFTCxPQUFPLEtBQVcsQ0FBQztRQUVuQixzQkFBc0IsQ0FBQyxHQUFzQixFQUFFLGVBQXdCLEVBQUUsYUFBdUI7WUFDL0YsTUFBTSxLQUFLLEdBQUcsc0JBQXNCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2pFLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxlQUFlLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQ3ZJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLDRCQUE0QixHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUFsQlksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFEL0IsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDO1FBS25ELFdBQUEsa0NBQWdCLENBQUE7UUFDaEIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSxpQ0FBbUIsQ0FBQTtPQU5ULG1CQUFtQixDQWtCL0I7SUFJRCxTQUFnQixzQkFBc0IsQ0FBQyxJQUFtQyxFQUFFLGtCQUF1QyxFQUFFLHVCQUEyRDtRQUMvSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzFCLE9BQXNCLElBQUksQ0FBQztRQUM1QixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSxvQkFBTSxFQUFnQixJQUFJLENBQUMsQ0FBQztRQUMzQyxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNqQyxJQUFJLGtDQUFnQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEUsQ0FBQztZQUNELElBQUksa0NBQWdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNsQixNQUFNLFVBQVUsR0FBSSxJQUE4QixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUM7b0JBQ3JFLElBQUksVUFBVSxFQUFFLENBQUM7d0JBQ2hCLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQzs0QkFDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFBLHFCQUFZLEVBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ3pFLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLHVCQUF1QixFQUFFLENBQUM7Z0NBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFDaEUsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQzs0QkFDeEQsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLElBQUksa0JBQWtCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDM0YsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDNUYsQ0FBQztZQUNELElBQUksd0NBQXdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxRQUFRLEdBQUcsa0JBQWtCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRSxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQXNCLElBQUksQ0FBQztJQUM1QixDQUFDIn0=