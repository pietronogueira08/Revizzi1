document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const authBtn = document.getElementById('auth-btn');
    const authOverlay = document.getElementById('auth-overlay');
    const authDrawer = document.getElementById('auth-drawer');
    const authCloseBtn = document.getElementById('auth-close-btn');
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const profileView = document.getElementById('profile-view');
    const authTabs = document.getElementById('auth-tabs');
    const authTitle = document.getElementById('auth-title');

    // Forms & Buttons
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnLogout = document.getElementById('btn-logout');

    let currentUser = null;

    // --- Modal Toggles ---
    function openAuthModal() {
        authOverlay.classList.add('open');
        authDrawer.classList.add('open');
        checkSession();
    }

    function closeAuthModal() {
        authOverlay.classList.remove('open');
        authDrawer.classList.remove('open');
    }

    if (authBtn) authBtn.addEventListener('click', openAuthModal);
    if (authCloseBtn) authCloseBtn.addEventListener('click', closeAuthModal);
    if (authOverlay) authOverlay.addEventListener('click', closeAuthModal);

    // --- Tab Toggles ---
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.replace('text-on-surface-variant', 'text-primary');
        tabLogin.classList.add('font-bold');
        tabRegister.classList.replace('text-primary', 'text-on-surface-variant');
        tabRegister.classList.remove('font-bold');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTitle.innerText = "Login";
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.replace('text-on-surface-variant', 'text-primary');
        tabRegister.classList.add('font-bold');
        tabLogin.classList.replace('text-primary', 'text-on-surface-variant');
        tabLogin.classList.remove('font-bold');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        authTitle.innerText = "Cadastrar";
    });

    // --- Supabase Auth Logic ---
    async function checkSession() {
        if (typeof supabaseClient === 'undefined') return;
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            showProfileView();
        } else {
            currentUser = null;
            showLoginView();
        }
    }

    function showProfileView() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        authTabs.classList.add('hidden');
        profileView.classList.remove('hidden');
        authTitle.innerText = "Minha Conta";

        // Set user data
        const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        document.getElementById('profile-name').innerText = name;
        document.getElementById('profile-email-disp').innerText = currentUser.email;
        document.getElementById('profile-phone-disp').innerText = currentUser.user_metadata?.phone || 'Telefone não cadastrado';
    }

    function showLoginView() {
        profileView.classList.add('hidden');
        authTabs.classList.remove('hidden');
        tabLogin.click();
    }

    // Login with Email/Password
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = loginForm.querySelector('button[type="submit"]');
        
        btn.innerText = "Entrando...";
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        btn.innerText = "Entrar";

        if (error) {
            alert("Erro ao entrar: " + error.message);
        } else {
            checkSession();
        }
    });

    // Register with Email/Password
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const phone = document.getElementById('reg-phone').value;
        const btn = registerForm.querySelector('button[type="submit"]');
        
        btn.innerText = "Criando...";
        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: name,
                    phone: phone
                }
            }
        });
        btn.innerText = "Criar Conta";

        if (error) {
            alert("Erro ao cadastrar: " + error.message);
        } else {
            alert("Cadastro realizado com sucesso! Você já pode fazer login.");
            tabLogin.click();
        }
    });

    // Google Login
    btnGoogleLogin.addEventListener('click', async () => {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) {
            alert("Erro no Google Login: " + error.message);
        }
    });

    // Logout
    btnLogout.addEventListener('click', async () => {
        btnLogout.innerText = "Saindo...";
        const { error } = await supabaseClient.auth.signOut();
        btnLogout.innerText = "Sair da Conta";
        if (error) {
            alert("Erro ao sair: " + error.message);
        } else {
            checkSession();
        }
    });

    // Check session on load
    checkSession();
});

// Export getCurrentUser function for checkout usage
window.getCurrentAuthUser = async function() {
    if (typeof supabaseClient === 'undefined') return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session ? session.user : null;
};
