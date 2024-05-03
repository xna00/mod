/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = exports.ValidationStatus = exports.ValidationState = void 0;
    var ValidationState;
    (function (ValidationState) {
        ValidationState[ValidationState["OK"] = 0] = "OK";
        ValidationState[ValidationState["Info"] = 1] = "Info";
        ValidationState[ValidationState["Warning"] = 2] = "Warning";
        ValidationState[ValidationState["Error"] = 3] = "Error";
        ValidationState[ValidationState["Fatal"] = 4] = "Fatal";
    })(ValidationState || (exports.ValidationState = ValidationState = {}));
    class ValidationStatus {
        constructor() {
            this._state = 0 /* ValidationState.OK */;
        }
        get state() {
            return this._state;
        }
        set state(value) {
            if (value > this._state) {
                this._state = value;
            }
        }
        isOK() {
            return this._state === 0 /* ValidationState.OK */;
        }
        isFatal() {
            return this._state === 4 /* ValidationState.Fatal */;
        }
    }
    exports.ValidationStatus = ValidationStatus;
    class Parser {
        constructor(problemReporter) {
            this._problemReporter = problemReporter;
        }
        reset() {
            this._problemReporter.status.state = 0 /* ValidationState.OK */;
        }
        get problemReporter() {
            return this._problemReporter;
        }
        info(message) {
            this._problemReporter.info(message);
        }
        warn(message) {
            this._problemReporter.warn(message);
        }
        error(message) {
            this._problemReporter.error(message);
        }
        fatal(message) {
            this._problemReporter.fatal(message);
        }
    }
    exports.Parser = Parser;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2Vycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vcGFyc2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsSUFBa0IsZUFNakI7SUFORCxXQUFrQixlQUFlO1FBQ2hDLGlEQUFNLENBQUE7UUFDTixxREFBUSxDQUFBO1FBQ1IsMkRBQVcsQ0FBQTtRQUNYLHVEQUFTLENBQUE7UUFDVCx1REFBUyxDQUFBO0lBQ1YsQ0FBQyxFQU5pQixlQUFlLCtCQUFmLGVBQWUsUUFNaEM7SUFFRCxNQUFhLGdCQUFnQjtRQUc1QjtZQUNDLElBQUksQ0FBQyxNQUFNLDZCQUFxQixDQUFDO1FBQ2xDLENBQUM7UUFFRCxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQVcsS0FBSyxDQUFDLEtBQXNCO1lBQ3RDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDckIsQ0FBQztRQUNGLENBQUM7UUFFTSxJQUFJO1lBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSwrQkFBdUIsQ0FBQztRQUMzQyxDQUFDO1FBRU0sT0FBTztZQUNiLE9BQU8sSUFBSSxDQUFDLE1BQU0sa0NBQTBCLENBQUM7UUFDOUMsQ0FBQztLQUNEO0lBeEJELDRDQXdCQztJQVVELE1BQXNCLE1BQU07UUFJM0IsWUFBWSxlQUFpQztZQUM1QyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1FBQ3pDLENBQUM7UUFFTSxLQUFLO1lBQ1gsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxLQUFLLDZCQUFxQixDQUFDO1FBQ3pELENBQUM7UUFFRCxJQUFXLGVBQWU7WUFDekIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUVNLElBQUksQ0FBQyxPQUFlO1lBQzFCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVNLElBQUksQ0FBQyxPQUFlO1lBQzFCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVNLEtBQUssQ0FBQyxPQUFlO1lBQzNCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVNLEtBQUssQ0FBQyxPQUFlO1lBQzNCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEMsQ0FBQztLQUNEO0lBL0JELHdCQStCQyJ9