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

  private urlEncode(value: string): string {
    // PayFast requires URL encoding with uppercase hex and spaces as +
    return encodeURIComponent(value.trim())
      .replace(/%20/g, '+')
      .replace(/%([0-9a-f]{2})/gi, (_, hex) => '%' + hex.toUpperCase());
  }

  private generateSignature(data: Record<string, string>, passphrase?: string): string {
    // Remove signature from data if it exists
    const { signature: _, ...cleanData } = data;
    
    // PayFast requires SPECIFIC field order for signature (order as they appear in docs)
    const fieldOrder = [
      'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
      'name_first', 'name_last', 'email_address', 'cell_number', 'm_payment_id',
      'amount', 'item_name', 'item_description',
      'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
      'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
      'email_confirmation', 'confirmation_address', 'payment_method',
      'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles'
    ];
    
    // Build parameter string - PayFast requires URL-encoded values
    const params: string[] = [];
    for (const field of fieldOrder) {
      if (cleanData[field] !== undefined && cleanData[field] !== null && cleanData[field] !== '') {
        const value = cleanData[field].trim();
        if (value !== '') {
          params.push(`${field}=${this.urlEncode(value)}`);
        }
      }
    }
    
    let stringToSign = params.join('&');
    
    // Add passphrase if provided (must be at the end, also URL encoded)
    if (passphrase && passphrase.trim() !== '') {
      stringToSign += `&passphrase=${this.urlEncode(passphrase)}`;
    }
    
    console.log('PayFast signature string:', stringToSign);
    
    // Generate MD5 hash (lowercase)
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

    // PayFast field order for signature generation
    const fieldOrder = [
      'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
      'name_first', 'name_last', 'email_address', 'cell_number', 'm_payment_id',
      'amount', 'item_name', 'item_description',
      'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
      'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
      'email_confirmation', 'confirmation_address', 'payment_method',
      'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles'
    ];

    // Convert to record for signature generation (exclude undefined and null values)
    const dataRecord: Record<string, string> = {};
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'passphrase') {
        dataRecord[key] = value.toString().trim();
      }
    });

    console.log('PayFast data for signature:', dataRecord);

    // Build params in correct order with consistent encoding
    const urlParams: string[] = [];
    for (const field of fieldOrder) {
      if (dataRecord[field] && dataRecord[field].trim() !== '') {
        const value = dataRecord[field].trim();
        // Use standard URL encoding for the actual URL
        urlParams.push(`${field}=${encodeURIComponent(value)}`);
      }
    }

    // Generate signature using PayFast's specific encoding rules
    const signature = this.generateSignature(dataRecord, paymentData.passphrase);
    console.log('Generated signature:', signature);

    urlParams.push(`signature=${signature}`);

    const finalUrl = `${baseUrl}?${urlParams.join('&')}`;
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