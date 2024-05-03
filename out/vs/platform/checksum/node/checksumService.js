/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "crypto", "vs/base/common/stream", "vs/platform/files/common/files"], function (require, exports, crypto_1, stream_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChecksumService = void 0;
    let ChecksumService = class ChecksumService {
        constructor(fileService) {
            this.fileService = fileService;
        }
        async checksum(resource) {
            const stream = (await this.fileService.readFileStream(resource)).value;
            return new Promise((resolve, reject) => {
                const hash = (0, crypto_1.createHash)('sha256');
                (0, stream_1.listenStream)(stream, {
                    onData: data => hash.update(data.buffer),
                    onError: error => reject(error),
                    onEnd: () => resolve(hash.digest('base64').replace(/=+$/, ''))
                });
            });
        }
    };
    exports.ChecksumService = ChecksumService;
    exports.ChecksumService = ChecksumService = __decorate([
        __param(0, files_1.IFileService)
    ], ChecksumService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tzdW1TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jaGVja3N1bS9ub2RlL2NoZWNrc3VtU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZTtRQUkzQixZQUEyQyxXQUF5QjtZQUF6QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztRQUFJLENBQUM7UUFFekUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFhO1lBQzNCLE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN2RSxPQUFPLElBQUksT0FBTyxDQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUM5QyxNQUFNLElBQUksR0FBRyxJQUFBLG1CQUFVLEVBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRWxDLElBQUEscUJBQVksRUFBQyxNQUFNLEVBQUU7b0JBQ3BCLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztvQkFDeEMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztvQkFDL0IsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7aUJBQzlELENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUFsQlksMENBQWU7OEJBQWYsZUFBZTtRQUlkLFdBQUEsb0JBQVksQ0FBQTtPQUpiLGVBQWUsQ0FrQjNCIn0=