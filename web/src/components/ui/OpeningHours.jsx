'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { getOpeningHoursRows } from '../../utils/openingHours';

// רשימת שעות פעילות (מההגדרות בפאנל הניהול). לא מציג כלום אם השעות עדיין לא נטענו.
const OpeningHours = ({ className = '', labelClassName = '', valueClassName = '' }) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const rows = getOpeningHoursRows(settings?.openingHours, t);

    if (rows.length === 0) return null;

    return (
        <ul className={`space-y-1 ${className}`}>
            {rows.map((row) => (
                <li key={row.label} className="flex justify-between gap-4">
                    <span className={labelClassName}>{row.label}</span>
                    <span dir="ltr" className={valueClassName}>{row.value}</span>
                </li>
            ))}
        </ul>
    );
};

export default OpeningHours;
