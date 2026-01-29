
# Screen Share Collaboration App

A professional real-time screen sharing application where hosts can share their screen with approved viewers.

---

## Page 1: Homepage (/)

**Welcome screen with browser compatibility check**

- Clean hero section with app title "Screen Share Collaboration"
- Tagline: "Share your screen securely with your team"
- **"Create Room"** button - for hosts to start sharing
- **"Join Room"** input field + button - for viewers to enter a room ID
- Automatic browser compatibility check (navigator.mediaDevices.getDisplayMedia)
- Unsupported browser message with recommendations if API unavailable

---

## Page 2: Host Room (/room/:roomId/host)

**The host's control center**

### Screen Sharing Section
- Large video preview area showing the shared screen
- Stream metadata display (resolution, display type: tab/window/screen)
- **Start/Stop Sharing** button with clear visual states
- **Pause/Resume** toggle for the stream
- Quality indicator

### Control Panel Sidebar
- **Room ID display** with copy-to-clipboard button
- **Viewer Requests** - list of pending join requests with Accept/Reject buttons
- **Active Viewers** - list showing who's currently watching
- **Chat panel** - real-time text messages with all participants

### State Handling
- Permission requesting state (loading spinner)
- Permission granted state (live preview)
- User cancelled state (retry prompt)
- Permission denied state (instructions to enable)
- Stream ended detection (browser UI stop detected)

---

## Page 3: Viewer Waiting Room (/room/:roomId/waiting)

**Where viewers wait for host approval**

- Animated waiting indicator
- "Waiting for host to approve your request..."
- Option to leave/cancel the request
- Auto-redirect to viewer room when approved
- Rejection notification if denied

---

## Page 4: Viewer Room (/room/:roomId/viewer)

**Where approved viewers watch the stream**

### Viewing Area
- Full-width video display of the shared screen
- Connection quality indicator
- **Viewer controls**: Enter/exit fullscreen

### Sidebar
- **Viewer list** - see who else is watching
- **Chat panel** - send and receive messages

### Edge Cases
- "Host has paused sharing" overlay
- "Host has stopped sharing" with return-to-home option
- "Connection lost" with reconnection attempt

---

## Page 5: End Screen

**When a session ends**

- "Screen sharing has ended" message
- Session summary (duration, number of viewers)
- **"Start New Session"** button (for hosts)
- **"Back to Home"** button

---

## Technical Implementation

### Custom Hook: `useScreenShare`
- Manages getDisplayMedia requests
- Tracks stream state (idle, requesting, active, paused, stopped, error)
- Handles track.onended events
- Proper cleanup on unmount

### Custom Hook: `useWebRTCPeer`
- Creates and manages RTCPeerConnection
- Handles ICE candidate exchange
- Manages offer/answer negotiation

### Backend (Lovable Cloud)
- **Realtime channels** for WebRTC signaling
- **Presence** for viewer list tracking
- **Database** for room persistence and join requests
- **Chat messages** via realtime broadcast

### Reusable Components
- Button (with loading, disabled states)
- VideoPreview (for displaying streams)
- StatusBadge (for connection states)
- ChatMessage
- ViewerCard

---

## User Flows

### Host Flow
1. Land on homepage → Click "Create Room"
2. Redirected to Host Room with unique room ID
3. Click "Start Sharing" → Browser permission dialog
4. Select screen/window/tab → Live preview appears
5. Share room ID with viewers
6. Approve/reject viewer requests as they come in
7. Chat with approved viewers
8. Stop sharing when done → End screen

### Viewer Flow
1. Land on homepage → Enter room ID → Click "Join"
2. Redirected to Waiting Room
3. Wait for host approval
4. Once approved → See live screen share
5. Chat with host and other viewers
6. When host stops → Redirected to End screen

