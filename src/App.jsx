import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/* Utility */
const n = (v) => Number(v || 0);
const money = (v) => `₹${n(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const id = () => Math.random().toString(16).slice(2);

export default function App() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState('sales');
  const [entry, setEntry] = useState(null);

  // Persistence logic
  useEffect(() => {
    const saved = localStorage.getItem(`bunk_data_${date}`);
    if (saved) setEntry(JSON.parse(saved));
    else setEntry({
      date,
      fuels: [
        { type: 'Petrol', rate: '', pumps: [{ id: id(), name: 'P1', opening: '', closing: '' }] },
        { type: 'Diesel', rate: '', pumps: [{ id: id(), name: 'D1', opening: '', closing: '' }] }
      ],
      cash: [500, 200, 100, 50, 20, 10].map(v => ({ v, count: '' })),
      upi: '', card: '', bank: '', credit: '', twoT: '', kata: '',
      expenses: []
    });
  }, [date]);

  useEffect(() => {
    if (entry) localStorage.setItem(`bunk_data_${date}`, JSON.stringify(entry));
  }, [entry, date]);

  // Comprehensive Calculations
  const calc = useMemo(() => {
    if (!entry) return {};
    const fuelSales = entry.fuels.reduce((acc, f) => {
      const liters = f.pumps.reduce((s, p) => s + Math.max(0, n(p.closing) - n(p.opening)), 0);
      return acc + (liters * n(f.rate));
    }, 0);
    
    const totalExpected = fuelSales + n(entry.twoT) + n(entry.kata);
    const cashTotal = entry.cash.reduce((s, d) => s + (d.v * n(d.count)), 0);
    const digitalTotal = n(entry.upi) + n(entry.card) + n(entry.bank) + n(entry.credit);
    const totalReceived = cashTotal + digitalTotal;
    const expensesTotal = entry.expenses.reduce((s, e) => s + n(e.amount), 0);
    
    return {
      totalExpected, totalReceived, cashTotal,
      gap: totalReceived - totalExpected,
      expensesTotal,
      bankableCash: cashTotal - expensesTotal
    };
  }, [entry]);

  const shareReport = () => {
    const text = `*⛽ STATION REPORT - ${date}*\n\n` +
      `📈 *Expected Sales:* ${money(calc.totalExpected)}\n` +
      `💰 *Total Received:* ${money(calc.totalReceived)}\n` +
      `⚠️ *Gap:* ${money(calc.gap)}\n` +
      `💸 *Expenses:* ${money(calc.expensesTotal)}\n` +
      `🏦 *Net Bankable:* ${money(calc.bankableCash)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (!entry) return null;

  return (
    <div className="app">
      <div className="header-summary">
        <h1>Shift Balance ({date})</h1>
        <div className="main-gap">{money(calc.gap)}</div>
        <span className={`badge ${calc.gap >= 0 ? 'success' : 'danger'}`}>
          {calc.gap >= 0 ? 'EXCESS' : 'SHORTAGE'}
        </span>
      </div>

      <div className="tabs">
        {['sales', 'cash', 'expenses', 'report'].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'cash' && (
        <div className="card">
          <h2>Cash Counting</h2>
          <div className="cash-grid">
            {entry.cash.map((d, i) => (
              <div key={d.v} className="cash-row">
                <span className="denom">₹{d.v}</span>
                <span>×</span>
                <input type="number" value={d.count} 
                  onChange={e => {
                    const nc = [...entry.cash]; nc[i].count = e.target.value;
                    setEntry({...entry, cash: nc});
                  }} 
                />
                <span className="row-total">{money(d.v * n(d.count))}</span>
              </div>
            ))}
          </div>
          <div className="report-table" style={{marginTop: '20px'}}>
             <div className="total-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Total Cash</span>
                <span>{money(calc.cashTotal)}</span>
             </div>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div className="card">
          <h2>Shift Final Report</h2>
          <table className="report-table">
            <tbody>
              <tr><td className="label">Fuel Sales</td><td className="val">{money(calc.totalExpected - n(entry.twoT) - n(entry.kata))}</td></tr>
              <tr><td className="label">Misc (2T/Kata)</td><td className="val">{money(n(entry.twoT) + n(entry.kata))}</td></tr>
              <tr className="total-row"><td className="label">Total Expected</td><td className="val">{money(calc.totalExpected)}</td></tr>
              
              <tr><td colSpan="2" style={{height: '20px'}}></td></tr>
              
              <tr><td className="label">Total Cash</td><td className="val">{money(calc.cashTotal)}</td></tr>
              <tr><td className="label">Digital/Credit</td><td className="val">{money(calc.totalReceived - calc.cashTotal)}</td></tr>
              <tr className="total-row"><td className="label">Total Received</td><td className="val">{money(calc.totalReceived)}</td></tr>
              
              <tr><td colSpan="2" style={{height: '20px'}}></td></tr>
              
              <tr><td className="label">Total Expenses</td><td className="val" style={{color: 'red'}}>- {money(calc.expensesTotal)}</td></tr>
              <tr className="total-row"><td className="label">Net Bankable Cash</td><td className="val" style={{color: 'var(--success)'}}>{money(calc.bankableCash)}</td></tr>
            </tbody>
          </table>
          <button className="fab" onClick={shareReport}>Share Report to WhatsApp</button>
        </div>
      )}

      {/* Other tabs follow similar clean card patterns... */}
    </div>
  );
}
