import React, { useState } from 'react';
import { X, Download, Smartphone, PackageCheck, Copy, Check, FileArchive } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadPackageModal: React.FC<DownloadPackageModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadUrl = '/omnirate-currency-converter.zip';

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + downloadUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Download &amp; Install App</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Option 1: Direct ZIP Download */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <FileArchive className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">Project Source Code (.ZIP)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Complete, self-contained project package with all React components, configuration, styles, and currency data.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={downloadUrl}
                    download="omnirate-currency-converter.zip"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Project ZIP</span>
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Mobile Install (PWA) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">Install Directly on Phone (PWA)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Install this app on your phone's home screen. Runs full screen without browser bars, just like a native APK.
                </p>

                {isInstalled ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <Check className="w-4 h-4" />
                    <span>App is already installed on this device!</span>
                  </div>
                ) : isInstallable ? (
                  <div className="mt-3">
                    <button
                      onClick={install}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Install App Now</span>
                    </button>
                  </div>
                ) : isIOS ? (
                  <div className="mt-3 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-sky-400">On iPhone / iPad (Safari):</div>
                    <div>1. Tap the <strong>Share</strong> button at bottom of Safari.</div>
                    <div>2. Select <strong>Add to Home Screen</strong>.</div>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-sky-400">On Android (Chrome / Firefox):</div>
                    <div>1. Tap the browser menu (<strong>⋮</strong> three dots at top-right).</div>
                    <div>2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Option 3: Direct APK Generator (No PC needed) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Generate Standalone APK Directly</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                Direct Android APK
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Need a standalone <code className="text-emerald-400 font-mono">.apk</code> file right now without using a computer?
            </p>
            <div className="mt-3 space-y-2">
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg border border-slate-700 transition-colors shadow-sm"
              >
                <span>Generate APK at PWABuilder (Free)</span>
              </a>
              <p className="text-[11px] text-slate-500">
                Enter your app URL: <span className="text-slate-300 font-mono select-all">https://ais-pre-5avzovp5qqunkdhd4p2vwp-302709660214.europe-west2.run.app</span> and tap <strong>Package for Android</strong> to download an APK file directly to your phone.
              </p>
            </div>
          </div>

          {/* Option 4: Local APK Generation with Capacitor */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Compile APK Locally from ZIP
            </h4>
            <p className="text-xs text-slate-400 mb-2">
              If compiling via Android Studio:
            </p>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside font-sans">
              <li>Extract the downloaded ZIP package.</li>
              <li>
                Run: <code className="text-slate-200 font-mono bg-slate-900 px-1.5 py-0.5 rounded">npm install && npm run build</code>
              </li>
              <li>
                Add Android: <code className="text-slate-200 font-mono bg-slate-900 px-1.5 py-0.5 rounded">npx cap add android</code>
              </li>
              <li>
                In Android Studio: click <strong>Build &gt; Build APK(s)</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-500 flex justify-between items-center">
          <span className="font-mono">Package size: ~48 KB</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
