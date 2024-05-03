define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectPool = void 0;
    class ObjectPool {
        constructor(_create) {
            this._create = _create;
            this._unused = new Set();
            this._used = new Set();
            this._itemData = new Map();
        }
        getUnusedObj(data) {
            let obj;
            if (this._unused.size === 0) {
                obj = this._create(data);
                this._itemData.set(obj, data);
            }
            else {
                const values = [...this._unused.values()];
                obj = values.find(obj => this._itemData.get(obj).getId() === data.getId()) ?? values[0];
                this._unused.delete(obj);
                this._itemData.set(obj, data);
                obj.setData(data);
            }
            this._used.add(obj);
            return {
                object: obj,
                dispose: () => {
                    this._used.delete(obj);
                    if (this._unused.size > 5) {
                        obj.dispose();
                    }
                    else {
                        this._unused.add(obj);
                    }
                }
            };
        }
        dispose() {
            for (const obj of this._used) {
                obj.dispose();
            }
            for (const obj of this._unused) {
                obj.dispose();
            }
            this._used.clear();
            this._unused.clear();
        }
    }
    exports.ObjectPool = ObjectPool;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0UG9vbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L211bHRpRGlmZkVkaXRvci9vYmplY3RQb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFNQSxNQUFhLFVBQVU7UUFLdEIsWUFDa0IsT0FBMkI7WUFBM0IsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7WUFMNUIsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7WUFDdkIsVUFBSyxHQUFHLElBQUksR0FBRyxFQUFLLENBQUM7WUFDckIsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFZLENBQUM7UUFJN0MsQ0FBQztRQUVFLFlBQVksQ0FBQyxJQUFXO1lBQzlCLElBQUksR0FBTSxDQUFDO1lBRVgsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDMUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pGLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzlCLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkIsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLE9BQU87Z0JBQ04sTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDdkIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDM0IsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNmLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDdkIsQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPO1lBQ04sS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzlCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLENBQUM7WUFDRCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN0QixDQUFDO0tBQ0Q7SUE5Q0QsZ0NBOENDIn0=