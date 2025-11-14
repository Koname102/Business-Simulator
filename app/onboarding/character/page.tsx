// ============================================
// FILE: app/onboarding/character/page.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CharacterCreationPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [errors, setErrors] = useState({ name: '', age: '' });

  const validateForm = () => {
    const newErrors = { name: '', age: '' };
    let isValid = true;

    if (name.trim().length < 2) {
      newErrors.name = 'Nama minimal 2 karakter';
      isValid = false;
    }

    if (age < 18 || age > 100) {
      newErrors.age = 'Umur harus antara 18-100 tahun';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    localStorage.setItem('temp_player', JSON.stringify({ name, age }));
    router.push('/onboarding/business');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Buat Karakter
        </h1>
        <p className="text-gray-600 mb-6">
          Mari mulai dengan membuat karakter kamu
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama kamu"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Umur
            </label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="18"
              max="100"
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Lanjut ke Pembuatan Perusahaan
          </button>
        </form>
      </div>
    </div>
  );
}