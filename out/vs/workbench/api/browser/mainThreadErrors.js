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
define(["require", "exports", "vs/base/common/errors", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol"], function (require, exports, errors_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadErrors = void 0;
    let MainThreadErrors = class MainThreadErrors {
        dispose() {
            //
        }
        $onUnexpectedError(err) {
            if (err && err.$isError) {
                const { name, message, stack } = err;
                err = err.noTelemetry ? new errors_1.ErrorNoTelemetry() : new Error();
                err.message = message;
                err.name = name;
                err.stack = stack;
            }
            (0, errors_1.onUnexpectedError)(err);
        }
    };
    exports.MainThreadErrors = MainThreadErrors;
    exports.MainThreadErrors = MainThreadErrors = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadErrors)
    ], MainThreadErrors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVycm9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRFcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBT3pGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBRTVCLE9BQU87WUFDTixFQUFFO1FBQ0gsQ0FBQztRQUVELGtCQUFrQixDQUFDLEdBQTBCO1lBQzVDLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDO2dCQUNyQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSx5QkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUM3RCxHQUFHLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztnQkFDdEIsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLEdBQUcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLENBQUM7WUFDRCxJQUFBLDBCQUFpQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7S0FDRCxDQUFBO0lBaEJZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBRDVCLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztPQUN0QyxnQkFBZ0IsQ0FnQjVCIn0=