document.addEventListener('DOMContentLoaded', () => {
  /* кнопки */
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn  = document.getElementById('login-btn');
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Выйти';
  logoutBtn.className   = 'btn btn-secondary';
  logoutBtn.id          = 'logout-btn';

  /* ============ helpers ============ */
  const API = (url, opt = {}) =>
    fetch('http://localhost:4000' + url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opt
    });

  function showAuthUI(isAuth){
    if (isAuth){
      signupBtn.style.display = loginBtn.style.display = 'none';
      if (!document.getElementById('logout-btn'))
        document.querySelector('.hero__actions').append(logoutBtn);
    } else {
      signupBtn.style.display = loginBtn.style.display = '';
      logoutBtn.remove();
    }
  }

  /* сразу проверяем сессию */
  API('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(d => showAuthUI(!!d));

  logoutBtn.onclick = () => API('/api/auth/logout',{method:'POST'}).then(()=>showAuthUI(false));

  /* ----- модалка ----- */
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-content');
  const close   = () => { overlay.hidden=true; box.innerHTML=''; };
  overlay.addEventListener('click', e => (e.target===overlay||e.target.classList.contains('modal-close'))&&close());

  /* шаблоны */
  const signupHTML = `
    <h2>Регистрация</h2>
    <form id="reg-form">
      <label>Почта/Логин<br><input name="email" type="email" required></label>
      <label>Пароль<br><input name="pass1" type="password" minlength="6" required></label>
      <label>Повторить пароль<br><input name="pass2" type="password" minlength="6" required></label>
      <button class="btn btn-primary" style="width:100%;margin-top:18px">Создать аккаунт</button>
    </form>
    <hr style="margin:22px 0;border:none;border-top:1px solid rgba(255,255,255,.15)">
    <button id="g-reg" class="btn btn-google">
      <img src="assets/img/icons/google.svg" width="20" alt=""> Google
    </button>
  `;

  const loginHTML = `
    <h2>Вход</h2>
    <form id="login-form">
      <label>Почта/Логин<br><input name="email" type="email" required></label>
      <label style="margin-top:16px">Пароль<br><input name="password" type="password" required></label>
      <div style="display:flex;gap:12px;margin-top:22px">
        <button class="btn btn-primary" style="flex:1">Войти</button>
        <button id="g-log" type="button" class="btn btn-google" style="flex:1">
          <img src="assets/img/icons/google.svg" width="20" alt=""> Google
        </button>
      </div>
    </form>
    <a href="#" style="display:block;margin-top:14px;text-align:right;color:#b5c1c9;font-size:14px">
      Забыл пароль?
    </a>
  `;

  /* handlers */
  signupBtn.onclick = () => {
    overlay.hidden=false; box.innerHTML = signupHTML;

    document.getElementById('reg-form').onsubmit = e=>{
      e.preventDefault();
      const f = new FormData(e.target);
      if (f.get('pass1')!==f.get('pass2')) return alert('Пароли не совпадают');
      API('/api/auth/register',{
        method:'POST',
        body: JSON.stringify({ email:f.get('email'), password:f.get('pass1') })
      }).then(r=>r.ok?showAuthUI(true):r.json().then(a=>alert(a.msg))).finally(close);
    };

    document.getElementById('g-reg').onclick = googleFlow;
  };

  loginBtn.onclick = () => {
    overlay.hidden=false; box.innerHTML = loginHTML;

    document.getElementById('login-form').onsubmit = e=>{
      e.preventDefault();
      const f = new FormData(e.target);
      API('/api/auth/login',{
        method:'POST',
        body: JSON.stringify({ email:f.get('email'), password:f.get('password') })
      }).then(r=>r.ok?showAuthUI(true):alert('Неверные данные')).finally(close);
    };

    document.getElementById('g-log').onclick = googleFlow;
  };

  /* ---- Google Identity ---- */
  /* Подключаем скрипт только один раз */
  let googleScriptLoaded = false;
  function googleFlow(){
    if (!googleScriptLoaded){
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client'; document.body.append(s);
      googleScriptLoaded=true;
      s.onload = runFlow;  // подождём загрузки
    } else { runFlow(); }
  }
  function runFlow(){
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID',
      callback: ({credential}) => {
        API('/api/auth/google',{method:'POST',body:JSON.stringify({credential})})
          .then(()=>{ showAuthUI(true); close(); });
      }
    });
    google.accounts.id.prompt();   // откроет Google-окно
  }

});