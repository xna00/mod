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
define(["require", "exports", "vs/platform/telemetry/common/telemetry"], function (require, exports, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorTelemetry = void 0;
    let MergeEditorTelemetry = class MergeEditorTelemetry {
        constructor(telemetryService) {
            this.telemetryService = telemetryService;
        }
        reportMergeEditorOpened(args) {
            this.telemetryService.publicLog2('mergeEditor.opened', {
                conflictCount: args.conflictCount,
                combinableConflictCount: args.combinableConflictCount,
                baseVisible: args.baseVisible,
                isColumnView: args.isColumnView,
                baseTop: args.baseTop,
            });
        }
        reportLayoutChange(args) {
            this.telemetryService.publicLog2('mergeEditor.layoutChanged', {
                baseVisible: args.baseVisible,
                isColumnView: args.isColumnView,
                baseTop: args.baseTop,
            });
        }
        reportMergeEditorClosed(args) {
            this.telemetryService.publicLog2('mergeEditor.closed', {
                conflictCount: args.conflictCount,
                combinableConflictCount: args.combinableConflictCount,
                durationOpenedSecs: args.durationOpenedSecs,
                remainingConflictCount: args.remainingConflictCount,
                accepted: args.accepted,
                conflictsResolvedWithBase: args.conflictsResolvedWithBase,
                conflictsResolvedWithInput1: args.conflictsResolvedWithInput1,
                conflictsResolvedWithInput2: args.conflictsResolvedWithInput2,
                conflictsResolvedWithSmartCombination: args.conflictsResolvedWithSmartCombination,
                manuallySolvedConflictCountThatEqualNone: args.manuallySolvedConflictCountThatEqualNone,
                manuallySolvedConflictCountThatEqualSmartCombine: args.manuallySolvedConflictCountThatEqualSmartCombine,
                manuallySolvedConflictCountThatEqualInput1: args.manuallySolvedConflictCountThatEqualInput1,
                manuallySolvedConflictCountThatEqualInput2: args.manuallySolvedConflictCountThatEqualInput2,
                manuallySolvedConflictCountThatEqualNoneAndStartedWithBase: args.manuallySolvedConflictCountThatEqualNoneAndStartedWithBase,
                manuallySolvedConflictCountThatEqualNoneAndStartedWithInput1: args.manuallySolvedConflictCountThatEqualNoneAndStartedWithInput1,
                manuallySolvedConflictCountThatEqualNoneAndStartedWithInput2: args.manuallySolvedConflictCountThatEqualNoneAndStartedWithInput2,
                manuallySolvedConflictCountThatEqualNoneAndStartedWithBothNonSmart: args.manuallySolvedConflictCountThatEqualNoneAndStartedWithBothNonSmart,
                manuallySolvedConflictCountThatEqualNoneAndStartedWithBothSmart: args.manuallySolvedConflictCountThatEqualNoneAndStartedWithBothSmart,
            });
        }
        reportAcceptInvoked(inputNumber, otherAccepted) {
            this.telemetryService.publicLog2('mergeEditor.action.accept', {
                otherAccepted: otherAccepted,
                isInput1: inputNumber === 1,
            });
        }
        reportSmartCombinationInvoked(otherAccepted) {
            this.telemetryService.publicLog2('mergeEditor.action.smartCombination', {
                otherAccepted: otherAccepted,
            });
        }
        reportRemoveInvoked(inputNumber, otherAccepted) {
            this.telemetryService.publicLog2('mergeEditor.action.remove', {
                otherAccepted: otherAccepted,
                isInput1: inputNumber === 1,
            });
        }
        reportResetToBaseInvoked() {
            this.telemetryService.publicLog2('mergeEditor.action.resetToBase', {});
        }
        reportNavigationToNextConflict() {
            this.telemetryService.publicLog2('mergeEditor.action.goToNextConflict', {});
        }
        reportNavigationToPreviousConflict() {
            this.telemetryService.publicLog2('mergeEditor.action.goToPreviousConflict', {});
        }
        reportConflictCounterClicked() {
            this.telemetryService.publicLog2('mergeEditor.action.conflictCounterClicked', {});
        }
    };
    exports.MergeEditorTelemetry = MergeEditorTelemetry;
    exports.MergeEditorTelemetry = MergeEditorTelemetry = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], MergeEditorTelemetry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL3RlbGVtZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFJekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7UUFDaEMsWUFDcUMsZ0JBQW1DO1lBQW5DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7UUFDcEUsQ0FBQztRQUVMLHVCQUF1QixDQUFDLElBT3ZCO1lBQ0EsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FrQjdCLG9CQUFvQixFQUFFO2dCQUN4QixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7Z0JBQ2pDLHVCQUF1QixFQUFFLElBQUksQ0FBQyx1QkFBdUI7Z0JBRXJELFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO2dCQUMvQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87YUFDckIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGtCQUFrQixDQUFDLElBSWxCO1lBQ0EsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FZN0IsMkJBQTJCLEVBQUU7Z0JBQy9CLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO2dCQUMvQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87YUFDckIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELHVCQUF1QixDQUFDLElBdUJ2QjtZQUNBLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBa0Q3QixvQkFBb0IsRUFBRTtnQkFDeEIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO2dCQUNqQyx1QkFB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