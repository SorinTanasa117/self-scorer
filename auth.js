// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// --- IMPORTANT ---
// For a production environment, ensure you have set up Firestore Security Rules
// to restrict data access. Users should only be able to read/write their own data.
// Example Rule:
// match /users/{userId}/{documents=**} {
//   allow read, write: if request.auth.uid == userId;
// }
// ---------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Authentication ---
const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
        });
        return { user };
    } catch (error) {
        return { error };
    }
};

const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user };
    } catch (error) {
        return { error };
    }
};

const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { error };
    }
};

const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// --- Firestore Database ---
const getCurrentUser = () => {
    return auth.currentUser;
};

const addPositive = async (positive) => {
    const user = getCurrentUser();
    if (!user) return { error: 'User not logged in' };
    const docRef = await addDoc(collection(db, "users", user.uid, "positives"), positive);
    return { id: docRef.id };
};

const getAllPositives = async () => {
    const user = getCurrentUser();
    if (!user) return [];
    const querySnapshot = await getDocs(collection(db, "users", user.uid, "positives"));
    const positives = [];
    querySnapshot.forEach((doc) => {
        positives.push({ id: doc.id, ...doc.data() });
    });
    return positives;
};

const getPositiveById = async (id) => {
    const user = getCurrentUser();
    if (!user) return null;
    const docRef = doc(db, "users", user.uid, "positives", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

const getPositivesByDate = async (dateStr) => {
    const user = getCurrentUser();
    if (!user) return [];
    const q = query(collection(db, "users", user.uid, "positives"), where("date", "==", dateStr));
    const querySnapshot = await getDocs(q);
    const positives = [];
    querySnapshot.forEach((doc) => {
        positives.push({ id: doc.id, ...doc.data() });
    });
    return positives;
};

const getPositivesByDateRange = async (startDate, endDate) => {
    const user = getCurrentUser();
    if (!user) return [];
    const q = query(collection(db, "users", user.uid, "positives"), where("date", ">=", startDate), where("date", "<=", endDate));
    const querySnapshot = await getDocs(q);
    const positives = [];
    querySnapshot.forEach((doc) => {
        positives.push({ id: doc.id, ...doc.data() });
    });
    return positives;
};

const updatePositive = async (positive) => {
    const user = getCurrentUser();
    if (!user) return;
    const { id, ...data } = positive;
    const docRef = doc(db, "users", user.uid, "positives", id);
    await updateDoc(docRef, data);
};

const deletePositive = async (id) => {
    const user = getCurrentUser();
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "positives", id));
};

const addCustomTemplate = async (template) => {
    const user = getCurrentUser();
    if (!user) return { error: 'User not logged in' };
    const docRef = await addDoc(collection(db, "users", user.uid, "custom_templates"), template);
    return { id: docRef.id };
};

const getAllCustomTemplates = async () => {
    const user = getCurrentUser();
    if (!user) return [];
    const querySnapshot = await getDocs(collection(db, "users", user.uid, "custom_templates"));
    const templates = [];
    querySnapshot.forEach((doc) => {
        templates.push({ id: doc.id, ...doc.data() });
    });
    return templates;
};

const getCustomTemplateByName = async (name) => {
    const user = getCurrentUser();
    if (!user) return null;
    const q = query(collection(db, "users", user.uid, "custom_templates"), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    return null;
};

const updateCustomTemplate = async (template) => {
    const user = getCurrentUser();
    if (!user) return;
    const { id, ...data } = template;
    const docRef = doc(db, "users", user.uid, "custom_templates", id);
    await updateDoc(docRef, data);
};

const deleteCustomTemplate = async (id) => {
    const user = getCurrentUser();
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "custom_templates", id));
};

export {
    auth,
    db,
    registerUser,
    loginUser,
    logoutUser,
    onAuthStateChange,
    getCurrentUser,
    addPositive,
    getAllPositives,
    getPositiveById,
    getPositivesByDate,
    getPositivesByDateRange,
    updatePositive,
    deletePositive,
    addCustomTemplate,
    getAllCustomTemplates,
    getCustomTemplateByName,
    updateCustomTemplate,
    deleteCustomTemplate,
};
