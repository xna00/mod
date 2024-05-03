define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/inlineChat/browser/inlineChatActions", "vs/base/common/async", "vs/editor/common/editorContextKeys", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/chat/electron-sandbox/actions/voiceChatActions", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/speech/common/speechService", "vs/nls", "vs/platform/configuration/common/configuration"], function (require, exports, contextkey_1, inlineChatActions_1, async_1, editorContextKeys_1, commands_1, keybinding_1, voiceChatActions_1, inlineChat_1, speechService_1, nls_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoldToSpeak = void 0;
    class HoldToSpeak extends inlineChatActions_1.AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.holdForSpeech',
                precondition: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, inlineChat_1.CTX_INLINE_CHAT_VISIBLE),
                title: (0, nls_1.localize2)('holdForSpeech', "Hold for Speech"),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
                },
            });
        }
        runInlineChatCommand(accessor, ctrl, editor, ...args) {
            holdForSpeech(accessor, ctrl, this);
        }
    }
    exports.HoldToSpeak = HoldToSpeak;
    function holdForSpeech(accessor, ctrl, action) {
        const configService = accessor.get(configuration_1.IConfigurationService);
        const speechService = accessor.get(speechService_1.ISpeechService);
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const commandService = accessor.get(commands_1.ICommandService);
        // enabled or possible?
        if (!configService.getValue("inlineChat.holdToSpeech" /* InlineChatConfigKeys.HoldToSpeech */ || !speechService.hasSpeechProvider)) {
            return;
        }
        const holdMode = keybindingService.enableKeybindingHoldMode(action.desc.id);
        if (!holdMode) {
            return;
        }
        let listening = false;
        const handle = (0, async_1.disposableTimeout)(() => {
            // start VOICE input
            commandService.executeCommand(voiceChatActions_1.StartVoiceChatAction.ID, { voice: { disableTimeout: true } });
            listening = true;
        }, voiceChatActions_1.VOICE_KEY_HOLD_THRESHOLD);
        holdMode.finally(() => {
            if (listening) {
                commandService.executeCommand(voiceChatActions_1.StopListeningAction.ID).finally(() => {
                    ctrl.acceptInput();
                });
            }
            handle.dispose();
        });
    }
    // make this accessible to the chat actions from the browser layer
    (0, inlineChatActions_1.setHoldForSpeech)(holdForSpeech);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvZWxlY3Ryb24tc2FuZGJveC9pbmxpbmVDaGF0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBdUJBLE1BQWEsV0FBWSxTQUFRLDRDQUF3QjtRQUV4RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsMEJBQTBCO2dCQUM5QixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsaUNBQWlCLEVBQUUsb0NBQXVCLENBQUM7Z0JBQzVFLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxlQUFlLEVBQUUsaUJBQWlCLENBQUM7Z0JBQ3BELFVBQVUsRUFBRTtvQkFDWCxJQUFJLEVBQUUscUNBQWlCLENBQUMsY0FBYztvQkFDdEMsTUFBTSw2Q0FBbUM7b0JBQ3pDLE9BQU8sRUFBRSxpREFBNkI7aUJBQ3RDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVRLG9CQUFvQixDQUFDLFFBQTBCLEVBQUUsSUFBMEIsRUFBRSxNQUFtQixFQUFFLEdBQUcsSUFBVztZQUN4SCxhQUFhLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO0tBQ0Q7SUFsQkQsa0NBa0JDO0lBRUQsU0FBUyxhQUFhLENBQUMsUUFBMEIsRUFBRSxJQUEwQixFQUFFLE1BQWU7UUFFN0YsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1FBQzFELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1FBQzNELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQWUsQ0FBQyxDQUFDO1FBRXJELHVCQUF1QjtRQUN2QixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBVSxxRUFBcUMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1lBQzdHLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1RSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZixPQUFPO1FBQ1IsQ0FBQztRQUNELElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFBLHlCQUFpQixFQUFDLEdBQUcsRUFBRTtZQUNyQyxvQkFBb0I7WUFDcEIsY0FBYyxDQUFDLGNBQWMsQ0FBQyx1Q0FBb0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLEVBQXNDLENBQUMsQ0FBQztZQUNoSSxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLENBQUMsRUFBRSwyQ0FBd0IsQ0FBQyxDQUFDO1FBRTdCLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ3JCLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsY0FBYyxDQUFDLGNBQWMsQ0FBQyxzQ0FBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO29CQUNsRSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BCLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxrRUFBa0U7SUFDbEUsSUFBQSxvQ0FBZ0IsRUFBQyxhQUFhLENBQUMsQ0FBQyJ9