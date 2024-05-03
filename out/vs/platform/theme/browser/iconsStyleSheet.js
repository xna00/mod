/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/platform/theme/common/iconRegistry"], function (require, exports, dom_1, event_1, lifecycle_1, themables_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnthemedProductIconTheme = void 0;
    exports.getIconsStyleSheet = getIconsStyleSheet;
    function getIconsStyleSheet(themeService) {
        const disposable = new lifecycle_1.DisposableStore();
        const onDidChangeEmmiter = disposable.add(new event_1.Emitter());
        const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
        disposable.add(iconRegistry.onDidChange(() => onDidChangeEmmiter.fire()));
        if (themeService) {
            disposable.add(themeService.onDidProductIconThemeChange(() => onDidChangeEmmiter.fire()));
        }
        return {
            dispose: () => disposable.dispose(),
            onDidChange: onDidChangeEmmiter.event,
            getCSS() {
                const productIconTheme = themeService ? themeService.getProductIconTheme() : new UnthemedProductIconTheme();
                const usedFontIds = {};
                const formatIconRule = (contribution) => {
                    const definition = productIconTheme.getIcon(contribution);
                    if (!definition) {
                        return undefined;
                    }
                    const fontContribution = definition.font;
                    if (fontContribution) {
                        usedFontIds[fontContribution.id] = fontContribution.definition;
                        return `.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; font-family: ${(0, dom_1.asCSSPropertyValue)(fontContribution.id)}; }`;
                    }
                    // default font (codicon)
                    return `.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; }`;
                };
                const rules = [];
                for (const contribution of iconRegistry.getIcons()) {
                    const rule = formatIconRule(contribution);
                    if (rule) {
                        rules.push(rule);
                    }
                }
                for (const id in usedFontIds) {
                    const definition = usedFontIds[id];
                    const fontWeight = definition.weight ? `font-weight: ${definition.weight};` : '';
                    const fontStyle = definition.style ? `font-style: ${definition.style};` : '';
                    const src = definition.src.map(l => `${(0, dom_1.asCSSUrl)(l.location)} format('${l.format}')`).join(', ');
                    rules.push(`@font-face { src: ${src}; font-family: ${(0, dom_1.asCSSPropertyValue)(id)};${fontWeight}${fontStyle} font-display: block; }`);
                }
                return rules.join('\n');
            }
        };
    }
    class UnthemedProductIconTheme {
        getIcon(contribution) {
            const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
            let definition = contribution.defaults;
            while (themables_1.ThemeIcon.isThemeIcon(definition)) {
                const c = iconRegistry.getIcon(definition.id);
                if (!c) {
                    return undefined;
                }
                definition = c.defaults;
            }
            return definition;
        }
    }
    exports.UnthemedProductIconTheme = UnthemedProductIconTheme;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbnNTdHlsZVNoZWV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90aGVtZS9icm93c2VyL2ljb25zU3R5bGVTaGVldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsZ0RBK0NDO0lBL0NELFNBQWdCLGtCQUFrQixDQUFDLFlBQXVDO1FBQ3pFLE1BQU0sVUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRXpDLE1BQU0sa0JBQWtCLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7UUFDL0QsTUFBTSxZQUFZLEdBQUcsSUFBQSw4QkFBZSxHQUFFLENBQUM7UUFDdkMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLFlBQVksRUFBRSxDQUFDO1lBQ2xCLFVBQVUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQ25DLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLO1lBQ3JDLE1BQU07Z0JBQ0wsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLHdCQUF3QixFQUFFLENBQUM7Z0JBQzVHLE1BQU0sV0FBVyxHQUF5QyxFQUFFLENBQUM7Z0JBQzdELE1BQU0sY0FBYyxH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