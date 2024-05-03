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
define(["require", "exports", "vs/workbench/api/common/extHostConsoleForwarder", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService"], function (require, exports, extHostConsoleForwarder_1, extHostInitDataService_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostConsoleForwarder = void 0;
    const MAX_STREAM_BUFFER_LENGTH = 1024 * 1024;
    let ExtHostConsoleForwarder = class ExtHostConsoleForwarder extends extHostConsoleForwarder_1.AbstractExtHostConsoleForwarder {
        constructor(extHostRpc, initData) {
            super(extHostRpc, initData);
            this._isMakingConsoleCall = false;
            this._wrapStream('stderr', 'error');
            this._wrapStream('stdout', 'log');
        }
        _nativeConsoleLogMessage(method, original, args) {
            const stream = method === 'error' || method === 'warn' ? process.stderr : process.stdout;
            this._isMakingConsoleCall = true;
            stream.write(`\n${"START_NATIVE_LOG" /* NativeLogMarkers.Start */}\n`);
            original.apply(console, args);
            stream.write(`\n${"END_NATIVE_LOG" /* NativeLogMarkers.End */}\n`);
            this._isMakingConsoleCall = false;
        }
        /**
         * Wraps process.stderr/stdout.write() so that it is transmitted to the
         * renderer or CLI. It both calls through to the original method as well
         * as to console.log with complete lines so that they're made available
         * to the debugger/CLI.
         */
        _wrapStream(streamName, severity) {
            const stream = process[streamName];
            const original = stream.write;
            let buf = '';
            Object.defineProperty(stream, 'write', {
                set: () => { },
                get: () => (chunk, encoding, callback) => {
                    if (!this._isMakingConsoleCall) {
                        buf += chunk.toString(encoding);
                        const eol = buf.length > MAX_STREAM_BUFFER_LENGTH ? buf.length : buf.lastIndexOf('\n');
                        if (eol !== -1) {
                            console[severity](buf.slice(0, eol));
                            buf = buf.slice(eol + 1);
                        }
                    }
                    original.call(stream, chunk, encoding, callback);
                },
            });
        }
    };
    exports.ExtHostConsoleForwarder = ExtHostConsoleForwarder;
    exports.ExtHostConsoleForwarder = ExtHostConsoleForwarder = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostConsoleForwarder);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbnNvbGVGb3J3YXJkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0Q29uc29sZUZvcndhcmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFPaEcsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBRXRDLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEseURBQStCO1FBSTNFLFlBQ3FCLFVBQThCLEVBQ3pCLFFBQWlDO1lBRTFELEtBQUssQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFOckIseUJBQW9CLEdBQVksS0FBSyxDQUFDO1lBUTdDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFa0Isd0JBQXdCLENBQUMsTUFBbUQsRUFBRSxRQUFrQyxFQUFFLElBQWdCO1lBQ3BKLE1BQU0sTUFBTSxHQUFHLE1BQU0sS0FBSyxPQUFPLElBQUksTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUN6RixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSywrQ0FBc0IsSUFBSSxDQUFDLENBQUM7WUFDOUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBVyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLDJDQUFvQixJQUFJLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1FBQ25DLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNLLFdBQVcsQ0FBQyxVQUErQixFQUFFLFFBQWtDO1lBQ3RGLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBRTlCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUViLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRTtnQkFDdEMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ2QsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsS0FBMEIsRUFBRSxRQUF5QixFQUFFLFFBQWdDLEVBQUUsRUFBRTtvQkFDdEcsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO3dCQUNoQyxHQUFHLElBQUssS0FBYSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDekMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDdkYsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDaEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7NEJBQ3JDLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDMUIsQ0FBQztvQkFDRixDQUFDO29CQUVELFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2xELENBQUM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQW5EWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUtqQyxXQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFdBQUEsZ0RBQXVCLENBQUE7T0FOYix1QkFBdUIsQ0FtRG5DIn0=