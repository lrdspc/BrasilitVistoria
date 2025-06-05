import { useState, useRef } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== "undefined" && "webkitSpeechRecognition" in window
  );
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!isSupported || disabled) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "pt-BR";

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={`p-2 ${
        isListening
          ? "text-red-600 hover:text-red-700 bg-red-50"
          : "text-blue-600 hover:text-blue-700"
      }`}
    >
      {isListening ? (
        <>
          <Square className="w-4 h-4 mr-1" />
          Parar
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-1" />
          Falar
        </>
      )}
    </Button>
  );
}
