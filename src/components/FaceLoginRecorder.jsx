import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * FaceLoginRecorder.jsx
 * -----------------------------------------------------
 * - Captura de cámara con selección de dispositivo
 * - Overlay con bounding boxes y etiquetas
 * - Polling al endpoint /recognize (FastAPI)
 * - Callbacks: onLogin(payload) cuando el backend devuelve {login:{token,user}}
 *
 * Props
 *  - apiUrl: string                → URL del endpoint /recognize
 *  - send: { width, height, intervalMs, jpegQuality } (opcional)
 *  - onLogin: (payload) => void    → callback al recibir login (token + user)
 *  - className: string             → clases extra para wrapper externo
 */
export default function FaceLoginRecorder({
  apiUrl = "http://localhost:8000/recognize",
  send = { width: 320, height: 240, intervalMs: 300, jpegQuality: 0.6 },
  onLogin,
  className = "",
}) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Cámara no iniciada");
  const [fps, setFps] = useState(0);
  const [rt, setRt] = useState(0); // request time ms
  const [login, setLogin] = useState(null); // {token, user}
  const [results, setResults] = useState([]);

  const sendCfg = useMemo(() => ({
    width: send?.width ?? 320,
    height: send?.height ?? 240,
    intervalMs: send?.intervalMs ?? 300,
    jpegQuality: send?.jpegQuality ?? 0.6,
  }), [send]);

  // FPS simple (del ciclo de polling)
  useEffect(() => {
    let frames = 0; let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (now - last >= 1000) { setFps(frames); frames = 0; last = now; }
    }, 200);
    return () => clearInterval(id);
  }, []);

  async function listCameras() {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter(d => d.kind === "videoinput");
      setDevices(cams);
      if (!deviceId && cams[0]) setDeviceId(cams[0].deviceId);
    } catch (e) {
      console.error(e);
    }
  }

  async function startCamera() {
    try {
      if (streamRef.current) stopCamera();
      const constraints = deviceId ? { video: { deviceId: { exact: deviceId } }, audio: false }
                                   : { video: { width: 640, height: 480 }, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => (videoRef.current.onloadedmetadata = r));
        const w = videoRef.current.videoWidth || 640;
        const h = videoRef.current.videoHeight || 480;
        const canvas = overlayRef.current;
        if (canvas) { canvas.width = w; canvas.height = h; }
      }
      setStatus("Cámara lista");
      setRunning(true);
      await listCameras();
      startLoop();
    } catch (e) {
      console.error(e);
      setStatus("Permiso denegado o cámara no disponible");
    }
  }

  function stopCamera() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setRunning(false);
    setStatus("Detenido");
    const ctx = overlayRef.current?.getContext("2d");
    if (ctx && overlayRef.current) ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    setResults([]);
  }

  useEffect(() => { (async () => { try { await startCamera(); } catch {} })(); return () => stopCamera(); }, []);
  useEffect(() => { if (running) startCamera(); /* reinicia con nuevo dispositivo */ }, [deviceId]);

  function drawBoxes(res) {
    const canvas = overlayRef.current; const video = videoRef.current; if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = canvas.width / sendCfg.width;
    const sy = canvas.height / sendCfg.height;
    res.forEach(r => {
      const left = Math.round(r.left * sx);
      const top = Math.round(r.top * sy);
      const right = Math.round(r.right * sx);
      const bottom = Math.round(r.bottom * sy);
      const ok = r.name !== "Desconocido";
      ctx.lineWidth = 3;
      ctx.strokeStyle = ok ? "#22c55e" : "#ef4444"; // lime / red
      ctx.strokeRect(left, top, right - left, bottom - top);
      const label = `${r.name} ${(r.confidence * 100).toFixed(0)}%`;
      ctx.font = "14px ui-sans-serif, system-ui";
      const textW = ctx.measureText(label).width + 10;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(left, top - 22, textW, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, left + 5, top - 7);
    });
  }

  function startLoop() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      // Downscale + JPEG
      const tmp = document.createElement("canvas");
      tmp.width = sendCfg.width; tmp.height = sendCfg.height;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      tctx.drawImage(videoRef.current, 0, 0, sendCfg.width, sendCfg.height);
      const dataUrl = tmp.toDataURL("image/jpeg", sendCfg.jpegQuality);

      const t0 = performance.now();
      try {
        const res = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image_b64: dataUrl }) });
        const json = await res.json();
        const t1 = performance.now();
        setRt(Math.round(t1 - t0));
        const r = json?.results || [];
        setResults(r);
        drawBoxes(r);
        if (json?.login?.token && json?.login?.user) {
          setLogin(json.login);
          localStorage.setItem("token", json.login.token);
          localStorage.setItem("user", JSON.stringify(json.login.user));
          onLogin?.(json.login);
        }
      } catch (e) {
        console.error(e);
        setStatus("Error comunicando con API");
      }
    }, sendCfg.intervalMs);
  }

  const user = login?.user;

  return (
    <div className={`w-full text-slate-100 grid gap-4 ${className}`}>
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">{status}</div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-1 rounded-lg border border-slate-700/70">{fps} FPS</span>
          <span className="px-2 py-1 rounded-lg border border-slate-700/70">{rt} ms</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video + Overlay */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3">
          <div className="relative w-full rounded-xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto block rounded-xl" />
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full" />
          </div>
        </div>

        {/* Panel lateral */}
        <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-4 grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm text-slate-300">Cámara</label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {devices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId}>{d.label || `Cámara ${idx+1}`}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startCamera}
              className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-medium transition"
            >Iniciar</button>
            <button
              onClick={stopCamera}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium transition"
            >Detener</button>
          </div>

          {/* Detecciones recientes */}
          <div className="grid gap-2 text-xs">
            <div className="text-slate-400">Detecciones</div>
            <div className="max-h-32 overflow-auto rounded-xl border border-slate-700/60">
              {results.length === 0 ? (
                <div className="p-3 text-slate-500">Sin detecciones</div>
              ) : (
                <table className="w-full text-left text-slate-200/90">
                  <thead className="bg-slate-800/70 text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="px-3 py-2">Conf.</th>
                      <th className="px-3 py-2">Box</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 8).map((r, i) => (
                      <tr key={i} className="odd:bg-slate-900/40">
                        <td className="px-3 py-1">{r.name}</td>
                        <td className="px-3 py-1">{(r.confidence*100).toFixed(0)}%</td>
                        <td className="px-3 py-1">[{r.left},{r.top}]–[{r.right},{r.bottom}]</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Usuario logueado (si llega) */}
          {user && (
            <div className="mt-2 rounded-2xl border border-emerald-700/40 bg-emerald-500/10 p-3">
              <div className="text-sm text-emerald-300">Sesión reconocida: {user.username} · {user.rol}</div>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500">
        Envío ~{sendCfg.width}×{sendCfg.height} cada {sendCfg.intervalMs} ms · JPEG {sendCfg.jpegQuality} · {new URL(apiUrl).host}
      </div>
    </div>
  );
}
