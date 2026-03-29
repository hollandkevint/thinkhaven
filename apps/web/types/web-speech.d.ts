// Type augmentation for webkit-prefixed Web Speech API
// SpeechRecognition base types are in lib.dom.d.ts (TypeScript 4.4+)
// Only the webkit prefix needs augmentation

interface Window {
  webkitSpeechRecognition: typeof SpeechRecognition
}
