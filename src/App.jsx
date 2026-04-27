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
        { type: 'Petrol', rate: '', pumps: [{ id: id(), name: 'P1', opening: '', closing: '' }, { id: id(), name: 'P2', opening: '', closing: '' }] },
        { type: 'Diesel', rate: '', pumps: [{ id: id(), name: 'D1', opening: '', closing: '' }, { id: id(), name: 'D2', opening: '', closing: '' }] }
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
    const fuelSales = entry.fuels.reduce((acc, f) => {
      const ltrs = f.pumps.reduce((s, p) => s + Math.max(0, n(p.closing) - n(p.opening)), 0);
      return acc + (ltrs * n(f.rate));
    }, 0);
    const totalExp = fuelSales + n(entry.twoT) + n(entry.kata);
    const cashTotal = entry.cash.reduce((s, d) => s + (d.v * n(d.count)), 0);
    const received = cashTotal + n(entry.upi) + n(entry.card) + n(entry.bank) + n(entry.credit);
    const expTotal = entry.expenses.reduce((s, e) => s + n(e.amount), 0);
    return { totalExp, received, cashTotal, gap: received - totalExp, expTotal, bankable: cashTotal - expTotal };
  }, [entry]);

  const updatePump = (fi, pi, key, val) => {
    const newFuels = [...entry.fuels];
    newFuels[fi].pumps[pi][key] = val;
    setEntry({...entry, fuels: newFuels});
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
          <div className={`gap-badge ${calc.gap >= 0 ? 'excess' : 'shortage'}`}>
            {calc.gap >= 0 ? '+' : ''}{n(calc.gap).toFixed(0)}
          </div>
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
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h2>{f.type} Sales</h2>
                  <div style={{width:'100px'}}><label>Rate</label>
                    <input type="number" value={f.rate} onChange={e => {
                      const nf = [...entry.fuels]; nf[fi].rate = e.target.value; setEntry({...entry, fuels: nf});
                    }}/>
                  </div>
                </div>
                {f.pumps.map((p, pi) => (
                  <div className="pump-group" key={p.id}>
                    <label>{p.name} Readings</label>
                    <div className="input-row">
                      <input type="number" placeholder="Opening" value={p.opening} onChange={e => updatePump(fi, pi, 'opening', e.target.value)} />
                      <input type="number" placeholder="Closing" value={p.closing} onChange={e => updatePump(fi, pi, 'closing', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div className="card">
              <h2>Misc Sales</h2>
              <div className="input-row">
                <div><label>2T Oil</label><input type="number" value={entry.twoT} onChange={e => setEntry({...entry, twoT: e.target.value})}/></div>
                <div><label>Lorry Kata</label><input type="number" value={entry.kata} onChange={e => setEntry({...entry, kata: e.target.value})}/></div>
              </div>
            </div>
          </>
        )}

        {tab === 'cash' && (
          <div className="card">
            <h2>Cash Denominations</h2>
            {entry.cash.map((d, i) => (
              <div key={d.v} style={{display:'grid', gridTemplateColumns:'60px 20px 1fr 100px', alignItems:'center', marginBottom:'10px'}}>
                <span style={{fontWeight:'bold'}}>₹{d.v}</span>
                <span>×</span>
                <input type="number" value={d.count} onChange={e => {
                  const nc = [...entry.cash]; nc[i].count = e.target.value; setEntry({...entry, cash: nc});
                }} />
                <span style={{textAlign:'right', fontWeight:'bold'}}>{(d.v * n(d.count))}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'expenses' && (
          <div className="card">
            <h2>Expenses</h2>
            {entry.expenses.map((ex, i) => (
              <div className="input-row" key={ex.id}>
                <input placeholder="Description" value={ex.title} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].title = e.target.value; setEntry({...entry, expenses: ne});
                }} />
                <input type="number" placeholder="Amount" value={ex.amount} onChange={e => {
                  const ne = [...entry.expenses]; ne[i].amount = e.target.value; setEntry({...entry, expenses: ne});
                }} />
              </div>
            ))}
            <button style={{width:'100%', padding:'10px', border:'1px dashed var(--station-blue)', background:'transparent', color:'var(--station-blue)', fontWeight:'bold', borderRadius:'8px'}}
              onClick={() => setEntry({...entry, expenses: [...entry.expenses, {id: id(), title: '', amount: ''}]})}>
              + Add Expense Line
            </button>
          </div>
        )}

        {tab === 'report' && (
          <div className="card">
            <h2>Final Day Sheet</h2>
            <table className="day-sheet-table">
              <tbody>
                <tr><td className="label">Total Meter Sales</td><td className="total">{money(calc.totalExp)}</td></tr>
                <tr><td className="label">Total Cash/Digital</td><td className="total">{money(calc.received)}</td></tr>
                <tr><td className="label">Shortage/Excess</td><td className={`total ${calc.gap >= 0 ? 'excess' : 'shortage'}`}>{money(calc.gap)}</td></tr>
                <tr><td colSpan="2" style={{height:'20px'}}></td></tr>
                <tr><td className="label">Expenses Paid</td><td className="total" style={{color:'red'}}>- {money(calc.expTotal)}</td></tr>
                <tr className="grand-total"><td className="label" style={{color:'var(--station-blue)'}}>Net Cash to Office</td><td className="total">{money(calc.bankable)}</td></tr>
              </tbody>
            </table>
            <button className="fab-share" onClick={() => {
                const txt = `*SAI HANUMA FILLING STATION*\nDate: ${date}\nSales: ${money(calc.totalExp)}\nShort/Excess: ${money(calc.gap)}\nNet Cash: ${money(calc.bankable)}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`);
            }}>📤 Send WhatsApp Day-Sheet</button>
          </div>
        )}
      </div>
    </div>
  );
}
