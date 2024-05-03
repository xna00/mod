/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, async_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAutoResponder = void 0;
    /**
     * Tracks a terminal process's data stream and responds immediately when a matching string is
     * received. This is done in a low overhead way and is ideally run on the same process as the
     * where the process is handled to minimize latency.
     */
    class TerminalAutoResponder extends lifecycle_1.Disposable {
        constructor(proc, matchWord, response, logService) {
            super();
            this._pointer = 0;
            this._paused = false;
            /**
             * Each reply is throttled by a second to avoid resource starvation and responding to screen
             * reprints on Winodws.
             */
            this._throttled = false;
            this._register(proc.onProcessData(e => {
                if (this._paused || this._throttled) {
                    return;
                }
                const data = typeof e === 'string' ? e : e.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i] === matchWord[this._pointer]) {
                        this._pointer++;
                    }
                    else {
                        this._reset();
                    }
                    // Auto reply and reset
                    if (this._pointer === matchWord.length) {
                        logService.debug(`Auto reply match: "${matchWord}", response: "${response}"`);
                        proc.input(response);
                        this._throttled = true;
                        (0, async_1.timeout)(1000).then(() => this._throttled = false);
                        this._reset();
                    }
                }
            }));
        }
        _reset() {
            this._pointer = 0;
        }
        /**
         * No auto response will happen after a resize on Windows in case the resize is a result of
         * reprinting the screen.
         */
        handleResize() {
            if (platform_1.isWindows) {
                this._paused = true;
            }
        }
        handleInput() {
            this._paused = false;
        }
    }
    exports.TerminalAutoResponder = TerminalAutoResponder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBdXRvUmVzcG9uZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vdGVybWluYWxBdXRvUmVzcG9uZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRzs7OztPQUlHO0lBQ0gsTUFBYSxxQkFBc0IsU0FBUSxzQkFBVTtRQVVwRCxZQUNDLElBQTJCLEVBQzNCLFNBQWlCLEVBQ2pCLFFBQWdCLEVBQ2hCLFVBQXVCO1lBRXZCLEtBQUssRUFBRSxDQUFDO1lBZkQsYUFBUSxHQUFHLENBQUMsQ0FBQztZQUNiLFlBQU8sR0FBRyxLQUFLLENBQUM7WUFFeEI7OztlQUdHO1lBQ0ssZUFBVSxHQUFHLEtBQUssQ0FBQztZQVUxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JDLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3JDLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDaEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDdEMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUMxQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2pCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2YsQ0FBQztvQkFDRCx1QkFBdUI7b0JBQ3ZCLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7d0JBQ3hDLFVBQVUsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLFNBQVMsaUJBQWlCLFFBQVEsR0FBRyxDQUFDLENBQUM7d0JBQzlFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO3dCQUN2QixJQUFBLGVBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQzt3QkFDbEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNmLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sTUFBTTtZQUNiLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFFRDs7O1dBR0c7UUFDSCxZQUFZO1lBQ1gsSUFBSSxvQkFBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDckIsQ0FBQztRQUNGLENBQUM7UUFFRCxXQUFXO1lBQ1YsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDdEIsQ0FBQztLQUNEO0lBMURELHNEQTBEQyJ9