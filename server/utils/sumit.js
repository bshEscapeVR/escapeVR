'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  Sumit (OfficeGuy) billing API - hosted payment page
//
//  Flow: beginRedirect() → customer pays on Sumit's secure page → Sumit sends
//  the browser back to RedirectURL with ?OG-PaymentID=… → the server confirms
//  with getPayment() (never trusts the browser). Card details never touch us.
//
//  Env: SUMIT_COMPANY_ID, SUMIT_API_KEY. Not configured = online payment off.
//  Docs: https://app.sumit.co.il/help/developers/swagger/index.html
// ─────────────────────────────────────────────────────────────────────────────

// SUMIT_API_BASE - only for local testing against a mock
const API_BASE = process.env.SUMIT_API_BASE || 'https://api.sumit.co.il';

const isSumitConfigured = () =>
    Boolean(process.env.SUMIT_COMPANY_ID && process.env.SUMIT_API_KEY);

const credentials = () => ({
    CompanyID: Number(process.env.SUMIT_COMPANY_ID),
    APIKey: process.env.SUMIT_API_KEY,
});

// Status 0 = Success (the enum may also arrive as its name)
const isSuccess = (status) => status === 0 || status === 'Success';

const callSumit = async (path, body) => {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ Credentials: credentials(), ...body }),
    });
    if (!response.ok) throw new Error(`Sumit ${path} HTTP ${response.status}`);

    const json = await response.json();
    if (!isSuccess(json.Status)) {
        throw new Error(`Sumit ${path}: ${json.UserErrorMessage || json.TechnicalErrorDetails || json.Status}`);
    }
    return json.Data;
};

/**
 * Creates a payment page for the booking's exact amount.
 * @returns {Promise<string>} URL to send the customer to
 */
const beginRedirect = async ({ booking, roomName, redirectUrl, cancelUrl, lang = 'he' }) => {
    const date = new Date(booking.date).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
    const time = String(booking.timeSlot || '').replace(/^24:/, '00:');
    const people = booking.details.participantsCount;

    const data = await callSumit('/billing/payments/beginredirect/', {
        Customer: {
            Name: booking.customer.fullName,
            Phone: booking.customer.phone || null,
            EmailAddress: booking.customer.email || null,
        },
        Items: [{
            Item: { Name: `חדר בריחה VR - ${roomName}` },
            Quantity: 1,
            UnitPrice: booking.details.totalPrice,
            Description: `הזמנה ${booking.bookingId} | ${date} ${time} | ${people} משתתפים`,
        }],
        VATIncluded: true,
        ExternalIdentifier: booking.bookingId,
        RedirectURL: redirectUrl,
        CancelRedirectURL: cancelUrl,
        ExpirationHours: 1,
        Language: lang === 'en' ? 1 : 0,
        // The receipt goes to the customer, and the owner gets Sumit's payment email as a backup
        SendUpdateByEmailAddress: booking.customer.email || null,
        UpdateOrganizationOnSuccess: true,
    });

    if (!data?.RedirectURL) throw new Error('Sumit beginredirect: no RedirectURL');
    return data.RedirectURL;
};

/** One payment by its Sumit ID (as appended to RedirectURL as OG-PaymentID) */
const getPayment = async (paymentId) => {
    const data = await callSumit('/billing/payments/get/', { PaymentID: Number(paymentId) });
    return data?.Payment || null;
};

/**
 * Looks for a valid payment carrying our bookingId as ExternalIdentifier, made
 * since `since` - for a customer who paid but never came back to the site.
 */
const findPaymentForBooking = async (bookingId, since) => {
    const from = new Date(since.getTime() - 24 * 60 * 60 * 1000);
    const to = new Date(Date.now() + 24 * 60 * 60 * 1000);
    for (let startIndex = 0, page = 0; page < 10; page++) {
        const data = await callSumit('/billing/payments/list/', {
            Date_From: from.toISOString(),
            Date_To: to.toISOString(),
            Valid: true,
            StartIndex: startIndex,
        });
        const payments = data?.Payments || [];
        const match = payments.find(p => p.ExternalIdentifier === bookingId && p.ValidPayment);
        if (match) return match;
        if (!data?.HasNextPage || payments.length === 0) return null;
        startIndex += payments.length;
    }
    return null;
};

module.exports = { isSumitConfigured, beginRedirect, getPayment, findPaymentForBooking };
