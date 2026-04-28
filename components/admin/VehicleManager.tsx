'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Edit2, Save, X, Plus, Users, DollarSign } from 'lucide-react'
import { VehicleType } from '@/types'

interface Props {
  initialVehicles: VehicleType[]
}

interface EditForm {
  name: string
  description: string
  base_price: string
  capacity: string
}

export default function VehicleManager({ initialVehicles }: Props) {
  const router = useRouter()
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>({ name: '', description: '', base_price: '', capacity: '' })
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<EditForm>({ name: '', description: '', base_price: '', capacity: '4' })

  const startEdit = (v: VehicleType) => {
    setEditingId(v.id)
    setForm({ name: v.name, description: v.description || '', base_price: String(v.base_price), capacity: String(v.capacity) })
  }

  const saveEdit = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...form, base_price: parseFloat(form.base_price), capacity: parseInt(form.capacity) }),
      })
      if (res.ok) {
        setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...form, base_price: parseFloat(form.base_price), capacity: parseInt(form.capacity) } : v))
        setEditingId(null)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (v: VehicleType) => {
    await fetch('/api/admin/vehicles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: v.id, is_active: !v.is_active }),
    })
    setVehicles(prev => prev.map(veh => veh.id === v.id ? { ...veh, is_active: !veh.is_active } : veh))
    router.refresh()
  }

  const addVehicle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, base_price: parseFloat(addForm.base_price), capacity: parseInt(addForm.capacity) }),
      })
      if (res.ok) {
        const data = await res.json()
        setVehicles(prev => [...prev, data])
        setShowAdd(false)
        setAddForm({ name: '', description: '', base_price: '', capacity: '4' })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Plus size={16} className="text-sky-500" /> Add New Vehicle</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
              <input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="e.g. SUV" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Base Price (₮)</label>
              <input type="number" value={addForm.base_price} onChange={e => setAddForm(p => ({ ...p, base_price: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="80000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Capacity</label>
              <input type="number" value={addForm.capacity} onChange={e => setAddForm(p => ({ ...p, capacity: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <input value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Vehicle description" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={addVehicle} disabled={loading || !addForm.name || !addForm.base_price}
              className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">Save</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {vehicles.map(v => (
          <div key={v.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${v.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            {editingId === v.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Price (₮)</label>
                    <input type="number" value={form.base_price} onChange={e => setForm(p => ({ ...p, base_price: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Capacity</label>
                    <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={() => saveEdit(v.id)} disabled={loading} className="flex-1 flex items-center justify-center gap-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
                    <Save size={14} /> Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                      <Car size={20} className="text-sky-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <div className={`text-xs font-medium ${v.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => startEdit(v)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Edit2 size={15} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">{v.description || 'No description'}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <DollarSign size={13} className="text-emerald-500" />
                    ₮{Number(v.base_price).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users size={13} className="text-sky-500" />
                    {v.capacity} passengers
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(v)}
                  className={`mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${v.is_active ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'}`}
                >
                  {v.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
