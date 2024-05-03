/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/severity", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels", "vs/base/common/platform", "vs/base/common/objects"], function (require, exports, resources_1, severity_1, nls_1, instantiation_1, labels_1, platform_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfirmResult = exports.IFileDialogService = exports.AbstractDialogHandler = exports.IDialogService = void 0;
    exports.getFileNamesMessage = getFileNamesMessage;
    exports.massageMessageBoxOptions = massageMessageBoxOptions;
    exports.IDialogService = (0, instantiation_1.createDecorator)('dialogService');
    var DialogKind;
    (function (DialogKind) {
        DialogKind[DialogKind["Confirmation"] = 1] = "Confirmation";
        DialogKind[DialogKind["Prompt"] = 2] = "Prompt";
        DialogKind[DialogKind["Input"] = 3] = "Input";
    })(DialogKind || (DialogKind = {}));
    class AbstractDialogHandler {
        getConfirmationButtons(dialog) {
            return this.getButtons(dialog, DialogKind.Confirmation);
        }
        getPromptButtons(dialog) {
            return this.getButtons(dialog, DialogKind.Prompt);
        }
        getInputButtons(dialog) {
            return this.getButtons(dialog, DialogKind.Input);
        }
        getButtons(dialog, kind) {
            // We put buttons in the order of "default" button first and "cancel"
            // button last. There maybe later processing when presenting the buttons
            // based on OS standards.
            const buttons = [];
            switch (kind) {
                case DialogKind.Confirmation: {
                    const confirmationDialog = dialog;
                    if (confirmationDialog.primaryButton) {
                        buttons.push(confirmationDialog.primaryButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)({ key: 'yesButton', comment: ['&& denotes a mnemonic'] }, "&&Yes"));
                    }
                    if (confirmationDialog.cancelButton) {
                        buttons.push(confirmationDialog.cancelButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                    }
                    break;
                }
                case DialogKind.Prompt: {
                    const promptDialog = dialog;
                    if (Array.isArray(promptDialog.buttons) && promptDialog.buttons.length > 0) {
                        buttons.push(...promptDialog.buttons.map(button => button.label));
                    }
                    if (promptDialog.cancelButton) {
                        if (promptDialog.cancelButton === true) {
                            buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                        }
                        else if (typeof promptDialog.cancelButton === 'string') {
                            buttons.push(promptDialog.cancelButton);
                        }
                        else {
                            if (promptDialog.cancelButton.label) {
                                buttons.push(promptDialog.cancelButton.label);
                            }
                            else {
                                buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                            }
                        }
                    }
                    if (buttons.length === 0) {
                        buttons.push((0, nls_1.localize)({ key: 'okButton', comment: ['&& denotes a mnemonic'] }, "&&OK"));
                    }
                    break;
                }
                case DialogKind.Input: {
                    const inputDialog = dialog;
                    if (inputDialog.primaryButton) {
                        buttons.push(inputDialog.primaryButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)({ key: 'okButton', comment: ['&& denotes a mnemonic'] }, "&&OK"));
                    }
                    if (inputDialog.cancelButton) {
                        buttons.push(inputDialog.cancelButton);
                    }
                    else {
                        buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
                    }
                    break;
                }
            }
            return buttons;
        }
        getDialogType(type) {
            if (typeof type === 'string') {
                return type;
            }
            if (typeof type === 'number') {
                return (type === severity_1.default.Info) ? 'info' : (type === severity_1.default.Error) ? 'error' : (type === severity_1.default.Warning) ? 'warning' : 'none';
            }
            return undefined;
        }
        getPromptResult(prompt, buttonIndex, checkboxChecked) {
            const promptButtons = [...(prompt.buttons ?? [])];
            if (prompt.cancelButton && typeof prompt.cancelButton !== 'string' && typeof prompt.cancelButton !== 'boolean') {
                promptButtons.push(prompt.cancelButton);
            }
            let result = promptButtons[buttonIndex]?.run({ checkboxChecked });
            if (!(result instanceof Promise)) {
                result = Promise.resolve(result);
            }
            return { result, checkboxChecked };
        }
    }
    exports.AbstractDialogHandler = AbstractDialogHandler;
    exports.IFileDialogService = (0, instantiation_1.createDecorator)('fileDialogService');
    var ConfirmResult;
    (function (ConfirmResult) {
        ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
        ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
        ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
    })(ConfirmResult || (exports.ConfirmResult = ConfirmResult = {}));
    const MAX_CONFIRM_FILES = 10;
    function getFileNamesMessage(fileNamesOrResources) {
        const message = [];
        message.push(...fileNamesOrResources.slice(0, MAX_CONFIRM_FILES).map(fileNameOrResource => typeof fileNameOrResource === 'string' ? fileNameOrResource : (0, resources_1.basename)(fileNameOrResource)));
        if (fileNamesOrResources.length > MAX_CONFIRM_FILES) {
            if (fileNamesOrResources.length - MAX_CONFIRM_FILES === 1) {
                message.push((0, nls_1.localize)('moreFile', "...1 additional file not shown"));
            }
            else {
                message.push((0, nls_1.localize)('moreFiles', "...{0} additional files not shown", fileNamesOrResources.length - MAX_CONFIRM_FILES));
            }
        }
        message.push('');
        return message.join('\n');
    }
    /**
     * A utility method to ensure the options for the message box dialog
     * are using properties that are consistent across all platforms and
     * specific to the platform where necessary.
     */
    function massageMessageBoxOptions(options, productService) {
        const massagedOptions = (0, objects_1.deepClone)(options);
        let buttons = (massagedOptions.buttons ?? []).map(button => (0, labels_1.mnemonicButtonLabel)(button));
        let buttonIndeces = (options.buttons || []).map((button, index) => index);
        let defaultId = 0; // by default the first button is default button
        let cancelId = massagedOptions.cancelId ?? buttons.length - 1; // by default the last button is cancel button
        // Apply HIG per OS when more than one button is used
        if (buttons.length > 1) {
            const cancelButton = typeof cancelId === 'number' ? buttons[cancelId] : undefined;
            if (platform_1.isLinux || platform_1.isMacintosh) {
                // Linux: the GNOME HIG (https://developer.gnome.org/hig/patterns/feedback/dialogs.html?highlight=dialog)
                // recommend the following:
                // "Always ensure that the cancel button appears first, before the affirmative button. In left-to-right
                //  locales, this is on the left. This button order ensures that users become aware of, and are reminded
                //  of, the ability to cancel prior to encountering the affirmative button."
                //
                // Electron APIs do not reorder buttons for us, so we ensure a reverse order of buttons and a position
                // of the cancel button (if provided) that matches the HIG
                // macOS: the HIG (https://developer.apple.com/design/human-interface-guidelines/components/presentation/alerts)
                // recommend the following:
                // "Place buttons where people expect. In general, place the button people are most likely to choose on the trailing side in a
                //  row of buttons or at the top in a stack of buttons. Always place the default button on the trailing side of a row or at the
                //  top of a stack. Cancel buttons are typically on the leading side of a row or at the bottom of a stack."
                //
                // However: it seems that older macOS versions where 3 buttons were presented in a row differ from this
                // recommendation. In fact, cancel buttons were placed to the left of the default button and secondary
                // buttons on the far left. To support these older macOS versions we have to manually shuffle the cancel
                // button in the same way as we do on Linux. This will not have any impact on newer macOS versions where
                // shuffling is done for us.
                if (typeof cancelButton === 'string' && buttons.length > 1 && cancelId !== 1) {
                    buttons.splice(cancelId, 1);
                    buttons.splice(1, 0, cancelButton);
                    const cancelButtonIndex = buttonIndeces[cancelId];
                    buttonIndeces.splice(cancelId, 1);
                    buttonIndeces.splice(1, 0, cancelButtonIndex);
                    cancelId = 1;
                }
                if (platform_1.isLinux && buttons.length > 1) {
                    buttons = buttons.reverse();
                    buttonIndeces = buttonIndeces.reverse();
                    defaultId = buttons.length - 1;
                    if (typeof cancelButton === 'string') {
                        cancelId = defaultId - 1;
                    }
                }
            }
            else if (platform_1.isWindows) {
                // Windows: the HIG (https://learn.microsoft.com/en-us/windows/win32/uxguide/win-dialog-box)
                // recommend the following:
                // "One of the following sets of concise commands: Yes/No, Yes/No/Cancel, [Do it]/Cancel,
                //  [Do it]/[Don't do it], [Do it]/[Don't do it]/Cancel."
                //
                // Electron APIs do not reorder buttons for us, so we ensure the position of the cancel button
                // (if provided) that matches the HIG
                if (typeof cancelButton === 'string' && buttons.length > 1 && cancelId !== buttons.length - 1 /* last action */) {
                    buttons.splice(cancelId, 1);
                    buttons.push(cancelButton);
                    const buttonIndex = buttonIndeces[cancelId];
                    buttonIndeces.splice(cancelId, 1);
                    buttonIndeces.push(buttonIndex);
                    cancelId = buttons.length - 1;
                }
            }
        }
        massagedOptions.buttons = buttons;
        massagedOptions.defaultId = defaultId;
        massagedOptions.cancelId = cancelId;
        massagedOptions.noLink = true;
        massagedOptions.title = massagedOptions.title || productService.nameLong;
        return {
            options: massagedOptions,
            buttonIndeces
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9ncy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZGlhbG9ncy9jb21tb24vZGlhbG9ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4a0JoRyxrREFjQztJQStCRCw0REF5RkM7SUF2Y1ksUUFBQSxjQUFjLEdBQUcsSUFBQSwrQkFBZSxFQUFpQixlQUFlLENBQUMsQ0FBQztJQXlDL0UsSUFBSyxVQUlKO0lBSkQsV0FBSyxVQUFVO1FBQ2QsMkRBQWdCLENBQUE7UUFDaEIsK0NBQU0sQ0FBQTtRQUNOLDZDQUFLLENBQUE7SUFDTixDQUFDLEVBSkksVUFBVSxLQUFWLFVBQVUsUUFJZDtJQUVELE1BQXNCLHFCQUFxQjtRQUVoQyxzQkFBc0IsQ0FBQyxNQUFxQjtZQUNyRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRVMsZ0JBQWdCLENBQUMsTUFBd0I7WUFDbEQsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVTLGVBQWUsQ0FBQyxNQUFjO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFLTyxVQUFVLENBQUMsTUFBaUQsRUFBRSxJQUFnQjtZQUVyRixxRUFBcUU7WUFDckUsd0VBQXdFO1lBQ3hFLHlCQUF5QjtZQUV6QixNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7WUFFN0IsUUFBUSxJQUFJLEVBQUUsQ0FBQztnQkFDZCxLQUFLLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLGtCQUFrQixH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