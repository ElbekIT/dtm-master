'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon,
  Pencil,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { User } from '../types';
import { db } from '../lib/firebase';
import { ref, set, get } from 'firebase/database';

const BIO_MAX_LENGTH = 200;

interface ProfileProps {
  currentUser: User;
  viewedUser?: User | null;
  onBack?: () => void;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function Profile({
  currentUser,
  viewedUser,
  onBack,
  onUserUpdate,
}: ProfileProps) {
  const displayUser = viewedUser || currentUser;
  const isOwnProfile = !viewedUser || viewedUser.uid === currentUser.uid;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState((displayUser as any).bio || '');
  const [editNickname, setEditNickname] = useState(displayUser.nickname || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load bio from Firebase Realtime Database when modal opens
  useEffect(() => {
    const loadBio = async () => {
      if (!isOwnProfile || !showEditModal) return;
      try {
        setLoading(true);
        const bioRef = ref(db, `users/${currentUser.uid}/bio`);
        const snapshot = await get(bioRef);
        if (snapshot.exists()) {
          setEditBio(snapshot.val());
        }
      } catch (error) {
        console.error('[v0] Failed to load bio:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBio();
  }, [showEditModal, isOwnProfile, currentUser.uid]);

  const handleSaveProfile = async () => {
    const trimmedNickname = editNickname.trim();
    const trimmedBio = editBio.trim();

    if (!trimmedNickname) {
      setSaveError('Ism/taxallus bo\'sh bo\'lishi mumkin emas');
      return;
    }
    if (trimmedNickname.length > 40) {
      setSaveError('Ism/taxallus 40 belgidan oshmasligi kerak');
      return;
    }
    if (trimmedBio.length > BIO_MAX_LENGTH) {
      setSaveError(`Bio ${BIO_MAX_LENGTH} belgidan oshmasligi kerak`);
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Save bio to Firebase Realtime Database
      const bioRef = ref(db, `users/${currentUser.uid}/bio`);
      await set(bioRef, trimmedBio);

      const updatedUser: User = {
        ...currentUser,
        nickname: trimmedNickname,
        bio: trimmedBio,
      } as User;

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      setShowEditModal(false);
    } catch (err) {
      console.error('[v0] Profile save failed:', err);
      setSaveError('Saqlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setSaving(false);
    }
  };

  const displayBio = (displayUser as any).bio || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {isOwnProfile ? 'Mening Profilim' : `${displayUser.nickname}`}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {displayUser.email || 'Foydalanuvchi'}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <Pencil className="w-4 h-4" />
                <span>Tahrirlash</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ma'lumot</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Ism/Taxallus</p>
              <p className="text-base text-slate-900 mt-1">{displayUser.nickname}</p>
            </div>
            {displayBio && (
              <div>
                <p className="text-sm font-medium text-slate-600">Bio</p>
                <p className="text-base text-slate-900 mt-1">{displayBio}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Profilni tahrirlash</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Nickname Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ism/Taxallus
                    </label>
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      maxLength={40}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Sizning ism/taxallus"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {editNickname.length}/40
                    </p>
                  </div>

                  {/* Bio Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={BIO_MAX_LENGTH}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Sizning bio ma'lumoti..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {editBio.length}/{BIO_MAX_LENGTH}
                    </p>
                  </div>

                  {/* Error Message */}
                  {saveError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{saveError}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
