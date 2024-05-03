/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IframeUtils = void 0;
    exports.parentOriginHash = parentOriginHash;
    const sameOriginWindowChainCache = new WeakMap();
    function getParentWindowIfSameOrigin(w) {
        if (!w.parent || w.parent === w) {
            return null;
        }
        // Cannot really tell if we have access to the parent window unless we try to access something in it
        try {
            const location = w.location;
            const parentLocation = w.parent.location;
            if (location.origin !== 'null' && parentLocation.origin !== 'null' && location.origin !== parentLocation.origin) {
                return null;
            }
        }
        catch (e) {
            return null;
        }
        return w.parent;
    }
    class IframeUtils {
        /**
         * Returns a chain of embedded windows with the same origin (which can be accessed programmatically).
         * Having a chain of length 1 might mean that the current execution environment is running outside of an iframe or inside an iframe embedded in a window with a different origin.
         */
        static getSameOriginWindowChain(targetWindow) {
            let windowChainCache = sameOriginWindowChainCache.get(targetWindow);
            if (!windowChainCache) {
                windowChainCache = [];
                sameOriginWindowChainCache.set(targetWindow, windowChainCache);
                let w = targetWindow;
                let parent;
                do {
                    parent = getParentWindowIfSameOrigin(w);
                    if (parent) {
                        windowChainCache.push({
                            window: new WeakRef(w),
                            iframeElement: w.frameElement || null
                        });
                    }
                    else {
                        windowChainCache.push({
                            window: new WeakRef(w),
                            iframeElement: null
                        });
                    }
                    w = parent;
                } while (w);
            }
            return windowChainCache.slice(0);
        }
        /**
         * Returns the position of `childWindow` relative to `ancestorWindow`
         */
        static getPositionOfChildWindowRelativeToAncestorWindow(childWindow, ancestorWindow) {
            if (!ancestorWindow || childWindow === ancestorWindow) {
                return {
                    top: 0,
                    left: 0
                };
            }
            let top = 0, left = 0;
            const windowChain = this.getSameOriginWindowChain(childWindow);
            for (const windowChainEl of windowChain) {
                const windowInChain = windowChainEl.window.deref();
                top += windowInChain?.scrollY ?? 0;
                left += windowInChain?.scrollX ?? 0;
                if (windowInChain === ancestorWindow) {
                    break;
                }
                if (!windowChainEl.iframeElement) {
                    break;
                }
                const boundingRect = windowChainEl.iframeElement.getBoundingClientRect();
                top += boundingRect.top;
                left += boundingRect.left;
            }
            return {
                top: top,
                left: left
            };
        }
    }
    exports.IframeUtils = IframeUtils;
    /**
     * Returns a sha-256 composed of `parentOrigin` and `salt` converted to base 32
     */
    async function parentOriginHash(parentOrigin, salt) {
        // This same code is also inlined at `src/vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html`
        if (!crypto.subtle) {
            throw new Error(`'crypto.subtle' is not available so webviews will not work. This is likely because the editor is not running in a secure context (https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).`);
        }
        const strData = JSON.stringify({ parentOrigin, salt });
        const encoder = new TextEncoder();
        const arrData = encoder.encode(strData);
        const hash = await crypto.subtle.digest('sha-256', arrData);
        return sha256AsBase32(hash);
    }
    function sha256AsBase32(bytes) {
        const array = Array.from(new Uint8Array(bytes));
        const hexArray = array.map(b => b.toString(16).padStart(2, '0')).join('');
        // sha256 has 256 bits, so we need at most ceil(lg(2^256-1)/lg(32)) = 52 chars to represent it in base 32
        return BigInt(`0x${hexArray}`).toString(32).padStart(52, '0');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWZyYW1lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvaWZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlIaEcsNENBV0M7SUE1R0QsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLE9BQU8sRUFBd0MsQ0FBQztJQUV2RixTQUFTLDJCQUEyQixDQUFDLENBQVM7UUFDN0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxvR0FBb0c7UUFDcEcsSUFBSSxDQUFDO1lBQ0osTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUM1QixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUN6QyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqSCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNaLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNqQixDQUFDO0lBRUQsTUFBYSxXQUFXO1FBRXZCOzs7V0FHRztRQUNLLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxZQUFvQjtZQUMzRCxJQUFJLGdCQUFnQixHQUFHLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztn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