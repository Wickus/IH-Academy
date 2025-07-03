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
  private generateSignature(data: Record<string, string>, passphrase?: string): string {
    // Remove signature from data if it exists
    const { signature, ...cleanData } = data;
    
    // Sort keys alphabetically and create query string
    const sortedKeys = Object.keys(cleanData).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(cleanData[key] || '')}`)
      .join('&');
    
    // Add passphrase if provided
    const stringToSign = passphrase 
      ? `${queryString}&passphrase=${encodeURIComponent(passphrase)}`
      : queryString;
    
    // Generate MD5 hash
    return crypto.createHash('md5').update(stringToSign).digest('hex');
  }

  generatePaymentForm(paymentData: PayFastPaymentData, sandbox: boolean = true): string {
    const baseUrl = sandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    // Convert to record for signature generation
    const dataRecord: Record<string, string> = {};
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        dataRecord[key] = value.toString();
      }
    });

    // Generate signature
    const signature = this.generateSignature(dataRecord, paymentData.passphrase);

    const formFields = Object.entries(paymentData)
      .filter(([key]) => key !== 'passphrase')
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
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