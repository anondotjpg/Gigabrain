import React, { useContext, useCallback, useEffect, useState } from "react";
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { TextField, Button, Window, WindowContent, Panel } from 'react95';
import original from "react95/dist/themes/original";

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #FFFFFF;
  }
`;

interface VrmViewerProps {
  selectedVrm: number;
}

export default function VrmViewer({ selectedVrm }: VrmViewerProps) {
  const { viewer } = useContext(ViewerContext);
  const [isLoading, setIsLoading] = useState(true);

  const AVATAR_SAMPLE_B_VRM_URL = "agi.vrm";
  const AVATAR_SAMPLE_2_VRM_URL = "agi2.vrm";
  const AVATAR_SAMPLE_3_VRM_URL = "agi3.vrm";
  const AVATAR_SAMPLE_4_VRM_URL = "agi4.vrm";

  const getVrmUrl = (vrmNumber: number) => {
    switch (vrmNumber) {
      case 1:
        return AVATAR_SAMPLE_B_VRM_URL;
      case 2:
        return AVATAR_SAMPLE_2_VRM_URL;
      case 3:
        return AVATAR_SAMPLE_3_VRM_URL;
      case 4:
        return AVATAR_SAMPLE_4_VRM_URL;
      default:
        return AVATAR_SAMPLE_B_VRM_URL;
    }
  };

  const loadVrm = async (url: string) => {
    setIsLoading(true);
    try {
      await viewer.loadVrm(url);
      // Add a small delay to ensure the VRM is fully rendered
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading VRM:', error);
      setIsLoading(false);
    }
  };

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        viewer.setup(canvas);
        
        // Load initial VRM based on selection
        const initialVrmUrl = getVrmUrl(selectedVrm);
        loadVrm(buildUrl(initialVrmUrl));

        // Drag and Drop VRM replacement
        canvas.addEventListener("dragover", (event) => event.preventDefault());
        canvas.addEventListener("drop", (event) => {
          event.preventDefault();
          const files = event.dataTransfer?.files;
          if (!files) return;

          const file = files[0];
          if (file?.name.endsWith(".vrm")) {
            const blob = new Blob([file], { type: "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            loadVrm(url);
          }
        });
      }
    },
    [viewer, selectedVrm]
  );

  // Effect to handle VRM changes
  useEffect(() => {
    if (viewer) {
      const vrmUrl = getVrmUrl(selectedVrm);
      loadVrm(buildUrl(vrmUrl));
    }
  }, [selectedVrm, viewer]);

  return (
    <div>
      <GlobalStyles />
      <div className="bg-[#FFFFFF]" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100vh", zIndex: -10 }}>
        {/* 3D Canvas */}
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }}></canvas>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px"
            }}>
              {/* Spinning Loader */}
              <div style={{
                width: "50px",
                height: "50px",
                border: "4px solid #333",
                borderTop: "4px solid #1D9BF0",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS Animation for Spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}