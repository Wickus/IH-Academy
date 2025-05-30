// Payfast integration utilities

export interface PayfastConfig {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  sandbox: boolean;
}

export interface PayfastPayment {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string;
  amount: number;
  item_name: string;
  item_description: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
}

const PAYFAST_CONFIG: PayfastConfig = {
  merchant_id: process.env.VITE_PAYFAST_MERCHANT_ID || '10000100',
  merchant_key: process.env.VITE_PAYFAST_MERCHANT_KEY || '46f0cd694581a',
  return_url: `${window.location.origin}/payment/success`,
  cancel_url: `${window.location.origin}/payment/cancel`,
  notify_url: `${window.location.origin}/api/payfast/webhook`,
  sandbox: process.env.NODE_ENV !== 'production',
};

export function generatePayfastForm(payment: Omit<PayfastPayment, 'merchant_id' | 'merchant_key' | 'return_url' | 'cancel_url' | 'notify_url'>): string {
  const fullPayment: PayfastPayment = {
    ...payment,
    merchant_id: PAYFAST_CONFIG.merchant_id,
    merchant_key: PAYFAST_CONFIG.merchant_key,
    return_url: PAYFAST_CONFIG.return_url,
    cancel_url: PAYFAST_CONFIG.cancel_url,
    notify_url: PAYFAST_CONFIG.notify_url,
  };

  const baseUrl = PAYFAST_CONFIG.sandbox 
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const formFields = Object.entries(fullPayment)
    .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
    .join('\n');

  return `
    <form id="payfast-form" action="${baseUrl}" method="post">
      ${formFields}
    </form>
  `;
}

export function initiatePayfastPayment(payment: Omit<PayfastPayment, 'merchant_id' | 'merchant_key' | 'return_url' | 'cancel_url' | 'notify_url'>): void {
  const formHTML = generatePayfastForm(payment);
  
  // Create and append form to document
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = formHTML;
  document.body.appendChild(tempDiv);
  
  // Submit the form
  const form = document.getElementById('payfast-form') as HTMLFormElement;
  if (form) {
    form.submit();
    document.body.removeChild(tempDiv);
  }
}

export function generatePaymentId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
