/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/tasks/browser/taskTerminalStatus", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/terminal/browser/terminalStatusList"], function (require, exports, assert_1, event_1, lifecycle_1, utils_1, testConfigurationService_1, instantiationServiceMock_1, taskTerminalStatus_1, tasks_1, terminalStatusList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTaskService {
        constructor() {
            this._onDidStateChange = new event_1.Emitter();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        triggerStateChange(event) {
            this._onDidStateChange.fire(event);
        }
    }
    class TestaccessibilitySignalService {
        async playSignal(cue) {
            return;
        }
    }
    class TestTerminal extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.statusList = this._register(new terminalStatusList_1.TerminalStatusList(new testConfigurationService_1.TestConfigurationService()));
        }
        dispose() {
            super.dispose();
        }
    }
    class TestTask extends tasks_1.CommonTask {
        constructor() {
            super('test', undefined, undefined, {}, {}, { kind: '', label: '' });
        }
        getFolderId() {
            throw new Error('Method not implemented.');
        }
        fromObject(object) {
            throw new Error('Method not implemented.');
        }
    }
    class TestProblemCollector extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidFindFirstMatch = new event_1.Emitter();
            this.onDidFindFirstMatch = this._onDidFindFirstMatch.event;
            this._onDidFindErrors = new event_1.Emitter();
            this.onDidFindErrors = this._onDidFindErrors.event;
            this._onDidRequestInvalidateLastMarker = new event_1.Emitter();
            this.onDidRequestInvalidateLastMarker = this._onDidRequestInvalidateLastMarker.event;
        }
    }
    suite('Task Terminal Status', () => {
        let instantiationService;
        let taskService;
        let taskTerminalStatus;
        let testTerminal;
        let testTask;
        let problemCollector;
        let accessibilitySignalService;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            taskService = new TestTaskService();
            accessibilitySignalService = new TestaccessibilitySignalService();
            taskTerminalStatus = store.add(new taskTerminalStatus_1.TaskTerminalStatus(taskService, accessibilitySignalService));
            testTerminal = store.add(instantiationService.createInstance(TestTerminal));
            testTask = instantiationService.createInstance(TestTask);
            problemCollector = store.add(instantiationService.createInstance(TestProblemCollector));
        });
        test('Should add failed status when there is an exit code on task end', async () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "end" /* TaskEventKind.End */ });
            await poll(async () => Promise.resolve(), () => testTerminal?.statusList.primary?.id === taskTerminalStatus_1.FAILED_TASK_STATUS.id, 'terminal status should be updated');
        });
        test('Should add active status when a non-background task is run for a second time in the same terminal', () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */, runType: "singleRun" /* TaskRunType.SingleRun */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
        });
        test('Should drop status when a background task exits', async () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */, runType: "background" /* TaskRunType.Background */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "processEnded" /* TaskEventKind.ProcessEnded */, exitCode: 0 });
            await poll(async () => Promise.resolve(), () => testTerminal?.statusList.statuses?.includes(taskTerminalStatus_1.SUCCEEDED_TASK_STATUS) === false, 'terminal should have dropped status');
        });
        test('Should add succeeded status when a non-background task exits', () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */, runType: "singleRun" /* TaskRunType.SingleRun */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "processEnded" /* TaskEventKind.ProcessEnded */, exitCode: 0 });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
        });
    });
    function assertStatus(actual, expected) {
        (0, assert_1.ok)(actual.statuses.length === 1, '# of statuses');
        (0, assert_1.ok)(actual.primary?.id === expected.id, 'ID');
        (0, assert_1.ok)(actual.primary?.severity === expected.severity, 'Severity');
    }
    async function poll(fn, acceptFn, timeoutMessage, retryCount = 200, retryInterval = 10 // millis
    ) {
        let trial = 1;
        let lastError = '';
        while (true) {
            if (trial > retryCount) {
                throw new Error(`Timeout: ${timeoutMessage} after ${(retryCount * retryInterval) / 1000} seconds.\r${lastError}`);
            }
            let result;
            try {
                result = await fn();
                if (acceptFn(result)) {
                    return result;
                }
                else {
                    lastError = 'Did not pass accept function';
                }
            }
            catch (e) {
                lastError = Array.isArray(e.stack) ? e.stack.join('\n') : e.stack;
            }
            await new Promise(resolve => setTimeout(resolve, retryInterval));
            trial++;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1Rlcm1pbmFsU3RhdHVzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL3Rlc3QvYnJvd3Nlci90YXNrVGVybWluYWxTdGF0dXMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsTUFBTSxlQUFlO1FBQXJCO1lBQ2tCLHNCQUFpQixHQUF3QixJQUFJLGVBQU8sRUFBRSxDQUFDO1FBT3pFLENBQUM7UUFOQSxJQUFXLGdCQUFnQjtZQUMxQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUNNLGtCQUFrQixDQUFDLEtBQTBCO1lBQ25ELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBbUIsQ0FBQyxDQUFDO1FBQ2xELENBQUM7S0FDRDtJQUVELE1BQU0sOEJBQThCO1FBQ25DLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBd0I7WUFDeEMsT0FBTztRQUNSLENBQUM7S0FDRDtJQUVELE1BQU0sWUFBYSxTQUFRLHNCQUFVO1FBRXBDO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFGVCxlQUFVLEdBQXVCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBR3hHLENBQUM7UUFDUSxPQUFPO1lBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQUVELE1BQU0sUUFBUyxTQUFRLGtCQUFVO1FBRWhDO1lBQ0MsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUs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