import React, { useState } from 'react';
import { Check, MessageCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { BasePackageType } from '../types';
import {
  SERVICE_PACKAGES,
  EXPRESS_ADDON,
  DEFAULT_BUSINESS_PHONE,
  formatRupiah,
  normalizePhone,
} from '../constants';
import { insertOrderToDatabase } from '../lib/supabase';

interface PriceCalculatorProps {
  onOrderCreated: () => void;
}

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  onOrderCreated,
}) => {
  const [selectedPackageId, setSelectedPackageId] =
    useState<BasePackageType>('basic');
  const [expressSelected, setExpressSelected] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Selected package object
  const selectedPackage =
    SERVICE_PACKAGES.find((pkg) => pkg.id === selectedPackageId) ||
    SERVICE_PACKAGES[0];

  // Price Calculation: Total Price = P_base + (A_express * X)
  const basePrice = selectedPackage.price;
  const addonPrice = expressSelected ? EXPRESS_ADDON.price : 0;
  const totalPrice = basePrice + addonPrice;

  // Selected Items summary string
  const selectedItemsSummary = expressSelected
    ? `${selectedPackage.name} + ${EXPRESS_ADDON.name}`
    : selectedPackage.name;

  // Real-time normalized phone preview
  const normalizedPhonePreview = customerPhone.trim()
    ? normalizePhone(customerPhone.trim())
    : '';

  const buildWhatsAppUrl = (
    name: string,
    phone: string,
    items: string,
    price: number
  ): string => {
    const formattedPrice = formatRupiah(price);
    const message = `Hello Sneaker Clean Team, I would like to book a cleaning service:\n\n- Name: ${name}\n- Phone: ${phone}\n- Package: ${items}\n- Total Estimated: ${formattedPrice}\n\nPlease confirm my booking schedule.`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${DEFAULT_BUSINESS_PHONE}?text=${encodedMessage}`;
  };

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setDbErrorMessage(null);
    setFallbackUrl(null);

    const trimmedName = customerName.trim();
    const rawPhone = customerPhone.trim();

    // 1. Validation & Normalization
    if (!trimmedName) {
      setValidationError('Please enter your full name.');
      return;
    }

    if (!rawPhone) {
      setValidationError('Please enter your WhatsApp phone number.');
      return;
    }

    const normalizedPhone = normalizePhone(rawPhone);
    if (normalizedPhone.length < 8) {
      setValidationError('Please enter a valid telephone number.');
      return;
    }

    // 2. Popup Blocker Prevention:
    // Synchronously open a blank window before starting the asynchronous database call
    let newTab: Window | null = null;
    try {
      newTab = window.open('about:blank', '_blank');
    } catch {
      // In some strict environments window.open might return null
      newTab = null;
    }

    const targetWhatsAppUrl = buildWhatsAppUrl(
      trimmedName,
      normalizedPhone,
      selectedItemsSummary,
      totalPrice
    );

    setIsSubmitting(true);

    try {
      // 3. Database Insertion
      await insertOrderToDatabase({
        customer_name: trimmedName,
        customer_phone: normalizedPhone,
        selected_items: selectedItemsSummary,
        total_price: totalPrice,
        status: 'pending',
      });

      // 4. URL Navigation on success
      if (newTab && !newTab.closed) {
        newTab.location.href = targetWhatsAppUrl;
      } else {
        window.open(targetWhatsAppUrl, '_blank');
      }

      // Trigger on-demand re-fetch of Order History
      onOrderCreated();

      // Reset form fields
      setCustomerName('');
      setCustomerPhone('');
    } catch (err: unknown) {
      // 5. Exception Handling
      if (newTab && !newTab.closed) {
        newTab.close();
      }

      setFallbackUrl(targetWhatsAppUrl);
      const errorText =
        err instanceof Error ? err.message : 'Database disruption occurred.';
      setDbErrorMessage(
        'Database update failed. Click here to message directly on WhatsApp.'
      );
      console.error('Order submission failed:', errorText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
          Calculate Cleaning Estimate
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Select your sneaker cleaning package and optional turnaround priority.
        </p>
      </div>

      <form onSubmit={handleSendOrder} className="space-y-6">
        {/* Step 1: Base Package Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-neutral-900">
              1. Choose Base Cleaning Package
            </label>
            <span className="text-xs text-neutral-500 font-normal">
              Single-choice selection
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICE_PACKAGES.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`cursor-pointer rounded-lg border p-4 transition-all ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedPackageId(pkg.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-neutral-900 text-sm">
                          {pkg.name}
                        </span>
                        {pkg.id === 'deep' && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold bg-neutral-900 text-white px-2 py-0.5 rounded-lg">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">
                        {pkg.description}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900'
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200 flex items-baseline justify-between">
                    <span className="text-xs text-neutral-500">Service Fee</span>
                    <span className="text-base font-semibold text-neutral-900">
                      {formatRupiah(pkg.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Optional Add-on */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-neutral-900">
              2. Optional Priority Add-on
            </label>
            <span className="text-xs text-neutral-500 font-normal">
              Independent toggle
            </span>
          </div>

          <div
            onClick={() => setExpressSelected(!expressSelected)}
            className={`cursor-pointer rounded-lg border p-4 transition-all ${
              expressSelected
                ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
            role="checkbox"
            aria-checked={expressSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setExpressSelected(!expressSelected);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    expressSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white'
                  }`}
                >
                  {expressSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-semibold text-neutral-900 text-sm">
                    {EXPRESS_ADDON.name}
                  </span>
                  <p className="text-xs text-neutral-600 mt-1">
                    {EXPRESS_ADDON.description}
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-neutral-900 shrink-0 ml-3">
                +{formatRupiah(EXPRESS_ADDON.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Price Breakdown Display Card */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-600 pb-2 border-b border-neutral-200">
            <span>Formula: Base Package + Express Priority</span>
            <span className="font-mono text-neutral-500">
              {formatRupiah(basePrice)} + {formatRupiah(addonPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-medium text-neutral-500 block">
                Total Estimated Price
              </span>
              <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-500 block">Selected Items</span>
              <span className="text-xs font-semibold text-neutral-800">
                {selectedItemsSummary}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Customer Information */}
        <div className="space-y-4 pt-2">
          <label className="text-sm font-semibold text-neutral-900 block">
            3. Customer Contact Details
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="customerName"
                className="block text-xs font-medium text-neutral-700 mb-1.5"
              >
                Customer Name <span className="text-neutral-900">*</span>
              </label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Budi Pratama"
                className="w-full h-11 px-3.5 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="block text-xs font-medium text-neutral-700 mb-1.5"
              >
                WhatsApp Phone Number <span className="text-neutral-900">*</span>
              </label>
              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 08123456789 or 628123456789"
                className="w-full h-11 px-3.5 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                required
              />
              {normalizedPhonePreview && (
                <p className="text-[11px] text-neutral-500 mt-1">
                  International format: +{normalizedPhonePreview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-3 flex items-center space-x-2 text-xs text-neutral-900">
            <AlertCircle className="w-4 h-4 text-neutral-700 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Database Error & Fallback Notification */}
        {dbErrorMessage && (
          <div className="rounded-lg border border-neutral-300 bg-neutral-100 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-medium text-neutral-900">
              <AlertCircle className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>{dbErrorMessage}</span>
            </div>
            {fallbackUrl && (
              <div>
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 underline"
                >
                  <span>Click here to message directly on WhatsApp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Primary CTA Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>
              {isSubmitting
                ? 'Processing Estimate...'
                : 'Send Order to WhatsApp'}
            </span>
          </button>
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Opens pre-filled WhatsApp message with instant schedule confirmation.
          </p>
        </div>
      </form>
    </div>
  );
};
