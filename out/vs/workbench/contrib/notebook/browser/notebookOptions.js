/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/pixelRatio", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/config/fontMeasurements", "vs/editor/common/config/fontInfo", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, pixelRatio_1, event_1, lifecycle_1, fontMeasurements_1, fontInfo_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOptions = exports.OutputInnerContainerTopPadding = void 0;
    const SCROLLABLE_ELEMENT_PADDING_TOP = 18;
    exports.OutputInnerContainerTopPadding = 4;
    const defaultConfigConstants = Object.freeze({
        codeCellLeftMargin: 28,
        cellRunGutter: 32,
        markdownCellTopMargin: 8,
        markdownCellBottomMargin: 8,
        markdownCellLeftMargin: 0,
        markdownCellGutter: 32,
        focusIndicatorLeftMargin: 4
    });
    const compactConfigConstants = Object.freeze({
        codeCellLeftMargin: 8,
        cellRunGutter: 36,
        markdownCellTopMargin: 6,
        markdownCellBottomMargin: 6,
        markdownCellLeftMargin: 8,
        markdownCellGutter: 36,
        focusIndicatorLeftMargin: 4
    });
    class NotebookOptions extends lifecycle_1.Disposable {
        constructor(targetWindow, configurationService, notebookExecutionStateService, codeEditorService, isReadonly, overrides) {
            super();
            this.targetWindow = targetWindow;
            this.configurationService = configurationService;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.codeEditorService = codeEditorService;
            this.isReadonly = isReadonly;
            this.overrides = overrides;
            this._onDidChangeOptions = this._register(new event_1.Emitter());
            this.onDidChangeOptions = this._onDidChangeOptions.event;
            this._editorTopPadding = 12;
            const showCellStatusBar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.showCellStatusBar);
            const globalToolbar = overrides?.globalToolbar ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbar) ?? true;
            const stickyScrollEnabled = overrides?.stickyScrollEnabled ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollEnabled) ?? false;
            const stickyScrollMode = this._computeStickyScrollModeOption();
            const consolidatedOutputButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedOutputButton) ?? true;
            const consolidatedRunButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedRunButton) ?? false;
            const dragAndDropEnabled = overrides?.dragAndDropEnabled ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.dragAndDropEnabled) ?? true;
            const cellToolbarLocation = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation) ?? { 'default': 'right' };
            const cellToolbarInteraction = overrides?.cellToolbarInteraction ?? this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            const compactView = this.configurationService.getValue(notebookCommon_1.NotebookSetting.compactView) ?? true;
            const focusIndicator = this._computeFocusIndicatorOption();
            const insertToolbarPosition = this._computeInsertToolbarPositionOption(this.isReadonly);
            const insertToolbarAlignment = this._computeInsertToolbarAlignmentOption();
            const showFoldingControls = this._computeShowFoldingControlsOption();
            // const { bottomToolbarGap, bottomToolbarHeight } = this._computeBottomToolbarDimensions(compactView, insertToolbarPosition, insertToolbarAlignment);
            const fontSize = this.configurationService.getValue('editor.fontSize');
            const markupFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.markupFontSize);
            const editorOptionsCustomizations = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            const interactiveWindowCollapseCodeCells = this.configurationService.getValue(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            // TOOD @rebornix remove after a few iterations of deprecated setting
            let outputLineHeightSettingValue;
            const deprecatedOutputLineHeightSetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputLineHeightDeprecated);
            if (deprecatedOutputLineHeightSetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputLineHeightDeprecated, notebookCommon_1.NotebookSetting.outputLineHeight);
                outputLineHeightSettingValue = deprecatedOutputLineHeightSetting;
            }
            else {
                outputLineHeightSettingValue = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputLineHeight);
            }
            let outputFontSize;
            const deprecatedOutputFontSizeSetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSizeDeprecated);
            if (deprecatedOutputFontSizeSetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputFontSizeDeprecated, notebookCommon_1.NotebookSetting.outputFontSize);
                outputFontSize = deprecatedOutputFontSizeSetting;
            }
            else {
                outputFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSize) || fontSize;
            }
            let outputFontFamily;
            const deprecatedOutputFontFamilySetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamilyDeprecated);
            if (deprecatedOutputFontFamilySetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputFontFamilyDeprecated, notebookCommon_1.NotebookSetting.outputFontFamily);
                outputFontFamily = deprecatedOutputFontFamilySetting;
            }
            else {
                outputFontFamily = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamily);
            }
            let outputScrolling;
            const deprecatedOutputScrollingSetting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputScrollingDeprecated);
            if (deprecatedOutputScrollingSetting !== undefined) {
                this._migrateDeprecatedSetting(notebookCommon_1.NotebookSetting.outputScrollingDeprecated, notebookCommon_1.NotebookSetting.outputScrolling);
                outputScrolling = deprecatedOutputScrollingSetting;
            }
            else {
                outputScrolling = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputScrolling);
            }
            const outputLineHeight = this._computeOutputLineHeight(outputLineHeightSettingValue, outputFontSize);
            const outputWordWrap = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputWordWrap);
            const outputLineLimit = this.configurationService.getValue(notebookCommon_1.NotebookSetting.textOutputLineLimit) ?? 30;
            const linkifyFilePaths = this.configurationService.getValue(notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths) ?? true;
            const editorTopPadding = this._computeEditorTopPadding();
            this._layoutConfiguration = {
                ...(compactView ? compactConfigConstants : defaultConfigConstants),
                cellTopMargin: 6,
                cellBottomMargin: 6,
                cellRightMargin: 16,
                cellStatusBarHeight: 22,
                cellOutputPadding: 8,
                markdownPreviewPadding: 8,
                // bottomToolbarHeight: bottomToolbarHeight,
                // bottomToolbarGap: bottomToolbarGap,
                editorToolbarHeight: 0,
                editorTopPadding: editorTopPadding,
                editorBottomPadding: 4,
                editorBottomPaddingWithoutStatusBar: 12,
                collapsedIndicatorHeight: 28,
                showCellStatusBar,
                globalToolbar,
                stickyScrollEnabled,
                stickyScrollMode,
                consolidatedOutputButton,
                consolidatedRunButton,
                dragAndDropEnabled,
                cellToolbarLocation,
                cellToolbarInteraction,
                compactView,
                focusIndicator,
                insertToolbarPosition,
                insertToolbarAlignment,
                showFoldingControls,
                fontSize,
                outputFontSize,
                outputFontFamily,
                outputLineHeight,
                markupFontSize,
                editorOptionsCustomizations,
                focusIndicatorGap: 3,
                interactiveWindowCollapseCodeCells,
                markdownFoldHintHeight: 22,
                outputScrolling: outputScrolling,
                outputWordWrap: outputWordWrap,
                outputLineLimit: outputLineLimit,
                outputLinkifyFilePaths: linkifyFilePaths
            };
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                this._updateConfiguration(e);
            }));
        }
        updateOptions(isReadonly) {
            if (this.isReadonly !== isReadonly) {
                this.isReadonly = isReadonly;
                this._updateConfiguration({
                    affectsConfiguration(configuration) {
                        return configuration === notebookCommon_1.NotebookSetting.insertToolbarLocation;
                    },
                    source: 7 /* ConfigurationTarget.DEFAULT */,
                    affectedKeys: new Set([notebookCommon_1.NotebookSetting.insertToolbarLocation]),
                    change: { keys: [notebookCommon_1.NotebookSetting.insertToolbarLocation], overrides: [] },
                });
            }
        }
        _computeEditorTopPadding() {
            let decorationTriggeredAdjustment = false;
            const updateEditorTopPadding = (top) => {
                this._editorTopPadding = top;
                const configuration = Object.assign({}, this._layoutConfiguration);
                configuration.editorTopPadding = this._editorTopPadding;
                this._layoutConfiguration = configuration;
                this._onDidChangeOptions.fire({ editorTopPadding: true });
            };
            const decorationCheckSet = new Set();
            const onDidAddDecorationType = (e) => {
                if (decorationTriggeredAdjustment) {
                    return;
                }
                if (decorationCheckSet.has(e)) {
                    return;
                }
                try {
                    const options = this.codeEditorService.resolveDecorationOptions(e, true);
                    if (options.afterContentClassName || options.beforeContentClassName) {
                        const cssRules = this.codeEditorService.resolveDecorationCSSRules(e);
                        if (cssRules !== null) {
                            for (let i = 0; i < cssRules.length; i++) {
                                // The following ways to index into the list are equivalent
                                if ((cssRules[i].selectorText.endsWith('::after') || cssRules[i].selectorText.endsWith('::after'))
                                    && cssRules[i].cssText.indexOf('top:') > -1) {
                                    // there is a `::before` or `::after` text decoration whose position is above or below current line
                                    // we at least make sure that the editor top padding is at least one line
                                    const editorOptions = this.configurationService.getValue('editor');
                                    updateEditorTopPadding(fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(this.targetWindow).value).lineHeight + 2);
                                    decorationTriggeredAdjustment = true;
                                    break;
                                }
                            }
                        }
                    }
                    decorationCheckSet.add(e);
                }
                catch (_ex) {
                    // do not throw and break notebook
                }
            };
            this._register(this.codeEditorService.onDecorationTypeRegistered(onDidAddDecorationType));
            this.codeEditorService.listDecorationTypes().forEach(onDidAddDecorationType);
            return this._editorTopPadding;
        }
        _migrateDeprecatedSetting(deprecatedKey, key) {
            const deprecatedSetting = this.configurationService.inspect(deprecatedKey);
            if (deprecatedSetting.application !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 1 /* ConfigurationTarget.APPLICATION */);
                this.configurationService.updateValue(key, deprecatedSetting.application.value, 1 /* ConfigurationTarget.APPLICATION */);
            }
            if (deprecatedSetting.user !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 2 /* ConfigurationTarget.USER */);
                this.configurationService.updateValue(key, deprecatedSetting.user.value, 2 /* ConfigurationTarget.USER */);
            }
            if (deprecatedSetting.userLocal !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 3 /* ConfigurationTarget.USER_LOCAL */);
                this.configurationService.updateValue(key, deprecatedSetting.userLocal.value, 3 /* ConfigurationTarget.USER_LOCAL */);
            }
            if (deprecatedSetting.userRemote !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 4 /* ConfigurationTarget.USER_REMOTE */);
                this.configurationService.updateValue(key, deprecatedSetting.userRemote.value, 4 /* ConfigurationTarget.USER_REMOTE */);
            }
            if (deprecatedSetting.workspace !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 5 /* ConfigurationTarget.WORKSPACE */);
                this.configurationService.updateValue(key, deprecatedSetting.workspace.value, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            if (deprecatedSetting.workspaceFolder !== undefined) {
                this.configurationService.updateValue(deprecatedKey, undefined, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
                this.configurationService.updateValue(key, deprecatedSetting.workspaceFolder.value, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
        }
        _computeOutputLineHeight(lineHeight, outputFontSize) {
            const minimumLineHeight = 9;
            if (lineHeight === 0) {
                // use editor line height
                const editorOptions = this.configurationService.getValue('editor');
                const fontInfo = fontMeasurements_1.FontMeasurements.readFontInfo(this.targetWindow, fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(this.targetWindow).value));
                lineHeight = fontInfo.lineHeight;
            }
            else if (lineHeight < minimumLineHeight) {
                // Values too small to be line heights in pixels are in ems.
                let fontSize = outputFontSize;
                if (fontSize === 0) {
                    fontSize = this.configurationService.getValue('editor.fontSize');
                }
                lineHeight = lineHeight * fontSize;
            }
            // Enforce integer, minimum constraints
            lineHeight = Math.round(lineHeight);
            if (lineHeight < minimumLineHeight) {
                lineHeight = minimumLineHeight;
            }
            return lineHeight;
        }
        _updateConfiguration(e) {
            const cellStatusBarVisibility = e.affectsConfiguration(notebookCommon_1.NotebookSetting.showCellStatusBar);
            const cellToolbarLocation = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellToolbarLocation);
            const cellToolbarInteraction = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            const compactView = e.affectsConfiguration(notebookCommon_1.NotebookSetting.compactView);
            const focusIndicator = e.affectsConfiguration(notebookCommon_1.NotebookSetting.focusIndicator);
            const insertToolbarPosition = e.affectsConfiguration(notebookCommon_1.NotebookSetting.insertToolbarLocation);
            const insertToolbarAlignment = e.affectsConfiguration(notebookCommon_1.NotebookSetting.experimentalInsertToolbarAlignment);
            const globalToolbar = e.affectsConfiguration(notebookCommon_1.NotebookSetting.globalToolbar);
            const stickyScrollEnabled = e.affectsConfiguration(notebookCommon_1.NotebookSetting.stickyScrollEnabled);
            const stickyScrollMode = e.affectsConfiguration(notebookCommon_1.NotebookSetting.stickyScrollMode);
            const consolidatedOutputButton = e.affectsConfiguration(notebookCommon_1.NotebookSetting.consolidatedOutputButton);
            const consolidatedRunButton = e.affectsConfiguration(notebookCommon_1.NotebookSetting.consolidatedRunButton);
            const showFoldingControls = e.affectsConfiguration(notebookCommon_1.NotebookSetting.showFoldingControls);
            const dragAndDropEnabled = e.affectsConfiguration(notebookCommon_1.NotebookSetting.dragAndDropEnabled);
            const fontSize = e.affectsConfiguration('editor.fontSize');
            const outputFontSize = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputFontSize);
            const markupFontSize = e.affectsConfiguration(notebookCommon_1.NotebookSetting.markupFontSize);
            const fontFamily = e.affectsConfiguration('editor.fontFamily');
            const outputFontFamily = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputFontFamily);
            const editorOptionsCustomizations = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            const interactiveWindowCollapseCodeCells = e.affectsConfiguration(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            const outputLineHeight = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputLineHeight);
            const outputScrolling = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputScrolling);
            const outputWordWrap = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputWordWrap);
            const outputLinkifyFilePaths = e.affectsConfiguration(notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths);
            if (!cellStatusBarVisibility
                && !cellToolbarLocation
                && !cellToolbarInteraction
                && !compactView
                && !focusIndicator
                && !insertToolbarPosition
                && !insertToolbarAlignment
                && !globalToolbar
                && !stickyScrollEnabled
                && !stickyScrollMode
                && !consolidatedOutputButton
                && !consolidatedRunButton
                && !showFoldingControls
                && !dragAndDropEnabled
                && !fontSize
                && !outputFontSize
                && !markupFontSize
                && !fontFamily
                && !outputFontFamily
                && !editorOptionsCustomizations
                && !interactiveWindowCollapseCodeCells
                && !outputLineHeight
                && !outputScrolling
                && !outputWordWrap
                && !outputLinkifyFilePaths) {
                return;
            }
            let configuration = Object.assign({}, this._layoutConfiguration);
            if (cellStatusBarVisibility) {
                configuration.showCellStatusBar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.showCellStatusBar);
            }
            if (cellToolbarLocation) {
                configuration.cellToolbarLocation = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation) ?? { 'default': 'right' };
            }
            if (cellToolbarInteraction && !this.overrides?.cellToolbarInteraction) {
                configuration.cellToolbarInteraction = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            }
            if (focusIndicator) {
                configuration.focusIndicator = this._computeFocusIndicatorOption();
            }
            if (compactView) {
                const compactViewValue = this.configurationService.getValue(notebookCommon_1.NotebookSetting.compactView) ?? true;
                configuration = Object.assign(configuration, {
                    ...(compactViewValue ? compactConfigConstants : defaultConfigConstants),
                });
                configuration.compactView = compactViewValue;
            }
            if (insertToolbarAlignment) {
                configuration.insertToolbarAlignment = this._computeInsertToolbarAlignmentOption();
            }
            if (insertToolbarPosition) {
                configuration.insertToolbarPosition = this._computeInsertToolbarPositionOption(this.isReadonly);
            }
            if (globalToolbar && this.overrides?.globalToolbar === undefined) {
                configuration.globalToolbar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbar) ?? true;
            }
            if (stickyScrollEnabled && this.overrides?.stickyScrollEnabled === undefined) {
                configuration.stickyScrollEnabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollEnabled) ?? false;
            }
            if (stickyScrollMode) {
                configuration.stickyScrollMode = this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollMode) ?? 'flat';
            }
            if (consolidatedOutputButton) {
                configuration.consolidatedOutputButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedOutputButton) ?? true;
            }
            if (consolidatedRunButton) {
                configuration.consolidatedRunButton = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedRunButton) ?? true;
            }
            if (showFoldingControls) {
                configuration.showFoldingControls = this._computeShowFoldingControlsOption();
            }
            if (dragAndDropEnabled) {
                configuration.dragAndDropEnabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.dragAndDropEnabled) ?? true;
            }
            if (fontSize) {
                configuration.fontSize = this.configurationService.getValue('editor.fontSize');
            }
            if (outputFontSize || fontSize) {
                configuration.outputFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSize) || configuration.fontSize;
            }
            if (markupFontSize) {
                configuration.markupFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.markupFontSize);
            }
            if (outputFontFamily) {
                configuration.outputFontFamily = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamily);
            }
            if (editorOptionsCustomizations) {
                configuration.editorOptionsCustomizations = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            }
            if (interactiveWindowCollapseCodeCells) {
                configuration.interactiveWindowCollapseCodeCells = this.configurationService.getValue(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            }
            if (outputLineHeight || fontSize || outputFontSize) {
                const lineHeight = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputLineHeight);
                configuration.outputLineHeight = this._computeOutputLineHeight(lineHeight, configuration.outputFontSize);
            }
            if (outputWordWrap) {
                configuration.outputWordWrap = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputWordWrap);
            }
            if (outputScrolling) {
                configuration.outputScrolling = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputScrolling);
            }
            if (outputLinkifyFilePaths) {
                configuration.outputLinkifyFilePaths = this.configurationService.getValue(notebookCommon_1.NotebookSetting.LinkifyOutputFilePaths);
            }
            this._layoutConfiguration = Object.freeze(configuration);
            // trigger event
            this._onDidChangeOptions.fire({
                cellStatusBarVisibility,
                cellToolbarLocation,
                cellToolbarInteraction,
                compactView,
                focusIndicator,
                insertToolbarPosition,
                insertToolbarAlignment,
                globalToolbar,
                stickyScrollEnabled,
                stickyScrollMode,
                showFoldingControls,
                consolidatedOutputButton,
                consolidatedRunButton,
                dragAndDropEnabled,
                fontSize,
                outputFontSize,
                markupFontSize,
                fontFamily,
                outputFontFamily,
                editorOptionsCustomizations,
                interactiveWindowCollapseCodeCells,
                outputLineHeight,
                outputScrolling,
                outputWordWrap,
                outputLinkifyFilePaths: outputLinkifyFilePaths
            });
        }
        _computeInsertToolbarPositionOption(isReadOnly) {
            return isReadOnly ? 'hidden' : this.configurationService.getValue(notebookCommon_1.NotebookSetting.insertToolbarLocation) ?? 'both';
        }
        _computeInsertToolbarAlignmentOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.experimentalInsertToolbarAlignment) ?? 'center';
        }
        _computeShowFoldingControlsOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.showFoldingControls) ?? 'mouseover';
        }
        _computeFocusIndicatorOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.focusIndicator) ?? 'gutter';
        }
        _computeStickyScrollModeOption() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.stickyScrollMode) ?? 'flat';
        }
        getCellCollapseDefault() {
            return this._layoutConfiguration.interactiveWindowCollapseCodeCells === 'never' ?
                {
                    codeCell: {
                        inputCollapsed: false
                    }
                } : {
                codeCell: {
                    inputCollapsed: true
                }
            };
        }
        getLayoutConfiguration() {
            return this._layoutConfiguration;
        }
        getDisplayOptions() {
            return this._layoutConfiguration;
        }
        getCellEditorContainerLeftMargin() {
            const { codeCellLeftMargin, cellRunGutter } = this._layoutConfiguration;
            return codeCellLeftMargin + cellRunGutter;
        }
        computeCollapsedMarkdownCellHeight(viewType) {
            const { bottomToolbarGap } = this.computeBottomToolbarDimensions(viewType);
            return this._layoutConfiguration.markdownCellTopMargin
                + this._layoutConfiguration.collapsedIndicatorHeight
                + bottomToolbarGap
                + this._layoutConfiguration.markdownCellBottomMargin;
        }
        computeBottomToolbarOffset(totalHeight, viewType) {
            const { bottomToolbarGap, bottomToolbarHeight } = this.computeBottomToolbarDimensions(viewType);
            return totalHeight
                - bottomToolbarGap
                - bottomToolbarHeight / 2;
        }
        computeCodeCellEditorWidth(outerWidth) {
            return outerWidth - (this._layoutConfiguration.codeCellLeftMargin
                + this._layoutConfiguration.cellRunGutter
                + this._layoutConfiguration.cellRightMargin);
        }
        computeMarkdownCellEditorWidth(outerWidth) {
            return outerWidth
                - this._layoutConfiguration.markdownCellGutter
                - this._layoutConfiguration.markdownCellLeftMargin
                - this._layoutConfiguration.cellRightMargin;
        }
        computeStatusBarHeight() {
            return this._layoutConfiguration.cellStatusBarHeight;
        }
        _computeBottomToolbarDimensions(compactView, insertToolbarPosition, insertToolbarAlignment, cellToolbar) {
            if (insertToolbarAlignment === 'left' || cellToolbar !== 'hidden') {
                return {
                    bottomToolbarGap: 18,
                    bottomToolbarHeight: 18
                };
            }
            if (insertToolbarPosition === 'betweenCells' || insertToolbarPosition === 'both') {
                return compactView ? {
                    bottomToolbarGap: 12,
                    bottomToolbarHeight: 20
                } : {
                    bottomToolbarGap: 20,
                    bottomToolbarHeight: 20
                };
            }
            else {
                return {
                    bottomToolbarGap: 0,
                    bottomToolbarHeight: 0
                };
            }
        }
        computeBottomToolbarDimensions(viewType) {
            const configuration = this._layoutConfiguration;
            const cellToolbarPosition = this.computeCellToolbarLocation(viewType);
            const { bottomToolbarGap, bottomToolbarHeight } = this._computeBottomToolbarDimensions(configuration.compactView, configuration.insertToolbarPosition, configuration.insertToolbarAlignment, cellToolbarPosition);
            return {
                bottomToolbarGap,
                bottomToolbarHeight
            };
        }
        computeCellToolbarLocation(viewType) {
            const cellToolbarLocation = this._layoutConfiguration.cellToolbarLocation;
            if (typeof cellToolbarLocation === 'string') {
                if (cellToolbarLocation === 'left' || cellToolbarLocation === 'right' || cellToolbarLocation === 'hidden') {
                    return cellToolbarLocation;
                }
            }
            else {
                if (viewType) {
                    const notebookSpecificSetting = cellToolbarLocation[viewType] ?? cellToolbarLocation['default'];
                    let cellToolbarLocationForCurrentView = 'right';
                    switch (notebookSpecificSetting) {
                        case 'left':
                            cellToolbarLocationForCurrentView = 'left';
                            break;
                        case 'right':
                            cellToolbarLocationForCurrentView = 'right';
                            break;
                        case 'hidden':
                            cellToolbarLocationForCurrentView = 'hidden';
                            break;
                        default:
                            cellToolbarLocationForCurrentView = 'right';
                            break;
                    }
                    return cellToolbarLocationForCurrentView;
                }
            }
            return 'right';
        }
        computeTopInsertToolbarHeight(viewType) {
            if (this._layoutConfiguration.insertToolbarPosition === 'betweenCells' || this._layoutConfiguration.insertToolbarPosition === 'both') {
                return SCROLLABLE_ELEMENT_PADDING_TOP;
            }
            const cellToolbarLocation = this.computeCellToolbarLocation(viewType);
            if (cellToolbarLocation === 'left' || cellToolbarLocation === 'right') {
                return SCROLLABLE_ELEMENT_PADDING_TOP;
            }
            return 0;
        }
        computeEditorPadding(internalMetadata, cellUri) {
            return {
                top: this._editorTopPadding,
                bottom: this.statusBarIsVisible(internalMetadata, cellUri)
                    ? this._layoutConfiguration.editorBottomPadding
                    : this._layoutConfiguration.editorBottomPaddingWithoutStatusBar
            };
        }
        computeEditorStatusbarHeight(internalMetadata, cellUri) {
            return this.statusBarIsVisible(internalMetadata, cellUri) ? this.computeStatusBarHeight() : 0;
        }
        statusBarIsVisible(internalMetadata, cellUri) {
            const exe = this.notebookExecutionStateService.getCellExecution(cellUri);
            if (this._layoutConfiguration.showCellStatusBar === 'visible') {
                return true;
            }
            else if (this._layoutConfiguration.showCellStatusBar === 'visibleAfterExecute') {
                return typeof internalMetadata.lastRunSuccess === 'boolean' || exe !== undefined;
            }
            else {
                return false;
            }
        }
        computeWebviewOptions() {
            return {
                outputNodePadding: this._layoutConfiguration.cellOutputPadding,
                outputNodeLeftPadding: this._layoutConfiguration.cellOutputPadding,
                previewNodePadding: this._layoutConfiguration.markdownPreviewPadding,
                markdownLeftMargin: this._layoutConfiguration.markdownCellGutter + this._layoutConfiguration.markdownCellLeftMargin,
                leftMargin: this._layoutConfiguration.codeCellLeftMargin,
                rightMargin: this._layoutConfiguration.cellRightMargin,
                runGutter: this._layoutConfiguration.cellRunGutter,
                dragAndDropEnabled: this._layoutConfiguration.dragAndDropEnabled,
                fontSize: this._layoutConfiguration.fontSize,
                outputFontSize: this._layoutConfiguration.outputFontSize,
                outputFontFamily: this._layoutConfiguration.outputFontFamily,
                markupFontSize: this._layoutConfiguration.markupFontSize,
                outputLineHeight: this._layoutConfiguration.outputLineHeight,
                outputScrolling: this._layoutConfiguration.outputScrolling,
                outputWordWrap: this._layoutConfiguration.outputWordWrap,
                outputLineLimit: this._layoutConfiguration.outputLineLimit,
                outputLinkifyFilePaths: this._layoutConfiguration.outputLinkifyFilePaths,
            };
        }
        computeDiffWebviewOptions() {
            return {
                outputNodePadding: this._layoutConfiguration.cellOutputPadding,
                outputNodeLeftPadding: 0,
                previewNodePadding: this._layoutConfiguration.markdownPreviewPadding,
                markdownLeftMargin: 0,
                leftMargin: 32,
                rightMargin: 0,
                runGutter: 0,
                dragAndDropEnabled: false,
                fontSize: this._layoutConfiguration.fontSize,
                outputFontSize: this._layoutConfiguration.outputFontSize,
                outputFontFamily: this._layoutConfiguration.outputFontFamily,
                markupFontSize: this._layoutConfiguration.markupFontSize,
                outputLineHeight: this._layoutConfiguration.outputLineHeight,
                outputScrolling: this._layoutConfiguration.outputScrolling,
                outputWordWrap: this._layoutConfiguration.outputWordWrap,
                outputLineLimit: this._layoutConfiguration.outputLineLimit,
                outputLinkifyFilePaths: false
            };
        }
        computeIndicatorPosition(totalHeight, foldHintHeight, viewType) {
            const { bottomToolbarGap } = this.computeBottomToolbarDimensions(viewType);
            return {
                bottomIndicatorTop: totalHeight - bottomToolbarGap - this._layoutConfiguration.cellBottomMargin - foldHintHeight,
                verticalIndicatorHeight: totalHeight - bottomToolbarGap - foldHintHeight
            };
        }
    }
    exports.NotebookOptions = NotebookOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPcHRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBTSw4QkFBOEIsR0FBRyxFQUFFLENBQUM7SUFFN0IsUUFBQSw4QkFBOEIsR0FBRyxDQUFDLENBQUM7SUFrRmhELE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM1QyxrQkFBa0IsRUFBRSxFQUFFO1FBQ3RCLGFBQWEsRUFBRSxFQUFFO1FBQ2pCLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsd0JBQXdCLEVBQUUsQ0FBQztRQUMzQixzQkFBc0IsRUFBRSxDQUFDO1FBQ3pCLGtCQUFrQixFQUFFLEVBQUU7UUFDdEIsd0JBQXdCLEVBQUUsQ0FBQztLQUMzQixDQUFDLENBQUM7SUFFSCxNQUFNLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUMsa0JBQWtCLEVBQUUsQ0FBQztRQUNyQixhQUFhLEVBQUUsRUFBRTtRQUNqQixxQkFBcUIsRUFBRSxDQUFDO1FBQ3hCLHdCQUF3QixFQUFFLENBQUM7UUFDM0Isc0JBQXNCLEVBQUUsQ0FBQztRQUN6QixrQkFBa0IsRUFBRSxFQUFFO1FBQ3RCLHdCQUF3QixFQUFFLENBQUM7S0FDM0IsQ0FBQyxDQUFDO0lBRUgsTUFBYSxlQUFnQixTQUFRLHNCQUFVO1FBTTlDLFlBQ1UsWUFBd0IsRUFDaEIsb0JBQTJDLEVBQzNDLDZCQUE2RCxFQUM3RCxpQkFBcUMsRUFDOUMsVUFBbUIsRUFDVixTQUFpSTtZQUVsSixLQUFLLEVBQUUsQ0FBQztZQVBDLGlCQUFZLEdBQVosWUFBWSxDQUFZO1lBQ2hCLHlCQUFvQixHQUFwQixv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