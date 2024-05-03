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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/base/common/lifecycle", "vs/base/common/arrays"], function (require, exports, nls_1, async_1, cancellation_1, log_1, progress_1, lifecycle_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredFileWorkingCopySaveParticipant = void 0;
    let StoredFileWorkingCopySaveParticipant = class StoredFileWorkingCopySaveParticipant extends lifecycle_1.Disposable {
        get length() { return this.saveParticipants.length; }
        constructor(progressService, logService) {
            super();
            this.progressService = progressService;
            this.logService = logService;
            this.saveParticipants = [];
        }
        addSaveParticipant(participant) {
            const remove = (0, arrays_1.insert)(this.saveParticipants, participant);
            return (0, lifecycle_1.toDisposable)(() => remove());
        }
        participate(workingCopy, context, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            return this.progressService.withProgress({
                title: (0, nls_1.localize)('saveParticipants', "Saving '{0}'", workingCopy.name),
                location: 15 /* ProgressLocation.Notification */,
                cancellable: true,
                delay: workingCopy.isDirty() ? 3000 : 5000
            }, async (progress) => {
                // undoStop before participation
                workingCopy.model?.pushStackElement();
                for (const saveParticipant of this.saveParticipants) {
                    if (cts.token.isCancellationRequested || workingCopy.isDisposed()) {
                        break;
                    }
                    try {
                        const promise = saveParticipant.participate(workingCopy, context, progress, cts.token);
                        await (0, async_1.raceCancellation)(promise, cts.token);
                    }
                    catch (err) {
                        this.logService.warn(err);
                    }
                }
                // undoStop after participation
                workingCopy.model?.pushStackElement();
                // Cleanup
                cts.dispose();
            }, () => {
                // user cancel
                cts.dispose(true);
            });
        }
        dispose() {
            this.saveParticipants.splice(0, this.saveParticipants.length);
            super.dispose();
        }
    };
    exports.StoredFileWorkingCopySaveParticipant = StoredFileWorkingCopySaveParticipant;
    exports.StoredFileWorkingCopySaveParticipant = StoredFileWorkingCopySaveParticipant = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, log_1.ILogService)
    ], StoredFileWorkingCopySaveParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVkRmlsZVdvcmtpbmdDb3B5U2F2ZVBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3N0b3JlZEZpbGVXb3JraW5nQ29weVNhdmVQYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxvQ0FBb0MsR0FBMUMsTUFBTSxvQ0FBcUMsU0FBUSxzQkFBVTtRQUluRSxJQUFJLE1BQU0sS0FBYSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRTdELFlBQ21CLGVBQWtELEVBQ3ZELFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSDJCLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUN0QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBTnJDLHFCQUFnQixHQUE0QyxFQUFFLENBQUM7UUFTaEYsQ0FBQztRQUVELGtCQUFrQixDQUFDLFdBQWtEO1lBQ3BFLE1BQU0sTUFBTSxHQUFHLElBQUEsZUFBTSxFQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUUxRCxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxXQUFXLENBQUMsV0FBZ0UsRUFBRSxPQUFxRCxFQUFFLEtBQXdCO1lBQzVKLE1BQU0sR0FBRyxHQUFHLElBQUksc0NBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFL0MsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQztnQkFDeEMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDO2dCQUNyRSxRQUFRLHdDQUErQjtnQkFDdkMsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLEtBQUssRUFBRSxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSTthQUMxQyxFQUFFLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRTtnQkFFbkIsZ0NBQWdDO2dCQUNoQyxXQUFXLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLENBQUM7Z0JBRXRDLEtBQUssTUFBTSxlQUFlLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQ3JELElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsSUFBSSxXQUFXLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQzt3QkFDbkUsTUFBTTtvQkFDUCxDQUFDO29CQUVELElBQUksQ0FBQzt3QkFDSixNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDdkYsTUFBTSxJQUFBLHdCQUFnQixFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVDLENBQUM7b0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzt3QkFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0IsQ0FBQztnQkFDRixDQUFDO2dCQUVELCtCQUErQjtnQkFDL0IsV0FBVyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUV0QyxVQUFVO2dCQUNWLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLENBQUMsRUFBRSxHQUFHLEVBQUU7Z0JBQ1AsY0FBYztnQkFDZCxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUQsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRCxDQUFBO0lBN0RZLG9GQUFvQzttREFBcEMsb0NBQW9DO1FBTzlDLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxpQkFBVyxDQUFBO09BUkQsb0NBQW9DLENBNkRoRCJ9