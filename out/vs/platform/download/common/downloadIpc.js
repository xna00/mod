/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DownloadServiceChannelClient = exports.DownloadServiceChannel = void 0;
    class DownloadServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event, arg) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'download': return this.service.download(uri_1.URI.revive(args[0]), uri_1.URI.revive(args[1]));
            }
            throw new Error('Invalid call');
        }
    }
    exports.DownloadServiceChannel = DownloadServiceChannel;
    class DownloadServiceChannelClient {
        constructor(channel, getUriTransformer) {
            this.channel = channel;
            this.getUriTransformer = getUriTransformer;
        }
        async download(from, to) {
            const uriTransformer = this.getUriTransformer();
            if (uriTransformer) {
                from = uriTransformer.transformOutgoingURI(from);
                to = uriTransformer.transformOutgoingURI(to);
            }
            await this.channel.call('download', [from, to]);
        }
    }
    exports.DownloadServiceChannelClient = DownloadServiceChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWRJcGMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2Rvd25sb2FkL2NvbW1vbi9kb3dubG9hZElwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxzQkFBc0I7UUFFbEMsWUFBNkIsT0FBeUI7WUFBekIsWUFBTyxHQUFQLE9BQU8sQ0FBa0I7UUFBSSxDQUFDO1FBRTNELE1BQU0sQ0FBQyxDQUFVLEVBQUUsS0FBYSxFQUFFLEdBQVM7WUFDMUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBWSxFQUFFLE9BQWUsRUFBRSxJQUFVO1lBQzdDLFFBQVEsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssVUFBVSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RixDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqQyxDQUFDO0tBQ0Q7SUFkRCx3REFjQztJQUVELE1BQWEsNEJBQTRCO1FBSXhDLFlBQW9CLE9BQWlCLEVBQVUsaUJBQStDO1lBQTFFLFlBQU8sR0FBUCxPQUFPLENBQVU7WUFBVSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQThCO1FBQUksQ0FBQztRQUVuRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQVMsRUFBRSxFQUFPO1lBQ2hDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ2hELElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksR0FBRyxjQUFjLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pELEVBQUUsR0FBRyxjQUFjLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUNELE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQztLQUNEO0lBZEQsb0VBY0MifQ==