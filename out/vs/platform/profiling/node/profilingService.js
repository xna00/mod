/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uuid"], function (require, exports, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InspectProfilingService = void 0;
    class InspectProfilingService {
        constructor() {
            this._sessions = new Map();
        }
        async startProfiling(options) {
            const prof = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
            const session = await prof.startProfiling({ port: options.port, checkForPaused: true });
            const id = (0, uuid_1.generateUuid)();
            this._sessions.set(id, session);
            return id;
        }
        async stopProfiling(sessionId) {
            const session = this._sessions.get(sessionId);
            if (!session) {
                throw new Error(`UNKNOWN session '${sessionId}'`);
            }
            const result = await session.stop();
            this._sessions.delete(sessionId);
            return result.profile;
        }
    }
    exports.InspectProfilingService = InspectProfilingService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcHJvZmlsaW5nL25vZGUvcHJvZmlsaW5nU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSx1QkFBdUI7UUFBcEM7WUFJa0IsY0FBUyxHQUFHLElBQUksR0FBRyxFQUE0QixDQUFDO1FBbUJsRSxDQUFDO1FBakJBLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBeUI7WUFDN0MsTUFBTSxJQUFJLEdBQUcsc0RBQWEscUJBQXFCLDJCQUFDLENBQUM7WUFDakQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDeEYsTUFBTSxFQUFFLEdBQUcsSUFBQSxtQkFBWSxHQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsU0FBaUI7WUFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUF2QkQsMERBdUJDIn0=