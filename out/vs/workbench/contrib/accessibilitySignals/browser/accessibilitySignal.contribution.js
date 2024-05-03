/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/accessibilitySignals/browser/commands", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignalDebuggerContribution", "vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignalLineFeatureContribution"], function (require, exports, commands_1, nls_1, actions_1, configurationRegistry_1, extensions_1, platform_1, contributions_1, accessibilitySignalService_1, accessibilitySignalDebuggerContribution_1, accessibilitySignalLineFeatureContribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.soundFeatureBase = void 0;
    (0, extensions_1.registerSingleton)(accessibilitySignalService_1.IAccessibilitySignalService, accessibilitySignalService_1.AccessibilitySignalService, 1 /* InstantiationType.Delayed */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(accessibilitySignalLineFeatureContribution_1.SignalLineFeatureContribution, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(accessibilitySignalDebuggerContribution_1.AccessibilitySignalLineDebuggerContribution, 3 /* LifecyclePhase.Restored */);
    exports.soundFeatureBase = {
        'type': 'string',
        'enum': ['auto', 'on', 'off'],
        'default': 'auto',
        'enumDescriptions': [
            (0, nls_1.localize)('audioCues.enabled.auto', "Enable sound when a screen reader is attached."),
            (0, nls_1.localize)('audioCues.enabled.on', "Enable sound."),
            (0, nls_1.localize)('audioCues.enabled.off', "Disable sound.")
        ],
        tags: ['accessibility'],
    };
    const markdownDeprecationMessage = (0, nls_1.localize)('audioCues.enabled.deprecated', "This setting is deprecated. Use `signals` settings instead.");
    const soundDeprecatedFeatureBase = {
        ...exports.soundFeatureBase,
        markdownDeprecationMessage
    };
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'properties': {
            'audioCues.enabled': {
                markdownDeprecationMessage: 'Deprecated. Use the specific setting for each audio cue instead (`audioCues.*`).',
                tags: ['accessibility']
            },
            'audioCues.volume': {
                markdownDeprecationMessage: 'Deprecated. Use `accessibility.signals.sounds.volume` instead.',
                tags: ['accessibility']
            },
            'audioCues.debouncePositionChanges': {
                'description': (0, nls_1.localize)('audioCues.debouncePositionChanges', "Whether or not position changes should be debounced"),
                'type': 'boolean',
                'default': false,
                tags: ['accessibility'],
                'markdownDeprecationMessage': (0, nls_1.localize)('audioCues.debouncePositionChangesDeprecated', 'This setting is deprecated, instead use the `signals.debouncePositionChanges` setting.')
            },
            'audioCues.lineHasBreakpoint': {
                'description': (0, nls_1.localize)('audioCues.lineHasBreakpoint', "Plays a sound when the active line has a breakpoint."),
                ...soundDeprecatedFeatureBase
            },
            'audioCues.lineHasInlineSuggestion': {
                'description': (0, nls_1.localize)('audioCues.lineHasInlineSuggestion', "Plays a sound when the active line has an inline suggestion."),
                ...soundDeprecatedFeatureBase
            },
            'audioCues.lineHasError': {
                'description': (0, nls_1.localize)('audioCues.lineHasError', "Plays a sound when the active line has an error."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.lineHasFoldedArea': {
                'description': (0, nls_1.localize)('audioCues.lineHasFoldedArea', "Plays a sound when the active line has a folded area that can be unfolded."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.lineHasWarning': {
                'description': (0, nls_1.localize)('audioCues.lineHasWarning', "Plays a sound when the active line has a warning."),
                ...soundDeprecatedFeatureBase,
                default: 'off',
            },
            'audioCues.onDebugBreak': {
                'description': (0, nls_1.localize)('audioCues.onDebugBreak', "Plays a sound when the debugger stopped on a breakpoint."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.noInlayHints': {
                'description': (0, nls_1.localize)('audioCues.noInlayHints', "Plays a sound when trying to read a line with inlay hints that has no inlay hints."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.taskCompleted': {
                'description': (0, nls_1.localize)('audioCues.taskCompleted', "Plays a sound when a task is completed."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.taskFailed': {
                'description': (0, nls_1.localize)('audioCues.taskFailed', "Plays a sound when a task fails (non-zero exit code)."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.terminalCommandFailed': {
                'description': (0, nls_1.localize)('audioCues.terminalCommandFailed', "Plays a sound when a terminal command fails (non-zero exit code)."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.terminalQuickFix': {
                'description': (0, nls_1.localize)('audioCues.terminalQuickFix', "Plays a sound when terminal Quick Fixes are available."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.terminalBell': {
                'description': (0, nls_1.localize)('audioCues.terminalBell', "Plays a sound when the terminal bell is ringing."),
                ...soundDeprecatedFeatureBase,
                default: 'on'
            },
            'audioCues.diffLineInserted': {
                'description': (0, nls_1.localize)('audioCues.diffLineInserted', "Plays a sound when the focus moves to an inserted line in Accessible Diff Viewer mode or to the next/previous change."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.diffLineDeleted': {
                'description': (0, nls_1.localize)('audioCues.diffLineDeleted', "Plays a sound when the focus moves to a deleted line in Accessible Diff Viewer mode or to the next/previous change."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.diffLineModified': {
                'description': (0, nls_1.localize)('audioCues.diffLineModified', "Plays a sound when the focus moves to a modified line in Accessible Diff Viewer mode or to the next/previous change."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.notebookCellCompleted': {
                'description': (0, nls_1.localize)('audioCues.notebookCellCompleted', "Plays a sound when a notebook cell execution is successfully completed."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.notebookCellFailed': {
                'description': (0, nls_1.localize)('audioCues.notebookCellFailed', "Plays a sound when a notebook cell execution fails."),
                ...soundDeprecatedFeatureBase,
            },
            'audioCues.chatRequestSent': {
                'description': (0, nls_1.localize)('audioCues.chatRequestSent', "Plays a sound when a chat request is made."),
                ...soundDeprecatedFeatureBase,
                default: 'off'
            },
            'audioCues.chatResponsePending': {
                'description': (0, nls_1.localize)('audioCues.chatResponsePending', "Plays a sound on loop while the response is pending."),
                ...soundDeprecatedFeatureBase,
                default: 'auto'
            },
            'audioCues.chatResponseReceived': {
                'description': (0, nls_1.localize)('audioCues.chatResponseReceived', "Plays a sound on loop while the response has been received."),
                ...soundDeprecatedFeatureBase,
                default: 'off'
            },
            'audioCues.clear': {
                'description': (0, nls_1.localize)('audioCues.clear', "Plays a sound when a feature is cleared (for example, the terminal, Debug Console, or Output channel). When this is disabled, an ARIA alert will announce 'Cleared'."),
                ...soundDeprecatedFeatureBase,
                default: 'off'
            },
            'audioCues.save': {
                'markdownDescription': (0, nls_1.localize)('audioCues.save', "Plays a sound when a file is saved. Also see {0}", '`#accessibility.alert.save#`'),
                'type': 'string',
                'enum': ['userGesture', 'always', 'never'],
                'default': 'never',
                'enumDescriptions': [
                    (0, nls_1.localize)('audioCues.save.userGesture', "Plays the audio cue when a user explicitly saves a file."),
                    (0, nls_1.localize)('audioCues.save.always', "Plays the audio cue whenever a file is saved, including auto save."),
                    (0, nls_1.localize)('audioCues.save.never', "Never plays the audio cue.")
                ],
                tags: ['accessibility'],
                markdownDeprecationMessage
            },
            'audioCues.format': {
                'markdownDescription': (0, nls_1.localize)('audioCues.format', "Plays a sound when a file or notebook is formatted. Also see {0}", '`#accessibility.alert.format#`'),
                'type': 'string',
                'enum': ['userGesture', 'always', 'never'],
                'default': 'never',
                'enumDescriptions': [
                    (0, nls_1.localize)('audioCues.format.userGesture', "Plays the audio cue when a user explicitly formats a file."),
                    (0, nls_1.localize)('audioCues.format.always', "Plays the audio cue whenever a file is formatted, including if it is set to format on save, type, or, paste, or run of a cell."),
                    (0, nls_1.localize)('audioCues.format.never', "Never plays the audio cue.")
                ],
                tags: ['accessibility'],
                markdownDeprecationMessage
            },
        },
    });
    (0, actions_1.registerAction2)(commands_1.ShowSignalSoundHelp);
    (0, actions_1.registerAction2)(commands_1.ShowAccessibilityAnnouncementHelp);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNpZ25hbC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHlTaWduYWxzL2Jyb3dzZXIvYWNjZXNzaWJpbGl0eVNpZ25hbC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLElBQUEsOEJBQWlCLEVBQUMsd0RBQTJCLEVBQUUsdURBQTBCLG9DQUE0QixDQUFDO0lBRXRHLG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQywwRUFBNkIsa0NBQTBCLENBQUM7SUFDbEssbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLHFGQUEyQyxrQ0FBMEIsQ0FBQztJQUVuSyxRQUFBLGdCQUFnQixHQUFpQztRQUM3RCxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztRQUM3QixTQUFTLEVBQUUsTUFBTTtRQUNqQixrQkFBa0IsRUFBRTtZQUNuQixJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxnREFBZ0QsQ0FBQztZQUNwRixJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSxlQUFlLENBQUM7WUFDakQsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLENBQUM7U0FDbkQ7UUFDRCxJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUM7S0FDdkIsQ0FBQztJQUNGLE1BQU0sMEJBQTBCLEdBQUcsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsNkRBQTZELENBQUMsQ0FBQztJQUMzSSxNQUFNLDBCQUEwQixHQUFp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