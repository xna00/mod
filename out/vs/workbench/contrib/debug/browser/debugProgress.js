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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/views/common/viewsService"], function (require, exports, event_1, lifecycle_1, progress_1, debug_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugProgressContribution = void 0;
    let DebugProgressContribution = class DebugProgressContribution {
        constructor(debugService, progressService, viewsService) {
            this.toDispose = [];
            let progressListener;
            const listenOnProgress = (session) => {
                if (progressListener) {
                    progressListener.dispose();
                    progressListener = undefined;
                }
                if (session) {
                    progressListener = session.onDidProgressStart(async (progressStartEvent) => {
                        const promise = new Promise(r => {
                            // Show progress until a progress end event comes or the session ends
                            const listener = event_1.Event.any(event_1.Event.filter(session.onDidProgressEnd, e => e.body.progressId === progressStartEvent.body.progressId), session.onDidEndAdapter)(() => {
                                listener.dispose();
                                r();
                            });
                        });
                        if (viewsService.isViewContainerVisible(debug_1.VIEWLET_ID)) {
                            progressService.withProgress({ location: debug_1.VIEWLET_ID }, () => promise);
                        }
                        const source = debugService.getAdapterManager().getDebuggerLabel(session.configuration.type);
                        progressService.withProgress({
                            location: 15 /* ProgressLocation.Notification */,
                            title: progressStartEvent.body.title,
                            cancellable: progressStartEvent.body.cancellable,
                            source,
                            delay: 500
                        }, progressStep => {
                            let total = 0;
                            const reportProgress = (progress) => {
                                let increment = undefined;
                                if (typeof progress.percentage === 'number') {
                                    increment = progress.percentage - total;
                                    total += increment;
                                }
                                progressStep.report({
                                    message: progress.message,
                                    increment,
                                    total: typeof increment === 'number' ? 100 : undefined,
                                });
                            };
                            if (progressStartEvent.body.message) {
                                reportProgress(progressStartEvent.body);
                            }
                            const progressUpdateListener = session.onDidProgressUpdate(e => {
                                if (e.body.progressId === progressStartEvent.body.progressId) {
                                    reportProgress(e.body);
                                }
                            });
                            return promise.then(() => progressUpdateListener.dispose());
                        }, () => session.cancel(progressStartEvent.body.progressId));
                    });
                }
            };
            this.toDispose.push(debugService.getViewModel().onDidFocusSession(listenOnProgress));
            listenOnProgress(debugService.getViewModel().focusedSession);
            this.toDispose.push(debugService.onWillNewSession(session => {
                if (!progressListener) {
                    listenOnProgress(session);
                }
            }));
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.DebugProgressContribution = DebugProgressContribution;
    exports.DebugProgressContribution = DebugProgressContribution = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, progress_1.IProgressService),
        __param(2, viewsService_1.IViewsService)
    ], DebugProgressContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdQcm9ncmVzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z1Byb2dyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUF5QjtRQUlyQyxZQUNnQixZQUEyQixFQUN4QixlQUFpQyxFQUNwQyxZQUEyQjtZQUxuQyxjQUFTLEdBQWtCLEVBQUUsQ0FBQztZQU9yQyxJQUFJLGdCQUF5QyxDQUFDO1lBQzlDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxPQUFrQyxFQUFFLEVBQUU7Z0JBQy9ELElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdEIsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzNCLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUMsa0JBQWtCLEVBQUMsRUFBRTt3QkFDeEUsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUU7NEJBQ3JDLHFFQUFxRTs0QkFDckUsTUFBTSxRQUFRLEdBQUcsYUFBSyxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLGtCQUFrQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFDL0gsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsRUFBRTtnQ0FDN0IsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dDQUNuQixDQUFDLEVBQUUsQ0FBQzs0QkFDTCxDQUFDLENBQUMsQ0FBQzt3QkFDTCxDQUFDLENBQUMsQ0FBQzt3QkFFSCxJQUFJLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxrQkFBVSxDQUFDLEVBQUUsQ0FBQzs0QkFDckQsZUFBZSxDQUFDLFlBQVksQ0FBQyxFQUFFLFFBQVEsRUFBRSxrQkFBVSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3ZFLENBQUM7d0JBQ0QsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDN0YsZUFBZSxDQUFDLFlBQVksQ0FBQzs0QkFDNUIsUUFBUSx3Q0FBK0I7NEJBQ3ZDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsS0FBSzs0QkFDcEMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxXQUFXOzRCQUNoRCxNQUFNOzRCQUNOLEtBQUssRUFBRSxHQUFHO3lCQUNWLEVBQUUsWUFBWSxDQUFDLEVBQUU7NEJBQ2pCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQzs0QkFDZCxNQUFNLGNBQWMsR0FBRyxDQUFDLFFBQW1ELEVBQUUsRUFBRTtnQ0FDOUUsSUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDO2dDQUMxQixJQUFJLE9BQU8sUUFBUSxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQ0FDN0MsU0FBUyxHQUFHLFFBQVEsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO29DQUN4QyxLQUFLLElBQUksU0FBUyxDQUFDO2dDQUNwQixDQUFDO2dDQUNELFlBQVksQ0FBQyxNQUFNLENBQUM7b0NBQ25CLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztvQ0FDekIsU0FBUztvQ0FDVCxLQUFLLEVBQUUsT0FBTyxTQUFTLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVM7aUNBQ3RELENBQUMsQ0FBQzs0QkFDSixDQUFDLENBQUM7NEJBRUYsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0NBQ3JDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDekMsQ0FBQzs0QkFDRCxNQUFNLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQ0FDOUQsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0NBQzlELGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ3hCLENBQUM7NEJBQ0YsQ0FBQyxDQUFDLENBQUM7NEJBRUgsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7d0JBQzdELENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUM5RCxDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUNyRixnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMzRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdkIsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU87WUFDTixJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7S0FDRCxDQUFBO0lBN0VZLDhEQUF5Qjt3Q0FBekIseUJBQXlCO1FBS25DLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSw0QkFBYSxDQUFBO09BUEgseUJBQXlCLENBNkVyQyJ9