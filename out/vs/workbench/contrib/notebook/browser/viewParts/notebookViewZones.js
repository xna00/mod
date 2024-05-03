/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, fastDomNode_1, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookViewZones = void 0;
    const invalidFunc = () => { throw new Error(`Invalid notebook view zone change accessor`); };
    class NotebookViewZones extends lifecycle_1.Disposable {
        constructor(listView, coordinator) {
            super();
            this.listView = listView;
            this.coordinator = coordinator;
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setClassName('view-zones');
            this.domNode.setPosition('absolute');
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this.domNode.setWidth('100%');
            this._zones = {};
            this.listView.containerDomNode.appendChild(this.domNode.domNode);
        }
        changeViewZones(callback) {
            let zonesHaveChanged = false;
            const changeAccessor = {
                addZone: (zone) => {
                    zonesHaveChanged = true;
                    return this._addZone(zone);
                },
                removeZone: (id) => {
                    zonesHaveChanged = true;
                    // TODO: validate if zones have changed layout
                    this._removeZone(id);
                },
                layoutZone: (id) => {
                    zonesHaveChanged = true;
                    // TODO: validate if zones have changed layout
                    this._layoutZone(id);
                }
            };
            safeInvoke1Arg(callback, changeAccessor);
            // Invalidate changeAccessor
            changeAccessor.addZone = invalidFunc;
            changeAccessor.removeZone = invalidFunc;
            changeAccessor.layoutZone = invalidFunc;
            return zonesHaveChanged;
        }
        onCellsChanged(e) {
            const splices = e.splices.slice().reverse();
            splices.forEach(splice => {
                const [start, deleted, newCells] = splice;
                const fromIndex = start;
                const toIndex = start + deleted;
                // 1, 2, 0
                // delete cell index 1 and 2
                // from index 1, to index 3 (exclusive): [1, 3)
                // if we have whitespace afterModelPosition 3, which is after cell index 2
                for (const id in this._zones) {
                    const zone = this._zones[id].zone;
                    const cellBeforeWhitespaceIndex = zone.afterModelPosition - 1;
                    if (cellBeforeWhitespaceIndex >= fromIndex && cellBeforeWhitespaceIndex < toIndex) {
                        // The cell this whitespace was after has been deleted
                        //  => move whitespace to before first deleted cell
                        zone.afterModelPosition = fromIndex;
                        this._updateWhitespace(this._zones[id]);
                    }
                    else if (cellBeforeWhitespaceIndex >= toIndex) {
                        // adjust afterModelPosition for all other cells
                        const insertLength = newCells.length;
                        const offset = insertLength - deleted;
                        zone.afterModelPosition += offset;
                        this._updateWhitespace(this._zones[id]);
                    }
                }
            });
        }
        onHiddenRangesChange() {
            for (const id in this._zones) {
                this._updateWhitespace(this._zones[id]);
            }
        }
        _updateWhitespace(zone) {
            const whitespaceId = zone.whitespaceId;
            const viewPosition = this.coordinator.convertModelIndexToViewIndex(zone.zone.afterModelPosition);
            const isInHiddenArea = this._isInHiddenRanges(zone.zone);
            zone.isInHiddenArea = isInHiddenArea;
            this.listView.changeOneWhitespace(whitespaceId, viewPosition, isInHiddenArea ? 0 : zone.zone.heightInPx);
        }
        layout() {
            for (const id in this._zones) {
                this._layoutZone(id);
            }
        }
        _addZone(zone) {
            const viewPosition = this.coordinator.convertModelIndexToViewIndex(zone.afterModelPosition);
            const whitespaceId = this.listView.insertWhitespace(viewPosition, zone.heightInPx);
            const isInHiddenArea = this._isInHiddenRanges(zone);
            const myZone = {
                whitespaceId: whitespaceId,
                zone: zone,
                domNode: (0, fastDomNode_1.createFastDomNode)(zone.domNode),
                isInHiddenArea: isInHiddenArea
            };
            this._zones[whitespaceId] = myZone;
            myZone.domNode.setPosition('absolute');
            myZone.domNode.domNode.style.width = '100%';
            myZone.domNode.setDisplay('none');
            myZone.domNode.setAttribute('notebook-view-zone', whitespaceId);
            this.domNode.appendChild(myZone.domNode);
            return whitespaceId;
        }
        _removeZone(id) {
            this.listView.removeWhitespace(id);
            delete this._zones[id];
        }
        _layoutZone(id) {
            const zoneWidget = this._zones[id];
            if (!zoneWidget) {
                return;
            }
            this._updateWhitespace(this._zones[id]);
            const isInHiddenArea = this._isInHiddenRanges(zoneWidget.zone);
            if (isInHiddenArea) {
                zoneWidget.domNode.setDisplay('none');
            }
            else {
                const top = this.listView.getWhitespacePosition(zoneWidget.whitespaceId);
                zoneWidget.domNode.setTop(top);
                zoneWidget.domNode.setDisplay('block');
                zoneWidget.domNode.setHeight(zoneWidget.zone.heightInPx);
            }
        }
        _isInHiddenRanges(zone) {
            // The view zone is between two cells (zone.afterModelPosition - 1, zone.afterModelPosition)
            const afterIndex = zone.afterModelPosition;
            // In notebook, the first cell (markdown cell) in a folding range is always visible, so we need to check the cell after the notebook view zone
            return !this.coordinator.modelIndexIsVisible(afterIndex);
        }
        dispose() {
            super.dispose();
            this._zones = {};
        }
    }
    exports.NotebookViewZones = NotebookViewZones;
    function safeInvoke1Arg(func, arg1) {
        try {
            return func(arg1);
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWaWV3Wm9uZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld1BhcnRzL25vdGVib29rVmlld1pvbmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFNLFdBQVcsR0FBRyxHQUFHLEVBQUUsR0FBRyxNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFTN0YsTUFBYSxpQkFBa0IsU0FBUSxzQkFBVTtRQUloRCxZQUE2QixRQUE2QyxFQUFtQixXQUFrQztZQUM5SCxLQUFLLEVBQUUsQ0FBQztZQURvQixhQUFRLEdBQVIsUUFBUSxDQUFxQztZQUFtQixnQkFBVyxHQUFYLFdBQVcsQ0FBdUI7WUFFOUgsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLCtCQUFpQixFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBRWpCLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxD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