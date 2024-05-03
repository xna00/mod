/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/types", "vs/base/common/verifier"], function (require, exports, dom_1, types_1, verifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_EDITOR_PART_OPTIONS = exports.DEFAULT_EDITOR_MAX_DIMENSIONS = exports.DEFAULT_EDITOR_MIN_DIMENSIONS = void 0;
    exports.impactsEditorPartOptions = impactsEditorPartOptions;
    exports.getEditorPartOptions = getEditorPartOptions;
    exports.fillActiveEditorViewState = fillActiveEditorViewState;
    exports.DEFAULT_EDITOR_MIN_DIMENSIONS = new dom_1.Dimension(220, 70);
    exports.DEFAULT_EDITOR_MAX_DIMENSIONS = new dom_1.Dimension(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    exports.DEFAULT_EDITOR_PART_OPTIONS = {
        showTabs: 'multiple',
        highlightModifiedTabs: false,
        tabActionLocation: 'right',
        tabActionCloseVisibility: true,
        tabActionUnpinVisibility: true,
        tabSizing: 'fit',
        tabSizingFixedMinWidth: 50,
        tabSizingFixedMaxWidth: 160,
        pinnedTabSizing: 'normal',
        pinnedTabsOnSeparateRow: false,
        tabHeight: 'default',
        preventPinnedEditorClose: 'keyboardAndMouse',
        titleScrollbarSizing: 'default',
        focusRecentEditorAfterClose: true,
        showIcons: true,
        hasIcons: true, // 'vs-seti' is our default icon theme
        enablePreview: true,
        openPositioning: 'right',
        openSideBySideDirection: 'right',
        closeEmptyGroups: true,
        labelFormat: 'default',
        splitSizing: 'auto',
        splitOnDragAndDrop: true,
        dragToOpenWindow: true,
        centeredLayoutFixedWidth: false,
        doubleClickTabToToggleEditorGroupSizes: 'expand',
        editorActionsLocation: 'default',
        wrapTabs: false,
        enablePreviewFromQuickOpen: false,
        scrollToSwitchTabs: false,
        enablePreviewFromCodeNavigation: false,
        closeOnFileDelete: false,
        mouseBackForwardToNavigate: true,
        restoreViewState: true,
        splitInGroupLayout: 'horizontal',
        revealIfOpen: false,
        // Properties that are Objects have to be defined as getters
        // to ensure no consumer modifies the default values
        get limit() { return { enabled: false, value: 10, perEditorGroup: false, excludeDirty: false }; },
        get decorations() { return { badges: true, colors: true }; },
        get autoLockGroups() { return new Set(); }
    };
    function impactsEditorPartOptions(event) {
        return event.affectsConfiguration('workbench.editor') || event.affectsConfiguration('workbench.iconTheme') || event.affectsConfiguration('window.density');
    }
    function getEditorPartOptions(configurationService, themeService) {
        const options = {
            ...exports.DEFAULT_EDITOR_PART_OPTIONS,
            hasIcons: themeService.getFileIconTheme().hasFileIcons
        };
        const config = configurationService.getValue();
        if (config?.workbench?.editor) {
            // Assign all primitive configuration over
            Object.assign(options, config.workbench.editor);
            // Special handle array types and convert to Set
            if ((0, types_1.isObject)(config.workbench.editor.autoLockGroups)) {
                options.autoLockGroups = exports.DEFAULT_EDITOR_PART_OPTIONS.autoLockGroups;
                for (const [editorId, enablement] of Object.entries(config.workbench.editor.autoLockGroups)) {
                    if (enablement === true) {
                        options.autoLockGroups.add(editorId);
                    }
                }
            }
            else {
                options.autoLockGroups = exports.DEFAULT_EDITOR_PART_OPTIONS.autoLockGroups;
            }
        }
        const windowConfig = configurationService.getValue();
        if (windowConfig?.window?.density?.editorTabHeight) {
            options.tabHeight = windowConfig.window.density.editorTabHeight;
        }
        return validateEditorPartOptions(options);
    }
    function validateEditorPartOptions(options) {
        // Migrate: Show tabs (config migration kicks in very late and can cause flicker otherwise)
        if (typeof options.showTabs === 'boolean') {
            options.showTabs = options.showTabs ? 'multiple' : 'single';
        }
        return (0, verifier_1.verifyObject)({
            'wrapTabs': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['wrapTabs']),
            'scrollToSwitchTabs': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['scrollToSwitchTabs']),
            'highlightModifiedTabs': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['highlightModifiedTabs']),
            'tabActionCloseVisibility': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabActionCloseVisibility']),
            'tabActionUnpinVisibility': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabActionUnpinVisibility']),
            'pinnedTabsOnSeparateRow': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['pinnedTabsOnSeparateRow']),
            'focusRecentEditorAfterClose': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['focusRecentEditorAfterClose']),
            'showIcons': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['showIcons']),
            'enablePreview': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['enablePreview']),
            'enablePreviewFromQuickOpen': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['enablePreviewFromQuickOpen']),
            'enablePreviewFromCodeNavigation': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['enablePreviewFromCodeNavigation']),
            'closeOnFileDelete': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['closeOnFileDelete']),
            'closeEmptyGroups': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['closeEmptyGroups']),
            'revealIfOpen': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['revealIfOpen']),
            'mouseBackForwardToNavigate': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['mouseBackForwardToNavigate']),
            'restoreViewState': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['restoreViewState']),
            'splitOnDragAndDrop': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['splitOnDragAndDrop']),
            'dragToOpenWindow': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['dragToOpenWindow']),
            'centeredLayoutFixedWidth': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['centeredLayoutFixedWidth']),
            'hasIcons': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['hasIcons']),
            'tabSizingFixedMinWidth': new verifier_1.NumberVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabSizingFixedMinWidth']),
            'tabSizingFixedMaxWidth': new verifier_1.NumberVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabSizingFixedMaxWidth']),
            'showTabs': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['showTabs'], ['multiple', 'single', 'none']),
            'tabActionLocation': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabActionLocation'], ['left', 'right']),
            'tabSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabSizing'], ['fit', 'shrink', 'fixed']),
            'pinnedTabSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['pinnedTabSizing'], ['normal', 'compact', 'shrink']),
            'tabHeight': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['tabHeight'], ['default', 'compact']),
            'preventPinnedEditorClose': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['preventPinnedEditorClose'], ['keyboardAndMouse', 'keyboard', 'mouse', 'never']),
            'titleScrollbarSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['titleScrollbarSizing'], ['default', 'large']),
            'openPositioning': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['openPositioning'], ['left', 'right', 'first', 'last']),
            'openSideBySideDirection': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['openSideBySideDirection'], ['right', 'down']),
            'labelFormat': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['labelFormat'], ['default', 'short', 'medium', 'long']),
            'splitInGroupLayout': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['splitInGroupLayout'], ['vertical', 'horizontal']),
            'splitSizing': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['splitSizing'], ['distribute', 'split', 'auto']),
            'doubleClickTabToToggleEditorGroupSizes': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['doubleClickTabToToggleEditorGroupSizes'], ['maximize', 'expand', 'off']),
            'editorActionsLocation': new verifier_1.EnumVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['editorActionsLocation'], ['default', 'titleBar', 'hidden']),
            'autoLockGroups': new verifier_1.SetVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['autoLockGroups']),
            'limit': new verifier_1.ObjectVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit'], {
                'enabled': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['enabled']),
                'value': new verifier_1.NumberVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['value']),
                'perEditorGroup': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['perEditorGroup']),
                'excludeDirty': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['limit']['excludeDirty'])
            }),
            'decorations': new verifier_1.ObjectVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['decorations'], {
                'badges': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['decorations']['badges']),
                'colors': new verifier_1.BooleanVerifier(exports.DEFAULT_EDITOR_PART_OPTIONS['decorations']['colors'])
            }),
        }, options);
    }
    function fillActiveEditorViewState(group, expectedActiveEditor, presetOptions) {
        if (!expectedActiveEditor || !group.activeEditor || expectedActiveEditor.matches(group.activeEditor)) {
            const options = {
                ...presetOptions,
                viewState: group.activeEditorPane?.getViewState()
            };
            return options;
        }
        return presetOptions || Object.create(null);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFFaEcsNERBRUM7SUFFRCxvREFnQ0M7SUF1S0QsOERBV0M7SUFyUVksUUFBQSw2QkFBNkIsR0FBRyxJQUFJLGVBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdkQsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLGVBQVMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFFbEcsUUFBQSwyQkFBMkIsR0FBdUI7UUFDOUQsUUFBUSxFQUFFLFVBQVU7UUFDcEIscUJBQXFCLEVBQUUsS0FBSztRQUM1QixpQkFBaUIsRUFBRSxPQUFPO1FBQzFCLHdCQUF3QixFQUFFLElBQUk7UUFDOUIsd0JBQXdCLEVBQUUsSUFBSTtRQUM5QixTQUFTLEVBQUUsS0FBSztRQUNoQixzQkFBc0IsRUFBRSxFQUFFO1FBQzFCLHNCQUFzQixFQUFFLEdBQUc7UUFDM0IsZUFBZSxFQUFFLFFBQVE7UUFDekIsdUJBQXVCLEVBQUUsS0FBSztRQUM5QixTQUFTLEVBQUUsU0FBUztRQUNwQix3QkFBd0IsRUFBRSxrQkFBa0I7UUFDNUMsb0JBQW9CLEVBQUUsU0FBUztRQUMvQiwyQkFBMkIsRUFBRSxJQUFJO1FBQ2pDLFNBQVMsRUFBRSxJQUFJO1FBQ2YsUUFBUSxFQUFFLElBQUksRUFBRSxzQ0FBc0M7UUFDdEQsYUFBYSxFQUFFLElBQUk7UUFDbkIsZUFBZSxFQUFFLE9BQU87UUFDeEIsdUJBQXVCLEVBQUUsT0FBTztRQUNoQyxnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLFdBQVcsRUFBRSxTQUFTO1FBQ3RCLFdB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