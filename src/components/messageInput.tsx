import React from 'react';
import { HiMicrophone, HiPaperAirplane } from 'react-icons/hi2';
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
    "spaces"
  ];

  const handleTemplateClick = (template: string) => {
    if (!isChatProcessing) {
      // Create a synthetic event to match the expected onChange signature
      const syntheticEvent = {
        target: { value: template },
        currentTarget: { value: template }
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
            opacity: 0
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
                fontWeight: '400',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
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
          position: 'relative',
        }}
      >
        <button
          disabled={isChatProcessing}
          onClick={onClickMicButton}
          style={{
            backgroundColor: isMicRecording ? '#1D9BF0' : 'transparent',
            border: 'none',
            borderRadius: '50%',
            padding: '8px',
            cursor: isChatProcessing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
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
              e.currentTarget.style.backgroundColor = isMicRecording ? '#1A8CD8' : 'rgba(29, 155, 240, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isChatProcessing) {
              e.currentTarget.style.backgroundColor = isMicRecording ? '#1D9BF0' : 'transparent';
            }
          }}
        >
          {(HiMicrophone as any)({ 
            size: 20, 
            color: isMicRecording ? '#FFFFFF' : '#1D9BF0' 
          })}
        </button>

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
            fontWeight: '400',
            outline: 'none',
            padding: '6px 0',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
        />

        {isChatProcessing ? (
          <div 
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #2F3336',
              borderTop: '2px solid #1D9BF0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <button
            disabled={!userMessage}
            onClick={onClickSendButton}
            style={{
              backgroundColor: userMessage ? '#1D9BF0' : '#2F3336',
              border: 'none',
              borderRadius: '50%',
              padding: '10px',
              cursor: userMessage ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              opacity: userMessage ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (userMessage) {
                e.currentTarget.style.backgroundColor = '#1A8CD8';
              }
            }}
            onMouseLeave={(e) => {
              if (userMessage) {
                e.currentTarget.style.backgroundColor = '#1D9BF0';
              }
            }}
          >
            {(RiSendPlaneFill as any)({ 
              size: 18, 
              color: '#FFFFFF'
            })}
          </button>
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input::placeholder {
            color: #536471 !important;
          }
        `}
      </style>
    </div>
  );
};