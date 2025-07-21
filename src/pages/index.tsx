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
  // needed because AI speaking could involve multiple audios being played in sequence
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [selectedVrm, setSelectedVrm] = useState<number>(1); // New state for VRM selection
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openRouterKey') || '';
    }
    return '';
  });

  useEffect(() => {
    if (window.localStorage.getItem("chatVRMParams")) {
      const params = JSON.parse(
        window.localStorage.getItem("chatVRMParams") as string
      );
      setSystemPrompt(params.systemPrompt);
      setElevenLabsParam(params.elevenLabsParam);
      setChatLog(params.chatLog);
    }
    setElevenLabsKey(process.env.ELEVENLABS_API_KEY as string);
    // load openrouter key from localStorage
    const savedOpenRouterKey = localStorage.getItem('openRouterKey');
    if (savedOpenRouterKey) {
      setOpenRouterKey(savedOpenRouterKey);
    }
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
    // Load saved VRM selection
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
      )

      // store separately to be backward compatible with local storage data
      window.localStorage.setItem("elevenLabsKey", elevenLabsKey);
      // Save VRM selection
      window.localStorage.setItem("selectedVrm", selectedVrm.toString());
    }
    );
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

  /**
   * 文ごとに音声を直接でリクエストしながら再生する
   */
  const handleSpeakAi = useCallback(
    async (
      screenplay: Screenplay,
      elevenLabsKey: string,
      elevenLabsParam: ElevenLabsParam,
      selectedVrm: number,
      onStart?: () => void,
      onEnd?: () => void
    ) => {
      setIsAISpeaking(true);  // Set speaking state before starting
      try {
        await speakCharacter(
          screenplay, 
          elevenLabsKey, 
          elevenLabsParam, 
          selectedVrm, // Pass the selected VRM
          viewer, 
          () => {
            setIsPlayingAudio(true);
            console.log('audio playback started');
            onStart?.();
          }, 
          () => {
            setIsPlayingAudio(false);
            console.log('audio playback completed');
            onEnd?.();
          }
        );
      } catch (error) {
        console.error('Error during AI speech:', error);
      } finally {
        setIsAISpeaking(false);  // Ensure speaking state is reset even if there's an error
      }
    },
    [viewer]
  );

  /**
   * アシスタントとの会話を行う
   */
  const handleSendChat = useCallback(
    async (text: string) => {
      const newMessage = text;
      if (newMessage == null) return;

      setChatProcessing(true);
      // Add user's message to chat log
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      // Process messages through MessageMiddleOut
      const messageProcessor = new MessageMiddleOut();
      const processedMessages = messageProcessor.process([
        {
          role: "system",
          content: systemPrompt,
        },
        ...messageLog,
      ]);

      let localOpenRouterKey = openRouterKey;
      if (!localOpenRouterKey) {
        // fallback to free key for users to try things out
        localOpenRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!;
      }

      const stream = await getChatResponseStream(processedMessages, openAiKey, localOpenRouterKey).catch(
        (e) => {
          console.error(e);
          return null;
        }
      );
      if (stream == null) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          receivedMessage += value;

          // console.log('receivedMessage');
          // console.log(receivedMessage);

          // 返答内容のタグ部分の検出
          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);

            console.log('tag:');
            console.log(tag);
          }

          // 返答を一単位で切り出して処理する
          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n.!?]|.{10,}[、,])/
          );
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);

            console.log('sentence:');
            console.log(sentence);

            receivedMessage = receivedMessage
              .slice(sentence.length)
              .trimStart();

            // 発話不要/不可能な文字列だった場合はスキップ
            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            aiTextLog += aiText;

            // 文ごとに音声を生成 & 再生、返答を表示
            const currentAssistantMessage = sentences.join(" ");
            handleSpeakAi(aiTalks[0], elevenLabsKey, elevenLabsParam, selectedVrm, () => {
              setAssistantMessage(currentAssistantMessage);
            });
          }
        }
      } catch (e) {
        setChatProcessing(false);
        console.error(e);
      } finally {
        reader.releaseLock();
      }

      // アシスタントの返答をログに追加
      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];

      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    },
    [systemPrompt, chatLog, handleSpeakAi, openAiKey, elevenLabsKey, elevenLabsParam, openRouterKey, selectedVrm]
  );

  const handleTokensUpdate = useCallback((tokens: any) => {
    setRestreamTokens(tokens);
  }, []);

  // Set up global websocket handler
  useEffect(() => {
    websocketService.setLLMCallback(async (message: string): Promise<LLMCallbackResult> => {
      try {
        if (isAISpeaking || isPlayingAudio || chatProcessing) {
          console.log('Skipping message processing - system busy');
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
        console.error('Error processing message:', error);
        return {
          processed: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    });
  }, [handleSendChat, chatProcessing, isPlayingAudio, isAISpeaking]);

  const handleOpenRouterKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = event.target.value;
    setOpenRouterKey(newKey);
    localStorage.setItem('openRouterKey', newKey);
  };

  const handleVrmChange = (vrmNumber: number) => {
    setSelectedVrm(vrmNumber);
  };

  return (
    <div className={inter.className}>
      <Meta />
      
      {/* VRM Selector in top left */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '20px', 
        zIndex: 1000,
        display: 'grid',
        gap: '10px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => handleVrmChange(1)}
          style={{
            padding: '0',
            backgroundColor: selectedVrm === 1 ? '#1D9BF0' : '#666',
            border: selectedVrm === 1 ? '3px solid #1D9BF0' : '3px solid #666',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '50px',
            height: '50px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/og.png"
            alt="VRM 1"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        </button>
        <button
          onClick={() => handleVrmChange(2)}
          style={{
            padding: '0',
            backgroundColor: selectedVrm === 2 ? '#1D9BF0' : '#666',
            border: selectedVrm === 2 ? '3px solid #1D9BF0' : '3px solid #666',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '50px',
            height: '50px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/og2.png"
            alt="VRM 2"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        </button>
        <button
          onClick={() => handleVrmChange(3)}
          style={{
            padding: '0',
            backgroundColor: selectedVrm === 3 ? '#1D9BF0' : '#666',
            border: selectedVrm === 3 ? '3px solid #1D9BF0' : '3px solid #666',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '50px',
            height: '50px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/og3.png"
            alt="VRM 3"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        </button>
        <button
          onClick={() => handleVrmChange(4)}
          style={{
            padding: '0',
            backgroundColor: selectedVrm === 4 ? '#1D9BF0' : '#666',
            border: selectedVrm === 4 ? '3px solid #1D9BF0' : '3px solid #666',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '50px',
            height: '50px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/og4.png"
            alt="VRM 4"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        </button>
        
        {/* Add New VRM Button */}
        <div style={{ position: 'relative' }}>
          <button
            disabled
            style={{
              padding: '0',
              backgroundColor: '#333',
              border: '3px solid #333',
              borderRadius: '50%',
              cursor: 'not-allowed',
              width: '50px',
              height: '50px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6
            }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#999" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          
          {/* Soon Tag */}
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-5px',
            backgroundColor: '#364153',
            color: 'white',
            fontSize: '6px',
            fontWeight: 'bold',
            padding: '1px 3px',
            borderRadius: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Soon
          </div>
        </div>
      </div>

      <VrmViewer selectedVrm={selectedVrm} />
      <CopyToClipboard textToCopy="XXXXXXXXXXXXXXXXXXXXXXX" />
      <div className="">
        <MessageInputContainer
          isChatProcessing={chatProcessing}
          onChatProcessStart={handleSendChat}
        />
      </div>
      <GitHubLink />
    </div>
  );
}