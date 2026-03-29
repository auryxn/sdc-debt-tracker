import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  History, 
  X,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// API Configuration
const API_URL = 'http://localhost:8000';

interface Debt {
  id: number;
  person_name: string;
  amount: number;
  type: 'INCOMING' | 'OUTGOING';
  description: string;
  due_date: string;
  is_settled: boolean;
  created_at: string;
}

interface Summary {
  to_me: number;
  i_owe: number;
  balance: number;
}

function App() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({ to_me: 0, i_owe: 0, balance: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const params = selectedPerson ? { person_name: selectedPerson } : {};
      const [debtsRes, summaryRes, peopleRes] = await Promise.all([
        axios.get(`${API_URL}/debts`, { params }),
        axios.get(`${API_URL}/summary`, { params }),
        axios.get(`${API_URL}/people`)
      ]);
      setDebts(debtsRes.data);
      setSummary(summaryRes.data);
      setPeople(peopleRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPerson]);

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/debts`, {
        person_name: newName,
        amount: parseFloat(newAmount),
        type: newType,
        description: newDesc,
        due_date: newDueDate || null
      });
      setNewName('');
      setNewAmount('');
      setNewDesc('');
      setNewDueDate('');
      setIsModalOpen(false);
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

  const isOverdue = (date: string) => {
    if (!date) return false;
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  if (loading) return <div className="loading">Initializing Julius Engine...</div>;

  return (
    <div className="app-container">
      <div className="bg-glow"></div>

      {/* Header */}
      <header className="main-header">
        <div className="logo-section" onClick={() => setSelectedPerson(null)} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">🦾</div>
          <h1>Julius <span>Debt Tracker</span></h1>
        </div>
        <div className="header-actions">
           <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Добавить
          </button>
        </div>
      </header>

      {/* People Selector */}
      <section className="people-scroll">
        <button 
          className={`person-chip ${selectedPerson === null ? 'active' : ''}`}
          onClick={() => setSelectedPerson(null)}
        >
          Все
        </button>
        {people.map(p => (
          <button 
            key={p} 
            className={`person-chip ${selectedPerson === p ? 'active' : ''}`}
            onClick={() => setSelectedPerson(p)}
          >
            {p}
          </button>
        ))}
      </section>

      {/* Summary Cards */}
      <section className="summary-grid">
        <motion.div 
          key={`to-me-${selectedPerson}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card summary-card to-me"
        >
          <div className="card-header">
            <TrendingUp size={18} />
            <span>{selectedPerson ? `Должен мне` : 'Мне должны'}</span>
          </div>
          <div className="amount-display">${summary.to_me.toLocaleString()}</div>
        </motion.div>

        <motion.div 
          key={`i-owe-${selectedPerson}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card summary-card i-owe"
        >
          <div className="card-header">
            <TrendingDown size={18} />
            <span>{selectedPerson ? `Я должен` : 'Я должен'}</span>
          </div>
          <div className="amount-display">${summary.i_owe.toLocaleString()}</div>
        </motion.div>

        <motion.div 
          key={`balance-${selectedPerson}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card summary-card balance"
        >
          <div className="card-header">
            <Wallet size={18} />
            <span>{selectedPerson ? `Сальдо с ${selectedPerson}` : 'Итоговый Баланс'}</span>
          </div>
          <div className="amount-display" style={{ color: summary.balance >= 0 ? '#10b981' : '#f43f5e' }}>
            {summary.balance >= 0 ? '+' : ''}${summary.balance.toLocaleString()}
          </div>
        </motion.div>
      </section>

      {/* Debts List */}
      <section className="list-section">
        <div className="section-title">
          <History size={20} />
          <h2>{selectedPerson ? `История с ${selectedPerson}` : 'Все активные транзакции'}</h2>
        </div>

        <div className="debts-list">
          <AnimatePresence mode='popLayout'>
            {debts.map((debt) => (
              <motion.div 
                key={debt.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className={`debt-item ${debt.type.toLowerCase()}`}
              >
                <div className="debt-info">
                  <div className="debt-icon">
                    {debt.type === 'INCOMING' ? <ArrowUpRight /> : <ArrowDownLeft />}
                  </div>
                  <div className="debt-text">
                    <span className="person-name">{debt.person_name}</span>
                    <div className="debt-meta">
                      <span className="debt-date">{new Date(debt.created_at).toLocaleDateString()}</span>
                      {debt.description && <span className="debt-desc">• {debt.description}</span>}
                    </div>
                    {debt.due_date && (
                      <div className={`due-date-badge ${isOverdue(debt.due_date) ? 'overdue' : ''}`}>
                        <Calendar size={12} />
                        Дедлайн: {new Date(debt.due_date).toLocaleDateString()}
                        {isOverdue(debt.due_date) && <AlertCircle size={12} style={{marginLeft: 4}} />}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="debt-actions">
                  <div className="debt-amount">
                    {debt.type === 'INCOMING' ? '+' : '-'}${debt.amount.toLocaleString()}
                  </div>
                  <button className="settle-btn" onClick={() => settleDebt(debt.id)}>
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {debts.length === 0 && (
            <div className="empty-state">Записей не найдено, сэр.</div>
          )}
        </div>
      </section>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="modal-content"
            >
              <div className="modal-header">
                <h2>Новая запись</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={addDebt} className="debt-form">
                <div className="input-group">
                  <label>Контактное лицо</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Имя..." required />
                </div>
                
                <div className="input-row">
                  <div className="input-group flex-2">
                    <label>Сумма ($)</label>
                    <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00" required />
                  </div>
                  <div className="input-group flex-1">
                    <label>Тип</label>
                    <select value={newType} onChange={e => setNewType(e.target.value as any)}>
                      <option value="INCOMING">Мне должны</option>
                      <option value="OUTGOING">Я должен</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Дедлайн (опционально)</label>
                  <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
                </div>

                <div className="input-group">
                  <label>Примечание</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="За что?" rows={2} />
                </div>

                <button type="submit" className="submit-btn">Зафиксировать долг</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="app-footer">
        Julius OS • Financial Management Module v1.2
      </footer>

      <style>{`
        :root {
          --bg: #0f172a;
          --card: #1e293b;
          --primary: #38bdf8;
          --text: #f1f5f9;
          --text-muted: #94a3b8;
          --green: #10b981;
          --red: #f43f5e;
          --border: #334155;
        }

        body {
          margin: 0;
          background-color: var(--bg);
          color: var(--text);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
        }

        .app-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          min-height: 100vh;
          position: relative;
        }

        .bg-glow {
          position: fixed;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0) 70%);
          pointer-events: none;
          z-index: -1;
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .logo-section h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: var(--text);
        }

        .logo-section span {
          color: var(--primary);
          font-weight: 300;
        }

        .logo-icon {
          font-size: 2rem;
          margin-bottom: 5px;
        }

        .people-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 10px 0 24px 0;
          scrollbar-width: none;
        }
        
        .people-scroll::-webkit-scrollbar { display: none; }

        .person-chip {
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 8px 20px;
          border-radius: 100px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .person-chip.active {
          background: var(--primary);
          color: #000;
          border-color: var(--primary);
          font-weight: 600;
        }

        .add-btn {
          background-color: var(--primary);
          color: #000;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        .card {
          background: var(--card);
          padding: 24px;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 12px;
        }

        .amount-display {
          font-size: 1.75rem;
          font-weight: 700;
        }

        .to-me .card-header { color: var(--green); }
        .i-owe .card-header { color: var(--red); }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          color: var(--text-muted);
        }

        .section-title h2 {
          font-size: 1.25rem;
          margin: 0;
          color: var(--text);
        }

        .debts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .debt-item {
          background: var(--card);
          padding: 16px 20px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid var(--border);
          transition: all 0.2s;
        }

        .debt-item:hover {
          border-color: var(--primary);
          background: rgba(30, 41, 59, 0.8);
        }

        .debt-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .debt-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .incoming .debt-icon { background: rgba(16, 185, 129, 0.1); color: var(--green); }
        .outgoing .debt-icon { background: rgba(244, 63, 94, 0.1); color: var(--red); }

        .person-name {
          display: block;
          font-weight: 600;
          font-size: 1rem;
        }

        .debt-meta {
          display: flex;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .due-date-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          padding: 2px 8px;
          background: rgba(56, 189, 248, 0.1);
          color: var(--primary);
          border-radius: 6px;
          margin-top: 6px;
        }

        .due-date-badge.overdue {
          background: rgba(244, 63, 94, 0.1);
          color: var(--red);
          border: 1px solid rgba(244, 63, 94, 0.2);
        }

        .debt-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .debt-amount {
          font-weight: 700;
          font-size: 1.125rem;
        }

        .incoming .debt-amount { color: var(--green); }
        .outgoing .debt-amount { color: var(--red); }

        .settle-btn {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-muted);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .settle-btn:hover {
          background: var(--green);
          color: white;
          border-color: var(--green);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--card);
          width: 100%;
          max-width: 480px;
          padding: 32px;
          border-radius: 24px;
          border: 1px solid var(--border);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .input-group label {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .input-row {
          display: flex;
          gap: 16px;
        }

        .flex-2 { flex: 2; }
        .flex-1 { flex: 1; }

        input, select, textarea {
          background: #0f172a;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-family: inherit;
          outline: none;
        }

        input:focus, select:focus, textarea:focus {
          border-color: var(--primary);
        }

        .submit-btn {
          width: 100%;
          background: var(--primary);
          color: #000;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          border: 2px dashed var(--border);
          border-radius: 20px;
        }

        .loading {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--primary);
          font-weight: 700;
          letter-spacing: 2px;
        }

        .app-footer {
          margin-top: 60px;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .summary-grid { grid-template-columns: 1fr; }
          .main-header { flex-direction: column; gap: 20px; text-align: center; }
          .input-row { flex-direction: column; gap: 0; }
        }
      `}</style>
    </div>
  );
}

export default App;
