import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceInput({ 
  onTranscript, 
  className, 
  placeholder = "Clique para gravar",
  disabled = false
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
    }
  }, []);

  const startListening = () => {
    if (!isSupported || disabled || isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      toast({
        title: "Gravação iniciada",
        description: "Fale agora. Sua voz está sendo capturada.",
      });
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        onTranscript(transcript.trim());
        toast({
          title: "Texto reconhecido",
          description: "Sua fala foi convertida em texto com sucesso.",
        });
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = "Erro no reconhecimento de voz";
      switch (event.error) {
        case 'no-speech':
          errorMessage = "Nenhuma fala detectada. Tente novamente.";
          break;
        case 'audio-capture':
          errorMessage = "Erro ao capturar áudio. Verifique o microfone.";
          break;
        case 'not-allowed':
          errorMessage = "Permissão negada. Permita o acesso ao microfone.";
          break;
        case 'network':
          errorMessage = "Erro de rede. Verifique sua conexão.";
          break;
      }
      
      toast({
        title: "Erro na gravação",
        description: errorMessage,
        variant: "destructive",
      });
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className={cn("p-4 bg-gray-50 border border-gray-200 rounded-lg", className)}>
        <div className="flex items-center space-x-2 text-gray-500">
          <MicOff className="w-5 h-5" />
          <p className="text-sm">Entrada por voz não suportada neste navegador</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={cn(
          "w-full h-12 transition-all duration-200",
          isListening && "animate-pulse"
        )}
      >
        {isListening ? (
          <>
            <Square className="w-5 h-5 mr-2" />
            Parar gravação
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" />
            {placeholder}
          </>
        )}
      </Button>
      
      {isListening && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm text-red-800 font-medium">Gravando... Fale agora</p>
          </div>
          {transcript && (
            <p className="text-xs text-red-600 mt-2 italic">"{transcript}"</p>
          )}
        </div>
      )}
      
      {transcript && !isListening && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Volume2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-800 font-medium">Texto reconhecido:</p>
              <p className="text-sm text-green-700 mt-1">"{transcript}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
