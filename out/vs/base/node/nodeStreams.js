define(["require", "exports", "stream", "vs/base/common/buffer"], function (require, exports, stream_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StreamSplitter = void 0;
    /**
     * A Transform stream that splits the input on the "splitter" substring.
     * The resulting chunks will contain (and trail with) the splitter match.
     * The last chunk when the stream ends will be emitted even if a splitter
     * is not encountered.
     */
    class StreamSplitter extends stream_1.Transform {
        constructor(splitter) {
            super();
            if (typeof splitter === 'number') {
                this.splitter = splitter;
                this.spitterLen = 1;
            }
            else {
                const buf = Buffer.isBuffer(splitter) ? splitter : Buffer.from(splitter);
                this.splitter = buf.length === 1 ? buf[0] : buf;
                this.spitterLen = buf.length;
            }
        }
        _transform(chunk, _encoding, callback) {
            if (!this.buffer) {
                this.buffer = chunk;
            }
            else {
                this.buffer = Buffer.concat([this.buffer, chunk]);
            }
            let offset = 0;
            while (offset < this.buffer.length) {
                const index = typeof this.splitter === 'number'
                    ? this.buffer.indexOf(this.splitter, offset)
                    : (0, buffer_1.binaryIndexOf)(this.buffer, this.splitter, offset);
                if (index === -1) {
                    break;
                }
                this.push(this.buffer.slice(offset, index + this.spitterLen));
                offset = index + this.spitterLen;
            }
            this.buffer = offset === this.buffer.length ? undefined : this.buffer.slice(offset);
            callback();
        }
        _flush(callback) {
            if (this.buffer) {
                this.push(this.buffer);
            }
            callback();
        }
    }
    exports.StreamSplitter = StreamSplitter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZVN0cmVhbXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS9ub2RlU3RyZWFtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBT0E7Ozs7O09BS0c7SUFDSCxNQUFhLGNBQWUsU0FBUSxrQkFBUztRQUs1QyxZQUFZLFFBQWtDO1lBQzdDLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3pFLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNoRCxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFFUSxVQUFVLENBQUMsS0FBYSxFQUFFLFNBQWlCLEVBQUUsUUFBb0Q7WUFDekcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDckIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBRUQsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsT0FBTyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxLQUFLLEdBQUcsT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLFFBQVE7b0JBQzlDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQztvQkFDNUMsQ0FBQyxDQUFDLElBQUEsc0JBQWEsRUFBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3JELElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2xCLE1BQU07Z0JBQ1AsQ0FBQztnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNsQyxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEYsUUFBUSxFQUFFLENBQUM7UUFDWixDQUFDO1FBRVEsTUFBTSxDQUFDLFFBQW9EO1lBQ25FLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBRUQsUUFBUSxFQUFFLENBQUM7UUFDWixDQUFDO0tBQ0Q7SUFoREQsd0NBZ0RDIn0=