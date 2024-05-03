/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LifecyclePhase = exports.StartupKind = exports.ShutdownReason = exports.ILifecycleService = void 0;
    exports.StartupKindToString = StartupKindToString;
    exports.LifecyclePhaseToString = LifecyclePhaseToString;
    exports.ILifecycleService = (0, instantiation_1.createDecorator)('lifecycleService');
    var ShutdownReason;
    (function (ShutdownReason) {
        /**
         * The window is closed.
         */
        ShutdownReason[ShutdownReason["CLOSE"] = 1] = "CLOSE";
        /**
         * The window closes because the application quits.
         */
        ShutdownReason[ShutdownReason["QUIT"] = 2] = "QUIT";
        /**
         * The window is reloaded.
         */
        ShutdownReason[ShutdownReason["RELOAD"] = 3] = "RELOAD";
        /**
         * The window is loaded into a different workspace context.
         */
        ShutdownReason[ShutdownReason["LOAD"] = 4] = "LOAD";
    })(ShutdownReason || (exports.ShutdownReason = ShutdownReason = {}));
    var StartupKind;
    (function (StartupKind) {
        StartupKind[StartupKind["NewWindow"] = 1] = "NewWindow";
        StartupKind[StartupKind["ReloadedWindow"] = 3] = "ReloadedWindow";
        StartupKind[StartupKind["ReopenedWindow"] = 4] = "ReopenedWindow";
    })(StartupKind || (exports.StartupKind = StartupKind = {}));
    function StartupKindToString(startupKind) {
        switch (startupKind) {
            case 1 /* StartupKind.NewWindow */: return 'NewWindow';
            case 3 /* StartupKind.ReloadedWindow */: return 'ReloadedWindow';
            case 4 /* StartupKind.ReopenedWindow */: return 'ReopenedWindow';
        }
    }
    var LifecyclePhase;
    (function (LifecyclePhase) {
        /**
         * The first phase signals that we are about to startup getting ready.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use `Restored` phase.
         */
        LifecyclePhase[LifecyclePhase["Starting"] = 1] = "Starting";
        /**
         * Services are ready and the window is about to restore its UI state.
         *
         * Note: doing work in this phase blocks an editor from showing to
         * the user, so please rather consider to use `Restored` phase.
         */
        LifecyclePhase[LifecyclePhase["Ready"] = 2] = "Ready";
        /**
         * Views, panels and editors have restored. Editors are given a bit of
         * time to restore their contents.
         */
        LifecyclePhase[LifecyclePhase["Restored"] = 3] = "Restored";
        /**
         * The last phase after views, panels and editors have restored and
         * some time has passed (2-5 seconds).
         */
        LifecyclePhase[LifecyclePhase["Eventually"] = 4] = "Eventually";
    })(LifecyclePhase || (exports.LifecyclePhase = LifecyclePhase = {}));
    function LifecyclePhaseToString(phase) {
        switch (phase) {
            case 1 /* LifecyclePhase.Starting */: return 'Starting';
            case 2 /* LifecyclePhase.Ready */: return 'Ready';
            case 3 /* LifecyclePhase.Restored */: return 'Restored';
            case 4 /* LifecyclePhase.Eventually */: return 'Eventually';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbGlmZWN5Y2xlL2NvbW1vbi9saWZlY3ljbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNEloRyxrREFNQztJQWlDRCx3REFPQztJQXBMWSxRQUFBLGlCQUFpQixHQUFHLElBQUEsK0JBQWUsRUFBb0Isa0JBQWtCLENBQUMsQ0FBQztJQXlHeEYsSUFBa0IsY0FxQmpCO0lBckJELFdBQWtCLGNBQWM7UUFFL0I7O1dBRUc7UUFDSCxxREFBUyxDQUFBO1FBRVQ7O1dBRUc7UUFDSCxtREFBSSxDQUFBO1FBRUo7O1dBRUc7UUFDSCx1REFBTSxDQUFBO1FBRU47O1dBRUc7UUFDSCxtREFBSSxDQUFBO0lBQ0wsQ0FBQyxFQXJCaUIsY0FBYyw4QkFBZCxjQUFjLFFBcUIvQjtJQUVELElBQWtCLFdBSWpCO0lBSkQsV0FBa0IsV0FBVztRQUM1Qix1REFBYSxDQUFBO1FBQ2IsaUVBQWtCLENBQUE7UUFDbEIsaUVBQWtCLENBQUE7SUFDbkIsQ0FBQyxFQUppQixXQUFXLDJCQUFYLFdBQVcsUUFJNUI7SUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxXQUF3QjtRQUMzRCxRQUFRLFdBQVcsRUFBRSxDQUFDO1lBQ3JCLGtDQUEwQixDQUFDLENBQUMsT0FBTyxXQUFXLENBQUM7WUFDL0MsdUNBQStCLENBQUMsQ0FBQyxPQUFPLGdCQUFnQixDQUFDO1lBQ3pELHVDQUErQixDQUFDLENBQUMsT0FBTyxnQkFBZ0IsQ0FBQztRQUMxRCxDQUFDO0lBQ0YsQ0FBQztJQUVELElBQWtCLGNBNkJqQjtJQTdCRCxXQUFrQixjQUFjO1FBRS9COzs7OztXQUtHO1FBQ0gsMkRBQVksQ0FBQTtRQUVaOzs7OztXQUtHO1FBQ0gscURBQVMsQ0FBQTtRQUVUOzs7V0FHRztRQUNILDJEQUFZLENBQUE7UUFFWjs7O1dBR0c7UUFDSCwrREFBYyxDQUFBO0lBQ2YsQ0FBQyxFQTdCaUIsY0FBYyw4QkFBZCxjQUFjLFFBNkIvQjtJQUVELFNBQWdCLHNCQUFzQixDQUFDLEtBQXFCO1FBQzNELFFBQVEsS0FBSyxFQUFFLENBQUM7WUFDZixvQ0FBNEIsQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDO1lBQ2hELGlDQUF5QixDQUFDLENBQUMsT0FBTyxPQUFPLENBQUM7WUFDMUMsb0NBQTRCLENBQUMsQ0FBQyxPQUFPLFVBQVUsQ0FBQztZQUNoRCxzQ0FBOEIsQ0FBQyxDQUFDLE9BQU8sWUFBWSxDQUFDO1FBQ3JELENBQUM7SUFDRixDQUFDIn0=