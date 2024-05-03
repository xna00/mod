/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/toggle/toggle", "vs/base/common/codicons", "vs/nls"], function (require, exports, hoverDelegateFactory_1, toggle_1, codicons_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RegexToggle = exports.WholeWordsToggle = exports.CaseSensitiveToggle = void 0;
    const NLS_CASE_SENSITIVE_TOGGLE_LABEL = nls.localize('caseDescription', "Match Case");
    const NLS_WHOLE_WORD_TOGGLE_LABEL = nls.localize('wordsDescription', "Match Whole Word");
    const NLS_REGEX_TOGGLE_LABEL = nls.localize('regexDescription', "Use Regular Expression");
    class CaseSensitiveToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.caseSensitive,
                title: NLS_CASE_SENSITIVE_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                hoverDelegate: opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.CaseSensitiveToggle = CaseSensitiveToggle;
    class WholeWordsToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.wholeWord,
                title: NLS_WHOLE_WORD_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                hoverDelegate: opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.WholeWordsToggle = WholeWordsToggle;
    class RegexToggle extends toggle_1.Toggle {
        constructor(opts) {
            super({
                icon: codicons_1.Codicon.regex,
                title: NLS_REGEX_TOGGLE_LABEL + opts.appendTitle,
                isChecked: opts.isChecked,
                hoverDelegate: opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                inputActiveOptionBorder: opts.inputActiveOptionBorder,
                inputActiveOptionForeground: opts.inputActiveOptionForeground,
                inputActiveOptionBackground: opts.inputActiveOptionBackground
            });
        }
    }
    exports.RegexToggle = RegexToggle;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZElucHV0VG9nZ2xlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2ZpbmRpbnB1dC9maW5kSW5wdXRUb2dnbGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBTSwrQkFBK0IsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3RGLE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3pGLE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0lBRTFGLE1BQWEsbUJBQW9CLFNBQVEsZUFBTTtRQUM5QyxZQUFZLElBQTBCO1lBQ3JDLEtBQUssQ0FBQztnQkFDTCxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxhQUFhO2dCQUMzQixLQUFLLEVBQUUsK0JBQStCLEdBQUcsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pELFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLElBQUksSUFBQSw4Q0FBdUIsRUFBQyxTQUFTLENBQUM7Z0JBQ3ZFLHVCQUF1QixFQUFFLElBQUksQ0FBQyx1QkFBdUI7Z0JBQ3JELDJCQUEyQixFQUFFLElBQUksQ0FBQywyQkFBMkI7Z0JBQzdELDJCQUEyQixFQUFFLElBQUksQ0FBQywyQkFBMkI7YUFDN0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBWkQsa0RBWUM7SUFFRCxNQUFhLGdCQUFpQixTQUFRLGVBQU07UUFDM0MsWUFBWSxJQUEwQjtZQUNyQyxLQUFLLENBQUM7Z0JBQ0wsSUFBSSxFQUFFLGtCQUFPLENBQUMsU0FBUztnQkFDdkIsS0FBSyxFQUFFLDJCQUEyQixHQUFHLElBQUksQ0FBQyxXQUFXO2dCQUNyRCxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7Z0JBQ3pCLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUEsOENBQXVCLEVBQUMsU0FBUyxDQUFDO2dCQUN2RSx1QkFBdUIsRUFBRSxJQUFJLENBQUMsdUJBQXVCO2dCQUNyRCwyQkFBMkIsRUFBRSxJQUFJLENBQUMsMkJBQTJCO2dCQUM3RCwyQkFBMkIsRUFBRSxJQUFJLENBQUMsMkJBQTJCO2FBQzdELENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQVpELDRDQVlDO0lBRUQsTUFBYSxXQUFZLFNBQVEsZUFBTTtRQUN0QyxZQUFZLElBQTBCO1lBQ3JDLEtBQUssQ0FBQztnQkFDTCxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxLQUFLO2dCQUNuQixLQUFLLEVBQUUsc0JBQXNCLEdBQUcsSUFBSSxDQUFDLFdBQVc7Z0JBQ2hELFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLElBQUksSUFBQSw4Q0FBdUIsRUFBQyxTQUFTLENBQUM7Z0JBQ3ZFLHVCQUF1QixFQUFFLElBQUksQ0FBQyx1QkFBdUI7Z0JBQ3JELDJCQUEyQixFQUFFLElBQUksQ0FBQywyQkFBMkI7Z0JBQzdELDJCQUEyQixFQUFFLElBQUksQ0FBQywyQkFBMkI7YUFDN0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBWkQsa0NBWUMifQ==