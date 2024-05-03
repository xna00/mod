/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/extensions/common/extensions"], function (require, exports, errors_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ImplicitActivationEvents = exports.ImplicitActivationEventsImpl = void 0;
    class ImplicitActivationEventsImpl {
        constructor() {
            this._generators = new Map();
            this._cache = new WeakMap();
        }
        register(extensionPointName, generator) {
            this._generators.set(extensionPointName, generator);
        }
        /**
         * This can run correctly only on the renderer process because that is the only place
         * where all extension points and all implicit activation events generators are known.
         */
        readActivationEvents(extensionDescription) {
            if (!this._cache.has(extensionDescription)) {
                this._cache.set(extensionDescription, this._readActivationEvents(extensionDescription));
            }
            return this._cache.get(extensionDescription);
        }
        /**
         * This can run correctly only on the renderer process because that is the only place
         * where all extension points and all implicit activation events generators are known.
         */
        createActivationEventsMap(extensionDescriptions) {
            const result = Object.create(null);
            for (const extensionDescription of extensionDescriptions) {
                const activationEvents = this.readActivationEvents(extensionDescription);
                if (activationEvents.length > 0) {
                    result[extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier)] = activationEvents;
                }
            }
            return result;
        }
        _readActivationEvents(desc) {
            if (typeof desc.main === 'undefined' && typeof desc.browser === 'undefined') {
                return [];
            }
            const activationEvents = (Array.isArray(desc.activationEvents) ? desc.activationEvents.slice(0) : []);
            for (let i = 0; i < activationEvents.length; i++) {
                // TODO@joao: there's no easy way to contribute this
                if (activationEvents[i] === 'onUri') {
                    activationEvents[i] = `onUri:${extensions_1.ExtensionIdentifier.toKey(desc.identifier)}`;
                }
            }
            if (!desc.contributes) {
                // no implicit activation events
                return activationEvents;
            }
            for (const extPointName in desc.contributes) {
                const generator = this._generators.get(extPointName);
                if (!generator) {
                    // There's no generator for this extension point
                    continue;
                }
                const contrib = desc.contributes[extPointName];
                const contribArr = Array.isArray(contrib) ? contrib : [contrib];
                try {
                    generator(contribArr, activationEvents);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            return activationEvents;
        }
    }
    exports.ImplicitActivationEventsImpl = ImplicitActivationEventsImpl;
    exports.ImplicitActivationEvents = new ImplicitActivationEventsImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wbGljaXRBY3RpdmF0aW9uRXZlbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25NYW5hZ2VtZW50L2NvbW1vbi9pbXBsaWNpdEFjdGl2YXRpb25FdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsNEJBQTRCO1FBQXpDO1lBRWtCLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQTJDLENBQUM7WUFDakUsV0FBTSxHQUFHLElBQUksT0FBTyxFQUFtQyxDQUFDO1FBb0UxRSxDQUFDO1FBbEVPLFFBQVEsQ0FBSSxrQkFBMEIsRUFBRSxTQUF3QztZQUN0RixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksb0JBQW9CLENBQUMsb0JBQTJDO1lBQ3RFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDekYsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUUsQ0FBQztRQUMvQyxDQUFDO1FBRUQ7OztXQUdHO1FBQ0kseUJBQXlCLENBQUMscUJBQThDO1lBQzlFLE1BQU0sTUFBTSxHQUF3QyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hFLEtBQUssTUFBTSxvQkFBb0IsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUMxRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDakMsTUFBTSxDQUFDLGdDQUFtQixDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixDQUFDO2dCQUN2RixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLHFCQUFxQixDQUFDLElBQTJCO1lBQ3hELElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQzdFLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sZ0JBQWdCLEdBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVoSCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xELG9EQUFvRDtnQkFDcEQsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDckMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxnQ0FBbUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQzdFLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdkIsZ0NBQWdDO2dCQUNoQyxPQUFPLGdCQUFnQixDQUFDO1lBQ3pCLENBQUM7WUFFRCxLQUFLLE1BQU0sWUFBWSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDaEIsZ0RBQWdEO29CQUNoRCxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsTUFBTSxPQUFPLEdBQUksSUFBSSxDQUFDLFdBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxDQUFDO29CQUNKLFNBQVMsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztnQkFDekMsQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNkLElBQUEsMEJBQWlCLEVBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxnQkFBZ0IsQ0FBQztRQUN6QixDQUFDO0tBQ0Q7SUF2RUQsb0VBdUVDO0lBRVksUUFBQSx3QkFBd0IsR0FBaUMsSUFBSSw0QkFBNEIsRUFBRSxDQUFDIn0=