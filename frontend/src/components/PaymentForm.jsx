import React, { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_RAZORPAY_ORDER_MUTATION, VERIFY_RAZORPAY_PAYMENT_MUTATION } from '../graphql/queries';
import './PaymentForm.css';

/**
 * Payment Form Component
 * Handles Razorpay checkout and payment processing for plan upgrades.
 * 
 * Props:
 *   plan: {name: string, price: number, description: string}
 *   onSuccess: (payment) => void - Called when payment succeeds
 *   onError: (error) => void - Called when there's an error
 */
const PaymentForm = ({ plan, onSuccess, onError }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [createRazorpayOrder] = useMutation(CREATE_RAZORPAY_ORDER_MUTATION);
  const [verifyRazorpayPayment] = useMutation(VERIFY_RAZORPAY_PAYMENT_MUTATION);

  const toUserFriendlyError = (err, fallbackMessage) => {
    const message = (err?.message || '').toLowerCase();
    if (message.includes('authentication required') || message.includes('jwt')) {
      return 'Your session has expired. Please sign in again and retry payment.';
    }
    if (message.includes('status code 400')) {
      return 'Payment request was rejected by the server. Please refresh and try again.';
    }
    if (message.includes('network') || message.includes('failed to fetch')) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    return err?.message || fallbackMessage;
  };

  useEffect(() => {
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setErrorMessage('Failed to load Razorpay checkout.');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!scriptLoaded || !window.Razorpay) {
      setErrorMessage('Razorpay checkout is not loaded yet. Please try again.');
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      setErrorMessage('Razorpay key is not configured.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { data: orderData, errors } = await createRazorpayOrder({
        variables: { planName: plan.name.toLowerCase() },
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create order');
      }

      if (!orderData?.createRazorpayOrder) {
        throw new Error('Invalid response from server');
      }

      if (!orderData.createRazorpayOrder.success) {
        throw new Error(orderData.createRazorpayOrder.message || 'Failed to create order');
      }

      const {
        orderId,
        subscriptionId,
        amount,
        currency,
      } = orderData.createRazorpayOrder;

      const fallbackAmount = Math.round(Number(plan.pricePerMonth || 0) * 100);
      const finalAmount = amount || fallbackAmount;

      const options = {
        key: keyId,
        name: 'AI Project Analyser',
        description: `Upgrade to ${plan.name} plan`,
        currency: currency || 'INR',
        amount: finalAmount,
        order_id: orderId || undefined,
        subscription_id: subscriptionId || undefined,
        handler: async (response) => {
          try {
            const { data: verifyData, errors: verifyErrors } = await verifyRazorpayPayment({
              variables: {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                razorpayOrderId: response.razorpay_order_id || null,
                razorpaySubscriptionId: response.razorpay_subscription_id || null,
              },
            });

            if (verifyErrors) {
              throw new Error(verifyErrors[0]?.message || 'Verification failed');
            }

            if (verifyData?.verifyRazorpayPayment?.success) {
              if (onSuccess) onSuccess(verifyData.verifyRazorpayPayment.payment);
            } else {
              const errorMsg = verifyData?.verifyRazorpayPayment?.message || 'Payment verification failed.';
              throw new Error(errorMsg);
            }
          } catch (err) {
            setErrorMessage(toUserFriendlyError(err, 'Payment verification failed.'));
            if (onError) onError(err);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          email: localStorage.getItem('userEmail') || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setErrorMessage(response?.error?.description || 'Payment failed.');
        setIsProcessing(false);
      });
      razorpay.open();
    } catch (err) {
      const errorMsg = toUserFriendlyError(err, 'Payment processing failed.');
      setErrorMessage(errorMsg);
      if (onError) onError(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-form-container">
      <div className="payment-form-header">
        <h3>Upgrade to {plan.name} Plan</h3>
        <p className="plan-price-info">
          Amount: <span className="price">INR {plan.pricePerMonth}</span>
          {plan.name !== 'free' && <span className="billing-period">/month</span>}
        </p>
      </div>

      <form onSubmit={handlePaymentSubmit} className="payment-form">
        {errorMessage && (
          <div className="error-message" role="alert">
            <span className="error-icon">⚠️</span> {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={!scriptLoaded || isProcessing}
          className="payment-button"
          aria-busy={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner"></span> Processing...
            </>
          ) : (
            `Pay INR ${plan.pricePerMonth}${plan.name !== 'free' ? '/month' : ''}`
          )}
        </button>

        <p className="security-notice">
          🔒 Your payment is securely processed by Razorpay.
        </p>
      </form>
    </div>
  );
};

export default PaymentForm;
