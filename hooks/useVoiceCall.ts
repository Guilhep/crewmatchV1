import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface VoiceCallSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'end-call';
  from: string;
  to: string;
  data?: any;
  conversationId: string;
}

export function useVoiceCall(conversationId: string, currentUserId: string, otherUserId: string) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const callStartTime = useRef<number | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const channel = useRef<any>(null);

  // Configuração STUN/TURN servers (usando servidores públicos gratuitos)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Enviar sinal via Supabase Realtime
  const sendSignal = useCallback(async (signal: Omit<VoiceCallSignal, 'conversationId'>) => {
    try {
      const fullSignal: VoiceCallSignal = {
        ...signal,
        conversationId,
      };
      
      console.log('📡 Enviando sinal:', fullSignal.type);
      
      // Enviar via broadcast do Supabase
      if (channel.current) {
        await channel.current.send({
          type: 'broadcast',
          event: 'voice-call-signal',
          payload: fullSignal,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar sinal:', error);
    }
  }, [conversationId]);

  // Criar peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) {
      return peerConnection.current;
    }

    const pc = new RTCPeerConnection(iceServers);
    
    // Adicionar stream local
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current!);
      });
    }

    // Receber stream remoto
    pc.ontrack = (event) => {
      console.log('🎵 Stream remoto recebido');
      remoteStream.current = event.streams[0];
      
      // Tocar áudio remoto
      const audioElement = document.getElementById('remote-audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.srcObject = event.streams[0];
        audioElement.play().catch(e => console.error('Erro ao tocar áudio:', e));
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Enviando ICE candidate');
        sendSignal({
          type: 'ice-candidate',
          from: currentUserId,
          to: otherUserId,
          data: event.candidate,
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        callStartTime.current = Date.now();
        startDurationTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [currentUserId, otherUserId, sendSignal]);

  // Iniciar timer de duração
  const startDurationTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  // Iniciar chamada
  const startCall = useCallback(async () => {
    try {
      console.log('📞 Iniciando chamada...');
      setCallStatus('calling');

      // Obter stream de áudio local
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      console.log('🎤 Microfone capturado');

      // Criar peer connection
      const pc = createPeerConnection();

      // Criar offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Enviar offer
      await sendSignal({
        type: 'offer',
        from: currentUserId,
        to: otherUserId,
        data: offer,
      });

      console.log('✅ Offer enviado');
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error);
      setCallStatus('idle');
      alert('Erro ao acessar microfone. Verifique as permissões do navegador.');
    }
  }, [currentUserId, otherUserId, createPeerConnection, sendSignal]);

  // Aceitar chamada
  const acceptCall = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log('📞 Aceitando chamada...');
      setCallStatus('connected');

      // Obter stream de áudio local
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      console.log('🎤 Microfone capturado');

      // Criar peer connection
      const pc = createPeerConnection();

      // Definir remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Criar answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Enviar answer
      await sendSignal({
        type: 'answer',
        from: currentUserId,
        to: otherUserId,
        data: answer,
      });

      console.log('✅ Answer enviado');
    } catch (error) {
      console.error('Erro ao aceitar chamada:', error);
      setCallStatus('idle');
      alert('Erro ao acessar microfone. Verifique as permissões do navegador.');
    }
  }, [currentUserId, otherUserId, createPeerConnection, sendSignal]);

  // Rejeitar chamada
  const rejectCall = useCallback(async () => {
    console.log('❌ Rejeitando chamada');
    await sendSignal({
      type: 'end-call',
      from: currentUserId,
      to: otherUserId,
    });
    setCallStatus('idle');
  }, [currentUserId, otherUserId, sendSignal]);

  // Encerrar chamada
  const endCall = useCallback(async () => {
    console.log('📴 Encerrando chamada');
    
    // Enviar sinal de encerramento
    if (callStatus !== 'idle') {
      await sendSignal({
        type: 'end-call',
        from: currentUserId,
        to: otherUserId,
      });
    }

    // Parar timer
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    // Fechar peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Parar streams
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    if (remoteStream.current) {
      remoteStream.current.getTracks().forEach((track) => track.stop());
      remoteStream.current = null;
    }

    setCallStatus('idle');
    setCallDuration(0);
    callStartTime.current = null;
  }, [callStatus, currentUserId, otherUserId, sendSignal]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Configurar Realtime subscription para sinais
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    console.log('🔌 Conectando ao canal de voz:', conversationId);

    // Criar canal Realtime
    const voiceChannel = supabase.channel(`voice:${conversationId}`, {
      config: {
        broadcast: { self: false }, // Não receber próprias mensagens
      },
    });

    // Escutar sinais de chamada
    voiceChannel.on('broadcast', { event: 'voice-call-signal' }, async ({ payload }) => {
      const signal = payload as VoiceCallSignal;
      
      // Ignorar sinais não destinados a este usuário
      if (signal.to !== currentUserId) return;

      console.log('📡 Sinal recebido:', signal.type);

      switch (signal.type) {
        case 'offer':
          // Recebendo chamada
          setCallStatus('ringing');
          // O offer será processado quando o usuário aceitar
          // Armazenar offer temporariamente
          (window as any).__pendingOffer = signal.data;
          break;

        case 'answer':
          // Chamada aceita
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(signal.data)
            );
            console.log('✅ Answer recebido e aplicado');
          }
          break;

        case 'ice-candidate':
          // Novo ICE candidate
          if (peerConnection.current && signal.data) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(signal.data)
            );
            console.log('🧊 ICE candidate adicionado');
          }
          break;

        case 'end-call':
          // Chamada encerrada pelo outro usuário
          endCall();
          break;
      }
    });

    voiceChannel.subscribe((status) => {
      console.log('📡 Status do canal:', status);
    });

    channel.current = voiceChannel;

    return () => {
      console.log('🔌 Desconectando do canal de voz');
      voiceChannel.unsubscribe();
      endCall();
    };
  }, [conversationId, currentUserId, endCall]);

  // Aceitar chamada pendente
  const acceptPendingCall = useCallback(async () => {
    const pendingOffer = (window as any).__pendingOffer;
    if (pendingOffer) {
      await acceptCall(pendingOffer);
      delete (window as any).__pendingOffer;
    }
  }, [acceptCall]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    callStatus,
    isMuted,
    callDuration,
    startCall,
    acceptCall: acceptPendingCall,
    rejectCall,
    endCall,
    toggleMute,
  };
}
