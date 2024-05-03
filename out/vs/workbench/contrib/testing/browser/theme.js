/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, color_1, nls_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testStatesToRetiredIconColors = exports.testingRetiredColorIconSkipped = exports.testingRetiredColorIconUnset = exports.testingRetiredColorIconQueued = exports.testingRetiredColorIconPassed = exports.testingRetiredColorIconFailed = exports.testingRetiredColorIconErrored = exports.testStatesToIconColors = exports.testMessageSeverityColors = exports.testingCoverCountBadgeForeground = exports.testingCoverCountBadgeBackground = exports.testingUncoveredGutterBackground = exports.testingUncoveredBorder = exports.testingUncoveredBackground = exports.testingUncoveredBranchBackground = exports.testingCoveredGutterBackground = exports.testingCoveredBorder = exports.testingCoveredBackground = exports.testingPeekMessageHeaderBackground = exports.testingPeekHeaderBackground = exports.testingMessagePeekBorder = exports.testingPeekBorder = exports.testingColorIconSkipped = exports.testingColorIconUnset = exports.testingColorIconQueued = exports.testingColorRunAction = exports.testingColorIconPassed = exports.testingColorIconErrored = exports.testingColorIconFailed = void 0;
    exports.testingColorIconFailed = (0, colorRegistry_1.registerColor)('testing.iconFailed', {
        dark: '#f14c4c',
        light: '#f14c4c',
        hcDark: '#f14c4c',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('testing.iconFailed', "Color for the 'failed' icon in the test explorer."));
    exports.testingColorIconErrored = (0, colorRegistry_1.registerColor)('testing.iconErrored', {
        dark: '#f14c4c',
        light: '#f14c4c',
        hcDark: '#f14c4c',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('testing.iconErrored', "Color for the 'Errored' icon in the test explorer."));
    exports.testingColorIconPassed = (0, colorRegistry_1.registerColor)('testing.iconPassed', {
        dark: '#73c991',
        light: '#73c991',
        hcDark: '#73c991',
        hcLight: '#007100'
    }, (0, nls_1.localize)('testing.iconPassed', "Color for the 'passed' icon in the test explorer."));
    exports.testingColorRunAction = (0, colorRegistry_1.registerColor)('testing.runAction', {
        dark: exports.testingColorIconPassed,
        light: exports.testingColorIconPassed,
        hcDark: exports.testingColorIconPassed,
        hcLight: exports.testingColorIconPassed
    }, (0, nls_1.localize)('testing.runAction', "Color for 'run' icons in the editor."));
    exports.testingColorIconQueued = (0, colorRegistry_1.registerColor)('testing.iconQueued', {
        dark: '#cca700',
        light: '#cca700',
        hcDark: '#cca700',
        hcLight: '#cca700'
    }, (0, nls_1.localize)('testing.iconQueued', "Color for the 'Queued' icon in the test explorer."));
    exports.testingColorIconUnset = (0, colorRegistry_1.registerColor)('testing.iconUnset', {
        dark: '#848484',
        light: '#848484',
        hcDark: '#848484',
        hcLight: '#848484'
    }, (0, nls_1.localize)('testing.iconUnset', "Color for the 'Unset' icon in the test explorer."));
    exports.testingColorIconSkipped = (0, colorRegistry_1.registerColor)('testing.iconSkipped', {
        dark: '#848484',
        light: '#848484',
        hcDark: '#848484',
        hcLight: '#848484'
    }, (0, nls_1.localize)('testing.iconSkipped', "Color for the 'Skipped' icon in the test explorer."));
    exports.testingPeekBorder = (0, colorRegistry_1.registerColor)('testing.peekBorder', {
        dark: colorRegistry_1.editorErrorForeground,
        light: colorRegistry_1.editorErrorForeground,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.peekBorder', 'Color of the peek view borders and arrow.'));
    exports.testingMessagePeekBorder = (0, colorRegistry_1.registerColor)('testing.messagePeekBorder', {
        dark: colorRegistry_1.editorInfoForeground,
        light: colorRegistry_1.editorInfoForeground,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.messagePeekBorder', 'Color of the peek view borders and arrow when peeking a logged message.'));
    exports.testingPeekHeaderBackground = (0, colorRegistry_1.registerColor)('testing.peekHeaderBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorErrorForeground, 0.1),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorErrorForeground, 0.1),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.peekBorder', 'Color of the peek view borders and arrow.'));
    exports.testingPeekMessageHeaderBackground = (0, colorRegistry_1.registerColor)('testing.messagePeekHeaderBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorInfoForeground, 0.1),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorInfoForeground, 0.1),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.messagePeekHeaderBackground', 'Color of the peek view borders and arrow when peeking a logged message.'));
    exports.testingCoveredBackground = (0, colorRegistry_1.registerColor)('testing.coveredBackground', {
        dark: colorRegistry_1.diffInserted,
        light: colorRegistry_1.diffInserted,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.coveredBackground', 'Background color of text that was covered.'));
    exports.testingCoveredBorder = (0, colorRegistry_1.registerColor)('testing.coveredBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.testingCoveredBackground, 0.75),
        light: (0, colorRegistry_1.transparent)(exports.testingCoveredBackground, 0.75),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.coveredBorder', 'Border color of text that was covered.'));
    exports.testingCoveredGutterBackground = (0, colorRegistry_1.registerColor)('testing.coveredGutterBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.diffInserted, 0.6),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.diffInserted, 0.6),
        hcDark: colorRegistry_1.chartsGreen,
        hcLight: colorRegistry_1.chartsGreen
    }, (0, nls_1.localize)('testing.coveredGutterBackground', 'Gutter color of regions where code was covered.'));
    exports.testingUncoveredBranchBackground = (0, colorRegistry_1.registerColor)('testing.uncoveredBranchBackground', {
        dark: (0, colorRegistry_1.opaque)((0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 2), colorRegistry_1.editorBackground),
        light: (0, colorRegistry_1.opaque)((0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 2), colorRegistry_1.editorBackground),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.uncoveredBranchBackground', 'Background of the widget shown for an uncovered branch.'));
    exports.testingUncoveredBackground = (0, colorRegistry_1.registerColor)('testing.uncoveredBackground', {
        dark: colorRegistry_1.diffRemoved,
        light: colorRegistry_1.diffRemoved,
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.uncoveredBackground', 'Background color of text that was not covered.'));
    exports.testingUncoveredBorder = (0, colorRegistry_1.registerColor)('testing.uncoveredBorder', {
        dark: (0, colorRegistry_1.transparent)(exports.testingUncoveredBackground, 0.75),
        light: (0, colorRegistry_1.transparent)(exports.testingUncoveredBackground, 0.75),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.uncoveredBorder', 'Border color of text that was not covered.'));
    exports.testingUncoveredGutterBackground = (0, colorRegistry_1.registerColor)('testing.uncoveredGutterBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 1.5),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.diffRemoved, 1.5),
        hcDark: colorRegistry_1.chartsRed,
        hcLight: colorRegistry_1.chartsRed
    }, (0, nls_1.localize)('testing.uncoveredGutterBackground', 'Gutter color of regions where code not covered.'));
    exports.testingCoverCountBadgeBackground = (0, colorRegistry_1.registerColor)('testing.coverCountBadgeBackground', {
        dark: colorRegistry_1.badgeBackground,
        light: colorRegistry_1.badgeBackground,
        hcDark: colorRegistry_1.badgeBackground,
        hcLight: colorRegistry_1.badgeBackground
    }, (0, nls_1.localize)('testing.coverCountBadgeBackground', 'Background for the badge indicating execution count'));
    exports.testingCoverCountBadgeForeground = (0, colorRegistry_1.registerColor)('testing.coverCountBadgeForeground', {
        dark: colorRegistry_1.badgeForeground,
        light: colorRegistry_1.badgeForeground,
        hcDark: colorRegistry_1.badgeForeground,
        hcLight: colorRegistry_1.badgeForeground
    }, (0, nls_1.localize)('testing.coverCountBadgeForeground', 'Foreground for the badge indicating execution count'));
    exports.testMessageSeverityColors = {
        [0 /* TestMessageType.Error */]: {
            decorationForeground: (0, colorRegistry_1.registerColor)('testing.message.error.decorationForeground', { dark: colorRegistry_1.editorErrorForeground, light: colorRegistry_1.editorErrorForeground, hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, (0, nls_1.localize)('testing.message.error.decorationForeground', 'Text color of test error messages shown inline in the editor.')),
            marginBackground: (0, colorRegistry_1.registerColor)('testing.message.error.lineBackground', { dark: new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2)), light: new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2)), hcDark: null, hcLight: null }, (0, nls_1.localize)('testing.message.error.marginBackground', 'Margin color beside error messages shown inline in the editor.')),
        },
        [1 /* TestMessageType.Output */]: {
            decorationForeground: (0, colorRegistry_1.registerColor)('testing.message.info.decorationForeground', { dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), hcDark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), hcLight: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5) }, (0, nls_1.localize)('testing.message.info.decorationForeground', 'Text color of test info messages shown inline in the editor.')),
            marginBackground: (0, colorRegistry_1.registerColor)('testing.message.info.lineBackground', { dark: null, light: null, hcDark: null, hcLight: null }, (0, nls_1.localize)('testing.message.info.marginBackground', 'Margin color beside info messages shown inline in the editor.')),
        },
    };
    exports.testStatesToIconColors = {
        [6 /* TestResultState.Errored */]: exports.testingColorIconErrored,
        [4 /* TestResultState.Failed */]: exports.testingColorIconFailed,
        [3 /* TestResultState.Passed */]: exports.testingColorIconPassed,
        [1 /* TestResultState.Queued */]: exports.testingColorIconQueued,
        [0 /* TestResultState.Unset */]: exports.testingColorIconUnset,
        [5 /* TestResultState.Skipped */]: exports.testingColorIconSkipped,
    };
    exports.testingRetiredColorIconErrored = (0, colorRegistry_1.registerColor)('testing.iconErrored.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconErrored, 0.7)
    }, (0, nls_1.localize)('testing.iconErrored.retired', "Retired color for the 'Errored' icon in the test explorer."));
    exports.testingRetiredColorIconFailed = (0, colorRegistry_1.registerColor)('testing.iconFailed.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconFailed, 0.7)
    }, (0, nls_1.localize)('testing.iconFailed.retired', "Retired color for the 'failed' icon in the test explorer."));
    exports.testingRetiredColorIconPassed = (0, colorRegistry_1.registerColor)('testing.iconPassed.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconPassed, 0.7)
    }, (0, nls_1.localize)('testing.iconPassed.retired', "Retired color for the 'passed' icon in the test explorer."));
    exports.testingRetiredColorIconQueued = (0, colorRegistry_1.registerColor)('testing.iconQueued.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconQueued, 0.7)
    }, (0, nls_1.localize)('testing.iconQueued.retired', "Retired color for the 'Queued' icon in the test explorer."));
    exports.testingRetiredColorIconUnset = (0, colorRegistry_1.registerColor)('testing.iconUnset.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconUnset, 0.7)
    }, (0, nls_1.localize)('testing.iconUnset.retired', "Retired color for the 'Unset' icon in the test explorer."));
    exports.testingRetiredColorIconSkipped = (0, colorRegistry_1.registerColor)('testing.iconSkipped.retired', {
        dark: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7),
        light: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7),
        hcDark: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7),
        hcLight: (0, colorRegistry_1.transparent)(exports.testingColorIconSkipped, 0.7)
    }, (0, nls_1.localize)('testing.iconSkipped.retired', "Retired color for the 'Skipped' icon in the test explorer."));
    exports.testStatesToRetiredIconColors = {
        [6 /* TestResultState.Errored */]: exports.testingRetiredColorIconErrored,
        [4 /* TestResultState.Failed */]: exports.testingRetiredColorIconFailed,
        [3 /* TestResultState.Passed */]: exports.testingRetiredColorIconPassed,
        [1 /* TestResultState.Queued */]: exports.testingRetiredColorIconQueued,
        [0 /* TestResultState.Unset */]: exports.testingRetiredColorIconUnset,
        [5 /* TestResultState.Skipped */]: exports.testingRetiredColorIconSkipped,
    };
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const editorBg = theme.getColor(colorRegistry_1.editorBackground);
        const missBadgeBackground = editorBg && theme.getColor(exports.testingUncoveredBackground)?.transparent(2).makeOpaque(editorBg);
        collector.addRule(`
	.coverage-deco-inline.coverage-deco-hit.coverage-deco-hovered {
		background: ${theme.getColor(exports.testingCoveredBackground)?.transparent(1.3)};
		outline-color: ${theme.getColor(exports.testingCoveredBorder)?.transparent(2)};
	}
	.coverage-deco-inline.coverage-deco-miss.coverage-deco-hovered {
		background: ${theme.getColor(exports.testingUncoveredBackground)?.transparent(1.3)};
		outline-color: ${theme.getColor(exports.testingUncoveredBorder)?.transparent(2)};
	}
	.coverage-deco-branch-miss-indicator::before {
		border-color: ${missBadgeBackground?.transparent(1.3)};
		background-color: ${missBadgeBackground};
	}
	`);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci90aGVtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRbkYsUUFBQSxzQkFBc0IsR0FBRyxJQUFBLDZCQUFhLEVBQUMsb0JBQW9CLEVBQUU7UUFDekUsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsU0FBUztRQUNoQixNQUFNLEVBQUUsU0FBUztRQUNqQixPQUFPLEVBQUUsU0FBUztLQUNsQixFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLG1EQUFtRCxDQUFDLENBQUMsQ0FBQztJQUUzRSxRQUFBLHVCQUF1QixHQUFHLElBQUEsNkJBQWEsRUFBQyxxQkFBcUIsRUFBRTtRQUMzRSxJQUFJLEVBQUUsU0FBUztRQUNmLEtBQUssRUFBRSxTQUFTO1FBQ2hCLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE9BQU8sRUFBRSxTQUFTO0tBQ2xCLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsb0RBQW9ELENBQUMsQ0FBQyxDQUFDO0lBRTdFLFFBQUEsc0JBQXNCLEdBQUcsSUFBQSw2QkFBYSxFQUFDLG9CQUFvQixFQUFFO1FBQ3pFLElBQUksRUFBRSxTQUFTO1FBQ2YsS0FBSyxFQUFFLFNBQVM7UUFDaEIsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLFNBQVM7S0FDbEIsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxtREFBbUQsQ0FBQyxDQUFDLENBQUM7SUFFM0UsUUFBQSxxQkFBcUIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsbUJBQW1CLEVBQUU7UUFDdkUsSUFBSSxFQUFFLDhCQUFzQjtRQUM1QixLQUFLLEVBQUUsOEJBQXNCO1FBQzdCLE1BQU0sRUFBRSw4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QUU7UUFDeEYsSUFBSSxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDOUMsS0FBSyxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDL0MsTUFBTSxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDaEQsT0FBTyxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7S0FDakQsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSwyREFBMkQsQ0FBQyxDQUFDLENBQUM7SUFFM0YsUUFBQSw2QkFBNkIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsNEJBQTRCLEVBQUU7UUFDeEYsSUFBSSxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDOUMsS0FBSyxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDL0MsTUFBTSxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDaEQsT0FBTyxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7S0FDakQsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSwyREFBMkQsQ0FBQyxDQUFDLENBQUM7SUFFM0YsUUFBQSw2QkFBNkIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsNEJBQTRCLEVBQUU7UUFDeEYsSUFBSSxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDOUMsS0FBSyxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDL0MsTUFBTSxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7UUFDaEQsT0FBTyxFQUFFLElBQUEsMkJBQVcsRUFBQyw4QkFBc0IsRUFBRSxHQUFHLENBQUM7S0FDakQsRUFBRSxJQUFBLGNBQVEsRUFBQyw0QkFBNEIsRUFBRSwyREFBMkQsQ0FBQyxDQUFDLENBQUM7SUFFM0YsUUFBQSw0QkFBNEIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsMkJBQTJCLEVBQUU7UUFDdEYsSUFBSSxFQUFFLElBQUEsMkJBQVcsRUFBQyw2QkFBcUIsRUFBRSxHQUFHLENBQUM7UUFDN0MsS0FBSyxFQUFFLElBQUEsMkJBQVcsRUFBQyw2QkFBcUIsRUFBRSxHQUFHLENBQUM7UUFDOUMsTUFBTSxFQUFFLElBQUEsMkJBQVcsRUFBQyw2QkFBcUIsRUFBRSxHQUFHLENBQUM7UUFDL0MsT0FBTyxFQUFFLElBQUEsMkJBQVcsRUFBQyw2QkFBcUIsRUFBRSxHQUFHLENBQUM7S0FDaEQsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSwwREFBMEQsQ0FBQyxDQUFDLENBQUM7SUFFekYsUUFBQSw4QkFBOEIsR0FBRyxJQUFBLDZCQUFhLEVBQUMsNkJBQTZCLEVBQUU7UUFDMUYsSUFBSSxFQUFFLElBQUEsMkJBQVcsRUFBQywrQkFBdUIsRUFBRSxHQUFHLENBQUM7UUFDL0MsS0FBSyxFQUFFLElBQUEsMkJBQVcsRUFBQywrQkFBdUIsRUFBRSxHQUFHLENBQUM7UUFDaEQsTUFBTSxFQUFFLElBQUEsMkJBQVcsRUFBQywrQkFBdUIsRUFBRSxHQUFHLENBQUM7UUFDakQsT0FBTyxFQUFFLElBQUEsMkJBQVcsRUFBQywrQkFBdUIsRUFBRSxHQUFHLENBQUM7S0FDbEQsRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSw0REFBNEQsQ0FBQyxDQUFDLENBQUM7SUFFN0YsUUFBQSw2QkFBNkIsR0FBd0M7UUFDakYsaUNBQXlCLEVBQUUsc0NBQThCO1FBQ3pELGdDQUF3QixFQUFFLHFDQUE2QjtRQUN2RCxnQ0FBd0IsRUFBRSxxQ0FBNkI7UUFDdkQsZ0NBQXdCLEVBQUUscUNBQTZCO1FBQ3ZELCtCQUF1QixFQUFFLG9DQUE0QjtRQUNyRCxpQ0FBeUIsRUFBRSxzQ0FBOEI7S0FDekQsQ0FBQztJQUVGLElBQUEseUNBQTBCLEVBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7UUFFL0MsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxnQ0FBZ0IsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsa0NBQTBCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXhILFNBQVMsQ0FBQyxPQUFPLENBQUM7O2dCQUVILEtBQUssQ0FBQyxRQUFRLENBQUMsZ0NBQXdCLENBQUMsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDO21CQUN2RCxLQUFLLENBQUMsUUFBUSxDQUFDLDRCQUFvQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQzs7O2dCQUd2RCxLQUFLLENBQUMsUUFBUSxDQUFDLGtDQUEwQixDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQzttQkFDekQsS0FBSyxDQUFDLFFBQVEsQ0FBQyw4QkFBc0IsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7OztrQkFHdkQsbUJBQW1CLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQztzQkFDakMsbUJBQW1COztFQUV2QyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9