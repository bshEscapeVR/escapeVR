'use client';

import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preSelectedRoomId, setPreSelectedRoomId] = useState(null);
  const onSuccessRef = useRef(null);

  const openBooking = useCallback((roomId = null, onSuccess = null) => {
    setPreSelectedRoomId(roomId);
    onSuccessRef.current = onSuccess;
    setIsOpen(true);
  }, []);

  const closeBooking = useCallback(() => {
    setIsOpen(false);
    setPreSelectedRoomId(null);
    onSuccessRef.current = null;
  }, []);

  const handleSuccess = useCallback(() => {
    if (onSuccessRef.current) {
      onSuccessRef.current();
    }
  }, []);

  return (
    <BookingContext.Provider value={{ isOpen, preSelectedRoomId, openBooking, closeBooking, handleSuccess }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
