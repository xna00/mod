/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ENABLE_EXTENSION_TOGGLE_SETTINGS = exports.ENABLE_LANGUAGE_FILTER = exports.KEYBOARD_LAYOUT_OPEN_PICKER = exports.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG = exports.WORKSPACE_TRUST_SETTING_TAG = exports.POLICY_SETTING_TAG = exports.GENERAL_TAG_SETTING_TAG = exports.LANGUAGE_SETTING_TAG = exports.ID_SETTING_TAG = exports.FEATURE_SETTING_TAG = exports.EXTENSION_SETTING_TAG = exports.MODIFIED_SETTING_TAG = exports.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE = exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = exports.KEYBINDINGS_EDITOR_COMMAND_COPY = exports.KEYBINDINGS_EDITOR_COMMAND_RESET = exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = exports.KEYBINDINGS_EDITOR_COMMAND_REJECT_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_ACCEPT_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_ADD = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_HISTORY = exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = exports.CONTEXT_WHEN_FOCUS = exports.CONTEXT_KEYBINDING_FOCUS = exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = exports.CONTEXT_KEYBINDINGS_EDITOR = exports.CONTEXT_SETTINGS_ROW_FOCUS = exports.CONTEXT_TOC_ROW_FOCUS = exports.CONTEXT_SETTINGS_SEARCH_FOCUS = exports.CONTEXT_SETTINGS_JSON_EDITOR = exports.CONTEXT_SETTINGS_EDITOR = exports.SETTINGS_EDITOR_COMMAND_SUGGEST_FILTERS = exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.IPreferencesSearchService = void 0;
    exports.getExperimentalExtensionToggleData = getExperimentalExtensionToggleData;
    exports.compareTwoNullableNumbers = compareTwoNullableNumbers;
    exports.IPreferencesSearchService = (0, instantiation_1.createDecorator)('preferencesSearchService');
    exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'settings.action.clearSearchResults';
    exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = 'settings.action.showContextMenu';
    exports.SETTINGS_EDITOR_COMMAND_SUGGEST_FILTERS = 'settings.action.suggestFilters';
    exports.CONTEXT_SETTINGS_EDITOR = new contextkey_1.RawContextKey('inSettingsEditor', false);
    exports.CONTEXT_SETTINGS_JSON_EDITOR = new contextkey_1.RawContextKey('inSettingsJSONEditor', false);
    exports.CONTEXT_SETTINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inSettingsSearch', false);
    exports.CONTEXT_TOC_ROW_FOCUS = new contextkey_1.RawContextKey('settingsTocRowFocus', false);
    exports.CONTEXT_SETTINGS_ROW_FOCUS = new contextkey_1.RawContextKey('settingRowFocus', false);
    exports.CONTEXT_KEYBINDINGS_EDITOR = new contextkey_1.RawContextKey('inKeybindings', false);
    exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inKeybindingsSearch', false);
    exports.CONTEXT_KEYBINDING_FOCUS = new contextkey_1.RawContextKey('keybindingFocus', false);
    exports.CONTEXT_WHEN_FOCUS = new contextkey_1.RawContextKey('whenFocus', false);
    exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = 'keybindings.editor.searchKeybindings';
    exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'keybindings.editor.clearSearchResults';
    exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_HISTORY = 'keybindings.editor.clearSearchHistory';
    exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = 'keybindings.editor.recordSearchKeys';
    exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = 'keybindings.editor.toggleSortByPrecedence';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = 'keybindings.editor.defineKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_ADD = 'keybindings.editor.addKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = 'keybindings.editor.defineWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_ACCEPT_WHEN = 'keybindings.editor.acceptWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_REJECT_WHEN = 'keybindings.editor.rejectWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = 'keybindings.editor.removeKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_RESET = 'keybindings.editor.resetKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY = 'keybindings.editor.copyKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = 'keybindings.editor.copyCommandKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE = 'keybindings.editor.copyCommandTitle';
    exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = 'keybindings.editor.showConflicts';
    exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = 'keybindings.editor.focusKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = 'keybindings.editor.showDefaultKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = 'keybindings.editor.showUserKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS = 'keybindings.editor.showExtensionKeybindings';
    exports.MODIFIED_SETTING_TAG = 'modified';
    exports.EXTENSION_SETTING_TAG = 'ext:';
    exports.FEATURE_SETTING_TAG = 'feature:';
    exports.ID_SETTING_TAG = 'id:';
    exports.LANGUAGE_SETTING_TAG = 'lang:';
    exports.GENERAL_TAG_SETTING_TAG = 'tag:';
    exports.POLICY_SETTING_TAG = 'hasPolicy';
    exports.WORKSPACE_TRUST_SETTING_TAG = 'workspaceTrust';
    exports.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG = 'requireTrustedWorkspace';
    exports.KEYBOARD_LAYOUT_OPEN_PICKER = 'workbench.action.openKeyboardLayoutPicker';
    exports.ENABLE_LANGUAGE_FILTER = true;
    exports.ENABLE_EXTENSION_TOGGLE_SETTINGS = true;
    let cachedExtensionToggleData;
    async function getExperimentalExtensionToggleData(extensionGalleryService, productService) {
        if (!exports.ENABLE_EXTENSION_TOGGLE_SETTINGS) {
            return undefined;
        }
        if (!extensionGalleryService.isEnabled()) {
            return undefined;
        }
        if (cachedExtensionToggleData) {
            return cachedExtensionToggleData;
        }
        if (productService.extensionRecommendations && productService.commonlyUsedSettings) {
            const settingsEditorRecommendedExtensions = {};
            Object.keys(productService.extensionRecommendations).forEach(extensionId => {
                const extensionInfo = productService.extensionRecommendations[extensionId];
                if (extensionInfo.onSettingsEditorOpen) {
                    settingsEditorRecommendedExtensions[extensionId] = extensionInfo;
                }
            });
            const recommendedExtensionsGalleryInfo = {};
            for (const key in settingsEditorRecommendedExtensions) {
                const extensionId = key;
                // Recommend prerelease if not on Stable.
                const isStable = productService.quality === 'stable';
                try {
                    const [extension] = await extensionGalleryService.getExtensions([{ id: extensionId, preRelease: !isStable }], cancellation_1.CancellationToken.None);
                    if (extension) {
                        recommendedExtensionsGalleryInfo[key] = extension;
                    }
                    else {
                        // same as network connection fail. we do not want a blank settings page: https://github.com/microsoft/vscode/issues/195722
                        // so instead of returning partial data we return undefined here
                        return undefined;
                    }
                }
                catch (e) {
                    // Network connection fail. Return nothing rather than partial data.
                    return undefined;
                }
            }
            cachedExtensionToggleData = {
                settingsEditorRecommendedExtensions,
                recommendedExtensionsGalleryInfo,
                commonlyUsed: productService.commonlyUsedSettings
            };
            return cachedExtensionToggleData;
        }
        return undefined;
    }
    /**
     * Compares two nullable numbers such that null values always come after defined ones.
     */
    function compareTwoNullableNumbers(a, b) {
        const aOrMax = a ?? Number.MAX_SAFE_INTEGER;
        const bOrMax = b ?? Number.MAX_SAFE_INTEGER;
        if (aOrMax < bOrMax) {
            return -1;
        }
        else if (aOrMax > bOrMax) {
            return 1;
        }
        else {
            return 0;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2NvbW1vbi9wcmVmZXJlbmNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5R2hHLGdGQWtEQztJQUtELDhEQVVDO0lBNUlZLFFBQUEseUJBQXlCLEdBQUcsSUFBQSwrQkFBZSxFQUE0QiwwQkFBMEIsQ0FBQyxDQUFDO0lBaUJuRyxRQUFBLDRDQUE0QyxHQUFHLG9DQUFvQyxDQUFDO0lBQ3BGLFFBQUEseUNBQXlDLEdBQUcsaUNBQWlDLENBQUM7SUFDOUUsUUFBQSx1Q0FBdUMsR0FBRyxnQ0FBZ0MsQ0FBQztJQUUzRSxRQUFBLHVCQUF1QixHQUFHLElBQUksMEJBQWEsQ0FBVSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRixRQUFBLDRCQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBVSxzQkFBc0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6RixRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBVSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN0RixRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNqRixRQUFBLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRixRQUFBLDBCQUEwQixHQUFHLElBQUksMEJBQWEsQ0FBVSxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEYsUUFBQSxnQ0FBZ0MsR0FBRyxJQUFJLDBCQUFhLENBQVUscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUYsUUFBQSx3QkFBd0IsR0FBRyxJQUFJLDBCQUFh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