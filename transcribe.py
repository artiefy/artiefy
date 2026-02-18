import sys
import whisper
import json

if len(sys.argv) < 2:
    print(json.dumps({"error": "Audio path requerido"}))
    sys.exit(1)

audio_path = sys.argv[1]
model = whisper.load_model("base")
result = model.transcribe(audio_path, word_timestamps=True)

transcription = []
for segment in result['segments']:
    transcription.append({
        "start": segment['start'],
        "end": segment['end'],
        "text": segment['text']
    })

print(json.dumps(transcription))
