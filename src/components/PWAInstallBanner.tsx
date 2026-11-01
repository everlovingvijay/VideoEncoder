import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, CheckCircle, Smartphone } from 'lucide-react';
import { HandBrakeLogo } from './HandBrakeLogo';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-transparent border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <HandBrakeLogo size={20} />
          <div className="min-w-0">
            <span className="font-bold text-white block truncate">
              Install HandBrake for Mobile & Offline Use
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              {isIOS
                ? 'Add to iPhone Home Screen for full-screen native transcoding'
                : 'Install as standalone Progressive Web App on Android, Mac, or PC'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          ) : isIOS ? (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Install on iOS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-200 font-medium rounded-lg border border-slate-700 text-[11px]"
            >
              <Smartphone className="w-3 h-3 text-amber-400" />
              <span>Add to Home Screen</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS & Mobile Web Installation Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandBrakeLogo size={24} />
                <h3 className="text-sm font-bold text-white">Add HandBrake to Home Screen</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-white/5">
                <Share2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">1. Tap the Share button</strong>
                  <p className="text-slate-400">At the bottom of Safari (iOS) or in Chrome menu (⋮).</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-white/5">
                <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">2. Select "Add to Home Screen"</strong>
                  <p className="text-slate-400">Scroll down the menu list and tap "Add to Home Screen".</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-white/5">
                <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">3. Launch as Native App</strong>
                  <p className="text-slate-400">Opens instantly full-screen without browser URL bars, works offline with hardware acceleration.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
