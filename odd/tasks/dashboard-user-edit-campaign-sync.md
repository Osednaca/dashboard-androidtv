# Admin user editing and automatic campaign synchronization

## Objective and authorized scope

User requested fixing the administrator Edit User action, which opens nothing, and ensuring every screen assigned to an edited campaign synchronizes automatically without using the manual Synchronize button. Local implementation, regression checks, isolated fixtures and work-unit commits are authorized. No new push, PR, deployment, real server or physical TV access is authorized. Preserve previous dashboard and Android work.

## Exploration and uncertainties

- Delegated read-only mapper explore_user_edit_sync inspected dashboard UI/routes, campaign mutation/invalidation/manifest build and Android polling/ACK behavior.
- Confirmed user-dialog cause: resources/js/Pages/Admin/Users/Index.tsx openEdit loads data and sets editing but omits setOpen(true). Existing PUT handling and business assignment are present.
- Current campaign update invalidates both previous/new target devices inside the transaction. Invalidation marks dirty and dispatches rebuild after commit. Sync/manifest endpoints rebuild dirty manifests even without a queue worker. Android foreground polling occurs around every10s, independently of command polling, with retry backoff up to60s.
- The suggested stale-build race is protected in normal supported paths by the same device row lock: build locks before reading campaigns, campaign invalidation needs that lock within its update transaction. SQLite alone does not prove MySQL concurrent behavior.
- No deterministic synchronization defect has been found yet; do not invent one or rewrite functioning mechanisms. Reproduce the end-to-end behavior locally, then correct observed failures only.
- User confirmed on 2026-10-07 that the TVs run the latest APK and the backend is updated and deployed; frequent synchronization failures persist. A missing rollout is not an explanation. Confirmed symptom: mainly videos; the advertising zone becomes empty, never recovers automatically after waiting, and manual dashboard Synchronize restores it. No production probing or remote credential reuse is authorized.

## Workflow and delivery

- Substantial ODD: two corrections and cross-stack verification worth recovering. Selected routes recorded per task below.
- Effective TDD unspecified in project/session records; ordinary regression/functional checks, no claimed RED/GREEN or invented switch.
- RDD disabled/unmanaged, global OFF verified on2026-10-07, clone-local unset. No review/receipt or mode changes.
- Skills work-unit-commits and chained-pr previously resolved by registry; apply their work-unit/delivery rules without another skill read.
- Revised forecast approximately 600-1000 authored lines including meaningful regressions and fixes, excluding generated fixture/output files. Delivery strategy ask-on-risk with previously authorized feature-branch-chain preference cached; apply integration-chain slices before further commits, with coherent editor, sync-regression, video-recovery and dependent-invalidation work units. No PRs, push or deployment authorized. Slice boundaries and commits recorded as they become concrete.
- Backend feature branch codex/admin-user-edit-campaign-sync from fc6909856db52a83e006a2708fa3cdf4bfa3494e. Android regression branch codex/admin-campaign-auto-sync starts from 1e10ddbcbe8c6c321c756d063fe240c92bb4413e. Only scoped autonomous-polling regression coverage is authorized there unless a demonstrated defect requires a behavior fix.

## Tasks and acceptance

- [x] T1 Open administrator user editor. Inline route: one already-understood mechanical UI file after delegated mapping, no unresolved design decision. Add the missing open-state transition. Verify a synthetic existing user's form opens with current values, cancellation closes it, saving updates the intended record/business association, and Create still opens. Frontend type/build and applicable regression checks. Do not add tests that merely assert the one-line implementation. Verified: typecheck, 41 frontend tests, production build (existing >500 kB chunk warning); delegated browser opened current user with role/business, cancellation preserved DB, save changed only user ID 2 and its business membership, reopen showed saved values and Create opened blank. Parent inspected edit/create screenshots and saved-state.json under ignored storage/app/admin-user-sync-fixture. Work-unit commit identity recorded after creation below.
- [ ] T2 Reproduce and fix automatic campaign delivery. Delegated direct diagnosis/writer: campaign controller, invalidator, cache builder, sync endpoints and Android loop exceed four files, and any multi-file fix must stay delegated. Use isolated local data and two assigned synthetic screens, no queue worker, no manual synchronization command. Observe campaign PUT, each screen's automatic sync/checksum, manifest installation and ACK; also second edit before ACK, retargeting, temporary download/ACK/network failures and reconnect as applicable. Preserve unrelated devices and assignment scope. Fix only demonstrated failures. Passing happy-path tests does not resolve the reported failure. Investigate actual playback installation/observation, retries and concurrent server paths; fix a demonstrated cause. Preserve proof limits and runtime findings. Commit/evidence pending.
- [ ] T3 Integration and handoff. Delegated verification as useful. Run applicable full checks after fixes, inspect actual browser interaction and synchronization results, preserve test artifacts without secret material, clean only owned fixture processes. Report failed/skipped/pending checks and runtime/deployment limits honestly. Source/documentation work-unit commit and full Engram mirror at closure. Evidence pending.

