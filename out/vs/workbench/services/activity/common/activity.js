/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressBadge = exports.IconBadge = exports.NumberBadge = exports.IActivityService = void 0;
    exports.IActivityService = (0, instantiation_1.createDecorator)('activityService');
    class BaseBadge {
        constructor(descriptorFn) {
            this.descriptorFn = descriptorFn;
            this.descriptorFn = descriptorFn;
        }
        getDescription() {
            return this.descriptorFn(null);
        }
    }
    class NumberBadge extends BaseBadge {
        constructor(number, descriptorFn) {
            super(descriptorFn);
            this.number = number;
            this.number = number;
        }
        getDescription() {
            return this.descriptorFn(this.number);
        }
    }
    exports.NumberBadge = NumberBadge;
    class IconBadge extends BaseBadge {
        constructor(icon, descriptorFn) {
            super(descriptorFn);
            this.icon = icon;
        }
    }
    exports.IconBadge = IconBadge;
    class ProgressBadge extends BaseBadge {
    }
    exports.ProgressBadge = ProgressBadge;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hY3Rpdml0eS9jb21tb24vYWN0aXZpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYW5GLFFBQUEsZ0JBQWdCLEdBQUcsSUFBQSwrQkFBZSxFQUFtQixpQkFBaUIsQ0FBQyxDQUFDO0lBOENyRixNQUFNLFNBQVM7UUFFZCxZQUFxQixZQUFrQztZQUFsQyxpQkFBWSxHQUFaLFlBQVksQ0FBc0I7WUFDdEQsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDbEMsQ0FBQztRQUVELGNBQWM7WUFDYixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztLQUNEO0lBRUQsTUFBYSxXQUFZLFNBQVEsU0FBUztRQUV6QyxZQUFxQixNQUFjLEVBQUUsWUFBcUM7WUFDekUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBREEsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUdsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUN0QixDQUFDO1FBRVEsY0FBYztZQUN0QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRDtJQVhELGtDQVdDO0lBRUQsTUFBYSxTQUFVLFNBQVEsU0FBUztRQUN2QyxZQUFxQixJQUFlLEVBQUUsWUFBMEI7WUFDL0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBREEsU0FBSSxHQUFKLElBQUksQ0FBVztRQUVwQyxDQUFDO0tBQ0Q7SUFKRCw4QkFJQztJQUVELE1BQWEsYUFBYyxTQUFRLFNBQVM7S0FBSTtJQUFoRCxzQ0FBZ0QifQ==