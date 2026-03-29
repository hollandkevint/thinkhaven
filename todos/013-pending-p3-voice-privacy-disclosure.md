---
status: pending
priority: p3
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, security, privacy]
---

# Voice input needs privacy disclosure about Google server processing

## Problem Statement

Chrome's Web Speech API sends audio to Google's servers for transcription. The browser permission prompt doesn't disclose this. For a decision accelerator where users discuss business strategies, this is a privacy consideration.

Found by: Security sentinel, Best practices researcher

## Context

- SpeechSynthesis (TTS) is local — no privacy concern
- SpeechRecognition (STT) sends audio to Google in Chrome/Edge
- ThinkHaven already masks chat areas with `data-ph-mask` for PostHog

## Acceptance Criteria

- [ ] Small privacy notice near mic button: "Voice processed by your browser's cloud service"
- [ ] Notice shown on first use or as persistent tooltip
- [ ] Consider adding to privacy policy / terms of service

## References

- Security sentinel findings
- Best practices researcher: Chrome sends audio to Google servers
