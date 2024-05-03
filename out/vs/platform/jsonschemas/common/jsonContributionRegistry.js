/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform"], function (require, exports, event_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = void 0;
    exports.Extensions = {
        JSONContribution: 'base.contributions.json'
    };
    function normalizeId(id) {
        if (id.length > 0 && id.charAt(id.length - 1) === '#') {
            return id.substring(0, id.length - 1);
        }
        return id;
    }
    class JSONContributionRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.schemasById = {};
        }
        registerSchema(uri, unresolvedSchemaContent) {
            this.schemasById[normalizeId(uri)] = unresolvedSchemaContent;
            this._onDidChangeSchema.fire(uri);
        }
        notifySchemaChanged(uri) {
            this._onDidChangeSchema.fire(uri);
        }
        getSchemaContributions() {
            return {
                schemas: this.schemasById,
            };
        }
    }
    const jsonContributionRegistry = new JSONContributionRegistry();
    platform.Registry.add(exports.Extensions.JSONContribution, jsonContributionRegistry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkNvbnRyaWJ1dGlvblJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9qc29uc2NoZW1hcy9jb21tb24vanNvbkNvbnRyaWJ1dGlvblJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1uRixRQUFBLFVBQVUsR0FBRztRQUN6QixnQkFBZ0IsRUFBRSx5QkFBeUI7S0FDM0MsQ0FBQztJQThCRixTQUFTLFdBQVcsQ0FBQyxFQUFVO1FBQzlCLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ3ZELE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBQ0QsT0FBTyxFQUFFLENBQUM7SUFDWCxDQUFDO0lBSUQsTUFBTSx3QkFBd0I7UUFPN0I7WUFIaUIsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztZQUNuRCxzQkFBaUIsR0FBa0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUd6RSxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRU0sY0FBYyxDQUFDLEdBQVcsRUFBRSx1QkFBb0M7WUFDdEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyx1QkFBdUIsQ0FBQztZQUM3RCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFTSxtQkFBbUIsQ0FBQyxHQUFXO1lBQ3JDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVNLHNCQUFzQjtZQUM1QixPQUFPO2dCQUNOLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVzthQUN6QixDQUFDO1FBQ0gsQ0FBQztLQUVEO0lBRUQsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLHdCQUF3QixFQUFFLENBQUM7SUFDaEUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0JBQVUsQ0FBQyxnQkFBZ0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDIn0=