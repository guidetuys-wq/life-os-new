'use client';
import { useState } from 'react';
import { GoalService } from '@/services/goalService';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function GoalModal({ isOpen, onClose, uid }) {
    const [formData, setFormData] = useState({ title: '', area: 'Career', deadline: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error("Judul wajib diisi");

        setIsLoading(true);
        try {
            await GoalService.addGoal(uid, formData);
            setFormData({ title: '', area: 'Career', deadline: '' });
            onClose();
            toast.success("Target ditetapkan!", { icon: '🎯' });
        } catch (error) {
            toast.error("Gagal menyimpan");
        }
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* [FIX] p-5 di mobile, p-6 di desktop */}
            <div className="p-5 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Target Baru</h3>
                        <p className="text-sm text-slate-400">Apa impian terbesarmu?</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
                        <span className="material-symbols-rounded text-xl">close</span>
                    </button>
                </div>
                
                {/* ... Form ... */}
                <form onSubmit={handleSave} className="flex flex-col gap-5">
                    {/* ... Inputs ... */}
                    <Input 
                        label="Judul Target"
                        placeholder="Cth: Tabungan 100 Juta..." 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        autoFocus
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* [FIX] Stack di mobile */}
                         <Select 
                            label="Area Hidup"
                            value={formData.area} 
                            onChange={e => setFormData({...formData, area: e.target.value})}
                        >
                             {/* ... options ... */}
                            <option value="Career">Career</option>
                            <option value="Finance">Finance</option>
                            <option value="Health">Health</option>
                            <option value="Spiritual">Spiritual</option>
                            <option value="Relationship">Relationship</option>
                            <option value="Lifestyle">Lifestyle</option>
                        </Select>

                        <Input 
                            label="Deadline"
                            type="date"
                            value={formData.deadline}
                            onChange={e => setFormData({...formData, deadline: e.target.value})}
                        />
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2">
                        {isLoading ? <span className="animate-spin material-symbols-rounded">sync</span> : 'Simpan Target'}
                    </button>
                </form>
            </div>
        </Modal>
    );
}