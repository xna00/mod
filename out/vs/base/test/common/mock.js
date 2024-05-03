/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon"], function (require, exports, sinon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mockObject = void 0;
    exports.mock = mock;
    function mock() {
        return function () { };
    }
    // Creates an object object that returns sinon mocks for every property. Optionally
    // takes base properties.
    const mockObject = () => (properties) => {
        return new Proxy({ ...properties }, {
            get(target, key) {
                if (!target.hasOwnProperty(key)) {
                    target[key] = (0, sinon_1.stub)();
                }
                return target[key];
            },
            set(target, key, value) {
                target[key] = value;
                return true;
            },
        });
    };
    exports.mockObject = mockObject;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9jay5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9tb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxvQkFFQztJQUZELFNBQWdCLElBQUk7UUFDbkIsT0FBTyxjQUFjLENBQVEsQ0FBQztJQUMvQixDQUFDO0lBSUQsbUZBQW1GO0lBQ25GLHlCQUF5QjtJQUNsQixNQUFNLFVBQVUsR0FBRyxHQUFxQixFQUFFLENBQUMsQ0FBNkIsVUFBZSxFQUEyQixFQUFFO1FBQzFILE9BQU8sSUFBSSxLQUFLLENBQUMsRUFBRSxHQUFHLFVBQVUsRUFBUyxFQUFFO1lBQzFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRztnQkFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBQSxZQUFJLEdBQUUsQ0FBQztnQkFDdEIsQ0FBQztnQkFFRCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixDQUFDO1lBQ0QsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSztnQkFDckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDcEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1NBQ0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBZFcsUUFBQSxVQUFVLGNBY3JCIn0=