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
define(["require", "exports", "vs/base/common/performance", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/platform/update/common/update", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/platform", "vs/base/browser/defaultWorkerFactory", "vs/platform/registry/common/platform", "vs/platform/terminal/common/terminal"], function (require, exports, perf, instantiation_1, workspace_1, extensions_1, update_1, lifecycle_1, editorService_1, accessibility_1, telemetry_1, async_1, layoutService_1, panecomposite_1, telemetryUtils_1, platform_1, defaultWorkerFactory_1, platform_2, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimerService = exports.AbstractTimerService = exports.ITimerService = void 0;
    exports.ITimerService = (0, instantiation_1.createDecorator)('timerService');
    class PerfMarks {
        constructor() {
            this._entries = [];
        }
        setMarks(source, entries) {
            this._entries.push([source, entries]);
        }
        getDuration(from, to) {
            const fromEntry = this._findEntry(from);
            if (!fromEntry) {
                return 0;
            }
            const toEntry = this._findEntry(to);
            if (!toEntry) {
                return 0;
            }
            return toEntry.startTime - fromEntry.startTime;
        }
        _findEntry(name) {
            for (const [, marks] of this._entries) {
                for (let i = marks.length - 1; i >= 0; i--) {
                    if (marks[i].name === name) {
                        return marks[i];
                    }
                }
            }
        }
        getEntries() {
            return this._entries.slice(0);
        }
    }
    let AbstractTimerService = class AbstractTimerService {
        constructor(_lifecycleService, _contextService, _extensionService, _updateService, _paneCompositeService, _editorService, _accessibilityService, _telemetryService, layoutService) {
            this._lifecycleService = _lifecycleService;
            this._contextService = _contextService;
            this._extensionService = _extensionService;
            this._updateService = _updateService;
            this._paneCompositeService = _paneCompositeService;
            this._editorService = _editorService;
            this._accessibilityService = _accessibilityService;
            this._telemetryService = _telemetryService;
            this._barrier = new async_1.Barrier();
            this._marks = new PerfMarks();
            this._rndValueShouldSendTelemetry = Math.random() < .05; // 5% of users
            Promise.all([
                this._extensionService.whenInstalledExtensionsRegistered(), // extensions registered
                _lifecycleService.when(3 /* LifecyclePhase.Restored */), // workbench created and parts restored
                layoutService.whenRestored, // layout restored (including visible editors resolved)
                Promise.all(Array.from(platform_2.Registry.as(terminal_1.TerminalExtensions.Backend).backends.values()).map(e => e.whenReady))
            ]).then(() => {
                // set perf mark from renderer
                this.setPerformanceMarks('renderer', perf.getMarks());
                return this._computeStartupMetrics();
            }).then(metrics => {
                this._startupMetrics = metrics;
                this._reportStartupTimes(metrics);
                this._barrier.open();
            });
            this.perfBaseline = this._barrier.wait()
                .then(() => this._lifecycleService.when(4 /* LifecyclePhase.Eventually */))
                .then(() => (0, async_1.timeout)(this._startupMetrics.timers.ellapsedRequire))
                .then(() => {
                // we use fibonacci numbers to have a performance baseline that indicates
                // how slow/fast THIS machine actually is.
                const jsSrc = (function () {
                    // the following operation took ~16ms (one frame at 64FPS) to complete on my machine. We derive performance observations
                    // from that. We also bail if that took too long (>1s)
                    let tooSlow = false;
                    function fib(n) {
                        if (tooSlow) {
                            return 0;
                        }
                        if (performance.now() - t1 >= 1000) {
                            tooSlow = true;
                        }
                        if (n <= 2) {
                            return n;
                        }
                        return fib(n - 1) + fib(n - 2);
                    }
                    const t1 = performance.now();
                    fib(24);
                    const value = Math.round(performance.now() - t1);
                    // eslint-disable-next-line no-restricted-globals
                    postMessage({ value: tooSlow ? -1 : value });
                }).toString();
                const blob = new Blob([`(${jsSrc})();`], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                const worker = (0, defaultWorkerFactory_1.createBlobWorker)(blobUrl, { name: 'perfBaseline' });
                return new Promise(resolve => {
                    worker.onmessage = e => resolve(e.data.value);
                }).finally(() => {
                    worker.terminate();
                    URL.revokeObjectURL(blobUrl);
                });
            });
        }
        whenReady() {
            return this._barrier.wait();
        }
        get startupMetrics() {
            if (!this._startupMetrics) {
                throw new Error('illegal state, MUST NOT access startupMetrics before whenReady has resolved');
            }
            return this._startupMetrics;
        }
        setPerformanceMarks(source, marks) {
            // Perf marks are a shared resource because anyone can generate them
            // and because of that we only accept marks that start with 'code/'
            const codeMarks = marks.filter(mark => mark.name.startsWith('code/'));
            this._marks.setMarks(source, codeMarks);
            this._reportPerformanceMarks(source, codeMarks);
        }
        getPerformanceMarks() {
            return this._marks.getEntries();
        }
        getDuration(from, to) {
            return this._marks.getDuration(from, to);
        }
        _reportStartupTimes(metrics) {
            // report IStartupMetrics as telemetry
            /* __GDPR__
                "startupTimeVaried" : {
                    "owner": "jrieken",
                    "${include}": [
                        "${IStartupMetrics}"
                    ]
                }
            */
            this._telemetryService.publicLog('startupTimeVaried', metrics);
        }
        _shouldReportPerfMarks() {
            return this._rndValueShouldSendTelemetry;
        }
        _reportPerformanceMarks(source, marks) {
            if (!this._shouldReportPerfMarks()) {
                // the `startup.timer.mark` event is send very often. In order to save resources
                // we let some of our instances/sessions send this event
                return;
            }
            for (const mark of marks) {
                this._telemetryService.publicLog2('startup.timer.mark', {
                    source,
                    name: new telemetryUtils_1.TelemetryTrustedValue(mark.name),
                    startTime: mark.startTime
                });
            }
        }
        async _computeStartupMetrics() {
            const initialStartup = this._isInitialStartup();
            let startMark;
            if (platform_1.isWeb) {
                startMark = 'code/timeOrigin';
            }
            else {
                startMark = initialStartup ? 'code/didStartMain' : 'code/willOpenNewWindow';
            }
            const activeViewlet = this._paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            const activePanel = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            const info = {
                version: 2,
                ellapsed: this._marks.getDuration(startMark, 'code/didStartWorkbench'),
                // reflections
                isLatestVersion: Boolean(await this._updateService.isLatestVersion()),
                didUseCachedData: this._didUseCachedData(),
                windowKind: this._lifecycleService.startupKind,
                windowCount: await this._getWindowCount(),
                viewletId: activeViewlet?.getId(),
                editorIds: this._editorService.visibleEditors.map(input => input.typeId),
                panelId: activePanel ? activePanel.getId() : undefined,
                // timers
                timers: {
                    ellapsedAppReady: initialStartup ? this._marks.getDuration('code/didStartMain', 'code/mainAppReady') : undefined,
                    ellapsedNlsGeneration: initialStartup ? this._marks.getDuration('code/willGenerateNls', 'code/didGenerateNls') : undefined,
                    ellapsedLoadMainBundle: initialStartup ? this._marks.getDuration('code/willLoadMainBundle', 'code/didLoadMainBundle') : undefined,
                    ellapsedCrashReporter: initialStartup ? this._marks.getDuration('code/willStartCrashReporter', 'code/didStartCrashReporter') : undefined,
                    ellapsedMainServer: initialStartup ? this._marks.getDuration('code/willStartMainServer', 'code/didStartMainServer') : undefined,
                    ellapsedWindowCreate: initialStartup ? this._marks.getDuration('code/willCreateCodeWindow', 'code/didCreateCodeWindow') : undefined,
                    ellapsedWindowRestoreState: initialStartup ? this._marks.getDuration('code/willRestoreCodeWindowState', 'code/didRestoreCodeWindowState') : undefined,
                    ellapsedBrowserWindowCreate: initialStartup ? this._marks.getDuration('code/willCreateCodeBrowserWindow', 'code/didCreateCodeBrowserWindow') : undefined,
                    ellapsedWindowMaximize: initialStartup ? this._marks.getDuration('code/willMaximizeCodeWindow', 'code/didMaximizeCodeWindow') : undefined,
                    ellapsedWindowLoad: initialStartup ? this._marks.getDuration('code/mainAppReady', 'code/willOpenNewWindow') : undefined,
                    ellapsedWindowLoadToRequire: this._marks.getDuration('code/willOpenNewWindow', 'code/willLoadWorkbenchMain'),
                    ellapsedRequire: this._marks.getDuration('code/willLoadWorkbenchMain', 'code/didLoadWorkbenchMain'),
                    ellapsedWaitForWindowConfig: this._marks.getDuration('code/willWaitForWindowConfig', 'code/didWaitForWindowConfig'),
                    ellapsedStorageInit: this._marks.getDuration('code/willInitStorage', 'code/didInitStorage'),
                    ellapsedSharedProcesConnected: this._marks.getDuration('code/willConnectSharedProcess', 'code/didConnectSharedProcess'),
                    ellapsedWorkspaceServiceInit: this._marks.getDuration('code/willInitWorkspaceService', 'code/didInitWorkspaceService'),
                    ellapsedRequiredUserDataInit: this._marks.getDuration('code/willInitRequiredUserData', 'code/didInitRequiredUserData'),
                    ellapsedOtherUserDataInit: this._marks.getDuration('code/willInitOtherUserData', 'code/didInitOtherUserData'),
                    ellapsedExtensions: this._marks.getDuration('code/willLoadExtensions', 'code/didLoadExtensions'),
                    ellapsedEditorRestore: this._marks.getDuration('code/willRestoreEditors', 'code/didRestoreEditors'),
                    ellapsedViewletRestore: this._marks.getDuration('code/willRestoreViewlet', 'code/didRestoreViewlet'),
                    ellapsedPanelRestore: this._marks.getDuration('code/willRestorePanel', 'code/didRestorePanel'),
                    ellapsedWorkbenchContributions: this._marks.getDuration('code/willCreateWorkbenchContributions/1', 'code/didCreateWorkbenchContributions/2'),
                    ellapsedWorkbench: this._marks.getDuration('code/willStartWorkbench', 'code/didStartWorkbench'),
                    ellapsedExtensionsReady: this._marks.getDuration(startMark, 'code/didLoadExtensions'),
                    ellapsedRenderer: this._marks.getDuration('code/didStartRenderer', 'code/didStartWorkbench')
                },
                // system info
                platform: undefined,
                release: undefined,
                arch: undefined,
                totalmem: undefined,
                freemem: undefined,
                meminfo: undefined,
                cpus: undefined,
                loadavg: undefined,
                isVMLikelyhood: undefined,
                initialStartup,
                hasAccessibilitySupport: this._accessibilityService.isScreenReaderOptimized(),
                emptyWorkbench: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */
            };
            await this._extendStartupInfo(info);
            return info;
        }
    };
    exports.AbstractTimerService = AbstractTimerService;
    exports.AbstractTimerService = AbstractTimerService = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, extensions_1.IExtensionService),
        __param(3, update_1.IUpdateService),
        __param(4, panecomposite_1.IPaneCompositePartService),
        __param(5, editorService_1.IEditorService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, layoutService_1.IWorkbenchLayoutService)
    ], AbstractTimerService);
    class TimerService extends AbstractTimerService {
        _isInitialStartup() {
            return false;
        }
        _didUseCachedData() {
            return false;
        }
        async _getWindowCount() {
            return 1;
        }
        async _extendStartupInfo(info) {
            info.isVMLikelyhood = 0;
            info.isARM64Emulated = false;
            info.platform = navigator.userAgent;
            info.release = navigator.appVersion;
        }
    }
    exports.TimerService = TimerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGltZXIvYnJvd3Nlci90aW1lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK2JuRixRQUFBLGFBQWEsR0FBRyxJQUFBLCtCQUFlLEVBQWdCLGNBQWMsQ0FBQyxDQUFDO0lBRzVFLE1BQU0sU0FBUztRQUFmO1lBRWtCLGFBQVEsR0FBdUMsRUFBRSxDQUFDO1FBK0JwRSxDQUFDO1FBN0JBLFFBQVEsQ0FBQyxNQUFjLEVBQUUsT0FBK0I7WUFDdkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsV0FBVyxDQUFDLElBQVksRUFBRSxFQUFVO1lBQ25DLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFDRCxPQUFPLE9BQU8sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQztRQUNoRCxDQUFDO1FBRU8sVUFBVSxDQUFDLElBQVk7WUFDOUIsS0FBSyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3ZDLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxD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