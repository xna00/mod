/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async"], function (require, exports, dom_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ZIndex = void 0;
    exports.registerZIndex = registerZIndex;
    var ZIndex;
    (function (ZIndex) {
        ZIndex[ZIndex["Base"] = 0] = "Base";
        ZIndex[ZIndex["Sash"] = 35] = "Sash";
        ZIndex[ZIndex["SuggestWidget"] = 40] = "SuggestWidget";
        ZIndex[ZIndex["Hover"] = 50] = "Hover";
        ZIndex[ZIndex["DragImage"] = 1000] = "DragImage";
        ZIndex[ZIndex["MenubarMenuItemsHolder"] = 2000] = "MenubarMenuItemsHolder";
        ZIndex[ZIndex["ContextView"] = 2500] = "ContextView";
        ZIndex[ZIndex["ModalDialog"] = 2600] = "ModalDialog";
        ZIndex[ZIndex["PaneDropOverlay"] = 10000] = "PaneDropOverlay";
    })(ZIndex || (exports.ZIndex = ZIndex = {}));
    const ZIndexValues = Object.keys(ZIndex).filter(key => !isNaN(Number(key))).map(key => Number(key)).sort((a, b) => b - a);
    function findBase(z) {
        for (const zi of ZIndexValues) {
            if (z >= zi) {
                return zi;
            }
        }
        return -1;
    }
    class ZIndexRegistry {
        constructor() {
            this.styleSheet = (0, dom_1.createStyleSheet)();
            this.zIndexMap = new Map();
            this.scheduler = new async_1.RunOnceScheduler(() => this.updateStyleElement(), 200);
        }
        registerZIndex(relativeLayer, z, name) {
            if (this.zIndexMap.get(name)) {
                throw new Error(`z-index with name ${name} has already been registered.`);
            }
            const proposedZValue = relativeLayer + z;
            if (findBase(proposedZValue) !== relativeLayer) {
                throw new Error(`Relative layer: ${relativeLayer} + z-index: ${z} exceeds next layer ${proposedZValue}.`);
            }
            this.zIndexMap.set(name, proposedZValue);
            this.scheduler.schedule();
            return this.getVarName(name);
        }
        getVarName(name) {
            return `--z-index-${name}`;
        }
        updateStyleElement() {
            (0, dom_1.clearNode)(this.styleSheet);
            let ruleBuilder = '';
            this.zIndexMap.forEach((zIndex, name) => {
                ruleBuilder += `${this.getVarName(name)}: ${zIndex};\n`;
            });
            (0, dom_1.createCSSRule)(':root', ruleBuilder, this.styleSheet);
        }
    }
    const zIndexRegistry = new ZIndexRegistry();
    function registerZIndex(relativeLayer, z, name) {
        return zIndexRegistry.registerZIndex(relativeLayer, z, name);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiekluZGV4UmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2xheW91dC9icm93c2VyL3pJbmRleFJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFFaEcsd0NBRUM7SUFsRUQsSUFBWSxNQVVYO0lBVkQsV0FBWSxNQUFNO1FBQ2pCLG1DQUFRLENBQUE7UUFDUixvQ0FBUyxDQUFBO1FBQ1Qsc0RBQWtCLENBQUE7UUFDbEIsc0NBQVUsQ0FBQTtRQUNWLGdEQUFnQixDQUFBO1FBQ2hCLDBFQUE2QixDQUFBO1FBQzdCLG9EQUFrQixDQUFBO1FBQ2xCLG9EQUFrQixDQUFBO1FBQ2xCLDZEQUF1QixDQUFBO0lBQ3hCLENBQUMsRUFWVyxNQUFNLHNCQUFOLE1BQU0sUUFVakI7SUFFRCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzFILFNBQVMsUUFBUSxDQUFDLENBQVM7UUFDMUIsS0FBSyxNQUFNLEVBQUUsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDYixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCxNQUFNLGNBQWM7UUFJbkI7WUFDQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUEsc0JBQWdCLEdBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQzNDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsY0FBYyxDQUFDLGFBQXFCLEVBQUUsQ0FBUyxFQUFFLElBQVk7WUFDNUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixJQUFJLCtCQUErQixDQUFDLENBQUM7WUFDM0UsQ0FBQztZQUVELE1BQU0sY0FBYyxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssYUFBYSxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLGFBQWEsZUFBZSxDQUFDLHVCQUF1QixjQUFjLEdBQUcsQ0FBQyxDQUFDO1lBQzNHLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVPLFVBQVUsQ0FBQyxJQUFZO1lBQzlCLE9BQU8sYUFBYSxJQUFJLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLElBQUEsZUFBUyxFQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQ3ZDLFdBQVcsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssTUFBTSxLQUFLLENBQUM7WUFDekQsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFBLG1CQUFhLEVBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdEQsQ0FBQztLQUNEO0lBRUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztJQUU1QyxTQUFnQixjQUFjLENBQUMsYUFBcUIsRUFBRSxDQUFTLEVBQUUsSUFBWTtRQUM1RSxPQUFPLGNBQWMsQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5RCxDQUFDIn0=