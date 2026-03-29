import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Julius Debt Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple SQLite for rapid start
DB_PATH = "debts.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person_name TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT CHECK(type IN ('INCOMING', 'OUTGOING')) NOT NULL,
            description TEXT,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_settled INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

init_db()

class DebtCreate(BaseModel):
    person_name: str
    amount: float
    type: str # INCOMING (owe me) or OUTGOING (I owe)
    description: Optional[str] = None
    due_date: Optional[str] = None

class Debt(DebtCreate):
    id: int
    created_at: str
    is_settled: bool

@app.post("/debts", response_model=Debt)
def create_debt(debt: DebtCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO debts (person_name, amount, type, description, due_date)
        VALUES (?, ?, ?, ?, ?)
    ''', (debt.person_name, debt.amount, debt.type, debt.description, debt.due_date))
    debt_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return get_debt(debt_id)

@app.get("/debts", response_model=List[Debt])
def list_debts(include_settled: bool = False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if include_settled:
        cursor.execute('SELECT * FROM debts ORDER BY created_at DESC')
    else:
        cursor.execute('SELECT * FROM debts WHERE is_settled = 0 ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/debts/{debt_id}", response_model=Debt)
def get_debt(debt_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM debts WHERE id = ?', (debt_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Debt not found")
    return dict(row)

@app.put("/debts/{debt_id}/settle")
def settle_debt(debt_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('UPDATE debts SET is_settled = 1 WHERE id = ?', (debt_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/summary")
def get_summary():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(amount) FROM debts WHERE type='INCOMING' AND is_settled=0")
    incoming = cursor.fetchone()[0] or 0
    cursor.execute("SELECT SUM(amount) FROM debts WHERE type='OUTGOING' AND is_settled=0")
    outgoing = cursor.fetchone()[0] or 0
    conn.close()
    return {
        "to_me": incoming,
        "i_owe": outgoing,
        "balance": incoming - outgoing
    }
