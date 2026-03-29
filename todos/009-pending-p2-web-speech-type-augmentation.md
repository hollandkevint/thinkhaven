---
status: pending
priority: p2
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, typescript]
---

# Add types/web-speech.d.ts for webkitSpeechRecognition types

## Problem Statement

`webkitSpeechRecognition` has no built-in TypeScript types. Without a declaration file, Voice I/O code will be riddled with `any` or `as unknown as` casts. TypeScript `lib.dom.d.ts` includes `SpeechRecognition` base types but not the webkit prefix.

Found by: TypeScript reviewer, Best practices researcher

## Context

- Only needed for Sprint C (voice input)
- Simple augmentation: just extend Window interface

## Acceptance Criteria

- [ ] `types/web-speech.d.ts` created with Window augmentation for `webkitSpeechRecognition`
- [ ] File included via `tsconfig.json` type roots
- [ ] No `any` casts needed for SpeechRecognition usage

## References

- Best practices researcher provided the exact type augmentation needed