- [ ] T4 Recover video advertising automatically. Delegated direct writer video_playback_recovery: actual player/observer/error/exclusion paths require more than four files, and any multi-file fix remains delegated. Reproduce the empty-zone failure after a transient video error or install failure without a new manifest/manual sync, then fix proven causes with bounded retries and coherent playback state. Preserve withdrawal/revocation and working-media fallback. Coordinate Android runner with T2. Commit/checks pending.
- [ ] T5 Preserve automatic delivery of dependent content edits. Delegated direct pending writer: mapper identified programming/playlist mutations dispatching jobs without setting dirty, and disabled-screen reenable not invalidating campaign edits missed while disabled. Prove each with worker-free regressions before a scoped fix; relate outcomes to the user report without claiming unobserved production causality. Tests and code stay together. Commit/checks pending.

## Applicable checks

- Backend PHP C:/xampp/php/php.exe, vendor/bin/phpunit; isolated testing SQLite, DB_URL empty, cache/session/mail array, broadcasts null, queues sync/fake as scenario requires and no real queue worker. Relevant CampaignDeliveryTest, CampaignEditingTest, DeviceSettingsTest and UserBusinessAssignmentTest; Pint changed PHP files and full appropriate suite.
- Frontend node --test tests/frontend/*.test.mjs, npm run typecheck, npm run build; browser with synthetic local administrator/users only. No message/email sending.
- Android only if a client fix is required: JAVA_HOME C:/Program Files/Android/Android Studio/jbr; ./gradlew.bat :domain:test :app:testProductionDebugUnitTest --no-daemon --max-workers=1 '-Dorg.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8' '-Pkotlin.compiler.execution.strategy=in-process'. New isolated emulator only if justified; never cleanup-enabled connected tests on paired TVs.

## Progress and recovery

Exploration complete. Existing tracked files clean in both repositories. Backend baseline fc69098 and Android1e10ddb verified. Project-scoped Engram context/search found no existing feature memory for this objective; create a new topic odd/dashboard-user-edit-campaign-sync/tasks, never overwrite the previous feature. Full mirror saved and read back as Engram observation 3; compatible with the earlier library/device/city feature document. T1 one-line opening fix applied; frontend typecheck passed, build/tests and delegated browser fixture pending. T2 delegated to campaign_auto_sync for server HTTP lifecycle and Android real polling-loop regression tests. Browser checks delegated to admin_user_browser. User now confirms both deployments current; T2 remains open for deeper diagnosis. Cross-stack test coverage is separate server/client proof; do not call it physical-TV end-to-end proof.

### Accepted investigation expansion

The user explicitly requested deeper investigation after confirming current deployments. Existing valid T1 work and successful regression checks remain preserved. T2 is not complete: server HTTP and simulated client installation do not prove actual playback or concurrent MySQL behavior. Delegated sync_race_challenge performs one scoped read-only challenge of the device-lock/invalidation coherence premise; campaign_auto_sync investigates actual Android storage/observer/player behavior. No production access authorization is implied. Forecast will be revised from evidence; integration-chain delivery preference remains cached if scope exceeds the advisory delivery threshold.

### Symptom and narrowed evidence

User confirmed that videos are affected most, the advertising zone stays empty indefinitely and manual dashboard Synchronize restores playback. The server readiness hypothesis is contradicted by current sources: ffprobe metadata processing does not transcode/change file paths, uploads compute checksum/file size, and campaign selection requires ready advertising media. Date transitions are refreshed on every sync/manifest request. Manual synchronization unconditionally rebuilds the manifest using the same install/ACK path; no special client command. Android installer withdrawal-before-video-preparation and its retry state require deeper proof. Adjacent playlist/schedule missing-dirty invalidation is a separate candidate requiring a regression and scope relevance.

### Work-unit evidence

- T1 web commit debc30a6c0a01c03b92bb0a0fec0c4d0b7a0b06e (`fix(admin): open the user editing dialog`); RDD disabled/unmanaged. Slice 1 starts at fc6909856db52a83e006a2708fa3cdf4bfa3494e and ends at this commit. One behavior line plus feature tracking; tests/build/browser proof above.

### Demonstrated recovery gap and ownership

The delegated playback mapper found a persistent source-level failure matching the empty-video symptom: ZoneSurface reports LOCAL_ASSET_CORRUPT_OR_MISSING and retries frames without preparing the local file; SyncCoordinator skips manifest installation when the server version equals the installed version. A new manual manifest version triggers installation/repair, whereas autonomous polling never repairs the unchanged version. Actual causal reproduction/tests remain required before closure. Video playback ERROR and single-item ENDED loops already retry and are not to be changed speculatively. MediaCache active leases can block replacing corruption; recovery must preserve lease/atomic-install/withdrawal semantics.

T4 writer video_playback_recovery exclusively owns SyncCoordinator source, ManifestRepository, MediaCache and focused playback/cache tests. T2 writer campaign_auto_sync retains SyncRepositoryTest.kt and coordinates the unit runner, with no overlapping behavior edits. Directed cache/renderer instrumentation may use an isolated owned emulator only, after memory/build coordination. A signed production 0.1.22 artifact and release metadata will follow the verified app behavior fix, with deployment still unauthorized.

- T2 server regression slice: CampaignAutomaticSyncTest passed 2 tests / 113 assertions with Bus::fake(), including two assigned devices, second edit before ACK, old/repeated ACK, retargeting, failed install ACK and unrelated-device isolation; Pint passed. This HTTP proof simulates device polling and does not verify Android rendering or MySQL concurrency. T2 remains open until the demonstrated local-cache recovery fix is checked.
