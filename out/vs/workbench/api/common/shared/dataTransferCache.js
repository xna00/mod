/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer"], function (require, exports, arrays_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataTransferFileCache = void 0;
    class DataTransferFileCache {
        constructor() {
            this.requestIdPool = 0;
            this.dataTransferFiles = new Map();
        }
        add(dataTransfer) {
            const requestId = this.requestIdPool++;
            this.dataTransferFiles.set(requestId, (0, arrays_1.coalesce)(Array.from(dataTransfer, ([, item]) => item.asFile())));
            return {
                id: requestId,
                dispose: () => {
                    this.dataTransferFiles.delete(requestId);
                }
            };
        }
        async resolveFileData(requestId, dataItemId) {
            const files = this.dataTransferFiles.get(requestId);
            if (!files) {
                throw new Error('No data transfer found');
            }
            const file = files.find(file => file.id === dataItemId);
            if (!file) {
                throw new Error('No matching file found in data transfer');
            }
            return buffer_1.VSBuffer.wrap(await file.data());
        }
        dispose() {
            this.dataTransferFiles.clear();
        }
    }
    exports.DataTransferFileCache = DataTransferFileCache;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YVRyYW5zZmVyQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL3NoYXJlZC9kYXRhVHJhbnNmZXJDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxxQkFBcUI7UUFBbEM7WUFFUyxrQkFBYSxHQUFHLENBQUMsQ0FBQztZQUNULHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUE0RCxDQUFDO1FBOEIxRyxDQUFDO1FBNUJPLEdBQUcsQ0FBQyxZQUFxQztZQUMvQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBQSxpQkFBUSxFQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkcsT0FBTztnQkFDTixFQUFFLEVBQUUsU0FBUztnQkFDYixPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzFDLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsU0FBaUIsRUFBRSxVQUFrQjtZQUMxRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLFVBQVUsQ0FBQyxDQUFDO1lBQ3hELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVELE9BQU8saUJBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxDQUFDO0tBQ0Q7SUFqQ0Qsc0RBaUNDIn0=