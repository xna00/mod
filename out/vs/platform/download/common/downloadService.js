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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/request/common/request"], function (require, exports, cancellation_1, network_1, files_1, request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DownloadService = void 0;
    let DownloadService = class DownloadService {
        constructor(requestService, fileService) {
            this.requestService = requestService;
            this.fileService = fileService;
        }
        async download(resource, target, cancellationToken = cancellation_1.CancellationToken.None) {
            if (resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.vscodeRemote) {
                // Intentionally only support this for file|remote<->file|remote scenarios
                await this.fileService.copy(resource, target);
                return;
            }
            const options = { type: 'GET', url: resource.toString(true) };
            const context = await this.requestService.request(options, cancellationToken);
            if (context.res.statusCode === 200) {
                await this.fileService.writeFile(target, context.stream);
            }
            else {
                const message = await (0, request_1.asTextOrError)(context);
                throw new Error(`Expected 200, got back ${context.res.statusCode} instead.\n\n${message}`);
            }
        }
    };
    exports.DownloadService = DownloadService;
    exports.DownloadService = DownloadService = __decorate([
        __param(0, request_1.IRequestService),
        __param(1, files_1.IFileService)
    ], DownloadService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9kb3dubG9hZC9jb21tb24vZG93bmxvYWRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO1FBSTNCLFlBQ21DLGNBQStCLEVBQ2xDLFdBQXlCO1lBRHRCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNsQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztRQUNyRCxDQUFDO1FBRUwsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFhLEVBQUUsTUFBVyxFQUFFLG9CQUF1QyxnQ0FBaUIsQ0FBQyxJQUFJO1lBQ3ZHLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ2xGLDBFQUEwRTtnQkFDMUUsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzlDLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDOUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUM5RSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSx1QkFBYSxFQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsZ0JBQWdCLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDNUYsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBeEJZLDBDQUFlOzhCQUFmLGVBQWU7UUFLekIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxvQkFBWSxDQUFBO09BTkYsZUFBZSxDQXdCM0IifQ==