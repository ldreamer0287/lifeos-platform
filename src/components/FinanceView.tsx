/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Wallet,
  Sparkles,
  PieChart as PieIcon,
  CreditCard,
} from 'lucide-react';
import { FinanceTransaction, SavingsGoal } from '../types';
import { getRelativeDateString } from '../utils';

interface FinanceViewProps {
  transactions: FinanceTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<FinanceTransaction[]>>;
  savingsGoals: SavingsGoal[];
  setSavingsGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  theme: 'dark' | 'light';
}

export default function FinanceView({
  transactions,
  setTransactions,
  savingsGoals,
  setSavingsGoals,
  theme,
}: FinanceViewProps) {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);

  // Transaction form state
  const [trTitle, setTrTitle] = useState('');
  const [trAmount, setTrAmount] = useState('');
  const [trType, setTrType] = useState<'income' | 'expense'>('expense');
  const [trCategory, setTrCategory] = useState('food');

  // Savings goal form state
  const [svTitle, setSvTitle] = useState('');
  const [svTarget, setSvTarget] = useState('');
  const [svSaved, setSvSaved] = useState('');

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(trAmount);
    if (!trTitle.trim() || isNaN(amountVal) || amountVal <= 0) return;

    const newTr: FinanceTransaction = {
      id: `tr_${Date.now()}`,
      title: trTitle,
      notes: trTitle,
      amount: amountVal,
      type: trType,
      category: trCategory,
      date: getRelativeDateString(0),
      isRecurring: false,
    };

    setTransactions([newTr, ...transactions]);

    // Reset Form
    setTrTitle('');
    setTrAmount('');
    setTrType('expense');
    setTrCategory('food');
    setShowTransactionForm(false);
  };

  const handleCreateSavingsGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(svTarget);
    const savedVal = parseFloat(svSaved || '0');
    if (!svTitle.trim() || isNaN(targetVal) || targetVal <= 0) return;

    const newGoal: SavingsGoal = {
      id: `svg_${Date.now()}`,
      title: svTitle,
      targetAmount: targetVal,
      currentAmount: savedVal,
    };

    setSavingsGoals([...savingsGoals, newGoal]);

    // Reset Form
    setSvTitle('');
    setSvTarget('');
    setSvSaved('');
    setShowSavingsForm(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(savingsGoals.filter((sg) => sg.id !== id));
  };

  const incrementSavings = (goalId: string) => {
    const amount = parseFloat(prompt('Enter amount to add to savings:') || '0');
    if (isNaN(amount) || amount <= 0) return;

    setSavingsGoals(
      savingsGoals.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            currentAmount: Math.min(g.targetAmount, g.currentAmount + amount),
          };
        }
        return g;
      })
    );
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'salary':
      case 'freelance':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
      case 'food':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/15';
      case 'tech':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15';
      case 'housing':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/15';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/15';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            LifeOS Finance
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Analyze categorical expenditure structures, manage cash flow ledgers, and set savings milestones.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSavingsForm(true)}
            className="px-3 py-2.5 rounded-xl border border-zinc-800/10 dark:border-zinc-800/40 text-zinc-300 text-xs font-bold hover:bg-zinc-550/10 transition-all shadow"
          >
            Add Savings Target
          </button>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus size={14} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Income Flow</h4>
            <p className="text-2xl font-black mt-1 text-emerald-400">
              ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/10 shrink-0">
            <TrendingDown size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Expenses</h4>
            <p className="text-2xl font-black mt-1 text-rose-400">
              ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/10 dark:border-zinc-800/50 p-5 bg-zinc-500/5 backdrop-blur-xl flex items-center gap-4 text-left">
          <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 shrink-0">
            <Wallet size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Net Ledger Balance</h4>
            <p className={`text-2xl font-black mt-1 ${netSavings >= 0 ? 'text-zinc-100' : 'text-rose-500'}`}>
              ${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Dual Screen Layout: Transactions on left, Savings Goals + Charts on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledger logs */}
        <div className="lg:col-span-2 border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left">
          <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-400" /> Recent Balance Ledger Log
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 font-bold">Total: {transactions.length} entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800/10 dark:border-zinc-800/30 text-zinc-400 font-bold uppercase tracking-wider font-mono">
                  <th className="py-2.5 text-left pb-3">Item Details</th>
                  <th className="py-2.5 text-left pb-3">Category</th>
                  <th className="py-2.5 text-left pb-3">Post Date</th>
                  <th className="py-2.5 text-right pb-3">Amount</th>
                  <th className="py-2.5 text-right pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/10 dark:divide-zinc-800/30 font-medium text-zinc-300">
                {transactions.map((tr) => {
                  return (
                    <tr key={tr.id} className="hover:bg-zinc-500/1">
                      <td className="py-3 font-semibold text-zinc-200">{tr.title}</td>
                      <td className="py-3">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(tr.category)}`}>
                          {tr.category}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-zinc-400">{tr.date}</td>
                      <td className={`py-3 text-right font-bold font-mono text-xs ${
                        tr.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tr.type === 'income' ? '+' : '-'}${tr.amount.toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => deleteTransaction(tr.id)}
                          className="p-1 text-zinc-500 hover:text-rose-500 transition-all rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Savings Goals panel */}
        <div className="border border-zinc-800/10 dark:border-zinc-800/50 rounded-2xl p-5 bg-zinc-500/2 backdrop-blur-xl text-left flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-zinc-800/10 dark:border-zinc-800/30 mb-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign size={16} className="text-indigo-400" /> Active Savings targets
              </h3>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {savingsGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="p-3.5 rounded-xl border border-zinc-800/10 dark:border-zinc-800/50 bg-zinc-950/20">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs truncate max-w-[130px]">{goal.title}</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                          Saved: ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => incrementSavings(goal.id)}
                          className="px-2 py-1 text-[9px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-all"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => deleteSavingsGoal(goal.id)}
                          className="p-1 text-zinc-500 hover:text-rose-500 transition-all rounded"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                        <span className="text-zinc-500">Target Reached</span>
                        <span className="font-bold text-indigo-400">{percent}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-800 overflow-hidden rounded-full">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Forms Modals */}
      {showTransactionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Post Cash Transaction</h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Transaction Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. AWS Hosting Cloud Invoice"
                  value={trTitle}
                  onChange={(e) => setTrTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-105' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Ledger Type</label>
                  <select
                    value={trType}
                    onChange={(e) => setTrType(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Amount ($ USD) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="12.50"
                    value={trAmount}
                    onChange={(e) => setTrAmount(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Expense Category</label>
                <select
                  value={trCategory}
                  onChange={(e) => setTrCategory(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <option value="salary">Salary / Payout</option>
                  <option value="freelance">Freelance Consulting</option>
                  <option value="food">Food & Groceries</option>
                  <option value="tech">Tech & SaaS Software</option>
                  <option value="housing">Rent & Housing</option>
                  <option value="entertainment">Entertainment</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSavingsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
            }`}
          >
            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-4">Launch Savings Goal</h3>
            <form onSubmit={handleCreateSavingsGoal} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Savings Target Goal *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. MacBook Pro M4 Max"
                  value={svTitle}
                  onChange={(e) => setSvTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-105' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Target Amount *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="2500"
                    value={svTarget}
                    onChange={(e) => setSvTarget(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Initial Deposit</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={svSaved}
                    onChange={(e) => setSvSaved(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border mt-1.5 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSavingsForm(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Launch Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
