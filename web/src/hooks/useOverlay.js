'use client';

import { useEffect, useRef } from 'react';

// מחסנית החלונות הפתוחים - Escape סוגר רק את העליון (למשל כרטיס מורחב בתוך חלון "כל הביקורות")
const openOverlays = [];

const onKeyDown = (e) => {
    if (e.key === 'Escape' && openOverlays.length > 0) {
        openOverlays[openOverlays.length - 1].current();
    }
};

/**
 * התנהגות משותפת לחלונות צפים: נעילת גלילת העמוד + סגירה ב-Escape.
 */
const useOverlay = (isOpen, onClose) => {
    const closeRef = useRef(onClose);
    useEffect(() => {
        closeRef.current = onClose;
    });

    useEffect(() => {
        if (!isOpen) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        if (openOverlays.length === 0) window.addEventListener('keydown', onKeyDown);
        openOverlays.push(closeRef);

        return () => {
            document.body.style.overflow = prevOverflow;
            openOverlays.splice(openOverlays.indexOf(closeRef), 1);
            if (openOverlays.length === 0) window.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen]);
};

export default useOverlay;
