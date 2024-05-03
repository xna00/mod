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
    exports.TextFileSaveParticipant = void 0;
    let TextFileSaveParticipant = class TextFileSaveParticipant extends lifecycle_1.Disposable {
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
        participate(model, context, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            return this.progressService.withProgress({
                title: (0, nls_1.localize)('saveParticipants', "Saving '{0}'", model.name),
                location: 15 /* ProgressLocation.Notification */,
                cancellable: true,
                delay: model.isDirty() ? 3000 : 5000
            }, async (progress) => {
                // undoStop before participation
                model.textEditorModel?.pushStackElement();
                for (const saveParticipant of this.saveParticipants) {
                    if (cts.token.isCancellationRequested || !model.textEditorModel /* disposed */) {
                        break;
                    }
                    try {
                        const promise = saveParticipant.participate(model, context, progress, cts.token);
                        await (0, async_1.raceCancellation)(promise, cts.token);
                    }
                    catch (err) {
                        this.logService.error(err);
                    }
                }
                // undoStop after participation
                model.textEditorModel?.pushStackElement();
            }, () => {
                // user cancel
                cts.cancel();
            }).finally(() => {
                cts.dispose();
            });
        }
        dispose() {
            this.saveParticipants.splice(0, this.saveParticipants.length);
            super.dispose();
        }
    };
    exports.TextFileSaveParticipant = TextFileSaveParticipant;
    exports.TextFileSaveParticipant = TextFileSaveParticipant = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, log_1.ILogService)
    ], TextFileSaveParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVTYXZlUGFydGljaXBhbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS9jb21tb24vdGV4dEZpbGVTYXZlUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFJdEQsWUFDbUIsZUFBa0QsRUFDdkQsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFIMkIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3RDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFKckMscUJBQWdCLEdBQStCLEVBQUUsQ0FBQztRQU9uRSxDQUFDO1FBRUQsa0JBQWtCLENBQUMsV0FBcUM7WUFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRTFELE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELFdBQVcsQ0FBQyxLQUEyQixFQUFFLE9BQXdDLEVBQUUsS0FBd0I7WUFDMUcsTUFBTSxHQUFHLEdBQUcsSUFBSSxzQ0FBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUvQyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDO2dCQUN4QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQy9ELFFBQVEsd0NBQStCO2dCQUN2QyxXQUFXLEVBQUUsSUFBSTtnQkFDakIsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO2FBQ3BDLEVBQUUsS0FBSyxFQUFDLFFBQVEsRUFBQyxFQUFFO2dCQUVuQixnQ0FBZ0M7Z0JBQ2hDLEtBQUssQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztnQkFFMUMsS0FBSyxNQUFNLGVBQWUsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDckQsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsQ0FBQzt3QkFDaEYsTUFBTTtvQkFDUCxDQUFDO29CQUVELElBQUksQ0FBQzt3QkFDSixNQUFNLE9BQU8sR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDakYsTUFBTSxJQUFBLHdCQUFnQixFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVDLENBQUM7b0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQzt3QkFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDNUIsQ0FBQztnQkFDRixDQUFDO2dCQUVELCtCQUErQjtnQkFDL0IsS0FBSyxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO1lBQzNDLENBQUMsRUFBRSxHQUFHLEVBQUU7Z0JBQ1AsY0FBYztnQkFDZCxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUNmLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFOUQsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRCxDQUFBO0lBMURZLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBS2pDLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxpQkFBVyxDQUFBO09BTkQsdUJBQXVCLENBMERuQyJ9