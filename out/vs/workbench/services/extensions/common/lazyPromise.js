/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CanceledLazyPromise = exports.LazyPromise = void 0;
    class LazyPromise {
        constructor() {
            this._actual = null;
            this._actualOk = null;
            this._actualErr = null;
            this._hasValue = false;
            this._value = null;
            this._hasErr = false;
            this._err = null;
        }
        get [Symbol.toStringTag]() {
            return this.toString();
        }
        _ensureActual() {
            if (!this._actual) {
                this._actual = new Promise((c, e) => {
                    this._actualOk = c;
                    this._actualErr = e;
                    if (this._hasValue) {
                        this._actualOk(this._value);
                    }
                    if (this._hasErr) {
                        this._actualErr(this._err);
                    }
                });
            }
            return this._actual;
        }
        resolveOk(value) {
            if (this._hasValue || this._hasErr) {
                return;
            }
            this._hasValue = true;
            this._value = value;
            if (this._actual) {
                this._actualOk(value);
            }
        }
        resolveErr(err) {
            if (this._hasValue || this._hasErr) {
                return;
            }
            this._hasErr = true;
            this._err = err;
            if (this._actual) {
                this._actualErr(err);
            }
            else {
                // If nobody's listening at this point, it is safe to assume they never will,
                // since resolving this promise is always "async"
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        then(success, error) {
            return this._ensureActual().then(success, error);
        }
        catch(error) {
            return this._ensureActual().then(undefined, error);
        }
        finally(callback) {
            return this._ensureActual().finally(callback);
        }
    }
    exports.LazyPromise = LazyPromise;
    class CanceledLazyPromise extends LazyPromise {
        constructor() {
            super();
            this._hasErr = true;
            this._err = new errors_1.CancellationError();
        }
    }
    exports.CanceledLazyPromise = CanceledLazyPromise;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF6eVByb21pc2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9sYXp5UHJvbWlzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBYSxXQUFXO1FBWXZCO1lBQ0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFTyxhQUFhO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3hDLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO29CQUNuQixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztvQkFFcEIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3BCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM3QixDQUFDO29CQUVELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNsQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUIsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVNLFNBQVMsQ0FBQyxLQUFVO1lBQzFCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFFcEIsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxTQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEIsQ0FBQztRQUNGLENBQUM7UUFFTSxVQUFVLENBQUMsR0FBUTtZQUN6QixJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBRWhCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsVUFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCw2RUFBNkU7Z0JBQzdFLGlEQUFpRDtnQkFDakQsSUFBQSwwQkFBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0YsQ0FBQztRQUVNLElBQUksQ0FBQyxPQUFZLEVBQUUsS0FBVTtZQUNuQyxPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFTSxLQUFLLENBQUMsS0FBVTtZQUN0QixPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFTSxPQUFPLENBQUMsUUFBb0I7WUFDbEMsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLENBQUM7S0FDRDtJQXJGRCxrQ0FxRkM7SUFFRCxNQUFhLG1CQUFvQixTQUFRLFdBQVc7UUFDbkQ7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSwwQkFBaUIsRUFBRSxDQUFDO1FBQ3JDLENBQUM7S0FDRDtJQU5ELGtEQU1DIn0=