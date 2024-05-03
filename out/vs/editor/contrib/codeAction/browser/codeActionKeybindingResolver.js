/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/lazy", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/platform/keybinding/common/keybinding"], function (require, exports, hierarchicalKind_1, lazy_1, codeAction_1, types_1, keybinding_1) {
    "use strict";
    var CodeActionKeybindingResolver_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionKeybindingResolver = void 0;
    let CodeActionKeybindingResolver = class CodeActionKeybindingResolver {
        static { CodeActionKeybindingResolver_1 = this; }
        static { this.codeActionCommands = [
            codeAction_1.refactorCommandId,
            codeAction_1.codeActionCommandId,
            codeAction_1.sourceActionCommandId,
            codeAction_1.organizeImportsCommandId,
            codeAction_1.fixAllCommandId
        ]; }
        constructor(keybindingService) {
            this.keybindingService = keybindingService;
        }
        getResolver() {
            // Lazy since we may not actually ever read the value
            const allCodeActionBindings = new lazy_1.Lazy(() => this.keybindingService.getKeybindings()
                .filter(item => CodeActionKeybindingResolver_1.codeActionCommands.indexOf(item.command) >= 0)
                .filter(item => item.resolvedKeybinding)
                .map((item) => {
                // Special case these commands since they come built-in with VS Code and don't use 'commandArgs'
                let commandArgs = item.commandArgs;
                if (item.command === codeAction_1.organizeImportsCommandId) {
                    commandArgs = { kind: types_1.CodeActionKind.SourceOrganizeImports.value };
                }
                else if (item.command === codeAction_1.fixAllCommandId) {
                    commandArgs = { kind: types_1.CodeActionKind.SourceFixAll.value };
                }
                return {
                    resolvedKeybinding: item.resolvedKeybinding,
                    ...types_1.CodeActionCommandArgs.fromUser(commandArgs, {
                        kind: hierarchicalKind_1.HierarchicalKind.None,
                        apply: "never" /* CodeActionAutoApply.Never */
                    })
                };
            }));
            return (action) => {
                if (action.kind) {
                    const binding = this.bestKeybindingForCodeAction(action, allCodeActionBindings.value);
                    return binding?.resolvedKeybinding;
                }
                return undefined;
            };
        }
        bestKeybindingForCodeAction(action, candidates) {
            if (!action.kind) {
                return undefined;
            }
            const kind = new hierarchicalKind_1.HierarchicalKind(action.kind);
            return candidates
                .filter(candidate => candidate.kind.contains(kind))
                .filter(candidate => {
                if (candidate.preferred) {
                    // If the candidate keybinding only applies to preferred actions, the this action must also be preferred
                    return action.isPreferred;
                }
                return true;
            })
                .reduceRight((currentBest, candidate) => {
                if (!currentBest) {
                    return candidate;
                }
                // Select the more specific binding
                return currentBest.kind.contains(candidate.kind) ? candidate : currentBest;
            }, undefined);
        }
    };
    exports.CodeActionKeybindingResolver = CodeActionKeybindingResolver;
    exports.CodeActionKeybindingResolver = CodeActionKeybindingResolver = CodeActionKeybindingResolver_1 = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], CodeActionKeybindingResolver);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbktleWJpbmRpbmdSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29kZUFjdGlvbi9icm93c2VyL2NvZGVBY3Rpb25LZXliaW5kaW5nUmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNEI7O2lCQUNoQix1QkFBa0IsR0FBc0I7WUFDL0QsOEJBQWlCO1lBQ2pCLGdDQUFtQjtZQUNuQixrQ0FBcUI7WUFDckIscUNBQXdCO1lBQ3hCLDRCQUFlO1NBQ2YsQUFOeUMsQ0FNeEM7UUFFRixZQUNzQyxpQkFBcUM7WUFBckMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtRQUN2RSxDQUFDO1FBRUUsV0FBVztZQUNqQixxREFBcUQ7WUFDckQsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLFdBQUksQ0FBeUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRTtpQkFDMUgsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsOEJBQTRCLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztpQkFDdkMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUErQixFQUFFO2dCQUMxQyxnR0FBZ0c7Z0JBQ2hHLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQ25DLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxxQ0FBd0IsRUFBRSxDQUFDO29CQUMvQyxXQUFXLEdBQUcsRUFBRSxJQUFJLEVBQUUsc0JBQWMsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDcEUsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssNEJBQWUsRUFBRSxDQUFDO29CQUM3QyxXQUFXLEdBQUcsRUFBRSxJQUFJLEVBQUUsc0JBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzNELENBQUM7Z0JBRUQsT0FBTztvQkFDTixrQkFBa0IsRUFBRSxJQUFJLENBQUMsa0JBQW1CO29CQUM1QyxHQUFHLDZCQUFxQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7d0JBQzlDLElBQUksRUFBRSxtQ0FBZ0IsQ0FBQyxJQUFJO3dCQUMzQixLQUFLLHlDQUEyQjtxQkFDaEMsQ0FBQztpQkFDRixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVMLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDakIsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2pCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLEVBQUUscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3RGLE9BQU8sT0FBTyxFQUFFLGtCQUFrQixDQUFDO2dCQUNwQyxDQUFDO2dCQUNELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUMsQ0FBQztRQUNILENBQUM7UUFFTywyQkFBMkIsQ0FDbEMsTUFBa0IsRUFDbEIsVUFBa0Q7WUFFbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sSUFBSSxHQUFHLElBQUksbUNBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRS9DLE9BQU8sVUFBVTtpQkFDZixNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDbEQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNuQixJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDekIsd0dBQXdHO29CQUN4RyxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUM7Z0JBQzNCLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUM7aUJBQ0QsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xCLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELG1DQUFtQztnQkFDbkMsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1lBQzVFLENBQUMsRUFBRSxTQUFvRCxDQUFDLENBQUM7UUFDM0QsQ0FBQzs7SUF0RVcsb0VBQTRCOzJDQUE1Qiw0QkFBNEI7UUFVdEMsV0FBQSwrQkFBa0IsQ0FBQTtPQVZSLDRCQUE0QixDQXVFeEMifQ==