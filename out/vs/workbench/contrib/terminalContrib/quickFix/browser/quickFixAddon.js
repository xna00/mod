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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/arrays", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/workbench/contrib/terminal/browser/xterm/decorationStyles", "vs/platform/telemetry/common/telemetry", "vs/base/common/cancellation", "vs/workbench/services/extensions/common/extensions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/actionWidget/browser/actionWidget", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/label/common/label", "vs/base/common/network", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix", "vs/editor/contrib/codeAction/common/types", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/commands/common/commands"], function (require, exports, event_1, lifecycle_1, dom, arrays_1, nls_1, configuration_1, opener_1, decorationStyles_1, telemetry_1, cancellation_1, extensions_1, accessibilitySignalService_1, actionWidget_1, commandDetectionCapability_1, label_1, network_1, quickFix_1, types_1, codicons_1, themables_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickFixAddon = void 0;
    exports.getQuickFixesForCommand = getQuickFixesForCommand;
    const quickFixClasses = [
        "quick-fix" /* DecorationSelector.QuickFix */,
        "codicon" /* DecorationSelector.Codicon */,
        "terminal-command-decoration" /* DecorationSelector.CommandDecoration */,
        "xterm-decoration" /* DecorationSelector.XtermDecoration */
    ];
    let TerminalQuickFixAddon = class TerminalQuickFixAddon extends lifecycle_1.Disposable {
        constructor(_aliases, _capabilities, _quickFixService, _commandService, _configurationService, _accessibilitySignalService, _openerService, _telemetryService, _extensionService, _actionWidgetService, _labelService) {
            super();
            this._aliases = _aliases;
            this._capabilities = _capabilities;
            this._quickFixService = _quickFixService;
            this._commandService = _commandService;
            this._configurationService = _configurationService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._openerService = _openerService;
            this._telemetryService = _telemetryService;
            this._extensionService = _extensionService;
            this._actionWidgetService = _actionWidgetService;
            this._labelService = _labelService;
            this._onDidRequestRerunCommand = new event_1.Emitter();
            this.onDidRequestRerunCommand = this._onDidRequestRerunCommand.event;
            this._commandListeners = new Map();
            this._registeredSelectors = new Set();
            const commandDetectionCapability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (commandDetectionCapability) {
                this._registerCommandHandlers();
            }
            else {
                this._register(this._capabilities.onDidAddCapabilityType(c => {
                    if (c === 2 /* TerminalCapability.CommandDetection */) {
                        this._registerCommandHandlers();
                    }
                }));
            }
            this._register(this._quickFixService.onDidRegisterProvider(result => this.registerCommandFinishedListener(convertToQuickFixOptions(result))));
            this._quickFixService.extensionQuickFixes.then(quickFixSelectors => {
                for (const selector of quickFixSelectors) {
                    this.registerCommandSelector(selector);
                }
            });
            this._register(this._quickFixService.onDidRegisterCommandSelector(selector => this.registerCommandSelector(selector)));
            this._register(this._quickFixService.onDidUnregisterProvider(id => this._commandListeners.delete(id)));
        }
        activate(terminal) {
            this._terminal = terminal;
        }
        showMenu() {
            if (!this._currentRenderContext) {
                return;
            }
            // TODO: What's documentation do? Need a vscode command?
            const actions = this._currentRenderContext.quickFixes.map(f => new TerminalQuickFixItem(f, f.type, f.source, f.label, f.kind));
            const documentation = this._currentRenderContext.quickFixes.map(f => { return { id: f.source, title: f.label, tooltip: f.source }; });
            const actionSet = {
                // TODO: Documentation and actions are separate?
                documentation,
                allActions: actions,
                hasAutoFix: false,
                hasAIFix: false,
                allAIFixes: false,
                validActions: actions,
                dispose: () => { }
            };
            const delegate = {
                onSelect: async (fix) => {
                    fix.action?.run();
                    this._actionWidgetService.hide();
                    this._disposeQuickFix(fix.action.id, true);
                },
                onHide: () => {
                    this._terminal?.focus();
                },
            };
            this._actionWidgetService.show('quickFixWidget', false, toActionWidgetItems(actionSet.validActions, true), delegate, this._currentRenderContext.anchor, this._currentRenderContext.parentElement);
        }
        registerCommandSelector(selector) {
            if (this._registeredSelectors.has(selector.id)) {
                return;
            }
            const matcherKey = selector.commandLineMatcher.toString();
            const currentOptions = this._commandListeners.get(matcherKey) || [];
            currentOptions.push({
                id: selector.id,
                type: 'unresolved',
                commandLineMatcher: selector.commandLineMatcher,
                outputMatcher: selector.outputMatcher,
                commandExitResult: selector.commandExitResult,
                kind: selector.kind
            });
            this._registeredSelectors.add(selector.id);
            this._commandListeners.set(matcherKey, currentOptions);
        }
        registerCommandFinishedListener(options) {
            const matcherKey = options.commandLineMatcher.toString();
            let currentOptions = this._commandListeners.get(matcherKey) || [];
            // removes the unresolved options
            currentOptions = currentOptions.filter(o => o.id !== options.id);
            currentOptions.push(options);
            this._commandListeners.set(matcherKey, currentOptions);
        }
        _registerCommandHandlers() {
            const terminal = this._terminal;
            const commandDetection = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!terminal || !commandDetection) {
                return;
            }
            this._register(commandDetection.onCommandFinished(async (command) => await this._resolveQuickFixes(command, this._aliases)));
        }
        /**
         * Resolves quick fixes, if any, based on the
         * @param command & its output
         */
        async _resolveQuickFixes(command, aliases) {
            const terminal = this._terminal;
            if (!terminal || command.wasReplayed) {
                return;
            }
            if (command.command !== '' && this._lastQuickFixId) {
                this._disposeQuickFix(this._lastQuickFixId, false);
            }
            const resolver = async (selector, lines) => {
                if (lines === undefined) {
                    return undefined;
                }
                const id = selector.id;
                await this._extensionService.activateByEvent(`onTerminalQuickFixRequest:${id}`);
                return this._quickFixService.providers.get(id)?.provideTerminalQuickFixes(command, lines, {
                    type: 'resolved',
                    commandLineMatcher: selector.commandLineMatcher,
                    outputMatcher: selector.outputMatcher,
                    commandExitResult: selector.commandExitResult,
                    kind: selector.kind,
                    id: selector.id
                }, new cancellation_1.CancellationTokenSource().token);
            };
            const result = await getQuickFixesForCommand(aliases, terminal, command, this._commandListeners, this._commandService, this._openerService, this._labelService, this._onDidRequestRerunCommand, resolver);
            if (!result) {
                return;
            }
            this._quickFixes = result;
            this._lastQuickFixId = this._quickFixes[0].id;
            this._registerQuickFixDecoration();
        }
        _disposeQuickFix(id, ranQuickFix) {
            this._telemetryService?.publicLog2('terminal/quick-fix', {
                quickFixId: id,
                ranQuickFix
            });
            this._decoration?.dispose();
            this._decoration = undefined;
            this._quickFixes = undefined;
            this._lastQuickFixId = undefined;
        }
        /**
         * Registers a decoration with the quick fixes
         */
        _registerQuickFixDecoration() {
            if (!this._terminal) {
                return;
            }
            if (!this._quickFixes) {
                return;
            }
            const marker = this._terminal.registerMarker();
            if (!marker) {
                return;
            }
            const decoration = this._terminal.registerDecoration({ marker, layer: 'top' });
            if (!decoration) {
                return;
            }
            this._decoration = decoration;
            const fixes = this._quickFixes;
            if (!fixes) {
                decoration.dispose();
                return;
            }
            decoration?.onRender((e) => {
                const rect = e.getBoundingClientRect();
                const anchor = {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                };
                if (e.classList.contains("quick-fix" /* DecorationSelector.QuickFix */)) {
                    if (this._currentRenderContext) {
                        this._currentRenderContext.anchor = anchor;
                    }
                    return;
                }
                e.classList.add(...quickFixClasses);
                const isExplainOnly = fixes.every(e => e.kind === 'explain');
                if (isExplainOnly) {
                    e.classList.add('explainOnly');
                }
                e.classList.add(...themables_1.ThemeIcon.asClassNameArray(isExplainOnly ? codicons_1.Codicon.sparkle : codicons_1.Codicon.lightBulb));
                (0, decorationStyles_1.updateLayout)(this._configurationService, e);
                this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.terminalQuickFix);
                const parentElement = e.closest('.xterm').parentElement;
                if (!parentElement) {
                    return;
                }
                this._currentRenderContext = { quickFixes: fixes, anchor, parentElement };
                this._register(dom.addDisposableListener(e, dom.EventType.CLICK, () => this.showMenu()));
            });
            decoration.onDispose(() => this._currentRenderContext = undefined);
            this._quickFixes = undefined;
        }
    };
    exports.TerminalQuickFixAddon = TerminalQuickFixAddon;
    exports.TerminalQuickFixAddon = TerminalQuickFixAddon = __decorate([
        __param(2, quickFix_1.ITerminalQuickFixService),
        __param(3, commands_1.ICommandService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(6, opener_1.IOpenerService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, extensions_1.IExtensionService),
        __param(9, actionWidget_1.IActionWidgetService),
        __param(10, label_1.ILabelService)
    ], TerminalQuickFixAddon);
    async function getQuickFixesForCommand(aliases, terminal, terminalCommand, quickFixOptions, commandService, openerService, labelService, onDidRequestRerunCommand, getResolvedFixes) {
        // Prevent duplicates by tracking added entries
        const commandQuickFixSet = new Set();
        const openQuickFixSet = new Set();
        const fixes = [];
        const newCommand = terminalCommand.command;
        for (const options of quickFixOptions.values()) {
            for (const option of options) {
                if ((option.commandExitResult === 'success' && terminalCommand.exitCode !== 0) || (option.commandExitResult === 'error' && terminalCommand.exitCode === 0)) {
                    continue;
                }
                let quickFixes;
                if (option.type === 'resolved') {
                    quickFixes = await option.getQuickFixes(terminalCommand, (0, commandDetectionCapability_1.getLinesForCommand)(terminal.buffer.active, terminalCommand, terminal.cols, option.outputMatcher), option, new cancellation_1.CancellationTokenSource().token);
                }
                else if (option.type === 'unresolved') {
                    if (!getResolvedFixes) {
                        throw new Error('No resolved fix provider');
                    }
                    quickFixes = await getResolvedFixes(option, option.outputMatcher ? (0, commandDetectionCapability_1.getLinesForCommand)(terminal.buffer.active, terminalCommand, terminal.cols, option.outputMatcher) : undefined);
                }
                else if (option.type === 'internal') {
                    const commandLineMatch = newCommand.match(option.commandLineMatcher);
                    if (!commandLineMatch) {
                        continue;
                    }
                    const outputMatcher = option.outputMatcher;
                    let outputMatch;
                    if (outputMatcher) {
                        outputMatch = terminalCommand.getOutputMatch(outputMatcher);
                    }
                    if (!outputMatch) {
                        continue;
                    }
                    const matchResult = { commandLineMatch, outputMatch, commandLine: terminalCommand.command };
                    quickFixes = option.getQuickFixes(matchResult);
                }
                if (quickFixes) {
                    for (const quickFix of (0, arrays_1.asArray)(quickFixes)) {
                        let action;
                        if ('type' in quickFix) {
                            switch (quickFix.type) {
                                case quickFix_1.TerminalQuickFixType.TerminalCommand: {
                                    const fix = quickFix;
                                    if (commandQuickFixSet.has(fix.terminalCommand)) {
                                        continue;
                                    }
                                    commandQuickFixSet.add(fix.terminalCommand);
                                    const label = (0, nls_1.localize)('quickFix.command', 'Run: {0}', fix.terminalCommand);
                                    action = {
                                        type: quickFix_1.TerminalQuickFixType.TerminalCommand,
                                        kind: option.kind,
                                        class: undefined,
                                        source: quickFix.source,
                                        id: quickFix.id,
                                        label,
                                        enabled: true,
                                        run: () => {
                                            onDidRequestRerunCommand?.fire({
                                                command: fix.terminalCommand,
                                                shouldExecute: fix.shouldExecute ?? true
                                            });
                                        },
                                        tooltip: label,
                                        command: fix.terminalCommand,
                                        shouldExecute: fix.shouldExecute
                                    };
                                    break;
                                }
                                case quickFix_1.TerminalQuickFixType.Opener: {
                                    const fix = quickFix;
                                    if (!fix.uri) {
                                        return;
                                    }
                                    if (openQuickFixSet.has(fix.uri.toString())) {
                                        continue;
                                    }
                                    openQuickFixSet.add(fix.uri.toString());
                                    const isUrl = (fix.uri.scheme === network_1.Schemas.http || fix.uri.scheme === network_1.Schemas.https);
                                    const uriLabel = isUrl ? encodeURI(fix.uri.toString(true)) : labelService.getUriLabel(fix.uri);
                                    const label = (0, nls_1.localize)('quickFix.opener', 'Open: {0}', uriLabel);
                                    action = {
                                        source: quickFix.source,
                                        id: quickFix.id,
                                        label,
                                        type: quickFix_1.TerminalQuickFixType.Opener,
                                        kind: option.kind,
                                        class: undefined,
                                        enabled: true,
                                        run: () => openerService.open(fix.uri),
                                        tooltip: label,
                                        uri: fix.uri
                                    };
                                    break;
                                }
                                case quickFix_1.TerminalQuickFixType.Port: {
                                    const fix = quickFix;
                                    action = {
                                        source: 'builtin',
                                        type: fix.type,
                                        kind: option.kind,
                                        id: fix.id,
                                        label: fix.label,
                                        class: fix.class,
                                        enabled: fix.enabled,
                                        run: () => {
                                            fix.run();
                                        },
                                        tooltip: fix.tooltip
                                    };
                                    break;
                                }
                                case quickFix_1.TerminalQuickFixType.VscodeCommand: {
                                    const fix = quickFix;
                                    action = {
                                        source: quickFix.source,
                                        type: fix.type,
                                        kind: option.kind,
                                        id: fix.id,
                                        label: fix.title,
                                        class: undefined,
                                        enabled: true,
                                        run: () => commandService.executeCommand(fix.id),
                                        tooltip: fix.title
                                    };
                                    break;
                                }
                            }
                            if (action) {
                                fixes.push(action);
                            }
                        }
                    }
                }
            }
        }
        return fixes.length > 0 ? fixes : undefined;
    }
    function convertToQuickFixOptions(selectorProvider) {
        return {
            id: selectorProvider.selector.id,
            type: 'resolved',
            commandLineMatcher: selectorProvider.selector.commandLineMatcher,
            outputMatcher: selectorProvider.selector.outputMatcher,
            commandExitResult: selectorProvider.selector.commandExitResult,
            kind: selectorProvider.selector.kind,
            getQuickFixes: selectorProvider.provider.provideTerminalQuickFixes
        };
    }
    class TerminalQuickFixItem {
        constructor(action, type, source, title, kind = 'fix') {
            this.action = action;
            this.type = type;
            this.source = source;
            this.title = title;
            this.kind = kind;
            this.disabled = false;
        }
    }
    function toActionWidgetItems(inputQuickFixes, showHeaders) {
        const menuItems = [];
        menuItems.push({
            kind: "header" /* ActionListItemKind.Header */,
            group: {
                kind: types_1.CodeActionKind.QuickFix,
                title: (0, nls_1.localize)('codeAction.widget.id.quickfix', 'Quick Fix')
            }
        });
        for (const quickFix of showHeaders ? inputQuickFixes : inputQuickFixes.filter(i => !!i.action)) {
            if (!quickFix.disabled && quickFix.action) {
                menuItems.push({
                    kind: "action" /* ActionListItemKind.Action */,
                    item: quickFix,
                    group: {
                        kind: types_1.CodeActionKind.QuickFix,
                        icon: getQuickFixIcon(quickFix),
                        title: quickFix.action.label
                    },
                    disabled: false,
                    label: quickFix.title
                });
            }
        }
        return menuItems;
    }
    function getQuickFixIcon(quickFix) {
        if (quickFix.kind === 'explain') {
            return codicons_1.Codicon.sparkle;
        }
        switch (quickFix.type) {
            case quickFix_1.TerminalQuickFixType.Opener:
                if ('uri' in quickFix.action && quickFix.action.uri) {
                    const isUrl = (quickFix.action.uri.scheme === network_1.Schemas.http || quickFix.action.uri.scheme === network_1.Schemas.https);
                    return isUrl ? codicons_1.Codicon.linkExternal : codicons_1.Codicon.goToFile;
                }
            case quickFix_1.TerminalQuickFixType.TerminalCommand:
                return codicons_1.Codicon.run;
            case quickFix_1.TerminalQuickFixType.Port:
                return codicons_1.Codicon.debugDisconnect;
            case quickFix_1.TerminalQuickFixType.VscodeCommand:
                return codicons_1.Codicon.lightbulb;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tGaXhBZGRvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3F1aWNrRml4L2Jyb3dzZXIvcXVpY2tGaXhBZGRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtVGhHLDBEQW1KQztJQW5hRCxNQUFNLGVBQWUsR0FBRzs7Ozs7S0FLdkIsQ0FBQztJQVlLLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFrQnBELFlBQ2tCLFFBQWdDLEVBQ2hDLGFBQXVDLEVBQzlCLGdCQUEyRCxFQUNwRSxlQUFpRCxFQUMzQyxxQkFBNkQsRUFDdkQsMkJBQXlFLEVBQ3RGLGNBQStDLEVBQzVDLGlCQUFxRCxFQUNyRCxpQkFBcUQsRUFDbEQsb0JBQTJELEVBQ2xFLGFBQTZDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBWlMsYUFBUSxHQUFSLFFBQVEsQ0FBd0I7WUFDaEMsa0JBQWEsR0FBYixhQUFhLENBQTBCO1lBQ2IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUEwQjtZQUNuRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDMUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN0QyxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBQ3JFLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUMzQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3BDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDakMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFzQjtZQUNqRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQTVCNUMsOEJBQXlCLEdBQUcsSUFBSSxlQUFPLEVBQWdELENBQUM7WUFDaEcsNkJBQXdCLEdBQUcsSUFBSSxD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