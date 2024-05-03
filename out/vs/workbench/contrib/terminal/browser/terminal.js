/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDataTransfers = exports.LinuxDistro = exports.XtermTerminalConstants = exports.terminalEditorId = exports.TerminalLinkQuickPickEvent = exports.isDetachedTerminalInstance = exports.TerminalConnectionState = exports.Direction = exports.ITerminalInstanceService = exports.ITerminalGroupService = exports.ITerminalEditorService = exports.ITerminalService = void 0;
    exports.ITerminalService = (0, instantiation_1.createDecorator)('terminalService');
    exports.ITerminalEditorService = (0, instantiation_1.createDecorator)('terminalEditorService');
    exports.ITerminalGroupService = (0, instantiation_1.createDecorator)('terminalGroupService');
    exports.ITerminalInstanceService = (0, instantiation_1.createDecorator)('terminalInstanceService');
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
        Direction[Direction["Up"] = 2] = "Up";
        Direction[Direction["Down"] = 3] = "Down";
    })(Direction || (exports.Direction = Direction = {}));
    var TerminalConnectionState;
    (function (TerminalConnectionState) {
        TerminalConnectionState[TerminalConnectionState["Connecting"] = 0] = "Connecting";
        TerminalConnectionState[TerminalConnectionState["Connected"] = 1] = "Connected";
    })(TerminalConnectionState || (exports.TerminalConnectionState = TerminalConnectionState = {}));
    const isDetachedTerminalInstance = (t) => typeof t.instanceId !== 'number';
    exports.isDetachedTerminalInstance = isDetachedTerminalInstance;
    class TerminalLinkQuickPickEvent extends MouseEvent {
    }
    exports.TerminalLinkQuickPickEvent = TerminalLinkQuickPickEvent;
    exports.terminalEditorId = 'terminalEditor';
    var XtermTerminalConstants;
    (function (XtermTerminalConstants) {
        XtermTerminalConstants[XtermTerminalConstants["SearchHighlightLimit"] = 1000] = "SearchHighlightLimit";
    })(XtermTerminalConstants || (exports.XtermTerminalConstants = XtermTerminalConstants = {}));
    var LinuxDistro;
    (function (LinuxDistro) {
        LinuxDistro[LinuxDistro["Unknown"] = 1] = "Unknown";
        LinuxDistro[LinuxDistro["Fedora"] = 2] = "Fedora";
        LinuxDistro[LinuxDistro["Ubuntu"] = 3] = "Ubuntu";
    })(LinuxDistro || (exports.LinuxDistro = LinuxDistro = {}));
    var TerminalDataTransfers;
    (function (TerminalDataTransfers) {
        TerminalDataTransfers["Terminals"] = "Terminals";
    })(TerminalDataTransfers || (exports.TerminalDataTransfers = TerminalDataTransfers = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkJuRixRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsaUJBQWlCLENBQUMsQ0FBQztJQUN4RSxRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsdUJBQXVCLENBQUMsQ0FBQztJQUMxRixRQUFBLHFCQUFxQixHQUFHLElBQUEsK0JBQWUsRUFBd0Isc0JBQXNCLENBQUMsQ0FBQztJQUN2RixRQUFBLHdCQUF3QixHQUFHLElBQUEsK0JBQWUsRUFBMkIseUJBQXlCLENBQUMsQ0FBQztJQThEN0csSUFBa0IsU0FLakI7SUFMRCxXQUFrQixTQUFTO1FBQzFCLHlDQUFRLENBQUE7UUFDUiwyQ0FBUyxDQUFBO1FBQ1QscUNBQU0sQ0FBQTtRQUNOLHlDQUFRLENBQUE7SUFDVCxDQUFDLEVBTGlCLFNBQVMseUJBQVQsU0FBUyxRQUsxQjtJQXFERCxJQUFrQix1QkFHakI7SUFIRCxXQUFrQix1QkFBdUI7UUFDeEMsaUZBQVUsQ0FBQTtRQUNWLCtFQUFTLENBQUE7SUFDVixDQUFDLEVBSGlCLHVCQUF1Qix1Q0FBdkIsdUJBQXVCLFFBR3hDO0lBbUZNLE1BQU0sMEJBQTBCLEdBQUcsQ0FBQyxDQUFnRCxFQUFrQyxFQUFFLENBQUMsT0FBUSxDQUF1QixDQUFDLFVBQVUsS0FBSyxRQUFRLENBQUM7SUFBM0ssUUFBQSwwQkFBMEIsOEJBQWlKO0lBaUh4TCxNQUFhLDBCQUEyQixTQUFRLFVBQVU7S0FFekQ7SUFGRCxnRUFFQztJQXdCWSxRQUFBLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO0lBNm5CakQsSUFBa0Isc0JBRWpCO0lBRkQsV0FBa0Isc0JBQXNCO1FBQ3ZDLHNHQUEyQixDQUFBO0lBQzVCLENBQUMsRUFGaUIsc0JBQXNCLHNDQUF0QixzQkFBc0IsUUFFdkM7SUFpTUQsSUFBa0IsV0FJakI7SUFKRCxXQUFrQixXQUFXO1FBQzVCLG1EQUFXLENBQUE7UUFDWCxpREFBVSxDQUFBO1FBQ1YsaURBQVUsQ0FBQTtJQUNYLENBQUMsRUFKaUIsV0FBVywyQkFBWCxXQUFXLFFBSTVCO0lBRUQsSUFBa0IscUJBRWpCO0lBRkQsV0FBa0IscUJBQXFCO1FBQ3RDLGdEQUF1QixDQUFBO0lBQ3hCLENBQUMsRUFGaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFFdEMifQ==