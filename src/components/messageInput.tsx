import React from 'react';
import { HiMicrophone } from 'react-icons/hi2';
import { RiSendPlaneFill } from "react-icons/ri";

type Props = {
  userMessage: string;
  isMicRecording: boolean;
  isChatProcessing: boolean;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onKeyDownUserMessage: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const PUMP_GREEN = '#00FFA3';
const PUMP_GREEN_DARK = '#00E693';

export const MessageInput = ({
  userMessage,
  isMicRecording,
  isChatProcessing,
  onChangeUserMessage,
  onKeyDownUserMessage,
  onClickMicButton,
  onClickSendButton,
}: Props) => {
  const templateMessages = [
    "what's happening?",
    "trending now",
    "for you",
    "explore",
    "spaces",
  ];

  const handleTemplateClick = (template: string) => {
    if (!isChatProcessing) {
      const syntheticEvent = {
        target: { value: template },
        currentTarget: { value: template },
      } as React.ChangeEvent<HTMLInputElement>;

      onChangeUserMessage(syntheticEvent);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        padding: '30px 16px',
      }}
    >
      {/* Template Messages */}
      {!userMessage && !isChatProcessing && (
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto 16px auto',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            opacity: 0,
          }}
        >
          {templateMessages.map((template, index) => (
            <button
              key={index}
              onClick={() => handleTemplateClick(template)}
              style={{
                backgroundColor: '#000000',
                borderRadius: '12px',
                padding: '6px 12px',
                color: '#E7E9EA',
                fontSize: '15px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }}
            >
              {template}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Container */}
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#000000',
          borderRadius: '24px',
          padding: '10px 20px',
        }}
      >
        {/* Mic Button */}
        <button
          disabled={isChatProcessing}
          onClick={onClickMicButton}
          style={{
            backgroundColor: isMicRecording ? PUMP_GREEN : 'transparent',
            border: 'none',
            borderRadius: '50%',
            padding: '8px',
            cursor: isChatProcessing ? 'not-allowed' : 'pointer',
            opacity: isChatProcessing ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
          }}
          onMouseEnter={(e) => {
            if (!isChatProcessing) {
              e.currentTarget.style.backgroundColor = isMicRecording
                ? PUMP_GREEN_DARK
                : 'rgba(0, 255, 163, 0.12)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isChatProcessing) {
              e.currentTarget.style.backgroundColor = isMicRecording
                ? PUMP_GREEN
                : 'transparent';
            }
          }}
        >
          <HiMicrophone
            size={20}
            color={isMicRecording ? '#000000' : PUMP_GREEN}
          />
        </button>

        {/* Input */}
        <input
          type="text"
          placeholder="What is happening?!"
          value={userMessage}
          onChange={onChangeUserMessage}
          onKeyDown={onKeyDownUserMessage}
          disabled={isChatProcessing}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#E7E9EA',
            fontSize: '14px',
            outline: 'none',
            padding: '6px 0',
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }}
        />

        {/* Send / Spinner */}
        {isChatProcessing ? (
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #2F3336',
              borderTop: `2px solid ${PUMP_GREEN}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <button
            disabled={!userMessage}
            onClick={onClickSendButton}
            style={{
              padding: '10px',
              cursor: userMessage ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
            }}
          >
            <RiSendPlaneFill
              size={18}
              color={userMessage ? PUMP_GREEN : '#808080'}
            />
          </button>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          input::placeholder {
            color: #536471 !important;
          }
        `}
      </style>
    </div>
  );
};
