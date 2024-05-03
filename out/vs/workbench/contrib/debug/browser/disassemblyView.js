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
define(["require", "exports", "vs/base/browser/pixelRatio", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/uri", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/editorBrowser", "vs/editor/common/config/fontInfo", "vs/editor/common/core/range", "vs/editor/common/core/stringBuilder", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/debug/browser/callStackEditorContribution", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/services/editor/common/editorService"], function (require, exports, pixelRatio_1, dom_1, arrays_1, event_1, lifecycle_1, path_1, uri_1, domFontInfo_1, editorBrowser_1, fontInfo_1, range_1, stringBuilder_1, resolverService_1, nls_1, configuration_1, contextkey_1, instantiation_1, listService_1, log_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, uriIdentity_1, editorPane_1, callStackEditorContribution_1, icons, debug_1, debugModel_1, debugSource_1, debugUtils_1, editorService_1) {
    "use strict";
    var DisassemblyView_1, BreakpointRenderer_1, InstructionRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisassemblyViewContribution = exports.DisassemblyView = void 0;
    // Special entry as a placeholer when disassembly is not available
    const disassemblyNotAvailable = {
        allowBreakpoint: false,
        isBreakpointSet: false,
        isBreakpointEnabled: false,
        instructionReference: '',
        instructionOffset: 0,
        instructionReferenceOffset: 0,
        address: 0n,
        instruction: {
            address: '-1',
            instruction: (0, nls_1.localize)('instructionNotAvailable', "Disassembly not available.")
        },
    };
    let DisassemblyView = class DisassemblyView extends editorPane_1.EditorPane {
        static { DisassemblyView_1 = this; }
        static { this.NUM_INSTRUCTIONS_TO_LOAD = 50; }
        constructor(group, telemetryService, themeService, storageService, _configurationService, _instantiationService, _debugService) {
            super(debug_1.DISASSEMBLY_VIEW_ID, group, telemetryService, themeService, storageService);
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._debugService = _debugService;
            this._instructionBpList = [];
            this._enableSourceCodeRender = true;
            this._loadingLock = false;
            this._referenceToMemoryAddress = new Map();
            this._disassembledInstructions = undefined;
            this._onDidChangeStackFrame = this._register(new event_1.Emitter({ leakWarningThreshold: 1000 }));
            this._previousDebuggingState = _debugService.state;
            this._register(_configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug')) {
                    // show/hide source code requires changing height which WorkbenchTable doesn't support dynamic height, thus force a total reload.
                    const newValue = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
                    if (this._enableSourceCodeRender !== newValue) {
                        this._enableSourceCodeRender = newValue;
                        // todo: trigger rerender
                    }
                    else {
                        this._disassembledInstructions?.rerender();
                    }
                }
            }));
        }
        get fontInfo() {
            if (!this._fontInfo) {
                this._fontInfo = this.createFontInfo();
                this._register(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('editor')) {
                        this._fontInfo = this.createFontInfo();
                    }
                }));
            }
            return this._fontInfo;
        }
        createFontInfo() {
            return fontInfo_1.BareFontInfo.createFromRawSettings(this._configurationService.getValue('editor'), pixelRatio_1.PixelRatio.getInstance(this.window).value);
        }
        get currentInstructionAddresses() {
            return this._debugService.getModel().getSessions(false).
                map(session => session.getAllThreads()).
                reduce((prev, curr) => prev.concat(curr), []).
                map(thread => thread.getTopStackFrame()).
                map(frame => frame?.instructionPointerReference).
                map(ref => ref ? this.getReferenceAddress(ref) : undefined);
        }
        // Instruction reference of the top stack frame of the focused stack
        get focusedCurrentInstructionReference() {
            return this._debugService.getViewModel().focusedStackFrame?.thread.getTopStackFrame()?.instructionPointerReference;
        }
        get focusedCurrentInstructionAddress() {
            const ref = this.focusedCurrentInstructionReference;
            return ref ? this.getReferenceAddress(ref) : undefined;
        }
        get focusedInstructionReference() {
            return this._debugService.getViewModel().focusedStackFrame?.instructionPointerReference;
        }
        get focusedInstructionAddress() {
            const ref = this.focusedInstructionReference;
            return ref ? this.getReferenceAddress(ref) : undefined;
        }
        get isSourceCodeRender() { return this._enableSourceCodeRender; }
        get debugSession() {
            return this._debugService.getViewModel().focusedSession;
        }
        get onDidChangeStackFrame() { return this._onDidChangeStackFrame.event; }
        get focusedAddressAndOffset() {
            const element = this._disassembledInstructions?.getFocusedElements()[0];
            if (!element) {
                return undefined;
            }
            const reference = element.instructionReference;
            const offset = Number(element.address - this.getReferenceAddress(reference));
            return { reference, offset, address: element.address };
        }
        createEditor(parent) {
            this._enableSourceCodeRender = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
            const lineHeight = this.fontInfo.lineHeight;
            const thisOM = this;
            const delegate = new class {
                constructor() {
                    this.headerRowHeight = 0; // No header
                }
                getHeight(row) {
                    if (thisOM.isSourceCodeRender && row.showSourceLocation && row.instruction.location?.path && row.instruction.line) {
                        // instruction line + source lines
                        if (row.instruction.endLine) {
                            return lineHeight * (row.instruction.endLine - row.instruction.line + 2);
                        }
                        else {
                            // source is only a single line.
                            return lineHeight * 2;
                        }
                    }
                    // just instruction line
                    return lineHeight;
                }
            };
            const instructionRenderer = this._register(this._instantiationService.createInstance(InstructionRenderer, this));
            this._disassembledInstructions = this._register(this._instantiationService.createInstance(listService_1.WorkbenchTable, 'DisassemblyView', parent, delegate, [
                {
                    label: '',
                    tooltip: '',
                    weight: 0,
                    minimumWidth: this.fontInfo.lineHeight,
                    maximumWidth: this.fontInfo.lineHeight,
                    templateId: BreakpointRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('disassemblyTableColumnLabel', "instructions"),
                    tooltip: '',
                    weight: 0.3,
                    templateId: InstructionRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this._instantiationService.createInstance(BreakpointRenderer, this),
                instructionRenderer,
            ], {
                identityProvider: { getId: (e) => e.instruction.address },
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground
                },
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                openOnSingleClick: false,
                accessibilityProvider: new AccessibilityProvider(),
                mouseSupport: false
            }));
            if (this.focusedInstructionReference) {
                this.reloadDisassembly(this.focusedInstructionReference, 0);
            }
            this._register(this._disassembledInstructions.onDidScroll(e => {
                if (this._loadingLock) {
                    return;
                }
                if (e.oldScrollTop > e.scrollTop && e.scrollTop < e.height) {
                    this._loadingLock = true;
                    const prevTop = Math.floor(e.scrollTop / this.fontInfo.lineHeight);
                    this.scrollUp_LoadDisassembledInstructions(DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD).then((loaded) => {
                        if (loaded > 0) {
                            this._disassembledInstructions.reveal(prevTop + loaded, 0);
                        }
                        this._loadingLock = false;
                    });
                }
                else if (e.oldScrollTop < e.scrollTop && e.scrollTop + e.height > e.scrollHeight - e.height) {
                    this._loadingLock = true;
                    this.scrollDown_LoadDisassembledInstructions(DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD).then(() => { this._loadingLock = false; });
                }
            }));
            this._register(this._debugService.getViewModel().onDidFocusStackFrame(({ stackFrame }) => {
                if (this._disassembledInstructions && stackFrame?.instructionPointerReference) {
                    this.goToInstructionAndOffset(stackFrame.instructionPointerReference, 0);
                }
                this._onDidChangeStackFrame.fire();
            }));
            // refresh breakpoints view
            this._register(this._debugService.getModel().onDidChangeBreakpoints(bpEvent => {
                if (bpEvent && this._disassembledInstructions) {
                    // draw viewable BP
                    let changed = false;
                    bpEvent.added?.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromReferenceAndOffset(bp.instructionReference, bp.offset);
                            if (index >= 0) {
                                this._disassembledInstructions.row(index).isBreakpointSet = true;
                                this._disassembledInstructions.row(index).isBreakpointEnabled = bp.enabled;
                                changed = true;
                            }
                        }
                    });
                    bpEvent.removed?.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromReferenceAndOffset(bp.instructionReference, bp.offset);
                            if (index >= 0) {
                                this._disassembledInstructions.row(index).isBreakpointSet = false;
                                changed = true;
                            }
                        }
                    });
                    bpEvent.changed?.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromReferenceAndOffset(bp.instructionReference, bp.offset);
                            if (index >= 0) {
                                if (this._disassembledInstructions.row(index).isBreakpointEnabled !== bp.enabled) {
                                    this._disassembledInstructions.row(index).isBreakpointEnabled = bp.enabled;
                                    changed = true;
                                }
                            }
                        }
                    });
                    // get an updated list so that items beyond the current range would render when reached.
                    this._instructionBpList = this._debugService.getModel().getInstructionBreakpoints();
                    // breakpoints restored from a previous session can be based on memory
                    // references that may no longer exist in the current session. Request
                    // those instructions to be loaded so the BP can be displayed.
                    for (const bp of this._instructionBpList) {
                        this.primeMemoryReference(bp.instructionReference);
                    }
                    if (changed) {
                        this._onDidChangeStackFrame.fire();
                    }
                }
            }));
            this._register(this._debugService.onDidChangeState(e => {
                if ((e === 3 /* State.Running */ || e === 2 /* State.Stopped */) &&
                    (this._previousDebuggingState !== 3 /* State.Running */ && this._previousDebuggingState !== 2 /* State.Stopped */)) {
                    // Just started debugging, clear the view
                    this.clear();
                    this._enableSourceCodeRender = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
                }
                this._previousDebuggingState = e;
                this._onDidChangeStackFrame.fire();
            }));
        }
        layout(dimension) {
            this._disassembledInstructions?.layout(dimension.height);
        }
        async goToInstructionAndOffset(instructionReference, offset, focus) {
            let addr = this._referenceToMemoryAddress.get(instructionReference);
            if (addr === undefined) {
                await this.loadDisassembledInstructions(instructionReference, 0, -DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD, DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD * 2);
                addr = this._referenceToMemoryAddress.get(instructionReference);
            }
            if (addr) {
                this.goToAddress(addr + BigInt(offset), focus);
            }
        }
        /** Gets the address associated with the instruction reference. */
        getReferenceAddress(instructionReference) {
            return this._referenceToMemoryAddress.get(instructionReference);
        }
        /**
         * Go to the address provided. If no address is provided, reveal the address of the currently focused stack frame. Returns false if that address is not available.
         */
        goToAddress(address, focus) {
            if (!this._disassembledInstructions) {
                return false;
            }
            if (!address) {
                return false;
            }
            const index = this.getIndexFromAddress(address);
            if (index >= 0) {
                this._disassembledInstructions.reveal(index);
                if (focus) {
                    this._disassembledInstructions.domFocus();
                    this._disassembledInstructions.setFocus([index]);
                }
                return true;
            }
            return false;
        }
        async scrollUp_LoadDisassembledInstructions(instructionCount) {
            const first = this._disassembledInstructions?.row(0);
            if (first) {
                return this.loadDisassembledInstructions(first.instructionReference, first.instructionReferenceOffset, first.instructionOffset - instructionCount, instructionCount);
            }
            return 0;
        }
        async scrollDown_LoadDisassembledInstructions(instructionCount) {
            const last = this._disassembledInstructions?.row(this._disassembledInstructions?.length - 1);
            if (last) {
                return this.loadDisassembledInstructions(last.instructionReference, last.instructionReferenceOffset, last.instructionOffset + 1, instructionCount);
            }
            return 0;
        }
        /**
         * Sets the memory reference address. We don't just loadDisassembledInstructions
         * for this, since we can't really deal with discontiguous ranges (we can't
         * detect _if_ a range is discontiguous since we don't know how much memory
         * comes between instructions.)
         */
        async primeMemoryReference(instructionReference) {
            if (this._referenceToMemoryAddress.has(instructionReference)) {
                return true;
            }
            const s = await this.debugSession?.disassemble(instructionReference, 0, 0, 1);
            if (s && s.length > 0) {
                try {
                    this._referenceToMemoryAddress.set(instructionReference, BigInt(s[0].address));
                    return true;
                }
                catch {
                    return false;
                }
            }
            return false;
        }
        /** Loads disasembled instructions. Returns the number of instructions that were loaded. */
        async loadDisassembledInstructions(instructionReference, offset, instructionOffset, instructionCount) {
            const session = this.debugSession;
            const resultEntries = await session?.disassemble(instructionReference, offset, instructionOffset, instructionCount);
            // Ensure we always load the baseline instructions so we know what address the instructionReference refers to.
            if (!this._referenceToMemoryAddress.has(instructionReference) && instructionOffset !== 0) {
                await this.loadDisassembledInstructions(instructionReference, 0, 0, DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD);
            }
            if (session && resultEntries && this._disassembledInstructions) {
                const newEntries = [];
                let lastLocation;
                let lastLine;
                for (let i = 0; i < resultEntries.length; i++) {
                    const instruction = resultEntries[i];
                    const thisInstructionOffset = instructionOffset + i;
                    // Forward fill the missing location as detailed in the DAP spec.
                    if (instruction.location) {
                        lastLocation = instruction.location;
                        lastLine = undefined;
                    }
                    if (instruction.line) {
                        const currentLine = {
                            startLineNumber: instruction.line,
                            startColumn: instruction.column ?? 0,
                            endLineNumber: instruction.endLine ?? instruction.line,
                            endColumn: instruction.endColumn ?? 0,
                        };
                        // Add location only to the first unique range. This will give the appearance of grouping of instructions.
                        if (!range_1.Range.equalsRange(currentLine, lastLine ?? null)) {
                            lastLine = currentLine;
                            instruction.location = lastLocation;
                        }
                    }
                    let address;
                    try {
                        address = BigInt(instruction.address);
                    }
                    catch {
                        console.error(`Could not parse disassembly address ${instruction.address} (in ${JSON.stringify(instruction)})`);
                        continue;
                    }
                    const entry = {
                        allowBreakpoint: true,
                        isBreakpointSet: false,
                        isBreakpointEnabled: false,
                        instructionReference,
                        instructionReferenceOffset: offset,
                        instructionOffset: thisInstructionOffset,
                        instruction,
                        address,
                    };
                    newEntries.push(entry);
                    // if we just loaded the first instruction for this reference, mark its address.
                    if (offset === 0 && thisInstructionOffset === 0) {
                        this._referenceToMemoryAddress.set(instructionReference, address);
                    }
                }
                if (newEntries.length === 0) {
                    return 0;
                }
                const refBaseAddress = this._referenceToMemoryAddress.get(instructionReference);
                const bps = this._instructionBpList.map(p => {
                    const base = this._referenceToMemoryAddress.get(p.instructionReference);
                    if (!base) {
                        return undefined;
                    }
                    return {
                        enabled: p.enabled,
                        address: base + BigInt(p.offset || 0),
                    };
                });
                if (refBaseAddress !== undefined) {
                    for (const entry of newEntries) {
                        const bp = bps.find(p => p?.address === entry.address);
                        if (bp) {
                            entry.isBreakpointSet = true;
                            entry.isBreakpointEnabled = bp.enabled;
                        }
                    }
                }
                const da = this._disassembledInstructions;
                if (da.length === 1 && this._disassembledInstructions.row(0) === disassemblyNotAvailable) {
                    da.splice(0, 1);
                }
                const firstAddr = newEntries[0].address;
                const lastAddr = newEntries[newEntries.length - 1].address;
                const startN = (0, arrays_1.binarySearch2)(da.length, i => Number(da.row(i).address - firstAddr));
                const start = startN < 0 ? ~startN : startN;
                const endN = (0, arrays_1.binarySearch2)(da.length, i => Number(da.row(i).address - lastAddr));
                const end = endN < 0 ? ~endN : endN + 1;
                const toDelete = end - start;
                // Go through everything we're about to add, and only show the source
                // location if it's different from the previous one, "grouping" instructions by line
                let lastLocated;
                for (let i = start - 1; i >= 0; i--) {
                    const { instruction } = da.row(i);
                    if (instruction.location && instruction.line !== undefined) {
                        lastLocated = instruction;
                        break;
                    }
                }
                const shouldShowLocation = (instruction) => instruction.line !== undefined && instruction.location !== undefined &&
                    (!lastLocated || !(0, debugUtils_1.sourcesEqual)(instruction.location, lastLocated.location) || instruction.line !== lastLocated.line);
                for (const entry of newEntries) {
                    if (shouldShowLocation(entry.instruction)) {
                        entry.showSourceLocation = true;
                        lastLocated = entry.instruction;
                    }
                }
                da.splice(start, toDelete, newEntries);
                return newEntries.length - toDelete;
            }
            return 0;
        }
        getIndexFromReferenceAndOffset(instructionReference, offset) {
            const addr = this._referenceToMemoryAddress.get(instructionReference);
            if (addr === undefined) {
                return -1;
            }
            return this.getIndexFromAddress(addr + BigInt(offset));
        }
        getIndexFromAddress(address) {
            const disassembledInstructions = this._disassembledInstructions;
            if (disassembledInstructions && disassembledInstructions.length > 0) {
                return (0, arrays_1.binarySearch2)(disassembledInstructions.length, index => {
                    const row = disassembledInstructions.row(index);
                    return Number(row.address - address);
                });
            }
            return -1;
        }
        /**
         * Clears the table and reload instructions near the target address
         */
        reloadDisassembly(instructionReference, offset) {
            if (!this._disassembledInstructions) {
                return;
            }
            this._loadingLock = true; // stop scrolling during the load.
            this.clear();
            this._instructionBpList = this._debugService.getModel().getInstructionBreakpoints();
            this.loadDisassembledInstructions(instructionReference, offset, -DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD * 4, DisassemblyView_1.NUM_INSTRUCTIONS_TO_LOAD * 8).then(() => {
                // on load, set the target instruction in the middle of the page.
                if (this._disassembledInstructions.length > 0) {
                    const targetIndex = Math.floor(this._disassembledInstructions.length / 2);
                    this._disassembledInstructions.reveal(targetIndex, 0.5);
                    // Always focus the target address on reload, or arrow key navigation would look terrible
                    this._disassembledInstructions.domFocus();
                    this._disassembledInstructions.setFocus([targetIndex]);
                }
                this._loadingLock = false;
            });
        }
        clear() {
            this._referenceToMemoryAddress.clear();
            this._disassembledInstructions?.splice(0, this._disassembledInstructions.length, [disassemblyNotAvailable]);
        }
    };
    exports.DisassemblyView = DisassemblyView;
    exports.DisassemblyView = DisassemblyView = DisassemblyView_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, debug_1.IDebugService)
    ], DisassemblyView);
    let BreakpointRenderer = class BreakpointRenderer {
        static { BreakpointRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'breakpoint'; }
        constructor(_disassemblyView, _debugService) {
            this._disassemblyView = _disassemblyView;
            this._debugService = _debugService;
            this.templateId = BreakpointRenderer_1.TEMPLATE_ID;
            this._breakpointIcon = 'codicon-' + icons.breakpoint.regular.id;
            this._breakpointDisabledIcon = 'codicon-' + icons.breakpoint.disabled.id;
            this._breakpointHintIcon = 'codicon-' + icons.debugBreakpointHint.id;
            this._debugStackframe = 'codicon-' + icons.debugStackframe.id;
            this._debugStackframeFocused = 'codicon-' + icons.debugStackframeFocused.id;
        }
        renderTemplate(container) {
            // align from the bottom so that it lines up with instruction when source code is present.
            container.style.alignSelf = 'flex-end';
            const icon = (0, dom_1.append)(container, (0, dom_1.$)('.disassembly-view'));
            icon.classList.add('codicon');
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.height = this._disassemblyView.fontInfo.lineHeight + 'px';
            const currentElement = { element: undefined };
            const disposables = [
                this._disassemblyView.onDidChangeStackFrame(() => this.rerenderDebugStackframe(icon, currentElement.element)),
                (0, dom_1.addStandardDisposableListener)(container, 'mouseover', () => {
                    if (currentElement.element?.allowBreakpoint) {
                        icon.classList.add(this._breakpointHintIcon);
                    }
                }),
                (0, dom_1.addStandardDisposableListener)(container, 'mouseout', () => {
                    if (currentElement.element?.allowBreakpoint) {
                        icon.classList.remove(this._breakpointHintIcon);
                    }
                }),
                (0, dom_1.addStandardDisposableListener)(container, 'click', () => {
                    if (currentElement.element?.allowBreakpoint) {
                        // click show hint while waiting for BP to resolve.
                        icon.classList.add(this._breakpointHintIcon);
                        const reference = currentElement.element.instructionReference;
                        const offset = Number(currentElement.element.address - this._disassemblyView.getReferenceAddress(reference));
                        if (currentElement.element.isBreakpointSet) {
                            this._debugService.removeInstructionBreakpoints(reference, offset);
                        }
                        else if (currentElement.element.allowBreakpoint && !currentElement.element.isBreakpointSet) {
                            this._debugService.addInstructionBreakpoint({ instructionReference: reference, offset, address: currentElement.element.address, canPersist: false });
                        }
                    }
                })
            ];
            return { currentElement, icon, disposables };
        }
        renderElement(element, index, templateData, height) {
            templateData.currentElement.element = element;
            this.rerenderDebugStackframe(templateData.icon, element);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.disposables);
            templateData.disposables = [];
        }
        rerenderDebugStackframe(icon, element) {
            if (element?.address === this._disassemblyView.focusedCurrentInstructionAddress) {
                icon.classList.add(this._debugStackframe);
            }
            else if (element?.address === this._disassemblyView.focusedInstructionAddress) {
                icon.classList.add(this._debugStackframeFocused);
            }
            else {
                icon.classList.remove(this._debugStackframe);
                icon.classList.remove(this._debugStackframeFocused);
            }
            icon.classList.remove(this._breakpointHintIcon);
            if (element?.isBreakpointSet) {
                if (element.isBreakpointEnabled) {
                    icon.classList.add(this._breakpointIcon);
                    icon.classList.remove(this._breakpointDisabledIcon);
                }
                else {
                    icon.classList.remove(this._breakpointIcon);
                    icon.classList.add(this._breakpointDisabledIcon);
                }
            }
            else {
                icon.classList.remove(this._breakpointIcon);
                icon.classList.remove(this._breakpointDisabledIcon);
            }
        }
    };
    BreakpointRenderer = BreakpointRenderer_1 = __decorate([
        __param(1, debug_1.IDebugService)
    ], BreakpointRenderer);
    let InstructionRenderer = class InstructionRenderer extends lifecycle_1.Disposable {
        static { InstructionRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'instruction'; }
        static { this.INSTRUCTION_ADDR_MIN_LENGTH = 25; }
        static { this.INSTRUCTION_BYTES_MIN_LENGTH = 30; }
        constructor(_disassemblyView, themeService, editorService, textModelService, uriService, logService) {
            super();
            this._disassemblyView = _disassemblyView;
            this.editorService = editorService;
            this.textModelService = textModelService;
            this.uriService = uriService;
            this.logService = logService;
            this.templateId = InstructionRenderer_1.TEMPLATE_ID;
            this._topStackFrameColor = themeService.getColorTheme().getColor(callStackEditorContribution_1.topStackFrameColor);
            this._focusedStackFrameColor = themeService.getColorTheme().getColor(callStackEditorContribution_1.focusedStackFrameColor);
            this._register(themeService.onDidColorThemeChange(e => {
                this._topStackFrameColor = e.getColor(callStackEditorContribution_1.topStackFrameColor);
                this._focusedStackFrameColor = e.getColor(callStackEditorContribution_1.focusedStackFrameColor);
            }));
        }
        renderTemplate(container) {
            const sourcecode = (0, dom_1.append)(container, (0, dom_1.$)('.sourcecode'));
            const instruction = (0, dom_1.append)(container, (0, dom_1.$)('.instruction'));
            this.applyFontInfo(sourcecode);
            this.applyFontInfo(instruction);
            const currentElement = { element: undefined };
            const cellDisposable = [];
            const disposables = [
                this._disassemblyView.onDidChangeStackFrame(() => this.rerenderBackground(instruction, sourcecode, currentElement.element)),
                (0, dom_1.addStandardDisposableListener)(sourcecode, 'dblclick', () => this.openSourceCode(currentElement.element?.instruction)),
            ];
            return { currentElement, instruction, sourcecode, cellDisposable, disposables };
        }
        renderElement(element, index, templateData, height) {
            this.renderElementInner(element, index, templateData, height);
        }
        async renderElementInner(element, index, templateData, height) {
            templateData.currentElement.element = element;
            const instruction = element.instruction;
            templateData.sourcecode.innerText = '';
            const sb = new stringBuilder_1.StringBuilder(1000);
            if (this._disassemblyView.isSourceCodeRender && element.showSourceLocation && instruction.location?.path && instruction.line !== undefined) {
                const sourceURI = this.getUriFromSource(instruction);
                if (sourceURI) {
                    let textModel = undefined;
                    const sourceSB = new stringBuilder_1.StringBuilder(10000);
                    const ref = await this.textModelService.createModelReference(sourceURI);
                    if (templateData.currentElement.element !== element) {
                        return; // avoid a race, #192831
                    }
                    textModel = ref.object.textEditorModel;
                    templateData.cellDisposable.push(ref);
                    // templateData could have moved on during async.  Double check if it is still the same source.
                    if (textModel && templateData.currentElement.element === element) {
                        let lineNumber = instruction.line;
                        while (lineNumber && lineNumber >= 1 && lineNumber <= textModel.getLineCount()) {
                            const lineContent = textModel.getLineContent(lineNumber);
                            sourceSB.appendString(`  ${lineNumber}: `);
                            sourceSB.appendString(lineContent + '\n');
                            if (instruction.endLine && lineNumber < instruction.endLine) {
                                lineNumber++;
                                continue;
                            }
                            break;
                        }
                        templateData.sourcecode.innerText = sourceSB.build();
                    }
                }
            }
            let spacesToAppend = 10;
            if (instruction.address !== '-1') {
                sb.appendString(instruction.address);
                if (instruction.address.length < InstructionRenderer_1.INSTRUCTION_ADDR_MIN_LENGTH) {
                    spacesToAppend = InstructionRenderer_1.INSTRUCTION_ADDR_MIN_LENGTH - instruction.address.length;
                }
                for (let i = 0; i < spacesToAppend; i++) {
                    sb.appendString(' ');
                }
            }
            if (instruction.instructionBytes) {
                sb.appendString(instruction.instructionBytes);
                spacesToAppend = 10;
                if (instruction.instructionBytes.length < InstructionRenderer_1.INSTRUCTION_BYTES_MIN_LENGTH) {
                    spacesToAppend = InstructionRenderer_1.INSTRUCTION_BYTES_MIN_LENGTH - instruction.instructionBytes.length;
                }
                for (let i = 0; i < spacesToAppend; i++) {
                    sb.appendString(' ');
                }
            }
            sb.appendString(instruction.instruction);
            templateData.instruction.innerText = sb.build();
            this.rerenderBackground(templateData.instruction, templateData.sourcecode, element);
        }
        disposeElement(element, index, templateData, height) {
            (0, lifecycle_1.dispose)(templateData.cellDisposable);
            templateData.cellDisposable = [];
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.disposables);
            templateData.disposables = [];
        }
        rerenderBackground(instruction, sourceCode, element) {
            if (element && this._disassemblyView.currentInstructionAddresses.includes(element.address)) {
                instruction.style.background = this._topStackFrameColor?.toString() || 'transparent';
            }
            else if (element?.address === this._disassemblyView.focusedInstructionAddress) {
                instruction.style.background = this._focusedStackFrameColor?.toString() || 'transparent';
            }
            else {
                instruction.style.background = 'transparent';
            }
        }
        openSourceCode(instruction) {
            if (instruction) {
                const sourceURI = this.getUriFromSource(instruction);
                const selection = instruction.endLine ? {
                    startLineNumber: instruction.line,
                    endLineNumber: instruction.endLine,
                    startColumn: instruction.column || 1,
                    endColumn: instruction.endColumn || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                } : {
                    startLineNumber: instruction.line,
                    endLineNumber: instruction.line,
                    startColumn: instruction.column || 1,
                    endColumn: instruction.endColumn || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                };
                this.editorService.openEditor({
                    resource: sourceURI,
                    description: (0, nls_1.localize)('editorOpenedFromDisassemblyDescription', "from disassembly"),
                    options: {
                        preserveFocus: false,
                        selection: selection,
                        revealIfOpened: true,
                        selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */,
                        pinned: false,
                    }
                });
            }
        }
        getUriFromSource(instruction) {
            // Try to resolve path before consulting the debugSession.
            const path = instruction.location.path;
            if (path && (0, debugUtils_1.isUri)(path)) { // path looks like a uri
                return this.uriService.asCanonicalUri(uri_1.URI.parse(path));
            }
            // assume a filesystem path
            if (path && (0, path_1.isAbsolute)(path)) {
                return this.uriService.asCanonicalUri(uri_1.URI.file(path));
            }
            return (0, debugSource_1.getUriFromSource)(instruction.location, instruction.location.path, this._disassemblyView.debugSession.getId(), this.uriService, this.logService);
        }
        applyFontInfo(element) {
            (0, domFontInfo_1.applyFontInfo)(element, this._disassemblyView.fontInfo);
            element.style.whiteSpace = 'pre';
        }
    };
    InstructionRenderer = InstructionRenderer_1 = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, editorService_1.IEditorService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, log_1.ILogService)
    ], InstructionRenderer);
    class AccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('disassemblyView', "Disassembly View");
        }
        getAriaLabel(element) {
            let label = '';
            const instruction = element.instruction;
            if (instruction.address !== '-1') {
                label += `${(0, nls_1.localize)('instructionAddress', "Address")}: ${instruction.address}`;
            }
            if (instruction.instructionBytes) {
                label += `, ${(0, nls_1.localize)('instructionBytes', "Bytes")}: ${instruction.instructionBytes}`;
            }
            label += `, ${(0, nls_1.localize)(`instructionText`, "Instruction")}: ${instruction.instruction}`;
            return label;
        }
    }
    let DisassemblyViewContribution = class DisassemblyViewContribution {
        constructor(editorService, debugService, contextKeyService) {
            contextKeyService.bufferChangeEvents(() => {
                this._languageSupportsDisassembleRequest = debug_1.CONTEXT_LANGUAGE_SUPPORTS_DISASSEMBLE_REQUEST.bindTo(contextKeyService);
            });
            const onDidActiveEditorChangeListener = () => {
                if (this._onDidChangeModelLanguage) {
                    this._onDidChangeModelLanguage.dispose();
                    this._onDidChangeModelLanguage = undefined;
                }
                const activeTextEditorControl = editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                    const language = activeTextEditorControl.getModel()?.getLanguageId();
                    // TODO: instead of using idDebuggerInterestedInLanguage, have a specific ext point for languages
                    // support disassembly
                    this._languageSupportsDisassembleRequest?.set(!!language && debugService.getAdapterManager().someDebuggerInterestedInLanguage(language));
                    this._onDidChangeModelLanguage = activeTextEditorControl.onDidChangeModelLanguage(e => {
                        this._languageSupportsDisassembleRequest?.set(debugService.getAdapterManager().someDebuggerInterestedInLanguage(e.newLanguage));
                    });
                }
                else {
                    this._languageSupportsDisassembleRequest?.set(false);
                }
            };
            onDidActiveEditorChangeListener();
            this._onDidActiveEditorChangeListener = editorService.onDidActiveEditorChange(onDidActiveEditorChangeListener);
        }
        dispose() {
            this._onDidActiveEditorChangeListener.dispose();
            this._onDidChangeModelLanguage?.dispose();
        }
    };
    exports.DisassemblyViewContribution = DisassemblyViewContribution;
    exports.DisassemblyViewContribution = DisassemblyViewContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, debug_1.IDebugService),
        __param(2, contextkey_1.IContextKeyService)
    ], DisassemblyViewContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzYXNzZW1ibHlWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2Rpc2Fzc2VtYmx5Vmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBOERoRyxrRUFBa0U7SUFDbEUsTUFBTSx1QkFBdUIsR0FBa0M7UUFDOUQsZUFBZSxFQUFFLEtBQUs7UUFDdEIsZUFBZSxFQUFFLEtBQUs7UUFDdEIsbUJBQW1CLEVBQUUsS0FBSztRQUMxQixvQkFBb0IsRUFBRSxFQUFFO1FBQ3hCLGlCQUFpQixFQUFFLENBQUM7UUFDcEIsMEJBQTBCLEVBQUUsQ0FBQztRQUM3QixPQUFPLEVBQUUsRUFBRTtRQUNYLFdBQVcsRUFBRTtZQUNaLE9BQU8sRUFBRSxJQUFJO1lBQ2IsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLDRCQUE0QixDQUFDO1NBQzlFO0tBQ0QsQ0FBQztJQUVLLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsdUJBQVU7O2lCQUV0Qiw2QkFBd0IsR0FBRyxFQUFFLEFBQUwsQ0FBTTtRQVl0RCxZQUNDLEtBQW1CLEVBQ0EsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3pCLGNBQStCLEVBQ3pCLHFCQUE2RCxFQUM3RCxxQkFBNkQsRUFDckUsYUFBNkM7WUFFNUQsS0FBSyxDQUFDLDJCQUFtQixFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFKMUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3BELGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBWnJELHVCQUFrQixHQUFzQyxFQUFFLENBQUM7WUFDM0Qs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