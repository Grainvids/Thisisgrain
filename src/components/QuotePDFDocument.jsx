import React from 'react';

// Helper to format currency, assuming GBP, no decimals
const formatCurrencyForPDF = (amount) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return '';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numAmount);
};

const QuotePDFDocument = React.forwardRef(({
  quoteName,
  quoteEmail,
  quoteInstitution,
  quotePhoneNumber,
  shootDays,
  numberOfSlots,
  currentSelectedAddons,
  subtotal,
  vatAmount,
  grandTotal,
  baseRateAndProductionFee,
  currentAddonsTotalValue
}, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white text-gray-800 font-sans" style={{ width: '210mm', minHeight: '297mm' }}> {/* A4 Size-ish for preview */}
      {/* Header with Grain Branding */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl italic font-black tracking-tighter" style={{ fontFamily: 'Arial Black, Arial, sans-serif', color: '#F97316', letterSpacing: '-0.05em', textTransform: 'none' }}> {/* Orange: F97316 */}
            Grain
          </h1>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-semibold text-gray-700">Quotation</h2>
          <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      {/* Client Details */}
      <div className="mb-8 p-4 border border-gray-200 rounded">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Prepared for:</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><strong className="font-medium text-gray-600">Name:</strong> {quoteName}</div>
          <div><strong className="font-medium text-gray-600">Email:</strong> {quoteEmail}</div>
          {quoteInstitution && <div><strong className="font-medium text-gray-600">Institution:</strong> {quoteInstitution}</div>}
          {quotePhoneNumber && <div><strong className="font-medium text-gray-600">Phone:</strong> {quotePhoneNumber}</div>}
        </div>
      </div>

      {/* Selection Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Selection Summary:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="mb-2"><strong className="font-medium text-gray-600">Number of Shoot Days:</strong> {shootDays}</p>
          <p className="mb-2"><strong className="font-medium text-gray-600">Number of Slots (approx.):</strong> {numberOfSlots}</p>
          <div>
            <strong className="font-medium text-gray-600">Selected Add-ons:</strong>
            {currentSelectedAddons && currentSelectedAddons.length > 0 ? (
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                {currentSelectedAddons.map(addon => (
                  <li key={addon.id} className="text-sm">{addon.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-gray-500 ml-4">No add-ons selected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mb-12">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Price Breakdown:</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2">Base Rate ({shootDays} day{shootDays > 1 ? 's' : ''}) + Fixed Production Fee</td>
              <td className="py-2 text-right font-medium">{formatCurrencyForPDF(baseRateAndProductionFee)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">Add-ons Total</td>
              <td className="py-2 text-right font-medium">{formatCurrencyForPDF(currentAddonsTotalValue)}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2 font-medium text-gray-600">Subtotal (excl. VAT)</td>
              <td className="py-2 text-right font-medium">{formatCurrencyForPDF(subtotal)}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2 font-medium text-gray-600">VAT (20%)</td>
              <td className="py-2 text-right font-medium">{formatCurrencyForPDF(vatAmount)}</td>
            </tr>
            <tr>
              <td className="pt-3 text-xl font-bold" style={{ color: '#F97316' }}>Grand Total (incl. VAT)</td>
              <td className="pt-3 text-xl font-bold text-right" style={{ color: '#F97316' }}>{formatCurrencyForPDF(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer / Thank you note */}
      <div className="text-center text-xs text-gray-500 pt-8 border-t border-gray-200">
        <p>Thank you for considering Grain Productions!</p>
        <p>This quote is valid for 30 days.</p>
        <p>hello@thisisgrain.com | +44 796 700 4106</p>
      </div>
    </div>
  );
});

export default QuotePDFDocument; 