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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/symbols", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/browser/widgets/widgetManager"], function (require, exports, dom, async_1, errors_1, lifecycle_1, symbols_1, instantiation_1, terminalCapabilityStore_1, terminalExtensions_1, widgetManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DetachedProcessInfo = exports.DetachedTerminal = void 0;
    let DetachedTerminal = class DetachedTerminal extends lifecycle_1.Disposable {
        get xterm() {
            return this._xterm;
        }
        constructor(_xterm, options, instantiationService) {
            super();
            this._xterm = _xterm;
            this._widgets = this._register(new widgetManager_1.TerminalWidgetManager());
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
            this._contributions = new Map();
            this._register(_xterm);
            // Initialize contributions
            const contributionDescs = terminalExtensions_1.TerminalExtensionsRegistry.getTerminalContributions();
            for (const desc of contributionDescs) {
                if (this._contributions.has(desc.id)) {
                    (0, errors_1.onUnexpectedError)(new Error(`Cannot have two terminal contributions with the same id ${desc.id}`));
                    continue;
                }
                if (desc.canRunInDetachedTerminals === false) {
                    continue;
                }
                let contribution;
                try {
                    contribution = instantiationService.createInstance(desc.ctor, this, options.processInfo, this._widgets);
                    this._contributions.set(desc.id, contribution);
                    this._register(contribution);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            // xterm is already by the time DetachedTerminal is created, so trigger everything
            // on the next microtask, allowing the caller to do any extra initialization
            this._register(new async_1.Delayer(symbols_1.MicrotaskDelay)).trigger(() => {
                for (const contr of this._contributions.values()) {
                    contr.xtermReady?.(this._xterm);
                }
            });
        }
        get selection() {
            return this._xterm && this.hasSelection() ? this._xterm.raw.getSelection() : undefined;
        }
        hasSelection() {
            return this._xterm.hasSelection();
        }
        clearSelection() {
            this._xterm.clearSelection();
        }
        focus(force) {
            if (force || !dom.getActiveWindow().getSelection()?.toString()) {
                this.xterm.focus();
            }
        }
        attachToElement(container, options) {
            this.domElement = container;
            const screenElement = this._xterm.attachToElement(container, options);
            this._widgets.attachToElement(screenElement);
        }
        forceScrollbarVisibility() {
            this.domElement?.classList.add('force-scrollbar');
        }
        resetScrollbarVisibility() {
            this.domElement?.classList.remove('force-scrollbar');
        }
        getContribution(id) {
            return this._contributions.get(id);
        }
    };
    exports.DetachedTerminal = DetachedTerminal;
    exports.DetachedTerminal = DetachedTerminal = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], DetachedTerminal);
    /**
     * Implements {@link ITerminalProcessInfo} for a detached terminal where most
     * properties are stubbed. Properties are mutable and can be updated by
     * the instantiator.
     */
    class DetachedProcessInfo {
        constructor(initialValues) {
            this.processState = 3 /* ProcessState.Running */;
            this.ptyProcessReady = Promise.resolve();
            this.initialCwd = '';
            this.shouldPersist = false;
            this.hasWrittenData = false;
            this.hasChildProcesses = false;
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
            this.shellIntegrationNonce = '';
            Object.assign(this, initialValues);
        }
    }
    exports.DetachedProcessInfo = DetachedProcessInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV0YWNoZWRUZXJtaW5hbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci9kZXRhY2hlZFRlcm1pbmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTtRQU8vQyxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELFlBQ2tCLE1BQXFCLEVBQ3RDLE9BQThCLEVBQ1Asb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBSlMsV0FBTSxHQUFOLE1BQU0sQ0FBZTtZQVh0QixhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHFDQUFxQixFQUFFLENBQUMsQ0FBQztZQUN4RCxpQkFBWSxHQUFHLElBQUksaURBQXVCLEVBQUUsQ0FBQztZQUM1QyxtQkFBYyxHQUF1QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBYy9FLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFdkIsMkJBQTJCO1lBQzNCLE1BQU0saUJBQWlCLEdBQUcsK0NBQTBCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNoRixLQUFLLE1BQU0sSUFBSSxJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3RDLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLElBQUEsMEJBQWlCLEVBQUMsSUFBSSxLQUFLLENBQUMsMkRBQTJELElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ25HLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxJ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