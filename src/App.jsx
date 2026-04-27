import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/* ========= Utilities ========= */
const today = () => new Date().toISOString().slice(0, 10);
const n = (v) => Number(v || 0);
const r2 = (v) => Math.round(n(v) * 100) / 100;
const money = (v) =>
  `₹${r2(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const id = () => Math.random().toString(16).slice(2);

/* ========= Default ========= */
const defaultEntry = (date) => ({
  date,
  fuels: [
    {
      type: 'Petrol',
      rate: '',
      pumps: [
        { id: id(), name: 'Petrol Pump 1', opening: '', closing: '' },
        { id: id(), name: 'Petrol Pump 2', opening: '', closing: '' },
      ],
    },
    {
      type: 'Diesel',
      rate: '',
      pumps: [
        { id: id(), name: 'Diesel Pump 1', opening: '', closing: '' },
        { id: id(), name: 'Diesel Pump 2', opening: '', closing: '' },
      ],
    },
  ],
  twoT: '',
  lorryKata: '',
  cashDenoms: [500, 200, 100, 50, 20, 10].map((v) => ({
    value: v,
    count: '',
  })),
  upi: '',
  card: '',
  bank: '',
  credit: '',
  expenses: [],
});

export default function App() {
  const [date, setDate] = useState(today());
  const [tab, setTab] = useState('sales');
  const [entry, setEntry] = useState(defaultEntry(today()));

  useEffect(() => {
    setEntry(defaultEntry(date));
  }, [date]);

  /* ========= Calculations ========= */
  const fuelSummary = useMemo(() => {
    return entry.fuels.map((fuel) => {
      let liters = 0;
      fuel.pumps.forEach(
        (p) => (liters += Math.max(0, n(p.opening) - n(p.closing)))
      );
      liters = r2(liters);
      return {
        type: fuel.type,
        liters,
        amount: r2(liters * n(fuel.rate)),
      };
    });
  }, [entry.fuels]);

  const petrol = fuelSummary.find((f) => f.type === 'Petrol') || {
    liters: 0,
    amount: 0,
  };
  const diesel = fuelSummary.find((f) => f.type === 'Diesel') || {
    liters: 0,
    amount: 0,
  };

  const fuelExpected = r2(petrol.amount + diesel.amount);
  const otherExpected = r2(n(entry.twoT) + n(entry.lorryKata));
  const totalExpected = r2(fuelExpected + otherExpected);

  const cashTotal = r2(
    entry.cashDenoms.reduce((s, d) => s + d.value * n(d.count), 0)
  );

  const totalReceived = r2(
    cashTotal + n(entry.upi) + n(entry.card) + n(entry.bank)
  );

  const gap = r2(totalReceived - totalExpected);

  const expensesTotal = r2(entry.expenses.reduce((s, e) => s + n(e.amount), 0));

  const netBalance = r2(totalReceived - expensesTotal);

  return (
    <div className="app">
      <h1>Sai Hanuma Filling Station</h1>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="tabs">
        {['sales', 'cash', 'payments', 'expenses', 'owner'].map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ================= SALES ================= */}
      {tab === 'sales' &&
        entry.fuels.map((fuel, fi) => (
          <div key={fuel.type} className="card">
            <div className="section-header">
              <h2>{fuel.type}</h2>
              <div>
                <label>Rate (₹)</label>
                <input
                  value={fuel.rate}
                  onChange={(e) => {
                    const fuels = [...entry.fuels];
                    fuels[fi].rate = e.target.value;
                    setEntry({ ...entry, fuels });
                  }}
                />
              </div>
            </div>

            {fuel.pumps.map((p, pi) => (
              <div key={p.id} className="pump-row">
                <strong>{p.name}</strong>
                <input
                  placeholder="Opening"
                  value={p.opening}
                  onChange={(e) => {
                    const fuels = [...entry.fuels];
                    fuels[fi].pumps[pi].opening = e.target.value;
                    setEntry({ ...entry, fuels });
                  }}
                />
                <input
                  placeholder="Closing"
                  value={p.closing}
                  onChange={(e) => {
                    const fuels = [...entry.fuels];
                    fuels[fi].pumps[pi].closing = e.target.value;
                    setEntry({ ...entry, fuels });
                  }}
                />
                <span>
                  {r2(Math.max(0, n(p.opening) - n(p.closing))).toFixed(2)} L
                </span>
              </div>
            ))}

            <button
              className="btn"
              onClick={() => {
                const fuels = [...entry.fuels];
                fuels[fi].pumps.push({
                  id: id(),
                  name: `${fuel.type} Pump ${fuels[fi].pumps.length + 1}`,
                  opening: '',
                  closing: '',
                });
                setEntry({ ...entry, fuels });
              }}
            >
              + Add {fuel.type} Pump
            </button>

            <div className="total">
              {petrol.liters + diesel.liters} L → {money(fuelExpected)}
            </div>
          </div>
        ))}

      {tab === 'sales' && (
        <div className="card">
          <h3>Other Sales</h3>
          <div className="grid2">
            <div>
              <label>2T Sale</label>
              <input
                value={entry.twoT}
                onChange={(e) => setEntry({ ...entry, twoT: e.target.value })}
              />
            </div>
            <div>
              <label>Lorry Kata</label>
              <input
                value={entry.lorryKata}
                onChange={(e) =>
                  setEntry({ ...entry, lorryKata: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= CASH ================= */}
      {tab === 'cash' && (
        <div className="card">
          <h2>Cash Denominations</h2>

          {entry.cashDenoms.map((d, i) => (
            <div key={d.value} className="cash-line">
              <span>₹{d.value}</span>
              <span>×</span>
              <input
                className="count"
                value={d.count}
                onChange={(e) => {
                  const cashDenoms = [...entry.cashDenoms];
                  cashDenoms[i].count = e.target.value;
                  setEntry({ ...entry, cashDenoms });
                }}
              />
              <span>{money(d.value * n(d.count))}</span>
            </div>
          ))}

          <div className="total">Cash Total: {money(cashTotal)}</div>
        </div>
      )}

      {/* ================= PAYMENTS ================= */}
      {tab === 'payments' && (
        <div className="card">
          <h2>Payments</h2>
          <div className="grid2">
            <div>
              <label>UPI</label>
              <input
                value={entry.upi}
                onChange={(e) => setEntry({ ...entry, upi: e.target.value })}
              />
            </div>
            <div>
              <label>Card</label>
              <input
                value={entry.card}
                onChange={(e) => setEntry({ ...entry, card: e.target.value })}
              />
            </div>
            <div>
              <label>Bank</label>
              <input
                value={entry.bank}
                onChange={(e) => setEntry({ ...entry, bank: e.target.value })}
              />
            </div>
            <div>
              <label>Credit</label>
              <input
                value={entry.credit}
                onChange={(e) => setEntry({ ...entry, credit: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= EXPENSES ================= */}
      {tab === 'expenses' && (
        <div className="card">
          <h2>Expenses</h2>

          {entry.expenses.map((e) => (
            <div key={e.id} className="expense-row">
              <input
                placeholder="Expense name"
                value={e.title}
                onChange={(ev) =>
                  setEntry({
                    ...entry,
                    expenses: entry.expenses.map((x) =>
                      x.id === e.id ? { ...x, title: ev.target.value } : x
                    ),
                  })
                }
              />
              <input
                placeholder="Amount"
                value={e.amount}
                onChange={(ev) =>
                  setEntry({
                    ...entry,
                    expenses: entry.expenses.map((x) =>
                      x.id === e.id ? { ...x, amount: ev.target.value } : x
                    ),
                  })
                }
              />
              <button
                className="btn danger"
                onClick={() =>
                  setEntry({
                    ...entry,
                    expenses: entry.expenses.filter((x) => x.id !== e.id),
                  })
                }
              >
                ✕
              </button>
            </div>
          ))}

          <button
            className="btn"
            onClick={() =>
              setEntry({
                ...entry,
                expenses: [
                  ...entry.expenses,
                  { id: id(), title: '', amount: '' },
                ],
              })
            }
          >
            + Add Expense
          </button>

          <div className="total">Total Expenses: {money(expensesTotal)}</div>
        </div>
      )}

      {/* ================= OWNER ================= */}
      {tab === 'owner' && (
        <div className="card owner">
          <h2>Owner Summary</h2>

          <h3>Expected</h3>
          <p>
            Petrol: {petrol.liters} L · {money(petrol.amount)}
          </p>
          <p>
            Diesel: {diesel.liters} L · {money(diesel.amount)}
          </p>
          <p>2T + Lorry Kata: {money(otherExpected)}</p>
          <strong>Total Expected: {money(totalExpected)}</strong>

          <h3>Actual Received</h3>
          <p>Cash: {money(cashTotal)}</p>
          <p>UPI: {money(entry.upi)}</p>
          <p>Card: {money(entry.card)}</p>
          <p>Bank: {money(entry.bank)}</p>
          <strong>Total Received: {money(totalReceived)}</strong>

          <h3 className={gap === 0 ? 'ok' : 'bad'}>
            Gap (Received − Expected): {money(gap)}
          </h3>

          <h3>Expenses</h3>
          {entry.expenses.map((e) => (
            <p key={e.id}>
              {e.title}: {money(e.amount)}
            </p>
          ))}
          <strong>Total Expenses: {money(expensesTotal)}</strong>

          <h2>Net Balance: {money(netBalance)}</h2>
        </div>
      )}
    </div>
  );
}
