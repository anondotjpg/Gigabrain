import React from 'react';
import { HiMicrophone, HiPaperAirplane } from 'react-icons/hi2';

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
    "what's up",
    "go deep", 
    "what are you?",
    "surprise me",
    "inspire me"
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
        padding: '16px',
      }}
    >
      {/* Template Messages */}
      {!userMessage && !isChatProcessing && (
        <div 
          style={{
            maxWidth: '800px',
            margin: '0 auto 12px auto',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {templateMessages.map((template, index) => (
            <button
              key={index}
              onClick={() => handleTemplateClick(template)}
              style={{
                backgroundColor: '#F7F7F8',
                border: '1px solid #E5E5E5',
                borderRadius: '20px',
                padding: '8px 16px',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ECECF1';
                e.currentTarget.style.borderColor = '#D1D5DB';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F7F7F8';
                e.currentTarget.style.borderColor = '#E5E5E5';
                e.currentTarget.style.color = '#374151';
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
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '8px 12px',
          border: '1px solid #E5E5E5',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <button
          disabled={isChatProcessing}
          onClick={onClickMicButton}
          style={{
            backgroundColor: isMicRecording ? '#10A37F' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '8px',
            cursor: isChatProcessing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: isChatProcessing ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            if (!isChatProcessing) {
              e.currentTarget.style.backgroundColor = isMicRecording ? '#0D8A68' : '#F7F7F8';
            }
          }}
          onMouseLeave={(e) => {
            if (!isChatProcessing) {
              e.currentTarget.style.backgroundColor = isMicRecording ? '#10A37F' : 'transparent';
            }
          }}
        >
          {(HiMicrophone as any)({ 
            size: 20, 
            color: isMicRecording ? '#FFFFFF' : '#6B7280' 
          })}
        </button>

        <input
          type="text"
          placeholder="speak to your fren"
          value={userMessage}
          onChange={onChangeUserMessage}
          onKeyDown={onKeyDownUserMessage}
          disabled={isChatProcessing}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#111827',
            fontSize: '16px',
            outline: 'none',
            padding: '8px 0',
          }}
        />

        {isChatProcessing ? (
          <div 
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #E5E5E5',
              borderTop: '2px solid #10A37F',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <button
            disabled={!userMessage}
            onClick={onClickSendButton}
            style={{
              backgroundColor: userMessage ? '#10A37F' : '#E5E5E5',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: userMessage ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (userMessage) {
                e.currentTarget.style.backgroundColor = '#0D8A68';
              }
            }}
            onMouseLeave={(e) => {
              if (userMessage) {
                e.currentTarget.style.backgroundColor = '#10A37F';
              }
            }}
          >
            {(HiPaperAirplane as any)({ 
              size: 20, 
              color: userMessage ? '#FFFFFF' : '#9CA3AF' 
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
        `}
      </style>
    </div>
  );
};