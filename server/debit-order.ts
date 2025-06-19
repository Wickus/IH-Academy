import { generateId } from '@/lib/utils';

export interface DebitOrderMandateData {
  userId: number;
  organizationId: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: 'current' | 'savings' | 'transmission';
  maxAmount: string;
  frequency: 'monthly' | 'weekly' | 'bi-weekly';
  startDate: string;
  endDate?: string;
}

export interface DebitOrderTransactionData {
  mandateId: number;
  bookingId?: number;
  amount: string;
  transactionType: 'class_payment' | 'membership_payment' | 'late_fee';
  description?: string;
}

export class DebitOrderService {
  private generateMandateReference(): string {
    return `DO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private generateTransactionReference(): string {
    return `TX${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  generateMandateForm(mandateData: DebitOrderMandateData): string {
    const mandateReference = this.generateMandateReference();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Debit Order Mandate - ${mandateData.organizationId}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin: 20px 0; }
          .field-group { display: flex; justify-content: space-between; margin: 10px 0; }
          .field { flex: 1; margin-right: 20px; }
          .field:last-child { margin-right: 0; }
          .field label { display: block; font-weight: bold; margin-bottom: 5px; }
          .field input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
          .readonly { background-color: #f5f5f5; }
          .signature-section { margin-top: 40px; }
          .signature-box { border: 1px solid #333; height: 100px; margin: 10px 0; }
          .terms { font-size: 12px; line-height: 1.4; margin: 20px 0; }
          .submit-btn { background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
          .submit-btn:hover { background: #0056b3; }
          @media print { .submit-btn { display: none; } }
        </style>
      </head>
      <body>
        <form id="mandateForm">
          <div class="header">
            <h1>DEBIT ORDER MANDATE</h1>
            <p><strong>Mandate Reference:</strong> ${mandateReference}</p>
          </div>

          <div class="section">
            <h3>Bank Account Details</h3>
            <div class="field-group">
              <div class="field">
                <label>Bank Name:</label>
                <input type="text" name="bankName" value="${mandateData.bankName}" required>
              </div>
              <div class="field">
                <label>Branch Code:</label>
                <input type="text" name="branchCode" value="${mandateData.branchCode}" required>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Account Holder Name:</label>
                <input type="text" name="accountHolder" value="${mandateData.accountHolder}" required>
              </div>
              <div class="field">
                <label>Account Number:</label>
                <input type="text" name="accountNumber" value="${mandateData.accountNumber}" required>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Account Type:</label>
                <select name="accountType" required>
                  <option value="current" ${mandateData.accountType === 'current' ? 'selected' : ''}>Current</option>
                  <option value="savings" ${mandateData.accountType === 'savings' ? 'selected' : ''}>Savings</option>
                  <option value="transmission" ${mandateData.accountType === 'transmission' ? 'selected' : ''}>Transmission</option>
                </select>
              </div>
              <div class="field">
                <label>Maximum Debit Amount:</label>
                <input type="text" name="maxAmount" value="R ${mandateData.maxAmount}" class="readonly" readonly>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Debit Order Details</h3>
            <div class="field-group">
              <div class="field">
                <label>Frequency:</label>
                <input type="text" name="frequency" value="${mandateData.frequency}" class="readonly" readonly>
              </div>
              <div class="field">
                <label>Start Date:</label>
                <input type="date" name="startDate" value="${mandateData.startDate}" required>
              </div>
            </div>
            ${mandateData.endDate ? `
            <div class="field-group">
              <div class="field">
                <label>End Date:</label>
                <input type="date" name="endDate" value="${mandateData.endDate}">
              </div>
            </div>
            ` : ''}
          </div>

          <div class="terms">
            <h4>Terms and Conditions</h4>
            <p>1. I/We authorize the above organization to debit my/our account as specified.</p>
            <p>2. The maximum amount that may be debited per transaction is R ${mandateData.maxAmount}.</p>
            <p>3. I/We understand that this mandate will remain in effect until cancelled by me/us in writing.</p>
            <p>4. Debits will occur on the ${mandateData.frequency} basis starting from ${mandateData.startDate}.</p>
            <p>5. I/We understand that failed debits may incur bank charges.</p>
            <p>6. This mandate complies with the South African banking regulations.</p>
          </div>

          <div class="signature-section">
            <div class="field-group">
              <div class="field">
                <label>Account Holder Signature:</label>
                <div class="signature-box"></div>
              </div>
              <div class="field">
                <label>Date:</label>
                <input type="date" name="signatureDate" required>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <button type="submit" class="submit-btn">Submit Mandate</button>
          </div>
        </form>

        <script>
          document.getElementById('mandateForm').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Mandate submitted successfully! You will receive confirmation via email.');
            // In a real implementation, this would submit to your backend
          });
        </script>
      </body>
      </html>
    `;
  }

  calculateNextProcessDate(startDate: Date, frequency: string): Date {
    const nextDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    
    return nextDate;
  }

  async processDebitOrderTransaction(transactionData: DebitOrderTransactionData): Promise<{
    success: boolean;
    transactionReference?: string;
    failureReason?: string;
  }> {
    // Simulate debit order processing
    const transactionReference = this.generateTransactionReference();
    
    // In a real implementation, this would integrate with South African banking systems
    // For now, we'll simulate with a high success rate
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        transactionReference,
      };
    } else {
      const failureReasons = [
        'Insufficient funds',
        'Account not found',
        'Account blocked',
        'Bank system unavailable',
        'Invalid account details'
      ];
      
      return {
        success: false,
        failureReason: failureReasons[Math.floor(Math.random() * failureReasons.length)],
      };
    }
  }

  generatePaymentNotification(amount: string, organizationName: string, transactionType: string): {
    subject: string;
    body: string;
  } {
    const subject = `Debit Order Processed - ${organizationName}`;
    
    const body = `
      Dear Member,

      This is to confirm that a debit order has been processed on your account:

      Amount: R ${amount}
      Organization: ${organizationName}
      Transaction Type: ${transactionType.replace('_', ' ').toUpperCase()}
      Date: ${new Date().toLocaleDateString('en-ZA')}

      If you have any queries regarding this transaction, please contact the organization directly.

      Thank you for using our debit order service.

      Best regards,
      IH Academy Payment Services
    `;

    return { subject, body };
  }

  validateBankAccount(accountNumber: string, branchCode: string): {
    valid: boolean;
    message?: string;
  } {
    // South African bank account validation
    if (!accountNumber || accountNumber.length < 9 || accountNumber.length > 11) {
      return {
        valid: false,
        message: 'Account number must be between 9 and 11 digits'
      };
    }

    if (!branchCode || branchCode.length !== 6) {
      return {
        valid: false,
        message: 'Branch code must be exactly 6 digits'
      };
    }

    // Check if account number contains only digits
    if (!/^\d+$/.test(accountNumber)) {
      return {
        valid: false,
        message: 'Account number must contain only digits'
      };
    }

    // Check if branch code contains only digits
    if (!/^\d+$/.test(branchCode)) {
      return {
        valid: false,
        message: 'Branch code must contain only digits'
      };
    }

    return { valid: true };
  }
}

export const debitOrderService = new DebitOrderService();