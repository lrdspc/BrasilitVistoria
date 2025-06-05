import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscript, onError, className, disabled }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Permissão negada para usar o microfone',
          'no-speech': 'Nenhuma fala detectada',
          'network': 'Erro de rede',
          'audio-capture': 'Erro ao capturar áudio',
          'service-not-allowed': 'Serviço não permitido',
        };

        const message = errorMessages[event.error] || 'Erro desconhecido no reconhecimento de voz';
        onError?.(message);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      onError?.('Reconhecimento de voz não suportado neste navegador');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onError]);

  const startListening = async () => {
    if (!isSupported || !recognitionRef.current || disabled) return;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
    } catch (error) {
      console.error('Microphone permission error:', error);
      onError?.('Permissão para usar o microfone é necessária');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleListening}
      disabled={disabled}
      className={cn(
        'transition-colors',
        {
          'text-red-500 hover:text-red-600': isListening,
          'text-blue-600 hover:text-blue-700': !isListening,
        },
        className
      )}
    >
      {isListening ? (
        <Square className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};

// Add types for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
