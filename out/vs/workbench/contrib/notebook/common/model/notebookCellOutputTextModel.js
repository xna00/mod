/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, lifecycle_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellOutputTextModel = void 0;
    class NotebookCellOutputTextModel extends lifecycle_1.Disposable {
        get outputs() {
            return this._rawOutput.outputs || [];
        }
        get metadata() {
            return this._rawOutput.metadata;
        }
        get outputId() {
            return this._rawOutput.outputId;
        }
        get alternativeOutputId() {
            return this._alternativeOutputId;
        }
        get versionId() {
            return this._versionId;
        }
        constructor(_rawOutput) {
            super();
            this._rawOutput = _rawOutput;
            this._onDidChangeData = this._register(new event_1.Emitter());
            this.onDidChangeData = this._onDidChangeData.event;
            this._versionId = 0;
            // mime: versionId: buffer length
            this.versionedBufferLengths = {};
            this._alternativeOutputId = this._rawOutput.outputId;
        }
        replaceData(rawData) {
            this.versionedBufferLengths = {};
            this._rawOutput = rawData;
            this.optimizeOutputItems();
            this._versionId = this._versionId + 1;
            this._onDidChangeData.fire();
        }
        appendData(items) {
            this.trackBufferLengths();
            this._rawOutput.outputs.push(...items);
            this.optimizeOutputItems();
            this._versionId = this._versionId + 1;
            this._onDidChangeData.fire();
        }
        trackBufferLengths() {
            this.outputs.forEach(output => {
                if ((0, notebookCommon_1.isTextStreamMime)(output.mime)) {
                    if (!this.versionedBufferLengths[output.mime]) {
                        this.versionedBufferLengths[output.mime] = {};
                    }
                    this.versionedBufferLengths[output.mime][this.versionId] = output.data.byteLength;
                }
            });
        }
        appendedSinceVersion(versionId, mime) {
            const bufferLength = this.versionedBufferLengths[mime]?.[versionId];
            const output = this.outputs.find(output => output.mime === mime);
            if (bufferLength && output) {
                return output.data.slice(bufferLength);
            }
            return undefined;
        }
        optimizeOutputItems() {
            if (this.outputs.length > 1 && this.outputs.every(item => (0, notebookCommon_1.isTextStreamMime)(item.mime))) {
                // Look for the mimes in the items, and keep track of their order.
                // Merge the streams into one output item, per mime type.
                const mimeOutputs = new Map();
                const mimeTypes = [];
                this.outputs.forEach(item => {
                    let items;
                    if (mimeOutputs.has(item.mime)) {
                        items = mimeOutputs.get(item.mime);
                    }
                    else {
                        items = [];
                        mimeOutputs.set(item.mime, items);
                        mimeTypes.push(item.mime);
                    }
                    items.push(item.data.buffer);
                });
                this.outputs.length = 0;
                mimeTypes.forEach(mime => {
                    const compressionResult = (0, notebookCommon_1.compressOutputItemStreams)(mimeOutputs.get(mime));
                    this.outputs.push({
                        mime,
                        data: compressionResult.data
                    });
                    if (compressionResult.didCompression) {
                        // we can't rely on knowing buffer lengths if we've erased previous lines
                        this.versionedBufferLengths = {};
                    }
                });
            }
        }
        asDto() {
            return {
                // data: this._data,
                metadata: this._rawOutput.metadata,
                outputs: this._rawOutput.outputs,
                outputId: this._rawOutput.outputId
            };
        }
        bumpVersion() {
            this._versionId = this._versionId + 1;
        }
    }
    exports.NotebookCellOutputTextModel = NotebookCellOutputTextModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsT3V0cHV0VGV4dE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbW9kZWwvbm90ZWJvb2tDZWxsT3V0cHV0VGV4dE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLDJCQUE0QixTQUFRLHNCQUFVO1FBSzFELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQ2pDLENBQUM7UUFFRCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQ2pDLENBQUM7UUFPRCxJQUFJLG1CQUFtQjtZQUN0QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNsQyxDQUFDO1FBSUQsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxZQUNTLFVBQXNCO1lBRTlCLEtBQUssRUFBRSxDQUFDO1lBRkEsZUFBVSxHQUFWLFVBQVUsQ0FBWTtZQS9CdkIscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDL0Qsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBdUJ0QyxlQUFVLEdBQUcsQ0FBQyxDQUFDO1lBeUN2QixpQ0FBaUM7WUFDekIsMkJBQXNCLEdBQTJDLEVBQUUsQ0FBQztZQS9CM0UsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxVQUFVLENB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