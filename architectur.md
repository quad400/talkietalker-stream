# Video Conferencing Scalability and Feature Implementation

Implement and scale the existing video conferencing system following Clean Architecture principles, SOLID principles, and industry best practices. Use Zoom and Google Meet as references for user experience and behavior.

## Core Requirements

### 1. Meeting Scalability

Support meetings with up to **2,000 participants**.

#### Large Meetings (>50 participants)

* Up to **10 participants** may simultaneously:

  * Share video.
  * Speak through microphone.
  * Share screen (optional future extension).

* Remaining participants should join in a listener/viewer mode:

  * Camera disabled.
  * Microphone disabled.
  * Can request permission to speak.

#### Small Meetings (≤50 participants)

* All participants should have full capabilities:

  * Camera access.
  * Microphone access.
  * Video participation.
  * Normal interactive meeting experience.

The transition between these modes should happen automatically based on participant count.

---

### 2. Role-Based Permissions

Support the following roles:

#### Host

Can:

* Start and end meetings.
* Admit guest users.
* Promote participants to moderators.
* Grant or revoke permissions for:

  * Camera.
  * Microphone.
  * Screen sharing.
* Start and stop recording.
* Remove participants.
* Mute participants.
* Lock meeting.
* Disable participant video globally.

#### Moderator

Can:

* Admit guests.
* Grant speaking privileges.
* Mute participants.
* Manage waiting room.
* Remove disruptive users.

#### Registered Participant

* Registered conference participants bypass the waiting room.
* Automatically join once authenticated.

#### Guest Participant

Guests should:

* Enter a waiting room.
* Require approval from Host or Moderator before joining.

---

### 3. Dynamic Speaking Permissions

Hosts and moderators should be able to:

* Grant temporary microphone access.
* Grant temporary camera access.
* Revoke permissions at any time.
* Approve raised-hand requests.

When permissions are revoked:

* Video stream should stop.
* Audio stream should stop.
* UI should update immediately.

---

### 4. Waiting Room

Implement behavior similar to Zoom:

#### Registered Participants

* Skip waiting room.
* Join directly.

#### Guests

* Stay in waiting room.
* Host or moderator may:

  * Admit individually.
  * Admit all.
  * Reject users.

---

### 5. Recording

Recording should integrate with the existing recording architecture.

Requirements:

* Recording starts only when initiated by host.
* All participants should receive a recording indicator.
* Support recording:

  * Active speaker.
  * Shared screens.
  * Audio streams.
* Recordings should continue despite participant reconnections.
* Handle host disconnections gracefully.
* Automatically finalize recordings when meeting ends.
* Store metadata:

  * Meeting ID.
  * Start time.
  * End time.
  * Participants.
  * Recording status.
  * Storage location.

---

### 6. Raise Hand System

Participants should be able to:

* Raise hand.
* Lower hand.

Hosts and moderators should:

* Receive notifications.
* Approve speaking requests.
* Grant microphone and camera permissions.

---

### 7. Meeting Controls

Implement:

* Mute all.
* Unmute individual participants.
* Disable participant cameras.
* Remove participant.
* Lock meeting.
* End meeting for everyone.
* Leave meeting without ending it.
* Transfer host privileges.

---

### 8. Participant Management

Track:

* Participant status.
* Join and leave events.
* Reconnection events.
* Device information.
* Network quality.
* Current permissions.
* Active speaker status.

Support reconnection without losing meeting state.

---

### 9. Media Optimization

#### ≤50 Participants

* Mesh/SFU mode allowing everyone to publish audio and video.

#### >50 Participants

Use SFU architecture optimized for scale:

* Maximum 10 active publishers.
* Remaining users are subscribers only.
* Dynamically switch active speakers.
* Prioritize active speakers.
* Adaptive bitrate.
* Simulcast support.
* Network congestion handling.
* Bandwidth estimation.
* Automatic quality degradation.

---

### 10. Event-Driven Architecture

Introduce domain events:

* MeetingCreated
* MeetingStarted
* ParticipantJoined
* ParticipantLeft
* GuestWaiting
* GuestAdmitted
* HandRaised
* PermissionGranted
* PermissionRevoked
* RecordingStarted
* RecordingStopped
* MeetingEnded

Separate:

* Domain layer
* Application layer
* Infrastructure layer
* Presentation layer

Keep WebRTC, media servers, and persistence concerns inside infrastructure.

---

### 11. Reliability

Support:

* Reconnection after network interruptions.
* Idempotent operations.
* Heartbeat mechanism.
* Presence detection.
* Host failover.
* Meeting recovery after transient failures.
* Horizontal scaling across servers.

---

### 12. Future Features (Design for Extensibility)

Architecture should easily support:

* Chat.
* Reactions and emojis.
* Polls.
* Q&A.
* Screen sharing.
* Breakout rooms.
* Whiteboard.
* Live captions.
* Transcriptions.
* AI meeting summaries.
* Live streaming to YouTube.
* Webinar mode.
* Attendance tracking.

---

## Non-Functional Requirements

Follow:

* Clean Architecture.
* SOLID principles.
* CQRS where appropriate.
* Event-driven design.
* High scalability.
* Fault tolerance.
* Maintainability.
* Testability.
* Domain-driven design.

Avoid tightly coupled components and ensure all features are modular and extensible.

Use Zoom and Google Meet as behavioral references for UX and meeting flows.
