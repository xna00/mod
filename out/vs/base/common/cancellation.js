/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CancellationTokenSource = exports.CancellationToken = void 0;
    const shortcutEvent = Object.freeze(function (callback, context) {
        const handle = setTimeout(callback.bind(context), 0);
        return { dispose() { clearTimeout(handle); } };
    });
    var CancellationToken;
    (function (CancellationToken) {
        function isCancellationToken(thing) {
            if (thing === CancellationToken.None || thing === CancellationToken.Cancelled) {
                return true;
            }
            if (thing instanceof MutableToken) {
                return true;
            }
            if (!thing || typeof thing !== 'object') {
                return false;
            }
            return typeof thing.isCancellationRequested === 'boolean'
                && typeof thing.onCancellationRequested === 'function';
        }
        CancellationToken.isCancellationToken = isCancellationToken;
        CancellationToken.None = Object.freeze({
            isCancellationRequested: false,
            onCancellationRequested: event_1.Event.None
        });
        CancellationToken.Cancelled = Object.freeze({
            isCancellationRequested: true,
            onCancellationRequested: shortcutEvent
        });
    })(CancellationToken || (exports.CancellationToken = CancellationToken = {}));
    class MutableToken {
        constructor() {
            this._isCancelled = false;
            this._emitter = null;
        }
        cancel() {
            if (!this._isCancelled) {
                this._isCancelled = true;
                if (this._emitter) {
                    this._emitter.fire(undefined);
                    this.dispose();
                }
            }
        }
        get isCancellationRequested() {
            return this._isCancelled;
        }
        get onCancellationRequested() {
            if (this._isCancelled) {
                return shortcutEvent;
            }
            if (!this._emitter) {
                this._emitter = new event_1.Emitter();
            }
            return this._emitter.event;
        }
        dispose() {
            if (this._emitter) {
                this._emitter.dispose();
                this._emitter = null;
            }
        }
    }
    class CancellationTokenSource {
        constructor(parent) {
            this._token = undefined;
            this._parentListener = undefined;
            this._parentListener = parent && parent.onCancellationRequested(this.cancel, this);
        }
        get token() {
            if (!this._token) {
                // be lazy and create the token only when
                // actually needed
                this._token = new MutableToken();
            }
            return this._token;
        }
        cancel() {
            if (!this._token) {
                // save an object by returning the default
                // cancelled token when cancellation happens
                // before someone asks for the token
                this._token = CancellationToken.Cancelled;
            }
            else if (this._token instanceof MutableToken) {
                // actually cancel
                this._token.cancel();
            }
        }
        dispose(cancel = false) {
            if (cancel) {
                this.cancel();
            }
            this._parentListener?.dispose();
            if (!this._token) {
                // ensure to initialize with an empty token if we had none
                this._token = CancellationToken.None;
            }
            else if (this._token instanceof MutableToken) {
                // actually dispose
                this._token.dispose();
            }
        }
    }
    exports.CancellationTokenSource = CancellationTokenSource;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuY2VsbGF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9jYW5jZWxsYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUJoRyxNQUFNLGFBQWEsR0FBZSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsUUFBUSxFQUFFLE9BQVE7UUFDM0UsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckQsT0FBTyxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUNoRCxDQUFDLENBQUMsQ0FBQztJQUVILElBQWlCLGlCQUFpQixDQTBCakM7SUExQkQsV0FBaUIsaUJBQWlCO1FBRWpDLFNBQWdCLG1CQUFtQixDQUFDLEtBQWM7WUFDakQsSUFBSSxLQUFLLEtBQUssaUJBQWlCLENBQUMsSUFBSSxJQUFJLEtBQUssS0FBSyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDL0UsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxLQUFLLFlBQVksWUFBWSxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE9BQU8sT0FBUSxLQUEyQixDQUFDLHVCQUF1QixLQUFLLFNBQVM7bUJBQzVFLE9BQVEsS0FBMkIsQ0FBQyx1QkFBdUIsS0FBSyxVQUFVLENBQUM7UUFDaEYsQ0FBQztRQVplLHFDQUFtQixzQkFZbEMsQ0FBQTtRQUdZLHNC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