import { useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useContact } from '../context/ContactContext';
import { useBooking } from '../context/BookingContext';

// פעולת כפתורי "הזמן": הזמנה אונליין כשהיא מופעלת בפאנל הניהול, אחרת טופס יצירת הקשר (כמו קודם)
const useBookingAction = () => {
    const { settings } = useSettings();
    const { openContact } = useContact();
    const { openBooking } = useBooking();
    const onlineEnabled = Boolean(settings?.onlineBooking?.enabled);

    return useCallback(
        (roomId = null) => (onlineEnabled ? openBooking(roomId) : openContact()),
        [onlineEnabled, openBooking, openContact]
    );
};

export default useBookingAction;
