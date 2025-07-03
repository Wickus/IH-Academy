import crypto from 'crypto';

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  passphrase?: string;
}

export interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
}

export class PayFastService {
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private generateSignature(data: Record<string, string>, passphrase?: string): string {
    // Remove signature from data if it exists
    const { signature: _, ...cleanData } = data;
    
    // PayFast payment forms require SPECIFIC field order (not alphabetical)
    // Reference: https://developers.payfast.co.za/docs#step_1_form_fields
    // Note: This is different from API signature generation which uses alphabetical order
    const fieldOrder = [
      'merchant_id',
      'merchant_key', 
      'return_url',
      'cancel_url',
      'notify_url',
      'name_first',
      'name_last',
      'email_address',
      'cell_number',
      'm_payment_id',
      'amount',
      'item_name',
      'item_description',
      'custom_int1',
      'custom_int2',
      'custom_int3',
      'custom_int4',
      'custom_int5',
      'custom_str1',
      'custom_str2',
      'custom_str3',
      'custom_str4',
      'custom_str5',
      'email_confirmation',
      'confirmation_address',
      'payment_method',
      'subscription_type',
      'billing_date',
      'recurring_amount',
      'frequency',
      'cycles'
    ];
    
    // Build parameter string in PayFast documented field order
    // Only include non-empty values as per PayFast documentation
    const params: string[] = [];
    for (const field of fieldOrder) {
      if (cleanData[field] && cleanData[field].trim() !== '') {
        const value = cleanData[field].trim();
        // PayFast requires URL encoding with spaces as + and uppercase encoding
        // Also replace problematic characters that cause signature mismatches
        const encodedValue = encodeURIComponent(value)
          .replace(/%20/g, '+')
          .replace(/'/g, '%27')
          .replace(/~/g, '%7E')
          .replace(/%28/g, '(')    // Convert encoded ( back to literal (
          .replace(/%29/g, ')')    // Convert encoded ) back to literal )
          .replace(/%2B/g, '+');   // Ensure + stays as +
        params.push(`${field}=${encodedValue}`);
      }
    }
    
    const queryString = params.join('&');
    
    // Add passphrase if provided (must be at the end)
    const stringToSign = passphrase && passphrase.trim() !== ''
      ? `${queryString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`
      : queryString;
    
    console.log('PayFast signature string (payment form field order):', stringToSign);
    
    // Generate MD5 hash
    const generatedSignature = crypto.createHash('md5').update(stringToSign).digest('hex');
    console.log('Generated signature:', generatedSignature);
    
    return generatedSignature;
  }

  generatePaymentForm(paymentData: PayFastPaymentData, sandbox: boolean = true): string {
    const baseUrl = sandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    // Convert to record for signature generation (exclude passphrase and only include non-empty values)
    const dataRecord: Record<string, string> = {};
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'passphrase') {
        dataRecord[key] = value.toString().trim();
      }
    });

    console.log('PayFast form data for signature:', dataRecord);

    // Generate signature using the same logic as URL generation
    const signature = this.generateSignature(dataRecord, paymentData.passphrase);
    console.log('PayFast form signature:', signature);

    // Create form fields, ensuring proper HTML escaping
    const formFields = Object.entries(paymentData)
      .filter(([key, value]) => key !== 'passphrase' && value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `<input type="hidden" name="${this.escapeHtml(key)}" value="${this.escapeHtml(value.toString())}">`)
      .join('\n');

    return `
      <form action="${baseUrl}" method="post" id="payfast-payment-form">
        ${formFields}
        <input type="hidden" name="signature" value="${signature}">
        <button type="submit" class="btn btn-primary">Pay with PayFast</button>
      </form>
      <script>document.getElementById('payfast-payment-form').submit();</script>
    `;
  }

  generatePaymentUrl(paymentData: PayFastPaymentData, sandbox: boolean = true): string {
    const baseUrl = sandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    // Convert to record for signature generation (exclude undefined and null values)
    const dataRecord: Record<string, string> = {};
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        dataRecord[key] = value.toString();
      }
    });

    console.log('PayFast data for signature:', dataRecord);

    // Generate signature
    const signature = this.generateSignature(dataRecord, paymentData.passphrase);
    console.log('Generated signature:', signature);

    // Create query parameters (ensure only non-empty values)
    const params = new URLSearchParams();
    Object.entries(paymentData).forEach(([key, value]) => {
      if (key !== 'passphrase' && value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    params.append('signature', signature);

    const finalUrl = `${baseUrl}?${params.toString()}`;
    console.log('Final PayFast URL:', finalUrl);
    
    return finalUrl;
  }

  validateNotification(notification: PayFastNotification, passphrase?: string): boolean {
    // Convert to record for signature generation
    const dataRecord: Record<string, string> = {};
    Object.entries(notification).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        dataRecord[key] = value.toString();
      }
    });
    
    const expectedSignature = this.generateSignature(dataRecord, passphrase);
    return expectedSignature === notification.signature;
  }

  async verifyPayment(pfPaymentId: string, sandbox: boolean = true): Promise<boolean> {
    const baseUrl = sandbox 
      ? 'https://sandbox.payfast.co.za/eng/query/validate'
      : 'https://www.payfast.co.za/eng/query/validate';

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `pf_payment_id=${pfPaymentId}`,
      });

      const result = await response.text();
      return result.trim() === 'VALID';
    } catch (error) {
      console.error('PayFast payment verification failed:', error);
      return false;
    }
  }
}

export const payfastService = new PayFastService();