/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartialCommandDetectionCapability = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The minimum size of the prompt in which to assume the line is a command.
         */
        Constants[Constants["MinimumPromptLength"] = 2] = "MinimumPromptLength";
    })(Constants || (Constants = {}));
    /**
     * This capability guesses where commands are based on where the cursor was when enter was pressed.
     * It's very hit or miss but it's often correct and better than nothing.
     */
    class PartialCommandDetectionCapability extends lifecycle_1.DisposableStore {
        get commands() { return this._commands; }
        constructor(_terminal) {
            super();
            this._terminal = _terminal;
            this.type = 3 /* TerminalCapability.PartialCommandDetection */;
            this._commands = [];
            this._onCommandFinished = this.add(new event_1.Emitter());
            this.onCommandFinished = this._onCommandFinished.event;
            this.add(this._terminal.onData(e => this._onData(e)));
            this.add(this._terminal.parser.registerCsiHandler({ final: 'J' }, params => {
                if (params.length >= 1 && (params[0] === 2 || params[0] === 3)) {
                    this._clearCommandsInViewport();
                }
                // We don't want to override xterm.js' default behavior, just augment it
                return false;
            }));
        }
        _onData(data) {
            if (data === '\x0d') {
                this._onEnter();
            }
        }
        _onEnter() {
            if (!this._terminal) {
                return;
            }
            if (this._terminal.buffer.active.cursorX >= 2 /* Constants.MinimumPromptLength */) {
                const marker = this._terminal.registerMarker(0);
                if (marker) {
                    this._commands.push(marker);
                    this._onCommandFinished.fire(marker);
                }
            }
        }
        _clearCommandsInViewport() {
            // Find the number of commands on the tail end of the array that are within the viewport
            let count = 0;
            for (let i = this._commands.length - 1; i >= 0; i--) {
                if (this._commands[i].line < this._terminal.buffer.active.baseY) {
                    break;
                }
                count++;
            }
            // Remove them
            this._commands.splice(this._commands.length - count, count);
        }
    }
    exports.PartialCommandDetectionCapability = PartialCommandDetectionCapability;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGlhbENvbW1hbmREZXRlY3Rpb25DYXBhYmlsaXR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vY2FwYWJpbGl0aWVzL3BhcnRpYWxDb21tYW5kRGV0ZWN0aW9uQ2FwYWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsSUFBVyxTQUtWO0lBTEQsV0FBVyxTQUFTO1FBQ25COztXQUVHO1FBQ0gsdUVBQXVCLENBQUE7SUFDeEIsQ0FBQyxFQUxVLFNBQVMsS0FBVCxTQUFTLFFBS25CO0lBRUQ7OztPQUdHO0lBQ0gsTUFBYSxpQ0FBa0MsU0FBUSwyQkFBZTtRQUtyRSxJQUFJLFFBQVEsS0FBeUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUs3RCxZQUNrQixTQUFtQjtZQUVwQyxLQUFLLEVBQUUsQ0FBQztZQUZTLGNBQVMsR0FBVCxTQUFTLENBQVU7WUFWNUIsU0FBSSxzREFBOEM7WUFFMUMsY0FBUyxHQUFjLEVBQUUsQ0FBQztZQUkxQix1QkFBa0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFXLENBQUMsQ0FBQztZQUM5RCxzQkFBaUIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBTTFELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUMxRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDaEUsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7Z0JBQ2pDLENBQUM7Z0JBQ0Qsd0VBQXdFO2dCQUN4RSxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sT0FBTyxDQUFDLElBQVk7WUFDM0IsSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqQixDQUFDO1FBQ0YsQ0FBQztRQUVPLFFBQVE7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8seUNBQWlDLEVBQUUsQ0FBQztnQkFDM0UsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLHdCQUF3QjtZQUMvQix3RkFBd0Y7WUFDeEYsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDakUsTUFBTTtnQkFDUCxDQUFDO2dCQUNELEtBQUssRUFBRSxDQUFDO1lBQ1QsQ0FBQztZQUNELGNBQWM7WUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0QsQ0FBQztLQUNEO0lBdkRELDhFQXVEQyJ9