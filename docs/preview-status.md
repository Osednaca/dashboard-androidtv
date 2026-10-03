# Screen preview status

The dashboard reads the snapshot acknowledged by the selected TV (`current_manifest_version`, scoped to that device). It never rebuilds a manifest on GET and never substitutes a random campaign, recent upload, or unconfirmed pending manifest. The same reader serves administrator and business pages. Business controllers restrict selectable devices to the signed-in business.

Preview layout comes from that confirmed snapshot: explicit 0/90/180/270 rotation, legacy orientation fallback, side-by-side or top/bottom split, percentages and the business zone order. The web display presents the upright physical screen, with vertical/horizontal and split labels. Images, videos and provider embeds/HLS use the appropriate web renderer. A provider status describes the **web player**, not TV playback.

The preview is currently a sample, clearly marked approximate. It chooses the first eligible item in the confirmed playlist, applies the snapshot's schedule windows in the device timezone, and selects eligible advertising from that snapshot. Devices with no matching acknowledged manifest show an unconfirmed state instead of invented content. Offline status, last TV synchronization, dashboard check time and pending changes are separate.

Administrator selection is deterministic and has a screen selector. The existing business selector remains business-scoped. Pages refresh preview props every 15 seconds through Inertia; the administrator analytics overview is lazy and is not recomputed by a preview-only poll. Refresh pauses/throttles with the Inertia poll lifecycle.

## Deferred Android work

The user chose real playback reporting in a future APK and explicitly deferred all Android changes until supplying further app requirements. This change adds no telemetry API and builds no APK. Exact current item, cursor/position, quick-play overlays, TV buffering/fallback and frame synchronization remain unavailable. Browser video/provider streams run independently and cannot prove what the TV currently shows. The next Android change should report device-scoped per-zone playback identity and position with freshness, rather than treating dashboard timing as a live TV report.

## Verification

`DevicePreviewTest` covers confirmed-versus-pending snapshots, old acknowledged versions, no cross-device fallback, no GET mutation, rotations/order, timezone/overnight schedules, campaign/live eligibility, stable admin selection, partial refresh and business isolation. `tests/Frontend/screen-preview.test.mjs` renders the real preview components to verify upright aspect/split/order, image/video/live tags, all rotations and honest unavailable/approximate states. SSR assertions do not prove pixel layout or remote provider availability.

Local browser verification used an isolated `dashboard-web-browser.sqlite` testing database and the public brand image. Portrait90 with advertising above30/business below70 was observed on mobile and desktop. No production media or remote providers were contacted; real provider availability remains unverified.
