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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/workbench/common/editor/textResourceEditorInput", "vs/editor/common/services/resolverService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/editor/common/languages/language", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/model", "vs/workbench/services/timer/browser/timerService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/codeEditor/browser/toggleWordWrap", "vs/base/common/amd", "vs/platform/product/common/productService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/common/platform", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/contrib/terminal/browser/terminal", "vs/editor/common/services/textResourceConfiguration", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/customEditorLabelService"], function (require, exports, nls_1, uri_1, textResourceEditorInput_1, resolverService_1, lifecycle_1, language_1, instantiation_1, model_1, timerService_1, extensions_1, lifecycle_2, codeEditorService_1, toggleWordWrap_1, amd_1, productService_1, textfiles_1, editorService_1, files_1, label_1, platform_1, filesConfigurationService_1, terminal_1, textResourceConfiguration_1, platform_2, contributions_1, customEditorLabelService_1) {
    "use strict";
    var PerfviewContrib_1, PerfviewInput_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PerfviewInput = exports.PerfviewContrib = void 0;
    let PerfviewContrib = class PerfviewContrib {
        static { PerfviewContrib_1 = this; }
        static get() {
            return (0, contributions_1.getWorkbenchContribution)(PerfviewContrib_1.ID);
        }
        static { this.ID = 'workbench.contrib.perfview'; }
        constructor(_instaService, textModelResolverService) {
            this._instaService = _instaService;
            this._inputUri = uri_1.URI.from({ scheme: 'perf', path: 'Startup Performance' });
            this._registration = textModelResolverService.registerTextModelContentProvider('perf', _instaService.createInstance(PerfModelContentProvider));
        }
        dispose() {
            this._registration.dispose();
        }
        getInputUri() {
            return this._inputUri;
        }
        getEditorInput() {
            return this._instaService.createInstance(PerfviewInput);
        }
    };
    exports.PerfviewContrib = PerfviewContrib;
    exports.PerfviewContrib = PerfviewContrib = PerfviewContrib_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, resolverService_1.ITextModelService)
    ], PerfviewContrib);
    let PerfviewInput = class PerfviewInput extends textResourceEditorInput_1.TextResourceEditorInput {
        static { PerfviewInput_1 = this; }
        static { this.Id = 'PerfviewInput'; }
        get typeId() {
            return PerfviewInput_1.Id;
        }
        constructor(textModelResolverService, textFileService, editorService, fileService, labelService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
            super(PerfviewContrib.get().getInputUri(), (0, nls_1.localize)('name', "Startup Performance"), undefined, undefined, undefined, textModelResolverService, textFileService, editorService, fileService, labelService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
        }
    };
    exports.PerfviewInput = PerfviewInput;
    exports.PerfviewInput = PerfviewInput = PerfviewInput_1 = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, editorService_1.IEditorService),
        __param(3, files_1.IFileService),
        __param(4, label_1.ILabelService),
        __param(5, filesConfigurationService_1.IFilesConfigurationService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, customEditorLabelService_1.ICustomEditorLabelService)
    ], PerfviewInput);
    let PerfModelContentProvider = class PerfModelContentProvider {
        constructor(_modelService, _languageService, _editorService, _lifecycleService, _timerService, _extensionService, _productService, _terminalService) {
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._editorService = _editorService;
            this._lifecycleService = _lifecycleService;
            this._timerService = _timerService;
            this._extensionService = _extensionService;
            this._productService = _productService;
            this._terminalService = _terminalService;
            this._modelDisposables = [];
        }
        provideTextContent(resource) {
            if (!this._model || this._model.isDisposed()) {
                (0, lifecycle_2.dispose)(this._modelDisposables);
                const langId = this._languageService.createById('markdown');
                this._model = this._modelService.getModel(resource) || this._modelService.createModel('Loading...', langId, resource);
                this._modelDisposables.push(langId.onDidChange(e => {
                    this._model?.setLanguage(e);
                }));
                this._modelDisposables.push(this._extensionService.onDidChangeExtensionsStatus(this._updateModel, this));
                (0, toggleWordWrap_1.writeTransientState)(this._model, { wordWrapOverride: 'off' }, this._editorService);
            }
            this._updateModel();
            return Promise.resolve(this._model);
        }
        _updateModel() {
            Promise.all([
                this._timerService.whenReady(),
                this._lifecycleService.when(4 /* LifecyclePhase.Eventually */),
                this._extensionService.whenInstalledExtensionsRegistered(),
                this._terminalService.whenConnected
            ]).then(() => {
                if (this._model && !this._model.isDisposed()) {
                    const stats = amd_1.LoaderStats.get();
                    const md = new MarkdownBuilder();
                    this._addSummary(md);
                    md.blank();
                    this._addSummaryTable(md, stats);
                    md.blank();
                    this._addExtensionsTable(md);
                    md.blank();
                    this._addPerfMarksTable('Terminal Stats', md, this._timerService.getPerformanceMarks().find(e => e[0] === 'renderer')?.[1].filter(e => e.name.startsWith('code/terminal/')));
                    md.blank();
                    this._addWorkbenchContributionsPerfMarksTable(md);
                    md.blank();
                    this._addRawPerfMarks(md);
                    if (!amd_1.isESM) {
                        md.blank();
                        this._addLoaderStats(md, stats);
                        md.blank();
                        this._addCachedDataStats(md);
                    }
                    md.blank();
                    this._addResourceTimingStats(md);
                    this._model.setValue(md.value);
                }
            });
        }
        _addSummary(md) {
            const metrics = this._timerService.startupMetrics;
            md.heading(2, 'System Info');
            md.li(`${this._productService.nameShort}: ${this._productService.version} (${this._productService.commit || '0000000'})`);
            md.li(`OS: ${metrics.platform}(${metrics.release})`);
            if (metrics.cpus) {
                md.li(`CPUs: ${metrics.cpus.model}(${metrics.cpus.count} x ${metrics.cpus.speed})`);
            }
            if (typeof metrics.totalmem === 'number' && typeof metrics.freemem === 'number') {
                md.li(`Memory(System): ${(metrics.totalmem / (files_1.ByteSize.GB)).toFixed(2)} GB(${(metrics.freemem / (files_1.ByteSize.GB)).toFixed(2)}GB free)`);
            }
            if (metrics.meminfo) {
                md.li(`Memory(Process): ${(metrics.meminfo.workingSetSize / files_1.ByteSize.KB).toFixed(2)} MB working set(${(metrics.meminfo.privateBytes / files_1.ByteSize.KB).toFixed(2)}MB private, ${(metrics.meminfo.sharedBytes / files_1.ByteSize.KB).toFixed(2)}MB shared)`);
            }
            md.li(`VM(likelihood): ${metrics.isVMLikelyhood}%`);
            md.li(`Initial Startup: ${metrics.initialStartup}`);
            md.li(`Has ${metrics.windowCount - 1} other windows`);
            md.li(`Screen Reader Active: ${metrics.hasAccessibilitySupport}`);
            md.li(`Empty Workspace: ${metrics.emptyWorkbench}`);
        }
        _addSummaryTable(md, stats) {
            const metrics = this._timerService.startupMetrics;
            const contribTimings = platform_2.Registry.as(contributions_1.Extensions.Workbench).timings;
            const table = [];
            table.push(['start => app.isReady', metrics.timers.ellapsedAppReady, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['nls:start => nls:end', metrics.timers.ellapsedNlsGeneration, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['require(main.bundle.js)', metrics.timers.ellapsedLoadMainBundle, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['start crash reporter', metrics.timers.ellapsedCrashReporter, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['serve main IPC handle', metrics.timers.ellapsedMainServer, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['create window', metrics.timers.ellapsedWindowCreate, '[main]', `initial startup: ${metrics.initialStartup}, ${metrics.initialStartup ? `state: ${metrics.timers.ellapsedWindowRestoreState}ms, widget: ${metrics.timers.ellapsedBrowserWindowCreate}ms, show: ${metrics.timers.ellapsedWindowMaximize}ms` : ''}`]);
            table.push(['app.isReady => window.loadUrl()', metrics.timers.ellapsedWindowLoad, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['window.loadUrl() => begin to require(workbench.desktop.main.js)', metrics.timers.ellapsedWindowLoadToRequire, '[main->renderer]', (0, lifecycle_1.StartupKindToString)(metrics.windowKind)]);
            table.push(['require(workbench.desktop.main.js)', metrics.timers.ellapsedRequire, '[renderer]', `cached data: ${(metrics.didUseCachedData ? 'YES' : 'NO')}${stats ? `, node_modules took ${stats.nodeRequireTotal}ms` : ''}`]);
            table.push(['wait for window config', metrics.timers.ellapsedWaitForWindowConfig, '[renderer]', undefined]);
            table.push(['init storage (global & workspace)', metrics.timers.ellapsedStorageInit, '[renderer]', undefined]);
            table.push(['init workspace service', metrics.timers.ellapsedWorkspaceServiceInit, '[renderer]', undefined]);
            if (platform_1.isWeb) {
                table.push(['init settings and global state from settings sync service', metrics.timers.ellapsedRequiredUserDataInit, '[renderer]', undefined]);
                table.push(['init keybindings, snippets & extensions from settings sync service', metrics.timers.ellapsedOtherUserDataInit, '[renderer]', undefined]);
            }
            table.push(['register extensions & spawn extension host', metrics.timers.ellapsedExtensions, '[renderer]', undefined]);
            table.push(['restore viewlet', metrics.timers.ellapsedViewletRestore, '[renderer]', metrics.viewletId]);
            table.push(['restore panel', metrics.timers.ellapsedPanelRestore, '[renderer]', metrics.panelId]);
            table.push(['restore & resolve visible editors', metrics.timers.ellapsedEditorRestore, '[renderer]', `${metrics.editorIds.length}: ${metrics.editorIds.join(', ')}`]);
            table.push(['create workbench contributions', metrics.timers.ellapsedWorkbenchContributions, '[renderer]', `${(contribTimings.get(1 /* LifecyclePhase.Starting */)?.length ?? 0) + (contribTimings.get(1 /* LifecyclePhase.Starting */)?.length ?? 0)} blocking startup`]);
            table.push(['overall workbench load', metrics.timers.ellapsedWorkbench, '[renderer]', undefined]);
            table.push(['workbench ready', metrics.ellapsed, '[main->renderer]', undefined]);
            table.push(['renderer ready', metrics.timers.ellapsedRenderer, '[renderer]', undefined]);
            table.push(['shared process connection ready', metrics.timers.ellapsedSharedProcesConnected, '[renderer->sharedprocess]', undefined]);
            table.push(['extensions registered', metrics.timers.ellapsedExtensionsReady, '[renderer]', undefined]);
            md.heading(2, 'Performance Marks');
            md.table(['What', 'Duration', 'Process', 'Info'], table);
        }
        _addExtensionsTable(md) {
            const eager = [];
            const normal = [];
            const extensionsStatus = this._extensionService.getExtensionsStatus();
            for (const id in extensionsStatus) {
                const { activationTimes: times } = extensionsStatus[id];
                if (!times) {
                    continue;
                }
                if (times.activationReason.startup) {
                    eager.push([id, times.activationReason.startup, times.codeLoadingTime, times.activateCallTime, times.activateResolvedTime, times.activationReason.activationEvent, times.activationReason.extensionId.value]);
                }
                else {
                    normal.push([id, times.activationReason.startup, times.codeLoadingTime, times.activateCallTime, times.activateResolvedTime, times.activationReason.activationEvent, times.activationReason.extensionId.value]);
                }
            }
            const table = eager.concat(normal);
            if (table.length > 0) {
                md.heading(2, 'Extension Activation Stats');
                md.table(['Extension', 'Eager', 'Load Code', 'Call Activate', 'Finish Activate', 'Event', 'By'], table);
            }
        }
        _addPerfMarksTable(name, md, marks) {
            if (!marks) {
                return;
            }
            const table = [];
            let lastStartTime = -1;
            let total = 0;
            for (const { name, startTime } of marks) {
                const delta = lastStartTime !== -1 ? startTime - lastStartTime : 0;
                total += delta;
                table.push([name, Math.round(startTime), Math.round(delta), Math.round(total)]);
                lastStartTime = startTime;
            }
            if (name) {
                md.heading(2, name);
            }
            md.table(['Name', 'Timestamp', 'Delta', 'Total'], table);
        }
        _addWorkbenchContributionsPerfMarksTable(md) {
            md.heading(2, 'Workbench Contributions Blocking Restore');
            const timings = platform_2.Registry.as(contributions_1.Extensions.Workbench).timings;
            md.li(`Total (LifecyclePhase.Starting): ${timings.get(1 /* LifecyclePhase.Starting */)?.length} (${timings.get(1 /* LifecyclePhase.Starting */)?.reduce((p, c) => p + c[1], 0)}ms)`);
            md.li(`Total (LifecyclePhase.Ready): ${timings.get(2 /* LifecyclePhase.Ready */)?.length} (${timings.get(2 /* LifecyclePhase.Ready */)?.reduce((p, c) => p + c[1], 0)}ms)`);
            md.blank();
            const marks = this._timerService.getPerformanceMarks().find(e => e[0] === 'renderer')?.[1].filter(e => e.name.startsWith('code/willCreateWorkbenchContribution/1') ||
                e.name.startsWith('code/didCreateWorkbenchContribution/1') ||
                e.name.startsWith('code/willCreateWorkbenchContribution/2') ||
                e.name.startsWith('code/didCreateWorkbenchContribution/2'));
            this._addPerfMarksTable(undefined, md, marks);
        }
        _addRawPerfMarks(md) {
            for (const [source, marks] of this._timerService.getPerformanceMarks()) {
                md.heading(2, `Raw Perf Marks: ${source}`);
                md.value += '```\n';
                md.value += `Name\tTimestamp\tDelta\tTotal\n`;
                let lastStartTime = -1;
                let total = 0;
                for (const { name, startTime } of marks) {
                    const delta = lastStartTime !== -1 ? startTime - lastStartTime : 0;
                    total += delta;
                    md.value += `${name}\t${startTime}\t${delta}\t${total}\n`;
                    lastStartTime = startTime;
                }
                md.value += '```\n';
            }
        }
        _addLoaderStats(md, stats) {
            md.heading(2, 'Loader Stats');
            md.heading(3, 'Load AMD-module');
            md.table(['Module', 'Duration'], stats.amdLoad);
            md.blank();
            md.heading(3, 'Load commonjs-module');
            md.table(['Module', 'Duration'], stats.nodeRequire);
            md.blank();
            md.heading(3, 'Invoke AMD-module factory');
            md.table(['Module', 'Duration'], stats.amdInvoke);
            md.blank();
            md.heading(3, 'Invoke commonjs-module');
            md.table(['Module', 'Duration'], stats.nodeEval);
        }
        _addCachedDataStats(md) {
            const map = new Map();
            map.set(63 /* LoaderEventType.CachedDataCreated */, []);
            map.set(60 /* LoaderEventType.CachedDataFound */, []);
            map.set(61 /* LoaderEventType.CachedDataMissed */, []);
            map.set(62 /* LoaderEventType.CachedDataRejected */, []);
            if (typeof require.getStats === 'function') {
                for (const stat of require.getStats()) {
                    if (map.has(stat.type)) {
                        map.get(stat.type).push(stat.detail);
                    }
                }
            }
            const printLists = (arr) => {
                if (arr) {
                    arr.sort();
                    for (const e of arr) {
                        md.li(`${e}`);
                    }
                    md.blank();
                }
            };
            md.heading(2, 'Node Cached Data Stats');
            md.blank();
            md.heading(3, 'cached data used');
            printLists(map.get(60 /* LoaderEventType.CachedDataFound */));
            md.heading(3, 'cached data missed');
            printLists(map.get(61 /* LoaderEventType.CachedDataMissed */));
            md.heading(3, 'cached data rejected');
            printLists(map.get(62 /* LoaderEventType.CachedDataRejected */));
            md.heading(3, 'cached data created (lazy, might need refreshes)');
            printLists(map.get(63 /* LoaderEventType.CachedDataCreated */));
        }
        _addResourceTimingStats(md) {
            const stats = performance.getEntriesByType('resource').map(entry => {
                return [entry.name, entry.duration];
            });
            if (!stats.length) {
                return;
            }
            md.heading(2, 'Resource Timing Stats');
            md.table(['Name', 'Duration'], stats);
        }
    };
    PerfModelContentProvider = __decorate([
        __param(0, model_1.IModelService),
        __param(1, language_1.ILanguageService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, timerService_1.ITimerService),
        __param(5, extensions_1.IExtensionService),
        __param(6, productService_1.IProductService),
        __param(7, terminal_1.ITerminalService)
    ], PerfModelContentProvider);
    class MarkdownBuilder {
        constructor() {
            this.value = '';
        }
        heading(level, value) {
            this.value += `${'#'.repeat(level)} ${value}\n\n`;
            return this;
        }
        blank() {
            this.value += '\n';
            return this;
        }
        li(value) {
            this.value += `* ${value}\n`;
            return this;
        }
        table(header, rows) {
            this.value += amd_1.LoaderStats.toMarkdownTable(header, rows);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZnZpZXdFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3BlcmZvcm1hbmNlL2Jyb3dzZXIvcGVyZnZpZXdFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStCekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZTs7UUFFM0IsTUFBTSxDQUFDLEdBQUc7WUFDVCxPQUFPLElBQUEsd0NBQXdCLEVBQWtCLGlCQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEUsQ0FBQztpQkFFZSxPQUFFLEdBQUcsNEJBQTRCLEFBQS9CLENBQWdDO1FBS2xELFlBQ3dCLGFBQXFELEVBQ3pELHdCQUEyQztZQUR0QixrQkFBYSxHQUFiLGFBQWEsQ0FBdUI7WUFKNUQsY0FBUyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7WUFPdEYsSUFBSSxDQUFDLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxnQ0FBZ0MsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7UUFDaEosQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxjQUFjO1lBQ2IsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6RCxDQUFDOztJQTVCVywwQ0FBZTs4QkFBZixlQUFlO1FBWXpCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FB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