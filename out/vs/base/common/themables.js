/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons"], function (require, exports, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeIcon = exports.ThemeColor = void 0;
    exports.themeColorFromId = themeColorFromId;
    var ThemeColor;
    (function (ThemeColor) {
        function isThemeColor(obj) {
            return obj && typeof obj === 'object' && typeof obj.id === 'string';
        }
        ThemeColor.isThemeColor = isThemeColor;
    })(ThemeColor || (exports.ThemeColor = ThemeColor = {}));
    function themeColorFromId(id) {
        return { id };
    }
    var ThemeIcon;
    (function (ThemeIcon) {
        ThemeIcon.iconNameSegment = '[A-Za-z0-9]+';
        ThemeIcon.iconNameExpression = '[A-Za-z0-9-]+';
        ThemeIcon.iconModifierExpression = '~[A-Za-z]+';
        ThemeIcon.iconNameCharacter = '[A-Za-z0-9~-]';
        const ThemeIconIdRegex = new RegExp(`^(${ThemeIcon.iconNameExpression})(${ThemeIcon.iconModifierExpression})?$`);
        function asClassNameArray(icon) {
            const match = ThemeIconIdRegex.exec(icon.id);
            if (!match) {
                return asClassNameArray(codicons_1.Codicon.error);
            }
            const [, id, modifier] = match;
            const classNames = ['codicon', 'codicon-' + id];
            if (modifier) {
                classNames.push('codicon-modifier-' + modifier.substring(1));
            }
            return classNames;
        }
        ThemeIcon.asClassNameArray = asClassNameArray;
        function asClassName(icon) {
            return asClassNameArray(icon).join(' ');
        }
        ThemeIcon.asClassName = asClassName;
        function asCSSSelector(icon) {
            return '.' + asClassNameArray(icon).join('.');
        }
        ThemeIcon.asCSSSelector = asCSSSelector;
        function isThemeIcon(obj) {
            return obj && typeof obj === 'object' && typeof obj.id === 'string' && (typeof obj.color === 'undefined' || ThemeColor.isThemeColor(obj.color));
        }
        ThemeIcon.isThemeIcon = isThemeIcon;
        const _regexFromString = new RegExp(`^\\$\\((${ThemeIcon.iconNameExpression}(?:${ThemeIcon.iconModifierExpression})?)\\)$`);
        function fromString(str) {
            const match = _regexFromString.exec(str);
            if (!match) {
                return undefined;
            }
            const [, name] = match;
            return { id: name };
        }
        ThemeIcon.fromString = fromString;
        function fromId(id) {
            return { id };
        }
        ThemeIcon.fromId = fromId;
        function modify(icon, modifier) {
            let id = icon.id;
            const tildeIndex = id.lastIndexOf('~');
            if (tildeIndex !== -1) {
                id = id.substring(0, tildeIndex);
            }
            if (modifier) {
                id = `${id}~${modifier}`;
            }
            return { id };
        }
        ThemeIcon.modify = modify;
        function getModifier(icon) {
            const tildeIndex = icon.id.lastIndexOf('~');
            if (tildeIndex !== -1) {
                return icon.id.substring(tildeIndex + 1);
            }
            return undefined;
        }
        ThemeIcon.getModifier = getModifier;
        function isEqual(ti1, ti2) {
            return ti1.id === ti2.id && ti1.color?.id === ti2.color?.id;
        }
        ThemeIcon.isEqual = isEqual;
    })(ThemeIcon || (exports.ThemeIcon = ThemeIcon = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWFibGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi90aGVtYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyw0Q0FFQztJQVJELElBQWlCLFVBQVUsQ0FJMUI7SUFKRCxXQUFpQixVQUFVO1FBQzFCLFNBQWdCLFlBQVksQ0FBQyxHQUFRO1lBQ3BDLE9BQU8sR0FBRyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxPQUFvQixHQUFJLENBQUMsRUFBRSxLQUFLLFFBQVEsQ0FBQztRQUNuRixDQUFDO1FBRmUsdUJBQVksZUFFM0IsQ0FBQTtJQUNGLENBQUMsRUFKZ0IsVUFBVSwwQkFBVixVQUFVLFFBSTFCO0lBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsRUFBbUI7UUFDbkQsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQVFELElBQWlCLFNBQVMsQ0F3RXpCO0lBeEVELFdBQWlCLFNBQVM7UUFDWix5QkFBZSxHQUFHLGNBQWMsQ0FBQztRQUNqQyw0QkFBa0IsR0FBRyxlQUFlLENBQUM7UUFDckMsZ0NBQXNCLEdBQUcsWUFBWSxDQUFDO1FBQ3RDLDJCQUFpQixHQUFHLGVBQWUsQ0FBQztRQUVqRCxNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssVUFBQSxrQkFBa0IsS0FBSyxVQUFBLHNCQUFzQixLQUFLLENBQUMsQ0FBQztRQUU3RixTQUFnQixnQkFBZ0IsQ0FBQyxJQUFlO1lBQy9DLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sZ0JBQWdCLENBQUMsa0JBQU8sQ0FBQyxLQUFLLENBQUMs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