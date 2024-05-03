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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/remote/common/remoteExplorerService"], function (require, exports, lifecycle_1, environmentService_1, remoteExplorerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowCandidateContribution = void 0;
    let ShowCandidateContribution = class ShowCandidateContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.showPortCandidate'; }
        constructor(remoteExplorerService, environmentService) {
            super();
            const showPortCandidate = environmentService.options?.tunnelProvider?.showPortCandidate;
            if (showPortCandidate) {
                this._register(remoteExplorerService.setCandidateFilter(async (candidates) => {
                    const filters = await Promise.all(candidates.map(candidate => showPortCandidate(candidate.host, candidate.port, candidate.detail ?? '')));
                    const filteredCandidates = [];
                    if (filters.length !== candidates.length) {
                        return candidates;
                    }
                    for (let i = 0; i < candidates.length; i++) {
                        if (filters[i]) {
                            filteredCandidates.push(candidates[i]);
                        }
                    }
                    return filteredCandidates;
                }));
            }
        }
    };
    exports.ShowCandidateContribution = ShowCandidateContribution;
    exports.ShowCandidateContribution = ShowCandidateContribution = __decorate([
        __param(0, remoteExplorerService_1.IRemoteExplorerService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], ShowCandidateContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hvd0NhbmRpZGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2Jyb3dzZXIvc2hvd0NhbmRpZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTtpQkFFeEMsT0FBRSxHQUFHLHFDQUFxQyxBQUF4QyxDQUF5QztRQUUzRCxZQUN5QixxQkFBNkMsRUFDaEMsa0JBQXVEO1lBRTVGLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixDQUFDO1lBQ3hGLElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsVUFBMkIsRUFBNEIsRUFBRTtvQkFDdkgsTUFBTSxPQUFPLEdBQWMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JKLE1BQU0sa0JBQWtCLEdBQW9CLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDMUMsT0FBTyxVQUFVLENBQUM7b0JBQ25CLENBQUM7b0JBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDNUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDaEIsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN4QyxDQUFDO29CQUNGLENBQUM7b0JBQ0QsT0FBTyxrQkFBa0IsQ0FBQztnQkFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDOztJQXpCVyw4REFBeUI7d0NBQXpCLHlCQUF5QjtRQUtuQyxXQUFBLDhDQUFzQixDQUFBO1FBQ3RCLFdBQUEsd0RBQW1DLENBQUE7T0FOekIseUJBQXlCLENBMEJyQyJ9