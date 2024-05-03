/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITermOscPt = exports.VSCodeOscProperty = exports.VSCodeOscPt = void 0;
    exports.VSCodeSequence = VSCodeSequence;
    exports.ITermSequence = ITermSequence;
    /**
     * The identifier for the first numeric parameter (`Ps`) for OSC commands used by shell integration.
     */
    var ShellIntegrationOscPs;
    (function (ShellIntegrationOscPs) {
        /**
         * Sequences pioneered by FinalTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["FinalTerm"] = 133] = "FinalTerm";
        /**
         * Sequences pioneered by VS Code. The number is derived from the least significant digit of
         * "VSC" when encoded in hex ("VSC" = 0x56, 0x53, 0x43).
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["VSCode"] = 633] = "VSCode";
        /**
         * Sequences pioneered by iTerm.
         */
        ShellIntegrationOscPs[ShellIntegrationOscPs["ITerm"] = 1337] = "ITerm";
    })(ShellIntegrationOscPs || (ShellIntegrationOscPs = {}));
    /**
     * VS Code-specific shell integration sequences. Some of these are based on common alternatives like
     * those pioneered in FinalTerm. The decision to move to entirely custom sequences was to try to
     * improve reliability and prevent the possibility of applications confusing the terminal.
     */
    var VSCodeOscPt;
    (function (VSCodeOscPt) {
        /**
         * The start of the prompt, this is expected to always appear at the start of a line.
         * Based on FinalTerm's `OSC 133 ; A ST`.
         */
        VSCodeOscPt["PromptStart"] = "A";
        /**
         * The start of a command, ie. where the user inputs their command.
         * Based on FinalTerm's `OSC 133 ; B ST`.
         */
        VSCodeOscPt["CommandStart"] = "B";
        /**
         * Sent just before the command output begins.
         * Based on FinalTerm's `OSC 133 ; C ST`.
         */
        VSCodeOscPt["CommandExecuted"] = "C";
        /**
         * Sent just after a command has finished. The exit code is optional, when not specified it
         * means no command was run (ie. enter on empty prompt or ctrl+c).
         * Based on FinalTerm's `OSC 133 ; D [; <ExitCode>] ST`.
         */
        VSCodeOscPt["CommandFinished"] = "D";
        /**
         * Explicitly set the command line. This helps workaround problems with conpty not having a
         * passthrough mode by providing an option on Windows to send the command that was run. With
         * this sequence there's no need for the guessing based on the unreliable cursor positions that
         * would otherwise be required.
         */
        VSCodeOscPt["CommandLine"] = "E";
        /**
         * Similar to prompt start but for line continuations.
         */
        VSCodeOscPt["ContinuationStart"] = "F";
        /**
         * Similar to command start but for line continuations.
         */
        VSCodeOscPt["ContinuationEnd"] = "G";
        /**
         * The start of the right prompt.
         */
        VSCodeOscPt["RightPromptStart"] = "H";
        /**
         * The end of the right prompt.
         */
        VSCodeOscPt["RightPromptEnd"] = "I";
        /**
         * Set an arbitrary property: `OSC 633 ; P ; <Property>=<Value> ST`, only known properties will
         * be handled.
         */
        VSCodeOscPt["Property"] = "P";
    })(VSCodeOscPt || (exports.VSCodeOscPt = VSCodeOscPt = {}));
    var VSCodeOscProperty;
    (function (VSCodeOscProperty) {
        VSCodeOscProperty["Task"] = "Task";
        VSCodeOscProperty["Cwd"] = "Cwd";
    })(VSCodeOscProperty || (exports.VSCodeOscProperty = VSCodeOscProperty = {}));
    /**
     * ITerm sequences
     */
    var ITermOscPt;
    (function (ITermOscPt) {
        /**
         * Based on ITerm's `OSC 1337 ; SetMark` sets a mark on the scrollbar
         */
        ITermOscPt["SetMark"] = "SetMark";
    })(ITermOscPt || (exports.ITermOscPt = ITermOscPt = {}));
    function VSCodeSequence(osc, data) {
        return oscSequence(633 /* ShellIntegrationOscPs.VSCode */, osc, data);
    }
    function ITermSequence(osc, data) {
        return oscSequence(1337 /* ShellIntegrationOscPs.ITerm */, osc, data);
    }
    function oscSequence(ps, pt, data) {
        let result = `\x1b]${ps};${pt}`;
        if (data) {
            result += `;${data}`;
        }
        result += `\x07`;
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFc2NhcGVTZXF1ZW5jZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2Jyb3dzZXIvdGVybWluYWxFc2NhcGVTZXF1ZW5jZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0doRyx3Q0FFQztJQUVELHNDQUVDO0lBMUdEOztPQUVHO0lBQ0gsSUFBVyxxQkFjVjtJQWRELFdBQVcscUJBQXFCO1FBQy9COztXQUVHO1FBQ0gsNkVBQWUsQ0FBQTtRQUNmOzs7V0FHRztRQUNILHVFQUFZLENBQUE7UUFDWjs7V0FFRztRQUNILHNFQUFZLENBQUE7SUFDYixDQUFDLEVBZFUscUJBQXFCLEtBQXJCLHFCQUFxQixRQWMvQjtJQUVEOzs7O09BSUc7SUFDSCxJQUFrQixXQTJEakI7SUEzREQsV0FBa0IsV0FBVztRQUM1Qjs7O1dBR0c7UUFDSCxnQ0FBaUIsQ0FBQTtRQUVqQjs7O1dBR0c7UUFDSCxpQ0FBa0IsQ0FBQTtRQUVsQjs7O1dBR0c7UUFDSCxvQ0FBcUIsQ0FBQTtRQUVyQjs7OztXQUlHO1FBQ0gsb0NBQXFCLENBQUE7UUFFckI7Ozs7O1dBS0c7UUFDSCxnQ0FBaUIsQ0FBQTtRQUVqQjs7V0FFRztRQUNILHNDQUF1QixDQUFBO1FBRXZCOztXQUVHO1FBQ0gsb0NBQXFCLENBQUE7UUFFckI7O1dBRUc7UUFDSCxxQ0FBc0IsQ0FBQTtRQUV0Qjs7V0FFRztRQUNILG1DQUFvQixDQUFBO1FBRXBCOzs7V0FHRztRQUNILDZCQUFjLENBQUE7SUFDZixDQUFDLEVBM0RpQixXQUFXLDJCQUFYLFdBQVcsUUEyRDVCO0lBRUQsSUFBa0IsaUJBR2pCO0lBSEQsV0FBa0IsaUJBQWlCO1FBQ2xDLGtDQUFhLENBQUE7UUFDYixnQ0FBVyxDQUFBO0lBQ1osQ0FBQyxFQUhpQixpQkFBaUIsaUNBQWpCLGlCQUFpQixRQUdsQztJQUVEOztPQUVHO0lBQ0gsSUFBa0IsVUFLakI7SUFMRCxXQUFrQixVQUFVO1FBQzNCOztXQUVHO1FBQ0gsaUNBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQUxpQixVQUFVLDBCQUFWLFVBQVUsUUFLM0I7SUFFRCxTQUFnQixjQUFjLENBQUMsR0FBZ0IsRUFBRSxJQUFpQztRQUNqRixPQUFPLFdBQVcseUNBQStCLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsU0FBZ0IsYUFBYSxDQUFDLEdBQWUsRUFBRSxJQUFhO1FBQzNELE9BQU8sV0FBVyx5Q0FBOEIsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxTQUFTLFdBQVcsQ0FBQyxFQUFVLEVBQUUsRUFBVSxFQUFFLElBQWE7UUFDekQsSUFBSSxNQUFNLEdBQUcsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7UUFDaEMsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNWLE1BQU0sSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFDRCxNQUFNLElBQUksTUFBTSxDQUFDO1FBQ2pCLE9BQU8sTUFBTSxDQUFDO0lBRWYsQ0FBQyJ9