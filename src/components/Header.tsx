/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LogOut, Menu, X, Award, ShieldAlert, User as UserIcon, HelpCircle, Trophy, Home, Bell, Crown } from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  currentUser: User | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Header({ currentUser, currentTab, setCurrentTab, onLogout }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = currentUser?.role === "admin"
    ? [
        { id: "admin", label: "Admin Panel", icon: ShieldAlert },
        { id: "profile", label: "Profil", icon: UserIcon },
        { id: "about", label: "Loyiha haqida", icon: HelpCircle },
      ]
    : [
        { id: "home", label: "Bosh sahifa", icon: Home },
        { id: "ranking", label: "Reyting", icon: Trophy },
        { id: "premium", label: "Premium Olish", icon: Crown },
        { id: "notifications", label: "Habarnomalar", icon: Bell },
        { id: "profile", label: "Profil", icon: UserIcon },
        { id: "about", label: "Loyiha haqida", icon: HelpCircle },
      ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => setCurrentTab("home")}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors font-display text-xl font-bold tracking-tight cursor-pointer"
            >
              <Award className="w-6 h-6 stroke-[2.5]" />
              <span>DTM MASTER</span>
            </button>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-primary-50 text-primary-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {currentUser && (
              <div className="flex items-center pl-4 border-l border-slate-200 ml-4 space-x-4">
                <div className="flex items-center space-x-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.nickname}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {currentUser.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-800">{currentUser.nickname}</span>
                </div>
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Chiqish"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-50 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center space-x-2 w-full px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {currentUser && (
            <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
              <div className="flex items-center space-x-3 px-4">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.nickname}
                    className="w-10 h-10 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                    {currentUser.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-800">{currentUser.nickname}</div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                </div>
              </div>
              <button
                id="mobile-logout-btn"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="flex items-center space-x-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-base font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Tizimdan chiqish</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
