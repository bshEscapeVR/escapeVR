'use client';

import React, { createContext, useState, useContext } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preSelectedRoomId, setPreSelectedRoomId] = useState(null);

  const openBooking = (roomId = null) => {
    setPreSelectedRoomId(roomId);
    setIsOpen(true);
  };

  const closeBooking = () => {
    setIsOpen(false);
    setPreSelectedRoomId(null);
  };

  return (
    <BookingContext.Provider value={{ isOpen, preSelectedRoomId, openBooking, closeBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
