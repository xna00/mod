/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MutableObservableValue = exports.staticObservableValue = void 0;
    const staticObservableValue = (value) => ({
        onDidChange: event_1.Event.None,
        value,
    });
    exports.staticObservableValue = staticObservableValue;
    class MutableObservableValue extends lifecycle_1.Disposable {
        get value() {
            return this._value;
        }
        set value(v) {
            if (v !== this._value) {
                this._value = v;
                this.changeEmitter.fire(v);
            }
        }
        static stored(stored, defaultValue) {
            const o = new MutableObservableValue(stored.get(defaultValue));
            o._register(stored);
            o._register(o.onDidChange(value => stored.store(value)));
            return o;
        }
        constructor(_value) {
            super();
            this._value = _value;
            this.changeEmitter = this._register(new event_1.Emitter());
            this.onDidChange = this.changeEmitter.event;
        }
    }
    exports.MutableObservableValue = MutableObservableValue;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZVZhbHVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi9vYnNlcnZhYmxlVmFsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV3pGLE1BQU0scUJBQXFCLEdBQUcsQ0FBSSxLQUFRLEVBQXVCLEVBQUUsQ0FBQyxDQUFDO1FBQzNFLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSTtRQUN2QixLQUFLO0tBQ0wsQ0FBQyxDQUFDO0lBSFUsUUFBQSxxQkFBcUIseUJBRy9CO0lBRUgsTUFBYSxzQkFBMEIsU0FBUSxzQkFBVTtRQUt4RCxJQUFXLEtBQUs7WUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQVcsS0FBSyxDQUFDLENBQUk7WUFDcEIsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFTSxNQUFNLENBQUMsTUFBTSxDQUFJLE1BQXNCLEVBQUUsWUFBZTtZQUM5RCxNQUFNLENBQUMsR0FBRyxJQUFJLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVELFlBQW9CLE1BQVM7WUFDNUIsS0FBSyxFQUFFLENBQUM7WUFEVyxXQUFNLEdBQU4sTUFBTSxDQUFHO1lBdEJaLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBSyxDQUFDLENBQUM7WUFFbEQsZ0JBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztRQXNCdkQsQ0FBQztLQUNEO0lBMUJELHdEQTBCQyJ9