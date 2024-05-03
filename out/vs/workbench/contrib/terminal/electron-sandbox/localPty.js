/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminal/common/basePty"], function (require, exports, basePty_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalPty = void 0;
    /**
     * Responsible for establishing and maintaining a connection with an existing terminal process
     * created on the local pty host.
     */
    class LocalPty extends basePty_1.BasePty {
        constructor(id, shouldPersist, _proxy) {
            super(id, shouldPersist);
            this._proxy = _proxy;
        }
        start() {
            return this._proxy.start(this.id);
        }
        detach(forcePersist) {
            return this._proxy.detachFromProcess(this.id, forcePersist);
        }
        shutdown(immediate) {
            this._proxy.shutdown(this.id, immediate);
        }
        async processBinary(data) {
            if (this._inReplay) {
                return;
            }
            return this._proxy.processBinary(this.id, data);
        }
        input(data) {
            if (this._inReplay) {
                return;
            }
            this._proxy.input(this.id, data);
        }
        resize(cols, rows) {
            if (this._inReplay || this._lastDimensions.cols === cols && this._lastDimensions.rows === rows) {
                return;
            }
            this._lastDimensions.cols = cols;
            this._lastDimensions.rows = rows;
            this._proxy.resize(this.id, cols, rows);
        }
        async clearBuffer() {
            this._proxy.clearBuffer?.(this.id);
        }
        freePortKillProcess(port) {
            if (!this._proxy.freePortKillProcess) {
                throw new Error('freePortKillProcess does not exist on the local pty service');
            }
            return this._proxy.freePortKillProcess(port);
        }
        async refreshProperty(type) {
            return this._proxy.refreshProperty(this.id, type);
        }
        async updateProperty(type, value) {
            return this._proxy.updateProperty(this.id, type, value);
        }
        acknowledgeDataEvent(charCount) {
            if (this._inReplay) {
                return;
            }
            this._proxy.acknowledgeDataEvent(this.id, charCount);
        }
        setUnicodeVersion(version) {
            return this._proxy.setUnicodeVersion(this.id, version);
        }
        handleOrphanQuestion() {
            this._proxy.orphanQuestionReply(this.id);
        }
    }
    exports.LocalPty = LocalPty;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxQdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2VsZWN0cm9uLXNhbmRib3gvbG9jYWxQdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHOzs7T0FHRztJQUNILE1BQWEsUUFBUyxTQUFRLGlCQUFPO1FBQ3BDLFlBQ0MsRUFBVSxFQUNWLGFBQXNCLEVBQ0wsTUFBbUI7WUFFcEMsS0FBSyxDQUFDLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUZSLFdBQU0sR0FBTixNQUFNLENBQWE7UUFHckMsQ0FBQztRQUVELEtBQUs7WUFDSixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsTUFBTSxDQUFDLFlBQXNCO1lBQzVCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFRCxRQUFRLENBQUMsU0FBa0I7WUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFZO1lBQy9CLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQixPQUFPO1lBQ1IsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsS0FBSyxDQUFDLElBQVk7WUFDakIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQVksRUFBRSxJQUFZO1lBQ2hDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2hHLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVc7WUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELG1CQUFtQixDQUFDLElBQVk7WUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQWdDLElBQU87WUFDM0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFnQyxJQUFPLEVBQUUsS0FBNkI7WUFDekYsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRUQsb0JBQW9CLENBQUMsU0FBaUI7WUFDckMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxPQUFtQjtZQUNwQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQsb0JBQW9CO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FDRDtJQTdFRCw0QkE2RUMifQ==