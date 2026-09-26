import React, { useState, useEffect } from "react";
import {
  FileCode,
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Code2,
  Sliders,
  UploadCloud,
  FileText,
  Eye,
  CheckCircle2,
  Layers,
  Smartphone,
  RefreshCw,
  FileType,
  X,
  FileCheck,
} from "lucide-react";
import {
  convertSvgToVectorXml,
  SvgToXmlOptions,
  SvgToXmlResult,
} from "../../services/svgToXmlConverter";

export const SvgToXmlTool: React.FC = () => {
  const [svgInputMode, setSvgInputMode] = useState<"upload" | "paste">("upload");
  const [rawSvgText, setRawSvgText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("ic_vector_drawable");
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: number } | null>(null);
  
  // Custom Options
  const [options, setOptions] = useState<SvgToXmlOptions>({
    widthDp: 24,
    heightDp: 24,
    tintColor: "",
    indentation: "2",
    vectorName: "ic_vector_drawable",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SvgToXmlResult | null>(null);
  const [activeCopiedKey, setActiveCopiedKey] = useState<string | null>(null);

  // Active Code Tab
  const [activeTab, setActiveTab] = useState<"xml" | "alight" | "compose" | "preview">("xml");

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#007aff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2L2 7l10 5 10-5-10-5z" />
  <path d="M2 17l10 5 10-5" />
  <path d="M2 12l10 5 10-5" />
</svg>`;

  const handleConvert = (textToConvert: string = rawSvgText, opts: SvgToXmlOptions = options) => {
    if (!textToConvert || !textToConvert.trim()) {
      setError("Silakan unggah atau tempelkan sintaks SVG/XML terlebih dahulu.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = convertSvgToVectorXml(textToConvert, opts);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Gagal mengonversi SVG menjadi Android VectorDrawable XML.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle File Upload (Accepts ANY SVG / XML / Text file from Mobile / Android)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sanitize filename for Android Vector XML name conventions (alphanumeric & underscores)
    let rawName = file.name || "ic_vector_drawable";
    const cleanName = rawName
      .replace(/\.(svg|xml|txt)$/i, "")
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .toLowerCase();

    const finalVectorName = cleanName ? (cleanName.startsWith("ic_") ? cleanName : `ic_${cleanName}`) : "ic_vector_drawable";

    setFileName(finalVectorName);
    setUploadedFileInfo({ name: file.name, size: file.size });

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && content.trim()) {
        setRawSvgText(content);
        const updatedOpts = { ...options, vectorName: finalVectorName };
        setOptions(updatedOpts);
        handleConvert(content, updatedOpts);
      } else {
        setError("Berkas yang dipilih kosong atau tidak memiliki isi teks.");
      }
    };
    reader.onerror = () => {
      setError("Gagal membaca berkas dari penyimpanan perangkat Anda.");
    };
    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setUploadedFileInfo(null);
    setRawSvgText("");
    setResult(null);
    setError(null);
  };

  const handleUseSample = () => {
    setUploadedFileInfo({ name: "sample_layers.svg", size: 340 });
    setRawSvgText(sampleSvg);
    setFileName("ic_layers_vector");
    const updatedOpts = { ...options, vectorName: "ic_layers_vector" };
    setOptions(updatedOpts);
    handleConvert(sampleSvg, updatedOpts);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setActiveCopiedKey(key);
    setTimeout(() => setActiveCopiedKey(null), 2000);
  };

  const handleDownloadXml = (formatType: "vector" | "alight" = "vector") => {
    if (!result) return;
    const codeToDownload = formatType === "alight" ? result.alightXmlCode : result.xmlCode;
    const finalFileName = formatType === "alight" 
      ? `${fileName || "alight_vector"}_preset.xml` 
      : `${fileName || "ic_vector_drawable"}.xml`;

    const blob = new Blob([codeToDownload], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", finalFileName);
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 300);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <FileCode className="w-4 h-4" />
          <span>Android VectorDrawable & Compose Generator</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          SVG to XML Vector Converter
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Konversi file gambar SVG atau kode markup SVG menjadi berkas Android `VectorDrawable` XML resmi (`res/drawable/ic_vector.xml`) & kode Jetpack Compose `ImageVector`.
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-[#2c2c2e] p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSvgInputMode("upload")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                svgInputMode === "upload"
                  ? "bg-[#007aff] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-black"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah Berkas SVG</span>
            </button>
            <button
              type="button"
              onClick={() => setSvgInputMode("paste")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                svgInputMode === "paste"
                  ? "bg-[#007aff] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-black"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Tempel Kode SVG</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleUseSample}
            className="text-xs text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" /> Gunakan Contoh Vektor SVG
          </button>
        </div>

        {/* Input Field: Upload vs Paste */}
        {svgInputMode === "upload" ? (
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#007aff] dark:hover:border-[#0a84ff] bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 text-center transition-all relative">
            <input
              type="file"
              accept=".svg,.xml,.txt,image/svg+xml,text/xml,application/xml,text/plain,*/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            {uploadedFileInfo ? (
              <div className="flex items-center justify-between gap-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left relative z-20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-black dark:text-white truncate">
                      {uploadedFileInfo.name}
                    </p>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Berkas Berhasil Dimuat ({formatFileSize(uploadedFileInfo.size)})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearFile}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Hapus / Ganti Berkas"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 bg-[#007aff]/10 text-[#007aff] rounded-2xl flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-black dark:text-white">
                  Klik atau Drag & Drop Berkas `.svg` di sini
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mendukung berkas SVG/XML dari Galeri HP, Figma, Illustrator, Canva, atau IconFinder.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={rawSvgText}
              onChange={(e) => {
                setRawSvgText(e.target.value);
                if (e.target.value.trim()) {
                  handleConvert(e.target.value);
                }
              }}
              placeholder="Tempelkan sintaks <svg>...</svg> di sini..."
              rows={6}
              className="w-full bg-white dark:bg-[#1c1c1e] p-3.5 rounded-xl border border-black/10 dark:border-white/10 font-mono text-xs text-black dark:text-white focus:outline-none focus:border-[#007aff] focus:ring-1 focus:ring-[#007aff] transition-all"
            />
          </div>
        )}

        {/* Android Customization Options */}
        <div className="p-4 bg-white dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Sliders className="w-4 h-4 text-[#007aff]" />
            <span>Pengaturan Kustomisasi VectorDrawable XML</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Vector Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Nama File XML:</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "_");
                  setFileName(val);
                  const newOpts = { ...options, vectorName: val };
                  setOptions(newOpts);
                  if (rawSvgText) handleConvert(rawSvgText, newOpts);
                }}
                className="w-full bg-slate-50 dark:bg-[#2c2c2e] px-3 py-2 rounded-lg border border-black/5 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-[#007aff]"
                placeholder="ic_vector_drawable"
              />
            </div>

            {/* Width DP */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Width Target (dp):</label>
              <input
                type="number"
                value={options.widthDp}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 24;
                  const newOpts = { ...options, widthDp: num };
                  setOptions(newOpts);
                  if (rawSvgText) handleConvert(rawSvgText, newOpts);
                }}
                className="w-full bg-slate-50 dark:bg-[#2c2c2e] px-3 py-2 rounded-lg border border-black/5 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-[#007aff]"
              />
            </div>

            {/* Height DP */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Height Target (dp):</label>
              <input
                type="number"
                value={options.heightDp}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 24;
                  const newOpts = { ...options, heightDp: num };
                  setOptions(newOpts);
                  if (rawSvgText) handleConvert(rawSvgText, newOpts);
                }}
                className="w-full bg-slate-50 dark:bg-[#2c2c2e] px-3 py-2 rounded-lg border border-black/5 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-[#007aff]"
              />
            </div>

            {/* Color Tint Override */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Override Warna Tint:</label>
              <select
                value={options.tintColor || ""}
                onChange={(e) => {
                  const newOpts = { ...options, tintColor: e.target.value };
                  setOptions(newOpts);
                  if (rawSvgText) handleConvert(rawSvgText, newOpts);
                }}
                className="w-full bg-slate-50 dark:bg-[#2c2c2e] px-3 py-2 rounded-lg border border-black/5 dark:border-white/10 font-mono text-xs focus:outline-none focus:border-[#007aff] cursor-pointer"
              >
                <option value="">(Warna Asli SVG)</option>
                <option value="#FFFFFF">Putih (#FFFFFF)</option>
                <option value="#000000">Hitam (#000000)</option>
                <option value="#007AFF">Biru Accent (#007AFF)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleConvert()}
            disabled={!rawSvgText || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#007aff] hover:bg-[#0062cc] active:scale-95 text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengonversi Sintaks SVG...</span>
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                <span>Konversi ke Android Vector XML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Konversi Gagal</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="space-y-5 pt-2 animate-ios-fade">
          {/* Header Metrics */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Android VectorDrawable XML Siap Paket</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {result.widthDp}dp × {result.heightDp}dp • Viewport: {result.viewportWidth} × {result.viewportHeight} • {result.pathCount} Path • {formatFileSize(result.fileSizeBytes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadXml("vector")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh {fileName || "ic_vector_drawable"}.xml</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(result.xmlCode, "xml-code")}
                className="px-3.5 py-2 bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3a3a3c] text-black dark:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-black/5 dark:border-white/10"
              >
                {activeCopiedKey === "xml-code" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Kode XML</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-2 bg-slate-100 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 text-xs font-medium">
            <div className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] p-1 rounded-lg border border-black/5 dark:border-white/10 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("xml")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "xml"
                    ? "bg-[#007aff] text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-black"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> Android Vector XML
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("alight")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "alight"
                    ? "bg-purple-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-black"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Alight Motion XML
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "compose"
                    ? "bg-[#007aff] text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-black"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Jetpack Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-[#007aff] text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-black"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Pratinjau Visual
              </button>
            </div>
          </div>

          {/* Compatibility Banner */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>
              <strong>Alight Motion & Android Compatible:</strong> Menggunakan deklarasi <code className="font-mono bg-emerald-500/20 px-1 py-0.5 rounded">&lt;?xml version="1.0" encoding="utf-8"?&gt;</code> & format warna ARGB 8-Digit (<code className="font-mono bg-emerald-500/20 px-1 py-0.5 rounded">#FF...</code>) 100% bebas error saat di-import.
            </span>
          </div>

          {/* Code Viewer / Preview Render */}
          {activeTab === "xml" ? (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" /> res/drawable/{fileName || "ic_vector_drawable"}.xml
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadXml("vector")}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .xml</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.xmlCode, "xml-box")}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {activeCopiedKey === "xml-box" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{activeCopiedKey === "xml-box" ? "Tersalin!" : "Salin"}</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={result.xmlCode}
                rows={14}
                className="w-full bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none resize-y"
              />
            </div>
          ) : activeTab === "alight" ? (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-purple-400 font-semibold flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> {fileName || "alight_vector"}_preset.xml (Alight Motion Format)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadXml("alight")}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Alight .xml</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.alightXmlCode, "alight-box")}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    {activeCopiedKey === "alight-box" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{activeCopiedKey === "alight-box" ? "Tersalin!" : "Salin"}</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={result.alightXmlCode}
                rows={14}
                className="w-full bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-purple-200 font-mono text-xs focus:outline-none resize-y"
              />
            </div>
          ) : activeTab === "compose" ? (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Jetpack Compose ImageVector (Kotlin)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(result.composeCode, "compose-box")}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {activeCopiedKey === "compose-box" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{activeCopiedKey === "compose-box" ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={result.composeCode}
                rows={12}
                className="w-full bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-amber-200 font-mono text-xs focus:outline-none resize-y"
              />
            </div>
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-[#1c1c1e] rounded-2xl border border-black/5 dark:border-white/10 space-y-4 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Render Pratinjau SVG Original vs Format Vector
              </span>

              <div className="w-48 h-48 mx-auto p-4 bg-white dark:bg-[#121214] rounded-2xl border border-black/10 dark:border-white/10 flex items-center justify-center shadow-xs">
                <div
                  dangerouslySetInnerHTML={{ __html: rawSvgText }}
                  className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
