/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceWithCommentThreads = exports.CommentNode = void 0;
    class CommentNode {
        constructor(uniqueOwner, owner, resource, comment, thread) {
            this.uniqueOwner = uniqueOwner;
            this.owner = owner;
            this.resource = resource;
            this.comment = comment;
            this.thread = thread;
            this.isRoot = false;
            this.replies = [];
            this.threadId = thread.threadId;
            this.range = thread.range;
            this.threadState = thread.state;
            this.threadRelevance = thread.applicability;
            this.contextValue = thread.contextValue;
            this.controllerHandle = thread.controllerHandle;
            this.threadHandle = thread.commentThreadHandle;
        }
        hasReply() {
            return this.replies && this.replies.length !== 0;
        }
    }
    exports.CommentNode = CommentNode;
    class ResourceWithCommentThreads {
        constructor(uniqueOwner, owner, resource, commentThreads) {
            this.uniqueOwner = uniqueOwner;
            this.owner = owner;
            this.id = resource.toString();
            this.resource = resource;
            this.commentThreads = commentThreads.filter(thread => thread.comments && thread.comments.length).map(thread => ResourceWithCommentThreads.createCommentNode(uniqueOwner, owner, resource, thread));
        }
        static createCommentNode(uniqueOwner, owner, resource, commentThread) {
            const { comments } = commentThread;
            const commentNodes = comments.map(comment => new CommentNode(uniqueOwner, owner, resource, comment, commentThread));
            if (commentNodes.length > 1) {
                commentNodes[0].replies = commentNodes.slice(1, commentNodes.length);
            }
            commentNodes[0].isRoot = true;
            return commentNodes[0];
        }
    }
    exports.ResourceWithCommentThreads = ResourceWithCommentThreads;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb21tZW50cy9jb21tb24vY29tbWVudE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLFdBQVc7UUFXdkIsWUFDaUIsV0FBbUIsRUFDbkIsS0FBYSxFQUNiLFFBQWEsRUFDYixPQUFnQixFQUNoQixNQUFxQjtZQUpyQixnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNiLFlBQU8sR0FBUCxPQUFPLENBQVM7WUFDaEIsV0FBTSxHQUFOLE1BQU0sQ0FBZTtZQWZ0QyxXQUFNLEdBQVksS0FBSyxDQUFDO1lBQ3hCLFlBQU8sR0FBa0IsRUFBRSxDQUFDO1lBZTNCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDMUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztZQUM1QyxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7WUFDeEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztZQUNoRCxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztRQUNoRCxDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7UUFDbEQsQ0FBQztLQUNEO0lBN0JELGtDQTZCQztJQUVELE1BQWEsMEJBQTBCO1FBUXRDLFlBQVksV0FBbUIsRUFBRSxLQUFhLEVBQUUsUUFBYSxFQUFFLGNBQStCO1lBQzdGLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3BNLENBQUM7UUFFTSxNQUFNLENBQUMsaUJBQWlCLENBQUMsV0FBbUIsRUFBRSxLQUFhLEVBQUUsUUFBYSxFQUFFLGFBQTRCO1lBQzlHLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxhQUFhLENBQUM7WUFDbkMsTUFBTSxZQUFZLEdBQWtCLFFBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNwSSxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFFRCxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUU5QixPQUFPLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDO0tBQ0Q7SUEzQkQsZ0VBMkJDIn0=