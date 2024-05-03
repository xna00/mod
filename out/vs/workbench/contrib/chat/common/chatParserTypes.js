/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/marshalling", "vs/editor/common/core/offsetRange"], function (require, exports, marshalling_1, offsetRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatRequestDynamicVariablePart = exports.ChatRequestSlashCommandPart = exports.ChatRequestAgentSubcommandPart = exports.ChatRequestAgentPart = exports.ChatRequestVariablePart = exports.chatSubcommandLeader = exports.chatAgentLeader = exports.chatVariableLeader = exports.ChatRequestTextPart = void 0;
    exports.getPromptText = getPromptText;
    exports.reviveParsedChatRequest = reviveParsedChatRequest;
    exports.extractAgentAndCommand = extractAgentAndCommand;
    function getPromptText(request) {
        const message = request.parts.map(r => r.promptText).join('').trimStart();
        const diff = request.text.length - message.length;
        return { message, diff };
    }
    class ChatRequestTextPart {
        static { this.Kind = 'text'; }
        constructor(range, editorRange, text) {
            this.range = range;
            this.editorRange = editorRange;
            this.text = text;
            this.kind = ChatRequestTextPart.Kind;
        }
        get promptText() {
            return this.text;
        }
    }
    exports.ChatRequestTextPart = ChatRequestTextPart;
    // warning, these also show up in a regex in the parser
    exports.chatVariableLeader = '#';
    exports.chatAgentLeader = '@';
    exports.chatSubcommandLeader = '/';
    /**
     * An invocation of a static variable that can be resolved by the variable service
     */
    class ChatRequestVariablePart {
        static { this.Kind = 'var'; }
        constructor(range, editorRange, variableName, variableArg) {
            this.range = range;
            this.editorRange = editorRange;
            this.variableName = variableName;
            this.variableArg = variableArg;
            this.kind = ChatRequestVariablePart.Kind;
        }
        get text() {
            const argPart = this.variableArg ? `:${this.variableArg}` : '';
            return `${exports.chatVariableLeader}${this.variableName}${argPart}`;
        }
        get promptText() {
            return this.text;
        }
    }
    exports.ChatRequestVariablePart = ChatRequestVariablePart;
    /**
     * An invocation of an agent that can be resolved by the agent service
     */
    class ChatRequestAgentPart {
        static { this.Kind = 'agent'; }
        constructor(range, editorRange, agent) {
            this.range = range;
            this.editorRange = editorRange;
            this.agent = agent;
            this.kind = ChatRequestAgentPart.Kind;
        }
        get text() {
            return `${exports.chatAgentLeader}${this.agent.name}`;
        }
        get promptText() {
            return '';
        }
        /**
         * Don't stringify all the agent methods, just data.
         */
        toJSON() {
            return {
                kind: this.kind,
                range: this.range,
                editorRange: this.editorRange,
                agent: {
                    id: this.agent.id,
                    name: this.agent.name,
                    description: this.agent.description,
                    metadata: this.agent.metadata
                }
            };
        }
    }
    exports.ChatRequestAgentPart = ChatRequestAgentPart;
    /**
     * An invocation of an agent's subcommand
     */
    class ChatRequestAgentSubcommandPart {
        static { this.Kind = 'subcommand'; }
        constructor(range, editorRange, command) {
            this.range = range;
            this.editorRange = editorRange;
            this.command = command;
            this.kind = ChatRequestAgentSubcommandPart.Kind;
        }
        get text() {
            return `${exports.chatSubcommandLeader}${this.command.name}`;
        }
        get promptText() {
            return '';
        }
    }
    exports.ChatRequestAgentSubcommandPart = ChatRequestAgentSubcommandPart;
    /**
     * An invocation of a standalone slash command
     */
    class ChatRequestSlashCommandPart {
        static { this.Kind = 'slash'; }
        constructor(range, editorRange, slashCommand) {
            this.range = range;
            this.editorRange = editorRange;
            this.slashCommand = slashCommand;
            this.kind = ChatRequestSlashCommandPart.Kind;
        }
        get text() {
            return `${exports.chatSubcommandLeader}${this.slashCommand.command}`;
        }
        get promptText() {
            return `${exports.chatSubcommandLeader}${this.slashCommand.command}`;
        }
    }
    exports.ChatRequestSlashCommandPart = ChatRequestSlashCommandPart;
    /**
     * An invocation of a dynamic reference like '#file:'
     */
    class ChatRequestDynamicVariablePart {
        static { this.Kind = 'dynamic'; }
        constructor(range, editorRange, text, data) {
            this.range = range;
            this.editorRange = editorRange;
            this.text = text;
            this.data = data;
            this.kind = ChatRequestDynamicVariablePart.Kind;
        }
        get referenceText() {
            return this.text.replace(exports.chatVariableLeader, '');
        }
        get promptText() {
            return this.text;
        }
    }
    exports.ChatRequestDynamicVariablePart = ChatRequestDynamicVariablePart;
    function reviveParsedChatRequest(serialized) {
        return {
            text: serialized.text,
            parts: serialized.parts.map(part => {
                if (part.kind === ChatRequestTextPart.Kind) {
                    return new ChatRequestTextPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.text);
                }
                else if (part.kind === ChatRequestVariablePart.Kind) {
                    return new ChatRequestVariablePart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.variableName, part.variableArg);
                }
                else if (part.kind === ChatRequestAgentPart.Kind) {
                    let agent = part.agent;
                    if (!('name' in agent)) {
                        // Port old format
                        agent = {
                            ...agent,
                            name: agent.id
                        };
                    }
                    return new ChatRequestAgentPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, agent);
                }
                else if (part.kind === ChatRequestAgentSubcommandPart.Kind) {
                    return new ChatRequestAgentSubcommandPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.command);
                }
                else if (part.kind === ChatRequestSlashCommandPart.Kind) {
                    return new ChatRequestSlashCommandPart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.slashCommand);
                }
                else if (part.kind === ChatRequestDynamicVariablePart.Kind) {
                    return new ChatRequestDynamicVariablePart(new offsetRange_1.OffsetRange(part.range.start, part.range.endExclusive), part.editorRange, part.text, (0, marshalling_1.revive)(part.data));
                }
                else {
                    throw new Error(`Unknown chat request part: ${part.kind}`);
                }
            })
        };
    }
    function extractAgentAndCommand(parsed) {
        const agentPart = parsed.parts.find((r) => r instanceof ChatRequestAgentPart);
        const commandPart = parsed.parts.find((r) => r instanceof ChatRequestAgentSubcommandPart);
        return { agentPart, commandPart };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFBhcnNlclR5cGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jaGF0UGFyc2VyVHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUJoRyxzQ0FLQztJQXdIRCwwREF3REM7SUFFRCx3REFJQztJQTNMRCxTQUFnQixhQUFhLENBQUMsT0FBMkI7UUFDeEQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzFFLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFbEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsTUFBYSxtQkFBbUI7aUJBQ2YsU0FBSSxHQUFHLE1BQU0sQUFBVCxDQUFVO1FBRTlCLFlBQXFCLEtBQWtCLEVBQVcsV0FBbUIsRUFBVyxJQUFZO1lBQXZFLFVBQUssR0FBTCxLQUFLLENBQWE7WUFBVyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFXLFNBQUksR0FBSixJQUFJLENBQVE7WUFEbkYsU0FBSSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQztRQUN1RCxDQUFDO1FBRWpHLElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDOztJQVBGLGtEQVFDO0lBRUQsdURBQXVEO0lBQzFDLFFBQUEsa0JBQWtCLEdBQUcsR0FBRyxDQUFDO0lBQ3pCLFFBQUEsZUFBZSxHQUFHLEdBQUcsQ0FBQztJQUN0QixRQUFBLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztJQUV4Qzs7T0FFRztJQUNILE1BQWEsdUJBQXVCO2lCQUNuQixTQUFJLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFFN0IsWUFBcUIsS0FBa0IsRUFBVyxXQUFtQixFQUFXLFlBQW9CLEVBQVcsV0FBbUI7WUFBN0csVUFBSyxHQUFMLEtBQUssQ0FBYTtZQUFXLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQVcsaUJBQVksR0FBWixZQUFZLENBQVE7WUFBVyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUR6SCxTQUFJLEdBQUcsdUJBQXVCLENBQUMsSUFBSSxDQUFDO1FBQ3lGLENBQUM7UUFFdkksSUFBSSxJQUFJO1lBQ1AsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMvRCxPQUFPLEdBQUcsMEJBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLEVBQUUsQ0FBQztRQUM5RCxDQUFDO1FBRUQsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7O0lBWkYsMERBYUM7SUFFRDs7T0FFRztJQUNILE1BQWEsb0JBQW9CO2lCQUNoQixTQUFJLEdBQUcsT0FBTyxBQUFWLENBQVc7UUFFL0IsWUFBcUIsS0FBa0IsRUFBVyxXQUFtQixFQUFXLEtBQXFCO1lBQWhGLFVBQUssR0FBTCxLQUFLLENBQWE7WUFBVyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFXLFVBQUssR0FBTCxLQUFLLENBQWdCO1lBRDVGLFNBQUksR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7UUFDK0QsQ0FBQztRQUUxRyxJQUFJLElBQUk7WUFDUCxPQUFPLEdBQUcsdUJBQWUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRDs7V0FFRztRQUNILE1BQU07WUFDTCxPQUFPO2dCQUNOLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsS0FBSyxFQUFFO29CQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ2pCLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7b0JBQ3JCLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVc7b0JBQ25DLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7aUJBQzdCO2FBQ0QsQ0FBQztRQUNILENBQUM7O0lBNUJGLG9EQTZCQztJQUVEOztPQUVHO0lBQ0gsTUFBYSw4QkFBOEI7aUJBQzFCLFNBQUksR0FBRyxZQUFZLEFBQWYsQ0FBZ0I7UUFFcEMsWUFBcUIsS0FBa0IsRUFBVyxXQUFtQixFQUFXLE9BQTBCO1lBQXJGLFVBQUssR0FBTCxLQUFLLENBQWE7WUFBVyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFXLFlBQU8sR0FBUCxPQUFPLENBQW1CO1lBRGpHLFNBQUksR0FBRyw4QkFBOEIsQ0FBQyxJQUFJLENBQUM7UUFDMEQsQ0FBQztRQUUvRyxJQUFJLElBQUk7WUFDUCxPQUFPLEdBQUcsNEJBQW9CLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0RCxDQUFDO1FBRUQsSUFBSSxVQUFVO1lBQ2IsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDOztJQVhGLHdFQVlDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLDJCQUEyQjtpQkFDdkIsU0FBSSxHQUFHLE9BQU8sQUFBVixDQUFXO1FBRS9CLFlBQXFCLEtBQWtCLEVBQVcsV0FBbUIsRUFBVyxZQUE0QjtZQUF2RixVQUFLLEdBQUwsS0FBSyxDQUFhO1lBQVcsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFBVyxpQkFBWSxHQUFaLFlBQVksQ0FBZ0I7WUFEbkcsU0FBSSxHQUFHLDJCQUEyQixDQUFDLElBQUksQ0FBQztRQUMrRCxDQUFDO1FBRWpILElBQUksSUFBSTtZQUNQLE9BQU8sR0FBRyw0QkFBb0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzlELENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLEdBQUcsNEJBQW9CLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM5RCxDQUFDOztJQVhGLGtFQVlDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLDhCQUE4QjtpQkFDMUIsU0FBSSxHQUFHLFNBQVMsQUFBWixDQUFhO1FBRWpDLFlBQXFCLEtBQWtCLEVBQVcsV0FBbUIsRUFBVyxJQUFZLEVBQVcsSUFBaUM7WUFBbkgsVUFBSyxHQUFMLEtBQUssQ0FBYTtZQUFXLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQVcsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUFXLFNBQUksR0FBSixJQUFJLENBQTZCO1lBRC9ILFNBQUksR0FBRyw4QkFBOEIsQ0FBQyxJQUFJLENBQUM7UUFDd0YsQ0FBQztRQUU3SSxJQUFJLGFBQWE7WUFDaEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsSUFBSSxVQUFVO1lBQ2IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2xCLENBQUM7O0lBWEYsd0VBWUM7SUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxVQUE4QjtRQUNyRSxPQUFPO1lBQ04sSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO1lBQ3JCLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbEMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLG1CQUFtQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUM1QyxPQUFPLElBQUksbUJBQW1CLENBQzdCLElBQUkseUJBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUMxRCxJQUFJLENBQUMsV0FBVyxFQUNoQixJQUFJLENBQUMsSUFBSSxDQUNULENBQUM7Z0JBQ0gsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssdUJBQXVCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3ZELE9BQU8sSUFBSSx1QkFBdUIsQ0FDakMsSUFBSSx5QkFBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQzFELElBQUksQ0FBQyxXQUFXLEVBQ2YsSUFBZ0MsQ0FBQyxZQUFZLEVBQzdDLElBQWdDLENBQUMsV0FBVyxDQUM3QyxDQUFDO2dCQUNILENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUNwRCxJQUFJLEtBQUssR0FBSSxJQUE2QixDQUFDLEtBQUssQ0FBQztvQkFDakQsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3hCLGtCQUFrQjt3QkFDbEIsS0FBSyxHQUFHOzRCQUNQLEdBQUksS0FBYTs0QkFDakIsSUFBSSxFQUFHLEtBQWEsQ0FBQyxFQUFFO3lCQUN2QixDQUFDO29CQUNILENBQUM7b0JBRUQsT0FBTyxJQUFJLG9CQUFvQixDQUM5QixJQUFJLHlCQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFDMUQsSUFBSSxDQUFDLFdBQVcsRUFDaEIsS0FBSyxDQUNMLENBQUM7Z0JBQ0gsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssOEJBQThCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQzlELE9BQU8sSUFBSSw4QkFBOEIsQ0FDeEMsSUFBSSx5QkFBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQzFELElBQUksQ0FBQyxXQUFXLEVBQ2YsSUFBdUMsQ0FBQyxPQUFPLENBQ2hELENBQUM7Z0JBQ0gsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssMkJBQTJCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQzNELE9BQU8sSUFBSSwyQkFBMkIsQ0FDckMsSUFBSSx5QkFBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQzFELElBQUksQ0FBQyxXQUFXLEVBQ2YsSUFBb0MsQ0FBQyxZQUFZLENBQ2xELENBQUM7Z0JBQ0gsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssOEJBQThCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQzlELE9BQU8sSUFBSSw4QkFBOEIsQ0FDeEMsSUFBSSx5QkFBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQzFELElBQUksQ0FBQyxXQUFXLEVBQ2YsSUFBdUMsQ0FBQyxJQUFJLEVBQzdDLElBQUEsb0JBQU0sRUFBRSxJQUF1QyxDQUFDLElBQUksQ0FBQyxDQUNyRCxDQUFDO2dCQUNILENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztZQUNGLENBQUMsQ0FBQztTQUNGLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBZ0Isc0JBQXNCLENBQUMsTUFBMEI7UUFDaEUsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQTZCLEVBQUUsQ0FBQyxDQUFDLFlBQVksb0JBQW9CLENBQUMsQ0FBQztRQUN6RyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBdUMsRUFBRSxDQUFDLENBQUMsWUFBWSw4QkFBOEIsQ0FBQyxDQUFDO1FBQy9ILE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDbkMsQ0FBQyJ9