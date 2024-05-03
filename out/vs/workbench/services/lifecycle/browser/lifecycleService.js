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
define(["require", "exports", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycleService", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/base/common/cancellation", "vs/base/browser/window", "vs/base/common/arrays"], function (require, exports, lifecycle_1, log_1, lifecycleService_1, nls_1, extensions_1, dom_1, storage_1, cancellation_1, window_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserLifecycleService = void 0;
    let BrowserLifecycleService = class BrowserLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(logService, storageService) {
            super(logService, storageService);
            this.beforeUnloadListener = undefined;
            this.unloadListener = undefined;
            this.ignoreBeforeUnload = false;
            this.didUnload = false;
            this.registerListeners();
        }
        registerListeners() {
            // Listen to `beforeUnload` to support to veto
            this.beforeUnloadListener = (0, dom_1.addDisposableListener)(window_1.mainWindow, dom_1.EventType.BEFORE_UNLOAD, (e) => this.onBeforeUnload(e));
            // Listen to `pagehide` to support orderly shutdown
            // We explicitly do not listen to `unload` event
            // which would disable certain browser caching.
            // We currently do not handle the `persisted` property
            // (https://github.com/microsoft/vscode/issues/136216)
            this.unloadListener = (0, dom_1.addDisposableListener)(window_1.mainWindow, dom_1.EventType.PAGE_HIDE, () => this.onUnload());
        }
        onBeforeUnload(event) {
            // Before unload ignored (once)
            if (this.ignoreBeforeUnload) {
                this.logService.info('[lifecycle] onBeforeUnload triggered but ignored once');
                this.ignoreBeforeUnload = false;
            }
            // Before unload with veto support
            else {
                this.logService.info('[lifecycle] onBeforeUnload triggered and handled with veto support');
                this.doShutdown(() => this.vetoBeforeUnload(event));
            }
        }
        vetoBeforeUnload(event) {
            event.preventDefault();
            event.returnValue = (0, nls_1.localize)('lifecycleVeto', "Changes that you made may not be saved. Please check press 'Cancel' and try again.");
        }
        withExpectedShutdown(reason, callback) {
            // Standard shutdown
            if (typeof reason === 'number') {
                this.shutdownReason = reason;
                // Ensure UI state is persisted
                return this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            }
            // Before unload handling ignored for duration of callback
            else {
                this.ignoreBeforeUnload = true;
                try {
                    callback?.();
                }
                finally {
                    this.ignoreBeforeUnload = false;
                }
            }
        }
        async shutdown() {
            this.logService.info('[lifecycle] shutdown triggered');
            // An explicit shutdown renders our unload
            // event handlers disabled, so dispose them.
            this.beforeUnloadListener?.dispose();
            this.unloadListener?.dispose();
            // Ensure UI state is persisted
            await this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            // Handle shutdown without veto support
            this.doShutdown();
        }
        doShutdown(vetoShutdown) {
            const logService = this.logService;
            // Optimistically trigger a UI state flush
            // without waiting for it. The browser does
            // not guarantee that this is being executed
            // but if a dialog opens, we have a chance
            // to succeed.
            this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            let veto = false;
            function handleVeto(vetoResult, id) {
                if (typeof vetoShutdown !== 'function') {
                    return; // veto handling disabled
                }
                if (vetoResult instanceof Promise) {
                    logService.error(`[lifecycle] Long running operations before shutdown are unsupported in the web (id: ${id})`);
                    veto = true; // implicitly vetos since we cannot handle promises in web
                }
                if (vetoResult === true) {
                    logService.info(`[lifecycle]: Unload was prevented (id: ${id})`);
                    veto = true;
                }
            }
            // Before Shutdown
            this._onBeforeShutdown.fire({
                reason: 2 /* ShutdownReason.QUIT */,
                veto(value, id) {
                    handleVeto(value, id);
                },
                finalVeto(valueFn, id) {
                    handleVeto(valueFn(), id); // in browser, trigger instantly because we do not support async anyway
                }
            });
            // Veto: handle if provided
            if (veto && typeof vetoShutdown === 'function') {
                return vetoShutdown();
            }
            // No veto, continue to shutdown
            return this.onUnload();
        }
        onUnload() {
            if (this.didUnload) {
                return; // only once
            }
            this.didUnload = true;
            // Register a late `pageshow` listener specifically on unload
            this._register((0, dom_1.addDisposableListener)(window_1.mainWindow, dom_1.EventType.PAGE_SHOW, (e) => this.onLoadAfterUnload(e)));
            // First indicate will-shutdown
            const logService = this.logService;
            this._onWillShutdown.fire({
                reason: 2 /* ShutdownReason.QUIT */,
                joiners: () => [], // Unsupported in web
                token: cancellation_1.CancellationToken.None, // Unsupported in web
                join(promise, joiner) {
                    logService.error(`[lifecycle] Long running operations during shutdown are unsupported in the web (id: ${joiner.id})`);
                },
                force: () => { },
            });
            // Finally end with did-shutdown
            this._onDidShutdown.fire();
        }
        onLoadAfterUnload(event) {
            // We only really care about page-show events
            // where the browser indicates to us that the
            // page was restored from cache and not freshly
            // loaded.
            const wasRestoredFromCache = event.persisted;
            if (!wasRestoredFromCache) {
                return;
            }
            // At this point, we know that the page was restored from
            // cache even though it was unloaded before,
            // so in order to get back to a functional workbench, we
            // currently can only reload the window
            // Docs: https://web.dev/bfcache/#optimize-your-pages-for-bfcache
            // Refs: https://github.com/microsoft/vscode/issues/136035
            this.withExpectedShutdown({ disableShutdownHandling: true }, () => window_1.mainWindow.location.reload());
        }
        doResolveStartupKind() {
            let startupKind = super.doResolveStartupKind();
            if (typeof startupKind !== 'number') {
                const timing = (0, arrays_1.firstOrDefault)(performance.getEntriesByType('navigation'));
                if (timing?.type === 'reload') {
                    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type#value
                    startupKind = 3 /* StartupKind.ReloadedWindow */;
                }
            }
            return startupKind;
        }
    };
    exports.BrowserLifecycleService = BrowserLifecycleService;
    exports.BrowserLifecycleService = BrowserLifecycleService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, storage_1.IStorageService)
    ], BrowserLifecycleService);
    (0, extensions_1.registerSingleton)(lifecycle_1.ILifecycleService, BrowserLifecycleService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xpZmVjeWNsZS9icm93c2VyL2xpZmVjeWNsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsMkNBQXdCO1FBU3BFLFlBQ2MsVUFBdUIsRUFDbkIsY0FBK0I7WUFFaEQsS0FBSyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztZQVgzQix5QkFBb0IsR0FBNEIsU0FBUyxDQUFDO1lBQzFELG1CQUFjLEdBQTRCLFNBQVMsQ0FBQztZQUVwRCx1QkFBa0IsR0FBRyxLQUFLLENBQUM7WUFFM0IsY0FBUyxHQUFHLEtBQUssQ0FBQztZQVF6QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBRXhCLDhDQUE4QztZQUM5QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBQSwyQkFBcUIsRUFBQyxtQkFBVSxFQUFFLGVBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFvQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekksbURBQW1EO1lBQ25ELGdEQUFnRDtZQUNoRCwrQ0FBK0M7WUFDL0Msc0RBQXNEO1lBQ3RELHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUEsMkJBQXFCLEVBQUMsbUJBQVUsRUFBRSxlQUFTLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7UUFFTyxjQUFjLENBQUMsS0FBd0I7WUFFOUMs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