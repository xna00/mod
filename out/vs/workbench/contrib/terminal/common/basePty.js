/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/performance", "vs/base/common/uri"], function (require, exports, event_1, lifecycle_1, performance_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasePty = void 0;
    /**
     * Responsible for establishing and maintaining a connection with an existing terminal process
     * created on the local pty host.
     */
    class BasePty extends lifecycle_1.Disposable {
        constructor(id, shouldPersist) {
            super();
            this.id = id;
            this.shouldPersist = shouldPersist;
            this._properties = {
                cwd: '',
                initialCwd: '',
                fixedDimensions: { cols: undefined, rows: undefined },
                title: '',
                shellType: undefined,
                hasChildProcesses: true,
                resolvedShellLaunchConfig: {},
                overrideDimensions: undefined,
                failedShellIntegrationActivation: false,
                usedShellIntegrationInjection: undefined
            };
            this._lastDimensions = { cols: -1, rows: -1 };
            this._inReplay = false;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReplayComplete = this._register(new event_1.Emitter());
            this.onProcessReplayComplete = this._onProcessReplayComplete.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            this._onRestoreCommands = this._register(new event_1.Emitter());
            this.onRestoreCommands = this._onRestoreCommands.event;
        }
        async getInitialCwd() {
            return this._properties.initialCwd;
        }
        async getCwd() {
            return this._properties.cwd || this._properties.initialCwd;
        }
        handleData(e) {
            this._onProcessData.fire(e);
        }
        handleExit(e) {
            this._onProcessExit.fire(e);
        }
        handleReady(e) {
            this._onProcessReady.fire(e);
        }
        handleDidChangeProperty({ type, value }) {
            switch (type) {
                case "cwd" /* ProcessPropertyType.Cwd */:
                    this._properties.cwd = value;
                    break;
                case "initialCwd" /* ProcessPropertyType.InitialCwd */:
                    this._properties.initialCwd = value;
                    break;
                case "resolvedShellLaunchConfig" /* ProcessPropertyType.ResolvedShellLaunchConfig */:
                    if (value.cwd && typeof value.cwd !== 'string') {
                        value.cwd = uri_1.URI.revive(value.cwd);
                    }
            }
            this._onDidChangeProperty.fire({ type, value });
        }
        async handleReplay(e) {
            (0, performance_1.mark)(`code/terminal/willHandleReplay/${this.id}`);
            try {
                this._inReplay = true;
                for (const innerEvent of e.events) {
                    if (innerEvent.cols !== 0 || innerEvent.rows !== 0) {
                        // never override with 0x0 as that is a marker for an unknown initial size
                        this._onDidChangeProperty.fire({ type: "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */, value: { cols: innerEvent.cols, rows: innerEvent.rows, forceExactSize: true } });
                    }
                    const e = { data: innerEvent.data, trackCommit: true };
                    this._onProcessData.fire(e);
                    await e.writePromise;
                }
            }
            finally {
                this._inReplay = false;
            }
            if (e.commands) {
                this._onRestoreCommands.fire(e.commands);
            }
            // remove size override
            this._onDidChangeProperty.fire({ type: "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */, value: undefined });
            (0, performance_1.mark)(`code/terminal/didHandleReplay/${this.id}`);
            this._onProcessReplayComplete.fire();
        }
    }
    exports.BasePty = BasePty;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZVB0eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvY29tbW9uL2Jhc2VQdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHOzs7T0FHRztJQUNILE1BQXNCLE9BQVEsU0FBUSxzQkFBVTtRQTZCL0MsWUFDVSxFQUFVLEVBQ1YsYUFBc0I7WUFFL0IsS0FBSyxFQUFFLENBQUM7WUFIQyxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQ1Ysa0JBQWEsR0FBYixhQUFhLENBQVM7WUE5QmIsZ0JBQVcsR0FBd0I7Z0JBQ3JELEdBQUcsRUFBRSxFQUFFO2dCQUNQLFVBQVUsRUFBRSxFQUFFO2dCQUNkLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtnQkFDckQsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsU0FBUyxFQUFFLFNBQVM7Z0JBQ3BCLGlCQUFpQixFQUFFLElBQUk7Z0JBQ3ZCLHlCQUF5QixFQUFFLEVBQUU7Z0JBQzdCLGtCQUFrQixFQUFFLFNBQVM7Z0JBQzdCLGdDQUFnQyxFQUFFLEtBQUs7Z0JBQ3ZDLDZCQUE2QixFQUFFLFNBQVM7YUFDeEMsQ0FBQztZQUNpQixvQkFBZSxHQUFtQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNsRixjQUFTLEdBQUcsS0FBSyxDQUFDO1lBRVQsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE4QixDQUFDLENBQUM7WUFDckYsa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUNoQyw2QkFBd0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN6RSw0QkFBdUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBQ3BELG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQzlFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFDbEMseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBeUIsQ0FBQyxDQUFDO1lBQ3RGLHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDNUMsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFzQixDQUFDLENBQUM7WUFDN0Usa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUNoQyx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QyxDQUFDLENBQUM7WUFDcEcsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztRQU8zRCxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWE7WUFDbEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU07WUFDWCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO1FBQzVELENBQUM7UUFFRCxVQUFVLENBQUMsQ0FBNkI7WUFDdkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUNELFVBQVUsQ0FBQyxDQUFxQjtZQUMvQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBQ0QsV0FBVyxDQUFDLENBQXFCO1lBQ2hDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFDRCx1QkFBdUIsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQXlCO1lBQzdELFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ2Q7b0JBQ0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO29CQUM3QixNQUFNO2dCQUNQO29CQUNDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztvQkFDcEMsTUFBTTtnQkFDUDtvQkFDQyxJQUFJLEtBQUssQ0FBQyxHQUFHLElBQUksT0FBTyxLQUFLLENBQUMsR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUNoRCxLQUFLLENBQUMsR0FBRyxHQUFHLFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNuQyxDQUFDO1lBQ0gsQ0FBQztZQUNELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBQ0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUE2QjtZQUMvQyxJQUFBLGtCQUFJLEVBQUMsa0NBQWtDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDdEIsS0FBSyxNQUFNLFVBQVUsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ25DLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDcEQsMEVBQTBFO3dCQUMxRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxtRUFBd0MsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNqSyxDQUFDO29CQUNELE1BQU0sQ0FBQyxHQUFzQixFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQztvQkFDMUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLE1BQU0sQ0FBQyxDQUFDLFlBQVksQ0FBQztnQkFDdEIsQ0FBQztZQUNGLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN4QixDQUFDO1lBRUQsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFFRCx1QkFBdUI7WUFDdkIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksbUVBQXdDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFFbkcsSUFBQSxrQkFBSSxFQUFDLGlDQUFpQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEMsQ0FBQztLQUNEO0lBL0ZELDBCQStGQyJ9