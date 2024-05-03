/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellDecorations = void 0;
    class CellDecorations extends cellPart_1.CellContentPart {
        constructor(rootContainer, decorationContainer) {
            super();
            this.rootContainer = rootContainer;
            this.decorationContainer = decorationContainer;
        }
        didRenderCell(element) {
            const removedClassNames = [];
            this.rootContainer.classList.forEach(className => {
                if (/^nb\-.*$/.test(className)) {
                    removedClassNames.push(className);
                }
            });
            removedClassNames.forEach(className => {
                this.rootContainer.classList.remove(className);
            });
            this.decorationContainer.innerText = '';
            const generateCellTopDecorations = () => {
                this.decorationContainer.innerText = '';
                element.getCellDecorations().filter(options => options.topClassName !== undefined).forEach(options => {
                    this.decorationContainer.append(DOM.$(`.${options.topClassName}`));
                });
            };
            this.cellDisposables.add(element.onCellDecorationsChanged((e) => {
                const modified = e.added.find(e => e.topClassName) || e.removed.find(e => e.topClassName);
                if (modified) {
                    generateCellTopDecorations();
                }
            }));
            generateCellTopDecorations();
        }
    }
    exports.CellDecorations = CellDecorations;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxEZWNvcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxlQUFnQixTQUFRLDBCQUFlO1FBQ25ELFlBQ1UsYUFBMEIsRUFDMUIsbUJBQWdDO1lBRXpDLEtBQUssRUFBRSxDQUFDO1lBSEMsa0JBQWEsR0FBYixhQUFhLENBQWE7WUFDMUIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFhO1FBRzFDLENBQUM7UUFFUSxhQUFhLENBQUMsT0FBdUI7WUFDN0MsTUFBTSxpQkFBaUIsR0FBYSxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUNoRCxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNoRCxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBRXhDLE1BQU0sMEJBQTBCLEdBQUcsR0FBRyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFFeEMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBQ3BHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxZQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JFLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDO1lBRUYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQy9ELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUUxRixJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNkLDBCQUEwQixFQUFFLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosMEJBQTBCLEVBQUUsQ0FBQztRQUM5QixDQUFDO0tBQ0Q7SUF4Q0QsMENBd0NDIn0=