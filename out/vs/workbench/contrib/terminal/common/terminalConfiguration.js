/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configurationRegistry", "vs/nls", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/platform", "vs/platform/registry/common/platform", "vs/base/common/codicons", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/platform/product/common/product", "vs/workbench/common/configuration"], function (require, exports, configurationRegistry_1, nls_1, terminal_1, platform_1, platform_2, codicons_1, terminalPlatformConfiguration_1, product_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultTerminalFontSize = void 0;
    exports.registerTerminalConfiguration = registerTerminalConfiguration;
    const terminalDescriptors = '\n- ' + [
        '`\${cwd}`: ' + (0, nls_1.localize)("cwd", "the terminal's current working directory"),
        '`\${cwdFolder}`: ' + (0, nls_1.localize)('cwdFolder', "the terminal's current working directory, displayed for multi-root workspaces or in a single root workspace when the value differs from the initial working directory. On Windows, this will only be displayed when shell integration is enabled."),
        '`\${workspaceFolder}`: ' + (0, nls_1.localize)('workspaceFolder', "the workspace in which the terminal was launched"),
        '`\${local}`: ' + (0, nls_1.localize)('local', "indicates a local terminal in a remote workspace"),
        '`\${process}`: ' + (0, nls_1.localize)('process', "the name of the terminal process"),
        '`\${separator}`: ' + (0, nls_1.localize)('separator', "a conditional separator {0} that only shows when surrounded by variables with values or static text.", '(` - `)'),
        '`\${sequence}`: ' + (0, nls_1.localize)('sequence', "the name provided to the terminal by the process"),
        '`\${task}`: ' + (0, nls_1.localize)('task', "indicates this terminal is associated with a task"),
    ].join('\n- '); // intentionally concatenated to not produce a string that is too long for translations
    let terminalTitle = (0, nls_1.localize)('terminalTitle', "Controls the terminal title. Variables are substituted based on the context:");
    terminalTitle += terminalDescriptors;
    let terminalDescription = (0, nls_1.localize)('terminalDescription', "Controls the terminal description, which appears to the right of the title. Variables are substituted based on the context:");
    terminalDescription += terminalDescriptors;
    exports.defaultTerminalFontSize = platform_1.isMacintosh ? 12 : 14;
    const terminalConfiguration = {
        id: 'terminal',
        order: 100,
        title: (0, nls_1.localize)('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
        type: 'object',
        properties: {
            ["terminal.integrated.sendKeybindingsToShell" /* TerminalSettingId.SendKeybindingsToShell */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.sendKeybindingsToShell', "Dispatches most keybindings to the terminal instead of the workbench, overriding {0}, which can be used alternatively for fine tuning.", '`#terminal.integrated.commandsToSkipShell#`'),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.tabs.defaultColor" /* TerminalSettingId.TabsDefaultColor */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.defaultColor', "A theme color ID to associate with terminal icons by default."),
                ...terminalPlatformConfiguration_1.terminalColorSchema,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            ["terminal.integrated.tabs.defaultIcon" /* TerminalSettingId.TabsDefaultIcon */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.defaultIcon', "A codicon ID to associate with terminal icons by default."),
                ...terminalPlatformConfiguration_1.terminalIconSchema,
                default: codicons_1.Codicon.terminal.id,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            ["terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.enabled', 'Controls whether terminal tabs display as a list to the side of the terminal. When this is disabled a dropdown will display instead.'),
                type: 'boolean',
                default: true,
            },
            ["terminal.integrated.tabs.enableAnimation" /* TerminalSettingId.TabsEnableAnimation */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.enableAnimation', 'Controls whether terminal tab statuses support animation (eg. in progress tasks).'),
                type: 'boolean',
                default: true,
            },
            ["terminal.integrated.tabs.hideCondition" /* TerminalSettingId.TabsHideCondition */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.hideCondition', 'Controls whether the terminal tabs view will hide under certain conditions.'),
                type: 'string',
                enum: ['never', 'singleTerminal', 'singleGroup'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.hideCondition.never', "Never hide the terminal tabs view"),
                    (0, nls_1.localize)('terminal.integrated.tabs.hideCondition.singleTerminal', "Hide the terminal tabs view when there is only a single terminal opened"),
                    (0, nls_1.localize)('terminal.integrated.tabs.hideCondition.singleGroup', "Hide the terminal tabs view when there is only a single terminal group opened"),
                ],
                default: 'singleTerminal',
            },
            ["terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal', 'Shows the active terminal information in the view. This is particularly useful when the title within the tabs aren\'t visible.'),
                type: 'string',
                enum: ['always', 'singleTerminal', 'singleTerminalOrNarrow', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.always', "Always show the active terminal"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.singleTerminal', "Show the active terminal when it is the only terminal opened"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.singleTerminalOrNarrow', "Show the active terminal when it is the only terminal opened or when the tabs view is in its narrow textless state"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActiveTerminal.never', "Never show the active terminal"),
                ],
                default: 'singleTerminalOrNarrow',
            },
            ["terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */]: {
                description: (0, nls_1.localize)('terminal.integrated.tabs.showActions', 'Controls whether terminal split and kill buttons are displays next to the new terminal button.'),
                type: 'string',
                enum: ['always', 'singleTerminal', 'singleTerminalOrNarrow', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.always', "Always show the actions"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.singleTerminal', "Show the actions when it is the only terminal opened"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.singleTerminalOrNarrow', "Show the actions when it is the only terminal opened or when the tabs view is in its narrow textless state"),
                    (0, nls_1.localize)('terminal.integrated.tabs.showActions.never', "Never show the actions"),
                ],
                default: 'singleTerminalOrNarrow',
            },
            ["terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */]: {
                type: 'string',
                enum: ['left', 'right'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.location.left', "Show the terminal tabs view to the left of the terminal"),
                    (0, nls_1.localize)('terminal.integrated.tabs.location.right', "Show the terminal tabs view to the right of the terminal")
                ],
                default: 'right',
                description: (0, nls_1.localize)('terminal.integrated.tabs.location', "Controls the location of the terminal tabs, either to the left or right of the actual terminal(s).")
            },
            ["terminal.integrated.defaultLocation" /* TerminalSettingId.DefaultLocation */]: {
                type: 'string',
                enum: ["editor" /* TerminalLocationString.Editor */, "view" /* TerminalLocationString.TerminalView */],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.defaultLocation.editor', "Create terminals in the editor"),
                    (0, nls_1.localize)('terminal.integrated.defaultLocation.view', "Create terminals in the terminal view")
                ],
                default: 'view',
                description: (0, nls_1.localize)('terminal.integrated.defaultLocation', "Controls where newly created terminals will appear.")
            },
            ["terminal.integrated.tabs.focusMode" /* TerminalSettingId.TabsFocusMode */]: {
                type: 'string',
                enum: ['singleClick', 'doubleClick'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.tabs.focusMode.singleClick', "Focus the terminal when clicking a terminal tab"),
                    (0, nls_1.localize)('terminal.integrated.tabs.focusMode.doubleClick', "Focus the terminal when double-clicking a terminal tab")
                ],
                default: 'doubleClick',
                description: (0, nls_1.localize)('terminal.integrated.tabs.focusMode', "Controls whether focusing the terminal of a tab happens on double or single click.")
            },
            ["terminal.integrated.macOptionIsMeta" /* TerminalSettingId.MacOptionIsMeta */]: {
                description: (0, nls_1.localize)('terminal.integrated.macOptionIsMeta', "Controls whether to treat the option key as the meta key in the terminal on macOS."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.macOptionClickForcesSelection" /* TerminalSettingId.MacOptionClickForcesSelection */]: {
                description: (0, nls_1.localize)('terminal.integrated.macOptionClickForcesSelection', "Controls whether to force selection when using Option+click on macOS. This will force a regular (line) selection and disallow the use of column selection mode. This enables copying and pasting using the regular terminal selection, for example, when mouse mode is enabled in tmux."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.altClickMovesCursor" /* TerminalSettingId.AltClickMovesCursor */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.altClickMovesCursor', "If enabled, alt/option + click will reposition the prompt cursor to underneath the mouse when {0} is set to {1} (the default value). This may not work reliably depending on your shell.", '`#editor.multiCursorModifier#`', '`\'alt\'`'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.copyOnSelection" /* TerminalSettingId.CopyOnSelection */]: {
                description: (0, nls_1.localize)('terminal.integrated.copyOnSelection', "Controls whether text selected in the terminal will be copied to the clipboard."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning', "Controls whether to show a warning dialog when pasting multiple lines into the terminal."),
                type: 'string',
                enum: ['auto', 'always', 'never'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning.auto', "Enable the warning but do not show it when:\n\n- Bracketed paste mode is enabled (the shell supports multi-line paste natively)\n- The paste is handled by the shell's readline (in the case of pwsh)"),
                    (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning.always', "Always show the warning if the text contains a new line."),
                    (0, nls_1.localize)('terminal.integrated.enableMultiLinePasteWarning.never', "Never show the warning.")
                ],
                default: 'auto'
            },
            ["terminal.integrated.drawBoldTextInBrightColors" /* TerminalSettingId.DrawBoldTextInBrightColors */]: {
                description: (0, nls_1.localize)('terminal.integrated.drawBoldTextInBrightColors', "Controls whether bold text in the terminal will always use the \"bright\" ANSI color variant."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.fontFamily', "Controls the font family of the terminal. Defaults to {0}'s value.", '`#editor.fontFamily#`'),
                type: 'string'
            },
            // TODO: Support font ligatures
            // 'terminal.integrated.fontLigatures': {
            // 	'description': localize('terminal.integrated.fontLigatures', "Controls whether font ligatures are enabled in the terminal."),
            // 	'type': 'boolean',
            // 	'default': false
            // },
            ["terminal.integrated.fontSize" /* TerminalSettingId.FontSize */]: {
                description: (0, nls_1.localize)('terminal.integrated.fontSize', "Controls the font size in pixels of the terminal."),
                type: 'number',
                default: exports.defaultTerminalFontSize,
                minimum: 6,
                maximum: 100
            },
            ["terminal.integrated.letterSpacing" /* TerminalSettingId.LetterSpacing */]: {
                description: (0, nls_1.localize)('terminal.integrated.letterSpacing', "Controls the letter spacing of the terminal. This is an integer value which represents the number of additional pixels to add between characters."),
                type: 'number',
                default: terminal_1.DEFAULT_LETTER_SPACING
            },
            ["terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */]: {
                description: (0, nls_1.localize)('terminal.integrated.lineHeight', "Controls the line height of the terminal. This number is multiplied by the terminal font size to get the actual line-height in pixels."),
                type: 'number',
                default: terminal_1.DEFAULT_LINE_HEIGHT
            },
            ["terminal.integrated.minimumContrastRatio" /* TerminalSettingId.MinimumContrastRatio */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.minimumContrastRatio', "When set, the foreground color of each cell will change to try meet the contrast ratio specified. Note that this will not apply to `powerline` characters per #146406. Example values:\n\n- 1: Do nothing and use the standard theme colors.\n- 4.5: [WCAG AA compliance (minimum)](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html) (default).\n- 7: [WCAG AAA compliance (enhanced)](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast7.html).\n- 21: White on black or black on white."),
                type: 'number',
                default: 4.5,
                tags: ['accessibility']
            },
            ["terminal.integrated.tabStopWidth" /* TerminalSettingId.TabStopWidth */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.tabStopWidth', "The number of cells in a tab stop."),
                type: 'number',
                minimum: 1,
                default: 8
            },
            ["terminal.integrated.fastScrollSensitivity" /* TerminalSettingId.FastScrollSensitivity */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.fastScrollSensitivity', "Scrolling speed multiplier when pressing `Alt`."),
                type: 'number',
                default: 5
            },
            ["terminal.integrated.mouseWheelScrollSensitivity" /* TerminalSettingId.MouseWheelScrollSensitivity */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.mouseWheelScrollSensitivity', "A multiplier to be used on the `deltaY` of mouse wheel scroll events."),
                type: 'number',
                default: 1
            },
            ["terminal.integrated.bellDuration" /* TerminalSettingId.BellDuration */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.bellDuration', "The number of milliseconds to show the bell within a terminal tab when triggered."),
                type: 'number',
                default: 1000
            },
            ["terminal.integrated.fontWeight" /* TerminalSettingId.FontWeight */]: {
                'anyOf': [
                    {
                        type: 'number',
                        minimum: terminal_1.MINIMUM_FONT_WEIGHT,
                        maximum: terminal_1.MAXIMUM_FONT_WEIGHT,
                        errorMessage: (0, nls_1.localize)('terminal.integrated.fontWeightError', "Only \"normal\" and \"bold\" keywords or numbers between 1 and 1000 are allowed.")
                    },
                    {
                        type: 'string',
                        pattern: '^(normal|bold|1000|[1-9][0-9]{0,2})$'
                    },
                    {
                        enum: terminal_1.SUGGESTIONS_FONT_WEIGHT,
                    }
                ],
                description: (0, nls_1.localize)('terminal.integrated.fontWeight', "The font weight to use within the terminal for non-bold text. Accepts \"normal\" and \"bold\" keywords or numbers between 1 and 1000."),
                default: 'normal'
            },
            ["terminal.integrated.fontWeightBold" /* TerminalSettingId.FontWeightBold */]: {
                'anyOf': [
                    {
                        type: 'number',
                        minimum: terminal_1.MINIMUM_FONT_WEIGHT,
                        maximum: terminal_1.MAXIMUM_FONT_WEIGHT,
                        errorMessage: (0, nls_1.localize)('terminal.integrated.fontWeightError', "Only \"normal\" and \"bold\" keywords or numbers between 1 and 1000 are allowed.")
                    },
                    {
                        type: 'string',
                        pattern: '^(normal|bold|1000|[1-9][0-9]{0,2})$'
                    },
                    {
                        enum: terminal_1.SUGGESTIONS_FONT_WEIGHT,
                    }
                ],
                description: (0, nls_1.localize)('terminal.integrated.fontWeightBold', "The font weight to use within the terminal for bold text. Accepts \"normal\" and \"bold\" keywords or numbers between 1 and 1000."),
                default: 'bold'
            },
            ["terminal.integrated.cursorBlinking" /* TerminalSettingId.CursorBlinking */]: {
                description: (0, nls_1.localize)('terminal.integrated.cursorBlinking', "Controls whether the terminal cursor blinks."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.cursorStyle" /* TerminalSettingId.CursorStyle */]: {
                description: (0, nls_1.localize)('terminal.integrated.cursorStyle', "Controls the style of terminal cursor when the terminal is focused."),
                enum: ['block', 'line', 'underline'],
                default: 'block'
            },
            ["terminal.integrated.cursorStyleInactive" /* TerminalSettingId.CursorStyleInactive */]: {
                description: (0, nls_1.localize)('terminal.integrated.cursorStyleInactive', "Controls the style of terminal cursor when the terminal is not focused."),
                enum: ['outline', 'block', 'line', 'underline', 'none'],
                default: 'outline'
            },
            ["terminal.integrated.cursorWidth" /* TerminalSettingId.CursorWidth */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.cursorWidth', "Controls the width of the cursor when {0} is set to {1}.", '`#terminal.integrated.cursorStyle#`', '`line`'),
                type: 'number',
                default: 1
            },
            ["terminal.integrated.scrollback" /* TerminalSettingId.Scrollback */]: {
                description: (0, nls_1.localize)('terminal.integrated.scrollback', "Controls the maximum number of lines the terminal keeps in its buffer. We pre-allocate memory based on this value in order to ensure a smooth experience. As such, as the value increases, so will the amount of memory."),
                type: 'number',
                default: 1000
            },
            ["terminal.integrated.detectLocale" /* TerminalSettingId.DetectLocale */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.detectLocale', "Controls whether to detect and set the `$LANG` environment variable to a UTF-8 compliant option since VS Code's terminal only supports UTF-8 encoded data coming from the shell."),
                type: 'string',
                enum: ['auto', 'off', 'on'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.detectLocale.auto', "Set the `$LANG` environment variable if the existing variable does not exist or it does not end in `'.UTF-8'`."),
                    (0, nls_1.localize)('terminal.integrated.detectLocale.off', "Do not set the `$LANG` environment variable."),
                    (0, nls_1.localize)('terminal.integrated.detectLocale.on', "Always set the `$LANG` environment variable.")
                ],
                default: 'auto'
            },
            ["terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */]: {
                type: 'string',
                enum: ['auto', 'on', 'off', 'canvas'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.auto', "Let VS Code detect which renderer will give the best experience."),
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.on', "Enable GPU acceleration within the terminal."),
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.off', "Disable GPU acceleration within the terminal. The terminal will render much slower when GPU acceleration is off but it should reliably work on all systems."),
                    (0, nls_1.localize)('terminal.integrated.gpuAcceleration.canvas', "Use the terminal's fallback canvas renderer which uses a 2d context instead of webgl which may perform better on some systems. Note that some features are limited in the canvas renderer like opaque selection.")
                ],
                default: 'auto',
                description: (0, nls_1.localize)('terminal.integrated.gpuAcceleration', "Controls whether the terminal will leverage the GPU to do its rendering.")
            },
            ["terminal.integrated.tabs.separator" /* TerminalSettingId.TerminalTitleSeparator */]: {
                'type': 'string',
                'default': ' - ',
                'markdownDescription': (0, nls_1.localize)("terminal.integrated.tabs.separator", "Separator used by {0} and {1}.", `\`#${"terminal.integrated.tabs.title" /* TerminalSettingId.TerminalTitle */}#\``, `\`#${"terminal.integrated.tabs.description" /* TerminalSettingId.TerminalDescription */}#\``)
            },
            ["terminal.integrated.tabs.title" /* TerminalSettingId.TerminalTitle */]: {
                'type': 'string',
                'default': '${process}',
                'markdownDescription': terminalTitle
            },
            ["terminal.integrated.tabs.description" /* TerminalSettingId.TerminalDescription */]: {
                'type': 'string',
                'default': '${task}${separator}${local}${separator}${cwdFolder}',
                'markdownDescription': terminalDescription
            },
            ["terminal.integrated.rightClickBehavior" /* TerminalSettingId.RightClickBehavior */]: {
                type: 'string',
                enum: ['default', 'copyPaste', 'paste', 'selectWord', 'nothing'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.default', "Show the context menu."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.copyPaste', "Copy when there is a selection, otherwise paste."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.paste', "Paste on right click."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.selectWord', "Select the word under the cursor and show the context menu."),
                    (0, nls_1.localize)('terminal.integrated.rightClickBehavior.nothing', "Do nothing and pass event to terminal.")
                ],
                default: platform_1.isMacintosh ? 'selectWord' : platform_1.isWindows ? 'copyPaste' : 'default',
                description: (0, nls_1.localize)('terminal.integrated.rightClickBehavior', "Controls how terminal reacts to right click.")
            },
            ["terminal.integrated.cwd" /* TerminalSettingId.Cwd */]: {
                restricted: true,
                description: (0, nls_1.localize)('terminal.integrated.cwd', "An explicit start path where the terminal will be launched, this is used as the current working directory (cwd) for the shell process. This may be particularly useful in workspace settings if the root directory is not a convenient cwd."),
                type: 'string',
                default: undefined,
                scope: 4 /* ConfigurationScope.RESOURCE */
            },
            ["terminal.integrated.confirmOnExit" /* TerminalSettingId.ConfirmOnExit */]: {
                description: (0, nls_1.localize)('terminal.integrated.confirmOnExit', "Controls whether to confirm when the window closes if there are active terminal sessions."),
                type: 'string',
                enum: ['never', 'always', 'hasChildProcesses'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.confirmOnExit.never', "Never confirm."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnExit.always', "Always confirm if there are terminals."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnExit.hasChildProcesses', "Confirm if there are any terminals that have child processes."),
                ],
                default: 'never'
            },
            ["terminal.integrated.confirmOnKill" /* TerminalSettingId.ConfirmOnKill */]: {
                description: (0, nls_1.localize)('terminal.integrated.confirmOnKill', "Controls whether to confirm killing terminals when they have child processes. When set to editor, terminals in the editor area will be marked as changed when they have child processes. Note that child process detection may not work well for shells like Git Bash which don't run their processes as child processes of the shell."),
                type: 'string',
                enum: ['never', 'editor', 'panel', 'always'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.never', "Never confirm."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.editor', "Confirm if the terminal is in the editor."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.panel', "Confirm if the terminal is in the panel."),
                    (0, nls_1.localize)('terminal.integrated.confirmOnKill.always', "Confirm if the terminal is either in the editor or panel."),
                ],
                default: 'editor'
            },
            ["terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */]: {
                markdownDeprecationMessage: (0, nls_1.localize)('terminal.integrated.enableBell', "This is now deprecated. Instead use the `terminal.integrated.enableVisualBell` and `accessibility.signals.terminalBell` settings."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.enableVisualBell" /* TerminalSettingId.EnableVisualBell */]: {
                description: (0, nls_1.localize)('terminal.integrated.enableVisualBell', "Controls whether the visual terminal bell is enabled. This shows up next to the terminal's name."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.commandsToSkipShell" /* TerminalSettingId.CommandsToSkipShell */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.commandsToSkipShell', "A set of command IDs whose keybindings will not be sent to the shell but instead always be handled by VS Code. This allows keybindings that would normally be consumed by the shell to act instead the same as when the terminal is not focused, for example `Ctrl+P` to launch Quick Open.\n\n&nbsp;\n\nMany commands are skipped by default. To override a default and pass that command's keybinding to the shell instead, add the command prefixed with the `-` character. For example add `-workbench.action.quickOpen` to allow `Ctrl+P` to reach the shell.\n\n&nbsp;\n\nThe following list of default skipped commands is truncated when viewed in Settings Editor. To see the full list, {1} and search for the first command from the list below.\n\n&nbsp;\n\nDefault Skipped Commands:\n\n{0}", terminal_1.DEFAULT_COMMANDS_TO_SKIP_SHELL.sort().map(command => `- ${command}`).join('\n'), `[${(0, nls_1.localize)('openDefaultSettingsJson', "open the default settings JSON")}](command:workbench.action.openRawDefaultSettings '${(0, nls_1.localize)('openDefaultSettingsJson.capitalized', "Open Default Settings (JSON)")}')`),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            ["terminal.integrated.allowChords" /* TerminalSettingId.AllowChords */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.allowChords', "Whether or not to allow chord keybindings in the terminal. Note that when this is true and the keystroke results in a chord it will bypass {0}, setting this to false is particularly useful when you want ctrl+k to go to your shell (not VS Code).", '`#terminal.integrated.commandsToSkipShell#`'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.allowMnemonics" /* TerminalSettingId.AllowMnemonics */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.allowMnemonics', "Whether to allow menubar mnemonics (for example Alt+F) to trigger the open of the menubar. Note that this will cause all alt keystrokes to skip the shell when true. This does nothing on macOS."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.env.osx" /* TerminalSettingId.EnvMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.env.osx', "Object with environment variables that will be added to the VS Code process to be used by the terminal on macOS. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            ["terminal.integrated.env.linux" /* TerminalSettingId.EnvLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.env.linux', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Linux. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            ["terminal.integrated.env.windows" /* TerminalSettingId.EnvWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.env.windows', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Windows. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            ["terminal.integrated.environmentChangesIndicator" /* TerminalSettingId.EnvironmentChangesIndicator */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator', "Whether to display the environment changes indicator on each terminal which explains whether extensions have made, or want to make changes to the terminal's environment."),
                type: 'string',
                enum: ['off', 'on', 'warnonly'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator.off', "Disable the indicator."),
                    (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator.on', "Enable the indicator."),
                    (0, nls_1.localize)('terminal.integrated.environmentChangesIndicator.warnonly', "Only show the warning indicator when a terminal's environment is 'stale', not the information indicator that shows a terminal has had its environment modified by an extension."),
                ],
                default: 'warnonly'
            },
            ["terminal.integrated.environmentChangesRelaunch" /* TerminalSettingId.EnvironmentChangesRelaunch */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.environmentChangesRelaunch', "Whether to relaunch terminals automatically if extensions want to contribute to their environment and have not been interacted with yet."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.showExitAlert" /* TerminalSettingId.ShowExitAlert */]: {
                description: (0, nls_1.localize)('terminal.integrated.showExitAlert', "Controls whether to show the alert \"The terminal process terminated with exit code\" when exit code is non-zero."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.splitCwd" /* TerminalSettingId.SplitCwd */]: {
                description: (0, nls_1.localize)('terminal.integrated.splitCwd', "Controls the working directory a split terminal starts with."),
                type: 'string',
                enum: ['workspaceRoot', 'initial', 'inherited'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.splitCwd.workspaceRoot', "A new split terminal will use the workspace root as the working directory. In a multi-root workspace a choice for which root folder to use is offered."),
                    (0, nls_1.localize)('terminal.integrated.splitCwd.initial', "A new split terminal will use the working directory that the parent terminal started with."),
                    (0, nls_1.localize)('terminal.integrated.splitCwd.inherited', "On macOS and Linux, a new split terminal will use the working directory of the parent terminal. On Windows, this behaves the same as initial."),
                ],
                default: 'inherited'
            },
            ["terminal.integrated.windowsEnableConpty" /* TerminalSettingId.WindowsEnableConpty */]: {
                description: (0, nls_1.localize)('terminal.integrated.windowsEnableConpty', "Whether to use ConPTY for Windows terminal process communication (requires Windows 10 build number 18309+). Winpty will be used if this is false."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.wordSeparators" /* TerminalSettingId.WordSeparators */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.wordSeparators', "A string containing all characters to be considered word separators when double-clicking to select word and in the fallback 'word' link detection. Since this is used for link detection, including characters such as `:` that are used when detecting links will cause the line and column part of links like `file:10:5` to be ignored."),
                type: 'string',
                // allow-any-unicode-next-line
                default: ' ()[]{}\',"`─‘’|'
            },
            ["terminal.integrated.enableFileLinks" /* TerminalSettingId.EnableFileLinks */]: {
                description: (0, nls_1.localize)('terminal.integrated.enableFileLinks', "Whether to enable file links in terminals. Links can be slow when working on a network drive in particular because each file link is verified against the file system. Changing this will take effect only in new terminals."),
                type: 'string',
                enum: ['off', 'on', 'notRemote'],
                enumDescriptions: [
                    (0, nls_1.localize)('enableFileLinks.off', "Always off."),
                    (0, nls_1.localize)('enableFileLinks.on', "Always on."),
                    (0, nls_1.localize)('enableFileLinks.notRemote', "Enable only when not in a remote workspace.")
                ],
                default: 'on'
            },
            ["terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */]: {
                type: 'string',
                enum: ['6', '11'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.unicodeVersion.six', "Version 6 of Unicode. This is an older version which should work better on older systems."),
                    (0, nls_1.localize)('terminal.integrated.unicodeVersion.eleven', "Version 11 of Unicode. This version provides better support on modern systems that use modern versions of Unicode.")
                ],
                default: '11',
                description: (0, nls_1.localize)('terminal.integrated.unicodeVersion', "Controls what version of Unicode to use when evaluating the width of characters in the terminal. If you experience emoji or other wide characters not taking up the right amount of space or backspace either deleting too much or too little then you may want to try tweaking this setting.")
            },
            ["terminal.integrated.localEchoLatencyThreshold" /* TerminalSettingId.LocalEchoLatencyThreshold */]: {
                description: (0, nls_1.localize)('terminal.integrated.localEchoLatencyThreshold', "Length of network delay, in milliseconds, where local edits will be echoed on the terminal without waiting for server acknowledgement. If '0', local echo will always be on, and if '-1' it will be disabled."),
                type: 'integer',
                minimum: -1,
                default: 30,
            },
            ["terminal.integrated.localEchoEnabled" /* TerminalSettingId.LocalEchoEnabled */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.localEchoEnabled', "When local echo should be enabled. This will override {0}", '`#terminal.integrated.localEchoLatencyThreshold#`'),
                type: 'string',
                enum: ['on', 'off', 'auto'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.localEchoEnabled.on', "Always enabled"),
                    (0, nls_1.localize)('terminal.integrated.localEchoEnabled.off', "Always disabled"),
                    (0, nls_1.localize)('terminal.integrated.localEchoEnabled.auto', "Enabled only for remote workspaces")
                ],
                default: 'auto'
            },
            ["terminal.integrated.localEchoExcludePrograms" /* TerminalSettingId.LocalEchoExcludePrograms */]: {
                description: (0, nls_1.localize)('terminal.integrated.localEchoExcludePrograms', "Local echo will be disabled when any of these program names are found in the terminal title."),
                type: 'array',
                items: {
                    type: 'string',
                    uniqueItems: true
                },
                default: terminal_1.DEFAULT_LOCAL_ECHO_EXCLUDE,
            },
            ["terminal.integrated.localEchoStyle" /* TerminalSettingId.LocalEchoStyle */]: {
                description: (0, nls_1.localize)('terminal.integrated.localEchoStyle', "Terminal style of locally echoed text; either a font style or an RGB color."),
                default: 'dim',
                anyOf: [
                    {
                        enum: ['bold', 'dim', 'italic', 'underlined', 'inverted', '#ff0000'],
                    },
                    {
                        type: 'string',
                        format: 'color-hex',
                    }
                ]
            },
            ["terminal.integrated.enablePersistentSessions" /* TerminalSettingId.EnablePersistentSessions */]: {
                description: (0, nls_1.localize)('terminal.integrated.enablePersistentSessions', "Persist terminal sessions/history for the workspace across window reloads."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.persistentSessionReviveProcess" /* TerminalSettingId.PersistentSessionReviveProcess */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess', "When the terminal process must be shut down (for example on window or application close), this determines when the previous terminal session contents/history should be restored and processes be recreated when the workspace is next opened.\n\nCaveats:\n\n- Restoring of the process current working directory depends on whether it is supported by the shell.\n- Time to persist the session during shutdown is limited, so it may be aborted when using high-latency remote connections."),
                type: 'string',
                enum: ['onExit', 'onExitAndWindowClose', 'never'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess.onExit', "Revive the processes after the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu)."),
                    (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess.onExitAndWindowClose', "Revive the processes after the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu), or when the window is closed."),
                    (0, nls_1.localize)('terminal.integrated.persistentSessionReviveProcess.never', "Never restore the terminal buffers or recreate the process.")
                ],
                default: 'onExit'
            },
            ["terminal.integrated.hideOnStartup" /* TerminalSettingId.HideOnStartup */]: {
                description: (0, nls_1.localize)('terminal.integrated.hideOnStartup', "Whether to hide the terminal view on startup, avoiding creating a terminal when there are no persistent sessions."),
                type: 'string',
                enum: ['never', 'whenEmpty', 'always'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('hideOnStartup.never', "Never hide the terminal view on startup."),
                    (0, nls_1.localize)('hideOnStartup.whenEmpty', "Only hide the terminal when there are no persistent sessions restored."),
                    (0, nls_1.localize)('hideOnStartup.always', "Always hide the terminal, even when there are persistent sessions restored.")
                ],
                default: 'never'
            },
            ["terminal.integrated.customGlyphs" /* TerminalSettingId.CustomGlyphs */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.customGlyphs', "Whether to draw custom glyphs for block element and box drawing characters instead of using the font, which typically yields better rendering with continuous lines. Note that this doesn't work when {0} is disabled.", `\`#${"terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */}#\``),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.rescaleOverlappingGlyphs" /* TerminalSettingId.RescaleOverlappingGlyphs */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.rescaleOverlappingGlyphs', "Whether to rescale glyphs horizontally that are a single cell wide but have glyphs that would overlap following cell(s). This typically happens for ambiguous width characters (eg. the roman numeral characters U+2160+) which aren't featured in monospace fonts. Emoji glyphs are never rescaled."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.autoReplies" /* TerminalSettingId.AutoReplies */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.autoReplies', "A set of messages that, when encountered in the terminal, will be automatically responded to. Provided the message is specific enough, this can help automate away common responses.\n\nRemarks:\n\n- Use {0} to automatically respond to the terminate batch job prompt on Windows.\n- The message includes escape sequences so the reply might not happen with styled text.\n- Each reply can only happen once every second.\n- Use {1} in the reply to mean the enter key.\n- To unset a default key, set the value to null.\n- Restart VS Code if new don't apply.", '`"Terminate batch job (Y/N)": "Y\\r"`', '`"\\r"`'),
                type: 'object',
                additionalProperties: {
                    oneOf: [{
                            type: 'string',
                            description: (0, nls_1.localize)('terminal.integrated.autoReplies.reply', "The reply to send to the process.")
                        },
                        { type: 'null' }]
                },
                default: {}
            },
            ["terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.enabled', "Determines whether or not shell integration is auto-injected to support features like enhanced command tracking and current working directory detection. \n\nShell integration works by injecting the shell with a startup script. The script gives VS Code insight into what is happening within the terminal.\n\nSupported shells:\n\n- Linux/macOS: bash, fish, pwsh, zsh\n - Windows: pwsh\n\nThis setting applies only when terminals are created, so you will need to restart your terminals for it to take effect.\n\n Note that the script injection may not work if you have custom arguments defined in the terminal profile, have enabled {1}, have a [complex bash `PROMPT_COMMAND`](https://code.visualstudio.com/docs/editor/integrated-terminal#_complex-bash-promptcommand), or other unsupported setup. To disable decorations, see {0}", '`#terminal.integrated.shellIntegrations.decorationsEnabled#`', '`#editor.accessibilitySupport#`'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled', "When shell integration is enabled, adds a decoration for each command."),
                type: 'string',
                enum: ['both', 'gutter', 'overviewRuler', 'never'],
                enumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.both', "Show decorations in the gutter (left) and overview ruler (right)"),
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.gutter', "Show gutter decorations to the left of the terminal"),
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.overviewRuler', "Show overview ruler decorations to the right of the terminal"),
                    (0, nls_1.localize)('terminal.integrated.shellIntegration.decorationsEnabled.never', "Do not show decorations"),
                ],
                default: 'both'
            },
            ["terminal.integrated.shellIntegration.history" /* TerminalSettingId.ShellIntegrationCommandHistory */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.history', "Controls the number of recently used commands to keep in the terminal command history. Set to 0 to disable terminal command history."),
                type: 'number',
                default: 100
            },
            ["terminal.integrated.shellIntegration.suggestEnabled" /* TerminalSettingId.ShellIntegrationSuggestEnabled */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellIntegration.suggestEnabled', "Enables experimental terminal Intellisense suggestions for supported shells when {0} is set to {1}. If shell integration is installed manually, {2} needs to be set to {3} before calling the script.", '`#terminal.integrated.shellIntegration.enabled#`', '`true`', '`VSCODE_SUGGEST`', '`1`'),
                type: 'boolean',
                default: false,
                markdownDeprecationMessage: (0, nls_1.localize)('suggestEnabled.deprecated', 'This is an experimental setting and may break the terminal! Use at your own risk.')
            },
            ["terminal.integrated.smoothScrolling" /* TerminalSettingId.SmoothScrolling */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.smoothScrolling', "Controls whether the terminal will scroll using an animation."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.ignoreBracketedPasteMode" /* TerminalSettingId.IgnoreBracketedPasteMode */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.ignoreBracketedPasteMode', "Controls whether the terminal will ignore bracketed paste mode even if the terminal was put into the mode, omitting the {0} and {1} sequences when pasting. This is useful when the shell is not respecting the mode which can happen in sub-shells for example.", '`\\x1b[200~`', '`\\x1b[201~`'),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.enableImages" /* TerminalSettingId.EnableImages */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.enableImages', "Enables image support in the terminal, this will only work when {0} is enabled. Both sixel and iTerm's inline image protocol are supported on Linux and macOS, Windows support will light up automatically when ConPTY passes through the sequences. Images will currently not be restored between window reloads/reconnects.", `\`#${"terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */}#\``),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.focusAfterRun" /* TerminalSettingId.FocusAfterRun */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.focusAfterRun', "Controls whether the terminal, accessible buffer, or neither will be focused after `Terminal: Run Selected Text In Active Terminal` has been run."),
                enum: ['terminal', 'accessible-buffer', 'none'],
                default: 'none',
                tags: ['accessibility'],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('terminal.integrated.focusAfterRun.terminal', "Always focus the terminal."),
                    (0, nls_1.localize)('terminal.integrated.focusAfterRun.accessible-buffer', "Always focus the accessible buffer."),
                    (0, nls_1.localize)('terminal.integrated.focusAfterRun.none', "Do nothing."),
                ]
            },
            ["terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.accessibleViewPreserveCursorPosition', "Preserve the cursor position on reopen of the terminal's accessible view rather than setting it to the bottom of the buffer."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.accessibleViewFocusOnCommandExecution', "Focus the terminal accessible view when a command is executed."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.stickyScroll.enabled" /* TerminalSettingId.StickyScrollEnabled */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.stickyScroll.enabled', "Shows the current command at the top of the terminal."),
                type: 'boolean',
                default: product_1.default.quality !== 'stable'
            },
            ["terminal.integrated.stickyScroll.maxLineCount" /* TerminalSettingId.StickyScrollMaxLineCount */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.stickyScroll.maxLineCount', "Defines the maximum number of sticky lines to show. Sticky scroll lines will never exceed 40% of the viewport regardless of this setting."),
                type: 'number',
                default: 5,
                minimum: 1,
                maximum: 10
            },
            ["terminal.integrated.mouseWheelZoom" /* TerminalSettingId.MouseWheelZoom */]: {
                markdownDescription: platform_1.isMacintosh
                    ? (0, nls_1.localize)('terminal.integrated.mouseWheelZoom.mac', "Zoom the font of the terminal when using mouse wheel and holding `Cmd`.")
                    : (0, nls_1.localize)('terminal.integrated.mouseWheelZoom', "Zoom the font of the terminal when using mouse wheel and holding `Ctrl`."),
                type: 'boolean',
                default: false
            },
            ["terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */]: {
                markdownDescription: (0, nls_1.localize)('terminal.integrated.experimentalInlineChat', "Whether to enable the upcoming experimental inline terminal chat UI."),
                type: 'boolean',
                default: false
            }
        }
    };
    function registerTerminalConfiguration() {
        const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration(terminalConfiguration);
    }
    platform_2.Registry.as(configuration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations([{
            key: "terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */,
            migrateFn: (enableBell, accessor) => {
                const configurationKeyValuePairs = [];
                let announcement = accessor('accessibility.signals.terminalBell')?.announcement ?? accessor('accessibility.alert.terminalBell');
                if (announcement !== undefined && typeof announcement !== 'string') {
                    announcement = announcement ? 'auto' : 'off';
                }
                configurationKeyValuePairs.push(['accessibility.signals.terminalBell', { value: { sound: enableBell ? 'on' : 'off', announcement } }]);
                configurationKeyValuePairs.push(["terminal.integrated.enableBell" /* TerminalSettingId.EnableBell */, { value: undefined }]);
                configurationKeyValuePairs.push(["terminal.integrated.enableVisualBell" /* TerminalSettingId.EnableVisualBell */, { value: enableBell }]);
                return configurationKeyValuePairs;
            }
        }]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9jb21tb24vdGVybWluYWxDb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdxQmhHLHNFQUdDO0lBdHBCRCxNQUFNLG1CQUFtQixHQUFHLE1BQU0sR0FBRztRQUNwQyxhQUFhLEdBQUcsSUFBQSxjQUFRLEVBQUMsS0FBSyxFQUFFLDBDQUEwQyxDQUFDO1FBQzNFLG1CQUFtQixHQUFHLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxtUEFBbVAsQ0FBQztRQUNoUyx5QkFBeUIsR0FBRyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxrREFBa0QsQ0FBQztRQUMzRyxlQUFlLEdBQUcsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLGtEQUFrRCxDQUFDO1FBQ3ZGLGlCQUFpQixHQUFHLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxrQ0FBa0MsQ0FBQztRQUMzRSxtQkFBbUIsR0FBRyxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsc0dBQXNHLEVBQUUsU0FBUyxDQUFDO1FBQzlKLGtCQUFrQixHQUFHLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxrREFBa0QsQ0FBQztRQUM3RixjQUFjLEdBQUcsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLG1EQUFtRCxDQUFDO0tBQ3RGLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsdUZBQXVGO0lBRXZHLElBQUksYUFBYSxHQUFHLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSw4RUFBOEUsQ0FBQyxDQUFDO0lBQzlILGFBQWEsSUFBSSxtQkFBbUIsQ0FBQztJQUVyQyxJQUFJLG1CQUFtQixHQUFHLElBQUEsY0FB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