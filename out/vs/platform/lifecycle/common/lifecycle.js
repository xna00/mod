/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async"], function (require, exports, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.handleVetos = handleVetos;
    // Shared veto handling across main and renderer
    function handleVetos(vetos, onError) {
        if (vetos.length === 0) {
            return Promise.resolve(false);
        }
        const promises = [];
        let lazyValue = false;
        for (const valueOrPromise of vetos) {
            // veto, done
            if (valueOrPromise === true) {
                return Promise.resolve(true);
            }
            if ((0, async_1.isThenable)(valueOrPromise)) {
                promises.push(valueOrPromise.then(value => {
                    if (value) {
                        lazyValue = true; // veto, done
                    }
                }, err => {
                    onError(err); // error, treated like a veto, done
                    lazyValue = true;
                }));
            }
        }
        return async_1.Promises.settled(promises).then(() => lazyValue);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9saWZlY3ljbGUvY29tbW9uL2xpZmVjeWNsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUtoRyxrQ0E0QkM7SUE3QkQsZ0RBQWdEO0lBQ2hELFNBQWdCLFdBQVcsQ0FBQyxLQUFxQyxFQUFFLE9BQStCO1FBQ2pHLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN4QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELE1BQU0sUUFBUSxHQUFvQixFQUFFLENBQUM7UUFDckMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBRXRCLEtBQUssTUFBTSxjQUFjLElBQUksS0FBSyxFQUFFLENBQUM7WUFFcEMsYUFBYTtZQUNiLElBQUksY0FBYyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUM3QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELElBQUksSUFBQSxrQkFBVSxFQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLFFBQVEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDekMsSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDWCxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUMsYUFBYTtvQkFDaEMsQ0FBQztnQkFDRixDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7b0JBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsbUNBQW1DO29CQUNqRCxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLGdCQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6RCxDQUFDIn0=