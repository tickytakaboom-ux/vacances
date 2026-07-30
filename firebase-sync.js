import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuQZUhTfJhpf33JioWKdrgp8YwuY18e2Y",
  authDomain: "vacances-73619.firebaseapp.com",
  projectId: "vacances-73619",
  storageBucket: "vacances-73619.firebasestorage.app",
  messagingSenderId: "861120662557",
  appId: "1:861120662557:web:b4e7ecf6257c5734530af4",
  measurementId: "G-TZ4QFX9QHK"
};

const status = document.querySelector("#syncStatus");
const statusText = status.querySelector("span");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const tripRef = doc(db, "trips", "embrun-2027");
let user = null;
let saveTimer = null;
let pendingData = null;

function setStatus(label, state = "") {
  statusText.textContent = label;
  status.classList.remove("online", "error");
  if (state) status.classList.add(state);
  status.title = label;
}

async function writeSharedData(content) {
  if (!user) {
    pendingData = content;
    setStatus("En attente de connexion");
    return;
  }
  setStatus("Synchronisation…");
  try {
    await setDoc(tripRef, {
      content,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid
    });
    setStatus("Synchronisé", "online");
  } catch (error) {
    console.error("Firebase save failed", error);
    pendingData = content;
    setStatus("Sauvegardé localement", "error");
  }
}

window.saveSharedTrip = content => {
  pendingData = structuredClone(content);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const queued = pendingData;
    pendingData = null;
    writeSharedData(queued);
  }, 450);
};

async function connect() {
  try {
    setStatus("Connexion…");
    const credential = await signInAnonymously(auth);
    user = credential.user;
    onSnapshot(tripRef, async snapshot => {
      if (snapshot.exists()) {
        const remote = snapshot.data().content;
        if (remote) window.dispatchEvent(new CustomEvent("shared-trip-data", { detail: remote }));
        setStatus(snapshot.metadata.hasPendingWrites ? "Synchronisation…" : "Synchronisé", snapshot.metadata.hasPendingWrites ? "" : "online");
      } else {
        await writeSharedData(window.getTripData());
      }
    }, error => {
      console.error("Firebase listener failed", error);
      setStatus("Mode local", "error");
    });
    if (pendingData) {
      const queued = pendingData;
      pendingData = null;
      await writeSharedData(queued);
    }
  } catch (error) {
    console.error("Firebase connection failed", error);
    setStatus("Mode local", "error");
  }
}

connect();
