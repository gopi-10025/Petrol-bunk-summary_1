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
        // Logic: Opening - Closing = Liters Sold
        const liters = Math.max(0, n(p.opening) - n(p.closing));
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

  const updatePump = (fi, pi, key, val) => {
    setEntry(prev => {
      const fuels = [...prev.fuels];
      fuels[fi].pumps[pi][key] = val;
      return { ...prev, fuels: [...fuels] };
    });
  };

  const addPump = (fi) => {
    setEntry(prev => {
      const fuels = [...prev.fuels];
      const prefix = fuels[fi].type[0];
      const count = fuels[fi].pumps.length + 1;
      fuels[fi].pumps.push({ id: id(), name: `${prefix}${count}`, opening: '', closing: '' });
      return { ...prev, fuels: [...fuels] };
    });
  };

  const deletePump = (fi, pi) => {
    setEntry(prev => {
      const fuels = [...prev.fuels];
      fuels[fi].pumps = fuels[fi].pumps.filter((_, idx) => idx !== pi);
      return { ...prev, fuels: [...fuels] };
    });
  };

  const shareWhatsApp = () => {
    const txt = `*SAI HANUMA FILLING STATION*\nDate: ${date}\n---\nP: ${calc.fuelDetails[0].totalLiters.toFixed(2)}L\nD: ${calc.fuelDetails[1].totalLiters.toFixed(2)}L\nSales: ${money(calc.totalExpected)}\nNet Handover: ${money(calc.bankable)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`);
  };

  if (!entry) return null;

  return (
    <div className="app">
      <header className="station-banner no-print">
        <h1>Sai Hanuma Filling Station</h1>
        <p>DAILY ACCOUNTING DAY-SHEET</p>
      </header>

      <div className="app-container">
        <div className="sticky-header no-print">
          <input type="date" className="date-input" value={date} onChange={e => setDate(e.target.value)} />
          <div className="status-label">OFFICE COPY</div>
        </div>

        <div className="tab-bar no-print">
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
                  const liters = Math.max(0, n(p.opening) - n(p.closing));
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
                <input type="number" value={d.count} onChange={e => {
                  const nc = [...entry.cash]; nc[i].count = e.target.value; setEntry({...entry, cash: nc});
                }} />
                <span className="val">{money(d.v * n(d.count))}</span>
              </div>
            ))}
            <div className="payment-grid">
               <div><label>UPI/Online</label><input type="number" value={entry.upi} onChange={e => setEntry({...entry, upi: e.target.value})}/></div>
               <div><label>Card</label><input type="number" value={entry.card} onChange={e => setEntry({...entry, card: e.target.value})}/></div>
               <div><label>Bank</label><input type="number" value={entry.bank} onChange={e => setEntry({...entry, bank: e.target.value})}/></div>
               <div><label>Credit</label><input type="number" value={entry.credit} onChange={e => setEntry({...entry, credit: e.target.value})}/></div>
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="card">
            <h2>Expenses</h2>
            {entry.expenses.map((ex, i) => (
              <div className="input-row" key={ex.id} style={{marginBottom:'10px'}}>
                <input style={{flex:2}} placeholder="Reason" value={ex.title} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].title = e.target.value; setEntry({...entry, expenses: ne});
                }} />
                <input style={{flex:1}} type="number" placeholder="₹" value={ex.amount} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].amount = e.target.value; setEntry({...entry, expenses: ne});
                }} />
                <button className="btn-del" onClick={() => setEntry({...entry, expenses: entry.expenses.filter((_, idx) => idx !== i)})}>✕</button>
              </div>
            ))}
            <button className="btn-add-pump" onClick={() => setEntry({...entry, expenses: [...entry.expenses, {id: id(), title: '', amount: ''}]})}>
              + Add Expense
            </button>
          </div>
        )}

        {tab === 'report' && (
          <div className="card report-view">
            <h2 className="report-title no-print">Final Audit Report</h2>
            
            <div className="report-section">
              <h3>⛽ Sales Summary</h3>
              {calc.fuelDetails.map(f => (
                <div key={f.type} className="report-item">
                  <span>{f.type} ({f.totalLiters.toFixed(2)} L)</span>
                  <span>{money(f.totalAmt)}</span>
                </div>
              ))}
              <div className="report-total"><span>Total Sales</span><span>{money(calc.totalExpected)}</span></div>
            </div>

            <div className="report-section">
              <h3>💰 Collection Breakdown</h3>
              <div className="report-item"><span>Physical Cash</span><span>{money(calc.cashTotal)}</span></div>
              <div className="report-item"><span>Digital/Other</span><span>{money(calc.digitalTotal)}</span></div>
              <div className={`gap-strip ${calc.gap >= 0 ? 'excess' : 'shortage'}`}>
                {calc.gap >= 0 ? 'EXCESS' : 'SHORTAGE'}: {money(calc.gap)}
              </div>
            </div>

            <div className="final-box">
              <label>Net Handover Cash</label>
              <div className="amount">{money(calc.bankable)}</div>
            </div>

            <div className="action-buttons no-print">
               <button className="btn-pdf" onClick={() => window.print()}>📄 Download PDF</button>
               <button className="btn-whatsapp" onClick={shareWhatsApp}>📤 WhatsApp Report</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
