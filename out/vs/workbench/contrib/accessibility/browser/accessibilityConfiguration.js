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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/configuration", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/contrib/speech/common/speechService", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignal.contribution"], function (require, exports, nls_1, configurationRegistry_1, platform_1, contextkey_1, configuration_1, accessibilitySignalService_1, speechService_1, lifecycle_1, event_1, accessibilitySignal_contribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicSpeechAccessibilityConfiguration = exports.SpeechTimeoutDefault = exports.AccessibilityVoiceSettingId = exports.announcementFeatureBase = exports.accessibilityConfigurationNodeBase = exports.AccessibleViewProviderId = exports.AccessibilityVerbositySettingId = exports.ViewDimUnfocusedOpacityProperties = exports.AccessibilityWorkbenchSettingId = exports.accessibleViewContainsCodeBlocks = exports.accessibleViewInCodeBlock = exports.accessibleViewCurrentProviderId = exports.accessibleViewOnLastLine = exports.accessibleViewGoToSymbolSupported = exports.accessibleViewVerbosityEnabled = exports.accessibleViewSupportsNavigation = exports.accessibleViewIsShown = exports.accessibilityHelpIsShown = void 0;
    exports.registerAccessibilityConfiguration = registerAccessibilityConfiguration;
    exports.accessibilityHelpIsShown = new contextkey_1.RawContextKey('accessibilityHelpIsShown', false, true);
    exports.accessibleViewIsShown = new contextkey_1.RawContextKey('accessibleViewIsShown', false, true);
    exports.accessibleViewSupportsNavigation = new contextkey_1.RawContextKey('accessibleViewSupportsNavigation', false, true);
    exports.accessibleViewVerbosityEnabled = new contextkey_1.RawContextKey('accessibleViewVerbosityEnabled', false, true);
    exports.accessibleViewGoToSymbolSupported = new contextkey_1.RawContextKey('accessibleViewGoToSymbolSupported', false, true);
    exports.accessibleViewOnLastLine = new contextkey_1.RawContextKey('accessibleViewOnLastLine', false, true);
    exports.accessibleViewCurrentProviderId = new contextkey_1.RawContextKey('accessibleViewCurrentProviderId', undefined, undefined);
    exports.accessibleViewInCodeBlock = new contextkey_1.RawContextKey('accessibleViewInCodeBlock', undefined, undefined);
    exports.accessibleViewContainsCodeBlocks = new contextkey_1.RawContextKey('accessibleViewContainsCodeBlocks', undefined, undefined);
    /**
     * Miscellaneous settings tagged with accessibility and implemented in the accessibility contrib but
     * were better to live under workbench for discoverability.
     */
    var AccessibilityWorkbenchSettingId;
    (function (AccessibilityWorkbenchSettingId) {
        AccessibilityWorkbenchSettingId["DimUnfocusedEnabled"] = "accessibility.dimUnfocused.enabled";
        AccessibilityWorkbenchSettingId["DimUnfocusedOpacity"] = "accessibility.dimUnfocused.opacity";
        AccessibilityWorkbenchSettingId["HideAccessibleView"] = "accessibility.hideAccessibleView";
        AccessibilityWorkbenchSettingId["AccessibleViewCloseOnKeyPress"] = "accessibility.accessibleView.closeOnKeyPress";
    })(AccessibilityWorkbenchSettingId || (exports.AccessibilityWorkbenchSettingId = AccessibilityWorkbenchSettingId = {}));
    var ViewDimUnfocusedOpacityProperties;
    (function (ViewDimUnfocusedOpacityProperties) {
        ViewDimUnfocusedOpacityProperties[ViewDimUnfocusedOpacityProperties["Default"] = 0.75] = "Default";
        ViewDimUnfocusedOpacityProperties[ViewDimUnfocusedOpacityProperties["Minimum"] = 0.2] = "Minimum";
        ViewDimUnfocusedOpacityProperties[ViewDimUnfocusedOpacityProperties["Maximum"] = 1] = "Maximum";
    })(ViewDimUnfocusedOpacityProperties || (exports.ViewDimUnfocusedOpacityProperties = ViewDimUnfocusedOpacityProperties = {}));
    var AccessibilityVerbositySettingId;
    (function (AccessibilityVerbositySettingId) {
        AccessibilityVerbositySettingId["Terminal"] = "accessibility.verbosity.terminal";
        AccessibilityVerbositySettingId["DiffEditor"] = "accessibility.verbosity.diffEditor";
        AccessibilityVerbositySettingId["Chat"] = "accessibility.verbosity.panelChat";
        AccessibilityVerbositySettingId["InlineChat"] = "accessibility.verbosity.inlineChat";
        AccessibilityVerbositySettingId["TerminalChat"] = "accessibility.verbosity.terminalChat";
        AccessibilityVerbositySettingId["InlineCompletions"] = "accessibility.verbosity.inlineCompletions";
        AccessibilityVerbositySettingId["KeybindingsEditor"] = "accessibility.verbosity.keybindingsEditor";
        AccessibilityVerbositySettingId["Notebook"] = "accessibility.verbosity.notebook";
        AccessibilityVerbositySettingId["Editor"] = "accessibility.verbosity.editor";
        AccessibilityVerbositySettingId["Hover"] = "accessibility.verbosity.hover";
        AccessibilityVerbositySettingId["Notification"] = "accessibility.verbosity.notification";
        AccessibilityVerbositySettingId["EmptyEditorHint"] = "accessibility.verbosity.emptyEditorHint";
        AccessibilityVerbositySettingId["Comments"] = "accessibility.verbosity.comments";
        AccessibilityVerbositySettingId["DiffEditorActive"] = "accessibility.verbosity.diffEditorActive";
    })(AccessibilityVerbositySettingId || (exports.AccessibilityVerbositySettingId = AccessibilityVerbositySettingId = {}));
    var AccessibleViewProviderId;
    (function (AccessibleViewProviderId) {
        AccessibleViewProviderId["Terminal"] = "terminal";
        AccessibleViewProviderId["TerminalChat"] = "terminal-chat";
        AccessibleViewProviderId["TerminalHelp"] = "terminal-help";
        AccessibleViewProviderId["DiffEditor"] = "diffEditor";
        AccessibleViewProviderId["Chat"] = "panelChat";
        AccessibleViewProviderId["InlineChat"] = "inlineChat";
        AccessibleViewProviderId["InlineCompletions"] = "inlineCompletions";
        AccessibleViewProviderId["KeybindingsEditor"] = "keybindingsEditor";
        AccessibleViewProviderId["Notebook"] = "notebook";
        AccessibleViewProviderId["Editor"] = "editor";
        AccessibleViewProviderId["Hover"] = "hover";
        AccessibleViewProviderId["Notification"] = "notification";
        AccessibleViewProviderId["EmptyEditorHint"] = "emptyEditorHint";
        AccessibleViewProviderId["Comments"] = "comments";
    })(AccessibleViewProviderId || (exports.AccessibleViewProviderId = AccessibleViewProviderId = {}));
    const baseVerbosityProperty = {
        type: 'boolean',
        default: true,
        tags: ['accessibility']
    };
    const markdownDeprecationMessage = (0, nls_1.localize)('accessibility.announcement.deprecationMessage', "This setting is deprecated. Use the `signals` settings instead.");
    const baseAlertProperty = {
        type: 'boolean',
        default: true,
        tags: ['accessibility'],
        markdownDeprecationMessage
    };
    exports.accessibilityConfigurationNodeBase = Object.freeze({
        id: 'accessibility',
        title: (0, nls_1.localize)('accessibilityConfigurationTitle', "Accessibility"),
        type: 'object'
    });
    const signalFeatureBase = {
        'type': 'object',
        'tags': ['accessibility'],
        additionalProperties: false,
        default: {
            sound: 'auto',
            announcement: 'auto'
        }
    };
    exports.announcementFeatureBase = {
        'type': 'string',
        'enum': ['auto', 'off'],
        'default': 'auto',
        'enumDescriptions': [
            (0, nls_1.localize)('announcement.enabled.auto', "Enable announcement, will only play when in screen reader optimized mode."),
            (0, nls_1.localize)('announcement.enabled.off', "Disable announcement.")
        ],
        tags: ['accessibility'],
    };
    const defaultNoAnnouncement = {
        'type': 'object',
        'tags': ['accessibility'],
        additionalProperties: false,
        'default': {
            'sound': 'auto',
        }
    };
    const configuration = {
        ...exports.accessibilityConfigurationNodeBase,
        properties: {
            ["accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */]: {
                description: (0, nls_1.localize)('verbosity.terminal.description', 'Provide information about how to access the terminal accessibility help menu when the terminal is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.diffEditor" /* AccessibilityVerbositySettingId.DiffEditor */]: {
                description: (0, nls_1.localize)('verbosity.diffEditor.description', 'Provide information about how to navigate changes in the diff editor when it is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.panelChat" /* AccessibilityVerbositySettingId.Chat */]: {
                description: (0, nls_1.localize)('verbosity.chat.description', 'Provide information about how to access the chat help menu when the chat input is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.inlineChat" /* AccessibilityVerbositySettingId.InlineChat */]: {
                description: (0, nls_1.localize)('verbosity.interactiveEditor.description', 'Provide information about how to access the inline editor chat accessibility help menu and alert with hints that describe how to use the feature when the input is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.inlineCompletions" /* AccessibilityVerbositySettingId.InlineCompletions */]: {
                description: (0, nls_1.localize)('verbosity.inlineCompletions.description', 'Provide information about how to access the inline completions hover and Accessible View.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.keybindingsEditor" /* AccessibilityVerbositySettingId.KeybindingsEditor */]: {
                description: (0, nls_1.localize)('verbosity.keybindingsEditor.description', 'Provide information about how to change a keybinding in the keybindings editor when a row is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */]: {
                description: (0, nls_1.localize)('verbosity.notebook', 'Provide information about how to focus the cell container or inner editor when a notebook cell is focused.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.hover" /* AccessibilityVerbositySettingId.Hover */]: {
                description: (0, nls_1.localize)('verbosity.hover', 'Provide information about how to open the hover in an Accessible View.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.notification" /* AccessibilityVerbositySettingId.Notification */]: {
                description: (0, nls_1.localize)('verbosity.notification', 'Provide information about how to open the notification in an Accessible View.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.emptyEditorHint" /* AccessibilityVerbositySettingId.EmptyEditorHint */]: {
                description: (0, nls_1.localize)('verbosity.emptyEditorHint', 'Provide information about relevant actions in an empty text editor.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.comments" /* AccessibilityVerbositySettingId.Comments */]: {
                description: (0, nls_1.localize)('verbosity.comments', 'Provide information about actions that can be taken in the comment widget or in a file which contains comments.'),
                ...baseVerbosityProperty
            },
            ["accessibility.verbosity.diffEditorActive" /* AccessibilityVerbositySettingId.DiffEditorActive */]: {
                description: (0, nls_1.localize)('verbosity.diffEditorActive', 'Indicate when a diff editor becomes the active editor.'),
                ...baseVerbosityProperty
            },
            ["accessibility.alert.save" /* AccessibilityAlertSettingId.Save */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.save', "Indicates when a file is saved. Also see {0}.", '`#audioCues.save#`'),
                'enum': ['userGesture', 'always', 'never'],
                'default': 'always',
                'enumDescriptions': [
                    (0, nls_1.localize)('announcement.save.userGesture', "Indicates when a file is saved via user gesture."),
                    (0, nls_1.localize)('announcement.save.always', "Indicates whenever is a file is saved, including auto save."),
                    (0, nls_1.localize)('announcement.save.never', "Never alerts.")
                ],
                tags: ['accessibility'],
                markdownDeprecationMessage
            },
            ["accessibility.alert.clear" /* AccessibilityAlertSettingId.Clear */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.clear', "Indicates when a feature is cleared (for example, the terminal, Debug Console, or Output channel). Also see {0}.", '`#audioCues.clear#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.format" /* AccessibilityAlertSettingId.Format */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.format', "Indicates when a file or notebook cell is formatted. Also see {0}.", '`#audioCues.format#`'),
                'type': 'string',
                'enum': ['userGesture', 'always', 'never'],
                'default': 'always',
                'enumDescriptions': [
                    (0, nls_1.localize)('announcement.format.userGesture', "Indicates when a file is formatted via user gesture."),
                    (0, nls_1.localize)('announcement.format.always', "Indicates whenever is a file is formatted, including auto save, on cell execution, and more."),
                    (0, nls_1.localize)('announcement.format.never', "Never alerts.")
                ],
                tags: ['accessibility'],
                markdownDeprecationMessage
            },
            ["accessibility.alert.breakpoint" /* AccessibilityAlertSettingId.Breakpoint */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.breakpoint', "Indicates when the debugger breaks. Also see {0}.", '`#audioCues.onDebugBreak#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.error" /* AccessibilityAlertSettingId.Error */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.error', "Indicates when the active line has an error. Also see {0}.", '`#audioCues.lineHasError#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.warning" /* AccessibilityAlertSettingId.Warning */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.warning', "Indicates when the active line has a warning. Also see {0}.", '`#audioCues.lineHasWarning#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.foldedArea" /* AccessibilityAlertSettingId.FoldedArea */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.foldedArea', "Indicates when the active line has a folded area that can be unfolded. Also see {0}.", '`#audioCues.lineHasFoldedArea#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.terminalQuickFix" /* AccessibilityAlertSettingId.TerminalQuickFix */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.terminalQuickFix', "Indicates when there is an available terminal quick fix. Also see {0}.", '`#audioCues.terminalQuickFix#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.terminalBell" /* AccessibilityAlertSettingId.TerminalBell */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.terminalBell', "Indicates when the terminal bell is activated."),
                ...baseAlertProperty
            },
            ["accessibility.alert.terminalCommandFailed" /* AccessibilityAlertSettingId.TerminalCommandFailed */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.terminalCommandFailed', "Indicates when a terminal command fails (non-zero exit code). Also see {0}.", '`#audioCues.terminalCommandFailed#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.taskFailed" /* AccessibilityAlertSettingId.TaskFailed */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.taskFailed', "Indicates when a task fails (non-zero exit code). Also see {0}.", '`#audioCues.taskFailed#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.taskCompleted" /* AccessibilityAlertSettingId.TaskCompleted */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.taskCompleted', "Indicates when a task completes successfully (zero exit code). Also see {0}.", '`#audioCues.taskCompleted#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.chatRequestSent" /* AccessibilityAlertSettingId.ChatRequestSent */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.chatRequestSent', "Indicates when a chat request is sent. Also see {0}.", '`#audioCues.chatRequestSent#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.chatResponsePending" /* AccessibilityAlertSettingId.ChatResponsePending */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.chatResponsePending', "Indicates when a chat response is pending. Also see {0}.", '`#audioCues.chatResponsePending#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.noInlayHints" /* AccessibilityAlertSettingId.NoInlayHints */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.noInlayHints', "Indicates when there are no inlay hints. Also see {0}.", '`#audioCues.noInlayHints#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.lineHasBreakpoint" /* AccessibilityAlertSettingId.LineHasBreakpoint */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.lineHasBreakpoint', "Indicates when on a line with a breakpoint. Also see {0}.", '`#audioCues.lineHasBreakpoint#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.notebookCellCompleted" /* AccessibilityAlertSettingId.NotebookCellCompleted */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.notebookCellCompleted', "Indicates when a notebook cell completes successfully. Also see {0}.", '`#audioCues.notebookCellCompleted#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.notebookCellFailed" /* AccessibilityAlertSettingId.NotebookCellFailed */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.notebookCellFailed', "Indicates when a notebook cell fails. Also see {0}.", '`#audioCues.notebookCellFailed#`'),
                ...baseAlertProperty
            },
            ["accessibility.alert.onDebugBreak" /* AccessibilityAlertSettingId.OnDebugBreak */]: {
                'markdownDescription': (0, nls_1.localize)('announcement.onDebugBreak', "Indicates when the debugger breaks. Also see {0}.", '`#audioCues.onDebugBreak#`'),
                ...baseAlertProperty
            },
            ["accessibility.accessibleView.closeOnKeyPress" /* AccessibilityWorkbenchSettingId.AccessibleViewCloseOnKeyPress */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.accessibleView.closeOnKeyPress', "On keypress, close the Accessible View and focus the element from which it was invoked."),
                type: 'boolean',
                default: true
            },
            'accessibility.signals.sounds.volume': {
                'description': (0, nls_1.localize)('accessibility.signals.sounds.volume', "The volume of the sounds in percent (0-100)."),
                'type': 'number',
                'minimum': 0,
                'maximum': 100,
                'default': 70,
                tags: ['accessibility']
            },
            'accessibility.signals.debouncePositionChanges': {
                'description': (0, nls_1.localize)('accessibility.signals.debouncePositionChanges', "Whether or not position changes should be debounced"),
                'type': 'boolean',
                'default': false,
                tags: ['accessibility']
            },
            'accessibility.signals.lineHasBreakpoint': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint', "Plays a signal when the active line has a breakpoint."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint.sound', "Plays a sound when the active line has a breakpoint."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasBreakpoint.announcement', "Indicates when the active line has a breakpoint."),
                        ...exports.announcementFeatureBase
                    },
                },
            },
            'accessibility.signals.lineHasInlineSuggestion': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasInlineSuggestion', "Indicates when the active line has an inline suggestion."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasInlineSuggestion.sound', "Plays a sound when the active line has an inline suggestion."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase,
                        'default': 'off'
                    }
                }
            },
            'accessibility.signals.lineHasError': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasError', "Indicates when the active line has an error."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasError.sound', "Plays a sound when the active line has an error."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasError.announcement', "Indicates when the active line has an error."),
                        ...exports.announcementFeatureBase,
                        default: 'off'
                    },
                },
            },
            'accessibility.signals.lineHasFoldedArea': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea', "Indicates when the active line has a folded area that can be unfolded."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea.sound', "Plays a sound when the active line has a folded area that can be unfolded."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase,
                        default: 'off'
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasFoldedArea.announcement', "Indicates when the active line has a folded area that can be unfolded."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.lineHasWarning': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.lineHasWarning', "Plays a signal when the active line has a warning."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasWarning.sound', "Plays a sound when the active line has a warning."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.lineHasWarning.announcement', "Indicates when the active line has a warning."),
                        ...exports.announcementFeatureBase,
                        default: 'off'
                    },
                },
            },
            'accessibility.signals.onDebugBreak': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.onDebugBreak', "Plays a signal when the debugger stopped on a breakpoint."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.onDebugBreak.sound', "Plays a sound when the debugger stopped on a breakpoint."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.onDebugBreak.announcement', "Indicates when the debugger stopped on a breakpoint."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.noInlayHints': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.noInlayHints', "Plays a signal when trying to read a line with inlay hints that has no inlay hints."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.noInlayHints.sound', "Plays a sound when trying to read a line with inlay hints that has no inlay hints."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.noInlayHints.announcement', "Indicates when trying to read a line with inlay hints that has no inlay hints."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.taskCompleted': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.taskCompleted', "Plays a signal when a task is completed."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskCompleted.sound', "Plays a sound when a task is completed."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskCompleted.announcement', "Indicates when a task is completed."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.taskFailed': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.taskFailed', "Plays a signal when a task fails (non-zero exit code)."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskFailed.sound', "Plays a sound when a task fails (non-zero exit code)."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.taskFailed.announcement', "Indicates when a task fails (non-zero exit code)."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.terminalCommandFailed': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.terminalCommandFailed', "Plays a signal when a terminal command fails (non-zero exit code)."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalCommandFailed.sound', "Plays a sound when a terminal command fails (non-zero exit code)."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalCommandFailed.announcement', "Indicates when a terminal command fails (non-zero exit code)."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.terminalQuickFix': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.terminalQuickFix', "Plays a signal when terminal Quick Fixes are available."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalQuickFix.sound', "Plays a sound when terminal Quick Fixes are available."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalQuickFix.announcement', "Indicates when terminal Quick Fixes are available."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.terminalBell': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.terminalBell', "Plays a signal when the terminal bell is ringing."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalBell.sound', "Plays a sound when the terminal bell is ringing."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.terminalBell.announcement', "Indicates when the terminal bell is ringing."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.diffLineInserted': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.diffLineInserted', "Indicates when the focus moves to an inserted line in Accessible Diff Viewer mode or to the next/previous change."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.sound', "Plays a sound when the focus moves to an inserted line in Accessible Diff Viewer mode or to the next/previous change."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    }
                }
            },
            'accessibility.signals.diffLineModified': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.diffLineModified', "Indicates when the focus moves to an modified line in Accessible Diff Viewer mode or to the next/previous change."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.diffLineModified.sound', "Plays a sound when the focus moves to a modified line in Accessible Diff Viewer mode or to the next/previous change."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    }
                }
            },
            'accessibility.signals.diffLineDeleted': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.diffLineDeleted', "Indicates when the focus moves to an deleted line in Accessible Diff Viewer mode or to the next/previous change."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.diffLineDeleted.sound', "Plays a sound when the focus moves to an deleted line in Accessible Diff Viewer mode or to the next/previous change."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    }
                }
            },
            'accessibility.signals.notebookCellCompleted': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.notebookCellCompleted', "Plays a signal when a notebook cell execution is successfully completed."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellCompleted.sound', "Plays a sound when a notebook cell execution is successfully completed."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellCompleted.announcement', "Indicates when a notebook cell execution is successfully completed."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.notebookCellFailed': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.notebookCellFailed', "Plays a signal when a notebook cell execution fails."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellFailed.sound', "Plays a sound when a notebook cell execution fails."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.notebookCellFailed.announcement', "Indicates when a notebook cell execution fails."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.chatRequestSent': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.chatRequestSent', "Plays a signal when a chat request is made."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatRequestSent.sound', "Plays a sound when a chat request is made."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatRequestSent.announcement', "Indicates when a chat request is made."),
                        ...exports.announcementFeatureBase
                    },
                }
            },
            'accessibility.signals.chatResponsePending': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.chatResponsePending', "Plays a signal on loop while the response is pending."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatResponsePending.sound', "Plays a sound on loop while the response is pending."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatResponsePending.announcement', "Alerts on loop while the response is pending."),
                        ...exports.announcementFeatureBase
                    },
                },
            },
            'accessibility.signals.chatResponseReceived': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.chatResponseReceived', "Indicates when the response has been received."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.chatResponseReceived.sound', "Plays a sound on loop while the response has been received."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                }
            },
            'accessibility.signals.voiceRecordingStarted': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStarted', "Indicates when the voice recording has started."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStarted.sound', "Plays a sound when the voice recording has started."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase,
                    },
                },
                'default': {
                    'sound': 'on'
                }
            },
            'accessibility.signals.voiceRecordingStopped': {
                ...defaultNoAnnouncement,
                'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStopped', "Indicates when the voice recording has stopped."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.voiceRecordingStopped.sound', "Plays a sound when the voice recording has stopped."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase,
                        default: 'off'
                    },
                }
            },
            'accessibility.signals.clear': {
                ...signalFeatureBase,
                'description': (0, nls_1.localize)('accessibility.signals.clear', "Plays a signal when a feature is cleared (for example, the terminal, Debug Console, or Output channel)."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.clear.sound', "Plays a sound when a feature is cleared."),
                        ...accessibilitySignal_contribution_1.soundFeatureBase
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.clear.announcement', "Indicates when a feature is cleared."),
                        ...exports.announcementFeatureBase
                    },
                },
            },
            'accessibility.signals.save': {
                'type': 'object',
                'tags': ['accessibility'],
                additionalProperties: false,
                'markdownDescription': (0, nls_1.localize)('accessibility.signals.save', "Plays a signal when a file is saved."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.save.sound', "Plays a sound when a file is saved."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.save.sound.userGesture', "Plays the audio cue when a user explicitly saves a file."),
                            (0, nls_1.localize)('accessibility.signals.save.sound.always', "Plays the audio cue whenever a file is saved, including auto save."),
                            (0, nls_1.localize)('accessibility.signals.save.sound.never', "Never plays the audio cue.")
                        ],
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.save.announcement', "Indicates when a file is saved."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.save.announcement.userGesture', "Announces when a user explicitly saves a file."),
                            (0, nls_1.localize)('accessibility.signals.save.announcement.always', "Announces whenever a file is saved, including auto save."),
                            (0, nls_1.localize)('accessibility.signals.save.announcement.never', "Never plays the audio cue.")
                        ],
                    },
                },
                default: {
                    'sound': 'never',
                    'announcement': 'never'
                }
            },
            'accessibility.signals.format': {
                'type': 'object',
                'tags': ['accessibility'],
                additionalProperties: false,
                'markdownDescription': (0, nls_1.localize)('accessibility.signals.format', "Plays a signal when a file or notebook is formatted."),
                'properties': {
                    'sound': {
                        'description': (0, nls_1.localize)('accessibility.signals.format.sound', "Plays a sound when a file or notebook is formatted."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.format.userGesture', "Plays the audio cue when a user explicitly formats a file."),
                            (0, nls_1.localize)('accessibility.signals.format.always', "Plays the audio cue whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
                            (0, nls_1.localize)('accessibility.signals.format.never', "Never plays the audio cue.")
                        ],
                    },
                    'announcement': {
                        'description': (0, nls_1.localize)('accessibility.signals.format.announcement', "Indicates when a file or notebook is formatted."),
                        'type': 'string',
                        'enum': ['userGesture', 'always', 'never'],
                        'default': 'never',
                        'enumDescriptions': [
                            (0, nls_1.localize)('accessibility.signals.format.announcement.userGesture', "Announceswhen a user explicitly formats a file."),
                            (0, nls_1.localize)('accessibility.signals.format.announcement.always', "Announces whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
                            (0, nls_1.localize)('accessibility.signals.format.announcement.never', "Never announces.")
                        ],
                    },
                },
                default: {
                    'sound': 'never',
                    'announcement': 'never'
                }
            },
        }
    };
    function registerAccessibilityConfiguration() {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        registry.registerConfiguration(configuration);
        registry.registerConfiguration({
            ...configuration_1.workbenchConfigurationNodeBase,
            properties: {
                ["accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */]: {
                    description: (0, nls_1.localize)('dimUnfocusedEnabled', 'Whether to dim unfocused editors and terminals, which makes it more clear where typed input will go to. This works with the majority of editors with the notable exceptions of those that utilize iframes like notebooks and extension webview editors.'),
                    type: 'boolean',
                    default: false,
                    tags: ['accessibility'],
                    scope: 1 /* ConfigurationScope.APPLICATION */,
                },
                ["accessibility.dimUnfocused.opacity" /* AccessibilityWorkbenchSettingId.DimUnfocusedOpacity */]: {
                    markdownDescription: (0, nls_1.localize)('dimUnfocusedOpacity', 'The opacity fraction (0.2 to 1.0) to use for unfocused editors and terminals. This will only take effect when {0} is enabled.', `\`#${"accessibility.dimUnfocused.enabled" /* AccessibilityWorkbenchSettingId.DimUnfocusedEnabled */}#\``),
                    type: 'number',
                    minimum: 0.2 /* ViewDimUnfocusedOpacityProperties.Minimum */,
                    maximum: 1 /* ViewDimUnfocusedOpacityProperties.Maximum */,
                    default: 0.75 /* ViewDimUnfocusedOpacityProperties.Default */,
                    tags: ['accessibility'],
                    scope: 1 /* ConfigurationScope.APPLICATION */,
                },
                ["accessibility.hideAccessibleView" /* AccessibilityWorkbenchSettingId.HideAccessibleView */]: {
                    description: (0, nls_1.localize)('accessibility.hideAccessibleView', "Controls whether the Accessible View is hidden."),
                    type: 'boolean',
                    default: false,
                    tags: ['accessibility']
                }
            }
        });
    }
    var AccessibilityVoiceSettingId;
    (function (AccessibilityVoiceSettingId) {
        AccessibilityVoiceSettingId["SpeechTimeout"] = "accessibility.voice.speechTimeout";
        AccessibilityVoiceSettingId["SpeechLanguage"] = "accessibility.voice.speechLanguage";
    })(AccessibilityVoiceSettingId || (exports.AccessibilityVoiceSettingId = AccessibilityVoiceSettingId = {}));
    exports.SpeechTimeoutDefault = 1200;
    let DynamicSpeechAccessibilityConfiguration = class DynamicSpeechAccessibilityConfiguration extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.dynamicSpeechAccessibilityConfiguration'; }
        constructor(speechService) {
            super();
            this.speechService = speechService;
            this._register(event_1.Event.runAndSubscribe(speechService.onDidChangeHasSpeechProvider, () => this.updateConfiguration()));
        }
        updateConfiguration() {
            if (!this.speechService.hasSpeechProvider) {
                return; // these settings require a speech provider
            }
            const languages = this.getLanguages();
            const languagesSorted = Object.keys(languages).sort((langA, langB) => {
                return languages[langA].name.localeCompare(languages[langB].name);
            });
            const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            registry.registerConfiguration({
                ...exports.accessibilityConfigurationNodeBase,
                properties: {
                    ["accessibility.voice.speechTimeout" /* AccessibilityVoiceSettingId.SpeechTimeout */]: {
                        'markdownDescription': (0, nls_1.localize)('voice.speechTimeout', "The duration in milliseconds that voice speech recognition remains active after you stop speaking. For example in a chat session, the transcribed text is submitted automatically after the timeout is met. Set to `0` to disable this feature."),
                        'type': 'number',
                        'default': exports.SpeechTimeoutDefault,
                        'minimum': 0,
                        'tags': ['accessibility']
                    },
                    ["accessibility.voice.speechLanguage" /* AccessibilityVoiceSettingId.SpeechLanguage */]: {
                        'markdownDescription': (0, nls_1.localize)('voice.speechLanguage', "The language that voice speech recognition should recognize. Select `auto` to use the configured display language if possible. Note that not all display languages maybe supported by speech recognition"),
                        'type': 'string',
                        'enum': languagesSorted,
                        'default': 'auto',
                        'tags': ['accessibility'],
                        'enumDescriptions': languagesSorted.map(key => languages[key].name),
                        'enumItemLabels': languagesSorted.map(key => languages[key].name)
                    }
                }
            });
        }
        getLanguages() {
            return {
                ['auto']: {
                    name: (0, nls_1.localize)('speechLanguage.auto', "Auto (Use Display Language)")
                },
                ...speechService_1.SPEECH_LANGUAGES
            };
        }
    };
    exports.DynamicSpeechAccessibilityConfiguration = DynamicSpeechAccessibilityConfiguration;
    exports.DynamicSpeechAccessibilityConfiguration = DynamicSpeechAccessibilityConfiguration = __decorate([
        __param(0, speechService_1.ISpeechService)
    ], DynamicSpeechAccessibilityConfiguration);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'audioCues.volume',
            migrateFn: (value, accessor) => {
                return [
                    ['accessibility.signals.sounds.volume', { value }],
                    ['audioCues.volume', { value: undefined }]
                ];
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: 'audioCues.debouncePositionChanges',
            migrateFn: (value, accessor) => {
                return [
                    ['accessibility.signals.debouncePositionChanges', { value }],
                    ['audioCues.debouncePositionChanges', { value: undefined }]
                ];
            }
        }]);
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations(accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.map(item => ({
        key: item.legacySoundSettingsKey,
        migrateFn: (sound, accessor) => {
            const configurationKeyValuePairs = [];
            const legacyAnnouncementSettingsKey = item.legacyAnnouncementSettingsKey;
            let announcement;
            if (legacyAnnouncementSettingsKey) {
                announcement = accessor(legacyAnnouncementSettingsKey) ?? undefined;
                if (announcement !== undefined && typeof announcement !== 'string') {
                    announcement = announcement ? 'auto' : 'off';
                }
            }
            configurationKeyValuePairs.push([`${item.legacySoundSettingsKey}`, { value: undefined }]);
            configurationKeyValuePairs.push([`${item.settingsKey}`, { value: announcement !== undefined ? { announcement, sound } : { sound } }]);
            return configurationKeyValuePairs;
        }
    })));
    platform_1.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations(accessibilitySignalService_1.AccessibilitySignal.allAccessibilitySignals.filter(i => !!i.legacyAnnouncementSettingsKey).map(item => ({
        key: item.legacyAnnouncementSettingsKey,
        migrateFn: (announcement, accessor) => {
            const configurationKeyValuePairs = [];
            const sound = accessor(item.settingsKey)?.sound || accessor(item.legacySoundSettingsKey);
            if (announcement !== undefined && typeof announcement !== 'string') {
                announcement = announcement ? 'auto' : 'off';
            }
            configurationKeyValuePairs.push([`${item.settingsKey}`, { value: announcement !== undefined ? { announcement, sound } : { sound } }]);
            configurationKeyValuePairs.push([`${item.legacyAnnouncementSettingsKey}`, { value: undefined }]);
            configurationKeyValuePairs.push([`${item.legacySoundSettingsKey}`, { value: undefined }]);
            return configurationKeyValuePairs;
        }
    })));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eUNvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9hY2Nlc3NpYmlsaXR5Q29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxcEJoRyxnRkErQkM7SUF0cUJZLFFBQUEsd0JBQXdCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvRixRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBVSx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekYsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsa0NBQWtDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9HLFFBQUEsOEJBQThCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdDQUFnQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRyxRQUFBLGlDQUFpQyxHQUFHLElBQUksMEJBQWEsQ0FBVSxtQ0FBbUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakgsUUFBQSx3QkFBd0IsR0FBRyxJQUFJLDBCQUFhLENBQVUsMEJBQTBCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9GLFFBQUEsK0JBQStCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGlDQUFpQyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNySCxRQUFBLHlCQUF5QixHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDMUcsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsa0NBQWtDLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRXJJOzs7T0FHRztJQUNILElBQWtCLCtCQUtqQjtJQUxELFdBQWtCLCtCQUErQjtRQUNoRCw2RkFBMEQsQ0FBQTtRQUMxRCw2RkFBMEQsQ0FBQTtRQUMxRCwwRkFBdUQsQ0FBQTtRQUN2RCxpSEFBOEUsQ0FBQTtJQUMvRSxDQUFDLEVBTGlCLCtCQUErQiwrQ0FBL0IsK0JBQStCLFFBS2hEO0lBRUQsSUFBa0IsaUNBSWpCO0lBSkQsV0FBa0IsaUNBQWlDO1FBQ2xELGtHQUFjLENBQUE7UUFDZCxpR0FBYSxDQUFBO1FBQ2IsK0ZBQVcsQ0FBQTtJQUNaLENBQUMsRUFKaUIsaUNBQWlDLGlEQUFqQyxpQ0FBaUMsUUFJbEQ7SUFFRCxJQUFrQiwrQkFlakI7SUFmRCxXQUFrQiwrQkFBK0I7UUFDaEQsZ0ZBQTZDLENBQUE7UUFDN0Msb0ZBQWlELENBQUE7UUFDakQsNkVBQTBDLENBQUE7UUFDMUMsb0ZBQWlELENBQUE7UUFDakQsd0ZBQXFELENBQUE7UUFDckQsa0dBQStELENBQUE7UUFDL0Qsa0dBQStELENBQUE7UUFDL0QsZ0ZBQTZDLENBQUE7UUFDN0MsNEVBQXlDLENBQUE7UUFDekMsMEVBQXVDLENBQUE7UUFDdkMsd0ZBQXFELENBQUE7UUFDckQsOEZBQTJELENBQUE7UUFDM0QsZ0ZBQTZDLENBQUE7UUFDN0MsZ0dBQTZELENBQUE7SUFDOUQsQ0FBQyxFQWZpQiwrQkFBK0IsK0NBQS9CLCtCQUErQixRQWVoRDtJQUVELElBQWtCLHdCQWVqQjtJQWZELFdBQWtCLHdCQUF3QjtRQUN6QyxpREFBcUIsQ0FBQTtRQUNyQiwwREFBOEIsQ0FBQTtRQUM5QiwwREFBOEIsQ0FBQTtRQUM5QixxREFBeUIsQ0FBQTtRQUN6Qiw4Q0FBa0IsQ0FBQTtRQUNsQixxREFBeUIsQ0FBQTtRQUN6QixtRUFBdUMsQ0FBQTtRQUN2QyxtRUFBdUMsQ0FBQTtRQUN2QyxpREFBcUIsQ0FBQTtRQUNyQiw2Q0FBaUIsQ0FBQTtRQUNqQiwyQ0FBZSxDQUFBO1FBQ2YseURBQTZCLENBQUE7UUFDN0IsK0RBQW1DLENBQUE7UUFDbkMsaURBQXFCLENBQUE7SUFDdEIsQ0FBQyxFQWZpQix3QkFBd0Isd0NBQXhCLHdCQUF3QixRQWV6QztJQUVELE1BQU0scUJBQXFCLEdBQWlDO1FBQzNELElBQUksRUFBRSxTQUFTO1FBQ2YsT0FBTyxFQUFFLElBQUk7UUFDYixJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUM7S0FDdkIsQ0FBQztJQUNGLE1BQU0sMEJBQTBCLEdBQUcsSUFBQSxjQUFRLEVBQUMsK0NBQStDLEVBQUUsaUVBQWlFLENBQUMsQ0FBQztJQUNoSyxNQUFNLGlCQUFpQixHQUFpQztRQUN2RCxJQUFJLEVBQUUsU0FBUztRQUNmLE9BQU8sRUFBRSxJQUFJO1FBQ2IsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDO1FBQ3ZCLDBCQUEwQjtLQUMxQixDQUFDO0lBRVcsUUFBQSxrQ0FBa0MsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFxQjtRQUNuRixFQUFFLEVBQUUsZUFBZTtRQUNuQixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUNBQWlDLEVBQUUsZUFBZSxDQUFDO1FBQ25FLElBQUksRUFBRSxRQUFRO0tBQ2QsQ0FBQyxDQUFDO0lBR0gsTUFBTSxpQkFBaUIsR0FBaUM7UUFDdkQsTUFBTSxFQUFFLFFBQVE7UUFDaEIsTUFBTSxFQUFFLENBQUMsZUFBZSxDQUFDO1FBQ3pCLG9CQUFvQixFQUFFLEtBQUs7UUFDM0IsT0FBTyxFQUFFO1lBQ1IsS0FBSyxFQUFFLE1BQU07WUFDYixZQUFZLEVBQUUsTUFBTTtTQUNwQjtLQUNELENBQUM7SUFFVyxRQUFBLHVCQUF1QixHQUFpQztRQUNwRSxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO1FBQ3ZCLFNBQVMsRUFBRSxNQUFNO1FBQ2pCLGtCQUFrQixFQUFFO1lBQ25CLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLDJFQUEyRSxDQUFDO1lBQ2xILElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLHVCQUF1QixDQUFDO1NBQzdEO1FBQ0QsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDO0tBQ3ZCLENBQUM7SUFFRixNQUFNLHFCQUFxQixHQUFpQztRQUMzRCxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsQ0FBQyxlQUFlLENBQUM7UUFDekIsb0JBQW9CLEVBQUUsS0FBSztRQUMzQixTQUFTLEVBQUU7WUFDVixPQUFPLEVBQUUsTUFBTTtTQUNmO0tBQ0QsQ0FBQztJQUVGLE1BQU0sYUFBYSxHQUF1QjtRQUN6QyxHQUFHLDBDQUFrQztRQUNyQyxVQUFVLEVBQUU7WUFDWCxtRkFBMEMsRUFBRTtnQkFDM0MsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLDRHQUE0RyxDQUFDO2dCQUNySyxHQUFHLHFCQUFxQjthQUN4QjtZQUNELHVGQUE0QyxFQUFFO2dCQUM3QyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0NBQWtDLEVBQUUsMEZBQTBGLENBQUM7Z0JBQ3JKLEdBQUcscUJBQXFCO2FBQ3hCO1lBQ0QsZ0ZBQXNDLEVBQUU7Z0JBQ3ZDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSw0RkFBNEYsQ0FBQztnQkFDakosR0FBRyxxQkFBcUI7YUFDeEI7WUFDRCx1RkFBNEMsRUFBRTtnQkFDN0MsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLDZLQUE2SyxDQUFDO2dCQUMvTyxHQUFHLHFCQUFxQjthQUN4QjtZQUNELHFHQUFtRCxFQUFFO2dCQUNwRCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMseUNBQXlDLEVBQUUsMkZBQTJGLENBQUM7Z0JBQzdKLEdBQUcscUJBQXFCO2FBQ3hCO1lBQ0QscUdBQW1ELEVBQUU7Z0JBQ3BELFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx5Q0FBeUMsRUFBRSx1R0FBdUcsQ0FBQztnQkFDekssR0FBRyxxQkFBcUI7YUFDeEI7WUFDRCxtRkFBMEMsRUFBRTtnQkFDM0MsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDRHQUE0RyxDQUFDO2dCQUN6SixHQUFHLHFCQUFxQjthQUN4QjtZQUNELDZFQUF1QyxFQUFFO2dCQUN4QyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsd0VBQXdFLENBQUM7Z0JBQ2xILEdBQUcscUJBQXFCO2FBQ3hCO1lBQ0QsMkZBQThDLEVBQUU7Z0JBQy9DLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSwrRUFBK0UsQ0FBQztnQkFDaEksR0FBRyxxQkFBcUI7YUFDeEI7WUFDRCxpR0FBaUQsRUFBRTtnQkFDbEQsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLHFFQUFxRSxDQUFDO2dCQUN6SCxHQUFHLHFCQUFxQjthQUN4QjtZQUNELG1GQUEwQyxFQUFFO2dCQUMzQyxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsaUhBQWlILENBQUM7Z0JBQzlKLEdBQUcscUJBQXFCO2FBQ3hCO1lBQ0QsbUdBQWtELEVBQUU7Z0JBQ25ELFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSx3REFBd0QsQ0FBQztnQkFDN0csR0FBRyxxQkFBcUI7YUFDeEI7WUFDRCxtRUFBa0MsRUFBRTtnQkFDbkMscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsK0NBQStDLEVBQUUsb0JBQW9CLENBQUM7Z0JBQzNILE1BQU0sRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDO2dCQUMxQyxTQUFTLEVBQUUsUUFBUTtnQkFDbkIsa0JBQWtCLEVBQUU7b0JBQ25CLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLGtEQUFrRCxDQUFDO29CQUM3RixJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSw2REFBNkQsQ0FBQztvQkFDbkcsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsZUFBZSxDQUFDO2lCQUNwRDtnQkFDRCxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUM7Z0JBQ3ZCLDBCQUEwQjthQUMxQjtZQUNELHFFQUFtQyxFQUFFO2dCQUNwQyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxrSEFBa0gsRUFBRSxxQkFBcUIsQ0FBQztnQkFDaE0sR0FBRyxpQkFBaUI7YUFDcEI7WUFDRCx1RUFBb0MsRUFBRTtnQkFDckMscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsb0VBQW9FLEVBQUUsc0JBQXNCLENBQUM7Z0JBQ3BKLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixNQUFNLEVBQUUsQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQztnQkFDMUMsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLGtCQUFrQixFQUFFO29CQUNuQixJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSxzREFBc0QsQ0FBQztvQkFDbkcsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsOEZBQThGLENBQUM7b0JBQ3RJLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLGVBQWUsQ0FBQztpQkFDdEQ7Z0JBQ0QsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDO2dCQUN2QiwwQkFBMEI7YUFDMUI7WUFDRCwrRUFBd0MsRUFBRTtnQkFDekMscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsbURBQW1ELEVBQUUsNEJBQTRCLENBQUM7Z0JBQzdJLEdBQUcsaUJBQWlCO2FBQ3BCO1lBQ0QscUVBQW1DLEVBQUU7Z0JBQ3BDLHFCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDREQUE0RCxFQUFFLDRCQUE0QixDQUFDO2dCQUNqSixHQUFHLGlCQUFpQjthQUNwQjtZQUNELHlFQUFxQyxFQUFFO2dCQUN0QyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSw2REFBNkQsRUFBRSw4QkFBOEIsQ0FBQztnQkFDdEosR0FBRyxpQkFBaUI7YUFDcEI7WUFDRCwrRUFBd0MsRUFBRTtnQkFDekMscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsc0ZBQXNGLEVBQUUsaUNBQWlDLENBQUM7Z0JBQ3JMLEdBQUcsaUJBQWlCO2FBQ3BCO1lBQ0QsMkZBQThDLEVBQUU7Z0JBQy9DLHFCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLHdFQUF3RSxFQUFFLGdDQUFnQyxDQUFDO2dCQUM1SyxHQUFHLGlCQUFpQjthQUNwQjtZQUNELG1GQUEwQyxFQUFFO2dCQUMzQyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSxnREFBZ0QsQ0FBQztnQkFDOUcsR0FBRyxpQkFBaUI7YUFDcEI7WUFDRCxxR0FBbUQsRUFBRTtnQkFDcEQscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsNkVBQTZFLEVBQUUscUNBQXFDLENBQUM7Z0JBQzNMLEdBQUcsaUJBQWlCO2FBQ3BCO1lBQ0QsK0VBQXdDLEVBQUU7Z0JBQ3pDLHFCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLGlFQUFpRSxFQUFFLDBCQUEwQixDQUFDO2dCQUN6SixHQUFHLGlCQUFpQjthQUNwQjtZQUNELHFGQUEyQyxFQUFFO2dCQUM1QyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSw4RUFBOEUsRUFBRSw2QkFBNkIsQ0FBQztnQkFDNUssR0FBRyxpQkFBaUI7YUFDcEI7WUFDRCx5RkFBNkMsRUFBRTtnQkFDOUMscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsc0RBQXNELEVBQUUsK0JBQStCLENBQUM7Z0JBQ3hKLEdBQUcsaUJBQWlCO2FBQ3BCO1lBQ0QsaUdBQWlELEVBQUU7Z0JBQ2xELHFCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLDBEQUEwRCxFQUFFLG1DQUFtQyxDQUFDO2dCQUNwSyxHQUFHLGlCQUFpQjthQUNwQjtZQUNELG1GQUEwQyxFQUFFO2dCQUMzQyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSx3REFBd0QsRUFBRSw0QkFBNEIsQ0FBQztnQkFDcEosR0FBRyxpQkFBaUI7YUFDcEI7WUFDRCw2RkFBK0MsRUFBRTtnQkFDaEQscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0NBQWdDLEVBQUUsMkRBQTJELEVBQUUsaUNBQWlDLENBQUM7Z0JBQ2pLLEdBQUcsaUJBQWlCO2FBQ3BCO1lBQ0QscUdBQW1ELEVBQUU7Z0JBQ3BELHFCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLHNFQUFzRSxFQUFFLHFDQUFxQyxDQUFDO2dCQUNwTCxHQUFHLGlCQUFpQjthQUNwQjtZQUNELCtGQUFnRCxFQUFFO2dCQUNqRCxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSxxREFBcUQsRUFBRSxrQ0FBa0MsQ0FBQztnQkFDN0osR0FBRyxpQkFBaUI7YUFDcEI7WUFDRCxtRkFBMEMsRUFBRTtnQkFDM0MscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsbURBQW1ELEVBQUUsNEJBQTRCLENBQUM7Z0JBQy9JLEdBQUcsaUJBQWlCO2FBQ3BCO1lBQ0Qsb0hBQStELEVBQUU7Z0JBQ2hFLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLG9EQUFvRCxFQUFFLHlGQUF5RixDQUFDO2dCQUM5SyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsSUFBSTthQUNiO1lBQ0QscUNBQXFDLEVBQUU7Z0JBQ3RDLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQ0FBcUMsRUFBRSw4Q0FBOEMsQ0FBQztnQkFDOUcsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFNBQVMsRUFBRSxDQUFDO2dCQUNaLFNBQVMsRUFBRSxHQUFHO2dCQUNkLFNBQVMsRUFBRSxFQUFFO2dCQUNiLElBQUksRUFBRSxDQUFDLGVBQWUsQ0FBQzthQUN2QjtZQUNELCtDQUErQyxFQUFFO2dCQUNoRCxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsK0NBQStDLEVBQUUscURBQXFELENBQUM7Z0JBQy9ILE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDO2FBQ3ZCO1lBQ0QseUNBQXlDLEVBQUU7Z0JBQzFDLEdBQUcsaUJBQWlCO2dCQUNwQixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMseUNBQXlDLEVBQUUsdURBQXVELENBQUM7Z0JBQzNILFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLCtDQUErQyxFQUFFLHNEQUFzRCxDQUFDO3dCQUNoSSxHQUFHLG1EQUFnQjtxQkFDbkI7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxzREFBc0QsRUFBRSxrREFBa0QsQ0FBQzt3QkFDbkksR0FBRywrQkFBdUI7cUJBQzFCO2lCQUNEO2FBQ0Q7WUFDRCwrQ0FBK0MsRUFBRTtnQkFDaEQsR0FBRyxxQkFBcUI7Z0JBQ3hCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywrQ0FBK0MsRUFBRSwwREFBMEQsQ0FBQztnQkFDcEksWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMscURBQXFELEVBQUUsOERBQThELENBQUM7d0JBQzlJLEdBQUcsbURBQWdCO3dCQUNuQixTQUFTLEVBQUUsS0FBSztxQkFDaEI7aUJBQ0Q7YUFDRDtZQUNELG9DQUFvQyxFQUFFO2dCQUNyQyxHQUFHLGlCQUFpQjtnQkFDcEIsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLDhDQUE4QyxDQUFDO2dCQUM3RyxZQUFZLEVBQUU7b0JBQ2IsT0FBTyxFQUFFO3dCQUNSLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSxrREFBa0QsQ0FBQzt3QkFDdkgsR0FBRyxtREFBZ0I7cUJBQ25CO29CQUNELGNBQWMsRUFBRTt3QkFDZixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsaURBQWlELEVBQUUsOENBQThDLENBQUM7d0JBQzFILEdBQUcsK0JBQXVCO3dCQUMxQixPQUFPLEVBQUUsS0FBSztxQkFDZDtpQkFDRDthQUNEO1lBQ0QseUNBQXlDLEVBQUU7Z0JBQzFDLEdBQUcsaUJBQWlCO2dCQUNwQixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMseUNBQXlDLEVBQUUsd0VBQXdFLENBQUM7Z0JBQzVJLFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLCtDQUErQyxFQUFFLDRFQUE0RSxDQUFDO3dCQUN0SixHQUFHLG1EQUFnQjt3QkFDbkIsT0FBTyxFQUFFLEtBQUs7cUJBQ2Q7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxzREFBc0QsRUFBRSx3RUFBd0UsQ0FBQzt3QkFDekosR0FBRywrQkFBdUI7cUJBQzFCO2lCQUNEO2FBQ0Q7WUFDRCxzQ0FBc0MsRUFBRTtnQkFDdkMsR0FBRyxpQkFBaUI7Z0JBQ3BCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQ0FBc0MsRUFBRSxvREFBb0QsQ0FBQztnQkFDckgsWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsNENBQTRDLEVBQUUsbURBQW1ELENBQUM7d0JBQzFILEdBQUcsbURBQWdCO3FCQUNuQjtvQkFDRCxjQUFjLEVBQUU7d0JBQ2YsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG1EQUFtRCxFQUFFLCtDQUErQyxDQUFDO3dCQUM3SCxHQUFHLCtCQUF1Qjt3QkFDMUIsT0FBTyxFQUFFLEtBQUs7cUJBQ2Q7aUJBQ0Q7YUFDRDtZQUNELG9DQUFvQyxFQUFFO2dCQUNyQyxHQUFHLGlCQUFpQjtnQkFDcEIsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLDJEQUEyRCxDQUFDO2dCQUMxSCxZQUFZLEVBQUU7b0JBQ2IsT0FBTyxFQUFFO3dCQUNSLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSwwREFBMEQsQ0FBQzt3QkFDL0gsR0FBRyxtREFBZ0I7cUJBQ25CO29CQUNELGNBQWMsRUFBRTt3QkFDZixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsaURBQWlELEVBQUUsc0RBQXNELENBQUM7d0JBQ2xJLEdBQUcsK0JBQXVCO3FCQUMxQjtpQkFDRDthQUNEO1lBQ0Qsb0NBQW9DLEVBQUU7Z0JBQ3JDLEdBQUcsaUJBQWlCO2dCQUNwQixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUscUZBQXFGLENBQUM7Z0JBQ3BKLFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLDBDQUEwQyxFQUFFLG9GQUFvRixDQUFDO3dCQUN6SixHQUFHLG1EQUFnQjtxQkFDbkI7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxpREFBaUQsRUFBRSxnRkFBZ0YsQ0FBQzt3QkFDNUosR0FBRywrQkFBdUI7cUJBQzFCO2lCQUNEO2FBQ0Q7WUFDRCxxQ0FBcUMsRUFBRTtnQkFDdEMsR0FBRyxpQkFBaUI7Z0JBQ3BCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQ0FBcUMsRUFBRSwwQ0FBMEMsQ0FBQztnQkFDMUcsWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkNBQTJDLEVBQUUseUNBQXlDLENBQUM7d0JBQy9HLEdBQUcsbURBQWdCO3FCQUNuQjtvQkFDRCxjQUFjLEVBQUU7d0JBQ2YsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLGtEQUFrRCxFQUFFLHFDQUFxQyxDQUFDO3dCQUNsSCxHQUFHLCtCQUF1QjtxQkFDMUI7aUJBQ0Q7YUFDRDtZQUNELGtDQUFrQyxFQUFFO2dCQUNuQyxHQUFHLGlCQUFpQjtnQkFDcEIsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLHdEQUF3RCxDQUFDO2dCQUNySCxZQUFZLEVBQUU7b0JBQ2IsT0FBTyxFQUFFO3dCQUNSLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyx3Q0FBd0MsRUFBRSx1REFBdUQsQ0FBQzt3QkFDMUgsR0FBRyxtREFBZ0I7cUJBQ25CO29CQUNELGNBQWMsRUFBRTt3QkFDZixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsK0NBQStDLEVBQUUsbURBQW1ELENBQUM7d0JBQzdILEdBQUcsK0JBQXVCO3FCQUMxQjtpQkFDRDthQUNEO1lBQ0QsNkNBQTZDLEVBQUU7Z0JBQzlDLEdBQUcsaUJBQWlCO2dCQUNwQixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkNBQTZDLEVBQUUsb0VBQW9FLENBQUM7Z0JBQzVJLFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG1EQUFtRCxFQUFFLG1FQUFtRSxDQUFDO3dCQUNqSixHQUFHLG1EQUFnQjtxQkFDbkI7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywwREFBMEQsRUFBRSwrREFBK0QsQ0FBQzt3QkFDcEosR0FBRywrQkFBdUI7cUJBQzFCO2lCQUNEO2FBQ0Q7WUFDRCx3Q0FBd0MsRUFBRTtnQkFDekMsR0FBRyxpQkFBaUI7Z0JBQ3BCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyx3Q0FBd0MsRUFBRSx5REFBeUQsQ0FBQztnQkFDNUgsWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsOENBQThDLEVBQUUsd0RBQXdELENBQUM7d0JBQ2pJLEdBQUcsbURBQWdCO3FCQUNuQjtvQkFDRCxjQUFjLEVBQUU7d0JBQ2YsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLHFEQUFxRCxFQUFFLG9EQUFvRCxDQUFDO3dCQUNwSSxHQUFHLCtCQUF1QjtxQkFDMUI7aUJBQ0Q7YUFDRDtZQUNELG9DQUFvQyxFQUFFO2dCQUNyQyxHQUFHLGlCQUFpQjtnQkFDcEIsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLG1EQUFtRCxDQUFDO2dCQUNsSCxZQUFZLEVBQUU7b0JBQ2IsT0FBTyxFQUFFO3dCQUNSLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSxrREFBa0QsQ0FBQzt3QkFDdkgsR0FBRyxtREFBZ0I7cUJBQ25CO29CQUNELGNBQWMsRUFBRTt3QkFDZixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsaURBQWlELEVBQUUsOENBQThDLENBQUM7d0JBQzFILEdBQUcsK0JBQXVCO3FCQUMxQjtpQkFDRDthQUNEO1lBQ0Qsd0NBQXdDLEVBQUU7Z0JBQ3pDLEdBQUcscUJBQXFCO2dCQUN4QixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0NBQXdDLEVBQUUsbUhBQW1ILENBQUM7Z0JBQ3RMLFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLHVIQUF1SCxDQUFDO3dCQUMvSyxHQUFHLG1EQUFnQjtxQkFDbkI7aUJBQ0Q7YUFDRDtZQUNELHdDQUF3QyxFQUFFO2dCQUN6QyxHQUFHLHFCQUFxQjtnQkFDeEIsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLHdDQUF3QyxFQUFFLG1IQUFtSCxDQUFDO2dCQUN0TCxZQUFZLEVBQUU7b0JBQ2IsT0FBTyxFQUFFO3dCQUNSLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyw4Q0FBOEMsRUFBRSxzSEFBc0gsQ0FBQzt3QkFDL0wsR0FBRyxtREFBZ0I7cUJBQ25CO2lCQUNEO2FBQ0Q7WUFDRCx1Q0FBdUMsRUFBRTtnQkFDeEMsR0FBRyxxQkFBcUI7Z0JBQ3hCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyx1Q0FBdUMsRUFBRSxrSEFBa0gsQ0FBQztnQkFDcEwsWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkNBQTZDLEVBQUUsc0hBQXNILENBQUM7d0JBQzlMLEdBQUcsbURBQWdCO3FCQUNuQjtpQkFDRDthQUNEO1lBQ0QsNkNBQTZDLEVBQUU7Z0JBQzlDLEdBQUcsaUJBQWlCO2dCQUNwQixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkNBQTZDLEVBQUUsMEVBQTBFLENBQUM7Z0JBQ2xKLFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG1EQUFtRCxFQUFFLHlFQUF5RSxDQUFDO3dCQUN2SixHQUFHLG1EQUFnQjtxQkFDbkI7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywwREFBMEQsRUFBRSxxRUFBcUUsQ0FBQzt3QkFDMUosR0FBRywrQkFBdUI7cUJBQzFCO2lCQUNEO2FBQ0Q7WUFDRCwwQ0FBMEMsRUFBRTtnQkFDM0MsR0FBRyxpQkFBaUI7Z0JBQ3BCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSxzREFBc0QsQ0FBQztnQkFDM0gsWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0RBQWdELEVBQUUscURBQXFELENBQUM7d0JBQ2hJLEdBQUcsbURBQWdCO3FCQUNuQjtvQkFDRCxjQUFjLEVBQUU7d0JBQ2YsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLHVEQUF1RCxFQUFFLGlEQUFpRCxDQUFDO3dCQUNuSSxHQUFHLCtCQUF1QjtxQkFDMUI7aUJBQ0Q7YUFDRDtZQUNELHVDQUF1QyxFQUFFO2dCQUN4QyxHQUFHLGlCQUFpQjtnQkFDcEIsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLHVDQUF1QyxFQUFFLDZDQUE2QyxDQUFDO2dCQUMvRyxZQUFZLEVBQUU7b0JBQ2IsT0FBTyxFQUFFO3dCQUNSLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSw0Q0FBNEMsQ0FBQzt3QkFDcEgsR0FBRyxtREFBZ0I7cUJBQ25CO29CQUNELGNBQWMsRUFBRTt3QkFDZixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0RBQW9ELEVBQUUsd0NBQXdDLENBQUM7d0JBQ3ZILEdBQUcsK0JBQXVCO3FCQUMxQjtpQkFDRDthQUNEO1lBQ0QsMkNBQTJDLEVBQUU7Z0JBQzVDLEdBQUcsaUJBQWlCO2dCQUNwQixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkNBQTJDLEVBQUUsdURBQXVELENBQUM7Z0JBQzdILFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLGlEQUFpRCxFQUFFLHNEQUFzRCxDQUFDO3dCQUNsSSxHQUFHLG1EQUFnQjtxQkFDbkI7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyx3REFBd0QsRUFBRSwrQ0FBK0MsQ0FBQzt3QkFDbEksR0FBRywrQkFBdUI7cUJBQzFCO2lCQUNEO2FBQ0Q7WUFDRCw0Q0FBNEMsRUFBRTtnQkFDN0MsR0FBRyxxQkFBcUI7Z0JBQ3hCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyw0Q0FBNEMsRUFBRSxnREFBZ0QsQ0FBQztnQkFDdkgsWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0RBQWtELEVBQUUsNkRBQTZELENBQUM7d0JBQzFJLEdBQUcsbURBQWdCO3FCQUNuQjtpQkFDRDthQUNEO1lBQ0QsNkNBQTZDLEVBQUU7Z0JBQzlDLEdBQUcscUJBQXFCO2dCQUN4QixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkNBQTZDLEVBQUUsaURBQWlELENBQUM7Z0JBQ3pILFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG1EQUFtRCxFQUFFLHFEQUFxRCxDQUFDO3dCQUNuSSxHQUFHLG1EQUFnQjtxQkFDbkI7aUJBQ0Q7Z0JBQ0QsU0FBUyxFQUFFO29CQUNWLE9BQU8sRUFBRSxJQUFJO2lCQUNiO2FBQ0Q7WUFDRCw2Q0FBNkMsRUFBRTtnQkFDOUMsR0FBRyxxQkFBcUI7Z0JBQ3hCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyw2Q0FBNkMsRUFBRSxpREFBaUQsQ0FBQztnQkFDekgsWUFBWSxFQUFFO29CQUNiLE9BQU8sRUFBRTt3QkFDUixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsbURBQW1ELEVBQUUscURBQXFELENBQUM7d0JBQ25JLEdBQUcsbURBQWdCO3dCQUNuQixPQUFPLEVBQUUsS0FBSztxQkFDZDtpQkFDRDthQUNEO1lBQ0QsNkJBQTZCLEVBQUU7Z0JBQzlCLEdBQUcsaUJBQWlCO2dCQUNwQixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsNkJBQTZCLEVBQUUseUdBQXlHLENBQUM7Z0JBQ2pLLFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG1DQUFtQyxFQUFFLDBDQUEwQyxDQUFDO3dCQUN4RyxHQUFHLG1EQUFnQjtxQkFDbkI7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSxzQ0FBc0MsQ0FBQzt3QkFDM0csR0FBRywrQkFBdUI7cUJBQzFCO2lCQUNEO2FBQ0Q7WUFDRCw0QkFBNEIsRUFBRTtnQkFDN0IsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLE1BQU0sRUFBRSxDQUFDLGVBQWUsQ0FBQztnQkFDekIsb0JBQW9CLEVBQUUsS0FBSztnQkFDM0IscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsc0NBQXNDLENBQUM7Z0JBQ3JHLFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLHFDQUFxQyxDQUFDO3dCQUNsRyxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsTUFBTSxFQUFFLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUM7d0JBQzFDLFNBQVMsRUFBRSxPQUFPO3dCQUNsQixrQkFBa0IsRUFBRTs0QkFDbkIsSUFBQSxjQUFRLEVBQUMsOENBQThDLEVBQUUsMERBQTBELENBQUM7NEJBQ3BILElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLG9FQUFvRSxDQUFDOzRCQUN6SCxJQUFBLGNBQVEsRUFBQyx3Q0FBd0MsRUFBRSw0QkFBNEIsQ0FBQzt5QkFDaEY7cUJBQ0Q7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyx5Q0FBeUMsRUFBRSxpQ0FBaUMsQ0FBQzt3QkFDckcsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLE1BQU0sRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDO3dCQUMxQyxTQUFTLEVBQUUsT0FBTzt3QkFDbEIsa0JBQWtCLEVBQUU7NEJBQ25CLElBQUEsY0FBUSxFQUFDLHFEQUFxRCxFQUFFLGdEQUFnRCxDQUFDOzRCQUNqSCxJQUFBLGNBQVEsRUFBQyxnREFBZ0QsRUFBRSwwREFBMEQsQ0FBQzs0QkFDdEgsSUFBQSxjQUFRLEVBQUMsK0NBQStDLEVBQUUsNEJBQTRCLENBQUM7eUJBQ3ZGO3FCQUNEO2lCQUNEO2dCQUNELE9BQU8sRUFBRTtvQkFDUixPQUFPLEVBQUUsT0FBTztvQkFDaEIsY0FBYyxFQUFFLE9BQU87aUJBQ3ZCO2FBQ0Q7WUFDRCw4QkFBOEIsRUFBRTtnQkFDL0IsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLE1BQU0sRUFBRSxDQUFDLGVBQWUsQ0FBQztnQkFDekIsb0JBQW9CLEVBQUUsS0FBSztnQkFDM0IscUJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsc0RBQXNELENBQUM7Z0JBQ3ZILFlBQVksRUFBRTtvQkFDYixPQUFPLEVBQUU7d0JBQ1IsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLHFEQUFxRCxDQUFDO3dCQUNwSCxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsTUFBTSxFQUFFLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUM7d0JBQzFDLFNBQVMsRUFBRSxPQUFPO3dCQUNsQixrQkFBa0IsRUFBRTs0QkFDbkIsSUFBQSxjQUFRLEVBQUMsMENBQTBDLEVBQUUsNERBQTRELENBQUM7NEJBQ2xILElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLGdJQUFnSSxDQUFDOzRCQUNqTCxJQUFBLGNBQVEsRUFBQyxvQ0FBb0MsRUFBRSw0QkFBNEIsQ0FBQzt5QkFDNUU7cUJBQ0Q7b0JBQ0QsY0FBYyxFQUFFO3dCQUNmLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQywyQ0FBMkMsRUFBRSxpREFBaUQsQ0FBQzt3QkFDdkgsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLE1BQU0sRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDO3dCQUMxQyxTQUFTLEVBQUUsT0FBTzt3QkFDbEIsa0JBQWtCLEVBQUU7NEJBQ25CLElBQUEsY0FBUSxFQUFDLHVEQUF1RCxFQUFFLGlEQUFpRCxDQUFDOzRCQUNwSCxJQUFBLGNBQVEsRUFBQyxrREFBa0QsRUFBRSxzSEFBc0gsQ0FBQzs0QkFDcEwsSUFBQSxjQUFRLEVBQUMsaURBQWlELEVBQUUsa0JBQWtCLENBQUM7eUJBQy9FO3FCQUNEO2lCQUNEO2dCQUNELE9BQU8sRUFBRTtvQkFDUixPQUFPLEVBQUUsT0FBTztvQkFDaEIsY0FBYyxFQUFFLE9BQU87aUJBQ3ZCO2FBQ0Q7U0FDRDtLQUNELENBQUM7SUFFRixTQUFnQixrQ0FBa0M7UUFDakQsTUFBTSxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDL0UsUUFBUSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTlDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztZQUM5QixHQUFHLDhDQUE4QjtZQUNqQyxVQUFVLEVBQUU7Z0JBQ1gsZ0dBQXFELEVBQUU7b0JBQ3RELFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSx5UEFBeVAsQ0FBQztvQkFDdlMsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDO29CQUN2QixLQUFLLHdDQUFnQztpQkFDckM7Z0JBQ0QsZ0dBQXFELEVBQUU7b0JBQ3RELG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLCtIQUErSCxFQUFFLE1BQU0sOEZBQW1ELEtBQUssQ0FBQztvQkFDclAsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsT0FBTyxxREFBMkM7b0JBQ2xELE9BQU8sbURBQTJDO29CQUNsRCxPQUFPLHNEQUEyQztvQkFDbEQsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDO29CQUN2QixLQUFLLHdDQUFnQztpQkFDckM7Z0JBQ0QsNkZBQW9ELEVBQUU7b0JBQ3JELFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxrQ0FBa0MsRUFBRSxpREFBaUQsQ0FBQztvQkFDNUcsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsSUFBSSxFQUFFLENBQUMsZUFBZSxDQUFDO2lCQUN2QjthQUNEO1NBQ0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELElBQWtCLDJCQUdqQjtJQUhELFdBQWtCLDJCQUEyQjtRQUM1QyxrRkFBbUQsQ0FBQTtRQUNuRCxvRkFBdUMsQ0FBQTtJQUN4QyxDQUFDLEVBSGlCLDJCQUEyQiwyQ0FBM0IsMkJBQTJCLFFBRzVDO0lBQ1ksUUFBQSxvQkFBb0IsR0FBRyxJQUFJLENBQUM7SUFFbEMsSUFBTSx1Q0FBdUMsR0FBN0MsTUFBTSx1Q0FBd0MsU0FBUSxzQkFBVTtpQkFFdEQsT0FBRSxHQUFHLDJEQUEyRCxBQUE5RCxDQUErRDtRQUVqRixZQUNrQyxhQUE2QjtZQUU5RCxLQUFLLEVBQUUsQ0FBQztZQUZ5QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFJOUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckgsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLENBQUMsMkNBQTJDO1lBQ3BELENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEMsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3BFLE9BQU8sU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25FLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxRQUFRLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDL0UsUUFBUSxDQUFDLHFCQUFxQixDQUFDO2dCQUM5QixHQUFHLDBDQUFrQztnQkFDckMsVUFBVSxFQUFFO29CQUNYLHFGQUEyQyxFQUFFO3dCQUM1QyxxQkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxpUEFBaVAsQ0FBQzt3QkFDelMsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLFNBQVMsRUFBRSw0QkFBb0I7d0JBQy9CLFNBQVMsRUFBRSxDQUFDO3dCQUNaLE1BQU0sRUFBRSxDQUFDLGVBQWUsQ0FBQztxQkFDekI7b0JBQ0QsdUZBQTRDLEVBQUU7d0JBQzdDLHFCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLDBNQUEwTSxDQUFDO3dCQUNuUSxNQUFNLEVBQUUsUUFBUTt3QkFDaEIsTUFBTSxFQUFFLGVBQWU7d0JBQ3ZCLFNBQVMsRUFBRSxNQUFNO3dCQUNqQixNQUFNLEVBQUUsQ0FBQyxlQUFlLENBQUM7d0JBQ3pCLGtCQUFrQixFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO3dCQUNuRSxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztxQkFDakU7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sWUFBWTtZQUNuQixPQUFPO2dCQUNOLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLDZCQUE2QixDQUFDO2lCQUNwRTtnQkFDRCxHQUFHLGdDQUFnQjthQUNuQixDQUFDO1FBQ0gsQ0FBQzs7SUFyRFcsMEZBQXVDO3NEQUF2Qyx1Q0FBdUM7UUFLakQsV0FBQSw4QkFBYyxDQUFBO09BTEosdUNBQXVDLENBc0RuRDtJQUVELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxzQkFBc0IsQ0FBQztTQUN0RiwrQkFBK0IsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsRUFBRSxrQkFBa0I7WUFDdkIsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUM5QixPQUFPO29CQUNOLENBQUMscUNBQXFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQztvQkFDbEQsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQztpQkFDMUMsQ0FBQztZQUNILENBQUM7U0FDRCxDQUFDLENBQUMsQ0FBQztJQUVMLG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxzQkFBc0IsQ0FBQztTQUN0RiwrQkFBK0IsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsRUFBRSxtQ0FBbUM7WUFDeEMsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUM5QixPQUFPO29CQUNOLENBQUMsK0NBQStDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQztvQkFDNUQsQ0FBQyxtQ0FBbUMsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQztpQkFDM0QsQ0FBQztZQUNILENBQUM7U0FDRCxDQUFDLENBQUMsQ0FBQztJQUVMLG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxzQkFBc0IsQ0FBQztTQUN0RiwrQkFBK0IsQ0FBQyxnREFBbUIsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3pGLEdBQUcsRUFBRSxJQUFJLENBQUMsc0JBQXNCO1FBQ2hDLFNBQVMsRUFBRSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUM5QixNQUFNLDBCQUEwQixHQUErQixFQUFFLENBQUM7WUFDbEUsTUFBTSw2QkFBNkIsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUM7WUFDekUsSUFBSSxZQUFnQyxDQUFDO1lBQ3JDLElBQUksNkJBQTZCLEVBQUUsQ0FBQztnQkFDbkMsWUFBWSxHQUFHLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLFNBQVMsQ0FBQztnQkFDcEUsSUFBSSxZQUFZLEtBQUssU0FBUyxJQUFJLE9BQU8sWUFBWSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNwRSxZQUFZLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUM7WUFDRCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRiwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0SSxPQUFPLDBCQUEwQixDQUFDO1FBQ25DLENBQUM7S0FDRCxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRU4sbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLHNCQUFzQixDQUFDO1NBQ3RGLCtCQUErQixDQUFDLGdEQUFtQixDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hJLEdBQUcsRUFBRSxJQUFJLENBQUMsNkJBQThCO1FBQ3hDLFNBQVMsRUFBRSxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUNyQyxNQUFNLDBCQUEwQixHQUErQixFQUFFLENBQUM7WUFDbEUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3pGLElBQUksWUFBWSxLQUFLLFNBQVMsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDcEUsWUFBWSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDOUMsQ0FBQztZQUNELDBCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFlBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLDBCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFGLE9BQU8sMEJBQTBCLENBQUM7UUFDbkMsQ0FBQztLQUNELENBQUMsQ0FBQyxDQUFDLENBQUMifQ==