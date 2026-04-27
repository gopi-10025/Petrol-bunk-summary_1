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
        const liters = Math.max(0, n(p.opening) - n(p.closing)); // Countdown Logic
        return { ...p, liters, amt: liters * n(f.rate) };
      });
      return { ...f, pumps, totalLiters: pumps.reduce((s, p) => s + p.liters, 0), totalAmt: pumps.reduce((s, p) => s + p.amt, 0) };
    });
    const totalSales = fuelDetails.reduce((s, f) => s + f.totalAmt, 0) + n(entry.twoT) + n(entry.kata);
    const cashTotal = entry.cash.reduce((s, d) => s + (d.v * n(d.count)), 0);
    const digitalTotal = n(entry.upi) + n(entry.card) + n(entry.bank) + n(entry.credit);
    const expTotal = entry.expenses.reduce((s, e) => s + n(e.amount), 0);
    return { fuelDetails, totalSales, cashTotal, digitalTotal, totalReceived: cashTotal + digitalTotal, gap: (cashTotal + digitalTotal) - totalSales, expTotal, bankable: cashTotal - expTotal };
  }, [entry]);

  const updatePump = (fi, pi, k, v) => {
    const nf = [...entry.fuels];
    nf[fi].pumps[pi][k] = v;
    setEntry({ ...entry, fuels: nf });
  };

  const addPump = (fi) => {
    const nf = [...entry.fuels];
    nf[fi].pumps.push({ id: id(), name: `${nf[fi].type[0]}${nf[fi].pumps.length + 1}`, opening: '', closing: '' });
    setEntry({ ...entry, fuels: nf });
  };

  const downloadPDF = () => { setTab('report'); setTimeout(() => window.print(), 500); };

  if (!entry) return null;

  return (
    <div className="app">
      <header className="station-banner no-print">
        <h1>Sai Hanuma Filling Station</h1>
        <p>DAILY DAY-SHEET</p>
      </header>

      <div className="app-container">
        <div className="sticky-header no-print">
          <input type="date" className="date-input" value={date} onChange={e => setDate(e.target.value)} />
          <div className="status-label">OFFICE COPY</div>
        </div>

        <div className="tab-bar no-print">
          {['sales', 'cash', 'expenses', 'report'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
          ))}
        </div>

        {tab === 'sales' && entry.fuels.map((f, fi) => (
          <div className="card" key={f.type}>
            <div className="card-header-row">
              <h2>{f.type}</h2>
              <input className="rate-input" type="number" placeholder="Rate" value={f.rate} onChange={e => { const nf = [...entry.fuels]; nf[fi].rate = e.target.value; setEntry({ ...entry, fuels: nf }); }} />
            </div>
            {f.pumps.map((p, pi) => (
              <div className="pump-group" key={p.id}>
                <div className="pump-label-row">
                  <strong>{p.name}</strong>
                  {f.pumps.length > 1 && <button className="btn-del" onClick={() => { const nf = [...entry.fuels]; nf[fi].pumps.splice(pi, 1); setEntry({ ...entry, fuels: nf }); }}>Delete</button>}
                </div>
                <div className="input-row">
                  <input type="number" placeholder="Opening" value={p.opening} onChange={e => updatePump(fi, pi, 'opening', e.target.value)} />
                  <input type="number" placeholder="Closing" value={p.closing} onChange={e => updatePump(fi, pi, 'closing', e.target.value)} />
                </div>
                <div className="pump-calc-row">Liters: {(n(p.opening) - n(p.closing)).toFixed(2)} | {money((n(p.opening) - n(p.closing)) * n(f.rate))}</div>
              </div>
            ))}
            <button className="btn-add-pump" onClick={() => addPump(fi)}>+ Add Nozzle</button>
          </div>
        ))}

        {tab === 'report' && (
          <div className="card report-view">
            <h3>⛽ Sales Breakdown</h3>
            {calc.fuelDetails.map(f => (
              <div key={f.type} className="report-item"><span>{f.type} ({f.totalLiters.toFixed(2)} L)</span><span>{money(f.totalAmt)}</span></div>
            ))}
            <div className="report-total"><span>Total Expected</span><span>{money(calc.totalSales)}</span></div>
            <div className={`gap-strip ${calc.gap >= 0 ? 'excess' : 'shortage'}`}>Gap: {money(calc.gap)}</div>
            <div className="final-box"><label>Handover Cash</label><div className="amount">{money(calc.bankable)}</div></div>
            <div className="action-buttons no-print">
              <button className="btn-pdf" onClick={downloadPDF}>📄 Save PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
