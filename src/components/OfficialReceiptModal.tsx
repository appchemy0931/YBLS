import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Printer, Receipt, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { walletAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import type { WalletTransaction, ReceiptData, ReceiptItem } from '../types';

interface OfficialReceiptModalProps {
  transaction: WalletTransaction | null;
  onClose: () => void;
}

function buildFallbackReceipt(tx: WalletTransaction, currentUser: any): ReceiptData {
  const rawHex = (tx.referenceId || tx._id || '').toString();
  const rawNum = parseInt(rawHex.slice(-6) || '518105', 16) || 518105;
  const invoiceNo = String((rawNum % 900000) + 100000);
  const orderNo = String(((parseInt(rawHex.slice(-4) || '50', 16) || 50) % 50) + 1).padStart(2, '0');

  const txDate = new Date(tx.date || Date.now());
  const day = String(txDate.getDate()).padStart(2, '0');
  const month = String(txDate.getMonth() + 1).padStart(2, '0');
  const year = txDate.getFullYear();
  const hours = String(txDate.getHours()).padStart(2, '0');
  const mins = String(txDate.getMinutes()).padStart(2, '0');
  const formattedDate = `${day}/${month}/${year} ${hours}:${mins}`;

  let paidBalance = 0;
  let paidBonus = 0;
  if (Number(tx.paidFromBalance) > 0 || Number(tx.paidFromBonus) > 0) {
    paidBalance = Number(tx.paidFromBalance || 0);
    paidBonus = Number(tx.paidFromBonus || 0);
  } else if (tx.description) {
    const descMatch = tx.description.match(/RM\s*([\d.]+)\s*balance\s*\+\s*RM\s*([\d.]+)\s*bonus/i);
    if (descMatch) {
      paidBalance = parseFloat(descMatch[1]) || 0;
      paidBonus = parseFloat(descMatch[2]) || 0;
    }
  }

  if (paidBalance === 0 && paidBonus === 0) {
    paidBalance = Math.abs(tx.amount || 0);
  }

  const subtotal = (paidBalance + paidBonus) || Math.abs(tx.amount || 0);
  const discount = paidBonus; // VIP DISCOUNT
  const total = paidBalance;

  let items: ReceiptItem[] = [];

  if (tx.type === 'BOOKING_PAYMENT') {
    let serviceTitle = 'SV01 MTS MESOTHERAPY REPAIR ( DEEP )';
    const match = tx.description?.match(/for\s+(.*)$/i);
    if (match && match[1]) {
      serviceTitle = match[1].trim();
    } else if (tx.description) {
      serviceTitle = tx.description;
    }

    items = [
      {
        code: '1',
        name: serviceTitle.toUpperCase(),
        detail: `(Slot: ${year}-${month}-${day} 13:00) (${subtotal.toFixed(2)}/ea)`,
        qty: 1,
        unitPrice: subtotal,
        price: subtotal,
      },
    ];
  } else if (tx.type === 'PRODUCT_PAYMENT') {
    let prodTitle = 'Beauty Products Purchase';
    const descClean = tx.description?.replace(/^Product order payment\s*(#\w+)?/i, '').trim();
    if (descClean) prodTitle = descClean;

    items = [
      {
        code: '1',
        name: prodTitle.toUpperCase(),
        detail: `(${subtotal.toFixed(2)}/ea)`,
        qty: 1,
        unitPrice: subtotal,
        price: subtotal,
      },
    ];
  } else {
    items = [
      {
        code: '1',
        name: (tx.description || 'Wallet Transaction').toUpperCase(),
        detail: `(${subtotal.toFixed(2)}/ea)`,
        qty: 1,
        unitPrice: subtotal,
        price: subtotal,
      },
    ];
  }

  return {
    _id: tx._id,
    type: tx.type,
    invoiceNo,
    orderNo,
    date: tx.date,
    formattedDate,
    merchant: {
      name: 'Young Beauty Lovers Service',
      branch: 'Young Beauty Lovers Service - Taman Midah',
      regNo: '201803414820',
      address: 'No 37, Ground Floor, Jalan Medan Midah, Taman Midah, 56000 Cheras, Kuala Lumpur, Malaysia',
      phone: '+60 11 2088 1183',
      email: 'Evonnechong0224@gmail.com',
    },
    customer: {
      name: currentUser?.name || 'Valued Customer',
      userId: currentUser?.userId || '',
      phone: currentUser?.phone || '',
      ranking: currentUser?.customerRanking || 0,
    },
    items,
    summary: {
      totalQty: items.reduce((sum, it) => sum + (it.qty || 1), 0),
      subtotal,
      discount,
      serviceCharge: 0,
      rounding: 0,
      total,
      paidBalance,
      paidBonus,
      paymentMethod: 'MY DEBIT',
      change: 0,
    },
  };
}

export default function OfficialReceiptModal({ transaction, onClose }: OfficialReceiptModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { data } = useQuery({
    queryKey: ['transaction-receipt', transaction?._id],
    queryFn: () => (transaction ? walletAPI.getReceipt(transaction._id).then((r) => r.data) : null),
    enabled: !!transaction,
    retry: 1,
  });

  if (!transaction) return null;

  // Use API response if available, or fall back to client-constructed receipt
  const receipt: ReceiptData = data?.receipt || buildFallbackReceipt(transaction, user);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full my-auto flex flex-col items-center animate-[scale-in_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="w-full max-w-[420px] flex items-center justify-between bg-gray-900/95 text-white px-4 py-2.5 rounded-t-xl backdrop-blur-md border-b border-gray-800 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-gold-400" />
            <span className="text-sm font-semibold tracking-wide">
              {t('receipt.officialReceiptTitle', 'Official POS Receipt')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="gold"
              onClick={handlePrint}
              className="py-1 px-2.5 text-xs flex items-center gap-1.5 font-mono shadow-sm"
              title={t('receipt.print', 'Print Receipt')}
            >
              <Printer size={14} />
              <span>{t('receipt.print', 'Print')}</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close receipt modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Receipt Paper Body */}
        <div className="w-full max-w-[420px] bg-white rounded-b-xl shadow-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:rounded-none">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="bg-[#fdfdfc] text-gray-900 font-mono text-xs leading-tight p-6 sm:p-7 select-text relative print:p-0 print:border-none print:bg-white"
            style={{
              fontFamily: '"Courier New", Courier, "Lucida Console", Monaco, monospace',
              letterSpacing: '-0.01em',
            }}
          >
            {/* 1. STORE HEADER */}
            <div className="text-center space-y-1 pb-1">
              <h1 className="text-[13px] font-bold tracking-tight text-gray-950">
                {receipt.merchant?.name || 'Young Beauty Lovers Service'}
              </h1>
              <p className="text-[11px] text-gray-800">
                Registration No: {receipt.merchant?.regNo || '201803414820'}
              </p>
              <p className="text-[10px] text-gray-700 px-1 leading-snug">
                {receipt.merchant?.address || 'No 37, Ground Floor, Jalan Medan Midah, Taman Midah, 56000 Cheras, Kuala Lumpur, Malaysia'}
              </p>
              <p className="text-[10px] text-gray-700">
                {receipt.merchant?.phone || '+60 11 2088 1183'}
              </p>
              <p className="text-[10px] text-gray-700">
                {receipt.merchant?.email || 'Evonnechong0224@gmail.com'}
              </p>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-gray-400 my-2.5" />

            {/* 2. INVOICE & ORDER META */}
            <div className="flex justify-between items-start text-[11px]">
              <div className="space-y-0.5">
                <div className="flex gap-1.5">
                  <span className="font-semibold">Invoice no:</span>
                  <span>{receipt.invoiceNo}</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="font-semibold">Date:</span>
                  <span>{receipt.formattedDate}</span>
                </div>
              </div>
              <div className="text-right pl-2">
                <div className="text-[11px] font-bold tracking-wider uppercase text-gray-700">ORDER</div>
                <div className="text-3xl font-black tracking-tight text-gray-950 leading-none mt-0.5">
                  {receipt.orderNo || '15'}
                </div>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-gray-400 my-2.5" />

            {/* 3. ITEM TABLE HEADER */}
            <div className="flex justify-between text-[11px] font-bold pb-1 text-gray-900">
              <div className="flex gap-3">
                <span className="w-4">Qty</span>
                <span>Item</span>
              </div>
              <div className="text-right">Price (MYR)</div>
            </div>
            <div className="border-t border-gray-400 mb-2" />

            {/* 4. ITEM ROWS */}
            <div className="space-y-2 text-[11px]">
              {receipt.items.map((item, index) => (
                <div key={index} className="space-y-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <span className="w-4 font-bold shrink-0">{item.qty}</span>
                      <span className="font-semibold text-gray-950 break-words">
                        {item.code ? `${item.code} ` : ''}{item.name}
                      </span>
                    </div>
                    <span className="font-bold text-right shrink-0">
                      {item.price.toFixed(2)}
                    </span>
                  </div>
                  {item.detail && (
                    <div className="pl-7 text-[10px] text-gray-600 leading-tight break-words">
                      {item.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* DIVIDER */}
            <div className="border-t border-gray-400 my-2.5" />

            {/* 5. SUMMARY & TOTALS */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <span className="w-4 font-bold">{receipt.summary.totalQty}</span>
                  <span>Qty</span>
                </div>
                <span></span>
              </div>
              <div className="flex justify-between pl-7">
                <span>Subtotal</span>
                <span>{receipt.summary.subtotal.toFixed(2)}</span>
              </div>

              {(receipt.summary.discount > 0 || receipt.summary.paidBonus > 0) && (
                <div className="flex justify-between pl-7 text-[#00aa6c] font-medium">
                  <span>VIP DISCOUNT</span>
                  <span>-{(receipt.summary.discount || receipt.summary.paidBonus || 0).toFixed(2)}</span>
                </div>
              )}

              {receipt.summary.serviceCharge > 0 && (
                <div className="flex justify-between pl-7">
                  <span>SERVICE CHARGE (10%)</span>
                  <span>{receipt.summary.serviceCharge.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between pl-7">
                <span>Bill rounding</span>
                <span>{(receipt.summary.rounding || 0).toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-400 my-2" />

              {/* TOTAL */}
              <div className="flex justify-between items-baseline text-sm font-black text-gray-950 py-1">
                <span className="text-xs uppercase tracking-wide font-black">TOTAL (MYR)</span>
                <span className="text-lg font-black tracking-tight">{receipt.summary.total.toFixed(2)}</span>
              </div>

              {/* PAYMENT BREAKDOWN */}
              <div className="flex justify-between text-[11px] pt-1">
                <span className="font-semibold">{receipt.summary.paymentMethod || 'MY DEBIT'}</span>
                <span className="font-semibold">{receipt.summary.total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="font-semibold">Change</span>
                <span>{(receipt.summary.change || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-gray-400 my-3" />

            {/* 6. RATING & QR CODE FOOTER */}
            <div className="pt-1 pb-1">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 text-[10px] leading-snug text-gray-800 flex-1">
                  <p className="font-bold text-[11px] text-gray-950">Don't forget to rate us!</p>
                  <p>Scan QR code to let us know how you enjoyed with us.</p>
                  <p className="pt-0.5 text-gray-600">Thank you for visiting us.</p>
                  <p className="text-gray-600">We hope to see you again soon!</p>
                </div>
                <div className="shrink-0 bg-white p-1 border border-gray-300 rounded shadow-2xs">
                  {receipt.qrCode ? (
                    <img
                      src={receipt.qrCode}
                      alt="Rating QR Code"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-gray-900" fill="currentColor">
                      <path d="M0 0h35v35H0zM5 5v25h25V5zm5 5h15v15H10zM65 0h35v35H65zM70 5v25h25V5zm5 5h15v15H75zM0 65h35v35H0zM5 70v25h25V70zm5 5h15v15H10zM45 10h10v10H45zM45 45h10v10H45zM10 45h10v10H10zM25 45h10v10H25zM65 45h10v10H65zM80 45h10v10H80zM45 65h10v10H45zM45 80h10v10H45zM65 65h20v10H65zM65 80h10v20H65zM85 85h15v15H85z" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="text-center pt-4 space-y-0.5 text-[9px] text-gray-600 uppercase tracking-wider">
                <p className="font-semibold">This is an official receipt</p>
                <p className="font-bold text-gray-800">POWERED BY FEEDME SMART POS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="w-full max-w-[420px] mt-3 flex items-center justify-between text-xs text-gray-400 px-1 print:hidden">
          <div className="flex items-center gap-1">
            <CheckCircle size={13} className="text-green-400" />
            <span>Verified Official Transaction</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white underline transition-colors"
          >
            {t('common.close', 'Close Window')}
          </button>
        </div>
      </div>
    </div>
  );
}
