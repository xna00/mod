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
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal", "vs/nls", "vs/base/common/codicons", "vs/base/common/severity", "vs/platform/commands/common/commands", "vs/workbench/services/extensions/common/extensions"], function (require, exports, terminal_1, nls_1, codicons_1, severity_1, commands_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentVariableInfoChangesActive = exports.EnvironmentVariableInfoStale = void 0;
    let EnvironmentVariableInfoStale = class EnvironmentVariableInfoStale {
        constructor(_diff, _terminalId, _collection, _terminalService, _extensionService) {
            this._diff = _diff;
            this._terminalId = _terminalId;
            this._collection = _collection;
            this._terminalService = _terminalService;
            this._extensionService = _extensionService;
            this.requiresAction = true;
        }
        _getInfo(scope) {
            const extSet = new Set();
            addExtensionIdentifiers(extSet, this._diff.added.values());
            addExtensionIdentifiers(extSet, this._diff.removed.values());
            addExtensionIdentifiers(extSet, this._diff.changed.values());
            let message = (0, nls_1.localize)('extensionEnvironmentContributionInfoStale', "The following extensions want to relaunch the terminal to contribute to its environment:");
            message += getMergedDescription(this._collection, scope, this._extensionService, extSet);
            return message;
        }
        _getActions() {
            return [{
                    label: (0, nls_1.localize)('relaunchTerminalLabel', "Relaunch terminal"),
                    run: () => this._terminalService.getInstanceFromId(this._terminalId)?.relaunch(),
                    commandId: "workbench.action.terminal.relaunch" /* TerminalCommandId.Relaunch */
                }];
        }
        getStatus(scope) {
            return {
                id: "relaunch-needed" /* TerminalStatus.RelaunchNeeded */,
                severity: severity_1.default.Warning,
                icon: codicons_1.Codicon.warning,
                tooltip: this._getInfo(scope),
                hoverActions: this._getActions()
            };
        }
    };
    exports.EnvironmentVariableInfoStale = EnvironmentVariableInfoStale;
    exports.EnvironmentVariableInfoStale = EnvironmentVariableInfoStale = __decorate([
        __param(3, terminal_1.ITerminalService),
        __param(4, extensions_1.IExtensionService)
    ], EnvironmentVariableInfoStale);
    let EnvironmentVariableInfoChangesActive = class EnvironmentVariableInfoChangesActive {
        constructor(_collection, _commandService, _extensionService) {
            this._collection = _collection;
            this._commandService = _commandService;
            this._extensionService = _extensionService;
            this.requiresAction = false;
        }
        _getInfo(scope) {
            const extSet = new Set();
            addExtensionIdentifiers(extSet, this._collection.getVariableMap(scope).values());
            let message = (0, nls_1.localize)('extensionEnvironmentContributionInfoActive', "The following extensions have contributed to this terminal's environment:");
            message += getMergedDescription(this._collection, scope, this._extensionService, extSet);
            return message;
        }
        _getActions(scope) {
            return [{
                    label: (0, nls_1.localize)('showEnvironmentContributions', "Show environment contributions"),
                    run: () => this._commandService.executeCommand("workbench.action.terminal.showEnvironmentContributions" /* TerminalCommandId.ShowEnvironmentContributions */, scope),
                    commandId: "workbench.action.terminal.showEnvironmentContributions" /* TerminalCommandId.ShowEnvironmentContributions */
                }];
        }
        getStatus(scope) {
            return {
                id: "env-var-info-changes-active" /* TerminalStatus.EnvironmentVariableInfoChangesActive */,
                severity: severity_1.default.Info,
                tooltip: this._getInfo(scope),
                hoverActions: this._getActions(scope)
            };
        }
    };
    exports.EnvironmentVariableInfoChangesActive = EnvironmentVariableInfoChangesActive;
    exports.EnvironmentVariableInfoChangesActive = EnvironmentVariableInfoChangesActive = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, extensions_1.IExtensionService)
    ], EnvironmentVariableInfoChangesActive);
    function getMergedDescription(collection, scope, extensionService, extSet) {
        const message = ['\n'];
        const globalDescriptions = collection.getDescriptionMap(undefined);
        const workspaceDescriptions = collection.getDescriptionMap(scope);
        for (const ext of extSet) {
            const globalDescription = globalDescriptions.get(ext);
            if (globalDescription) {
                message.push(`\n- \`${getExtensionName(ext, extensionService)}\``);
                message.push(`: ${globalDescription}`);
            }
            const workspaceDescription = workspaceDescriptions.get(ext);
            if (workspaceDescription) {
                // Only show '(workspace)' suffix if there is already a description for the extension.
                const workspaceSuffix = globalDescription ? ` (${(0, nls_1.localize)('ScopedEnvironmentContributionInfo', 'workspace')})` : '';
                message.push(`\n- \`${getExtensionName(ext, extensionService)}${workspaceSuffix}\``);
                message.push(`: ${workspaceDescription}`);
            }
            if (!globalDescription && !workspaceDescription) {
                message.push(`\n- \`${getExtensionName(ext, extensionService)}\``);
            }
        }
        return message.join('');
    }
    function addExtensionIdentifiers(extSet, diff) {
        for (const mutators of diff) {
            for (const mutator of mutators) {
                extSet.add(mutator.extensionIdentifier);
            }
        }
    }
    function getExtensionName(id, extensionService) {
        return extensionService.extensions.find(e => e.id === id)?.displayName || id;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZUluZm8uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvZW52aXJvbm1lbnRWYXJpYWJsZUluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTRCO1FBR3hDLFlBQ2tCLEtBQStDLEVBQy9DLFdBQW1CLEVBQ25CLFdBQWlELEVBQ2hELGdCQUFtRCxFQUNsRCxpQkFBcUQ7WUFKdkQsVUFBSyxHQUFMLEtBQUssQ0FBMEM7WUFDL0MsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDbkIsZ0JBQVcsR0FBWCxXQUFXLENBQXNDO1lBQy9CLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDakMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQVBoRSxtQkFBYyxHQUFHLElBQUksQ0FBQztRQVMvQixDQUFDO1FBRU8sUUFBUSxDQUFDLEtBQTJDO1lBQzNELE1BQU0sTUFBTSxHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ3RDLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzNELHVCQUF1QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzdELHVCQUF1QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBRTdELElBQUksT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLDJDQUEyQyxFQUFFLDBGQUEwRixDQUFDLENBQUM7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