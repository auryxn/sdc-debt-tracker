import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Debt {
  id: number;
  person_name: string;
  amount: number;
  type: 'INCOMING' | 'OUTGOING';
  description: string;
  due_date: string;
  is_settled: boolean;
}

interface Summary {
  to_me: number;
  i_owe: number;
  balance: number;
}

const API_URL = 'http://localhost:8000';

function App() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<Summary>({ to_me: 0, i_owe: 0, balance: 0 });
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');

  const fetchData = async () => {
    try {
      const debtsRes = await axios.get(`${API_URL}/debts`);
      const summaryRes = await axios.get(`${API_URL}/summary`);
      setDebts(debtsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/debts`, {
        person_name: newName,
        amount: parseFloat(newAmount),
        type: newType
      });
      setNewName('');
      setNewAmount('');
      fetchData();
    } catch (err) {
      console.error("Error adding debt", err);
    }
  };

  const settleDebt = async (id: number) => {
    try {
      await axios.put(`${API_URL}/debts/${id}/settle`);
      fetchData();
    } catch (err) {
      console.error("Error settling debt", err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h1>Julius Debt Tracker</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <div>
          <p>Мне должны</p>
          <h2 style={{ color: 'green' }}>${summary.to_me}</h2>
        </div>
        <div>
          <p>Я должен</p>
          <h2 style={{ color: 'red' }}>${summary.i_owe}</h2>
        </div>
        <div>
          <p>Баланс</p>
          <h2>${summary.balance}</h2>
        </div>
      </div>

      <form onSubmit={addDebt} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Имя" required style={{ flex: 2 }} />
        <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="Сумма" required style={{ flex: 1 }} />
        <select value={newType} onChange={e => setNewType(e.target.value as any)} style={{ flex: 1 }}>
          <option value="INCOMING">Мне должны</option>
          <option value="OUTGOING">Я должен</option>
        </select>
        <button type="submit">Добавить</button>
      </form>

      <div>
        <h3>Активные долги</h3>
        {debts.map(debt => (
          <div key={debt.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{debt.person_name}</strong>: 
              <span style={{ color: debt.type === 'INCOMING' ? 'green' : 'red', marginLeft: '5px' }}>
                {debt.type === 'INCOMING' ? '+' : '-'}${debt.amount}
              </span>
            </div>
            <button onClick={() => settleDebt(debt.id)} style={{ fontSize: '12px' }}>Закрыть</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
