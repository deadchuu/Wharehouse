:root{
  --bg:#edf5ff; --card:#fff; --accent:#4b64d6; --muted:#6b7280; --accent-2:#bda0ff;
  --success:#16a34a; --danger:#ef5b69;
}
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial}
body{background:var(--bg);color:#111}
.container{max-width:1100px;margin:24px auto;padding:16px}
.center-card{display:flex;align-items:center;justify-content:center;height:80vh}
.card{background:var(--card);border-radius:12px;padding:22px;box-shadow:0 8px 24px rgba(16,24,40,0.06);margin-bottom:16px}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:18px 24px}
.brand{font-weight:700;font-size:1.1rem;color:var(--accent)}
.logo{font-size:26px;margin-right:8px}
.btn{padding:10px 14px;border-radius:10px;border:0;background:var(--accent);color:#fff;cursor:pointer}
.btn.ghost{background:transparent;color:var(--accent);border:1px solid rgba(75,100,214,0.12)}
.btn.small{padding:6px 8px;font-size:0.9rem}
.btn.primary{background:var(--accent)}
.row-between{display:flex;justify-content:space-between;align-items:center}
.muted{color:var(--muted);font-size:0.95rem}
.grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.grid-2{display:grid;grid-template-columns:1fr 420px;gap:16px}
.action-card{display:flex;flex-direction:column;gap:10px;justify-content:space-between;min-height:140px}
.auth-card{width:420px;padding:28px;text-align:left}
.brand-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.form label{display:block;margin-bottom:12px;font-weight:500}
.form input{width:100%;padding:10px;border-radius:10px;border:1px solid #eef2ff}
.large-input{width:100%;padding:16px;border-radius:14px;border:2px solid rgba(0,0,0,0.06);font-size:1.05rem}
.big-card{padding:26px}
.scan-panel{display:flex;gap:12px;align-items:center;margin-top:10px}
.scan-actions{display:flex;flex-direction:column;gap:8px}
.barcode-area{margin-top:12px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.tabs{display:flex;gap:6px;margin-top:18px}
.tab{padding:8px 14px;border-radius:10px;background:#fff;border:1px solid rgba(16,24,40,0.04);cursor:pointer}
.tab.active{background:linear-gradient(90deg,var(--accent-2),#fff);border-color:rgba(75,100,214,0.18)}
.tab-content{margin-top:14px}
.hidden{display:none}
.list{list-style:none;padding:0;margin:0}
.list li{padding:12px;border-bottom:1px dashed #eee;display:flex;justify-content:space-between;align-items:center}
.controls{display:flex;gap:8px;align-items:center;margin-top:8px}
.history-controls{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-bottom:8px}
input[type=file]{padding:6px}
