define(["require", "exports", "vs/platform/theme/common/colorRegistry", "vs/base/common/color"], function (require, exports, colorRegistry_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultMenuStyles = exports.defaultSelectBoxStyles = exports.defaultListStyles = exports.defaultBreadcrumbsWidgetStyles = exports.defaultCountBadgeStyles = exports.defaultFindWidgetStyles = exports.defaultInputBoxStyles = exports.defaultDialogStyles = exports.defaultCheckboxStyles = exports.defaultToggleStyles = exports.defaultProgressBarStyles = exports.defaultButtonStyles = exports.defaultKeybindingLabelStyles = void 0;
    exports.getKeybindingLabelStyles = getKeybindingLabelStyles;
    exports.getButtonStyles = getButtonStyles;
    exports.getProgressBarStyles = getProgressBarStyles;
    exports.getToggleStyles = getToggleStyles;
    exports.getCheckboxStyles = getCheckboxStyles;
    exports.getDialogStyle = getDialogStyle;
    exports.getInputBoxStyle = getInputBoxStyle;
    exports.getCountBadgeStyle = getCountBadgeStyle;
    exports.getBreadcrumbsWidgetStyles = getBreadcrumbsWidgetStyles;
    exports.getListStyles = getListStyles;
    exports.getSelectBoxStyles = getSelectBoxStyles;
    exports.getMenuStyles = getMenuStyles;
    function overrideStyles(override, styles) {
        const result = { ...styles };
        for (const key in override) {
            const val = override[key];
            result[key] = val !== undefined ? (0, colorRegistry_1.asCssVariable)(val) : undefined;
        }
        return result;
    }
    exports.defaultKeybindingLabelStyles = {
        keybindingLabelBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelBackground),
        keybindingLabelForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelForeground),
        keybindingLabelBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelBorder),
        keybindingLabelBottomBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.keybindingLabelBottomBorder),
        keybindingLabelShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow)
    };
    function getKeybindingLabelStyles(override) {
        return overrideStyles(override, exports.defaultKeybindingLabelStyles);
    }
    exports.defaultButtonStyles = {
        buttonForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonForeground),
        buttonSeparator: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSeparator),
        buttonBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonBackground),
        buttonHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonHoverBackground),
        buttonSecondaryForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryForeground),
        buttonSecondaryBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryBackground),
        buttonSecondaryHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonSecondaryHoverBackground),
        buttonBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.buttonBorder),
    };
    function getButtonStyles(override) {
        return overrideStyles(override, exports.defaultButtonStyles);
    }
    exports.defaultProgressBarStyles = {
        progressBarBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.progressBarBackground)
    };
    function getProgressBarStyles(override) {
        return overrideStyles(override, exports.defaultProgressBarStyles);
    }
    exports.defaultToggleStyles = {
        inputActiveOptionBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBorder),
        inputActiveOptionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionForeground),
        inputActiveOptionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputActiveOptionBackground)
    };
    function getToggleStyles(override) {
        return overrideStyles(override, exports.defaultToggleStyles);
    }
    exports.defaultCheckboxStyles = {
        checkboxBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.checkboxBackground),
        checkboxBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.checkboxBorder),
        checkboxForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.checkboxForeground)
    };
    function getCheckboxStyles(override) {
        return overrideStyles(override, exports.defaultCheckboxStyles);
    }
    exports.defaultDialogStyles = {
        dialogBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetBackground),
        dialogForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetForeground),
        dialogShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow),
        dialogBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder),
        errorIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.problemsErrorIconForeground),
        warningIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.problemsWarningIconForeground),
        infoIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.problemsInfoIconForeground),
        textLinkForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.textLinkForeground)
    };
    function getDialogStyle(override) {
        return overrideStyles(override, exports.defaultDialogStyles);
    }
    exports.defaultInputBoxStyles = {
        inputBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputBackground),
        inputForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputForeground),
        inputBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputBorder),
        inputValidationInfoBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationInfoBorder),
        inputValidationInfoBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationInfoBackground),
        inputValidationInfoForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationInfoForeground),
        inputValidationWarningBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationWarningBorder),
        inputValidationWarningBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationWarningBackground),
        inputValidationWarningForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationWarningForeground),
        inputValidationErrorBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationErrorBorder),
        inputValidationErrorBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationErrorBackground),
        inputValidationErrorForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.inputValidationErrorForeground)
    };
    function getInputBoxStyle(override) {
        return overrideStyles(override, exports.defaultInputBoxStyles);
    }
    exports.defaultFindWidgetStyles = {
        listFilterWidgetBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetBackground),
        listFilterWidgetOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetOutline),
        listFilterWidgetNoMatchesOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetNoMatchesOutline),
        listFilterWidgetShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFilterWidgetShadow),
        inputBoxStyles: exports.defaultInputBoxStyles,
        toggleStyles: exports.defaultToggleStyles
    };
    exports.defaultCountBadgeStyles = {
        badgeBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeBackground),
        badgeForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeForeground),
        badgeBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder)
    };
    function getCountBadgeStyle(override) {
        return overrideStyles(override, exports.defaultCountBadgeStyles);
    }
    exports.defaultBreadcrumbsWidgetStyles = {
        breadcrumbsBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsBackground),
        breadcrumbsForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsForeground),
        breadcrumbsHoverForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsFocusForeground),
        breadcrumbsFocusForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsFocusForeground),
        breadcrumbsFocusAndSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.breadcrumbsActiveSelectionForeground)
    };
    function getBreadcrumbsWidgetStyles(override) {
        return overrideStyles(override, exports.defaultBreadcrumbsWidgetStyles);
    }
    exports.defaultListStyles = {
        listBackground: undefined,
        listInactiveFocusForeground: undefined,
        listFocusBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusBackground),
        listFocusForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusForeground),
        listFocusOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusOutline),
        listActiveSelectionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionBackground),
        listActiveSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionForeground),
        listActiveSelectionIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionIconForeground),
        listFocusAndSelectionOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listFocusAndSelectionOutline),
        listFocusAndSelectionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionBackground),
        listFocusAndSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listActiveSelectionForeground),
        listInactiveSelectionBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveSelectionBackground),
        listInactiveSelectionIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveSelectionIconForeground),
        listInactiveSelectionForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveSelectionForeground),
        listInactiveFocusBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveFocusBackground),
        listInactiveFocusOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listInactiveFocusOutline),
        listHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverBackground),
        listHoverForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverForeground),
        listDropOverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listDropOverBackground),
        listDropBetweenBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listDropBetweenBackground),
        listSelectionOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.activeContrastBorder),
        listHoverOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.activeContrastBorder),
        treeIndentGuidesStroke: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.treeIndentGuidesStroke),
        treeInactiveIndentGuidesStroke: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.treeInactiveIndentGuidesStroke),
        tableColumnsBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.tableColumnsBorder),
        tableOddRowsBackgroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.tableOddRowsBackgroundColor),
    };
    function getListStyles(override) {
        return overrideStyles(override, exports.defaultListStyles);
    }
    exports.defaultSelectBoxStyles = {
        selectBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBackground),
        selectListBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectListBackground),
        selectForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectForeground),
        decoratorRightForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.pickerGroupForeground),
        selectBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBorder),
        focusBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.focusBorder),
        listFocusBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputListFocusBackground),
        listInactiveSelectionIconForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputListFocusIconForeground),
        listFocusForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.quickInputListFocusForeground),
        listFocusOutline: (0, colorRegistry_1.asCssVariableWithDefault)(colorRegistry_1.activeContrastBorder, color_1.Color.transparent.toString()),
        listHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverBackground),
        listHoverForeground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.listHoverForeground),
        listHoverOutline: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.activeContrastBorder),
        selectListBorder: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetBorder),
        listBackground: undefined,
        listActiveSelectionBackground: undefined,
        listActiveSelectionForeground: undefined,
        listActiveSelectionIconForeground: undefined,
        listFocusAndSelectionBackground: undefined,
        listDropOverBackground: undefined,
        listDropBetweenBackground: undefined,
        listInactiveSelectionBackground: undefined,
        listInactiveSelectionForeground: undefined,
        listInactiveFocusBackground: undefined,
        listInactiveFocusOutline: undefined,
        listSelectionOutline: undefined,
        listFocusAndSelectionForeground: undefined,
        listFocusAndSelectionOutline: undefined,
        listInactiveFocusForeground: undefined,
        tableColumnsBorder: undefined,
        tableOddRowsBackgroundColor: undefined,
        treeIndentGuidesStroke: undefined,
        treeInactiveIndentGuidesStroke: undefined,
    };
    function getSelectBoxStyles(override) {
        return overrideStyles(override, exports.defaultSelectBoxStyles);
    }
    exports.defaultMenuStyles = {
        shadowColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow),
        borderColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuBorder),
        foregroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuForeground),
        backgroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuBackground),
        selectionForegroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSelectionForeground),
        selectionBackgroundColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSelectionBackground),
        selectionBorderColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSelectionBorder),
        separatorColor: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.menuSeparatorBackground),
        scrollbarShadow: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarShadow),
        scrollbarSliderBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarSliderBackground),
        scrollbarSliderHoverBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarSliderHoverBackground),
        scrollbarSliderActiveBackground: (0, colorRegistry_1.asCssVariable)(colorRegistry_1.scrollbarSliderActiveBackground)
    };
    function getMenuStyles(override) {
        return overrideStyles(override, exports.defaultMenuStyles);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdFN0eWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGhlbWUvYnJvd3Nlci9kZWZhdWx0U3R5bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUF3Q0EsNERBRUM7SUFZRCwwQ0FFQztJQU1ELG9EQUVDO0lBUUQsMENBRUM7SUFRRCw4Q0FFQztJQWFELHdDQUVDO0lBaUJELDRDQUVDO0lBaUJELGdEQUVDO0lBVUQsZ0VBRUM7SUErQkQsc0NBRUM7SUFzQ0QsZ0RBRUM7SUFpQkQsc0NBRUM7SUExTkQsU0FBUyxjQUFjLENBQUksUUFBMkIsRUFBRSxNQUFTO1FBQ2hFLE1BQU0sTUFBTSxHQUFHLEVBQUUsR0FBRyxNQUFNLEVBQTRDLENBQUM7UUFDdkUsS0FBSyxNQUFNLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUM1QixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsNkJBQWEsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2xFLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFWSxRQUFBLDRCQUE0QixHQUEyQjtRQUNuRSx5QkFBeUIsRUFBRSxJQUFBLDZCQUFhLEVBQUMseUNBQXlCLENBQUM7UUFDbkUseUJBQXlCLEVBQUUsSUFBQSw2QkFBYSxFQUFDLHlDQUF5QixDQUFDO1FBQ25FLHFCQUFxQixFQUFFLElBQUEsNkJBQWEsRUFBQyxxQ0FBcUIsQ0FBQztRQUMzRCwyQkFBMkIsRUFBRSxJQUFBLDZCQUFhLEVBQUMsMkNBQTJCLENBQUM7UUFDdkUscUJBQXFCLEVBQUUsSUFBQSw2QkFBYSxFQUFDLDRC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