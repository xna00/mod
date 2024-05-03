/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keybindings", "vs/base/common/platform", "vs/platform/commands/common/commands", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/base/common/linkedList"], function (require, exports, keybindings_1, platform_1, commands_1, platform_2, lifecycle_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = exports.KeybindingsRegistry = exports.KeybindingWeight = void 0;
    var KeybindingWeight;
    (function (KeybindingWeight) {
        KeybindingWeight[KeybindingWeight["EditorCore"] = 0] = "EditorCore";
        KeybindingWeight[KeybindingWeight["EditorContrib"] = 100] = "EditorContrib";
        KeybindingWeight[KeybindingWeight["WorkbenchContrib"] = 200] = "WorkbenchContrib";
        KeybindingWeight[KeybindingWeight["BuiltinExtension"] = 300] = "BuiltinExtension";
        KeybindingWeight[KeybindingWeight["ExternalExtension"] = 400] = "ExternalExtension";
    })(KeybindingWeight || (exports.KeybindingWeight = KeybindingWeight = {}));
    /**
     * Stores all built-in and extension-provided keybindings (but not ones that user defines themselves)
     */
    class KeybindingsRegistryImpl {
        constructor() {
            this._coreKeybindings = new linkedList_1.LinkedList();
            this._extensionKeybindings = [];
            this._cachedMergedKeybindings = null;
        }
        /**
         * Take current platform into account and reduce to primary & secondary.
         */
        static bindToCurrentPlatform(kb) {
            if (platform_1.OS === 1 /* OperatingSystem.Windows */) {
                if (kb && kb.win) {
                    return kb.win;
                }
            }
            else if (platform_1.OS === 2 /* OperatingSystem.Macintosh */) {
                if (kb && kb.mac) {
                    return kb.mac;
                }
            }
            else {
                if (kb && kb.linux) {
                    return kb.linux;
                }
            }
            return kb;
        }
        registerKeybindingRule(rule) {
            const actualKb = KeybindingsRegistryImpl.bindToCurrentPlatform(rule);
            const result = new lifecycle_1.DisposableStore();
            if (actualKb && actualKb.primary) {
                const kk = (0, keybindings_1.decodeKeybinding)(actualKb.primary, platform_1.OS);
                if (kk) {
                    result.add(this._registerDefaultKeybinding(kk, rule.id, rule.args, rule.weight, 0, rule.when));
                }
            }
            if (actualKb && Array.isArray(actualKb.secondary)) {
                for (let i = 0, len = actualKb.secondary.length; i < len; i++) {
                    const k = actualKb.secondary[i];
                    const kk = (0, keybindings_1.decodeKeybinding)(k, platform_1.OS);
                    if (kk) {
                        result.add(this._registerDefaultKeybinding(kk, rule.id, rule.args, rule.weight, -i - 1, rule.when));
                    }
                }
            }
            return result;
        }
        setExtensionKeybindings(rules) {
            const result = [];
            let keybindingsLen = 0;
            for (const rule of rules) {
                if (rule.keybinding) {
                    result[keybindingsLen++] = {
                        keybinding: rule.keybinding,
                        command: rule.id,
                        commandArgs: rule.args,
                        when: rule.when,
                        weight1: rule.weight,
                        weight2: 0,
                        extensionId: rule.extensionId || null,
                        isBuiltinExtension: rule.isBuiltinExtension || false
                    };
                }
            }
            this._extensionKeybindings = result;
            this._cachedMergedKeybindings = null;
        }
        registerCommandAndKeybindingRule(desc) {
            return (0, lifecycle_1.combinedDisposable)(this.registerKeybindingRule(desc), commands_1.CommandsRegistry.registerCommand(desc));
        }
        _registerDefaultKeybinding(keybinding, commandId, commandArgs, weight1, weight2, when) {
            const remove = this._coreKeybindings.push({
                keybinding: keybinding,
                command: commandId,
                commandArgs: commandArgs,
                when: when,
                weight1: weight1,
                weight2: weight2,
                extensionId: null,
                isBuiltinExtension: false
            });
            this._cachedMergedKeybindings = null;
            return (0, lifecycle_1.toDisposable)(() => {
                remove();
                this._cachedMergedKeybindings = null;
            });
        }
        getDefaultKeybindings() {
            if (!this._cachedMergedKeybindings) {
                this._cachedMergedKeybindings = Array.from(this._coreKeybindings).concat(this._extensionKeybindings);
                this._cachedMergedKeybindings.sort(sorter);
            }
            return this._cachedMergedKeybindings.slice(0);
        }
    }
    exports.KeybindingsRegistry = new KeybindingsRegistryImpl();
    // Define extension point ids
    exports.Extensions = {
        EditorModes: 'platform.keybindingsRegistry'
    };
    platform_2.Registry.add(exports.Extensions.EditorModes, exports.KeybindingsRegistry);
    function sorter(a, b) {
        if (a.weight1 !== b.weight1) {
            return a.weight1 - b.weight1;
        }
        if (a.command && b.command) {
            if (a.command < b.command) {
                return -1;
            }
            if (a.command > b.command) {
                return 1;
            }
        }
        return a.weight2 - b.weight2;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NSZWdpc3RyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0va2V5YmluZGluZy9jb21tb24va2V5YmluZGluZ3NSZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1RGhHLElBQWtCLGdCQU1qQjtJQU5ELFdBQWtCLGdCQUFnQjtRQUNqQyxtRUFBYyxDQUFBO1FBQ2QsMkVBQW1CLENBQUE7UUFDbkIsaUZBQXNCLENBQUE7UUFDdEIsaUZBQXNCLENBQUE7UUFDdEIsbUZBQXVCLENBQUE7SUFDeEIsQ0FBQyxFQU5pQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQU1qQztJQWNEOztPQUVHO0lBQ0gsTUFBTSx1QkFBdUI7UUFNNUI7WUFDQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSx1QkFBVSxFQUFFLENBQUM7WUFDekMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDO1FBQ3RDLENBQUM7UUFFRDs7V0FFRztRQUNLLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxFQUFnQjtZQUNwRCxJQUFJLGFBQUUsb0NBQTRCLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNsQixPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxhQUFFLHNDQUE4QixFQUFFLENBQUM7Z0JBQzdDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDbEIsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO2dCQUNmLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxFQUFF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