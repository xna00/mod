/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/base/common/color", "vs/nls", "vs/workbench/contrib/debug/browser/debugIcons", "vs/platform/theme/common/theme"], function (require, exports, colorRegistry_1, themeService_1, themables_1, color_1, nls_1, icons, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.debugIconStartForeground = exports.debugToolBarBorder = exports.debugToolBarBackground = void 0;
    exports.registerColors = registerColors;
    exports.debugToolBarBackground = (0, colorRegistry_1.registerColor)('debugToolBar.background', {
        dark: '#333333',
        light: '#F3F3F3',
        hcDark: '#000000',
        hcLight: '#FFFFFF'
    }, (0, nls_1.localize)('debugToolBarBackground', "Debug toolbar background color."));
    exports.debugToolBarBorder = (0, colorRegistry_1.registerColor)('debugToolBar.border', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('debugToolBarBorder', "Debug toolbar border color."));
    exports.debugIconStartForeground = (0, colorRegistry_1.registerColor)('debugIcon.startForeground', {
        dark: '#89D185',
        light: '#388A34',
        hcDark: '#89D185',
        hcLight: '#388A34'
    }, (0, nls_1.localize)('debugIcon.startForeground', "Debug toolbar icon for start debugging."));
    function registerColors() {
        const debugTokenExpressionName = (0, colorRegistry_1.registerColor)('debugTokenExpression.name', { dark: '#c586c0', light: '#9b46b0', hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for the token names shown in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionValue = (0, colorRegistry_1.registerColor)('debugTokenExpression.value', { dark: '#cccccc99', light: '#6c6c6ccc', hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for the token values shown in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionString = (0, colorRegistry_1.registerColor)('debugTokenExpression.string', { dark: '#ce9178', light: '#a31515', hcDark: '#f48771', hcLight: '#a31515' }, 'Foreground color for strings in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionBoolean = (0, colorRegistry_1.registerColor)('debugTokenExpression.boolean', { dark: '#4e94ce', light: '#0000ff', hcDark: '#75bdfe', hcLight: '#0000ff' }, 'Foreground color for booleans in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionNumber = (0, colorRegistry_1.registerColor)('debugTokenExpression.number', { dark: '#b5cea8', light: '#098658', hcDark: '#89d185', hcLight: '#098658' }, 'Foreground color for numbers in the debug views (ie. the Variables or Watch view).');
        const debugTokenExpressionError = (0, colorRegistry_1.registerColor)('debugTokenExpression.error', { dark: '#f48771', light: '#e51400', hcDark: '#f48771', hcLight: '#e51400' }, 'Foreground color for expression errors in the debug views (ie. the Variables or Watch view) and for error logs shown in the debug console.');
        const debugViewExceptionLabelForeground = (0, colorRegistry_1.registerColor)('debugView.exceptionLabelForeground', { dark: colorRegistry_1.foreground, light: '#FFF', hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for a label shown in the CALL STACK view when the debugger breaks on an exception.');
        const debugViewExceptionLabelBackground = (0, colorRegistry_1.registerColor)('debugView.exceptionLabelBackground', { dark: '#6C2022', light: '#A31515', hcDark: '#6C2022', hcLight: '#A31515' }, 'Background color for a label shown in the CALL STACK view when the debugger breaks on an exception.');
        const debugViewStateLabelForeground = (0, colorRegistry_1.registerColor)('debugView.stateLabelForeground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for a label in the CALL STACK view showing the current session\'s or thread\'s state.');
        const debugViewStateLabelBackground = (0, colorRegistry_1.registerColor)('debugView.stateLabelBackground', { dark: '#88888844', light: '#88888844', hcDark: '#88888844', hcLight: '#88888844' }, 'Background color for a label in the CALL STACK view showing the current session\'s or thread\'s state.');
        const debugViewValueChangedHighlight = (0, colorRegistry_1.registerColor)('debugView.valueChangedHighlight', { dark: '#569CD6', light: '#569CD6', hcDark: '#569CD6', hcLight: '#569CD6' }, 'Color used to highlight value changes in the debug views (ie. in the Variables view).');
        const debugConsoleInfoForeground = (0, colorRegistry_1.registerColor)('debugConsole.infoForeground', { dark: colorRegistry_1.editorInfoForeground, light: colorRegistry_1.editorInfoForeground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for info messages in debug REPL console.');
        const debugConsoleWarningForeground = (0, colorRegistry_1.registerColor)('debugConsole.warningForeground', { dark: colorRegistry_1.editorWarningForeground, light: colorRegistry_1.editorWarningForeground, hcDark: '#008000', hcLight: colorRegistry_1.editorWarningForeground }, 'Foreground color for warning messages in debug REPL console.');
        const debugConsoleErrorForeground = (0, colorRegistry_1.registerColor)('debugConsole.errorForeground', { dark: colorRegistry_1.errorForeground, light: colorRegistry_1.errorForeground, hcDark: colorRegistry_1.errorForeground, hcLight: colorRegistry_1.errorForeground }, 'Foreground color for error messages in debug REPL console.');
        const debugConsoleSourceForeground = (0, colorRegistry_1.registerColor)('debugConsole.sourceForeground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for source filenames in debug REPL console.');
        const debugConsoleInputIconForeground = (0, colorRegistry_1.registerColor)('debugConsoleInputIcon.foreground', { dark: colorRegistry_1.foreground, light: colorRegistry_1.foreground, hcDark: colorRegistry_1.foreground, hcLight: colorRegistry_1.foreground }, 'Foreground color for debug console input marker icon.');
        const debugIconPauseForeground = (0, colorRegistry_1.registerColor)('debugIcon.pauseForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.pauseForeground', "Debug toolbar icon for pause."));
        const debugIconStopForeground = (0, colorRegistry_1.registerColor)('debugIcon.stopForeground', {
            dark: '#F48771',
            light: '#A1260D',
            hcDark: '#F48771',
            hcLight: '#A1260D'
        }, (0, nls_1.localize)('debugIcon.stopForeground', "Debug toolbar icon for stop."));
        const debugIconDisconnectForeground = (0, colorRegistry_1.registerColor)('debugIcon.disconnectForeground', {
            dark: '#F48771',
            light: '#A1260D',
            hcDark: '#F48771',
            hcLight: '#A1260D'
        }, (0, nls_1.localize)('debugIcon.disconnectForeground', "Debug toolbar icon for disconnect."));
        const debugIconRestartForeground = (0, colorRegistry_1.registerColor)('debugIcon.restartForeground', {
            dark: '#89D185',
            light: '#388A34',
            hcDark: '#89D185',
            hcLight: '#388A34'
        }, (0, nls_1.localize)('debugIcon.restartForeground', "Debug toolbar icon for restart."));
        const debugIconStepOverForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepOverForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepOverForeground', "Debug toolbar icon for step over."));
        const debugIconStepIntoForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepIntoForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepIntoForeground', "Debug toolbar icon for step into."));
        const debugIconStepOutForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepOutForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepOutForeground', "Debug toolbar icon for step over."));
        const debugIconContinueForeground = (0, colorRegistry_1.registerColor)('debugIcon.continueForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.continueForeground', "Debug toolbar icon for continue."));
        const debugIconStepBackForeground = (0, colorRegistry_1.registerColor)('debugIcon.stepBackForeground', {
            dark: '#75BEFF',
            light: '#007ACC',
            hcDark: '#75BEFF',
            hcLight: '#007ACC'
        }, (0, nls_1.localize)('debugIcon.stepBackForeground', "Debug toolbar icon for step back."));
        (0, themeService_1.registerThemingParticipant)((theme, collector) => {
            // All these colours provide a default value so they will never be undefined, hence the `!`
            const badgeBackgroundColor = theme.getColor(colorRegistry_1.badgeBackground);
            const badgeForegroundColor = theme.getColor(colorRegistry_1.badgeForeground);
            const listDeemphasizedForegroundColor = theme.getColor(colorRegistry_1.listDeemphasizedForeground);
            const debugViewExceptionLabelForegroundColor = theme.getColor(debugViewExceptionLabelForeground);
            const debugViewExceptionLabelBackgroundColor = theme.getColor(debugViewExceptionLabelBackground);
            const debugViewStateLabelForegroundColor = theme.getColor(debugViewStateLabelForeground);
            const debugViewStateLabelBackgroundColor = theme.getColor(debugViewStateLabelBackground);
            const debugViewValueChangedHighlightColor = theme.getColor(debugViewValueChangedHighlight);
            const toolbarHoverBackgroundColor = theme.getColor(colorRegistry_1.toolbarHoverBackground);
            collector.addRule(`
			/* Text colour of the call stack row's filename */
			.debug-pane .debug-call-stack .monaco-list-row:not(.selected) .stack-frame > .file .file-name {
				color: ${listDeemphasizedForegroundColor}
			}

			/* Line & column number "badge" for selected call stack row */
			.debug-pane .monaco-list-row.selected .line-number {
				background-color: ${badgeBackgroundColor};
				color: ${badgeForegroundColor};
			}

			/* Line & column number "badge" for unselected call stack row (basically all other rows) */
			.debug-pane .line-number {
				background-color: ${badgeBackgroundColor.transparent(0.6)};
				color: ${badgeForegroundColor.transparent(0.6)};
			}

			/* State "badge" displaying the active session's current state.
			* Only visible when there are more active debug sessions/threads running.
			*/
			.debug-pane .debug-call-stack .thread > .state.label,
			.debug-pane .debug-call-stack .session > .state.label {
				background-color: ${debugViewStateLabelBackgroundColor};
				color: ${debugViewStateLabelForegroundColor};
			}

			/* State "badge" displaying the active session's current state.
			* Only visible when there are more active debug sessions/threads running
			* and thread paused due to a thrown exception.
			*/
			.debug-pane .debug-call-stack .thread > .state.label.exception,
			.debug-pane .debug-call-stack .session > .state.label.exception {
				background-color: ${debugViewExceptionLabelBackgroundColor};
				color: ${debugViewExceptionLabelForegroundColor};
			}

			/* Info "badge" shown when the debugger pauses due to a thrown exception. */
			.debug-pane .call-stack-state-message > .label.exception {
				background-color: ${debugViewExceptionLabelBackgroundColor};
				color: ${debugViewExceptionLabelForegroundColor};
			}

			/* Animation of changed values in Debug viewlet */
			@keyframes debugViewletValueChanged {
				0%   { background-color: ${debugViewValueChangedHighlightColor.transparent(0)} }
				5%   { background-color: ${debugViewValueChangedHighlightColor.transparent(0.9)} }
				100% { background-color: ${debugViewValueChangedHighlightColor.transparent(0.3)} }
			}

			.debug-pane .monaco-list-row .expression .value.changed {
				background-color: ${debugViewValueChangedHighlightColor.transparent(0.3)};
				animation-name: debugViewletValueChanged;
				animation-duration: 1s;
				animation-fill-mode: forwards;
			}

			.monaco-list-row .expression .lazy-button:hover {
				background-color: ${toolbarHoverBackgroundColor}
			}
		`);
            const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
            if (contrastBorderColor) {
                collector.addRule(`
			.debug-pane .line-number {
				border: 1px solid ${contrastBorderColor};
			}
			`);
            }
            // Use fully-opaque colors for line-number badges
            if ((0, theme_1.isHighContrast)(theme.type)) {
                collector.addRule(`
			.debug-pane .line-number {
				background-color: ${badgeBackgroundColor};
				color: ${badgeForegroundColor};
			}`);
            }
            const tokenNameColor = theme.getColor(debugTokenExpressionName);
            const tokenValueColor = theme.getColor(debugTokenExpressionValue);
            const tokenStringColor = theme.getColor(debugTokenExpressionString);
            const tokenBooleanColor = theme.getColor(debugTokenExpressionBoolean);
            const tokenErrorColor = theme.getColor(debugTokenExpressionError);
            const tokenNumberColor = theme.getColor(debugTokenExpressionNumber);
            collector.addRule(`
			.monaco-workbench .monaco-list-row .expression .name {
				color: ${tokenNameColor};
			}

			.monaco-workbench .monaco-list-row .expression .value,
			.monaco-workbench .debug-hover-widget .value {
				color: ${tokenValueColor};
			}

			.monaco-workbench .monaco-list-row .expression .value.string,
			.monaco-workbench .debug-hover-widget .value.string {
				color: ${tokenStringColor};
			}

			.monaco-workbench .monaco-list-row .expression .value.boolean,
			.monaco-workbench .debug-hover-widget .value.boolean {
				color: ${tokenBooleanColor};
			}

			.monaco-workbench .monaco-list-row .expression .error,
			.monaco-workbench .debug-hover-widget .error,
			.monaco-workbench .debug-pane .debug-variables .scope .error {
				color: ${tokenErrorColor};
			}

			.monaco-workbench .monaco-list-row .expression .value.number,
			.monaco-workbench .debug-hover-widget .value.number {
				color: ${tokenNumberColor};
			}
		`);
            const debugConsoleInputBorderColor = theme.getColor(colorRegistry_1.inputBorder) || color_1.Color.fromHex('#80808060');
            const debugConsoleInfoForegroundColor = theme.getColor(debugConsoleInfoForeground);
            const debugConsoleWarningForegroundColor = theme.getColor(debugConsoleWarningForeground);
            const debugConsoleErrorForegroundColor = theme.getColor(debugConsoleErrorForeground);
            const debugConsoleSourceForegroundColor = theme.getColor(debugConsoleSourceForeground);
            const debugConsoleInputIconForegroundColor = theme.getColor(debugConsoleInputIconForeground);
            collector.addRule(`
			.repl .repl-input-wrapper {
				border-top: 1px solid ${debugConsoleInputBorderColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .value.info {
				color: ${debugConsoleInfoForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .value.warn {
				color: ${debugConsoleWarningForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .value.error {
				color: ${debugConsoleErrorForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .output .expression .source {
				color: ${debugConsoleSourceForegroundColor};
			}

			.monaco-workbench .repl .repl-tree .monaco-tl-contents .arrow {
				color: ${debugConsoleInputIconForegroundColor};
			}
		`);
            if (!theme.defines(debugConsoleInputIconForeground)) {
                collector.addRule(`
				.monaco-workbench.vs .repl .repl-tree .monaco-tl-contents .arrow {
					opacity: 0.25;
				}

				.monaco-workbench.vs-dark .repl .repl-tree .monaco-tl-contents .arrow {
					opacity: 0.4;
				}

				.monaco-workbench.hc-black .repl .repl-tree .monaco-tl-contents .arrow,
				.monaco-workbench.hc-light .repl .repl-tree .monaco-tl-contents .arrow {
					opacity: 1;
				}
			`);
            }
            const debugIconStartColor = theme.getColor(exports.debugIconStartForeground);
            if (debugIconStartColor) {
                collector.addRule(`.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStart)} { color: ${debugIconStartColor}; }`);
            }
            const debugIconPauseColor = theme.getColor(debugIconPauseForeground);
            if (debugIconPauseColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugPause)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugPause)} { color: ${debugIconPauseColor}; }`);
            }
            const debugIconStopColor = theme.getColor(debugIconStopForeground);
            if (debugIconStopColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStop)},.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStop)} { color: ${debugIconStopColor}; }`);
            }
            const debugIconDisconnectColor = theme.getColor(debugIconDisconnectForeground);
            if (debugIconDisconnectColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)},.monaco-workbench .debug-view-content ${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)}, .monaco-workbench .debug-toolbar ${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)}, .monaco-workbench .command-center-center ${themables_1.ThemeIcon.asCSSSelector(icons.debugDisconnect)} { color: ${debugIconDisconnectColor}; }`);
            }
            const debugIconRestartColor = theme.getColor(debugIconRestartForeground);
            if (debugIconRestartColor) {
                collector.addRule(`.monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugRestart)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugRestartFrame)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugRestart)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugRestartFrame)} { color: ${debugIconRestartColor}; }`);
            }
            const debugIconStepOverColor = theme.getColor(debugIconStepOverForeground);
            if (debugIconStepOverColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOver)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOver)} { color: ${debugIconStepOverColor}; }`);
            }
            const debugIconStepIntoColor = theme.getColor(debugIconStepIntoForeground);
            if (debugIconStepIntoColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepInto)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepInto)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepInto)} { color: ${debugIconStepIntoColor}; }`);
            }
            const debugIconStepOutColor = theme.getColor(debugIconStepOutForeground);
            if (debugIconStepOutColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOut)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOut)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepOut)} { color: ${debugIconStepOutColor}; }`);
            }
            const debugIconContinueColor = theme.getColor(debugIconContinueForeground);
            if (debugIconContinueColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugContinue)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugContinue)}, .monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugReverseContinue)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugReverseContinue)} { color: ${debugIconContinueColor}; }`);
            }
            const debugIconStepBackColor = theme.getColor(debugIconStepBackForeground);
            if (debugIconStepBackColor) {
                collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label${themables_1.ThemeIcon.asCSSSelector(icons.debugStepBack)}, .monaco-workbench ${themables_1.ThemeIcon.asCSSSelector(icons.debugStepBack)} { color: ${debugIconStepBackColor}; }`);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb2xvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvZGVidWdDb2xvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0JoRyx3Q0E0VEM7SUFqVlksUUFBQSxzQkFBc0IsR0FBRyxJQUFBLDZCQUFhLEVBQUMseUJBQXlCLEVBQUU7UUFDOUUsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsU0FBUztRQUNoQixNQUFNLEVBQUUsU0FBUztRQUNqQixPQUFPLEVBQUUsU0FBUztLQUNsQixFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLGlDQUFpQyxDQUFDLENBQUMsQ0FBQztJQUU3RCxRQUFBLGtCQUFrQixHQUFHLElBQUEsNkJBQWEsRUFBQyxxQkFBcUIsRUFBRTtRQUN0RSxJQUFJLEVBQUUsSUFBSTtRQUNWLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLElBQUk7UUFDWixPQUFPLEVBQUUsSUFBSTtLQUNiLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO0lBRXJELFFBQUEsd0JBQXdCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLDJCQUEyQixFQUFFO1FBQ2xGLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLFNBQVM7S0FDbEIsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDLENBQUM7SUFFckYsU0FBZ0IsY0FBYztRQUU3QixNQUFNLHdCQUF3QixHQUFHLElBQUEsNkJBQWEsRUFBQywyQkFBMkIsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUs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