/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors"], function (require, exports, files_1, event_1, lifecycle_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FetchFileSystemProvider = void 0;
    class FetchFileSystemProvider {
        constructor() {
            this.capabilities = 2048 /* FileSystemProviderCapabilities.Readonly */ + 2 /* FileSystemProviderCapabilities.FileReadWrite */ + 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
        }
        // working implementations
        async readFile(resource) {
            try {
                const res = await fetch(resource.toString(true));
                if (res.status === 200) {
                    return new Uint8Array(await res.arrayBuffer());
                }
                throw (0, files_1.createFileSystemProviderError)(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
            }
            catch (err) {
                throw (0, files_1.createFileSystemProviderError)(err, files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        // fake implementations
        async stat(_resource) {
            return {
                type: files_1.FileType.File,
                size: 0,
                mtime: 0,
                ctime: 0
            };
        }
        watch() {
            return lifecycle_1.Disposable.None;
        }
        // error implementations
        writeFile(_resource, _content, _opts) {
            throw new errors_1.NotSupportedError();
        }
        readdir(_resource) {
            throw new errors_1.NotSupportedError();
        }
        mkdir(_resource) {
            throw new errors_1.NotSupportedError();
        }
        delete(_resource, _opts) {
            throw new errors_1.NotSupportedError();
        }
        rename(_from, _to, _opts) {
            throw new errors_1.NotSupportedError();
        }
    }
    exports.FetchFileSystemProvider = FetchFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViV29ya2VyRmlsZVN5c3RlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9icm93c2VyL3dlYldvcmtlckZpbGVTeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSx1QkFBdUI7UUFBcEM7WUFFVSxpQkFBWSxHQUFHLHlHQUFzRiw4REFBbUQsQ0FBQztZQUN6Siw0QkFBdUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3JDLG9CQUFlLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztRQTZDdkMsQ0FBQztRQTNDQSwwQkFBMEI7UUFDMUIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFhO1lBQzNCLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQztvQkFDeEIsT0FBTyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxHQUFHLENBQUMsVUFBVSxFQUFFLG1DQUEyQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFGLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxHQUFHLEVBQUUsbUNBQTJCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0UsQ0FBQztRQUNGLENBQUM7UUFFRCx1QkFBdUI7UUFDdkIsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFjO1lBQ3hCLE9BQU87Z0JBQ04sSUFBSSxFQUFFLGdCQUFRLENBQUMsSUFBSTtnQkFDbkIsSUFBSSxFQUFFLENBQUM7Z0JBQ1AsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsS0FBSyxFQUFFLENBQUM7YUFDUixDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUs7WUFDSixPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsU0FBUyxDQUFDLFNBQWMsRUFBRSxRQUFvQixFQUFFLEtBQXdCO1lBQ3ZFLE1BQU0sSUFBSSwwQkFBaUIsRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFDRCxPQUFPLENBQUMsU0FBYztZQUNyQixNQUFNLElBQUksMEJBQWlCLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBQ0QsS0FBSyxDQUFDLFNBQWM7WUFDbkIsTUFBTSxJQUFJLDBCQUFpQixFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUNELE1BQU0sQ0FBQyxTQUFjLEVBQUUsS0FBeUI7WUFDL0MsTUFBTSxJQUFJLDBCQUFpQixFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUNELE1BQU0sQ0FBQyxLQUFVLEVBQUUsR0FBUSxFQUFFLEtBQTRCO1lBQ3hELE1BQU0sSUFBSSwwQkFBaUIsRUFBRSxDQUFDO1FBQy9CLENBQUM7S0FDRDtJQWpERCwwREFpREMifQ==