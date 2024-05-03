/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IUpdateService = exports.State = exports.DisablementReason = exports.UpdateType = exports.StateType = void 0;
    /**
     * Updates are run as a state machine:
     *
     *      Uninitialized
     *           ↓
     *          Idle
     *          ↓  ↑
     *   Checking for Updates  →  Available for Download
     *         ↓
     *     Downloading  →   Ready
     *         ↓               ↑
     *     Downloaded   →  Updating
     *
     * Available: There is an update available for download (linux).
     * Ready: Code will be updated as soon as it restarts (win32, darwin).
     * Downloaded: There is an update ready to be installed in the background (win32).
     */
    var StateType;
    (function (StateType) {
        StateType["Uninitialized"] = "uninitialized";
        StateType["Idle"] = "idle";
        StateType["Disabled"] = "disabled";
        StateType["CheckingForUpdates"] = "checking for updates";
        StateType["AvailableForDownload"] = "available for download";
        StateType["Downloading"] = "downloading";
        StateType["Downloaded"] = "downloaded";
        StateType["Updating"] = "updating";
        StateType["Ready"] = "ready";
    })(StateType || (exports.StateType = StateType = {}));
    var UpdateType;
    (function (UpdateType) {
        UpdateType[UpdateType["Setup"] = 0] = "Setup";
        UpdateType[UpdateType["Archive"] = 1] = "Archive";
        UpdateType[UpdateType["Snap"] = 2] = "Snap";
    })(UpdateType || (exports.UpdateType = UpdateType = {}));
    var DisablementReason;
    (function (DisablementReason) {
        DisablementReason[DisablementReason["NotBuilt"] = 0] = "NotBuilt";
        DisablementReason[DisablementReason["DisabledByEnvironment"] = 1] = "DisabledByEnvironment";
        DisablementReason[DisablementReason["ManuallyDisabled"] = 2] = "ManuallyDisabled";
        DisablementReason[DisablementReason["MissingConfiguration"] = 3] = "MissingConfiguration";
        DisablementReason[DisablementReason["InvalidConfiguration"] = 4] = "InvalidConfiguration";
        DisablementReason[DisablementReason["RunningAsAdmin"] = 5] = "RunningAsAdmin";
    })(DisablementReason || (exports.DisablementReason = DisablementReason = {}));
    exports.State = {
        Uninitialized: { type: "uninitialized" /* StateType.Uninitialized */ },
        Disabled: (reason) => ({ type: "disabled" /* StateType.Disabled */, reason }),
        Idle: (updateType, error) => ({ type: "idle" /* StateType.Idle */, updateType, error }),
        CheckingForUpdates: (explicit) => ({ type: "checking for updates" /* StateType.CheckingForUpdates */, explicit }),
        AvailableForDownload: (update) => ({ type: "available for download" /* StateType.AvailableForDownload */, update }),
        Downloading: { type: "downloading" /* StateType.Downloading */ },
        Downloaded: (update) => ({ type: "downloaded" /* StateType.Downloaded */, update }),
        Updating: (update) => ({ type: "updating" /* StateType.Updating */, update }),
        Ready: (update) => ({ type: "ready" /* StateType.Ready */, update }),
    };
    exports.IUpdateService = (0, instantiation_1.createDecorator)('updateService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91cGRhdGUvY29tbW9uL3VwZGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEc7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFFSCxJQUFrQixTQVVqQjtJQVZELFdBQWtCLFNBQVM7UUFDMUIsNENBQStCLENBQUE7UUFDL0IsMEJBQWEsQ0FBQTtRQUNiLGtDQUFxQixDQUFBO1FBQ3JCLHdEQUEyQyxDQUFBO1FBQzNDLDREQUErQyxDQUFBO1FBQy9DLHdDQUEyQixDQUFBO1FBQzNCLHNDQUF5QixDQUFBO1FBQ3pCLGtDQUFxQixDQUFBO1FBQ3JCLDRCQUFlLENBQUE7SUFDaEIsQ0FBQyxFQVZpQixTQUFTLHlCQUFULFNBQVMsUUFVMUI7SUFFRCxJQUFrQixVQUlqQjtJQUpELFdBQWtCLFVBQVU7UUFDM0IsNkNBQUssQ0FBQTtRQUNMLGlEQUFPLENBQUE7UUFDUCwyQ0FBSSxDQUFBO0lBQ0wsQ0FBQyxFQUppQixVQUFVLDBCQUFWLFVBQVUsUUFJM0I7SUFFRCxJQUFrQixpQkFPakI7SUFQRCxXQUFrQixpQkFBaUI7UUFDbEMsaUVBQVEsQ0FBQTtRQUNSLDJGQUFxQixDQUFBO1FBQ3JCLGlGQUFnQixDQUFBO1FBQ2hCLHlGQUFvQixDQUFBO1FBQ3BCLHlGQUFvQixDQUFBO1FBQ3BCLDZFQUFjLENBQUE7SUFDZixDQUFDLEVBUGlCLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBT2xDO0lBY1ksUUFBQSxLQUFLLEdBQUc7UUFDcEIsYUFBYSxFQUFFLEVBQUUsSUFBSSwrQ0FBeUIsRUFBbUI7UUFDakUsUUFBUSxFQUFFLENBQUMsTUFBeUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUNBQW9CLEVBQUUsTUFBTSxFQUFFLENBQWE7UUFDM0YsSUFBSSxFQUFFLENBQUMsVUFBc0IsRUFBRSxLQUFjLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLDZCQUFnQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBUztRQUN2RyxrQkFBa0IsRUFBRSxDQUFDLFFBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLDJEQUE4QixFQUFFLFFBQVEsRUFBeUIsQ0FBQTtRQUNuSCxvQkFBb0IsRUFBRSxDQUFDLE1BQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksK0RBQWdDLEVBQUUsTUFBTSxFQUEyQixDQUFBO1FBQ3JILFdBQVcsRUFBRSxFQUFFLElBQUksMkNBQXVCLEVBQWlCO1FBQzNELFVBQVUsRUFBRSxDQUFDLE1BQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkseUNBQXNCLEVBQUUsTUFBTSxFQUFpQixDQUFBO1FBQ3ZGLFFBQVEsRUFBRSxDQUFDLE1BQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUkscUNBQW9CLEVBQUUsTUFBTSxFQUFlLENBQUE7UUFDakYsS0FBSyxFQUFFLENBQUMsTUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSwrQkFBaUIsRUFBRSxNQUFNLEVBQVksQ0FBQTtLQUN4RSxDQUFDO0lBU1csUUFBQSxjQUFjLEdBQUcsSUFBQSwrQkFBZSxFQUFpQixlQUFlLENBQUMsQ0FBQyJ9