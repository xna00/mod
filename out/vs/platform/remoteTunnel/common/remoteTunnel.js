/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/nls"], function (require, exports, instantiation_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LOGGER_NAME = exports.LOG_ID = exports.CONFIGURATION_KEY_PREVENT_SLEEP = exports.CONFIGURATION_KEY_HOST_NAME = exports.CONFIGURATION_KEY_PREFIX = exports.TunnelStates = exports.INACTIVE_TUNNEL_MODE = exports.IRemoteTunnelService = void 0;
    exports.IRemoteTunnelService = (0, instantiation_1.createDecorator)('IRemoteTunnelService');
    exports.INACTIVE_TUNNEL_MODE = { active: false };
    var TunnelStates;
    (function (TunnelStates) {
        TunnelStates.disconnected = (onTokenFailed) => ({ type: 'disconnected', onTokenFailed });
        TunnelStates.connected = (info, serviceInstallFailed) => ({ type: 'connected', info, serviceInstallFailed });
        TunnelStates.connecting = (progress) => ({ type: 'connecting', progress });
        TunnelStates.uninitialized = { type: 'uninitialized' };
    })(TunnelStates || (exports.TunnelStates = TunnelStates = {}));
    exports.CONFIGURATION_KEY_PREFIX = 'remote.tunnels.access';
    exports.CONFIGURATION_KEY_HOST_NAME = exports.CONFIGURATION_KEY_PREFIX + '.hostNameOverride';
    exports.CONFIGURATION_KEY_PREVENT_SLEEP = exports.CONFIGURATION_KEY_PREFIX + '.preventSleep';
    exports.LOG_ID = 'remoteTunnelService';
    exports.LOGGER_NAME = (0, nls_1.localize)('remoteTunnelLog', "Remote Tunnel Service");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVHVubmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9yZW1vdGVUdW5uZWwvY29tbW9uL3JlbW90ZVR1bm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhbkYsUUFBQSxvQkFBb0IsR0FBRyxJQUFBLCtCQUFlLEVBQXVCLHNCQUFzQixDQUFDLENBQUM7SUE2QnJGLFFBQUEsb0JBQW9CLEdBQXVCLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBTzFFLElBQWlCLFlBQVksQ0FzQjVCO0lBdEJELFdBQWlCLFlBQVk7UUFpQmYseUJBQVksR0FBRyxDQUFDLGFBQW9DLEVBQWdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBQ2pILHNCQUFTLEdBQUcsQ0FBQyxJQUFvQixFQUFFLG9CQUE2QixFQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1FBQ3BJLHVCQUFVLEdBQUcsQ0FBQyxRQUFpQixFQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLDBCQUFhLEdBQWtCLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxDQUFDO0lBRXZFLENBQUMsRUF0QmdCLFlBQVksNEJBQVosWUFBWSxRQXNCNUI7SUFTWSxRQUFBLHdCQUF3QixHQUFHLHVCQUF1QixDQUFDO0lBQ25ELFFBQUEsMkJBQTJCLEdBQUcsZ0NBQXdCLEdBQUcsbUJBQW1CLENBQUM7SUFDN0UsUUFBQSwrQkFBK0IsR0FBRyxnQ0FBd0IsR0FBRyxlQUFlLENBQUM7SUFFN0UsUUFBQSxNQUFNLEdBQUcscUJBQXFCLENBQUM7SUFDL0IsUUFBQSxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyJ9