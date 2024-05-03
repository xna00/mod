/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResolvedKeybindingItem = void 0;
    exports.toEmptyArrayIfContainsNull = toEmptyArrayIfContainsNull;
    class ResolvedKeybindingItem {
        constructor(resolvedKeybinding, command, commandArgs, when, isDefault, extensionId, isBuiltinExtension) {
            this._resolvedKeybindingItemBrand = undefined;
            this.resolvedKeybinding = resolvedKeybinding;
            this.chords = resolvedKeybinding ? toEmptyArrayIfContainsNull(resolvedKeybinding.getDispatchChords()) : [];
            if (resolvedKeybinding && this.chords.length === 0) {
                // handle possible single modifier chord keybindings
                this.chords = toEmptyArrayIfContainsNull(resolvedKeybinding.getSingleModifierDispatchChords());
            }
            this.bubble = (command ? command.charCodeAt(0) === 94 /* CharCode.Caret */ : false);
            this.command = this.bubble ? command.substr(1) : command;
            this.commandArgs = commandArgs;
            this.when = when;
            this.isDefault = isDefault;
            this.extensionId = extensionId;
            this.isBuiltinExtension = isBuiltinExtension;
        }
    }
    exports.ResolvedKeybindingItem = ResolvedKeybindingItem;
    function toEmptyArrayIfContainsNull(arr) {
        const result = [];
        for (let i = 0, len = arr.length; i < len; i++) {
            const element = arr[i];
            if (!element) {
                return [];
            }
            result.push(element);
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZWRLZXliaW5kaW5nSXRlbS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy9jb21tb24vcmVzb2x2ZWRLZXliaW5kaW5nSXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQ2hHLGdFQVVDO0lBeENELE1BQWEsc0JBQXNCO1FBYWxDLFlBQVksa0JBQWtELEVBQUUsT0FBc0IsRUFBRSxXQUFnQixFQUFFLElBQXNDLEVBQUUsU0FBa0IsRUFBRSxXQUEwQixFQUFFLGtCQUEyQjtZQVo3TixpQ0FBNEIsR0FBUyxTQUFTLENBQUM7WUFhOUMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO1lBQzdDLElBQUksQ0FBQyxNQUFNLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzNHLElBQUksa0JBQWtCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELG9EQUFvRDtnQkFDcEQsSUFBSSxDQUFDLE1BQU0sR0FBRywwQkFBMEIsQ0FBQyxrQkFBa0IsQ0FBQywrQkFBK0IsRUFBRSxDQUFDLENBQUM7WUFDaEcsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLDRCQUFtQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUMxRCxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztZQUMvQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztZQUMvQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7UUFDOUMsQ0FBQztLQUNEO0lBNUJELHdEQTRCQztJQUVELFNBQWdCLDBCQUEwQixDQUFJLEdBQWlCO1FBQzlELE1BQU0sTUFBTSxHQUFRLEVBQUUsQ0FBQztRQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEQsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUMifQ==