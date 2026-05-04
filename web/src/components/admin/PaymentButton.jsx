'use client';
import { useState } from 'react';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentService } from '../../services';

// Builds a hidden form and submits it to uPay in a new tab.
// uPay handles all card processing; no sensitive data touches this app.
function submitUpayForm(formAction, fields) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = formAction;
    form.target = '_blank';
    form.rel    = 'noopener noreferrer';

    Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = name;
        input.value = value ?? '';
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

export default function PaymentButton({ booking }) {
    const [loading, setLoading] = useState(false);

    const paymentStatus = booking.payment?.status;

    if (paymentStatus === 'paid') {
        return (
            <span
                title="שולם"
                className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold px-2 py-1"
            >
                <CheckCircle size={14} />
                שולם
            </span>
        );
    }

    const handleClick = async () => {
        try {
            setLoading(true);
            const { formAction, fields } = await paymentService.initiate(booking._id);
            submitUpayForm(formAction, fields);
        } catch {
            alert('שגיאה ביצירת קישור תשלום. נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            title={paymentStatus === 'failed' ? 'תשלום נכשל — נסה שוב' : 'גבה תשלום דרך uPay'}
            className={`p-2 rounded-lg transition-colors disabled:opacity-40
                ${paymentStatus === 'failed'
                    ? 'text-red-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                    : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                }`}
        >
            {paymentStatus === 'failed'
                ? <AlertCircle size={18} />
                : <CreditCard size={18} />
            }
        </button>
    );
}
