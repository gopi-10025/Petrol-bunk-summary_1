import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const n = (v) => Number(v || 0);
const money = (v) => `₹${n(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const id = () => Math.random().toString(16).slice(2);

export default function App() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState('sales');
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`sai_hanuma_${date}`);
    if (saved) setEntry(JSON.parse(saved));
    else setEntry({
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
    if (entry) localStorage.setItem(`sai_hanuma_${date}`, JSON.stringify(entry));
  }, [entry, date]);

  const calc = useMemo(() => {
    if (!entry) return {};
    
    const fuelDetails = entry.fuels.map(f => {
      const pumps = f.pumps.map(p => {
        const liters = Math.max(0, n(p.closing) - n(p.opening));
        return { ...p, liters, amt: liters * n(f.rate) };
      });
      const totalLiters = pumps.reduce((s, p) => s + p.liters, 0);
      const totalAmt = totalLiters * n(f.rate);
      return { type: f.type, rate: f.rate, pumps, totalLiters, totalAmt };
    });

    const totalMeterSales = fuelDetails.reduce((s, f) => s + f.totalAmt, 0);
    const totalExpected = totalMeterSales + n(entry.twoT) + n(entry.kata);
    
    const cashTotal = entry.cash.reduce((s, d) => s + (d.v * n(d.count)), 0);
    const digitalTotal = n(entry.upi) + n(entry.card) + n(entry.bank) + n(entry.credit);
    const totalReceived = cashTotal + digitalTotal;
    const expTotal = entry.expenses.reduce((s, e) => s + n(e.amount), 0);
    
    return { 
      fuelDetails, totalMeterSales, totalExpected, 
      cashTotal, digitalTotal, totalReceived, 
      gap: totalReceived - totalExpected, 
      expTotal, bankable: cashTotal - expTotal 
    };
  }, [entry]);

  // FIXED: Immutable update logic for live calculations
  const updatePump = (fi, pi, key, val) => {
    setEntry(prev => {
      const fuels = prev.fuels.map((f, i) => {
        if (i !== fi) return f;
        const pumps = f.pumps.map((p, j) => j === pi ? { ...p, [key]: val } : p);
        return { ...f, pumps };
      });
      return { ...prev, fuels };
    });
  };

  const addPump = (fi) => {
    setEntry(prev => {
      const fuels = [...prev.fuels];
      const prefix = fuels[fi].type[0];
      const count = fuels[fi].pumps.length + 1;
      fuels[fi].pumps = [...fuels[fi].pumps, { id: id(), name: `${prefix}${count}`, opening: '', closing: '' }];
      return { ...prev, fuels };
    });
  };

  const deletePump = (fi, pi) => {
    setEntry(prev => {
      const fuels = [...prev.fuels];
      fuels[fi].pumps = fuels[fi].pumps.filter((_, idx) => idx !== pi);
      return { ...prev, fuels };
    });
  };

  if (!entry) return null;

  return (
    <div className="app">
      <header className="station-banner">
        <h1>Sai Hanuma Filling Station</h1>
        <p>DAILY ACCOUNTING DAY-SHEET</p>
      </header>

      <div className="app-container">
        <div className="sticky-header">
          <input type="date" className="date-input" value={date} onChange={e => setDate(e.target.value)} />
          <div className="status-label">OFFICE COPY</div>
        </div>

        <div className="tab-bar">
          {['sales', 'cash', 'expenses', 'report'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === 'sales' && (
          <>
            {entry.fuels.map((f, fi) => (
              <div className="card" key={f.type}>
                <div className="card-header-row">
                  <h2>{f.type}</h2>
                  <div className="rate-box">
                    <label>Rate (₹)</label>
                    <input type="number" step="0.01" value={f.rate} onChange={e => {
                      const nf = [...entry.fuels]; nf[fi].rate = e.target.value; setEntry({...entry, fuels: nf});
                    }}/>
                  </div>
                </div>

                {f.pumps.map((p, pi) => {
                  const liters = Math.max(0, n(p.closing) - n(p.opening));
                  const amt = liters * n(f.rate);
                  return (
                    <div className="pump-group" key={p.id}>
                      <div className="pump-label-row">
                        <strong>Nozzle: {p.name}</strong>
                        {f.pumps.length > 1 && <button className="btn-del" onClick={() => deletePump(fi, pi)}>Delete</button>}
                      </div>
                      <div className="input-row">
                        <div><label>Opening</label><input type="number" value={p.opening} onChange={e => updatePump(fi, pi, 'opening', e.target.value)} /></div>
                        <div><label>Closing</label><input type="number" value={p.closing} onChange={e => updatePump(fi, pi, 'closing', e.target.value)} /></div>
                      </div>
                      <div className="pump-calc-row">
                        <span>Liters: <b>{liters.toFixed(2)}</b></span>
                        <span>Amount: <b>{money(amt)}</b></span>
                      </div>
                    </div>
                  );
                })}
                <button className="btn-add-pump" onClick={() => addPump(fi)}>+ Add {f.type} Nozzle</button>
              </div>
            ))}
            
            <div className="card">
              <h2>Miscellaneous Sales</h2>
              <div className="input-row">
                <div><label>2T Oil</label><input type="number" value={entry.twoT} onChange={e => setEntry({...entry, twoT: e.target.value})}/></div>
                <div><label>Lorry Kata</label><input type="number" value={entry.kata} onChange={e => setEntry({...entry, kata: e.target.value})}/></div>
              </div>
            </div>
          </>
        )}

        {tab === 'cash' && (
          <div className="card">
            <h2>Collection Details</h2>
            {entry.cash.map((d, i) => (
              <div key={d.v} className="cash-row-ui">
                <span className="denom">₹{d.v}</span>
                <input type="number" placeholder="Count" value={d.count} onChange={e => {
                  const nc = [...entry.cash]; nc[i].count = e.target.value; setEntry({...entry, cash: nc});
                }} />
                <span className="val">{money(d.v * n(d.count))}</span>
              </div>
            ))}
            <div className="payment-grid">
               <div><label>UPI / G-Pay</label><input type="number" value={entry.upi} onChange={e => setEntry({...entry, upi: e.target.value})}/></div>
               <div><label>Card Swipe</label><input type="number" value={entry.card} onChange={e => setEntry({...entry, card: e.target.value})}/></div>
               <div><label>Bank Deposit</label><input type="number" value={entry.bank} onChange={e => setEntry({...entry, bank: e.target.value})}/></div>
               <div><label>Credit/Other</label><input type="number" value={entry.credit} onChange={e => setEntry({...entry, credit: e.target.value})}/></div>
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="card">
            <h2>Station Expenses</h2>
            {entry.expenses.map((ex, i) => (
              <div className="input-row" key={ex.id} style={{marginBottom:'10px'}}>
                <input style={{flex:2}} placeholder="Reason (e.g. Tea, Repairs)" value={ex.title} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].title = e.target.value; setEntry({...entry, expenses: ne});
                }} />
                <input style={{flex:1}} type="number" placeholder="Amount" value={ex.amount} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].amount = e.target.value; setEntry({...entry, expenses: ne});
                }} />
                <button className="btn-del" onClick={() => setEntry({...entry, expenses: entry.expenses.filter((_, idx) => idx !== i)})}>✕</button>
              </div>
            ))}
            <button className="btn-add-pump" onClick={() => setEntry({...entry, expenses: [...entry.expenses, {id: id(), title: '', amount: ''}]})}>
              + Add Expense Line
            </button>
          </div>
        )}

        {tab === 'report' && (
          <div className="card report-view">
            <h2 className="report-title">Day Sheet Audit Report</h2>
            
            <div className="report-section">
              <h3>⛽ Meter Sales Split-up</h3>
              {calc.fuelDetails.map(f => (
                <div key={f.type} className="report-item-box">
                  <div className="item-head"><strong>{f.type}</strong> <span>Rate: ₹{f.rate}</span></div>
                  {f.pumps.map(p => (
                    <div key={p.id} className="item-pump-line">
                      <span>Nozzle {p.name} ({p.liters.toFixed(2)} L)</span>
                      <span>{money(p.amt)}</span>
                    </div>
                  ))}
                  <div className="item-subtotal">Total {f.type}: {f.totalLiters.toFixed(2)} L | {money(f.totalAmt)}</div>
                </div>
              ))}
              <div className="report-item"><span>Miscellaneous (2T Oil & Kata)</span><span>{money(n(entry.twoT) + n(entry.kata))}</span></div>
              <div className="report-total"><span>Total Expected Sales</span><span>{money(calc.totalExpected)}</span></div>
            </div>

            <div className="report-section">
              <h3>💰 Collection Breakdown</h3>
              <div className="report-item"><span>Total Physical Cash</span><span>{money(calc.cashTotal)}</span></div>
              {n(entry.upi) > 0 && <div className="report-item sub"><span>└ UPI/Online</span><span>{money(entry.upi)}</span></div>}
              {n(entry.card) > 0 && <div className="report-item sub"><span>└ Card Swipe</span><span>{money(entry.card)}</span></div>}
              {n(entry.bank) > 0 && <div className="report-item sub"><span>└ Bank Transfer</span><span>{money(entry.bank)}</span></div>}
              {n(entry.credit) > 0 && <div className="report-item sub"><span>└ Credit Sales</span><span>{money(entry.credit)}</span></div>}
              <div className="report-total"><span>Total Received</span><span>{money(calc.totalReceived)}</span></div>
              <div className={`gap-strip ${calc.gap >= 0 ? 'excess' : 'shortage'}`}>
                {calc.gap >= 0 ? 'EXCESS' : 'SHORTAGE'}: {money(calc.gap)}
              </div>
            </div>

            {entry.expenses.length > 0 && (
              <div className="report-section">
                <h3>💸 Itemized Expenses</h3>
                {entry.expenses.map(e => (
                  <div key={e.id} className="report-item"><span>{e.title || 'General Expense'}</span><span style={{color:'red'}}>- {money(e.amount)}</span></div>
                ))}
                <div className="report-total"><span>Total Expenses</span><span>{money(calc.expTotal)}</span></div>
              </div>
            )}

            <div className="final-box">
              <label>Net Cash to Handover to Office</label>
              <div className="amount">{money(calc.bankable)}</div>
            </div>

            <button className="fab-share" onClick={() => {
                const txt = `*SAI HANUMA FILLING STATION*\nDate: ${date}\n---\nP: ${calc.fuelDetails[0].totalLiters.toFixed(2)}L\nD: ${calc.fuelDetails[1].totalLiters.toFixed(2)}L\nSales: ${money(calc.totalExpected)}\nShort/Excess: ${money(calc.gap)}\nNet Cash: ${money(calc.bankable)}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`);
            }}>📤 Send WhatsApp Day-Sheet</button>
          </div>
        )}
      </div>
    </div>
  );
}
