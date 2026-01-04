'use client';

import { useEffect, useState } from 'react';

type Props = {
  addy?: string | null;
};

export function AddyModal95({ addy }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (addy) {
      setOpen(true);
    }
  }, [addy]);

  if (!open || !addy) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 400,
          background: '#c0c0c0',
          borderTop: '2px solid #fff',
          borderLeft: '2px solid #fff',
          borderRight: '2px solid #404040',
          borderBottom: '2px solid #404040',
          fontFamily: 'VT323, monospace',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: 'linear-gradient(90deg, #000080, #1084d0)',
            color: '#fff',
            padding: '4px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <span>Announcement</span>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 18,
              height: 18,
              background: '#c0c0c0',
              borderTop: '1px solid #fff',
              borderLeft: '1px solid #fff',
              borderRight: '1px solid #404040',
              borderBottom: '1px solid #404040',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: 16,
            color: '#000',
            fontSize: 16,
            textAlign: 'center',
          }}
        >
          {/* Centered Bonk GIF */}
          <img
            src="/bonk.gif"
            alt="Bonk"
            style={{
              display: 'block',      // Ensures margins work correctly
              margin: '0 auto 12px auto', // Centers horizontally and keeps bottom spacing
              width: 96,
              height: 96,
              imageRendering: 'pixelated',
            }}
          />

          <div style={{ marginBottom: 6 }}>
            <strong>$DON LIVE ON BONK.FUN</strong>
          </div>

          <div style={{ fontSize: 15, marginBottom: 14 }}>
            The Don is now online running things.<br />
            Fast. Fair. Dog-approved.
          </div>

          {/* Address display */}
          <div
            style={{
              background: '#fff',
              padding: '6px 8px',
              borderTop: '2px solid #808080',
              borderLeft: '2px solid #808080',
              borderRight: '2px solid #fff',
              borderBottom: '2px solid #fff',
              fontFamily: 'monospace',
              fontSize: 13,
              wordBreak: 'break-all',
              marginBottom: 14,
              textAlign: 'left',
            }}
          >
            {addy}
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <button
              onClick={() => {
                navigator.clipboard.writeText(addy);
              }}
              style={{
                padding: '6px 14px',
                background: '#e0e0e0',
                borderTop: '2px solid #fff',
                borderLeft: '2px solid #fff',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
                cursor: 'pointer',
                fontFamily: 'VT323, monospace',
                fontSize: 16,
              }}
            >
              Copy
            </button>

            <button
              onClick={() => setOpen(false)}
              style={{
                padding: '6px 18px',
                background: '#e0e0e0',
                borderTop: '2px solid #fff',
                borderLeft: '2px solid #fff',
                borderRight: '2px solid #404040',
                borderBottom: '2px solid #404040',
                cursor: 'pointer',
                fontFamily: 'VT323, monospace',
                fontSize: 16,
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}