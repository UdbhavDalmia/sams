# Proctored Test Portal Implementation Plan

## Goal Description
The objective is to outline the structure and implications of adding a 100% proctored test portal to the SAMS application. The portal will include continuous camera monitoring and tab-switching/browser-focus detection to ensure test integrity. Since this is for future consideration, this document serves as an architectural blueprint and impact analysis.

---

## 1. Core Features

### Camera Proctoring
*   **Continuous Recording/Monitoring:** Capturing webcam feed during the exam.
*   **Identity Verification (Optional but Recommended):** Taking a snapshot at the beginning of the test for ID matching.
*   **AI/Automated Flagging:** Analyzing the video stream for anomalies (e.g., multiple faces, no face detected, looking away frequently).

### Browser Behavior Monitoring
*   **Tab Switching Detection:** Detecting if the user navigates away from the test tab.
*   **Window Focus Loss:** Detecting if the browser window loses focus or another application is opened on top.
*   **Full-Screen Enforcement:** Requiring the browser to be in full-screen mode to take the test and detecting if the user exits it.
*   **Copy/Paste Restrictions:** Disabling clipboard operations and right-click menus to prevent sharing or searching questions.

---

## 2. Technical Architecture & Structure

### Frontend (React & Vite)
*   **Media Devices API:** Use `navigator.mediaDevices.getUserMedia()` to access the camera and microphone.
*   **Page Visibility API:** Use `document.addEventListener('visibilitychange', ...)` to detect tab switching.
*   **Window Events:** Use `window.onblur` and `window.onfocus` to detect window focus changes.
*   **Fullscreen API:** Use `element.requestFullscreen()` and listen to `fullscreenchange` events.
*   **Component Structure:**
    *   `ProctoringWrapper`: A higher-order component that wraps the test view and manages all event listeners and the camera feed.
    *   `CameraStream`: A component to display a small feed to the user so they know they are being recorded.
    *   `WarningModal`: A UI component to alert users when they violate a rule (e.g., "Please return to the test").

### Backend (Node/Express & Firebase)
*   **Event Logging:** A dedicated Express endpoint to receive real-time behavioral flags (e.g., `POST /api/proctor/events`).
*   **Video Storage Strategy:**
    *   *Option A (Live Streaming):* Use WebRTC or a service like Twilio/Vonage for live proctoring. High cost and complex.
    *   *Option B (Periodic Snapshots):* Capture images every X seconds and upload to Firebase Cloud Storage. Low cost, easier to implement.
    *   *Option C (Chunked Video Uploads):* Use `MediaRecorder` on the frontend to record in chunks (e.g., 5 mins) and upload to Firebase Cloud Storage. Medium complexity.
*   **Database (Firestore):**
    *   Create a `ProctoringSessions` collection.
    *   Store metadata: timestamps, violation events (type: `TAB_SWITCH`, `FOCUS_LOSS`), and references to video/image storage paths.

---

## 3. Implications and Challenges

> [!WARNING]
> **Privacy and Compliance**
> Capturing and storing biometric/video data introduces significant privacy implications. You must comply with GDPR, CCPA, and other local regulations. Explicit user consent will be required before the test begins.

> [!CAUTION]
> **Storage Costs**
> Storing full video streams for every student taking a test can exponentially increase Firebase Cloud Storage and bandwidth costs. Consider using periodic snapshots instead of continuous video to optimize costs.

> [!NOTE]
> **Browser Limitations**
> JavaScript cannot prevent users from switching tabs or using other devices (like a phone). It can only *detect* and *report* these actions. Some browser extensions or privacy settings might block the Page Visibility API or camera access.

### Performance Implications
*   **Frontend Load:** Processing video or capturing chunks can be CPU-intensive on low-end devices, potentially causing the test UI to lag.
*   **Network Bandwidth:** Uploading video chunks requires a stable upstream connection. If a student's connection drops, the proctoring stream might fail.

### Development Effort
*   Requires building robust error-handling for hardware permissions (e.g., what happens if a user denies camera access?).
*   Implementing AI-based anomaly detection (like face tracking) would require integrating third-party APIs (e.g., AWS Rekognition, Google Cloud Vision) or client-side libraries (like TensorFlow.js or face-api.js), adding complexity.

---

## 4. Suggested Implementation Phases (When ready)

1.  **Phase 1: Behavioral Tracking:** Implement tab-switching, focus loss, and copy/paste prevention. Log these events to Firestore without any camera requirements.
2.  **Phase 2: Camera Snapshots:** Implement camera permissions and take randomized photo snapshots during the exam to upload to Firebase Storage.
3.  **Phase 3: Continuous Video / AI:** Implement chunked video recording and optional AI processing for automated flagging.
