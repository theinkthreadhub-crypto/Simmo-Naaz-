'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function OnboardingSequence() {
  const { user, profile, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.display_name || user?.user_metadata?.display_name || '');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [dailyTime, setDailyTime] = useState('1 Hour (Standard)');
  const [prioritizedModules, setPrioritizedModules] = useState<string[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const areasList = ['Business', 'Money', 'Learning', 'Fitness', 'Discipline', 'Communication', 'Organization'];
  const modulesList = ['Finance', 'Learning', 'Business', 'Journal', 'Tasks', 'AI Agents'];
  const timeOptions = ['30 Minutes', '1 Hour', '2 Hours', '4+ Hours'];

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleFinish = async () => {
    setIsFinalizing(true);
    await completeOnboarding(name || 'User', primaryGoal, selectedAreas);
    setIsFinalizing(false);
  };

  return (
    <main className="min-h-screen bg-[#090B0F] px-4 py-8 sm:px-6 flex items-center">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex items-end justify-between gap-5">
          <div>
            <div className="mentra-label">Setup · {step} / 5</div>
            <h1 className="mt-2 text-3xl sm:text-4xl uppercase">Build your system.</h1>
          </div>
          <div className="hidden sm:flex gap-1.5" aria-label={`Step ${step} of 5`}>
            {[1, 2, 3, 4, 5].map((item) => (
              <span
                key={item}
                className={`h-1.5 w-9 rounded-full ${item <= step ? 'bg-[#B7FF3C]' : 'bg-[#292F3B]'}`}
              />
            ))}
          </div>
        </div>

        <section className="rounded-[20px] border border-[#292F3B] bg-[#161A22] p-5 sm:p-8">
          {step === 1 && (
            <Step>
              <StepHeader title="What should MENTRA call you?" copy="This is how your dashboard and AI Mentor will address you." />
              <FieldLabel>Name</FieldLabel>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="min-h-12 w-full rounded-xl border border-[#292F3B] bg-[#10131A] px-4 text-sm focus:border-[#B7FF3C]/50 focus:outline-none"
              />
              <Next onClick={() => setStep(2)} disabled={!name.trim()} label="Continue" />
            </Step>
          )}

          {step === 2 && (
            <Step>
              <StepHeader title="What do you want to improve?" copy="Pick the areas you want MENTRA to help organize." />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {areasList.map((area) => {
                  const selected = selectedAreas.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => toggleItem(selectedAreas, setSelectedAreas, area)}
                      className={`min-h-14 rounded-xl border px-3 text-left text-sm flex items-center justify-between ${
                        selected
                          ? 'border-[#B7FF3C]/50 bg-[#B7FF3C]/10 text-[#F5F7FA]'
                          : 'border-[#292F3B] bg-[#10131A] text-[#A1A8B5]'
                      }`}
                    >
                      {area}
                      {selected && <Check className="h-4 w-4 text-[#B7FF3C]" />}
                    </button>
                  );
                })}
              </div>
              <NavButtons back={() => setStep(1)} next={() => setStep(3)} nextDisabled={selectedAreas.length === 0} />
            </Step>
          )}

          {step === 3 && (
            <Step>
              <StepHeader title="What matters most right now?" copy="Give MENTRA one current priority. You can change it anytime." />
              <FieldLabel>Current priority</FieldLabel>
              <textarea
                autoFocus
                rows={4}
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="Example: Launch my first profitable campaign."
                className="w-full resize-none rounded-xl border border-[#292F3B] bg-[#10131A] p-4 text-sm focus:border-[#B7FF3C]/50 focus:outline-none"
              />
              <NavButtons back={() => setStep(2)} next={() => setStep(4)} nextDisabled={!primaryGoal.trim()} />
            </Step>
          )}

          {step === 4 && (
            <Step>
              <StepHeader title="How much time can you give daily?" copy="This helps MENTRA keep plans realistic." />
              <div className="space-y-2">
                {timeOptions.map((option) => {
                  const selected = dailyTime === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setDailyTime(option)}
                      className={`min-h-14 w-full rounded-xl border px-4 text-left flex items-center justify-between ${
                        selected
                          ? 'border-[#B7FF3C]/50 bg-[#B7FF3C]/10'
                          : 'border-[#292F3B] bg-[#10131A]'
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-[#B7FF3C]" />
                        {option}
                      </span>
                      {selected && <Check className="h-4 w-4 text-[#B7FF3C]" />}
                    </button>
                  );
                })}
              </div>
              <NavButtons back={() => setStep(3)} next={() => setStep(5)} />
            </Step>
          )}

          {step === 5 && (
            <Step>
              <StepHeader title="What should stay close?" copy="Choose the modules you expect to use most. Nothing is locked." />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {modulesList.map((module) => {
                  const selected = prioritizedModules.includes(module);
                  return (
                    <button
                      key={module}
                      onClick={() => toggleItem(prioritizedModules, setPrioritizedModules, module)}
                      className={`min-h-14 rounded-xl border px-3 text-left text-sm flex items-center justify-between ${
                        selected
                          ? 'border-[#B7FF3C]/50 bg-[#B7FF3C]/10'
                          : 'border-[#292F3B] bg-[#10131A] text-[#A1A8B5]'
                      }`}
                    >
                      {module}
                      {selected && <Check className="h-4 w-4 text-[#B7FF3C]" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="mentra-secondary-button px-5 flex items-center gap-2 text-sm">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={isFinalizing}
                  className="mentra-primary-button flex-1 px-5 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isFinalizing ? 'Setting up...' : 'Enter MENTRA'}
                  {!isFinalizing && <Sparkles className="h-4 w-4" />}
                </button>
              </div>
            </Step>
          )}
        </section>

        <div className="mt-4 sm:hidden flex gap-1.5" aria-label={`Step ${step} of 5`}>
          {[1, 2, 3, 4, 5].map((item) => (
            <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-[#B7FF3C]' : 'bg-[#292F3B]'}`} />
          ))}
        </div>
      </div>
    </main>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 animate-in fade-in duration-300">{children}</div>;
}

function StepHeader({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl uppercase">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#A1A8B5]">{copy}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.12em] text-[#697181]">{children}</div>;
}

function Next({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="mentra-primary-button w-full px-5 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function NavButtons({ back, next, nextDisabled }: { back: () => void; next: () => void; nextDisabled?: boolean }) {
  return (
    <div className="flex gap-3">
      <button onClick={back} className="mentra-secondary-button px-5 flex items-center gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <button onClick={next} disabled={nextDisabled} className="mentra-primary-button flex-1 px-5 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
