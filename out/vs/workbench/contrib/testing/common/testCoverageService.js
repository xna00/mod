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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/services/views/common/viewsService"], function (require, exports, cancellation_1, lifecycle_1, observable_1, contextkey_1, instantiation_1, testResultService_1, testingContextKeys_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestCoverageService = exports.ITestCoverageService = void 0;
    exports.ITestCoverageService = (0, instantiation_1.createDecorator)('testCoverageService');
    let TestCoverageService = class TestCoverageService extends lifecycle_1.Disposable {
        constructor(contextKeyService, resultService, viewsService) {
            super();
            this.viewsService = viewsService;
            this.lastOpenCts = this._register(new lifecycle_1.MutableDisposable());
            this.selected = (0, observable_1.observableValue)('testCoverage', undefined);
            this._isOpenKey = testingContextKeys_1.TestingContextKeys.isTestCoverageOpen.bindTo(contextKeyService);
            this._register(resultService.onResultsChanged(evt => {
                if ('completed' in evt) {
                    const coverage = evt.completed.tasks.find(t => t.coverage.get());
                    if (coverage) {
                        this.openCoverage(coverage, false);
                    }
                    else {
                        this.closeCoverage();
                    }
                }
                else if ('removed' in evt && this.selected.get()) {
                    const taskId = this.selected.get()?.fromTaskId;
                    if (evt.removed.some(e => e.tasks.some(t => t.id === taskId))) {
                        this.closeCoverage();
                    }
                }
            }));
        }
        /** @inheritdoc */
        async openCoverage(task, focus = true) {
            this.lastOpenCts.value?.cancel();
            const cts = this.lastOpenCts.value = new cancellation_1.CancellationTokenSource();
            const coverage = task.coverage.get();
            if (!coverage) {
                return;
            }
            this.selected.set(coverage, undefined);
            this._isOpenKey.set(true);
            if (focus && !cts.token.isCancellationRequested) {
                this.viewsService.openView("workbench.view.testCoverage" /* Testing.CoverageViewId */, true);
            }
        }
        /** @inheritdoc */
        closeCoverage() {
            this._isOpenKey.set(false);
            this.selected.set(undefined, undefined);
        }
    };
    exports.TestCoverageService = TestCoverageService;
    exports.TestCoverageService = TestCoverageService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, testResultService_1.ITestResultService),
        __param(2, viewsService_1.IViewsService)
    ], TestCoverageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvdmVyYWdlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdENvdmVyYWdlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjbkYsUUFBQSxvQkFBb0IsR0FBRyxJQUFBLCtCQUFlLEVBQXVCLHFCQUFxQixDQUFDLENBQUM7SUFzQjFGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFPbEQsWUFDcUIsaUJBQXFDLEVBQ3JDLGFBQWlDLEVBQ3RDLFlBQTRDO1lBRTNELEtBQUssRUFBRSxDQUFDO1lBRndCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBUDNDLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUEyQixDQUFDLENBQUM7WUFFaEYsYUFBUSxHQUFHLElBQUEsNEJBQWUsRUFBMkIsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBUS9GLElBQUksQ0FBQyxVQUFVLEdBQUcsdUNBQWtCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFbEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ25ELElBQUksV0FBVyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUN4QixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ2pFLElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ2QsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3BDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLFNBQVMsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO29CQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLFVBQVUsQ0FBQztvQkFDL0MsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQy9ELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDdEIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxrQkFBa0I7UUFDWCxLQUFLLENBQUMsWUFBWSxDQUFDLElBQXlCLEVBQUUsS0FBSyxHQUFHLElBQUk7WUFDaEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDakMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO1lBQ25FLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTFCLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsNkRBQXlCLElBQUksQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDRixDQUFDO1FBRUQsa0JBQWtCO1FBQ1gsYUFBYTtZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDekMsQ0FBQztLQUNELENBQUE7SUF0RFksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFRN0IsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsNEJBQWEsQ0FBQTtPQVZILG1CQUFtQixDQXNEL0IifQ==