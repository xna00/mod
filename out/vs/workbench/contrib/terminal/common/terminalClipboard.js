/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs"], function (require, exports, nls_1, configuration_1, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldPasteTerminalText = shouldPasteTerminalText;
    async function shouldPasteTerminalText(accessor, text, bracketedPasteMode) {
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const dialogService = accessor.get(dialogs_1.IDialogService);
        // If the clipboard has only one line, a warning should never show
        const textForLines = text.split(/\r?\n/);
        if (textForLines.length === 1) {
            return true;
        }
        // Get config value
        function parseConfigValue(value) {
            // Valid value
            if (typeof value === 'string') {
                if (value === 'auto' || value === 'always' || value === 'never') {
                    return value;
                }
            }
            // Legacy backwards compatibility
            if (typeof value === 'boolean') {
                return value ? 'auto' : 'never';
            }
            // Invalid value fallback
            return 'auto';
        }
        const configValue = parseConfigValue(configurationService.getValue("terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */));
        // Never show it
        if (configValue === 'never') {
            return true;
        }
        // Special edge cases to not show for auto
        if (configValue === 'auto') {
            // Ignore check if the shell is in bracketed paste mode (ie. the shell can handle multi-line
            // text).
            if (bracketedPasteMode) {
                return true;
            }
            const textForLines = text.split(/\r?\n/);
            // Ignore check when a command is copied with a trailing new line
            if (textForLines.length === 2 && textForLines[1].trim().length === 0) {
                return true;
            }
        }
        const displayItemsCount = 3;
        const maxPreviewLineLength = 30;
        let detail = (0, nls_1.localize)('preview', "Preview:");
        for (let i = 0; i < Math.min(textForLines.length, displayItemsCount); i++) {
            const line = textForLines[i];
            const cleanedLine = line.length > maxPreviewLineLength ? `${line.slice(0, maxPreviewLineLength)}…` : line;
            detail += `\n${cleanedLine}`;
        }
        if (textForLines.length > displayItemsCount) {
            detail += `\n…`;
        }
        const { result, checkboxChecked } = await dialogService.prompt({
            message: (0, nls_1.localize)('confirmMoveTrashMessageFilesAndDirectories', "Are you sure you want to paste {0} lines of text into the terminal?", textForLines.length),
            detail,
            type: 'warning',
            buttons: [
                {
                    label: (0, nls_1.localize)({ key: 'multiLinePasteButton', comment: ['&& denotes a mnemonic'] }, "&&Paste"),
                    run: () => ({ confirmed: true, singleLine: false })
                },
                {
                    label: (0, nls_1.localize)({ key: 'multiLinePasteButton.oneLine', comment: ['&& denotes a mnemonic'] }, "Paste as &&one line"),
                    run: () => ({ confirmed: true, singleLine: true })
                }
            ],
            cancelButton: true,
            checkbox: {
                label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
            }
        });
        if (!result) {
            return false;
        }
        if (result.confirmed && checkboxChecked) {
            await configurationService.updateValue("terminal.integrated.enableMultiLinePasteWarning" /* TerminalSettingId.EnableMultiLinePasteWarning */, false);
        }
        if (result.singleLine) {
            return { modifiedText: text.replace(/\r?\n/g, '') };
        }
        return result.confirmed;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2NvbW1vbi90ZXJtaW5hbENsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRywwREE4RkM7SUE5Rk0sS0FBSyxVQUFVLHVCQUF1QixDQUFDLFFBQTBCLEVBQUUsSUFBWSxFQUFFLGtCQUF1QztRQUM5SCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztRQUNqRSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFjLENBQUMsQ0FBQztRQUVuRCxrRUFBa0U7UUFDbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QyxJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDL0IsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLFNBQVMsZ0JBQWdCLENBQUMsS0FBYztZQUN2QyxjQUFjO1lBQ2QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxLQUFLLEtBQUssTUFBTSxJQUFJLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLE9BQU8sRUFBRSxDQUFDO29CQUNqRSxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztZQUNELGlDQUFpQztZQUNqQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDakMsQ0FBQztZQUNE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