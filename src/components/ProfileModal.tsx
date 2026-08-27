'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, UserRound, Loader2, IdCard, ShieldCheck, AlertCircle, Trash2, Check, LogIn, MapPin
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getTranslation } from '@/lib/translations';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { processDocumentFile } from '@/lib/ocr';
import { extractAadhaar, looksLikeAadhaarCard, type AadhaarExtraction } from '@/lib/aadhaar/aadhaar';
import { parseIndianPhone, formatIndianPhoneInput } from '@/lib/auth/phone';
import { IdentityCheck } from './IdentityCheck';

type AadhaarError = 'aadhaarNotACard' | 'aadhaarChecksumFailed' | 'aadhaarNotFound';

/**
 * Profile: who the citizen is, and whether this document says so.
 *
 * The fields are the ones a deed, a 7/12 extract or a scheme application
 * actually asks for — full name, father or spouse name, date of birth, and a
 * real address. "Son/wife of" is there because Indian records identify a person
 * that way, and matching a party line often turns on it.
 *
 * The Aadhaar half is read by the OCR that already runs in the browser. The
 * image is never uploaded and the full number never leaves `extractAadhaar`;
 * only the last four digits and the printed name are stored.
 */
export const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { language, currentAnalysis } = useApp();
  const { user, profile, refreshProfile, openAuthModal } = useAuth();

  // Seeded once, at mount: the parent mounts this only while it is open.
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [fatherSpouse, setFatherSpouse] = useState(profile?.father_or_spouse_name ?? '');
  const [dob, setDob] = useState(profile?.date_of_birth ?? '');
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [phone, setPhone] = useState(
    profile?.phone ? formatIndianPhoneInput(profile.phone.replace(/^\+91/, '')) : ''
  );
  const [addressLine, setAddressLine] = useState(profile?.address_line ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [district, setDistrict] = useState(profile?.district ?? '');
  const [state, setState] = useState(profile?.state ?? '');
  const [pincode, setPincode] = useState(profile?.pincode ?? '');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [reading, setReading] = useState(false);
  const [aadhaarError, setAadhaarError] = useState<AadhaarError | null>(null);
  const [justRead, setJustRead] = useState<AadhaarExtraction | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => getTranslation(key, language);

  const handleClose = useCallback(() => {
    setJustRead(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  /* ---------------- Aadhaar ---------------- */

  const readAadhaar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAadhaarError(null);
    setJustRead(null);
    setReading(true);

    try {
      // Runs entirely in the browser; the image is never sent anywhere.
      const extraction = await processDocumentFile(file);

      if (!looksLikeAadhaarCard(extraction.text)) {
        setAadhaarError('aadhaarNotACard');
        return;
      }
      const result = extractAadhaar(extraction.text);
      if (!result.found) {
        setAadhaarError(result.checksumFailed ? 'aadhaarChecksumFailed' : 'aadhaarNotFound');
        return;
      }

      setJustRead(result);
      // Offer the card's spelling where the citizen has not typed their own —
      // it is the spelling a registrar will compare against.
      if (result.name && !displayName.trim()) setDisplayName(result.name);
      if (result.dob && !dob) {
        const m = result.dob.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
        if (m) setDob(`${m[3]}-${m[2]}-${m[1]}`);
      }
      if (result.gender && !gender) setGender(result.gender);

      const supabase = getSupabaseBrowserClient();
      if (supabase && user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            aadhaar_last4: result.last4,
            aadhaar_name: result.name ?? null,
            aadhaar_verified_at: new Date().toISOString()
          })
          .eq('id', user.id);
        if (error) setSaveError(t('profileSaveFailed'));
        else await refreshProfile();
      }
    } catch (err) {
      console.warn('[profile] aadhaar read failed:', err);
      setAadhaarError('aadhaarNotFound');
    } finally {
      setReading(false);
    }
  };

  const removeAadhaar = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    await supabase
      .from('profiles')
      .update({ aadhaar_last4: null, aadhaar_name: null, aadhaar_verified_at: null })
      .eq('id', user.id);
    setJustRead(null);
    await refreshProfile();
  };

  /* ---------------- Save ---------------- */

  const save = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;

    if (pincode.trim() && !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setSaveError(t('profileInvalidPincode'));
      return;
    }
    const parsedPhone = phone.trim() ? parseIndianPhone(phone) : null;
    if (parsedPhone && !parsedPhone.ok) {
      setSaveError(t('authErrorInvalidPhone') || t('profileSaveFailed'));
      return;
    }

    setSaving(true);
    setSaved(false);
    setSaveError(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        father_or_spouse_name: fatherSpouse.trim() || null,
        date_of_birth: dob || null,
        gender: gender || null,
        phone: parsedPhone?.e164 ?? null,
        address_line: addressLine.trim() || null,
        city: city.trim() || null,
        district: district.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        preferred_language: language,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      console.warn('[profile] save failed:', error.message);
      setSaveError(t('profileSaveFailed'));
      return;
    }
    setSaved(true);
    await refreshProfile();
  };

  const aadhaarLast4 = profile?.aadhaar_last4 ?? justRead?.last4;
  const aadhaarName = profile?.aadhaar_name ?? justRead?.name;
  const nameForIdentity = aadhaarName || profile?.display_name || displayName;

  const field = (
    id: string,
    label: string,
    value: string,
    setter: (v: string) => void,
    opts: { placeholder?: string; type?: string; inputMode?: 'text' | 'numeric'; maxLength?: number } = {}
  ) => (
    <div>
      <label htmlFor={id} className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input
        id={id}
        type={opts.type ?? 'text'}
        inputMode={opts.inputMode}
        maxLength={opts.maxLength}
        value={value}
        placeholder={opts.placeholder}
        onChange={(ev) => {
          setter(ev.target.value);
          setSaved(false);
          setSaveError(null);
        }}
        className="w-full px-3.5 py-2.5 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-emerald-950 outline-none transition-colors"
      />
    </div>
  );

  return (
    // The scroll lives on the backdrop, not on the panel. With the panel
    // scrolling instead, a tall profile form centred in a short viewport pushed
    // its own header above the top of the screen with no way to reach it.
    <div
      className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-sm overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={handleClose}
    >
            {/* items-start, never items-center: a panel taller than the viewport
          centred in it overflows in BOTH directions, putting its own header
          above the top of the screen where nothing can scroll to it. */}
      <div className="min-h-full flex items-start justify-center p-0 sm:py-10 sm:px-6">
        <div
          className="bg-white w-full sm:max-w-lg rounded-none sm:rounded-3xl shadow-2xl border-2 border-emerald-500"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 p-5 sm:p-6 pb-4 border-b border-emerald-50 bg-white rounded-t-none sm:rounded-t-3xl">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <UserRound className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 id="profile-modal-title" className="text-lg font-black text-emerald-950 leading-tight">
                  {t('profileTitle')}
                </h2>
                <p className="text-[11px] text-gray-600 font-medium mt-0.5">{t('profileSubtitle')}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label={t('closeLabel')}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!user ? (
            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                {t('profileSignInRequired')}
              </p>
              <button
                onClick={() => {
                  handleClose();
                  openAuthModal();
                }}
                className="w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {t('signIn')}
              </button>
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-6">
              {/* ---- Identity ---- */}
              <section className="space-y-3">
                <h3 className="text-sm font-black text-emerald-950">{t('profileSectionIdentity')}</h3>
                {field('profile-name', t('displayNameLabel'), displayName, setDisplayName, {
                  placeholder: t('displayNamePlaceholder')
                })}
                {field('profile-father', t('fatherSpouseLabel'), fatherSpouse, setFatherSpouse, {
                  placeholder: t('fatherSpousePlaceholder')
                })}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {field('profile-dob', t('dobLabel'), dob, setDob, { type: 'date' })}
                  <div>
                    <label
                      htmlFor="profile-gender"
                      className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-1"
                    >
                      {t('genderLabel')}
                    </label>
                    <select
                      id="profile-gender"
                      value={gender}
                      onChange={(e) => {
                        setGender(e.target.value);
                        setSaved(false);
                      }}
                      className="w-full px-3.5 py-2.5 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-emerald-950 outline-none bg-white"
                    >
                      <option value="">—</option>
                      <option value="Male">{t('genderMale')}</option>
                      <option value="Female">{t('genderFemale')}</option>
                      <option value="Other">{t('genderOther')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="profile-phone"
                    className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-1"
                  >
                    {t('phoneOptionalLabel')}
                  </label>
                  <div className="flex items-stretch gap-2">
                    <span className="px-3 flex items-center bg-emerald-50 border-2 border-emerald-200 rounded-xl text-sm font-black text-emerald-800">
                      +91
                    </span>
                    <input
                      id="profile-phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        setPhone(formatIndianPhoneInput(e.target.value));
                        setSaved(false);
                        setSaveError(null);
                      }}
                      className="flex-1 min-w-0 px-3.5 py-2.5 border-2 border-emerald-200 focus:border-emerald-600 rounded-xl text-sm font-semibold text-emerald-950 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* ---- Address ---- */}
              <section className="space-y-3 pt-5 border-t border-emerald-100">
                <h3 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {t('profileSectionAddress')}
                </h3>
                {field('profile-address', t('addressLabel'), addressLine, setAddressLine, {
                  placeholder: t('addressPlaceholder')
                })}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {field('profile-city', t('cityLabel'), city, setCity)}
                  {field('profile-district', t('districtLabel'), district, setDistrict)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {field('profile-state', t('stateLabel'), state, setState)}
                  {field('profile-pincode', t('pincodeLabel'), pincode, setPincode, {
                    inputMode: 'numeric',
                    maxLength: 6
                  })}
                </div>
              </section>

              {saveError && (
                <p role="alert" className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl p-3">
                  {saveError}
                </p>
              )}

              <button
                onClick={save}
                disabled={saving}
                className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saved && !saving && <Check className="w-4 h-4" />}
                {saving ? t('savingProfile') : saved ? t('profileSaved') : t('saveProfile')}
              </button>

              {/* ---- Aadhaar ---- */}
              <section className="pt-5 border-t border-emerald-100">
                <h3 className="text-sm font-black text-emerald-950 flex items-center gap-1.5 mb-1.5">
                  <IdCard className="w-4 h-4 text-emerald-600" />
                  {t('aadhaarSectionTitle')}
                </h3>
                <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 rounded-xl p-3 leading-relaxed mb-3">
                  {t('aadhaarPrivacyNote')}
                </p>

                <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={readAadhaar} className="hidden" />

                {aadhaarLast4 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t('aadhaarVerifiedLabel')}
                    </div>
                    {aadhaarName && (
                      <p className="text-sm">
                        <span className="font-bold text-slate-600">{t('aadhaarNameLabel')}: </span>
                        <span className="font-black text-emerald-950">{aadhaarName}</span>
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-bold text-slate-600">{t('aadhaarLast4Label')}: </span>
                      <span className="font-black text-emerald-950 tracking-widest">•••• •••• {aadhaarLast4}</span>
                    </p>
                    <button
                      onClick={removeAadhaar}
                      className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 pt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('removeAadhaar')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={reading}
                    className="w-full px-5 py-3 bg-white border-2 border-emerald-300 hover:bg-emerald-50 disabled:opacity-60 text-emerald-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <IdCard className="w-4 h-4" />}
                    {reading ? t('aadhaarExtracting') : t('uploadAadhaar')}
                  </button>
                )}

                {aadhaarError && (
                  <div role="alert" className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-900 leading-relaxed">{t(aadhaarError)}</p>
                  </div>
                )}
              </section>

              {currentAnalysis && (
                <section className="pt-5 border-t border-emerald-100">
                  <IdentityCheck checkedName={nameForIdentity} />
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
