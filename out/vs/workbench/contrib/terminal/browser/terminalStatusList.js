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
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/base/browser/window"], function (require, exports, codicons_1, event_1, lifecycle_1, severity_1, configuration_1, colorRegistry_1, iconRegistry_1, themables_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalStatusList = exports.TerminalStatus = void 0;
    exports.getColorForSeverity = getColorForSeverity;
    /**
     * The set of _internal_ terminal statuses, other components building on the terminal should put
     * their statuses within their component.
     */
    var TerminalStatus;
    (function (TerminalStatus) {
        TerminalStatus["Bell"] = "bell";
        TerminalStatus["Disconnected"] = "disconnected";
        TerminalStatus["RelaunchNeeded"] = "relaunch-needed";
        TerminalStatus["EnvironmentVariableInfoChangesActive"] = "env-var-info-changes-active";
        TerminalStatus["ShellIntegrationAttentionNeeded"] = "shell-integration-attention-needed";
    })(TerminalStatus || (exports.TerminalStatus = TerminalStatus = {}));
    let TerminalStatusList = class TerminalStatusList extends lifecycle_1.Disposable {
        get onDidAddStatus() { return this._onDidAddStatus.event; }
        get onDidRemoveStatus() { return this._onDidRemoveStatus.event; }
        get onDidChangePrimaryStatus() { return this._onDidChangePrimaryStatus.event; }
        constructor(_configurationService) {
            super();
            this._configurationService = _configurationService;
            this._statuses = new Map();
            this._statusTimeouts = new Map();
            this._onDidAddStatus = this._register(new event_1.Emitter());
            this._onDidRemoveStatus = this._register(new event_1.Emitter());
            this._onDidChangePrimaryStatus = this._register(new event_1.Emitter());
        }
        get primary() {
            let result;
            for (const s of this._statuses.values()) {
                if (!result || s.severity >= result.severity) {
                    if (s.icon || !result?.icon) {
                        result = s;
                    }
                }
            }
            return result;
        }
        get statuses() { return Array.from(this._statuses.values()); }
        add(status, duration) {
            status = this._applyAnimationSetting(status);
            const outTimeout = this._statusTimeouts.get(status.id);
            if (outTimeout) {
                window_1.mainWindow.clearTimeout(outTimeout);
                this._statusTimeouts.delete(status.id);
            }
            if (duration && duration > 0) {
                const timeout = window_1.mainWindow.setTimeout(() => this.remove(status), duration);
                this._statusTimeouts.set(status.id, timeout);
            }
            const existingStatus = this._statuses.get(status.id);
            if (existingStatus && existingStatus !== status) {
                this._onDidRemoveStatus.fire(existingStatus);
                this._statuses.delete(existingStatus.id);
            }
            if (!this._statuses.has(status.id)) {
                const oldPrimary = this.primary;
                this._statuses.set(status.id, status);
                this._onDidAddStatus.fire(status);
                const newPrimary = this.primary;
                if (oldPrimary !== newPrimary) {
                    this._onDidChangePrimaryStatus.fire(newPrimary);
                }
            }
        }
        remove(statusOrId) {
            const status = typeof statusOrId === 'string' ? this._statuses.get(statusOrId) : statusOrId;
            // Verify the status is the same as the one passed in
            if (status && this._statuses.get(status.id)) {
                const wasPrimary = this.primary?.id === status.id;
                this._statuses.delete(status.id);
                this._onDidRemoveStatus.fire(status);
                if (wasPrimary) {
                    this._onDidChangePrimaryStatus.fire(this.primary);
                }
            }
        }
        toggle(status, value) {
            if (value) {
                this.add(status);
            }
            else {
                this.remove(status);
            }
        }
        _applyAnimationSetting(status) {
            if (!status.icon || themables_1.ThemeIcon.getModifier(status.icon) !== 'spin' || this._configurationService.getValue("terminal.integrated.tabs.enableAnimation" /* TerminalSettingId.TabsEnableAnimation */)) {
                return status;
            }
            let icon;
            // Loading without animation is just a curved line that doesn't mean anything
            if (status.icon.id === iconRegistry_1.spinningLoading.id) {
                icon = codicons_1.Codicon.play;
            }
            else {
                icon = themables_1.ThemeIcon.modify(status.icon, undefined);
            }
            // Clone the status when changing the icon so that setting changes are applied without a
            // reload being needed
            return {
                ...status,
                icon
            };
        }
    };
    exports.TerminalStatusList = TerminalStatusList;
    exports.TerminalStatusList = TerminalStatusList = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TerminalStatusList);
    function getColorForSeverity(severity) {
        switch (severity) {
            case severity_1.default.Error:
                return colorRegistry_1.listErrorForeground;
            case severity_1.default.Warning:
                return colorRegistry_1.listWarningForeground;
            default:
                return '';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGF0dXNMaXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsU3RhdHVzTGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzSmhHLGtEQVNDO0lBakpEOzs7T0FHRztJQUNILElBQWtCLGNBTWpCO0lBTkQsV0FBa0IsY0FBYztRQUMvQiwrQkFBYSxDQUFBO1FBQ2IsK0NBQTZCLENBQUE7UUFDN0Isb0RBQWtDLENBQUE7UUFDbEMsc0ZBQW9FLENBQUE7UUFDcEUsd0ZBQXNFLENBQUE7SUFDdkUsQ0FBQyxFQU5pQixjQUFjLDhCQUFkLGNBQWMsUUFNL0I7SUF5Qk0sSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUtqRCxJQUFJLGNBQWMsS0FBNkIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFbkYsSUFBSSxpQkFBaUIsS0FBNkIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUV6RixJQUFJLHdCQUF3QixLQUF5QyxPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRW5ILFlBQ3dCLHFCQUE2RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUZnQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBWHBFLGNBQVMsR0FBaUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNwRCxvQkFBZSxHQUF3QixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRWpELG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUIsQ0FBQyxDQUFDO1lBRWpFLHVC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