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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/strings", "vs/base/common/themables", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/common/model", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/editorLineNumberMenu", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/workbench/contrib/debug/browser/breakpointWidget", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug"], function (require, exports, browser_1, canIUse_1, dom, mouseEvent_1, actions_1, arrays_1, async_1, decorators_1, errors_1, htmlContent_1, lifecycle_1, env, severity_1, strings_1, themables_1, uuid_1, range_1, language_1, model_1, nls, configuration_1, contextkey_1, contextView_1, dialogs_1, instantiation_1, label_1, colorRegistry_1, themeService_1, editorLineNumberMenu_1, breakpointsView_1, breakpointWidget_1, icons, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.debugIconBreakpointForeground = exports.BreakpointEditorContribution = void 0;
    exports.createBreakpointDecorations = createBreakpointDecorations;
    const $ = dom.$;
    const breakpointHelperDecoration = {
        description: 'breakpoint-helper-decoration',
        glyphMarginClassName: themables_1.ThemeIcon.asClassName(icons.debugBreakpointHint),
        glyphMargin: { position: model_1.GlyphMarginLane.Right },
        glyphMarginHoverMessage: new htmlContent_1.MarkdownString().appendText(nls.localize('breakpointHelper', "Click to add a breakpoint")),
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
    };
    function createBreakpointDecorations(accessor, model, breakpoints, state, breakpointsActivated, showBreakpointsInOverviewRuler) {
        const result = [];
        breakpoints.forEach((breakpoint) => {
            if (breakpoint.lineNumber > model.getLineCount()) {
                return;
            }
            const hasOtherBreakpointsOnLine = breakpoints.some(bp => bp !== breakpoint && bp.lineNumber === breakpoint.lineNumber);
            const column = model.getLineFirstNonWhitespaceColumn(breakpoint.lineNumber);
            const range = model.validateRange(breakpoint.column ? new range_1.Range(breakpoint.lineNumber, breakpoint.column, breakpoint.lineNumber, breakpoint.column + 1)
                : new range_1.Range(breakpoint.lineNumber, column, breakpoint.lineNumber, column + 1) // Decoration has to have a width #20688
            );
            result.push({
                options: getBreakpointDecorationOptions(accessor, model, breakpoint, state, breakpointsActivated, showBreakpointsInOverviewRuler, hasOtherBreakpointsOnLine),
                range
            });
        });
        return result;
    }
    function getBreakpointDecorationOptions(accessor, model, breakpoint, state, breakpointsActivated, showBreakpointsInOverviewRuler, hasOtherBreakpointsOnLine) {
        const debugService = accessor.get(debug_1.IDebugService);
        const languageService = accessor.get(language_1.ILanguageService);
        const labelService = accessor.get(label_1.ILabelService);
        const { icon, message, showAdapterUnverifiedMessage } = (0, breakpointsView_1.getBreakpointMessageAndIcon)(state, breakpointsActivated, breakpoint, labelService, debugService.getModel());
        let glyphMarginHoverMessage;
        let unverifiedMessage;
        if (showAdapterUnverifiedMessage) {
            let langId;
            unverifiedMessage = debugService.getModel().getSessions().map(s => {
                const dbg = debugService.getAdapterManager().getDebugger(s.configuration.type);
                const message = dbg?.strings?.[debug_1.DebuggerString.UnverifiedBreakpoints];
                if (message) {
                    if (!langId) {
                        // Lazily compute this, only if needed for some debug adapter
                        langId = languageService.guessLanguageIdByFilepathOrFirstLine(breakpoint.uri) ?? undefined;
                    }
                    return langId && dbg.interestedInLanguage(langId) ? message : undefined;
                }
                return undefined;
            })
                .find(messages => !!messages);
        }
        if (message) {
            glyphMarginHoverMessage = new htmlContent_1.MarkdownString(undefined, { isTrusted: true, supportThemeIcons: true });
            if (breakpoint.condition || breakpoint.hitCondition) {
                const languageId = model.getLanguageId();
                glyphMarginHoverMessage.appendCodeblock(languageId, message);
                if (unverifiedMessage) {
                    glyphMarginHoverMessage.appendMarkdown('$(warning) ' + unverifiedMessage);
                }
            }
            else {
                glyphMarginHoverMessage.appendText(message);
                if (unverifiedMessage) {
                    glyphMarginHoverMessage.appendMarkdown('\n\n$(warning) ' + unverifiedMessage);
                }
            }
        }
        else if (unverifiedMessage) {
            glyphMarginHoverMessage = new htmlContent_1.MarkdownString(undefined, { isTrusted: true, supportThemeIcons: true }).appendMarkdown(unverifiedMessage);
        }
        let overviewRulerDecoration = null;
        if (showBreakpointsInOverviewRuler) {
            overviewRulerDecoration = {
                color: (0, themeService_1.themeColorFromId)(exports.debugIconBreakpointForeground),
                position: model_1.OverviewRulerLane.Left
            };
        }
        const renderInline = breakpoint.column && (hasOtherBreakpointsOnLine || breakpoint.column > model.getLineFirstNonWhitespaceColumn(breakpoint.lineNumber));
        return {
            description: 'breakpoint-decoration',
            glyphMargin: { position: model_1.GlyphMarginLane.Right },
            glyphMarginClassName: themables_1.ThemeIcon.asClassName(icon),
            glyphMarginHoverMessage,
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            before: renderInline ? {
                content: strings_1.noBreakWhitespace,
                inlineClassName: `debug-breakpoint-placeholder`,
                inlineClassNameAffectsLetterSpacing: true
            } : undefined,
            overviewRuler: overviewRulerDecoration,
            zIndex: 9999
        };
    }
    async function requestBreakpointCandidateLocations(model, lineNumbers, session) {
        if (!session.capabilities.supportsBreakpointLocationsRequest) {
            return [];
        }
        return await Promise.all((0, arrays_1.distinct)(lineNumbers, l => l).map(async (lineNumber) => {
            try {
                return { lineNumber, positions: await session.breakpointsLocations(model.uri, lineNumber) };
            }
            catch {
                return { lineNumber, positions: [] };
            }
        }));
    }
    function createCandidateDecorations(model, breakpointDecorations, lineBreakpoints) {
        const result = [];
        for (const { positions, lineNumber } of lineBreakpoints) {
            if (positions.length === 0) {
                continue;
            }
            // Do not render candidates if there is only one, since it is already covered by the line breakpoint
            const firstColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
            const lastColumn = model.getLineLastNonWhitespaceColumn(lineNumber);
            positions.forEach(p => {
                const range = new range_1.Range(p.lineNumber, p.column, p.lineNumber, p.column + 1);
                if ((p.column <= firstColumn && !breakpointDecorations.some(bp => bp.range.startColumn > firstColumn && bp.range.startLineNumber === p.lineNumber)) || p.column > lastColumn) {
                    // Do not render candidates on the start of the line if there's no other breakpoint on the line.
                    return;
                }
                const breakpointAtPosition = breakpointDecorations.find(bpd => bpd.range.equalsRange(range));
                if (breakpointAtPosition && breakpointAtPosition.inlineWidget) {
                    // Space already occupied, do not render candidate.
                    return;
                }
                result.push({
                    range,
                    options: {
                        description: 'breakpoint-placeholder-decoration',
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                        before: breakpointAtPosition ? undefined : {
                            content: strings_1.noBreakWhitespace,
                            inlineClassName: `debug-breakpoint-placeholder`,
                            inlineClassNameAffectsLetterSpacing: true
                        },
                    },
                    breakpoint: breakpointAtPosition ? breakpointAtPosition.breakpoint : undefined
                });
            });
        }
        return result;
    }
    let BreakpointEditorContribution = class BreakpointEditorContribution {
        constructor(editor, debugService, contextMenuService, instantiationService, contextKeyService, dialogService, configurationService, labelService) {
            this.editor = editor;
            this.debugService = debugService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.breakpointHintDecoration = null;
            this.toDispose = [];
            this.ignoreDecorationsChangedEvent = false;
            this.ignoreBreakpointsChangeEvent = false;
            this.breakpointDecorations = [];
            this.candidateDecorations = [];
            this.breakpointWidgetVisible = debug_1.CONTEXT_BREAKPOINT_WIDGET_VISIBLE.bindTo(contextKeyService);
            this.setDecorationsScheduler = new async_1.RunOnceScheduler(() => this.setDecorations(), 30);
            this.setDecorationsScheduler.schedule();
            this.registerListeners();
        }
        /**
         * Returns context menu actions at the line number if breakpoints can be
         * set. This is used by the {@link TestingDecorations} to allow breakpoint
         * setting on lines where breakpoint "run" actions are present.
         */
        getContextMenuActionsAtPosition(lineNumber, model) {
            if (!this.debugService.getAdapterManager().hasEnabledDebuggers()) {
                return [];
            }
            if (!this.debugService.canSetBreakpointsIn(model)) {
                return [];
            }
            const breakpoints = this.debugService.getModel().getBreakpoints({ lineNumber, uri: model.uri });
            return this.getContextMenuActions(breakpoints, model.uri, lineNumber);
        }
        registerListeners() {
            this.toDispose.push(this.editor.onMouseDown(async (e) => {
                if (!this.debugService.getAdapterManager().hasEnabledDebuggers()) {
                    return;
                }
                const model = this.editor.getModel();
                if (!e.target.position
                    || !model
                    || e.target.type !== 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */
                    || e.target.detail.isAfterLines
                    || !this.marginFreeFromNonDebugDecorations(e.target.position.lineNumber)
                        // don't return early if there's a breakpoint
                        && !e.target.element?.className.includes('breakpoint')) {
                    return;
                }
                const canSetBreakpoints = this.debugService.canSetBreakpointsIn(model);
                const lineNumber = e.target.position.lineNumber;
                const uri = model.uri;
                if (e.event.rightButton || (env.isMacintosh && e.event.leftButton && e.event.ctrlKey)) {
                    // handled by editor gutter context menu
                    return;
                }
                else {
                    const breakpoints = this.debugService.getModel().getBreakpoints({ uri, lineNumber });
                    if (breakpoints.length) {
                        const isShiftPressed = e.event.shiftKey;
                        const enabled = breakpoints.some(bp => bp.enabled);
                        if (isShiftPressed) {
                            breakpoints.forEach(bp => this.debugService.enableOrDisableBreakpoints(!enabled, bp));
                        }
                        else if (!env.isLinux && breakpoints.some(bp => !!bp.condition || !!bp.logMessage || !!bp.hitCondition || !!bp.triggeredBy)) {
                            // Show the dialog if there is a potential condition to be accidently lost.
                            // Do not show dialog on linux due to electron issue freezing the mouse #50026
                            const logPoint = breakpoints.every(bp => !!bp.logMessage);
                            const breakpointType = logPoint ? nls.localize('logPoint', "Logpoint") : nls.localize('breakpoint', "Breakpoint");
                            const disabledBreakpointDialogMessage = nls.localize('breakpointHasConditionDisabled', "This {0} has a {1} that will get lost on remove. Consider enabling the {0} instead.", breakpointType.toLowerCase(), logPoint ? nls.localize('message', "message") : nls.localize('condition', "condition"));
                            const enabledBreakpointDialogMessage = nls.localize('breakpointHasConditionEnabled', "This {0} has a {1} that will get lost on remove. Consider disabling the {0} instead.", breakpointType.toLowerCase(), logPoint ? nls.localize('message', "message") : nls.localize('condition', "condition"));
                            await this.dialogService.prompt({
                                type: severity_1.default.Info,
                                message: enabled ? enabledBreakpointDialogMessage : disabledBreakpointDialogMessage,
                                buttons: [
                                    {
                                        label: nls.localize({ key: 'removeLogPoint', comment: ['&& denotes a mnemonic'] }, "&&Remove {0}", breakpointType),
                                        run: () => breakpoints.forEach(bp => this.debugService.removeBreakpoints(bp.getId()))
                                    },
                                    {
                                        label: nls.localize('disableLogPoint', "{0} {1}", enabled ? nls.localize({ key: 'disable', comment: ['&& denotes a mnemonic'] }, "&&Disable") : nls.localize({ key: 'enable', comment: ['&& denotes a mnemonic'] }, "&&Enable"), breakpointType),
                                        run: () => breakpoints.forEach(bp => this.debugService.enableOrDisableBreakpoints(!enabled, bp))
                                    }
                                ],
                                cancelButton: true
                            });
                        }
                        else {
                            if (!enabled) {
                                breakpoints.forEach(bp => this.debugService.enableOrDisableBreakpoints(!enabled, bp));
                            }
                            else {
                                breakpoints.forEach(bp => this.debugService.removeBreakpoints(bp.getId()));
                            }
                        }
                    }
                    else if (canSetBreakpoints) {
                        if (e.event.middleButton) {
                            const action = this.configurationService.getValue('debug').gutterMiddleClickAction;
                            if (action !== 'none') {
                                let context;
                                switch (action) {
                                    case 'logpoint':
                                        context = 2 /* BreakpointWidgetContext.LOG_MESSAGE */;
                                        break;
                                    case 'conditionalBreakpoint':
                                        context = 0 /* BreakpointWidgetContext.CONDITION */;
                                        break;
                                    case 'triggeredBreakpoint':
                                        context = 3 /* BreakpointWidgetContext.TRIGGER_POINT */;
                                }
                                this.showBreakpointWidget(lineNumber, undefined, context);
                            }
                        }
                        else {
                            this.debugService.addBreakpoints(uri, [{ lineNumber }]);
                        }
                    }
                }
            }));
            if (!(canIUse_1.BrowserFeatures.pointerEvents && browser_1.isSafari)) {
                /**
                 * We disable the hover feature for Safari on iOS as
                 * 1. Browser hover events are handled specially by the system (it treats first click as hover if there is `:hover` css registered). Below hover behavior will confuse users with inconsistent expeirence.
                 * 2. When users click on line numbers, the breakpoint hint displays immediately, however it doesn't create the breakpoint unless users click on the left gutter. On a touch screen, it's hard to click on that small area.
                 */
                this.toDispose.push(this.editor.onMouseMove((e) => {
                    if (!this.debugService.getAdapterManager().hasEnabledDebuggers()) {
                        return;
                    }
                    let showBreakpointHintAtLineNumber = -1;
                    const model = this.editor.getModel();
                    if (model && e.target.position && (e.target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */ || e.target.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */) && this.debugService.canSetBreakpointsIn(model) &&
                        this.marginFreeFromNonDebugDecorations(e.target.position.lineNumber)) {
                        const data = e.target.detail;
                        if (!data.isAfterLines) {
                            showBreakpointHintAtLineNumber = e.target.position.lineNumber;
                        }
                    }
                    this.ensureBreakpointHintDecoration(showBreakpointHintAtLineNumber);
                }));
                this.toDispose.push(this.editor.onMouseLeave(() => {
                    this.ensureBreakpointHintDecoration(-1);
                }));
            }
            this.toDispose.push(this.editor.onDidChangeModel(async () => {
                this.closeBreakpointWidget();
                await this.setDecorations();
            }));
            this.toDispose.push(this.debugService.getModel().onDidChangeBreakpoints(() => {
                if (!this.ignoreBreakpointsChangeEvent && !this.setDecorationsScheduler.isScheduled()) {
                    this.setDecorationsScheduler.schedule();
                }
            }));
            this.toDispose.push(this.debugService.onDidChangeState(() => {
                // We need to update breakpoint decorations when state changes since the top stack frame and breakpoint decoration might change
                if (!this.setDecorationsScheduler.isScheduled()) {
                    this.setDecorationsScheduler.schedule();
                }
            }));
            this.toDispose.push(this.editor.onDidChangeModelDecorations(() => this.onModelDecorationsChanged()));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('debug.showBreakpointsInOverviewRuler') || e.affectsConfiguration('debug.showInlineBreakpointCandidates')) {
                    await this.setDecorations();
                }
            }));
        }
        getContextMenuActions(breakpoints, uri, lineNumber, column) {
            const actions = [];
            if (breakpoints.length === 1) {
                const breakpointType = breakpoints[0].logMessage ? nls.localize('logPoint', "Logpoint") : nls.localize('breakpoint', "Breakpoint");
                actions.push(new actions_1.Action('debug.removeBreakpoint', nls.localize('removeBreakpoint', "Remove {0}", breakpointType), undefined, true, async () => {
                    await this.debugService.removeBreakpoints(breakpoints[0].getId());
                }));
                actions.push(new actions_1.Action('workbench.debug.action.editBreakpointAction', nls.localize('editBreakpoint', "Edit {0}...", breakpointType), undefined, true, () => Promise.resolve(this.showBreakpointWidget(breakpoints[0].lineNumber, breakpoints[0].column))));
                actions.push(new actions_1.Action(`workbench.debug.viewlet.action.toggleBreakpoint`, breakpoints[0].enabled ? nls.localize('disableBreakpoint', "Disable {0}", breakpointType) : nls.localize('enableBreakpoint', "Enable {0}", breakpointType), undefined, true, () => this.debugService.enableOrDisableBreakpoints(!breakpoints[0].enabled, breakpoints[0])));
            }
            else if (breakpoints.length > 1) {
                const sorted = breakpoints.slice().sort((first, second) => (first.column && second.column) ? first.column - second.column : 1);
                actions.push(new actions_1.SubmenuAction('debug.removeBreakpoints', nls.localize('removeBreakpoints', "Remove Breakpoints"), sorted.map(bp => new actions_1.Action('removeInlineBreakpoint', bp.column ? nls.localize('removeInlineBreakpointOnColumn', "Remove Inline Breakpoint on Column {0}", bp.column) : nls.localize('removeLineBreakpoint', "Remove Line Breakpoint"), undefined, true, () => this.debugService.removeBreakpoints(bp.getId())))));
                actions.push(new actions_1.SubmenuAction('debug.editBreakpoints', nls.localize('editBreakpoints', "Edit Breakpoints"), sorted.map(bp => new actions_1.Action('editBreakpoint', bp.column ? nls.localize('editInlineBreakpointOnColumn', "Edit Inline Breakpoint on Column {0}", bp.column) : nls.localize('editLineBreakpoint', "Edit Line Breakpoint"), undefined, true, () => Promise.resolve(this.showBreakpointWidget(bp.lineNumber, bp.column))))));
                actions.push(new actions_1.SubmenuAction('debug.enableDisableBreakpoints', nls.localize('enableDisableBreakpoints', "Enable/Disable Breakpoints"), sorted.map(bp => new actions_1.Action(bp.enabled ? 'disableColumnBreakpoint' : 'enableColumnBreakpoint', bp.enabled ? (bp.column ? nls.localize('disableInlineColumnBreakpoint', "Disable Inline Breakpoint on Column {0}", bp.column) : nls.localize('disableBreakpointOnLine', "Disable Line Breakpoint"))
                    : (bp.column ? nls.localize('enableBreakpoints', "Enable Inline Breakpoint on Column {0}", bp.column) : nls.localize('enableBreakpointOnLine', "Enable Line Breakpoint")), undefined, true, () => this.debugService.enableOrDisableBreakpoints(!bp.enabled, bp)))));
            }
            else {
                actions.push(new actions_1.Action('addBreakpoint', nls.localize('addBreakpoint', "Add Breakpoint"), undefined, true, () => this.debugService.addBreakpoints(uri, [{ lineNumber, column }])));
                actions.push(new actions_1.Action('addConditionalBreakpoint', nls.localize('addConditionalBreakpoint', "Add Conditional Breakpoint..."), undefined, true, () => Promise.resolve(this.showBreakpointWidget(lineNumber, column, 0 /* BreakpointWidgetContext.CONDITION */))));
                actions.push(new actions_1.Action('addLogPoint', nls.localize('addLogPoint', "Add Logpoint..."), undefined, true, () => Promise.resolve(this.showBreakpointWidget(lineNumber, column, 2 /* BreakpointWidgetContext.LOG_MESSAGE */))));
                actions.push(new actions_1.Action('addTriggeredBreakpoint', nls.localize('addTriggeredBreakpoint', "Add Triggered Breakpoint..."), undefined, true, () => Promise.resolve(this.showBreakpointWidget(lineNumber, column, 3 /* BreakpointWidgetContext.TRIGGER_POINT */))));
            }
            if (this.debugService.state === 2 /* State.Stopped */) {
                actions.push(new actions_1.Separator());
                actions.push(new actions_1.Action('runToLine', nls.localize('runToLine', "Run to Line"), undefined, true, () => this.debugService.runTo(uri, lineNumber).catch(errors_1.onUnexpectedError)));
            }
            return actions;
        }
        marginFreeFromNonDebugDecorations(line) {
            const decorations = this.editor.getLineDecorations(line);
            if (decorations) {
                for (const { options } of decorations) {
                    const clz = options.glyphMarginClassName;
                    if (!clz) {
                        continue;
                    }
                    const hasSomeActionableCodicon = !(clz.includes('codicon-') || clz.startsWith('coverage-deco-')) || clz.includes('codicon-testing-') || clz.includes('codicon-merge-') || clz.includes('codicon-arrow-') || clz.includes('codicon-loading') || clz.includes('codicon-fold') || clz.includes('codicon-inline-chat');
                    if (hasSomeActionableCodicon) {
                        return false;
                    }
                }
            }
            return true;
        }
        ensureBreakpointHintDecoration(showBreakpointHintAtLineNumber) {
            this.editor.changeDecorations((accessor) => {
                if (this.breakpointHintDecoration) {
                    accessor.removeDecoration(this.breakpointHintDecoration);
                    this.breakpointHintDecoration = null;
                }
                if (showBreakpointHintAtLineNumber !== -1) {
                    this.breakpointHintDecoration = accessor.addDecoration({
                        startLineNumber: showBreakpointHintAtLineNumber,
                        startColumn: 1,
                        endLineNumber: showBreakpointHintAtLineNumber,
                        endColumn: 1
                    }, breakpointHelperDecoration);
                }
            });
        }
        async setDecorations() {
            if (!this.editor.hasModel()) {
                return;
            }
            const setCandidateDecorations = (changeAccessor, desiredCandidatePositions) => {
                const desiredCandidateDecorations = createCandidateDecorations(model, this.breakpointDecorations, desiredCandidatePositions);
                const candidateDecorationIds = changeAccessor.deltaDecorations(this.candidateDecorations.map(c => c.decorationId), desiredCandidateDecorations);
                this.candidateDecorations.forEach(candidate => {
                    candidate.inlineWidget.dispose();
                });
                this.candidateDecorations = candidateDecorationIds.map((decorationId, index) => {
                    const candidate = desiredCandidateDecorations[index];
                    // Candidate decoration has a breakpoint attached when a breakpoint is already at that location and we did not yet set a decoration there
                    // In practice this happens for the first breakpoint that was set on a line
                    // We could have also rendered this first decoration as part of desiredBreakpointDecorations however at that moment we have no location information
                    const icon = candidate.breakpoint ? (0, breakpointsView_1.getBreakpointMessageAndIcon)(this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), candidate.breakpoint, this.labelService, this.debugService.getModel()).icon : icons.breakpoint.disabled;
                    const contextMenuActions = () => this.getContextMenuActions(candidate.breakpoint ? [candidate.breakpoint] : [], activeCodeEditor.getModel().uri, candidate.range.startLineNumber, candidate.range.startColumn);
                    const inlineWidget = new InlineBreakpointWidget(activeCodeEditor, decorationId, themables_1.ThemeIcon.asClassName(icon), candidate.breakpoint, this.debugService, this.contextMenuService, contextMenuActions);
                    return {
                        decorationId,
                        inlineWidget
                    };
                });
            };
            const activeCodeEditor = this.editor;
            const model = activeCodeEditor.getModel();
            const breakpoints = this.debugService.getModel().getBreakpoints({ uri: model.uri });
            const debugSettings = this.configurationService.getValue('debug');
            const desiredBreakpointDecorations = this.instantiationService.invokeFunction(accessor => createBreakpointDecorations(accessor, model, breakpoints, this.debugService.state, this.debugService.getModel().areBreakpointsActivated(), debugSettings.showBreakpointsInOverviewRuler));
            // try to set breakpoint location candidates in the same changeDecorations()
            // call to avoid flickering, if the DA responds reasonably quickly.
            const session = this.debugService.getViewModel().focusedSession;
            const desiredCandidatePositions = debugSettings.showInlineBreakpointCandidates && session ? requestBreakpointCandidateLocations(this.editor.getModel(), desiredBreakpointDecorations.map(bp => bp.range.startLineNumber), session) : Promise.resolve([]);
            const desiredCandidatePositionsRaced = await Promise.race([desiredCandidatePositions, (0, async_1.timeout)(500).then(() => undefined)]);
            if (desiredCandidatePositionsRaced === undefined) { // the timeout resolved first
                desiredCandidatePositions.then(v => activeCodeEditor.changeDecorations(d => setCandidateDecorations(d, v)));
            }
            try {
                this.ignoreDecorationsChangedEvent = true;
                // Set breakpoint decorations
                activeCodeEditor.changeDecorations((changeAccessor) => {
                    const decorationIds = changeAccessor.deltaDecorations(this.breakpointDecorations.map(bpd => bpd.decorationId), desiredBreakpointDecorations);
                    this.breakpointDecorations.forEach(bpd => {
                        bpd.inlineWidget?.dispose();
                    });
                    this.breakpointDecorations = decorationIds.map((decorationId, index) => {
                        let inlineWidget = undefined;
                        const breakpoint = breakpoints[index];
                        if (desiredBreakpointDecorations[index].options.before) {
                            const contextMenuActions = () => this.getContextMenuActions([breakpoint], activeCodeEditor.getModel().uri, breakpoint.lineNumber, breakpoint.column);
                            inlineWidget = new InlineBreakpointWidget(activeCodeEditor, decorationId, desiredBreakpointDecorations[index].options.glyphMarginClassName, breakpoint, this.debugService, this.contextMenuService, contextMenuActions);
                        }
                        return {
                            decorationId,
                            breakpoint,
                            range: desiredBreakpointDecorations[index].range,
                            inlineWidget
                        };
                    });
                    if (desiredCandidatePositionsRaced) {
                        setCandidateDecorations(changeAccessor, desiredCandidatePositionsRaced);
                    }
                });
            }
            finally {
                this.ignoreDecorationsChangedEvent = false;
            }
            for (const d of this.breakpointDecorations) {
                if (d.inlineWidget) {
                    this.editor.layoutContentWidget(d.inlineWidget);
                }
            }
        }
        async onModelDecorationsChanged() {
            if (this.breakpointDecorations.length === 0 || this.ignoreDecorationsChangedEvent || !this.editor.hasModel()) {
                // I have no decorations
                return;
            }
            let somethingChanged = false;
            const model = this.editor.getModel();
            this.breakpointDecorations.forEach(breakpointDecoration => {
                if (somethingChanged) {
                    return;
                }
                const newBreakpointRange = model.getDecorationRange(breakpointDecoration.decorationId);
                if (newBreakpointRange && (!breakpointDecoration.range.equalsRange(newBreakpointRange))) {
                    somethingChanged = true;
                    breakpointDecoration.range = newBreakpointRange;
                }
            });
            if (!somethingChanged) {
                // nothing to do, my decorations did not change.
                return;
            }
            const data = new Map();
            for (let i = 0, len = this.breakpointDecorations.length; i < len; i++) {
                const breakpointDecoration = this.breakpointDecorations[i];
                const decorationRange = model.getDecorationRange(breakpointDecoration.decorationId);
                // check if the line got deleted.
                if (decorationRange) {
                    // since we know it is collapsed, it cannot grow to multiple lines
                    if (breakpointDecoration.breakpoint) {
                        data.set(breakpointDecoration.breakpoint.getId(), {
                            lineNumber: decorationRange.startLineNumber,
                            column: breakpointDecoration.breakpoint.column ? decorationRange.startColumn : undefined,
                        });
                    }
                }
            }
            try {
                this.ignoreBreakpointsChangeEvent = true;
                await this.debugService.updateBreakpoints(model.uri, data, true);
            }
            finally {
                this.ignoreBreakpointsChangeEvent = false;
            }
        }
        // breakpoint widget
        showBreakpointWidget(lineNumber, column, context) {
            this.breakpointWidget?.dispose();
            this.breakpointWidget = this.instantiationService.createInstance(breakpointWidget_1.BreakpointWidget, this.editor, lineNumber, column, context);
            this.breakpointWidget.show({ lineNumber, column: 1 });
            this.breakpointWidgetVisible.set(true);
        }
        closeBreakpointWidget() {
            if (this.breakpointWidget) {
                this.breakpointWidget.dispose();
                this.breakpointWidget = undefined;
                this.breakpointWidgetVisible.reset();
                this.editor.focus();
            }
        }
        dispose() {
            this.breakpointWidget?.dispose();
            this.editor.removeDecorations(this.breakpointDecorations.map(bpd => bpd.decorationId));
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.BreakpointEditorContribution = BreakpointEditorContribution;
    exports.BreakpointEditorContribution = BreakpointEditorContribution = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, dialogs_1.IDialogService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, label_1.ILabelService)
    ], BreakpointEditorContribution);
    editorLineNumberMenu_1.GutterActionsRegistry.registerGutterActionsGenerator(({ lineNumber, editor, accessor }, result) => {
        const model = editor.getModel();
        const debugService = accessor.get(debug_1.IDebugService);
        if (!model || !debugService.getAdapterManager().hasEnabledDebuggers() || !debugService.canSetBreakpointsIn(model)) {
            return;
        }
        const breakpointEditorContribution = editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID);
        if (!breakpointEditorContribution) {
            return;
        }
        const actions = breakpointEditorContribution.getContextMenuActionsAtPosition(lineNumber, model);
        for (const action of actions) {
            result.push(action, '2_debug');
        }
    });
    class InlineBreakpointWidget {
        constructor(editor, decorationId, cssClass, breakpoint, debugService, contextMenuService, getContextMenuActions) {
            this.editor = editor;
            this.decorationId = decorationId;
            this.breakpoint = breakpoint;
            this.debugService = debugService;
            this.contextMenuService = contextMenuService;
            this.getContextMenuActions = getContextMenuActions;
            // editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = false;
            this.suppressMouseDown = true;
            this.toDispose = [];
            this.range = this.editor.getModel().getDecorationRange(decorationId);
            this.toDispose.push(this.editor.onDidChangeModelDecorations(() => {
                const model = this.editor.getModel();
                const range = model.getDecorationRange(this.decorationId);
                if (this.range && !this.range.equalsRange(range)) {
                    this.range = range;
                    this.editor.layoutContentWidget(this);
                }
            }));
            this.create(cssClass);
            this.editor.addContentWidget(this);
            this.editor.layoutContentWidget(this);
        }
        create(cssClass) {
            this.domNode = $('.inline-breakpoint-widget');
            if (cssClass) {
                this.domNode.classList.add(...cssClass.split(' '));
            }
            this.toDispose.push(dom.addDisposableListener(this.domNode, dom.EventType.CLICK, async (e) => {
                switch (this.breakpoint?.enabled) {
                    case undefined:
                        await this.debugService.addBreakpoints(this.editor.getModel().uri, [{ lineNumber: this.range.startLineNumber, column: this.range.startColumn }]);
                        break;
                    case true:
                        await this.debugService.removeBreakpoints(this.breakpoint.getId());
                        break;
                    case false:
                        this.debugService.enableOrDisableBreakpoints(true, this.breakpoint);
                        break;
                }
            }));
            this.toDispose.push(dom.addDisposableListener(this.domNode, dom.EventType.CONTEXT_MENU, e => {
                const event = new mouseEvent_1.StandardMouseEvent(dom.getWindow(this.domNode), e);
                const actions = this.getContextMenuActions();
                this.contextMenuService.showContextMenu({
                    getAnchor: () => event,
                    getActions: () => actions,
                    getActionsContext: () => this.breakpoint,
                    onHide: () => (0, lifecycle_1.disposeIfDisposable)(actions)
                });
            }));
            const updateSize = () => {
                const lineHeight = this.editor.getOption(67 /* EditorOption.lineHeight */);
                this.domNode.style.height = `${lineHeight}px`;
                this.domNode.style.width = `${Math.ceil(0.8 * lineHeight)}px`;
                this.domNode.style.marginLeft = `4px`;
            };
            updateSize();
            this.toDispose.push(this.editor.onDidChangeConfiguration(c => {
                if (c.hasChanged(52 /* EditorOption.fontSize */) || c.hasChanged(67 /* EditorOption.lineHeight */)) {
                    updateSize();
                }
            }));
        }
        getId() {
            return (0, uuid_1.generateUuid)();
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            if (!this.range) {
                return null;
            }
            // Workaround: since the content widget can not be placed before the first column we need to force the left position
            this.domNode.classList.toggle('line-start', this.range.startColumn === 1);
            return {
                position: { lineNumber: this.range.startLineNumber, column: this.range.startColumn - 1 },
                preference: [0 /* ContentWidgetPositionPreference.EXACT */]
            };
        }
        dispose() {
            this.editor.removeContentWidget(this);
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    }
    __decorate([
        decorators_1.memoize
    ], InlineBreakpointWidget.prototype, "getId", null);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const debugIconBreakpointColor = theme.getColor(exports.debugIconBreakpointForeground);
        if (debugIconBreakpointColor) {
            collector.addRule(`
		${icons.allBreakpoints.map(b => `.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(b.regular)}`).join(',\n		')},
		.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugBreakpointUnsupported)},
		.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugBreakpointHint)}:not([class*='codicon-debug-breakpoint']):not([class*='codicon-debug-stackframe']),
		.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.breakpoint.regular)}${themables_1.ThemeIcon.asCSSSelector(icons.debugStackframeFocused)}::after,
		.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.breakpoint.regular)}${themables_1.ThemeIcon.asCSSSelector(icons.debugStackframe)}::after {
			color: ${debugIconBreakpointColor} !important;
		}
		`);
            collector.addRule(`
		.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.breakpoint.pending)} {
			color: ${debugIconBreakpointColor} !important;
			font-size: 12px !important;
		}
		`);
        }
        const debugIconBreakpointDisabledColor = theme.getColor(debugIconBreakpointDisabledForeground);
        if (debugIconBreakpointDisabledColor) {
            collector.addRule(`
		${icons.allBreakpoints.map(b => `.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(b.disabled)}`).join(',\n		')} {
			color: ${debugIconBreakpointDisabledColor};
		}
		`);
        }
        const debugIconBreakpointUnverifiedColor = theme.getColor(debugIconBreakpointUnverifiedForeground);
        if (debugIconBreakpointUnverifiedColor) {
            collector.addRule(`
		${icons.allBreakpoints.map(b => `.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(b.unverified)}`).join(',\n		')} {
			color: ${debugIconBreakpointUnverifiedColor};
		}
		`);
        }
        const debugIconBreakpointCurrentStackframeForegroundColor = theme.getColor(debugIconBreakpointCurrentStackframeForeground);
        if (debugIconBreakpointCurrentStackframeForegroundColor) {
            collector.addRule(`
		.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStackframe)},
		.monaco-editor .debug-top-stack-frame-column {
			color: ${debugIconBreakpointCurrentStackframeForegroundColor} !important;
		}
		`);
        }
        const debugIconBreakpointStackframeFocusedColor = theme.getColor(debugIconBreakpointStackframeForeground);
        if (debugIconBreakpointStackframeFocusedColor) {
            collector.addRule(`
		.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStackframeFocused)} {
			color: ${debugIconBreakpointStackframeFocusedColor} !important;
		}
		`);
        }
    });
    exports.debugIconBreakpointForeground = (0, colorRegistry_1.registerColor)('debugIcon.breakpointForeground', { dark: '#E51400', light: '#E51400', hcDark: '#E51400', hcLight: '#E51400' }, nls.localize('debugIcon.breakpointForeground', 'Icon color for breakpoints.'));
    const debugIconBreakpointDisabledForeground = (0, colorRegistry_1.registerColor)('debugIcon.breakpointDisabledForeground', { dark: '#848484', light: '#848484', hcDark: '#848484', hcLight: '#848484' }, nls.localize('debugIcon.breakpointDisabledForeground', 'Icon color for disabled breakpoints.'));
    const debugIconBreakpointUnverifiedForeground = (0, colorRegistry_1.registerColor)('debugIcon.breakpointUnverifiedForeground', { dark: '#848484', light: '#848484', hcDark: '#848484', hcLight: '#848484' }, nls.localize('debugIcon.breakpointUnverifiedForeground', 'Icon color for unverified breakpoints.'));
    const debugIconBreakpointCurrentStackframeForeground = (0, colorRegistry_1.registerColor)('debugIcon.breakpointCurrentStackframeForeground', { dark: '#FFCC00', light: '#BE8700', hcDark: '#FFCC00', hcLight: '#BE8700' }, nls.localize('debugIcon.breakpointCurrentStackframeForeground', 'Icon color for the current breakpoint stack frame.'));
    const debugIconBreakpointStackframeForeground = (0, colorRegistry_1.registerColor)('debugIcon.breakpointStackframeForeground', { dark: '#89D185', light: '#89D185', hcDark: '#89D185', hcLight: '#89D185' }, nls.localize('debugIcon.breakpointStackframeForeground', 'Icon color for all breakpoint stack frames.'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludEVkaXRvckNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9icmVha3BvaW50RWRpdG9yQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlEaEcsa0VBb0JDO0lBckNELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFTaEIsTUFBTSwwQkFBMEIsR0FBNEI7UUFDM0QsV0FBVyxFQUFFLDhCQUE4QjtRQUMzQyxvQkFBb0IsRUFBRSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUM7UUFDdEUsV0FBVyxFQUFFLEVBQUUsUUFBUSxFQUFFLHVCQUFlLENBQUMsS0FBSyxFQUFFO1FBQ2hELHVCQUF1QixFQUFFLElBQUksNEJBQWMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLDJCQUEyQixDQUFDLENBQUM7UUFDdkgsVUFBVSw0REFBb0Q7S0FDOUQsQ0FBQztJQUVGLFNBQWdCLDJCQUEyQixDQUFDLFFBQTBCLEVBQUUsS0FBaUIsRUFBRSxXQUF1QyxFQUFFLEtBQVksRUFBRSxvQkFBNkIsRUFBRSw4QkFBdUM7UUFDdk4sTUFBTSxNQUFNLEdBQXlELEVBQUUsQ0FBQztRQUN4RSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDbEMsSUFBSSxVQUFVLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0seUJBQXlCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFB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