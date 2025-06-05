// Supabase Konfiguration (ERSETZE DIES MIT DEINEN WERTEN!)
const SUPABASE_URL = 'https://pnnhqywypgmghxaepfad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubmhxeXd5cGdtZ2h4YWVwZmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzcxMjYsImV4cCI6MjA2NDcxMzEyNn0.JIdab6jvS37y_IeMqDnwj7PSvr8Os3qpscAGyfo0bzM';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM-Elemente

const authSection = document.getElementById('auth-section');
const backendSection = document.getElementById('backend-section');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const authMessage = document.getElementById('auth-message');
const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const addEditForm = document.getElementById('add-edit-form');
const terminIdInput = document.getElementById('termin-id');
const terminTitelInput = document.getElementById('termin-titel');
const terminDatumInput = document.getElementById('termin-datum');
const terminZeitInput = document.getElementById('termin-zeit');
const terminBeschreibungInput = document.getElementById('termin-beschreibung');
const termineListe = document.getElementById('termine-liste');
const cancelEditButton = document.getElementById('cancel-edit');

// Funktion zum Anzeigen/Ausblenden der Bereiche
async function checkAuthStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        authSection.style.display = 'none';
        backendSection.style.display = 'block';
        userEmailSpan.textContent = user.email;
        loadTermine(); // Lade Termine, sobald der Benutzer angemeldet ist
    } else {
        authSection.style.display = 'block';
        backendSection.style.display = 'none';
    }
}

// Anmeldefunktion
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        authMessage.textContent = error.message;
    } else {
        authMessage.textContent = '';
        checkAuthStatus();
    }
});

// Registrierungsfunktion
signupButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        authMessage.textContent = error.message;
    } else {
        authMessage.textContent = 'Registrierung erfolgreich! Bitte E-Mail bestätigen (falls E-Mail-Bestätigung in Supabase aktiviert ist).';
        checkAuthStatus(); // Versuch trotzdem, den Benutzer anzumelden
    }
});

// Abmeldefunktion
logoutButton.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Fehler beim Abmelden:', error.message);
    } else {
        checkAuthStatus();
        termineListe.innerHTML = ''; // Leere die Liste nach dem Abmelden
    }
});

// Termine laden
async function loadTermine() {
    const { data: termine, error } = await supabase
        .from('termine')
        .select('*')
        .order('datum', { ascending: true })
        .order('zeit', { ascending: true });

    if (error) {
        console.error('Fehler beim Laden der Termine:', error.message);
        return;
    }

    termineListe.innerHTML = ''; // Liste leeren
    termine.forEach(termin => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${termin.datum} ${termin.zeit} - <span class="math-inline">\{termin\.titel\}</span\>
<div>
<button onclick="editTermin({termin.id})">Bearbeiten</button>
<button onclick="deleteTermin(${termin.id})">Löschen</button>
</div>
`;
termineListe.appendChild(li);
});
}

// Termin speichern (Hinzufügen oder Bearbeiten)
addEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titel = terminTitelInput.value;
    const datum = terminDatumInput.value;
    const zeit = terminZeitInput.value;
    const beschreibung = terminBeschreibungInput.value;
    const terminId = terminIdInput.value;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Sie müssen angemeldet sein, um Termine zu speichern.');
        return;
    }
    const ersteller_id = user.id; // WICHTIG: Die ID des angemeldeten Benutzers

    if (terminId) { // Bearbeiten
        const { error } = await supabase
            .from('termine')
            .update({ titel, datum, zeit, beschreibung })
            .eq('id', terminId); // Nur den Termin mit dieser ID aktualisieren

        if (error) {
            console.error('Fehler beim Aktualisieren des Termins:', error.message);
        } else {
            alert('Termin erfolgreich aktualisiert!');
            resetForm();
            loadTermine();
        }
    } else { // Hinzufügen
        const { error } = await supabase
            .from('termine')
            .insert([{ titel, datum, zeit, beschreibung, ersteller_id }]); // ersteller_id hier mitgeben!

        if (error) {
            console.error('Fehler beim Hinzufügen des Termins:', error.message);
        } else {
            alert('Termin erfolgreich hinzugefügt!');
            resetForm();
            loadTermine();
        }
    }
});

// Formular zurücksetzen
function resetForm() {
    addEditForm.reset();
    terminIdInput.value = '';
    cancelEditButton.style.display = 'none';
}

cancelEditButton.addEventListener('click', resetForm);

// Termin bearbeiten (Formular füllen)
async function editTermin(id) {
    const { data: termin, error } = await supabase
        .from('termine')
        .select('*')
        .eq('id', id)
        .single(); // Nur einen Datensatz erwarten

    if (error) {
        console.error('Fehler beim Laden des Termins zum Bearbeiten:', error.message);
        return;
    }

    terminIdInput.value = termin.id;
    terminTitelInput.value = termin.titel;
    terminDatumInput.value = termin.datum;
    terminZeitInput.value = termin.zeit;
    terminBeschreibungInput.value = termin.beschreibung;
    cancelEditButton.style.display = 'inline-block'; // Abbrechen-Button anzeigen
}

// Termin löschen
async function deleteTermin(id) {
    if (!confirm('Sicher, dass du diesen Termin löschen möchtest?')) {
        return;
    }

    const { error } = await supabase
        .from('termine')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Fehler beim Löschen des Termins:', error.message);
    } else {
        alert('Termin erfolgreich gelöscht!');
        loadTermine(); // Liste neu laden
    }
}

// Initialen Status prüfen, wenn die Seite geladen wird
checkAuthStatus();