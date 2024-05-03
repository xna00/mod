/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalContributionsDescriptor = exports.DEFAULT_COMMANDS_TO_SKIP_SHELL = exports.TerminalCommandId = exports.QUICK_LAUNCH_PROFILE_CHOICE = exports.ProcessState = exports.isTerminalProcessManager = exports.DEFAULT_LOCAL_ECHO_EXCLUDE = exports.ITerminalProfileService = exports.ShellIntegrationExitCode = exports.ITerminalProfileResolverService = exports.SUGGESTIONS_FONT_WEIGHT = exports.DEFAULT_BOLD_FONT_WEIGHT = exports.DEFAULT_FONT_WEIGHT = exports.MAXIMUM_FONT_WEIGHT = exports.MINIMUM_FONT_WEIGHT = exports.DEFAULT_LINE_HEIGHT = exports.MINIMUM_LETTER_SPACING = exports.DEFAULT_LETTER_SPACING = exports.TERMINAL_CONFIG_SECTION = exports.TERMINAL_CREATION_COMMANDS = exports.TERMINAL_VIEW_ID = void 0;
    exports.TERMINAL_VIEW_ID = 'terminal';
    exports.TERMINAL_CREATION_COMMANDS = ['workbench.action.terminal.toggleTerminal', 'workbench.action.terminal.new', 'workbench.action.togglePanel', 'workbench.action.terminal.focus'];
    exports.TERMINAL_CONFIG_SECTION = 'terminal.integrated';
    exports.DEFAULT_LETTER_SPACING = 0;
    exports.MINIMUM_LETTER_SPACING = -5;
    exports.DEFAULT_LINE_HEIGHT = 1;
    exports.MINIMUM_FONT_WEIGHT = 1;
    exports.MAXIMUM_FONT_WEIGHT = 1000;
    exports.DEFAULT_FONT_WEIGHT = 'normal';
    exports.DEFAULT_BOLD_FONT_WEIGHT = 'bold';
    exports.SUGGESTIONS_FONT_WEIGHT = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    exports.ITerminalProfileResolverService = (0, instantiation_1.createDecorator)('terminalProfileResolverService');
    /*
     * When there were shell integration args injected
     * and createProcess returns an error, this exit code will be used.
     */
    exports.ShellIntegrationExitCode = 633;
    exports.ITerminalProfileService = (0, instantiation_1.createDecorator)('terminalProfileService');
    exports.DEFAULT_LOCAL_ECHO_EXCLUDE = ['vim', 'vi', 'nano', 'tmux'];
    const isTerminalProcessManager = (t) => typeof t.write === 'function';
    exports.isTerminalProcessManager = isTerminalProcessManager;
    var ProcessState;
    (function (ProcessState) {
        // The process has not been initialized yet.
        ProcessState[ProcessState["Uninitialized"] = 1] = "Uninitialized";
        // The process is currently launching, the process is marked as launching
        // for a short duration after being created and is helpful to indicate
        // whether the process died as a result of bad shell and args.
        ProcessState[ProcessState["Launching"] = 2] = "Launching";
        // The process is running normally.
        ProcessState[ProcessState["Running"] = 3] = "Running";
        // The process was killed during launch, likely as a result of bad shell and
        // args.
        ProcessState[ProcessState["KilledDuringLaunch"] = 4] = "KilledDuringLaunch";
        // The process was killed by the user (the event originated from VS Code).
        ProcessState[ProcessState["KilledByUser"] = 5] = "KilledByUser";
        // The process was killed by itself, for example the shell crashed or `exit`
        // was run.
        ProcessState[ProcessState["KilledByProcess"] = 6] = "KilledByProcess";
    })(ProcessState || (exports.ProcessState = ProcessState = {}));
    exports.QUICK_LAUNCH_PROFILE_CHOICE = 'workbench.action.terminal.profile.choice';
    var TerminalCommandId;
    (function (TerminalCommandId) {
        TerminalCommandId["FindNext"] = "workbench.action.terminal.findNext";
        TerminalCommandId["FindPrevious"] = "workbench.action.terminal.findPrevious";
        TerminalCommandId["Toggle"] = "workbench.action.terminal.toggleTerminal";
        TerminalCommandId["Kill"] = "workbench.action.terminal.kill";
        TerminalCommandId["KillViewOrEditor"] = "workbench.action.terminal.killViewOrEditor";
        TerminalCommandId["KillEditor"] = "workbench.action.terminal.killEditor";
        TerminalCommandId["KillActiveTab"] = "workbench.action.terminal.killActiveTab";
        TerminalCommandId["KillAll"] = "workbench.action.terminal.killAll";
        TerminalCommandId["QuickKill"] = "workbench.action.terminal.quickKill";
        TerminalCommandId["ConfigureTerminalSettings"] = "workbench.action.terminal.openSettings";
        TerminalCommandId["OpenDetectedLink"] = "workbench.action.terminal.openDetectedLink";
        TerminalCommandId["OpenWordLink"] = "workbench.action.terminal.openWordLink";
        TerminalCommandId["ShellIntegrationLearnMore"] = "workbench.action.terminal.learnMore";
        TerminalCommandId["OpenFileLink"] = "workbench.action.terminal.openFileLink";
        TerminalCommandId["OpenWebLink"] = "workbench.action.terminal.openUrlLink";
        TerminalCommandId["RunRecentCommand"] = "workbench.action.terminal.runRecentCommand";
        TerminalCommandId["FocusAccessibleBuffer"] = "workbench.action.terminal.focusAccessibleBuffer";
        TerminalCommandId["AccessibleBufferGoToNextCommand"] = "workbench.action.terminal.accessibleBufferGoToNextCommand";
        TerminalCommandId["AccessibleBufferGoToPreviousCommand"] = "workbench.action.terminal.accessibleBufferGoToPreviousCommand";
        TerminalCommandId["CopyLastCommand"] = "workbench.action.terminal.copyLastCommand";
        TerminalCommandId["CopyLastCommandOutput"] = "workbench.action.terminal.copyLastCommandOutput";
        TerminalCommandId["CopyLastCommandAndLastCommandOutput"] = "workbench.action.terminal.copyLastCommandAndLastCommandOutput";
        TerminalCommandId["GoToRecentDirectory"] = "workbench.action.terminal.goToRecentDirectory";
        TerminalCommandId["CopyAndClearSelection"] = "workbench.action.terminal.copyAndClearSelection";
        TerminalCommandId["CopySelection"] = "workbench.action.terminal.copySelection";
        TerminalCommandId["CopySelectionAsHtml"] = "workbench.action.terminal.copySelectionAsHtml";
        TerminalCommandId["SelectAll"] = "workbench.action.terminal.selectAll";
        TerminalCommandId["DeleteWordLeft"] = "workbench.action.terminal.deleteWordLeft";
        TerminalCommandId["DeleteWordRight"] = "workbench.action.terminal.deleteWordRight";
        TerminalCommandId["DeleteToLineStart"] = "workbench.action.terminal.deleteToLineStart";
        TerminalCommandId["MoveToLineStart"] = "workbench.action.terminal.moveToLineStart";
        TerminalCommandId["MoveToLineEnd"] = "workbench.action.terminal.moveToLineEnd";
        TerminalCommandId["New"] = "workbench.action.terminal.new";
        TerminalCommandId["NewWithCwd"] = "workbench.action.terminal.newWithCwd";
        TerminalCommandId["NewLocal"] = "workbench.action.terminal.newLocal";
        TerminalCommandId["NewInActiveWorkspace"] = "workbench.action.terminal.newInActiveWorkspace";
        TerminalCommandId["NewWithProfile"] = "workbench.action.terminal.newWithProfile";
        TerminalCommandId["Split"] = "workbench.action.terminal.split";
        TerminalCommandId["SplitActiveTab"] = "workbench.action.terminal.splitActiveTab";
        TerminalCommandId["SplitInActiveWorkspace"] = "workbench.action.terminal.splitInActiveWorkspace";
        TerminalCommandId["ShowQuickFixes"] = "workbench.action.terminal.showQuickFixes";
        TerminalCommandId["Unsplit"] = "workbench.action.terminal.unsplit";
        TerminalCommandId["JoinActiveTab"] = "workbench.action.terminal.joinActiveTab";
        TerminalCommandId["Join"] = "workbench.action.terminal.join";
        TerminalCommandId["Relaunch"] = "workbench.action.terminal.relaunch";
        TerminalCommandId["FocusPreviousPane"] = "workbench.action.terminal.focusPreviousPane";
        TerminalCommandId["CreateTerminalEditor"] = "workbench.action.createTerminalEditor";
        TerminalCommandId["CreateTerminalEditorSameGroup"] = "workbench.action.createTerminalEditorSameGroup";
        TerminalCommandId["CreateTerminalEditorSide"] = "workbench.action.createTerminalEditorSide";
        TerminalCommandId["FocusTabs"] = "workbench.action.terminal.focusTabs";
        TerminalCommandId["FocusNextPane"] = "workbench.action.terminal.focusNextPane";
        TerminalCommandId["ResizePaneLeft"] = "workbench.action.terminal.resizePaneLeft";
        TerminalCommandId["ResizePaneRight"] = "workbench.action.terminal.resizePaneRight";
        TerminalCommandId["ResizePaneUp"] = "workbench.action.terminal.resizePaneUp";
        TerminalCommandId["SizeToContentWidth"] = "workbench.action.terminal.sizeToContentWidth";
        TerminalCommandId["SizeToContentWidthActiveTab"] = "workbench.action.terminal.sizeToContentWidthActiveTab";
        TerminalCommandId["ResizePaneDown"] = "workbench.action.terminal.resizePaneDown";
        TerminalCommandId["Focus"] = "workbench.action.terminal.focus";
        TerminalCommandId["FocusNext"] = "workbench.action.terminal.focusNext";
        TerminalCommandId["FocusPrevious"] = "workbench.action.terminal.focusPrevious";
        TerminalCommandId["Paste"] = "workbench.action.terminal.paste";
        TerminalCommandId["PasteSelection"] = "workbench.action.terminal.pasteSelection";
        TerminalCommandId["SelectDefaultProfile"] = "workbench.action.terminal.selectDefaultShell";
        TerminalCommandId["RunSelectedText"] = "workbench.action.terminal.runSelectedText";
        TerminalCommandId["RunActiveFile"] = "workbench.action.terminal.runActiveFile";
        TerminalCommandId["SwitchTerminal"] = "workbench.action.terminal.switchTerminal";
        TerminalCommandId["ScrollDownLine"] = "workbench.action.terminal.scrollDown";
        TerminalCommandId["ScrollDownPage"] = "workbench.action.terminal.scrollDownPage";
        TerminalCommandId["ScrollToBottom"] = "workbench.action.terminal.scrollToBottom";
        TerminalCommandId["ScrollToBottomAccessibleView"] = "workbench.action.terminal.scrollToBottomAccessibleView";
        TerminalCommandId["ScrollUpLine"] = "workbench.action.terminal.scrollUp";
        TerminalCommandId["ScrollUpPage"] = "workbench.action.terminal.scrollUpPage";
        TerminalCommandId["ScrollToTop"] = "workbench.action.terminal.scrollToTop";
        TerminalCommandId["ScrollToTopAccessibleView"] = "workbench.action.terminal.scrollToTopAccessibleView";
        TerminalCommandId["Clear"] = "workbench.action.terminal.clear";
        TerminalCommandId["ClearSelection"] = "workbench.action.terminal.clearSelection";
        TerminalCommandId["ChangeIcon"] = "workbench.action.terminal.changeIcon";
        TerminalCommandId["ChangeIconActiveTab"] = "workbench.action.terminal.changeIconActiveTab";
        TerminalCommandId["ChangeColor"] = "workbench.action.terminal.changeColor";
        TerminalCommandId["ChangeColorActiveTab"] = "workbench.action.terminal.changeColorActiveTab";
        TerminalCommandId["Rename"] = "workbench.action.terminal.rename";
        TerminalCommandId["RenameActiveTab"] = "workbench.action.terminal.renameActiveTab";
        TerminalCommandId["RenameWithArgs"] = "workbench.action.terminal.renameWithArg";
        TerminalCommandId["FindFocus"] = "workbench.action.terminal.focusFind";
        TerminalCommandId["FindHide"] = "workbench.action.terminal.hideFind";
        TerminalCommandId["QuickOpenTerm"] = "workbench.action.quickOpenTerm";
        TerminalCommandId["ScrollToPreviousCommand"] = "workbench.action.terminal.scrollToPreviousCommand";
        TerminalCommandId["ScrollToNextCommand"] = "workbench.action.terminal.scrollToNextCommand";
        TerminalCommandId["SelectToPreviousCommand"] = "workbench.action.terminal.selectToPreviousCommand";
        TerminalCommandId["SelectToNextCommand"] = "workbench.action.terminal.selectToNextCommand";
        TerminalCommandId["SelectToPreviousLine"] = "workbench.action.terminal.selectToPreviousLine";
        TerminalCommandId["SelectToNextLine"] = "workbench.action.terminal.selectToNextLine";
        TerminalCommandId["SendSequence"] = "workbench.action.terminal.sendSequence";
        TerminalCommandId["ToggleFindRegex"] = "workbench.action.terminal.toggleFindRegex";
        TerminalCommandId["ToggleFindWholeWord"] = "workbench.action.terminal.toggleFindWholeWord";
        TerminalCommandId["ToggleFindCaseSensitive"] = "workbench.action.terminal.toggleFindCaseSensitive";
        TerminalCommandId["SearchWorkspace"] = "workbench.action.terminal.searchWorkspace";
        TerminalCommandId["AttachToSession"] = "workbench.action.terminal.attachToSession";
        TerminalCommandId["DetachSession"] = "workbench.action.terminal.detachSession";
        TerminalCommandId["MoveToEditor"] = "workbench.action.terminal.moveToEditor";
        TerminalCommandId["MoveToTerminalPanel"] = "workbench.action.terminal.moveToTerminalPanel";
        TerminalCommandId["MoveIntoNewWindow"] = "workbench.action.terminal.moveIntoNewWindow";
        TerminalCommandId["SetDimensions"] = "workbench.action.terminal.setDimensions";
        TerminalCommandId["ClearPreviousSessionHistory"] = "workbench.action.terminal.clearPreviousSessionHistory";
        TerminalCommandId["SelectPrevSuggestion"] = "workbench.action.terminal.selectPrevSuggestion";
        TerminalCommandId["SelectPrevPageSuggestion"] = "workbench.action.terminal.selectPrevPageSuggestion";
        TerminalCommandId["SelectNextSuggestion"] = "workbench.action.terminal.selectNextSuggestion";
        TerminalCommandId["SelectNextPageSuggestion"] = "workbench.action.terminal.selectNextPageSuggestion";
        TerminalCommandId["AcceptSelectedSuggestion"] = "workbench.action.terminal.acceptSelectedSuggestion";
        TerminalCommandId["HideSuggestWidget"] = "workbench.action.terminal.hideSuggestWidget";
        TerminalCommandId["FocusHover"] = "workbench.action.terminal.focusHover";
        TerminalCommandId["ShowEnvironmentContributions"] = "workbench.action.terminal.showEnvironmentContributions";
        TerminalCommandId["ToggleStickyScroll"] = "workbench.action.terminal.toggleStickyScroll";
        TerminalCommandId["StartVoice"] = "workbench.action.terminal.startVoice";
        TerminalCommandId["StopVoice"] = "workbench.action.terminal.stopVoice";
        TerminalCommandId["FontZoomIn"] = "workbench.action.terminal.fontZoomIn";
        TerminalCommandId["FontZoomOut"] = "workbench.action.terminal.fontZoomOut";
        TerminalCommandId["FontZoomReset"] = "workbench.action.terminal.fontZoomReset";
        // Developer commands
        TerminalCommandId["WriteDataToTerminal"] = "workbench.action.terminal.writeDataToTerminal";
        TerminalCommandId["ShowTextureAtlas"] = "workbench.action.terminal.showTextureAtlas";
        TerminalCommandId["RestartPtyHost"] = "workbench.action.terminal.restartPtyHost";
    })(TerminalCommandId || (exports.TerminalCommandId = TerminalCommandId = {}));
    exports.DEFAULT_COMMANDS_TO_SKIP_SHELL = [
        "workbench.action.terminal.clearSelection" /* TerminalCommandId.ClearSelection */,
        "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
        "workbench.action.terminal.copyAndClearSelection" /* TerminalCommandId.CopyAndClearSelection */,
        "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
        "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
        "workbench.action.terminal.copyLastCommand" /* TerminalCommandId.CopyLastCommand */,
        "workbench.action.terminal.copyLastCommandOutput" /* TerminalCommandId.CopyLastCommandOutput */,
        "workbench.action.terminal.copyLastCommandAndLastCommandOutput" /* TerminalCommandId.CopyLastCommandAndLastCommandOutput */,
        "workbench.action.terminal.deleteToLineStart" /* TerminalCommandId.DeleteToLineStart */,
        "workbench.action.terminal.deleteWordLeft" /* TerminalCommandId.DeleteWordLeft */,
        "workbench.action.terminal.deleteWordRight" /* TerminalCommandId.DeleteWordRight */,
        "workbench.action.terminal.focusFind" /* TerminalCommandId.FindFocus */,
        "workbench.action.terminal.hideFind" /* TerminalCommandId.FindHide */,
        "workbench.action.terminal.findNext" /* TerminalCommandId.FindNext */,
        "workbench.action.terminal.findPrevious" /* TerminalCommandId.FindPrevious */,
        "workbench.action.terminal.goToRecentDirectory" /* TerminalCommandId.GoToRecentDirectory */,
        "workbench.action.terminal.toggleFindRegex" /* TerminalCommandId.ToggleFindRegex */,
        "workbench.action.terminal.toggleFindWholeWord" /* TerminalCommandId.ToggleFindWholeWord */,
        "workbench.action.terminal.toggleFindCaseSensitive" /* TerminalCommandId.ToggleFindCaseSensitive */,
        "workbench.action.terminal.focusNextPane" /* TerminalCommandId.FocusNextPane */,
        "workbench.action.terminal.focusNext" /* TerminalCommandId.FocusNext */,
        "workbench.action.terminal.focusPreviousPane" /* TerminalCommandId.FocusPreviousPane */,
        "workbench.action.terminal.focusPrevious" /* TerminalCommandId.FocusPrevious */,
        "workbench.action.terminal.focus" /* TerminalCommandId.Focus */,
        "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
        "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
        "workbench.action.terminal.killEditor" /* TerminalCommandId.KillEditor */,
        "workbench.action.terminal.moveToEditor" /* TerminalCommandId.MoveToEditor */,
        "workbench.action.terminal.moveToLineEnd" /* TerminalCommandId.MoveToLineEnd */,
        "workbench.action.terminal.moveToLineStart" /* TerminalCommandId.MoveToLineStart */,
        "workbench.action.terminal.moveToTerminalPanel" /* TerminalCommandId.MoveToTerminalPanel */,
        "workbench.action.terminal.newInActiveWorkspace" /* TerminalCommandId.NewInActiveWorkspace */,
        "workbench.action.terminal.new" /* TerminalCommandId.New */,
        "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
        "workbench.action.terminal.pasteSelection" /* TerminalCommandId.PasteSelection */,
        "workbench.action.terminal.resizePaneDown" /* TerminalCommandId.ResizePaneDown */,
        "workbench.action.terminal.resizePaneLeft" /* TerminalCommandId.ResizePaneLeft */,
        "workbench.action.terminal.resizePaneRight" /* TerminalCommandId.ResizePaneRight */,
        "workbench.action.terminal.resizePaneUp" /* TerminalCommandId.ResizePaneUp */,
        "workbench.action.terminal.runActiveFile" /* TerminalCommandId.RunActiveFile */,
        "workbench.action.terminal.runSelectedText" /* TerminalCommandId.RunSelectedText */,
        "workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */,
        "workbench.action.terminal.scrollDown" /* TerminalCommandId.ScrollDownLine */,
        "workbench.action.terminal.scrollDownPage" /* TerminalCommandId.ScrollDownPage */,
        "workbench.action.terminal.scrollToBottom" /* TerminalCommandId.ScrollToBottom */,
        "workbench.action.terminal.scrollToNextCommand" /* TerminalCommandId.ScrollToNextCommand */,
        "workbench.action.terminal.scrollToPreviousCommand" /* TerminalCommandId.ScrollToPreviousCommand */,
        "workbench.action.terminal.scrollToTop" /* TerminalCommandId.ScrollToTop */,
        "workbench.action.terminal.scrollUp" /* TerminalCommandId.ScrollUpLine */,
        "workbench.action.terminal.scrollUpPage" /* TerminalCommandId.ScrollUpPage */,
        "workbench.action.terminal.sendSequence" /* TerminalCommandId.SendSequence */,
        "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
        "workbench.action.terminal.selectToNextCommand" /* TerminalCommandId.SelectToNextCommand */,
        "workbench.action.terminal.selectToNextLine" /* TerminalCommandId.SelectToNextLine */,
        "workbench.action.terminal.selectToPreviousCommand" /* TerminalCommandId.SelectToPreviousCommand */,
        "workbench.action.terminal.selectToPreviousLine" /* TerminalCommandId.SelectToPreviousLine */,
        "workbench.action.terminal.splitInActiveWorkspace" /* TerminalCommandId.SplitInActiveWorkspace */,
        "workbench.action.terminal.split" /* TerminalCommandId.Split */,
        "workbench.action.terminal.toggleTerminal" /* TerminalCommandId.Toggle */,
        "workbench.action.terminal.selectPrevSuggestion" /* TerminalCommandId.SelectPrevSuggestion */,
        "workbench.action.terminal.selectPrevPageSuggestion" /* TerminalCommandId.SelectPrevPageSuggestion */,
        "workbench.action.terminal.selectNextSuggestion" /* TerminalCommandId.SelectNextSuggestion */,
        "workbench.action.terminal.selectNextPageSuggestion" /* TerminalCommandId.SelectNextPageSuggestion */,
        "workbench.action.terminal.acceptSelectedSuggestion" /* TerminalCommandId.AcceptSelectedSuggestion */,
        "workbench.action.terminal.hideSuggestWidget" /* TerminalCommandId.HideSuggestWidget */,
        "workbench.action.terminal.focusHover" /* TerminalCommandId.FocusHover */,
        "workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */,
        "editor.action.accessibilityHelp" /* AccessibilityCommandId.OpenAccessibilityHelp */,
        'editor.action.toggleTabFocusMode',
        'notifications.hideList',
        'notifications.hideToasts',
        'workbench.action.closeQuickOpen',
        'workbench.action.quickOpen',
        'workbench.action.quickOpenPreviousEditor',
        'workbench.action.showCommands',
        'workbench.action.tasks.build',
        'workbench.action.tasks.restartTask',
        'workbench.action.tasks.runTask',
        'workbench.action.tasks.reRunTask',
        'workbench.action.tasks.showLog',
        'workbench.action.tasks.showTasks',
        'workbench.action.tasks.terminate',
        'workbench.action.tasks.test',
        'workbench.action.toggleFullScreen',
        'workbench.action.terminal.focusAtIndex1',
        'workbench.action.terminal.focusAtIndex2',
        'workbench.action.terminal.focusAtIndex3',
        'workbench.action.terminal.focusAtIndex4',
        'workbench.action.terminal.focusAtIndex5',
        'workbench.action.terminal.focusAtIndex6',
        'workbench.action.terminal.focusAtIndex7',
        'workbench.action.terminal.focusAtIndex8',
        'workbench.action.terminal.focusAtIndex9',
        'workbench.action.focusSecondEditorGroup',
        'workbench.action.focusThirdEditorGroup',
        'workbench.action.focusFourthEditorGroup',
        'workbench.action.focusFifthEditorGroup',
        'workbench.action.focusSixthEditorGroup',
        'workbench.action.focusSeventhEditorGroup',
        'workbench.action.focusEighthEditorGroup',
        'workbench.action.focusNextPart',
        'workbench.action.focusPreviousPart',
        'workbench.action.nextPanelView',
        'workbench.action.previousPanelView',
        'workbench.action.nextSideBarView',
        'workbench.action.previousSideBarView',
        'workbench.action.debug.start',
        'workbench.action.debug.stop',
        'workbench.action.debug.run',
        'workbench.action.debug.restart',
        'workbench.action.debug.continue',
        'workbench.action.debug.pause',
        'workbench.action.debug.stepInto',
        'workbench.action.debug.stepOut',
        'workbench.action.debug.stepOver',
        'workbench.action.nextEditor',
        'workbench.action.previousEditor',
        'workbench.action.nextEditorInGroup',
        'workbench.action.previousEditorInGroup',
        'workbench.action.openNextRecentlyUsedEditor',
        'workbench.action.openPreviousRecentlyUsedEditor',
        'workbench.action.openNextRecentlyUsedEditorInGroup',
        'workbench.action.openPreviousRecentlyUsedEditorInGroup',
        'workbench.action.quickOpenPreviousRecentlyUsedEditor',
        'workbench.action.quickOpenLeastRecentlyUsedEditor',
        'workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup',
        'workbench.action.quickOpenLeastRecentlyUsedEditorInGroup',
        'workbench.action.focusActiveEditorGroup',
        'workbench.action.focusFirstEditorGroup',
        'workbench.action.focusLastEditorGroup',
        'workbench.action.firstEditorInGroup',
        'workbench.action.lastEditorInGroup',
        'workbench.action.navigateUp',
        'workbench.action.navigateDown',
        'workbench.action.navigateRight',
        'workbench.action.navigateLeft',
        'workbench.action.togglePanel',
        'workbench.action.quickOpenView',
        'workbench.action.toggleMaximizedPanel',
        'notification.acceptPrimaryAction',
        'runCommands',
        'workbench.action.terminal.chat.start',
        'workbench.action.terminal.chat.close',
        'workbench.action.terminal.chat.discard',
        'workbench.action.terminal.chat.makeRequest',
        'workbench.action.terminal.chat.cancel',
        'workbench.action.terminal.chat.feedbackHelpful',
        'workbench.action.terminal.chat.feedbackUnhelpful',
        'workbench.action.terminal.chat.feedbackReportIssue',
        'workbench.action.terminal.chat.runCommand',
        'workbench.action.terminal.chat.insertCommand',
        'workbench.action.terminal.chat.viewInChat',
    ];
    exports.terminalContributionsDescriptor = {
        extensionPoint: 'terminal',
        defaultExtensionKind: ['workspace'],
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                for (const profileContrib of (contrib.profiles ?? [])) {
                    result.push(`onTerminalProfile:${profileContrib.id}`);
                }
            }
        },
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.terminal', 'Contributes terminal functionality.'),
            type: 'object',
            properties: {
                profiles: {
                    type: 'array',
                    description: nls.localize('vscode.extension.contributes.terminal.profiles', "Defines additional terminal profiles that the user can create."),
                    items: {
                        type: 'object',
                        required: ['id', 'title'],
                        defaultSnippets: [{
                                body: {
                                    id: '$1',
                                    title: '$2'
                                }
                            }],
                        properties: {
                            id: {
                                description: nls.localize('vscode.extension.contributes.terminal.profiles.id', "The ID of the terminal profile provider."),
                                type: 'string',
                            },
                            title: {
                                description: nls.localize('vscode.extension.contributes.terminal.profiles.title', "Title for this terminal profile."),
                                type: 'string',
                            },
                            icon: {
                                description: nls.localize('vscode.extension.contributes.terminal.types.icon', "A codicon, URI, or light and dark URIs to associate with this terminal type."),
                                anyOf: [{
                                        type: 'string',
                                    },
                                    {
                                        type: 'object',
                                        properties: {
                                            light: {
                                                description: nls.localize('vscode.extension.contributes.terminal.types.icon.light', 'Icon path when a light theme is used'),
                                                type: 'string'
                                            },
                                            dark: {
                                                description: nls.localize('vscode.extension.contributes.terminal.types.icon.dark', 'Icon path when a dark theme is used'),
                                                type: 'string'
                                            }
                                        }
                                    }]
                            },
                        },
                    },
                },
            },
        },
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2NvbW1vbi90ZXJtaW5hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQm5GLFFBQUEsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDO0lBRTlCLFFBQUEsMEJBQTBCLEdBQUcsQ0FBQywwQ0FBMEMsRUFBRSwrQkFBK0IsRUFBRSw4QkFBOEIsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO0lBRTlLLFFBQUEsdUJBQXVCLEdBQUcscUJBQXFCLENBQUM7SUFFaEQsUUFBQSxzQkFBc0IsR0FBRyxDQUFDLENBQUM7SUFDM0IsUUFBQSxzQkFBc0IsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM1QixRQUFBLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUV4QixRQUFBLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUN4QixRQUFBLG1CQUFtQixHQUFHLElBQUksQ0FBQztJQUMzQixRQUFBLG1CQUFtQixHQUFHLFFBQVEsQ0FBQztJQUMvQixRQUFBLHdCQUF3QixHQUFHLE1BQU0sQ0FBQztJQUNsQyxRQUFBLHVCQUF1QixHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTVHLFFBQUEsK0JBQStCLEdBQUcsSUFBQSwrQkFBZSxFQUFrQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBa0JsSTs7O09BR0c7SUFDVSxRQUFBLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztJQU0vQixRQUFBLHVCQUF1QixHQUFHLElBQUEsK0JBQWUsRUFBMEIsd0JBQXdCLENBQUMsQ0FBQztJ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MkQsQ0FBQTtRQUMzRCw0R0FBdUYsQ0FBQTtRQUN2Rix3RUFBbUQsQ0FBQTtRQUNuRCw0RUFBdUQsQ0FBQTtRQUN2RCwwRUFBcUQsQ0FBQTtRQUNyRCxzR0FBaUYsQ0FBQTtRQUNqRiw4REFBeUMsQ0FBQTtRQUN6QyxnRkFBMkQsQ0FBQTtRQUMzRCx3RUFBbUQsQ0FBQTtRQUNuRCwwRkFBcUUsQ0FBQTtRQUNyRSwwRUFBcUQsQ0FBQTtRQUNyRCw0RkFBdUUsQ0FBQTtRQUN2RSxnRUFBMkMsQ0FBQTtRQUMzQyxrRkFBNkQsQ0FBQTtRQUM3RCwrRUFBMEQsQ0FBQTtRQUMxRCxzRUFBaUQsQ0FBQTtRQUNqRCxvRUFBK0MsQ0FBQTtRQUMvQyxxRUFBZ0QsQ0FBQTtRQUNoRCxrR0FBNkUsQ0FBQTtRQUM3RSwwRkFBcUUsQ0FBQTtRQUNyRSxrR0FBNkUsQ0FBQTtRQUM3RSwwRkFBcUUsQ0FBQTtRQUNyRSw0RkFBdUUsQ0FBQTtRQUN2RSxvRkFBK0QsQ0FBQTtRQUMvRCw0RUFBdUQsQ0FBQTtRQUN2RCxrRkFBNkQsQ0FBQTtRQUM3RCwwRkFBcUUsQ0FBQTtRQUNyRSxrR0FBNkUsQ0FBQTtRQUM3RSxrRkFBNkQsQ0FBQTtRQUM3RCxrRkFBNkQsQ0FBQTtRQUM3RCw4RUFBeUQsQ0FBQTtRQUN6RCw0RUFBdUQsQ0FBQTtRQUN2RCwwRkFBcUUsQ0FBQTtRQUNyRSxzRkFBaUUsQ0FBQTtRQUNqRSw4RUFBeUQsQ0FBQTtRQUN6RCwwR0FBcUYsQ0FBQTtRQUNyRiw0RkFBdUUsQ0FBQTtRQUN2RSxvR0FBK0UsQ0FBQTtRQUMvRSw0RkFBdUUsQ0FBQTtRQUN2RSxvR0FBK0UsQ0FBQTtRQUMvRSxvR0FBK0UsQ0FBQTtRQUMvRSxzRkFBaUUsQ0FBQTtRQUNqRSx3RUFBbUQsQ0FBQTtRQUNuRCw0R0FBdUYsQ0FBQTtRQUN2Rix3RkFBbUUsQ0FBQTtRQUNuRSx3RUFBbUQsQ0FBQTtRQUNuRCxzRUFBaUQsQ0FBQTtRQUNqRCx3RUFBbUQsQ0FBQTtRQUNuRCwwRUFBcUQsQ0FBQTtRQUNyRCw4RUFBeUQsQ0FBQTtRQUV6RCxxQkFB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