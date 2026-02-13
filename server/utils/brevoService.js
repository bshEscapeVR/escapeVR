// utils/brevoService.js
const Brevo = require('@getbrevo/brevo');

const BREVO_LIST_ID = 2;

/**
 * Add a contact to the Brevo mailing list.
 * Runs silently - never throws or blocks the main flow.
 * @param {{ email: string, name?: string }} contact
 */
const addContactToMailingList = async ({ email, name }) => {
    if (!process.env.BREVO_API_KEY) {
        console.warn('Brevo API key not configured. Skipping contact sync.');
        return null;
    }

    if (!email) return null;

    const apiInstance = new Brevo.ContactsApi();
    apiInstance.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;

    const contact = new Brevo.CreateContact();
    contact.email = email;
    contact.listIds = [BREVO_LIST_ID];
    contact.updateEnabled = true;
    if (name) {
        contact.attributes = { FIRSTNAME: name };
    }

    try {
        const result = await apiInstance.createContact(contact);
        console.log(`Brevo: contact added - ${email}`);
        return true;
    } catch (error) {
        // 'duplicate_parameter' means the contact already exists - not an error
        if (error?.body?.code === 'duplicate_parameter') {
            console.log(`Brevo: contact already exists - ${email}`);
            return true;
        }
        console.error('Brevo: failed to add contact -', error?.body?.message || error.message);
        return null;
    }
};

module.exports = { addContactToMailingList };
