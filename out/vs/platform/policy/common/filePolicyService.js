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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/types", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/policy/common/policy"], function (require, exports, async_1, event_1, iterator_1, types_1, files_1, log_1, policy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilePolicyService = void 0;
    function keysDiff(a, b) {
        const result = [];
        for (const key of new Set(iterator_1.Iterable.concat(a.keys(), b.keys()))) {
            if (a.get(key) !== b.get(key)) {
                result.push(key);
            }
        }
        return result;
    }
    let FilePolicyService = class FilePolicyService extends policy_1.AbstractPolicyService {
        constructor(file, fileService, logService) {
            super();
            this.file = file;
            this.fileService = fileService;
            this.logService = logService;
            this.throttledDelayer = this._register(new async_1.ThrottledDelayer(500));
            const onDidChangePolicyFile = event_1.Event.filter(fileService.onDidFilesChange, e => e.affects(file));
            this._register(fileService.watch(file));
            this._register(onDidChangePolicyFile(() => this.throttledDelayer.trigger(() => this.refresh())));
        }
        async _updatePolicyDefinitions() {
            await this.refresh();
        }
        async read() {
            const policies = new Map();
            try {
                const content = await this.fileService.readFile(this.file);
                const raw = JSON.parse(content.value.toString());
                if (!(0, types_1.isObject)(raw)) {
                    throw new Error('Policy file isn\'t a JSON object');
                }
                for (const key of Object.keys(raw)) {
                    if (this.policyDefinitions[key]) {
                        policies.set(key, raw[key]);
                    }
                }
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(`[FilePolicyService] Failed to read policies`, error);
                }
            }
            return policies;
        }
        async refresh() {
            const policies = await this.read();
            const diff = keysDiff(this.policies, policies);
            this.policies = policies;
            if (diff.length > 0) {
                this._onDidChange.fire(diff);
            }
        }
    };
    exports.FilePolicyService = FilePolicyService;
    exports.FilePolicyService = FilePolicyService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], FilePolicyService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVBvbGljeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3BvbGljeS9jb21tb24vZmlsZVBvbGljeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV2hHLFNBQVMsUUFBUSxDQUFJLENBQWlCLEVBQUUsQ0FBaUI7UUFDeEQsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBRTVCLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxHQUFHLENBQUMsbUJBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNoRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRU0sSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSw4QkFBcUI7UUFJM0QsWUFDa0IsSUFBUyxFQUNaLFdBQTBDLEVBQzNDLFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBSlMsU0FBSSxHQUFKLElBQUksQ0FBSztZQUNLLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQzFCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFMckMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFTN0UsTUFBTSxxQkFBcUIsR0FBRyxhQUFLLENBQUMsTUFBTSxD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