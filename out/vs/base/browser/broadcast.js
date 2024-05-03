/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, window_1, errors_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BroadcastDataChannel = void 0;
    class BroadcastDataChannel extends lifecycle_1.Disposable {
        constructor(channelName) {
            super();
            this.channelName = channelName;
            this._onDidReceiveData = this._register(new event_1.Emitter());
            this.onDidReceiveData = this._onDidReceiveData.event;
            // Use BroadcastChannel
            if ('BroadcastChannel' in window_1.mainWindow) {
                try {
                    this.broadcastChannel = new BroadcastChannel(channelName);
                    const listener = (event) => {
                        this._onDidReceiveData.fire(event.data);
                    };
                    this.broadcastChannel.addEventListener('message', listener);
                    this._register((0, lifecycle_1.toDisposable)(() => {
                        if (this.broadcastChannel) {
                            this.broadcastChannel.removeEventListener('message', listener);
                            this.broadcastChannel.close();
                        }
                    }));
                }
                catch (error) {
                    console.warn('Error while creating broadcast channel. Falling back to localStorage.', (0, errors_1.getErrorMessage)(error));
                }
            }
            // BroadcastChannel is not supported. Use storage.
            if (!this.broadcastChannel) {
                this.channelName = `BroadcastDataChannel.${channelName}`;
                this.createBroadcastChannel();
            }
        }
        createBroadcastChannel() {
            const listener = (event) => {
                if (event.key === this.channelName && event.newValue) {
                    this._onDidReceiveData.fire(JSON.parse(event.newValue));
                }
            };
            window_1.mainWindow.addEventListener('storage', listener);
            this._register((0, lifecycle_1.toDisposable)(() => window_1.mainWindow.removeEventListener('storage', listener)));
        }
        /**
         * Sends the data to other BroadcastChannel objects set up for this channel. Data can be structured objects, e.g. nested objects and arrays.
         * @param data data to broadcast
         */
        postData(data) {
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(data);
            }
            else {
                // remove previous changes so that event is triggered even if new changes are same as old changes
                localStorage.removeItem(this.channelName);
                localStorage.setItem(this.channelName, JSON.stringify(data));
            }
        }
    }
    exports.BroadcastDataChannel = BroadcastDataChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvYWRjYXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvYnJvYWRjYXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLG9CQUF3QixTQUFRLHNCQUFVO1FBT3RELFlBQTZCLFdBQW1CO1lBQy9DLEtBQUssRUFBRSxDQUFDO1lBRG9CLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBSC9CLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQUssQ0FBQyxDQUFDO1lBQzdELHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFLeEQsdUJBQXVCO1lBQ3ZCLElBQUksa0JBQWtCLElBQUksbUJBQVUsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUM7b0JBQ0osSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQzFELE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBbUIsRUFBRSxFQUFFO3dCQUN4QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekMsQ0FBQyxDQUFDO29CQUNGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTt3QkFDaEMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzs0QkFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQzs0QkFDL0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUMvQixDQUFDO29CQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLHVFQUF1RSxFQUFFLElBQUEsd0JBQWUsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMvRyxDQUFDO1lBQ0YsQ0FBQztZQUVELGtEQUFrRDtZQUNsRCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxXQUFXLEdBQUcsd0JBQXdCLFdBQVcsRUFBRSxDQUFDO2dCQUN6RCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVPLHNCQUFzQjtZQUM3QixNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQW1CLEVBQUUsRUFBRTtnQkFDeEMsSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN0RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELENBQUM7WUFDRixDQUFDLENBQUM7WUFDRixtQkFBVSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUUsQ0FBQyxtQkFBVSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztRQUVEOzs7V0FHRztRQUNILFFBQVEsQ0FBQyxJQUFPO1lBQ2YsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsaUdBQWlHO2dCQUNqRyxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDMUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5RCxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBM0RELG9EQTJEQyJ9