import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://algoapi.dreamintraders.in';

export function useMarketWebSocket() {
  const [liveData, setLiveData] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ socket connected:', socket.id);
    });

    // Keyed by strategy_id, same shape as the web app's liveData
    socket.on('strategy_update', (incoming) => {
      if (!incoming?.strategy_id) return;
      setLiveData((prev) => ({
        ...prev,
        [incoming.strategy_id]: incoming,
      }));
    });

    socket.on('disconnect', () => {
      console.log('❌ socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return liveData;
}