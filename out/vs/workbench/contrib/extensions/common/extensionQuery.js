/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/platform/extensions/common/extensions"], function (require, exports, arrays_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Query = void 0;
    class Query {
        constructor(value, sortBy) {
            this.value = value;
            this.sortBy = sortBy;
            this.value = value.trim();
        }
        static suggestions(query) {
            const commands = ['installed', 'updates', 'enabled', 'disabled', 'builtin', 'featured', 'popular', 'recommended', 'recentlyPublished', 'workspaceUnsupported', 'deprecated', 'sort', 'category', 'tag', 'ext', 'id'];
            const subcommands = {
                'sort': ['installs', 'rating', 'name', 'publishedDate', 'updateDate'],
                'category': extensions_1.EXTENSION_CATEGORIES.map(c => `"${c.toLowerCase()}"`),
                'tag': [''],
                'ext': [''],
                'id': ['']
            };
            const queryContains = (substr) => query.indexOf(substr) > -1;
            const hasSort = subcommands.sort.some(subcommand => queryContains(`@sort:${subcommand}`));
            const hasCategory = subcommands.category.some(subcommand => queryContains(`@category:${subcommand}`));
            return (0, arrays_1.flatten)(commands.map(command => {
                if (hasSort && command === 'sort' || hasCategory && command === 'category') {
                    return [];
                }
                if (command in subcommands) {
                    return subcommands[command]
                        .map(subcommand => `@${command}:${subcommand}${subcommand === '' ? '' : ' '}`);
                }
                else {
                    return queryContains(`@${command}`) ? [] : [`@${command} `];
                }
            }));
        }
        static parse(value) {
            let sortBy = '';
            value = value.replace(/@sort:(\w+)(-\w*)?/g, (match, by, order) => {
                sortBy = by;
                return '';
            });
            return new Query(value, sortBy);
        }
        toString() {
            let result = this.value;
            if (this.sortBy) {
                result = `${result}${result ? ' ' : ''}@sort:${this.sortBy}`;
            }
            return result;
        }
        isValid() {
            return !/@outdated/.test(this.value);
        }
        equals(other) {
            return this.value === other.value && this.sortBy === other.sortBy;
        }
    }
    exports.Query = Query;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUXVlcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvblF1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLEtBQUs7UUFFakIsWUFBbUIsS0FBYSxFQUFTLE1BQWM7WUFBcEMsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUFTLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDdEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBYTtZQUMvQixNQUFNLFFBQVEsR0FBRyxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQVUsQ0FBQztZQUM5TixNQUFNLFdBQVcsR0FBRztnQkFDbkIsTUFBTSxFQUFFLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLFlBQVksQ0FBQztnQkFDckUsVUFBVSxFQUFFLGlDQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUM7Z0JBQ2pFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDWCxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO2FBQ0QsQ0FBQztZQUVY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