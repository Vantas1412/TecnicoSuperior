import { useState, useEffect } from 'react';

const STORAGE_KEY = '_la_tk';
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export const useLoginAttempts = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);

  // Verificar estado al montar
  useEffect(() => {
    checkBlockStatus();
    const interval = setInterval(checkBlockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkBlockStatus = () => {
    const data = getStoredData();
    
    if (!data) {
      setIsBlocked(false);
      setAttemptsLeft(MAX_ATTEMPTS);
      return;
    }

    const now = Date.now();
    
    if (data.blockedUntil && now < data.blockedUntil) {
      setIsBlocked(true);
      setRemainingTime(Math.ceil((data.blockedUntil - now) / 1000));
    } else if (data.blockedUntil && now >= data.blockedUntil) {
      // Bloqueo expiró, limpiar
      clearAttempts();
      setIsBlocked(false);
      setAttemptsLeft(MAX_ATTEMPTS);
    } else {
      setIsBlocked(false);
      setAttemptsLeft(MAX_ATTEMPTS - (data.attempts || 0));
    }
  };

  const getStoredData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const setStoredData = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving login attempts:', error);
    }
  };

  const recordFailedAttempt = () => {
    const data = getStoredData() || { attempts: 0 };
    data.attempts = (data.attempts || 0) + 1;
    data.lastAttempt = Date.now();

    if (data.attempts >= MAX_ATTEMPTS) {
      data.blockedUntil = Date.now() + BLOCK_DURATION_MS;
      setIsBlocked(true);
      setRemainingTime(BLOCK_DURATION_MS / 1000);
    }

    setStoredData(data);
    setAttemptsLeft(MAX_ATTEMPTS - data.attempts);
    
    return {
      attempts: data.attempts,
      isBlocked: data.attempts >= MAX_ATTEMPTS,
      attemptsLeft: MAX_ATTEMPTS - data.attempts
    };
  };

  const clearAttempts = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setIsBlocked(false);
      setAttemptsLeft(MAX_ATTEMPTS);
      setRemainingTime(0);
    } catch (error) {
      console.error('Error clearing attempts:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isBlocked,
    remainingTime,
    attemptsLeft,
    recordFailedAttempt,
    clearAttempts,
    formatTime
  };
};
