/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/uri"], function (require, exports, buffer_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultURITransformer = exports.URITransformer = void 0;
    exports.transformOutgoingURIs = transformOutgoingURIs;
    exports.transformIncomingURIs = transformIncomingURIs;
    exports.transformAndReviveIncomingURIs = transformAndReviveIncomingURIs;
    function toJSON(uri) {
        return uri.toJSON();
    }
    class URITransformer {
        constructor(uriTransformer) {
            this._uriTransformer = uriTransformer;
        }
        transformIncoming(uri) {
            const result = this._uriTransformer.transformIncoming(uri);
            return (result === uri ? uri : toJSON(uri_1.URI.from(result)));
        }
        transformOutgoing(uri) {
            const result = this._uriTransformer.transformOutgoing(uri);
            return (result === uri ? uri : toJSON(uri_1.URI.from(result)));
        }
        transformOutgoingURI(uri) {
            const result = this._uriTransformer.transformOutgoing(uri);
            return (result === uri ? uri : uri_1.URI.from(result));
        }
        transformOutgoingScheme(scheme) {
            return this._uriTransformer.transformOutgoingScheme(scheme);
        }
    }
    exports.URITransformer = URITransformer;
    exports.DefaultURITransformer = new class {
        transformIncoming(uri) {
            return uri;
        }
        transformOutgoing(uri) {
            return uri;
        }
        transformOutgoingURI(uri) {
            return uri;
        }
        transformOutgoingScheme(scheme) {
            return scheme;
        }
    };
    function _transformOutgoingURIs(obj, transformer, depth) {
        if (!obj || depth > 200) {
            return null;
        }
        if (typeof obj === 'object') {
            if (obj instanceof uri_1.URI) {
                return transformer.transformOutgoing(obj);
            }
            // walk object (or array)
            for (const key in obj) {
                if (Object.hasOwnProperty.call(obj, key)) {
                    const r = _transformOutgoingURIs(obj[key], transformer, depth + 1);
                    if (r !== null) {
                        obj[key] = r;
                    }
                }
            }
        }
        return null;
    }
    function transformOutgoingURIs(obj, transformer) {
        const result = _transformOutgoingURIs(obj, transformer, 0);
        if (result === null) {
            // no change
            return obj;
        }
        return result;
    }
    function _transformIncomingURIs(obj, transformer, revive, depth) {
        if (!obj || depth > 200) {
            return null;
        }
        if (typeof obj === 'object') {
            if (obj.$mid === 1 /* MarshalledId.Uri */) {
                return revive ? uri_1.URI.revive(transformer.transformIncoming(obj)) : transformer.transformIncoming(obj);
            }
            if (obj instanceof buffer_1.VSBuffer) {
                return null;
            }
            // walk object (or array)
            for (const key in obj) {
                if (Object.hasOwnProperty.call(obj, key)) {
                    const r = _transformIncomingURIs(obj[key], transformer, revive, depth + 1);
                    if (r !== null) {
                        obj[key] = r;
                    }
                }
            }
        }
        return null;
    }
    function transformIncomingURIs(obj, transformer) {
        const result = _transformIncomingURIs(obj, transformer, false, 0);
        if (result === null) {
            // no change
            return obj;
        }
        return result;
    }
    function transformAndReviveIncomingURIs(obj, transformer) {
        const result = _transformIncomingURIs(obj, transformer, true, 0);
        if (result === null) {
            // no change
            return obj;
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi91cmlJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUdoRyxzREFPQztJQWlDRCxzREFPQztJQUVELHdFQU9DO0lBbklELFNBQVMsTUFBTSxDQUFDLEdBQVE7UUFDdkIsT0FBMkIsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxNQUFhLGNBQWM7UUFJMUIsWUFBWSxjQUFrQztZQUM3QyxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztRQUN2QyxDQUFDO1FBRU0saUJBQWlCLENBQUMsR0FBa0I7WUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzRCxPQUFPLENBQUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVNLGlCQUFpQixDQUFDLEdBQWtCO1lBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDM0QsT0FBTyxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxHQUFRO1lBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsR0FBRyxD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