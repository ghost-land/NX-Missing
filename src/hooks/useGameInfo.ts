import { useState, useEffect } from 'react';
import { GameInfo } from '../types';

export function useGameInfo(titleId: string) {
  const [data, setData] = useState<GameInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchGameInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`https://api.nlib.cc/nx/${titleId}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          referrerPolicy: 'no-referrer',
          cache: 'force-cache'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        
        // Validate the response data structure
        if (!jsonData || typeof jsonData !== 'object' || !jsonData.id) {
          throw new Error('Invalid game data received');
        }

        setData(jsonData);
      } catch (err) {
        if (err instanceof Error) {
          // Don't set error if the request was aborted
          if (err.name !== 'AbortError') {
            console.error('Error fetching game info:', err);
            setError(new Error('Failed to load game information. Please try again later.'));
          }
        } else {
          setError(new Error('An unexpected error occurred'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (titleId) {
      fetchGameInfo();
    }

    // Cleanup function to abort any pending requests
    return () => {
      controller.abort();
      setData(null);
      setError(null);
      setIsLoading(false);
    };
  }, [titleId]);

  return { data, isLoading, error };
}