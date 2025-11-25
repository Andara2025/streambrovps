# YouTube Schedule Integration for Stream Menu

## Objective
Integrate the Stream "New Stream" flow with YouTube Live Schedules when the user has connected their YouTube channel. Provide options to link an existing upcoming YouTube broadcast, or create a new YouTube schedule directly from the New Stream modal, and auto-fill RTMP settings accordingly.

## Why
- Reduce friction: avoid context switching between app and YouTube Studio.
- Ensure the encoder is configured with the correct RTMP URL and stream key.
- Keep a consistent linkage between local streams and YouTube broadcasts for later automation (Go Live/End, thumbnails, metrics).

---

## Feature Scope

- [A] Select existing YouTube Upcoming schedule when creating a new Stream.
- [B] Create a new YouTube Schedule from the New Stream modal (mini schedule form).
- [C] Persist linkage (local stream ↔ YouTube broadcast) and display status/badges.
- [D] Optional: expose bound stream key so RTMP/key can be auto-filled.

---

## UX Changes (views/dashboard.ejs)

- Add integration selector in New Stream modal (Stream Configuration):
  - No YouTube Integration (default)
  - Select from YouTube Upcoming (loads list when connected)
  - Create new YouTube Schedule (shows mini subform)

- If "Select from YouTube Upcoming" is chosen:
  - Fetch `GET /youtube/api/broadcasts?status=upcoming`.
  - Show dropdown of upcoming broadcasts: title + scheduled time.
  - Upon selection:
    - Prefill Stream Title with broadcast title.
    - Prefill Schedule time in Stream form (optional).
    - Try to fetch bound stream key to auto-fill RTMP/key.

- If "Create new YouTube Schedule" is chosen:
  - Show fields: Title, Description, Privacy, Scheduled Time, Auto Start/End, (Thumbnail optional).
  - On submit of New Stream:
    - Create YouTube broadcast first `POST /youtube/schedule-live`.
    - Then continue creating local Stream form with returned stream info and broadcastId.

- Badge/summary after creation:
  - Display linked YouTube broadcast: title + link to Manage page.

---

## Backend Endpoints

- Existing:
  - `GET /youtube/api/broadcasts?status=upcoming` → list upcoming.
  - `POST /youtube/schedule-live` → create schedule (already supports autoStart/autoStop + thumbnail).
  - `DELETE /youtube/broadcasts/:id` → for cleanup if needed.

- New/Extended (if needed):
  1. `GET /youtube/api/broadcasts/:id` → return single broadcast including `contentDetails.boundStreamId`.
  2. `GET /youtube/api/streams` → list user liveStreams (id, cdn.ingestionInfo.streamName, cdn.ingestionInfo.ingestionAddress).
  3. Optionally: `GET /youtube/api/broadcasts/:id/rtmp` → convenience endpoint returning `{ rtmpUrl, streamKey }` by combining (1) and (2).

- Notes:
  - Our `scheduleLive()` already binds broadcast to a stream. We will return `stream` object from schedule endpoint (already implemented) and/or expose `boundStreamId` for existing broadcasts.

---

## Data Model Changes (local DB)

- Add column to `streams` table: `youtube_broadcast_id TEXT NULL`.
- When creating a Stream with YouTube integration:
  - Save the chosen/created broadcastId into `streams.youtube_broadcast_id`.
- Benefits:
  - Easy cross-navigation to Manage page.
  - Future automation (e.g., trigger Go Live/End for the same broadcast).

---

## Frontend Flow

- Load-time: If `youtubeConnected` true, enable YouTube Integration section.
- Selecting Existing Broadcast:
  - Fetch upcoming list; when one is selected, call `GET /youtube/api/broadcasts/:id/rtmp` to attempt auto-fill RTMP/key.
  - If RTMP/key unavailable, show helper text to copy from YouTube Studio.
- Creating New Schedule:
  - Call `POST /youtube/schedule-live` with mini form values.
  - On success: 
    - Grab `rtmpUrl` and `streamKey` from returned `stream.cdn.ingestionInfo`.
    - Prefill in Stream form; save `broadcast.id` for DB.

---

## Edge Cases

- Token expired → show reconnect YouTube prompt.
- Broadcast without bound stream → fall back to manual key.
- Past-dated schedule → validate and prevent submission.
- Permission errors → surface API error messages clearly.

---

## Testing Plan

- Unit: verify endpoints (list upcoming, single broadcast, streams list, rtmp convenience).
- Integration: New Stream with A and B paths; data saved with `youtube_broadcast_id`.
- UI: Ensure selector appears only when connected; graceful fallback when disconnected.
- Manual: Verify in YouTube Studio that created schedules and bindings are correct; start encoder with auto-filled key.

---

## Rollout Plan

1. Add DB column `streams.youtube_broadcast_id` (migration).
2. Implement new endpoints (read-only at first): `broadcasts/:id` and `streams`.
3. Add YouTube Integration section to New Stream modal.
4. Wire flows A and B; prefill RTMP/key where possible.
5. QA end-to-end; update docs.

---

## Follow-ups (Optional)

- Link Edit Stream to change associated YouTube broadcast.
- Start/End broadcast from Stream page (reuse Manage API).
- Sync badges/metrics on Stream page using `videos.list` and `liveStreamingDetails`.
