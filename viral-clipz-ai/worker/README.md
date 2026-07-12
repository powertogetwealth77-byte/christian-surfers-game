# Viral Clipz Worker

Trusted media-processing worker for the Viral Clipz AI Expo app.

## What it does

1. Atomically claims a queued `processing_jobs` row.
2. Downloads the private source from Supabase Storage.
3. Inspects streams with `ffprobe`.
4. Extracts mono WAV audio with FFmpeg.
5. Transcribes through Deepgram or the explicit fixture provider.
6. Persists timestamped transcript segments.
7. Generates deterministic candidate windows.
8. Scores candidates against the selected business objective.
9. Removes heavily overlapping recommendations.
10. Renders up to three 720×1280 watermarked previews and thumbnails.
11. Uploads outputs privately and persists clip assets.
12. Settles verified processing minutes once.

## Local commands

```bash
cp .env.example .env
npm install
npm test
npm run dev
```

`npm test` compiles the worker, validates objective scoring/diversity, generates a synthetic video with FFmpeg, probes it, extracts audio, renders a vertical preview, and verifies the resulting files.

## Production deployment

Build from this directory using `Dockerfile`. The container includes FFmpeg and runs one polling worker process. Start with one Railway replica and `TRANSCRIPTION_PROVIDER=fixture` to verify infrastructure without AI spend; switch to `deepgram` only after the upload-to-preview loop passes.

Required production secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPGRAM_API_KEY` when using Deepgram

The service-role key must never be placed in the Expo client environment.
