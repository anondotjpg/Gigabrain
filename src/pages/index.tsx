import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_KOEIRO_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { Inter } from "next/font/google";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { ElevenLabsParam, DEFAULT_ELEVEN_LABS_PARAM } from "@/features/constants/elevenLabsParam";
import { buildUrl } from "@/utils/buildUrl";
import { websocketService } from '../services/websocketService';
import { MessageMiddleOut } from "@/features/messages/messageMiddleOut";
import { CopyToClipboard } from "@/components/copy";
import Computer3DWithVrm from "@/components/computer";
import HyperTextDemo from "@/components/hyper";
import { Settings } from "@/components/settings";
import { TopNews95 } from "@/components/TopNews95";
import { CryptoMarquee95 } from "@/components/CryptoMarquee95";
import { Actions95 } from "@/components/Actions95";
import { AddyModal95 } from "@/components/AddyModal95";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

type LLMCallbackResult = {
  processed: boolean;
  error?: string;
};

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [openAiKey, setOpenAiKey] = useState("");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [elevenLabsParam, setElevenLabsParam] = useState<ElevenLabsParam>(DEFAULT_ELEVEN_LABS_PARAM);
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_KOEIRO_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [restreamTokens, setRestreamTokens] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [selectedVrm, setSelectedVrm] = useState<number>(4);
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openRouterKey') || '';
    }
    return '';
  });

  // Debug: Log key states
  useEffect(() => {
    console.log('🔑 API Keys Status:');
    console.log('  OpenAI Key:', openAiKey ? `Set (${openAiKey.substring(0, 10)}...)` : 'Not set');
    console.log('  OpenRouter Key:', openRouterKey ? `Set (${openRouterKey.substring(0, 10)}...)` : 'Not set');
    console.log('  ElevenLabs Key:', elevenLabsKey ? `Set (${elevenLabsKey.substring(0, 10)}...)` : 'Not set');
  }, [openAiKey, openRouterKey, elevenLabsKey]);

  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt);
      setElevenLabsParam(params.elevenLabsParam);
      setChatLog(params.chatLog);
    }
    
    setOpenAiKey(process.env.NEXT_PUBLIC_OPENAI_API_KEY as string || "");
    setElevenLabsKey(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY as string || "");
    
    const savedOpenRouterKey = localStorage.getItem('openRouterKey');
    if (savedOpenRouterKey) {
      setOpenRouterKey(savedOpenRouterKey);
    }
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
    const savedVrm = localStorage.getItem('selectedVrm');
    if (savedVrm) {
      setSelectedVrm(parseInt(savedVrm));
    }
  }, []);

  useEffect(() => {
    process.nextTick(() => {
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, elevenLabsParam, chatLog })
      );
      window.localStorage.setItem("selectedVrm", selectedVrm.toString());
    });
  }, [systemPrompt, elevenLabsParam, chatLog, selectedVrm]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });
      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      elevenLabsKey: string,
      elevenLabsParam: ElevenLabsParam,
      selectedVrm: number,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      console.log('🗣️ Starting AI speech...');
      setIsAISpeaking(true);
      try {
        await speakCharacter(
          screenplay, 
          elevenLabsKey, 
          elevenLabsParam, 
          selectedVrm,
          viewer, 
          () => {
            setIsPlayingAudio(true);
            console.log('🔊 Audio playback started');
            onStart?.();
          }, 
          () => {
            setIsPlayingAudio(false);
            console.log('✅ Audio playback completed');
            onEnd?.();
          }
        );
      } catch (error) {
        console.error('❌ Error during AI speech:', error);
      } finally {
        setIsAISpeaking(false);
      }
    },
    [viewer]
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      console.log('💬 handleSendChat called with text:', text);
      
      const newMessage = text;
      if (newMessage == null) {
        console.log('❌ No message provided');
        return;
      }

      console.log('⏳ Setting chat processing to true...');
      setChatProcessing(true);
      
      // Add user's message to chat log
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);
      console.log('📝 Updated chat log:', messageLog);

      // Process messages through MessageMiddleOut
      const messageProcessor = new MessageMiddleOut();
      const processedMessages = messageProcessor.process([
        {
          role: "system",
          content: systemPrompt,
        },
        ...messageLog,
      ]);
      console.log('🔄 Processed messages:', processedMessages);

      let localOpenRouterKey = openRouterKey;
      if (!localOpenRouterKey) {
        console.log('🔑 Using fallback OpenRouter key from env');
        localOpenRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!;
      }
      
      console.log('🌐 Making API request with key:', localOpenRouterKey ? `${localOpenRouterKey.substring(0, 10)}...` : 'No key');

      try {
        const stream = await getChatResponseStream(processedMessages, openAiKey, localOpenRouterKey);
        
        if (stream == null) {
          console.error('❌ Failed to get stream - stream is null');
          setChatProcessing(false);
          return;
        }

        console.log('✅ Stream obtained successfully');
        const reader = stream.getReader();
        let receivedMessage = "";
        let aiTextLog = "";
        let tag = "";
        const sentences = new Array<string>();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('📡 Stream reading completed');
              break;
            }

            receivedMessage += value;
            console.log('📥 Received chunk:', value);
            console.log('📄 Full received message so far:', receivedMessage);

            // 返答内容のタグ部分の検出
            const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
            if (tagMatch && tagMatch[0]) {
              tag = tagMatch[0];
              receivedMessage = receivedMessage.slice(tag.length);
              console.log('🏷️ Detected tag:', tag);
            }

            // 返答を一単位で切り出して処理する
            const sentenceMatch = receivedMessage.match(
              /^(.+[。.!?\n.!?]|.{10,}[、,])/
            );
            if (sentenceMatch && sentenceMatch[0]) {
              const sentence = sentenceMatch[0];
              sentences.push(sentence);

              console.log('📝 Processing sentence:', sentence);

              receivedMessage = receivedMessage
                .slice(sentence.length)
                .trimStart();

              // 発話不要/不可能な文字列だった場合はスキップ
              if (
                !sentence.replace(
                  /^[\s\[\(\{「[(【『〈《〔{«‹〘〚〛〙›»〕》〉』】)]」\}\)\]]+$/g,
                  ""
                )
              ) {
                console.log('⏭️ Skipping empty/invalid sentence');
                continue;
              }

              const aiText = `${tag} ${sentence}`;
              const aiTalks = textsToScreenplay([aiText], koeiroParam);
              aiTextLog += aiText;

              console.log('🎭 Generated screenplay:', aiTalks[0]);

              // 文ごとに音声を生成 & 再生、返答を表示
              const currentAssistantMessage = sentences.join(" ");
              handleSpeakAi(aiTalks[0], elevenLabsKey, elevenLabsParam, selectedVrm, () => {
                setAssistantMessage(currentAssistantMessage);
                console.log('💭 Updated assistant message:', currentAssistantMessage);
              });
            }
          }
        } catch (e) {
          console.error('❌ Error during stream processing:', e);
          setChatProcessing(false);
        } finally {
          reader.releaseLock();
          console.log('🔓 Stream reader released');
        }

        // アシスタントの返答をログに追加
        const messageLogAssistant: Message[] = [
          ...messageLog,
          { role: "assistant", content: aiTextLog },
        ];

        console.log('📋 Final assistant message log:', messageLogAssistant);
        setChatLog(messageLogAssistant);
        setChatProcessing(false);
        console.log('✅ Chat processing completed');
        
      } catch (error) {
        console.error('❌ Error in getChatResponseStream:', error);
        setChatProcessing(false);
      }
    },
    [systemPrompt, chatLog, handleSpeakAi, openAiKey, elevenLabsKey, elevenLabsParam, openRouterKey, selectedVrm, koeiroParam]
  );

  const handleTokensUpdate = useCallback((tokens: any) => {
    setRestreamTokens(tokens);
  }, []);

  // Set up global websocket handler
  useEffect(() => {
    console.log('🔌 Setting up websocket LLM callback');
    websocketService.setLLMCallback(async (message: string): Promise<LLMCallbackResult> => {
      console.log('📨 Websocket message received:', message);
      try {
        if (isAISpeaking || isPlayingAudio || chatProcessing) {
          console.log('⏸️ Skipping message processing - system busy');
          return {
            processed: false,
            error: 'System is busy processing previous message'
          };
        }
        
        await handleSendChat(message);
        return {
          processed: true
        };
      } catch (error) {
        console.error('❌ Error processing websocket message:', error);
        return {
          processed: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    });
  }, [handleSendChat, chatProcessing, isPlayingAudio, isAISpeaking]);

  const handleOpenRouterKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = event.target.value;
    console.log('🔑 OpenRouter key updated');
    setOpenRouterKey(newKey);
    localStorage.setItem('openRouterKey', newKey);
  };

  const handleVrmChange = (vrmNumber: number) => {
    console.log('🤖 VRM changed to:', vrmNumber);
    setSelectedVrm(vrmNumber);
  };

  return (
    <div className={inter.className}>
      <Meta />
      <div className="">
        
      </div>
      <div className="desktop-only-widgets">
      </div>
      <Computer3DWithVrm selectedVrm={4} />
      <div className="">
        <MessageInputContainer
          isChatProcessing={chatProcessing}
          onChatProcessStart={handleSendChat}
        />
      </div>
      <GitHubLink />
      
      {/* Twitter/X Link - Top Right */}
      <a
        href="https://x.com/igigabrain"
        target="_blank"
        rel="noopener noreferrer"
        className="twitter-link"
        aria-label="Follow on X (Twitter)"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>

      <style jsx>{`
        .desktop-only-widgets {
          display: none;
        }
        
        @media (min-width: 768px) {
          .desktop-only-widgets {
            display: block;
          }
        }

        .desktop-only-widgetz {
          display: none;
        }
        
        @media (min-width: 1100px) {
          .desktop-only-widgetz {
            display: block;
          }
        }

        .twitter-link {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .twitter-link:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.1);
        }

        .twitter-link svg {
          width: 24px;
          height: 24px;
        }
      `}</style>
    </div>
  );
}