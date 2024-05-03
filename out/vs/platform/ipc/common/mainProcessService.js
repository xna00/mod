/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainProcessService = exports.IMainProcessService = void 0;
    exports.IMainProcessService = (0, instantiation_1.createDecorator)('mainProcessService');
    /**
     * An implementation of `IMainProcessService` that leverages `IPCServer`.
     */
    class MainProcessService {
        constructor(server, router) {
            this.server = server;
            this.router = router;
        }
        getChannel(channelName) {
            return this.server.getChannel(channelName, this.router);
        }
        registerChannel(channelName, channel) {
            this.server.registerChannel(channelName, channel);
        }
    }
    exports.MainProcessService = MainProcessService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblByb2Nlc3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9pcGMvY29tbW9uL21haW5Qcm9jZXNzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNbkYsUUFBQSxtQkFBbUIsR0FBRyxJQUFBLCtCQUFlLEVBQXNCLG9CQUFvQixDQUFDLENBQUM7SUFJOUY7O09BRUc7SUFDSCxNQUFhLGtCQUFrQjtRQUk5QixZQUNTLE1BQWlCLEVBQ2pCLE1BQW9CO1lBRHBCLFdBQU0sR0FBTixNQUFNLENBQVc7WUFDakIsV0FBTSxHQUFOLE1BQU0sQ0FBYztRQUN6QixDQUFDO1FBRUwsVUFBVSxDQUFDLFdBQW1CO1lBQzdCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRUQsZUFBZSxDQUFDLFdBQW1CLEVBQUUsT0FBK0I7WUFDbkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ25ELENBQUM7S0FDRDtJQWhCRCxnREFnQkMifQ==