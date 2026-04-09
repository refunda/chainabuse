"use client";

import { useState } from "react";

export default function ActivitiesButton() {
  // 1. We set up our "State" (memory) for the component
  const [unreadCount, setUnreadCount] = useState(5); // Starts at 5
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice starts ON

  // 2. Function to clear notifications when clicking Activities
  const handleActivitiesClick = () => {
    if (unreadCount > 0) {
      setUnreadCount(0);
    }
    // You will later add code here to take the admin to the activities page
  };

  // 3. Function to turn voice on/off
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  // 4. Function to simulate a new notification arriving
  const triggerNewNotification = () => {
    const newTotal = unreadCount + 1;
    setUnreadCount(newTotal);

    // If voice is on, make the computer speak
    if (voiceEnabled) {
      const speech = new SpeechSynthesisUtterance(`You have ${newTotal} activities.`);
      window.speechSynthesis.speak(speech);
    }
  };

  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      
      {/* VOICE TOGGLE BUTTON */}
      <button 
        onClick={toggleVoice}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "18px"
        }}
        title="Toggle Voice"
      >
        {voiceEnabled ? "🔊" : "🔇"}
      </button>

      {/* ACTIVITIES BUTTON */}
      <button
        onClick={handleActivitiesClick}
        style={{
          position: "relative", // Needed to attach the badge
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "transparent",
          border: "1px solid #1e293b",
          color: "#3b82f6",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
        ACTIVITIES
        
        {/* NOTIFICATION BADGE (Only shows if unreadCount is greater than 0) */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              backgroundColor: "#ef4444",
              color: "white",
              fontSize: "10px",
              fontWeight: "bold",
              height: "18px",
              minWidth: "18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* CONFIGURE BUTTON */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "transparent",
          border: "1px solid #333",
          color: "white",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        ⚙️ CONFIGURE
      </button>

      {/* TEST BUTTON - Remove this later! */}
      <button 
        onClick={triggerNewNotification}
        style={{ marginLeft: "20px", padding: "8px", background: "green", color: "white", borderRadius: "5px", cursor: "pointer"}}
      >
        Test +1
      </button>

    </div>
  );
}