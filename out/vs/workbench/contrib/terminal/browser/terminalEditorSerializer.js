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
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalInputSerializer = void 0;
    let TerminalInputSerializer = class TerminalInputSerializer {
        constructor(_terminalEditorService) {
            this._terminalEditorService = _terminalEditorService;
        }
        canSerialize(editorInput) {
            return typeof editorInput.terminalInstance?.persistentProcessId === 'number' && editorInput.terminalInstance.shouldPersist;
        }
        serialize(editorInput) {
            if (!this.canSerialize(editorInput)) {
                return;
            }
            return JSON.stringify(this._toJson(editorInput.terminalInstance));
        }
        deserialize(instantiationService, serializedEditorInput) {
            const terminalInstance = JSON.parse(serializedEditorInput);
            return this._terminalEditorService.reviveInput(terminalInstance);
        }
        _toJson(instance) {
            return {
                id: instance.persistentProcessId,
                pid: instance.processId || 0,
                title: instance.title,
                titleSource: instance.titleSource,
                cwd: '',
                icon: instance.icon,
                color: instance.color,
                hasChildProcesses: instance.hasChildProcesses,
                isFeatureTerminal: instance.shellLaunchConfig.isFeatureTerminal,
                hideFromUser: instance.shellLaunchConfig.hideFromUser,
                reconnectionProperties: instance.shellLaunchConfig.reconnectionProperties,
                shellIntegrationNonce: instance.shellIntegrationNonce
            };
        }
    };
    exports.TerminalInputSerializer = TerminalInputSerializer;
    exports.TerminalInputSerializer = TerminalInputSerializer = __decorate([
        __param(0, terminal_1.ITerminalEditorService)
    ], TerminalInputSerializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFZGl0b3JTZXJpYWxpemVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsRWRpdG9yU2VyaWFsaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFDbkMsWUFDMEMsc0JBQThDO1lBQTlDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7UUFDcEYsQ0FBQztRQUVFLFlBQVksQ0FBQyxXQUFnQztZQUNuRCxPQUFPLE9BQU8sV0FBVyxDQUFDLGdCQUFnQixFQUFFLG1CQUFtQixLQUFLLFFBQVEsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDO1FBQzVILENBQUM7UUFFTSxTQUFTLENBQUMsV0FBZ0M7WUFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDckMsT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFTSxXQUFXLENBQUMsb0JBQTJDLEVBQUUscUJBQTZCO1lBQzVGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQzNELE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFTyxPQUFPLENBQUMsUUFBMkI7WUFDMUMsT0FBTztnQkFDTixFQUFFLEVBQUUsUUFBUSxDQUFDLG1CQUFvQjtnQkFDakMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxTQUFTLElBQUksQ0FBQztnQkFDNUIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVc7Z0JBQ2pDLEdBQUcsRUFBRSxFQUFFO2dCQUNQLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtnQkFDbkIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixpQkFBaUIsRUFBRSxRQUFRLENBQUMsaUJBQWlCO2dCQUM3QyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCO2dCQUMvRCxZQUFZLEVBQUUsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFlBQVk7Z0JBQ3JELHNCQUFzQixFQUFFLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0I7Z0JBQ3pFLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxxQkFBcUI7YUFDckQsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFBO0lBckNZLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBRWpDLFdBQUEsaUNBQXNCLENBQUE7T0FGWix1QkFBdUIsQ0FxQ25DIn0=