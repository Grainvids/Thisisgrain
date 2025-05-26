import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QuotePDFDocument from './QuotePDFDocument';

const addonsData = [
  // Tier 1: Full Works Bundle
  { id: 'full_works_bundle', title: 'The Full Works Bundle', price: 1250, description: 'Includes all of our available add ons to take your production to the next level' },
  
  // Tier 2: Main Bundles
  { id: 'production_bundle', title: 'Production Bundle', price: 600, description: `Socials content, Photography, artist interviews + extra camera operator.` },
  { id: 'post_prod_bundle', title: 'Post Production Bundle', price: 750, description: `Includes stems, re-mixing, re-mastering, 4K editing, grading + showreel.` },
];

const baseRate = 1800;
const productionFee = 500;
const vatRate = 0.20;

const FULL_WORKS_BUNDLE_ID = 'full_works_bundle';
const PRODUCTION_BUNDLE_ID = 'production_bundle';
const POST_PROD_BUNDLE_ID = 'post_prod_bundle';

const FULL_WORKS_BUNDLE_COMPONENT_IDS = [PRODUCTION_BUNDLE_ID, POST_PROD_BUNDLE_ID];

function formatCurrency(amount) {
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return '';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numAmount);
}

function NewPricingForm() {
  const [shootDays, setShootDays] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteInstitution, setQuoteInstitution] = useState('');
  const [quotePhoneNumber, setQuotePhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const pdfRef = useRef();

  const handleShootDaysChange = (event) => {
    const value = Math.max(1, parseInt(event.target.value || '1', 10));
    setShootDays(value);
  };

  const handleAddonToggle = (toggledAddonId) => {
    setSelectedAddons(prev => {
      let next = { ...prev };
      const isBecomingSelected = !prev[toggledAddonId];
      next[toggledAddonId] = isBecomingSelected;

      // Handle Full Works Bundle selection
      if (toggledAddonId === FULL_WORKS_BUNDLE_ID) {
        // When Full Works is selected, select both other bundles
        if (isBecomingSelected) {
          next[PRODUCTION_BUNDLE_ID] = true;
          next[POST_PROD_BUNDLE_ID] = true;
        } else {
          // When Full Works is deselected, deselect both other bundles
          next[PRODUCTION_BUNDLE_ID] = false;
          next[POST_PROD_BUNDLE_ID] = false;
        }
      } else {
        // If either Production or Post Production bundle is toggled
        // Check if both are selected to determine Full Works Bundle state
        const bothBundlesSelected = 
          (toggledAddonId === PRODUCTION_BUNDLE_ID && next[POST_PROD_BUNDLE_ID]) ||
          (toggledAddonId === POST_PROD_BUNDLE_ID && next[PRODUCTION_BUNDLE_ID]);
        
        next[FULL_WORKS_BUNDLE_ID] = bothBundlesSelected;
      }

      return next;
    });
  };

  const { subtotal, vatAmount, grandTotal } = useMemo(() => {
    const days = Number(shootDays) || 1;
    let currentAddonsTotal = 0;

    if (selectedAddons[FULL_WORKS_BUNDLE_ID]) {
      const fwbAddon = addonsData.find(a => a.id === FULL_WORKS_BUNDLE_ID);
      if (fwbAddon) {
        currentAddonsTotal = fwbAddon.price * days;
      }
    } else {
      let tempSelectedForCalc = {...selectedAddons };
      
      for (const addonId in tempSelectedForCalc) {
        if (tempSelectedForCalc[addonId]) {
          const addon = addonsData.find(a => a.id === addonId);
          if (addon) {
            currentAddonsTotal += addon.price * days;
          }
        }
      }
    }

    const currentSubtotal = (days * baseRate) + productionFee + currentAddonsTotal;
    const currentVatAmount = currentSubtotal * vatRate;
    const currentGrandTotal = currentSubtotal + currentVatAmount;
    return { subtotal: currentSubtotal, vatAmount: currentVatAmount, grandTotal: currentGrandTotal };
  }, [shootDays, selectedAddons]);

  const { subtotal: calculatedSubtotal, vatAmount: calculatedVatAmount, grandTotal: calculatedGrandTotal, baseRateAndProductionFee, currentAddonsTotalValue } = useMemo(() => {
    const days = Number(shootDays) || 1;
    let addonsTotalValue = 0;

    if (selectedAddons[FULL_WORKS_BUNDLE_ID]) {
      const fwbAddon = addonsData.find(a => a.id === FULL_WORKS_BUNDLE_ID);
      if (fwbAddon) {
        addonsTotalValue = fwbAddon.price * days;
      }
    } else {
      let tempSelectedForCalc = {...selectedAddons };
      
      for (const addonId in tempSelectedForCalc) {
        if (tempSelectedForCalc[addonId]) {
          const addon = addonsData.find(a => a.id === addonId);
          if (addon) {
            addonsTotalValue += addon.price * days;
          }
        }
      }
    }
    
    const baseFee = (days * baseRate) + productionFee;
    const subtotalValue = baseFee + addonsTotalValue;
    const vatAmountValue = subtotalValue * vatRate;
    const grandTotalValue = subtotalValue + vatAmountValue;

    return {
      subtotal: subtotalValue,
      vatAmount: vatAmountValue,
      grandTotal: grandTotalValue,
      baseRateAndProductionFee: baseFee,
      currentAddonsTotalValue: addonsTotalValue
    };
  }, [shootDays, selectedAddons]);

  const currentSelectedAddons = useMemo(() => addonsData.filter(addon => selectedAddons[addon.id]), [selectedAddons]);
  const numberOfSlots = useMemo(() => shootDays * 5, [shootDays]);

  const handleOpenQuoteModal = () => {
    setIsQuoteModalOpen(true);
  };

  const handleCloseQuoteModal = () => {
    setIsQuoteModalOpen(false);
    setQuoteName('');
    setQuoteEmail('');
    setQuoteInstitution('');
    setQuotePhoneNumber('');
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('Form submission started');

    if (!pdfRef.current) {
      console.error("PDF content ref is not available.");
      alert("Could not generate PDF for emailing. Please try again.");
      return;
    }

    let pdfDataUri;
    try {
      console.log('Generating PDF...');
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, 
        useCORS: true,
        logging: true, // Enable logging temporarily for debugging
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdfDataUri = pdf.output('datauristring');
      console.log('PDF generated successfully');

    } catch (error) {
      console.error("Error generating PDF for email:", error);
      alert("There was an error creating the PDF. Please check the console.");
      return;
    }

    if (!pdfDataUri) {
      console.error("PDF data URI is empty");
      alert("Failed to generate PDF data. Cannot send email.");
      return;
    }

    const quoteDetails = {
      name: quoteName,
      email: quoteEmail,
      institution: quoteInstitution,
      phoneNumber: quotePhoneNumber,
      shootDays: shootDays,
      numberOfSlots: numberOfSlots,
      selectedAddons: currentSelectedAddons.map(a => ({ title: a.title, price: a.price, isFixedPrice: !!a.isFixedPrice})),
      baseRateAndProductionFee: baseRateAndProductionFee,
      currentAddonsTotalValue: currentAddonsTotalValue,
      subtotal: calculatedSubtotal,
      vatAmount: calculatedVatAmount,
      grandTotal: calculatedGrandTotal,
    };

    console.log('Sending quote details:', quoteDetails);

    try {
      console.log('Making API request to /api/send-quote-email');
      const response = await fetch('/api/send-quote-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteDetails: {
            name: quoteName,
            email: quoteEmail,
            institution: quoteInstitution,
            phoneNumber: quotePhoneNumber,
            shootDays: shootDays,
            selectedAddons: currentSelectedAddons.map(a => ({ title: a.title, price: a.price, isFixedPrice: !!a.isFixedPrice})),
            grandTotal: calculatedGrandTotal
          },
          pdfDataUri: pdfDataUri
        })
      });

      console.log('API response status:', response.status);
      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send quote email');
      }

      setSubmitSuccess(true);
      // Reset form after successful submission
      setQuoteName('');
      setQuoteEmail('');
      setQuoteInstitution('');
      setQuotePhoneNumber('');
      setSelectedAddons({});
      setShootDays(1);
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        handleCloseQuoteModal();
        setSubmitSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error sending quote:', error);
      setSubmitError(error.message || 'Failed to send quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Hidden div for PDF rendering */}
      <div style={{ position: 'fixed', left: '-2000px', top: 0 }} aria-hidden="true">
        <QuotePDFDocument 
          ref={pdfRef} 
          quoteName={quoteName} 
          quoteEmail={quoteEmail} 
          quoteInstitution={quoteInstitution} 
          quotePhoneNumber={quotePhoneNumber} 
          shootDays={shootDays} 
          numberOfSlots={numberOfSlots} 
          currentSelectedAddons={currentSelectedAddons} 
          subtotal={calculatedSubtotal} 
          vatAmount={calculatedVatAmount} 
          grandTotal={calculatedGrandTotal}
          baseRateAndProductionFee={baseRateAndProductionFee}
          currentAddonsTotalValue={currentAddonsTotalValue}
        />
      </div>

      {/* Shoot Days Input */}
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <label htmlFor="shootDays" className="text-lg font-semibold text-black">
            Number of Shoot Days
          </label>
          <span className="text-2xl font-bold text-orange-600">{shootDays}</span>
        </div>
        <input
          type="range"
          id="shootDays"
          name="shootDays"
          min="1"
          max="10"
          step="1"
          value={shootDays}
          onChange={handleShootDaysChange}
          className="w-full h-6 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          aria-describedby="shoot-days-description"
        />
        <p className="text-sm text-gray-600 mt-2">
          Select the number of days you need for your shoot. Each day includes 5 slots.
        </p>
      </div>

      {/* Selection Summary */}
      <div className="pt-4 space-y-3">
        <h3 className="text-lg font-semibold text-black mb-2">Selection Summary:</h3>
        <p className="text-sm text-black">
          <span className="font-medium">Shoot Days:</span> {shootDays}
        </p>
        <p className="text-sm text-black">
          <span className="font-medium">Number of Slots:</span> {numberOfSlots}
        </p>
        <div>
            <h4 className="text-sm font-medium text-black mb-1">Selected Add-ons:</h4>
            {currentSelectedAddons.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-1">
                {currentSelectedAddons.map(addon => (
                    <li key={addon.id} className="text-sm text-black">
                    {addon.title}
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic">No add-ons selected.</p>
            )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200"/>

      {/* Add-ons Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-black">Available Add-ons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addonsData.map((addon) => {
            const isFwbSelected = selectedAddons[FULL_WORKS_BUNDLE_ID];

            const isEmphasizedItem = addon.id === FULL_WORKS_BUNDLE_ID;
            
            let baseBgClass = 'bg-white';
            if (addon.id === FULL_WORKS_BUNDLE_ID) baseBgClass = 'bg-orange-50';

            let borderClass = '';
            if (selectedAddons[addon.id]) {
              if (isEmphasizedItem) {
                borderClass = 'border-[3px] border-orange-500';
              } else {
                borderClass = 'border-2 border-orange-500';
              }
            } else {
              if (isEmphasizedItem) {
                borderClass = 'border-2 border-gray-400';
              } else {
                borderClass = 'border border-gray-200';
              }
            }

            const cardClasses = `p-4 rounded-lg cursor-pointer transition-all duration-150 ease-in-out shadow-sm focus:outline-none relative ${baseBgClass} ${borderClass}`;
            const titleClasses = isEmphasizedItem ? "text-lg font-bold text-black mb-1 mt-1" : "text-md font-semibold text-black mb-1 mt-1";

            let priceDisplay;
            const daySuffixJsx = (currentAddon) => 
                !currentAddon.isFixedPrice && currentAddon.price > 0 ? <span className="text-gray-600 text-xs"> / day</span> : null;
            
            const defaultPriceJsx = <><span className="text-orange-600">{formatCurrency(addon.price)}</span>{daySuffixJsx(addon)}</>;
            
            const getDiscountedPriceJsx = (currentAddon, componentIds) => {
                const originalPriceSum = componentIds.reduce((sum, compId) => sum + (addonsData.find(a=>a.id===compId)?.price || 0), 0);
                if (originalPriceSum > currentAddon.price) {
                    return <><del className="text-gray-500 mr-1">{formatCurrency(originalPriceSum)}</del><span className="text-orange-600 ml-1">{formatCurrency(currentAddon.price)}</span>{daySuffixJsx(currentAddon)}</>;
                }
                return <><span className="text-orange-600">{formatCurrency(currentAddon.price)}</span>{daySuffixJsx(currentAddon)}</>;
            };

            if (isFwbSelected) {
                if (addon.id === FULL_WORKS_BUNDLE_ID) {
                    priceDisplay = getDiscountedPriceJsx(addon, FULL_WORKS_BUNDLE_COMPONENT_IDS);
                } else if (FULL_WORKS_BUNDLE_COMPONENT_IDS.includes(addon.id)) {
                    priceDisplay = <span className="text-green-600 italic">Included in Full Works Bundle</span>;
                } else {
                    priceDisplay = defaultPriceJsx;
                }
            } else {
                priceDisplay = defaultPriceJsx;
            }

            return (
              <div key={addon.id} onClick={() => handleAddonToggle(addon.id)} role="checkbox" aria-checked={!!selectedAddons[addon.id]} tabIndex={0} onKeyPress={(e) => e.key === ' ' || e.key === 'Enter' ? handleAddonToggle(addon.id) : null} className={cardClasses}>
                {addon.id === FULL_WORKS_BUNDLE_ID && (<span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Best Value</span>)}
                <h3 className={titleClasses} id={`addon-title-${addon.id}`}>{addon.title}</h3>
                <p className="text-sm font-bold mb-2">{priceDisplay}</p>
                <p className="text-sm text-black">{addon.description}</p>
                <input type="checkbox" id={`hidden-checkbox-${addon.id}`} checked={!!selectedAddons[addon.id]} readOnly tabIndex={-1} className="sr-only" aria-labelledby={`addon-title-${addon.id}`}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="pt-4 space-y-1 text-center sm:text-right">
        <div className="text-3xl font-bold uppercase tracking-wide text-black">
          Total (excl. VAT): {formatCurrency(calculatedSubtotal)}
        </div>
        <div className="text-sm text-black">
          + VAT (20%): {formatCurrency(calculatedVatAmount)}
        </div>
        <div className="text-lg font-semibold text-orange-600 pt-1">
          Grand Total: {formatCurrency(calculatedGrandTotal)}
        </div>
        <div className="pt-4">
          <button 
            type="button" 
            onClick={handleOpenQuoteModal}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 px-4 rounded transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            Email me this quote
          </button>
        </div>
      </div>

      {/* Quote Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">Email Your Quote</h2>
              <button onClick={handleCloseQuoteModal} className="text-black hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <div>
                <label htmlFor="quoteName" className="block text-sm font-medium text-black">Name</label>
                <input 
                  type="text" 
                  id="quoteName" 
                  value={quoteName} 
                  onChange={(e) => setQuoteName(e.target.value)} 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                />
              </div>
              <div>
                <label htmlFor="quoteEmail" className="block text-sm font-medium text-black">Email</label>
                <input 
                  type="email" 
                  id="quoteEmail" 
                  value={quoteEmail} 
                  onChange={(e) => setQuoteEmail(e.target.value)} 
                  required 
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                  title="Please enter a valid email address (e.g., name@domain.com)"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                />
              </div>
              <div>
                <label htmlFor="quoteInstitution" className="block text-sm font-medium text-black">Institution (Optional)</label>
                <input
                  type="text"
                  name="quoteInstitution"
                  id="quoteInstitution"
                  value={quoteInstitution}
                  onChange={(e) => setQuoteInstitution(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                />
              </div>
              <div>
                <label htmlFor="quotePhoneNumber" className="block text-sm font-medium text-black">Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="quotePhoneNumber"
                  id="quotePhoneNumber"
                  value={quotePhoneNumber}
                  onChange={(e) => setQuotePhoneNumber(e.target.value)}
                  pattern="[0-9\s+()-]*"
                  title="Please enter a valid phone number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={handleCloseQuoteModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                    isSubmitting ? 'cursor-not-allowed bg-gray-400' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending Quote...</span>
                    </div>
                  ) : 'Send Quote'}
                </button>
              </div>

              {submitSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700">
                    Quote sent successfully! We'll be in touch soon.
                  </p>
                </div>
              )}

              {submitError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">
                    {submitError}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewPricingForm; 