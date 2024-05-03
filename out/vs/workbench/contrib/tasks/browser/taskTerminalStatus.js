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
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/workbench/contrib/tasks/common/problemCollectors", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/markers/common/markers", "vs/platform/theme/common/iconRegistry", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, nls, codicons_1, lifecycle_1, severity_1, problemCollectors_1, taskService_1, markers_1, iconRegistry_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskTerminalStatus = exports.FAILED_TASK_STATUS = exports.SUCCEEDED_TASK_STATUS = exports.ACTIVE_TASK_STATUS = void 0;
    const TASK_TERMINAL_STATUS_ID = 'task_terminal_status';
    exports.ACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: iconRegistry_1.spinningLoading, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.active', "Task is running") };
    exports.SUCCEEDED_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.check, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.succeeded', "Task succeeded") };
    const SUCCEEDED_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.check, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.succeededInactive', "Task succeeded and waiting...") };
    exports.FAILED_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.error, severity: severity_1.default.Error, tooltip: nls.localize('taskTerminalStatus.errors', "Task has errors") };
    const FAILED_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.error, severity: severity_1.default.Error, tooltip: nls.localize('taskTerminalStatus.errorsInactive', "Task has errors and is waiting...") };
    const WARNING_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.warning, severity: severity_1.default.Warning, tooltip: nls.localize('taskTerminalStatus.warnings', "Task has warnings") };
    const WARNING_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.warning, severity: severity_1.default.Warning, tooltip: nls.localize('taskTerminalStatus.warningsInactive', "Task has warnings and is waiting...") };
    const INFO_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.info, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.infos', "Task has infos") };
    const INFO_INACTIVE_TASK_STATUS = { id: TASK_TERMINAL_STATUS_ID, icon: codicons_1.Codicon.info, severity: severity_1.default.Info, tooltip: nls.localize('taskTerminalStatus.infosInactive', "Task has infos and is waiting...") };
    let TaskTerminalStatus = class TaskTerminalStatus extends lifecycle_1.Disposable {
        constructor(taskService, _accessibilitySignalService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this.terminalMap = new Map();
            this._register(taskService.onDidStateChange((event) => {
                switch (event.kind) {
                    case "processStarted" /* TaskEventKind.ProcessStarted */:
                    case "active" /* TaskEventKind.Active */:
                        this.eventActive(event);
                        break;
                    case "inactive" /* TaskEventKind.Inactive */:
                        this.eventInactive(event);
                        break;
                    case "processEnded" /* TaskEventKind.ProcessEnded */:
                        this.eventEnd(event);
                        break;
                }
            }));
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const terminalData of this.terminalMap.values()) {
                    terminalData.disposeListener?.dispose();
                }
                this.terminalMap.clear();
            }));
        }
        addTerminal(task, terminal, problemMatcher) {
            const status = { id: TASK_TERMINAL_STATUS_ID, severity: severity_1.default.Info };
            terminal.statusList.add(status);
            this._register(problemMatcher.onDidFindFirstMatch(() => {
                this._marker = terminal.registerMarker();
                if (this._marker) {
                    this._register(this._marker);
                }
            }));
            this._register(problemMatcher.onDidFindErrors(() => {
                if (this._marker) {
                    terminal.addBufferMarker({ marker: this._marker, hoverMessage: nls.localize('task.watchFirstError', "Beginning of detected errors for this run"), disableCommandStorage: true });
                }
            }));
            this._register(problemMatcher.onDidRequestInvalidateLastMarker(() => {
                this._marker?.dispose();
                this._marker = undefined;
            }));
            this.terminalMap.set(terminal.instanceId, { terminal, task, status, problemMatcher, taskRunEnded: false });
        }
        terminalFromEvent(event) {
            if (!('terminalId' in event) || !event.terminalId) {
                return undefined;
            }
            return this.terminalMap.get(event.terminalId);
        }
        eventEnd(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData) {
                return;
            }
            terminalData.taskRunEnded = true;
            terminalData.terminal.statusList.remove(terminalData.status);
            if ((event.exitCode === 0) && (terminalData.problemMatcher.numberOfMatches === 0)) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskCompleted);
                if (terminalData.task.configurationProperties.isBackground) {
                    for (const status of terminalData.terminal.statusList.statuses) {
                        terminalData.terminal.statusList.remove(status);
                    }
                }
                else {
                    terminalData.terminal.statusList.add(exports.SUCCEEDED_TASK_STATUS);
                }
            }
            else if (event.exitCode || terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Error) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskFailed);
                terminalData.terminal.statusList.add(exports.FAILED_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Warning) {
                terminalData.terminal.statusList.add(WARNING_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Info) {
                terminalData.terminal.statusList.add(INFO_TASK_STATUS);
            }
        }
        eventInactive(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData || !terminalData.problemMatcher || terminalData.taskRunEnded) {
                return;
            }
            terminalData.terminal.statusList.remove(terminalData.status);
            if (terminalData.problemMatcher.numberOfMatches === 0) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskCompleted);
                terminalData.terminal.statusList.add(SUCCEEDED_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Error) {
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.taskFailed);
                terminalData.terminal.statusList.add(FAILED_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Warning) {
                terminalData.terminal.statusList.add(WARNING_INACTIVE_TASK_STATUS);
            }
            else if (terminalData.problemMatcher.maxMarkerSeverity === markers_1.MarkerSeverity.Info) {
                terminalData.terminal.statusList.add(INFO_INACTIVE_TASK_STATUS);
            }
        }
        eventActive(event) {
            const terminalData = this.terminalFromEvent(event);
            if (!terminalData) {
                return;
            }
            if (!terminalData.disposeListener) {
                terminalData.disposeListener = this._register(new lifecycle_1.MutableDisposable());
                terminalData.disposeListener.value = terminalData.terminal.onDisposed(() => {
                    if (!event.terminalId) {
                        return;
                    }
                    this.terminalMap.delete(event.terminalId);
                    terminalData.disposeListener?.dispose();
                });
            }
            terminalData.taskRunEnded = false;
            terminalData.terminal.statusList.remove(terminalData.status);
            // We don't want to show an infinite status for a background task that doesn't have a problem matcher.
            if ((terminalData.problemMatcher instanceof problemCollectors_1.StartStopProblemCollector) || (terminalData.problemMatcher?.problemMatchers.length > 0) || event.runType === "singleRun" /* TaskRunType.SingleRun */) {
                terminalData.terminal.statusList.add(exports.ACTIVE_TASK_STATUS);
            }
        }
    };
    exports.TaskTerminalStatus = TaskTerminalStatus;
    exports.TaskTerminalStatus = TaskTerminalStatus = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, accessibilitySignalService_1.IAccessibilitySignalService)
    ], TaskTerminalStatus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1Rlcm1pbmFsU3RhdHVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YXNrcy9icm93c2VyL3Rhc2tUZXJtaW5hbFN0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHLE1BQU0sdUJBQXVCLEdBQUcsc0JBQXNCLENBQUM7SUFDMUMsUUFBQSxrQkFBa0IsR0FBb0IsRUFBRSxFQUFFLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLDhCQUFlLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztJQUM3TCxRQUFBLHFCQUFxQixHQUFvQixFQUFFLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDhCQUE4QixFQUFFLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztJQUM3TSxNQUFNLDhCQUE4QixHQUFvQixFQUFFLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHNDQUFzQyxFQUFFLCtCQUErQixDQUFDLEVBQUUsQ0FBQztJQUN6TixRQUFBLGtCQUFrQixHQUFvQixFQUFFLEVBQUUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsS0FB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