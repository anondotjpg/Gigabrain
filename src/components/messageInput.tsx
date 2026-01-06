import React from 'react';
import { HiMicrophone } from 'react-icons/hi2';
import { RiSendPlaneFill } from 'react-icons/ri';

type Props = {
  userMessage: string;
  isMicRecording: boolean;
  isChatProcessing: boolean;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onKeyDownUserMessage: (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

/** 🟠 Accent */
const BONK_ORANGE = '#262626';

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
    'trending now',
    'who are you?',
    'explore',
    "crypto thoughts?",
  ];

  const handleTemplateClick = (template: string) => {
    if (!isChatProcessing) {
      onChangeUserMessage({
        target: { value: template },
        currentTarget: { value: template },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="win95-root">
      {!userMessage && !isChatProcessing && (
        <div className="win95-templates">
          {templateMessages.map((t) => (
            <button
              key={t}
              className="win95-btn"
              onClick={() => handleTemplateClick(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="win95-window">
        <div className="win95-content">
          <button
            className={`win95-btn ${isMicRecording ? 'active' : ''}`}
            disabled={isChatProcessing}
            onClick={onClickMicButton}
          >
            <HiMicrophone size={14} />
          </button>

          <input
            type="text"
            value={userMessage}
            placeholder="What is happening?!"
            disabled={isChatProcessing}
            onChange={onChangeUserMessage}
            onKeyDown={onKeyDownUserMessage}
            className="win95-input"
          />

          {isChatProcessing ? (
            <div className="win95-spinner" />
          ) : (
            <button
              className="win95-btn"
              disabled={!userMessage}
              onClick={onClickSendButton}
            >
              <RiSendPlaneFill size={14} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        /* ROOT */
        .win95-root {
          position: fixed;
          bottom: 20px;
          left: 8px;
          right: 8px;
          z-index: 20;
          font-family: 'MS Sans Serif', Tahoma, Arial, sans-serif;
          font-size: 13px;
        }

        .win95-templates {
          max-width: 640px;
          margin: 0 auto 6px auto;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding: 6px;
          justify-content: center;   /* 👈 CENTER HORIZONTALLY */
          align-items: center;
        }


        /* WINDOW */
        .win95-window {
          max-width: 640px;
          margin: 0 auto;
          background: #c0c0c0;
          border-top: 2px solid #fff;
          border-left: 2px solid #fff;
          border-right: 2px solid #404040;
          border-bottom: 2px solid #404040;
        }

        .win95-content {
          padding: 6px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 6px;
          align-items: center;
        }

        /* BUTTON */
        .win95-btn {
          min-width: 32px;
          height: 28px;
          padding: 0 6px;
          background: #c0c0c0;
          border-top: 2px solid #fff;
          border-left: 2px solid #fff;
          border-right: 2px solid #404040;
          border-bottom: 2px solid #404040;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .win95-btn:active,
        .win95-btn.active {
          border-top: 2px solid #404040;
          border-left: 2px solid #404040;
          border-right: 2px solid #fff;
          border-bottom: 2px solid #fff;
          background: ${BONK_ORANGE};
        }

        .win95-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* INPUT (SUNKEN) */
        .win95-input {
          height: 26px;
          padding: 2px 6px;
          background: #fff;
          border-top: 2px solid #404040;
          border-left: 2px solid #404040;
          border-right: 2px solid #fff;
          border-bottom: 2px solid #fff;
          outline: none;
          font-family: inherit;
          font-size: 13px;
        }

        .win95-input:disabled {
          background: #e0e0e0;
        }

        /* SPINNER */
        .win95-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #808080;
          border-top: 2px solid ${BONK_ORANGE};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
