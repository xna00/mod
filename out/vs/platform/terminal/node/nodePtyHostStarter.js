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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService"], function (require, exports, lifecycle_1, network_1, ipc_cp_1, environment_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodePtyHostStarter = void 0;
    let NodePtyHostStarter = class NodePtyHostStarter extends lifecycle_1.Disposable {
        constructor(_reconnectConstants, _environmentService) {
            super();
            this._reconnectConstants = _reconnectConstants;
            this._environmentService = _environmentService;
        }
        start() {
            const opts = {
                serverName: 'Pty Host',
                args: ['--type=ptyHost', '--logsPath', this._environmentService.logsHome.with({ scheme: network_1.Schemas.file }).fsPath],
                env: {
                    VSCODE_AMD_ENTRYPOINT: 'vs/platform/terminal/node/ptyHostMain',
                    VSCODE_PIPE_LOGGING: 'true',
                    VSCODE_VERBOSE_LOGGING: 'true', // transmit console logs from server to client,
                    VSCODE_RECONNECT_GRACE_TIME: this._reconnectConstants.graceTime,
                    VSCODE_RECONNECT_SHORT_GRACE_TIME: this._reconnectConstants.shortGraceTime,
                    VSCODE_RECONNECT_SCROLLBACK: this._reconnectConstants.scrollback
                }
            };
            const ptyHostDebug = (0, environmentService_1.parsePtyHostDebugPort)(this._environmentService.args, this._environmentService.isBuilt);
            if (ptyHostDebug) {
                if (ptyHostDebug.break && ptyHostDebug.port) {
                    opts.debugBrk = ptyHostDebug.port;
                }
                else if (!ptyHostDebug.break && ptyHostDebug.port) {
                    opts.debug = ptyHostDebug.port;
                }
            }
            const client = new ipc_cp_1.Client(network_1.FileAccess.asFileUri('bootstrap-fork').fsPath, opts);
            const store = new lifecycle_1.DisposableStore();
            store.add(client);
            return {
                client,
                store,
                onDidProcessExit: client.onDidProcessExit
            };
        }
    };
    exports.NodePtyHostStarter = NodePtyHostStarter;
    exports.NodePtyHostStarter = NodePtyHostStarter = __decorate([
        __param(1, environment_1.IEnvironmentService)
    ], NodePtyHostStarter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZVB0eUhvc3RTdGFydGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9ub2RlL25vZGVQdHlIb3N0U3RhcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQUNqRCxZQUNrQixtQkFBd0MsRUFDbkIsbUJBQThDO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSFMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUNuQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQTJCO1FBR3JGLENBQUM7UUFFRCxLQUFLO1lBQ0osTUFBTSxJQUFJLEdBQWdCO2dCQUN6QixVQUFVLEVBQUUsVUFBVTtnQkFDdEIsSUFBSSxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQy9HLEdBQUcsRUFBRTtvQkFDSixxQkFBcUIsRUFBRSx1Q0FBdUM7b0JBQzlELG1CQUFtQixFQUFFLE1BQU07b0JBQzNCLHNCQUFzQixFQUFFLE1BQU0sRUFBRSwrQ0FBK0M7b0JBQy9FLDJCQUEyQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTO29CQUMvRCxpQ0FBaUMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsY0FBYztvQkFDMUUsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVU7aUJBQ2hFO2FBQ0QsQ0FBQztZQUVGLE1BQU0sWUFBWSxHQUFHLElBQUEsMENBQXFCLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxZQUFZLENBQUMsS0FBSyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDckQsSUFBSSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLG9CQUFVLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRS9FLE1BQU0sS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFbEIsT0FBTztnQkFDTixNQUFNO2dCQUNOLEtBQUs7Z0JBQ0wsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjthQUN6QyxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUExQ1ksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFHNUIsV0FBQSxpQ0FBbUIsQ0FBQTtPQUhULGtCQUFrQixDQTBDOUIifQ==