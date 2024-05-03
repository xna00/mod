/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hash", "vs/base/common/uri", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/theme", "vs/base/common/themables", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/base/browser/dom", "vs/base/common/lifecycle"], function (require, exports, hash_1, uri_1, iconRegistry_1, theme_1, themables_1, terminal_1, terminalColorRegistry_1, dom_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getColorClass = getColorClass;
    exports.getStandardColors = getStandardColors;
    exports.createColorStyleElement = createColorStyleElement;
    exports.getColorStyleContent = getColorStyleContent;
    exports.getUriClasses = getUriClasses;
    exports.getIconId = getIconId;
    function getColorClass(terminalOrColorKey) {
        let color = undefined;
        if (typeof terminalOrColorKey === 'string') {
            color = terminalOrColorKey;
        }
        else if (terminalOrColorKey.color) {
            color = terminalOrColorKey.color.replace(/\./g, '_');
        }
        else if (themables_1.ThemeIcon.isThemeIcon(terminalOrColorKey.icon) && terminalOrColorKey.icon.color) {
            color = terminalOrColorKey.icon.color.id.replace(/\./g, '_');
        }
        if (color) {
            return `terminal-icon-${color.replace(/\./g, '_')}`;
        }
        return undefined;
    }
    function getStandardColors(colorTheme) {
        const standardColors = [];
        for (const colorKey in terminalColorRegistry_1.ansiColorMap) {
            const color = colorTheme.getColor(colorKey);
            if (color && !colorKey.toLowerCase().includes('bright')) {
                standardColors.push(colorKey);
            }
        }
        return standardColors;
    }
    function createColorStyleElement(colorTheme) {
        const disposable = new lifecycle_1.DisposableStore();
        const standardColors = getStandardColors(colorTheme);
        const styleElement = (0, dom_1.createStyleSheet)(undefined, undefined, disposable);
        let css = '';
        for (const colorKey of standardColors) {
            const colorClass = getColorClass(colorKey);
            const color = colorTheme.getColor(colorKey);
            if (color) {
                css += (`.monaco-workbench .${colorClass} .codicon:first-child:not(.codicon-split-horizontal):not(.codicon-trashcan):not(.file-icon)` +
                    `{ color: ${color} !important; }`);
            }
        }
        styleElement.textContent = css;
        return disposable;
    }
    function getColorStyleContent(colorTheme, editor) {
        const standardColors = getStandardColors(colorTheme);
        let css = '';
        for (const colorKey of standardColors) {
            const colorClass = getColorClass(colorKey);
            const color = colorTheme.getColor(colorKey);
            if (color) {
                if (editor) {
                    css += (`.monaco-workbench .show-file-icons .predefined-file-icon.terminal-tab.${colorClass}::before,` +
                        `.monaco-workbench .show-file-icons .file-icon.terminal-tab.${colorClass}::before` +
                        `{ color: ${color} !important; }`);
                }
                else {
                    css += (`.monaco-workbench .${colorClass} .codicon:first-child:not(.codicon-split-horizontal):not(.codicon-trashcan):not(.file-icon)` +
                        `{ color: ${color} !important; }`);
                }
            }
        }
        return css;
    }
    function getUriClasses(terminal, colorScheme, extensionContributed) {
        const icon = terminal.icon;
        if (!icon) {
            return undefined;
        }
        const iconClasses = [];
        let uri = undefined;
        if (extensionContributed) {
            if (typeof icon === 'string' && (icon.startsWith('$(') || (0, iconRegistry_1.getIconRegistry)().getIcon(icon))) {
                return iconClasses;
            }
            else if (typeof icon === 'string') {
                uri = uri_1.URI.parse(icon);
            }
        }
        if (icon instanceof uri_1.URI) {
            uri = icon;
        }
        else if (icon instanceof Object && 'light' in icon && 'dark' in icon) {
            uri = colorScheme === theme_1.ColorScheme.LIGHT ? icon.light : icon.dark;
        }
        if (uri instanceof uri_1.URI) {
            const uriIconKey = (0, hash_1.hash)(uri.path).toString(36);
            const className = `terminal-uri-icon-${uriIconKey}`;
            iconClasses.push(className);
            iconClasses.push(`terminal-uri-icon`);
        }
        return iconClasses;
    }
    function getIconId(accessor, terminal) {
        if (!terminal.icon || (terminal.icon instanceof Object && !('id' in terminal.icon))) {
            return accessor.get(terminal_1.ITerminalProfileResolverService).getDefaultIcon().id;
        }
        return typeof terminal.icon === 'string' ? terminal.icon : terminal.icon.id;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxJY29uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsSWNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsc0NBYUM7SUFFRCw4Q0FVQztJQUVELDBEQWlCQztJQUVELG9EQXNCQztJQUVELHNDQTRCQztJQUVELDhCQUtDO0lBekdELFNBQWdCLGFBQWEsQ0FBQyxrQkFBNkY7UUFDMUgsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDO1FBQ3RCLElBQUksT0FBTyxrQkFBa0IsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM1QyxLQUFLLEdBQUcsa0JBQWtCLENBQUM7UUFDNUIsQ0FBQzthQUFNLElBQUksa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDckMsS0FBSyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELENBQUM7YUFBTSxJQUFJLHFCQUFTLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM1RixLQUFLLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0QsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNYLE9BQU8saUJBQWlCLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDckQsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxTQUFnQixpQkFB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