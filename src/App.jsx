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
    if (saved) {
      setEntry(JSON.parse(saved));
    } else {
      setEntry({
        fuels: [
          { type: 'Petrol', rate: '', pumps: [{ id: id(), name: 'P1', opening: '', closing: '' }, { id: id(), name: 'P2', opening: '', closing: '' }] },
          { type: 'Diesel', rate: '', pumps: [{ id: id(), name: 'D1', opening: '', closing: '' }, { id: id(), name: 'D2', opening: '', closing: '' }] }
        ],
        cashManual: '',
        cash: [500, 200, 100, 50, 20, 10].map(v => ({ v, count: '' })),
        upi: '', card: '', bank: '', credit: '',
        expenses: [],
        miscSales: [{ id: id(), type: '', qty: '', rate: '', amount: '' }] 
      });
    }
  }, [date]);

  useEffect(() => {
    if (entry) localStorage.setItem(`sai_hanuma_${date}`, JSON.stringify(entry));
  }, [entry, date]);

  const calc = useMemo(() => {
    if (!entry) return {};

    const fuelDetails = entry.fuels.map(f => {
      const pumps = f.pumps.map(p => {
        const liters = Math.max(0, n(p.opening) - n(p.closing));
        return { ...p, liters, amt: liters * n(f.rate) };
      });
      return { ...f, pumps, totalLiters: pumps.reduce((s, p) => s + p.liters, 0), totalAmt: pumps.reduce((s, p) => s + p.amt, 0) };
    });

    // Summing up Misc Sales
    const miscTotal = (entry.miscSales || []).reduce((s, m) => s + n(m.amount), 0);
    
    const totalMeterSales = fuelDetails.reduce((s, f) => s + f.totalAmt, 0);
    const totalExpected = totalMeterSales + miscTotal;
    
    const denomTotal = entry.cash.reduce((s, d) => s + (d.v * n(d.count)), 0);
    const cashTotal = n(entry.cashManual);
    const digitalTotal = n(entry.upi) + n(entry.card) + n(entry.bank) + n(entry.credit);
    const totalReceived = cashTotal + digitalTotal;
    const expTotal = entry.expenses.reduce((s, e) => s + n(e.amount), 0);

    return {
      fuelDetails, totalExpected, denomTotal, cashTotal, 
      digitalTotal, totalReceived, miscTotal,
      gap: totalReceived - totalExpected,
      expTotal, bankable: cashTotal - expTotal
    };
  }, [entry]);

  const addMiscRow = () => {
    setEntry(prev => ({
      ...prev,
      miscSales: [...(prev.miscSales || []), { id: id(), type: '', qty: '', rate: '', amount: '' }]
    }));
  };

  const updateMiscRow = (idx, key, val) => {
    const newMisc = [...entry.miscSales];
    newMisc[idx][key] = val;
    
    // Auto-calculate amount if Qty or Rate changes
    if (key === 'qty' || key === 'rate') {
      const q = key === 'qty' ? n(val) : n(newMisc[idx].qty);
      const r = key === 'rate' ? n(val) : n(newMisc[idx].rate);
      newMisc[idx].amount = q > 0 && r > 0 ? (q * r).toString() : newMisc[idx].amount;
    }
    
    setEntry({ ...entry, miscSales: newMisc });
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
                  <div className="rate-box"><label>Rate</label><input type="number" step="0.01" value={f.rate} onChange={e => {
                    const nf = [...entry.fuels]; nf[fi].rate = e.target.value; setEntry({ ...entry, fuels: nf });
                  }} /></div>
                </div>
                {f.pumps.map((p, pi) => (
                  <div className="pump-group" key={p.id}>
                    <div className="pump-label-row"><strong>Nozzle: {p.name}</strong></div>
                    <div className="input-row">
                      <div><label>Opening</label><input type="number" value={p.opening} onChange={e => {
                        const nf = [...entry.fuels]; nf[fi].pumps[pi].opening = e.target.value; setEntry({ ...entry, fuels: nf });
                      }} /></div>
                      <div><label>Closing</label><input type="number" value={p.closing} onChange={e => {
                        const nf = [...entry.fuels]; nf[fi].pumps[pi].closing = e.target.value; setEntry({ ...entry, fuels: nf });
                      }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div className="card">
              <h2>Miscellaneous Sales</h2>
              <div className="misc-header no-print" style={{display:'flex', gap:'8px', marginBottom:'5px', fontSize:'12px', color:'#666', padding:'0 5px'}}>
                <span style={{flex:2}}>Item Name</span>
                <span style={{flex:1}}>Qty</span>
                <span style={{flex:1}}>Rate</span>
                <span style={{flex:1.5}}>Total</span>
                <span style={{width:'30px'}}></span>
              </div>
              {(entry.miscSales || []).map((m, idx) => (
                <div className="input-row misc-row" key={m.id} style={{ marginBottom: '10px', gap: '8px' }}>
                  <input style={{ flex: 2 }} placeholder="Item" value={m.type} onChange={e => updateMiscRow(idx, 'type', e.target.value)} />
                  <input style={{ flex: 1 }} type="number" placeholder="Qty" value={m.qty} onChange={e => updateMiscRow(idx, 'qty', e.target.value)} />
                  <input style={{ flex: 1 }} type="number" placeholder="Rate" value={m.rate} onChange={e => updateMiscRow(idx, 'rate', e.target.value)} />
                  <input style={{ flex: 1.5, fontWeight:'bold', backgroundColor:'#f9f9f9' }} type="number" placeholder="Total" value={m.amount} onChange={e => updateMiscRow(idx, 'amount', e.target.value)} />
                  <button className="btn-del" onClick={() => setEntry({ ...entry, miscSales: entry.miscSales.filter((_, i) => i !== idx) })}>✕</button>
                </div>
              ))}
              <button className="btn-add-pump" onClick={addMiscRow}>+ Add Misc Item</button>
            </div>
          </>
        )}

        {tab === 'cash' && (
          <div className="card">
            <div className="card-header-row">
              <h2>Denominations</h2>
              <div className="denom-total-box">Total: <b>{money(calc.denomTotal)}</b></div>
            </div>
            {entry.cash.map((d, i) => (
              <div key={d.v} className="cash-row-ui">
                <span className="denom">₹{d.v}</span>
                <input type="number" value={d.count} onChange={e => {
                  const nc = [...entry.cash]; nc[i].count = e.target.value; setEntry({ ...entry, cash: nc });
                }} />
                <span className="val">{money(d.v * n(d.count))}</span>
              </div>
            ))}
            <hr />
            <h2>Collection Details</h2>
            <div className="payment-grid">
              <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px' }}>
                <label><b>Physical Cash</b></label>
                <input type="number" value={entry.cashManual} onChange={e => setEntry({ ...entry, cashManual: e.target.value })} />
              </div>
              <div><label>UPI</label><input type="number" value={entry.upi} onChange={e => setEntry({ ...entry, upi: e.target.value })} /></div>
              <div><label>Card</label><input type="number" value={entry.card} onChange={e => setEntry({ ...entry, card: e.target.value })} /></div>
              <div><label>Bank</label><input type="number" value={entry.bank} onChange={e => setEntry({ ...entry, bank: e.target.value })} /></div>
              <div><label>Credit</label><input type="number" value={entry.credit} onChange={e => setEntry({ ...entry, credit: e.target.value })} /></div>
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="card">
            <h2>Station Expenses</h2>
            {entry.expenses.map((ex, i) => (
              <div className="input-row" key={ex.id} style={{ marginBottom: '10px' }}>
                <input style={{ flex: 2 }} placeholder="Reason" value={ex.title} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].title = e.target.value; setEntry({ ...entry, expenses: ne });
                }} />
                <input style={{ flex: 1 }} type="number" placeholder="Amount" value={ex.amount} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].amount = e.target.value; setEntry({ ...entry, expenses: ne });
                }} />
                <button className="btn-del" onClick={() => setEntry({ ...entry, expenses: entry.expenses.filter((_, idx) => idx !== i) })}>✕</button>
              </div>
            ))}
            <button className="btn-add-pump" onClick={() => setEntry({ ...entry, expenses: [...entry.expenses, { id: id(), title: '', amount: '' }] })}>+ Add Expense</button>
          </div>
        )}

        {tab === 'report' && (
          <div className="card report-view">
            <div className="report-section">
              <h3>⛽ Sales Summary</h3>
              {calc.fuelDetails.map(f => (
                <div key={f.type} className="report-item">
                  <span>{f.type} ({f.totalLiters.toFixed(2)} L)</span>
                  <span>{money(f.totalAmt)}</span>
                </div>
              ))}
              {(entry.miscSales || []).map(m => m.type && (
                <div key={m.id} className="report-item sub">
                  <span>└ {m.type} {m.qty && `(${m.qty} x ₹${m.rate})`}</span>
                  <span>{money(m.amount)}</span>
                </div>
              ))}
              <div className="report-total"><span>Total Expected</span><span>{money(calc.totalExpected)}</span></div>
            </div>

            <div className="report-section">
              <h3>💰 Collection Breakdown</h3>
              <div className="report-item"><span>Total Physical Cash</span><span>{money(calc.cashTotal)}</span></div>
              <div className="report-item"><span>Digital/Credit Total</span><span>{money(calc.digitalTotal)}</span></div>
              <div className="report-total"><span>Total Received</span><span>{money(calc.totalReceived)}</span></div>
              <div className={`gap-strip ${calc.gap >= 0 ? 'excess' : 'shortage'}`}>
                {calc.gap >= 0 ? 'EXCESS' : 'SHORTAGE'}: {money(calc.gap)}
              </div>
            </div>

            <div className="final-box">
              <label>Net Cash to Handover</label>
              <div className="amount">{money(calc.bankable)}</div>
            </div>
            
            <button className="btn-pdf no-print" onClick={() => window.print()} style={{marginTop:'20px', width:'100%'}}>📄 Print Report</button>
          </div>
        )}
      </div>
    </div>
  );
}
